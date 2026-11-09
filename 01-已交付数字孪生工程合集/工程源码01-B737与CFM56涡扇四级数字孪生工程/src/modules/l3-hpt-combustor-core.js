/**
 * L3 Module: High-Pressure Turbine (HPT) Rotor Disk, Fir-Tree Single-Crystal Blades,
 * Stage-1 Cooled NGV Ring, Active Clearance Control Shroud & Annular Combustor Swirlers
 *
 * Modeled from Rolls-Royce "The Jet Engine" (Turbines & Combustion Chapters) and CFMI CTC-044
 */

import * as THREE from 'three';
import { L3_HPT_MICRO_DATUM } from '../data/b737-cfm56-datum.js';

export function buildL3HptCombustorCore(materials) {
  const root = new THREE.Group();
  root.name = 'L3_HPT_COMBUSTOR_MICRO_ASSEMBLY';
  const explodableParts = [];
  const interactiveTargets = [];
  const animatedRotors = { n2Parts: [] };

  // 0. Ghost Context Reference of Parent L2 N2 Shaft & HPC Rear Case
  const ghostL2 = new THREE.Group();
  const n2GhostDrum = new THREE.Mesh(
    new THREE.CylinderGeometry(0.45, 0.52, 3.2, 28, 4, true),
    materials.ghostWireframe
  );
  n2GhostDrum.rotation.z = Math.PI / 2;
  n2GhostDrum.position.x = -0.9;
  ghostL2.add(n2GhostDrum);

  const axisLine = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-3.4, 0, 0), new THREE.Vector3(2.8, 0, 0)]),
    materials.datumLineCyan
  );
  ghostL2.add(axisLine);
  root.add(ghostL2);

  // 1. Rene 88DT Powder-Metallurgy HPT Rotor Disk with Curvic Coupling & 72 Broached Fir-Tree Rim Slots
  const diskSpec = L3_HPT_MICRO_DATUM.components[0];
  const diskGroup = new THREE.Group();
  const diskRimR = 1.12;
  const diskBoreR = 0.44;

  // Web & Thick Bore Hub Profile via LatheGeometry
  const diskProfile = [
    new THREE.Vector2(diskBoreR, -0.22),
    new THREE.Vector2(diskBoreR, 0.22),
    new THREE.Vector2(diskBoreR * 1.35, 0.19),
    new THREE.Vector2(diskRimR * 0.78, 0.08),
    new THREE.Vector2(diskRimR, 0.16),
    new THREE.Vector2(diskRimR, -0.16),
    new THREE.Vector2(diskRimR * 0.78, -0.08),
    new THREE.Vector2(diskBoreR * 1.35, -0.19),
    new THREE.Vector2(diskBoreR, -0.22)
  ];
  const diskGeo = new THREE.LatheGeometry(diskProfile, 48);
  diskGeo.rotateZ(Math.PI / 2);
  const diskMesh = new THREE.Mesh(diskGeo, materials.titaniumGold);
  diskGroup.add(diskMesh);

  // Curvic Coupling Bolt Circle & Cooling Air Inducer Holes on Disk Face
  const curvicRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.76, 0.032, 12, 36),
    materials.portHighlight
  );
  curvicRing.rotation.y = Math.PI / 2;
  curvicRing.position.x = -0.11;
  diskGroup.add(curvicRing);

  diskGroup.userData = {
    partId: diskSpec.id,
    title: diskSpec.name,
    datum: diskSpec.datumStation,
    material: diskSpec.material,
    description: diskSpec.description,
    basePos: new THREE.Vector3(0, 0, 0),
    explodeVec: new THREE.Vector3(0, 0, 0)
  };
  interactiveTargets.push(diskGroup);
  root.add(diskGroup);

  // 2. 72 Single-Crystal Rene N5 Film-Cooled Turbine Blades with 3-Tang Fir-Tree Roots
  // Top 12 blades are built as an independently explodable sub-assembly so user can inspect the Fir-Tree Root & Serpentine Cooling Channels!
  const bladeSpec = L3_HPT_MICRO_DATUM.components[1];
  const fixedBladesGroup = new THREE.Group();
  const extractableBladesGroup = new THREE.Group();
  const totalBlades = 48; // High-density visual representation of the 72-blade ring

  for (let i = 0; i < totalBlades; i++) {
    const ang = (i / totalBlades) * Math.PI * 2;
    const isExtractableSector = i < 8 || i >= totalBlades - 4; // Top 12 o'clock sector extracts outward during explode

    const bladeUnit = new THREE.Group();
    bladeUnit.rotation.x = ang;

    // 3-Tang Stepped Fir-Tree Root (枞树形三齿榫头)
    for (let tang = 0; tang < 3; tang++) {
      const tangWidth = 0.042 + tang * 0.014;
      const tangMesh = new THREE.Mesh(
        new THREE.BoxGeometry(0.26, 0.032, tangWidth),
        materials.portHighlight
      );
      tangMesh.position.y = diskRimR - 0.09 + tang * 0.036;
      bladeUnit.add(tangMesh);
    }

    // Blade Platform (Shroud Buttress)
    const platform = new THREE.Mesh(
      new THREE.BoxGeometry(0.28, 0.025, 0.12),
      materials.highTempAlloy
    );
    platform.position.y = diskRimR + 0.02;
    bladeUnit.add(platform);

    // Aerofoil with Camber Twist + Internal Serpentine Cooling Channel Cutaway on Extractable Sector
    const foilHeight = 0.56;
    const foil = new THREE.Mesh(
      new THREE.BoxGeometry(0.22, foilHeight, 0.055),
      isExtractableSector ? materials.turbineCrimson : materials.highTempAlloy
    );
    foil.position.y = diskRimR + 0.03 + foilHeight * 0.5;
    foil.rotation.y = 0.52;
    bladeUnit.add(foil);

    // Showerhead Film-Cooling Holes / Internal Serpentine Passage Tubes on Extractable Blades
    if (isExtractableSector) {
      for (let c = -1; c <= 1; c++) {
        const coolChannel = new THREE.Mesh(
          new THREE.CylinderGeometry(0.009, 0.009, foilHeight * 0.92, 8),
          materials.n1ShaftCyan
        );
        coolChannel.position.set(c * 0.052, diskRimR + 0.04 + foilHeight * 0.5, 0.015);
        bladeUnit.add(coolChannel);
      }
    }

    if (isExtractableSector) {
      extractableBladesGroup.add(bladeUnit);
    } else {
      fixedBladesGroup.add(bladeUnit);
    }
  }

  diskGroup.add(fixedBladesGroup);

  extractableBladesGroup.userData = {
    partId: bladeSpec.id,
    title: bladeSpec.name,
    datum: bladeSpec.datumStation,
    material: bladeSpec.material,
    description: bladeSpec.description,
    basePos: new THREE.Vector3(0, 0, 0),
    explodeVec: new THREE.Vector3(bladeSpec.explodeVec.x, bladeSpec.explodeVec.y, bladeSpec.explodeVec.z)
  };
  explodableParts.push(extractableBladesGroup);
  interactiveTargets.push(extractableBladesGroup);
  root.add(extractableBladesGroup);

  // 3. Stage-1 High-Pressure Nozzle Guide Vane (NGV) Stator Ring (42 Cooled Vanes @ Sta. 4)
  const ngvSpec = L3_HPT_MICRO_DATUM.components[2];
  const ngvGroup = new THREE.Group();
  ngvGroup.position.x = -0.52;

  const ngvInnerRing = new THREE.Mesh(
    new THREE.CylinderGeometry(diskRimR, diskRimR, 0.24, 40, 1, true),
    materials.structuralFrame
  );
  ngvInnerRing.rotation.z = Math.PI / 2;
  ngvGroup.add(ngvInnerRing);

  const ngvOuterRing = new THREE.Mesh(
    new THREE.CylinderGeometry(diskRimR + 0.58, diskRimR + 0.58, 0.24, 40, 1, true, 0, Math.PI * 1.65),
    materials.structuralFrame
  );
  ngvOuterRing.rotation.z = Math.PI / 2;
  ngvOuterRing.rotation.x = -0.35;
  ngvGroup.add(ngvOuterRing);

  for (let v = 0; v < 36; v++) {
    const ang = (v / 36) * Math.PI * 2;
    const vHolder = new THREE.Group();
    vHolder.rotation.x = ang;
    const vane = new THREE.Mesh(
      new THREE.BoxGeometry(0.18, 0.55, 0.048),
      materials.chromeAlloy
    );
    vane.position.y = diskRimR + 0.28;
    vane.rotation.y = -0.68;
    vHolder.add(vane);
    ngvGroup.add(vHolder);
  }

  ngvGroup.userData = {
    partId: ngvSpec.id,
    title: ngvSpec.name,
    datum: ngvSpec.datumStation,
    material: ngvSpec.material,
    description: ngvSpec.description,
    basePos: ngvGroup.position.clone(),
    explodeVec: new THREE.Vector3(ngvSpec.explodeVec.x, ngvSpec.explodeVec.y, ngvSpec.explodeVec.z)
  };
  explodableParts.push(ngvGroup);
  interactiveTargets.push(ngvGroup);
  root.add(ngvGroup);

  // 4. HPT Active Clearance Control (ACC) Shroud & Honeycomb Abradable Seal Segments
  const accSpec = L3_HPT_MICRO_DATUM.components[3];
  const accGroup = new THREE.Group();
  const shroudR = diskRimR + 0.62;

  const shroudArc = new THREE.Mesh(
    new THREE.CylinderGeometry(shroudR, shroudR, 0.44, 40, 1, true, -Math.PI * 0.35, Math.PI * 1.15),
    materials.cutawayCaseBlue
  );
  shroudArc.rotation.z = Math.PI / 2;
  accGroup.add(shroudArc);

  // External Impingement Cooling Air Manifold Tubes (ACC)
  [-0.14, 0, 0.14].forEach((xOff) => {
    const manifoldTube = new THREE.Mesh(
      new THREE.TorusGeometry(shroudR * 1.08, 0.028, 12, 40, Math.PI * 1.25),
      materials.stringerCyan
    );
    manifoldTube.rotation.y = Math.PI / 2;
    manifoldTube.rotation.x = -Math.PI * 0.35;
    manifoldTube.position.x = xOff;
    accGroup.add(manifoldTube);
  });

  accGroup.userData = {
    partId: accSpec.id,
    title: accSpec.name,
    datum: accSpec.datumStation,
    material: accSpec.material,
    description: accSpec.description,
    basePos: new THREE.Vector3(0, 0, 0),
    explodeVec: new THREE.Vector3(accSpec.explodeVec.x, accSpec.explodeVec.y, accSpec.explodeVec.z)
  };
  explodableParts.push(accGroup);
  interactiveTargets.push(accGroup);
  root.add(accGroup);

  // 5. Annular Combustor Dome Liner & 20 Duplex Fuel Nozzles / Swirlers (Sta. 3 -> Sta. 39)
  const combSpec = L3_HPT_MICRO_DATUM.components[4];
  const combGroup = new THREE.Group();
  combGroup.position.x = -1.35;

  const outerFlameTube = new THREE.Mesh(
    new THREE.CylinderGeometry(diskRimR + 0.56, diskRimR + 0.58, 0.72, 40, 1, true, 0, Math.PI * 1.55),
    materials.combustorAmber
  );
  outerFlameTube.rotation.z = Math.PI / 2;
  outerFlameTube.rotation.x = -0.4;
  combGroup.add(outerFlameTube);

  const innerFlameTube = new THREE.Mesh(
    new THREE.CylinderGeometry(diskRimR - 0.04, diskRimR, 0.72, 40, 1, true),
    materials.combustorAmber
  );
  innerFlameTube.rotation.z = Math.PI / 2;
  combGroup.add(innerFlameTube);

  // 20 Duplex Fuel Nozzles & Venturi Swirlers
  const swirlerR = diskRimR + 0.27;
  for (let n = 0; n < 20; n++) {
    const ang = (n / 20) * Math.PI * 2;
    const y = Math.cos(ang) * swirlerR;
    const z = Math.sin(ang) * swirlerR;

    const swirlerCup = new THREE.Mesh(
      new THREE.TorusGeometry(0.085, 0.018, 10, 20),
      materials.titaniumGold
    );
    swirlerCup.rotation.y = Math.PI / 2;
    swirlerCup.position.set(-0.34, y, z);
    combGroup.add(swirlerCup);

    const fuelFeedArm = new THREE.Mesh(
      new THREE.CylinderGeometry(0.022, 0.022, 0.36, 10),
      materials.chromeAlloy
    );
    fuelFeedArm.position.set(-0.42, y * 1.14, z * 1.14);
    fuelFeedArm.rotation.x = ang;
    combGroup.add(fuelFeedArm);

    const vortexCone = new THREE.Mesh(
      new THREE.ConeGeometry(0.09, 0.55, 14),
      materials.portActiveGlow
    );
    vortexCone.rotation.z = -Math.PI / 2;
    vortexCone.position.set(0.02, y, z);
    combGroup.add(vortexCone);
  }

  combGroup.userData = {
    partId: combSpec.id,
    title: combSpec.name,
    datum: combSpec.datumStation,
    material: combSpec.material,
    description: combSpec.description,
    basePos: combGroup.position.clone(),
    explodeVec: new THREE.Vector3(combSpec.explodeVec.x, combSpec.explodeVec.y, combSpec.explodeVec.z)
  };
  explodableParts.push(combGroup);
  interactiveTargets.push(combGroup);
  root.add(combGroup);

  return {
    root,
    explodableParts,
    interactiveTargets,
    animatedRotors
  };
}
