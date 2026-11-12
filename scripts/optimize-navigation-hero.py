"""Bake the traveler's material palette to vertex colors: one draw primitive.
Run in Blender after create-navigation-hero.py. Leaves the editable blend intact.
"""
import bpy
from pathlib import Path

root = Path(__file__).resolve().parents[1]
bpy.ops.wm.open_mainfile(filepath=str(root / 'artifacts/navigation-hero/navigation-hero.blend'))
mesh = bpy.data.objects['TravelerMesh']
colors = mesh.data.color_attributes.new(name='HeroColor', type='BYTE_COLOR', domain='CORNER')
palette = [tuple(m.diffuse_color) for m in mesh.data.materials]
for polygon in mesh.data.polygons:
    color = palette[polygon.material_index]
    for index in polygon.loop_indices:
        colors.data[index].color = color
    polygon.material_index = 0
mesh.data.materials.clear()
material = bpy.data.materials.new('Hero / vertex palette')
material.use_nodes = True
vertex = material.node_tree.nodes.new('ShaderNodeVertexColor')
vertex.layer_name = 'HeroColor'
shader = material.node_tree.nodes.get('Principled BSDF')
shader.inputs['Roughness'].default_value = .75
material.node_tree.links.new(vertex.outputs['Color'], shader.inputs['Base Color'])
mesh.data.materials.append(material)
bpy.ops.object.select_all(action='DESELECT')
mesh.select_set(True)
rig = bpy.data.objects['NavigationHero']
rig.select_set(True)
bpy.context.view_layer.objects.active = rig
bpy.ops.export_scene.gltf(filepath=str(root / 'public/models/navigation-hero.glb'),
    export_format='GLB', use_selection=True, export_animations=True,
    export_animation_mode='ACTIONS', export_frame_range=False,
    export_force_sampling=True, export_yup=True, export_cameras=False, export_lights=False)
print('HERO_OPTIMIZED_OK')
