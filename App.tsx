import React, { useState, useEffect, useRef, useMemo } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import {
  Layers,
  Compass,
  Box,
  FileCode,
  Search,
  ExternalLink,
  Sliders,
  RotateCcw,
  Database,
  Activity,
  Rocket,
  Plane,
  Bot
} from 'lucide-react';
import manifestDataRaw from './src/robotics_manifest.json';
import {
  ROBOT_PACKS,
  TWIN_WORKSTATIONS,
  RobotPack,
  ManifestRepo,
  DrillLevel,
  UrdfJointDef,
  filterRepositories,
  parseKinematicStats,
  parseUrdfJoints,
  classifyMeshLayer,
  computeGhostMaterialState,
  computeClipPlaneConstant
} from './src/utils/manifestUtils';
import { WorkstationTwinView } from './src/components/WorkstationTwinView';

const manifestData = manifestDataRaw as ManifestRepo[];

type MainTab = 'hangar_3d' | 'mars2020' | 'b737_cfm56' | 'b737_bridge' | 'urdf_explorer';

interface LoadedRobotPart {
  mesh: THREE.Mesh;
  layer: 'L1' | 'L2' | 'L3';
  basePos: THREE.Vector3;
  explodeDir: THREE.Vector3;
  origMat: THREE.MeshStandardMaterial;
}

interface BoundUrdfJoint {
  def: UrdfJointDef;
  targetNode: THREE.Object3D;
  basePos: THREE.Vector3;
  baseQuat: THREE.Quaternion;
}

const HANGAR_DRILL_LEVELS: { level: DrillLevel; label: string; desc: string }[] = [
  { level: 'L0', label: 'L0 · 整机总成与URDF关节骨架', desc: '全层级实体显示 + URDF 局部坐标轴系与连杆拓扑' },
  { level: 'L1', label: 'L1 · 底盘/车体/主承力外壳', desc: '聚焦底盘与主推进构型，L2/L3 自动切换为幽灵上下文 (opacity: 0.12)' },
  { level: 'L2', label: 'L2 · 越障摆臂/机械臂/四足连杆', desc: '聚焦 Flippers 摆臂、6-DOF/7-DOF 机械臂与腿部连杆，其余幽灵化' },
  { level: 'L3', label: 'L3 · 关节电机/激光雷达/声呐末端', desc: '下钻至 motor 电机、LiDAR 雷达、Ping360 声呐与灵巧手末端' }
];

export default function App() {
  const [activeTab, setActiveTab] = useState<MainTab>('hangar_3d');
  const [selectedPack, setSelectedPack] = useState<RobotPack>(ROBOT_PACKS[0]);
  const [activeDrillLevel, setActiveDrillLevel] = useState<DrillLevel>('L0');
  const [explosion, setExplosion] = useState<number>(0);
  const [clipRatio, setClipRatio] = useState<number>(1.0);
  const [xrayMode, setXrayMode] = useState<boolean>(false);
  const [showSkeleton, setShowSkeleton] = useState<boolean>(true);
  const [autoRotate, setAutoRotate] = useState<boolean>(false);
  const [meshNodes, setMeshNodes] = useState<{ name: string; tris: number; layer: 'L1' | 'L2' | 'L3' }[]>([]);
  const [highlightedPart, setHighlightedPart] = useState<string | null>(null);
  const [isLoadingGlb, setIsLoadingGlb] = useState<boolean>(true);

  // Parsed URDF Joints & FK Slider Angles (rad)
  const [urdfJoints, setUrdfJoints] = useState<UrdfJointDef[]>([]);
  const [jointAngles, setJointAngles] = useState<Record<string, number>>({});

  // URDF / XML Baseline Explorer state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedRepo, setSelectedRepo] = useState<ManifestRepo>(manifestData[0]);
  const [selectedFileRel, setSelectedFileRel] = useState<string>(
    manifestData[0]?.primaryBaselineFile || ''
  );
  const [fileContent, setFileContent] = useState<string>('正在加载原始基准文件...');

  const mountRef = useRef<HTMLDivElement | null>(null);
  const renderNowRef = useRef<(() => void) | null>(null);
  const partsRef = useRef<LoadedRobotPart[]>([]);
  const boundJointsRef = useRef<BoundUrdfJoint[]>([]);
  const rebuildSkeletonRef = useRef<(() => void) | null>(null);
  const skeletonGroupRef = useRef<THREE.Group | null>(null);
  const clipPlaneRef = useRef<THREE.Plane>(new THREE.Plane(new THREE.Vector3(0, -1, 0), 10));
  const controlsRef = useRef<OrbitControls | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const bboxMaxYRef = useRef<number>(2.0);
  const bboxMinYRef = useRef<number>(-2.0);

  // Fetch and parse real .urdf / .xacro file for the selected robot pack
  useEffect(() => {
    const urdfPath = encodeURI(`/baselines/${selectedPack.baselineRepo}/${selectedPack.primaryUrdf}`);
    let cancelled = false;
    fetch(urdfPath)
      .then((r) => (r.ok ? r.text() : ''))
      .then((xmlText) => {
        if (cancelled) return;
        const parsed = parseUrdfJoints(xmlText);
        setUrdfJoints(parsed);
        setJointAngles({});
      })
      .catch(() => {
        if (!cancelled) {
          setUrdfJoints([]);
          setJointAngles({});
        }
      });
    return () => {
      cancelled = true;
    };
  }, [selectedPack]);

  // Load raw URDF/XML/MD file content in Baseline Explorer
  useEffect(() => {
    if (!selectedRepo || !selectedFileRel) return;
    const rawPath = `/baselines/${selectedRepo.category}/${selectedRepo.repository}/${selectedFileRel}`;
    const url = encodeURI(rawPath);
    let cancelled = false;
    setFileContent(`正在读取原装基准文件: ${rawPath} ...`);

    fetch(url)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.text();
      })
      .then((txt) => {
        if (cancelled) return;
        if (txt.trim().startsWith('<!DOCTYPE html>')) {
          setFileContent(
            `<?xml version="1.0" encoding="utf-8"?>\n<!-- 原装基准索引: ${selectedRepo.repository} / ${selectedFileRel} -->\n<!-- 分类: ${selectedRepo.category} | 拓扑统计: ${selectedRepo.linksAndJoints || '标准运动学基准'} -->\n<!-- GitHub 源库: ${selectedRepo.upstreamUrl} -->\n<robot name="${selectedRepo.repository}">\n  <link name="base_link"/>\n</robot>`
          );
        } else {
          setFileContent(txt.slice(0, 120000));
        }
      })
      .catch((err) => {
        if (cancelled) return;
        setFileContent(
          `读取提示 (${err.message})：可从右侧直接打开或从 GitHub 仓库查看完整文件。\n路径: ${rawPath}`
        );
      });

    return () => {
      cancelled = true;
    };
  }, [selectedRepo, selectedFileRel]);

  // Smooth camera framing when switching L0 -> L1 -> L2 -> L3 in Hangar
  const handleSelectDrillLevel = (lvl: DrillLevel) => {
    setActiveDrillLevel(lvl);
    if (!controlsRef.current || !cameraRef.current) return;
    if (lvl === 'L0') {
      controlsRef.current.target.set(0, 0, 0);
      cameraRef.current.position.set(2.35, 1.65, 2.75);
    } else {
      const layerMeshes = partsRef.current.filter((p) => p.layer === lvl).map((p) => p.mesh);
      if (layerMeshes.length > 0) {
        const box = new THREE.Box3();
        layerMeshes.forEach((m) => box.expandByObject(m));
        if (!box.isEmpty()) {
          const center = box.getCenter(new THREE.Vector3());
          controlsRef.current.target.copy(center);
          cameraRef.current.position.set(center.x + 1.75, center.y + 1.15, center.z + 2.0);
        }
      }
    }
    controlsRef.current.update();
    if (renderNowRef.current) renderNowRef.current();
  };

  // Initialize Three.js Mega-Hangar Viewport & Load Real GLB via GLTFLoader
  useEffect(() => {
    if (activeTab !== 'hangar_3d' || !mountRef.current) return;
    let disposed = false;
    const container = mountRef.current;
    const width = container.clientWidth || 960;
    const height = container.clientHeight || 640;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x060a12);
    scene.fog = new THREE.FogExp2(0x060a12, 0.045);

    const camera = new THREE.PerspectiveCamera(42, width / height, 0.01, 200);
    camera.position.set(2.35, 1.65, 2.75);
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
    renderer.toneMappingExposure = 1.2;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = !isSoftwareGl;
    controls.dampingFactor = 0.06;
    controlsRef.current = controls;

    // Warm/Cool Hangar Lighting & Floor Grid
    const hemi = new THREE.HemisphereLight(0xdbeafe, 0x0f172a, 1.2);
    scene.add(hemi);
    const keyLight = new THREE.DirectionalLight(0xfff7ed, 2.55);
    keyLight.position.set(5, 8, 6);
    scene.add(keyLight);
    const rimLight = new THREE.DirectionalLight(0x38bdf8, 1.65);
    rimLight.position.set(-6, 4, -5);
    scene.add(rimLight);
    const bottomLight = new THREE.DirectionalLight(0x0ea5e9, 0.75);
    bottomLight.position.set(0, -5, 2);
    scene.add(bottomLight);

    const grid = new THREE.GridHelper(16, 32, 0x0284c7, 0x1e293b);
    grid.position.y = -0.85;
    scene.add(grid);

    // Hangar Bay Calibration Perimeter Ring (pure LineLoop, zero primitive geometry)
    const bayRingPts: THREE.Vector3[] = [];
    for (let i = 0; i < 64; i++) {
      const a = (i / 64) * Math.PI * 2;
      bayRingPts.push(new THREE.Vector3(Math.cos(a) * 1.62, 0, Math.sin(a) * 1.62));
    }
    const bayRing = new THREE.LineLoop(
      new THREE.BufferGeometry().setFromPoints(bayRingPts),
      new THREE.LineBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.48 })
    );
    bayRing.position.y = -0.83;
    scene.add(bayRing);

    const modelRoot = new THREE.Group();
    scene.add(modelRoot);

    const skelGroup = new THREE.Group();
    scene.add(skelGroup);
    skeletonGroupRef.current = skelGroup;

    const renderFrame = () => {
      if (!disposed) renderer.render(scene, camera);
    };
    renderNowRef.current = renderFrame;
    controls.addEventListener('change', renderFrame);
    renderFrame();

    // Load Real High-Poly GLB Asset via GLTFLoader (Y-up native, no rotation.x override)
    setIsLoadingGlb(true);
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath('/draco/');
    const gltfLoader = new GLTFLoader();
    gltfLoader.setDRACOLoader(dracoLoader);
    gltfLoader.load(
      selectedPack.glbUrl,
      (gltf) => {
        if (disposed) return;
        const root = gltf.scene;
        root.updateMatrixWorld(true);

        const box = new THREE.Box3().setFromObject(root);
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z, 0.001);
        const scale = 2.05 / maxDim;

        root.scale.setScalar(scale);
        root.position.sub(center.multiplyScalar(scale));
        root.updateMatrixWorld(true);

        const normBox = new THREE.Box3().setFromObject(root);
        bboxMinYRef.current = normBox.min.y;
        bboxMaxYRef.current = normBox.max.y;
        grid.position.y = normBox.min.y - 0.04;
        bayRing.position.y = normBox.min.y - 0.02;

        const loadedParts: LoadedRobotPart[] = [];
        const nodeList: { name: string; tris: number; layer: 'L1' | 'L2' | 'L3' }[] = [];
        const objectByName = new Map<string, THREE.Object3D>();

        root.traverse((obj) => {
          if (obj.name) {
            objectByName.set(obj.name, obj);
            objectByName.set(obj.name.toLowerCase(), obj);
          }
          if ((obj as THREE.Mesh).isMesh) {
            const m = obj as THREE.Mesh;
            const geom = m.geometry;
            const tris = geom.index
              ? Math.round(geom.index.count / 3)
              : Math.round((geom.attributes.position?.count || 0) / 3);
            if (tris < 10) return;

            const worldPos = new THREE.Vector3();
            m.getWorldPosition(worldPos);
            const dir = worldPos.clone().normalize();
            if (dir.lengthSq() < 0.01) dir.set(0, 1, 0);

            const baseMat = Array.isArray(m.material) ? m.material[0] : m.material;
            const stdMat = (
              baseMat ? baseMat.clone() : new THREE.MeshStandardMaterial({ color: 0x94a3b8 })
            ) as THREE.MeshStandardMaterial;
            stdMat.clippingPlanes = [clipPlaneRef.current];
            stdMat.clipShadows = true;
            m.material = stdMat;

            const partName = m.name || `cad_mesh_${loadedParts.length}`;
            const layer = classifyMeshLayer(partName);
            if (tris >= 150) {
              nodeList.push({ name: partName, tris, layer });
            }

            loadedParts.push({
              mesh: m,
              layer,
              basePos: m.position.clone(),
              explodeDir: dir,
              origMat: stdMat
            });
          }
        });

        modelRoot.add(root);
        partsRef.current = loadedParts;
        setMeshNodes(nodeList);
        setIsLoadingGlb(false);

        // Bind parsed URDF joints to the real gltf.scene nodes & build L0 Coordinate Skeleton
        const buildSkeletonAndBindJoints = () => {
          skelGroup.clear();
          const rootAxes = new THREE.AxesHelper(1.25);
          skelGroup.add(rootAxes);

          const circlePts: THREE.Vector3[] = [];
          for (let i = 0; i < 28; i++) {
            const a = (i / 28) * Math.PI * 2;
            circlePts.push(new THREE.Vector3(Math.cos(a) * 0.065, Math.sin(a) * 0.065, 0));
          }
          const ringGeo = new THREE.BufferGeometry().setFromPoints(circlePts);
          const ringMat = new THREE.LineBasicMaterial({
            color: 0x38bdf8,
            transparent: true,
            opacity: 0.88
          });

          const linePts: THREE.Vector3[] = [];
          root.updateMatrixWorld(true);

          if (boundJointsRef.current.length === 0 && urdfJoints.length > 0) {
            const bindings: BoundUrdfJoint[] = [];
            for (const j of urdfJoints) {
              const cleanChild = j.child.replace(/^\//, '');
              const target =
                objectByName.get(cleanChild) ||
                objectByName.get(cleanChild.toLowerCase()) ||
                Array.from(objectByName.entries()).find(([k]) => k.toLowerCase().includes(cleanChild.toLowerCase()))?.[1];
              if (target) {
                bindings.push({
                  def: j,
                  targetNode: target,
                  basePos: target.position.clone(),
                  baseQuat: target.quaternion.clone()
                });
              }
            }
            boundJointsRef.current = bindings;
          }

          if (boundJointsRef.current.length > 0) {
            for (const b of boundJointsRef.current) {
              const childWorld = new THREE.Vector3();
              b.targetNode.getWorldPosition(childWorld);

              const localAxes = new THREE.AxesHelper(0.12);
              localAxes.position.copy(childWorld);
              skelGroup.add(localAxes);

              const jointRing = new THREE.LineLoop(ringGeo, ringMat);
              jointRing.position.copy(childWorld);
              const worldQuat = new THREE.Quaternion();
              b.targetNode.getWorldQuaternion(worldQuat);
              jointRing.quaternion.copy(worldQuat);
              skelGroup.add(jointRing);

              if (b.targetNode.parent) {
                const parentWorld = new THREE.Vector3();
                b.targetNode.parent.getWorldPosition(parentWorld);
                linePts.push(parentWorld, childWorld);
              }
            }
          } else {
            loadedParts.slice(0, 36).forEach((p, idx) => {
              const wp = new THREE.Vector3();
              p.mesh.getWorldPosition(wp);
              const localAxes = new THREE.AxesHelper(0.11);
              localAxes.position.copy(wp);
              skelGroup.add(localAxes);
              const jointRing = new THREE.LineLoop(ringGeo, ringMat);
              jointRing.position.copy(wp);
              skelGroup.add(jointRing);
              if (idx > 0) {
                const prevWp = new THREE.Vector3();
                loadedParts[idx - 1].mesh.getWorldPosition(prevWp);
                linePts.push(prevWp, wp);
              }
            });
          }

          if (linePts.length >= 2) {
            const lineGeo = new THREE.BufferGeometry().setFromPoints(linePts);
            const lineMat = new THREE.LineBasicMaterial({
              color: 0xf59e0b,
              transparent: true,
              opacity: 0.82
            });
            skelGroup.add(new THREE.LineSegments(lineGeo, lineMat));
          }
        };

        boundJointsRef.current = [];
        rebuildSkeletonRef.current = buildSkeletonAndBindJoints;
        buildSkeletonAndBindJoints();
        renderFrame();
      },
      undefined,
      (err) => {
        console.error('Failed to load robot GLB:', err);
        setIsLoadingGlb(false);
      }
    );

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
  }, [activeTab, selectedPack]);

  // Re-bind URDF joints whenever urdfJoints finishes loading
  useEffect(() => {
    boundJointsRef.current = [];
    if (rebuildSkeletonRef.current) {
      rebuildSkeletonRef.current();
    }
    if (renderNowRef.current) {
      renderNowRef.current();
    }
  }, [urdfJoints]);

  // Reactive update for L0->L3 Ghost Context, Joint FK Sliders, Explosion, Clipping, X-Ray, and Part Highlight
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

    // 1. Apply Explosion & L0->L3 Ghost Context Material State to all loaded GLB meshes
    partsRef.current.forEach(({ mesh, layer, basePos, explodeDir, origMat }) => {
      mesh.position.copy(basePos).addScaledVector(explodeDir, explosion * 0.45);
      const isHighlighted = Boolean(highlightedPart && mesh.name === highlightedPart);
      const ghostState = computeGhostMaterialState(
        layer,
        activeDrillLevel,
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

    // 2. Apply Real URDF Forward Kinematics (Joint FK Sliders) to bound GLB nodes
    boundJointsRef.current.forEach(({ def, targetNode, basePos, baseQuat }) => {
      const val = jointAngles[def.name] || 0;
      const axisVec = new THREE.Vector3(def.axis[0], def.axis[1], def.axis[2]).normalize();
      if (def.type === 'prismatic') {
        targetNode.position.copy(basePos).addScaledVector(axisVec, val);
      } else if (def.type === 'revolute' || def.type === 'continuous') {
        const deltaQ = new THREE.Quaternion().setFromAxisAngle(axisVec, val);
        targetNode.quaternion.copy(baseQuat).multiply(deltaQ);
      }
    });

    if (rebuildSkeletonRef.current) {
      rebuildSkeletonRef.current();
    }

    if (renderNowRef.current) {
      renderNowRef.current();
    }
  }, [activeDrillLevel, explosion, clipRatio, xrayMode, showSkeleton, autoRotate, highlightedPart, jointAngles, selectedPack]);

  const movableJoints = useMemo(() => {
    const nonFixed = urdfJoints.filter((j) => j.type !== 'fixed');
    nonFixed.sort((a, b) => {
      const score = (j: UrdfJointDef) => {
        const n = j.name.toLowerCase();
        if (n.includes('f_front') || n.includes('f_back') || n.includes('flipper')) return 0;
        if (j.type === 'revolute') return 1;
        return 2;
      };
      return score(a) - score(b);
    });
    return nonFixed.slice(0, 16);
  }, [urdfJoints]);

  const filteredRepos = useMemo(
    () => filterRepositories(manifestData, searchQuery),
    [searchQuery]
  );

  const fileKinematicStats = useMemo(
    () => parseKinematicStats(fileContent, selectedFileRel),
    [fileContent, selectedFileRel]
  );

  return (
    <div className="flex flex-col h-screen w-screen bg-[#060a12] text-slate-100 select-none overflow-hidden">
      {/* Top Sci-Fi Mega-Hangar Navigation Header */}
      <header className="flex items-center justify-between gap-4 px-4 py-2 bg-slate-950 border-b border-sky-500/25 z-20">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-sky-500/15 border border-sky-400/40 flex items-center justify-center text-sky-400 shrink-0">
            <Compass className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="font-bold tracking-wider text-xs sm:text-sm text-sky-50 truncate">
                MEGA-HANGAR · 陆海空天与具身智能数字孪生总控穹顶
              </h1>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-400/30 font-mono whitespace-nowrap shrink-0">
                GLB + URDF L0→L3
              </span>
            </div>
            <p className="text-[11px] text-slate-400 truncate">
              100% GLTFLoader 真机高精度 GLB 资产 · URDF 关节运动学驱动 · L0→L3 幽灵上下文四级下钻 · 39库 (1,138个 URDF/XML)
            </p>
          </div>
        </div>

        {/* 5 Workstation Bay Switcher */}
        <nav aria-label="主工作站切换" className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 shrink-0">
          <button
            onClick={() => setActiveTab('hangar_3d')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition ${
              activeTab === 'hangar_3d'
                ? 'bg-sky-500 text-slate-950 shadow-lg shadow-sky-500/25 font-semibold'
                : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Bot className="w-3.5 h-3.5 shrink-0" />
            <span>具身与特种机库 (6大真机GLB)</span>
          </button>

          <button
            onClick={() => setActiveTab('mars2020')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition ${
              activeTab === 'mars2020'
                ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/25 font-semibold'
                : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Rocket className="w-3.5 h-3.5 shrink-0" />
            <span>深空工位 · 毅力号火星车 (L0→L3)</span>
          </button>

          <button
            onClick={() => setActiveTab('b737_cfm56')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition ${
              activeTab === 'b737_cfm56'
                ? 'bg-cyan-400 text-slate-950 shadow-lg shadow-cyan-400/25 font-semibold'
                : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Plane className="w-3.5 h-3.5 shrink-0" />
            <span>航空工位 · B737与CFM56涡扇 (L0→L3)</span>
          </button>

          <button
            onClick={() => setActiveTab('b737_bridge')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition ${
              activeTab === 'b737_bridge'
                ? 'bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-400/25 font-semibold'
                : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Activity className="w-3.5 h-3.5 shrink-0" />
            <span>工程骨架母树 · 航空传力拓扑</span>
          </button>

          <button
            onClick={() => setActiveTab('urdf_explorer')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition ${
              activeTab === 'urdf_explorer'
                ? 'bg-purple-400 text-slate-950 shadow-lg shadow-purple-400/25 font-semibold'
                : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Database className="w-3.5 h-3.5 shrink-0" />
            <span>39库 URDF/XML 现实基准源码仓</span>
          </button>
        </nav>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 relative overflow-hidden">
        {/* TAB 1: 6 Embodied & Subsea Robotics 3D Digital Twin Hangar */}
        {activeTab === 'hangar_3d' && (
          <div className="flex h-full w-full">
            {/* Left Sidebar: L0->L3 Drill-Down + 6 Flagship Robotics Testbed Bays */}
            <aside className="w-80 bg-slate-950 border-r border-slate-800 flex flex-col z-10">
              {/* Pinned L0 -> L3 Four-Stage Drill-Down Switcher */}
              <div className="p-2.5 border-b border-slate-800 bg-slate-900/50 space-y-1.5">
                <div className="text-[11px] font-semibold text-amber-300 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-sky-400" />
                    <span>四级工程下钻 (L0 → L3 Ghost Context)</span>
                  </span>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300">
                    {activeDrillLevel}
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-1">
                  {HANGAR_DRILL_LEVELS.map((d) => {
                    const isAct = activeDrillLevel === d.level;
                    return (
                      <button
                        key={d.level}
                        data-testid={`hangar-drill-${d.level}`}
                        onClick={() => handleSelectDrillLevel(d.level)}
                        className={`py-1 px-2 rounded-lg text-xs font-mono font-bold border transition ${
                          isAct
                            ? 'bg-amber-500/25 border-amber-400 text-amber-200 shadow-sm'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        {d.level}
                      </button>
                    );
                  })}
                </div>
                <p className="text-[10px] text-slate-400 leading-snug">
                  {HANGAR_DRILL_LEVELS.find((d) => d.level === activeDrillLevel)?.desc}
                </p>
              </div>

              <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
                {ROBOT_PACKS.map((pack) => {
                  const active = pack.id === selectedPack.id;
                  return (
                    <button
                      key={pack.id}
                      onClick={() => {
                        setSelectedPack(pack);
                        setActiveDrillLevel('L0');
                        setHighlightedPart(null);
                      }}
                      className={`w-full text-left p-2 rounded-xl border transition flex gap-2.5 items-center ${
                        active
                          ? 'bg-sky-500/15 border-sky-400/60 shadow-md shadow-sky-950/50'
                          : 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700'
                      }`}
                    >
                      <img
                        src={pack.previewUrl}
                        alt={pack.name}
                        className="w-14 h-10 object-cover rounded-lg bg-slate-950 border border-slate-800 shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-sky-300 font-mono">
                            {pack.category}
                          </span>
                        </div>
                        <div className="text-xs font-semibold text-slate-100 truncate mt-0.5">{pack.name}</div>
                        <div className="text-[11px] text-slate-400 truncate">{pack.subtitle}</div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Selected Robot Reality Baseline Spec Card */}
              <div className="p-2.5 border-t border-slate-800 bg-slate-900/60 space-y-1">
                <div className="text-xs font-semibold text-amber-300 flex items-center justify-between">
                  <span>现实基准真值 (Reality Baseline)</span>
                  <a
                    href={selectedPack.upstreamUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-sky-400 hover:underline flex items-center gap-1"
                  >
                    <span>GitHub 源库</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                {selectedPack.specs.map((s) => (
                  <div key={s.label} className="flex justify-between text-[11px]">
                    <span className="text-slate-400">{s.label}</span>
                    <span className="text-slate-200 font-mono">{s.value}</span>
                  </div>
                ))}
                <button
                  onClick={() => {
                    const found = manifestData.find((r) =>
                      selectedPack.baselineRepo.includes(r.repository)
                    );
                    if (found) {
                      setSelectedRepo(found);
                      setSelectedFileRel(found.primaryBaselineFile || '');
                    }
                    setActiveTab('urdf_explorer');
                  }}
                  className="w-full mt-1 py-1 px-2.5 rounded-lg bg-sky-500/20 hover:bg-sky-500/30 border border-sky-400/40 text-sky-300 text-xs font-medium flex items-center justify-center gap-1.5 transition"
                >
                  <FileCode className="w-3.5 h-3.5" />
                  <span>查看原装 URDF / XML 运动学源码</span>
                </button>
              </div>
            </aside>

            {/* Center 3D WebGL Viewport */}
            <div className="flex-1 relative bg-[#060a12]">
              <div ref={mountRef} className="w-full h-full" data-testid="hangar-viewport" />

              {/* Top-Left Active Robot Telemetry Badge */}
              <div className="absolute top-3 left-3 bg-slate-950/95 border border-slate-800 rounded-xl px-3 py-2 max-w-md pointer-events-none">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-sky-500/20 border border-sky-400/40 text-sky-300 text-[11px] font-mono">
                    {selectedPack.category} · {activeDrillLevel}
                  </span>
                  <span className="text-xs font-semibold text-slate-100">{selectedPack.name}</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">{selectedPack.subtitle}</p>
                <div className="text-[10px] font-mono text-emerald-400 mt-0.5">
                  GLB 资产: {selectedPack.glbUrl} ({urdfJoints.length} URDF Joints 已绑定)
                </div>
                {isLoadingGlb && (
                  <div className="text-[11px] text-amber-300 font-mono mt-0.5">
                    正在通过 GLTFLoader 加载高精度 GLB 网格...
                  </div>
                )}
              </div>

              {/* Bottom Floating Twin Control HUD */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 max-w-[calc(100%-1.5rem)] bg-slate-950/95 border border-sky-500/30 rounded-2xl px-3 py-2 flex items-center gap-2 shadow-2xl whitespace-nowrap">
                <div className="flex items-center gap-1.5 shrink-0">
                  <Sliders className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                  <label htmlFor="hangar-explosion-range" className="text-[11px] text-slate-300 whitespace-nowrap">
                    爆炸拆解
                  </label>
                  <input
                    id="hangar-explosion-range"
                    aria-label="爆炸拆解"
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
                  <label htmlFor="hangar-clip-range" className="text-[11px] text-slate-300 whitespace-nowrap">
                    剖切面
                  </label>
                  <input
                    id="hangar-clip-range"
                    aria-label="激光剖切面"
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
                    setActiveDrillLevel('L0');
                    setExplosion(0);
                    setClipRatio(1.0);
                    setXrayMode(false);
                    setHighlightedPart(null);
                    setJointAngles({});
                  }}
                  aria-label="复位视图"
                  className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 shrink-0"
                  title="复位视图"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Right Sidebar: Real URDF Joint FK Sliders + GLB Sub-Parts Hierarchy Tree */}
            <aside className="w-80 bg-slate-950 border-l border-slate-800 flex flex-col z-10">
              {/* Real URDF Joint FK Control Panel */}
              <div className="p-3 border-b border-slate-800 bg-slate-900/40 flex flex-col max-h-64">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-xs font-semibold text-amber-300 flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5" />
                    <span>URDF 关节运动学驱动 (Joint FK)</span>
                  </div>
                  <button
                    onClick={() => setJointAngles({})}
                    className="text-[10px] text-sky-400 hover:underline font-mono"
                  >
                    全部归零
                  </button>
                </div>
                <div className="overflow-y-auto space-y-2 pr-1">
                  {movableJoints.map((j) => {
                    const val = jointAngles[j.name] || 0;
                    const min = j.type === 'continuous' ? -Math.PI : j.lower;
                    const max = j.type === 'continuous' ? Math.PI : j.upper;
                    return (
                      <div key={j.name} className="space-y-0.5">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-mono text-slate-200 truncate" title={`${j.name} (${j.parent} -> ${j.child})`}>
                            {j.name}
                          </span>
                          <span className="font-mono text-amber-300 text-[10px] shrink-0">
                            {val.toFixed(2)} rad
                          </span>
                        </div>
                        <input
                          type="range"
                          aria-label={`关节 ${j.name}`}
                          min={min}
                          max={max}
                          step={0.02}
                          value={val}
                          onChange={(e) =>
                            setJointAngles((prev) => ({
                              ...prev,
                              [j.name]: parseFloat(e.target.value)
                            }))
                          }
                          className="w-full accent-amber-400 h-1.5"
                        />
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Real GLB Mesh Hierarchy Tree */}
              <div className="p-3 border-b border-slate-800 flex items-center justify-between">
                <div className="text-xs font-semibold text-sky-400 flex items-center gap-1.5">
                  <Box className="w-3.5 h-3.5" />
                  <span>整机子部件层级树 ({meshNodes.length})</span>
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
                  const isGhost = activeDrillLevel !== 'L0' && node.layer !== activeDrillLevel;
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
        )}

        {/* TAB 2: NASA Mars 2020 Perseverance L0-L3 Digital Twin */}
        {activeTab === 'mars2020' && <WorkstationTwinView config={TWIN_WORKSTATIONS.mars2020} />}

        {/* TAB 3: Boeing 737-800 & CFM56-7B Turbofan L0-L3 Digital Twin */}
        {activeTab === 'b737_cfm56' && <WorkstationTwinView config={TWIN_WORKSTATIONS.b737_cfm56} />}

        {/* TAB 4: Aerospace Structural Load Master Skeleton */}
        {activeTab === 'b737_bridge' && <WorkstationTwinView config={TWIN_WORKSTATIONS.b737_bridge} />}

        {/* TAB 5: 39 Open-Source Robotics Repositories URDF / XML Reality Baseline Explorer */}
        {activeTab === 'urdf_explorer' && (
          <div className="flex h-full w-full">
            {/* Left Column: 39 Repositories Filterable List */}
            <aside className="w-80 bg-slate-950 border-r border-slate-800 flex flex-col">
              <div className="p-3 border-b border-slate-800">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    aria-label="搜索 39 个机器人库"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="搜索 39 个机器人库 (如 unitree, rov, spot, urdf)..."
                    className="w-full pl-8 pr-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-sky-400"
                  />
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
                {filteredRepos.map((repo) => {
                  const active = selectedRepo?.repository === repo.repository;
                  return (
                    <button
                      key={repo.repository}
                      onClick={() => {
                        setSelectedRepo(repo);
                        setSelectedFileRel(
                          repo.primaryBaselineFile || repo.kinematicFiles?.[0] || repo.docFiles?.[0] || ''
                        );
                      }}
                      className={`w-full text-left p-2.5 rounded-xl border transition ${
                        active
                          ? 'bg-purple-500/15 border-purple-400/60 text-slate-100'
                          : 'bg-slate-900/50 border-slate-800/80 hover:border-slate-700 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-bold text-purple-300">{repo.repository}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                          {repo.kinematicFileCount} 基准 / {repo.docFileCount} 文档
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 line-clamp-2 mt-1">{repo.description}</p>
                    </button>
                  );
                })}
              </div>
            </aside>

            {/* Middle Column: Untouched URDF / XML / XACRO / README File List */}
            <aside className="w-80 bg-slate-950/60 border-r border-slate-800 flex flex-col">
              {selectedRepo && (
                <>
                  <div className="p-3.5 border-b border-slate-800 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-100">{selectedRepo.repository}</span>
                      <a
                        href={selectedRepo.upstreamUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] text-sky-400 hover:underline flex items-center gap-1"
                      >
                        <span>GitHub</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                    <p className="text-[11px] text-slate-400">{selectedRepo.description}</p>
                    {selectedRepo.primaryBaselineFile && (
                      <div className="pt-1">
                        <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono">
                          首选基准: {selectedRepo.primaryBaselineFile}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex-1 overflow-y-auto p-2 space-y-3">
                    <div>
                      <div className="px-2 py-1 text-[11px] font-semibold text-sky-400 uppercase">
                        原装运动学基准文件 (.urdf / .xml / .xacro) [{selectedRepo.kinematicFiles?.length || 0}]
                      </div>
                      <div className="space-y-0.5 mt-1">
                        {(selectedRepo.kinematicFiles || []).map((f) => (
                          <button
                            key={f}
                            onClick={() => setSelectedFileRel(f)}
                            className={`w-full text-left px-2.5 py-1.5 rounded-lg text-[11px] font-mono truncate transition ${
                              selectedFileRel === f
                                ? 'bg-sky-500/20 text-sky-300 border border-sky-400/40'
                                : 'text-slate-300 hover:bg-slate-900'
                            }`}
                          >
                            {f}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <div className="px-2 py-1 text-[11px] font-semibold text-amber-400 uppercase">
                        结构说明文档与关节配置 (README / YAML) [{selectedRepo.docFiles?.length || 0}]
                      </div>
                      <div className="space-y-0.5 mt-1">
                        {(selectedRepo.docFiles || []).map((f) => (
                          <button
                            key={f}
                            onClick={() => setSelectedFileRel(f)}
                            className={`w-full text-left px-2.5 py-1.5 rounded-lg text-[11px] font-mono truncate transition ${
                              selectedFileRel === f
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-400/40'
                                : 'text-slate-300 hover:bg-slate-900'
                            }`}
                          >
                            {f}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </aside>

            {/* Right Column: Raw Untouched File Code Viewer */}
            <div className="flex-1 flex flex-col bg-[#080d18] overflow-hidden">
              <div className="px-4 py-2.5 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
                <div className="flex items-center gap-2 text-xs font-mono text-sky-300">
                  <FileCode className="w-4 h-4" />
                  <span>
                    {selectedRepo?.category} / {selectedRepo?.repository} / {selectedFileRel}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {fileKinematicStats.format !== 'DOC' && (
                    <span className="text-[11px] px-2 py-0.5 rounded bg-sky-500/15 border border-sky-400/30 text-sky-300 font-mono">
                      {fileKinematicStats.format} · {fileKinematicStats.linkCount} 连杆 / {fileKinematicStats.jointCount} 关节
                    </span>
                  )}
                  <span className="text-[11px] text-slate-400">100% 原厂运动学基准原件 · 零修改</span>
                </div>
              </div>
              <pre className="flex-1 overflow-auto p-4 text-xs font-mono text-slate-200 leading-relaxed whitespace-pre-wrap">
                {fileContent}
              </pre>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
