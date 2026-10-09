import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, Copy, Save, Trash2, Zap } from "lucide-react";
import { MechViewer } from "@/yard/mecha/viewer";
import {
  MODES,
  SLOTS,
  TRANSFORM_TRIGGERS,
  type MechBuild,
  type MechMode,
  type PartManifest,
  type Slot,
  type TransformTrigger,
} from "@/yard/mecha/schemas";
import {
  DEFAULT_BUILD,
  cloneBuild,
  getPartsForSlot,
  loadPartRegistry,
  validateBuild,
  type PartRegistry,
} from "@/yard/mecha/parts";
import {
  ZERO_STATS,
  aggregateBuildStats,
  type MechStats,
} from "@/yard/mecha/stats";
import {
  STARTER_NAME,
  deleteMech,
  ensureStarterMech,
  getMech,
  listMechs,
  saveMech,
  subscribeMechs,
  type StoredMech,
} from "@/yard/mecha/storage";

const SLOT_LABELS: Record<Slot, string> = {
  head: "Head",
  torso: "Torso",
  arms: "Arms",
  legs: "Legs",
  shoulders: "Shoulders",
  backpack: "Backpack",
  weapon: "Weapon",
};

const TRIGGER_LABELS: Record<TransformTrigger, string> = {
  manual: "Manual — transform on command",
  meter_full: "Meter full — auto-transforms when the boost meter fills (meter is consumed)",
  damage_threshold: "Damage threshold — auto-transforms when hull drops to the threshold",
};

/** Bar scales: fixed so builds compare stably as parts change. */
const BAR_MAX: Record<"armor" | "speed" | "power" | "weight", number> = {
  armor: 120,
  speed: 120,
  power: 120,
  weight: 80,
};

/**
 * Per-mode stats via the part-system lane's aggregation (weight penalizes
 * speed). Falls back to zeros when a part is missing from the registry.
 */
function statsForModes(build: MechBuild, registry: PartRegistry): Record<MechMode, MechStats> {
  try {
    return aggregateBuildStats(build, (id) => registry.parts[id]);
  } catch {
    return { racer: ZERO_STATS, combat: ZERO_STATS };
  }
}

function StatBar({ label, value, max }: { label: string; value: number; max: number }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <p className="font-mono text-xs tracking-widest text-mist uppercase">{label}</p>
        <p className="font-mono text-sm font-semibold text-bone">{value}</p>
      </div>
      <div
        className="mt-1 h-2 overflow-hidden rounded-full bg-ink"
        role="progressbar"
        aria-label={label}
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
      >
        <div className="h-full rounded-full bg-sodium transition-[width] duration-200" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function PartCard({
  part,
  equipped,
  onEquip,
}: {
  part: PartManifest;
  equipped: boolean;
  onEquip: () => void;
}) {
  const exclusive = part.modes.length === 1;
  return (
    <button
      type="button"
      onClick={onEquip}
      aria-pressed={equipped}
      className={`flex w-full flex-col gap-1 border p-3 text-left transition-colors ${
        equipped
          ? "border-sodium bg-panel-2"
          : "border-line bg-ink hover:border-mist"
      }`}
    >
      <span className="flex items-center justify-between gap-2">
        <span className="font-display text-sm font-bold text-bone">{part.name}</span>
        {exclusive ? (
          <span className="shrink-0 font-mono text-[10px] tracking-widest text-sodium uppercase">
            {part.modes[0]}-only
          </span>
        ) : null}
      </span>
      <span className="text-xs text-mist">{part.description}</span>
      <span className="mt-1 flex flex-wrap gap-1 font-mono text-[11px] text-mist">
        <span className="border border-line px-1.5 py-0.5">ARM {part.stats.armor}</span>
        <span className="border border-line px-1.5 py-0.5">SPD {part.stats.speed}</span>
        <span className="border border-line px-1.5 py-0.5">PWR {part.stats.power}</span>
        <span className="border border-line px-1.5 py-0.5">WGT {part.stats.weight}</span>
      </span>
    </button>
  );
}

export function MechaBay() {
  const [registry, setRegistry] = useState<PartRegistry | null>(null);
  const [regError, setRegError] = useState<string | null>(null);
  const [build, setBuild] = useState<MechBuild>(() => cloneBuild(DEFAULT_BUILD));
  const [name, setName] = useState(STARTER_NAME);
  const [mode, setMode] = useState<MechMode>("racer");
  const [openSlot, setOpenSlot] = useState<Slot | null>("head");
  const [mechs, setMechs] = useState<StoredMech[]>([]);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [transforming, setTransforming] = useState(false);
  const [previewLive, setPreviewLive] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const viewerRef = useRef<MechViewer | null>(null);
  const viewerReady = useRef(false);

  // Boot: seed the starter mech, load the part registry.
  useEffect(() => {
    try {
      ensureStarterMech();
    } catch (err) {
      console.warn("[MechaBay] starter seed failed:", err);
    }
    setMechs(listMechs());
    const unsub = subscribeMechs(() => setMechs(listMechs()));
    let cancelled = false;
    loadPartRegistry()
      .then((reg) => {
        if (!cancelled) setRegistry(reg);
      })
      .catch((err) => {
        if (!cancelled)
          setRegError(err instanceof Error ? err.message : "Couldn't load the part registry.");
      });
    return () => {
      cancelled = true;
      unsub();
    };
  }, []);

  // Viewer lifecycle — client-only. The viewer loads part manifests itself;
  // this component keeps the registry for the picker, stats, and validation.
  useEffect(() => {
    if (!canvasRef.current || viewerReady.current) return;
    viewerReady.current = true;
    const viewer = new MechViewer(canvasRef.current);
    viewerRef.current = viewer;
    viewer.onModeChange = (m) => setMode(m);
    if (viewer.failed) {
      setError("The 3D preview couldn't start (WebGL unavailable). The picker and stats still work.");
      return;
    }
    viewer.setBuild(build)
      .then(() => setPreviewLive(true))
      .catch((err) => {
        setError(err instanceof Error ? err.message : "The 3D preview failed to load the build.");
      });
    return () => {
      viewer.dispose();
      viewerRef.current = null;
      viewerReady.current = false;
      setPreviewLive(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const modeStats: Record<MechMode, MechStats> = useMemo(
    () => (registry ? statsForModes(build, registry) : { racer: ZERO_STATS, combat: ZERO_STATS }),
    [build, registry],
  );
  const stats = modeStats[mode];

  const validation = useMemo(
    () => (registry ? validateBuild(build, registry) : { ok: true, issues: [] as string[] }),
    [build, registry],
  );

  function equip(slot: Slot, part: PartManifest) {
    setError(null);
    const next = cloneBuild(build);
    next.modes[mode][slot] = part.id;
    setBuild(next);
    viewerRef.current?.setPart(slot, part.id).catch((err) => {
      setError(err instanceof Error ? err.message : "Couldn't equip that part.");
    });
  }

  function switchMode(next: MechMode) {
    if (next === mode) return;
    setMode(next);
    viewerRef.current?.setMode(next).catch((err) => {
      setError(err instanceof Error ? err.message : "Couldn't switch modes.");
    });
  }

  async function doTransform() {
    const viewer = viewerRef.current;
    if (!viewer || transforming || viewer.failed) return;
    const other: MechMode = mode === "racer" ? "combat" : "racer";
    setTransforming(true);
    setError(null);
    setNotice(null);
    try {
      await viewer.playTransform(other);
      // onModeChange syncs `mode` state; read the viewer as backup.
      const landed = viewer.getMode();
      setMode(landed);
      setNotice(`Transformed — now in ${landed === "racer" ? "Racer" : "Combat"} mode.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "The transform failed.");
    } finally {
      setTransforming(false);
    }
  }

  function copyRacerToCombat() {
    if (!registry) return;
    const next = cloneBuild(build);
    next.modes.combat = { ...next.modes.racer };
    const val = validateBuild(next, registry);
    if (!val.ok) {
      setError(`Couldn't copy — ${val.issues[0]}`);
      return;
    }
    setBuild(next);
    setError(null);
    setNotice("Combat mode now mirrors the Racer loadout.");
    const viewer = viewerRef.current;
    if (viewer && !viewer.failed) {
      viewer
        .setBuild(next)
        .then(() => viewer.setMode(mode))
        .catch((err) => setError(err instanceof Error ? err.message : "Couldn't refresh the preview."));
    }
  }

  function updateTransform(patch: Partial<MechBuild["transform"]>) {
    const next = cloneBuild(build);
    next.transform = { ...next.transform, ...patch };
    setBuild(next);
  }

  function doSave() {
    setError(null);
    setNotice(null);
    try {
      saveMech(name, build);
      setMechs(listMechs());
      setNotice(`Saved "${name.trim().slice(0, 60) || "mech"}".`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't save that build.");
    }
  }

  function doLoad(mech: StoredMech) {
    const next = cloneBuild(mech.build);
    setBuild(next);
    setName(mech.name);
    setMode("racer");
    setError(null);
    setNotice(`Loaded "${mech.name}".`);
    viewerRef.current?.setBuild(next).catch((err) => {
      setError(err instanceof Error ? err.message : "Couldn't load that build into the preview.");
    });
  }

  function doDelete(target: string) {
    deleteMech(target);
    setMechs(listMechs());
  }

  return (
    <main className="mx-auto min-h-dvh max-w-5xl px-4 py-6 sm:px-6 sm:py-10">
      <header className="border-b border-line pb-6">
        <Link
          to="/"
          className="inline-flex items-center gap-2 font-mono text-xs tracking-widest text-mist uppercase hover:text-bone"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Yard
        </Link>
        <p className="mt-4 font-mono text-xs tracking-widest text-sodium uppercase">
          The Yard · Mecha Bay
        </p>
        <h1 className="mt-2 font-display text-5xl font-extrabold tracking-tight text-bone sm:text-6xl">
          Mecha Bay
        </h1>
        <p className="mt-3 max-w-xl text-base text-mist">
          Bolt parts onto your biomech in Racer or Combat mode, watch the stats move,
          then hit Transform and watch it change shape.
        </p>
      </header>

      {/* Mode tabs + transform */}
      <div className="mt-6 flex flex-wrap items-center gap-2">
        <div className="flex border border-line" role="tablist" aria-label="Mech mode">
          {MODES.map((m) => (
            <button
              key={m}
              type="button"
              role="tab"
              aria-selected={mode === m}
              onClick={() => switchMode(m)}
              className={`min-h-11 px-5 font-display text-sm font-bold tracking-wide uppercase ${
                mode === m ? "bg-sodium text-sodium-ink" : "text-mist hover:text-bone"
              }`}
            >
              {m === "racer" ? "Racer" : "Combat"}
            </button>
          ))}
        </div>
        <button
          type="button"
          className="btn btn-primary"
          onClick={doTransform}
          disabled={transforming || !previewLive}
        >
          <Zap className="size-4" aria-hidden="true" />
          {transforming ? "Transforming…" : "Transform"}
        </button>
        <button type="button" className="btn btn-ghost" onClick={copyRacerToCombat} disabled={!registry}>
          <Copy className="size-4" aria-hidden="true" />
          Copy Racer → Combat
        </button>
      </div>

      {notice ? (
        <p className="mt-4 border border-line bg-panel p-3 text-sm text-bone" role="status">
          {notice}
        </p>
      ) : null}
      {error ? (
        <p className="mt-4 border border-line bg-panel p-3 text-sm text-sodium" role="alert">
          {error}
        </p>
      ) : null}

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        {/* 3D preview */}
        <section className="border border-line bg-panel p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-mono text-xs tracking-widest text-mist uppercase">Live preview</h2>
            <p className="font-mono text-xs text-sodium uppercase">
              {mode === "racer" ? "Racer mode" : "Combat mode"}
            </p>
          </div>
          <div className="relative mt-3 h-[420px] overflow-hidden border border-line bg-ink sm:h-[520px]">
            <canvas ref={canvasRef} className="block h-full w-full" aria-label="3D mech preview" />
            {!registry && !regError ? (
              <p className="absolute inset-0 flex items-center justify-center text-sm text-mist">
                Loading parts…
              </p>
            ) : null}
            {regError ? (
              <p className="absolute inset-0 flex items-center justify-center p-6 text-center text-sm text-sodium" role="alert">
                {regError}
              </p>
            ) : null}
          </div>
          <p className="mt-3 font-mono text-xs text-mist">
            Drag to orbit · scroll or pinch to zoom · the bay turntable spins when idle
          </p>
        </section>

        {/* Stats + transform rules */}
        <div className="flex flex-col gap-6">
          <section className="border border-line bg-panel p-4 sm:p-6" aria-label="Mode stats">
            <h2 className="font-mono text-xs tracking-widest text-mist uppercase">
              {mode === "racer" ? "Racer" : "Combat"} stats
            </h2>
            <div className="mt-4 flex flex-col gap-4">
              <StatBar label="Armor" value={stats.armor} max={BAR_MAX.armor} />
              <StatBar label="Speed" value={stats.speed} max={BAR_MAX.speed} />
              <StatBar label="Power" value={stats.power} max={BAR_MAX.power} />
              <StatBar label="Weight" value={stats.weight} max={BAR_MAX.weight} />
            </div>
            <p className="mt-4 font-mono text-xs text-mist">
              Speed = Σ speed − ¼ × weight (min 0). Heavy armor hits hard but moves slow.
            </p>
            {!validation.ok ? (
              <ul className="mt-3 space-y-1 text-xs text-sodium" role="alert">
                {validation.issues.map((issue) => (
                  <li key={issue}>{issue}</li>
                ))}
              </ul>
            ) : null}
          </section>

          <section className="border border-line bg-panel p-4 sm:p-6" aria-label="Transformation rules">
            <h2 className="font-mono text-xs tracking-widest text-mist uppercase">Transformation rules</h2>
            <label className="mt-4 block text-sm text-mist" htmlFor="tx-trigger">
              Trigger
            </label>
            <select
              id="tx-trigger"
              className="field mt-1"
              value={build.transform.trigger}
              onChange={(e) => updateTransform({ trigger: e.target.value as TransformTrigger })}
            >
              {TRANSFORM_TRIGGERS.map((t) => (
                <option key={t} value={t}>
                  {TRIGGER_LABELS[t]}
                </option>
              ))}
            </select>
            <div className="mt-4 grid grid-cols-3 gap-3">
              <div>
                <label className="block font-mono text-xs text-mist" htmlFor="tx-meter">
                  Meter cost
                </label>
                <input
                  id="tx-meter"
                  type="number"
                  min={0}
                  max={100}
                  className="field mt-1"
                  value={build.transform.cost.meter}
                  onChange={(e) =>
                    updateTransform({ cost: { meter: Number(e.target.value) || 0 } })
                  }
                />
              </div>
              <div>
                <label className="block font-mono text-xs text-mist" htmlFor="tx-cooldown">
                  Cooldown (s)
                </label>
                <input
                  id="tx-cooldown"
                  type="number"
                  min={0}
                  max={120}
                  className="field mt-1"
                  value={build.transform.cooldownSec}
                  onChange={(e) => updateTransform({ cooldownSec: Number(e.target.value) || 0 })}
                />
              </div>
              <div>
                <label className="block font-mono text-xs text-mist" htmlFor="tx-threshold">
                  Hull % trigger
                </label>
                <input
                  id="tx-threshold"
                  type="number"
                  min={1}
                  max={99}
                  className="field mt-1"
                  value={build.transform.damageThresholdPct}
                  onChange={(e) =>
                    updateTransform({ damageThresholdPct: Number(e.target.value) || 1 })
                  }
                />
              </div>
            </div>
            <p className="mt-3 text-xs text-mist">
              The race and derby sims read these: how a transform fires, what it costs,
              and how soon it can fire again.
            </p>
          </section>
        </div>
      </div>

      {/* Slot picker */}
      <section className="mt-6 border border-line bg-panel p-4 sm:p-6" aria-label="Part picker">
        <h2 className="font-mono text-xs tracking-widest text-mist uppercase">
          Parts — {mode === "racer" ? "Racer" : "Combat"} mode
        </h2>
        {registry ? (
          <div className="mt-4 flex flex-col gap-3">
            {SLOTS.map((slot) => {
              const parts = getPartsForSlot(registry, slot, mode);
              const equippedId = build.modes[mode][slot];
              const equipped = registry.parts[equippedId];
              const open = openSlot === slot;
              return (
                <div key={slot} className="border border-line">
                  <button
                    type="button"
                    onClick={() => setOpenSlot(open ? null : slot)}
                    aria-expanded={open}
                    className="flex w-full items-center justify-between gap-3 bg-ink px-4 py-3 text-left"
                  >
                    <span className="font-mono text-xs tracking-widest text-sodium uppercase">
                      {SLOT_LABELS[slot]}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-sm text-bone">
                      {equipped ? equipped.name : "—"}
                    </span>
                    <span className="font-mono text-xs text-mist">
                      {parts.length} part{parts.length === 1 ? "" : "s"} {open ? "▾" : "▸"}
                    </span>
                  </button>
                  {open ? (
                    <div className="grid gap-2 border-t border-line p-3 sm:grid-cols-2">
                      {parts.map((part) => (
                        <PartCard
                          key={part.id}
                          part={part}
                          equipped={part.id === equippedId}
                          onEquip={() => equip(slot, part)}
                        />
                      ))}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        ) : (
          <p className="mt-4 text-sm text-mist">
            {regError ? "The part registry didn't load." : "Loading parts…"}
          </p>
        )}
        {registry && registry.issues.length > 0 ? (
          <details className="mt-4 border border-line bg-panel-2 p-3">
            <summary className="cursor-pointer font-mono text-xs text-sodium">
              {registry.issues.length} part{registry.issues.length === 1 ? "" : "s"} failed to load
            </summary>
            <ul className="mt-2 space-y-1 font-mono text-xs text-mist">
              {registry.issues.map((issue) => (
                <li key={issue.url}>
                  {issue.url}: {issue.message}
                </li>
              ))}
            </ul>
          </details>
        ) : null}
      </section>

      {/* Save / load */}
      <section className="mt-6 border border-line bg-panel p-4 sm:p-6" aria-label="Saved builds">
        <h2 className="font-mono text-xs tracking-widest text-mist uppercase">Builds</h2>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <input
            className="field sm:max-w-xs"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Name this build"
            maxLength={60}
            aria-label="Build name"
          />
          <button type="button" className="btn btn-primary" onClick={doSave}>
            <Save className="size-4" aria-hidden="true" />
            Save build
          </button>
        </div>
        {mechs.length === 0 ? (
          <p className="mt-4 text-sm text-mist">No saved builds yet.</p>
        ) : (
          <ul className="mt-4 divide-y divide-line border-y border-line">
            {mechs.map((mech) => (
              <li key={mech.name} className="flex items-center gap-3 py-3">
                <div className="min-w-0 flex-1">
                  <p className="font-display text-lg font-bold text-bone">{mech.name}</p>
                  <p className="font-mono text-xs text-mist">
                    racer: {mech.build.modes.racer.torso} · combat: {mech.build.modes.combat.torso}
                  </p>
                </div>
                <button type="button" className="btn btn-ghost" onClick={() => doLoad(mech)}>
                  Load
                </button>
                <button
                  type="button"
                  className="btn btn-ghost"
                  aria-label={`Delete ${mech.name}`}
                  onClick={() => doDelete(mech.name)}
                >
                  <Trash2 className="size-4" aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-3 font-mono text-xs text-mist">
          Builds save to this device (localStorage). A build carries both modes plus its
          transformation rules.
        </p>
      </section>
    </main>
  );
}
