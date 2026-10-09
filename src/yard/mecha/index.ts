/**
 * Mecha part system — the contract every theyard mecha lane builds against.
 *
 *   schemas.ts  types + zod schemas (slots, modes, part manifest, builds, transform rules)
 *   parts.ts    part registry (loads + validates public/mecha/parts), DEFAULT_BUILD,
 *               per-mode build validation, slot queries
 *   stats.ts    per-mode stat aggregation (weight penalizes speed)
 *   storage.ts  localStorage persistence for named multi-mode builds (yard.mechs.v1)
 *
 * Contract changes are documented in CONTRACT.md — read it before extending.
 */
export * from "./schemas.ts";
export * from "./parts.ts";
export * from "./stats.ts";
export * from "./storage.ts";
