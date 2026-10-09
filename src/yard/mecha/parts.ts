import {
  MODES,
  SLOTS,
  parsePartManifest,
  type MechBuild,
  type MechMode,
  type MechModeBuild,
  type PartManifest,
  type Slot,
} from "./schemas.ts";

/**
 * The starter build — both modes. Racer mode runs the light scout set,
 * combat mode runs the heavy bruiser set. These ids are placeholders
 * the parts lane fulfills with real part.json + .glb files under
 * public/mecha/parts/.
 */
export const DEFAULT_BUILD: MechBuild = {
  modes: {
    racer: {
      head: "head-scout",
      torso: "torso-scout",
      arms: "arms-scout",
      legs: "legs-scout",
      shoulders: "shoulders-scout",
      backpack: "backpack-afterburner",
      weapon: "weapon-scrapblade",
    },
    combat: {
      head: "head-bruiser",
      torso: "torso-bruiser",
      arms: "arms-bruiser",
      legs: "legs-bruiser",
      shoulders: "shoulders-bruiser",
      backpack: "backpack-bruiser",
      weapon: "weapon-siegeplow",
    },
  },
  transform: {
    trigger: "manual",
    cost: { meter: 25 },
    cooldownSec: 8,
    damageThresholdPct: 35,
  },
};

/** Deep copy, mirroring the repo's clonePack convention. */
export function cloneBuild(build: MechBuild): MechBuild {
  return structuredClone(build);
}

/** Where manifests live, relative to the site root. */
export const PARTS_BASE = "/mecha/parts";

export type RegistryIssue = { url: string; message: string };

export type PartRegistry = {
  /** Keyed by manifest id. */
  parts: Record<string, PartManifest>;
  /** Manifests that failed to load or validate; everything else still loads. */
  issues: RegistryIssue[];
};

type FetchJson = (url: string) => Promise<unknown>;

async function defaultFetchJson(url: string): Promise<unknown> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

/**
 * Load every part manifest listed in <base>/index.json, validate each
 * with the zod part schema, and return the registry plus per-part issues.
 *
 * Throws only when index.json itself can't be fetched or parsed —
 * that's a deployment bug, not a bad part. Individual part failures
 * are collected into `issues` so one broken manifest never kills the
 * whole customizer.
 */
export async function loadPartRegistry(
  fetchJson: FetchJson = defaultFetchJson,
  base: string = PARTS_BASE,
): Promise<PartRegistry> {
  const indexUrl = `${base}/index.json`;
  let ids: unknown;
  try {
    ids = await fetchJson(indexUrl);
  } catch (err) {
    throw new Error(
      `Couldn't load the part index at ${indexUrl}: ${
        err instanceof Error ? err.message : "unknown error"
      }`,
    );
  }
  if (!Array.isArray(ids) || ids.some((id) => typeof id !== "string")) {
    throw new Error(`The part index at ${indexUrl} must be a JSON array of part ids.`);
  }

  const registry: PartRegistry = { parts: {}, issues: [] };
  await Promise.all(
    ids.map(async (id) => {
      const url = `${base}/${id}/part.json`;
      try {
        const raw = await fetchJson(url);
        const manifest = parsePartManifest(JSON.stringify(raw));
        if (manifest.id !== id) {
          registry.issues.push({
            url,
            message: `manifest id "${manifest.id}" doesn't match its directory "${id}"`,
          });
          return;
        }
        registry.parts[manifest.id] = manifest;
      } catch (err) {
        registry.issues.push({
          url,
          message: err instanceof Error ? err.message : "unknown error",
        });
      }
    }),
  );
  return registry;
}

export type BuildValidation = {
  ok: boolean;
  /** Human-readable problems, empty when ok. */
  issues: string[];
};

/**
 * Validate a build against a loaded registry, EACH MODE independently:
 * - every slot filled (the zod schema guarantees this for parsed builds)
 * - every part id exists in the registry
 * - every part's own slot matches the build slot it's placed in
 * - every part supports the mode it's placed in (mode-exclusivity)
 *
 * Pure function — easy to unit test, no I/O.
 */
export function validateBuild(build: MechBuild, registry: PartRegistry): BuildValidation {
  const issues: string[] = [];
  for (const mode of MODES) {
    issues.push(...validateModeBuild(mode, build.modes[mode], registry));
  }
  return { ok: issues.length === 0, issues };
}

export function validateModeBuild(
  mode: MechMode,
  modeBuild: MechModeBuild,
  registry: PartRegistry,
): string[] {
  const issues: string[] = [];
  for (const slot of SLOTS) {
    const id = modeBuild[slot];
    if (!id) {
      issues.push(`[${mode}] slot "${slot}" is empty`);
      continue;
    }
    const part = registry.parts[id];
    if (!part) {
      issues.push(`[${mode}] slot "${slot}": part "${id}" isn't in the registry`);
      continue;
    }
    if (part.slot !== slot) {
      issues.push(
        `[${mode}] slot "${slot}": part "${id}" is a "${part.slot}" part, not a "${slot}" part`,
      );
    }
    if (!part.modes.includes(mode)) {
      issues.push(
        `[${mode}] slot "${slot}": part "${id}" is ${part.modes.join("/")}‑only, can't equip in ${mode} mode`,
      );
    }
  }
  return issues;
}

export function isValidBuild(build: MechBuild, registry: PartRegistry): boolean {
  return validateBuild(build, registry).ok;
}

/** All parts for one slot usable in a mode, sorted by name. Pure. */
export function getPartsForSlot(
  registry: PartRegistry,
  slot: Slot,
  mode: MechMode,
): PartManifest[] {
  return Object.values(registry.parts)
    .filter((p) => p.slot === slot && p.modes.includes(mode))
    .sort((a, b) => a.name.localeCompare(b.name));
}

/** Slot coverage per mode: which slots have at least one part available. Pure. */
export function slotCoverage(registry: PartRegistry): Record<MechMode, Record<Slot, number>> {
  const coverage = {} as Record<MechMode, Record<Slot, number>>;
  for (const mode of MODES) {
    coverage[mode] = {} as Record<Slot, number>;
    for (const slot of SLOTS) {
      coverage[mode][slot] = getPartsForSlot(registry, slot, mode).length;
    }
  }
  return coverage;
}

/** Model file URL for a part, relative to the site root. */
export function partModelUrl(part: PartManifest, base: string = PARTS_BASE): string {
  return `${base}/${part.id}/${part.model}`;
}
