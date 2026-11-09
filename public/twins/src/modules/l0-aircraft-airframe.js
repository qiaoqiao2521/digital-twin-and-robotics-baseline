/**
 * L0 Module: Boeing 737-800 Complete Airframe Structural Skeleton, Peelable Skin & MountingPort Bays
 * All coordinates strictly computed via `fsBlWlToWorld(staIn, blIn, wlIn)` from official Boeing station diagrams.
 */

import * as THREE from 'three';
import { fsBlWlToWorld, SCALE_3D, INCH_TO_METER } from '../schema/datum-types.js';
import { B737_800_DATUM } from '../data/b737-cfm56-datum.js';

/**
 * Computes the fuselage half-width & vertical radius taper factor at any Fuselage Station (STA 130..1217)
 */
export function getFuselageSectionProfile(staIn) {
  if (staIn <= 130) return { scaleY: 0.04, scaleZ: 0.04, centerWl: 196.0 };
  if (staIn < 340) {
    const t = (staIn - 130) / (340 - 130);
    const ease = Math.sin(t * Math.PI * 0.5);
    return {
      scaleY: 0.12 + 0.88 * Math.pow(ease, 0.82),
      scaleZ: 0.12 + 0.88 * Math.pow(ease, 0.78),
      centerWl: 196.0 + (227.5 - 196.0) * ease
    };
  }
  if (staIn <= 887) {
    return { scaleY: 1.0, scaleZ: 1.0, centerWl: 227.5 };
  }
  const t = Math.min(1, (staIn - 887) / (1217 - 887));
  const taper = 1 - Math.pow(t, 1.35) * 0.88;
  return {
    scaleY: taper,
    scaleZ: taper * 0.92,
    centerWl: 227.5 + t * 26.0 // Tailcone sweeps upward toward WL 253.5 (APU exhaust centerline)
  };
}

export function buildL0AircraftAirframe(materials) {
  const root = new THREE.Group();
  root.name = 'L0_BOEING_737_800_AIRFRAME';
  const explodableParts = [];
  const interactiveTargets = [];
  const portMarkers = [];

  const rBaseWorld = 74.0 * INCH_TO_METER * SCALE_3D; // 74.0 in lobe radius
  const hHalfWorld = 79.0 * INCH_TO_METER * SCALE_3D; // Half of 158.0 in height (WL 148.5..306.5)

  // 1. Fuselage Ring Frames (STA 130 to STA 1217 at ~20-inch industrial frame pitch + key splice bulkheads)
  const frameGroup = new THREE.Group();
  frameGroup.name = 'FUSELAGE_FS_RING_FRAMES';
  const allStations = [];
  for (let sta = 140; sta <= 1200; sta += 24) {
    allStations.push(sta);
  }
  // Ensure exact key splice stations from Boeing Figure 2 are present
  const spliceStations = [130, 178, 224.8, 259.5, 291.5, 360, 540, 578, 601.8, 635, 663.75, 706.26, 727, 887, 947.5, 1016, 1068, 1126, 1156, 1217];
  spliceStations.forEach((s) => {
    if (!allStations.some((x) => Math.abs(x - s) < 6)) allStations.push(s);
  });
  allStations.sort((a, b) => a - b);

  allStations.forEach((sta) => {
    const prof = getFuselageSectionProfile(sta);
    const pos = fsBlWlToWorld(sta, 0, prof.centerWl);
    const isMajorSplice = spliceStations.some((s) => Math.abs(s - sta) < 1.5);
    const tubeRadius = isMajorSplice ? 0.014 : 0.0065;
    const torusGeo = new THREE.TorusGeometry(rBaseWorld, tubeRadius, 8, 40);
    const mat = isMajorSplice ? materials.titaniumGold : materials.structuralFrame;
    const ring = new THREE.Mesh(torusGeo, mat);
    ring.rotation.y = Math.PI / 2;
    ring.position.set(pos.x, pos.y, pos.z);
    ring.scale.set(prof.scaleZ, prof.scaleY * (79 / 74), 1);
    frameGroup.add(ring);

    // Cabin Floor Beam at WL 208.1 (between STA 178 and STA 1016)
    if (sta >= 178 && sta <= 1016) {
      const floorWl = 208.1;
      const floorPos = fsBlWlToWorld(sta, 0, floorWl);
      const beamSpan = rBaseWorld * prof.scaleZ * 1.82;
      const floorBeam = new THREE.Mesh(
        new THREE.BoxGeometry(isMajorSplice ? 0.018 : 0.009, 0.014, beamSpan),
        isMajorSplice ? materials.titaniumGold : materials.structuralFrame
      );
      floorBeam.position.set(floorPos.x, floorPos.y, 0);
      frameGroup.add(floorBeam);
    }
  });

  frameGroup.userData = {
    partId: 'L0-FUSELAGE-FRAMES',
    title: 'B737-800 机身纵向隔框与客舱地板梁骨架 (FS Ring Frames STA 130–1217 & WL 208.1 Floor Beams)',
    datum: 'STA 130.0 → STA 1217.0 | BL ±74.0 in | WL 148.5 → WL 306.5',
    material: 'Al 2024-T3 / Al 7075-T6 Forged Splice Frames (Sections 41, 43, 44, 46, 47, 48)',
    description: '严格按照波音 737-800 结构站位图（Figure 2）生成的双圆弧机身环框、前后增压隔框（STA 178 / STA 1016）与 WL 208.1 客舱横梁。'
  };
  interactiveTargets.push(frameGroup);
  root.add(frameGroup);

  // 2. Longitudinal Stringers & Lower Keel Beam (WL 148.5)
  const stringerGroup = new THREE.Group();
  const numStringers = 18;
  for (let i = 0; i < numStringers; i++) {
    const angle = (i / numStringers) * Math.PI * 2;
    const pts = [];
    for (let sta = 135; sta <= 1210; sta += 32) {
      const prof = getFuselageSectionProfile(sta);
      const blIn = Math.sin(angle) * 74.0 * prof.scaleZ;
      const wlIn = prof.centerWl + Math.cos(angle) * 79.0 * prof.scaleY;
      const p = fsBlWlToWorld(sta, blIn, wlIn);
      pts.push(new THREE.Vector3(p.x, p.y, p.z));
    }
    const curve = new THREE.CatmullRomCurve3(pts);
    const strGeo = new THREE.TubeGeometry(curve, 48, 0.0038, 5, false);
    const strMesh = new THREE.Mesh(strGeo, materials.stringerCyan);
    stringerGroup.add(strMesh);
  }
  // Heavy Bottom Keel Beam (STA 500 to STA 740 along WL 152.0, BL 0.0)
  const keelStart = fsBlWlToWorld(500, 0, 154.0);
  const keelEnd = fsBlWlToWorld(740, 0, 154.0);
  const keelLen = keelEnd.x - keelStart.x;
  const keelBeam = new THREE.Mesh(
    new THREE.BoxGeometry(keelLen, 0.045, 0.055),
    materials.titaniumGold
  );
  keelBeam.position.set((keelStart.x + keelEnd.x) * 0.5, keelStart.y, 0);
  stringerGroup.add(keelBeam);
  root.add(stringerGroup);

  // 3. Center Wing Box (STA 540.0 to STA 663.75) + Swept Wing Front/Rear Spars & 22 Wing Station Ribs (WS 156.25..691.50)
  const wingStructureGroup = new THREE.Group();
  wingStructureGroup.name = 'WING_BOX_AND_WS_RIBS';

  const cwbFwd = fsBlWlToWorld(540.0, 0, 182.0);
  const cwbAft = fsBlWlToWorld(663.75, 0, 182.0);
  const cwbWidth = 71.24 * 2 * INCH_TO_METER * SCALE_3D;
  const centerWingBox = new THREE.Mesh(
    new THREE.BoxGeometry(cwbAft.x - cwbFwd.x, 0.14, cwbWidth),
    materials.titaniumGold
  );
  centerWingBox.position.set((cwbFwd.x + cwbAft.x) * 0.5, cwbFwd.y, 0);
  wingStructureGroup.add(centerWingBox);

  // Build both Left (-Z) and Right (+Z) Wing Spars & WS Ribs from official Figure 3 data
  [-1, 1].forEach((side) => {
    const sparFrontPts = [];
    const sparRearPts = [];

    B737_800_DATUM.wingRibStations.forEach((rib) => {
      const spanRatio = (rib.wbl - 71.24) / (680.40 - 71.24);
      // 25.02 deg quarter-chord sweep + 6 deg dihedral
      const fwdSta = 540.0 + spanRatio * 232.0;
      const chordIn = 178.0 * (1 - spanRatio * 0.72); // Root chord 178 in -> Tip chord 49.8 in
      const aftSta = fwdSta + chordIn * 0.72;
      const wlRib = 182.0 + spanRatio * 64.0;
      const blIn = side * rib.wbl;

      const pFwd = fsBlWlToWorld(fwdSta, blIn, wlRib);
      const pAft = fsBlWlToWorld(aftSta, blIn, wlRib - 4.0);
      sparFrontPts.push(new THREE.Vector3(pFwd.x, pFwd.y, pFwd.z));
      sparRearPts.push(new THREE.Vector3(pAft.x, pAft.y, pAft.z));

      // Wing Rib Web between Front and Rear Spar
      const ribLen = Math.hypot(pAft.x - pFwd.x, pAft.z - pFwd.z);
      const ribHeight = 0.11 * (1 - spanRatio * 0.62);
      const isPylonRib = Math.abs(rib.wbl - 190.97) < 2;
      const ribMesh = new THREE.Mesh(
        new THREE.BoxGeometry(ribLen, ribHeight, isPylonRib ? 0.018 : 0.008),
        isPylonRib ? materials.portHighlight : materials.structuralFrame
      );
      ribMesh.position.set((pFwd.x + pAft.x) * 0.5, (pFwd.y + pAft.y) * 0.5, pFwd.z);
      wingStructureGroup.add(ribMesh);
    });

    const frontSparCurve = new THREE.CatmullRomCurve3(sparFrontPts);
    const rearSparCurve = new THREE.CatmullRomCurve3(sparRearPts);
    wingStructureGroup.add(new THREE.Mesh(new THREE.TubeGeometry(frontSparCurve, 32, 0.016, 8, false), materials.titaniumGold));
    wingStructureGroup.add(new THREE.Mesh(new THREE.TubeGeometry(rearSparCurve, 32, 0.013, 8, false), materials.structuralFrame));

    // Blended Winglet at WBL ±680.40 (WS 691.50)
    const tipPt = sparFrontPts[sparFrontPts.length - 1];
    const wingletPts = [
      tipPt.clone(),
      tipPt.clone().add(new THREE.Vector3(0.08, 0.18, side * 0.08)),
      tipPt.clone().add(new THREE.Vector3(0.24, 0.58, side * 0.12))
    ];
    const wingletCurve = new THREE.CatmullRomCurve3(wingletPts);
    wingStructureGroup.add(new THREE.Mesh(new THREE.TubeGeometry(wingletCurve, 16, 0.012, 6, false), materials.stringerCyan));
  });

  wingStructureGroup.userData = {
    partId: 'L0-WING-SPAR-RIBS',
    title: '中央翼盒（STA 540–663.75）与机翼前后梁/翼肋体系（WS 156.25–691.50）',
    datum: 'STA 540.0–663.75 | WBL ±71.24 → ±680.40 | WS 156.25 → 691.50',
    material: 'Al 7055-T77511 Upper Skin/Spar Chords + Al 2024-T3 Lower Panels',
    description: '基于 NTSB 波音 737-800 机翼站位图（Figure 3）构建：在 WBL ±190.97 / WS 204.25 处设加厚发动机吊架主承力翼肋（高亮金橙色）。'
  };
  interactiveTargets.push(wingStructureGroup);
  root.add(wingStructureGroup);

  // 4. Vertical Fin (STA 960..1180, WL 306.5..642.0) & Horizontal Stabilizer (STA 1068..1195, BL ±282.5)
  const empennageGroup = new THREE.Group();
  for (let i = 0; i <= 6; i++) {
    const t = i / 6;
    const wl = 295.0 + t * (642.0 - 295.0);
    const fwdSta = 955.0 + t * 145.0;
    const aftSta = 1145.0 + t * 52.0;
    const p1 = fsBlWlToWorld(fwdSta, 0, wl);
    const p2 = fsBlWlToWorld(aftSta, 0, wl);
    const finRib = new THREE.Mesh(new THREE.BoxGeometry(p2.x - p1.x, 0.008, 0.025 * (1 - t * 0.5)), materials.structuralFrame);
    finRib.position.set((p1.x + p2.x) * 0.5, p1.y, 0);
    empennageGroup.add(finRib);
  }
  const finFrontBot = fsBlWlToWorld(955, 0, 295);
  const finFrontTop = fsBlWlToWorld(1100, 0, 642);
  const finRearBot = fsBlWlToWorld(1145, 0, 295);
  const finRearTop = fsBlWlToWorld(1197, 0, 642);
  empennageGroup.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.LineCurve3(new THREE.Vector3(finFrontBot.x, finFrontBot.y, 0), new THREE.Vector3(finFrontTop.x, finFrontTop.y, 0)), 8, 0.014, 6, false), materials.titaniumGold));
  empennageGroup.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.LineCurve3(new THREE.Vector3(finRearBot.x, finRearBot.y, 0), new THREE.Vector3(finRearTop.x, finRearTop.y, 0)), 8, 0.012, 6, false), materials.structuralFrame));
  root.add(empennageGroup);

  // 5. Peelable Aerodynamic Fuselage Skin Halves (Upper Crown Skin + Left/Right Belly Fairings)
  // Explodes outward when user drags the Explode Slider or toggles Skin Peel
  const buildPeelableSkinHalf = (sideSign, label, explodeVec) => {
    const skinGroup = new THREE.Group();
    const lathePts = [];
    for (let sta = 130; sta <= 1217; sta += 22) {
      const prof = getFuselageSectionProfile(sta);
      const pos = fsBlWlToWorld(sta, 0, prof.centerWl);
      lathePts.push(new THREE.Vector2(rBaseWorld * prof.scaleZ * 1.015, pos.x));
    }
    const phiStart = sideSign < 0 ? Math.PI * 0.06 : Math.PI * 1.06;
    const latheGeo = new THREE.LatheGeometry(lathePts, 28, phiStart, Math.PI * 0.88);
    latheGeo.rotateZ(-Math.PI / 2);
    const skinMesh = new THREE.Mesh(latheGeo, materials.aeroSkin);
    const centerRef = fsBlWlToWorld(601.875, 0, 227.5);
    skinMesh.position.y = centerRef.y;
    skinGroup.add(skinMesh);

    const basePos = new THREE.Vector3(0, 0, 0);
    skinGroup.userData = {
      partId: sideSign < 0 ? 'L0-SKIN-PORT' : 'L0-SKIN-STBD',
      title: label,
      datum: `STA 130.0–1217.0 | BL ${sideSign < 0 ? '-74.0' : '+74.0'} in | Alclad 2024-T3 Skin Panels`,
      material: 'Alclad 2024-T3 Chem-Milled Skin (0.036–0.090 in Gauge)',
      description: '可剥离气动蒙皮壁板：拖动爆炸拆解滑块时沿 BL/WL 正交方向平滑分离，完整显露内部 FS 站位环框、龙骨梁与中央翼盒。',
      basePos,
      explodeVec
    };
    explodableParts.push(skinGroup);
    interactiveTargets.push(skinGroup);
    root.add(skinGroup);
  };

  buildPeelableSkinHalf(-1, '左侧机身气动蒙皮壁板总成 (Port Fuselage Alclad 2024 Skin Shell)', new THREE.Vector3(0, 0.35, -1.25));
  buildPeelableSkinHalf(1, '右侧机身气动蒙皮壁板总成 (Starboard Fuselage Alclad 2024 Skin Shell)', new THREE.Vector3(0, 0.35, 1.25));

  // 6. Standard MountingPort Interface Markers + L1 Preview Pods at WBL ±190.97
  B737_800_DATUM.mountingPorts.forEach((port) => {
    const portGroup = new THREE.Group();
    portGroup.position.set(port.worldPos.x, port.worldPos.y, port.worldPos.z);

    // Glowing CAD Flange Ring + Orthogonal Axis Crosshair
    const ringRadius = (port.boltCircleMm / 1000) * SCALE_3D * 0.65;
    const flangeRing = new THREE.Mesh(
      new THREE.TorusGeometry(Math.max(0.08, ringRadius), 0.012, 12, 32),
      port.id === 'PORT-PYLON-LH' ? materials.portActiveGlow : materials.portHighlight
    );
    flangeRing.rotation.x = Math.PI / 2;
    portGroup.add(flangeRing);

    const coreBeacon = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.055, 1),
      port.id === 'PORT-PYLON-LH' ? materials.portActiveGlow : materials.portHighlight
    );
    portGroup.add(coreBeacon);

    // If this is the LH or RH Wing Pylon Port, also render the mounted L1 Nacelle/Pylon Silhouette Preview
    if (port.id === 'PORT-PYLON-LH' || port.id === 'PORT-PYLON-RH') {
      const nacellePod = new THREE.Group();
      const fanRadius = (1.549 * 0.5) * SCALE_3D;
      const nacLen = 2.508 * SCALE_3D;
      // Pylon Strut connecting Wing Front Spar (WL 192) down to Engine Centerline (WL 162)
      const strutMesh = new THREE.Mesh(
        new THREE.BoxGeometry(nacLen * 0.62, 0.19, 0.045),
        port.id === 'PORT-PYLON-LH' ? materials.portActiveGlow : materials.titaniumGold
      );
      strutMesh.position.set(-0.08, -0.09, 0);
      nacellePod.add(strutMesh);

      // Nacelle Cowl Barrel
      const cowlGeo = new THREE.CylinderGeometry(fanRadius * 1.12, fanRadius * 0.96, nacLen, 28, 1, true);
      cowlGeo.rotateZ(Math.PI / 2);
      const cowlMesh = new THREE.Mesh(cowlGeo, materials.nacellePreview);
      cowlMesh.position.set(-0.12, -0.22, 0);
      nacellePod.add(cowlMesh);

      // Spinning Fan Spinner & Blades inside preview pod
      const fanHub = new THREE.Mesh(
        new THREE.ConeGeometry(fanRadius * 0.32, 0.14, 16),
        materials.titaniumGold
      );
      fanHub.rotation.z = Math.PI / 2;
      fanHub.position.set(-0.12 - nacLen * 0.42, -0.22, 0);
      nacellePod.add(fanHub);

      portGroup.add(nacellePod);
    }

    const basePos = portGroup.position.clone();
    const explodeVec = new THREE.Vector3(
      port.id.includes('PYLON') ? -0.35 : 0,
      port.id.includes('PYLON') ? -0.45 : -0.3,
      port.blIn < 0 ? -0.35 : port.blIn > 0 ? 0.35 : 0
    );

    portGroup.userData = {
      isMountingPort: true,
      portData: port,
      partId: port.id,
      title: `【标准挂载接口】${port.name}`,
      datum: `STA ${port.staIn.toFixed(1)} | BL ${port.blIn.toFixed(2)} | WL ${port.wlIn.toFixed(1)}${port.wsIn ? ` | WS ${port.wsIn}` : ''}`,
      material: `${port.interfaceStandard} (Bolt Circle Ø${port.boltCircleMm}mm)`,
      description: `${port.description} 点击此接口可下钻进入子系统级拆解。`,
      drillDownLevel: port.id === 'PORT-PYLON-LH' || port.id === 'PORT-PYLON-RH' ? 1 : null,
      basePos,
      explodeVec
    };

    explodableParts.push(portGroup);
    interactiveTargets.push(portGroup);
    portMarkers.push(portGroup);
    root.add(portGroup);
  });

  return {
    root,
    explodableParts,
    interactiveTargets,
    portMarkers
  };
}
