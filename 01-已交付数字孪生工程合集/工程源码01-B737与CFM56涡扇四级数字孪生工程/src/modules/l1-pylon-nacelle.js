/**
 * L1 Module: Boeing 737-800 Left Wing Pylon Torque Box, Thrust Struts & Nacelle Cowl System (ATA 54 / ATA 71 / ATA 78)
 * Mated directly to Parent Port `PORT-PYLON-LH` at WBL -190.97 / WS 204.25 / STA 518.0
 * Exposes Child MountingPorts `PORT-ENG-FWD-STA12` (Fan Frame Cone Bolts) and `PORT-ENG-AFT-STA5` (TRF Tangential Links)
 */

import * as THREE from 'three';
import { L1_PYLON_NACELLE_DATUM } from '../data/b737-cfm56-datum.js';

export function buildL1PylonNacelle(materials) {
  const root = new THREE.Group();
  root.name = 'L1_PYLON_NACELLE_ASSEMBLY';
  const explodableParts = [];
  const interactiveTargets = [];
  const portMarkers = [];
  const coaxialGuides = [];

  // Reference: Local L1 scene centered on Engine Centerline (WBL -190.97, WL 162.0, STA 500.0)
  // Scale: 1 meter = 1.45 scene units in L1/L2 focus mode for crisp mechanical detail
  const M_SCALE = 1.45;
  const fanRadius = 0.7745 * M_SCALE;

  // 0. Ghost Context Reference of Parent Wing Front/Rear Spar Segment (WS 180.00 to WS 253.00)
  const wingRefGroup = new THREE.Group();
  const frontSparBeam = new THREE.Mesh(
    new THREE.BoxGeometry(0.18, 0.34, 3.6),
    materials.ghostWireframe
  );
  frontSparBeam.position.set(0.65, 1.18, 0);
  wingRefGroup.add(frontSparBeam);

  // Rib #3 at WBL -190.97 / WS 204.25 (Parent Mounting Rib)
  const rib3Web = new THREE.Mesh(
    new THREE.BoxGeometry(1.95, 0.32, 0.06),
    materials.ghostWireframe
  );
  rib3Web.position.set(1.45, 1.18, 0);
  wingRefGroup.add(rib3Web);

  // Parent Port Flange Indicator (`PORT-PYLON-LH` 4 Fuse-Pin Clevis Lugs)
  [-0.22, 0.22].forEach((zOff) => {
    const clevisLug = new THREE.Mesh(
      new THREE.CylinderGeometry(0.065, 0.065, 0.16, 16),
      materials.portHighlight
    );
    clevisLug.position.set(0.55, 1.02, zOff);
    wingRefGroup.add(clevisLug);
  });
  root.add(wingRefGroup);

  // 1. Titanium Pylon Primary Torque Box (ATA 54-11)
  const torqueBoxGroup = new THREE.Group();
  const pylonShape = new THREE.Shape();
  pylonShape.moveTo(-0.95, 0.82);
  pylonShape.lineTo(1.55, 1.12);
  pylonShape.lineTo(1.85, 0.58);
  pylonShape.lineTo(1.15, 0.42);
  pylonShape.lineTo(-0.75, 0.56);
  pylonShape.closePath();

  const extrudeSettings = { depth: 0.34, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.02, bevelSegments: 2 };
  const boxGeo = new THREE.ExtrudeGeometry(pylonShape, extrudeSettings);
  boxGeo.translate(0, 0, -0.17);
  const boxMesh = new THREE.Mesh(boxGeo, materials.titaniumGold);
  torqueBoxGroup.add(boxMesh);

  // Internal Forged Bulkheads inside Pylon Torque Box
  [-0.55, -0.1, 0.35, 0.85, 1.35].forEach((xPos) => {
    const rib = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.44, 0.38), materials.structuralFrame);
    rib.position.set(xPos, 0.76, 0);
    torqueBoxGroup.add(rib);
  });

  const tbSpec = L1_PYLON_NACELLE_DATUM.subcomponents[0];
  torqueBoxGroup.userData = {
    partId: tbSpec.id,
    title: `${tbSpec.code} — ${tbSpec.name}`,
    datum: 'WBL -190.97 | WS 204.25 | STA 475.0 → STA 578.0 | WL 192.0',
    material: tbSpec.material,
    description: tbSpec.description,
    basePos: new THREE.Vector3(0, 0, 0),
    explodeVec: new THREE.Vector3(tbSpec.explodeVec.x, tbSpec.explodeVec.y, tbSpec.explodeVec.z)
  };
  explodableParts.push(torqueBoxGroup);
  interactiveTargets.push(torqueBoxGroup);
  root.add(torqueBoxGroup);

  // 2. Dual Diagonal Thrust Struts & Whiffletree Balance Beam (ATA 71-22)
  const thrustStrutGroup = new THREE.Group();
  [-0.16, 0.16].forEach((zOff) => {
    const pStart = new THREE.Vector3(-0.55, 0.62, zOff);
    const pEnd = new THREE.Vector3(0.48, 0.88, zOff * 0.5);
    const strutGeo = new THREE.TubeGeometry(new THREE.LineCurve3(pStart, pEnd), 8, 0.028, 12, false);
    thrustStrutGroup.add(new THREE.Mesh(strutGeo, materials.highTempAlloy));
  });
  const whiffletree = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.09, 0.42), materials.portHighlight);
  whiffletree.position.set(-0.55, 0.62, 0);
  thrustStrutGroup.add(whiffletree);

  const tsSpec = L1_PYLON_NACELLE_DATUM.subcomponents[1];
  thrustStrutGroup.userData = {
    partId: tsSpec.id,
    title: `${tsSpec.code} — ${tsSpec.name}`,
    datum: 'Ax.Sta +780mm → +1420mm | 12:00 Centerline | Fx = 121.4 kN',
    material: tsSpec.material,
    description: tsSpec.description,
    basePos: new THREE.Vector3(0, 0, 0),
    explodeVec: new THREE.Vector3(tsSpec.explodeVec.x, tsSpec.explodeVec.y, tsSpec.explodeVec.z)
  };
  explodableParts.push(thrustStrutGroup);
  interactiveTargets.push(thrustStrutGroup);
  root.add(thrustStrutGroup);

  // 3. Acoustic Inlet Cowl & Thermal Anti-Ice Lip (ATA 71-11)
  const inletGroup = new THREE.Group();
  const lipRadius = fanRadius * 1.04;
  const lipTorus = new THREE.Mesh(
    new THREE.TorusGeometry(lipRadius, 0.11, 20, 48),
    materials.chromeAlloy
  );
  lipTorus.rotation.y = Math.PI / 2;
  lipTorus.position.x = -1.62;
  inletGroup.add(lipTorus);

  const barrelGeo = new THREE.CylinderGeometry(lipRadius * 1.05, fanRadius * 1.08, 0.72, 48, 1, true);
  barrelGeo.rotateZ(Math.PI / 2);
  const barrelMesh = new THREE.Mesh(barrelGeo, materials.aeroSkin);
  barrelMesh.position.x = -1.25;
  inletGroup.add(barrelMesh);

  // Internal Piccolo Anti-Ice Ring inside Lip
  const piccoloRing = new THREE.Mesh(
    new THREE.TorusGeometry(lipRadius * 0.98, 0.018, 10, 36),
    materials.portHighlight
  );
  piccoloRing.rotation.y = Math.PI / 2;
  piccoloRing.position.x = -1.56;
  inletGroup.add(piccoloRing);

  const inSpec = L1_PYLON_NACELLE_DATUM.subcomponents[2];
  inletGroup.userData = {
    partId: inSpec.id,
    title: `${inSpec.code} — ${inSpec.name}`,
    datum: 'STA 452.0 → STA 488.0 | Engine Sta. 0 Intake Hilite Plane',
    material: inSpec.material,
    description: inSpec.description,
    basePos: new THREE.Vector3(0, 0, 0),
    explodeVec: new THREE.Vector3(inSpec.explodeVec.x, inSpec.explodeVec.y, inSpec.explodeVec.z)
  };
  explodableParts.push(inletGroup);
  interactiveTargets.push(inletGroup);
  root.add(inletGroup);

  // 4. Left & Right Hinged CFRP Fan Cowl Doors (ATA 71-13-L / R)
  const buildFanCowlDoor = (sideSign, specIndex) => {
    const cowlGroup = new THREE.Group();
    const phiStart = sideSign < 0 ? Math.PI * 0.05 : Math.PI * 1.05;
    const cowlGeo = new THREE.CylinderGeometry(fanRadius * 1.09, fanRadius * 1.07, 1.05, 36, 1, true, phiStart, Math.PI * 0.9);
    cowlGeo.rotateZ(Math.PI / 2);
    const cowlMesh = new THREE.Mesh(cowlGeo, materials.aeroSkin);
    cowlMesh.position.x = -0.35;
    cowlGroup.add(cowlMesh);

    // Stiffening Circumferential Ribs on inner wall of CFRP door
    [-0.75, -0.35, 0.05].forEach((xR) => {
      const ribArc = new THREE.Mesh(
        new THREE.TorusGeometry(fanRadius * 1.06, 0.016, 8, 28, Math.PI * 0.86),
        materials.structuralFrame
      );
      ribArc.rotation.y = Math.PI / 2;
      ribArc.rotation.x = sideSign < 0 ? 0.1 : Math.PI + 0.1;
      ribArc.position.x = xR;
      cowlGroup.add(ribArc);
    });

    const spec = L1_PYLON_NACELLE_DATUM.subcomponents[specIndex];
    cowlGroup.userData = {
      partId: spec.id,
      title: `${spec.code} — ${spec.name}`,
      datum: `STA 488.0 → STA 532.0 | WBL ${sideSign < 0 ? '-222.0' : '-160.0'} | Hinge Line @ 12:00 Pylon`,
      material: spec.material,
      description: spec.description,
      basePos: new THREE.Vector3(0, 0, 0),
      explodeVec: new THREE.Vector3(spec.explodeVec.x, spec.explodeVec.y, spec.explodeVec.z)
    };
    explodableParts.push(cowlGroup);
    interactiveTargets.push(cowlGroup);
    root.add(cowlGroup);
  };
  buildFanCowlDoor(-1, 3);
  buildFanCowlDoor(1, 4);

  // 5. Translating C-Duct Thrust Reverser Halves & Turning Cascades (ATA 78-31)
  [-1, 1].forEach((sideSign) => {
    const trGroup = new THREE.Group();
    const phiStart = sideSign < 0 ? Math.PI * 0.06 : Math.PI * 1.06;
    const sleeveGeo = new THREE.CylinderGeometry(fanRadius * 1.05, fanRadius * 0.76, 1.15, 36, 1, true, phiStart, Math.PI * 0.88);
    sleeveGeo.rotateZ(Math.PI / 2);
    const sleeveMesh = new THREE.Mesh(sleeveGeo, materials.nacellePreview);
    sleeveMesh.position.x = 0.78;
    trGroup.add(sleeveMesh);

    // Exposed Turning Vane Cascade Basket when translated
    const cascadeGeo = new THREE.CylinderGeometry(fanRadius * 0.98, fanRadius * 0.94, 0.42, 24, 4, true, phiStart, Math.PI * 0.85);
    cascadeGeo.rotateZ(Math.PI / 2);
    const cascadeMesh = new THREE.Mesh(cascadeGeo, materials.stringerCyan);
    cascadeMesh.position.x = 0.38;
    trGroup.add(cascadeMesh);

    const spec = L1_PYLON_NACELLE_DATUM.subcomponents[5];
    trGroup.userData = {
      partId: `${spec.id}-${sideSign < 0 ? 'LH' : 'RH'}`,
      title: `${spec.code} — ${spec.name} (${sideSign < 0 ? '左半环 LH C-Duct' : '右半环 RH C-Duct'})`,
      datum: 'STA 532.0 → STA 584.0 | Translating Stroke +485mm',
      material: spec.material,
      description: spec.description,
      basePos: new THREE.Vector3(0, 0, 0),
      explodeVec: new THREE.Vector3(spec.explodeVec.x, spec.explodeVec.y, sideSign * Math.abs(spec.explodeVec.z))
    };
    explodableParts.push(trGroup);
    interactiveTargets.push(trGroup);
    root.add(trGroup);
  });

  // 6. Internal Preview of CFM56 Core Silhouette + Standard Child MountingPorts (`PORT-ENG-FWD-STA12` & `PORT-ENG-AFT-STA5`)
  const corePreview = new THREE.Group();
  const fanPreview = new THREE.Mesh(
    new THREE.CylinderGeometry(fanRadius * 0.96, fanRadius * 0.96, 0.22, 32),
    materials.ghostWireframe
  );
  fanPreview.rotation.z = Math.PI / 2;
  fanPreview.position.x = -0.82;
  corePreview.add(fanPreview);

  const coreBarrel = new THREE.Mesh(
    new THREE.CylinderGeometry(fanRadius * 0.52, fanRadius * 0.46, 2.35, 28, 4, true),
    materials.ghostWireframe
  );
  coreBarrel.rotation.z = Math.PI / 2;
  coreBarrel.position.x = 0.25;
  corePreview.add(coreBarrel);
  root.add(corePreview);

  // Child MountingPorts to L2 CFM56 Engine (`PORT-ENG-FWD-STA12` & `PORT-ENG-AFT-STA5`)
  L1_PYLON_NACELLE_DATUM.childMountingPorts.forEach((port, idx) => {
    const portGroup = new THREE.Group();
    const xPos = idx === 0 ? -0.55 : 1.15;
    const yPos = idx === 0 ? 0.58 : 0.44;
    portGroup.position.set(xPos, yPos, 0);

    const flangeRing = new THREE.Mesh(
      new THREE.TorusGeometry(0.18, 0.022, 14, 36),
      materials.portActiveGlow
    );
    flangeRing.rotation.x = Math.PI / 2;
    portGroup.add(flangeRing);

    const coneBolt = new THREE.Mesh(
      new THREE.ConeGeometry(0.075, 0.18, 16),
      materials.portActiveGlow
    );
    portGroup.add(coneBolt);

    portGroup.userData = {
      isMountingPort: true,
      portData: port,
      partId: port.id,
      title: `【L1→L2 标准挂载端口】${port.name}`,
      datum: `Engine Ax.Sta +${port.engineAxialMm}mm | R=${port.radiusMm}mm @ 12:00 | Ø${port.boltCircleMm}mm`,
      material: port.interfaceStandard,
      description: `${port.description} 点击此接口立即下钻进入 L2 CFM56 涡扇发动机六大核心段拆解！`,
      drillDownLevel: 2,
      basePos: portGroup.position.clone(),
      explodeVec: new THREE.Vector3(0, 0.35, 0)
    };
    explodableParts.push(portGroup);
    interactiveTargets.push(portGroup);
    portMarkers.push(portGroup);
    root.add(portGroup);
  });

  // Coaxial Assembly Centerline Guide Line
  const axisGeo = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(-3.2, 0, 0),
    new THREE.Vector3(3.2, 0, 0)
  ]);
  const axisLine = new THREE.Line(axisGeo, materials.datumLineCyan);
  axisLine.computeLineDistances();
  coaxialGuides.push(axisLine);
  root.add(axisLine);

  return {
    root,
    explodableParts,
    interactiveTargets,
    portMarkers,
    coaxialGuides
  };
}
