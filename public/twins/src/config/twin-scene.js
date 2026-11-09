/**
 * Declarative Scene & Hierarchy Configuration for the B737-800 Airframe Skeleton + CATIA V5 2-Spool High-Bypass Turbofan Digital Twin
 * - L0: Boeing 737-800 1:1 Fuselage Frames (FS 130..1217), Wing Box Spars/Ribs (WS 71..691) & Left Wing Pylon (STA 518 / WBL -190.97)
 *       with the 568,480-Triangle CATIA V5 Turbofan Engine mounted under the left wing.
 * - L1..L3: External CATIA V5 .glb packages (`L1_nacelle_casings.glb`, `L2_turbofan_core.glb`, `L3_hpt_combustor.glb`)
 */

export const TWIN_HIERARCHY_LEVELS = [
  {
    level: 0,
    code: 'L0',
    title: 'L0 整机骨架与翼吊总成',
    subtitle: 'B737-800 机身隔框/机翼双梁骨架 (FS 130~1217) + 左翼吊架 (WBL -190.97) 挂载 56.8万面 CATIA V5 涡扇高模',
    activePacks: ['L0', 'L1', 'L2', 'L3'],
    ghostPacks: [],
    cameraPos: [-6.8, 3.6, 8.2],
    cameraTarget: [0.4, 0.85, -1.65],
    defaultExplode: 0.0
  },
  {
    level: 1,
    code: 'L1',
    title: 'L1 吊架与外涵机匣',
    subtitle: '左翼发动机吊架承力盒 (STA 457..539) + 外涵道风扇机匣、OGV 主承力框与剖分法兰机匣',
    activePacks: ['L1', 'L2', 'L3'],
    ghostPacks: ['L0'],
    cameraPos: [-2.15, 1.25, 3.85],
    cameraTarget: [0.05, 0.08, 0.0],
    defaultExplode: 0.35
  },
  {
    level: 2,
    code: 'L2',
    title: 'L2 双转子叶盘与混合器',
    subtitle: '宽弦扭转钛合金风扇 + N1同心内轴 + 5级高压压气机(HPC) + 4级低压涡轮(LPT) + 20瓣波瓣混合器',
    activePacks: ['L2'],
    ghostPacks: ['L0', 'L1', 'L3'],
    cameraPos: [-1.35, 0.92, 3.35],
    cameraTarget: [0.05, 0.02, 0.0],
    defaultExplode: 0.50
  },
  {
    level: 3,
    code: 'L3',
    title: 'L3 燃烧室与高压涡轮热端',
    subtitle: '多孔气膜冷却短环形燃烧室火焰筒 + 18孔旋流火焰盘 + 单级高功高压涡轮叶盘(HPT) + N2鼓筒轴',
    activePacks: ['L3'],
    ghostPacks: ['L0', 'L1', 'L2'],
    cameraPos: [-0.35, 0.62, 1.85],
    cameraTarget: [0.02, 0.05, 0.0],
    defaultExplode: 0.60
  }
];

export const SPOOL_BADGES = {
  N1: { label: 'N1 低压转子系 (5,175 RPM)', color: '#06b6d4' },
  N2: { label: 'N2 高压转子系 (14,460 RPM)', color: '#f59e0b' },
  STATIC: { label: '静子与机体承力骨架系 (Stator / Airframe)', color: '#38bdf8' }
};
