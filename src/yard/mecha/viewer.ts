import * as THREE from "three";
import { GLTFLoader, type GLTF } from "three/examples/jsm/loaders/GLTFLoader.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { DEFAULT_BUILD, PARTS_BASE, partModelUrl, type PartRegistry } from "./parts.ts";
import {
  DEFAULT_TRANSFORM,
  MODES,
  REQUIRED_TORSO_SOCKETS,
  SLOTS,
  SOCKET_FOR_SLOT,
  parsePartManifest,
  type MechBuild,
  type MechMode,
  type MechModeBuild,
  type PartManifest,
  type Slot,
} from "./schemas.ts";

/**
 * MechViewer — the 3D assembly preview for the theyard mecha customizer.
 *
 * Builds against the part-system contract in ./schemas.ts:
 *  - 7 slots per mode; arms / legs / shoulders are pairs — one part id
 *    covers both sides, the GLB carries both halves and mounts at the
 *    midpoint of the torso's _l / _r sockets.
 *  - torso is the hierarchy root; every part GLB's origin is its attach point.
 *  - weapon mounts on the right arm part's `socket_weapon_r`,
 *    falling back to the torso's `socket_arm_r`.
 *  - multi-mode builds: { modes: { racer, combat }, transform }.
 *
 * Missing parts (no part.json and no GLB) render as labeled placeholder
 * boxes in a per-slot color so the UI lane can develop against real
 * geometry without waiting on the parts lane.
 *
 * Transformation (racer <-> combat) is an animated ~0.85s sequence:
 * staggered emissive flash + scale pop per part (extremities first,
 * core last), a light pulse and a camera FOV punch. The old part set
 * swaps for the new one at flash peak while the model is washed out,
 * so it reads as a transformation — never a pop-in.
 */

export type ViewerBuild = MechBuild | MechModeBuild;

/** Per-slot placeholder color (box tint + label border). */
export const SLOT_COLORS: Record<Slot, string> = {
  head: "#ff9f1c",
  torso: "#2ec4b6",
  arms: "#e71d36",
  legs: "#7b2fbe",
  shoulders: "#fdca40",
  backpack: "#4361ee",
  weapon: "#ef476f",
};

/** Placeholder box dimensions per slot, in meters (w, h, d). */
const PLACEHOLDER_SIZE: Record<Slot, [number, number, number]> = {
  head: [0.55, 0.6, 0.55],
  torso: [1.3, 1.6, 0.9],
  arms: [0.34, 1.05, 0.34],
  legs: [0.4, 1.15, 0.4],
  shoulders: [0.55, 0.42, 0.55],
  backpack: [0.95, 0.95, 0.5],
  weapon: [0.22, 0.22, 1.25],
};

/**
 * Synthetic socket offsets used when a torso can't provide a named
 * socket — always for placeholder torsos, and as a warned fallback for
 * real torsos missing a contract socket. Torso-local meters.
 */
const FALLBACK_SOCKET_OFFSETS: Record<string, [number, number, number]> = {
  socket_head: [0, 0.95, 0],
  socket_arm_r: [0.72, 0.45, 0],
  socket_arm_l: [-0.72, 0.45, 0],
  socket_leg_r: [0.32, -0.78, 0],
  socket_leg_l: [-0.32, -0.78, 0],
  socket_shoulder_r: [0.88, 0.72, 0],
  socket_shoulder_l: [-0.88, 0.72, 0],
  socket_back: [0, 0.35, -0.52],
  socket_weapon_r: [0.72, -0.1, 0.1],
};

/** Pair slots: one part id, mounted once at the _l/_r socket midpoint. */
const PAIR_SLOTS: Slot[] = ["arms", "legs", "shoulders"];

/** Transform stagger order — extremities reconfigure first, core last. */
const STAGGER_ORDER: Slot[] = [
  "weapon",
  "head",
  "shoulders",
  "arms",
  "backpack",
  "legs",
  "torso",
];

const TRANSFORM_TOTAL = 0.85; // seconds, per the transform brief
const TRANSFORM_SWAP_AT = 0.36; // old -> new visibility swap, at flash peak
const STAGGER_STEP = 0.05; // per-slot delay
const FLASH_PEAK = 2.6; // emissive intensity at full flash
const POP_SCALE = 0.09; // scale-pop amplitude

const _box = new THREE.Box3();
const _size = new THREE.Vector3();
const _center = new THREE.Vector3();
const _dir = new THREE.Vector3();
const _v = new THREE.Vector3();

type AnimMaterial = {
  mat: THREE.MeshStandardMaterial;
  baseEmissive: THREE.Color;
  baseIntensity: number;
};

type AnimUnit = {
  slot: Slot;
  /** Wrapper groups whose scale is animated (never the sockets). */
  wraps: THREE.Group[];
  delay: number;
  mats: AnimMaterial[];
};

type TransformJob = {
  toMode: MechMode;
  t: number;
  oldRoot: THREE.Group;
  newRoot: THREE.Group;
  oldUnits: AnimUnit[];
  newUnits: AnimUnit[];
  swapped: boolean;
  resolve: () => void;
};

function easeOutCubic(x: number): number {
  return 1 - Math.pow(1 - x, 3);
}

function easeOutBack(x: number): number {
  const c = 1.70158;
  return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2);
}

function clamp01(x: number): number {
  return Math.min(1, Math.max(0, x));
}

function isMultiMode(build: ViewerBuild): build is MechBuild {
  return typeof build === "object" && build !== null && "modes" in build;
}

/** Collect every standard material under a group for flash animation. */
function collectAnimMaterials(root: THREE.Object3D): AnimMaterial[] {
  const out: AnimMaterial[] = [];
  root.traverse((node) => {
    if (!(node instanceof THREE.Mesh)) return;
    const mats = Array.isArray(node.material) ? node.material : [node.material];
    for (const m of mats) {
      if (m && (m as THREE.MeshStandardMaterial).isMeshStandardMaterial) {
        const sm = m as THREE.MeshStandardMaterial;
        out.push({
          mat: sm,
          baseEmissive: sm.emissive.clone(),
          baseIntensity: sm.emissiveIntensity,
        });
      }
    }
  });
  return out;
}

export class MechViewer {
  /** Fires after the assembled mode changes (setMode / playTransform). */
  onModeChange: ((mode: MechMode) => void) | null = null;

  private renderer: THREE.WebGLRenderer | null = null;
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(45, 1, 0.1, 200);
  private controls: OrbitControls | null = null;
  private loader = new GLTFLoader();
  private clock = new THREE.Clock();
  private pulse = new THREE.PointLight("#bfe9ff", 0, 14, 1.6);
  private mechRoot: THREE.Group | null = null;
  private build: MechBuild | null = null;
  private mode: MechMode = "racer";
  private manifestCache = new Map<string, PartManifest | null>();
  private gltfCache = new Map<string, GLTF>();
  private labelTexCache = new Map<string, THREE.CanvasTexture>();
  private placeholderGeoCache = new Map<string, THREE.BufferGeometry>();
  private warned = new Set<string>();
  private loadToken = 0;
  private raf = 0;
  private resizeObs: ResizeObserver | null = null;
  private overlay: HTMLDivElement | null = null;
  private modeBadge: HTMLSpanElement | null = null;
  private transformBtn: HTMLButtonElement | null = null;
  private activeTransform: TransformJob | null = null;
  private transformTail: Promise<void> = Promise.resolve();
  private userTookCamera = false;
  private disposed = false;
  failed = false;

  constructor(private canvas: HTMLCanvasElement) {
    // Studio lighting, following the GameView pattern (hemi + key + rim).
    const hemi = new THREE.HemisphereLight("#f5efe2", "#1c2226", 0.85);
    const sun = new THREE.DirectionalLight("#fff1da", 2.2);
    sun.position.set(7, 11, 5);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.left = -8;
    sun.shadow.camera.right = 8;
    sun.shadow.camera.top = 8;
    sun.shadow.camera.bottom = -8;
    sun.shadow.camera.far = 40;
    sun.shadow.bias = -0.0005;
    const rim = new THREE.DirectionalLight("#86b8ff", 0.9);
    rim.position.set(-8, 5, -7);
    this.pulse.position.set(0, 1.6, 0);
    this.scene.add(hemi, sun, rim, this.pulse);
    this.scene.background = new THREE.Color("#10131a");
    this.scene.fog = new THREE.Fog("#10131a", 30, 90);

    // Ground: studio floor disc (catches the soft shadow) + grid.
    const ground = new THREE.Mesh(
      new THREE.CircleGeometry(30, 48),
      new THREE.MeshStandardMaterial({ color: "#171b21", roughness: 0.95, metalness: 0 }),
    );
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.scene.add(ground);
    const grid = new THREE.GridHelper(40, 40, "#4a5468", "#2a3040");
    grid.position.y = 0.01;
    const gridMat = grid.material as THREE.Material;
    gridMat.transparent = true;
    gridMat.opacity = 0.5;
    this.scene.add(grid);

    try {
      const coarse = window.matchMedia("(pointer: coarse)").matches;
      const renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: !coarse,
        alpha: false,
        powerPreference: "high-performance",
      });
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.05;
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      this.renderer = renderer;
      if (!renderer.getContext()) {
        this.failed = true;
        return;
      }
    } catch (err) {
      console.warn("[MechViewer] WebGL unavailable:", err);
      this.failed = true;
      return;
    }

    this.controls = new OrbitControls(this.camera, canvas);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.minDistance = 2;
    this.controls.maxDistance = 60;
    this.controls.maxPolarAngle = Math.PI * 0.495;
    this.controls.autoRotate = true;
    this.controls.autoRotateSpeed = 0.9;
    canvas.addEventListener(
      "pointerdown",
      () => {
        this.userTookCamera = true;
        if (this.controls) this.controls.autoRotate = false;
      },
      { once: true },
    );

    this.buildOverlay();
    if (typeof ResizeObserver !== "undefined") {
      this.resizeObs = new ResizeObserver(() => this.resize());
      this.resizeObs.observe(canvas);
    } else {
      window.addEventListener("resize", this.handleWindowResize);
    }
    this.resize();
    // Park the camera on the empty studio floor until the first build lands.
    this.camera.position.set(-4.5, 3.2, 5.2);
    this.controls.target.set(0, 1.2, 0);
    this.controls.update();
    this.raf = requestAnimationFrame(this.tick);
  }

  // ---------------------------------------------------------------- build API

  /**
   * Load and assemble a full mech. Accepts the multi-mode MechBuild
   * ({ modes: { racer, combat }, transform }) or a single flat mode
   * build (used for both modes). Preloads both modes so the first
   * transform swaps instantly.
   */
  async setBuild(build: ViewerBuild): Promise<void> {
    await this.transformTail;
    if (this.disposed) return;
    this.build = isMultiMode(build)
      ? structuredClone(build)
      : {
          modes: { racer: { ...build }, combat: { ...build } },
          transform: { ...DEFAULT_TRANSFORM },
        };
    this.activeTransform = null;
    const token = ++this.loadToken;
    this.clearMech();
    await this.preloadBuild(this.build);
    if (this.disposed || token !== this.loadToken) return;
    const root = await this.assembleMode(this.build.modes[this.mode], this.mode);
    if (this.disposed || token !== this.loadToken) return;
    this.mechRoot = root;
    this.scene.add(root);
    this.frameCamera(false);
    this.updateOverlay();
  }

  /** Instantly switch to a mode's part set (no animation). */
  async setMode(mode: MechMode): Promise<void> {
    await this.transformTail;
    if (this.disposed || !this.build) {
      if (!this.build) console.warn("[MechViewer] setMode called before setBuild.");
      return;
    }
    if (mode === this.mode) return;
    this.activeTransform = null;
    const token = ++this.loadToken;
    this.clearMech();
    const root = await this.assembleMode(this.build.modes[mode], mode);
    if (this.disposed || token !== this.loadToken) return;
    this.mechRoot = root;
    this.mode = mode;
    this.scene.add(root);
    this.frameCamera(true);
    this.updateOverlay();
    this.onModeChange?.(mode);
  }

  /**
   * Hot-swap one part of the CURRENT mode without a full rebuild of UI
   * state. Updates the stored mode config too, so a later transform
   * away and back keeps the swap.
   */
  async setPart(slot: Slot, partId: string): Promise<void> {
    await this.transformTail;
    if (this.disposed || !this.build) {
      if (!this.build) console.warn("[MechViewer] setPart called before setBuild.");
      return;
    }
    this.build.modes[this.mode][slot] = partId;
    this.activeTransform = null;
    const token = ++this.loadToken;
    this.clearMech();
    const root = await this.assembleMode(this.build.modes[this.mode], this.mode);
    if (this.disposed || token !== this.loadToken) return;
    this.mechRoot = root;
    this.scene.add(root);
    this.frameCamera(true);
    this.updateOverlay();
  }

  /**
   * Seed the viewer's manifest cache from a loaded part registry (see
   * parts.ts loadPartRegistry). Optional — without it the viewer fetches
   * each part's part.json itself. Seeding skips those fetches.
   */
  setRegistry(registry: PartRegistry): void {
    for (const [id, manifest] of Object.entries(registry.parts)) {
      this.manifestCache.set(id, manifest);
    }
  }

  /**
   * Animated transformation to another mode (~0.85s). Parts flash and
   * pop in a staggered sequence; the old set swaps for the new one at
   * flash peak while washed out, so it never reads as a pop-in.
   * With no argument, transforms to the other mode (toggle).
   * Calls chain: a transform started mid-transform waits its turn.
   */
  playTransform(toMode?: MechMode): Promise<void> {
    const target: MechMode = toMode ?? (this.mode === "racer" ? "combat" : "racer");
    let resolve!: () => void;
    const done = new Promise<void>((res) => {
      resolve = res;
    });
    this.transformTail = this.transformTail
      .then(() => this.runTransform(target))
      .then(resolve, resolve);
    return done;
  }

  /** True while a transform animation is running. */
  isTransforming(): boolean {
    return this.activeTransform !== null;
  }

  getMode(): MechMode {
    return this.mode;
  }

  getBuild(): MechBuild | null {
    return this.build ? structuredClone(this.build) : null;
  }

  resize() {
    const renderer = this.renderer;
    if (!renderer) return;
    const w = this.canvas.clientWidth || 1;
    const h = this.canvas.clientHeight || 1;
    if (
      this.canvas.width !== Math.floor(w * renderer.getPixelRatio()) ||
      this.canvas.height !== Math.floor(h * renderer.getPixelRatio())
    ) {
      renderer.setSize(w, h, false);
    }
    this.camera.aspect = w / Math.max(1, h);
    this.camera.updateProjectionMatrix();
  }

  dispose() {
    this.disposed = true;
    cancelAnimationFrame(this.raf);
    this.resizeObs?.disconnect();
    window.removeEventListener("resize", this.handleWindowResize);
    this.overlay?.remove();
    this.overlay = null;
    this.clearMech();
    // Drop cached assets: geometries/textures shared across clones.
    for (const gltf of this.gltfCache.values()) {
      gltf.scene.traverse((node) => {
        if (node instanceof THREE.Mesh) {
          node.geometry.dispose();
          const mats = Array.isArray(node.material) ? node.material : [node.material];
          for (const m of mats) m?.dispose();
        }
      });
    }
    this.gltfCache.clear();
    for (const geo of this.placeholderGeoCache.values()) geo.dispose();
    this.placeholderGeoCache.clear();
    for (const tex of this.labelTexCache.values()) tex.dispose();
    this.labelTexCache.clear();
    this.controls?.dispose();
    this.controls = null;
    this.scene.clear();
    this.renderer?.dispose();
    this.renderer = null;
  }

  // ------------------------------------------------------------- transform

  private async runTransform(toMode: MechMode): Promise<void> {
    if (this.disposed || !this.build) {
      if (!this.build) console.warn("[MechViewer] playTransform called before setBuild.");
      return;
    }
    if (toMode === this.mode || this.activeTransform) return;
    const oldRoot = this.mechRoot;
    if (!oldRoot) {
      await this.setMode(toMode);
      return;
    }
    this.setTransformUi(true);
    if (this.controls && !this.userTookCamera) this.controls.autoRotate = false;
    let newRoot: THREE.Group;
    try {
      newRoot = await this.assembleMode(this.build.modes[toMode], toMode);
    } catch (err) {
      console.warn("[MechViewer] transform assembly failed:", err);
      this.setTransformUi(false);
      return;
    }
    if (this.disposed) return;
    newRoot.visible = false;
    this.scene.add(newRoot);

    const oldUnits = this.buildAnimUnits(oldRoot);
    const newUnits = this.buildAnimUnits(newRoot);
    // Flash color leans with the destination form: cyan for racer, magenta for combat.
    const flash = new THREE.Color(toMode === "combat" ? "#ff7ad9" : "#8fe8ff");
    for (const u of oldUnits) for (const m of u.mats) m.mat.emissive.copy(flash);
    for (const u of newUnits) for (const m of u.mats) m.mat.emissive.copy(flash);

    await new Promise<void>((resolve) => {
      this.activeTransform = {
        toMode,
        t: 0,
        oldRoot,
        newRoot,
        oldUnits,
        newUnits,
        swapped: false,
        resolve,
      };
    });
  }

  /** Staggered animation units for a root, in STAGGER_ORDER. */
  private buildAnimUnits(root: THREE.Group): AnimUnit[] {
    const bySlot = root.userData.units as Map<Slot, THREE.Group[]> | undefined;
    const units: AnimUnit[] = [];
    STAGGER_ORDER.forEach((slot, i) => {
      const wraps = bySlot?.get(slot) ?? [];
      if (wraps.length === 0) return;
      const mats: AnimMaterial[] = [];
      for (const w of wraps) mats.push(...collectAnimMaterials(w));
      units.push({ slot, wraps, delay: i * STAGGER_STEP, mats });
    });
    return units;
  }

  private updateTransform(dt: number) {
    const job = this.activeTransform;
    if (!job) return;
    job.t += dt;
    const t = job.t;
    const pulse = Math.sin(Math.PI * clamp01(t / TRANSFORM_TOTAL));
    this.pulse.intensity = 42 * pulse;
    this.camera.fov = 45 + 7 * pulse;
    this.camera.updateProjectionMatrix();

    if (!job.swapped && t >= TRANSFORM_SWAP_AT) {
      job.swapped = true;
      job.oldRoot.visible = false;
      job.newRoot.visible = true;
      this.disposeAssemblyMaterials(job.oldRoot);
      this.scene.remove(job.oldRoot);
      this.mechRoot = job.newRoot;
      this.groundAlign(job.newRoot);
    }

    if (!job.swapped) {
      // Charge: staggered flash-up + pop on the outgoing parts.
      for (const u of job.oldUnits) {
        const lt = clamp01((t - u.delay) / 0.32);
        const e = easeOutCubic(lt);
        const intensity = FLASH_PEAK * e;
        const s = 1 + POP_SCALE * e;
        for (const m of u.mats) m.mat.emissiveIntensity = intensity;
        for (const w of u.wraps) w.scale.setScalar(s);
      }
    } else {
      // Resolve: staggered flash decay + spring settle on the new parts.
      const nt = t - TRANSFORM_SWAP_AT;
      for (const u of job.newUnits) {
        const lt = clamp01((nt - u.delay * 0.6) / 0.45);
        const d = easeOutCubic(lt);
        const intensity = FLASH_PEAK * (1 - d);
        const s = 1 + POP_SCALE * (1 - easeOutBack(lt));
        for (const m of u.mats) m.mat.emissiveIntensity = intensity;
        for (const w of u.wraps) w.scale.setScalar(s);
      }
    }

    if (t >= TRANSFORM_TOTAL) {
      // Restore exact base material state on the new assembly.
      for (const u of job.newUnits) {
        for (const m of u.mats) {
          m.mat.emissive.copy(m.baseEmissive);
          m.mat.emissiveIntensity = m.baseIntensity;
        }
        for (const w of u.wraps) w.scale.setScalar(1);
      }
      this.pulse.intensity = 0;
      this.camera.fov = 45;
      this.camera.updateProjectionMatrix();
      this.mode = job.toMode;
      this.activeTransform = null;
      if (this.controls && !this.userTookCamera) this.controls.autoRotate = true;
      this.frameCamera(true);
      this.setTransformUi(false);
      this.updateOverlay();
      this.onModeChange?.(this.mode);
      job.resolve();
    }
  }

  // ------------------------------------------------------------- assembly

  /** Fetch every part of both modes so transforms swap instantly. */
  private async preloadBuild(build: MechBuild): Promise<void> {
    const ids = new Set<string>();
    for (const m of MODES) for (const slot of SLOTS) ids.add(build.modes[m][slot]);
    await Promise.all([...ids].map((id) => this.loadPartModel(id)));
  }

  /** Assemble one mode's part set into a hierarchy rooted at the torso. */
  private async assembleMode(modeBuild: MechModeBuild, mode: MechMode): Promise<THREE.Group> {
    const root = new THREE.Group();
    root.name = `mech-${mode}`;
    const units = new Map<Slot, THREE.Group[]>();

    // Torso first — it's the root and carries the sockets.
    const torsoId = modeBuild.torso;
    const torsoModel = await this.loadPartInstance("torso", torsoId, mode);
    const torsoWrap = new THREE.Group();
    torsoWrap.name = "part-torso";
    torsoWrap.add(torsoModel);
    root.add(torsoWrap);
    units.set("torso", [torsoWrap]);

    const sockets = new Map<string, THREE.Object3D>();
    torsoModel.traverse((o) => {
      if (o.name.startsWith("socket_")) sockets.set(o.name, o);
    });
    const findSocket = (name: string): THREE.Object3D => {
      const found = sockets.get(name);
      if (found) return found;
      this.warnOnce(
        `torso-socket:${torsoId}:${name}`,
        `[MechViewer] torso "${torsoId}" is missing contract socket "${name}" — using a fallback offset.`,
      );
      const empty = new THREE.Object3D();
      empty.name = `${name}-fallback`;
      const off = FALLBACK_SOCKET_OFFSETS[name] ?? [0, 0, 0];
      empty.position.set(off[0], off[1], off[2]);
      torsoWrap.add(empty);
      sockets.set(name, empty);
      return empty;
    };

    let armMount: THREE.Group | null = null;
    for (const slot of SLOTS) {
      if (slot === "torso" || slot === "weapon") continue;
      const partId = modeBuild[slot];
      const model = await this.loadPartInstance(slot, partId, mode);
      const wrap = new THREE.Group();
      wrap.name = `part-${slot}`;
      wrap.add(model);
      if (PAIR_SLOTS.includes(slot)) {
        // One part id covers both sides: mount once at the _l/_r midpoint.
        const names = SOCKET_FOR_SLOT[slot];
        const found = names.map((n) => findSocket(n));
        if (found.length === 0) {
          this.warnOnce(
            `slot-sockets:${torsoId}:${slot}`,
            `[MechViewer] no sockets found for slot "${slot}" — skipping part "${partId}".`,
          );
          continue;
        }
        _center.set(0, 0, 0);
        for (const s of found) {
          s.getWorldPosition(_v);
          _center.add(_v);
        }
        _center.divideScalar(found.length);
        root.add(wrap);
        root.worldToLocal(_center);
        wrap.position.copy(_center);
      } else {
        const socket = findSocket(SOCKET_FOR_SLOT[slot][0]!);
        socket.add(wrap);
      }
      units.set(slot, [wrap]);
      if (slot === "arms") armMount = wrap;
    }

    // Weapon: the arms part's socket_weapon_r, else the torso's socket_arm_r.
    {
      const partId = modeBuild.weapon;
      const model = await this.loadPartInstance("weapon", partId, mode);
      const wrap = new THREE.Group();
      wrap.name = "part-weapon";
      wrap.add(model);
      let mount: THREE.Object3D | null = null;
      if (armMount) {
        armMount.traverse((o) => {
          if (!mount && o.name === "socket_weapon_r") mount = o;
        });
        if (!mount) {
          this.warnOnce(
            `weapon-socket:${modeBuild.arms}`,
            `[MechViewer] arm part "${modeBuild.arms}" has no "socket_weapon_r" — mounting weapon on the torso's socket_arm_r.`,
          );
        }
      }
      if (!mount) mount = findSocket("socket_arm_r");
      mount.add(wrap);
      units.set("weapon", [wrap]);
    }

    root.userData.units = units;
    this.groundAlign(root);
    return root;
  }

  /** Shift the root so the lowest point of the assembly sits on y=0. */
  private groundAlign(root: THREE.Group) {
    _box.setFromObject(root);
    if (_box.isEmpty()) return;
    root.position.y -= _box.min.y;
  }

  private clearMech() {
    const root = this.mechRoot;
    this.mechRoot = null;
    if (!root) return;
    this.scene.remove(root);
    this.disposeAssemblyMaterials(root);
  }

  /** Dispose per-mount cloned materials (shared cache geos/textures survive). */
  private disposeAssemblyMaterials(root: THREE.Object3D) {
    root.traverse((node) => {
      if (node instanceof THREE.Mesh) {
        const mats = Array.isArray(node.material) ? node.material : [node.material];
        for (const m of mats) m?.dispose();
      }
    });
  }

  // ---------------------------------------------------------------- loading

  /**
   * Fetch + parse one part's GLB, cached by part id. Never throws —
   * failures are handled by loadPartInstance's placeholder path.
   */
  private async loadPartModel(partId: string): Promise<GLTF | null> {
    const cached = this.gltfCache.get(partId);
    if (cached) return cached;
    let manifest = this.manifestCache.get(partId);
    if (manifest === undefined) {
      manifest = await this.fetchManifest(partId);
      this.manifestCache.set(partId, manifest);
    }
    const url = manifest
      ? partModelUrl(manifest, PARTS_BASE)
      : `${PARTS_BASE}/${partId}/${partId}.glb`;
    try {
      const gltf = await this.loader.loadAsync(url);
      this.gltfCache.set(partId, gltf);
      return gltf;
    } catch {
      return null;
    }
  }

  /**
   * A fresh instance of a part — materials cloned per mount so flash
   * animation and disposal never touch the shared cache. Falls back to
   * a labeled per-slot-color placeholder box (with a console warning)
   * when the GLB can't load.
   */
  private async loadPartInstance(slot: Slot, partId: string, mode: MechMode): Promise<THREE.Object3D> {
    const gltf = await this.loadPartModel(partId);
    if (gltf) return this.instantiate(gltf);
    this.warnOnce(
      `missing:${partId}`,
      `[MechViewer] part "${partId}" (${slot}, ${mode}) failed to load — rendering a placeholder box.`,
    );
    return this.buildPlaceholder(slot, partId, mode);
  }

  private async fetchManifest(partId: string): Promise<PartManifest | null> {
    try {
      const res = await fetch(`${PARTS_BASE}/${partId}/part.json`);
      if (!res.ok) return null;
      return parsePartManifest(await res.text());
    } catch {
      return null;
    }
  }

  private instantiate(gltf: GLTF): THREE.Object3D {
    const obj = gltf.scene.clone(true);
    obj.traverse((node) => {
      if (node instanceof THREE.Mesh) {
        node.castShadow = true;
        const mat = node.material;
        if (Array.isArray(mat)) node.material = mat.map((m) => m.clone());
        else if (mat) node.material = mat.clone();
      }
    });
    return obj;
  }

  // ------------------------------------------------------------ placeholder

  private buildPlaceholder(slot: Slot, partId: string, mode: MechMode): THREE.Group {
    const group = new THREE.Group();
    group.name = `placeholder-${slot}`;
    const [w, h, d] = PLACEHOLDER_SIZE[slot];
    let geo = this.placeholderGeoCache.get(slot);
    if (!geo) {
      geo = new THREE.BoxGeometry(w, h, d);
      this.placeholderGeoCache.set(slot, geo);
    }
    const color = SLOT_COLORS[slot];
    const mat = new THREE.MeshStandardMaterial({
      color,
      roughness: 0.55,
      metalness: 0.15,
      map: this.labelTexture(slot, partId, mode),
      emissive: color,
      emissiveIntensity: 0.18,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.castShadow = true;
    group.add(mesh);
    if (slot === "torso") {
      // Synthetic contract sockets so the rest of the mech still assembles.
      for (const name of REQUIRED_TORSO_SOCKETS) {
        const empty = new THREE.Object3D();
        empty.name = name;
        const off = FALLBACK_SOCKET_OFFSETS[name] ?? [0, 0, 0];
        empty.position.set(off[0], off[1], off[2]);
        group.add(empty);
      }
    }
    return group;
  }

  private labelTexture(slot: Slot, partId: string, mode: MechMode): THREE.CanvasTexture {
    const key = `${slot}:${partId}:${mode}`;
    const hit = this.labelTexCache.get(key);
    if (hit) return hit;
    const cv = document.createElement("canvas");
    cv.width = 256;
    cv.height = 192;
    const ctx = cv.getContext("2d")!;
    const color = SLOT_COLORS[slot];
    ctx.fillStyle = "#14171c";
    ctx.fillRect(0, 0, 256, 192);
    ctx.strokeStyle = color;
    ctx.lineWidth = 10;
    ctx.strokeRect(5, 5, 246, 182);
    ctx.fillStyle = color;
    ctx.font = "bold 30px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(slot.toUpperCase(), 128, 52);
    ctx.fillStyle = "#e8ecf1";
    ctx.font = "20px system-ui, sans-serif";
    const label = partId.length > 20 ? `${partId.slice(0, 19)}…` : partId;
    ctx.fillText(label, 128, 92);
    ctx.fillStyle = "#8a93a3";
    ctx.font = "16px system-ui, sans-serif";
    ctx.fillText(`${mode} · MISSING GLB`, 128, 128);
    ctx.fillText("placeholder", 128, 154);
    const tex = new THREE.CanvasTexture(cv);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    this.labelTexCache.set(key, tex);
    return tex;
  }

  // ----------------------------------------------------------------- camera

  /** Fit the camera to the assembled mech; smooth = eased re-frame. */
  private frameCamera(smooth: boolean) {
    const root = this.mechRoot;
    const controls = this.controls;
    if (!root || !controls) return;
    _box.setFromObject(root);
    if (_box.isEmpty()) return;
    _box.getSize(_size);
    _box.getCenter(_center);
    const maxDim = Math.max(_size.x, _size.y, _size.z, 0.5);
    const fitDist =
      ((maxDim / 2) / Math.tan(THREE.MathUtils.degToRad(this.camera.fov / 2))) * 1.5;
    _dir.set(-0.62, 0.42, 0.68).normalize();
    const toPos = _center.clone().addScaledVector(_dir, fitDist);
    const toTg = _center.clone();
    if (!smooth) {
      this.camera.position.copy(toPos);
      controls.target.copy(toTg);
      controls.update();
      return;
    }
    const fromPos = this.camera.position.clone();
    const fromTg = controls.target.clone();
    const start = performance.now();
    const step = () => {
      if (this.disposed || !this.controls) return;
      const k = easeOutCubic(clamp01((performance.now() - start) / 500));
      this.camera.position.lerpVectors(fromPos, toPos, k);
      this.controls!.target.lerpVectors(fromTg, toTg, k);
      this.controls!.update();
      if (k < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  // ------------------------------------------------------------------ loop

  private tick = () => {
    if (this.disposed) return;
    this.raf = requestAnimationFrame(this.tick);
    const dt = Math.min(this.clock.getDelta(), 0.1);
    this.updateTransform(dt);
    this.controls?.update();
    this.renderer?.render(this.scene, this.camera);
  };

  private handleWindowResize = () => this.resize();

  private warnOnce(key: string, message: string) {
    if (this.warned.has(key)) return;
    this.warned.add(key);
    console.warn(message);
  }

  // ---------------------------------------------------------------- overlay

  /** Small mode-toggle control in the preview; the UI lane drives the same API. */
  private buildOverlay() {
    const parent = this.canvas.parentElement;
    if (!parent) return;
    if (getComputedStyle(parent).position === "static") {
      parent.style.position = "relative";
    }
    const overlay = document.createElement("div");
    overlay.style.cssText =
      "position:absolute;top:12px;left:12px;display:flex;gap:8px;align-items:center;z-index:10;" +
      "font-family:system-ui,-apple-system,sans-serif;pointer-events:none;";
    const badge = document.createElement("span");
    badge.textContent = "RACER";
    badge.style.cssText =
      "pointer-events:auto;padding:6px 12px;border-radius:999px;font-size:12px;font-weight:700;" +
      "letter-spacing:0.08em;color:#0b0e13;background:#8fe8ff;";
    const btn = document.createElement("button");
    btn.textContent = "⚡ TRANSFORM";
    btn.style.cssText =
      "pointer-events:auto;padding:6px 14px;border-radius:999px;font-size:12px;font-weight:700;" +
      "letter-spacing:0.06em;color:#fff;background:#2a2f3a;border:1px solid #4a5468;cursor:pointer;";
    btn.addEventListener("click", () => {
      const other: MechMode = this.mode === "racer" ? "combat" : "racer";
      void this.playTransform(other);
    });
    overlay.append(badge, btn);
    parent.appendChild(overlay);
    this.overlay = overlay;
    this.modeBadge = badge;
    this.transformBtn = btn;
  }

  private updateOverlay() {
    if (this.modeBadge) {
      const isRacer = this.mode === "racer";
      this.modeBadge.textContent = isRacer ? "RACER" : "COMBAT";
      this.modeBadge.style.background = isRacer ? "#8fe8ff" : "#ff7ad9";
    }
    if (this.transformBtn) {
      this.transformBtn.textContent = this.mode === "racer" ? "⚡ TO COMBAT" : "⚡ TO RACER";
    }
  }

  private setTransformUi(busy: boolean) {
    if (this.transformBtn) {
      this.transformBtn.disabled = busy;
      this.transformBtn.textContent = busy
        ? "TRANSFORMING…"
        : this.mode === "racer"
          ? "⚡ TO COMBAT"
          : "⚡ TO RACER";
      this.transformBtn.style.opacity = busy ? "0.55" : "1";
      this.transformBtn.style.cursor = busy ? "wait" : "pointer";
    }
  }
}

// Re-export the contract surface the UI lane builds against.
export type { MechBuild, MechMode, MechModeBuild, PartManifest, Slot };
export { DEFAULT_BUILD, MODES, SLOTS };
export { DEFAULT_TRANSFORM };
