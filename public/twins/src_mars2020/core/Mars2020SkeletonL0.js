import * as THREE from '../../vendor/three.module.js';
import { createFresnelGhostMaterial } from '../shaders/FresnelGhostMat.js';

export const RMCS_PORTS = [
  {
    id: 'PORT_L1_MOBILITY',
    level: 'L1',
    code: 'RMCS STA -0035 · Y ±1070mm',
    title: 'L1 钛合金摇臂转向架与六轮独立驱动总成',
    spec: '6×Ø525mm 波形防滑铝轮 · 主差速平衡杆 · 95,038 三角面',
    pos: new THREE.Vector3(1.16, 0.72, -0.04),
    camPos: new THREE.Vector3(3.15, 1.35, 2.25),
    camTarget: new THREE.Vector3(0.0, 0.52, 0.0),
    color: 0x38bdf8,
  },
  {
    id: 'PORT_L2_ROBOTICS',
    level: 'L2',
    code: 'RMCS STA +1085 · Z +1380mm',
    title: 'L2 2.1米五自由度采样机械臂与 SuperCam 遥感桅杆',
    spec: '转塔冲击取芯钻 · PIXL X射线谱仪 · SHERLOC/WATSON · 43,550 三角面',
    pos: new THREE.Vector3(0.45, 1.38, 1.05),
    camPos: new THREE.Vector3(2.35, 1.75, 2.65),
    camTarget: new THREE.Vector3(0.05, 1.32, 0.82),
    color: 0xff9e2c,
  },
  {
    id: 'PORT_L3_CORE_MMRTG',
    level: 'L3',
    code: 'RMCS STA -1250 & +0810mm',
    title: 'L3 恒温电子舱、ACA 内部采样实验室与 MMRTG 核电源',
    spec: 'Pu-238 放射性同位素热电机 · 内部无菌封装转盘 · 60,933 三角面',
    pos: new THREE.Vector3(0.0, 1.25, -1.25),
    camPos: new THREE.Vector3(2.65, 1.68, -2.35),
    camTarget: new THREE.Vector3(0.0, 1.12, -0.35),
    color: 0xa855f7,
  },
];

export function buildMars2020SkeletonL0() {
  const root = new THREE.Group();
  root.name = 'MARS2020_EDL_RMCS_SKELETON_L0';

  const cyanLineMat = new THREE.LineBasicMaterial({
    color: 0x38bdf8,
    transparent: true,
    opacity: 0.56,
  });
  const goldLineMat = new THREE.LineBasicMaterial({
    color: 0xf59e0b,
    transparent: true,
    opacity: 0.72,
  });
  const dimGridMat = new THREE.LineBasicMaterial({
    color: 0x1e3a5f,
    transparent: true,
    opacity: 0.42,
  });
  const trussStrutMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    metalness: 0.88,
    roughness: 0.24,
    emissive: 0x0b192c,
    emissiveIntensity: 0.45,
  });
  const goldStrutMat = new THREE.MeshStandardMaterial({
    color: 0xd97706,
    metalness: 0.85,
    roughness: 0.22,
    emissive: 0x451a03,
    emissiveIntensity: 0.38,
  });

  // ============================================================================
  // 1. RMCS ROVER GROUND FOOTPRINT & STATION DATUM SKELETON (JPL D-105568)
  // ============================================================================
  const rmcsGroup = new THREE.Group();
  rmcsGroup.name = 'RMCS_Rover_Datum_Skeleton';
  root.add(rmcsGroup);

  // Longitudinal RMCS Centerline Spine (Z = -1.85m to +1.75m at Y = 0.004m and Y = 1.12m)
  const spinePts = [
    new THREE.Vector3(0, 0.004, -1.85),
    new THREE.Vector3(0, 0.004, 1.75),
    new THREE.Vector3(0, 1.12, -1.72),
    new THREE.Vector3(0, 1.12, 1.42),
  ];
  rmcsGroup.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(spinePts), goldLineMat));

  // Calibrated RMCS Structural Station Bulkhead Frames (STA-RMCS in meters along Z)
  const stationDefs = [
    { z: 1.36, w: 0.85, h: 1.52, label: 'STA +1360 TURRET' },
    { z: 1.12, w: 1.18, h: 0.78, label: 'STA +1120 FWD AXLE' },
    { z: 0.96, w: 0.72, h: 1.28, label: 'STA +0960 WEB FWD' },
    { z: 0.81, w: 0.68, h: 1.28, label: 'STA +0810 ACA LAB' },
    { z: 0.32, w: 0.72, h: 1.98, label: 'STA +0320 RSM MAST' },
    { z: -0.035, w: 1.18, h: 1.28, label: 'STA -0035 DIFF PIVOT' },
    { z: -0.39, w: 0.72, h: 1.38, label: 'STA -0390 HGA DECK' },
    { z: -0.88, w: 0.70, h: 1.28, label: 'STA -0880 WEB AFT' },
    { z: -1.14, w: 1.18, h: 0.78, label: 'STA -1140 AFT AXLE' },
    { z: -1.25, w: 0.58, h: 1.58, label: 'STA -1250 MMRTG' },
  ];

  const stationLinePts = [];
  stationDefs.forEach((st) => {
    const hw = st.w;
    const y0 = 0.18;
    const y1 = st.h;
    const z = st.z;
    stationLinePts.push(
      new THREE.Vector3(-hw, y0, z), new THREE.Vector3(hw, y0, z),
      new THREE.Vector3(hw, y0, z), new THREE.Vector3(hw, y1, z),
      new THREE.Vector3(hw, y1, z), new THREE.Vector3(-hw, y1, z),
      new THREE.Vector3(-hw, y1, z), new THREE.Vector3(-hw, y0, z)
    );
  });
  rmcsGroup.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(stationLinePts), dimGridMat));

  // 6 Wheel Contact Target Rings (Track Width 2,140 mm -> X = ±1.07m; Wheelbase 2,260 mm -> Z = +1.12m, -0.04m, -1.14m)
  const wheelCoords = [
    [-1.07, 1.12, 'PORT_FWD_WHEEL'],
    [1.07, 1.12, 'STBD_FWD_WHEEL'],
    [-1.12, -0.04, 'PORT_MID_WHEEL'],
    [1.12, -0.04, 'STBD_MID_WHEEL'],
    [-1.07, -1.14, 'PORT_AFT_WHEEL'],
    [1.07, -1.14, 'STBD_AFT_WHEEL'],
  ];

  wheelCoords.forEach(([wx, wz]) => {
    const ringGeo = new THREE.RingGeometry(0.24, 0.265, 36);
    ringGeo.rotateX(-Math.PI / 2);
    const ringMesh = new THREE.Mesh(
      ringGeo,
      new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.45, side: THREE.DoubleSide })
    );
    ringMesh.position.set(wx, 0.005, wz);
    rmcsGroup.add(ringMesh);

    // Axle hub cross-hair line up to Rocker-Bogie Differential Pivot (X = ±0.72, Y = 0.71, Z = -0.035)
    const side = Math.sign(wx);
    const pivotPts = [
      new THREE.Vector3(wx, 0.264, wz),
      new THREE.Vector3(side * 0.78, 0.71, -0.035),
    ];
    rmcsGroup.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pivotPts), cyanLineMat));
  });

  // ============================================================================
  // 2. EDL SKYCRANE DESCENT STAGE & Ø4.50m AEROSHELL SKELETON (JPL EDL-CS)
  // ============================================================================
  const skycraneGroup = new THREE.Group();
  skycraneGroup.name = 'EDL_Skycrane_Skeleton';
  root.add(skycraneGroup);

  const skyY = 3.12; // Skycrane Hover Separation Datum Plane (Y = +3.12m above ground)
  const aeroRadius = 2.25; // Ø 4,500 mm (4.5m) Mars 2020 Aeroshell Heatshield Diameter

  // 2.1 Ø 4,500 mm Aeroshell Heatshield Separation Datum Ring & Conical Backshell Ribs
  const aeroRingPts = [];
  const segs = 72;
  for (let i = 0; i <= segs; i++) {
    const a = (i / segs) * Math.PI * 2;
    aeroRingPts.push(new THREE.Vector3(Math.cos(a) * aeroRadius, skyY - 0.22, Math.sin(a) * aeroRadius));
  }
  skycraneGroup.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(aeroRingPts), cyanLineMat));

  // Upper Backshell Parachute Mortar Ring (R = 0.78m at Y = skyY + 0.95m) + 12 Conical Radial Ribs
  const topRingPts = [];
  for (let i = 0; i <= segs; i++) {
    const a = (i / segs) * Math.PI * 2;
    topRingPts.push(new THREE.Vector3(Math.cos(a) * 0.78, skyY + 0.95, Math.sin(a) * 0.78));
  }
  skycraneGroup.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(topRingPts), dimGridMat));

  const ribPts = [];
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    ribPts.push(
      new THREE.Vector3(Math.cos(a) * aeroRadius, skyY - 0.22, Math.sin(a) * aeroRadius),
      new THREE.Vector3(Math.cos(a) * 0.78, skyY + 0.95, Math.sin(a) * 0.78)
    );
  }
  skycraneGroup.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(ribPts), dimGridMat));

  // Translucent Fresnel X-Ray Ghost Aeroshell Fairing Envelope
  const aeroGhostGeo = new THREE.CylinderGeometry(0.78, aeroRadius, 1.17, 48, 1, true);
  const aeroGhostMat = createFresnelGhostMaterial({ rimColor: 0x38bdf8, coreColor: 0x040b18, opacity: 0.05 });
  const aeroGhostMesh = new THREE.Mesh(aeroGhostGeo, aeroGhostMat);
  aeroGhostMesh.position.set(0, skyY + 0.365, 0);
  aeroGhostMesh.userData = {
    isSkeletonEnvelope: true,
    subsystemId: 'EDL_AEROSHELL_DATUM',
    code: 'STA-EDL Ø4500mm · 70° Sphere-Cone',
    title: 'Mars 2020 大底防热盾与背罩气动包络骨架 (Ø4.5m Aeroshell)',
    spec: 'PICA 酚醛浸渍碳烧蚀防热大底 · 12肋钛合金背罩环框 · 高超声速再入基准',
    level: 'L0',
  };
  skycraneGroup.add(aeroGhostMesh);

  // 2.2 Skycrane Octagonal Propulsion Structural Truss (Inner R = 0.92m, Outer R = 1.42m)
  const octInnerR = 0.88;
  const octOuterR = 1.38;
  const octH = 0.42;

  for (let i = 0; i < 8; i++) {
    const a0 = (i / 8) * Math.PI * 2 + Math.PI / 8;
    const a1 = ((i + 1) / 8) * Math.PI * 2 + Math.PI / 8;

    // Lower & Upper Octagonal Longerons
    for (const dy of [-octH / 2, octH / 2]) {
      const p0 = new THREE.Vector3(Math.cos(a0) * octInnerR, skyY + dy, Math.sin(a0) * octInnerR);
      const p1 = new THREE.Vector3(Math.cos(a1) * octInnerR, skyY + dy, Math.sin(a1) * octInnerR);
      const dist = p0.distanceTo(p1);
      const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, dist, 8), trussStrutMat);
      beam.position.copy(p0).add(p1).multiplyScalar(0.5);
      beam.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), p1.clone().sub(p0).normalize());
      beam.userData = {
        subsystemId: 'EDL_SKYCRANE_TRUSS',
        code: 'PDV STA-3120 · Octagonal Propulsion Truss',
        title: '空中吊车 (Skycrane PDV) 八角推进主承力桁架',
        spec: 'CFRP 碳纤维复合管桁架 · 8×MLE 联氨反推发动机挂载环 · 3索同步绞盘',
        level: 'L0',
      };
      skycraneGroup.add(beam);
    }

    // Vertical corner posts
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, octH, 8), goldStrutMat);
    post.position.set(Math.cos(a0) * octInnerR, skyY, Math.sin(a0) * octInnerR);
    post.userData = {
      subsystemId: 'EDL_SKYCRANE_TRUSS',
      code: 'PDV STA-3120 · Octagonal Propulsion Truss',
      title: '空中吊车 (Skycrane PDV) 八角推进主承力桁架',
      spec: 'CFRP 碳纤维复合管桁架 · 8×MLE 联氨反推发动机挂载环 · 3索同步绞盘',
      level: 'L0',
    };
    skycraneGroup.add(post);
  }

  // 4 × Spherical Hydrazine Propellant Tanks inside the Skycrane Octagon
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
    const tank = new THREE.Mesh(
      new THREE.SphereGeometry(0.28, 24, 18),
      createFresnelGhostMaterial({ rimColor: 0xf59e0b, coreColor: 0x1e1b18, opacity: 0.22 })
    );
    tank.position.set(Math.cos(a) * 0.62, skyY + 0.04, Math.sin(a) * 0.62);
    tank.userData = {
      isSkeletonEnvelope: true,
      subsystemId: 'EDL_HYDRAZINE_TANKS',
      code: 'PDV PROP-TANK 1..4 · 400kg N2H4',
      title: '空中吊车高纯联氨推进剂球形钛合金贮箱 (4×Hydrazine Tanks)',
      spec: 'Ti-6Al-4V 球形增压贮箱 · 供给 8 台 3.3kN MLE 变推力着陆发动机',
      level: 'L0',
    };
    skycraneGroup.add(tank);
  }

  // 4 Cantilever Outriggers with 8 × MLE (Mars Lander Engines) Canted Nozzles + Plume Cones
  const mleAngles = [Math.PI * 0.22, Math.PI * 0.28, Math.PI * 0.72, Math.PI * 0.78, Math.PI * 1.22, Math.PI * 1.28, Math.PI * 1.72, Math.PI * 1.78];
  mleAngles.forEach((ang, idx) => {
    const nx = Math.cos(ang) * octOuterR;
    const nz = Math.sin(ang) * octOuterR;
    const ix = Math.cos(ang) * octInnerR;
    const iz = Math.sin(ang) * octInnerR;

    // Outrigger strut
    const pIn = new THREE.Vector3(ix, skyY, iz);
    const pOut = new THREE.Vector3(nx, skyY - 0.06, nz);
    const strut = new THREE.Mesh(
      new THREE.CylinderGeometry(0.016, 0.022, pIn.distanceTo(pOut), 8),
      trussStrutMat
    );
    strut.position.copy(pIn).add(pOut).multiplyScalar(0.5);
    strut.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), pOut.clone().sub(pIn).normalize());
    skycraneGroup.add(strut);

    // MLE Nozzle Bell (canted 25 deg outward so exhaust misses the Rover!)
    const nozzleGroup = new THREE.Group();
    nozzleGroup.position.copy(pOut);
    const radialOut = new THREE.Vector3(Math.cos(ang), -1.85, Math.sin(ang)).normalize();
    nozzleGroup.quaternion.setFromUnitVectors(new THREE.Vector3(0, -1, 0), radialOut);

    const bell = new THREE.Mesh(new THREE.ConeGeometry(0.095, 0.24, 18, 1, true), goldStrutMat);
    bell.position.y = -0.10;
    bell.userData = {
      subsystemId: 'EDL_MLE_THRUSTERS',
      code: `PDV MLE-${idx + 1} · 3,300N Throttleable Thruster`,
      title: `空中吊车第 ${idx + 1} 号变推力反推发动机 (Mars Lander Engine)`,
      spec: '单组元催化联氨变推力 (20%~100%) · 外倾 25° 避开巡视器顶板',
      level: 'L0',
    };
    nozzleGroup.add(bell);

    // Subtle ionized plume cone
    const plume = new THREE.Mesh(
      new THREE.ConeGeometry(0.18, 0.85, 16, 1, true),
      new THREE.MeshBasicMaterial({
        color: 0x38bdf8,
        transparent: true,
        opacity: 0.14,
        side: THREE.DoubleSide,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      })
    );
    plume.position.y = -0.62;
    plume.rotation.x = Math.PI;
    nozzleGroup.add(plume);

    skycraneGroup.add(nozzleGroup);
  });

  // 2.3 Triple Nylon Descent Bridle Tethers + Electrical Umbilical (Skycrane -> Rover WEB Deck)
  const bridleAttachPairs = [
    { sky: new THREE.Vector3(-0.52, skyY - 0.21, 0.58), rover: new THREE.Vector3(-0.42, 1.22, 0.48), label: 'FWD-PORT BRIDLE' },
    { sky: new THREE.Vector3(0.52, skyY - 0.21, 0.58), rover: new THREE.Vector3(0.42, 1.22, 0.48), label: 'FWD-STBD BRIDLE' },
    { sky: new THREE.Vector3(0.0, skyY - 0.21, -0.68), rover: new THREE.Vector3(0.0, 1.22, -0.52), label: 'AFT-CENTER BRIDLE' },
  ];

  bridleAttachPairs.forEach((pair, i) => {
    const dist = pair.sky.distanceTo(pair.rover);
    const tether = new THREE.Mesh(
      new THREE.CylinderGeometry(0.007, 0.007, dist, 8),
      goldStrutMat
    );
    tether.position.copy(pair.sky).add(pair.rover).multiplyScalar(0.5);
    tether.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), pair.sky.clone().sub(pair.rover).normalize());
    tether.userData = {
      subsystemId: 'EDL_BRIDLE_TETHERS',
      code: `EDL BRIDLE-0${i + 1} · Kevlar/Nylon Descent Tether`,
      title: `空中吊车第 ${i + 1} 路高强芳纶下放吊索与火工切割器`,
      spec: '7.5米同步恒速下放 · 触地载荷检测后由火工闸刀瞬时切断脱离',
      level: 'L0',
    };
    skycraneGroup.add(tether);

    // Pyro cutter boss on Rover top deck
    const boss = new THREE.Mesh(new THREE.CylinderGeometry(0.038, 0.045, 0.05, 16), goldStrutMat);
    boss.position.copy(pair.rover);
    skycraneGroup.add(boss);
  });

  // Helical Electrical Umbilical Line alongside aft bridle
  const umbCurvePts = [];
  for (let k = 0; k <= 48; k++) {
    const t = k / 48;
    const y = THREE.MathUtils.lerp(1.22, skyY - 0.21, t);
    const r = 0.08 * Math.sin(t * Math.PI);
    const a = t * Math.PI * 10;
    umbCurvePts.push(new THREE.Vector3(0.18 + Math.cos(a) * r, y, -0.25 + Math.sin(a) * r));
  }
  skycraneGroup.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(umbCurvePts), cyanLineMat));

  // ============================================================================
  // 3. INTERACTIVE PULSING MOUNTING PORTS (L1 / L2 / L3)
  // ============================================================================
  const portMeshes = [];
  RMCS_PORTS.forEach((p) => {
    const portGroup = new THREE.Group();
    portGroup.position.copy(p.pos);
    portGroup.name = p.id;

    const coreSphere = new THREE.Mesh(
      new THREE.SphereGeometry(0.055, 24, 24),
      new THREE.MeshBasicMaterial({ color: p.color })
    );
    const haloRing = new THREE.Mesh(
      new THREE.TorusGeometry(0.105, 0.008, 12, 36),
      new THREE.MeshBasicMaterial({ color: p.color, transparent: true, opacity: 0.78 })
    );
    const outerSphere = new THREE.Mesh(
      new THREE.SphereGeometry(0.13, 20, 20),
      new THREE.MeshBasicMaterial({ color: p.color, transparent: true, opacity: 0.18, depthWrite: false })
    );

    const meta = {
      isMountingPort: true,
      portId: p.id,
      subsystemId: p.id,
      level: p.level,
      code: p.code,
      title: p.title,
      spec: p.spec,
      camPos: p.camPos,
      camTarget: p.camTarget,
    };
    coreSphere.userData = meta;
    haloRing.userData = meta;
    outerSphere.userData = meta;

    portGroup.add(coreSphere, haloRing, outerSphere);
    root.add(portGroup);
    portMeshes.push({ group: portGroup, haloRing, outerSphere });
  });

  return {
    root,
    rmcsGroup,
    skycraneGroup,
    portMeshes,
    aeroGhostMat,
  };
}
