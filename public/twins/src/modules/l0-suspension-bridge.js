/**
 * Second Root Twin System: Suspension Bridge L0 -> L1 -> L2 Hierarchy
 * Modeled from Wai-Fah Chen & Lian Duan — "Bridge Engineering Handbook, Chapter 18: Suspension Bridges"
 *
 * Spatial Datum Coordinate System:
 *   - Chainage Station: K0+165 (West Anchorage) -> K0+500 (West Pylon) -> K1+000 (Midspan) -> K1+500 (East Pylon) -> K1+835 (East Anchorage)
 *   - Elevation (EL): EL +0.0m (Mean Sea Level), EL +65.0m (Deck Navigation Clearance), EL +195.0m (Tower Top Saddle)
 *   - Transverse Offset (CL): CL ±16.5m (Main Cable Planes / 33.0m Orthotropic Steel Box Girder Width)
 */

import * as THREE from 'three';
import { bridgeDatumToWorld } from '../schema/datum-types.js';
import { BRIDGE_CH18_DATUM } from '../data/b737-cfm56-datum.js';

export function buildSuspensionBridgeTwin(materials, subLevel = 0) {
  const root = new THREE.Group();
  root.name = `BRIDGE_CH18_L${subLevel}`;
  const explodableParts = [];
  const interactiveTargets = [];
  const portMarkers = [];

  if (subLevel === 0) {
    // ============================================================================
    // L0: Full Suspension Bridge Span (Portal Pylons, Parabolic Main Cables, Hangers, Box Girder Deck & Gravity Anchorages)
    // ============================================================================
    const pylonGroup = new THREE.Group();
    [500.0, 1500.0].forEach((chainage, idx) => {
      const towerUnit = new THREE.Group();
      [-16.5, 16.5].forEach((clOff) => {
        const basePos = bridgeDatumToWorld(chainage, 0.0, clOff);
        const topPos = bridgeDatumToWorld(chainage, 195.0, clOff);
        const h = topPos.y - basePos.y;
        const leg = new THREE.Mesh(
          new THREE.BoxGeometry(0.18, h, 0.16),
          materials.titaniumGold
        );
        leg.position.set(basePos.x, basePos.y + h * 0.5, basePos.z);
        towerUnit.add(leg);
      });

      // 3 Portal Cross-Strut Beams at EL +58m, EL +125m, EL +188m
      [58.0, 125.0, 188.0].forEach((el) => {
        const beamPos = bridgeDatumToWorld(chainage, el, 0);
        const spanZ = Math.abs(bridgeDatumToWorld(chainage, el, 16.5).z) * 2;
        const crossStrut = new THREE.Mesh(
          new THREE.BoxGeometry(0.14, 0.11, spanZ),
          materials.structuralFrame
        );
        crossStrut.position.set(beamPos.x, beamPos.y, 0);
        towerUnit.add(crossStrut);
      });

      // Caisson Pile Cap Foundation at EL +0.0m
      const caissonPos = bridgeDatumToWorld(chainage, -6.0, 0);
      const caisson = new THREE.Mesh(
        new THREE.BoxGeometry(0.55, 0.18, 0.95),
        materials.structuralFrame
      );
      caisson.position.set(caissonPos.x, caissonPos.y, 0);
      towerUnit.add(caisson);
      pylonGroup.add(towerUnit);
    });

    pylonGroup.userData = {
      partId: 'BRG-L0-PYLONS',
      title: '双门式钢筋混凝土主索塔与群桩沉井基础 (Portal Pylon Towers @ K0+500 & K1+500)',
      datum: 'K0+500 & K1+500 | EL -15.0m → EL +195.0m | CL ±16.5m',
      material: 'C60 High-Performance Concrete Tower Legs + Prestressed Portal Cross-Beams',
      description: '依据《Bridge Engineering Handbook》第 18 章门式桥塔规范建模：设上、中、下三道横梁抵抗横桥向风载，塔顶 EL +195.0m 承载主索鞍。',
      basePos: new THREE.Vector3(0, 0, 0),
      explodeVec: new THREE.Vector3(0, 0.25, 0)
    };
    explodableParts.push(pylonGroup);
    interactiveTargets.push(pylonGroup);
    root.add(pylonGroup);

    // 2. Parabolic PPWS Main Cables (f/L = 1:9.52) & Vertical Suspender Hangers
    const cableSystemGroup = new THREE.Group();
    [-16.5, 16.5].forEach((clOff) => {
      const cablePts = [];
      for (let ch = 165; ch <= 1835; ch += 25) {
        let el = 65.0;
        if (ch < 500) {
          const t = (ch - 165) / (500 - 165);
          el = 28.0 + (195.0 - 28.0) * t - 18.0 * t * (1 - t);
        } else if (ch <= 1500) {
          // Exact Catenary/Parabola y = 4*f*(x/L)^2 with sag f = 105m (EL +195m at towers -> EL +90m at midspan K1+000)
          const u = (ch - 1000) / 500; // -1 .. +1
          el = 90.0 + 105.0 * (u * u);
        } else {
          const t = (1835 - ch) / (1835 - 1500);
          el = 28.0 + (195.0 - 28.0) * t - 18.0 * t * (1 - t);
        }
        const wp = bridgeDatumToWorld(ch, el, clOff);
        cablePts.push(new THREE.Vector3(wp.x, wp.y, wp.z));

        // Vertical Suspender Hanger every 50m along Main & Side Spans
        if (ch >= 220 && ch <= 1780 && Math.abs(ch - 500) > 20 && Math.abs(ch - 1500) > 20 && ch % 50 === 0) {
          const deckWp = bridgeDatumToWorld(ch, 65.0, clOff);
          const hangerGeo = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(wp.x, wp.y, wp.z),
            new THREE.Vector3(deckWp.x, deckWp.y, deckWp.z)
          ]);
          cableSystemGroup.add(new THREE.Line(hangerGeo, materials.datumLineCyan));
        }
      }
      const mainCableCurve = new THREE.CatmullRomCurve3(cablePts);
      const cableMesh = new THREE.Mesh(
        new THREE.TubeGeometry(mainCableCurve, 96, 0.032, 10, false),
        materials.n2ShaftGold
      );
      cableSystemGroup.add(cableMesh);
    });

    cableSystemGroup.userData = {
      partId: 'BRG-L0-MAIN-CABLES',
      title: '1860MPa 预制平行钢丝主缆（PPWS）与销接吊索体系 (Main Cables f/L=1:9.52 & Hangers)',
      datum: 'K0+165 → K1+835 | Tower Saddle EL +195.0m → Midspan EL +90.0m | CL ±16.5m',
      material: 'Ø5.2mm Galvanized 1860 MPa Parallel Wire Strands (127 Strands × 127 Wires)',
      description: '主跨垂跨比 f/L = 105m / 1000m = 1:9.52，严格遵循陈惠发《桥梁工程手册》第 18.3 节悬链线/抛物线矢高方程计算每个吊点高程。',
      basePos: new THREE.Vector3(0, 0, 0),
      explodeVec: new THREE.Vector3(0, 0.95, 0)
    };
    explodableParts.push(cableSystemGroup);
    interactiveTargets.push(cableSystemGroup);
    root.add(cableSystemGroup);

    // 3. Streamlined Orthotropic Steel Box Girder Deck (K0+200 to K1+800 @ EL +65.0m)
    const deckGroup = new THREE.Group();
    const pWest = bridgeDatumToWorld(200, 65.0, 0);
    const pEast = bridgeDatumToWorld(1800, 65.0, 0);
    const deckLen = pEast.x - pWest.x;
    const deckWidth = Math.abs(bridgeDatumToWorld(1000, 65.0, 16.5).z) * 2.15;

    const deckMesh = new THREE.Mesh(
      new THREE.BoxGeometry(deckLen, 0.075, deckWidth),
      materials.stringerCyan
    );
    deckMesh.position.set(0, pWest.y, 0);
    deckGroup.add(deckMesh);

    deckGroup.userData = {
      partId: 'BRG-L0-BOX-DECK',
      title: '流线型扁平闭口正交异性钢箱梁加劲桥面 (Aerodynamic Orthotropic Steel Box Girder)',
      datum: 'K0+200 → K1+800 | EL +65.0m | Width 33.0m × Depth 3.5m',
      material: 'Q345qD Structural Bridge Steel with U-Trough Longitudinal Ribs',
      description: '采用扁平流线型带风嘴闭口钢箱梁抵抗颤振（Flutter），点击跨中接口可下钻查看内部 U 形加劲肋与横隔板构造。',
      drillDownLevel: 2,
      basePos: new THREE.Vector3(0, 0, 0),
      explodeVec: new THREE.Vector3(0, -0.55, 0)
    };
    explodableParts.push(deckGroup);
    interactiveTargets.push(deckGroup);
    root.add(deckGroup);

    // 4. West & East Gravity Anchorages (K0+165 & K1+835)
    const anchorGroup = new THREE.Group();
    [165.0, 1835.0].forEach((ch, idx) => {
      const ap = bridgeDatumToWorld(ch, 16.0, 0);
      const block = new THREE.Mesh(
        new THREE.BoxGeometry(0.95, 0.52, 0.88),
        materials.combustorAmber
      );
      block.position.set(ap.x, ap.y, 0);
      anchorGroup.add(block);
    });
    anchorGroup.userData = {
      partId: 'BRG-L0-ANCHORAGES',
      title: '东西两岸重力式混凝土锚碇与散索鞍室 (West & East Gravity Anchorages @ K0+165 / K1+835)',
      datum: 'K0+165 & K1+835 | EL -12.0m → EL +28.0m | Deadweight Friction Anchor',
      material: 'Mass Concrete Gravity Block + Cast-Steel Splay Saddle + Prestressed Strand Shoes',
      description: '通过巨型重力式混凝土锚块自重与基底摩阻力平衡主缆 260 MN 水平拉力。',
      drillDownLevel: 1,
      basePos: new THREE.Vector3(0, 0, 0),
      explodeVec: new THREE.Vector3(0, -0.35, 0)
    };
    explodableParts.push(anchorGroup);
    interactiveTargets.push(anchorGroup);
    root.add(anchorGroup);

    // 5. Standard Bridge MountingPorts
    BRIDGE_CH18_DATUM.mountingPorts.forEach((port) => {
      const marker = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.14, 1),
        materials.portActiveGlow
      );
      marker.position.set(port.worldPos.x, port.worldPos.y, port.worldPos.z);
      marker.userData = {
        isMountingPort: true,
        portData: port,
        partId: port.id,
        title: `【桥梁传力节点端口】${port.name}`,
        datum: port.datumCoord,
        material: port.interfaceStandard,
        description: port.description,
        drillDownLevel: port.childLevel === 'L2' ? 2 : 1,
        basePos: marker.position.clone(),
        explodeVec: new THREE.Vector3(0, 0.35, 0)
      };
      explodableParts.push(marker);
      interactiveTargets.push(marker);
      portMarkers.push(marker);
      root.add(marker);
    });
  } else {
    // ============================================================================
    // L1 / L2 Detailed Bridge Subsystem Drill-Down:
    // Orthotropic Steel Box Girder Segment (U-Ribs, Diaphragms, Wind Fairings, Cable Clamp & Tower Saddle)
    // ============================================================================
    const topPlate = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.05, 2.8), materials.aeroSkin);
    topPlate.position.y = 0.45;
    // 8 Trapezoidal U-Ribs welded under orthotropic deck plate
    for (let u = -3.5; u <= 3.5; u += 1.0) {
      const uRib = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.09, 0.14), materials.stringerCyan);
      uRib.position.set(0, -0.06, u * 0.34);
      topPlate.add(uRib);
    }
    topPlate.userData = {
      partId: 'BRG-SUB-ORTHOTROPIC-DECK',
      title: '正交异性钢桥面板与闭口 U 形纵向加劲肋 (Orthotropic Deck Plate + U-Trough Stiffeners)',
      datum: 'K1+000 ±12.0m | EL +66.75m | 16mm Deck Plate + 8mm U-Ribs @ 600mm Pitch',
      material: 'Q345qD Steel Plate with Automated80% Penetration Fillet Welds',
      description: '正交异性桥面板直接承受车轮局部荷载并作为主梁上翼缘参与全桥纵向抗弯。',
      basePos: topPlate.position.clone(),
      explodeVec: new THREE.Vector3(0, 1.15, 0)
    };
    explodableParts.push(topPlate);
    interactiveTargets.push(topPlate);
    root.add(topPlate);

    // Internal Transverse Diaphragm Bulkheads (横隔板)
    const diaphGroup = new THREE.Group();
    [-1.1, 0, 1.1].forEach((xOff) => {
      const diaph = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.82, 2.75), materials.titaniumGold);
      diaph.position.set(xOff, 0, 0);
      diaphGroup.add(diaph);
    });
    diaphGroup.userData = {
      partId: 'BRG-SUB-DIAPHRAGMS',
      title: '钢箱梁实腹式横隔板与过人孔隔仓 (Transverse Bulkhead Diaphragms @ 3.2m Spacing)',
      datum: 'K0+996.8 / K1+000.0 / K1+003.2 | Depth 3.5m',
      material: 'Q345qD 12mm Diaphragm Web with Cutout Stiffener Rings',
      description: '维持扁平钢箱梁截面抗扭刚度并将桥面荷载横向传递至两侧吊索耳板。',
      basePos: new THREE.Vector3(0, 0, 0),
      explodeVec: new THREE.Vector3(0, 0, 0)
    };
    interactiveTargets.push(diaphGroup);
    root.add(diaphGroup);

    // Bottom Flange & Aerodynamic Wind Nose Fairings (抗风嘴与底板)
    const botPlate = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.05, 2.2), materials.structuralFrame);
    botPlate.position.y = -0.45;
    [-1, 1].forEach((side) => {
      const windNose = new THREE.Mesh(new THREE.ConeGeometry(0.45, 3.2, 3), materials.combustorAmber);
      windNose.rotation.z = Math.PI / 2;
      windNose.rotation.x = side > 0 ? 0 : Math.PI;
      windNose.position.set(0, 0.45, side * 1.45);
      botPlate.add(windNose);
    });
    botPlate.userData = {
      partId: 'BRG-SUB-WIND-FAIRING',
      title: '钢箱梁下翼缘底板与流线型三角形抗风嘴 (Bottom Flange & Triangular Wind Fairings)',
      datum: 'K1+000 | EL +63.25m | CL ±16.5m Cantilever Tip',
      material: 'Q345qD Steel Plate + Internal Corrosion Dehumidification Ducts',
      description: '55° 尖角风嘴显著降低横风漩涡脱落激励，将颤振临界风速提升至 75 m/s 以上。',
      basePos: botPlate.position.clone(),
      explodeVec: new THREE.Vector3(0, -1.05, 0)
    };
    explodableParts.push(botPlate);
    interactiveTargets.push(botPlate);
    root.add(botPlate);

    // Cast-Steel Main Cable Clamp & Pin-Ended Hanger Socket (主缆索夹与吊索耳板锚头)
    const saddleClampGroup = new THREE.Group();
    [-1.42, 1.42].forEach((zOff) => {
      const mainCableSeg = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 3.4, 24), materials.n2ShaftGold);
      mainCableSeg.rotation.z = Math.PI / 2;
      mainCableSeg.position.set(0, 1.45, zOff);
      saddleClampGroup.add(mainCableSeg);

      const cableBand = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.19, 0.42, 24), materials.portActiveGlow);
      cableBand.rotation.z = Math.PI / 2;
      cableBand.position.set(0, 1.45, zOff);
      saddleClampGroup.add(cableBand);

      const pinLug = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.32, 0.08), materials.portHighlight);
      pinLug.position.set(0, 0.58, zOff);
      saddleClampGroup.add(pinLug);
    });
    saddleClampGroup.userData = {
      partId: 'BRG-SUB-CABLE-CLAMP',
      title: '铸钢对开式主缆索夹、高强螺杆与吊索销接耳板 (Cast-Steel Cable Band & Pin-Ended Hanger Lug)',
      datum: 'K1+000 | CL ±16.5m | High-Strength Bolt Preload 650 kN',
      material: 'ZG270-500 Cast Steel Split Band + 40CrNiMoA Tension Bolts',
      description: '通过高强螺杆环向夹紧主缆产生抗滑摩擦力，经销轴连接竖向吊索与钢箱梁吊点耳板。',
      basePos: new THREE.Vector3(0, 0, 0),
      explodeVec: new THREE.Vector3(0, 0.65, 0)
    };
    explodableParts.push(saddleClampGroup);
    interactiveTargets.push(saddleClampGroup);
    root.add(saddleClampGroup);
  }

  return {
    root,
    explodableParts,
    interactiveTargets,
    portMarkers
  };
}
