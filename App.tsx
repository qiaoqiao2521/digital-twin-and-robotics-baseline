import React, { useState, useEffect, useRef, useMemo } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import {
  Cpu,
  Layers,
  Compass,
  Box,
  FileCode,
  Search,
  ExternalLink,
  Sliders,
  Eye,
  Maximize2,
  RotateCcw,
  ChevronRight,
  Database,
  Activity,
  Anchor,
  Rocket,
  Plane,
  Bot
} from 'lucide-react';
import manifestData from './src/robotics_manifest.json';

interface RobotPack {
  id: string;
  name: string;
  subtitle: string;
  category: string;
  glbUrl: string;
  previewUrl: string;
  baselineRepo: string;
  primaryUrdf: string;
  upstreamUrl: string;
  specs: { label: string; value: string }[];
}

const ROBOT_PACKS: RobotPack[] = [
  {
    id: 'sar',
    name: '履带越障搜救机器人 (Search-and-Rescue)',
    subtitle: '主履带底盘 + 4×独立越障摆臂 Flippers + 6轴 AR4 机械臂 + 激光雷达',
    category: '地面特种搜救',
    glbUrl: '/robotics_glb/search_and_rescue_tracked_robot.glb',
    previewUrl: '/robotics_glb/search_and_rescue_tracked_robot.png',
    baselineRepo: '01-履带越障搜救机器人/Search-and-Rescue-Robot',
    primaryUrdf: 'urdf/sar_urdf.urdf',
    upstreamUrl: 'https://github.com/nikhil-prasad-k/Search-and-Rescue-Robot',
    specs: [
      { label: '网格精度', value: '208,744 Tris / 66 STL' },
      { label: '运动关节', value: '15 Joints (4 Flippers + 6-DOF AR4)' },
      { label: '现实基准', value: 'sar_urdf.urdf + gz_ar4.urdf.xacro' }
    ]
  },
  {
    id: 'rexrov2',
    name: '深海重型作业级 ROV (RexROV2 + Oberon7)',
    subtitle: '3000米级深海作业框架 + 7轴液压水下机械爪 + 防喷器阀门面板',
    category: '深海重工 ROV',
    glbUrl: '/robotics_glb/rexrov2_oberon7_subsea_rov.glb',
    previewUrl: '/robotics_glb/rexrov2_oberon7_subsea_rov.png',
    baselineRepo: '02-水下机器人ROV与深海作业系统/rexrov2',
    primaryUrdf: 'rexrov2_description/robots/rexrov2_oberon7.xacro',
    upstreamUrl: 'https://github.com/uuvsimulator/uuv_simulator',
    specs: [
      { label: '网格精度', value: '843,403 Tris / 74 CAD 部件' },
      { label: '作业机械臂', value: 'Oberon7 7-DOF 液压串联臂' },
      { label: '现实基准', value: 'rexrov2_oberon7.xacro + serial_arm.xacro' }
    ]
  },
  {
    id: 'bluerov2',
    name: '水下推进机器人 (BlueROV2 + Ping360 声呐)',
    subtitle: '行业标准6推进器矢量水下机器人 + 360° 扫描声呐探头',
    category: '水下勘测 ROV',
    glbUrl: '/robotics_glb/bluerov2_underwater_rov.glb',
    previewUrl: '/robotics_glb/bluerov2_underwater_rov.png',
    baselineRepo: '02-水下机器人ROV与深海作业系统/bluerov2',
    primaryUrdf: 'bluerov2_description/urdf/bluerov2.xacro',
    upstreamUrl: 'https://github.com/CentraleNantesROV/bluerov2',
    specs: [
      { label: '网格精度', value: '380,683 Tris / 202 CAD 零件' },
      { label: '推进配置', value: '6 × T200 矢量螺旋桨推进器' },
      { label: '现实基准', value: 'bluerov2.xacro + model.sdf' }
    ]
  },
  {
    id: 'unitree_g1',
    name: '宇树双足人形机器人 (Unitree G1 29-DOF)',
    subtitle: '29自由度全尺寸具身人形底盘 + Inspire 五指灵巧手',
    category: '双足具身人形',
    glbUrl: '/robotics_glb/unitree_g1_humanoid.glb',
    previewUrl: '/robotics_glb/unitree_g1_humanoid.png',
    baselineRepo: '03-宇树Unitree四足与人形全系_URDF/unitree_ros',
    primaryUrdf: 'robots/g1_description/g1_29dof_with_hand_rev_1_0.urdf',
    upstreamUrl: 'https://github.com/unitreerobotics/unitree_ros',
    specs: [
      { label: '全身自由度', value: '29-DOF 主躯干 + 双手五指灵巧手' },
      { label: '同库机型', value: 'G1 / H1 / Valkyrie / Fourier GR1 / TALOS' },
      { label: '现实基准', value: 'g1_29dof_with_hand_rev_1_0.urdf' }
    ]
  },
  {
    id: 'unitree_go2',
    name: '宇树四足机器狗 (Unitree Go2 Quadruped)',
    subtitle: '12自由度高动态四足关节链 + 4D 超广角激光雷达 L1',
    category: '四足越野机器人',
    glbUrl: '/robotics_glb/unitree_go2_quadruped.glb',
    previewUrl: '/robotics_glb/unitree_go2_quadruped.png',
    baselineRepo: '03-宇树Unitree四足与人形全系_URDF/unitree_ros',
    primaryUrdf: 'robots/go2_description/urdf/go2_description.urdf',
    upstreamUrl: 'https://github.com/unitreerobotics/unitree_ros',
    specs: [
      { label: '运动关节', value: '12-DOF (FL/FR/RL/RR Hip-Thigh-Calf)' },
      { label: '同库机型', value: 'Go2 / B2 / Spot / ANYmal C / Mini Cheetah' },
      { label: '现实基准', value: 'go2_description.urdf + go2.xml' }
    ]
  },
  {
    id: 'unitree_z1',
    name: '六轴协作机械臂 (Unitree Z1 6-DOF Arm)',
    subtitle: '谐波减速器六轴轻量机械臂（代表 Franka / UR5e / Kinova 机械臂族）',
    category: '工业与协作机械臂',
    glbUrl: '/robotics_glb/unitree_z1_manipulator.glb',
    previewUrl: '/robotics_glb/unitree_z1_manipulator.png',
    baselineRepo: '03-宇树Unitree四足与人形全系_URDF/unitree_ros',
    primaryUrdf: 'robots/z1_description/xacro/z1.urdf',
    upstreamUrl: 'https://github.com/unitreerobotics/unitree_ros',
    specs: [
      { label: '运动关节', value: '6-DOF 串联旋转关节 + 末端夹爪' },
      { label: '同库机型', value: 'Franka Panda / UR5e-UR30 / Kinova / ShadowHand' },
      { label: '现实基准', value: 'z1.urdf + panda.urdf.xacro' }
    ]
  }
];

type MainTab = 'hangar_3d' | 'mars2020' | 'b737_cfm56' | 'b737_bridge' | 'urdf_explorer';

export default function App() {
  const [activeTab, setActiveTab] = useState<MainTab>('hangar_3d');
  const [selectedPack, setSelectedPack] = useState<RobotPack>(ROBOT_PACKS[0]);
  const [explosion, setExplosion] = useState<number>(0);
  const [clipRatio, setClipRatio] = useState<number>(1.0);
  const [xrayMode, setXrayMode] = useState<boolean>(false);
  const [showSkeleton, setShowSkeleton] = useState<boolean>(true);
  const [autoRotate, setAutoRotate] = useState<boolean>(false);
  const [meshNodes, setMeshNodes] = useState<{ name: string; tris: number }[]>([]);
  const [highlightedPart, setHighlightedPart] = useState<string | null>(null);
  const [loadingModel, setLoadingModel] = useState<boolean>(false);

  // URDF / XML Baseline Explorer state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedRepo, setSelectedRepo] = useState<any>(manifestData[0]);
  const [selectedFileRel, setSelectedFileRel] = useState<string>(manifestData[0]?.primaryBaselineFile || '');
  const [fileContent, setFileContent] = useState<string>('正在加载原始基准文件...');

  const mountRef = useRef<HTMLDivElement | null>(null);
  const partsRef = useRef<
    {
      mesh: THREE.Mesh;
      basePos: THREE.Vector3;
      explodeDir: THREE.Vector3;
      origMat: THREE.Material | THREE.Material[];
    }[]
  >([]);
  const skeletonGroupRef = useRef<THREE.Group | null>(null);
  const clipPlaneRef = useRef<THREE.Plane>(new THREE.Plane(new THREE.Vector3(0, -1, 0), 10));
  const controlsRef = useRef<OrbitControls | null>(null);
  const bboxMaxYRef = useRef<number>(2.0);
  const bboxMinYRef = useRef<number>(-2.0);

  // Load raw URDF/XML/MD file content in Baseline Explorer
  useEffect(() => {
    if (!selectedRepo || !selectedFileRel) return;
    const url = `/baselines/${selectedRepo.category}/${selectedRepo.repository}/${selectedFileRel}`;
    setFileContent(`正在读取原装基准文件: ${url} ...`);
    fetch(url)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.text();
      })
      .then((txt) => setFileContent(txt.slice(0, 120000)))
      .catch((err) => setFileContent(`读取提示 (${err.message})：可从右侧直接打开或从 GitHub 仓库查看完整文件。\n路径: ${url}`));
  }, [selectedRepo, selectedFileRel]);

  // Initialize Three.js Mega-Hangar Viewport when on hangar_3d tab
  useEffect(() => {
    if (activeTab !== 'hangar_3d' || !mountRef.current) return;
    const container = mountRef.current;
    const width = container.clientWidth || 960;
    const height = container.clientHeight || 640;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x060a12);
    scene.fog = new THREE.FogExp2(0x060a12, 0.045);

    const camera = new THREE.PerspectiveCamera(42, width / height, 0.01, 200);
    camera.position.set(2.4, 1.8, 2.8);

    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.localClippingEnabled = true;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controlsRef.current = controls;

    // Sci-Fi Hangar Lighting & Floor Grid
    const amb = new THREE.AmbientLight(0xdbeafe, 0.85);
    scene.add(amb);
    const keyLight = new THREE.DirectionalLight(0xfff7ed, 2.6);
    keyLight.position.set(5, 8, 6);
    scene.add(keyLight);
    const rimLight = new THREE.DirectionalLight(0x38bdf8, 1.8);
    rimLight.position.set(-6, 4, -5);
    scene.add(rimLight);
    const bottomLight = new THREE.DirectionalLight(0x0ea5e9, 0.9);
    bottomLight.position.set(0, -5, 2);
    scene.add(bottomLight);

    const grid = new THREE.GridHelper(16, 32, 0x0284c7, 0x1e293b);
    grid.position.y = -0.85;
    scene.add(grid);

    // Holographic Hangar Bay Ring
    const ringGeo = new THREE.RingGeometry(1.6, 1.64, 64);
    ringGeo.rotateX(-Math.PI / 2);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, side: THREE.DoubleSide, transparent: true, opacity: 0.45 });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.position.y = -0.84;
    scene.add(ringMesh);

    const modelRoot = new THREE.Group();
    scene.add(modelRoot);

    const skelGroup = new THREE.Group();
    scene.add(skelGroup);
    skeletonGroupRef.current = skelGroup;

    // Load selected GLB
    setLoadingModel(true);
    const loader = new GLTFLoader();
    loader.load(
      selectedPack.glbUrl,
      (gltf) => {
        const root = gltf.scene;
        // Rotate Z-up URDF models to Y-up Three.js convention if needed
        root.rotation.x = -Math.PI / 2;
        root.updateMatrixWorld(true);

        const box = new THREE.Box3().setFromObject(root);
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z, 0.001);
        const scale = 2.0 / maxDim;

        root.scale.setScalar(scale);
        root.position.sub(center.multiplyScalar(scale));
        root.updateMatrixWorld(true);

        const normBox = new THREE.Box3().setFromObject(root);
        bboxMinYRef.current = normBox.min.y;
        bboxMaxYRef.current = normBox.max.y;
        grid.position.y = normBox.min.y - 0.04;
        ringMesh.position.y = normBox.min.y - 0.03;

        const loadedParts: typeof partsRef.current = [];
        const nodeList: { name: string; tris: number }[] = [];
        const jointPositions: THREE.Vector3[] = [];

        root.traverse((obj) => {
          if ((obj as THREE.Mesh).isMesh) {
            const m = obj as THREE.Mesh;
            const worldPos = new THREE.Vector3();
            m.getWorldPosition(worldPos);
            jointPositions.push(worldPos.clone());

            const dir = worldPos.clone().normalize();
            if (dir.lengthSq() < 0.01) dir.set(0, 1, 0);

            // Clone material with clipping plane support
            const baseMat = Array.isArray(m.material) ? m.material[0] : m.material;
            const stdMat = (baseMat ? baseMat.clone() : new THREE.MeshStandardMaterial({ color: 0x94a3b8 })) as THREE.MeshStandardMaterial;
            stdMat.clippingPlanes = [clipPlaneRef.current];
            stdMat.clipShadows = true;
            m.material = stdMat;

            const geom = m.geometry;
            const tris = geom.index ? Math.round(geom.index.count / 3) : Math.round((geom.attributes.position?.count || 0) / 3);
            nodeList.push({ name: m.name || `link_${loadedParts.length}`, tris });

            loadedParts.push({
              mesh: m,
              basePos: m.position.clone(),
              explodeDir: dir,
              origMat: stdMat
            });
          }
        });

        modelRoot.add(root);
        partsRef.current = loadedParts;
        setMeshNodes(nodeList);

        // Build L0 Engineering Skeleton Overlay (Axes + Joint Nodes + Kinematic Links)
        const axes = new THREE.AxesHelper(1.35);
        skelGroup.add(axes);

        const nodeSphereGeo = new THREE.SphereGeometry(0.024, 12, 12);
        const nodeSphereMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
        const linePts: THREE.Vector3[] = [];

        jointPositions.slice(0, 80).forEach((jp, idx) => {
          const sp = new THREE.Mesh(nodeSphereGeo, nodeSphereMat);
          sp.position.copy(jp);
          skelGroup.add(sp);
          if (idx > 0) {
            linePts.push(jointPositions[idx - 1], jp);
          }
        });

        if (linePts.length >= 2) {
          const lineGeo = new THREE.BufferGeometry().setFromPoints(linePts);
          const lineMat = new THREE.LineBasicMaterial({ color: 0xf59e0b, transparent: true, opacity: 0.75 });
          skelGroup.add(new THREE.LineSegments(lineGeo, lineMat));
        }

        setLoadingModel(false);
      },
      undefined,
      () => setLoadingModel(false)
    );

    let reqId = 0;
    const animate = () => {
      reqId = requestAnimationFrame(animate);
      if (controlsRef.current) {
        controlsRef.current.update();
      }
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(reqId);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
    };
  }, [activeTab, selectedPack]);

  // Reactive update for Explosion, Clipping, X-Ray, Skeleton, Auto-Rotate, and Part Highlight
  useEffect(() => {
    const minY = bboxMinYRef.current;
    const maxY = bboxMaxYRef.current;
    clipPlaneRef.current.constant = minY + (maxY - minY + 0.5) * clipRatio;

    if (skeletonGroupRef.current) {
      skeletonGroupRef.current.visible = showSkeleton;
    }
    if (controlsRef.current) {
      controlsRef.current.autoRotate = autoRotate;
      controlsRef.current.autoRotateSpeed = 2.0;
    }

    partsRef.current.forEach(({ mesh, basePos, explodeDir, origMat }) => {
      mesh.position.copy(basePos).addScaledVector(explodeDir, explosion * 0.65);
      const mat = origMat as THREE.MeshStandardMaterial;
      const isHighlighted = highlightedPart && mesh.name === highlightedPart;
      mat.wireframe = xrayMode;
      mat.transparent = xrayMode || Boolean(highlightedPart && !isHighlighted);
      mat.opacity = isHighlighted ? 1.0 : highlightedPart ? 0.25 : xrayMode ? 0.38 : 1.0;
      if (mat.emissive) {
        mat.emissive.setHex(isHighlighted ? 0x0284c7 : 0x000000);
      }
    });
  }, [explosion, clipRatio, xrayMode, showSkeleton, autoRotate, highlightedPart]);

  const filteredRepos = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return manifestData;
    return manifestData.filter(
      (r: any) =>
        r.repository.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q) ||
        r.category.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  return (
    <div className="flex flex-col h-screen w-screen bg-[#060a12] text-slate-100 select-none overflow-hidden">
      {/* Top Sci-Fi Mega-Hangar Navigation Header */}
      <header className="flex items-center justify-between px-5 py-2.5 bg-slate-950/90 border-b border-sky-500/25 backdrop-blur-md z-20">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-sky-500/15 border border-sky-400/40 flex items-center justify-center text-sky-400">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold tracking-wider text-sm text-sky-50">
                MEGA-HANGAR · 陆海空天与具身智能数字孪生总控穹顶
              </span>
              <span className="text-[11px] px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-400/30 font-mono">
                L-Macro → L0..L3
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              已集成 B737/CFM56 涡扇 · NASA 毅力号火星车 · 6大特种/具身机器人整机 GLB · 39库 (1,138个 URDF/XML) 原装现实基准
            </p>
          </div>
        </div>

        {/* 5 Workstation Bay Switcher */}
        <nav className="flex items-center gap-1.5 bg-slate-900/90 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveTab('hangar_3d')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              activeTab === 'hangar_3d'
                ? 'bg-sky-500 text-slate-950 shadow-lg shadow-sky-500/25 font-semibold'
                : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Bot className="w-3.5 h-3.5" />
            <span>具身与特种机库 (6大整机3D孪生)</span>
          </button>

          <button
            onClick={() => setActiveTab('mars2020')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              activeTab === 'mars2020'
                ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/25 font-semibold'
                : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Rocket className="w-3.5 h-3.5" />
            <span>深空工位 · 毅力号与空中吊车 (L0→L3)</span>
          </button>

          <button
            onClick={() => setActiveTab('b737_cfm56')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              activeTab === 'b737_cfm56'
                ? 'bg-cyan-400 text-slate-950 shadow-lg shadow-cyan-400/25 font-semibold'
                : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Plane className="w-3.5 h-3.5" />
            <span>航空工位 · B737与CFM56涡扇 (L0→L3)</span>
          </button>

          <button
            onClick={() => setActiveTab('b737_bridge')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              activeTab === 'b737_bridge'
                ? 'bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-400/25 font-semibold'
                : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>工程骨架母树 · B737与悬索大桥</span>
          </button>

          <button
            onClick={() => setActiveTab('urdf_explorer')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              activeTab === 'urdf_explorer'
                ? 'bg-purple-400 text-slate-950 shadow-lg shadow-purple-400/25 font-semibold'
                : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>39库 URDF/XML 现实基准源码仓</span>
          </button>
        </nav>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 relative overflow-hidden">
        {/* TAB 1: 6 Embodied & Subsea Robotics 3D Digital Twin Hangar */}
        {activeTab === 'hangar_3d' && (
          <div className="flex h-full w-full">
            {/* Left Sidebar: 6 Flagship Robotics Testbed Bays */}
            <aside className="w-80 bg-slate-950/85 border-r border-slate-800/80 flex flex-col z-10">
              <div className="p-3.5 border-b border-slate-800/80">
                <div className="text-xs font-semibold uppercase tracking-wider text-sky-400 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5" />
                  <span>特种与具身机器人测试工位 (6 Bays)</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  点击任意机器人切换整机 GLB 孪生体，支持零件爆炸拆解、剖切、URDF 连杆树检视与原装基准对照
                </p>
              </div>

              <div className="flex-1 overflow-y-auto p-2.5 space-y-2">
                {ROBOT_PACKS.map((pack) => {
                  const active = pack.id === selectedPack.id;
                  return (
                    <button
                      key={pack.id}
                      onClick={() => {
                        setSelectedPack(pack);
                        setHighlightedPart(null);
                      }}
                      className={`w-full text-left p-2.5 rounded-xl border transition flex gap-2.5 items-center ${
                        active
                          ? 'bg-sky-500/15 border-sky-400/60 shadow-md shadow-sky-950/50'
                          : 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700'
                      }`}
                    >
                      <img
                        src={pack.previewUrl}
                        alt={pack.name}
                        className="w-16 h-12 object-cover rounded-lg bg-slate-950 border border-slate-800 shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-sky-300 font-mono">
                            {pack.category}
                          </span>
                        </div>
                        <div className="text-xs font-semibold text-slate-100 truncate mt-1">{pack.name}</div>
                        <div className="text-[11px] text-slate-400 truncate">{pack.subtitle}</div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Selected Robot Reality Baseline Spec Card */}
              <div className="p-3.5 border-t border-slate-800 bg-slate-900/50 space-y-2">
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
                    const found = manifestData.find((r: any) =>
                      selectedPack.baselineRepo.includes(r.repository)
                    );
                    if (found) {
                      setSelectedRepo(found);
                      setSelectedFileRel(found.primaryBaselineFile || '');
                    }
                    setActiveTab('urdf_explorer');
                  }}
                  className="w-full mt-1 py-1.5 px-3 rounded-lg bg-sky-500/20 hover:bg-sky-500/30 border border-sky-400/40 text-sky-300 text-xs font-medium flex items-center justify-center gap-1.5 transition"
                >
                  <FileCode className="w-3.5 h-3.5" />
                  <span>查看原装 URDF / XML 运动学源码</span>
                </button>
              </div>
            </aside>

            {/* Center 3D WebGL Viewport */}
            <div className="flex-1 relative bg-[#060a12]">
              <div ref={mountRef} className="w-full h-full" />

              {loadingModel && (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm z-10">
                  <div className="px-5 py-3 rounded-xl bg-slate-900 border border-sky-500/40 text-sky-300 text-sm flex items-center gap-2.5">
                    <Cpu className="w-4 h-4 animate-spin" />
                    <span>正在装配 {selectedPack.name} 3D 网格与 L0 关节坐标架...</span>
                  </div>
                </div>
              )}

              {/* Bottom Floating Twin Control HUD */}
              <div className="absolute bottom-5 left-1/2 -translate-x-1/2 bg-slate-950/90 border border-sky-500/30 backdrop-blur-md rounded-2xl px-5 py-3 flex items-center gap-6 shadow-2xl">
                <div className="flex items-center gap-2.5">
                  <Sliders className="w-4 h-4 text-sky-400" />
                  <span className="text-xs text-slate-300">爆炸拆解</span>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.01}
                    value={explosion}
                    onChange={(e) => setExplosion(parseFloat(e.target.value))}
                    className="w-28 accent-sky-400"
                  />
                  <span className="text-xs font-mono text-sky-300 w-9">{Math.round(explosion * 100)}%</span>
                </div>

                <div className="flex items-center gap-2.5">
                  <span className="text-xs text-slate-300">激光剖切面</span>
                  <input
                    type="range"
                    min={0.05}
                    max={1}
                    step={0.01}
                    value={clipRatio}
                    onChange={(e) => setClipRatio(parseFloat(e.target.value))}
                    className="w-28 accent-amber-400"
                  />
                  <span className="text-xs font-mono text-amber-300 w-9">{Math.round(clipRatio * 100)}%</span>
                </div>

                <button
                  onClick={() => setShowSkeleton(!showSkeleton)}
                  className={`px-3 py-1 rounded-lg text-xs border transition ${
                    showSkeleton
                      ? 'bg-amber-500/20 border-amber-400/50 text-amber-300'
                      : 'bg-slate-900 border-slate-700 text-slate-400'
                  }`}
                >
                  L0 坐标骨架: {showSkeleton ? '开启' : '关闭'}
                </button>

                <button
                  onClick={() => setXrayMode(!xrayMode)}
                  className={`px-3 py-1 rounded-lg text-xs border transition ${
                    xrayMode
                      ? 'bg-sky-500/20 border-sky-400/50 text-sky-300'
                      : 'bg-slate-900 border-slate-700 text-slate-400'
                  }`}
                >
                  X-Ray 线框: {xrayMode ? '开启' : '关闭'}
                </button>

                <button
                  onClick={() => setAutoRotate(!autoRotate)}
                  className={`px-3 py-1 rounded-lg text-xs border transition ${
                    autoRotate
                      ? 'bg-emerald-500/20 border-emerald-400/50 text-emerald-300'
                      : 'bg-slate-900 border-slate-700 text-slate-400'
                  }`}
                >
                  环绕巡检
                </button>

                <button
                  onClick={() => {
                    setExplosion(0);
                    setClipRatio(1.0);
                    setXrayMode(false);
                    setHighlightedPart(null);
                  }}
                  className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300"
                  title="复位视图"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Right Sidebar: Real-Time URDF Link / Mesh Sub-Parts Inspector */}
            <aside className="w-72 bg-slate-950/85 border-l border-slate-800/80 flex flex-col z-10">
              <div className="p-3.5 border-b border-slate-800/80 flex items-center justify-between">
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
                  return (
                    <button
                      key={`${node.name}_${idx}`}
                      onClick={() => setHighlightedPart(isSel ? null : node.name)}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between transition ${
                        isSel
                          ? 'bg-sky-500/25 border border-sky-400/50 text-sky-200'
                          : 'hover:bg-slate-900 text-slate-300'
                      }`}
                    >
                      <span className="truncate font-mono text-[11px]">{node.name}</span>
                      <span className="text-[10px] text-slate-500 font-mono shrink-0 ml-2">
                        {node.tris.toLocaleString()} tris
                      </span>
                    </button>
                  );
                })}
              </div>
            </aside>
          </div>
        )}

        {/* TAB 2: NASA Mars 2020 Perseverance & Skycrane L0-L3 Digital Twin */}
        {activeTab === 'mars2020' && (
          <iframe
            src="/twins/mars2020_perseverance_twin.html"
            title="NASA Mars 2020 Perseverance Digital Twin"
            className="w-full h-full border-0"
          />
        )}

        {/* TAB 3: Boeing 737-800 & CFM56-7B Turbofan L0-L3 Digital Twin */}
        {activeTab === 'b737_cfm56' && (
          <iframe
            src="/twins/b737_cfm56_twin.html"
            title="B737 & CFM56-7B Digital Twin"
            className="w-full h-full border-0"
          />
        )}

        {/* TAB 4: B737 & Suspension Bridge Master Skeleton */}
        {activeTab === 'b737_bridge' && (
          <iframe
            src="/twins/b737_bridge_skeleton.html"
            title="B737 & Suspension Bridge Skeleton"
            className="w-full h-full border-0"
          />
        )}

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
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="搜索 39 个机器人库 (如 unitree, rov, spot, urdf)..."
                    className="w-full pl-8 pr-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-sky-400"
                  />
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
                {filteredRepos.map((repo: any) => {
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
                        {(selectedRepo.kinematicFiles || []).map((f: string) => (
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
                        {(selectedRepo.docFiles || []).map((f: string) => (
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
              <div className="px-4 py-2.5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
                <div className="flex items-center gap-2 text-xs font-mono text-sky-300">
                  <FileCode className="w-4 h-4" />
                  <span>
                    {selectedRepo?.category} / {selectedRepo?.repository} / {selectedFileRel}
                  </span>
                </div>
                <span className="text-[11px] text-slate-400">100% 原厂运动学基准原件 · 零修改</span>
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
