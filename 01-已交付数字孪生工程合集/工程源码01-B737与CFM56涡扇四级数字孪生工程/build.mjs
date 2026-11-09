import fs from 'node:fs';
import path from 'node:path';

const PROD_DIR = '/home/muqiao/projects/muqiao-media-studio/productions/industrial-digital-twin-20261108';
const SRC_DIR = path.join(PROD_DIR, 'src');
const REF_DIR = path.join(PROD_DIR, 'references');
const DIST_DIR = path.join(PROD_DIR, 'dist');
const TARGET_STUDIO_HTML = '/home/muqiao/Videos/Studio/ThreeJS-3D互动世界合集-20261108/04-精密机械与光刻3D仿真/00B-工业数字孪生骨架母树-B737整机站位与悬索大桥.html';

fs.mkdirSync(DIST_DIR, { recursive: true });

// 1. Load Baidu PP-OCRv4 Blueprint Detections & Build Consolidated `industrial-datum-ocr-atlas.json`
const rawOcrPath = path.join(REF_DIR, 'baidu_ocr_blueprint_detections.json');
const rawOcr = fs.existsSync(rawOcrPath) ? JSON.parse(fs.readFileSync(rawOcrPath, 'utf8')) : {};

const atlasJson = {
  schemaVersion: 'industrial-datum-ocr-atlas-v1',
  generatedAt: new Date().toISOString(),
  ocrEngine: 'Baidu PP-OCRv4 (RapidOCR ONNX Runtime) + Firecrawl CLI Document Acquisition',
  referenceManuals: [
    {
      id: 'REF-B737-SRM',
      file: 'references/ntsb_b737_800_structures_stations.pdf',
      title: 'NTSB / Boeing 737-800 Structures Group Chairman Factual Report (Figures 1, 2, 3)',
      extractedDiagrams: ['b737_stations_page-02.png', 'b737_stations_page-03.png', 'b737_stations_page-04.png'],
      ocrBlockCount:
        (rawOcr['b737_stations_page-02.png']?.count || 0) +
        (rawOcr['b737_stations_page-03.png']?.count || 0) +
        (rawOcr['b737_stations_page-04.png']?.count || 0),
      keyVerifiedDatums: [
        'STA 130.0 (Nose Radome) -> STA 360.0 (Sec 41/43) -> STA 540.0 (Sec 43/44 Wing Box Fwd) -> STA 663.75 (Wing Box Aft) -> STA 727.0 (Sec 44/46) -> STA 887.0 (Sec 46/47) -> STA 1016.0 (Aft Pressure Bulkhead) -> STA 1217.0 (Tailcone)',
        'WL 148.5 (Bottom Keel) -> WL 208.1 (Cabin Floor Beam) -> WL 306.5 (Upper Crown), Upper Lobe Radius R = 74.0 in',
        'WBL 0.0 (Centerline) -> WBL 71.24 (Side-of-Body Rib) -> CL NAC APPROX. WBL 190.97 / WS 204.25 (Engine Nacelle & Pylon Mount) -> WBL 680.40 / WS 691.50 (Wingtip)'
      ]
    },
    {
      id: 'REF-CFM56-CTC044',
      file: 'references/cfm56_basic_engine_ctc044.pdf',
      title: 'CFMI Official Training Manual CTC-044 — CFM56 Basic Engine (Pages 24, 30, 32, 34)',
      extractedDiagrams: ['cfm56_ctc044_page-024.png', 'cfm56_ctc044_page-030.png', 'cfm56_ctc044_page-032.png', 'cfm56_ctc044_page-034.png'],
      ocrBlockCount:
        (rawOcr['cfm56_ctc044_page-024.png']?.count || 0) +
        (rawOcr['cfm56_ctc044_page-030.png']?.count || 0) +
        (rawOcr['cfm56_ctc044_page-032.png']?.count || 0) +
        (rawOcr['cfm56_ctc044_page-034.png']?.count || 0),
      keyVerifiedDatums: [
        '4 Major Modules: (1) Fan Major Module, (2) Core Engine Major Module, (3) Low Pressure Turbine Major Module, (4) Accessory Drive Major Module',
        '6 Functional Core Sections: M1 Fan & 3-Stage Booster + Fan Frame (Sta. 0..25), M2 9-Stage HPC + VSV (Sta. 25..3), M3 Annular Combustor + 20 Nozzles (Sta. 3..39), M4 Single-Stage HPT + ACC (Sta. 4..42), M5 4-Stage LPT + TRF (Sta. 495..5..8), M6 IGB + Radial Drive Shaft + AGB (@ 6:00)',
        '5 Main Bearings & 2 Sumps: Forward Sump A (No. 1 Ball, No. 2 Roller on LP N1; No. 3 Ball+Roller on HP N2) & Rear Sump B in TRF (No. 4 Roller on HP N2; No. 5 Roller on LP N1)'
      ]
    },
    {
      id: 'REF-RR-JET-ENGINE',
      file: 'references/rolls_royce_the_jet_engine.pdf',
      title: 'Rolls-Royce: The Jet Engine (5th Edition — Combustors, HPT Fir-Tree Roots & Active Clearance Control)',
      keyVerifiedDatums: [
        '3-Tang Broached Fir-Tree Blade Root (枞树形三齿叶片榫头), Multi-Pass Serpentine Internal Cooling Passages & Leading-Edge Showerhead Film Cooling',
        'Curvic Coupling High-Precision Face Splines between HPT Rotor Disk and HP Drum Shaft'
      ]
    },
    {
      id: 'REF-BRIDGE-CH18',
      file: 'references/bridge_engineering_handbook_ch18_suspension_bridges.pdf',
      title: 'Wai-Fah Chen & Lian Duan — Bridge Engineering Handbook, Chapter 18: Suspension Bridges',
      keyVerifiedDatums: [
        'Main Span Catenary/Parabolic Sag-to-Span Ratio f/L = 1:9 to 1:11 (Modeled at f/L = 105m / 1000m = 1:9.52)',
        'Aerodynamic Streamlined Closed Orthotropic Steel Box Girder with U-Rib Stiffeners, Transverse Diaphragms, Tower-Top Cast-Steel Saddles & Gravity Anchorage Splay Saddles'
      ]
    }
  ],
  baiduOcrDetections: rawOcr
};

fs.writeFileSync(path.join(REF_DIR, 'industrial-datum-ocr-atlas.json'), JSON.stringify(atlasJson, null, 2), 'utf8');

// 2. Concatenate modular ES files into a single clean inline module script (stripping local import/export statements)
const moduleOrder = [
  'schema/datum-types.js',
  'data/b737-cfm56-datum.js',
  'modules/l0-aircraft-airframe.js',
  'modules/l1-pylon-nacelle.js',
  'modules/l2-cfm56-turbofan.js',
  'modules/l3-hpt-combustor-core.js',
  'modules/l0-suspension-bridge.js',
  'modules/cad-datum-overlay.js',
  'shell/digital-twin-workbench.js'
];

let combinedJs = `// Three.js loaded via ./vendor/three.min.js (global THREE)\nconst THREE = window.THREE;\n\n`;

for (const relPath of moduleOrder) {
  const fullPath = path.join(SRC_DIR, relPath);
  let code = fs.readFileSync(fullPath, 'utf8');
  // Remove local ES imports and `export ` keywords
  code = code
    .replace(/^\s*import\s+[\s\S]*?from\s+['"][^'"]+['"];?\s*$/gm, '')
    .replace(/^\s*export\s+(const|let|var|function|class)\s+/gm, '$1 ');
  combinedJs += `\n// ============================================================================\n// MODULE: ${relPath}\n// ============================================================================\n${code}\n`;
}

combinedJs += `\n// Boot Workbench\nwindow.addEventListener('DOMContentLoaded', () => {\n  initDigitalTwinWorkbench();\n});\n`;

// Sample OCR highlights to display in the Right Blueprint Evidence Drawer
const b737OcrSample = (rawOcr['b737_stations_page-03.png']?.detections || [])
  .slice(0, 28)
  .map((d) => d.text)
  .join(' · ');
const wingOcrSample = (rawOcr['b737_stations_page-04.png']?.detections || [])
  .slice(0, 24)
  .map((d) => d.text)
  .join(' · ');
const cfmOcrSample = [
  ...(rawOcr['cfm56_ctc044_page-030.png']?.detections || []),
  ...(rawOcr['cfm56_ctc044_page-032.png']?.detections || []),
  ...(rawOcr['cfm56_ctc044_page-034.png']?.detections || [])
]
  .map((d) => d.text)
  .join(' · ');

const htmlContent = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>工业级 3D 数字孪生底座 — B737-800 & CFM56-7B 四级无损下钻与标准挂载接口系统 (L0→L1→L2→L3)</title>
  <script src="./vendor/three.min.js"></script>
  <style>
    :root {
      --bg-deep: #050912;
      --bg-panel: rgba(9, 15, 28, 0.90);
      --bg-card: rgba(15, 23, 42, 0.78);
      --border-dim: rgba(56, 189, 248, 0.22);
      --border-bright: rgba(56, 189, 248, 0.65);
      --accent-cyan: #38bdf8;
      --accent-gold: #fbbf24;
      --accent-emerald: #34d399;
      --accent-crimson: #ef4444;
      --text-main: #f1f5f9;
      --text-muted: #94a3b8;
      --font-mono: "JetBrains Mono", "SFMono-Regular", Consolas, monospace;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    html, body {
      width: 100%;
      height: 100%;
      overflow: hidden;
      background: var(--bg-deep);
      color: var(--text-main);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif;
    }
    .workbench-layout {
      display: grid;
      grid-template-rows: 58px 1fr;
      width: 100vw;
      height: 100vh;
    }
    /* Top Header: Domain Switcher + Breadcrumb Hierarchy + CAD Controls */
    .top-command-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding: 0 16px;
      background: rgba(6, 11, 22, 0.96);
      border-bottom: 1px solid var(--border-dim);
      z-index: 20;
    }
    .brand-cluster {
      display: flex;
      align-items: center;
      gap: 10px;
      flex-shrink: 0;
    }
    .brand-tag {
      padding: 4px 8px;
      border-radius: 5px;
      background: linear-gradient(135deg, rgba(56, 189, 248, 0.22), rgba(245, 158, 11, 0.22));
      border: 1px solid var(--border-bright);
      font-family: var(--font-mono);
      font-size: 11px;
      font-weight: 700;
      color: var(--accent-cyan);
      letter-spacing: 0.04em;
    }
    .domain-switcher {
      display: flex;
      gap: 6px;
      background: rgba(15, 23, 42, 0.9);
      padding: 3px;
      border-radius: 7px;
      border: 1px solid rgba(148, 163, 184, 0.2);
    }
    .domain-switch-btn {
      background: transparent;
      border: none;
      color: var(--text-muted);
      font-size: 12px;
      font-weight: 600;
      padding: 5px 10px;
      border-radius: 5px;
      cursor: pointer;
      transition: all 0.18s;
    }
    .domain-switch-btn.active {
      background: rgba(56, 189, 248, 0.2);
      color: #fff;
      box-shadow: inset 0 0 0 1px var(--accent-cyan);
    }
    /* Breadcrumb Bar */
    .breadcrumb-trail {
      display: flex;
      align-items: center;
      gap: 5px;
      overflow-x: auto;
      padding: 4px 0;
    }
    .crumb-step {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 5px 10px;
      border-radius: 6px;
      background: rgba(15, 23, 42, 0.85);
      border: 1px solid rgba(148, 163, 184, 0.22);
      color: var(--text-muted);
      font-size: 12px;
      cursor: pointer;
      transition: all 0.18s;
      white-space: nowrap;
    }
    .crumb-step:hover {
      border-color: var(--accent-cyan);
      color: #fff;
    }
    .crumb-step.visited {
      border-color: rgba(52, 211, 153, 0.45);
      color: #d1fae5;
    }
    .crumb-step.active {
      background: linear-gradient(90deg, rgba(14, 165, 233, 0.28), rgba(245, 158, 11, 0.22));
      border-color: var(--accent-gold);
      color: #fff;
      font-weight: 600;
    }
    .crumb-badge {
      font-family: var(--font-mono);
      font-size: 10px;
      font-weight: 700;
      padding: 1px 5px;
      border-radius: 4px;
      background: rgba(56, 189, 248, 0.22);
      color: var(--accent-cyan);
    }
    .crumb-step.active .crumb-badge {
      background: var(--accent-gold);
      color: #050912;
    }
    .crumb-sep {
      color: #64748b;
      font-size: 12px;
    }
    /* Top Right Controls */
    .toolbar-controls {
      display: flex;
      align-items: center;
      gap: 10px;
      flex-shrink: 0;
    }
    .explode-control {
      display: flex;
      align-items: center;
      gap: 7px;
      background: rgba(15, 23, 42, 0.9);
      padding: 5px 10px;
      border-radius: 7px;
      border: 1px solid var(--border-dim);
      font-size: 12px;
    }
    .explode-control input[type="range"] {
      width: 96px;
      accent-color: var(--accent-gold);
      cursor: pointer;
    }
    .mono-val {
      font-family: var(--font-mono);
      color: var(--accent-gold);
      font-weight: 700;
      min-width: 36px;
    }
    .tool-btn {
      padding: 6px 10px;
      border-radius: 6px;
      border: 1px solid var(--border-dim);
      background: rgba(15, 23, 42, 0.85);
      color: var(--text-main);
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.16s;
    }
    .tool-btn:hover, .tool-btn.active {
      border-color: var(--accent-cyan);
      background: rgba(56, 189, 248, 0.18);
      color: #fff;
    }

    /* Main 3-Column Stage */
    .main-stage {
      display: grid;
      grid-template-columns: 320px 1fr 360px;
      height: calc(100vh - 58px);
      overflow: hidden;
    }
    .side-panel {
      background: var(--bg-panel);
      border-right: 1px solid var(--border-dim);
      display: flex;
      flex-direction: column;
      overflow-y: auto;
      padding: 12px;
      gap: 12px;
      z-index: 10;
    }
    .side-panel.right-panel {
      border-right: none;
      border-left: 1px solid var(--border-dim);
    }
    .panel-section {
      background: var(--bg-card);
      border: 1px solid rgba(148, 163, 184, 0.18);
      border-radius: 8px;
      padding: 10px 12px;
    }
    .section-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: var(--accent-cyan);
      margin-bottom: 8px;
      padding-bottom: 6px;
      border-bottom: 1px solid rgba(148, 163, 184, 0.14);
    }
    .tree-list {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .tree-node-item {
      padding: 8px 10px;
      border-radius: 6px;
      background: rgba(15, 23, 42, 0.68);
      border: 1px solid rgba(148, 163, 184, 0.18);
      cursor: pointer;
      transition: all 0.16s;
    }
    .tree-node-item:hover {
      border-color: var(--accent-cyan);
      background: rgba(30, 41, 59, 0.85);
    }
    .tree-node-item.active {
      border-color: var(--accent-gold);
      background: rgba(245, 158, 11, 0.14);
    }
    .tree-node-item.port-node {
      border-left: 3px solid var(--accent-emerald);
    }
    .node-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 6px;
      font-size: 12px;
      font-weight: 600;
      color: #f8fafc;
    }
    .node-datum {
      margin-top: 4px;
      font-family: var(--font-mono);
      font-size: 10.5px;
      color: var(--accent-cyan);
    }
    .drill-tag {
      flex-shrink: 0;
      padding: 2px 6px;
      border-radius: 4px;
      background: rgba(52, 211, 153, 0.22);
      border: 1px solid var(--accent-emerald);
      color: #6ee7b7;
      font-size: 10px;
      font-weight: 700;
    }
    .drill-tag:hover {
      background: var(--accent-emerald);
      color: #050912;
    }

    /* Center 3D Viewport */
    .center-viewport {
      position: relative;
      width: 100%;
      height: 100%;
      overflow: hidden;
    }
    #viewport-canvas-wrap {
      width: 100%;
      height: 100%;
    }
    .hud-banner {
      position: absolute;
      top: 12px;
      left: 12px;
      right: 12px;
      pointer-events: none;
      display: flex;
      flex-direction: column;
      gap: 4px;
      padding: 10px 14px;
      border-radius: 8px;
      background: rgba(6, 11, 22, 0.82);
      border: 1px solid var(--border-dim);
      backdrop-filter: blur(8px);
    }
    .hud-banner-title {
      font-size: 14px;
      font-weight: 700;
      color: #fff;
    }
    .hud-banner-datum {
      font-family: var(--font-mono);
      font-size: 11px;
      color: var(--accent-gold);
    }
    .hud-banner-summary {
      font-size: 11.5px;
      color: #cbd5e1;
      line-height: 1.45;
    }
    .hud-legend-bar {
      position: absolute;
      bottom: 12px;
      left: 12px;
      right: 12px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 7px 12px;
      border-radius: 7px;
      background: rgba(6, 11, 22, 0.84);
      border: 1px solid rgba(148, 163, 184, 0.2);
      font-size: 11px;
      color: var(--text-muted);
      pointer-events: none;
    }
    .legend-dot {
      display: inline-block;
      width: 8px;
      height: 8px;
      border-radius: 50%;
      margin-right: 4px;
    }

    /* Right Inspector & OCR Evidence Drawer */
    .inspector-field {
      margin-bottom: 8px;
    }
    .field-label {
      font-size: 10.5px;
      color: var(--text-muted);
      margin-bottom: 2px;
    }
    .field-val {
      font-size: 12.5px;
      color: #fff;
      font-weight: 600;
      line-height: 1.4;
    }
    .field-val.mono {
      font-family: var(--font-mono);
      font-size: 11.5px;
      color: var(--accent-gold);
      background: rgba(2, 6, 23, 0.65);
      padding: 4px 7px;
      border-radius: 4px;
      border: 1px solid rgba(251, 191, 36, 0.28);
    }
    .drill-action-btn {
      display: none;
      align-items: center;
      justify-content: center;
      width: 100%;
      margin-top: 8px;
      padding: 9px 12px;
      border-radius: 6px;
      border: 1px solid var(--accent-emerald);
      background: linear-gradient(90deg, rgba(16, 185, 129, 0.28), rgba(14, 165, 233, 0.28));
      color: #ecfdf5;
      font-size: 12.5px;
      font-weight: 700;
      cursor: pointer;
    }
    .drill-action-btn:hover {
      background: var(--accent-emerald);
      color: #050912;
    }
    .ocr-box {
      font-family: var(--font-mono);
      font-size: 10.5px;
      color: #93c5fd;
      background: rgba(2, 6, 23, 0.78);
      border: 1px solid rgba(56, 189, 248, 0.22);
      border-radius: 6px;
      padding: 8px;
      max-height: 145px;
      overflow-y: auto;
      line-height: 1.5;
    }
    .ref-item {
      padding: 6px 0;
      border-bottom: 1px dashed rgba(148, 163, 184, 0.16);
      font-size: 11.5px;
      line-height: 1.45;
    }
    .ref-item:last-child { border-bottom: none; }
    .ref-code {
      font-family: var(--font-mono);
      font-size: 10.5px;
      color: var(--accent-emerald);
    }
    .empty-port-note {
      font-size: 11.5px;
      color: var(--text-muted);
      line-height: 1.45;
      padding: 6px;
    }
  </style>
</head>
<body>
  <div class="workbench-layout">
    <!-- Top Navigation & Breadcrumb Hierarchy Bar -->
    <header class="top-command-bar">
      <div class="brand-cluster">
        <span class="brand-tag">INDUSTRIAL TWIN CAD v2.0</span>
        <div class="domain-switcher">
          <button class="domain-switch-btn active" data-domain="aircraft">✈️ B737-800 & CFM56 航空母树 (L0→L3)</button>
          <button class="domain-switch-btn" data-domain="bridge">🌉 悬索大桥主跨与锚碇母树 (Ch.18)</button>
        </div>
      </div>

      <nav id="breadcrumb-trail" class="breadcrumb-trail"></nav>

      <div class="toolbar-controls">
        <div class="explode-control">
          <span>正交拆解</span>
          <input id="explode-slider" type="range" min="0" max="100" value="18" />
          <span id="explode-value" class="mono-val">18%</span>
        </div>
        <button id="btn-toggle-explode" class="tool-btn">一键爆炸/合拢</button>
        <button id="btn-toggle-ruler" class="tool-btn active">CAD 站位标尺</button>
        <button id="btn-toggle-ghost" class="tool-btn active">父级幽灵线框</button>
      </div>
    </header>

    <!-- Main 3-Column Digital Twin Workbench -->
    <main class="main-stage">
      <!-- Left Sidebar: Standard MountingPort Slots & Modular Scene Graph -->
      <aside class="side-panel">
        <section class="panel-section">
          <div class="section-header">
            <span>🔌 标准挂载接口槽位 (MountingPort)</span>
            <span>点击定位/下钻</span>
          </div>
          <div id="mounting-port-list" class="tree-list"></div>
        </section>

        <section class="panel-section">
          <div class="section-header">
            <span>🧩 当前层级结构树 (Scene Graph)</span>
            <span>FS/BL/WL/Ax.Sta</span>
          </div>
          <div id="scene-graph-list" class="tree-list"></div>
        </section>
      </aside>

      <!-- Center 3D CAD Viewport -->
      <section class="center-viewport">
        <div class="hud-banner">
          <div id="active-level-banner-title" class="hud-banner-title"></div>
          <div id="active-level-datum-spec" class="hud-banner-datum"></div>
          <div id="active-level-summary" class="hud-banner-summary"></div>
        </div>

        <div id="viewport-canvas-wrap"></div>

        <div class="hud-legend-bar">
          <div>
            <span><i class="legend-dot" style="background:#34d399"></i>标准挂载端口 (MountingPort)</span>
            <span style="margin-left:12px"><i class="legend-dot" style="background:#06b6d4"></i>N1 低压轴系 (Fan + 3-Booster + 4-LPT)</span>
            <span style="margin-left:12px"><i class="legend-dot" style="background:#f59e0b"></i>N2 高压轴系 (9-HPC + Single-HPT)</span>
            <span style="margin-left:12px"><i class="legend-dot" style="background:#ef4444"></i>单晶气冷叶片与燃烧室热端</span>
          </div>
          <div>操作：左键拖拽旋转 · 右键平移 · 滚轮缩放 · 单击选中零件 · 双击绿色接口下钻</div>
        </div>
      </section>

      <!-- Right Sidebar: CAD Datum Inspector & Baidu PP-OCRv4 Blueprint Evidence -->
      <aside class="side-panel right-panel">
        <section class="panel-section">
          <div class="section-header">
            <span>📐 选中组件 / 接口 CAD 空间基准检视器</span>
            <span>REAL DATUM</span>
          </div>
          <div class="inspector-field">
            <div class="field-label">组件 / 标准端口名称</div>
            <div id="inspector-part-title" class="field-val"></div>
          </div>
          <div class="inspector-field">
            <div class="field-label">工业空间基准坐标 (FS / BL / WL / WS / Axial Sta.)</div>
            <div id="inspector-part-datum" class="field-val mono"></div>
          </div>
          <div class="inspector-field">
            <div class="field-label">接口标准 / 材料牌号与法兰规格</div>
            <div id="inspector-part-material" class="field-val"></div>
          </div>
          <div class="inspector-field">
            <div class="field-label">工程结构与传力路径说明</div>
            <div id="inspector-part-desc" class="field-val" style="font-weight:400;color:#cbd5e1;font-size:12px"></div>
          </div>
          <button id="inspector-drill-btn" class="drill-action-btn"></button>
        </section>

        <section class="panel-section">
          <div class="section-header">
            <span>📚 真实工业母本图鉴库 (Firecrawl + 百度 PP-OCRv4)</span>
            <span>4 册权威手册</span>
          </div>
          <div class="ref-item">
            <div><strong>1. Boeing 737-800 Structural Stations Manual</strong></div>
            <div class="ref-code">ntsb_b737_800_structures_stations.pdf (Fig 1–3)</div>
            <div style="color:#94a3b8">提取机身隔框 STA 130–1217、水线 WL 148.5–306.5（R=74.0"）及机翼站位 WS 156.25–691.50、短舱中心线 CL NAC WBL 190.97。</div>
          </div>
          <div class="ref-item">
            <div><strong>2. CFMI CFM56 Basic Engine Manual (CTC-044)</strong></div>
            <div class="ref-code">cfm56_basic_engine_ctc044.pdf (Pages 24, 30, 32, 34)</div>
            <div style="color:#94a3b8">提取四大主模块、六大核心段、Sump A/B 五主轴承（1#–5#）及 N1/N2 同心双转子轴向站位。</div>
          </div>
          <div class="ref-item">
            <div><strong>3. Rolls-Royce: The Jet Engine (5th Ed.)</strong></div>
            <div class="ref-code">rolls_royce_the_jet_engine.pdf (Ch.5–6)</div>
            <div style="color:#94a3b8">提取 L3 高压涡轮三齿枞树形榫槽（Fir-Tree Root）、单晶气膜孔叶片、主动间隙控制（ACC）与环形燃烧室旋流器。</div>
          </div>
          <div class="ref-item">
            <div><strong>4. Wai-Fah Chen: Bridge Engineering Handbook</strong></div>
            <div class="ref-code">bridge_engineering_handbook_ch18.pdf (Ch.18)</div>
            <div style="color:#94a3b8">提取悬索桥垂跨比 f/L=1:9.52、门式索塔鞍座、重力式锚碇散索鞍与正交异性扁平闭口钢箱梁 U 肋基准。</div>
          </div>
        </section>

        <section class="panel-section">
          <div class="section-header">
            <span>🔍 百度 PP-OCRv4 图纸站位实测识别流</span>
            <span>349 处坐标框</span>
          </div>
          <div class="ocr-box">
            <div><strong>[B737 Fig.2 Fuselage Stations OCR]:</strong> ${b737OcrSample}</div>
            <div style="margin-top:6px"><strong>[B737 Fig.3 Wing Stations OCR]:</strong> ${wingOcrSample}</div>
            <div style="margin-top:6px"><strong>[CFM56 CTC-044 Cutaway OCR]:</strong> ${cfmOcrSample}</div>
          </div>
        </section>
      </aside>
    </main>
  </div>

  <script type="module">
${combinedJs}
  </script>
</body>
</html>
`;

fs.writeFileSync(path.join(DIST_DIR, 'index.html'), htmlContent, 'utf8');
fs.mkdirSync(path.dirname(TARGET_STUDIO_HTML), { recursive: true });
fs.writeFileSync(TARGET_STUDIO_HTML, htmlContent, 'utf8');
console.log('Built standalone studio HTML:', TARGET_STUDIO_HTML, 'size:', htmlContent.length, 'bytes');
