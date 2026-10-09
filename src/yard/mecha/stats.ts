import {
  MODES,
  SLOTS,
  type MechBuild,
  type MechMode,
  type MechModeBuild,
  type PartManifest,
} from "./schemas.ts";

/**
 * STAT FORMULA (contract v1)
 * -------------------------
 * Stats aggregate PER MODE — a mech has racer stats and combat stats,
 * computed independently from that mode's part set.
 *
 * Per-part stats add up straight:
 *
 *   armor  = Σ armor   (damage soak for demolition derby / combat)
 *   power  = Σ power   (weapon damage + shove force)
 *   weight = Σ weight  (chassis mass)
 *
 * Speed is the sum of the parts' speed ratings MINUS a weight penalty:
 *
 *   speedRaw      = Σ speed
 *   weightPenalty = SPEED_WEIGHT_FACTOR × weight
 *   speed         = max(0, speedRaw − weightPenalty)
 *
 * SPEED_WEIGHT_FACTOR = 0.25 — every 4 points of weight cost 1 point of
 * speed. Heavy armor/weapon builds hit hard but move slow; light scout
 * builds keep their pace. Speed floors at 0 (a mech can't go negative).
 *
 * All values round to one decimal for display; the raw sums stay exact
 * internally via speedRaw / weightPenalty.
 */

export const SPEED_WEIGHT_FACTOR = 0.25;

export type MechStats = {
  armor: number;
  /** Post-penalty speed — the number the game uses. */
  speed: number;
  power: number;
  weight: number;
  /** Σ of part speed ratings before the penalty. */
  speedRaw: number;
  /** SPEED_WEIGHT_FACTOR × weight. */
  weightPenalty: number;
};

const round1 = (n: number) => Math.round(n * 10) / 10;

/**
 * Total one mode's stats from a part lookup. Pure function.
 *
 * Throws listing the missing part ids — run validateBuild() first and
 * only aggregate builds that pass, or catch and show the message.
 */
export function aggregateModeStats(
  modeBuild: MechModeBuild,
  lookup: (id: string) => PartManifest | undefined,
): MechStats {
  const missing: string[] = [];
  let armor = 0;
  let speedRaw = 0;
  let power = 0;
  let weight = 0;
  for (const slot of SLOTS) {
    const part = lookup(modeBuild[slot]);
    if (!part) {
      missing.push(`${slot}:"${modeBuild[slot]}"`);
      continue;
    }
    armor += part.stats.armor;
    speedRaw += part.stats.speed;
    power += part.stats.power;
    weight += part.stats.weight;
  }
  if (missing.length > 0) {
    throw new Error(`Can't total stats — missing parts: ${missing.join(", ")}`);
  }
  const weightPenalty = SPEED_WEIGHT_FACTOR * weight;
  return {
    armor: round1(armor),
    speed: round1(Math.max(0, speedRaw - weightPenalty)),
    power: round1(power),
    weight: round1(weight),
    speedRaw: round1(speedRaw),
    weightPenalty: round1(weightPenalty),
  };
}

/** Total every mode of a build: { racer: MechStats, combat: MechStats }. Pure. */
export function aggregateBuildStats(
  build: MechBuild,
  lookup: (id: string) => PartManifest | undefined,
): Record<MechMode, MechStats> {
  const out = {} as Record<MechMode, MechStats>;
  for (const mode of MODES) {
    out[mode] = aggregateModeStats(build.modes[mode], lookup);
  }
  return out;
}

/** Zeroed stats for when no build is equipped yet. */
export const ZERO_STATS: MechStats = {
  armor: 0,
  speed: 0,
  power: 0,
  weight: 0,
  speedRaw: 0,
  weightPenalty: 0,
};
