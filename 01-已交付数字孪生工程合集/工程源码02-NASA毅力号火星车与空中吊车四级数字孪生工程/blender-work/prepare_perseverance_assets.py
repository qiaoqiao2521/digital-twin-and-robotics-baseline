import bpy
import bmesh
import os
import math
import mathutils

BASE_DIR = "/home/muqiao/projects/muqiao-media-studio/productions/spacecraft-digital-twin-20261109"
RAW_GLB = os.path.join(BASE_DIR, "blender-work/source_raw/perseverance_raw.glb")
OUT_MODELS = os.path.join(BASE_DIR, "public/models")
OUT_RENDERS = os.path.join(BASE_DIR, "blender-work/renders")

os.makedirs(OUT_MODELS, exist_ok=True)
os.makedirs(OUT_RENDERS, exist_ok=True)


def split_left_right_mesh(obj_name, left_name, right_name):
    """Separate disjoint Port (-X) and Starboard (+X) mesh geometry cleanly."""
    obj = bpy.data.objects.get(obj_name)
    if not obj or obj.type != 'MESH':
        return
    obj_r = obj.copy()
    obj_r.data = obj.data.copy()
    bpy.context.collection.objects.link(obj_r)

    obj.name = left_name
    obj_r.name = right_name

    # Left / Port: keep world X < 0 (delete world X > 0)
    mw_l = obj.matrix_world.copy()
    bm_l = bmesh.new()
    bm_l.from_mesh(obj.data)
    faces_to_del_l = [f for f in bm_l.faces if (mw_l @ f.calc_center_median()).x > 0.0]
    bmesh.ops.delete(bm_l, geom=faces_to_del_l, context='FACES')
    bmesh.ops.remove_doubles(bm_l, verts=bm_l.verts, dist=0.00001)
    bm_l.to_mesh(obj.data)
    bm_l.free()

    # Right / Starboard: keep world X >= 0 (delete world X <= 0)
    mw_r = obj_r.matrix_world.copy()
    bm_r = bmesh.new()
    bm_r.from_mesh(obj_r.data)
    faces_to_del_r = [f for f in bm_r.faces if (mw_r @ f.calc_center_median()).x <= 0.0]
    bmesh.ops.delete(bm_r, geom=faces_to_del_r, context='FACES')
    bmesh.ops.remove_doubles(bm_r, verts=bm_r.verts, dist=0.00001)
    bm_r.to_mesh(obj_r.data)
    bm_r.free()


def load_and_prepare():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=RAW_GLB)

    # Remove NASA artist helper Icosphere at origin
    ico = bpy.data.objects.get("Icosphere")
    if ico:
        bpy.data.objects.remove(ico, do_unlink=True)

    # Unmute NLA tracks and advance to Frame 60 where the Remote Sensing Mast (SuperCam)
    # and Robotic Arm are deployed into operational Mars surface configuration
    for o in bpy.data.objects:
        if o.animation_data:
            for t in o.animation_data.nla_tracks:
                t.mute = False
                if len(t.strips) > 0 and not o.animation_data.action:
                    o.animation_data.action = t.strips[0].action

    bpy.context.scene.frame_set(60)
    bpy.context.view_layer.update()

    # Bake any armature-deformed mesh at Frame 60 into static mesh data
    depsgraph = bpy.context.evaluated_depsgraph_get()
    for o in list(bpy.data.objects):
        if o.type == 'MESH' and len(o.modifiers) > 0:
            eval_obj = o.evaluated_get(depsgraph)
            new_mesh = bpy.data.meshes.new_from_object(eval_obj)
            o.modifiers.clear()
            o.data = new_mesh

    # Preserve world transforms and clear all parent hierarchies + animation data
    world_matrices = {o.name: o.matrix_world.copy() for o in bpy.data.objects if o.type == 'MESH'}
    for o in list(bpy.data.objects):
        if o.animation_data:
            o.animation_data_clear()
    for o in list(bpy.data.objects):
        if o.type == 'MESH':
            o.parent = None
            o.matrix_world = world_matrices[o.name]
        else:
            bpy.data.objects.remove(o, do_unlink=True)

    bpy.context.view_layer.update()

    # Separate Left (-X Port) and Right (+X Starboard) wheels & suspension
    split_left_right_mesh("Wheels_objs", "Wheels_Port_L", "Wheels_Stbd_R")
    split_left_right_mesh("suspension", "Suspension_Port_L", "Suspension_Stbd_R")
    bpy.context.view_layer.update()


L1_NAMES = {
    "Wheels_Port_L", "Wheels_Stbd_R",
    "Suspension_Port_L", "Suspension_Stbd_R",
    "arm_01", "arm_01_joint", "arm_01_pivot",
    "arm_02", "arm_02.001", "arm_02_joint", "arm_02_pivot",
}

L2_MAST_NAMES = {
    "head", "Mastcam_Z_cams", "NavCams", "lens", "top", "base",
    "bottom", "bottom.001", "bottom.002", "bottom.003",
    "microphones.001", "Cylinder", "Cylinder.001", "Cylinder.002", "probe.001",
}

L2_ARM_NAMES = {
    "arm", "arm.001", "arm.002", "arm.003", "arm.004", "arm_cable_etc",
    "turret_obj", "turret_obj.002", "turret_obj.004", "turret_obj.006", "turret_parts",
    "PIXL", "PIXL_cover_01", "WATSON", "corring_drill", "cover_02", "cover_03",
    "Down_Look_Camera", "hinge", "calibration_target", "calibration_target_bracket", "part_01",
}

L2_NAMES = L2_MAST_NAMES | L2_ARM_NAMES


def export_layer_glb(layer_key, keep_predicate, out_filename):
    load_and_prepare()
    meshes = [o for o in bpy.data.objects if o.type == 'MESH']
    kept_tris = 0
    kept_count = 0
    for o in meshes:
        if keep_predicate(o.name):
            kept_count += 1
            kept_tris += sum(len(p.vertices) - 2 for p in o.data.polygons)
        else:
            bpy.data.objects.remove(o, do_unlink=True)

    out_path = os.path.join(OUT_MODELS, out_filename)
    bpy.ops.export_scene.gltf(
        filepath=out_path,
        export_format='GLB',
        export_draco_mesh_compression_enable=False,
        export_animations=False,
        export_apply=False,
    )
    print(f"Exported {out_filename}: {kept_count} meshes, {kept_tris} triangles -> {os.path.getsize(out_path)/1024:.1f} KB")


def render_verification_previews():
    for mode in ["assembled", "exploded"]:
        load_and_prepare()
        scene = bpy.context.scene
        scene.render.engine = 'BLENDER_EEVEE_NEXT' if 'BLENDER_EEVEE_NEXT' in bpy.types.RenderSettings.bl_rna.properties['engine'].enum_items.keys() else 'BLENDER_EEVEE'
        scene.render.resolution_x = 1600
        scene.render.resolution_y = 960
        scene.render.film_transparent = False

        world = bpy.data.worlds.new("StudioWorld")
        scene.world = world
        world.use_nodes = True
        nt = world.node_tree
        nt.nodes.clear()
        bg = nt.nodes.new("ShaderNodeBackground")
        bg.inputs[0].default_value = (0.016, 0.024, 0.040, 1.0)
        bg.inputs[1].default_value = 1.25
        out = nt.nodes.new("ShaderNodeOutputWorld")
        nt.links.new(bg.outputs[0], out.inputs[0])

        if mode == "exploded":
            for o in bpy.data.objects:
                if o.type != 'MESH':
                    continue
                n = o.name
                mw = o.matrix_world.copy()
                if n == "Wheels_Port_L":
                    mw.translation += mathutils.Vector((-1.05, 0.0, -0.18))
                elif n == "Wheels_Stbd_R":
                    mw.translation += mathutils.Vector((+1.05, 0.0, -0.18))
                elif n == "Suspension_Port_L":
                    mw.translation += mathutils.Vector((-0.55, 0.0, +0.08))
                elif n == "Suspension_Stbd_R":
                    mw.translation += mathutils.Vector((+0.55, 0.0, +0.08))
                elif n.startswith("arm_0"):
                    mw.translation += mathutils.Vector((0.0, 0.0, +0.42))
                elif n in L2_MAST_NAMES:
                    mw.translation += mathutils.Vector((-0.25, -0.20, +0.72))
                elif n in L2_ARM_NAMES:
                    mw.translation += mathutils.Vector((+0.25, -0.95, +0.22))
                elif n == "rtg":
                    mw.translation += mathutils.Vector((0.0, +0.95, +0.25))
                elif n in ("Body", "Body_Parts", "Body_Parts.001"):
                    mw.translation += mathutils.Vector((0.0, 0.0, +0.58))
                elif n == "lab":
                    mw.translation += mathutils.Vector((0.0, -0.38, -0.15))
                elif "antenna" in n:
                    mw.translation += mathutils.Vector((0.0, +0.35, +0.65))
                o.matrix_world = mw
            bpy.context.view_layer.update()

        key_data = bpy.data.lights.new("KeyLight", type='AREA')
        key_data.energy = 500
        key_data.size = 4.5
        key_data.color = (1.0, 0.96, 0.90)
        key_obj = bpy.data.objects.new("KeyLight", key_data)
        scene.collection.objects.link(key_obj)
        key_obj.location = (3.4, -3.6, 3.9)
        key_obj.rotation_euler = (mathutils.Vector((0.0, -0.1, 1.0)) - key_obj.location).to_track_quat('-Z', 'Y').to_euler()

        rim_data = bpy.data.lights.new("RimLight", type='AREA')
        rim_data.energy = 420
        rim_data.size = 4.0
        rim_data.color = (0.35, 0.78, 1.0)
        rim_obj = bpy.data.objects.new("RimLight", rim_data)
        scene.collection.objects.link(rim_obj)
        rim_obj.location = (-3.6, 3.0, 3.0)
        rim_obj.rotation_euler = (mathutils.Vector((0.0, 0.0, 1.0)) - rim_obj.location).to_track_quat('-Z', 'Y').to_euler()

        fill_data = bpy.data.lights.new("FillLight", type='SUN')
        fill_data.energy = 2.4
        fill_data.color = (0.85, 0.92, 1.0)
        fill_obj = bpy.data.objects.new("FillLight", fill_data)
        scene.collection.objects.link(fill_obj)
        fill_obj.rotation_euler = (math.radians(52), math.radians(15), math.radians(-35))

        cam_data = bpy.data.cameras.new("VerifyCam")
        cam_data.lens = 35
        cam_obj = bpy.data.objects.new("VerifyCam", cam_data)
        scene.collection.objects.link(cam_obj)
        scene.camera = cam_obj
        cam_obj.location = (3.25, -3.55, 2.35) if mode == "assembled" else (4.45, -4.65, 2.95)
        target = mathutils.Vector((0.0, -0.10, 1.05))
        cam_obj.rotation_euler = (target - cam_obj.location).to_track_quat('-Z', 'Y').to_euler()

        out_img = os.path.join(OUT_RENDERS, f"perseverance_{mode}_verify.png")
        scene.render.filepath = out_img
        bpy.ops.render.render(write_still=True)
        print("Rendered preview:", out_img)


if __name__ == "__main__":
    export_layer_glb("L1", lambda n: n in L1_NAMES, "L1_mobility_rocker_bogie.glb")
    export_layer_glb("L2", lambda n: n in L2_NAMES, "L2_turret_mast_robotics.glb")
    export_layer_glb("L3", lambda n: (n not in L1_NAMES) and (n not in L2_NAMES), "L3_chassis_mmrtg_lab.glb")
    render_verification_previews()
