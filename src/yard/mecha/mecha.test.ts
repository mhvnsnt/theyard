import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  DEFAULT_BUILD,
  cloneBuild,
  getPartsForSlot,
  isValidBuild,
  loadPartRegistry,
  partModelUrl,
  slotCoverage,
  validateBuild,
  type PartRegistry,
} from "./parts.ts";
import {
  SPEED_WEIGHT_FACTOR,
  ZERO_STATS,
  aggregateBuildStats,
  aggregateModeStats,
} from "./stats.ts";
import {
  STARTER_NAME,
  _resetMechCache,
  deleteMech,
  ensureStarterMech,
  getMech,
  listMechs,
  saveMech,
} from "./storage.ts";
import {
  MODES,
  SLOTS,
  parseMechBuild,
  parsePartManifest,
  type MechBuild,
  type MechMode,
  type PartManifest,
  type Slot,
} from "./schemas.ts";

const KEY = "yard.mechs.v1";

/**
 * Deterministic mock registry with fixed stats — the formula tests must
 * not depend on whatever the parts lane ships in public/mecha/parts/.
 * (armor, speed, power, weight)
 */
function mockPart(
  id: string,
  slot: Slot,
  armor: number,
  speed: number,
  power: number,
  weight: number,
  modes: MechMode[] = ["racer", "combat"],
): PartManifest {
  return {
    id,
    slot,
    name: id,
    description: `${id} (test part)`,
    stats: { armor, speed, power, weight },
    modes,
    model: `${id}.glb`,
  };
}

function mockRegistry(): PartRegistry {
  const defs: Array<
    [string, Slot, number, number, number, number, MechMode[]?]
  > = [
    ["head-scout", "head", 4, 3, 2, 3],
    ["torso-scout", "torso", 10, 2, 3, 8],
    ["arms-scout", "arms", 5, 3, 6, 6],
    ["legs-scout", "legs", 6, 9, 3, 7],
    ["shoulders-scout", "shoulders", 5, 1, 2, 4],
    ["backpack-afterburner", "backpack", 2, 6, 4, 5, ["racer"]],
    ["weapon-scrapblade", "weapon", 1, 1, 10, 5],
    ["head-bruiser", "head", 8, 1, 3, 5],
    ["torso-bruiser", "torso", 15, 2, 5, 11],
    ["arms-bruiser", "arms", 9, 4, 10, 8],
    ["legs-bruiser", "legs", 11, 8, 5, 10],
    ["shoulders-bruiser", "shoulders", 8, 1, 3, 6],
    ["backpack-bruiser", "backpack", 6, 4, 6, 8],
    ["weapon-siegeplow", "weapon", 3, 0, 15, 9, ["combat"]],
  ];
  const parts: Record<string, PartManifest> = {};
  for (const [id, slot, armor, speed, power, weight, modes] of defs) {
    parts[id] = mockPart(id, slot, armor, speed, power, weight, modes);
  }
  return { parts, issues: [] };
}

/** Read the real shipped manifests off disk — cross-lane contract checks. */
async function diskFetch(url: string): Promise<unknown> {
  const rel = url.replace(/^\/mecha\/parts\//, "");
  const file = new URL(`../../../public/mecha/parts/${rel}`, import.meta.url);
  return JSON.parse(await readFile(file, "utf8"));
}

describe("part registry", () => {
  it("loads the shipped part index with no issues", async () => {
    const reg = await loadPartRegistry(diskFetch);
    assert.equal(reg.issues.length, 0, JSON.stringify(reg.issues));
    assert.ok(Object.keys(reg.parts).length > 0);
  });

  it("the starter build validates against the shipped parts", async () => {
    const reg = await loadPartRegistry(diskFetch);
    const v = validateBuild(DEFAULT_BUILD, reg);
    assert.equal(v.ok, true, v.issues.join("; "));
  });

  it("collects per-part failures instead of throwing", async () => {
    const reg = await loadPartRegistry(async (url: string) => {
      const good = (await diskFetch(url)) as Record<string, unknown>;
      if (url.endsWith("head-scout/part.json")) return { ...good, id: "head-impostor" };
      return good;
    });
    assert.equal(reg.issues.length, 1);
    assert.match(reg.issues[0].message, /doesn't match/);
    assert.ok(!("head-scout" in reg.parts));
    assert.ok("torso-scout" in reg.parts);
  });

  it("throws when the index itself is unreachable", async () => {
    await assert.rejects(
      loadPartRegistry(async () => {
        throw new Error("down");
      }),
      /part index/,
    );
  });

  it("throws when the index isn't an id array", async () => {
    await assert.rejects(
      loadPartRegistry(async () => ({ not: "an array" })),
      /array of part ids/,
    );
  });
});

describe("part manifest schema", () => {
  const base = {
    id: "head-test",
    slot: "head",
    name: "Test Head",
    description: "For tests.",
    stats: { armor: 1, speed: 2, power: 3, weight: 4 },
    model: "head-test.glb",
  };

  it("accepts a valid manifest and defaults modes to both", () => {
    const part = parsePartManifest(JSON.stringify(base));
    assert.deepEqual(part.modes, ["racer", "combat"]);
  });

  it("accepts a mode-exclusive part", () => {
    const part = parsePartManifest(JSON.stringify({ ...base, modes: ["combat"] }));
    assert.deepEqual(part.modes, ["combat"]);
  });

  it("rejects bad slot, negative stats, bad model name, empty modes", () => {
    assert.throws(
      () => parsePartManifest(JSON.stringify({ ...base, slot: "wing" })),
      /slot/,
    );
    assert.throws(
      () =>
        parsePartManifest(
          JSON.stringify({ ...base, stats: { ...base.stats, armor: -1 } }),
        ),
      /armor/,
    );
    assert.throws(
      () => parsePartManifest(JSON.stringify({ ...base, model: "x.png" })),
      /model/,
    );
    assert.throws(
      () => parsePartManifest(JSON.stringify({ ...base, modes: [] })),
      /modes/,
    );
    assert.throws(() => parsePartManifest("not json"), /isn't JSON/);
  });
});

describe("build schema", () => {
  it("requires every slot in every mode", () => {
    const build = cloneBuild(DEFAULT_BUILD);
    // @ts-expect-error - intentionally breaking the shape
    delete build.modes.racer.head;
    assert.throws(() => parseMechBuild(build), /head/);
  });

  it("applies transform defaults when omitted", () => {
    const build = parseMechBuild({ modes: cloneBuild(DEFAULT_BUILD).modes });
    assert.deepEqual(build.transform, {
      trigger: "manual",
      cost: { meter: 25 },
      cooldownSec: 8,
      damageThresholdPct: 35,
    });
  });

  it("fills partial transform rules with defaults", () => {
    const build = parseMechBuild({
      modes: cloneBuild(DEFAULT_BUILD).modes,
      transform: { trigger: "meter_full" },
    });
    assert.equal(build.transform.trigger, "meter_full");
    assert.equal(build.transform.cooldownSec, 8);
  });

  it("rejects unknown transform triggers", () => {
    assert.throws(
      () =>
        parseMechBuild({
          modes: cloneBuild(DEFAULT_BUILD).modes,
          transform: { trigger: "whenever" },
        }),
      /trigger/,
    );
  });
});

describe("build validation", () => {
  const registry = mockRegistry();

  it("accepts the starter build in both modes", () => {
    const v = validateBuild(DEFAULT_BUILD, registry);
    assert.equal(v.ok, true, v.issues.join("; "));
    assert.ok(isValidBuild(DEFAULT_BUILD, registry));
  });

  it("flags unknown part ids per mode", () => {
    const build = cloneBuild(DEFAULT_BUILD);
    build.modes.combat.head = "head-nope";
    const v = validateBuild(build, registry);
    assert.equal(v.ok, false);
    assert.ok(
      v.issues.some((i) => i.includes("[combat]") && i.includes("head-nope")),
    );
  });

  it("flags parts placed in the wrong slot", () => {
    const build = cloneBuild(DEFAULT_BUILD);
    build.modes.racer.head = "torso-scout";
    const v = validateBuild(build, registry);
    assert.equal(v.ok, false);
    assert.ok(v.issues.some((i) => i.includes("torso") && i.includes("head")));
  });

  it("flags mode-exclusive parts in the wrong mode", () => {
    const racerOnly = cloneBuild(DEFAULT_BUILD);
    racerOnly.modes.combat.backpack = "backpack-afterburner";
    const v1 = validateBuild(racerOnly, registry);
    assert.equal(v1.ok, false);
    assert.ok(v1.issues.some((i) => i.includes("racer") && i.includes("combat")));

    const combatOnly = cloneBuild(DEFAULT_BUILD);
    combatOnly.modes.racer.weapon = "weapon-siegeplow";
    const v2 = validateBuild(combatOnly, registry);
    assert.equal(v2.ok, false);
    assert.ok(v2.issues.some((i) => i.includes("combat") && i.includes("racer")));
  });

  it("getPartsForSlot filters by mode and sorts by name", () => {
    assert.deepEqual(
      getPartsForSlot(registry, "head", "racer").map((p) => p.id),
      ["head-bruiser", "head-scout"],
    );
    assert.deepEqual(
      getPartsForSlot(registry, "backpack", "racer").map((p) => p.id),
      ["backpack-afterburner", "backpack-bruiser"],
    );
    assert.deepEqual(
      getPartsForSlot(registry, "backpack", "combat").map((p) => p.id),
      ["backpack-bruiser"],
    );
  });

  it("slotCoverage reports per-mode counts", () => {
    const cov = slotCoverage(registry);
    assert.equal(cov.racer.backpack, 2);
    assert.equal(cov.combat.backpack, 1);
    for (const mode of MODES) {
      for (const slot of SLOTS) assert.ok(cov[mode][slot] >= 1, `${mode}.${slot}`);
    }
  });

  it("partModelUrl points at the part's own glb", () => {
    assert.equal(
      partModelUrl(registry.parts["head-scout"]),
      "/mecha/parts/head-scout/head-scout.glb",
    );
  });
});

describe("stat aggregation", () => {
  const registry = mockRegistry();
  const lookup = (id: string) => registry.parts[id];

  it("totals the starter racer mode (light/fast)", () => {
    const s = aggregateModeStats(DEFAULT_BUILD.modes.racer, lookup);
    assert.deepEqual(s, {
      armor: 33,
      speed: 15.5,
      power: 30,
      weight: 38,
      speedRaw: 25,
      weightPenalty: 9.5,
    });
  });

  it("totals the starter combat mode (heavy/slow)", () => {
    const s = aggregateModeStats(DEFAULT_BUILD.modes.combat, lookup);
    assert.deepEqual(s, {
      armor: 60,
      speed: 5.8,
      power: 47,
      weight: 57,
      speedRaw: 20,
      weightPenalty: 14.3, // 0.25 × 57 = 14.25, displayed rounded to 1 decimal
    });
  });

  it("aggregates both modes at once", () => {
    const both = aggregateBuildStats(DEFAULT_BUILD, lookup);
    assert.equal(both.racer.speed, 15.5);
    assert.equal(both.combat.speed, 5.8);
    assert.ok(both.combat.armor > both.racer.armor);
    assert.ok(both.racer.speed > both.combat.speed);
  });

  it("floors speed at 0 for absurd weight", () => {
    const heavy = mockPart("x", "torso", 0, 0, 0, 999);
    const build: MechBuild = {
      modes: {
        racer: { ...DEFAULT_BUILD.modes.racer, torso: "x" },
        combat: DEFAULT_BUILD.modes.combat,
      },
      transform: DEFAULT_BUILD.transform,
    };
    const s = aggregateModeStats(build.modes.racer, (id) =>
      id === "x" ? heavy : lookup(id),
    );
    assert.equal(s.speed, 0);
  });

  it("throws listing missing parts", () => {
    assert.throws(
      () => aggregateModeStats(DEFAULT_BUILD.modes.racer, () => undefined),
      /missing parts/,
    );
  });

  it("documents the weight factor and zero stats", () => {
    assert.equal(SPEED_WEIGHT_FACTOR, 0.25);
    assert.deepEqual(ZERO_STATS, {
      armor: 0,
      speed: 0,
      power: 0,
      weight: 0,
      speedRaw: 0,
      weightPenalty: 0,
    });
  });
});

type WindowStub = {
  dispatchEvent: (e: Event) => boolean;
  addEventListener: () => void;
  removeEventListener: () => void;
};

describe("mech storage", () => {
  let dispatched: string[];

  beforeEach(() => {
    dispatched = [];
    const store = new Map<string, string>();
    (globalThis as { localStorage?: unknown }).localStorage = {
      getItem: (k: string) => (store.has(k) ? (store.get(k) as string) : null),
      setItem: (k: string, v: string) => void store.set(k, v),
      removeItem: (k: string) => void store.delete(k),
      clear: () => store.clear(),
    };
    const win: WindowStub = {
      dispatchEvent: (e: Event) => {
        dispatched.push(e.type);
        return true;
      },
      addEventListener: () => {},
      removeEventListener: () => {},
    };
    (globalThis as { window?: unknown }).window = win;
    _resetMechCache();
  });

  afterEach(() => {
    delete (globalThis as { localStorage?: unknown }).localStorage;
    delete (globalThis as { window?: unknown }).window;
    _resetMechCache();
  });

  const raw = () =>
    (
      globalThis as { localStorage: { getItem: (k: string) => string | null } }
    ).localStorage.getItem(KEY);

  it("round-trips a named multi-mode build", () => {
    saveMech("My Rig", DEFAULT_BUILD);
    assert.ok(dispatched.includes("yard-mechs"));
    const got = getMech("My Rig");
    assert.ok(got);
    assert.deepEqual(got.build, DEFAULT_BUILD);
    assert.deepEqual(
      listMechs().map((m) => m.name),
      ["My Rig"],
    );
    const stored = JSON.parse(raw() as string);
    assert.equal(stored.version, 1);
    assert.ok(stored.builds["My Rig"].build.modes.combat);
  });

  it("overwrites a build saved under the same name", () => {
    saveMech("Rig", DEFAULT_BUILD);
    const alt = cloneBuild(DEFAULT_BUILD);
    alt.transform.cooldownSec = 3;
    saveMech("Rig", alt);
    assert.equal(listMechs().length, 1);
    assert.equal(getMech("Rig")?.build.transform.cooldownSec, 3);
  });

  it("deletes builds", () => {
    saveMech("Temp", DEFAULT_BUILD);
    deleteMech("Temp");
    assert.equal(getMech("Temp"), undefined);
    assert.deepEqual(listMechs(), []);
  });

  it("rejects empty names and invalid builds", () => {
    assert.throws(() => saveMech("   ", DEFAULT_BUILD), /name/);
    assert.throws(
      () =>
        saveMech(
          "Bad",
          { modes: { racer: {}, combat: {} } } as unknown as MechBuild,
        ),
      /head/,
    );
  });

  it("drops corrupt store JSON and invalid entries on read", () => {
    const ls = (
      globalThis as { localStorage: { setItem: (k: string, v: string) => void } }
    ).localStorage;
    ls.setItem(KEY, "not json{{{");
    _resetMechCache();
    assert.deepEqual(listMechs(), []);

    ls.setItem(
      KEY,
      JSON.stringify({
        version: 1,
        builds: { junk: { name: "junk", build: { nope: 1 } } },
      }),
    );
    _resetMechCache();
    assert.deepEqual(listMechs(), []);
  });

  it("seeds the starter build idempotently", () => {
    const first = ensureStarterMech();
    assert.equal(first.name, STARTER_NAME);
    assert.deepEqual(first.build, DEFAULT_BUILD);
    const second = ensureStarterMech();
    assert.deepEqual(second, first);
    assert.equal(listMechs().length, 1);
  });
});
