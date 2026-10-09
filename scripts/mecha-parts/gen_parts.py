"""
Mecha part kit generator (UI lane, v1 starter kit).

Builds 20 original stylized biomech parts with Blender headless and writes:
  public/mecha/parts/<part-id>/<part-id>.glb
  public/mecha/parts/<part-id>/part.json   (validated by src/yard/mecha/schemas.ts)
  public/mecha/parts/index.json            (array of part ids)

Mounting contract (see src/yard/mecha/viewer.ts):
- every part GLB's origin IS its attach point.
- torso parts carry the 8 required socket empties; arms parts carry
  `socket_weapon_r`. Canonical socket coordinates live in SOCKETS below
  and are shared by every torso so parts align across sets.

Run:
  env -u PYTHONPATH ~/workspace/tools/blender/blender-4.0.2-linux-x64/blender \
    -b --python scripts/mecha-parts/gen_parts.py
"""

import bpy
import json
import math
import os

REPO = "/home/hatch/workspace/game-sweep/theyard"
OUT = os.path.join(REPO, "public", "mecha", "parts")

# Canonical torso socket positions (torso space, meters). Shared by all torsos.
SOCKETS = {
    "socket_head": (0, 0.98, 0),
    "socket_arm_l": (-0.52, 0.78, 0),
    "socket_arm_r": (0.52, 0.78, 0),
    "socket_leg_l": (-0.24, -0.08, 0),
    "socket_leg_r": (0.24, -0.08, 0),
    "socket_shoulder_l": (-0.55, 0.92, 0),
    "socket_shoulder_r": (0.55, 0.92, 0),
    "socket_back": (0, 0.55, -0.34),
}

# ------------------------------------------------------------------ helpers

def clear_scene():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    # purge orphan meshes so files stay small
    for coll in (bpy.data.meshes, bpy.data.curves):
        for dat in list(coll):
            if dat.users == 0:
                coll.remove(dat)


def make_mat(name, color, metallic=0.0, roughness=0.5, emission=None, emission_strength=0.0):
    m = bpy.data.materials.get(name)
    if m:
        return m
    m = bpy.data.materials.new(name=name)
    m.use_nodes = True
    bsdf = m.node_tree.nodes["Principled BSDF"]
    bsdf.inputs["Base Color"].default_value = (*color, 1.0)
    bsdf.inputs["Metallic"].default_value = metallic
    bsdf.inputs["Roughness"].default_value = roughness
    if emission is not None:
        bsdf.inputs["Emission Color"].default_value = (*emission, 1.0)
        bsdf.inputs["Emission Strength"].default_value = emission_strength
    return m


MATS = {}


def init_mats():
    MATS["gunmetal"] = make_mat("mp_gunmetal", (0.23, 0.25, 0.28), metallic=0.85, roughness=0.42)
    MATS["dark"] = make_mat("mp_dark", (0.10, 0.11, 0.12), metallic=0.6, roughness=0.55)
    MATS["sodium"] = make_mat("mp_sodium", (0.94, 0.63, 0.01), metallic=0.3, roughness=0.4)
    MATS["bone"] = make_mat("mp_bone", (0.82, 0.85, 0.82), metallic=0.15, roughness=0.5)
    MATS["visor"] = make_mat("mp_visor", (0.05, 0.35, 0.45), metallic=0.2, roughness=0.25,
                             emission=(0.1, 0.8, 0.9), emission_strength=2.2)
    MATS["red"] = make_mat("mp_red", (0.48, 0.10, 0.08), metallic=0.4, roughness=0.45)
    MATS["glow"] = make_mat("mp_glow", (0.9, 0.55, 0.05), metallic=0.0, roughness=0.4,
                            emission=(1.0, 0.55, 0.05), emission_strength=3.0)


def assign(obj, mat):
    if obj.data and hasattr(obj.data, "materials"):
        if len(obj.data.materials) == 0:
            obj.data.materials.append(mat)
        else:
            obj.data.materials[0] = mat


def box(n, sx, sy, sz, loc, mat, rot=(0, 0, 0)):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc, rotation=rot)
    o = bpy.context.active_object
    o.name = n
    o.scale = (sx, sy, sz)
    assign(o, MATS[mat])
    return o


def cyl(n, r, h, loc, mat, axis="Z", seg=14):
    bpy.ops.mesh.primitive_cylinder_add(radius=r, depth=h, vertices=seg, location=loc)
    o = bpy.context.active_object
    o.name = n
    if axis == "X":
        o.rotation_euler = (0, math.pi / 2, 0)
    elif axis == "Y":
        o.rotation_euler = (math.pi / 2, 0, 0)
    assign(o, MATS[mat])
    return o


def sph(n, r, loc, mat, seg=14, ring=10):
    bpy.ops.mesh.primitive_uv_sphere_add(radius=r, segments=seg, ring_count=ring, location=loc)
    o = bpy.context.active_object
    o.name = n
    assign(o, MATS[mat])
    return o


def cone(n, r1, r2, h, loc, mat, axis="Z", seg=14):
    bpy.ops.mesh.primitive_cone_add(radius1=r1, radius2=r2, depth=h, vertices=seg, location=loc)
    o = bpy.context.active_object
    o.name = n
    if axis == "X":
        o.rotation_euler = (0, -math.pi / 2, 0)
    elif axis == "Y":
        o.rotation_euler = (math.pi / 2, 0, 0)
    assign(o, MATS[mat])
    return o


def torus(n, R, r, loc, mat, rot=(0, 0, 0)):
    bpy.ops.mesh.primitive_torus_add(major_radius=R, minor_radius=r,
                                     major_segments=20, minor_segments=12,
                                     location=loc, rotation=rot)
    o = bpy.context.active_object
    o.name = n
    assign(o, MATS[mat])
    return o


def empty(n, loc):
    bpy.ops.object.empty_add(type="PLAIN_AXES", location=loc)
    o = bpy.context.active_object
    o.name = n
    return o


def add_sockets():
    for name, loc in SOCKETS.items():
        empty(name, loc)


def export_part(part_id):
    d = os.path.join(OUT, part_id)
    os.makedirs(d, exist_ok=True)
    path = os.path.join(d, f"{part_id}.glb")
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.export_scene.gltf(
        filepath=path,
        export_format="GLB",
        use_selection=True,
        export_yup=True,
        export_apply=False,
        export_materials="EXPORT",
        export_cameras=False,
        export_lights=False,
    )
    size = os.path.getsize(path)
    print(f"  wrote {path} ({size // 1024} KB)")
    return size

# ------------------------------------------------------------------ builders
# Each builder constructs one part with its origin at the attach point.

def build_head_scout():
    box("cranium", 0.34, 0.30, 0.36, (0, 0.32, 0), "gunmetal")
    box("faceplate", 0.26, 0.20, 0.06, (0, 0.28, 0.18), "dark")
    box("visor", 0.22, 0.07, 0.03, (0, 0.33, 0.20), "visor")
    box("chin", 0.16, 0.10, 0.12, (0, 0.16, 0.10), "gunmetal")
    cyl("neck", 0.09, 0.14, (0, 0.05, 0), "dark")
    cyl("antenna", 0.012, 0.40, (0.15, 0.55, -0.05), "dark", seg=8)
    sph("antenna_tip", 0.02, (0.15, 0.76, -0.05), "sodium", seg=8, ring=6)
    box("ear_L", 0.05, 0.12, 0.14, (-0.19, 0.32, 0), "dark")
    box("ear_R", 0.05, 0.12, 0.14, (0.19, 0.32, 0), "dark")


def build_head_bruiser():
    box("cranium", 0.42, 0.36, 0.44, (0, 0.36, 0), "gunmetal")
    box("brow", 0.44, 0.12, 0.10, (0, 0.44, 0.18), "dark")
    box("visor", 0.30, 0.05, 0.03, (0, 0.36, 0.225), "visor")
    box("jaw_L", 0.08, 0.18, 0.20, (-0.19, 0.22, 0.08), "dark")
    box("jaw_R", 0.08, 0.18, 0.20, (0.19, 0.22, 0.08), "dark")
    box("vent", 0.20, 0.06, 0.24, (0, 0.57, -0.02), "dark")
    box("stripe", 0.44, 0.04, 0.02, (0, 0.50, 0.21), "red")
    cyl("neck", 0.11, 0.16, (0, 0.06, 0), "gunmetal")


def build_head_warden():
    box("cranium", 0.36, 0.32, 0.38, (0, 0.34, 0), "gunmetal")
    box("crest", 0.04, 0.30, 0.34, (0, 0.55, -0.02), "sodium")
    box("visor", 0.24, 0.08, 0.03, (0, 0.36, 0.19), "visor")
    box("cheek_L", 0.06, 0.16, 0.22, (-0.18, 0.28, 0.04), "bone")
    box("cheek_R", 0.06, 0.16, 0.22, (0.18, 0.28, 0.04), "bone")
    cyl("neck", 0.10, 0.15, (0, 0.05, 0), "dark")


def build_torso_scout():
    box("waist", 0.44, 0.28, 0.34, (0, 0.02, 0), "dark")
    box("chest", 0.56, 0.42, 0.44, (0, 0.42, 0), "gunmetal")
    box("chestplate", 0.40, 0.30, 0.06, (0, 0.44, 0.22), "bone")
    box("stripe", 0.42, 0.06, 0.02, (0, 0.52, 0.25), "sodium")
    box("vent_L", 0.10, 0.16, 0.04, (-0.16, 0.30, 0.23), "dark")
    box("vent_R", 0.10, 0.16, 0.04, (0.16, 0.30, 0.23), "dark")
    box("collar", 0.30, 0.10, 0.28, (0, 0.72, 0), "dark")
    box("pelvis", 0.40, 0.20, 0.32, (0, -0.06, 0), "gunmetal")
    cyl("pod_L", 0.09, 0.20, (-0.33, 0.30, 0), "dark", axis="X")
    cyl("pod_R", 0.09, 0.20, (0.33, 0.30, 0), "dark", axis="X")
    add_sockets()


def build_torso_bruiser():
    box("waist", 0.52, 0.30, 0.40, (0, 0.02, 0), "dark")
    box("chest", 0.72, 0.50, 0.56, (0, 0.44, 0), "gunmetal")
    box("frontarmor", 0.56, 0.40, 0.10, (0, 0.44, 0.28), "dark")
    box("chevron", 0.30, 0.08, 0.02, (0, 0.50, 0.335), "red")
    box("pec_L", 0.26, 0.20, 0.06, (-0.18, 0.58, 0.30), "gunmetal")
    box("pec_R", 0.26, 0.20, 0.06, (0.18, 0.58, 0.30), "gunmetal")
    box("collar", 0.36, 0.14, 0.34, (0, 0.76, 0), "dark")
    box("pelvis", 0.48, 0.22, 0.38, (0, -0.05, 0), "gunmetal")
    for i, (x, z) in enumerate([(-0.18, 0.18), (0.18, 0.18), (-0.18, -0.18), (0.18, -0.18)]):
        box(f"skirt_{i}", 0.16, 0.18, 0.04, (x, -0.14, z), "dark")
    add_sockets()


def build_torso_warden():
    box("waist", 0.46, 0.28, 0.36, (0, 0.02, 0), "dark")
    box("chest", 0.58, 0.44, 0.46, (0, 0.42, 0), "gunmetal")
    canopy = sph("canopy", 1.0, (0, 0.62, 0.08), "visor")
    canopy.scale = (0.30, 0.22, 0.26)
    box("frame_L", 0.05, 0.26, 0.05, (-0.16, 0.60, 0.16), "dark")
    box("frame_R", 0.05, 0.26, 0.05, (0.16, 0.60, 0.16), "dark")
    box("trim", 0.44, 0.05, 0.02, (0, 0.34, 0.24), "sodium")
    box("collar", 0.32, 0.10, 0.30, (0, 0.74, 0), "dark")
    box("pelvis", 0.42, 0.20, 0.34, (0, -0.06, 0), "gunmetal")
    add_sockets()


def _arms_common(s, heavy):
    x = 0.52 * s
    r = 0.11 if not heavy else 0.14
    sph(f"shoulder_{s}", r, (x, 0.02, 0), "dark")
    box(f"upper_{s}", 0.16 if not heavy else 0.22, 0.36, 0.18 if not heavy else 0.24,
        (x, -0.20, 0), "gunmetal")
    if heavy:
        box(f"uppershell_{s}", 0.08, 0.30, 0.28, (x + 0.06 * s, -0.18, 0), "dark")
    sph(f"elbow_{s}", 0.07 if not heavy else 0.08, (x, -0.40, 0), "dark")
    box(f"fore_{s}", 0.14 if not heavy else 0.20, 0.34, 0.15 if not heavy else 0.20,
        (x, -0.60, 0), "gunmetal")
    if heavy:
        box(f"gauntlet_{s}", 0.24, 0.22, 0.24, (x, -0.72, 0), "dark")
        box(f"knuckle_{s}", 0.20, 0.08, 0.10, (x, -0.80, 0.10), "red")
    else:
        box(f"fin_{s}", 0.02, 0.20, 0.10, (x, -0.60, -0.12), "sodium")
    box(f"fist_{s}", 0.13 if not heavy else 0.16, 0.14, 0.14 if not heavy else 0.16,
        (x, -0.82 if not heavy else -0.86, 0), "dark" if not heavy else "gunmetal")


def build_arms_scout():
    for s in (-1, 1):
        _arms_common(s, heavy=False)
    empty("socket_weapon_r", (0.52, -0.86, 0.10))


def build_arms_bruiser():
    for s in (-1, 1):
        _arms_common(s, heavy=True)
    empty("socket_weapon_r", (0.52, -0.90, 0.12))


def _legs_common(s, heavy):
    x = 0.24 * s
    sph(f"hip_{s}", 0.12, (x, -0.02, 0), "dark")
    tw = 0.20 if not heavy else 0.26
    box(f"thigh_{s}", tw, 0.55, 0.24 if not heavy else 0.30, (x, -0.38, 0), "gunmetal")
    if not heavy:
        box(f"thighplate_{s}", 0.22, 0.30, 0.05, (x, -0.35, 0.13), "bone")
    else:
        box(f"thighplate_{s}", 0.28, 0.34, 0.06, (x, -0.36, 0.15), "dark")
        box(f"thighstripe_{s}", 0.29, 0.06, 0.02, (x, -0.28, 0.18), "red")
    sph(f"knee_{s}", 0.09, (x, -0.70, 0.02), "dark")
    sw = 0.17 if not heavy else 0.23
    box(f"shin_{s}", sw, 1.00, 0.20 if not heavy else 0.26, (x, -1.26, 0), "gunmetal")
    if not heavy:
        box(f"shinguard_{s}", 0.19, 0.60, 0.06, (x, -1.20, 0.12), "sodium")
    else:
        box(f"shinguard_{s}", 0.25, 0.66, 0.07, (x, -1.22, 0.14), "dark")
    sph(f"ankle_{s}", 0.07, (x, -1.78, 0), "dark")
    fw = 0.20 if not heavy else 0.26
    box(f"foot_{s}", fw, 0.16 if not heavy else 0.18, 0.44 if not heavy else 0.50,
        (x, -1.87 if not heavy else -1.86, 0.10), "dark")
    box(f"toe_{s}", fw, 0.10, 0.12, (x, -1.90, 0.30 if not heavy else 0.33), "gunmetal")


def build_legs_scout():
    for s in (-1, 1):
        _legs_common(s, heavy=False)


def build_legs_bruiser():
    for s in (-1, 1):
        _legs_common(s, heavy=True)


def build_legs_roadster():
    # Racer-only wheel rig: hip block + strut + fork + wheel per side.
    for s in (-1, 1):
        x = 0.24 * s
        box(f"hip_{s}", 0.22, 0.30, 0.26, (x, -0.15, 0), "gunmetal")
        box(f"strut_{s}", 0.12, 0.90, 0.14, (x, -0.75, 0), "dark")
        box(f"fork_in_{s}", 0.05, 0.50, 0.10, (x - 0.09, -1.30, 0), "dark")
        box(f"fork_out_{s}", 0.05, 0.50, 0.10, (x + 0.09, -1.30, 0), "dark")
        torus(f"wheel_{s}", 0.29, 0.09, (x, -1.57, 0), "dark", rot=(0, math.pi / 2, 0))
        cyl(f"hub_{s}", 0.10, 0.16, (x, -1.57, 0), "sodium", axis="X", seg=10)
        box(f"fender_{s}", 0.30, 0.08, 0.50, (x, -1.28, 0), "gunmetal")
        box(f"fendertrim_{s}", 0.31, 0.03, 0.20, (x, -1.24, 0.10), "sodium")


def build_shoulders_scout():
    for s in (-1, 1):
        x = 0.55 * s
        box(f"guard_{s}", 0.24, 0.16, 0.26, (x, 0.10, 0), "gunmetal")
        box(f"trim_{s}", 0.25, 0.05, 0.27, (x, 0.02, 0), "sodium")


def build_shoulders_bruiser():
    for s in (-1, 1):
        x = 0.55 * s
        box(f"pauldron_{s}", 0.34, 0.26, 0.36, (x, 0.14, 0), "gunmetal")
        box(f"top_{s}", 0.30, 0.08, 0.32, (x, 0.30, 0), "dark")
        box(f"stripe_{s}", 0.31, 0.04, 0.10, (x, 0.22, 0.15), "red")


def build_shoulders_spiked():
    for s in (-1, 1):
        x = 0.55 * s
        box(f"base_{s}", 0.26, 0.18, 0.28, (x, 0.10, 0), "dark")
        for i, (dx, dz) in enumerate([(-0.07, -0.07), (0.07, -0.07), (0, 0.08)]):
            cone(f"spike_{s}_{i}", 0.045, 0.005, 0.22, (x + dx, 0.28, dz), "bone", seg=8)


def build_backpack_afterburner():
    box("housing", 0.50, 0.60, 0.30, (0, 0.10, -0.20), "gunmetal")
    for s in (-1, 1):
        cyl(f"bell_{s}", 0.11, 0.22, (0.16 * s, 0.10, -0.42), "dark", axis="Z")
        cyl(f"glow_{s}", 0.07, 0.04, (0.16 * s, 0.10, -0.52), "glow", axis="Z", seg=10)
        box(f"fin_{s}", 0.04, 0.30, 0.24, (0.27 * s, 0.20, -0.25), "sodium")
    box("intake", 0.30, 0.12, 0.20, (0, 0.44, -0.18), "dark")


def build_backpack_bruiser():
    box("housing", 0.62, 0.70, 0.36, (0, 0.12, -0.24), "dark")
    box("armorplate", 0.56, 0.60, 0.08, (0, 0.12, -0.44), "gunmetal")
    box("stripe", 0.57, 0.06, 0.02, (0, 0.30, -0.485), "red")
    for s in (-1, 1):
        cyl(f"drum_{s}", 0.12, 0.30, (0.20 * s, 0.30, -0.30), "gunmetal", axis="Z")
        box(f"bracket_{s}", 0.06, 0.40, 0.10, (0.32 * s, 0.10, -0.20), "dark")


def build_backpack_jumpjets():
    for s in (-1, 1):
        cyl(f"pod_{s}", 0.10, 0.55, (0.18 * s, 0.10, -0.20), "gunmetal")
        cone(f"nozzle_{s}", 0.10, 0.06, 0.14, (0.18 * s, -0.24, -0.20), "dark", seg=10)
        cyl(f"ring_{s}", 0.105, 0.04, (0.18 * s, 0.30, -0.20), "sodium", seg=10)
    box("crossbar", 0.48, 0.10, 0.12, (0, 0.32, -0.14), "dark")


def build_weapon_scrapblade():
    cyl("grip", 0.035, 0.22, (0, 0, 0), "dark", seg=10)
    box("guard", 0.10, 0.04, 0.16, (0, 0.10, 0), "gunmetal")
    box("blade", 0.025, 0.16, 0.85, (0, 0.16, 0.50), "bone")
    box("edge", 0.028, 0.05, 0.80, (0, 0.10, 0.48), "sodium")
    sph("pommel", 0.05, (0, -0.12, 0), "dark", seg=10, ring=8)


def build_weapon_siegeplow():
    box("body", 0.22, 0.24, 0.90, (0, 0.05, 0.35), "gunmetal")
    cyl("barrel", 0.07, 0.70, (0, 0.08, 0.95), "dark", axis="Z")
    cyl("muzzle", 0.10, 0.16, (0, 0.08, 1.30), "gunmetal", axis="Z")
    box("rail", 0.08, 0.06, 0.60, (0, 0.22, 0.40), "dark")
    box("grip", 0.08, 0.20, 0.10, (0, -0.12, 0.10), "dark")
    cyl("drum", 0.12, 0.14, (0, 0.02, -0.10), "red", axis="X")
    box("stock", 0.10, 0.14, 0.25, (0, 0.0, -0.25), "gunmetal")


def build_weapon_pulsegun():
    box("body", 0.14, 0.18, 0.55, (0, 0.06, 0.25), "gunmetal")
    box("shroud", 0.10, 0.12, 0.40, (0, 0.06, 0.65), "dark")
    cyl("cell", 0.05, 0.20, (0, 0.06, 0.55), "visor", axis="Z", seg=10)
    box("grip", 0.07, 0.18, 0.09, (0, -0.10, 0.12), "dark")
    box("sight", 0.04, 0.08, 0.06, (0, 0.20, 0.30), "sodium")

# ------------------------------------------------------------------ registry

PART_DEFS = [
    # id, slot, name, description, stats(armor,speed,power,weight), modes, builder
    ("head-scout", "head", "Scout Sensor Head",
     "Light sensor head with a ranging antenna and a wide cyan visor.",
     (10, 16, 8, 6), ["racer", "combat"], build_head_scout),
    ("head-bruiser", "head", "Bruiser Helm",
     "Heavy plated helm with a slit visor and armored jaw guards.",
     (18, 6, 8, 10), ["racer", "combat"], build_head_bruiser),
    ("head-warden", "head", "Warden Crest",
     "Command head with a sodium crest fin and bone cheek plates.",
     (14, 10, 10, 8), ["racer", "combat"], build_head_warden),
    ("torso-scout", "torso", "Scout Chassis",
     "Slim chassis with vented chest and a bone breastplate.",
     (14, 10, 8, 10), ["racer", "combat"], build_torso_scout),
    ("torso-bruiser", "torso", "Bruiser Chassis",
     "Heavy chassis with layered front armor and a war skirt.",
     (26, 4, 10, 18), ["racer", "combat"], build_torso_bruiser),
    ("torso-warden", "torso", "Warden Canopy",
     "Command chassis with an exposed pilot canopy and sodium trim.",
     (18, 8, 12, 14), ["racer", "combat"], build_torso_warden),
    ("arms-scout", "arms", "Scout Arms",
     "Light arm pair with forearm sensor fins. Carries the weapon mount.",
     (8, 12, 10, 8), ["racer", "combat"], build_arms_scout),
    ("arms-bruiser", "arms", "Bruiser Gauntlets",
     "Heavy arm pair with plated gauntlets and red knuckle guards.",
     (16, 4, 16, 14), ["racer", "combat"], build_arms_bruiser),
    ("legs-scout", "legs", "Runner Legs",
     "Digitigrade runner legs with sodium shin guards.",
     (10, 18, 8, 10), ["racer", "combat"], build_legs_scout),
    ("legs-bruiser", "legs", "Siege Legs",
     "Heavy siege legs with armored shins and wide stabilizer feet.",
     (20, 6, 12, 18), ["racer", "combat"], build_legs_bruiser),
    ("legs-roadster", "legs", "Roadster Wheel Rig",
     "Racer-only wheel rig: hip blocks, forks and twin drive wheels.",
     (8, 26, 6, 12), ["racer"], build_legs_roadster),
    ("shoulders-scout", "shoulders", "Scout Guards",
     "Compact shoulder guards with sodium trim.",
     (6, 6, 4, 4), ["racer", "combat"], build_shoulders_scout),
    ("shoulders-bruiser", "shoulders", "Bruiser Pauldrons",
     "Massive layered pauldrons with red war striping.",
     (14, 2, 8, 10), ["racer", "combat"], build_shoulders_bruiser),
    ("shoulders-spiked", "shoulders", "Spiked Pauldrons",
     "Dark pauldrons crowned with bone spikes.",
     (10, 4, 12, 8), ["racer", "combat"], build_shoulders_spiked),
    ("backpack-afterburner", "backpack", "Afterburner Pack",
     "Racer-only twin-thruster pack with glowing exhaust bells.",
     (4, 22, 6, 8), ["racer"], build_backpack_afterburner),
    ("backpack-bruiser", "backpack", "Siege Pack",
     "Armored rear pack with ammo drums and a bolted armor plate.",
     (14, 2, 8, 12), ["racer", "combat"], build_backpack_bruiser),
    ("backpack-jumpjets", "backpack", "Jump-Jet Pack",
     "Twin lift jets on a crossbar mount for quick repositioning.",
     (8, 16, 8, 10), ["racer", "combat"], build_backpack_jumpjets),
    ("weapon-scrapblade", "weapon", "Scrapblade",
     "Salvaged mono-blade with a sodium cutting edge.",
     (2, 8, 16, 6), ["racer", "combat"], build_weapon_scrapblade),
    ("weapon-siegeplow", "weapon", "Siege Plow Cannon",
     "Combat-only heavy cannon with a drum feed and long barrel.",
     (6, 2, 30, 16), ["combat"], build_weapon_siegeplow),
    ("weapon-pulsegun", "weapon", "Pulse Gun",
     "Energy sidearm with an exposed glowing power cell.",
     (2, 10, 20, 8), ["racer", "combat"], build_weapon_pulsegun),
]


def write_manifest(part_id, slot, name, description, stats, modes):
    armor, speed, power, weight = stats
    manifest = {
        "id": part_id,
        "slot": slot,
        "name": name,
        "description": description,
        "stats": {"armor": armor, "speed": speed, "power": power, "weight": weight},
        "modes": modes,
        "model": f"{part_id}.glb",
    }
    path = os.path.join(OUT, part_id, "part.json")
    with open(path, "w") as f:
        json.dump(manifest, f, indent=2)
        f.write("\n")


def main():
    init_mats()
    total_kb = 0
    for part_id, slot, name, desc, stats, modes, builder in PART_DEFS:
        print(f"building {part_id} ...")
        clear_scene()
        builder()
        total_kb += export_part(part_id)
        write_manifest(part_id, slot, name, desc, stats, modes)
    index = [p[0] for p in PART_DEFS]
    with open(os.path.join(OUT, "index.json"), "w") as f:
        json.dump(index, f, indent=2)
        f.write("\n")
    print(f"DONE: {len(PART_DEFS)} parts, {total_kb // 1024} KB total")


main()
