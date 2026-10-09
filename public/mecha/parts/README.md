# Mecha parts

Each `<part-id>/` directory holds that part's `part.json` manifest
(schema: `src/yard/mecha/schemas.ts`, contract: `src/yard/mecha/CONTRACT.md`).

## For the parts lane

Every directory still needs its **`<part-id>.glb`** model file.
Conventions the viewer depends on:

- The GLB's **origin IS the attach point** (head origin at the neck
  joint, arm origin at the shoulder joint, etc.).
- **Torso GLBs** must carry named empty nodes:
  `socket_head`, `socket_arm_l`, `socket_arm_r`, `socket_leg_l`,
  `socket_leg_r`, `socket_shoulder_l`, `socket_shoulder_r`, `socket_back`.
- **Arm-part GLBs** must carry `socket_weapon_r` (the weapon mount).
- `arms` / `legs` / `shoulders` GLBs carry **both halves** of the pair;
  the viewer mirrors across the torso's `_l` / `_r` sockets.

All designs original — biomechanical EVA-style inspiration, never copies.
