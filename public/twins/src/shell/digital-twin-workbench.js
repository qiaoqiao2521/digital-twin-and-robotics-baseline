/**
 * Unified Industrial Digital Twin 3D Workbench Shell (L0 -> L1 -> L2 -> L3 Drill-Down Engine)
 */

import * as THREE from 'three';
import {
  B737_800_DATUM,
  L1_PYLON_NACELLE_DATUM,
  L2_CFM56_DATUM,
  L3_HPT_MICRO_DATUM,
  BRIDGE_CH18_DATUM
} from '../data/b737-cfm56-datum.js';
import { buildL0AircraftAirframe } from '../modules/l0-aircraft-airframe.js';
import { buildL1PylonNacelle } from '../modules/l1-pylon-nacelle.js';
import { buildL2Cfm56Turbofan } from '../modules/l2-cfm56-turbofan.js';
import { buildL3HptCombustorCore } from '../modules/l3-hpt-combustor-core.js';
import { buildSuspensionBridgeTwin } from '../modules/l0-suspension-bridge.js';
import { buildCadDatumRuler } from '../modules/cad-datum-overlay.js';

/**
 * Self-contained CAD Orbit / Pan / Dolly Controller (Zero external addon dependency)
 */
export class CadOrbitControls {
  constructor(camera, domElement) {
    this.camera = camera;
    this.domElement = domElement;
    this.target = new THREE.Vector3(0, 0, 0);
    this.spherical = new THREE.Spherical(6.0, Math.PI * 0.36, 0.55);
    this.sphericalDelta = new THREE.Spherical(0, 0, 0);
    this.panOffset = new THREE.Vector3();
    this.dampingFactor = 0.12;
    this.minDistance = 0.45;
    this.maxDistance = 42.0;

    let mode = null; // 'rotate' | 'pan'
    let prev = { x: 0, y: 0 };

    domElement.addEventListener('contextmenu', (e) => e.preventDefault());
    domElement.addEventListener('pointerdown', (e) => {
      mode = e.button === 0 && !e.shiftKey ? 'rotate' : 'pan';
      prev = { x: e.clientX, y: e.clientY };
    });

    window.addEventListener('pointermove', (e) => {
      if (!mode) return;
      const dx = e.clientX - prev.x;
      const dy = e.clientY - prev.y;
      prev = { x: e.clientX, y: e.clientY };

      if (mode === 'rotate') {
        this.sphericalDelta.theta -= dx * 0.0065;
        this.sphericalDelta.phi -= dy * 0.0065;
      } else if (mode === 'pan') {
        const dist = this.camera.position.distanceTo(this.target);
        const factor = dist * 0.0014;
        const right = new THREE.Vector3().setFromMatrixColumn(this.camera.matrix, 0).multiplyScalar(-dx * factor);
        const up = new THREE.Vector3().setFromMatrixColumn(this.camera.matrix, 1).multiplyScalar(dy * factor);
        this.panOffset.add(right).add(up);
      }
    });

    window.addEventListener('pointerup', () => {
      mode = null;
    });

    domElement.addEventListener(
      'wheel',
      (e) => {
        e.preventDefault();
        const zoomScale = e.deltaY > 0 ? 1.09 : 0.91;
        this.spherical.radius = Math.max(this.minDistance, Math.min(this.maxDistance, this.spherical.radius * zoomScale));
      },
      { passive: false }
    );
  }

  syncFromCamera() {
    const offset = this.camera.position.clone().sub(this.target);
    this.spherical.setFromVector3(offset);
  }

  update() {
    this.spherical.theta += this.sphericalDelta.theta * this.dampingFactor;
    this.spherical.phi += this.sphericalDelta.phi * this.dampingFactor;
    this.spherical.phi = Math.max(0.08, Math.min(Math.PI - 0.08, this.spherical.phi));

    this.sphericalDelta.theta *= 1 - this.dampingFactor;
    this.sphericalDelta.phi *= 1 - this.dampingFactor;

    this.target.addScaledVector(this.panOffset, this.dampingFactor);
    this.panOffset.multiplyScalar(1 - this.dampingFactor);

    const offset = new THREE.Vector3().setFromSpherical(this.spherical);
    this.camera.position.copy(this.target).add(offset);
    this.camera.lookAt(this.target);
  }
}

export function createEngineeringMaterials() {
  return {
    aeroSkin: new THREE.MeshPhysicalMaterial({
      color: 0xdbeafe,
      metalness: 0.45,
      roughness: 0.25,
      transparent: true,
      opacity: 0.52,
      side: THREE.DoubleSide
    }),
    structuralFrame: new THREE.MeshStandardMaterial({
      color: 0x64748b,
      metalness: 0.82,
      roughness: 0.28,
      side: THREE.DoubleSide
    }),
    titaniumGold: new THREE.MeshStandardMaterial({
      color: 0xd97706,
      metalness: 0.88,
      roughness: 0.22,
      side: THREE.DoubleSide
    }),
    chromeAlloy: new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      metalness: 0.92,
      roughness: 0.16,
      side: THREE.DoubleSide
    }),
    highTempAlloy: new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      metalness: 0.85,
      roughness: 0.3,
      side: THREE.DoubleSide
    }),
    stringerCyan: new THREE.MeshStandardMaterial({
      color: 0x0ea5e9,
      metalness: 0.75,
      roughness: 0.25,
      side: THREE.DoubleSide
    }),
    n1ShaftCyan: new THREE.MeshStandardMaterial({
      color: 0x06b6d4,
      emissive: 0x083344,
      emissiveIntensity: 0.6,
      metalness: 0.85,
      roughness: 0.2
    }),
    n2ShaftGold: new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      emissive: 0x451a03,
      emissiveIntensity: 0.55,
      metalness: 0.85,
      roughness: 0.22
    }),
    combustorAmber: new THREE.MeshStandardMaterial({
      color: 0xea580c,
      emissive: 0x7c2d12,
      emissiveIntensity: 0.65,
      metalness: 0.72,
      roughness: 0.32,
      side: THREE.DoubleSide
    }),
    turbineCrimson: new THREE.MeshStandardMaterial({
      color: 0xef4444,
      emissive: 0x7f1d1d,
      emissiveIntensity: 0.5,
      metalness: 0.82,
      roughness: 0.24,
      side: THREE.DoubleSide
    }),
    agbEmerald: new THREE.MeshStandardMaterial({
      color: 0x10b981,
      emissive: 0x064e3b,
      emissiveIntensity: 0.45,
      metalness: 0.78,
      roughness: 0.28
    }),
    cutawayCaseBlue: new THREE.MeshPhysicalMaterial({
      color: 0x1e40af,
      metalness: 0.65,
      roughness: 0.28,
      transparent: true,
      opacity: 0.62,
      side: THREE.DoubleSide
    }),
    nacellePreview: new THREE.MeshPhysicalMaterial({
      color: 0x38bdf8,
      metalness: 0.5,
      roughness: 0.25,
      transparent: true,
      opacity: 0.46,
      side: THREE.DoubleSide
    }),
    portHighlight: new THREE.MeshStandardMaterial({
      color: 0xfbbf24,
      emissive: 0xb45309,
      emissiveIntensity: 0.75,
      metalness: 0.8,
      roughness: 0.2
    }),
    portActiveGlow: new THREE.MeshStandardMaterial({
      color: 0x34d399,
      emissive: 0x059669,
      emissiveIntensity: 1.1,
      metalness: 0.6,
      roughness: 0.15
    }),
    ghostWireframe: new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      wireframe: true,
      transparent: true,
      opacity: 0.18
    }),
    datumLineCyan: new THREE.LineBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.78
    }),
    datumLineDim: new THREE.LineBasicMaterial({
      color: 0x475569,
      transparent: true,
      opacity: 0.52
    })
  };
}

export const LEVEL_METADATA = {
  aircraft: [
    {
      level: 0,
      code: 'L0',
      shortTitle: 'L0 整机气动与 FS/BL/WL 主结构',
      fullTitle: 'L0 波音 737-800 整机气动分割、FS/BL/WL 隔框翼梁与五大标准挂载端口舱',
      datumSystem: 'Fuselage Station (STA 130–1217 in) | Buttock Line (BL ±680.4 in) | Water Line (WL 148.5–642.0 in) | Wing Station (WS 156.25–691.50)',
      cameraPos: [3.2, 2.2, 5.4],
      cameraTarget: [0, 0.1, 0],
      summary: '基于 NTSB / Boeing 737-800 官方站位图（Figure 1–3）构建。拖动【正交拆解滑块】可剥离左右 Alclad 2024 气动蒙皮，显露内部 Section 41/43/44/46/47/48 纵向站位环框、WL 208.1 客舱地板梁、STA 540–663.75 中央翼盒及 WS 156.25–691.50 机翼前后梁与 22 道翼肋。点击左翼【PORT-PYLON-LH (WBL -190.97 / WS 204.25)】立即下钻进入 L1 吊架与短舱总成！'
    },
    {
      level: 1,
      code: 'L1',
      shortTitle: 'L1 左翼吊架与动力短舱总成',
      fullTitle: 'L1 左翼钛合金吊架扭矩盒、双推力拉杆、消音进气道、CFRP 风扇包皮与 C 型反推总成',
      datumSystem: 'Parent Port: PORT-PYLON-LH (WBL -190.97 / WS 204.25 / STA 518.0) → Child Ports: PORT-ENG-FWD-STA12 & PORT-ENG-AFT-STA5',
      cameraPos: [1.8, 1.4, 3.8],
      cameraTarget: [0, 0.2, 0],
      summary: '父级机翼前梁与 WS 204.25 主翼肋自动转化为半透明幽灵工程线框（Ghost Datum Context）。展示 ATA 54 钛合金吊架扭矩盒通过四组保险销连接机翼前梁，以及下方 ATA 71/78 进气唇口、左右铰接风扇包皮与 C 型叶栅反推力装置。点击【PORT-ENG-FWD-STA12】或【PORT-ENG-AFT-STA5】立即下钻进入 L2 CFM56 涡扇发动机核心拆解！'
    },
    {
      level: 2,
      code: 'L2',
      shortTitle: 'L2 CFM56 涡扇六大核心模块',
      fullTitle: 'L2 CFM56-7B27 涡扇发动机六大核心段、五主轴承滑油腔与 N1/N2 同心双转子轴系',
      datumSystem: 'Engine Axial Stations: Sta. 0 (0mm) → Sta. 12 (+740mm) → Sta. 25 (+860mm) → Sta. 3 (+1460mm) → Sta. 4 (+1820mm) → Sta. 5 (+2290mm)',
      cameraPos: [0.4, 1.35, 3.9],
      cameraTarget: [0, 0, 0],
      summary: '严格依据 CFMI 官方培训手册《CTC-044 Basic Engine》第 24、30、32、34 页构建：完整呈现 M1（24片宽弦钛风扇+3级增压级+风扇框架+1#/2#轴承）、M2（9级高压压气机+VSV+3#轴承）、M3（短环形燃烧室+20支燃油喷嘴）、M4（单级高压涡轮+ACC主动间隙控制）、M5（4级低压涡轮+涡轮后框架TRF+4#/5#轴承）及 M6（6点钟径向传动轴+AGB附件齿轮箱）。点击【M4 高压涡轮】或【PORT-HPT-ROTOR-SPLINE】下钻进入 L3！'
    },
    {
      level: 3,
      code: 'L3',
      shortTitle: 'L3 高压涡轮枞树榫叶片与燃烧室',
      fullTitle: 'L3 高压涡轮粉末冶金盘、72片单晶气冷枞树形榫头叶片、1级导向器与环形燃烧室旋流器',
      datumSystem: 'Parent Port: PORT-HPT-ROTOR-SPLINE (Ax.Sta +1820mm / Curvic Ø410mm) | Blade Pitch Circle R=415mm | 20 Swirlers @ R=355mm',
      cameraPos: [0.6, 1.25, 3.3],
      cameraTarget: [-0.35, 0.1, 0],
      summary: '依据 Rolls-Royce《The Jet Engine》涡轮与燃烧室章节精密切割：展示 Rene 88DT 涡轮盘外缘拉削的三齿枞树形榫槽（3-Tang Fir-Tree Slots）、Rene N5 单晶叶片内部蛇形冷却通道与前缘气膜孔（拖动拆解滑块可将顶部扇区 12 片单晶叶片从榫槽中径向抽出！）、Stage-1 冲击冷却静叶环（NGV）以及 20 支双锥燃油旋流喷嘴。'
    }
  ],
  bridge: [
    {
      level: 0,
      code: 'L0',
      shortTitle: 'L0 悬索大桥全桥索塔-主缆-锚碇体系',
      fullTitle: 'L0 现代大跨径钢箱梁悬索大桥：双门式主塔、PPWS 平行钢丝主缆、重力式锚碇与加劲钢箱梁',
      datumSystem: 'Chainage (K0+165 → K1+835) | Elevation (EL -15.0m → EL +195.0m) | Transverse Offset (CL ±16.5m) | Sag Ratio f/L = 1:9.52',
      cameraPos: [0, 3.2, 13.5],
      cameraTarget: [0, 0.4, 0],
      summary: '依据陈惠发（Wai-Fah Chen）《Bridge Engineering Handbook》第 18 章悬索桥规范构建，验证本数字孪生底座与 MountingPort 标准接口的跨行业通用性。支持点击塔顶主索鞍端口【PORT-BRG-SADDLE-NW】或跨中正交异性钢箱梁端口【PORT-BRG-DECK-MID】下钻查看内部构造！'
    },
    {
      level: 1,
      code: 'L1',
      shortTitle: 'L1/L2 正交异性钢箱梁与主缆索夹拆解',
      fullTitle: 'L1/L2 流线型正交异性扁平闭口钢箱梁（U形加劲肋+横隔板+抗风嘴）与铸钢主缆索夹销接节点',
      datumSystem: 'K1+000 Midspan Segment | EL +63.25m → EL +66.75m | CL ±16.5m | 16mm Orthotropic Deck + 8mm U-Ribs @ 600mm Pitch',
      cameraPos: [2.6, 1.8, 3.6],
      cameraTarget: [0, 0.2, 0],
      summary: '展示悬索桥跨中标准梁段的正交拆解：上方铸钢对开式主缆索夹与高强螺杆、中层 16mm 正交异性桥面板及底面焊接的梯形闭口 U 肋、内部 3.2m 间距实腹式横隔板、以及两侧 55° 流线型三角形抗风嘴。'
    }
  ]
};

export function initDigitalTwinWorkbench() {
  const canvasContainer = document.getElementById('viewport-canvas-wrap');
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x060b14);
  scene.fog = new THREE.FogExp2(0x060b14, 0.028);

  const camera = new THREE.PerspectiveCamera(42, canvasContainer.clientWidth / canvasContainer.clientHeight, 0.05, 200);
  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  renderer.setSize(canvasContainer.clientWidth, canvasContainer.clientHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.18;
  canvasContainer.appendChild(renderer.domElement);

  const controls = new CadOrbitControls(camera, renderer.domElement);

  // Studio CAD Lighting Rig
  scene.add(new THREE.AmbientLight(0xdbeafe, 0.78));
  const keyLight = new THREE.DirectionalLight(0xffffff, 2.2);
  keyLight.position.set(8, 14, 10);
  scene.add(keyLight);

  const rimLight = new THREE.DirectionalLight(0x38bdf8, 1.35);
  rimLight.position.set(-10, 6, -8);
  scene.add(rimLight);

  const bottomFill = new THREE.DirectionalLight(0xf59e0b, 0.75);
  bottomFill.position.set(0, -10, 4);
  scene.add(bottomFill);

  // Engineering Floor Grid
  const cadGrid = new THREE.GridHelper(28, 56, 0x1e3a8a, 0x0f172a);
  cadGrid.position.y = -2.25;
  scene.add(cadGrid);

  const materials = createEngineeringMaterials();

  // Application State
  const state = {
    domain: 'aircraft', // 'aircraft' | 'bridge'
    level: 0,           // 0 | 1 | 2 | 3
    explodeFactor: 0.0, // 0.0 .. 1.0
    showCadRuler: true,
    showGhostContext: true,
    rotorRpmFactor: 0.35,
    activeBuild: null,
    datumRulerGroup: null,
    selectedTarget: null,
    cameraTween: null
  };

  const activeStageGroup = new THREE.Group();
  scene.add(activeStageGroup);

  function smoothFlyCamera(targetPosArr, lookAtArr) {
    state.cameraTween = {
      startPos: camera.position.clone(),
      endPos: new THREE.Vector3(...targetPosArr),
      startTarget: controls.target.clone(),
      endTarget: new THREE.Vector3(...lookAtArr),
      progress: 0
    };
  }

  function applyExplodeFactor(factor) {
    state.explodeFactor = factor;
    const sliderEl = document.getElementById('explode-slider');
    const valEl = document.getElementById('explode-value');
    if (sliderEl) sliderEl.value = String(Math.round(factor * 100));
    if (valEl) valEl.textContent = `${Math.round(factor * 100)}%`;

    if (!state.activeBuild || !state.activeBuild.explodableParts) return;
    state.activeBuild.explodableParts.forEach((part) => {
      const base = part.userData.basePos || new THREE.Vector3();
      const vec = part.userData.explodeVec || new THREE.Vector3();
      part.position.set(
        base.x + vec.x * factor,
        base.y + vec.y * factor,
        base.z + vec.z * factor
      );
    });
  }

  function loadTwinLevel(domain, level, initialExplode = null) {
    state.domain = domain;
    const maxLevel = LEVEL_METADATA[domain].length - 1;
    state.level = Math.max(0, Math.min(level, maxLevel));

    while (activeStageGroup.children.length > 0) {
      activeStageGroup.remove(activeStageGroup.children[0]);
    }

    let buildResult = null;
    if (domain === 'aircraft') {
      if (state.level === 0) buildResult = buildL0AircraftAirframe(materials);
      else if (state.level === 1) buildResult = buildL1PylonNacelle(materials);
      else if (state.level === 2) buildResult = buildL2Cfm56Turbofan(materials);
      else buildResult = buildL3HptCombustorCore(materials);
    } else {
      buildResult = buildSuspensionBridgeTwin(materials, state.level);
    }

    state.activeBuild = buildResult;
    activeStageGroup.add(buildResult.root);

    // Build CAD Station Datum Ruler Overlay
    state.datumRulerGroup = buildCadDatumRuler(domain, state.level, materials);
    state.datumRulerGroup.visible = state.showCadRuler;
    activeStageGroup.add(state.datumRulerGroup);

    const meta = LEVEL_METADATA[domain][state.level];
    smoothFlyCamera(meta.cameraPos, meta.cameraTarget);

    const defaultExplode = initialExplode !== null ? initialExplode : state.level === 0 ? 0.15 : 0.28;
    applyExplodeFactor(defaultExplode);

    renderBreadcrumbs();
    renderHierarchySidebar();
    if (buildResult.interactiveTargets.length > 0) {
      selectPart(buildResult.interactiveTargets[0]);
    }
  }

  function selectPart(obj3d) {
    state.selectedTarget = obj3d;
    const ud = obj3d.userData || {};

    document.querySelectorAll('.tree-node-item').forEach((el) => {
      el.classList.toggle('active', el.dataset.partId === ud.partId);
    });

    const titleEl = document.getElementById('inspector-part-title');
    const datumEl = document.getElementById('inspector-part-datum');
    const matEl = document.getElementById('inspector-part-material');
    const descEl = document.getElementById('inspector-part-desc');
    const drillBtn = document.getElementById('inspector-drill-btn');

    if (titleEl) titleEl.textContent = ud.title || ud.partId || '未命名工业组件';
    if (datumEl) datumEl.textContent = ud.datum || 'STA / BL / WL Industrial Datum';
    if (matEl) matEl.textContent = ud.material || 'Aerospace Standard Alloy';
    if (descEl) descEl.textContent = ud.description || '';

    if (drillBtn) {
      if (typeof ud.drillDownLevel === 'number') {
        drillBtn.style.display = 'inline-flex';
        drillBtn.textContent = `⚡ 下钻进入 L${ud.drillDownLevel} 子系统内部结构 (Drill-Down)`;
        drillBtn.onclick = () => loadTwinLevel(state.domain, ud.drillDownLevel, 0.35);
      } else {
        drillBtn.style.display = 'none';
      }
    }
  }

  function renderBreadcrumbs() {
    const bar = document.getElementById('breadcrumb-trail');
    const metaList = LEVEL_METADATA[state.domain];
    const currentMeta = metaList[state.level];

    document.getElementById('active-level-banner-title').textContent = currentMeta.fullTitle;
    document.getElementById('active-level-datum-spec').textContent = currentMeta.datumSystem;
    document.getElementById('active-level-summary').textContent = currentMeta.summary;

    document.querySelectorAll('.domain-switch-btn').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.domain === state.domain);
    });

    bar.innerHTML = '';
    metaList.forEach((m, idx) => {
      const btn = document.createElement('button');
      btn.className = `crumb-step ${idx === state.level ? 'active' : idx < state.level ? 'visited' : ''}`;
      btn.innerHTML = `<span class="crumb-badge">${m.code}</span><span>${m.shortTitle.replace(/^L\d\S*\s*/, '')}</span>`;
      btn.onclick = () => loadTwinLevel(state.domain, idx);
      bar.appendChild(btn);

      if (idx < metaList.length - 1) {
        const sep = document.createElement('span');
        sep.className = 'crumb-sep';
        sep.textContent = '▸';
        bar.appendChild(sep);
      }
    });
  }

  function renderHierarchySidebar() {
    const listEl = document.getElementById('scene-graph-list');
    const portsEl = document.getElementById('mounting-port-list');
    if (!listEl || !portsEl || !state.activeBuild) return;

    listEl.innerHTML = '';
    portsEl.innerHTML = '';

    state.activeBuild.interactiveTargets.forEach((target) => {
      const ud = target.userData || {};
      const item = document.createElement('div');
      item.className = `tree-node-item ${ud.isMountingPort ? 'port-node' : ''}`;
      item.dataset.partId = ud.partId || '';

      const drillBadge = typeof ud.drillDownLevel === 'number'
        ? `<span class="drill-tag" data-drill="${ud.drillDownLevel}">可下钻 L${ud.drillDownLevel} ▸</span>`
        : '';

      item.innerHTML = `
        <div class="node-head">
          <span class="node-title">${ud.title || ud.partId}</span>
          ${drillBadge}
        </div>
        <div class="node-datum">${ud.datum || ''}</div>
      `;

      item.onclick = (e) => {
        const drillAttr = e.target.getAttribute && e.target.getAttribute('data-drill');
        if (drillAttr !== null && drillAttr !== undefined && drillAttr !== '') {
          e.stopPropagation();
          loadTwinLevel(state.domain, Number(drillAttr), 0.35);
          return;
        }
        selectPart(target);
      };

      if (ud.isMountingPort) {
        portsEl.appendChild(item);
      } else {
        listEl.appendChild(item);
      }
    });

    if (portsEl.children.length === 0) {
      portsEl.innerHTML = `<div class="empty-port-note">当前已处于 L3 微观零件末端级（72片枞树形榫槽气冷单晶叶片级），可通过顶部面包屑返回上级挂载接口。</div>`;
    }
  }

  // Raycaster Click Selection & Double-Click Drill-Down on 3D Viewport
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  let downPos = { x: 0, y: 0 };

  renderer.domElement.addEventListener('pointerdown', (e) => {
    downPos = { x: e.clientX, y: e.clientY };
  });

  renderer.domElement.addEventListener('pointerup', (e) => {
    if (Math.hypot(e.clientX - downPos.x, e.clientY - downPos.y) > 6) return;
    const rect = renderer.domElement.getBoundingClientRect();
    pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(pointer, camera);
    if (!state.activeBuild) return;
    const hits = raycaster.intersectObjects(state.activeBuild.interactiveTargets, true);
    if (hits.length > 0) {
      let curr = hits[0].object;
      while (curr && !state.activeBuild.interactiveTargets.includes(curr)) {
        curr = curr.parent;
      }
      if (curr) {
        selectPart(curr);
      }
    }
  });

  renderer.domElement.addEventListener('dblclick', () => {
    if (state.selectedTarget && typeof state.selectedTarget.userData.drillDownLevel === 'number') {
      loadTwinLevel(state.domain, state.selectedTarget.userData.drillDownLevel, 0.35);
    }
  });

  // UI Control Bindings
  document.getElementById('explode-slider').addEventListener('input', (e) => {
    applyExplodeFactor(Number(e.target.value) / 100);
  });

  document.getElementById('btn-toggle-explode').addEventListener('click', () => {
    const next = state.explodeFactor > 0.4 ? 0.0 : 0.85;
    applyExplodeFactor(next);
  });

  document.getElementById('btn-toggle-ruler').addEventListener('click', (e) => {
    state.showCadRuler = !state.showCadRuler;
    if (state.datumRulerGroup) state.datumRulerGroup.visible = state.showCadRuler;
    e.currentTarget.classList.toggle('active', state.showCadRuler);
  });

  document.getElementById('btn-toggle-ghost').addEventListener('click', (e) => {
    state.showGhostContext = !state.showGhostContext;
    materials.ghostWireframe.opacity = state.showGhostContext ? 0.18 : 0.0;
    e.currentTarget.classList.toggle('active', state.showGhostContext);
  });

  document.querySelectorAll('.domain-switch-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      loadTwinLevel(btn.dataset.domain, 0, 0.18);
    });
  });

  window.addEventListener('resize', () => {
    camera.aspect = canvasContainer.clientWidth / canvasContainer.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(canvasContainer.clientWidth, canvasContainer.clientHeight);
  });

  // Animation Loop (Counter-Rotating N1 LP Spool & N2 HP Spool + Camera Tween)
  const clock = new THREE.Clock();
  function animate() {
    requestAnimationFrame(animate);
    const dt = Math.min(clock.getDelta(), 0.05);

    if (state.cameraTween) {
      state.cameraTween.progress += dt * 2.2;
      const t = Math.min(1, state.cameraTween.progress);
      const ease = 1 - Math.pow(1 - t, 3);
      camera.position.lerpVectors(state.cameraTween.startPos, state.cameraTween.endPos, ease);
      controls.target.lerpVectors(state.cameraTween.startTarget, state.cameraTween.endTarget, ease);
      controls.syncFromCamera();
      if (t >= 1) state.cameraTween = null;
    }

    if (state.activeBuild && state.activeBuild.animatedRotors) {
      const { n1Parts = [], n2Parts = [] } = state.activeBuild.animatedRotors;
      n1Parts.forEach((r) => {
        r.rotation.x += dt * 1.6 * state.rotorRpmFactor;
      });
      n2Parts.forEach((r) => {
        r.rotation.x -= dt * 3.8 * state.rotorRpmFactor; // N2 runs faster & counter-rotates for visual distinction
      });
    }

    controls.update();
    renderer.render(scene, camera);
  }

  // Initialize at L0 Boeing 737-800 Airframe
  loadTwinLevel('aircraft', 0, 0.18);
  animate();
}
