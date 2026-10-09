import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import {
  MODES,
  SOCKET_FOR_SLOT,
  type MechBuild,
  type MechMode,
  type PartManifest,
  type Slot,
} from "./schemas.ts";
import { PARTS_BASE, partModelUrl, type PartRegistry } from "./parts.ts";

/**
 * MechViewer — the live 3D preview for the Mecha Bay customizer.
 *
 * Mounting follows the part-system contract (schemas.ts):
 * - the active mode's torso GLB is the hierarchy root; it carries the
 *   named socket empties (socket_head, socket_arm_l/r, ...).
 * - single-socket parts (head, backpack) parent to their socket at (0,0,0).
 * - paired parts (arms, legs, shoulders) parent to the mech root at the
 *   midpoint of their _l / _r socket positions (the GLB carries both
 *   halves, authored around that midpoint).
 * - the weapon parents to the arms part's `socket_weapon_r`, falling back
 *   to the torso's `socket_arm_r`.
 * - every part GLB's origin IS its attach point.
 *
 * Missing/unloadable GLBs render as labeled placeholder boxes so the
 * customizer never hard-fails on a bad part (real parts render real).
 */
export class MechViewer {
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private controls: OrbitControls;
  private loader = new GLTFLoader();
  private raf = 0;
  private clock = new THREE.Clock();
  private resizeObs: ResizeObserver | null = null;

  private registry: PartRegistry | null = null;
  private build: MechBuild | null = null;
  private mode: MechMode = "racer";

  /** Root the whole mech hangs under (transform anim moves this). */
  private mechRoot = new THREE.Group();
  /** Per-slot mounted part groups for the CURRENT mode. */
  private mounted = new Map<Slot, THREE.Group>();
  /** Loaded part scenes, keyed by part id (shared across modes). */
  private partCache = new Map<string, THREE.Group>();
  private loadToken = 0;

  /** Transform animation state, processed in the render loop. */
  private tx: { t: number; dur: number; next: MechMode; swapped: boolean } | null = null;
  private flash: THREE.Mesh | null = null;
  private flashLight: THREE.PointLight | null = null;

  constructor(private canvas: HTMLCanvasElement) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color("#101311");
    this.scene.fog = new THREE.Fog("#101311", 14, 30);

    this.camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
    this.camera.position.set(4.4, 3.0, 5.4);

    this.controls = new OrbitControls(this.camera, canvas);
    this.controls.target.set(0, 1.9, 0);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.minDistance = 2.5;
    this.controls.maxDistance = 14;
    this.controls.maxPolarAngle = Math.PI * 0.52;
    this.controls.enablePan = false;
    this.controls.autoRotate = true;
    this.controls.autoRotateSpeed = 1.0;

    // Lights — low-key stage, sodium key like the Yard menu accent.
    const hemi = new THREE.HemisphereLight(0xe8efe9, 0x101311, 0.55);
    this.scene.add(hemi);
    const key = new THREE.DirectionalLight(0xfff2dd, 2.2);
    key.position.set(4, 7, 3);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    key.shadow.camera.left = -5;
    key.shadow.camera.right = 5;
    key.shadow.camera.top = 6;
    key.shadow.camera.bottom = -2;
    this.scene.add(key);
    const rim = new THREE.DirectionalLight(0xf0a202, 1.1);
    rim.position.set(-5, 3, -4);
    this.scene.add(rim);

    // Bay floor: dark disc + grid + shadow catcher.
    const disc = new THREE.Mesh(
      new THREE.CircleGeometry(4.2, 48),
      new THREE.MeshStandardMaterial({ color: "#1c221e", roughness: 0.9, metalness: 0.1 }),
    );
    disc.rotation.x = -Math.PI / 2;
    disc.receiveShadow = true;
    this.scene.add(disc);
    const grid = new THREE.GridHelper(8.4, 24, 0x313a34, 0x262d29);
    grid.position.y = 0.01;
    this.scene.add(grid);

    this.scene.add(this.mechRoot);

    // Transform flash ring (hidden until playTransform).
    const flashGeo = new THREE.TorusGeometry(1, 0.05, 12, 48);
    this.flash = new THREE.Mesh(
      flashGeo,
      new THREE.MeshBasicMaterial({ color: 0xf0a202, transparent: true, opacity: 0 }),
    );
    this.flash.rotation.x = -Math.PI / 2;
    this.flash.position.y = 1.9;
    this.scene.add(this.flash);
    this.flashLight = new THREE.PointLight(0xf0a202, 0, 12);
    this.flashLight.position.set(0, 2, 0);
    this.scene.add(this.flashLight);

    this.resize();
    this.resizeObs = new ResizeObserver(() => this.resize());
    if (canvas.parentElement) this.resizeObs.observe(canvas.parentElement);

    this.loop();
  }

  // ------------------------------------------------------------------ API

  /** Hand the viewer the loaded part registry (needed before setBuild). */
  setRegistry(registry: PartRegistry) {
    this.registry = registry;
  }

  /** Show a full multi-mode build (both modes preloaded, active mode mounted). */
  setBuild(build: MechBuild) {
    this.requireRegistry();
    this.build = structuredClone(build);
    this.mode = "racer";
    const token = ++this.loadToken;
    void this.mountMode(this.mode, token);
  }

  /** Instantly switch which mode is displayed. */
  setMode(mode: MechMode) {
    if (mode === this.mode || !this.build) return;
    this.mode = mode;
    const token = ++this.loadToken;
    void this.mountMode(this.mode, token);
  }

  getMode(): MechMode {
    return this.mode;
  }

  /** Swap one part on the ACTIVE mode. */
  setPart(slot: Slot, id: string) {
    this.requireRegistry();
    if (!this.build) throw new Error("Call setBuild before setPart.");
    const part = this.registry!.parts[id];
    if (!part) throw new Error(`Part "${id}" isn't in the registry.`);
    this.build.modes[this.mode][slot] = id;
    const token = ++this.loadToken;
    void this.mountSlot(slot, part, token);
  }

  /**
   * Animate the racer ↔ combat transformation: the mech rises, spins,
   * flashes at the apex while the part sets swap, then lands in the
   * other mode. Resolves when the animation finishes.
   */
  playTransform(): Promise<void> {
    if (this.tx || !this.build) return Promise.resolve();
    const next: MechMode = this.mode === "racer" ? "combat" : "racer";
    this.controls.autoRotate = false;
    return new Promise((resolve) => {
      this.tx = { t: 0, dur: 2.2, next, swapped: false };
      const check = () => {
        if (!this.tx) resolve();
        else requestAnimationFrame(check);
      };
      check();
    });
  }

  /** True while playTransform's animation is running. */
  isTransforming(): boolean {
    return this.tx !== null;
  }

  dispose() {
    cancelAnimationFrame(this.raf);
    this.resizeObs?.disconnect();
    this.controls.dispose();
    this.mechRoot.traverse((o) => disposeObject(o));
    for (const g of this.partCache.values()) g.traverse((o) => disposeObject(o));
    this.partCache.clear();
    this.scene.traverse((o) => disposeObject(o));
    this.renderer.dispose();
  }

  // -------------------------------------------------------------- internals

  private requireRegistry(): asserts this is { registry: PartRegistry } {
    if (!this.registry) throw new Error("Call setRegistry before using the viewer.");
  }

  private lookup(id: string): PartManifest {
    const part = this.registry!.parts[id];
    if (!part) throw new Error(`Part "${id}" isn't in the registry.`);
    return part;
  }

  /** Load (and cache) one part's GLB scene; falls back to a labeled box. */
  private async loadPart(part: PartManifest): Promise<THREE.Group> {
    const cached = this.partCache.get(part.id);
    if (cached) return cached;
    const url = partModelUrl(part, PARTS_BASE);
    try {
      const gltf = await this.loader.loadAsync(url);
      const group = new THREE.Group();
      group.name = `part:${part.id}`;
      group.add(gltf.scene);
      gltf.scene.traverse((o) => {
        if (o instanceof THREE.Mesh) {
          o.castShadow = true;
          o.receiveShadow = true;
        }
      });
      this.partCache.set(part.id, group);
      return group;
    } catch (err) {
      console.warn(`[MechViewer] couldn't load ${url}:`, err);
      const fallback = placeholderPart(part);
      this.partCache.set(part.id, fallback);
      return fallback;
    }
  }

  /** Mount every slot of a mode (preload both modes first for clean transforms). */
  private async mountMode(mode: MechMode, token: number) {
    if (!this.build) return;
    // Preload everything so transforms swap instantly.
    const ids = new Set<string>();
    for (const m of MODES) for (const slot of SLOTS_SAFE) ids.add(this.build.modes[m][slot]);
    await Promise.all([...ids].map((id) => this.loadPart(this.lookup(id))));
    if (token !== this.loadToken) return;

    this.clearMounted();
    const torsoPart = this.lookup(this.build.modes[mode].torso);
    const torso = await this.loadPart(torsoPart);
    if (token !== this.loadToken) return;
    const torsoGroup = new THREE.Group();
    torsoGroup.name = "torso-mount";
    torsoGroup.position.y = TORSO_Y;
    torsoGroup.add(torso);
    this.mechRoot.add(torsoGroup);
    this.mounted.set("torso", torsoGroup);
    const sockets = collectSockets(torso);

    for (const slot of SLOTS_SAFE) {
      if (slot === "torso") continue;
      if (token !== this.loadToken) return;
      const part = this.lookup(this.build.modes[mode][slot]);
      await this.mountSlot(slot, part, token, torsoGroup, sockets);
    }
  }

  /** Mount (or remount) a single slot's part on the current mode. */
  private async mountSlot(
    slot: Slot,
    part: PartManifest,
    token: number,
    torsoGroup?: THREE.Group,
    sockets?: Map<string, THREE.Object3D>,
  ) {
    if (slot === "torso") {
      // Full remount — torso change moves every socket.
      if (this.build) await this.mountMode(this.mode, token);
      return;
    }
    torsoGroup ??= this.mounted.get("torso");
    if (!torsoGroup) throw new Error("Torso isn't mounted yet.");
    sockets ??= collectSockets(torsoGroup);

    const old = this.mounted.get(slot);
    if (old) {
      this.mechRoot.remove(old);
      // Don't dispose — groups are cached in partCache for reuse.
    }

    const group = await this.loadPart(part);
    if (token !== this.loadToken) return;
    const mount = new THREE.Group();
    mount.name = `slot:${slot}`;
    mount.add(group);

    if (slot === "weapon") {
      // Prefer the arms part's socket_weapon_r, fall back to torso socket_arm_r.
      const armsMount = this.mounted.get("arms");
      const handSocket = armsMount ? findNamed(armsMount, "socket_weapon_r") : null;
      if (handSocket) {
        handSocket.add(mount);
      } else {
        const armR = sockets.get("socket_arm_r");
        if (!armR) throw new Error("Torso has no socket_arm_r for the weapon fallback.");
        placeAtSocket(mount, armR, this.mechRoot);
      }
    } else {
      const names = SOCKET_FOR_SLOT[slot];
      const found = names
        .map((n) => sockets!.get(n))
        .filter((s): s is THREE.Object3D => !!s);
      if (found.length === 0) {
        throw new Error(`Torso is missing sockets for slot "${slot}": ${names.join(", ")}`);
      }
      if (found.length === 1) {
        // Single-socket part: parent at the socket, part origin = attach point.
        found[0]!.add(mount);
      } else {
        // Paired part: parent to the mech root at the socket midpoint.
        placeAtMidpoint(mount, found, this.mechRoot);
      }
    }
    this.mounted.set(slot, mount);
  }

  private clearMounted() {
    for (const [, g] of this.mounted) this.mechRoot.remove(g);
    this.mounted.clear();
  }

  private resize() {
    const parent = this.canvas.parentElement;
    const w = parent?.clientWidth || this.canvas.clientWidth || 1;
    const h = parent?.clientHeight || this.canvas.clientHeight || 1;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  private loop = () => {
    this.raf = requestAnimationFrame(this.loop);
    const dt = Math.min(this.clock.getDelta(), 0.05);
    this.stepTransform(dt);
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  };

  private stepTransform(dt: number) {
    const tx = this.tx;
    if (!tx) return;
    tx.t += dt / tx.dur;
    const t = Math.min(tx.t, 1);
    // Rise + spin, peak at t=0.5, then land.
    const arc = Math.sin(t * Math.PI);
    this.mechRoot.position.y = arc * 1.4;
    this.mechRoot.rotation.y += dt * (2 + arc * 10);
    if (this.flash && this.flashLight) {
      const near = 1 - Math.abs(t - 0.5) * 2;
      const glow = Math.max(0, near);
      (this.flash.material as THREE.MeshBasicMaterial).opacity = glow * 0.9;
      this.flash.scale.setScalar(1 + glow * 2.5);
      this.flashLight.intensity = glow * 60;
    }
    if (t >= 0.5 && !tx.swapped) {
      tx.swapped = true;
      const token = ++this.loadToken;
      this.mode = tx.next;
      // Parts are preloaded, so the swap is synchronous.
      void this.mountMode(this.mode, token);
    }
    if (t >= 1) {
      this.mechRoot.position.y = 0;
      this.tx = null;
      this.controls.autoRotate = true;
      if (this.flash) (this.flash.material as THREE.MeshBasicMaterial).opacity = 0;
      if (this.flashLight) this.flashLight.intensity = 0;
    }
  }
}

const SLOTS_SAFE = [
  "head",
  "torso",
  "arms",
  "legs",
  "shoulders",
  "backpack",
  "weapon",
] as const;

/** Torso origin height in meters — feet land on y=0 with canonical legs. */
const TORSO_Y = 2.05;

function disposeObject(o: THREE.Object3D) {
  if (o instanceof THREE.Mesh) {
    o.geometry.dispose();
    const mats = Array.isArray(o.material) ? o.material : [o.material];
    for (const m of mats) {
      const mat = m as THREE.MeshStandardMaterial;
      for (const key of ["map", "normalMap", "roughnessMap", "metalnessMap"] as const) {
        (mat[key] as THREE.Texture | undefined)?.dispose?.();
      }
      mat.dispose();
    }
  }
}

/** All socket empties under a torso group, keyed by name. */
function collectSockets(torsoGroup: THREE.Group): Map<string, THREE.Object3D> {
  const map = new Map<string, THREE.Object3D>();
  torsoGroup.traverse((o) => {
    if (o.name.startsWith("socket_")) map.set(o.name, o);
  });
  return map;
}

function findNamed(root: THREE.Object3D, name: string): THREE.Object3D | null {
  let found: THREE.Object3D | null = null;
  root.traverse((o) => {
    if (!found && o.name === name) found = o;
  });
  return found;
}

/** Parent `mount` to the mech root at the world position of one socket. */
function placeAtSocket(mount: THREE.Group, socket: THREE.Object3D, root: THREE.Group) {
  const world = new THREE.Vector3();
  socket.getWorldPosition(world);
  root.add(mount);
  root.worldToLocal(world);
  mount.position.copy(world);
}

/** Parent `mount` to the mech root at the midpoint of several sockets. */
function placeAtMidpoint(
  mount: THREE.Group,
  sockets: THREE.Object3D[],
  root: THREE.Group,
) {
  const mid = new THREE.Vector3();
  const v = new THREE.Vector3();
  for (const s of sockets) {
    s.getWorldPosition(v);
    mid.add(v);
  }
  mid.divideScalar(sockets.length);
  root.add(mount);
  root.worldToLocal(mid);
  mount.position.copy(mid);
}

/**
 * Labeled placeholder box for a part whose GLB couldn't load — the
 * customizer stays usable and the missing part is obvious, never silent.
 */
function placeholderPart(part: PartManifest): THREE.Group {
  const group = new THREE.Group();
  group.name = `placeholder:${part.id}`;
  const size = { x: 0.5, y: 0.7, z: 0.5 };
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(size.x, size.y, size.z),
    new THREE.MeshStandardMaterial({
      color: "#262d29",
      roughness: 0.8,
      metalness: 0.2,
      transparent: true,
      opacity: 0.85,
    }),
  );
  mesh.position.y = size.y / 2;
  group.add(mesh);

  const label = makeTextSprite(part.name);
  label.position.y = size.y + 0.25;
  group.add(label);
  return group;
}

function makeTextSprite(text: string): THREE.Sprite {
  const pad = 24;
  const c = document.createElement("canvas");
  const ctx = c.getContext("2d")!;
  ctx.font = "600 44px 'IBM Plex Mono', monospace";
  const w = Math.ceil(ctx.measureText(text).width) + pad * 2;
  c.width = w;
  c.height = 88;
  const g = c.getContext("2d")!;
  g.fillStyle = "rgba(16,19,17,0.92)";
  g.fillRect(0, 0, c.width, c.height);
  g.strokeStyle = "#f0a202";
  g.lineWidth = 3;
  g.strokeRect(2, 2, c.width - 4, c.height - 4);
  g.font = "600 44px 'IBM Plex Mono', monospace";
  g.fillStyle = "#e8efe9";
  g.textBaseline = "middle";
  g.fillText(text, pad, c.height / 2 + 2);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  const sprite = new THREE.Sprite(
    new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false }),
  );
  sprite.scale.set((c.width / c.height) * 0.5, 0.5, 1);
  return sprite;
}
