import * as THREE from '../vendor/three.module.js';
import { OrbitControls } from '../vendor/controls/OrbitControls.js';
import { RGBELoader } from '../vendor/loaders/RGBELoader.js';
import { EffectComposer } from '../vendor/postprocessing/EffectComposer.js';
import { RenderPass } from '../vendor/postprocessing/RenderPass.js';
import { UnrealBloomPass } from '../vendor/postprocessing/UnrealBloomPass.js';
import { OutlinePass } from '../vendor/postprocessing/OutlinePass.js';
import { OutputPass } from '../vendor/postprocessing/OutputPass.js';

import { buildMars2020SkeletonL0, RMCS_PORTS } from './core/Mars2020SkeletonL0.js';
import { Mars2020AssetLoader, SUBSYSTEM_META } from './core/AssetLoader.js';
import { clipState } from './shaders/FresnelGhostMat.js';

const LEVEL_CAMERAS = {
  L0: {
    pos: new THREE.Vector3(4.65, 2.78, 4.45),
    target: new THREE.Vector3(0.0, 1.42, 0.0),
    label: 'L0 空中吊车与整机骨架',
  },
  L1: {
    pos: new THREE.Vector3(2.95, 1.18, 2.15),
    target: new THREE.Vector3(0.0, 0.52, 0.05),
    label: 'L1 摇臂悬架与六轮',
  },
  L2: {
    pos: new THREE.Vector3(2.15, 1.78, 2.55),
    target: new THREE.Vector3(0.05, 1.32, 0.78),
    label: 'L2 采样机械臂与桅杆',
  },
  L3: {
    pos: new THREE.Vector3(2.35, 1.65, -2.15),
    target: new THREE.Vector3(0.0, 1.15, -0.35),
    label: 'L3 核电源与内部实验舱',
  },
};

class Mars2020DigitalTwinApp {
  constructor() {
    this.container = document.getElementById('viewport');
    this.hoverPill = document.getElementById('hover-pill');
    this.focusCard = document.getElementById('focus-card');
    this.loaderOverlay = document.getElementById('loader-overlay');
    this.loaderBar = document.getElementById('loader-bar-fill');
    this.loaderText = document.getElementById('loader-status');

    this.currentLevel = 'L0';
    this.selectedSubsystemId = null;
    this.hoveredSubsystemId = null;
    this.explodeTarget = 0.0;
    this.explodeCurrent = 0.0;
    this.xrayCasingMode = false;
    this.showSkycraneSkeleton = true;

    this.cameraFlight = null;
    this.clock = new THREE.Clock();
    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2();
    this.pointerDownPos = new THREE.Vector2();

    this._initScene();
    this._initPostProcessing();
    this._initSkeletonAndAssets();
    this._bindUI();
    this._animate();
  }

  _initScene() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x040812);
    this.scene.fog = new THREE.FogExp2(0x040812, 0.042);

    this.camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 0.05, 120);
    this.camera.position.copy(LEVEL_CAMERAS.L0.pos);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 0.96;
    this.container.appendChild(this.renderer.domElement);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.06;
    this.controls.maxDistance = 24;
    this.controls.minDistance = 0.45;
    this.controls.target.copy(LEVEL_CAMERAS.L0.target);

    // Aerospace cleanroom 3-point lighting + HDRI environment
    const hemi = new THREE.HemisphereLight(0xdbeafe, 0x1e1b18, 0.62);
    this.scene.add(hemi);

    const keyLight = new THREE.DirectionalLight(0xfff7ed, 1.58);
    keyLight.position.set(5.5, 8.0, 5.0);
    this.scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x38bdf8, 1.35);
    rimLight.position.set(-5.0, 4.5, -4.5);
    this.scene.add(rimLight);

    const underFill = new THREE.DirectionalLight(0xf59e0b, 0.52);
    underFill.position.set(0.0, -3.0, 2.0);
    this.scene.add(underFill);

    // Load studio metallic HDRI environment map
    const pmrem = new THREE.PMREMGenerator(this.renderer);
    pmrem.compileEquirectangularShader();
    new RGBELoader().load(
      './hdri/studio_metal_1k.hdr',
      (tex) => {
        this.scene.environment = pmrem.fromEquirectangular(tex).texture;
        tex.dispose();
        pmrem.dispose();
      },
      undefined,
      () => {
        // Graceful fallback if HDRI path differs
      }
    );
  }

  _initPostProcessing() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(new RenderPass(this.scene, this.camera));

    this.outlinePass = new OutlinePass(new THREE.Vector2(w, h), this.scene, this.camera);
    this.outlinePass.edgeStrength = 3.8;
    this.outlinePass.edgeGlow = 0.85;
    this.outlinePass.edgeThickness = 1.6;
    this.outlinePass.visibleEdgeColor.setHex(0x38bdf8);
    this.outlinePass.hiddenEdgeColor.setHex(0x0ea5e9);
    this.composer.addPass(this.outlinePass);

    this.bloomPass = new UnrealBloomPass(new THREE.Vector2(w, h), 0.16, 0.38, 0.92);
    this.composer.addPass(this.bloomPass);
    this.composer.addPass(new OutputPass());
  }

  async _initSkeletonAndAssets() {
    this.skeleton = buildMars2020SkeletonL0();
    this.scene.add(this.skeleton.root);

    this.assetLoader = new Mars2020AssetLoader(this.scene, (ratio, msg) => {
      if (this.loaderBar) this.loaderBar.style.width = `${Math.round(ratio * 100)}%`;
      if (this.loaderText) this.loaderText.textContent = msg;
    });

    try {
      await this.assetLoader.loadAllPackages('./models');
      const triBadge = document.getElementById('tri-counter-badge');
      if (triBadge) {
        triBadge.textContent = `${this.assetLoader.totalTriangles.toLocaleString()} TRIS · 70 MESHES · JPL D-105568`;
      }
    } catch (err) {
      console.warn('Model load warning:', err);
    } finally {
      setTimeout(() => {
        if (this.loaderOverlay) this.loaderOverlay.classList.add('hidden');
      }, 240);
    }
  }

  _getAllRaycastTargets() {
    const targets = [...this.assetLoader.interactiveMeshes];
    this.skeleton.portMeshes.forEach((pm) => {
      pm.group.children.forEach((c) => targets.push(c));
    });
    if (this.showSkycraneSkeleton) {
      this.skeleton.skycraneGroup.traverse((c) => {
        if (c.isMesh && c.userData && c.userData.subsystemId) targets.push(c);
      });
    }
    return targets;
  }

  _getSubsystemMeshes(subsystemId) {
    if (!subsystemId) return [];
    const matched = this.assetLoader.interactiveMeshes.filter((m) => m.userData.subsystemId === subsystemId);
    if (matched.length > 0) return matched;
    const skyMatched = [];
    this.skeleton.root.traverse((c) => {
      if (c.isMesh && c.userData && c.userData.subsystemId === subsystemId) skyMatched.push(c);
    });
    return skyMatched;
  }

  _applyMaterialStates() {
    const hasSelection = Boolean(this.selectedSubsystemId);
    const activeLevelFilter = this.currentLevel !== 'L0' && !hasSelection;

    this.assetLoader.interactiveMeshes.forEach((mesh) => {
      const ud = mesh.userData;
      const isSelected = hasSelection && ud.subsystemId === this.selectedSubsystemId;
      const isSameLevel = ud.level === this.currentLevel;

      if (hasSelection) {
        mesh.material = isSelected ? ud.origMaterial : ud.ghostMaterial;
        ud.targetScale = isSelected ? 1.036 : 1.0;
      } else if (activeLevelFilter) {
        mesh.material = isSameLevel ? ud.origMaterial : ud.ghostMaterial;
        ud.targetScale = 1.0;
      } else if (this.xrayCasingMode && ud.isOuterCasing) {
        mesh.material = ud.ghostMaterial;
        ud.targetScale = 1.0;
      } else {
        mesh.material = ud.origMaterial;
        ud.targetScale = 1.0;
      }
    });
  }

  _flyCameraTo(pos, target, duration = 0.85) {
    this.cameraFlight = {
      startPos: this.camera.position.clone(),
      endPos: pos.clone(),
      startTarget: this.controls.target.clone(),
      endTarget: target.clone(),
      elapsed: 0,
      duration,
    };
  }

  setLevel(levelKey) {
    if (!LEVEL_CAMERAS[levelKey]) return;
    this.currentLevel = levelKey;
    this.selectedSubsystemId = null;
    this._hideFocusCard();

    document.querySelectorAll('.crumb-btn').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.level === levelKey);
    });

    // At L1/L2/L3, dim Skycrane upper truss slightly so focus locks onto the Rover subsystem
    this.skeleton.skycraneGroup.visible = this.showSkycraneSkeleton && (levelKey === 'L0');

    const camCfg = LEVEL_CAMERAS[levelKey];
    this._flyCameraTo(camCfg.pos, camCfg.target, 0.9);
    this._applyMaterialStates();
    this.outlinePass.selectedObjects = [];
  }

  selectSubsystem(hitData) {
    if (!hitData) {
      this.selectedSubsystemId = null;
      this.outlinePass.selectedObjects = [];
      this._hideFocusCard();
      this._applyMaterialStates();
      return;
    }

    if (hitData.isMountingPort) {
      this.setLevel(hitData.level);
      return;
    }

    this.selectedSubsystemId = hitData.subsystemId;
    const groupMeshes = this._getSubsystemMeshes(hitData.subsystemId);
    this.outlinePass.visibleEdgeColor.setHex(0xf59e0b);
    this.outlinePass.selectedObjects = groupMeshes;
    this._applyMaterialStates();

    // Update 3-Line Focus HUD Card
    document.getElementById('fc-code').textContent = hitData.code || 'RMCS-DATUM';
    document.getElementById('fc-title').textContent = hitData.title || hitData.subsystemId;
    document.getElementById('fc-spec').textContent = hitData.spec || '';
    this.focusCard.classList.remove('hidden');
    this.focusCard.dataset.subsystemId = hitData.subsystemId;
  }

  drillIntoSubsystem(hitData) {
    if (!hitData) return;
    if (hitData.isMountingPort) {
      this.setLevel(hitData.level);
      return;
    }
    if (hitData.level && LEVEL_CAMERAS[hitData.level]) {
      this.currentLevel = hitData.level;
      document.querySelectorAll('.crumb-btn').forEach((btn) => {
        btn.classList.toggle('active', btn.dataset.level === hitData.level);
      });
    }
    this.selectSubsystem(hitData);
    if (hitData.camPos && hitData.camTarget) {
      this._flyCameraTo(hitData.camPos, hitData.camTarget, 0.85);
    }
  }

  _hideFocusCard() {
    if (this.focusCard) this.focusCard.classList.add('hidden');
  }

  _updateClipUniforms() {
    const enabledVal = clipState.enabled ? 1.0 : 0.0;
    const axisVal = clipState.axis;
    const offsetVal = clipState.offset;

    this.assetLoader.pbrMaterials.forEach((mat) => {
      if (mat.userData && mat.userData.clipUniforms) {
        mat.userData.clipUniforms.uClipEnabled.value = enabledVal;
        mat.userData.clipUniforms.uClipAxis.value = axisVal;
        mat.userData.clipUniforms.uClipOffset.value = offsetVal;
      }
    });

    [this.assetLoader.ghostMatOuter, this.assetLoader.ghostMatInner, this.skeleton.aeroGhostMat].forEach((gMat) => {
      if (gMat && gMat.uniforms) {
        gMat.uniforms.uClipEnabled.value = enabledVal;
        gMat.uniforms.uClipAxis.value = axisVal;
        gMat.uniforms.uClipOffset.value = offsetVal;
      }
    });
  }

  _bindUI() {
    window.addEventListener('resize', () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(w, h);
      this.composer.setSize(w, h);
    });

    // Top-left Breadcrumb buttons
    document.querySelectorAll('.crumb-btn').forEach((btn) => {
      btn.addEventListener('click', () => this.setLevel(btn.dataset.level));
    });

    // Bottom Dock: Explode Slider
    const explodeSlider = document.getElementById('explode-slider');
    const explodeVal = document.getElementById('explode-val');
    explodeSlider.addEventListener('input', (e) => {
      this.explodeTarget = parseFloat(e.target.value);
      explodeVal.textContent = `${Math.round(this.explodeTarget * 100)}%`;
      if (this.explodeTarget > 0.15 && !this.xrayCasingMode) {
        // Automatically lift & ghost outer WEB casing slightly on deep explode so internal ACA lab shines
      }
    });

    // Bottom Dock: Clip Axis Buttons & Offset Slider
    const clipOffsetWrap = document.getElementById('clip-offset-wrap');
    const clipSlider = document.getElementById('clip-slider');
    document.querySelectorAll('.clip-axis-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.clip-axis-btn').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        const axis = parseInt(btn.dataset.axis, 10);
        if (axis === 0) {
          clipState.enabled = false;
          clipOffsetWrap.classList.add('hidden');
        } else {
          clipState.enabled = true;
          clipState.axis = axis;
          clipOffsetWrap.classList.remove('hidden');
          // Default sensible cut offset for Y (Horizontal) vs X/Z
          if (axis === 2 && Math.abs(clipState.offset) < 0.05) {
            clipState.offset = 1.22;
            clipSlider.value = '1.22';
          } else if (axis !== 2 && clipState.offset > 1.0) {
            clipState.offset = 0.15;
            clipSlider.value = '0.15';
          }
        }
        this._updateClipUniforms();
      });
    });

    clipSlider.addEventListener('input', (e) => {
      clipState.offset = parseFloat(e.target.value);
      this._updateClipUniforms();
    });

    // Bottom Dock: X-Ray Ghost Toggle
    const xrayBtn = document.getElementById('xray-toggle-btn');
    xrayBtn.addEventListener('click', () => {
      this.xrayCasingMode = !this.xrayCasingMode;
      xrayBtn.classList.toggle('active', this.xrayCasingMode);
      this._applyMaterialStates();
    });

    // Bottom Dock: Skycrane Skeleton Toggle
    const skyBtn = document.getElementById('skycrane-toggle-btn');
    skyBtn.addEventListener('click', () => {
      this.showSkycraneSkeleton = !this.showSkycraneSkeleton;
      skyBtn.classList.toggle('active', this.showSkycraneSkeleton);
      this.skeleton.skycraneGroup.visible = this.showSkycraneSkeleton;
      this.skeleton.rmcsGroup.visible = this.showSkycraneSkeleton;
    });

    // Focus Card Buttons
    document.getElementById('fc-drill-btn').addEventListener('click', () => {
      const subId = this.focusCard.dataset.subsystemId;
      const meta = SUBSYSTEM_META[subId];
      if (meta) {
        this.drillIntoSubsystem({
          subsystemId: meta.id,
          level: meta.level,
          code: meta.code,
          title: meta.title,
          spec: meta.spec,
          camPos: meta.camPos,
          camTarget: meta.camTarget,
        });
      }
    });

    document.getElementById('fc-close-btn').addEventListener('click', () => {
      this.selectSubsystem(null);
    });

    // Pointer Hover & Click / Double-Click Raycasting
    const dom = this.renderer.domElement;
    dom.addEventListener('pointermove', (e) => {
      this.pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
      this.pointer.y = -(e.clientY / window.innerHeight) * 2 + 1;

      this.raycaster.setFromCamera(this.pointer, this.camera);
      const hits = this.raycaster.intersectObjects(this._getAllRaycastTargets(), false);

      if (hits.length > 0) {
        const hitObj = hits[0].object;
        const ud = hitObj.userData;
        dom.style.cursor = 'pointer';

        if (this.hoveredSubsystemId !== ud.subsystemId) {
          this.hoveredSubsystemId = ud.subsystemId;
          if (!this.selectedSubsystemId) {
            this.outlinePass.visibleEdgeColor.setHex(0x38bdf8);
            this.outlinePass.selectedObjects = ud.isMountingPort
              ? [hitObj]
              : this._getSubsystemMeshes(ud.subsystemId);
          }
        }

        this.hoverPill.innerHTML = `<span class="hp-code">${ud.code || ud.level}</span><span class="hp-sep">|</span><span class="hp-title">${ud.title || ud.meshName}</span>`;
        this.hoverPill.style.left = `${Math.min(window.innerWidth - 340, e.clientX + 18)}px`;
        this.hoverPill.style.top = `${Math.max(24, e.clientY - 18)}px`;
        this.hoverPill.classList.remove('hidden');
      } else {
        dom.style.cursor = 'grab';
        this.hoveredSubsystemId = null;
        this.hoverPill.classList.add('hidden');
        if (!this.selectedSubsystemId) {
          this.outlinePass.selectedObjects = [];
        }
      }
    });

    dom.addEventListener('pointerdown', (e) => {
      this.pointerDownPos.set(e.clientX, e.clientY);
    });

    dom.addEventListener('click', (e) => {
      if (this.pointerDownPos.distanceTo(new THREE.Vector2(e.clientX, e.clientY)) > 6) return;
      this.raycaster.setFromCamera(this.pointer, this.camera);
      const hits = this.raycaster.intersectObjects(this._getAllRaycastTargets(), false);
      if (hits.length > 0) {
        this.selectSubsystem(hits[0].object.userData);
      } else {
        this.selectSubsystem(null);
      }
    });

    dom.addEventListener('dblclick', () => {
      this.raycaster.setFromCamera(this.pointer, this.camera);
      const hits = this.raycaster.intersectObjects(this._getAllRaycastTargets(), false);
      if (hits.length > 0) {
        this.drillIntoSubsystem(hits[0].object.userData);
      } else {
        this.setLevel('L0');
      }
    });
  }

  _animate() {
    requestAnimationFrame(() => this._animate());
    const dt = Math.min(this.clock.getDelta(), 0.05);
    const elapsed = this.clock.elapsedTime;

    // 1. Update Fresnel Ghost shader scanlines
    [this.assetLoader.ghostMatOuter, this.assetLoader.ghostMatInner, this.skeleton.aeroGhostMat].forEach((m) => {
      if (m && m.uniforms && m.uniforms.uTime) {
        m.uniforms.uTime.value = elapsed;
      }
    });

    // 2. Pulse L0 RMCS Mounting Ports
    this.skeleton.portMeshes.forEach((pm, idx) => {
      const s = 1.0 + 0.16 * Math.sin(elapsed * 3.4 + idx * 1.4);
      pm.haloRing.scale.setScalar(s);
      pm.haloRing.lookAt(this.camera.position);
      pm.outerSphere.scale.setScalar(0.95 + 0.12 * Math.cos(elapsed * 2.8 + idx));
    });

    // 3. Smoothly interpolate Exploded View & Micro-Pop scaling
    this.explodeCurrent = THREE.MathUtils.lerp(this.explodeCurrent, this.explodeTarget, dt * 8.5);
    this.assetLoader.interactiveMeshes.forEach((mesh) => {
      const ud = mesh.userData;
      mesh.position.copy(ud.basePosition).addScaledVector(ud.explodeVec, this.explodeCurrent);
      const targetS = ud.targetScale || 1.0;
      const curS = THREE.MathUtils.lerp(mesh.scale.x / ud.baseScale.x, targetS, dt * 10.0);
      mesh.scale.copy(ud.baseScale).multiplyScalar(curS);
    });

    // Skycrane also rises slightly when exploding
    if (this.skeleton && this.skeleton.skycraneGroup) {
      this.skeleton.skycraneGroup.position.y = this.explodeCurrent * 0.55;
    }

    // 4. Camera Dolly-In flight interpolation
    if (this.cameraFlight) {
      this.cameraFlight.elapsed += dt;
      const t = Math.min(1.0, this.cameraFlight.elapsed / this.cameraFlight.duration);
      const ease = 1.0 - Math.pow(1.0 - t, 3);
      this.camera.position.lerpVectors(this.cameraFlight.startPos, this.cameraFlight.endPos, ease);
      this.controls.target.lerpVectors(this.cameraFlight.startTarget, this.cameraFlight.endTarget, ease);
      if (t >= 1.0) this.cameraFlight = null;
    }

    this.controls.update();
    this.composer.render();
  }
}

window.marsTwinApp = new Mars2020DigitalTwinApp();
