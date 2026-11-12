"""Run with Blender: blender --background --python scripts/create-navigation-hero.py

Creates an original low-poly airport traveler, a rigid weighted skeleton,
looping Idle/Walk clips, a clean GLB, and a staged Blender file + PNG preview.
No downloads, textures, add-ons, or existing scene changes are required.
"""
import bpy
import math
import json
from pathlib import Path
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "artifacts" / "navigation-hero"
OUT.mkdir(parents=True, exist_ok=True)
GLB = ROOT / "public" / "models" / "navigation-hero.glb"
GLB.parent.mkdir(parents=True, exist_ok=True)

# Start a new in-memory scene; never overwrite any existing source model.
bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
scene.unit_settings.system = 'METRIC'
scene.render.fps = 24
hero = bpy.data.collections.new("HERO_EXPORT")
scene.collection.children.link(hero)
stage = bpy.data.collections.new("PREVIEW_ONLY")
scene.collection.children.link(stage)

def move_collection(obj, collection):
    for c in list(obj.users_collection):
        c.objects.unlink(obj)
    collection.objects.link(obj)

def material(name, color, roughness=.65):
    m = bpy.data.materials.new(name)
    m.diffuse_color = (*color, 1)
    m.use_nodes = True
    bsdf = m.node_tree.nodes.get('Principled BSDF')
    bsdf.inputs['Base Color'].default_value = (*color, 1)
    bsdf.inputs['Roughness'].default_value = roughness
    return m

blue = material('Jacket / ocean blue', (.025, .32, .66))
navy = material('Trousers / midnight', (.025, .055, .11))
orange = material('Backpack / tangerine', (1, .29, .065))
skin = material('Skin / warm tan', (.64, .35, .19))
hair = material('Hair / espresso', (.043, .025, .018))
white = material('Sneakers / warm white', (.91, .94, .94))
dark = material('Eyes and soles', (.012, .023, .035))
teal = material('Lanyard / mint', (.08, .83, .68))
parts = []

def finish(obj, name, mat, bone):
    obj.name = name
    move_collection(obj, hero)
    obj.data.materials.append(mat)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    if bone:
        group = obj.vertex_groups.new(name=bone)
        group.add(list(range(len(obj.data.vertices))), 1, 'REPLACE')
    parts.append(obj)
    return obj

def box(name, pos, size, mat, bone, bevel=.025):
    bpy.ops.mesh.primitive_cube_add(size=1, location=pos)
    obj = bpy.context.object
    obj.scale = size
    finish(obj, name, mat, bone)
    if bevel:
        mod = obj.modifiers.new('Soft low-poly edges', 'BEVEL')
        mod.width = bevel
        mod.segments = 2
        bpy.ops.object.modifier_apply(modifier=mod.name)
    return obj

def sphere(name, pos, scale, mat, bone, sub=2):
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=sub, radius=1, location=pos)
    obj = bpy.context.object
    obj.scale = scale
    return finish(obj, name, mat, bone)

def limb(name, start, end, radius, mat, bone):
    a, b = Vector(start), Vector(end)
    bpy.ops.mesh.primitive_cone_add(vertices=8, radius1=radius * .88,
                                   radius2=radius, depth=(b-a).length,
                                   location=(a+b)/2)
    obj = bpy.context.object
    obj.rotation_mode = 'QUATERNION'
    obj.rotation_quaternion = (b-a).to_track_quat('Z', 'Y')
    return finish(obj, name, mat, bone)

# Blender Z-up, facing -Y. glTF export converts this to Y-up, facing +Z.
box('Jacket', (0, 0, 1.075), (.43, .28, .45), blue, 'Spine', .065)
box('Jacket hem', (0, 0, .87), (.40, .28, .08), blue, 'Hips')
box('Trousers waist', (0, 0, .79), (.34, .235, .16), navy, 'Hips')
limb('Neck', (0, 0, 1.28), (0, 0, 1.37), .075, skin, 'Head')
sphere('Head', (0, -.012, 1.515), (.205, .18, .225), skin, 'Head', 3)
sphere('Hair cap', (0, .008, 1.64), (.208, .18, .12), hair, 'Head')
box('Swept fringe', (-.045, -.155, 1.64), (.29, .065, .085), hair, 'Head', .025)
for side, x in [('L', .105), ('R', -.105)]:
    sphere('Eye.' + side, (x*.75, -.181, 1.54), (.018, .012, .024), dark, 'Head')
    sphere('Ear.' + side, (x*1.91, 0, 1.52), (.033, .044, .055), skin, 'Head')
sphere('Nose', (0, -.194, 1.485), (.029, .029, .035), skin, 'Head')
box('Smile', (0, -.178, 1.433), (.062, .012, .012), dark, 'Head', .005)

for side, sign in [('L', 1), ('R', -1)]:
    x = sign * .10
    limb('Thigh.'+side, (x, 0, .79), (x, 0, .45), .09, navy, 'Thigh.'+side)
    sphere('Knee.'+side, (x, 0, .45), (.077, .078, .079), navy, 'Shin.'+side)
    limb('Shin.'+side, (x, 0, .45), (x, 0, .12), .073, navy, 'Shin.'+side)
    box('Sneaker.'+side, (x, -.055, .083), (.15, .29, .12), white, 'Shin.'+side, .035)
    box('Sole.'+side, (x, -.055, .022), (.155, .29, .035), dark, 'Shin.'+side, .012)
    shoulder = (sign*.23, 0, 1.23)
    elbow = (sign*.29, 0, 1.035)
    wrist = (sign*.30, -.015, .85)
    sphere('Shoulder.'+side, shoulder, (.10, .105, .105), blue, 'UpperArm.'+side)
    limb('Sleeve.'+side, shoulder, elbow, .082, blue, 'UpperArm.'+side)
    limb('Forearm.'+side, elbow, wrist, .065, blue, 'Forearm.'+side)
    sphere('Hand.'+side, (sign*.30, -.015, .815), (.06, .06, .075), skin, 'Forearm.'+side)
    box('Backpack strap.'+side, (sign*.14, -.148, 1.15), (.043, .027, .31), orange, 'Spine', .009)

box('Backpack', (0, .215, 1.085), (.34, .18, .37), orange, 'Spine', .05)
box('Backpack pocket', (0, .32, 1.035), (.26, .045, .16), blue, 'Spine', .025)
box('Backpack handle', (0, .22, 1.305), (.13, .055, .05), navy, 'Spine', .015)
box('Jacket zipper', (0, -.147, 1.08), (.012, .012, .34), white, 'Spine', .003)
for x in [-.032, .032]:
    obj = box('Lanyard', (x, -.163, 1.18), (.012, .012, .20), teal, 'Spine', .003)
    obj.rotation_euler.y = -.18 if x > 0 else .18
box('Passenger badge', (0, -.178, 1.065), (.084, .018, .105), white, 'Spine', .009)
box('Badge stripe', (0, -.19, 1.083), (.059, .006, .018), blue, 'Spine', .002)

# One mesh, vertex colors supplied by a small material palette; no image textures.
bpy.ops.object.select_all(action='DESELECT')
for obj in parts:
    obj.select_set(True)
bpy.context.view_layer.objects.active = parts[0]
bpy.ops.object.join()
mesh = bpy.context.object
mesh.name = 'TravelerMesh'
scene.cursor.location = (0, 0, 0)
bpy.ops.object.origin_set(type='ORIGIN_CURSOR')

arm_data = bpy.data.armatures.new('TravelerSkeleton')
rig = bpy.data.objects.new('NavigationHero', arm_data)
hero.objects.link(rig)
bpy.context.view_layer.objects.active = rig
mesh.select_set(False)
rig.select_set(True)
bpy.ops.object.mode_set(mode='EDIT')
def bone(name, head, tail, parent=None):
    b = arm_data.edit_bones.new(name)
    b.head, b.tail = head, tail
    if parent:
        b.parent = arm_data.edit_bones[parent]
bone('Root', (0, 0, 0), (0, 0, .2))
bone('Hips', (0, 0, .79), (0, 0, .90), 'Root')
bone('Spine', (0, 0, .90), (0, 0, 1.29), 'Hips')
bone('Head', (0, 0, 1.29), (0, 0, 1.73), 'Spine')
for side, sign in [('L', 1), ('R', -1)]:
    bone('Thigh.'+side, (sign*.1, 0, .79), (sign*.1, 0, .45), 'Hips')
    bone('Shin.'+side, (sign*.1, 0, .45), (sign*.1, 0, .12), 'Thigh.'+side)
    bone('UpperArm.'+side, (sign*.23, 0, 1.23), (sign*.29, 0, 1.035), 'Spine')
    bone('Forearm.'+side, (sign*.29, 0, 1.035), (sign*.30, -.015, .85), 'UpperArm.'+side)
bpy.ops.object.mode_set(mode='OBJECT')
mod = mesh.modifiers.new('Traveler skin', 'ARMATURE')
mod.object = rig
mesh.parent = rig
rig.show_in_front = True
for p in rig.pose.bones:
    p.rotation_mode = 'XYZ'

def animate(name, duration):
    rig.animation_data_create()
    action = bpy.data.actions.new(name)
    action.use_fake_user = True
    rig.animation_data.action = action
    for frame in range(1, duration+2):
        phase = 2*math.pi*(frame-1)/duration
        for p in rig.pose.bones:
            p.rotation_euler = (0, 0, 0)
            p.location = (0, 0, 0)
        hips = rig.pose.bones['Hips']
        if name == 'Walk':
            # Hips' local Y is world Z. Both clips keep Root stationary.
            hips.location.y = .018*(1-math.cos(2*phase))
            rig.pose.bones['Spine'].rotation_euler.y = .035*math.sin(phase)
            for side, offset in [('L', 0), ('R', math.pi)]:
                swing = math.sin(phase+offset)
                rig.pose.bones['Thigh.'+side].rotation_euler.x = .40*swing
                rig.pose.bones['Shin.'+side].rotation_euler.x = -.58*max(0, -swing)
                rig.pose.bones['UpperArm.'+side].rotation_euler.x = -.30*swing
                rig.pose.bones['Forearm.'+side].rotation_euler.x = -.12
        else:
            hips.location.y = .008*math.sin(phase)
            rig.pose.bones['Spine'].rotation_euler.x = .012*math.sin(phase)
            rig.pose.bones['Head'].rotation_euler.y = .025*math.sin(phase)
        for p in rig.pose.bones:
            p.keyframe_insert('rotation_euler', frame=frame, group=p.name)
            p.keyframe_insert('location', frame=frame, group=p.name)
    # Linear baked keys make the loop seam predictable across glTF players.
    for layer in action.layers:
        for strip in layer.strips:
            for bag in strip.channelbags:
                for fc in bag.fcurves:
                    for key in fc.keyframe_points:
                        key.interpolation = 'LINEAR'
    return action

idle = animate('Idle', 64)
walk = animate('Walk', 32)
rig.animation_data.action = idle
scene.frame_start, scene.frame_end = 1, 65
scene.frame_set(1)
bpy.ops.object.select_all(action='DESELECT')
rig.select_set(True)
mesh.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(GLB), export_format='GLB',
    use_selection=True, export_animations=True, export_animation_mode='ACTIONS',
    export_frame_range=False, export_force_sampling=True, export_yup=True,
    export_cameras=False, export_lights=False)

# Presentation objects are created after exporting, so never enter the GLB.
floor_mat = material('Preview / slate', (.025, .055, .09))
bpy.ops.mesh.primitive_plane_add(size=200, location=(0, 0, -.009))
floor = bpy.context.object
floor.name = 'Preview ground (not exported)'
move_collection(floor, stage)
floor.data.materials.append(floor_mat)

def aim(obj, at):
    obj.rotation_euler = (Vector(at)-obj.location).to_track_quat('-Z', 'Y').to_euler()
bpy.ops.object.camera_add(location=(3.2, -5.5, 2.8))
camera = bpy.context.object
move_collection(camera, stage)
aim(camera, (0, 0, .88))
camera.data.type = 'ORTHO'
camera.data.ortho_scale = 2.55
scene.camera = camera
for name, pos, energy, size in [
    ('Key', (3, -4, 6), 650, 5),
    ('Fill', (-3, -2, 3), 450, 4),
    ('Rim', (1, 3, 4), 800, 3)]:
    bpy.ops.object.light_add(type='AREA', location=pos)
    light = bpy.context.object
    light.name = name
    light.data.energy, light.data.shape, light.data.size = energy, 'DISK', size
    aim(light, (0, 0, .9))
    move_collection(light, stage)
scene.world = bpy.data.worlds.new('Studio world')
scene.world.use_nodes = True
scene.world.node_tree.nodes['Background'].inputs[0].default_value = (.16, .21, .30, 1)
scene.world.node_tree.nodes['Background'].inputs[1].default_value = .4
scene.render.engine = 'CYCLES'
scene.cycles.samples = 32
scene.render.resolution_x, scene.render.resolution_y = 900, 900
scene.render.resolution_percentage = 100
scene.render.image_settings.file_format = 'PNG'
scene.view_settings.view_transform = 'AgX'
scene.render.filepath = str(OUT / 'navigation-hero-preview.png')
rig['usage'] = 'Idle/Walk; in-place. GLB: Y-up, +Z forward, origin at feet. No GPS logic.'
bpy.ops.object.select_all(action='DESELECT')
rig.select_set(True)
bpy.context.view_layer.objects.active = rig
for screen in bpy.data.screens:
    for area in screen.areas:
        if area.type == 'VIEW_3D':
            area.spaces.active.region_3d.view_distance = 3.5
            area.spaces.active.region_3d.view_location = (0, 0, .85)
bpy.ops.wm.save_as_mainfile(filepath=str(OUT / 'navigation-hero.blend'))
bpy.ops.render.render(write_still=True)
mesh.data.calc_loop_triangles()
report = {'vertices': len(mesh.data.vertices), 'triangles': len(mesh.data.loop_triangles),
          'bones': len(arm_data.bones), 'height_m': 1.76,
          'clips': ['Idle', 'Walk'], 'glb_bytes': GLB.stat().st_size}
(OUT / 'build-report.json').write_text(json.dumps(report, indent=2))
print('HERO_BUILD_OK', json.dumps(report))
