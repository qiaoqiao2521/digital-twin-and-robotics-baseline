/**
 * 100% Full-Screen Asset-Driven Industrial 3D Digital Twin Engine (`main.js`)
 * - Genuine 568,480-Triangle CATIA V5 2-Spool High-Bypass Turbofan Engine (`L1`, `L2`, `L3` .glb packs)
 * - Studio HDRI Metallic Reflections + UnrealBloomPass Specular Highlights
 * - Fresnel X-Ray Ghost Shader (`FresnelGhostMat`) for Parent Context & Single-Click Part Isolation
 * - Fragment Shader `discard` + Laser Edge Glow Clip Plane (Zero Stencil Cap artifacts)
 * - 3-Tier Click/Drill-Down Feedback (Hover Pill -> Single-Click Ghost Isolation + Micro-Pop -> Double-Click Dolly-In)
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

class TurbofanDigitalTwinApp {
  constructor() {
    this.canvasContainer = document.getElementById('viewport-container');
    this.sharedClipUniforms = createSharedClipUniforms();

    // State
    this.currentLevelIdx = 0; // 0: L0, 1: L1, 2: L2, 3: L3
    this.explodeTarget = 0.0;
    this.explodeCurrent = 0.0;
    this.spoolSpinning = true;
    this.clipEnabled = false;
    this.clipAxisMode = 'Z'; // 'Z' (radial cutaway) or 'X' (axial sweep)
    this.clipOffsetValue = 0.15;

    this.hoveredPart = null;
    this.selectedPart = null;

    // Camera tween state
    this.camTargetPos = new THREE.Vector3(-2.15, 1.25, 3.85);
    this.camTargetLook = new THREE.Vector3(0.05, 0.02, 0.0);
    this.isCameraTweening = false;

    this.raycaster = new THREE.Raycaster();
    this.pointerNDC = new THREE.Vector2();
    this.pointerClient = { x: 0, y: 0 };
    this.pointerDownPos = { x: 0, y: 0 };

    this.clock = new THREE.Clock();

    this.initScene();
    this.initLights();
    this.initPostProcessing();
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

    // Interrupt camera auto-tween if user manually drags or zooms
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

    const coreWarmLight = new THREE.PointLight(0xf97316, 0.95, 3.2);
    coreWarmLight.position.set(0.05, 0.08, 0.25);
    this.scene.add(coreWarmLight);
  }

  initPostProcessing() {
    this.composer = new EffectComposer(this.renderer);
    const renderPass = new RenderPass(this.scene, this.camera);
    this.composer.addPass(renderPass);

    this.bloomPass = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      0.16, // strength: crisp metallic specular & laser cut edge glow without blowout
      0.48, // radius
      0.88  // threshold
    );
    this.composer.addPass(this.bloomPass);
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

      loaderStatus.textContent = '构建 L0 B737-800 机身隔框/机翼双梁/左翼吊架承力骨架 (FS 130~1217)...';
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

      loaderFill.style.width = '100%';
      setTimeout(() => {
        loaderOverlay.classList.add('hidden');
      }, 240);

      this.applyHierarchyState(0, true);
      this.animate();
    } catch (err) {
      console.error('Failed to load twin GLB assets:', err);
      loaderStatus.textContent = `资产加载异常: ${err.message}`;
    }
  }

  initUIEvents() {
    // 1. Top-Left Breadcrumb clicks
    document.querySelectorAll('.crumb-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const lvl = parseInt(btn.dataset.level, 10);
        this.clearPartSelection();
        this.applyHierarchyState(lvl, true);
      });
    });

    // 2. Bottom-Center Explode Slider
    const explodeSlider = document.getElementById('explode-slider');
    const explodeValText = document.getElementById('explode-value');
    explodeSlider.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value) / 100;
      this.explodeTarget = val;
      explodeValText.textContent = `${Math.round(val * 100)}%`;
    });

    // 3. Laser Clip Plane Toggle & Depth Slider & Axis Switch
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
      const norm = parseFloat(e.target.value) / 100; // -1.0 .. +1.0
      this.clipOffsetValue = norm;
      this.updateClipUniforms();
    });

    clipAxisBtn.addEventListener('click', () => {
      this.clipAxisMode = this.clipAxisMode === 'Z' ? 'X' : 'Z';
      clipAxisBtn.textContent = this.clipAxisMode === 'Z' ? '纵剖 (Z)' : '轴向 (X)';
      this.updateClipUniforms();
    });

    // 4. Dual Spool Spin Toggle
    const spinToggleBtn = document.getElementById('spin-toggle-btn');
    spinToggleBtn.addEventListener('click', () => {
      this.spoolSpinning = !this.spoolSpinning;
      spinToggleBtn.classList.toggle('active', this.spoolSpinning);
    });

    // 5. Focus Card Drill-Down & Close Buttons
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
      // Slice along Z (front-to-back radial cutaway)
      this.sharedClipUniforms.uClipAxis.value.set(0, 0, 1);
      this.sharedClipUniforms.uClipOffset.value = this.clipOffsetValue * 0.95;
    } else {
      // Slice along X (intake-to-exhaust axial station sweep)
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
      if (dist > 6) return; // Ignore camera orbit drag

      const hitPart = this.raycastPart();
      if (hitPart) {
        this.selectSinglePart(hitPart);
      } else {
        this.clearPartSelection();
      }
    });

    dom.addEventListener('dblclick', (e) => {
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
      // Allow picking active packs at the current level (or all packs in L0)
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
      // Skip points clipped by shader if clip is enabled
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
      this.refreshPartMaterial(this.hoveredPart);
      this.hoveredPart = null;
    }

    if (!hitPart) {
      hoverPill.classList.remove('visible');
      this.renderer.domElement.style.cursor = 'grab';
      return;
    }

    this.hoveredPart = hitPart;
    this.refreshPartMaterial(hitPart);
    this.renderer.domElement.style.cursor = 'pointer';

    // Update single-line floating cursor pill
    const spoolInfo = SPOOL_BADGES[hitPart.meta.spool] || SPOOL_BADGES.STATIC;
    hoverPill.innerHTML = `<span class="pill-tag" style="color:${spoolInfo.color}">[${hitPart.meta.level} · ${hitPart.meta.spool}]</span> ${hitPart.meta.label_zh}`;
    hoverPill.style.transform = `translate3d(${this.pointerClient.x + 18}px, ${this.pointerClient.y - 14}px, 0)`;
    hoverPill.classList.add('visible');
  }

  selectSinglePart(partNode) {
    this.selectedPart = partNode;

    // 1. Apply Fresnel X-Ray Ghost mode to all unselected parts, keep selected part PBR + Micro-Pop
    for (const node of this.assetLoader.allPartNodes) {
      if (node === partNode) {
        node.isGhost = false;
        // Subtle radial/axial Micro-Pop offset so the selected part stands out visually
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

    // 2. Populate the compact 3-line Focus Micro-Card
    const card = document.getElementById('focus-card');
    const spoolInfo = SPOOL_BADGES[partNode.meta.spool] || SPOOL_BADGES.STATIC;
    document.getElementById('focus-badge').textContent = `${partNode.meta.level} · ${spoolInfo.label}`;
    document.getElementById('focus-badge').style.color = spoolInfo.color;
    document.getElementById('focus-title').textContent = `${partNode.meta.label_zh} (${partNode.meta.label_en})`;
    document.getElementById('focus-desc').textContent = `${partNode.meta.desc_zh} · 实测网格 ${partNode.meta.exportedTriangles.toLocaleString()} 三角面`;
    card.classList.add('visible');
  }

  clearPartSelection() {
    this.selectedPart = null;
    document.getElementById('focus-card').classList.remove('visible');
    this.syncGhostStatesForCurrentLevel();
  }

  dollyAndDrillToPart(partNode) {
    const targetLevelMap = { L1: 1, L2: 2, L3: 3 };
    const targetLevelIdx = targetLevelMap[partNode.packKey] || 2;

    // Switch hierarchy level first
    this.currentLevelIdx = targetLevelIdx;
    this.updateBreadcrumbUI(targetLevelIdx);

    // Keep the double-clicked part isolated or highlight its subsystem
    this.selectedPart = null;
    document.getElementById('focus-card').classList.remove('visible');
    this.syncGhostStatesForCurrentLevel();

    // Compute world bounding box of the target part for smooth camera Dolly-In
    const box = new THREE.Box3().setFromObject(partNode.rootObj);
    const center = new THREE.Vector3();
    const size = new THREE.Vector3();
    box.getCenter(center);
    box.getSize(size);

    const radius = Math.max(size.length() * 0.65, 0.55);
    // Position camera toward the +Z cutaway window side with a slight intake (-X) and top (+Y) angle
    this.camTargetLook.copy(center);
    this.camTargetPos.set(
      center.x - radius * 0.85,
      center.y + radius * 0.52,
      center.z + radius * 1.65
    );
    this.isCameraTweening = true;

    // Expand explosion slightly if at 0 so internal blades are clearly separated
    if (this.explodeTarget < 0.35) {
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

    // 1. Smooth explosion factor & per-part Micro-Pop interpolation
    this.explodeCurrent += (this.explodeTarget - this.explodeCurrent) * Math.min(1, dt * 7.5);

    for (const node of this.assetLoader.allPartNodes) {
      node.currentMicroPop.lerp(node.targetMicroPop, Math.min(1, dt * 10.0));

      node.rootObj.position.copy(node.basePos)
        .addScaledVector(node.explodeVec, this.explodeCurrent)
        .add(node.currentMicroPop);

      // 2. Counter-rotating N1 (Low-Pressure) & N2 (High-Pressure) Spool Rotation around axial X-axis
      if (this.spoolSpinning) {
        if (node.meta.spool === 'N1') {
          node.rootObj.rotation.x += dt * 1.65;
        } else if (node.meta.spool === 'N2') {
          node.rootObj.rotation.x -= dt * 3.4;
        }
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
    this.composer.render();
  }
}

function bootTwinApp() {
  if (!window.twinApp) {
    window.twinApp = new TurbofanDigitalTwinApp();
  }
}

if (document.readyState === 'loading') {
  window.addEventListener('DOMContentLoaded', bootTwinApp);
} else {
  bootTwinApp();
}
