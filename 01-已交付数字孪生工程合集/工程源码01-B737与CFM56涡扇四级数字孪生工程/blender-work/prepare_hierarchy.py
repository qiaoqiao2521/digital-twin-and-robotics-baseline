"""
Blender 4.5 Asset Pipeline for Genuine CATIA V5 2-Spool High-Bypass Turbofan Engine
Source: Printables #572421 / Thingiverse #1327093 by CATIAV5FTW (Engine_Assembly.stp + 46 native CAD STL parts)

Coordinate System Verification:
- In CATIA V5 STL coordinates:
    * X axis: Axial centerline (Intake Spinner Tip at X = +9.0mm, Exhaust Cone Tip at X = +422.2mm)
    * Z axis: Vertical Up/Down (Engine Stand sits at bottom Z = [-128.4mm, -40.1mm])
    * -Y axis: Front Cutaway Window (Fan_Casing, HP_Core_Casing, Combustion_and_HPT_Casing, LPT_Casing all have their factory cutaway window facing -Y / +Z!)
- When exported to GLB with `export_yup=True`, Blender (X, Y, Z) -> Three.js (X, Z, -Y):
    * Three.js X: Axial centerline (-X Intake -> +X Exhaust)
    * Three.js Y: Vertical Up (+Y Top, -Y Bottom Stand)
    * Three.js +Z: Front Cutaway Window facing directly toward the camera!
"""

import bpy
import os
import math
import json

BASE_DIR = "/home/muqiao/projects/muqiao-media-studio/productions/industrial-digital-twin-20261108"
RAW_DIR = os.path.join(BASE_DIR, "blender-work/source_raw/catiav5_cfm56_parts")
HDRI_PATH = os.path.join(BASE_DIR, "public/hdri/studio_metal_1k.hdr")
MODELS_OUT_DIR = os.path.join(BASE_DIR, "public/models")
PREVIEW_IMG_PATH = os.path.join(BASE_DIR, "blender-work/exploded_preview_verify.png")
PREVIEW_ASSEMBLED_PATH = os.path.join(BASE_DIR, "blender-work/assembled_cutaway_verify.png")
MANIFEST_OUT_PATH = os.path.join(BASE_DIR, "public/models/twin_asset_manifest.json")

os.makedirs(MODELS_OUT_DIR, exist_ok=True)
bpy.ops.wm.read_factory_settings(use_empty=True)

def make_pbr_mat(name, base_color, metallic=0.9, roughness=0.22, emission=None, emission_strength=0.0):
    mat = bpy.data.materials.new(name=name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    bsdf.inputs["Base Color"].default_value = (*base_color, 1.0)
    bsdf.inputs["Metallic"].default_value = metallic
    bsdf.inputs["Roughness"].default_value = roughness
    if emission and "Emission Color" in bsdf.inputs:
        bsdf.inputs["Emission Color"].default_value = (*emission, 1.0)
        bsdf.inputs["Emission Strength"].default_value = emission_strength
    return mat

MATS = {
    "ti_fan_blade": make_pbr_mat("MAT_Titanium_Fan", (0.82, 0.87, 0.93), metallic=0.96, roughness=0.15),
    "spinner_chrome": make_pbr_mat("MAT_Spinner_Chrome", (0.18, 0.22, 0.28), metallic=0.90, roughness=0.18),
    "nacelle_cowl": make_pbr_mat("MAT_Aero_Cowl_Blue", (0.14, 0.34, 0.60), metallic=0.76, roughness=0.24),
    "fan_frame_strut": make_pbr_mat("MAT_Fan_Frame_Al", (0.58, 0.65, 0.74), metallic=0.88, roughness=0.24),
    "lp_shaft_cyan": make_pbr_mat("MAT_N1_LP_Shaft", (0.06, 0.72, 0.90), metallic=0.92, roughness=0.18),
    "hp_spool_gold": make_pbr_mat("MAT_N2_HP_Spool", (0.94, 0.66, 0.14), metallic=0.94, roughness=0.18),
    "hpc_rotor": make_pbr_mat("MAT_HPC_Rotor_Ti", (0.88, 0.76, 0.52), metallic=0.95, roughness=0.16),
    "hpc_stator": make_pbr_mat("MAT_HPC_Stator_Steel", (0.46, 0.53, 0.62), metallic=0.86, roughness=0.26),
    "core_casing": make_pbr_mat("MAT_Core_Flange_Case", (0.34, 0.41, 0.50), metallic=0.84, roughness=0.28),
    "combustor_liner": make_pbr_mat("MAT_Combustor_Copper", (0.95, 0.46, 0.10), metallic=0.88, roughness=0.22, emission=(0.98, 0.35, 0.04), emission_strength=0.45),
    "hpt_rotor": make_pbr_mat("MAT_HPT_SingleCrystal", (0.92, 0.24, 0.20), metallic=0.94, roughness=0.16, emission=(0.75, 0.12, 0.06), emission_strength=0.30),
    "lpt_rotor": make_pbr_mat("MAT_LPT_Rotor_Inconel", (0.76, 0.82, 0.90), metallic=0.94, roughness=0.17),
    "lpt_stator": make_pbr_mat("MAT_LPT_Stator_Alloy", (0.42, 0.48, 0.56), metallic=0.86, roughness=0.25),
    "exhaust_mixer": make_pbr_mat("MAT_Exhaust_Mixer_Inconel", (0.68, 0.60, 0.50), metallic=0.92, roughness=0.20),
    "stand_mount": make_pbr_mat("MAT_Pylon_Stand", (0.18, 0.22, 0.28), metallic=0.82, roughness=0.32),
}

# Note on `explode_blender_mm`: (dx, dy, dz) in Blender space (where -Y is front cutaway window, +Z is Up).
# When converted to Three.js (Y-up), Three.js explode Vector is (dx, dz, -dy).
PARTS_SPEC = [
    # ================= L1: Outer Casings, Fan Frame, Exhaust Nozzle & Mount Stand =================
    {
        "id": "L1_Fan_Casing_Cutaway",
        "file": "Fan_Casing.stl",
        "level": "L1",
        "subsystem": "MOD_FAN_CASE",
        "label_zh": "外涵道风扇机匣（剖切视窗与安装法兰）",
        "label_en": "Fan Containment Casing (Cutaway Shell)",
        "desc_zh": "包覆前端钛合金风扇叶盘，带 120° 扇区展示剖口与前后高强螺栓安装边。",
        "spool": "STATIC",
        "mat": "nacelle_cowl",
        "step_offset": (0.0, 0.0, 0.0),
        "explode_blender_mm": (-165.0, 55.0, 68.0),
        "decimate_ratio": 0.35
    },
    {
        "id": "L1_Fan_Stator_Frame",
        "file": "Fan_Stator_Casing_and_Support_No_Supports.stl",
        "level": "L1",
        "subsystem": "MOD_FAN_FRAME",
        "label_zh": "风扇出口导流静叶与主承力框架 (OGV & Fan Frame)",
        "label_en": "Fan Outlet Guide Vanes & Structural Support Frame",
        "desc_zh": "连接外涵道机匣与内涵核心机的主承力框架，周向布置流线型出口导流静叶（OGV）。",
        "spool": "STATIC",
        "mat": "fan_frame_strut",
        "step_offset": (0.0, 0.0, 0.0),
        "explode_blender_mm": (-95.0, 35.0, 42.0),
        "decimate_ratio": 0.16
    },
    {
        "id": "L1_HP_Core_Casing",
        "file": "HP_Core_Casing.stl",
        "level": "L1",
        "subsystem": "MOD_CORE_CASE",
        "label_zh": "高压压气机剖分机匣与螺栓法兰 (HPC Split Casing)",
        "label_en": "High-Pressure Compressor Bolted Split Casing",
        "desc_zh": "承载 5 级高压压气机静叶环的剖分式承压机匣，正面作剖切敞开以显露内部转子叶盘。",
        "spool": "STATIC",
        "mat": "core_casing",
        "step_offset": (0.0, 0.0, 0.0),
        "explode_blender_mm": (-22.0, 58.0, 65.0),
        "decimate_ratio": 0.38
    },
    {
        "id": "L1_Combustion_HPT_Casing",
        "file": "Combustion_and_HPT_Casing.stl",
        "level": "L1",
        "subsystem": "MOD_CORE_CASE",
        "label_zh": "燃烧室与高压涡轮承力机匣 (Combustor & HPT Case)",
        "label_en": "Combustion Chamber & HPT Outer Structural Case",
        "desc_zh": "位于发动机热端核心区，周向设有燃油喷嘴安装座孔与前后法兰螺栓环。",
        "spool": "STATIC",
        "mat": "core_casing",
        "step_offset": (0.0, 0.0, 0.0),
        "explode_blender_mm": (35.0, 62.0, 72.0),
        "decimate_ratio": 0.35
    },
    {
        "id": "L1_LPT_Casing",
        "file": "LPT_Casing.stl",
        "level": "L1",
        "subsystem": "MOD_LPT_CASE",
        "label_zh": "低压涡轮锥形承力机匣 (LPT Conical Casing)",
        "label_en": "Low-Pressure Turbine Structural Casing",
        "desc_zh": "包覆 4 级低压涡轮膨胀段，带轴向与环向加强筋及螺栓法兰。",
        "spool": "STATIC",
        "mat": "core_casing",
        "step_offset": (0.0, 0.0, 0.0),
        "explode_blender_mm": (98.0, 62.0, 70.0),
        "decimate_ratio": 0.35
    },
    {
        "id": "L1_Exhaust_Nozzle",
        "file": "Nozzle_No_Supports.stl",
        "level": "L1",
        "subsystem": "MOD_EXHAUST",
        "label_zh": "尾喷管外涵道收敛壳体 (Exhaust Nozzle Shell)",
        "label_en": "Convergent Exhaust Nozzle Housing",
        "desc_zh": "发动机尾部收敛排气道外壳，内部包容 20 瓣菊花形混合器与中心排气锥。",
        "spool": "STATIC",
        "mat": "nacelle_cowl",
        "step_offset": (0.0, 0.0, 0.0),
        "explode_blender_mm": (175.0, 45.0, 52.0),
        "decimate_ratio": 0.16
    },
    {
        "id": "L1_Engine_Mount_Stand",
        "file": "Stand.stl",
        "level": "L1",
        "subsystem": "MOD_MOUNT_STAND",
        "label_zh": "发动机主承力安装支座 (Testbed & Mount Stand)",
        "label_en": "Engine Structural Mounting Stand",
        "desc_zh": "下部双支臂台架支座，刚性托举风扇框架后法兰与低压涡轮前法兰。",
        "spool": "STATIC",
        "mat": "stand_mount",
        "step_offset": (0.0, 0.0, 0.0),
        "explode_blender_mm": (0.0, 0.0, -72.0),
        "decimate_ratio": 0.50
    },

    # ================= L2: Fan Rotor, N1 Shaft, 5-Stage HPC, 4-Stage LPT & Mixer =================
    {
        "id": "L2_Spinner_Tip",
        "file": "Spinner_Tip.stl",
        "level": "L2",
        "subsystem": "MOD_FAN_ROTOR",
        "label_zh": "进气整流锥尖端 (Conical Spinner Tip)",
        "label_en": "Aero Intake Spinner Tip",
        "desc_zh": "位于发动机最前端的锥形整流帽尖，随 N1 低压轴同步旋转引导进气。",
        "spool": "N1",
        "mat": "spinner_chrome",
        "step_offset": (0.0, 0.0, 0.0),
        "explode_blender_mm": (-235.0, 0.0, 0.0),
        "decimate_ratio": 0.80
    },
    {
        "id": "L2_Spinner_Cone",
        "file": "Spinner_Cone.stl",
        "level": "L2",
        "subsystem": "MOD_FAN_ROTOR",
        "label_zh": "风扇整流锥罩 (Front Spinner Cone)",
        "label_en": "Fan Hub Spinner Cone",
        "desc_zh": "锁紧在风扇轮毂前端的流线型整流锥体，保护中心轴承腔免受气动冲击。",
        "spool": "N1",
        "mat": "spinner_chrome",
        "step_offset": (0.0, 0.0, 0.0),
        "explode_blender_mm": (-198.0, 0.0, 0.0),
        "decimate_ratio": 0.65
    },
    {
        "id": "L2_Titanium_Fan_Rotor",
        "file": "Fan_No_Supports.stl",
        "level": "L2",
        "subsystem": "MOD_FAN_ROTOR",
        "label_zh": "大涵道比宽弦扭转钛合金风扇叶盘 (Wide-Chord Swept Titanium Fan Rotor)",
        "label_en": "Wide-Chord Swept Titanium Fan Bladed Disk (N1)",
        "desc_zh": "高精度三维扭转宽弦风扇整体叶盘，由 4 级低压涡轮通过 N1 同心内轴驱动，产生整机 78% 以上推力。",
        "spool": "N1",
        "mat": "ti_fan_blade",
        "step_offset": (0.0, 0.0, 0.0),
        "explode_blender_mm": (-148.0, 0.0, 0.0),
        "decimate_ratio": 0.14
    },
    {
        "id": "L2_N1_LP_Shaft_Front",
        "file": "Low_Pressure_Shaft_Front_Rev_A.stl",
        "level": "L2",
        "subsystem": "MOD_N1_SHAFT",
        "label_zh": "N1 低压转子前段同心内轴 (N1 LP Inner Concentric Shaft — Fwd)",
        "label_en": "N1 Low-Pressure Forward Concentric Shaft",
        "desc_zh": "贯穿高压鼓筒轴中心孔的低压前主轴，前端花键直接连接大直径钛合金风扇盘。",
        "spool": "N1",
        "mat": "lp_shaft_cyan",
        "step_offset": (0.0, 0.0, 0.0),
        "explode_blender_mm": (-95.0, 0.0, -32.0),
        "decimate_ratio": 0.70
    },
    {
        "id": "L2_N1_LP_Shaft_Aft",
        "file": "Low_Pressure_Shaft_Aft_Rev_A.stl",
        "level": "L2",
        "subsystem": "MOD_N1_SHAFT",
        "label_zh": "N1 低压转子后段驱动主轴 (N1 LP Inner Drive Shaft — Aft)",
        "label_en": "N1 Low-Pressure Aft Drive Shaft",
        "desc_zh": "连接尾部 4 级低压涡轮鼓筒与前段低压内轴的传递扭矩核心轴。",
        "spool": "N1",
        "mat": "lp_shaft_cyan",
        "step_offset": (0.0, 0.0, 0.0),
        "explode_blender_mm": (65.0, 0.0, -32.0),
        "decimate_ratio": 0.60
    },
    {
        "id": "L2_HPC_Stage1_Rotor",
        "file": "HPC_Stage_1_No_Supports.stl",
        "level": "L2",
        "subsystem": "MOD_HPC",
        "label_zh": "高压压气机第 1 级转子叶盘 (HPC Stage-1 Rotor Blisk)",
        "label_en": "HPC Stage-1 Rotor Bladed Disk (N2)",
        "desc_zh": "高压压气机首级整体叶盘，随 N2 高压鼓筒轴高速旋转对内涵气流做功增压。",
        "spool": "N2",
        "mat": "hpc_rotor",
        "step_offset": (0.0, 0.0, 0.0),
        "explode_blender_mm": (-82.0, 0.0, 0.0),
        "decimate_ratio": 0.22
    },
    {
        "id": "L2_HPC_Stage1_Stator",
        "file": "HPC_Stage_1_Stator_No_Supports.stl",
        "level": "L2",
        "subsystem": "MOD_HPC",
        "label_zh": "高压压气机第 1 级静叶环 (HPC Stage-1 Stator Vane Ring)",
        "label_en": "HPC Stage-1 Stator Vane Ring",
        "desc_zh": "将第 1 级转子出口高速旋转气流的动能转化为静压能，并校正气流方向进入下一级。",
        "spool": "STATIC",
        "mat": "hpc_stator",
        "step_offset": (0.0, 0.0, 0.0),
        "explode_blender_mm": (-72.0, 22.0, 26.0),
        "decimate_ratio": 0.22
    },
    {
        "id": "L2_HPC_Stage2_Rotor",
        "file": "HPC_Stage_2_No_Supports.stl",
        "level": "L2",
        "subsystem": "MOD_HPC",
        "label_zh": "高压压气机第 2 级转子叶盘 (HPC Stage-2 Rotor Blisk)",
        "label_en": "HPC Stage-2 Rotor Bladed Disk (N2)",
        "desc_zh": "高压压气机第 2 级转子叶盘，流道截面随空气密度升高而逐级收缩。",
        "spool": "N2",
        "mat": "hpc_rotor",
        "step_offset": (0.0, 0.0, 0.0),
        "explode_blender_mm": (-60.0, 0.0, 0.0),
        "decimate_ratio": 0.22
    },
    {
        "id": "L2_HPC_Stage2_Stator",
        "file": "HPC_Stage_2_Stator_No_Supports.stl",
        "level": "L2",
        "subsystem": "MOD_HPC",
        "label_zh": "高压压气机第 2 级静叶环 (HPC Stage-2 Stator Vane Ring)",
        "label_en": "HPC Stage-2 Stator Vane Ring",
        "desc_zh": "第 2 级扩压静子叶片环，外缘固定于高压压气机剖分机匣导槽内。",
        "spool": "STATIC",
        "mat": "hpc_stator",
        "step_offset": (0.0, 0.0, 0.0),
        "explode_blender_mm": (-50.0, 22.0, 26.0),
        "decimate_ratio": 0.22
    },
    {
        "id": "L2_HPC_Stage3_Rotor",
        "file": "HPC_Stage_3_No_Supports.stl",
        "level": "L2",
        "subsystem": "MOD_HPC",
        "label_zh": "高压压气机第 3 级转子叶盘 (HPC Stage-3 Rotor Blisk)",
        "label_en": "HPC Stage-3 Rotor Bladed Disk (N2)",
        "desc_zh": "高压压气机中段第 3 级转子叶盘。",
        "spool": "N2",
        "mat": "hpc_rotor",
        "step_offset": (0.0, 0.0, 0.0),
        "explode_blender_mm": (-38.0, 0.0, 0.0),
        "decimate_ratio": 0.22
    },
    {
        "id": "L2_HPC_Stage3_Stator",
        "file": "HPC_Stage_3_Stator_No_Supports.stl",
        "level": "L2",
        "subsystem": "MOD_HPC",
        "label_zh": "高压压气机第 3 级静叶环 (HPC Stage-3 Stator Vane Ring)",
        "label_en": "HPC Stage-3 Stator Vane Ring",
        "desc_zh": "高压压气机第 3 级扩压静叶环。",
        "spool": "STATIC",
        "mat": "hpc_stator",
        "step_offset": (0.0, 0.0, 0.0),
        "explode_blender_mm": (-28.0, 22.0, 26.0),
        "decimate_ratio": 0.22
    },
    {
        "id": "L2_HPC_Stage4_Rotor",
        "file": "HPC_Stage_4_No_Supports.stl",
        "level": "L2",
        "subsystem": "MOD_HPC",
        "label_zh": "高压压气机第 4 级转子叶盘 (HPC Stage-4 Rotor Blisk)",
        "label_en": "HPC Stage-4 Rotor Bladed Disk (N2)",
        "desc_zh": "高压压气机第 4 级高温钛/镍基合金转子叶盘。",
        "spool": "N2",
        "mat": "hpc_rotor",
        "step_offset": (0.0, 0.0, 0.0),
        "explode_blender_mm": (-16.0, 0.0, 0.0),
        "decimate_ratio": 0.22
    },
    {
        "id": "L2_HPC_Stage4_Stator",
        "file": "HPC_Stage_4_Stator_No_Supports.stl",
        "level": "L2",
        "subsystem": "MOD_HPC",
        "label_zh": "高压压气机第 4 级静叶环 (HPC Stage-4 Stator Vane Ring)",
        "label_en": "HPC Stage-4 Stator Vane Ring",
        "desc_zh": "高压压气机第 4 级静叶环。",
        "spool": "STATIC",
        "mat": "hpc_stator",
        "step_offset": (0.0, 0.0, 0.0),
        "explode_blender_mm": (-8.0, 22.0, 26.0),
        "decimate_ratio": 0.22
    },
    {
        "id": "L2_HPC_Stage5_Rotor",
        "file": "HPC_Stage_5_No_Supports.stl",
        "level": "L2",
        "subsystem": "MOD_HPC",
        "label_zh": "高压压气机第 5 级末级转子叶盘 (HPC Stage-5 Rotor Blisk)",
        "label_en": "HPC Stage-5 Rotor Bladed Disk (N2)",
        "desc_zh": "高压压气机末级转子叶盘，将高温高压空气送入出口扩压器与环形燃烧室。",
        "spool": "N2",
        "mat": "hpc_rotor",
        "step_offset": (0.0, 0.0, 0.0),
        "explode_blender_mm": (2.0, 0.0, 0.0),
        "decimate_ratio": 0.22
    },
    {
        "id": "L2_HPC_Stage5_Stator",
        "file": "HPC_Stage_5_Stator_No_Supports.stl",
        "level": "L2",
        "subsystem": "MOD_HPC",
        "label_zh": "高压压气机出口扩压静叶环 (HPC Stage-5 Outlet Diffuser Stator)",
        "label_en": "HPC Stage-5 Outlet Guide Stator",
        "desc_zh": "位于燃烧室前端的出口导流扩压器（OGV），降低气流马赫数以稳定燃烧室火焰。",
        "spool": "STATIC",
        "mat": "hpc_stator",
        "step_offset": (0.0, 0.0, 0.0),
        "explode_blender_mm": (10.0, 22.0, 26.0),
        "decimate_ratio": 0.22
    },
    {
        "id": "L2_LPT_Spool_Hub",
        "file": "LPT_Spool.stl",
        "level": "L2",
        "subsystem": "MOD_LPT",
        "label_zh": "低压涡轮转子锥形鼓筒轴 (LPT Conical Rotor Spool Drum)",
        "label_en": "LPT Rotor Conical Spool Hub (N1)",
        "desc_zh": "串联 4 级低压涡轮工作叶盘的锥形鼓筒，中心法兰与 N1 低压后轴刚性锁紧。",
        "spool": "N1",
        "mat": "lp_shaft_cyan",
        "step_offset": (0.0, 0.0, 0.0),
        "explode_blender_mm": (78.0, 0.0, -24.0),
        "decimate_ratio": 0.50
    },
    {
        "id": "L2_LPT_Stage1_Stator",
        "file": "LPT_Stage_1_Stator_No_Supports.stl",
        "level": "L2",
        "subsystem": "MOD_LPT",
        "label_zh": "低压涡轮第 1 级导向静叶环 (LPT Stage-1 Nozzle Stator)",
        "label_en": "LPT Stage-1 Stator Vane Ring",
        "desc_zh": "承接高压涡轮出口燃气并引导冲击第 1 级低压涡轮转子。",
        "spool": "STATIC",
        "mat": "lpt_stator",
        "step_offset": (0.0, 0.0, 0.0),
        "explode_blender_mm": (62.0, 25.0, 28.0),
        "decimate_ratio": 0.18
    },
    {
        "id": "L2_LPT_Stage1_Rotor",
        "file": "LPT_Stage_1_No_Supports.stl",
        "level": "L2",
        "subsystem": "MOD_LPT",
        "label_zh": "低压涡轮第 1 级工作叶盘 (LPT Stage-1 Rotor Bladed Disk)",
        "label_en": "LPT Stage-1 Rotor Bladed Disk (N1)",
        "desc_zh": "低压涡轮首级工作叶盘，提取燃气膨胀功驱动前端大风扇。",
        "spool": "N1",
        "mat": "lpt_rotor",
        "step_offset": (0.0, 0.0, 0.0),
        "explode_blender_mm": (72.0, 0.0, 0.0),
        "decimate_ratio": 0.16
    },
    {
        "id": "L2_LPT_Stage2_Stator",
        "file": "LPT_Stage_2_Stator_No_Supports.stl",
        "level": "L2",
        "subsystem": "MOD_LPT",
        "label_zh": "低压涡轮第 2 级导向静叶环 (LPT Stage-2 Nozzle Stator)",
        "label_en": "LPT Stage-2 Stator Vane Ring",
        "desc_zh": "低压涡轮第 2 级导向静叶环。",
        "spool": "STATIC",
        "mat": "lpt_stator",
        "step_offset": (0.0, 0.0, 0.0),
        "explode_blender_mm": (84.0, 25.0, 28.0),
        "decimate_ratio": 0.18
    },
    {
        "id": "L2_LPT_Stage2_Rotor",
        "file": "LPT_Stage_2_No_Supports.stl",
        "level": "L2",
        "subsystem": "MOD_LPT",
        "label_zh": "低压涡轮第 2 级工作叶盘 (LPT Stage-2 Rotor Bladed Disk)",
        "label_en": "LPT Stage-2 Rotor Bladed Disk (N1)",
        "desc_zh": "低压涡轮第 2 级工作叶盘，叶片展长随燃气压力下降而逐级加长。",
        "spool": "N1",
        "mat": "lpt_rotor",
        "step_offset": (0.0, 0.0, 0.0),
        "explode_blender_mm": (94.0, 0.0, 0.0),
        "decimate_ratio": 0.16
    },
    {
        "id": "L2_LPT_Stage3_Stator",
        "file": "LPT_Stage_3_Stator_No_Supports.stl",
        "level": "L2",
        "subsystem": "MOD_LPT",
        "label_zh": "低压涡轮第 3 级导向静叶环 (LPT Stage-3 Nozzle Stator)",
        "label_en": "LPT Stage-3 Stator Vane Ring",
        "desc_zh": "低压涡轮第 3 级导向静叶环。",
        "spool": "STATIC",
        "mat": "lpt_stator",
        "step_offset": (0.0, 0.0, 0.0),
        "explode_blender_mm": (106.0, 25.0, 28.0),
        "decimate_ratio": 0.18
    },
    {
        "id": "L2_LPT_Stage3_Rotor",
        "file": "LPT_Stage_3_No_Supports.stl",
        "level": "L2",
        "subsystem": "MOD_LPT",
        "label_zh": "低压涡轮第 3 级工作叶盘 (LPT Stage-3 Rotor Bladed Disk)",
        "label_en": "LPT Stage-3 Rotor Bladed Disk (N1)",
        "desc_zh": "低压涡轮第 3 级长叶片工作叶盘。",
        "spool": "N1",
        "mat": "lpt_rotor",
        "step_offset": (0.0, 0.0, 0.0),
        "explode_blender_mm": (116.0, 0.0, 0.0),
        "decimate_ratio": 0.16
    },
    {
        "id": "L2_LPT_Stage4_Stator",
        "file": "LPT_Stage_4_Stator_No_Supports.stl",
        "level": "L2",
        "subsystem": "MOD_LPT",
        "label_zh": "低压涡轮第 4 级导向静叶环 (LPT Stage-4 Nozzle Stator)",
        "label_en": "LPT Stage-4 Stator Vane Ring",
        "desc_zh": "低压涡轮末级导向静叶环。",
        "spool": "STATIC",
        "mat": "lpt_stator",
        "step_offset": (0.0, 0.0, 0.0),
        "explode_blender_mm": (128.0, 25.0, 28.0),
        "decimate_ratio": 0.18
    },
    {
        "id": "L2_LPT_Stage4_Rotor",
        "file": "LPT_Stage_4_No_Supports.stl",
        "level": "L2",
        "subsystem": "MOD_LPT",
        "label_zh": "低压涡轮第 4 级末级工作叶盘 (LPT Stage-4 Aft Rotor Disk)",
        "label_en": "LPT Stage-4 Rotor Bladed Disk (N1)",
        "desc_zh": "低压涡轮第 4 级末级叶盘，出口燃气直接进入后方 20 瓣波瓣混合器。",
        "spool": "N1",
        "mat": "lpt_rotor",
        "step_offset": (0.0, 0.0, 0.0),
        "explode_blender_mm": (138.0, 0.0, 0.0),
        "decimate_ratio": 0.16
    },
    {
        "id": "L2_Lobed_Exhaust_Mixer",
        "file": "Mixer.stl",
        "level": "L2",
        "subsystem": "MOD_EXHAUST",
        "label_zh": "菊花形 20 波瓣内外涵排气混合器 (Scalloped Lobed Exhaust Mixer)",
        "label_en": "20-Lobe Scalloped Core/Bypass Exhaust Mixer",
        "desc_zh": "将内涵高温燃气与外涵低温空气强制掺混排出，显著降低排气噪声并提升推进效率。",
        "spool": "STATIC",
        "mat": "exhaust_mixer",
        "step_offset": (34711.1791185, 0.0, 0.0),
        "explode_blender_mm": (168.0, 0.0, 0.0),
        "decimate_ratio": 0.14
    },
    {
        "id": "L2_Exhaust_Center_Cone",
        "file": "Nozzle_Cone.stl",
        "level": "L2",
        "subsystem": "MOD_EXHAUST",
        "label_zh": "尾喷管中心排气锥 (Exhaust Centerbody Plug Cone)",
        "label_en": "Exhaust Centerbody Tailcone",
        "desc_zh": "消除低压涡轮盘后方低压涡流区的流线型尾锥体。",
        "spool": "STATIC",
        "mat": "exhaust_mixer",
        "step_offset": (0.0, 0.0, 0.0),
        "explode_blender_mm": (205.0, 0.0, 0.0),
        "decimate_ratio": 0.85
    },

    # ================= L3: High-Pressure Hot Section Core (N2 Spool, Combustor Liner, Swirl Dome & HPT Rotor) =================
    {
        "id": "L3_N2_HPC_Drum_Spool",
        "file": "HPC_Spool.stl",
        "level": "L3",
        "subsystem": "MOD_HPT_CORE",
        "label_zh": "N2 高压转子中心鼓筒轴与法兰盘 (N2 High-Pressure Rotor Drum Spool & Flange)",
        "label_en": "N2 High-Pressure Concentric Drum Shaft",
        "desc_zh": "中空高强度合金鼓筒轴，外部套装 5 级高压压气机叶盘，后端大法兰通过 8 组精密螺栓与单级高压涡轮盘刚性锁紧。",
        "spool": "N2",
        "mat": "hp_spool_gold",
        "step_offset": (0.0, 0.0, 0.0),
        "explode_blender_mm": (-45.0, 0.0, -28.0),
        "decimate_ratio": 0.45
    },
    {
        "id": "L3_Annular_Combustor_Liner",
        "file": "Combustion_Lining_No_Supports.stl",
        "level": "L3",
        "subsystem": "MOD_COMBUSTOR",
        "label_zh": "多孔气膜冷却短环形燃烧室火焰筒 (Perforated Annular Combustor Flame Liner)",
        "label_en": "Multi-Hole Film-Cooled Annular Combustor Liner",
        "desc_zh": "布满数百个初级助燃孔、次级掺混孔与冷却百叶窗的环形火焰筒，将 ~2000°C 核心火焰与金属壁面隔离。",
        "spool": "STATIC",
        "mat": "combustor_liner",
        "step_offset": (-6.23892211914, 0.0, 0.0),
        "explode_blender_mm": (18.0, -28.0, 38.0),
        "decimate_ratio": 0.28
    },
    {
        "id": "L3_Swirl_Dome_Plate",
        "file": "Swirl_Dome_Plate.stl",
        "level": "L3",
        "subsystem": "MOD_COMBUSTOR",
        "label_zh": "燃烧室头部 18 孔旋流器火焰盘 (18-Cup Fuel Swirler Dome Plate)",
        "label_en": "Annular Combustor Swirl Dome Plate",
        "desc_zh": "安装于环形燃烧室前端，周向均布 18 组涡流杯以雾化航空煤油并形成稳定回流火焰区。",
        "spool": "STATIC",
        "mat": "hp_spool_gold",
        "step_offset": (0.0, 0.0, 0.0),
        "explode_blender_mm": (6.0, 0.0, 22.0),
        "decimate_ratio": 0.65
    },
    {
        "id": "L3_Single_Stage_HPT_Rotor",
        "file": "HPT_No_Supports.stl",
        "level": "L3",
        "subsystem": "MOD_HPT_CORE",
        "label_zh": "单级高功高压涡轮转子叶盘与法兰螺栓孔 (Single-Stage HPT Rotor Bladed Disk)",
        "label_en": "Single-Stage High-Pressure Turbine Rotor (N2)",
        "desc_zh": "全机热负荷与离心应力极限核心件：直接承受燃烧室出口最高温燃气冲击，通过前缘 8 孔法兰驱动整个 N2 高压压气机轴系。",
        "spool": "N2",
        "mat": "hpt_rotor",
        "step_offset": (-7.07771714079, 0.0, 0.0),
        "explode_blender_mm": (42.0, 0.0, 0.0),
        "decimate_ratio": 0.42
    }
]

ENGINE_CENTER_X_MM = 215.6
MM_TO_M = 0.01

manifest_parts = []
loaded_objects = {}
total_raw_tris = 0
total_export_tris = 0

for spec in PARTS_SPEC:
    stl_path = os.path.join(RAW_DIR, spec["file"])
    bpy.ops.wm.stl_import(filepath=stl_path)
    obj = bpy.context.selected_objects[0]
    obj.name = spec["id"]
    obj.data.name = f"{spec['id']}_Mesh"

    raw_tris = len(obj.data.polygons)
    total_raw_tris += raw_tris

    dx, dy, dz = spec["step_offset"]
    for v in obj.data.vertices:
        v.co.x = (v.co.x + dx - ENGINE_CENTER_X_MM) * MM_TO_M
        v.co.y = (v.co.y + dy) * MM_TO_M
        v.co.z = (v.co.z + dz) * MM_TO_M
    obj.data.update()

    if spec["decimate_ratio"] < 0.99 and raw_tris > 8000:
        mod = obj.modifiers.new(name="CleanCADDecimate", type='DECIMATE')
        mod.decimate_type = 'COLLAPSE'
        mod.ratio = spec["decimate_ratio"]
        bpy.context.view_layer.objects.active = obj
        bpy.ops.object.modifier_apply(modifier=mod.name)

    for poly in obj.data.polygons:
        poly.use_smooth = True

    export_tris = len(obj.data.polygons)
    total_export_tris += export_tris

    mat = MATS[spec["mat"]]
    obj.data.materials.clear()
    obj.data.materials.append(mat)

    xs = [v.co.x for v in obj.data.vertices]
    ys = [v.co.y for v in obj.data.vertices]
    zs = [v.co.z for v in obj.data.vertices]

    # Convert Blender explode vector (ex, ey, ez) into Three.js Y-up space: (ex, ez, -ey)
    b_ex, b_ey, b_ez = spec["explode_blender_mm"]
    three_explode = [
        round(b_ex * MM_TO_M, 4),
        round(b_ez * MM_TO_M, 4),
        round(-b_ey * MM_TO_M, 4)
    ]

    obj["partId"] = spec["id"]
    obj["level"] = spec["level"]
    obj["subsystem"] = spec["subsystem"]
    obj["label_zh"] = spec["label_zh"]
    obj["label_en"] = spec["label_en"]
    obj["desc_zh"] = spec["desc_zh"]
    obj["spool"] = spec["spool"]
    obj["explodeX"] = three_explode[0]
    obj["explodeY"] = three_explode[1]
    obj["explodeZ"] = three_explode[2]

    loaded_objects[spec["id"]] = (obj, spec, (b_ex * MM_TO_M, b_ey * MM_TO_M, b_ez * MM_TO_M))
    manifest_parts.append({
        "id": spec["id"],
        "file": spec["file"],
        "level": spec["level"],
        "subsystem": spec["subsystem"],
        "label_zh": spec["label_zh"],
        "label_en": spec["label_en"],
        "desc_zh": spec["desc_zh"],
        "spool": spec["spool"],
        "rawTriangles": raw_tris,
        "exportedTriangles": export_tris,
        "boundsX": [round(min(xs), 3), round(max(xs), 3)],
        "explodeVector": three_explode
    })

manifest_data = {
    "sourceModel": "CATIA V5 2-Spool High-Bypass Turbofan Engine (Printables #572421 / Thingiverse #1327093 by CATIAV5FTW)",
    "license": "Creative Commons Attribution (CC BY)",
    "totalRawTriangles": total_raw_tris,
    "totalExportedTriangles": total_export_tris,
    "partCount": len(manifest_parts),
    "models": {
        "L1": "models/L1_nacelle_casings.glb",
        "L2": "models/L2_turbofan_core.glb",
        "L3": "models/L3_hpt_combustor.glb"
    },
    "parts": manifest_parts
}
with open(MANIFEST_OUT_PATH, "w", encoding="utf-8") as f:
    json.dump(manifest_data, f, ensure_ascii=False, indent=2)

# Export separate GLB files for L1, L2, L3
for target_level, out_name in [
    ("L1", "L1_nacelle_casings.glb"),
    ("L2", "L2_turbofan_core.glb"),
    ("L3", "L3_hpt_combustor.glb"),
]:
    bpy.ops.object.select_all(action='DESELECT')
    for pid, (obj, spec, _) in loaded_objects.items():
        if spec["level"] == target_level:
            obj.location = (0.0, 0.0, 0.0)
            obj.select_set(True)
    out_glb = os.path.join(MODELS_OUT_DIR, out_name)
    bpy.ops.export_scene.gltf(
        filepath=out_glb,
        use_selection=True,
        export_format='GLB',
        export_yup=True,
        export_extras=True,
        export_apply=False
    )

# Setup Studio Render Scene facing the -Y Cutaway Window!
scene = bpy.context.scene
scene.render.engine = 'BLENDER_EEVEE_NEXT' if 'BLENDER_EEVEE_NEXT' in bpy.types.RenderSettings.bl_rna.properties['engine'].enum_items.keys() else 'CYCLES'
scene.render.resolution_x = 1600
scene.render.resolution_y = 900

world = bpy.data.worlds.new("StudioWorld")
scene.world = world
world.use_nodes = True
wnodes = world.node_tree.nodes
wlinks = world.node_tree.links
wnodes.clear()

bg_node = wnodes.new(type='ShaderNodeBackground')
bg_node.inputs['Color'].default_value = (0.015, 0.024, 0.045, 1.0)
bg_node.inputs['Strength'].default_value = 1.0
out_node = wnodes.new(type='ShaderNodeOutputWorld')

if os.path.exists(HDRI_PATH):
    # Mix dark studio backdrop for camera ray while keeping HDRI reflections for metallic parts!
    env_node = wnodes.new(type='ShaderNodeTexEnvironment')
    env_node.image = bpy.data.images.load(HDRI_PATH)
    bg_hdri = wnodes.new(type='ShaderNodeBackground')
    bg_hdri.inputs['Strength'].default_value = 1.35
    wlinks.new(env_node.outputs['Color'], bg_hdri.inputs['Color'])

    light_path = wnodes.new(type='ShaderNodeLightPath')
    mix_shader = wnodes.new(type='ShaderNodeMixShader')
    wlinks.new(light_path.outputs['Is Camera Ray'], mix_shader.inputs['Fac'])
    wlinks.new(bg_hdri.outputs['Background'], mix_shader.inputs[1])
    wlinks.new(bg_node.outputs['Background'], mix_shader.inputs[2])
    wlinks.new(mix_shader.outputs['Shader'], out_node.inputs['Surface'])
else:
    wlinks.new(bg_node.outputs['Background'], out_node.inputs['Surface'])

# Studio Lighting from -Y (Front Cutaway Side)
key_data = bpy.data.lights.new(name="KeyLight", type='AREA')
key_data.energy = 450
key_data.size = 4.5
key_obj = bpy.data.objects.new(name="KeyLight", object_data=key_data)
key_obj.location = (-2.2, -3.6, 2.8)
scene.collection.objects.link(key_obj)

rim_data = bpy.data.lights.new(name="RimLight", type='AREA')
rim_data.energy = 320
rim_data.color = (0.28, 0.76, 1.0)
rim_data.size = 4.0
rim_obj = bpy.data.objects.new(name="RimLight", object_data=rim_data)
rim_obj.location = (2.8, -2.5, 2.2)
scene.collection.objects.link(rim_obj)

cam_data = bpy.data.cameras.new(name="VerifyCamera")
cam_data.lens = 38
cam_obj = bpy.data.objects.new(name="VerifyCamera", object_data=cam_data)
# Place camera on the -Y Front Cutaway side so the open casing window & all internal rotors face the viewer!
cam_obj.location = (-2.55, -4.65, 1.45)

target_empty = bpy.data.objects.new("CamTarget", None)
target_empty.location = (0.05, 0.0, 0.05)
scene.collection.objects.link(target_empty)
scene.collection.objects.link(cam_obj)
scene.camera = cam_obj

constraint = cam_obj.constraints.new(type='TRACK_TO')
constraint.target = target_empty
constraint.track_axis = 'TRACK_NEGATIVE_Z'
constraint.up_axis = 'UP_Y'

# 1. Render Assembled Cutaway View
for pid, (obj, spec, _) in loaded_objects.items():
    obj.location = (0.0, 0.0, 0.0)
scene.render.filepath = PREVIEW_ASSEMBLED_PATH
bpy.ops.render.render(write_still=True)

# 2. Render Exploded Disassembly View (75% explode)
for pid, (obj, spec, b_exp) in loaded_objects.items():
    obj.location = (b_exp[0] * 0.75, b_exp[1] * 0.75, b_exp[2] * 0.75)
scene.render.filepath = PREVIEW_IMG_PATH
bpy.ops.render.render(write_still=True)
print("Rendered both Assembled Cutaway and Exploded Verification Previews successfully!")
