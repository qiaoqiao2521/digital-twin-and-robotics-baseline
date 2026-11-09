import * as THREE from '../../vendor/three.module.js';
import { GLTFLoader } from '../../vendor/loaders/GLTFLoader.js';
import { createFresnelGhostMaterial, injectLaserClipShader } from '../shaders/FresnelGhostMat.js';

export const SUBSYSTEM_META = {
  // ================= L1: MOBILITY & ROCKER-BOGIE SUSPENSION =================
  MOBILITY_WHEELS_STBD: {
    id: 'MOBILITY_WHEELS_STBD',
    level: 'L1',
    code: 'JPL DWG 10453412 · Stbd (+Y_R) 3×Ø525mm Wheels',
    title: '右侧三轮独立驱动与转向总成 (Starboard 3-Wheel Drive Assembly)',
    spec: '7075-T73 锻造铝合金轮毂 · 48条波形防滑抓地齿 · 钛合金弧形弹性辐条 · 34,008 面',
    explodeVec: new THREE.Vector3(1.15, -0.14, 0.0),
    camPos: new THREE.Vector3(2.85, 0.95, 1.65),
    camTarget: new THREE.Vector3(1.05, 0.35, 0.05),
    isOuterCasing: false,
  },
  MOBILITY_WHEELS_PORT: {
    id: 'MOBILITY_WHEELS_PORT',
    level: 'L1',
    code: 'JPL DWG 10453412 · Port (-Y_R) 3×Ø525mm Wheels',
    title: '左侧三轮独立驱动与转向总成 (Port 3-Wheel Drive Assembly)',
    spec: '7075-T73 锻造铝合金轮毂 · 前后轮 ±90° 原地转向致动器 · 34,008 面',
    explodeVec: new THREE.Vector3(-1.15, -0.14, 0.0),
    camPos: new THREE.Vector3(-2.85, 0.95, 1.65),
    camTarget: new THREE.Vector3(-1.05, 0.35, 0.05),
    isOuterCasing: false,
  },
  MOBILITY_BOGIE_STBD: {
    id: 'MOBILITY_BOGIE_STBD',
    level: 'L1',
    code: 'RMCS STA -0035 · Stbd Ti-6Al-4V Rocker-Bogie',
    title: '右侧钛合金主摇臂与转向架悬架管路 (Starboard Rocker-Bogie Tubes)',
    spec: 'Ti-6Al-4V 薄壁异形钛管 · 被动跨越 40cm 岩石障碍 · 恒定六轮接地载荷分配',
    explodeVec: new THREE.Vector3(0.58, 0.12, 0.0),
    camPos: new THREE.Vector3(2.55, 1.25, 1.35),
    camTarget: new THREE.Vector3(0.85, 0.65, 0.0),
    isOuterCasing: false,
  },
  MOBILITY_BOGIE_PORT: {
    id: 'MOBILITY_BOGIE_PORT',
    level: 'L1',
    code: 'RMCS STA -0035 · Port Ti-6Al-4V Rocker-Bogie',
    title: '左侧钛合金主摇臂与转向架悬架管路 (Port Rocker-Bogie Tubes)',
    spec: 'Ti-6Al-4V 薄壁异形钛管 · 主枢轴差速铰接轴承 · 抗冲击着陆缓冲构型',
    explodeVec: new THREE.Vector3(-0.58, 0.12, 0.0),
    camPos: new THREE.Vector3(-2.55, 1.25, 1.35),
    camTarget: new THREE.Vector3(-0.85, 0.65, 0.0),
    isOuterCasing: false,
  },
  MOBILITY_DIFF_LINK: {
    id: 'MOBILITY_DIFF_LINK',
    level: 'L1',
    code: 'JPL DWG 10272356 · Horizontal Differential Swingarm',
    title: '车体顶部主差速平衡连杆机构 (Rocker-Bogie Differential Linkage)',
    spec: '连接左右主摇臂与恒温电子舱顶板 · 将车体俯仰角稳定在左右摇臂均值的一半',
    explodeVec: new THREE.Vector3(0.0, 0.52, -0.15),
    camPos: new THREE.Vector3(1.65, 1.65, -1.15),
    camTarget: new THREE.Vector3(-0.15, 0.72, -0.22),
    isOuterCasing: false,
  },

  // ================= L2: 5-DOF ROBOTIC ARM, TURRET & SUPERCAM MAST =================
  ROBOTICS_TURRET_HEAD: {
    id: 'ROBOTICS_TURRET_HEAD',
    level: 'L2',
    code: 'RMCS STA +1360 · 45kg Science Turret & Coring Drill',
    title: '转塔科学载荷总成：冲击取芯钻、PIXL 与 SHERLOC/WATSON',
    spec: '3种旋转冲击钻头 · PIXL 微区 X 射线荧光光谱仪 · SHERLOC 深紫外拉曼光谱仪',
    explodeVec: new THREE.Vector3(0.32, 0.22, 1.05),
    camPos: new THREE.Vector3(1.85, 1.68, 2.45),
    camTarget: new THREE.Vector3(0.42, 1.28, 1.15),
    isOuterCasing: false,
  },
  ROBOTICS_5DOF_ARM: {
    id: 'ROBOTICS_5DOF_ARM',
    level: 'L2',
    code: 'RMCS STA +0960 · 2.1m 5-DOF Titanium Robotic Arm',
    title: '2.1米五自由度钛合金采样机械臂 (Shoulder / Elbow / Wrist)',
    spec: '肩部方位/俯仰、肘部、腕部与转塔 5 个谐波减速伺服关节 · 含扁平耐寒加热排线',
    explodeVec: new THREE.Vector3(-0.22, 0.16, 0.68),
    camPos: new THREE.Vector3(-1.75, 1.55, 2.35),
    camTarget: new THREE.Vector3(-0.05, 1.08, 1.05),
    isOuterCasing: false,
  },
  MAST_SUPERCAM_HEAD: {
    id: 'MAST_SUPERCAM_HEAD',
    level: 'L2',
    code: 'RMCS STA +0320 · Z +2050mm SuperCam & Mastcam-Z',
    title: '遥感桅杆云台：SuperCam 激光诱导击穿光谱仪与 Mastcam-Z 变焦双目',
    spec: '1064nm/532nm 脉冲激光器 (7米外气化岩石) · Mastcam-Z 立体多光谱变焦相机 · 火星麦克风',
    explodeVec: new THREE.Vector3(-0.32, 0.72, 0.25),
    camPos: new THREE.Vector3(-1.85, 2.35, 2.15),
    camTarget: new THREE.Vector3(-0.55, 1.85, 0.70),
    isOuterCasing: false,
  },
  MAST_RSM_COLUMN: {
    id: 'MAST_RSM_COLUMN',
    level: 'L2',
    code: 'RMCS STA +0320 · RSM Elevation & Azimuth Mast Column',
    title: '遥感桅杆主立柱、MEDA 气象传感器与展开铰链座 (RSM Pedestal & MEDA)',
    spec: '集成 MEDA 风速/气压/温湿度探针 · 双轴俯仰旋转谐波基座 · 螺旋耐低温排线',
    explodeVec: new THREE.Vector3(-0.25, 0.38, 0.15),
    camPos: new THREE.Vector3(-1.95, 1.75, 1.75),
    camTarget: new THREE.Vector3(-0.48, 1.35, 0.62),
    isOuterCasing: false,
  },

  // ================= L3: WEB CHASSIS, INTERNAL ACA LAB & MMRTG NUCLEAR CORE =================
  CORE_WEB_CHASSIS: {
    id: 'CORE_WEB_CHASSIS',
    level: 'L3',
    code: 'RMCS STA -0880..+0960 · Warm Electronics Box (WEB)',
    title: '恒温电子舱金膜隔热主车体外壳 (Warm Electronics Box Outer Enclosure)',
    spec: '气凝胶复合隔热层 + 镀金抗辐射热控面 · 含空天吊车分离火工座与回路热管 (HRS)',
    explodeVec: new THREE.Vector3(0.0, 0.68, 0.0),
    camPos: new THREE.Vector3(2.45, 1.85, 1.65),
    camTarget: new THREE.Vector3(0.0, 1.15, 0.0),
    isOuterCasing: true,
  },
  CORE_ACA_SAMPLE_LAB: {
    id: 'CORE_ACA_SAMPLE_LAB',
    level: 'L3',
    code: 'RMCS STA +0810 · Adaptive Caching Assembly (ACA Internal Lab)',
    title: '车体内部自适应无菌岩芯封装实验室 (Internal Sample Caching Lab)',
    spec: '43支超净钛合金样品管旋转弹鼓 · 内部小机械臂 · 体积成像与气密冷焊封装工作站',
    explodeVec: new THREE.Vector3(0.0, -0.22, 0.45),
    camPos: new THREE.Vector3(1.75, 1.18, 1.95),
    camTarget: new THREE.Vector3(-0.02, 1.05, 0.82),
    isOuterCasing: false,
  },
  CORE_MMRTG_NUCLEAR: {
    id: 'CORE_MMRTG_NUCLEAR',
    level: 'L3',
    code: 'RMCS STA -1250 · Pu-238 MMRTG Nuclear Generator',
    title: '多任务放射性同位素热电机核电源 (MMRTG Pu-238 Power Source)',
    spec: '4.8kg 二氧化钚 (Pu-238) 热源 · 2000W 热功率 / 110W 持续电功率 · 八翼辐射散热片与氟利昂余热回路',
    explodeVec: new THREE.Vector3(0.0, 0.28, -0.95),
    camPos: new THREE.Vector3(1.95, 1.65, -2.55),
    camTarget: new THREE.Vector3(0.0, 1.16, -1.25),
    isOuterCasing: false,
  },
  CORE_COMM_RADAR_HAZCAMS: {
    id: 'CORE_COMM_RADAR_HAZCAMS',
    level: 'L3',
    code: 'JPL DWG 10253070 & 10461516 · HGA / UHF / Hazcams / RIMFAX',
    title: '深空通信天线阵列 (X波段高增益/UHF)、前后避障相机与 RIMFAX 探地雷达',
    spec: 'X波段对地直连相控阵蝶形天线 · 400MHz UHF 环火中继螺旋天线 · 90MHz 探地雷达与 6目立体避障相机',
    explodeVec: new THREE.Vector3(0.18, 0.45, -0.42),
    camPos: new THREE.Vector3(2.15, 1.78, -1.55),
    camTarget: new THREE.Vector3(0.12, 1.22, -0.55),
    isOuterCasing: false,
  },
};

function classifyMeshName(name) {
  if (name === 'Wheels_Stbd_R') return SUBSYSTEM_META.MOBILITY_WHEELS_STBD;
  if (name === 'Wheels_Port_L') return SUBSYSTEM_META.MOBILITY_WHEELS_PORT;
  if (name === 'Suspension_Stbd_R') return SUBSYSTEM_META.MOBILITY_BOGIE_STBD;
  if (name === 'Suspension_Port_L') return SUBSYSTEM_META.MOBILITY_BOGIE_PORT;
  if (name.startsWith('arm_0')) return SUBSYSTEM_META.MOBILITY_DIFF_LINK;

  if (
    name.startsWith('turret') ||
    name === 'PIXL' ||
    name === 'PIXL_cover_01' ||
    name === 'WATSON' ||
    name === 'corring_drill' ||
    name === 'cover_02' ||
    name === 'cover_03' ||
    name === 'Down_Look_Camera' ||
    name === 'hinge'
  ) {
    return SUBSYSTEM_META.ROBOTICS_TURRET_HEAD;
  }

  if (
    name === 'arm' ||
    name.startsWith('arm.') ||
    name === 'arm_cable_etc' ||
    name.startsWith('calibration_target') ||
    name === 'part_01'
  ) {
    return SUBSYSTEM_META.ROBOTICS_5DOF_ARM;
  }

  if (name === 'head' || name === 'Mastcam_Z_cams' || name === 'NavCams' || name === 'lens' || name === 'microphones.001') {
    return SUBSYSTEM_META.MAST_SUPERCAM_HEAD;
  }

  if (
    name === 'top' ||
    name === 'base' ||
    name.startsWith('bottom') ||
    name.startsWith('Cylinder') ||
    name === 'probe.001'
  ) {
    return SUBSYSTEM_META.MAST_RSM_COLUMN;
  }

  if (name === 'lab') return SUBSYSTEM_META.CORE_ACA_SAMPLE_LAB;
  if (name === 'rtg') return SUBSYSTEM_META.CORE_MMRTG_NUCLEAR;
  if (
    name.startsWith('antenna') ||
    name.startsWith('hazcams') ||
    name === 'RIMFAX' ||
    name === 'Up_Look_Camera' ||
    name === 'Name_Chips' ||
    name === 'microphones'
  ) {
    return SUBSYSTEM_META.CORE_COMM_RADAR_HAZCAMS;
  }

  return SUBSYSTEM_META.CORE_WEB_CHASSIS;
}

export class Mars2020AssetLoader {
  constructor(sceneRoot, onProgress) {
    this.sceneRoot = sceneRoot;
    this.onProgress = onProgress;
    this.gltfLoader = new GLTFLoader();
    this.roverGroup = new THREE.Group();
    this.roverGroup.name = 'MARS2020_PERSEVERANCE_HIGHPOLY_GROUP';
    this.sceneRoot.add(this.roverGroup);

    this.interactiveMeshes = [];
    this.pbrMaterials = new Set();
    this.ghostMatOuter = createFresnelGhostMaterial({ rimColor: 0x38bdf8, coreColor: 0x050e1d, opacity: 0.14 });
    this.ghostMatInner = createFresnelGhostMaterial({ rimColor: 0x22d3ee, coreColor: 0x061020, opacity: 0.11 });
    this.totalTriangles = 0;
  }

  async loadAllPackages(basePath = './models') {
    const files = [
      { key: 'L1', url: `${basePath}/L1_mobility_rocker_bogie.glb` },
      { key: 'L2', url: `${basePath}/L2_turret_mast_robotics.glb` },
      { key: 'L3', url: `${basePath}/L3_chassis_mmrtg_lab.glb` },
    ];

    let completed = 0;
    const gltfs = await Promise.all(
      files.map(async (f) => {
        const gltf = await this.gltfLoader.loadAsync(f.url);
        completed += 1;
        if (this.onProgress) {
          this.onProgress(completed / files.length, `已流式加载 ${f.key} 高精工业模型包 (${f.url.split('/').pop()})...`);
        }
        return gltf;
      })
    );

    gltfs.forEach((gltf) => this._processLoadedScene(gltf.scene));

    if (this.onProgress) {
      this.onProgress(1.0, `已加载 NASA JPL 毅力号 70 独立部件 · ${this.totalTriangles.toLocaleString()} 三角面`);
    }
    return this.interactiveMeshes;
  }

  _processLoadedScene(root) {
    root.updateMatrixWorld(true);
    const meshes = [];
    root.traverse((child) => {
      if (child.isMesh) meshes.push(child);
    });

    meshes.forEach((mesh) => {
      const meta = classifyMeshName(mesh.name);
      const triCount = mesh.geometry.index
        ? mesh.geometry.index.count / 3
        : mesh.geometry.attributes.position.count / 3;
      this.totalTriangles += Math.round(triCount);

      // Clone or upgrade material with metallic HDRI response + Laser Clip Shader
      const origMats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      const enhancedMats = origMats.map((m) => {
        const clone = m ? m.clone() : new THREE.MeshStandardMaterial({ color: 0xcccccc });
        if (clone.isMeshStandardMaterial) {
          clone.envMapIntensity = 1.45;
          clone.roughness = Math.max(0.14, Math.min(0.75, clone.roughness ?? 0.38));
        }
        injectLaserClipShader(clone);
        this.pbrMaterials.add(clone);
        return clone;
      });

      const finalMat = enhancedMats.length === 1 ? enhancedMats[0] : enhancedMats;
      mesh.material = finalMat;

      // Preserve world transform when reparenting into roverGroup
      mesh.applyMatrix4(mesh.parent ? mesh.parent.matrixWorld : new THREE.Matrix4());
      this.roverGroup.add(mesh);

      mesh.userData = {
        isRoverPart: true,
        meshName: mesh.name,
        subsystemId: meta.id,
        level: meta.level,
        code: meta.code,
        title: meta.title,
        spec: meta.spec,
        explodeVec: meta.explodeVec.clone(),
        camPos: meta.camPos.clone(),
        camTarget: meta.camTarget.clone(),
        isOuterCasing: meta.isOuterCasing,
        basePosition: mesh.position.clone(),
        baseScale: mesh.scale.clone(),
        origMaterial: finalMat,
        ghostMaterial: meta.isOuterCasing ? this.ghostMatOuter : this.ghostMatInner,
        triCount: Math.round(triCount),
      };

      this.interactiveMeshes.push(mesh);
    });
  }
}
