import { z } from "zod";

/**
 * Mecha part-system contract v1 (+ transform extension).
 *
 * A mech is MULTI-MODE: it carries one full 7-slot part set per mode and
 * transforms between them mid-competition (racer ↔ combat, more later).
 *
 * Seven slots per mode. arms / legs / shoulders are pairs — one part id
 * per slot covers both sides (the GLB carries both halves; the viewer
 * mirrors across the torso's _l / _r sockets).
 */

/** Combat forms a mech can take. Extend this tuple to add forms. */
export const MODES = ["racer", "combat"] as const;
export type MechMode = (typeof MODES)[number];

export const SLOTS = [
  "head",
  "torso",
  "arms",
  "legs",
  "shoulders",
  "backpack",
  "weapon",
] as const;
export type Slot = (typeof SLOTS)[number];

/**
 * Socket nodes every torso GLB must carry (named empty nodes).
 * A part's socket is where a child part's origin attaches.
 *
 * The weapon slot is a documented extension (see CONTRACT.md): the
 * socket list has no weapon mount, so arm parts carry
 * `socket_weapon_r` and the viewer mounts the weapon there, falling
 * back to the torso's `socket_arm_r`.
 */
export const SOCKET_FOR_SLOT: Record<Slot, string[]> = {
  head: ["socket_head"],
  torso: [], // torso is the root of the hierarchy
  arms: ["socket_arm_l", "socket_arm_r"],
  legs: ["socket_leg_l", "socket_leg_r"],
  shoulders: ["socket_shoulder_l", "socket_shoulder_r"],
  backpack: ["socket_back"],
  weapon: ["socket_weapon_r"],
};

/** Every socket name a torso GLB must define (contract v1). */
export const REQUIRED_TORSO_SOCKETS = [
  "socket_head",
  "socket_arm_l",
  "socket_arm_r",
  "socket_leg_l",
  "socket_leg_r",
  "socket_shoulder_l",
  "socket_shoulder_r",
  "socket_back",
] as const;

const partIdSchema = z
  .string()
  .min(1)
  .max(64)
  .regex(/^[a-z0-9-]+$/, "part id must be lowercase letters, digits and dashes");

export const partStatsSchema = z.object({
  armor: z.number().min(0).max(999),
  speed: z.number().min(0).max(999),
  power: z.number().min(0).max(999),
  weight: z.number().min(0).max(999),
});
export type PartStats = z.infer<typeof partStatsSchema>;

/**
 * One part manifest: public/mecha/parts/<part-id>/part.json
 * plus public/mecha/parts/<part-id>/<part-id>.glb
 *
 * `modes` lists the forms this part can be equipped in (default: both).
 * A mode-exclusive part (e.g. aero cowl = racer-only, ram plow =
 * combat-only) is rejected by build validation when placed in a mode
 * it doesn't support.
 *
 * Every part GLB's origin IS its attach point (e.g. a head's origin
 * sits at the neck joint where it meets socket_head).
 */
export const partSchema = z.object({
  id: partIdSchema,
  slot: z.enum(SLOTS),
  name: z.string().min(1).max(60),
  description: z.string().max(280),
  stats: partStatsSchema,
  modes: z.array(z.enum(MODES)).min(1).max(MODES.length).default(["racer", "combat"]),
  model: z
    .string()
    .min(1)
    .max(128)
    .regex(
      /^[a-z0-9-]+\.glb$/,
      "model must be the part's own glb file name, e.g. head-scout.glb",
    ),
});
export type PartManifest = z.infer<typeof partSchema>;

/** One mode's full part set: one part id per slot, every slot required. */
export const mechModeBuildSchema = z.object({
  head: partIdSchema,
  torso: partIdSchema,
  arms: partIdSchema,
  legs: partIdSchema,
  shoulders: partIdSchema,
  backpack: partIdSchema,
  weapon: partIdSchema,
});
export type MechModeBuild = z.infer<typeof mechModeBuildSchema>;

/** When a mech is allowed to transform. The race/battle sim consumes this. */
export const TRANSFORM_TRIGGERS = ["manual", "meter_full", "damage_threshold"] as const;
export type TransformTrigger = (typeof TRANSFORM_TRIGGERS)[number];

export const transformSchema = z.object({
  /**
   * manual: driver transforms on command.
   * meter_full: auto-transforms when the boost/drift meter fills (meter is consumed).
   * damage_threshold: auto-transforms when hull drops to damageThresholdPct.
   */
  trigger: z.enum(TRANSFORM_TRIGGERS).default("manual"),
  /** Meter (0-100, shared with boost) spent to transform. */
  cost: z
    .object({ meter: z.number().min(0).max(100).default(25) })
    .default({ meter: 25 }),
  /** Minimum seconds between transforms — stops mode-flicker exploits. */
  cooldownSec: z.number().min(0).max(120).default(8),
  /** Hull % at/below which the damage_threshold trigger fires. */
  damageThresholdPct: z.number().min(1).max(99).default(35),
});
export type TransformRules = z.infer<typeof transformSchema>;

/** Sensible defaults, balancing rationale in CONTRACT.md. */
export const DEFAULT_TRANSFORM: TransformRules = {
  trigger: "manual",
  cost: { meter: 25 },
  cooldownSec: 8,
  damageThresholdPct: 35,
};

/**
 * A full mech build: one part set per mode + the transformation rules.
 */
export const mechBuildSchema = z.object({
  modes: z.object({
    racer: mechModeBuildSchema,
    combat: mechModeBuildSchema,
  }),
  transform: transformSchema.default(DEFAULT_TRANSFORM),
});
export type MechBuild = z.infer<typeof mechBuildSchema>;

/** Parse helper in the repo's packs.ts style: throws a readable error. */
export function parsePartManifest(raw: string): PartManifest {
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    throw new Error("That text isn't JSON.");
  }
  const parsed = partSchema.safeParse(data);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    const path = issue?.path?.join(".") || "part";
    throw new Error(`${path}: ${issue?.message ?? "invalid part manifest"}`);
  }
  return parsed.data;
}

/** Parse helper for a build object: throws a readable error. */
export function parseMechBuild(data: unknown): MechBuild {
  const parsed = mechBuildSchema.safeParse(data);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    const path = issue?.path?.join(".") || "build";
    throw new Error(`${path}: ${issue?.message ?? "invalid mech build"}`);
  }
  return parsed.data;
}
