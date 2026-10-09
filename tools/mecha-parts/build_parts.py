# Theyard mecha parts builder — Blender 4.0.2 headless
# ORIGINAL designs: EVA-inspired biomech language (ribbed organic plating over
# mechanical frames, hunched silhouettes, sinewy limbs) + demolition-derby grit.
# No EVA/Gundam/Bionicle likenesses, names, symbols, or color schemes.
import bpy, math, os, json

OUT = os.environ.get('PARTS_OUT', '/home/hatch/workspace/game-sweep/theyard/public/mecha/parts')
os.makedirs(OUT, exist_ok=True)

# ---------------- helpers ----------------
def clear():
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)

def _apply(obj, bevel_w=0.0, bevel_seg=1):
    bpy.ops.object.select_all(action='DESELECT')
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj
    if bevel_w > 0:
        m = obj.modifiers.new('bev', 'BEVEL')
        m.width = bevel_w; m.segments = bevel_seg; m.limit_method = 'ANGLE'
        bpy.ops.object.modifier_apply(modifier=m.name)
    bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)

def box(name, sx, sy, sz, x, y, z, mat=None, rx=0, ry=0, rz=0, bev=0.0):
    bpy.ops.mesh.primitive_cube_add(location=(x, y, z), rotation=(rx, ry, rz))
    o = bpy.context.active_object; o.name = name
    o.scale = (sx/2.0, sy/2.0, sz/2.0)
    _apply(o, bevel_w=bev)
    if mat: o.data.materials.append(mat)
    return o

def cyl(name, r, h, x, y, z, mat=None, verts=14, rx=0, ry=0, rz=0, bev=0.0):
    bpy.ops.mesh.primitive_cylinder_add(vertices=verts, radius=r, depth=h,
        location=(x, y, z), rotation=(rx, ry, rz))
    o = bpy.context.active_object; o.name = name
    _apply(o, bevel_w=bev)
    if mat: o.data.materials.append(mat)
    return o

def cone(name, r1, r2, h, x, y, z, mat=None, verts=14, rx=0, ry=0, rz=0):
    bpy.ops.mesh.primitive_cone_add(vertices=verts, radius1=r1, radius2=r2, depth=h,
        location=(x, y, z), rotation=(rx, ry, rz))
    o = bpy.context.active_object; o.name = name
    _apply(o)
    if mat: o.data.materials.append(mat)
    return o

def sph(name, r, x, y, z, mat=None, sx=1.0, sy=1.0, sz=1.0, u=12, v=8):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=u, ring_count=v, radius=r, location=(x, y, z))
    o = bpy.context.active_object; o.name = name
    o.scale = (sx, sy, sz)
    _apply(o)
    if mat: o.data.materials.append(mat)
    return o

def torus(name, R, r, x, y, z, mat=None, rx=0, ry=0, rz=0, major=16, minor=10):
    bpy.ops.mesh.primitive_torus_add(major_radius=R, minor_radius=r,
        major_segments=major, minor_segments=minor, location=(x, y, z), rotation=(rx, ry, rz))
    o = bpy.context.active_object; o.name = name
    _apply(o)
    if mat: o.data.materials.append(mat)
    return o

def sock(name, x, y, z):
    bpy.ops.object.empty_add(type='SPHERE', location=(x, y, z))
    o = bpy.context.active_object; o.name = name
    o.empty_display_size = 0.05
    return o

_MATS = {}
def M(name, color, metallic=0.5, roughness=0.5):
    if name in _MATS: return _MATS[name]
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    bsdf = m.node_tree.nodes['Principled BSDF']
    bsdf.inputs['Base Color'].default_value = (*color, 1.0)
    bsdf.inputs['Metallic'].default_value = metallic
    bsdf.inputs['Roughness'].default_value = roughness
    _MATS[name] = m
    return m

# palette: industrial derby grit, NO eva purple/green scheme
IRON   = ('iron',   (0.16,0.16,0.18), 0.80, 0.50)
STEEL  = ('steel',  (0.45,0.46,0.50), 0.85, 0.35)
RUST   = ('rust',   (0.50,0.25,0.10), 0.30, 0.70)
HAZ    = ('haz',    (0.95,0.62,0.05), 0.10, 0.60)
RUB    = ('rubber', (0.06,0.06,0.07), 0.00, 0.90)
BONE   = ('bone',   (0.72,0.66,0.55), 0.10, 0.55)   # organic plating
OILRED = ('oilred', (0.55,0.08,0.06), 0.40, 0.55)

def rivet_line(x0, x1, y, z, n, mat, r=0.012, axis='x'):
    for i in range(n):
        t = i/(n-1) if n > 1 else 0.5
        x = x0 + (x1-x0)*t if axis=='x' else x0
        sph(f'rivet', r, x, y, z, mat=mat, u=8, v=6)

def rib_stack(x, y, z0, z1, n, R, r, mat, taper=0.0):
    for i in range(n):
        t = i/(n-1) if n > 1 else 0.5
        z = z0 + (z1-z0)*t
        RR = R*(1.0 - taper*t)
        torus(f'rib{i}', RR, r, x, y, z, mat=mat, major=14, minor=8)

def piston(x, y, z0, z1, r_rod, r_sleeve, mat_rod, mat_sleeve):
    zm = (z0+z1)/2.0
    cyl('rod', r_rod, abs(z1-z0), x, y, zm, mat=mat_rod, verts=10)
    cyl('sleeve', r_sleeve, abs(z1-z0)*0.55, x, y, (z0+zm)/2.0, mat=mat_sleeve, verts=10)

def poly_count():
    return sum(len(o.data.polygons) for o in bpy.context.scene.objects if o.type == 'MESH')

def export_part(pid, slot, name, desc, modes, stats):
    d = os.path.join(OUT, pid); os.makedirs(d, exist_ok=True)
    fp = os.path.join(d, pid + '.glb')
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.export_scene.gltf(filepath=fp, use_selection=True, export_format='GLB',
        export_apply=True, export_yup=True, export_materials='EXPORT')
    tris = poly_count()
    manifest = {
        'id': pid, 'slot': slot, 'name': name, 'description': desc,
        'modes': modes,
        'stats': stats,
        'model': f'mecha/parts/{pid}/{pid}.glb',
        'tris': tris,
    }
    json.dump(manifest, open(os.path.join(d, 'part.json'), 'w'), indent=1)
    print(f'EXPORTED {pid} tris={tris}')
    return tris

# ============ HEADS (origin = neck attach, face +Y) ============
def b_head_hound():
    iron, steel, rust, haz, rub, bone, oil = (M(*IRON), M(*STEEL), M(*RUST), M(*HAZ), M(*RUB), M(*BONE), M(*OILRED))
    # neck ring
    cyl('neck', 0.075, 0.06, 0, 0, 0.03, mat=iron, verts=14)
    torus('neckring', 0.085, 0.014, 0, 0, 0.06, mat=steel, major=14, minor=8)
    # bestial elongated cowl: organic lump skull + jaw
    sph('skull', 0.10, 0, 0.01, 0.16, mat=bone, sx=1.0, sy=1.25, sz=1.0)
    sph('snout', 0.062, 0, 0.10, 0.115, mat=bone, sx=0.85, sy=1.3, sz=0.7)
    sph('jaw', 0.05, 0, 0.085, 0.055, mat=rust, sx=0.7, sy=1.15, sz=0.5)
    # brow plate with rivets
    box('brow', 0.15, 0.05, 0.055, 0, 0.085, 0.20, mat=steel, rx=-0.25, bev=0.008)
    rivet_line(-0.06, 0.06, 0.10, 0.215, 4, iron)
    # visor slit (glowing-ish hazard inset)
    box('visor', 0.11, 0.02, 0.028, 0, 0.105, 0.155, mat=haz)
    box('visorhood', 0.14, 0.03, 0.05, 0, 0.095, 0.175, mat=iron, rx=-0.2, bev=0.006)
    # exhaust nostrils
    cyl('nos_l', 0.014, 0.03, 0.035, 0.155, 0.10, mat=iron, verts=8, rx=1.2)
    cyl('nos_r', 0.014, 0.03, -0.035, 0.155, 0.10, mat=iron, verts=8, rx=1.2)
    # rear head cables
    for i, sx in enumerate([0.05, -0.05]):
        torus(f'cable{i}', 0.05, 0.012, sx, -0.09, 0.10, mat=rub, rx=0.5, major=12, minor=8)

def b_head_crown():
    iron, steel, rust, haz, rub, bone, oil = (M(*IRON), M(*STEEL), M(*RUST), M(*HAZ), M(*RUB), M(*BONE), M(*OILRED))
    cyl('neck', 0.08, 0.07, 0, 0, 0.035, mat=iron, verts=14)
    # riveted blocky cranium
    box('cranium', 0.19, 0.20, 0.17, 0, 0.0, 0.155, mat=steel, bev=0.012)
    rivet_line(-0.07, 0.07, 0.105, 0.20, 4, iron)
    rivet_line(-0.07, 0.07, 0.105, 0.12, 4, iron)
    # face grill
    box('grill', 0.11, 0.02, 0.09, 0, 0.10, 0.11, mat=iron, bev=0.004)
    for i in range(4):
        box(f'slat{i}', 0.10, 0.022, 0.012, 0, 0.10, 0.085+i*0.02, mat=rub)
    # optic band
    box('opticband', 0.16, 0.02, 0.035, 0, 0.095, 0.19, mat=iron)
    box('optic', 0.10, 0.022, 0.02, 0, 0.095, 0.19, mat=oil)
    # side plates + antenna stubs
    box('plate_l', 0.03, 0.16, 0.12, 0.105, 0.0, 0.15, mat=rust, bev=0.006)
    box('plate_r', 0.03, 0.16, 0.12, -0.105, 0.0, 0.15, mat=rust, bev=0.006)
    cyl('ant', 0.006, 0.09, 0.07, -0.05, 0.26, mat=iron, verts=6)

def b_head_dart():  # RACER exclusive
    iron, steel, rust, haz, rub, bone, oil = (M(*IRON), M(*STEEL), M(*RUST), M(*HAZ), M(*RUB), M(*BONE), M(*OILRED))
    cyl('neck', 0.06, 0.05, 0, 0, 0.025, mat=iron, verts=12)
    # sleek teardrop aero head
    sph('pod', 0.085, 0, 0.02, 0.13, mat=steel, sx=0.8, sy=1.5, sz=0.85)
    sph('nose', 0.05, 0, 0.13, 0.10, mat=steel, sx=0.7, sy=1.4, sz=0.6)
    # canopy visor
    sph('canopy', 0.055, 0, 0.075, 0.16, mat=haz, sx=0.75, sy=1.0, sz=0.55)
    # swept rear fin
    box('fin', 0.012, 0.16, 0.10, 0, -0.10, 0.19, mat=oil, rx=0.5, bev=0.004)
    # side intake slits
    box('intake_l', 0.02, 0.08, 0.03, 0.065, 0.05, 0.10, mat=iron)
    box('intake_r', 0.02, 0.08, 0.03, -0.065, 0.05, 0.10, mat=iron)

def b_head_maul():  # COMBAT exclusive
    iron, steel, rust, haz, rub, bone, oil = (M(*IRON), M(*STEEL), M(*RUST), M(*HAZ), M(*RUB), M(*BONE), M(*OILRED))
    cyl('neck', 0.095, 0.08, 0, 0, 0.04, mat=iron, verts=14)
    torus('neckring', 0.10, 0.018, 0, 0, 0.08, mat=rust, major=14, minor=8)
    # heavy jaw-crusher block
    box('block', 0.24, 0.22, 0.20, 0, 0.01, 0.18, mat=iron, bev=0.015)
    # armored cheeks
    box('cheek_l', 0.05, 0.16, 0.13, 0.125, 0.03, 0.16, mat=steel, bev=0.008)
    box('cheek_r', 0.05, 0.16, 0.13, -0.125, 0.03, 0.16, mat=steel, bev=0.008)
    rivet_line(-0.09, 0.09, 0.115, 0.24, 5, steel)
    # single cyclops optic under brow
    box('brow', 0.20, 0.06, 0.05, 0, 0.10, 0.245, mat=rust, rx=-0.3, bev=0.008)
    cyl('eye', 0.032, 0.03, 0, 0.115, 0.20, mat=oil, verts=12, rx=1.5708)
    # mouth crusher plates
    box('jawplate', 0.14, 0.03, 0.07, 0, 0.115, 0.10, mat=steel, bev=0.006)
    for i in range(3):
        box(f'tooth{i}', 0.03, 0.025, 0.03, -0.04+i*0.04, 0.115, 0.06, mat=haz)

# ============ TORSOS (origin = waist; MUST include socket empties) ============
def torso_sockets():
    sock('socket_head', 0, 0, 0.42)
    sock('socket_arm_l', 0.40, 0, 0.26); sock('socket_arm_r', -0.40, 0, 0.26)
    sock('socket_leg_l', 0.20, 0, 0.02); sock('socket_leg_r', -0.20, 0, 0.02)
    sock('socket_shoulder_l', 0.46, 0, 0.30); sock('socket_shoulder_r', -0.46, 0, 0.30)
    sock('socket_back', 0, -0.30, 0.22)

def b_torso_ribcage():
    iron, steel, rust, haz, rub, bone, oil = (M(*IRON), M(*STEEL), M(*RUST), M(*HAZ), M(*RUB), M(*BONE), M(*OILRED))
    # pelvis block
    box('pelvis', 0.34, 0.26, 0.20, 0, 0, -0.06, mat=iron, bev=0.015)
    rivet_line(-0.13, 0.13, 0.135, -0.02, 4, steel)
    # spine column, hunched forward
    cyl('spine', 0.055, 0.42, 0, 0.02, 0.22, mat=steel, verts=12, rx=0.12)
    # organic ribs over the frame
    rib_stack(0, 0.03, 0.10, 0.40, 5, 0.16, 0.020, bone, taper=0.25)
    # rib side plates (scrap welded)
    box('ribplate_l', 0.03, 0.14, 0.22, 0.17, 0.03, 0.25, mat=rust, rx=0.1, bev=0.006)
    box('ribplate_r', 0.03, 0.14, 0.22, -0.17, 0.03, 0.25, mat=rust, rx=0.1, bev=0.006)
    # engine fan in chest
    cyl('fanring', 0.085, 0.03, 0, 0.16, 0.30, mat=iron, verts=16, rx=1.5708)
    for i in range(3):
        box(f'fan{i}', 0.14, 0.015, 0.03, 0, 0.165, 0.30, mat=steel, rz=i*1.047)
    cyl('fanhub', 0.025, 0.05, 0, 0.165, 0.30, mat=haz, verts=10, rx=1.5708)
    # shoulder yoke bar
    cyl('yoke', 0.035, 0.86, 0, 0, 0.26, mat=iron, verts=10, ry=1.5708)
    torso_sockets()

def b_torso_pitmono():
    iron, steel, rust, haz, rub, bone, oil = (M(*IRON), M(*STEEL), M(*RUST), M(*HAZ), M(*RUB), M(*BONE), M(*OILRED))
    box('pelvis', 0.30, 0.24, 0.16, 0, 0, -0.05, mat=iron, bev=0.012)
    # mono frame: central keel
    box('keel', 0.12, 0.14, 0.42, 0, 0.02, 0.20, mat=steel, rx=0.06, bev=0.01)
    # organic chest shell over keel
    sph('chest', 0.16, 0, 0.04, 0.34, mat=bone, sx=1.15, sy=0.9, sz=0.85)
    # chest vents
    for i in range(3):
        box(f'vent{i}', 0.20, 0.02, 0.025, 0, 0.155, 0.26+i*0.05, mat=iron, rx=-0.15)
    # side pods
    sph('pod_l', 0.07, 0.20, 0.0, 0.28, mat=rust, sx=1, sy=1, sz=1.3)
    sph('pod_r', 0.07, -0.20, 0.0, 0.28, mat=rust, sx=1, sy=1, sz=1.3)
    cyl('yoke', 0.032, 0.82, 0, 0, 0.26, mat=iron, verts=10, ry=1.5708)
    rivet_line(-0.11, 0.11, 0.125, -0.03, 4, steel)
    torso_sockets()

def b_torso_aerowedge():  # RACER exclusive
    iron, steel, rust, haz, rub, bone, oil = (M(*IRON), M(*STEEL), M(*RUST), M(*HAZ), M(*RUB), M(*BONE), M(*OILRED))
    box('pelvis', 0.28, 0.22, 0.14, 0, 0, -0.05, mat=iron, bev=0.012)
    # streamlined wedge: nose low, tail high
    box('wedge', 0.30, 0.44, 0.20, 0, 0.05, 0.24, mat=steel, rx=-0.35, bev=0.02)
    sph('cockpit', 0.09, 0, 0.10, 0.30, mat=haz, sx=1.0, sy=1.3, sz=0.7)
    # aero strakes
    box('strake_l', 0.02, 0.30, 0.06, 0.16, 0.02, 0.20, mat=oil, rx=-0.3, bev=0.005)
    box('strake_r', 0.02, 0.30, 0.06, -0.16, 0.02, 0.20, mat=oil, rx=-0.3, bev=0.005)
    # rear diffuser
    for i in range(4):
        box(f'diff{i}', 0.03, 0.10, 0.08, -0.09+i*0.06, -0.16, 0.10, mat=iron, rx=0.4)
    cyl('yoke', 0.030, 0.78, 0, 0, 0.26, mat=iron, verts=10, ry=1.5708)
    torso_sockets()

def b_torso_siegeplate():  # COMBAT exclusive
    iron, steel, rust, haz, rub, bone, oil = (M(*IRON), M(*STEEL), M(*RUST), M(*HAZ), M(*RUB), M(*BONE), M(*OILRED))
    # heavy slab torso
    box('pelvis', 0.40, 0.30, 0.22, 0, 0, -0.07, mat=iron, bev=0.015)
    box('slab', 0.46, 0.34, 0.44, 0, 0.02, 0.24, mat=rust, bev=0.02)
    rivet_line(-0.18, 0.18, 0.195, 0.38, 6, steel)
    rivet_line(-0.18, 0.18, 0.195, 0.14, 6, steel)
    # boiler chest
    cyl('boiler', 0.11, 0.20, 0, 0.19, 0.28, mat=iron, verts=14, rx=1.5708)
    torus('boilerring', 0.11, 0.016, 0, 0.19, 0.28, mat=steel, rx=0, major=14, minor=8)
    cyl('gauge', 0.03, 0.02, 0.06, 0.20, 0.36, mat=haz, verts=10, rx=1.5708)
    # side exhaust
    cyl('exh', 0.035, 0.16, 0.24, -0.05, 0.30, mat=iron, verts=10)
    cone('exhflare', 0.035, 0.055, 0.05, 0.24, -0.05, 0.40, mat=rust, verts=10)
    # top yoke
    cyl('yoke', 0.04, 0.92, 0, 0, 0.26, mat=iron, verts=10, ry=1.5708)
    torso_sockets()

# ============ ARMS (origin = shoulder attach, hang -Z, X-symmetric) ============
def arm_weapon_socket():
    sock('socket_weapon', 0, 0.05, -0.60)

def b_arm_sinew():
    iron, steel, rust, haz, rub, bone, oil = (M(*IRON), M(*STEEL), M(*RUST), M(*HAZ), M(*RUB), M(*BONE), M(*OILRED))
    sph('delt', 0.085, 0, 0, -0.05, mat=bone, sx=1, sy=1, sz=1.2)
    # sinewy upper arm: tapered organic segments
    sph('bicep', 0.062, 0, 0, -0.20, mat=bone, sx=0.95, sy=0.95, sz=1.5)
    sph('forearm', 0.055, 0, 0.01, -0.40, mat=bone, sx=0.9, sy=0.9, sz=1.4)
    # exposed piston along the back
    piston(0, -0.055, -0.12, -0.42, 0.014, 0.024, steel, iron)
    # elbow joint
    cyl('elbow', 0.045, 0.07, 0, 0, -0.30, mat=iron, verts=10, ry=1.5708)
    # plated knuckle hand
    box('hand', 0.075, 0.09, 0.09, 0, 0.02, -0.53, mat=steel, bev=0.01)
    for i in range(3):
        box(f'fing{i}', 0.02, 0.025, 0.07, -0.025+i*0.025, 0.03, -0.60, mat=iron, bev=0.004)
    arm_weapon_socket()

def b_arm_wrecker():
    iron, steel, rust, haz, rub, bone, oil = (M(*IRON), M(*STEEL), M(*RUST), M(*HAZ), M(*RUB), M(*BONE), M(*OILRED))
    cyl('upper', 0.065, 0.22, 0, 0, -0.15, mat=rust, verts=12)
    rib_stack(0, 0, -0.06, -0.24, 3, 0.075, 0.014, iron)
    cyl('elbow', 0.05, 0.08, 0, 0, -0.30, mat=iron, verts=10, ry=1.5708)
    box('forearm', 0.09, 0.10, 0.20, 0, 0, -0.42, mat=steel, bev=0.01)
    rivet_line(-0.03, 0.03, 0.055, -0.42, 3, iron)
    # three-finger claw
    cyl('palm', 0.05, 0.06, 0, 0.01, -0.55, mat=iron, verts=10)
    for i, a in enumerate([-0.5, 0, 0.5]):
        cone(f'claw{i}', 0.018, 0.004, 0.11, math.sin(a)*0.05, 0.01+math.cos(a)*0.03, -0.63, mat=haz, verts=8, rx=0.35)
    arm_weapon_socket()

def b_arm_quickjack():  # RACER exclusive
    iron, steel, rust, haz, rub, bone, oil = (M(*IRON), M(*STEEL), M(*RUST), M(*HAZ), M(*RUB), M(*BONE), M(*OILRED))
    sph('delt', 0.06, 0, 0, -0.04, mat=steel, sx=1, sy=1, sz=1.1)
    cyl('upper', 0.042, 0.20, 0, 0, -0.16, mat=steel, verts=10)
    cyl('fore', 0.036, 0.20, 0, 0.01, -0.38, mat=steel, verts=10)
    # aero fin on forearm
    box('fin', 0.008, 0.10, 0.14, 0, -0.05, -0.38, mat=oil, rx=0.15, bev=0.003)
    sph('hand', 0.035, 0, 0.02, -0.52, mat=iron, sx=1, sy=1.2, sz=1.3)
    arm_weapon_socket()

def b_arm_pilearm():  # COMBAT exclusive
    iron, steel, rust, haz, rub, bone, oil = (M(*IRON), M(*STEEL), M(*RUST), M(*HAZ), M(*RUB), M(*BONE), M(*OILRED))
    box('upper', 0.13, 0.13, 0.24, 0, 0, -0.14, mat=iron, bev=0.012)
    rivet_line(-0.045, 0.045, 0.07, -0.10, 3, steel)
    box('fore', 0.15, 0.15, 0.24, 0, 0, -0.38, mat=rust, bev=0.012)
    rivet_line(-0.05, 0.05, 0.08, -0.34, 3, steel)
    # ram plate on forearm front
    box('ram', 0.16, 0.04, 0.14, 0, 0.085, -0.38, mat=steel, bev=0.008)
    cyl('fist', 0.055, 0.07, 0, 0.01, -0.54, mat=iron, verts=10)
    arm_weapon_socket()

# ============ LEGS (origin = hip attach, foot bottom at local z=-1.12) ============
def b_leg_stomp():
    iron, steel, rust, haz, rub, bone, oil = (M(*IRON), M(*STEEL), M(*RUST), M(*HAZ), M(*RUB), M(*BONE), M(*OILRED))
    sph('hip', 0.085, 0, 0, -0.04, mat=iron, sx=1.1, sy=1.1, sz=0.9)
    box('thigh', 0.15, 0.16, 0.30, 0, 0, -0.24, mat=rust, bev=0.015)
    rivet_line(-0.05, 0.05, 0.085, -0.20, 3, steel)
    # knee with tread-like guard
    cyl('knee', 0.06, 0.10, 0, 0, -0.44, mat=iron, verts=10, ry=1.5708)
    box('shinguard', 0.13, 0.05, 0.34, 0, 0.075, -0.66, mat=steel, bev=0.01)
    for i in range(4):
        box(f'tread{i}', 0.135, 0.02, 0.05, 0, 0.085, -0.55-i*0.075, mat=rub)
    cyl('shin', 0.055, 0.30, 0, -0.01, -0.66, mat=iron, verts=10)
    # hydraulic piston behind shin
    piston(0, -0.075, -0.48, -0.82, 0.016, 0.026, steel, iron)
    # wide foot pad, sole at -1.12
    box('foot', 0.17, 0.30, 0.09, 0, 0.05, -1.075, mat=iron, bev=0.012)
    box('toe', 0.17, 0.10, 0.07, 0, 0.22, -1.085, mat=steel, bev=0.01)
    box('sole', 0.18, 0.32, 0.02, 0, 0.05, -1.11, mat=rub)

def b_leg_sinew():
    iron, steel, rust, haz, rub, bone, oil = (M(*IRON), M(*STEEL), M(*RUST), M(*HAZ), M(*RUB), M(*BONE), M(*OILRED))
    sph('hip', 0.075, 0, 0, -0.03, mat=bone, sx=1, sy=1, sz=0.9)
    # sinewy digitigrade leg
    sph('thigh', 0.075, 0, 0.01, -0.25, mat=bone, sx=0.95, sy=1.0, sz=1.8)
    sph('calf', 0.06, 0, -0.03, -0.62, mat=bone, sx=0.9, sy=0.95, sz=1.7)
    # ribbed organic plating on thigh
    rib_stack(0, 0, -0.12, -0.36, 4, 0.085, 0.013, rust, taper=0.15)
    # exposed achilles piston
    piston(0, -0.08, -0.30, -0.66, 0.013, 0.022, steel, iron)
    # digitigrade foot: heel high, toe pad down
    box('ankle', 0.09, 0.10, 0.12, 0, -0.01, -0.85, mat=iron, bev=0.01)
    box('toeleg', 0.08, 0.09, 0.22, 0, 0.05, -0.99, mat=steel, rx=0.5, bev=0.01)
    box('toepad', 0.11, 0.20, 0.06, 0, 0.09, -1.09, mat=rub, bev=0.008)

def b_leg_sprinter():  # RACER exclusive
    iron, steel, rust, haz, rub, bone, oil = (M(*IRON), M(*STEEL), M(*RUST), M(*HAZ), M(*RUB), M(*BONE), M(*OILRED))
    sph('hip', 0.06, 0, 0, -0.03, mat=steel, sx=1, sy=1, sz=0.9)
    cyl('thigh', 0.055, 0.30, 0, 0, -0.22, mat=steel, verts=10)
    cyl('shin', 0.042, 0.42, 0, 0.01, -0.60, mat=steel, verts=10)
    # aero calf fairing
    box('fairing', 0.03, 0.16, 0.34, 0, -0.06, -0.62, mat=oil, rx=0.1, bev=0.008)
    # blade foot
    box('blade', 0.07, 0.26, 0.05, 0, 0.06, -1.095, mat=iron, bev=0.008)

def b_leg_tread():  # COMBAT exclusive
    iron, steel, rust, haz, rub, bone, oil = (M(*IRON), M(*STEEL), M(*RUST), M(*HAZ), M(*RUB), M(*BONE), M(*OILRED))
    box('hip', 0.17, 0.18, 0.14, 0, 0, -0.06, mat=iron, bev=0.012)
    box('thigh', 0.18, 0.19, 0.30, 0, 0, -0.26, mat=iron, bev=0.015)
    rivet_line(-0.065, 0.065, 0.10, -0.22, 4, steel)
    # twin hydraulic rams
    piston(0.05, -0.09, -0.30, -0.62, 0.018, 0.028, steel, rust)
    piston(-0.05, -0.09, -0.30, -0.62, 0.018, 0.028, steel, rust)
    box('shin', 0.19, 0.20, 0.34, 0, 0, -0.62, mat=rust, bev=0.015)
    for i in range(5):
        box(f'tread{i}', 0.20, 0.02, 0.045, 0, 0.105, -0.50-i*0.06, mat=rub)
    # massive tread-plate foot
    box('foot', 0.22, 0.36, 0.10, 0, 0.06, -1.07, mat=iron, bev=0.012)
    box('sole', 0.23, 0.38, 0.02, 0, 0.06, -1.11, mat=rub)

# ============ SHOULDERS (origin = shoulder socket, X-symmetric cap) ============
def b_sh_cowl():
    iron, steel, rust, haz, rub, bone, oil = (M(*IRON), M(*STEEL), M(*RUST), M(*HAZ), M(*RUB), M(*BONE), M(*OILRED))
    # ribbed organic shroud curving over the shoulder
    sph('cap', 0.11, 0, 0, 0.06, mat=bone, sx=1.15, sy=1.15, sz=0.9)
    rib_stack(0, 0, 0.0, 0.14, 3, 0.115, 0.013, rust)
    box('lip', 0.20, 0.05, 0.06, 0, 0.06, -0.03, mat=steel, bev=0.008)

def b_sh_rivetguard():
    iron, steel, rust, haz, rub, bone, oil = (M(*IRON), M(*STEEL), M(*RUST), M(*HAZ), M(*RUB), M(*BONE), M(*OILRED))
    box('plate', 0.22, 0.20, 0.05, 0, 0, 0.10, mat=steel, bev=0.01)
    rivet_line(-0.08, 0.08, 0.105, 0.10, 5, iron)
    box('skirt', 0.24, 0.22, 0.10, 0, 0, 0.02, mat=rust, bev=0.01)
    rivet_line(-0.09, 0.09, 0.115, 0.02, 5, iron)
    cyl('pin', 0.02, 0.06, 0, 0, -0.03, mat=iron, verts=8)

def b_sh_draftfin():  # RACER exclusive
    iron, steel, rust, haz, rub, bone, oil = (M(*IRON), M(*STEEL), M(*RUST), M(*HAZ), M(*RUB), M(*BONE), M(*OILRED))
    sph('cap', 0.07, 0, 0, 0.03, mat=steel, sx=1, sy=1, sz=0.8)
    box('fin', 0.012, 0.22, 0.16, 0, -0.08, 0.12, mat=oil, rx=0.35, bev=0.004)
    box('fin2', 0.012, 0.14, 0.10, 0, -0.05, 0.06, mat=haz, rx=0.35, bev=0.004)

def b_sh_bullbar():  # COMBAT exclusive
    iron, steel, rust, haz, rub, bone, oil = (M(*IRON), M(*STEEL), M(*RUST), M(*HAZ), M(*RUB), M(*BONE), M(*OILRED))
    box('plate', 0.20, 0.18, 0.12, 0, 0, 0.05, mat=iron, bev=0.012)
    # bullbar hoops facing forward
    torus('hoop1', 0.09, 0.016, 0, 0.10, 0.05, mat=steel, major=14, minor=8)
    torus('hoop2', 0.06, 0.014, 0, 0.135, 0.05, mat=steel, major=12, minor=8)
    box('cross', 0.20, 0.03, 0.03, 0, 0.10, 0.05, mat=steel)
    rivet_line(-0.07, 0.07, 0.095, 0.11, 4, haz)

# ============ BACKPACKS (origin = back socket, extends -Y) ============
def b_pk_stacks():
    iron, steel, rust, haz, rub, bone, oil = (M(*IRON), M(*STEEL), M(*RUST), M(*HAZ), M(*RUB), M(*BONE), M(*OILRED))
    box('frame', 0.24, 0.08, 0.30, 0, -0.05, 0.05, mat=iron, bev=0.01)
    for sx in [0.07, -0.07]:
        cyl(f'stack{sx}', 0.035, 0.34, sx, -0.06, 0.22, mat=rust, verts=12)
        torus(f'band{sx}', 0.038, 0.010, sx, -0.06, 0.14, mat=steel, major=12, minor=8)
        torus(f'band2{sx}', 0.038, 0.010, sx, -0.06, 0.28, mat=steel, major=12, minor=8)
        cone(f'flare{sx}', 0.035, 0.055, 0.06, sx, -0.06, 0.42, mat=iron, verts=12)
        # rain flap
        box(f'flap{sx}', 0.07, 0.02, 0.07, sx, -0.06, 0.47, mat=steel, rx=0.3, bev=0.004)

def b_pk_cage():
    iron, steel, rust, haz, rub, bone, oil = (M(*IRON), M(*STEEL), M(*RUST), M(*HAZ), M(*RUB), M(*BONE), M(*OILRED))
    # roll-cage frame over the back
    for sx in [0.14, -0.14]:
        cyl(f'up{sx}', 0.018, 0.44, sx, -0.10, 0.18, mat=steel, verts=8)
    cyl('topbar', 0.018, 0.30, 0, -0.10, 0.40, mat=steel, verts=8, ry=1.5708)
    for sz in [0.05, 0.30]:
        cyl(f'cross{sz}', 0.015, 0.30, 0, -0.10, sz, mat=steel, verts=8, ry=1.5708)
    # diagonal braces
    for sx in [0.14, -0.14]:
        box(f'brace{sx}', 0.025, 0.025, 0.34, sx, -0.10, 0.16, mat=rust, rx=0.0, rz=sx*2.0)
    box('mount', 0.20, 0.06, 0.10, 0, -0.03, -0.02, mat=iron, bev=0.008)

def b_pk_aerosail():  # RACER exclusive
    iron, steel, rust, haz, rub, bone, oil = (M(*IRON), M(*STEEL), M(*RUST), M(*HAZ), M(*RUB), M(*BONE), M(*OILRED))
    box('pylon', 0.06, 0.10, 0.22, 0, -0.08, 0.12, mat=iron, bev=0.008)
    # big spoiler sail
    box('sail', 0.44, 0.03, 0.20, 0, -0.14, 0.28, mat=oil, rx=-0.25, bev=0.008)
    box('sailstripe', 0.44, 0.032, 0.05, 0, -0.135, 0.24, mat=haz, rx=-0.25)
    box('endplate_l', 0.02, 0.12, 0.22, 0.22, -0.14, 0.28, mat=iron, rx=-0.25, bev=0.004)
    box('endplate_r', 0.02, 0.12, 0.22, -0.22, -0.14, 0.28, mat=iron, rx=-0.25, bev=0.004)

def b_pk_warrack():  # COMBAT exclusive
    iron, steel, rust, haz, rub, bone, oil = (M(*IRON), M(*STEEL), M(*RUST), M(*HAZ), M(*RUB), M(*BONE), M(*OILRED))
    box('frame', 0.30, 0.10, 0.36, 0, -0.08, 0.10, mat=iron, bev=0.012)
    # ammo drums
    for sx in [0.08, -0.08]:
        cyl(f'drum{sx}', 0.055, 0.14, sx, -0.15, 0.12, mat=rust, verts=12, rx=1.5708)
        torus(f'drumband{sx}', 0.057, 0.009, sx, -0.15, 0.12, mat=steel, major=12, minor=8)
    # spare spike rack
    for i in range(3):
        cyl(f'spike{i}', 0.012, 0.20, -0.10+i*0.10, -0.15, 0.32, mat=haz, verts=8)
    box('rackbar', 0.30, 0.04, 0.04, 0, -0.15, 0.24, mat=steel)

# ============ WEAPONS (origin = grip point) ============
def b_wp_sledge():
    iron, steel, rust, haz, rub, bone, oil = (M(*IRON), M(*STEEL), M(*RUST), M(*HAZ), M(*RUB), M(*BONE), M(*OILRED))
    cyl('haft', 0.025, 0.55, 0, 0, 0.20, mat=rust, verts=10)
    cyl('grip', 0.032, 0.12, 0, 0, -0.02, mat=rub, verts=10)
    # welded plate head
    box('head', 0.16, 0.16, 0.22, 0, 0, 0.52, mat=steel, bev=0.012)
    box('face_l', 0.17, 0.17, 0.05, 0, 0, 0.64, mat=iron, bev=0.008)
    box('face_r', 0.17, 0.17, 0.05, 0, 0, 0.40, mat=iron, bev=0.008)
    rivet_line(-0.05, 0.05, 0.085, 0.52, 3, iron)
    box('spike', 0.05, 0.05, 0.10, 0, 0, 0.70, mat=haz, bev=0.006)

def b_wp_ripper():
    iron, steel, rust, haz, rub, bone, oil = (M(*IRON), M(*STEEL), M(*RUST), M(*HAZ), M(*RUB), M(*BONE), M(*OILRED))
    box('motor', 0.12, 0.14, 0.16, 0, 0, 0.05, mat=iron, bev=0.01)
    cyl('grip', 0.028, 0.10, 0, -0.08, 0.0, mat=rub, verts=8, rx=1.5708)
    # chain bar
    box('bar', 0.03, 0.10, 0.50, 0, 0.02, 0.38, mat=steel, bev=0.006)
    for i in range(9):
        box(f'tooth{i}', 0.045, 0.03, 0.04, 0, 0.02, 0.18+i*0.05, mat=haz, bev=0.003)
    cyl('sprocket', 0.045, 0.12, 0, 0, 0.10, mat=oil, verts=10, ry=1.5708)

def b_wp_ramlance():  # RACER exclusive
    iron, steel, rust, haz, rub, bone, oil = (M(*IRON), M(*STEEL), M(*RUST), M(*HAZ), M(*RUB), M(*BONE), M(*OILRED))
    cyl('shaft', 0.022, 0.50, 0, 0, 0.22, mat=steel, verts=10)
    cyl('grip', 0.030, 0.12, 0, 0, -0.02, mat=rub, verts=8)
    # aero ram head
    cone('tip', 0.055, 0.008, 0.22, 0, 0, 0.58, mat=oil, verts=12)
    cyl('collar', 0.06, 0.06, 0, 0, 0.46, mat=iron, verts=12)
    # boost fins
    for sx in [0.05, -0.05]:
        box(f'boostfin{sx}', 0.008, 0.08, 0.14, sx, 0, 0.36, mat=haz, bev=0.003)
    # exhaust nozzle at butt
    cone('nozzle', 0.030, 0.045, 0.06, 0, 0, -0.10, mat=iron, verts=10)

def b_wp_pilespike():  # COMBAT exclusive
    iron, steel, rust, haz, rub, bone, oil = (M(*IRON), M(*STEEL), M(*RUST), M(*HAZ), M(*RUB), M(*BONE), M(*OILRED))
    box('housing', 0.14, 0.16, 0.34, 0, 0, 0.14, mat=iron, bev=0.012)
    rivet_line(-0.05, 0.05, 0.085, 0.10, 3, steel)
    cyl('pistonrod', 0.030, 0.22, 0, 0, 0.40, mat=steel, verts=10)
    cone('spike', 0.035, 0.006, 0.20, 0, 0, 0.60, mat=haz, verts=10)
    cyl('collar', 0.055, 0.08, 0, 0, 0.32, mat=rust, verts=10)
    # pressure gauge
    cyl('gauge', 0.025, 0.02, 0.075, 0, 0.14, mat=oil, verts=10, rz=1.5708)
    cyl('grip', 0.030, 0.12, 0, -0.09, 0.02, mat=rub, verts=8, rx=1.5708)

# ============ REGISTRY ============
PARTS = [
 # pid, slot, name, description, modes, stats, builder
 ('hound-vis','head','Hound Visor','Bestial cowl with a wide hazard visor slit, riveted brow and exhaust nostrils.',['racer','combat'],{'armor':4,'speed':7,'power':4,'weight':4},'b_head_hound'),
 ('scrap-crown','head','Scrap Crown','Riveted blocky cranium with a grilled face and cyclops optic band.',['racer','combat'],{'armor':6,'speed':5,'power':5,'weight':6},'b_head_crown'),
 ('dart-probe','head','Dart Probe','Sleek teardrop aero head with canopy and swept rear fin. Racer mode.',['racer'],{'armor':2,'speed':10,'power':3,'weight':2},'b_head_dart'),
 ('siege-maw','head','Siege Maw','Heavy jaw-crusher block head with armored cheeks and crusher teeth. Combat mode.',['combat'],{'armor':9,'speed':2,'power':6,'weight':9},'b_head_maul'),
 ('ribcage-core','torso','Ribcage Core','Exposed ribbed organic core over a hunched spine column with an engine fan.',['racer','combat'],{'armor':5,'speed':6,'power':6,'weight':5},'b_torso_ribcage'),
 ('pit-mono','torso','Pit Mono','Central keel frame with an organic chest shell and vented side pods.',['racer','combat'],{'armor':4,'speed':8,'power':5,'weight':4},'b_torso_pitmono'),
 ('aero-wedge','torso','Aero Wedge','Streamlined wedge cockpit torso with strakes and a rear diffuser. Racer mode.',['racer'],{'armor':3,'speed':10,'power':4,'weight':3},'b_torso_aerowedge'),
 ('siege-plate','torso','Siege Plate','Heavy riveted slab armor with a boiler chest and side exhaust. Combat mode.',['combat'],{'armor':10,'speed':2,'power':5,'weight':10},'b_torso_siegeplate'),
 ('sinew-arm','arm','Sinew Arm','Sinewy biomech arm with an exposed piston and a plated knuckle hand.',['racer','combat'],{'armor':5,'speed':6,'power':7,'weight':5},'b_arm_sinew'),
 ('wrecker-claw','arm','Wrecker Claw','Heavy arm ending in a three-finger wrecker claw.',['racer','combat'],{'armor':7,'speed':4,'power':8,'weight':7},'b_arm_wrecker'),
 ('quickjack-arm','arm','Quickjack Arm','Slim finned pit-crew arm built for speed. Racer mode.',['racer'],{'armor':3,'speed':10,'power':4,'weight':3},'b_arm_quickjack'),
 ('pile-arm','arm','Pile Arm','Armored heavy arm with a forearm ram plate. Combat mode.',['combat'],{'armor':9,'speed':2,'power':8,'weight':9},'b_arm_pilearm'),
 ('derby-stomp','leg','Derby Stomp','Wide plated legs with tread shin guards and a hydraulic piston.',['racer','combat'],{'armor':6,'speed':5,'power':7,'weight':6},'b_leg_stomp'),
 ('sinew-stilt','leg','Sinew Stilt','Digitigrade sinewy legs with ribbed plating and an exposed achilles piston.',['racer','combat'],{'armor':5,'speed':7,'power':5,'weight':5},'b_leg_sinew'),
 ('street-sprinter','leg','Street Sprinter','Slim runner legs with an aero calf fairing and blade feet. Racer mode.',['racer'],{'armor':3,'speed':10,'power':3,'weight':3},'b_leg_sprinter'),
 ('crusher-tread','leg','Crusher Tread','Massive tread-plate legs on twin hydraulic rams. Combat mode.',['combat'],{'armor':9,'speed':3,'power':6,'weight':9},'b_leg_tread'),
 ('cowl-shroud','shoulder','Cowl Shroud','Ribbed organic shroud curving over the shoulder.',['racer','combat'],{'armor':5,'speed':5,'power':3,'weight':5},'b_sh_cowl'),
 ('rivet-guard','shoulder','Rivet Guard','Riveted plate guard with a scrap skirt.',['racer','combat'],{'armor':6,'speed':4,'power':3,'weight':6},'b_sh_rivetguard'),
 ('draft-fin','shoulder','Draft Fin','Aero fin shoulder for slipstream speed. Racer mode.',['racer'],{'armor':2,'speed':9,'power':1,'weight':2},'b_sh_draftfin'),
 ('bullbar-guard','shoulder','Bullbar Guard','Forward bullbar hoops over heavy plate. Combat mode.',['combat'],{'armor':8,'speed':3,'power':4,'weight':8},'b_sh_bullbar'),
 ('stack-pipes','backpack','Stack Pipes','Twin exhaust stacks with bands, flares and rain flaps.',['racer','combat'],{'armor':4,'speed':5,'power':6,'weight':5},'b_pk_stacks'),
 ('cage-rig','backpack','Cage Rig','Roll-cage frame bolted over the back.',['racer','combat'],{'armor':6,'speed':4,'power':3,'weight':6},'b_pk_cage'),
 ('aero-sail','backpack','Aero Sail','Big spoiler sail with endplates for downforce. Racer mode.',['racer'],{'armor':2,'speed':9,'power':3,'weight':3},'b_pk_aerosail'),
 ('war-rack','backpack','War Rack','Ammo drums and a spare spike rack. Combat mode.',['combat'],{'armor':7,'speed':3,'power':7,'weight':7},'b_pk_warrack'),
 ('scrap-sledge','weapon','Scrap Sledge','Welded-plate sledgehammer with a spike poll.',['racer','combat'],{'armor':2,'speed':5,'power':9,'weight':7},'b_wp_sledge'),
 ('ripper-chain','weapon','Ripper Chain','Motor-driven chain bar with hazard teeth.',['racer','combat'],{'armor':1,'speed':7,'power':8,'weight':5},'b_wp_ripper'),
 ('ram-lance','weapon','Ram Lance','Streamlined boost lance with an aero ram head. Racer mode.',['racer'],{'armor':1,'speed':9,'power':6,'weight':4},'b_wp_ramlance'),
 ('pile-spike','weapon','Pile Spike','Piston-driven spike driver. Combat mode.',['combat'],{'armor':3,'speed':4,'power':10,'weight':7},'b_wp_pilespike'),
]

def main():
    only = os.environ.get('PART_ONLY')
    results = {}
    for pid, slot, name, desc, modes, stats, builder in PARTS:
        if only and pid != only:
            continue
        clear()
        globals()[builder]()
        tris = export_part(pid, slot, name, desc, modes, stats)
        results[pid] = tris
    summ = os.path.join(os.path.dirname(OUT), 'build_summary.json')
    json.dump(results, open(summ, 'w'), indent=1)
    over = [k for k, v in results.items() if v > 8000]
    print(f'DONE parts={len(results)} over_8k={over}')

main()
