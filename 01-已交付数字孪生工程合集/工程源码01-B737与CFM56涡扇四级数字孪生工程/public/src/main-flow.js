/**
 * Pure-Digital Twin Energy & Information Flow App (`main-flow.js`)
 * Powers Version 03 (`00C-工业数字孪生能量信息流版-工况热力流光与铰链Slerp预演.html`)
 * while keeping Versions 01 and 02 100% untouched.
 */

import * as THREE from '../vendor/three.module.js';
import { OrbitControls } from '../vendor/controls/OrbitControls.js';
import { EffectComposer } from '../vendor/postprocessing/EffectComposer.js';
import { RenderPass } from '../vendor/postprocessing/RenderPass.js';
import { UnrealBloomPass } from '../vendor/postprocessing/UnrealBloomPass.js';
import { TWIN_HIERARCHY_LEVELS, SPOOL_BADGES } from './config/twin-scene.js';
import { createSharedClipUniforms } from './shaders/FresnelGhostMat.js';
import { TwinAssetLoader } from './core/AssetLoader.js';
import { buildB737AirframeSkeletonL0 } from './core/AirframeSkeletonL0.js';
import { FlowAndGhostEngine } from './core/FlowAndGhostEngine.js';

const L0_BEACON_NODES = [
  { id: 'beacon-fadec', pos: new THREE.Vector3(-8.15, 1.55, -4.85), label: 'STA 178 · 驾驶舱 FADEC 数字推力主控总线', color: '#38bdf8' },
  { id: 'beacon-wingbox', pos: new THREE.Vector3(1.02, 1.35, -4.85), label: 'STA 540 · 中央翼盒主承力隔框与燃油总管', color: '#f59e0b' },
  { id: 'beacon-pylon', pos: new THREE.Vector3(-0.25, 1.25, 0.0), label: 'WBL -190.97 · 左翼吊架等静定安装节与 EEC', color: '#38bdf8' },
  { id: 'beacon-core', pos: new THREE.Vector3(0.08, 0.0, 0.45), label: 'CFM56 核心机 · 双转子热力流道 (双击下钻)', color: '#fb923c' }
];

const L2_GASPATH_PILLS = [
  { id: 'gp-intake', pos: new THREE.Vector3(-1.55, 0.72, 0.35), title: '进气与风扇增压', metricFn: (t) => `N1 ${t.n1Pct.toFixed(0)}% (${t.n1Rpm} RPM) · 288 K`, color: '#38bdf8' },
  { id: 'gp-hpc', pos: new THREE.Vector3(-0.58, 0.48, 0.32), title: '5级高压压气机 (HPC)', metricFn: (t) => `OPR ${t.oprBar} bar · N2 ${t.n2Pct.toFixed(0)}%`, color: '#06b6d4' },
  { id: 'gp-comb', pos: new THREE.Vector3(0.12, 0.46, 0.32), title: '环形燃烧室 & HPT', metricFn: (t) => `EGT ${t.egtKelvin} K · 燃油 ${t.fuelFlowKgH} kg/h`, color: '#f59e0b' },
  { id: 'gp-lpt', pos: new THREE.Vector3(1.15, 0.56, 0.32), title: '4级 LPT & 波瓣混合尾喷', metricFn: (t) => `净推力 ${t.thrustKn} kN · 涵道比 5.1:1`, color: '#fb7185' }
];

class TurbofanFlowDigitalTwinApp {
  constructor() {
    this.canvasContainer = document.getElementById('viewport-container');
    this.sharedClipUniforms = createSharedClipUniforms();

    this.currentLevelIdx = 0;
    this.explodeTarget = 0.0;
    this.explodeCurrent = 0.0;
    this.clipEnabled = false;
    this.clipAxisMode = 'Z';
    this.clipOffsetValue = 0.15;

    this.hoveredPart = null;
    this.selectedPart = null;

    this.camTargetPos = new THREE.Vector3(-6.8, 3.6, 8.2);
    this.camTargetLook = new THREE.Vector3(0.4, 0.85, -1.65);
    this.isCameraTweening = false;

    this.raycaster = new THREE.Raycaster();
    this.pointerNDC = new THREE.Vector2();
    this.pointerClient = { x: 0, y: 0 };
    this.pointerDownPos = { x: 0, y: 0 };

    this.clock = new THREE.Clock();

    this.initScene();
    this.initLights();
    this.initPostProcessing();
    this.initProgressiveOverlayDOM();
    this.initUIEvents();
    this.initViewportInteraction();
    this.bootAssets();
  }

  initScene() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x040811);

    this.camera = new THREE.PerspectiveCamera(
      36,
      window.innerWidth / window.innerHeight,
      0.05,
      120
    );
    this.camera.position.copy(this.camTargetPos);

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 0.94;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.canvasContainer.appendChild(this.renderer.domElement);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.06;
    this.controls.minDistance = 0.45;
    this.controls.maxDistance = 45.0;
    this.controls.target.copy(this.camTargetLook);

    this.controls.addEventListener('start', () => {
      this.isCameraTweening = false;
    });

    window.addEventListener('resize', () => this.onResize());
  }

  initLights() {
    const hemi = new THREE.HemisphereLight(0xdbeafe, 0x090f1d, 0.58);
    this.scene.add(hemi);

    const keyLight = new THREE.DirectionalLight(0xfff7ed, 1.42);
    keyLight.position.set(-3.5, 4.8, 4.2);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.set(2048, 2048);
    keyLight.shadow.bias = -0.0004;
    this.scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x38bdf8, 1.05);
    rimLight.position.set(3.8, 2.2, -3.6);
    this.scene.add(rimLight);
  }

  initPostProcessing() {
    this.composer = new EffectComposer(this.renderer);
    const renderPass = new RenderPass(this.scene, this.camera);
    this.composer.addPass(renderPass);

    this.bloomPass = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      0.20,
      0.50,
      0.84
    );
    this.composer.addPass(this.bloomPass);
  }

  initProgressiveOverlayDOM() {
    const layer = document.getElementById('progressive-hud-layer');
    this.beaconEls = L0_BEACON_NODES.map((b) => {
      const el = document.createElement('div');
      el.className = 'prog-beacon';
      el.innerHTML = `<span class="beacon-dot" style="background:${b.color};box-shadow:0 0 12px ${b.color}"></span><span class="beacon-txt">${b.label}</span>`;
      el.addEventListener('click', () => {
        if (b.id === 'beacon-core' || b.id === 'beacon-pylon') {
          this.applyHierarchyState(1, true);
        }
      });
      layer.appendChild(el);
      return { cfg: b, el };
    });

    this.gasPillEls = L2_GASPATH_PILLS.map((g) => {
      const el = document.createElement('div');
      el.className = 'prog-gaspill';
      el.style.borderColor = `${g.color}66`;
      el.innerHTML = `<div class="gp-title" style="color:${g.color}">${g.title}</div><div class="gp-metric">--</div>`;
      layer.appendChild(el);
      return { cfg: g, el, metricEl: el.querySelector('.gp-metric') };
    });
  }

  async bootAssets() {
    this.assetLoader = new TwinAssetLoader(this.scene, this.renderer, this.sharedClipUniforms);
    const loaderOverlay = document.getElementById('boot-loader');
    const loaderStatus = document.getElementById('boot-status');
    const loaderFill = document.getElementById('boot-bar-fill');

    try {
      loaderStatus.textContent = '加载 HDRI 工业金属环境光与 37 零件 CAD 拓扑清单...';
      loaderFill.style.width = '12%';
      await Promise.all([
        this.assetLoader.loadEnvironmentHdri('./hdri/studio_metal_1k.hdr'),
        this.assetLoader.loadManifest('./models/twin_asset_manifest.json')
      ]);

      loaderStatus.textContent = '构建 L0 B737-800 整机骨架与 FADEC/燃油/传力脉冲管网...';
      buildB737AirframeSkeletonL0(this.sharedClipUniforms, this.assetLoader);

      loaderStatus.textContent = '流式加载 L1 外涵道机匣与承力框 (112,308 三角面)...';
      await this.assetLoader.loadGlbPack('L1', './models/L1_nacelle_casings.glb', (p) => {
        loaderFill.style.width = `${12 + Math.round(p * 26)}%`;
      });

      loaderStatus.textContent = '流式加载 L2 双转子叶盘与波瓣混合器 (373,238 三角面)...';
      await this.assetLoader.loadGlbPack('L2', './models/L2_turbofan_core.glb', (p) => {
        loaderFill.style.width = `${38 + Math.round(p * 42)}%`;
      });

      loaderStatus.textContent = '流式加载 L3 环形燃烧室与高压涡轮热端 (82,934 三角面)...';
      await this.assetLoader.loadGlbPack('L3', './models/L3_hpt_combustor.glb', (p) => {
        loaderFill.style.width = `${80 + Math.round(p * 20)}%`;
      });

      // Initialize the 4 Pure-Digital Visual & Interaction Killer Features
      this.flowEngine = new FlowAndGhostEngine(
        this.scene,
        this.camera,
        this.assetLoader,
        this.sharedClipUniforms
      );

      loaderFill.style.width = '100%';
      setTimeout(() => {
        loaderOverlay.classList.add('hidden');
      }, 220);

      this.applyHierarchyState(0, true);
      this.animate();
    } catch (err) {
      console.error('Failed to load twin GLB assets:', err);
      loaderStatus.textContent = `资产加载异常: ${err.message}`;
    }
  }

  initUIEvents() {
    // 1. Breadcrumb clicks
    document.querySelectorAll('.crumb-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const lvl = parseInt(btn.dataset.level, 10);
        this.clearPartSelection();
        this.applyHierarchyState(lvl, true);
      });
    });

    // 2. Throttle / Operating Regime Slider (0% Idle -> 100% Max TOGA)
    const throttleSlider = document.getElementById('throttle-slider');
    const throttleValText = document.getElementById('throttle-value');
    throttleSlider.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value) / 100;
      if (this.flowEngine) {
        this.flowEngine.throttleTarget = val;
      }
      const modeName = val < 0.15 ? '慢车' : val < 0.78 ? '巡航' : 'TOGA满推';
      throttleValText.textContent = `${Math.round(val * 100)}% ${modeName}`;
    });

    // 3. Explode Slider (Lerp + Slerp Gull-Wing Hinge)
    const explodeSlider = document.getElementById('explode-slider');
    const explodeValText = document.getElementById('explode-value');
    explodeSlider.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value) / 100;
      this.explodeTarget = val;
      explodeValText.textContent = `${Math.round(val * 100)}%`;
      if (this.flowEngine) this.flowEngine.clearGhostPreview();
    });

    // Hovering over the Explode slider previews the gull-wing Fan Casing Ghost Pose!
    explodeSlider.addEventListener('pointerenter', () => {
      if (!this.flowEngine || !this.assetLoader) return;
      const fanCase = this.assetLoader.allPartNodes.find((n) => n.id === 'L1_Fan_Casing_Cutaway');
      if (fanCase) this.flowEngine.showGhostPreviewForPart(fanCase, this.explodeCurrent);
    });
    explodeSlider.addEventListener('pointerleave', () => {
      if (this.flowEngine && !this.hoveredPart) this.flowEngine.clearGhostPreview();
    });

    // 4. Energy Flow Streamlines Toggle
    const flowToggleBtn = document.getElementById('flow-toggle-btn');
    flowToggleBtn.addEventListener('click', () => {
      if (!this.flowEngine) return;
      this.flowEngine.flowVisible = !this.flowEngine.flowVisible;
      this.flowEngine.flowGroup.visible = this.flowEngine.flowVisible;
      this.flowEngine.airframeFlowGroup.visible = this.flowEngine.flowVisible;
      flowToggleBtn.classList.toggle('active', this.flowEngine.flowVisible);
    });

    // 5. Laser Clip Plane Toggle
    const clipToggleBtn = document.getElementById('clip-toggle-btn');
    const clipControlsWrap = document.getElementById('clip-subcontrols');
    const clipSlider = document.getElementById('clip-slider');
    const clipAxisBtn = document.getElementById('clip-axis-btn');

    clipToggleBtn.addEventListener('click', () => {
      this.clipEnabled = !this.clipEnabled;
      this.sharedClipUniforms.uClipEnabled.value = this.clipEnabled ? 1.0 : 0.0;
      clipToggleBtn.classList.toggle('active', this.clipEnabled);
      clipControlsWrap.classList.toggle('visible', this.clipEnabled);
    });

    clipSlider.addEventListener('input', (e) => {
      this.clipOffsetValue = parseFloat(e.target.value) / 100;
      this.updateClipUniforms();
    });

    clipAxisBtn.addEventListener('click', () => {
      this.clipAxisMode = this.clipAxisMode === 'Z' ? 'X' : 'Z';
      clipAxisBtn.textContent = this.clipAxisMode === 'Z' ? '纵剖 (Z)' : '轴向 (X)';
      this.updateClipUniforms();
    });

    // 6. Focus Card Drill-Down & Close
    document.getElementById('focus-drill-btn').addEventListener('click', () => {
      if (!this.selectedPart) return;
      this.dollyAndDrillToPart(this.selectedPart);
    });
    document.getElementById('focus-close-btn').addEventListener('click', () => {
      this.clearPartSelection();
    });
  }

  updateClipUniforms() {
    if (this.clipAxisMode === 'Z') {
      this.sharedClipUniforms.uClipAxis.value.set(0, 0, 1);
      this.sharedClipUniforms.uClipOffset.value = this.clipOffsetValue * 0.95;
    } else {
      this.sharedClipUniforms.uClipAxis.value.set(-1, 0, 0);
      this.sharedClipUniforms.uClipOffset.value = this.clipOffsetValue * 2.1;
    }
  }

  initViewportInteraction() {
    const dom = this.renderer.domElement;

    dom.addEventListener('pointermove', (e) => {
      this.pointerClient.x = e.clientX;
      this.pointerClient.y = e.clientY;
      this.pointerNDC.x = (e.clientX / window.innerWidth) * 2 - 1;
      this.pointerNDC.y = -(e.clientY / window.innerHeight) * 2 + 1;
      this.handlePointerHover();
    });

    dom.addEventListener('pointerdown', (e) => {
      this.pointerDownPos.x = e.clientX;
      this.pointerDownPos.y = e.clientY;
    });

    dom.addEventListener('click', (e) => {
      const dist = Math.hypot(
        e.clientX - this.pointerDownPos.x,
        e.clientY - this.pointerDownPos.y
      );
      if (dist > 6) return;

      const hitPart = this.raycastPart();
      if (hitPart) {
        this.selectSinglePart(hitPart);
      } else {
        this.clearPartSelection();
      }
    });

    dom.addEventListener('dblclick', () => {
      const hitPart = this.raycastPart();
      if (hitPart) {
        this.dollyAndDrillToPart(hitPart);
      }
    });
  }

  getInteractiveMeshes() {
    const cfg = TWIN_HIERARCHY_LEVELS[this.currentLevelIdx];
    const meshes = [];
    for (const partNode of this.assetLoader.allPartNodes) {
      if (cfg.activePacks.includes(partNode.packKey)) {
        meshes.push(...partNode.meshes);
      }
    }
    return meshes;
  }

  raycastPart() {
    if (!this.assetLoader || this.assetLoader.allPartNodes.length === 0) return null;
    this.raycaster.setFromCamera(this.pointerNDC, this.camera);
    const meshes = this.getInteractiveMeshes();
    const hits = this.raycaster.intersectObjects(meshes, false);

    for (const hit of hits) {
      if (this.clipEnabled) {
        const clipDist =
          hit.point.dot(this.sharedClipUniforms.uClipAxis.value) -
          this.sharedClipUniforms.uClipOffset.value;
        if (clipDist > 0) continue;
      }
      if (hit.object?.userData?.partNodeRef) {
        return hit.object.userData.partNodeRef;
      }
    }
    return null;
  }

  handlePointerHover() {
    const hoverPill = document.getElementById('hover-pill');
    const hitPart = this.raycastPart();

    if (this.hoveredPart && this.hoveredPart !== hitPart) {
      const prev = this.hoveredPart;
      this.hoveredPart = null;
      this.refreshPartMaterial(prev);
    }

    if (!hitPart) {
      hoverPill.classList.remove('visible');
      this.renderer.domElement.style.cursor = 'grab';
      if (this.flowEngine) this.flowEngine.clearGhostPreview();
      return;
    }

    this.hoveredPart = hitPart;
    this.refreshPartMaterial(hitPart);
    this.renderer.domElement.style.cursor = 'pointer';

    // Trigger Killer Feature #3: Ghost Preview + Trajectory Curve on Hover
    if (this.flowEngine) {
      this.flowEngine.showGhostPreviewForPart(hitPart, this.explodeCurrent);
    }

    const spoolInfo = SPOOL_BADGES[hitPart.meta.spool] || SPOOL_BADGES.STATIC;
    const strokeMm = Math.round(hitPart.explodeVec.length() * 850);
    const hingeTag = hitPart.hasHingeSlerp
      ? ` · 铰链Slerp掀角 ${hitPart.hingeAngleDeg}°`
      : strokeMm > 10
        ? ` · 预演行程 ${strokeMm}mm`
        : '';

    hoverPill.innerHTML = `<span class="pill-tag" style="color:${spoolInfo.color}">[${hitPart.meta.level} · ${hitPart.meta.spool}]</span> ${hitPart.meta.label_zh}<span style="color:#fcd34d;margin-left:6px;font-size:11.5px">${hingeTag}</span>`;
    hoverPill.style.transform = `translate3d(${this.pointerClient.x + 18}px, ${this.pointerClient.y - 14}px, 0)`;
    hoverPill.classList.add('visible');
  }

  selectSinglePart(partNode) {
    this.selectedPart = partNode;
    if (this.flowEngine) this.flowEngine.clearGhostPreview();

    for (const node of this.assetLoader.allPartNodes) {
      if (node === partNode) {
        node.isGhost = false;
        const popVec = node.explodeVec.clone();
        if (popVec.lengthSq() < 0.001) {
          popVec.set(0, 0.08, 0.14);
        } else {
          popVec.normalize().multiplyScalar(0.14);
        }
        node.targetMicroPop.copy(popVec);
      } else {
        node.isGhost = true;
        node.targetMicroPop.set(0, 0, 0);
      }
      this.refreshPartMaterial(node);
    }

    this.updateFocusCardContent();
    document.getElementById('focus-card').classList.add('visible');
  }

  updateFocusCardContent() {
    if (!this.selectedPart || !this.flowEngine) return;
    const partNode = this.selectedPart;
    const t = this.flowEngine.telemetry;
    const spoolInfo = SPOOL_BADGES[partNode.meta.spool] || SPOOL_BADGES.STATIC;

    document.getElementById('focus-badge').textContent = `${partNode.meta.level} · ${spoolInfo.label}`;
    document.getElementById('focus-badge').style.color = spoolInfo.color;
    document.getElementById('focus-title').textContent = `${partNode.meta.label_zh}`;

    const liveMetric =
      partNode.meta.spool === 'N1'
        ? `实时工况: N1 ${t.n1Rpm} RPM (${t.n1Pct.toFixed(1)}%) · 推力 ${t.thrustKn} kN`
        : partNode.meta.spool === 'N2' || partNode.packKey === 'L3'
          ? `实时工况: 燃气温度 ${t.egtKelvin} K · N2 ${t.n2Rpm} RPM · 总压比 ${t.oprBar} bar`
          : `实测网格 ${partNode.meta.exportedTriangles.toLocaleString()} 三角面 · 承受推力载荷 ${t.thrustKn} kN`;

    document.getElementById('focus-desc').textContent = `${partNode.meta.desc_zh} | ${liveMetric}`;
  }

  clearPartSelection() {
    this.selectedPart = null;
    document.getElementById('focus-card').classList.remove('visible');
    this.syncGhostStatesForCurrentLevel();
  }

  dollyAndDrillToPart(partNode) {
    const targetLevelMap = { L0: 0, L1: 1, L2: 2, L3: 3 };
    const targetLevelIdx = targetLevelMap[partNode.packKey] ?? 2;

    this.currentLevelIdx = targetLevelIdx;
    this.updateBreadcrumbUI(targetLevelIdx);

    this.selectedPart = null;
    document.getElementById('focus-card').classList.remove('visible');
    this.syncGhostStatesForCurrentLevel();

    const box = new THREE.Box3().setFromObject(partNode.rootObj);
    const center = new THREE.Vector3();
    const size = new THREE.Vector3();
    box.getCenter(center);
    box.getSize(size);

    const radius = Math.max(size.length() * 0.65, 0.55);
    this.camTargetLook.copy(center);
    this.camTargetPos.set(
      center.x - radius * 0.85,
      center.y + radius * 0.52,
      center.z + radius * 1.65
    );
    this.isCameraTweening = true;

    if (this.explodeTarget < 0.35 && targetLevelIdx > 0) {
      this.setExplodeSlider(0.45);
    }
  }

  applyHierarchyState(levelIdx, animateCam = true) {
    this.currentLevelIdx = levelIdx;
    const cfg = TWIN_HIERARCHY_LEVELS[levelIdx];

    this.updateBreadcrumbUI(levelIdx);
    this.syncGhostStatesForCurrentLevel();
    this.setExplodeSlider(cfg.defaultExplode);

    if (animateCam) {
      this.camTargetPos.set(...cfg.cameraPos);
      this.camTargetLook.set(...cfg.cameraTarget);
      this.isCameraTweening = true;
    }
  }

  updateBreadcrumbUI(levelIdx) {
    document.querySelectorAll('.crumb-btn').forEach((btn) => {
      const idx = parseInt(btn.dataset.level, 10);
      btn.classList.toggle('active', idx === levelIdx);
    });
  }

  setExplodeSlider(val) {
    this.explodeTarget = val;
    const slider = document.getElementById('explode-slider');
    const text = document.getElementById('explode-value');
    if (slider && text) {
      slider.value = Math.round(val * 100);
      text.textContent = `${Math.round(val * 100)}%`;
    }
  }

  syncGhostStatesForCurrentLevel() {
    const cfg = TWIN_HIERARCHY_LEVELS[this.currentLevelIdx];
    for (const node of this.assetLoader.allPartNodes) {
      node.isGhost = cfg.ghostPacks.includes(node.packKey);
      node.targetMicroPop.set(0, 0, 0);
      this.refreshPartMaterial(node);
    }
  }

  refreshPartMaterial(partNode) {
    for (const mesh of partNode.meshes) {
      if (this.selectedPart === partNode) {
        mesh.material = mesh.userData.selectedMaterial;
      } else if (this.hoveredPart === partNode && !partNode.isGhost) {
        mesh.material = mesh.userData.hoverMaterial;
      } else if (partNode.isGhost) {
        mesh.material = mesh.userData.ghostMaterial;
      } else {
        mesh.material = mesh.userData.origMaterial;
      }
    }
  }

  /**
   * Killer Feature #4: Progressive Disclosure driven by Camera Distance
   * - Far (L0 Global > 5.2m): Shows minimal breathing node beacons on B737 airframe & pylon
   * - Mid (L1/L2 Subsystem 2.2m..5.2m): Shows 4 gas-path thermodynamic flow pills
   * - Close (L3 Detail < 2.2m): Hides floating clutter so close-up blade inspection is crystal clear
   */
  updateProgressiveDisclosure() {
    if (!this.flowEngine) return;
    const camDist = this.camera.position.distanceTo(this.controls.target);
    const showL0Beacons = this.currentLevelIdx === 0 && camDist > 4.6 && !this.selectedPart;
    const showL2GasPills =
      (this.currentLevelIdx === 1 || this.currentLevelIdx === 2 || (camDist <= 4.6 && camDist >= 2.05)) &&
      this.currentLevelIdx !== 3 &&
      !this.selectedPart &&
      this.flowEngine.flowVisible;

    const projVec = new THREE.Vector3();
    const w = window.innerWidth;
    const h = window.innerHeight;

    for (const item of this.beaconEls) {
      if (!showL0Beacons) {
        item.el.classList.remove('visible');
        continue;
      }
      projVec.copy(item.cfg.pos).project(this.camera);
      if (projVec.z > 1.0) {
        item.el.classList.remove('visible');
        continue;
      }
      const x = (projVec.x * 0.5 + 0.5) * w;
      const y = (-projVec.y * 0.5 + 0.5) * h;
      item.el.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      item.el.classList.add('visible');
    }

    for (const item of this.gasPillEls) {
      if (!showL2GasPills) {
        item.el.classList.remove('visible');
        continue;
      }
      projVec.copy(item.cfg.pos).project(this.camera);
      if (projVec.z > 1.0) {
        item.el.classList.remove('visible');
        continue;
      }
      const x = (projVec.x * 0.5 + 0.5) * w;
      const y = (-projVec.y * 0.5 + 0.5) * h;
      item.metricEl.textContent = item.cfg.metricFn(this.flowEngine.telemetry);
      item.el.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      item.el.classList.add('visible');
    }

    if (this.selectedPart) {
      this.updateFocusCardContent();
    }
  }

  onResize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
    this.composer.setSize(w, h);
  }

  animate() {
    requestAnimationFrame(() => this.animate());

    const dt = Math.min(this.clock.getDelta(), 0.05);
    const elapsed = this.clock.getElapsedTime();
    this.sharedClipUniforms.uTime.value = elapsed;

    // 1. Update Virtual Operating Regime, Blackbody Thermal Shader & 3D Gas-Path Flow
    if (this.flowEngine) {
      this.flowEngine.update(dt, elapsed, this.explodeCurrent);
    }

    // 2. Spring-damped Position Lerp + Attitude Quaternion Slerp + Spool Spin
    this.explodeCurrent += (this.explodeTarget - this.explodeCurrent) * Math.min(1, dt * 7.5);
    const th = this.flowEngine ? this.flowEngine.throttleCurrent : 0.5;
    const n1Omega = 0.8 + th * 3.6;
    const n2Omega = 1.8 + th * 6.8;

    for (const node of this.assetLoader.allPartNodes) {
      node.currentMicroPop.lerp(node.targetMicroPop, Math.min(1, dt * 10.0));

      // Position Lerp
      node.rootObj.position
        .copy(node.basePos)
        .addScaledVector(node.explodeVec, this.explodeCurrent)
        .add(node.currentMicroPop);

      // Attitude Quaternion Slerp for hinged cowl doors & structural struts, or axial spin for N1/N2 rotors
      if (node.meta.spool === 'N1') {
        node.rootObj.rotation.x += dt * n1Omega;
      } else if (node.meta.spool === 'N2') {
        node.rootObj.rotation.x -= dt * n2Omega;
      } else if (node.hasHingeSlerp && node.baseQuat && node.explodeQuat) {
        node.rootObj.quaternion.copy(node.baseQuat).slerp(node.explodeQuat, this.explodeCurrent);
      }
    }

    // 3. Smooth Camera Dolly-In Tween
    if (this.isCameraTweening) {
      const lerpAlpha = Math.min(1, dt * 5.2);
      this.camera.position.lerp(this.camTargetPos, lerpAlpha);
      this.controls.target.lerp(this.camTargetLook, lerpAlpha);
      if (
        this.camera.position.distanceToSquared(this.camTargetPos) < 0.0004 &&
        this.controls.target.distanceToSquared(this.camTargetLook) < 0.0004
      ) {
        this.isCameraTweening = false;
      }
    }

    this.controls.update();
    this.updateProgressiveDisclosure();
    this.composer.render();
  }
}

function bootFlowTwinApp() {
  if (!window.twinApp) {
    window.twinApp = new TurbofanFlowDigitalTwinApp();
  }
}

if (document.readyState === 'loading') {
  window.addEventListener('DOMContentLoaded', bootFlowTwinApp);
} else {
  bootFlowTwinApp();
}
