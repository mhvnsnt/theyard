# Mecha Part System — Contract v1 (+ transform extension)

Owner: **part-system lane**. Other lanes (viewer, customizer UI, sim) build
against this contract. Changes land here first, with the change documented
below. Code: `src/yard/mecha/` (`schemas.ts`, `parts.ts`, `stats.ts`,
`storage.ts`).

## Modes (transform extension, owner 2026-10-09)

Mechs **transform mid-competition**: vehicle/racer mode ↔ combat/derby mode
(more forms later — extend the `MODES` tuple in `schemas.ts`).
Inspirations: Evangelion, Gundam, Transformers, Bionicle, Gunpla,
Kamen Rider form changes, Power Rangers Zords. All designs original.

A build carries **one full 7-slot part set per mode**:

```ts
{
  modes: {
    racer:  { head, torso, arms, legs, shoulders, backpack, weapon },
    combat: { head, torso, arms, legs, shoulders, backpack, weapon },
  },
  transform: { trigger, cost: { meter }, cooldownSec, damageThresholdPct },
}
```

Validation runs **per mode independently**: every slot filled, every id in
the registry, part slot matches build slot, part supports the mode.

## Slots

`head` `torso` `arms` `legs` `shoulders` `backpack` `weapon`.
`arms` / `legs` / `shoulders` are pairs — one part id per slot covers both
sides (the GLB carries both halves; the viewer mirrors across the
torso's `_l` / `_r` sockets).

## Part manifest

`public/mecha/parts/<part-id>/part.json` + `<part-id>.glb`:

```json
{
  "id": "head-scout",
  "slot": "head",
  "name": "Scout Sensor Head",
  "description": "Light recon head.",
  "stats": { "armor": 4, "speed": 3, "power": 2, "weight": 3 },
  "modes": ["racer", "combat"],
  "model": "head-scout.glb"
}
```

- `id`: lowercase letters/digits/dashes, must match its directory name.
- `modes`: which forms the part equips in (default `["racer","combat"]`).
  Mode-exclusive parts are legal — e.g. aero cowl = racer-only,
  ram plow = combat-only — and build validation rejects them in modes
  they don't support.
- `model`: the part's own `.glb` file name. **Every part GLB's origin IS
  its attach point** (head origin at the neck joint, etc.).

Parts are discovered via `public/mecha/parts/index.json` (array of part
ids). One broken manifest never kills the registry — failures collect
into `registry.issues`.

## Socket convention

Torso GLBs carry named empty nodes:

```
socket_head, socket_arm_l, socket_arm_r, socket_leg_l, socket_leg_r,
socket_shoulder_l, socket_shoulder_r, socket_back
```

The viewer composes the hierarchy from these (`SOCKET_FOR_SLOT` in
`schemas.ts`).

**Documented extension — weapon mount:** the socket list has no weapon
mount, so **arm parts carry `socket_weapon_r`** and the viewer mounts the
weapon there, falling back to the torso's `socket_arm_r`.

## Stat formula

Computed **per mode** from that mode's part set:

- `armor = Σ armor`, `power = Σ power`, `weight = Σ weight`
- `speedRaw = Σ speed`
- `weightPenalty = 0.25 × weight`
- `speed = max(0, speedRaw − weightPenalty)`

Every 4 points of weight cost 1 point of speed. Heavy builds hit hard
but move slow; light builds keep pace. Rounded to 1 decimal.

## Transformation rules

```ts
transform: {
  trigger: "manual" | "meter_full" | "damage_threshold",  // default "manual"
  cost: { meter: 25 },        // meter (0–100, shared with boost) spent to transform
  cooldownSec: 8,             // min seconds between transforms
  damageThresholdPct: 35,     // hull % at/below which damage_threshold fires
}
```

**Balancing rationale** (why these numbers):

- Transforming is a power spike — fresh mode stats come online
  (racer → combat brings armor/power; combat → racer brings speed).
  It must cost something, or there's no reason not to run both modes
  maxed. The cost is **meter, the same resource boost uses** — spending
  it on a transform means not boosting. That's the core tradeoff.
- **25 meter ≈ one drift-boost** — meaningful, not build-defining.
- **8s cooldown ≈ two corners / one derby exchange** — stops
  mode-flickering (racer speed on straights + combat armor in every
  hit). Without it, optimal play is flicker spam.
- **damage_threshold at 35% hull** — the "last stand" transform: nearly
  wrecked in a race, you get one combat-form comeback window.
  Threshold-gated so it can't be hoarded for a planned alpha strike.
- **meter_full** — the reward loop for drift-heavy drivers: fill the
  meter, auto-transform, but the meter is consumed, so it still
  competitions with boost usage.

The race/battle sim consumes this later: on trigger condition AND
`meter >= cost.meter` AND cooldown elapsed → transform.

## Persistence

localStorage key **`yard.mechs.v1`**: `{ version: 1, builds: Record<name,
{ name, build, updatedAt }> }`. API: `saveMech(name, build)` /
`getMech(name)` / `listMechs()` / `deleteMech(name)` /
`subscribeMechs(cb)` / `ensureStarterMech()`. Corrupt entries drop out
on read (zod safeParse). The starter build (`"Starter Rig"`, seeded by
`ensureStarterMech()`) runs the scout set in racer mode and the bruiser
set in combat mode.

## Placeholder parts (parts lane fulfills the .glb files)

| id | slot | modes | role |
|---|---|---|---|
| head/torso/arms/legs/shoulders-scout | … | both | light racer set |
| backpack-afterburner | backpack | racer-only | mode-exclusive demo |
| weapon-scrapblade | weapon | both | light blade |
| head/torso/arms/legs/shoulders/backpack-bruiser | … | both | heavy combat set |
| weapon-siegeplow | weapon | combat-only | mode-exclusive demo |

## Changelog

- **2026-10-09 — transform extension (owner directive):** builds are now
  multi-mode (`modes.racer` / `modes.combat`); manifest gains `modes`;
  stats aggregate per mode; new `transform` rules schema with
  balancing rationale; storage + starter build updated. Weapon mount
  (`socket_weapon_r` on arm parts) documented as extension.
- **2026-10-09 — contract v1:** slots, manifest schema, socket
  convention, build shape, stat formula, persistence key.
