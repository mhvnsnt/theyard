# QC renderer: part turntable views + assembled mech views (both modes)
import bpy, math, os, json
from mathutils import Vector

PARTS = os.environ.get('PARTS_OUT', '/home/hatch/workspace/game-sweep/theyard/public/mecha/parts')
QC = os.environ.get('QC_OUT', '/home/hatch/workspace/theyard-mecha-qc')
os.makedirs(QC, exist_ok=True)

def clear():
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)

def stage():
    clear()
    sc = bpy.context.scene
    sc.render.engine = 'CYCLES'
    sc.cycles.device = 'CPU'
    sc.cycles.samples = 16
    sc.cycles.use_denoising = False
    sc.render.resolution_x = 640; sc.render.resolution_y = 480
    sc.render.film_transparent = False
    # ground
    bpy.ops.mesh.primitive_plane_add(size=20, location=(0,0,0))
    g = bpy.context.active_object; g.name='ground'
    m = bpy.data.materials.new('groundm'); m.use_nodes=True
    bsdf = m.node_tree.nodes['Principled BSDF']
    bsdf.inputs['Base Color'].default_value=(0.09,0.09,0.10,1.0)
    bsdf.inputs['Roughness'].default_value=0.9
    g.data.materials.append(m)
    # lights
    bpy.ops.object.light_add(type='SUN', location=(3, -4, 6)); sun=bpy.context.active_object
    sun.data.energy = 3.0
    bpy.ops.object.light_add(type='AREA', location=(-3, 3, 4)); a=bpy.context.active_object
    a.data.energy=120; a.data.size=3
    bpy.ops.object.light_add(type='AREA', location=(0, 4, 2)); b=bpy.context.active_object
    b.data.energy=60; b.data.size=2
    bpy.ops.object.camera_add(location=(0,0,1)); cam=bpy.context.active_object
    sc.camera = cam
    return cam

def frame_cam(cam, objs, azim_deg, elev_deg, dist_mul=2.4, zoff=0.0):
    mn = Vector((1e9,)*3); mx = Vector((-1e9,)*3)
    for o in objs:
        if o.type not in ('MESH','CURVE'): continue
        for c in o.bound_box:
            w = o.matrix_world @ Vector(c)
            mn = Vector(map(min, mn, w)); mx = Vector(map(max, mx, w))
    center = (mn+mx)/2; center.z += zoff
    radius = max((mx-mn).x, (mx-mn).y, (mx-mn).z, 0.05)/2
    az = math.radians(azim_deg); el = math.radians(elev_deg)
    d = radius*dist_mul + 0.25
    cam.location = center + Vector((d*math.cos(el)*math.sin(az), d*math.cos(el)*math.cos(az), d*math.sin(el)))
    dv = center - cam.location
    cam.rotation_euler = dv.to_track_quat('-Z','Y').to_euler()

def import_part(pid):
    before = set(bpy.context.scene.objects)
    bpy.ops.import_scene.gltf(filepath=os.path.join(PARTS, pid, pid+'.glb'))
    return [o for o in bpy.context.scene.objects if o not in before]

def move_objs(objs, delta):
    for o in objs: o.location += Vector(delta)

T = Vector((0,0,1.10))
SOCK_LOCAL = {
 'socket_head': (0,0,0.42),
 'socket_arm_l': (0.40,0,0.26), 'socket_arm_r': (-0.40,0,0.26),
 'socket_leg_l': (0.20,0,0.02), 'socket_leg_r': (-0.20,0,0.02),
 'socket_shoulder_l': (0.46,0,0.30), 'socket_shoulder_r': (-0.46,0,0.30),
 'socket_back': (0,-0.30,0.22),
}
WEAPON_LOCAL = Vector((0,0.05,-0.60))  # socket_weapon in arm local

def assemble(spec):
    # spec: dict slot->pid ; returns all mesh objs
    allm = []
    tobjs = import_part(spec['torso']); move_objs(tobjs, T); allm += tobjs
    sock_world = {k: T+Vector(v) for k,v in SOCK_LOCAL.items()}
    arm_r_world = sock_world['socket_arm_r']
    for slot, pid in spec.items():
        if slot=='torso': continue
        objs = import_part(pid)
        if slot=='head': move_objs(objs, sock_world['socket_head'])
        elif slot=='arm':
            move_objs([o for o in objs], sock_world['socket_arm_l'])
            objs2 = import_part(pid); move_objs(objs2, sock_world['socket_arm_r'])
            objs += objs2
        elif slot=='leg':
            move_objs(objs, sock_world['socket_leg_l'])
            objs2 = import_part(pid); move_objs(objs2, sock_world['socket_leg_r'])
            objs += objs2
        elif slot=='shoulder':
            move_objs(objs, sock_world['socket_shoulder_l'])
            objs2 = import_part(pid); move_objs(objs2, sock_world['socket_shoulder_r'])
            objs += objs2
        elif slot=='backpack': move_objs(objs, sock_world['socket_back'])
        elif slot=='weapon': move_objs(objs, arm_r_world + WEAPON_LOCAL)
        allm += objs
    return allm

mode = os.environ.get('QC_MODE', 'part')
if mode == 'part':
    pid = os.environ['PART_ONLY']
    cam = stage()
    objs = import_part(pid)
    meshes = [o for o in objs if o.type=='MESH']
    frame_cam(cam, meshes, 40, 18)
    out = os.path.join(QC, f'part-{pid}.png')
    bpy.context.scene.render.filepath = out
    bpy.ops.render.render(write_still=True)
    print('RENDERED', out)
elif mode == 'mech':
    spec = json.loads(os.environ['MECH_SPEC'])
    tag = os.environ.get('MECH_TAG','mech')
    cam = stage()
    meshes = [o for o in assemble(spec) if o.type=='MESH']
    for view, az in (('front34',35),('back34',215)):
        frame_cam(cam, meshes, az, 12)
        out = os.path.join(QC, f'{tag}-{view}.png')
        bpy.context.scene.render.filepath = out
        bpy.ops.render.render(write_still=True)
        print('RENDERED', out)
