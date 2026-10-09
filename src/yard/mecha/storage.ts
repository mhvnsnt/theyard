import { z } from "zod";
import { DEFAULT_BUILD } from "./parts.ts";
import { mechBuildSchema, type MechBuild } from "./schemas.ts";

const KEY = "yard.mechs.v1";
const EVENT = "yard-mechs";

/** Name of the seeded starter build. */
export const STARTER_NAME = "Starter Rig";

const storedMechSchema = z.object({
  name: z.string().min(1).max(60),
  build: mechBuildSchema,
  updatedAt: z.string(),
});
export type StoredMech = z.infer<typeof storedMechSchema>;

const storeSchema = z.object({
  version: z.literal(1),
  builds: z.record(z.string(), storedMechSchema),
});
type MechStore = z.infer<typeof storeSchema>;

const EMPTY: StoredMech[] = [];

let cacheRaw: string | null = null;
let cacheList: StoredMech[] = EMPTY;

function storageAvailable() {
  return typeof localStorage !== "undefined";
}

function readStore(): MechStore {
  if (!storageAvailable()) return { version: 1, builds: {} };
  const raw = localStorage.getItem(KEY) ?? "";
  if (raw === cacheRaw) return storeFromList(cacheList);
  cacheRaw = raw;
  if (!raw) {
    cacheList = EMPTY;
    return { version: 1, builds: {} };
  }
  try {
    const parsed = storeSchema.safeParse(JSON.parse(raw));
    if (!parsed.success) {
      cacheList = EMPTY;
      return { version: 1, builds: {} };
    }
    cacheList = Object.values(parsed.data.builds);
    return parsed.data;
  } catch {
    cacheList = EMPTY;
    return { version: 1, builds: {} };
  }
}

function storeFromList(list: StoredMech[]): MechStore {
  const builds: Record<string, StoredMech> = {};
  for (const mech of list) builds[mech.name] = mech;
  return { version: 1, builds };
}

function write(list: StoredMech[]) {
  if (!storageAvailable()) {
    throw new Error("Mech storage isn't available here.");
  }
  cacheList = list;
  cacheRaw = JSON.stringify(storeFromList(list));
  localStorage.setItem(KEY, cacheRaw);
  window.dispatchEvent(new Event(EVENT));
}

const byUpdatedDesc = (a: StoredMech, b: StoredMech) =>
  b.updatedAt.localeCompare(a.updatedAt);

/** Test hook: clears the in-memory read cache. Not for app code. */
export function _resetMechCache() {
  cacheRaw = null;
  cacheList = EMPTY;
}

/** All saved named builds, newest first. Schema-validated; corrupt entries drop out. */
export function listMechs(): StoredMech[] {
  return Object.values(readStore().builds).sort(byUpdatedDesc);
}

export function getMech(name: string): StoredMech | undefined {
  return readStore().builds[name];
}

/**
 * Save a named build (creates or overwrites). The build is validated
 * with the zod mech build schema — throws a readable error on bad input.
 */
export function saveMech(name: string, build: MechBuild): StoredMech {
  const cleanName = name.trim().slice(0, 60);
  if (!cleanName) throw new Error("Give the mech a name first.");
  const parsed = mechBuildSchema.safeParse(build);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    const path = issue?.path?.join(".") || "build";
    throw new Error(`${path}: ${issue?.message ?? "invalid mech build"}`);
  }
  const mech: StoredMech = {
    name: cleanName,
    build: parsed.data,
    updatedAt: new Date().toISOString(),
  };
  const store = readStore();
  const next = { ...store.builds, [cleanName]: mech };
  write(Object.values(next));
  return mech;
}

export function deleteMech(name: string) {
  const store = readStore();
  if (!(name in store.builds)) return;
  const next = { ...store.builds };
  delete next[name];
  write(Object.values(next));
}

export function subscribeMechs(cb: () => void) {
  const on = () => cb();
  window.addEventListener(EVENT, on);
  window.addEventListener("storage", on);
  return () => {
    window.removeEventListener(EVENT, on);
    window.removeEventListener("storage", on);
  };
}

/**
 * Seed the starter build if it isn't saved yet. Idempotent — safe to
 * call on app boot. Returns the starter build entry.
 */
export function ensureStarterMech(): StoredMech {
  const existing = getMech(STARTER_NAME);
  if (existing) return existing;
  return saveMech(STARTER_NAME, DEFAULT_BUILD);
}
