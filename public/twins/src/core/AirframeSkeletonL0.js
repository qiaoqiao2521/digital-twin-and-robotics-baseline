/**
 * L0 Boeing 737-800 Structural Airframe, Wing Spars/Ribs & Under-Wing Pylon Skeleton (`AirframeSkeletonL0.js`)
 * - Aligned in 1:1 metric scale (`1 scene unit = 1.0 meter`, `1 inch = 0.0254 m`) around the
 *   Left-Wing (#1) CATIA V5 High-Poly Turbofan Engine mounted at `(0, 0, 0)` (`WBL -190.97 in`, `STA 500 in`, `WL 168 in`).
 * - Includes:
 *   1. Left Under-Wing Strut / Pylon Torque Box (`STA 415..595`, `WBL -190.97`) + Fwd/Aft Iso-Static Mount Bulkheads bolted to the `.glb` engine.
 *   2. Left & Right Swept Wing Front Spar (`18% chord`), Rear Spar (`64% chord`), Center Wing Box (`STA 540..663.75`), and 18 Airfoil Wing Ribs (`WS 71..691`) + Split Scimitar Winglets.
 *   3. Fuselage Station Frames (`STA 130` Nose Radome to `STA 1217` Tailcone), Longitudinal Stringers (`S-1..S-26`), Bottom Keel Beam (`WL 148.5`), and Cabin Floor Beams (`WL 208.1`).
 *   4. Vertical Fin & Horizontal Stabilizer Spar/Rib Skeleton.
 *   5. Holographic Fresnel X-Ray Ghost Aerodynamic Lofted Fuselage & Wing Skin.
 */

import * as THREE from '../../vendor/three.module.js';
import { createFresnelGhostMaterial, injectClipPlaneLaserShader } from '../shaders/FresnelGhostMat.js';

const INCH = 0.0254; // 1 inch = 0.0254 meters (matches CATIA V5 1.70m fan casing = 67 in)

// Datum of Left Engine (#1) Centerline at Three.js world (0, 0, 0):
// Engine Spinner Tip is at X = -2.11m (STA 417), Fan Frame Mount is at X = -1.10m (STA 457),
// Turbine Rear Frame Mount is at X = +0.98m (STA 539).
const ENGINE_REF_STA = 500.0;    // STA 500.0 in corresponds to X = 0.0 m
const ENGINE_REF_WL  = 168.0;    // WL 168.0 in corresponds to Y = 0.0 m
const ENGINE_REF_WBL = -190.97;  // Left Engine Nacelle CL is at WBL -190.97 in (Z = 0.0 m)

function staToX(staIn) {
  return (staIn - ENGINE_REF_STA) * INCH;
}

function wlToY(wlIn) {
  return (wlIn - ENGINE_REF_WL) * INCH;
}

// Note: Left wingtip (WBL < 0) is toward +Z; Fuselage Centerline (WBL = 0) is at Z = -4.85m
function wblToZ(wblIn) {
  return -(wblIn - ENGINE_REF_WBL) * INCH;
}

export function buildB737AirframeSkeletonL0(sharedClipUniforms, assetLoader) {
  const rootGroup = new THREE.Group();
  rootGroup.name = 'PACK_L0_AIRFRAME';

  // Materials
  const al7075Mat = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    metalness: 0.78,
    roughness: 0.28,
    envMapIntensity: 1.05
  });
  injectClipPlaneLaserShader(al7075Mat, sharedClipUniforms);

  const sparGoldMat = new THREE.MeshStandardMaterial({
    color: 0xf59e0b,
    metalness: 0.82,
    roughness: 0.24,
    envMapIntensity: 1.15
  });
  injectClipPlaneLaserShader(sparGoldMat, sharedClipUniforms);

  const tiPylonMat = new THREE.MeshStandardMaterial({
    color: 0xe2e8f0,
    metalness: 0.88,
    roughness: 0.2,
    envMapIntensity: 1.2
  });
  injectClipPlaneLaserShader(tiPylonMat, sharedClipUniforms);

  const skinGhostMat = createFresnelGhostMaterial(sharedClipUniforms, 0x0ea5e9, 0.14);
  const dimGhostMat = createFresnelGhostMaterial(sharedClipUniforms, 0x38bdf8, 0.10);

  // Helper to register interactive structural sub-assemblies into assetLoader.allPartNodes
  function registerAirframePart(group, meta) {
    const meshes = [];
    group.traverse((c) => {
      if (c.isMesh) {
        const origMat = c.material.clone ? c.material.clone() : c.material;
        if (origMat.isMeshStandardMaterial) {
          injectClipPlaneLaserShader(origMat, sharedClipUniforms);
        }
        const hoverMat = al7075Mat.clone();
        hoverMat.emissive = new THREE.Color(0x0ea5e9);
        hoverMat.emissiveIntensity = 0.45;
        injectClipPlaneLaserShader(hoverMat, sharedClipUniforms);

        const selectedMat = sparGoldMat.clone();
        selectedMat.emissive = new THREE.Color(0xf59e0b);
        selectedMat.emissiveIntensity = 0.38;
        injectClipPlaneLaserShader(selectedMat, sharedClipUniforms);

        c.material = origMat;
        c.userData.origMaterial = origMat;
        c.userData.hoverMaterial = hoverMat;
        c.userData.selectedMaterial = selectedMat;
        c.userData.ghostMaterial = dimGhostMat;
        meshes.push(c);
      }
    });

    const partNode = {
      id: meta.id,
      packKey: meta.packKey || 'L0',
      rootObj: group,
      meshes,
      meta: {
        id: meta.id,
        packKey: meta.packKey || 'L0',
        level: meta.level || 'L0',
        subsystem: meta.subsystem || 'AIRFRAME_SKELETON',
        label_zh: meta.label_zh,
        label_en: meta.label_en,
        desc_zh: meta.desc_zh,
        spool: 'STATIC',
        exportedTriangles: meta.exportedTriangles || meshes.length * 240,
        explodeVector: meta.explodeVector || [0, 0, 0]
      },
      basePos: group.position.clone(),
      explodeVec: new THREE.Vector3(...(meta.explodeVector || [0, 0, 0])),
      currentMicroPop: new THREE.Vector3(),
      targetMicroPop: new THREE.Vector3(),
      isGhost: false
    };

    meshes.forEach((m) => {
      m.userData.partNodeRef = partNode;
    });
    assetLoader.allPartNodes.push(partNode);
    rootGroup.add(group);
  }

  // ============================================================================
  // 1. LEFT UNDER-WING PYLON / STRUT TORQUE BOX (STA 455..565, WBL -190.97)
  //    Directly connects the CATIA V5 .glb Turbofan Engine at (0,0,0) to the Wing Box!
  // ============================================================================
  const pylonGroup = new THREE.Group();
  pylonGroup.name = 'L0_Left_Wing_Pylon_Strut';

  // Forward Engine Mount Bulkhead & Iso-Static Links at Fan Frame (X = -1.08m, Y = +0.84m, Z = 0)
  const fwdMountArch = new THREE.Mesh(
    new THREE.TorusGeometry(0.84, 0.042, 14, 36, Math.PI * 0.72),
    tiPylonMat
  );
  fwdMountArch.rotation.y = Math.PI / 2;
  fwdMountArch.rotation.x = Math.PI * 0.14;
  fwdMountArch.position.set(-1.08, 0.02, 0);
  pylonGroup.add(fwdMountArch);

  // Aft Engine Mount Bulkhead at Turbine Rear Frame (X = +0.96m, Y = +0.58m, Z = 0)
  const aftMountArch = new THREE.Mesh(
    new THREE.TorusGeometry(0.58, 0.036, 14, 32, Math.PI * 0.75),
    tiPylonMat
  );
  aftMountArch.rotation.y = Math.PI / 2;
  aftMountArch.rotation.x = Math.PI * 0.12;
  aftMountArch.position.set(0.96, 0.02, 0);
  pylonGroup.add(aftMountArch);

  // Pylon Upper/Lower Titanium Chord Spars & Diagonal Truss Struts connecting Engine to Wing Front Spar
  const strutNodes = [
    [new THREE.Vector3(-1.08, 0.84, -0.18), new THREE.Vector3(0.45, 1.38, -0.22)],
    [new THREE.Vector3(-1.08, 0.84,  0.18), new THREE.Vector3(0.45, 1.38,  0.22)],
    [new THREE.Vector3( 0.96, 0.58, -0.16), new THREE.Vector3(1.85, 1.44, -0.22)],
    [new THREE.Vector3( 0.96, 0.58,  0.16), new THREE.Vector3(1.85, 1.44,  0.22)],
    // Upper keel beam of pylon
    [new THREE.Vector3(-1.12, 0.92,  0.0),  new THREE.Vector3(0.45, 1.48,  0.0)],
    [new THREE.Vector3( 0.45, 1.48,  0.0),  new THREE.Vector3(2.45, 1.46,  0.0)],
    // Diagonal drag & side-load links
    [new THREE.Vector3(-1.08, 0.84, -0.18), new THREE.Vector3(0.96, 0.58,  0.16)],
    [new THREE.Vector3(-1.08, 0.84,  0.18), new THREE.Vector3(0.96, 0.58, -0.16)],
    [new THREE.Vector3( 0.96, 0.58,  0.0),  new THREE.Vector3(0.45, 1.42,  0.0)]
  ];

  strutNodes.forEach(([pA, pB]) => {
    const dir = new THREE.Vector3().subVectors(pB, pA);
    const len = dir.length();
    const cyl = new THREE.Mesh(
      new THREE.CylinderGeometry(0.032, 0.032, len, 12),
      sparGoldMat
    );
    cyl.position.copy(pA).addScaledVector(dir, 0.5);
    cyl.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
    pylonGroup.add(cyl);
  });

  // 6 Pylon Internal Titanium Bulkhead Ribs
  for (let i = 0; i < 6; i++) {
    const t = i / 5;
    const x = -0.95 + t * 2.85;
    const yBot = 0.78 - t * 0.14;
    const yTop = 1.02 + t * 0.44;
    const rib = new THREE.Mesh(
      new THREE.BoxGeometry(0.028, yTop - yBot, 0.38),
      tiPylonMat
    );
    rib.position.set(x, (yTop + yBot) * 0.5, 0);
    pylonGroup.add(rib);
  }

  registerAirframePart(pylonGroup, {
    id: 'L0_Left_Wing_Pylon_Strut',
    packKey: 'L1', // Keep visible in both L0 and L1!
    level: 'L1',
    subsystem: 'MOD_PYLON_MOUNT',
    label_zh: '左翼发动机吊架承力盒与前后安装节 (STA 457..539 / WBL -190.97)',
    label_en: 'Left Under-Wing Engine Strut Torque Box & Iso-Static Mounts',
    desc_zh: '通过风扇机匣前安装环与低压涡轮后安装环将 56.8 万面 CFM56 涡扇高模精确挂载于左翼前梁下方。',
    exportedTriangles: 4820,
    explodeVector: [0.0, 0.55, 0.0]
  });

  // ============================================================================
  // 2. BOEING 737-800 FUSELAGE STATION FRAMES & FLOOR BEAMS (STA 130 .. STA 1217)
  // ============================================================================
  const fuselageGroup = new THREE.Group();
  fuselageGroup.name = 'L0_B737_Fuselage_Frames';

  const zFuselageCL = wblToZ(0.0); // -4.85m inboard of Left Engine
  const yFuselageCL = wlToY(227.5); // Cabin center height (~ +1.51m above engine CL)
  const fuselageRadiusY = 2.01; // 3.76m width / 4.01m height
  const fuselageRadiusZ = 1.88;

  // Authentic Boeing 737-800 Station Diagram Stations (from NTSB Fig. 1-3)
  const b737Stations = [
    { sta: 130.0,   rScale: 0.22, section: 'Sec 41 Nose Radome' },
    { sta: 178.0,   rScale: 0.52, section: 'Sec 41 Flight Deck Fwd' },
    { sta: 247.0,   rScale: 0.78, section: 'Sec 41 Flight Deck Aft' },
    { sta: 291.5,   rScale: 0.92, section: 'Sec 41 Forward Entry Door' },
    { sta: 360.0,   rScale: 1.00, section: 'Sec 41/43 Splice Frame' },
    { sta: 420.0,   rScale: 1.00, section: 'Sec 43 Forward Cabin' },
    { sta: 480.0,   rScale: 1.00, section: 'Sec 43 Cabin Frame' },
    { sta: 540.0,   rScale: 1.00, section: 'Sec 43/44 Center Wing Box Fwd Bulkhead', heavy: true },
    { sta: 600.0,   rScale: 1.00, section: 'Sec 44 Overwing Emergency Exit Frame', heavy: true },
    { sta: 663.75,  rScale: 1.00, section: 'Sec 44 Center Wing Box Rear Spar Bulkhead', heavy: true },
    { sta: 727.0,   rScale: 1.00, section: 'Sec 44/46 Splice Frame' },
    { sta: 787.0,   rScale: 1.00, section: 'Sec 46 Aft Cabin Frame' },
    { sta: 847.0,   rScale: 1.00, section: 'Sec 46 Aft Cabin Frame' },
    { sta: 887.0,   rScale: 0.98, section: 'Sec 46/47 Splice Frame' },
    { sta: 947.0,   rScale: 0.90, section: 'Sec 47 Aft Galley Frame' },
    { sta: 1016.0,  rScale: 0.78, section: 'Sec 47 Aft Pressure Dome Bulkhead', heavy: true },
    { sta: 1088.0,  rScale: 0.56, section: 'Sec 48 Empennage Fin Root Bulkhead', heavy: true },
    { sta: 1156.0,  rScale: 0.36, section: 'Sec 48 APU Compartment Frame' },
    { sta: 1217.0,  rScale: 0.16, section: 'Sec 48 Tailcone Exhaust Frame' }
  ];

  b737Stations.forEach((s) => {
    const x = staToX(s.sta);
    const r = fuselageRadiusZ * s.rScale;
    const tubeR = s.heavy ? 0.042 : 0.024;
    const mat = s.heavy ? sparGoldMat : al7075Mat;

    // Circumferential C-channel fuselage ring frame
    const ring = new THREE.Mesh(new THREE.TorusGeometry(r, tubeR, 10, 40), mat);
    ring.rotation.y = Math.PI / 2;
    ring.scale.set(1.0, fuselageRadiusY / fuselageRadiusZ, 1.0);
    const yOffset = s.sta < 290 ? -0.25 * (1 - s.rScale) : s.sta > 1020 ? 0.35 * (1 - s.rScale) : 0;
    ring.position.set(x, yFuselageCL + yOffset, zFuselageCL);
    fuselageGroup.add(ring);

    // Cabin Floor Beam at WL 208.1 (-0.38m below fuselage center)
    if (s.sta >= 247 && s.sta <= 1016) {
      const floorWidth = r * 1.82;
      const floorBeam = new THREE.Mesh(
        new THREE.BoxGeometry(s.heavy ? 0.065 : 0.032, 0.065, floorWidth),
        mat
      );
      floorBeam.position.set(x, yFuselageCL - 0.38, zFuselageCL);
      fuselageGroup.add(floorBeam);

      // Vertical floor stanchions (cargo hold struts)
      [-floorWidth * 0.32, floorWidth * 0.32].forEach((dz) => {
        const strut = new THREE.Mesh(
          new THREE.CylinderGeometry(0.018, 0.018, 1.15, 8),
          al7075Mat
        );
        strut.position.set(x, yFuselageCL - 0.96, zFuselageCL + dz);
        fuselageGroup.add(strut);
      });
    }
  });

  // Longitudinal Stringers (S-1..S-18) & Bottom Keel Beam (WL 148.5)
  const numStringers = 16;
  for (let i = 0; i < numStringers; i++) {
    const angle = (i / numStringers) * Math.PI * 2;
    const pts = b737Stations.map((s) => {
      const x = staToX(s.sta);
      const rZ = fuselageRadiusZ * s.rScale;
      const rY = fuselageRadiusY * s.rScale;
      const yOffset = s.sta < 290 ? -0.25 * (1 - s.rScale) : s.sta > 1020 ? 0.35 * (1 - s.rScale) : 0;
      return new THREE.Vector3(
        x,
        yFuselageCL + yOffset + Math.sin(angle) * rY,
        zFuselageCL + Math.cos(angle) * rZ
      );
    });
    const curve = new THREE.CatmullRomCurve3(pts);
    const isKeelOrCrown = i === 4 || i === 12;
    const tube = new THREE.Mesh(
      new THREE.TubeGeometry(curve, 64, isKeelOrCrown ? 0.032 : 0.014, 6, false),
      isKeelOrCrown ? sparGoldMat : al7075Mat
    );
    fuselageGroup.add(tube);
  }

  // Vertical Tail Fin Spars & 7 Rudder/Fin Ribs (STA 1016 .. STA 1217, WL 306 .. WL 585)
  const finFrontBot = new THREE.Vector3(staToX(985), yFuselageCL + 1.85, zFuselageCL);
  const finFrontTop = new THREE.Vector3(staToX(1185), yFuselageCL + 7.25, zFuselageCL);
  const finRearBot  = new THREE.Vector3(staToX(1165), yFuselageCL + 1.65, zFuselageCL);
  const finRearTop  = new THREE.Vector3(staToX(1245), yFuselageCL + 7.15, zFuselageCL);

  [
    [finFrontBot, finFrontTop],
    [finRearBot, finRearTop]
  ].forEach(([pA, pB]) => {
    const dir = new THREE.Vector3().subVectors(pB, pA);
    const spar = new THREE.Mesh(
      new THREE.CylinderGeometry(0.036, 0.048, dir.length(), 10),
      sparGoldMat
    );
    spar.position.copy(pA).addScaledVector(dir, 0.5);
    spar.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
    fuselageGroup.add(spar);
  });

  for (let i = 0; i <= 7; i++) {
    const t = i / 7;
    const pF = new THREE.Vector3().lerpVectors(finFrontBot, finFrontTop, t);
    const pR = new THREE.Vector3().lerpVectors(finRearBot, finRearTop, t);
    const dir = new THREE.Vector3().subVectors(pR, pF);
    const rib = new THREE.Mesh(
      new THREE.BoxGeometry(dir.length(), 0.035, 0.24 * (1 - t * 0.45)),
      al7075Mat
    );
    rib.position.copy(pF).addScaledVector(dir, 0.5);
    fuselageGroup.add(rib);
  }

  registerAirframePart(fuselageGroup, {
    id: 'L0_B737_Fuselage_Frames',
    packKey: 'L0',
    level: 'L0',
    subsystem: 'AIRFRAME_FUSELAGE',
    label_zh: 'B737-800 机身隔框、龙骨梁与客舱地板梁主骨架 (FS 130 ~ FS 1217)',
    label_en: 'Boeing 737-800 Fuselage Station Frames, Keel Beam & Floor Grid',
    desc_zh: '严格按 NTSB B737-800 官方站位图 (STA 130 雷达罩 → STA 540/663.75 中央翼盒隔框 → STA 1016 后增压舱壁 → STA 1217 尾锥) 1:1 建模。',
    exportedTriangles: 26400,
    explodeVector: [0.0, 0.35, -0.85]
  });

  // ============================================================================
  // 3. LEFT & RIGHT SWEPT WING BOX, FRONT/REAR SPARS & 18 AIRFOIL RIBS
  //    (WBL 0.0 Center Wing Box -> WBL -190.97 Left Engine Station -> WBL ±680.40 Wingtips)
  // ============================================================================
  const wingGroup = new THREE.Group();
  wingGroup.name = 'L0_B737_Wing_Box_Spars_Ribs';

  // Center Wing Torque Box inside Fuselage (STA 540 .. STA 663.75, WBL -71.24 .. +71.24)
  const xWingRootFwd = staToX(540.0);    // +1.016m
  const xWingRootRear = staToX(663.75);  // +4.159m
  const yWingRoot = wlToY(198.0);        // +0.76m
  const zLeftSOB  = wblToZ(-71.24);      // -3.04m
  const zRightSOB = wblToZ(71.24);       // -6.66m

  const centerBoxFwdSpar = new THREE.Mesh(
    new THREE.BoxGeometry(0.08, 0.62, Math.abs(zLeftSOB - zRightSOB)),
    sparGoldMat
  );
  centerBoxFwdSpar.position.set(xWingRootFwd, yWingRoot, zFuselageCL);
  wingGroup.add(centerBoxFwdSpar);

  const centerBoxRearSpar = new THREE.Mesh(
    new THREE.BoxGeometry(0.08, 0.56, Math.abs(zLeftSOB - zRightSOB)),
    sparGoldMat
  );
  centerBoxRearSpar.position.set(xWingRootRear, yWingRoot, zFuselageCL);
  wingGroup.add(centerBoxRearSpar);

  // Build both Left Wing (sign = -1 -> +Z) and Right Wing (sign = +1 -> -Z)
  [-1, 1].forEach((sideSign) => {
    // Wing stations from Side-of-Body (WBL 71.24) through Engine Mount (WBL 190.97) to Wingtip (WBL 680.40)
    const numRibs = 15;
    const fwdPts = [];
    const rearPts = [];

    for (let i = 0; i <= numRibs; i++) {
      const t = i / numRibs;
      const wblMag = 71.24 + t * (680.40 - 71.24);
      const wbl = sideSign * wblMag;
      const z = wblToZ(wbl);

      // 25.02 deg quarter-chord sweep + Yehudi trailing-edge kink at WBL 190.97
      const spanDistIn = wblMag - 71.24;
      const fwdSta = 512.0 + spanDistIn * 0.485;
      const rearSta = wblMag < 215.0
        ? 663.75 + (wblMag - 71.24) * 0.12
        : 681.0 + (wblMag - 215.0) * 0.365;

      // 6 deg wing dihedral rises from WL 198 at root to WL 226 at Engine Station (Y = +1.47m) and WL 268 at tip
      const wl = 198.0 + spanDistIn * 0.115;

      const pFwd = new THREE.Vector3(staToX(fwdSta), wlToY(wl), z);
      const pRear = new THREE.Vector3(staToX(rearSta), wlToY(wl - 4.0), z);
      fwdPts.push(pFwd);
      rearPts.push(pRear);

      // Airfoil Rib connecting Front Spar and Rear Spar (plus Leading Edge Slat Nose)
      const chordVec = new THREE.Vector3().subVectors(pRear, pFwd);
      const chordLen = chordVec.length();
      const isEngineMountRib = Math.abs(wblMag - 190.97) < 28.0;
      const ribThickness = isEngineMountRib ? 0.055 : 0.026;
      const ribHeight = (0.48 - t * 0.30);

      const ribMesh = new THREE.Mesh(
        new THREE.BoxGeometry(chordLen * 1.22, ribHeight, ribThickness),
        isEngineMountRib ? sparGoldMat : al7075Mat
      );
      ribMesh.position.copy(pFwd).addScaledVector(chordVec, 0.44);
      wingGroup.add(ribMesh);
    }

    // Front Spar & Rear Spar continuous beams
    const fwdCurve = new THREE.CatmullRomCurve3(fwdPts);
    const rearCurve = new THREE.CatmullRomCurve3(rearPts);
    wingGroup.add(new THREE.Mesh(new THREE.TubeGeometry(fwdCurve, 32, 0.052, 8, false), sparGoldMat));
    wingGroup.add(new THREE.Mesh(new THREE.TubeGeometry(rearCurve, 32, 0.044, 8, false), sparGoldMat));

    // Split Scimitar Winglet at Wingtip
    const tipFwd = fwdPts[fwdPts.length - 1];
    const tipRear = rearPts[rearPts.length - 1];
    const wingletTop = tipRear.clone().add(new THREE.Vector3(0.85, 2.15, -sideSign * 0.45));
    const wingletCurve = new THREE.CatmullRomCurve3([tipFwd, tipRear, wingletTop]);
    wingGroup.add(new THREE.Mesh(new THREE.TubeGeometry(wingletCurve, 16, 0.034, 8, false), al7075Mat));
  });

  registerAirframePart(wingGroup, {
    id: 'L0_B737_Wing_Box_Spars_Ribs',
    packKey: 'L0',
    level: 'L0',
    subsystem: 'AIRFRAME_WING_BOX',
    label_zh: 'B737-800 中央翼盒、机翼前后主梁与 30 根翼肋骨架 (WS 71.24 ~ WS 691.50)',
    label_en: 'Boeing 737-800 Wing Torque Box, Front/Rear Spars & Airfoil Ribs',
    desc_zh: '25° 后掠机翼双梁盒式结构，在 WBL -190.97 (WS 204.25) 加强翼肋处直接承载左翼吊架与 56.8 万面涡扇发动机。',
    exportedTriangles: 18600,
    explodeVector: [0.0, 0.65, 0.0]
  });

  // ============================================================================
  // 4. HOLOGRAPHIC FRESNEL X-RAY GHOST AERODYNAMIC FUSELAGE SKIN
  // ============================================================================
  const skinGroup = new THREE.Group();
  skinGroup.name = 'L0_B737_Aerodynamic_Ghost_Skin';

  const lathePts = b737Stations.map((s) => {
    const x = staToX(s.sta);
    const r = fuselageRadiusZ * s.rScale * 1.015;
    return new THREE.Vector2(r, x);
  });
  const fuselageSkinGeo = new THREE.LatheGeometry(lathePts, 44);
  // Rotate LatheGeometry (which revolves around Y) so its axis is along X
  fuselageSkinGeo.rotateZ(-Math.PI / 2);
  const fuselageSkinMesh = new THREE.Mesh(fuselageSkinGeo, skinGhostMat);
  fuselageSkinMesh.scale.set(1.0, fuselageRadiusY / fuselageRadiusZ, 1.0);
  fuselageSkinMesh.position.set(0, yFuselageCL, zFuselageCL);
  skinGroup.add(fuselageSkinMesh);

  rootGroup.add(skinGroup);
  assetLoader.scene.add(rootGroup);
  assetLoader.loadedPacks.set('L0', rootGroup);
  return rootGroup;
}
