import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import {
  Layers,
  Sliders,
  RotateCcw,
  Box,
  Cpu,
  CheckCircle2,
  Activity
} from 'lucide-react';
import {
  DrillLevel,
  TwinWorkstationConfig,
  computeClipPlaneConstant,
  computeGhostMaterialState
} from '../utils/manifestUtils';

interface WorkstationTwinViewProps {
  config: TwinWorkstationConfig;
}

interface LoadedTwinPart {
  mesh: THREE.Mesh;
  layer: 'L1' | 'L2' | 'L3';
  basePos: THREE.Vector3;
  baseQuat: THREE.Quaternion;
  explodeDir: THREE.Vector3;
  origMat: THREE.MeshStandardMaterial;
}

export const WorkstationTwinView: React.FC<WorkstationTwinViewProps> = ({ config }) => {
  const [activeLevel, setActiveLevel] = useState<DrillLevel>('L0');
  const [explosion, setExplosion] = useState<number>(0);
  const [clipRatio, setClipRatio] = useState<number>(1.0);
  const [xrayMode, setXrayMode] = useState<boolean>(false);
  const [showSkeleton, setShowSkeleton] = useState<boolean>(true);
  const [autoRotate, setAutoRotate] = useState<boolean>(false);
  const [meshNodes, setMeshNodes] = useState<{ name: string; tris: number; layer: 'L1' | 'L2' | 'L3' }[]>([]);
  const [highlightedPart, setHighlightedPart] = useState<string | null>(null);
  const [isLoadingGlb, setIsLoadingGlb] = useState<boolean>(true);

  // Real-time FK / Subsystem Articulation Sliders
  const [fkJoint1, setFkJoint1] = useState<number>(0);
  const [fkJoint2, setFkJoint2] = useState<number>(0);
  const [fkJoint3, setFkJoint3] = useState<number>(0);

  const mountRef = useRef<HTMLDivElement | null>(null);
  const renderNowRef = useRef<(() => void) | null>(null);
  const partsRef = useRef<LoadedTwinPart[]>([]);
  const layerGroupsRef = useRef<Record<'L1' | 'L2' | 'L3', THREE.Group | null>>({
    L1: null,
    L2: null,
    L3: null
  });
  const skeletonGroupRef = useRef<THREE.Group | null>(null);
  const clipPlaneRef = useRef<THREE.Plane>(new THREE.Plane(new THREE.Vector3(0, -1, 0), 10));
  const controlsRef = useRef<OrbitControls | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const bboxMaxYRef = useRef<number>(2.0);
  const bboxMinYRef = useRef<number>(-2.0);

  const currentLevelSpec =
    config.levels.find((l) => l.level === activeLevel) || config.levels[0];

  useEffect(() => {
    setActiveLevel('L0');
    setExplosion(0);
    setClipRatio(1.0);
    setXrayMode(false);
    setHighlightedPart(null);
    setFkJoint1(0);
    setFkJoint2(0);
    setFkJoint3(0);
  }, [config.id]);

  const handleSelectLevel = (lvl: DrillLevel) => {
    setActiveLevel(lvl);
    const spec = config.levels.find((l) => l.level === lvl);
    if (spec) {
      setExplosion(spec.explosionDefault);
      setClipRatio(spec.clipDefault);
    }
    // Smoothly focus camera on the selected layer's bounding box
    if (controlsRef.current && cameraRef.current) {
      if (lvl === 'L0') {
        controlsRef.current.target.set(0, 0, 0);
        cameraRef.current.position.set(2.4, 1.65, 2.75);
      } else {
        const grp = layerGroupsRef.current[lvl];
        if (grp) {
          const box = new THREE.Box3().setFromObject(grp);
          if (!box.isEmpty()) {
            const center = box.getCenter(new THREE.Vector3());
            controlsRef.current.target.copy(center);
            cameraRef.current.position.set(center.x + 1.9, center.y + 1.25, center.z + 2.15);
          }
        }
      }
      controlsRef.current.update();
      if (renderNowRef.current) renderNowRef.current();
    }
  };

  useEffect(() => {
    if (!mountRef.current) return;
    let disposed = false;
    const container = mountRef.current;
    const width = container.clientWidth || 960;
    const height = container.clientHeight || 640;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x060a12);
    scene.fog = new THREE.FogExp2(0x060a12, 0.045);

    const camera = new THREE.PerspectiveCamera(42, width / height, 0.01, 200);
    camera.position.set(2.4, 1.65, 2.75);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    const gl = renderer.getContext();
    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    const rendererStr = debugInfo ? String(gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL)) : '';
    const isSoftwareGl = /SwiftShader|llvmpipe|Software/i.test(rendererStr);

    renderer.setSize(width, height);
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.localClippingEnabled = true;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.18;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = !isSoftwareGl;
    controls.dampingFactor = 0.08;
    controlsRef.current = controls;

    // Warm/Cool Lighting Contrast
    const hemi = new THREE.HemisphereLight(0xdbeafe, 0x0f172a, 1.2);
    scene.add(hemi);
    const keyLight = new THREE.DirectionalLight(0xfff7ed, 2.5);
    keyLight.position.set(5, 8, 6);
    scene.add(keyLight);
    const rimLight = new THREE.DirectionalLight(0x38bdf8, 1.55);
    rimLight.position.set(-6, 4, -5);
    scene.add(rimLight);

    const grid = new THREE.GridHelper(16, 32, 0x0284c7, 0x1e293b);
    grid.position.y = -0.85;
    scene.add(grid);

    const assemblyRoot = new THREE.Group();
    assemblyRoot.name = `${config.id}_glb_assembly`;
    scene.add(assemblyRoot);

    const skelGroup = new THREE.Group();
    scene.add(skelGroup);
    skeletonGroupRef.current = skelGroup;

    const renderFrame = () => {
      if (!disposed) renderer.render(scene, camera);
    };
    renderNowRef.current = renderFrame;
    controls.addEventListener('change', renderFrame);
    renderFrame();

    // Load all 3 real GLB subsystem files (L1, L2, L3) via GLTFLoader + DRACOLoader
    setIsLoadingGlb(true);
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath('/draco/');
    const loader = new GLTFLoader();
    loader.setDRACOLoader(dracoLoader);
    const loadLayerGlb = (layerKey: 'L1' | 'L2' | 'L3', url: string) =>
      new Promise<{ layerKey: 'L1' | 'L2' | 'L3'; group: THREE.Group }>((resolve, reject) => {
        loader.load(
          url,
          (gltf) => resolve({ layerKey, group: gltf.scene }),
          undefined,
          (err) => reject(err)
        );
      });

    Promise.all([
      loadLayerGlb('L1', config.glbLayers.L1),
      loadLayerGlb('L2', config.glbLayers.L2),
      loadLayerGlb('L3', config.glbLayers.L3)
    ])
      .then((loadedLayers) => {
        if (disposed) return;

        for (const { layerKey, group } of loadedLayers) {
          group.name = `${config.id}_${layerKey}`;
          layerGroupsRef.current[layerKey] = group;
          assemblyRoot.add(group);
        }

        assemblyRoot.updateMatrixWorld(true);
        const box = new THREE.Box3().setFromObject(assemblyRoot);
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z, 0.001);
        const scale = 2.15 / maxDim;

        assemblyRoot.scale.setScalar(scale);
        assemblyRoot.position.sub(center.multiplyScalar(scale));
        assemblyRoot.updateMatrixWorld(true);

        const normBox = new THREE.Box3().setFromObject(assemblyRoot);
        bboxMinYRef.current = normBox.min.y;
        bboxMaxYRef.current = normBox.max.y;
        grid.position.y = normBox.min.y - 0.04;

        const loadedParts: LoadedTwinPart[] = [];
        const nodeList: { name: string; tris: number; layer: 'L1' | 'L2' | 'L3' }[] = [];
        const jointPositions: THREE.Vector3[] = [];

        for (const { layerKey, group } of loadedLayers) {
          group.traverse((obj) => {
            if ((obj as THREE.Mesh).isMesh) {
              const m = obj as THREE.Mesh;
              const geom = m.geometry;
              const tris = geom.index
                ? Math.round(geom.index.count / 3)
                : Math.round((geom.attributes.position?.count || 0) / 3);
              if (tris < 10) return;

              const worldPos = new THREE.Vector3();
              m.getWorldPosition(worldPos);
              jointPositions.push(worldPos.clone());

              const dir = worldPos.clone().normalize();
              if (dir.lengthSq() < 0.01) dir.set(0, 1, 0);

              const baseMat = Array.isArray(m.material) ? m.material[0] : m.material;
              const stdMat = (
                baseMat ? baseMat.clone() : new THREE.MeshStandardMaterial({ color: 0x94a3b8 })
              ) as THREE.MeshStandardMaterial;
              stdMat.clippingPlanes = [clipPlaneRef.current];
              stdMat.clipShadows = true;
              m.material = stdMat;

              const partName = m.name || `${layerKey}_mesh_${loadedParts.length}`;
              if (tris >= 150) {
                nodeList.push({ name: partName, tris, layer: layerKey });
              }

              loadedParts.push({
                mesh: m,
                layer: layerKey,
                basePos: m.position.clone(),
                baseQuat: m.quaternion.clone(),
                explodeDir: dir,
                origMat: stdMat
              });
            }
          });
        }

        nodeList.sort((a, b) => b.tris - a.tris);
        partsRef.current = loadedParts;
        setMeshNodes(nodeList);
        setIsLoadingGlb(false);

        // Build L0 Coordinate Skeleton Overlay using pure LineLoops, AxesHelpers, and LineSegments
        skelGroup.clear();
        const rootAxes = new THREE.AxesHelper(1.25);
        skelGroup.add(rootAxes);

        const ringPts: THREE.Vector3[] = [];
        for (let i = 0; i < 24; i++) {
          const a = (i / 24) * Math.PI * 2;
          ringPts.push(new THREE.Vector3(Math.cos(a) * 0.06, Math.sin(a) * 0.06, 0));
        }
        const ringGeo = new THREE.BufferGeometry().setFromPoints(ringPts);
        const ringMat = new THREE.LineBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.85 });

        const linePts: THREE.Vector3[] = [];
        jointPositions.slice(0, 36).forEach((jp, idx) => {
          const jointRing = new THREE.LineLoop(ringGeo, ringMat);
          jointRing.position.copy(jp);
          skelGroup.add(jointRing);
          const localAxes = new THREE.AxesHelper(0.11);
          localAxes.position.copy(jp);
          skelGroup.add(localAxes);
          if (idx > 0) {
            linePts.push(jointPositions[idx - 1], jp);
          }
        });

        if (linePts.length >= 2) {
          const lineGeo = new THREE.BufferGeometry().setFromPoints(linePts);
          const lineMat = new THREE.LineBasicMaterial({ color: 0xf59e0b, transparent: true, opacity: 0.78 });
          skelGroup.add(new THREE.LineSegments(lineGeo, lineMat));
        }

        renderFrame();
      })
      .catch((err) => {
        console.error('Failed to load workstation GLB layers:', err);
        setIsLoadingGlb(false);
      });

    let reqId = 0;
    const animate = () => {
      if (controlsRef.current && controlsRef.current.autoRotate) {
        controlsRef.current.update();
        renderFrame();
      }
      reqId = requestAnimationFrame(animate);
    };
    reqId = requestAnimationFrame(animate);

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth || 960;
      const h = container.clientHeight || 640;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      renderFrame();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      disposed = true;
      cancelAnimationFrame(reqId);
      controls.removeEventListener('change', renderFrame);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
    };
  }, [config.id, config.glbLayers.L1, config.glbLayers.L2, config.glbLayers.L3]);

  // Reactive update for L0->L3 Ghost Context, Explosion, Clipping, X-Ray, Skeleton, and FK Sliders
  useEffect(() => {
    clipPlaneRef.current.constant = computeClipPlaneConstant(
      bboxMinYRef.current,
      bboxMaxYRef.current,
      clipRatio
    );

    if (skeletonGroupRef.current) {
      skeletonGroupRef.current.visible = showSkeleton;
    }
    if (controlsRef.current) {
      controlsRef.current.autoRotate = autoRotate;
      controlsRef.current.autoRotateSpeed = 2.0;
    }

    const anyHighlighted = Boolean(highlightedPart);

    partsRef.current.forEach(({ mesh, layer, basePos, baseQuat, explodeDir, origMat }) => {
      mesh.position.copy(basePos).addScaledVector(explodeDir, explosion * 0.55);
      mesh.quaternion.copy(baseQuat);

      const n = mesh.name.toLowerCase();
      if (config.id === 'mars2020') {
        if (layer === 'L1' && (n.includes('suspension') || n.includes('wheel'))) {
          const q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), fkJoint1 * 0.35);
          mesh.quaternion.multiply(q);
        } else if (layer === 'L2' && (n.includes('arm') || n.includes('turret'))) {
          const q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), fkJoint2 * 0.6);
          mesh.quaternion.multiply(q);
        } else if (layer === 'L2' && (n.includes('head') || n.includes('navcam') || n.includes('mastcam') || n.includes('top'))) {
          const q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), fkJoint3);
          mesh.quaternion.multiply(q);
        }
      } else {
        // B737 / CFM56-7B articulation
        if (layer === 'L1' && n.includes('thrust_reverser')) {
          mesh.position.x += fkJoint1 * 0.42;
        } else if (layer === 'L2' && (n.includes('n1_wide_chord') || n.includes('lpc'))) {
          const q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), fkJoint2);
          mesh.quaternion.multiply(q);
        } else if (layer === 'L3' && (n.includes('hpt') || n.includes('lpt'))) {
          const q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), fkJoint3);
          mesh.quaternion.multiply(q);
        }
      }

      const isHighlighted = Boolean(highlightedPart && mesh.name === highlightedPart);
      const ghostState = computeGhostMaterialState(
        layer,
        activeLevel,
        isHighlighted,
        anyHighlighted,
        xrayMode
      );

      origMat.wireframe = ghostState.wireframe;
      origMat.transparent = ghostState.transparent;
      origMat.opacity = ghostState.opacity;
      origMat.depthWrite = ghostState.depthWrite;
      if (origMat.emissive) {
        origMat.emissive.setHex(ghostState.emissiveHex);
      }
      origMat.needsUpdate = true;
    });

    if (renderNowRef.current) {
      renderNowRef.current();
    }
  }, [activeLevel, explosion, clipRatio, xrayMode, showSkeleton, autoRotate, highlightedPart, fkJoint1, fkJoint2, fkJoint3, config.id]);

  const fkLabels =
    config.id === 'mars2020'
      ? [
          { label: 'Rocker-Bogie 摇臂俯仰', val: fkJoint1, set: setFkJoint1, min: -0.8, max: 0.8 },
          { label: '5-DOF 采样臂/转塔俯仰', val: fkJoint2, set: setFkJoint2, min: -1.2, max: 1.2 },
          { label: 'Mastcam-Z 遥感桅杆偏航', val: fkJoint3, set: setFkJoint3, min: -1.57, max: 1.57 }
        ]
      : [
          { label: 'C-Duct 叶栅反推罩行程', val: fkJoint1, set: setFkJoint1, min: 0, max: 1.0 },
          { label: 'N1 宽弦风扇/LPC 转角', val: fkJoint2, set: setFkJoint2, min: -3.14, max: 3.14 },
          { label: 'N2 高压涡轮 HPT/LPT 转角', val: fkJoint3, set: setFkJoint3, min: -3.14, max: 3.14 }
        ];

  return (
    <div className="flex h-full w-full" data-testid={`workstation-${config.id}`}>
      {/* Left Sidebar: L0 -> L3 4-Stage Drill-Down Switcher & Engineering Specs */}
      <aside className="w-80 bg-slate-950 border-r border-slate-800 flex flex-col z-10">
        <div className="p-3.5 border-b border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-400/30">
              {config.badge}
            </span>
          </div>
          <h2 className="text-xs font-bold text-slate-100 mt-2 leading-snug">{config.title}</h2>
          <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">{config.subtitle}</p>
        </div>

        {/* L0 -> L3 4-Stage Drill-Down Buttons */}
        <div className="flex-1 overflow-y-auto p-2.5 space-y-2">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-sky-400 px-1 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5" />
            <span>四级工程下钻层级 (L0 → L3 Ghost Context)</span>
          </div>

          {config.levels.map((lvl) => {
            const active = activeLevel === lvl.level;
            return (
              <button
                key={lvl.level}
                onClick={() => handleSelectLevel(lvl.level)}
                className={`w-full text-left p-2.5 rounded-xl border transition ${
                  active
                    ? 'bg-sky-500/15 border-sky-400/60 shadow-md shadow-sky-950/50'
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-100">{lvl.title}</span>
                  {active && <CheckCircle2 className="w-3.5 h-3.5 text-sky-400 shrink-0" />}
                </div>
                <div className="text-[11px] text-sky-300/90 mt-0.5">{lvl.subtitle}</div>
                <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">{lvl.focusDescription}</p>
              </button>
            );
          })}
        </div>

        {/* Engineering Baseline Card */}
        <div className="p-3.5 border-t border-slate-800 bg-slate-900/60 space-y-1.5">
          <div className="text-xs font-semibold text-amber-300 flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5" />
            <span>{activeLevel} 层级关键工程指标</span>
          </div>
          {currentLevelSpec.keyMetrics.map((m) => (
            <div key={m.label} className="flex justify-between text-[11px]">
              <span className="text-slate-400">{m.label}</span>
              <span className="text-slate-200 font-mono">{m.value}</span>
            </div>
          ))}
          <div className="pt-1.5 mt-1.5 border-t border-slate-800/80 space-y-1">
            {config.engineeringSpecs.slice(0, 2).map((s) => (
              <div key={s.label} className="flex justify-between text-[11px]">
                <span className="text-slate-400">{s.label}</span>
                <span className="text-sky-300 font-mono">{s.value}</span>
              </div>
            ))}
          </div>
        </div>
      </aside>

      {/* Center 3D WebGL Viewport */}
      <div className="flex-1 relative bg-[#060a12]">
        <div ref={mountRef} className="w-full h-full" />

        {/* Top-Left Active Drill-Down Telemetry Banner */}
        <div className="absolute top-4 left-4 bg-slate-950/95 border border-slate-800 rounded-xl px-3.5 py-2.5 max-w-md pointer-events-none">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-amber-500/20 border border-amber-400/40 text-amber-300 text-xs font-mono font-bold">
              {activeLevel}
            </span>
            <span className="text-xs font-semibold text-slate-100">{currentLevelSpec.title}</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">{currentLevelSpec.focusDescription}</p>
          {isLoadingGlb && (
            <div className="text-[11px] text-sky-400 font-mono mt-1">
              正在通过 GLTFLoader 加载 L1/L2/L3 真实高精度 GLB 资产...
            </div>
          )}
        </div>

        {/* Bottom Floating Twin Control HUD */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 max-w-[calc(100%-1.5rem)] bg-slate-950/95 border border-sky-500/30 rounded-2xl px-3 py-2 flex items-center gap-2 shadow-2xl whitespace-nowrap">
          <div className="flex items-center gap-1.5 shrink-0">
            <Sliders className="w-3.5 h-3.5 text-sky-400 shrink-0" />
            <label htmlFor={`explode-${config.id}`} className="text-[11px] text-slate-300 whitespace-nowrap">
              爆炸拆解
            </label>
            <input
              id={`explode-${config.id}`}
              aria-label="爆炸拆解比例"
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={explosion}
              onChange={(e) => setExplosion(parseFloat(e.target.value))}
              className="w-16 accent-sky-400"
            />
            <span className="text-[11px] font-mono text-sky-300 w-7 text-right">{Math.round(explosion * 100)}%</span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <label htmlFor={`clip-${config.id}`} className="text-[11px] text-slate-300 whitespace-nowrap">
              剖切面
            </label>
            <input
              id={`clip-${config.id}`}
              aria-label="激光剖切面比例"
              type="range"
              min={0.05}
              max={1}
              step={0.01}
              value={clipRatio}
              onChange={(e) => setClipRatio(parseFloat(e.target.value))}
              className="w-16 accent-amber-400"
            />
            <span className="text-[11px] font-mono text-amber-300 w-7 text-right">{Math.round(clipRatio * 100)}%</span>
          </div>

          <button
            onClick={() => setShowSkeleton(!showSkeleton)}
            className={`px-2 py-1 rounded-lg text-[11px] border whitespace-nowrap shrink-0 transition ${
              showSkeleton
                ? 'bg-amber-500/20 border-amber-400/50 text-amber-300'
                : 'bg-slate-900 border-slate-700 text-slate-400'
            }`}
          >
            L0 骨架: {showSkeleton ? '开' : '关'}
          </button>

          <button
            onClick={() => setXrayMode(!xrayMode)}
            className={`px-2 py-1 rounded-lg text-[11px] border whitespace-nowrap shrink-0 transition ${
              xrayMode
                ? 'bg-sky-500/20 border-sky-400/50 text-sky-300'
                : 'bg-slate-900 border-slate-700 text-slate-400'
            }`}
          >
            X-Ray: {xrayMode ? '开' : '关'}
          </button>

          <button
            onClick={() => setAutoRotate(!autoRotate)}
            className={`px-2 py-1 rounded-lg text-[11px] border whitespace-nowrap shrink-0 transition ${
              autoRotate
                ? 'bg-emerald-500/20 border-emerald-400/50 text-emerald-300'
                : 'bg-slate-900 border-slate-700 text-slate-400'
            }`}
          >
            环绕巡检
          </button>

          <button
            onClick={() => {
              setActiveLevel('L0');
              setExplosion(0);
              setClipRatio(1.0);
              setXrayMode(false);
              setHighlightedPart(null);
              setFkJoint1(0);
              setFkJoint2(0);
              setFkJoint3(0);
            }}
            aria-label="复位视图"
            className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 shrink-0"
            title="复位视图"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Right Sidebar: Sub-Parts Hierarchy Inspector & Subsystem FK Sliders */}
      <aside className="w-80 bg-slate-950 border-l border-slate-800 flex flex-col z-10">
        {/* Subsystem FK Sliders */}
        <div className="p-3.5 border-b border-slate-800 bg-slate-900/40 space-y-2">
          <div className="text-xs font-semibold text-amber-300 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5" />
              <span>分系统机构运动控制 (FK Sliders)</span>
            </span>
            <button
              onClick={() => {
                setFkJoint1(0);
                setFkJoint2(0);
                setFkJoint3(0);
              }}
              className="text-[10px] text-sky-400 hover:underline font-mono"
            >
              归零
            </button>
          </div>
          {fkLabels.map((s) => (
            <div key={s.label} className="space-y-0.5">
              <div className="flex justify-between text-[11px]">
                <span className="text-slate-300">{s.label}</span>
                <span className="text-amber-300 font-mono">{s.val.toFixed(2)} rad</span>
              </div>
              <input
                type="range"
                aria-label={s.label}
                min={s.min}
                max={s.max}
                step={0.02}
                value={s.val}
                onChange={(e) => s.set(parseFloat(e.target.value))}
                className="w-full accent-amber-400 h-1.5"
              />
            </div>
          ))}
        </div>

        <div className="p-3 border-b border-slate-800 flex items-center justify-between">
          <div className="text-xs font-semibold text-sky-400 flex items-center gap-1.5">
            <Box className="w-3.5 h-3.5" />
            <span>GLB 真实子部件层级树 ({meshNodes.length})</span>
          </div>
          {highlightedPart && (
            <button
              onClick={() => setHighlightedPart(null)}
              className="text-[11px] text-amber-400 hover:underline"
            >
              取消高亮
            </button>
          )}
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {meshNodes.map((node, idx) => {
            const isSel = highlightedPart === node.name;
            const isGhost = activeLevel !== 'L0' && node.layer !== activeLevel;
            return (
              <button
                key={`${node.name}_${idx}`}
                onClick={() => setHighlightedPart(isSel ? null : node.name)}
                className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between transition ${
                  isSel
                    ? 'bg-sky-500/25 border border-sky-400/50 text-sky-200'
                    : isGhost
                      ? 'opacity-45 hover:bg-slate-900 text-slate-400'
                      : 'hover:bg-slate-900 text-slate-200'
                }`}
              >
                <div className="flex items-center gap-1.5 min-w-0">
                  <span
                    className={`text-[10px] font-mono px-1 py-0.2 rounded shrink-0 ${
                      node.layer === 'L1'
                        ? 'bg-sky-500/20 text-sky-300'
                        : node.layer === 'L2'
                          ? 'bg-amber-500/20 text-amber-300'
                          : 'bg-rose-500/20 text-rose-300'
                    }`}
                  >
                    {node.layer}
                  </span>
                  <span className="truncate font-mono text-[11px]">{node.name}</span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono shrink-0 ml-2">
                  {node.tris.toLocaleString()} tris
                </span>
              </button>
            );
          })}
        </div>
      </aside>
    </div>
  );
};
