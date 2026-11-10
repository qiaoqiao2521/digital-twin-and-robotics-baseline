export interface ManifestRepo {
  category: string;
  repository: string;
  description: string;
  upstreamUrl: string;
  primaryBaselineFile: string;
  linksAndJoints?: string;
  kinematicFileCount: number;
  docFileCount: number;
  kinematicFiles: string[];
  docFiles: string[];
}

export interface RobotPack {
  id: string;
  name: string;
  subtitle: string;
  category: string;
  glbUrl: string;
  previewUrl: string;
  baselineRepo: string;
  primaryUrdf: string;
  upstreamUrl: string;
  specs: { label: string; value: string }[];
}

export interface KinematicStats {
  linkCount: number;
  jointCount: number;
  actuatorCount: number;
  format: 'URDF' | 'MJCF_XML' | 'XACRO' | 'SDF' | 'DOC';
  sampleJoints: string[];
}

export type DrillLevel = 'L0' | 'L1' | 'L2' | 'L3';

export interface UrdfJointDef {
  name: string;
  type: 'revolute' | 'continuous' | 'prismatic' | 'fixed';
  parent: string;
  child: string;
  xyz: [number, number, number];
  rpy: [number, number, number];
  axis: [number, number, number];
  lower: number;
  upper: number;
}

export interface TwinLevelSpec {
  level: DrillLevel;
  title: string;
  subtitle: string;
  focusDescription: string;
  explosionDefault: number;
  clipDefault: number;
  keyMetrics: { label: string; value: string }[];
}

export interface TwinWorkstationConfig {
  id: 'mars2020' | 'b737_cfm56' | 'b737_bridge';
  title: string;
  badge: string;
  subtitle: string;
  accentColor: string;
  glbLayers: {
    L1: string;
    L2: string;
    L3: string;
  };
  levels: TwinLevelSpec[];
  engineeringSpecs: { label: string; value: string }[];
}

export const ROBOT_PACKS: RobotPack[] = [
  {
    id: 'sar',
    name: '履带越障搜救机器人 (Search-and-Rescue)',
    subtitle: '主履带底盘 + 4×独立越障摆臂 Flippers + 6轴 AR4 机械臂 + 激光雷达',
    category: '地面特种搜救',
    glbUrl: '/robotics_glb/search_and_rescue_tracked_robot.glb',
    previewUrl: '/robotics_glb/search_and_rescue_tracked_robot.png',
    baselineRepo: '01-履带越障搜救机器人/Search-and-Rescue-Robot',
    primaryUrdf: 'urdf/sar_urdf.urdf',
    upstreamUrl: 'https://github.com/nikhil-prasad-k/Search-and-Rescue-Robot',
    specs: [
      { label: '网格精度', value: '208,744 Tris / 66 STL' },
      { label: '运动关节', value: '19 Joints (4 Flippers + 6-DOF AR4)' },
      { label: '现实基准', value: 'sar_urdf.urdf + gz_ar4.urdf.xacro' }
    ]
  },
  {
    id: 'rexrov2',
    name: '深海重型作业级 ROV (RexROV2 + Oberon7)',
    subtitle: '3000米级深海作业框架 + 7轴液压水下机械爪 + 6矢量推进器',
    category: '深海重工 ROV',
    glbUrl: '/robotics_glb/rexrov2_oberon7_subsea_rov.glb',
    previewUrl: '/robotics_glb/rexrov2_oberon7_subsea_rov.png',
    baselineRepo: '02-水下机器人ROV与深海作业系统/rexrov2',
    primaryUrdf: 'rexrov2_description/robots/rexrov2_oberon7.xacro',
    upstreamUrl: 'https://github.com/uuvsimulator/uuv_simulator',
    specs: [
      { label: '网格精度', value: '843,403 Tris / 74 CAD 部件' },
      { label: '作业机械臂', value: 'Oberon7 7-DOF 液压串联臂' },
      { label: '现实基准', value: 'rexrov2_oberon7.xacro + serial_arm.xacro' }
    ]
  },
  {
    id: 'bluerov2',
    name: '水下推进机器人 (BlueROV2 + Ping360 声呐)',
    subtitle: '行业标准6推进器矢量水下机器人 + 360° 扫描声呐探头',
    category: '水下勘测 ROV',
    glbUrl: '/robotics_glb/bluerov2_underwater_rov.glb',
    previewUrl: '/robotics_glb/bluerov2_underwater_rov.png',
    baselineRepo: '02-水下机器人ROV与深海作业系统/bluerov2',
    primaryUrdf: 'bluerov2_description/urdf/thrusters.xacro',
    upstreamUrl: 'https://github.com/CentraleNantesROV/bluerov2',
    specs: [
      { label: '网格精度', value: '380,683 Tris / 202 CAD 零件' },
      { label: '推进配置', value: '6 × T200 矢量螺旋桨推进器' },
      { label: '现实基准', value: 'thrusters.xacro + sensors.xacro' }
    ]
  },
  {
    id: 'unitree_g1',
    name: '宇树双足人形机器人 (Unitree G1 29-DOF)',
    subtitle: '29自由度全尺寸具身人形底盘 + Dex3-1 灵巧手',
    category: '双足具身人形',
    glbUrl: '/robotics_glb/unitree_g1_humanoid.glb',
    previewUrl: '/robotics_glb/unitree_g1_humanoid.png',
    baselineRepo: '03-宇树Unitree四足与人形全系_URDF/unitree_ros',
    primaryUrdf: 'robots/g1_description/g1_29dof_with_hand_rev_1_0.urdf',
    upstreamUrl: 'https://github.com/unitreerobotics/unitree_ros',
    specs: [
      { label: '全身自由度', value: '29-DOF 主躯干 + 灵巧手 (53 Joints)' },
      { label: '网格精度', value: '630,394 Tris / 49 STL CAD 部件' },
      { label: '现实基准', value: 'g1_29dof_with_hand_rev_1_0.urdf' }
    ]
  },
  {
    id: 'unitree_go2',
    name: '宇树四足机器狗 (Unitree Go2 Quadruped)',
    subtitle: '12自由度高动态四足关节链 + 4D 超广角激光雷达 L1',
    category: '四足越野机器人',
    glbUrl: '/robotics_glb/unitree_go2_quadruped.glb',
    previewUrl: '/robotics_glb/unitree_go2_quadruped.png',
    baselineRepo: '03-宇树Unitree四足与人形全系_URDF/unitree_ros',
    primaryUrdf: 'robots/go2_description/urdf/go2_description.urdf',
    upstreamUrl: 'https://github.com/unitreerobotics/unitree_ros',
    specs: [
      { label: '运动关节', value: '12-DOF (FL/FR/RL/RR Hip-Thigh-Calf)' },
      { label: '网格精度', value: '398,632 Tris / 17 DAE CAD 部件' },
      { label: '现实基准', value: 'go2_description.urdf' }
    ]
  },
  {
    id: 'unitree_z1',
    name: '六轴协作机械臂 (Unitree Z1 6-DOF Arm)',
    subtitle: '谐波减速器六轴轻量机械臂 + 平行伺服夹爪',
    category: '工业与协作机械臂',
    glbUrl: '/robotics_glb/unitree_z1_manipulator.glb',
    previewUrl: '/robotics_glb/unitree_z1_manipulator.png',
    baselineRepo: '03-宇树Unitree四足与人形全系_URDF/unitree_ros',
    primaryUrdf: 'robots/z1_description/xacro/z1.urdf',
    upstreamUrl: 'https://github.com/unitreerobotics/unitree_ros',
    specs: [
      { label: '运动关节', value: '6-DOF 串联旋转关节 + Gripper 夹爪' },
      { label: '网格精度', value: '244,392 Tris / 9 STL CAD 部件' },
      { label: '现实基准', value: 'z1.urdf + robot.xacro' }
    ]
  }
];

export const TWIN_WORKSTATIONS: Record<'mars2020' | 'b737_cfm56' | 'b737_bridge', TwinWorkstationConfig> = {
  mars2020: {
    id: 'mars2020',
    title: 'NASA 毅力号核动力火星车 (Mars 2020 Perseverance Rover)',
    badge: '深空探测四级数字孪生 L0→L3',
    subtitle: '真实加载 NASA 官方高精度 GLB 分系统：L1 六轮摇臂悬架 (95,038 tris) + L2 采样机械臂与桅杆 (43,550 tris) + L3 车体与 MMRTG 核电源 (60,933 tris)',
    accentColor: 'amber',
    glbLayers: {
      L1: '/twins/models/L1_mobility_rocker_bogie.glb',
      L2: '/twins/models/L2_turret_mast_robotics.glb',
      L3: '/twins/models/L3_chassis_mmrtg_lab.glb'
    },
    engineeringSpecs: [
      { label: '整备质量 / 尺寸', value: '1,025 kg / 3.0m × 2.7m × 2.2m' },
      { label: 'L1 摇臂悬架网格', value: '95,038 Tris (L1_mobility_rocker_bogie.glb)' },
      { label: 'L2 机械臂与桅杆', value: '43,550 Tris (L2_turret_mast_robotics.glb)' },
      { label: 'L3 车体与核热源', value: '60,933 Tris (L3_chassis_mmrtg_lab.glb)' }
    ],
    levels: [
      {
        level: 'L0',
        title: 'L0 · 毅力号整车三维总成与工程坐标包络',
        subtitle: 'L1+L2+L3 全分系统总装 (199,521 Tris) + 局部关节坐标轴系',
        focusDescription: '完整同屏加载 L1 摇臂转向架、L2 五轴转塔机械臂/Mastcam-Z 遥感桅杆与 L3 暖电子舱/MMRTG 核电池三大真实 GLB 分系统。',
        explosionDefault: 0.0,
        clipDefault: 1.0,
        keyMetrics: [
          { label: '总装三角面数', value: '199,521 Tris (68 个 NASA 原厂网格)' },
          { label: '着陆触地速度', value: '0.75 m/s Skycrane 恒速释放' },
          { label: '自由度总数', value: '6轮驱动 + 4轮转向 + 5轴采样臂 + 2轴桅杆' }
        ]
      },
      {
        level: 'L1',
        title: 'L1 · 六轮摇臂转向架悬架系统 (Rocker-Bogie)',
        subtitle: 'L1_mobility_rocker_bogie.glb (95,038 Tris) 实体聚焦 · L2/L3 幽灵化',
        focusDescription: '聚焦 L1 钛合金主副摇臂 (suspension: 25,334 tris)、差速平衡杆与 6 个 52.5cm 铝合金防滑车轮 (Wheels_objs: 68,016 tris)，其余分系统自动切换为 Ghost Context (opacity: 0.12)。',
        explosionDefault: 0.18,
        clipDefault: 1.0,
        keyMetrics: [
          { label: 'L1 真实面数', value: '95,038 Tris (Wheels + Suspension)' },
          { label: '越障能力', value: '可跨越 40 cm 垂直岩石障碍' },
          { label: '车轮直径', value: '52.5 cm 铝合金波形防滑轮 × 6' }
        ]
      },
      {
        level: 'L2',
        title: 'L2 · 五轴岩芯采样机械臂与 SuperCam 遥感桅杆',
        subtitle: 'L2_turret_mast_robotics.glb (43,550 Tris) 实体聚焦 · L1/L3 幽灵化',
        focusDescription: '聚焦 L2 前端 2.1 米五自由度机械臂、末端 PIXL/WATSON/冲击岩芯钻转塔 (turret_obj: 16,106 tris) 与 Mastcam-Z / NavCams 遥感桅杆。',
        explosionDefault: 0.32,
        clipDefault: 1.0,
        keyMetrics: [
          { label: 'L2 真实面数', value: '43,550 Tris (Turret + Arm + RSM Mast)' },
          { label: '机械臂末端载荷', value: '45 kg 旋转冲击钻头转塔' },
          { label: '视觉传感器', value: 'Mastcam-Z 双目变焦 + NavCams 导航相机' }
        ]
      },
      {
        level: 'L3',
        title: 'L3 · 暖电子舱车体、MMRTG 钚-238 核电池与内舱实验室',
        subtitle: 'L3_chassis_mmrtg_lab.glb (60,933 Tris) 实体聚焦 · L1/L2 幽灵化',
        focusDescription: '下钻至 L3 核心车体与热端载荷：尾部 MMRTG 放射性同位素热电机 (rtg: 11,444 tris)、舱内样品实验室 (lab: 8,342 tris)、前后避障相机 (hazcams) 与高增益天线。',
        explosionDefault: 0.45,
        clipDefault: 0.72,
        keyMetrics: [
          { label: 'L3 真实面数', value: '60,933 Tris (MMRTG + Lab + WEB Body)' },
          { label: 'MMRTG 功率', value: '2,000 W 热功率 / 110 W 持续电功率' },
          { label: '地空通信天线', value: 'UHF 超高频天线 + X波段高增益天线' }
        ]
      }
    ]
  },
  b737_cfm56: {
    id: 'b737_cfm56',
    title: '波音 B737 / CFM56-7B 大涵道比双转子涡扇发动机数字孪生',
    badge: '航空推进四级数字孪生 L0→L3',
    subtitle: '真实加载三层高精度涡扇 GLB：L1 短舱与 C 型反推罩 + L2 N1/N2 宽弦风扇与压气机核心机 + L3 双环腔燃烧室与高低压涡轮热端',
    accentColor: 'cyan',
    glbLayers: {
      L1: '/twins/models/L1_nacelle_casings.glb',
      L2: '/twins/models/L2_turbofan_core.glb',
      L3: '/twins/models/L3_hpt_combustor.glb'
    },
    engineeringSpecs: [
      { label: '发动机型号', value: 'CFM56-7B27 双转子轴流涡扇发动机' },
      { label: 'L1 短舱反推总成', value: 'L1_nacelle_casings.glb' },
      { label: 'L2 风扇压气核心', value: 'L2_turbofan_core.glb' },
      { label: 'L3 燃烧室与涡轮', value: 'L3_hpt_combustor.glb' }
    ],
    levels: [
      {
        level: 'L0',
        title: 'L0 · CFM56-7B 涡扇推进系统全机总装包络',
        subtitle: 'L1 外涵短舱 + L2 风扇/压气机 + L3 燃烧室/涡轮 全三维耦合总成',
        focusDescription: '完整同屏展示 CFM56-7B 进气道消音唇口、凯夫拉包容机匣、36片宽弦钛合金风扇、4级增压级、9级高压压气机、环形燃烧室与高低压涡轮。',
        explosionDefault: 0.0,
        clipDefault: 1.0,
        keyMetrics: [
          { label: '起飞推力 / 涵道比', value: '121.4 kN (27,300 lbf) / 5.1:1' },
          { label: 'N1 / N2 额定转速', value: '5,380 RPM / 15,183 RPM' },
          { label: '总增压比 (OPR)', value: '32.8 : 1' }
        ]
      },
      {
        level: 'L1',
        title: 'L1 · 进气消音唇口、包容机匣与 C 型叶栅反推短舱',
        subtitle: 'L1_nacelle_casings.glb 实体聚焦 · L2/L3 核心机幽灵化',
        focusDescription: '聚焦 L1 外涵道气动短舱、凯夫拉风扇叶片包容环、左右 C 型反推平移罩 (thrust_reverser_c_duct) 与尾部锯齿消音喷管 (exhaust_chevron_nozzle)。',
        explosionDefault: 0.25,
        clipDefault: 1.0,
        keyMetrics: [
          { label: '风扇叶尖直径', value: '1.55 m (61.0 in 宽弦钛合金风扇)' },
          { label: '反推制动效率', value: '叶栅式外涵道斜向折流反推' },
          { label: '短舱减噪设计', value: '进气声衬 + 尾喷管锯齿边 (Chevron)' }
        ]
      },
      {
        level: 'L2',
        title: 'L2 · N1 宽弦风扇、4级低压增压级与 9级高压压气机核心机',
        subtitle: 'L2_turbofan_core.glb 实体聚焦 · L1/L3 幽灵上下文模式',
        focusDescription: '将外机匣与尾部热端切换为 Ghost Context (opacity: 0.12)，直接透视 36 片三维弯掠钛合金风扇叶片、4 级 LPC 增压转子、44 片 OGV 出口导叶与 9 级轴流 HPC 高压压气机。',
        explosionDefault: 0.35,
        clipDefault: 0.78,
        keyMetrics: [
          { label: '风扇级参数', value: '36 片宽弦实心钛合金弯掠风扇' },
          { label: '低压增压级', value: '4 级轴流 LPC 增压鼓筒' },
          { label: '高压压气机', value: '9 级轴流 HPC (前3级可变静子叶片)' }
        ]
      },
      {
        level: 'L3',
        title: 'L3 · 双环腔燃烧室、单晶气膜冷却高压涡轮 (HPT) 与 4级低压涡轮',
        subtitle: 'L3_hpt_combustor.glb 实体聚焦 · L1/L2 幽灵上下文模式',
        focusDescription: '下钻至最高温热端核心：检视环形燃烧室火焰筒 (double_annular_combustor_liner)、68片 Rene N5 单晶气膜冷却高压涡轮转子、4级低压涡轮叶栅与同心双转子主轴。',
        explosionDefault: 0.55,
        clipDefault: 0.65,
        keyMetrics: [
          { label: '涡轮前温度 TIT', value: '1,620 K (单晶定向凝固 HPT 叶片)' },
          { label: '高压涡轮级', value: '1 级高负荷气膜冷却轴流涡轮' },
          { label: '低压涡轮级', value: '4 级三维扭叶片 LPT 驱动前风扇' }
        ]
      }
    ]
  },
  b737_bridge: {
    id: 'b737_bridge',
    title: '航空涡扇推进骨架母树 · 外涵承力机匣与双转子主轴传力拓扑',
    badge: '航空结构传力母树 L0→L3',
    subtitle: '基于 L1/L2/L3 真实 GLB 模型的传力路径解析：外涵机匣环向载荷环 vs. N1/N2 同心主轴轴向推力与扭矩传递链',
    accentColor: 'emerald',
    glbLayers: {
      L1: '/twins/models/L1_nacelle_casings.glb',
      L2: '/twins/models/L2_turbofan_core.glb',
      L3: '/twins/models/L3_hpt_combustor.glb'
    },
    engineeringSpecs: [
      { label: '外涵承力机匣', value: 'Ti-6Al-4V 钛合金前风扇框 + 凯夫拉包容环' },
      { label: '冷端转子鼓筒', value: 'N1 风扇-增压级钛合金盘鼓转子' },
      { label: '热端转子扭矩链', value: 'Inconel 718 镍基高温合金 HPT/LPT 涡轮盘' },
      { label: '主轴承支承拓扑', value: '5 支点滚珠/滚棒主轴承推力传递路径' }
    ],
    levels: [
      {
        level: 'L0',
        title: 'L0 · 整机内外涵气动与机械传力总包络',
        subtitle: 'L1 外机匣承力环 + L2 压气机鼓筒 + L3 涡轮主轴全耦合视图',
        focusDescription: '展示推力从风扇与高压压气机产生、经主轴承座传至外涵风扇框、再传至机翼挂架吊点的完整工程力学母树。',
        explosionDefault: 0.0,
        clipDefault: 1.0,
        keyMetrics: [
          { label: '外涵分流推力占比', value: '约 80% 净推力由外涵风扇提供' },
          { label: '极限叶片飞脱载荷', value: 'FBO (Fan Blade Out) 动不平衡包容认证' },
          { label: '轴向合成推力载荷', value: '121.4 kN 经 1# 2# 止推球轴承传递' }
        ]
      },
      {
        level: 'L1',
        title: 'L1 · 外涵道承力短舱、风扇包容环与反推C型罩壳体骨架',
        subtitle: 'L1_nacelle_casings.glb 承力壳体聚焦 · L2/L3 幽灵化',
        focusDescription: '聚焦外层薄壁环壳结构：进气道前缘抗鸟撞唇口、风扇包容机匣环向刚度环与 C 型反推承力框梁。',
        explosionDefault: 0.22,
        clipDefault: 1.0,
        keyMetrics: [
          { label: '机匣比刚度设计', value: '薄壁加劲环壳抗弯扭耦合变形' },
          { label: '反推展开载荷', value: '承受落地高速反向气动冲击力' },
          { label: '尾喷管热膨胀补偿', value: '锯齿边环向热应力释放结构' }
        ]
      },
      {
        level: 'L2',
        title: 'L2 · 冷端高速旋转叶轮与 9级轴流压气机气动载荷链',
        subtitle: 'L2_turbofan_core.glb 转静子叶栅聚焦 · L1/L3 幽灵化',
        focusDescription: '聚焦承受极高离心拉应力与气动弯矩的 36 片宽弦风扇及 13 级（4 LPC + 9 HPC）轴流压气机转子盘鼓。',
        explosionDefault: 0.4,
        clipDefault: 0.75,
        keyMetrics: [
          { label: '风扇叶尖线速度', value: '435 m/s (跨音速激波气动载荷)' },
          { label: '压气机盘鼓结构', value: '惯性摩擦焊整体钛合金鼓筒转子' },
          { label: '出口导叶 OGV', value: '兼作外涵气流矫直与前后机匣传力撑杆' }
        ]
      },
      {
        level: 'L3',
        title: 'L3 · 热端涡轮高温蠕变载荷链与 N1/N2 同心双轴扭矩传递',
        subtitle: 'L3_hpt_combustor.glb 热端与主轴聚焦 · L1/L2 幽灵化',
        focusDescription: '聚焦承受 1,620 K 燃气冲刷与数万G离心力的 HPT/LPT 涡轮叶栅，以及贯穿全机的 N1/N2 同心传动主轴。',
        explosionDefault: 0.6,
        clipDefault: 0.6,
        keyMetrics: [
          { label: 'HPT 叶片离心载荷', value: '单片叶片根部榫头承受 > 90 kN 拉力' },
          { label: '低压主轴扭矩', value: 'LPT 4级涡轮通过同心内轴驱动前风扇' },
          { label: '热端材料体系', value: 'Rene N5 单晶叶片 + 粉末冶金涡轮盘' }
        ]
      }
    ]
  }
};

export function filterRepositories(
  repos: ManifestRepo[],
  searchQuery: string,
  categoryFilter: string = 'ALL'
): ManifestRepo[] {
  const q = searchQuery.trim().toLowerCase();
  return repos.filter((r) => {
    if (categoryFilter !== 'ALL' && r.category !== categoryFilter) {
      return false;
    }
    if (!q) return true;
    return (
      r.repository.toLowerCase().includes(q) ||
      r.description.toLowerCase().includes(q) ||
      r.category.toLowerCase().includes(q) ||
      (r.primaryBaselineFile && r.primaryBaselineFile.toLowerCase().includes(q))
    );
  });
}

export function parseKinematicStats(content: string, filePath: string): KinematicStats {
  const lowerPath = filePath.toLowerCase();
  let format: KinematicStats['format'] = 'DOC';
  if (lowerPath.endsWith('.xacro')) format = 'XACRO';
  else if (lowerPath.endsWith('.urdf')) format = 'URDF';
  else if (lowerPath.endsWith('.sdf')) format = 'SDF';
  else if (lowerPath.endsWith('.xml')) format = 'MJCF_XML';

  const linkMatches = content.match(/<(link|body)\b[^>]*>/gi) || [];
  const jointMatches = content.match(/<joint\b[^>]*>/gi) || [];
  const actuatorMatches = content.match(/<(motor|position|velocity|general|transmission|actuator)\b[^>]*>/gi) || [];

  const sampleJoints: string[] = [];
  const jointNameRegex = /<joint\b[^>]*name=["']([^"']+)["'][^>]*>/gi;
  let m: RegExpExecArray | null;
  while ((m = jointNameRegex.exec(content)) !== null && sampleJoints.length < 8) {
    if (!sampleJoints.includes(m[1])) {
      sampleJoints.push(m[1]);
    }
  }

  return {
    linkCount: linkMatches.length,
    jointCount: jointMatches.length,
    actuatorCount: actuatorMatches.length,
    format,
    sampleJoints
  };
}

/**
 * Parses real <joint> definitions from a URDF / XACRO XML string.
 * Uses DOMParser when available in the browser, with a deterministic regex parser fallback for Node.js tests.
 */
export function parseUrdfJoints(xmlContent: string): UrdfJointDef[] {
  if (!xmlContent || !xmlContent.includes('<joint')) return [];

  const parseNumTuple = (str: string | null | undefined, fallback: [number, number, number]): [number, number, number] => {
    if (!str) return fallback;
    const parts = str.trim().split(/\s+/).map(Number);
    if (parts.length >= 3 && parts.every((n) => !Number.isNaN(n))) {
      return [parts[0], parts[1], parts[2]];
    }
    return fallback;
  };

  if (typeof DOMParser !== 'undefined') {
    try {
      const doc = new DOMParser().parseFromString(xmlContent, 'text/xml');
      const jointEls = Array.from(doc.getElementsByTagName('joint'));
      if (jointEls.length > 0) {
        const out: UrdfJointDef[] = [];
        for (const el of jointEls) {
          const name = el.getAttribute('name') || '';
          const rawType = (el.getAttribute('type') || 'fixed').toLowerCase();
          const parentEl = el.getElementsByTagName('parent')[0];
          const childEl = el.getElementsByTagName('child')[0];
          if (!name || !parentEl || !childEl) continue;
          const parent = (parentEl.getAttribute('link') || '').replace(/^\//, '');
          const child = (childEl.getAttribute('link') || '').replace(/^\//, '');
          if (!parent || !child) continue;

          const originEl = el.getElementsByTagName('origin')[0];
          const axisEl = el.getElementsByTagName('axis')[0];
          const limitEl = el.getElementsByTagName('limit')[0];

          const xyz = parseNumTuple(originEl?.getAttribute('xyz'), [0, 0, 0]);
          const rpy = parseNumTuple(originEl?.getAttribute('rpy'), [0, 0, 0]);
          const axis = parseNumTuple(axisEl?.getAttribute('xyz'), [1, 0, 0]);
          const lower = limitEl?.getAttribute('lower') ? Number(limitEl.getAttribute('lower')) : -Math.PI;
          const upper = limitEl?.getAttribute('upper') ? Number(limitEl.getAttribute('upper')) : Math.PI;
          const type: UrdfJointDef['type'] =
            rawType === 'revolute' || rawType === 'continuous' || rawType === 'prismatic'
              ? rawType
              : 'fixed';

          out.push({
            name: name.replace(/^\//, ''),
            type,
            parent,
            child,
            xyz,
            rpy,
            axis,
            lower: Number.isNaN(lower) ? -Math.PI : lower,
            upper: Number.isNaN(upper) ? Math.PI : upper
          });
        }
        if (out.length > 0) return out;
      }
    } catch {
      // Fallback to regex parser below
    }
  }

  const results: UrdfJointDef[] = [];
  const jointRe = /<joint\s+name=["']([^"']+)["']\s+type=["']([^"']+)["'][^>]*>([\s\S]*?)<\/joint>/gi;
  let m: RegExpExecArray | null;
  while ((m = jointRe.exec(xmlContent)) !== null) {
    const rawName = m[1].replace(/^\//, '');
    const rawType = m[2].toLowerCase();
    const body = m[3];
    const pM = body.match(/<parent\s+link=["']([^"']+)["']/i);
    const cM = body.match(/<child\s+link=["']([^"']+)["']/i);
    if (!pM || !cM) continue;
    const oM = body.match(/<origin\s+([^>]+)\/>/i);
    const aM = body.match(/<axis\s+xyz=["']([^"']+)["']/i);
    const lM = body.match(/<limit\s+([^>]+)\/>/i);

    let xyz: [number, number, number] = [0, 0, 0];
    let rpy: [number, number, number] = [0, 0, 0];
    if (oM) {
      const xm = oM[1].match(/xyz=["']([^"']+)["']/i);
      const rm = oM[1].match(/rpy=["']([^"']+)["']/i);
      xyz = parseNumTuple(xm?.[1], [0, 0, 0]);
      rpy = parseNumTuple(rm?.[1], [0, 0, 0]);
    }
    const axis = parseNumTuple(aM?.[1], [1, 0, 0]);
    let lower = -Math.PI;
    let upper = Math.PI;
    if (lM) {
      const lowM = lM[1].match(/lower=["']([^"']+)["']/i);
      const upM = lM[1].match(/upper=["']([^"']+)["']/i);
      if (lowM && !Number.isNaN(Number(lowM[1]))) lower = Number(lowM[1]);
      if (upM && !Number.isNaN(Number(upM[1]))) upper = Number(upM[1]);
    }
    const type: UrdfJointDef['type'] =
      rawType === 'revolute' || rawType === 'continuous' || rawType === 'prismatic'
        ? rawType
        : 'fixed';

    results.push({
      name: rawName,
      type,
      parent: pM[1].replace(/^\//, ''),
      child: cM[1].replace(/^\//, ''),
      xyz,
      rpy,
      axis,
      lower,
      upper
    });
  }
  return results;
}

/**
 * Classifies a real GLB mesh node name into L1 (Chassis/Hull/Primary Mobility),
 * L2 (Flippers/Manipulator Links/Leg Links/Core Compressor), or L3 (Motors/Sensors/Hot-Section/End-Effector).
 */
export function classifyMeshLayer(meshName: string): 'L1' | 'L2' | 'L3' {
  const n = meshName.toLowerCase();

  // L3: Motors, LiDAR, Sonar, Cameras, End-Effector Fingers/Hands, Nuclear/Thermal/Internal Lab modules
  if (
    n.includes('motor') ||
    n.includes('lidar') ||
    n.includes('sonar') ||
    n.includes('sensor') ||
    n.includes('camera') ||
    n.includes('hazcam') ||
    n.includes('navcam') ||
    n.includes('mastcam') ||
    n.includes('imu') ||
    n.includes('bar30') ||
    n.includes('esc') ||
    n.includes('lumen') ||
    n.includes('tether') ||
    n.includes('rtg') ||
    n.includes('lab') ||
    n.includes('rimfax') ||
    n.includes('pixl') ||
    n.includes('watson') ||
    n.includes('drill') ||
    n.includes('combustor') ||
    n.includes('hpt') ||
    n.includes('lpt') ||
    n.includes('shaft') ||
    n.includes('finger') ||
    n.includes('hand') ||
    n.includes('dex') ||
    n.includes('gripper') ||
    n.includes('link_6') ||
    n.includes('link06') ||
    n.includes('head') ||
    n.includes('d455')
  ) {
    return 'L3';
  }

  // L2: Flippers (f_front_left..), Manipulator Links (link_1..5, ar4, oberon7, z1), Leg/Arm Links, Thrusters, Turbofan Core
  if (
    n.startsWith('f_') ||
    n.includes('flipper') ||
    n.includes('ar4') ||
    n.includes('oberon') ||
    n.includes('link_') ||
    n.includes('link01') ||
    n.includes('link02') ||
    n.includes('link03') ||
    n.includes('link04') ||
    n.includes('link05') ||
    n.includes('shoulder') ||
    n.includes('elbow') ||
    n.includes('forearm') ||
    n.includes('wrist') ||
    n.includes('upper_arm') ||
    n.includes('turret') ||
    n.includes('arm') ||
    n.includes('thigh') ||
    n.includes('calf') ||
    n.includes('knee') ||
    n.includes('ankle') ||
    n.includes('foot') ||
    n.includes('hip') ||
    n.includes('thruster') ||
    n.includes('prop') ||
    n.includes('lpc') ||
    n.includes('hpc') ||
    n.includes('ogv') ||
    n.includes('n1_wide_chord')
  ) {
    return 'L2';
  }

  // L1: Chassis, Base Link, Hull, Tracks/Wheels, Nacelle Casings
  return 'L1';
}

/**
 * Computes Ghost Context material parameters when switching L0 -> L1 -> L2 -> L3.
 * Non-focused layers use Ghost Context: opacity: 0.12, transparent: true, depthWrite: false.
 */
export function computeGhostMaterialState(
  meshLayer: 'L1' | 'L2' | 'L3',
  activeLevel: DrillLevel,
  isHighlighted: boolean,
  anyHighlighted: boolean,
  xrayMode: boolean
): {
  opacity: number;
  transparent: boolean;
  depthWrite: boolean;
  wireframe: boolean;
  emissiveHex: number;
} {
  if (anyHighlighted) {
    if (isHighlighted) {
      return {
        opacity: 1.0,
        transparent: false,
        depthWrite: true,
        wireframe: xrayMode,
        emissiveHex: 0x0284c7
      };
    }
    return {
      opacity: 0.12,
      transparent: true,
      depthWrite: false,
      wireframe: xrayMode,
      emissiveHex: 0x000000
    };
  }

  if (activeLevel !== 'L0') {
    if (meshLayer !== activeLevel) {
      // Ghost Context for non-focused layers
      return {
        opacity: 0.12,
        transparent: true,
        depthWrite: false,
        wireframe: xrayMode,
        emissiveHex: 0x000000
      };
    }
    return {
      opacity: xrayMode ? 0.45 : 1.0,
      transparent: xrayMode,
      depthWrite: !xrayMode,
      wireframe: xrayMode,
      emissiveHex: 0x082f49
    };
  }

  return {
    opacity: xrayMode ? 0.38 : 1.0,
    transparent: xrayMode,
    depthWrite: !xrayMode,
    wireframe: xrayMode,
    emissiveHex: 0x000000
  };
}

export function computeClipPlaneConstant(minY: number, maxY: number, clipRatio: number): number {
  const clamped = Math.max(0.0, Math.min(1.0, clipRatio));
  return minY + (maxY - minY + 0.5) * clamped;
}
