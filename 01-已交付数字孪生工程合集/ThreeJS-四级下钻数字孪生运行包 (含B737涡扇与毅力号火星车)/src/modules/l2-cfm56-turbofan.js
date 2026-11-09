/**
 * L2 Module: CFM56-7B27 Turbofan 6 Core Functional Sections + 5 Bearings + 2 Concentric Spools (N1 LP & N2 HP)
 * Directly modeled from CFMI Training Manual `cfm56_basic_engine_ctc044.pdf` (Pages 24, 30, 32, 34)
 *
 * Axial Coordinate Mapping:
 *   Engine Axial Station [0 .. 2508 mm] maps along X axis from -1.85 to +1.85 scene units (1000mm = 1.48 units)
 */

import * as THREE from 'three';
import { L2_CFM56_DATUM } from '../data/b737-cfm56-datum.js';

export const MM_TO_L2 = 0.00148; // 1 mm = 0.00148 Three.js units in L2 inspection space
export const AXIAL_ORIGIN_MM = 1254; // Midpoint of 2508mm engine length

export function axialMmToX(mm) {
  return (mm - AXIAL_ORIGIN_MM) * MM_TO_L2;
}

export function buildL2Cfm56Turbofan(materials) {
  const root = new THREE.Group();
  root.name = 'L2_CFM56_7B_TURBOFAN';
  const explodableParts = [];
  const interactiveTargets = [];
  const portMarkers = [];
  const animatedRotors = { n1Parts: [], n2Parts: [] };

  // 0. Ghost Context Reference of Parent L1 Pylon Torque Box & Forward/Aft Mounts
  const ghostPylon = new THREE.Group();
  const pylonGhostBox = new THREE.Mesh(
    new THREE.BoxGeometry(2.4, 0.36, 0.34),
    materials.ghostWireframe
  );
  pylonGhostBox.position.set(0.15, 1.36, 0);
  ghostPylon.add(pylonGhostBox);

  // Coaxial Datum Centerline & Bolt-Circle Guide Lines
  const centerAxisGeo = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(-3.6, 0, 0),
    new THREE.Vector3(3.6, 0, 0)
  ]);
  const centerAxisLine = new THREE.Line(centerAxisGeo, materials.datumLineCyan);
  ghostPylon.add(centerAxisLine);
  root.add(ghostPylon);

  // 1. Concentric Dual Spools (Inner N1 LP Shaft in Cyan + Outer Hollow N2 HP Drum Shaft in Amber/Crimson)
  // Plus the 5 Main Bearings (No. 1 Ball, No. 2 Roller, No. 3 Ball+Roller, No. 4 Roller, No. 5 Roller)
  const spoolBearingGroup = new THREE.Group();
  const n1ShaftLen = (2320 - 180) * MM_TO_L2;
  const n1Shaft = new THREE.Mesh(
    new THREE.CylinderGeometry(0.085, 0.085, n1ShaftLen, 24),
    materials.n1ShaftCyan
  );
  n1Shaft.rotation.z = Math.PI / 2;
  n1Shaft.position.x = axialMmToX((180 + 2320) * 0.5);
  spoolBearingGroup.add(n1Shaft);
  animatedRotors.n1Parts.push(n1Shaft);

  const n2ShaftLen = (1880 - 810) * MM_TO_L2;
  const n2Shaft = new THREE.Mesh(
    new THREE.CylinderGeometry(0.155, 0.155, n2ShaftLen, 28, 1, true),
    materials.n2ShaftGold
  );
  n2Shaft.rotation.z = Math.PI / 2;
  n2Shaft.position.x = axialMmToX((810 + 1880) * 0.5);
  spoolBearingGroup.add(n2Shaft);
  animatedRotors.n2Parts.push(n2Shaft);

  // 5 Main Bearings from CTC-044 Page 32
  L2_CFM56_DATUM.bearingsAndSumps.forEach((brg) => {
    const brgGroup = new THREE.Group();
    const xPos = axialMmToX(brg.axialMm);
    const rOuter = brg.radiusMm * MM_TO_L2;
    const raceTorus = new THREE.Mesh(
      new THREE.TorusGeometry(rOuter, 0.024, 12, 32),
      brg.rotor.includes('N1') ? materials.stringerCyan : materials.portHighlight
    );
    raceTorus.rotation.y = Math.PI / 2;
    brgGroup.position.x = xPos;
    brgGroup.add(raceTorus);

    // Rolling Elements (Balls or Rollers)
    for (let k = 0; k < 12; k++) {
      const ang = (k / 12) * Math.PI * 2;
      const elem = new THREE.Mesh(
        brg.type.includes('Ball')
          ? new THREE.SphereGeometry(0.022, 10, 10)
          : new THREE.CylinderGeometry(0.018, 0.018, 0.036, 10),
        materials.chromeAlloy
      );
      if (!brg.type.includes('Ball')) elem.rotation.z = Math.PI / 2;
      elem.position.set(0, Math.cos(ang) * rOuter, Math.sin(ang) * rOuter);
      brgGroup.add(elem);
    }
    spoolBearingGroup.add(brgGroup);
  });

  spoolBearingGroup.userData = {
    partId: 'CFM56-SPOOLS-5BEARINGS',
    title: 'N1/N2 同心双转子轴系与五主轴承支承系统 (2 Concentric Spools + 5 Bearings in Sump A & B)',
    datum: 'Ax.Sta +180mm → +2320mm | Bearings #1, #2, #3 (Fwd Sump A) & #4, #5 (Rear Sump B)',
    material: 'Maraging Steel / Inconel 718 Concentric Shafts + M50 Tool Steel Bearing Races',
    description: '严格还原 CTC-044 第 32 页架构：内层青色 N1 低压轴贯穿整机连接风扇与 4 级低压涡轮（1#、2#、5#轴承支承）；外层金色空心 N2 高压鼓筒轴连接 9 级高压压气机与单级高压涡轮（3#、4#轴承支承）。',
    basePos: new THREE.Vector3(0, 0, 0),
    explodeVec: new THREE.Vector3(0, 0, 0)
  };
  interactiveTargets.push(spoolBearingGroup);
  root.add(spoolBearingGroup);

  // ============================================================================
  // MODULE M1: Fan Rotor (24 Wide-Chord Ti Blades), 3-Stage LPC Booster & Fan Frame (Sta. 0 -> Sta. 25)
  // ============================================================================
  const m1Spec = L2_CFM56_DATUM.coreSections[0];
  const m1Group = new THREE.Group();
  const fanCenterX = axialMmToX(260);
  const fanOuterR = m1Spec.outerRadiusMm * MM_TO_L2;
  const fanHubR = 235 * MM_TO_L2;

  // Conical Spinner Cone (Sta. 0)
  const spinner = new THREE.Mesh(
    new THREE.ConeGeometry(fanHubR, 0.38, 28),
    materials.chromeAlloy
  );
  spinner.rotation.z = Math.PI / 2;
  spinner.position.x = fanCenterX - 0.24;

  // Fan Rotor Assembly (Spins with N1)
  const fanRotor = new THREE.Group();
  fanRotor.add(spinner);

  const fanDisk = new THREE.Mesh(
    new THREE.CylinderGeometry(fanHubR, fanHubR * 0.88, 0.22, 28),
    materials.titaniumGold
  );
  fanDisk.rotation.z = Math.PI / 2;
  fanDisk.position.x = fanCenterX;
  fanRotor.add(fanDisk);

  // 24 Wide-Chord Swept Titanium Fan Blades
  const bladeLen = fanOuterR - fanHubR * 0.92;
  const bladeGeo = new THREE.BoxGeometry(0.11, bladeLen, 0.22);
  for (let i = 0; i < 24; i++) {
    const angle = (i / 24) * Math.PI * 2;
    const bladeHolder = new THREE.Group();
    bladeHolder.position.x = fanCenterX;
    bladeHolder.rotation.x = angle;

    const blade = new THREE.Mesh(bladeGeo, materials.chromeAlloy);
    blade.position.y = fanHubR * 0.9 + bladeLen * 0.5;
    blade.rotation.y = 0.48; // Aerodynamic pitch twist
    bladeHolder.add(blade);
    fanRotor.add(bladeHolder);
  }

  // 3-Stage LPC Booster Rotor Drum (aft of fan blade root, Sta. 1.2 -> Sta. 2)
  for (let stg = 0; stg < 3; stg++) {
    const stgX = axialMmToX(440 + stg * 95);
    const stgR = (380 - stg * 14) * MM_TO_L2;
    const boosterRing = new THREE.Mesh(
      new THREE.CylinderGeometry(stgR, stgR, 0.055, 28),
      materials.stringerCyan
    );
    boosterRing.rotation.z = Math.PI / 2;
    boosterRing.position.x = stgX;
    fanRotor.add(boosterRing);
  }
  animatedRotors.n1Parts.push(fanRotor);
  m1Group.add(fanRotor);

  // Fan Frame (Sta. 12: 12 Radial Structural Struts + Outer Fan Containment Case + Forward Engine Mount @ 12:00)
  const fanFrameX = axialMmToX(740);
  const fanCase = new THREE.Mesh(
    new THREE.CylinderGeometry(fanOuterR * 1.03, fanOuterR * 1.01, 0.88, 40, 1, true, 0, Math.PI * 1.62),
    materials.cutawayCaseBlue
  );
  fanCase.rotation.z = Math.PI / 2;
  fanCase.rotation.x = -0.35;
  fanCase.position.x = axialMmToX(490);
  m1Group.add(fanCase);

  for (let s = 0; s < 12; s++) {
    const ang = (s / 12) * Math.PI * 2;
    const strut = new THREE.Mesh(
      new THREE.BoxGeometry(0.16, fanOuterR - 0.34, 0.028),
      s === 0 || s === 6 ? materials.titaniumGold : materials.structuralFrame
    );
    const holder = new THREE.Group();
    holder.position.x = fanFrameX;
    holder.rotation.x = ang;
    strut.position.y = 0.34 + (fanOuterR - 0.34) * 0.5;
    holder.add(strut);
    m1Group.add(holder);
  }

  // Forward Engine Mount Attachment Pad at 12:00 on Fan Frame (Sta. 12)
  const fwdMountPad = new THREE.Mesh(
    new THREE.BoxGeometry(0.22, 0.14, 0.28),
    materials.portHighlight
  );
  fwdMountPad.position.set(fanFrameX, fanOuterR * 1.05, 0);
  m1Group.add(fwdMountPad);

  m1Group.userData = {
    partId: m1Spec.id,
    title: m1Spec.name,
    datum: `${m1Spec.stationCode} | Ax.Sta 0 → +860mm | Ø1549mm Fan | 12 OGV Struts`,
    material: 'Ti-6Al-4V Wide-Chord Fan Blades + Kevlar Containment Case + 17-4PH Fan Frame',
    description: m1Spec.description,
    basePos: new THREE.Vector3(0, 0, 0),
    explodeVec: new THREE.Vector3(m1Spec.explodeAxialMm * MM_TO_L2, 0, 0)
  };
  explodableParts.push(m1Group);
  interactiveTargets.push(m1Group);
  root.add(m1Group);

  // ============================================================================
  // MODULE M2: 9-Stage High-Pressure Compressor (HPC) & VSV Rings (Sta. 25 -> Sta. 3)
  // ============================================================================
  const m2Spec = L2_CFM56_DATUM.coreSections[1];
  const m2Group = new THREE.Group();
  const hpcRotorGroup = new THREE.Group();

  for (let stg = 0; stg < 9; stg++) {
    const t = stg / 8;
    const stgX = axialMmToX(900 + stg * 62);
    const rTip = (425 - t * 88) * MM_TO_L2;
    const rHub = (225 + t * 52) * MM_TO_L2;

    const disk = new THREE.Mesh(
      new THREE.CylinderGeometry(rHub, rHub, 0.042, 24),
      materials.titaniumGold
    );
    disk.rotation.z = Math.PI / 2;
    disk.position.x = stgX;
    hpcRotorGroup.add(disk);

    const bladeCount = 24 + stg * 2;
    const bLen = rTip - rHub;
    const bGeo = new THREE.BoxGeometry(0.028, bLen, 0.036);
    for (let b = 0; b < bladeCount; b++) {
      const ang = (b / bladeCount) * Math.PI * 2;
      const bHolder = new THREE.Group();
      bHolder.position.x = stgX;
      bHolder.rotation.x = ang;
      const blade = new THREE.Mesh(bGeo, stg < 4 ? materials.chromeAlloy : materials.titaniumGold);
      blade.position.y = rHub + bLen * 0.5;
      blade.rotation.y = 0.55;
      bHolder.add(blade);
      hpcRotorGroup.add(bHolder);
    }

    // Variable Stator Vane (VSV) Actuator Ring for IGV + Stages 1..3
    if (stg < 4) {
      const vsvRing = new THREE.Mesh(
        new THREE.TorusGeometry(rTip * 1.08, 0.012, 8, 32),
        materials.portHighlight
      );
      vsvRing.rotation.y = Math.PI / 2;
      vsvRing.position.x = stgX - 0.035;
      m2Group.add(vsvRing);
    }
  }
  animatedRotors.n2Parts.push(hpcRotorGroup);
  m2Group.add(hpcRotorGroup);

  // Split 270-deg Cutaway HPC Casing
  const hpcCaseLen = (1460 - 860) * MM_TO_L2;
  const hpcCase = new THREE.Mesh(
    new THREE.CylinderGeometry(435 * MM_TO_L2, 355 * MM_TO_L2, hpcCaseLen, 32, 1, true, 0, Math.PI * 1.55),
    materials.structuralFrame
  );
  hpcCase.rotation.z = Math.PI / 2;
  hpcCase.rotation.x = -0.35;
  hpcCase.position.x = axialMmToX((860 + 1460) * 0.5);
  m2Group.add(hpcCase);

  m2Group.userData = {
    partId: m2Spec.id,
    title: m2Spec.name,
    datum: `${m2Spec.stationCode} | Ax.Sta +860mm → +1460mm | 9 Rotor Stages + IGV/VSV 1–3`,
    material: 'Ti-6Al-2Sn-4Zr-2Mo (Stages 1–3) + Inconel 718 Rear Spool (Stages 4–9)',
    description: m2Spec.description,
    basePos: new THREE.Vector3(0, 0, 0),
    explodeVec: new THREE.Vector3(m2Spec.explodeAxialMm * MM_TO_L2, 0, 0)
  };
  explodableParts.push(m2Group);
  interactiveTargets.push(m2Group);
  root.add(m2Group);

  // ============================================================================
  // MODULE M3: Short Annular Combustion Chamber & 20 Fuel Nozzles (Sta. 3 -> Sta. 39)
  // ============================================================================
  const m3Spec = L2_CFM56_DATUM.coreSections[2];
  const m3Group = new THREE.Group();
  const combMidX = axialMmToX((1460 + 1730) * 0.5);
  const combLen = (1730 - 1460) * MM_TO_L2;
  const combOuterR = 445 * MM_TO_L2;
  const combInnerR = 265 * MM_TO_L2;

  // Annular Flame Tube Outer & Inner Liners (Cutaway to expose glowing core flame & 20 swirlers)
  const outerLiner = new THREE.Mesh(
    new THREE.CylinderGeometry(combOuterR, combOuterR, combLen, 32, 1, true, 0, Math.PI * 1.58),
    materials.combustorAmber
  );
  outerLiner.rotation.z = Math.PI / 2;
  outerLiner.rotation.x = -0.35;
  outerLiner.position.x = combMidX;
  m3Group.add(outerLiner);

  const innerLiner = new THREE.Mesh(
    new THREE.CylinderGeometry(combInnerR, combInnerR, combLen, 32, 1, true),
    materials.combustorAmber
  );
  innerLiner.rotation.z = Math.PI / 2;
  innerLiner.position.x = combMidX;
  m3Group.add(innerLiner);

  // 20 Duplex Fuel Nozzles & Swirlers around Pitch Circle R = 355mm
  const nozzlePitchR = 355 * MM_TO_L2;
  const nozzleX = axialMmToX(1485);
  for (let n = 0; n < 20; n++) {
    const ang = (n / 20) * Math.PI * 2;
    const y = Math.cos(ang) * nozzlePitchR;
    const z = Math.sin(ang) * nozzlePitchR;
    const nozzleStem = new THREE.Mesh(
      new THREE.CylinderGeometry(0.016, 0.022, 0.14, 10),
      materials.chromeAlloy
    );
    nozzleStem.position.set(nozzleX, y * 1.15, z * 1.15);
    nozzleStem.rotation.x = ang;
    m3Group.add(nozzleStem);

    const flameCore = new THREE.Mesh(
      new THREE.ConeGeometry(0.048, combLen * 0.82, 12),
      materials.portActiveGlow
    );
    flameCore.rotation.z = -Math.PI / 2;
    flameCore.position.set(combMidX, y, z);
    m3Group.add(flameCore);
  }

  m3Group.userData = {
    partId: m3Spec.id,
    title: m3Spec.name,
    datum: `${m3Spec.stationCode} | Ax.Sta +1460mm → +1730mm | 20 Fuel Nozzles @ R=355mm`,
    material: 'Hastelloy X / Haynes 188 Multi-Louvre Film-Cooled Liner + TBC',
    description: m3Spec.description,
    drillDownLevel: 3,
    basePos: new THREE.Vector3(0, 0, 0),
    explodeVec: new THREE.Vector3(m3Spec.explodeAxialMm * MM_TO_L2, 0, 0)
  };
  explodableParts.push(m3Group);
  interactiveTargets.push(m3Group);
  root.add(m3Group);

  // ============================================================================
  // MODULE M4: Single-Stage High-Pressure Turbine (HPT) & Active Clearance Control (Sta. 4 -> Sta. 42)
  // ============================================================================
  const m4Spec = L2_CFM56_DATUM.coreSections[3];
  const m4Group = new THREE.Group();
  const hptRotorGroup = new THREE.Group();
  const hptX = axialMmToX(1820);
  const hptDiskR = 335 * MM_TO_L2;
  const hptTipR = 458 * MM_TO_L2;

  // Stage-1 NGV Stator Ring (42 Cooled Vanes at Sta. 4 = +1745mm)
  const ngvX = axialMmToX(1748);
  for (let v = 0; v < 36; v++) {
    const ang = (v / 36) * Math.PI * 2;
    const holder = new THREE.Group();
    holder.position.x = ngvX;
    holder.rotation.x = ang;
    const vane = new THREE.Mesh(
      new THREE.BoxGeometry(0.042, hptTipR - hptDiskR, 0.032),
      materials.highTempAlloy
    );
    vane.position.y = hptDiskR + (hptTipR - hptDiskR) * 0.5;
    vane.rotation.y = -0.65;
    holder.add(vane);
    m4Group.add(holder);
  }

  // HPT Single-Stage Rotor Disk + 72 Cooled Single-Crystal Blades (Spins with N2)
  const hptDisk = new THREE.Mesh(
    new THREE.CylinderGeometry(hptDiskR, hptDiskR * 0.52, 0.085, 36),
    materials.turbineCrimson
  );
  hptDisk.rotation.z = Math.PI / 2;
  hptDisk.position.x = hptX;
  hptRotorGroup.add(hptDisk);

  for (let b = 0; b < 48; b++) {
    const ang = (b / 48) * Math.PI * 2;
    const holder = new THREE.Group();
    holder.position.x = hptX;
    holder.rotation.x = ang;
    const blade = new THREE.Mesh(
      new THREE.BoxGeometry(0.046, hptTipR - hptDiskR, 0.034),
      materials.turbineCrimson
    );
    blade.position.y = hptDiskR + (hptTipR - hptDiskR) * 0.5;
    blade.rotation.y = 0.58;
    holder.add(blade);
    hptRotorGroup.add(holder);
  }
  animatedRotors.n2Parts.push(hptRotorGroup);
  m4Group.add(hptRotorGroup);

  // Active Clearance Control (ACC) Shroud & Cooling Manifold Ring
  const accRing = new THREE.Mesh(
    new THREE.TorusGeometry(hptTipR * 1.07, 0.026, 12, 36),
    materials.portActiveGlow
  );
  accRing.rotation.y = Math.PI / 2;
  accRing.position.x = hptX;
  m4Group.add(accRing);

  // L2->L3 MountingPort Marker (`PORT-HPT-ROTOR-SPLINE`)
  const l3Port = L2_CFM56_DATUM.childMountingPorts[0];
  const l3PortMarker = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.075, 1),
    materials.portActiveGlow
  );
  l3PortMarker.position.set(hptX, hptTipR * 1.22, 0);
  l3PortMarker.userData = {
    isMountingPort: true,
    portData: l3Port,
    partId: l3Port.id,
    title: `【L2→L3 标准挂载端口】${l3Port.name}`,
    datum: `Ax.Sta +${l3Port.engineAxialMm}mm | Curvic Coupling Ø${l3Port.boltCircleMm}mm | 72 Fir-Tree Slots`,
    material: l3Port.interfaceStandard,
    description: l3Port.description,
    drillDownLevel: 3
  };
  portMarkers.push(l3PortMarker);
  interactiveTargets.push(l3PortMarker);
  m4Group.add(l3PortMarker);

  m4Group.userData = {
    partId: m4Spec.id,
    title: `${m4Spec.name}（点击下钻 L3 叶片枞树榫与气膜孔拆解）`,
    datum: `${m4Spec.stationCode} | Ax.Sta +1730mm → +1910mm | 72 Rene N5 Single-Crystal Blades`,
    material: 'Rene 88DT PM Disk + Rene N5 Single-Crystal Blades + EB-PVD TBC',
    description: m4Spec.description,
    drillDownLevel: 3,
    basePos: new THREE.Vector3(0, 0, 0),
    explodeVec: new THREE.Vector3(m4Spec.explodeAxialMm * MM_TO_L2, 0, 0)
  };
  explodableParts.push(m4Group);
  interactiveTargets.push(m4Group);
  root.add(m4Group);

  // ============================================================================
  // MODULE M5: 4-Stage Low-Pressure Turbine (LPT) & Turbine Rear Frame TRF (Sta. 495 -> Sta. 5 -> Sta. 8)
  // ============================================================================
  const m5Spec = L2_CFM56_DATUM.coreSections[4];
  const m5Group = new THREE.Group();
  const lptRotorGroup = new THREE.Group();

  for (let stg = 0; stg < 4; stg++) {
    const t = stg / 3;
    const stgX = axialMmToX(1955 + stg * 86);
    const rTip = (465 + t * 65) * MM_TO_L2;
    const rHub = (235 - t * 35) * MM_TO_L2;

    const lptDisk = new THREE.Mesh(
      new THREE.CylinderGeometry(rHub, rHub * 0.65, 0.048, 28),
      materials.stringerCyan
    );
    lptDisk.rotation.z = Math.PI / 2;
    lptDisk.position.x = stgX;
    lptRotorGroup.add(lptDisk);

    const bLen = rTip - rHub;
    for (let b = 0; b < 36; b++) {
      const ang = (b / 36) * Math.PI * 2;
      const holder = new THREE.Group();
      holder.position.x = stgX;
      holder.rotation.x = ang;
      const blade = new THREE.Mesh(
        new THREE.BoxGeometry(0.036, bLen, 0.032),
        materials.chromeAlloy
      );
      blade.position.y = rHub + bLen * 0.5;
      blade.rotation.y = -0.45;
      holder.add(blade);
      lptRotorGroup.add(holder);
    }
  }
  animatedRotors.n1Parts.push(lptRotorGroup);
  m5Group.add(lptRotorGroup);

  // Turbine Rear Frame (TRF @ Sta. 5 = +2290mm) + Aft Engine Mount Flange @ 12:00 + Exhaust Plug Cone
  const trfX = axialMmToX(2290);
  const trfOuterR = 515 * MM_TO_L2;
  const trfRing = new THREE.Mesh(
    new THREE.TorusGeometry(trfOuterR, 0.028, 12, 36),
    materials.titaniumGold
  );
  trfRing.rotation.y = Math.PI / 2;
  trfRing.position.x = trfX;
  m5Group.add(trfRing);

  for (let s = 0; s < 12; s++) {
    const ang = (s / 12) * Math.PI * 2;
    const holder = new THREE.Group();
    holder.position.x = trfX;
    holder.rotation.x = ang;
    const strut = new THREE.Mesh(
      new THREE.BoxGeometry(0.11, trfOuterR - 0.22, 0.022),
      materials.titaniumGold
    );
    strut.position.y = 0.22 + (trfOuterR - 0.22) * 0.5;
    holder.add(strut);
    m5Group.add(holder);
  }

  // Rear Engine Mount Lug at 12:00 on TRF (`PORT-ENG-AFT-STA5` Mate)
  const aftMountLug = new THREE.Mesh(
    new THREE.BoxGeometry(0.18, 0.14, 0.24),
    materials.portHighlight
  );
  aftMountLug.position.set(trfX, trfOuterR * 1.08, 0);
  m5Group.add(aftMountLug);

  // Exhaust Centerbody Tailcone Plug (Sta. 8)
  const tailPlug = new THREE.Mesh(
    new THREE.ConeGeometry(0.28, 0.56, 24),
    materials.highTempAlloy
  );
  tailPlug.rotation.z = -Math.PI / 2;
  tailPlug.position.x = axialMmToX(2460);
  m5Group.add(tailPlug);

  m5Group.userData = {
    partId: m5Spec.id,
    title: m5Spec.name,
    datum: `${m5Spec.stationCode} | Ax.Sta +1910mm → +2508mm | 4 LPT Stages + TRF Sta. 5`,
    material: 'Inconel 718 / Rene 41 Blades + Inconel 718 Cast TRF Strut Ring',
    description: m5Spec.description,
    basePos: new THREE.Vector3(0, 0, 0),
    explodeVec: new THREE.Vector3(m5Spec.explodeAxialMm * MM_TO_L2, 0, 0)
  };
  explodableParts.push(m5Group);
  interactiveTargets.push(m5Group);
  root.add(m5Group);

  // ============================================================================
  // MODULE M6: Accessory Drive System (IGB + Radial Drive Shaft RDS + TGB + AGB @ 6:00)
  // ============================================================================
  const m6Spec = L2_CFM56_DATUM.coreSections[5];
  const m6Group = new THREE.Group();
  const rdsX = axialMmToX(740); // Passes vertically down through 6 o'clock Fan Frame strut

  // Central Inlet Gearbox (IGB Bevel Gear Pair at N2 nose)
  const igbBevel = new THREE.Mesh(
    new THREE.ConeGeometry(0.18, 0.14, 20),
    materials.portHighlight
  );
  igbBevel.rotation.z = -Math.PI / 2;
  igbBevel.position.set(rdsX, 0, 0);
  m6Group.add(igbBevel);

  // Radial Drive Shaft (RDS) descending vertically to 6 o'clock Transfer Gearbox (TGB)
  const rdsLen = 820 * MM_TO_L2;
  const rdsShaft = new THREE.Mesh(
    new THREE.CylinderGeometry(0.026, 0.026, rdsLen, 14),
    materials.portHighlight
  );
  rdsShaft.position.set(rdsX, -rdsLen * 0.5, 0);
  m6Group.add(rdsShaft);

  // Crescent-shaped Accessory Gearbox (AGB) mounted at 6 o'clock under Fan Case + Starter/IDG/Fuel Pump pods
  const agbArc = new THREE.Mesh(
    new THREE.TorusGeometry(fanOuterR * 0.94, 0.11, 12, 24, Math.PI * 0.52),
    materials.agbEmerald
  );
  agbArc.rotation.y = Math.PI / 2;
  agbArc.rotation.x = -Math.PI * 0.76;
  agbArc.position.x = axialMmToX(640);
  m6Group.add(agbArc);

  [-0.28, 0, 0.28].forEach((zOff, idx) => {
    const pumpPod = new THREE.Mesh(
      new THREE.CylinderGeometry(0.085, 0.085, 0.34, 16),
      idx === 1 ? materials.titaniumGold : materials.chromeAlloy
    );
    pumpPod.rotation.z = Math.PI / 2;
    pumpPod.position.set(axialMmToX(820), -fanOuterR * 0.92, zOff);
    m6Group.add(pumpPod);
  });

  m6Group.userData = {
    partId: m6Spec.id,
    title: m6Spec.name,
    datum: `${m6Spec.stationCode} | Ax.Sta +480mm → +1120mm | R=840mm @ 6:00 Clocking`,
    material: 'Cast Aluminum 356-T6 Gearbox Housing + Carburized AISI 9310 Bevel Gears',
    description: m6Spec.description,
    basePos: new THREE.Vector3(0, 0, 0),
    explodeVec: new THREE.Vector3(
      m6Spec.explodeAxialMm * MM_TO_L2,
      m6Spec.explodeRadialMm * MM_TO_L2,
      0
    )
  };
  explodableParts.push(m6Group);
  interactiveTargets.push(m6Group);
  root.add(m6Group);

  return {
    root,
    explodableParts,
    interactiveTargets,
    portMarkers,
    animatedRotors
  };
}
