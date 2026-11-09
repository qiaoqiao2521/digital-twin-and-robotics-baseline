/**
 * Real-World Industrial Spatial Datum Library
 *
 * All coordinates are derived from official engineering manuals in `../references/`:
 * 1. `ntsb_b737_800_structures_stations.pdf` (Boeing 737-800 Figure 1 3-View, Figure 2 Fuselage Stations, Figure 3 Wing Stations)
 * 2. `cfm56_basic_engine_ctc044.pdf` (CFMI Training Manual CTC-044: 4 Major Modules, 6 Core Sections, 5 Main Bearings, 2 Concentric Shafts)
 * 3. `rolls_royce_the_jet_engine.pdf` (Rolls-Royce: High-Pressure Turbine Fir-Tree Blade Roots, Active Clearance Control & Annular Combustor)
 * 4. `bridge_engineering_handbook_ch18_suspension_bridges.pdf` (Wai-Fah Chen Ch.18 Suspension Bridge Datum System)
 */

import { fsBlWlToWorld, engineStationToLocal, bridgeDatumToWorld } from '../schema/datum-types.js';

export const B737_800_DATUM = {
  aircraftModel: 'Boeing 737-800 (Twin-Turbofan Narrow-Body Airliner)',
  referenceManual: 'Boeing 737-800 Structural Repair Manual (SRM) / IPC Figures 1–3',
  overallDimensions: {
    lengthM: 39.47,        // 129 ft 6 in
    wingspanM: 34.31,      // 112 ft 7 in (WBL -680.40 to +680.40)
    tailHeightM: 12.55,    // 41 ft 2 in
    fuselageWidthIn: 148.0, // R = 74.0 in upper lobe radius (3.76 m)
    fuselageHeightIn: 158.0, // WL 148.5 to WL 306.5 (4.01 m)
    nacelleGroundClearanceIn: 18.0 // 1 ft 6 in minimum ground clearance
  },
  waterLines: {
    keelBottom: 148.5,
    lowerBilge: 176.0,
    cabinFloorTop: 208.1,
    windowBeltLower: 232.5,
    windowBeltUpper: 246.1,
    lobeCenterUpper: 232.5,
    crownTop: 306.5,
    finTip: 642.0
  },
  buttockLines: {
    centerline: 0.0,
    sideOfBodyRib: 71.24,
    fuselageMaxHalfWidth: 74.0,
    nacelleCenterline: 190.97, // CL NAC APPROX. WBL 190.97 (4.85 m)
    mainGearTrunnion: 162.5,
    wingtip: 680.40,
    horizontalTailTip: 282.5
  },
  fuselageSections: [
    {
      id: 'SEC-41',
      name: 'Section 41 — Nose Radome, Flight Deck & Forward Electronics Bay',
      staStart: 130.0,
      staEnd: 360.0,
      color: 0x38bdf8,
      keyStations: [
        { sta: 130.0, role: 'Nose Radome Apex & Weather Radar Bulkhead' },
        { sta: 178.0, role: 'Forward Pressure Bulkhead (Dome)' },
        { sta: 224.8, role: 'Nose Landing Gear (NLG) Wheel Well & Trunnion Bulkhead' },
        { sta: 259.5, role: 'Flight Deck Control Pedestal & Windshield Frame' },
        { sta: 291.5, role: 'Forward Entry / Galley Service Door Frame Cutout' },
        { sta: 360.0, role: 'Section 41 / 43 Production Splice Ring Frame' }
      ]
    },
    {
      id: 'SEC-43',
      name: 'Section 43 — Forward Passenger Cabin & Lower Cargo Hold',
      staStart: 360.0,
      staEnd: 540.0,
      color: 0x60a5fa,
      keyStations: [
        { sta: 360.0, role: 'Sec 41/43 Splice Frame' },
        { sta: 400.0, role: 'Forward Cabin Ring Frame & Floor Beam' },
        { sta: 440.0, role: 'Forward Lower Cargo Door Frame' },
        { sta: 480.0, role: 'Mid-Forward Ring Frame' },
        { sta: 500.0, role: 'Forward Overwing Frame' },
        { sta: 540.0, role: 'Section 43 / 44 Production Splice & Wing Front Spar Bulkhead' }
      ]
    },
    {
      id: 'SEC-44',
      name: 'Section 44 — Wing Center Section, Keel Beam & Overwing Exit Frames',
      staStart: 540.0,
      staEnd: 727.0,
      color: 0xf59e0b,
      keyStations: [
        { sta: 540.0, role: 'Center Wing Box Front Spar Bulkhead (Heavy Forged Frame)' },
        { sta: 578.0, role: 'Type III Overwing Emergency Exit Forward Frame' },
        { sta: 601.8, role: 'Center Wing Box Mid-Span Rib & Keel Beam Box Web' },
        { sta: 635.0, role: 'Type III Overwing Emergency Exit Aft Frame' },
        { sta: 663.75, role: 'Center Wing Box Rear Spar Bulkhead (Primary Bending Carry-Through)' },
        { sta: 706.26, role: 'Main Landing Gear (MLG) Trunnion Support Beam & Wheel Well Aft Wall' },
        { sta: 727.0, role: 'Section 44 / 46 Production Splice Ring Frame' }
      ]
    },
    {
      id: 'SEC-46',
      name: 'Section 46 — Aft Passenger Cabin & Aft Cargo Bay',
      staStart: 727.0,
      staEnd: 887.0,
      color: 0x34d399,
      keyStations: [
        { sta: 727.0, role: 'Sec 44/46 Splice Frame' },
        { sta: 767.0, role: 'Aft Cabin Ring Frame' },
        { sta: 807.0, role: 'Aft Lower Cargo Door Frame Cutout' },
        { sta: 847.0, role: 'Aft Cabin Ring Frame' },
        { sta: 887.0, role: 'Section 46 / 47 Splice Frame' }
      ]
    },
    {
      id: 'SEC-47',
      name: 'Section 47 — Rear Entry Door Bay & Hemispherical Aft Pressure Bulkhead',
      staStart: 887.0,
      staEnd: 1016.0,
      color: 0xa78bfa,
      keyStations: [
        { sta: 887.0, role: 'Sec 46/47 Splice Frame' },
        { sta: 947.5, role: 'Aft Passenger / Service Door Cutout Frame' },
        { sta: 1016.0, role: 'Aft Hemispherical Pressure Bulkhead & Fin Front Spar Root' }
      ]
    },
    {
      id: 'SEC-48',
      name: 'Section 48 — Empennage Support Structure, Stabilizer Jackscrew & APU Compartment',
      staStart: 1016.0,
      staEnd: 1217.0,
      color: 0xf472b6,
      keyStations: [
        { sta: 1016.0, role: 'Unpressurized Tailcone Forward Frame' },
        { sta: 1068.0, role: 'Vertical Fin Rear Spar & Horizontal Stabilizer Hinge Bulkhead' },
        { sta: 1126.0, role: 'APU Firewall Bulkhead' },
        { sta: 1156.0, role: 'Garrett/Honeywell 131-9B APU Mounting Trunnion Station' },
        { sta: 1217.0, role: 'APU Exhaust Tailcone Tip' }
      ]
    }
  ],

  /**
   * Wing Stations (WS) & Wing Buttock Lines (WBL) from Figure 3 of NTSB B737-800 Report
   */
  wingRibStations: [
    { ribNo: 1, wbl: 71.24, ws: 156.25, role: 'Side-of-Body Root Rib (Fuselage Mate)' },
    { ribNo: 2, wbl: 98.50, ws: 180.00, role: 'Inboard Krueger Flap Rib' },
    { ribNo: 3, wbl: 190.97, ws: 204.25, role: 'Engine Pylon & Nacelle Primary Mounting Rib (CL NAC WBL 190.97)' },
    { ribNo: 4, wbl: 215.00, ws: 228.25, role: 'Outboard Nacelle Strut Rib' },
    { ribNo: 5, wbl: 242.00, ws: 253.00, role: 'Wing Planform Yehudi Break / MLG Support Rib' },
    { ribNo: 6, wbl: 270.00, ws: 278.50, role: 'Inboard Slat / Flap Track #2 Rib' },
    { ribNo: 8, wbl: 318.00, ws: 326.00, role: 'Mid-Wing Fuel Tank Baffle Rib' },
    { ribNo: 11, wbl: 392.00, ws: 405.50, role: 'Outboard Flap Track #3 Rib' },
    { ribNo: 14, wbl: 472.00, ws: 485.00, role: 'Inboard Aileron Hinge Rib' },
    { ribNo: 18, wbl: 576.00, ws: 591.50, role: 'Surge Tank Rib' },
    { ribNo: 22, wbl: 680.40, ws: 691.50, role: 'Wingtip Closure & Blended Winglet Root Rib' }
  ],

  /**
   * Standard MountingPort Registry on L0 Airframe
   * Every port specifies exact FS/BL/WL coordinates, flange bolt circle, normal vector, and load transfer axes.
   */
  mountingPorts: [
    {
      id: 'PORT-PYLON-LH',
      name: '左翼动力短舱与吊架主挂载端口 (LH Wing-to-Pylon Mounting Interface)',
      interfaceStandard: 'Boeing D6-51991 / ATA 54-10 Over-Wing-Torque-Box 4-Pin Fuse Mount',
      parentLevel: 'L0',
      childLevel: 'L1',
      compatibleModuleId: 'MOD-L1-PYLON-LH',
      staIn: 518.0,
      blIn: -190.97,
      wlIn: 192.0,
      wsIn: 204.25,
      toeInDeg: 1.0,
      boltCircleMm: 420,
      fusePinDiaMm: 69.85,
      loadTransferAxes: ['Fx (Thrust)', 'Fy (Side)', 'Fz (Vertical Weight)', 'Mx (Roll)', 'My (Pitch)', 'Mz (Yaw)'],
      worldPos: fsBlWlToWorld(518.0, -190.97, 192.0),
      description: '位于左翼前梁 WS 204.25 / WBL -190.97 处，采用四组保险销（Fuse Pins）将吊架扭矩盒（Pylon Torque Box）与机翼前梁上/下接头及翼肋腹板连接，设计有碰撞过载自动脱开保护。'
    },
    {
      id: 'PORT-PYLON-RH',
      name: '右翼动力短舱与吊架挂载端口 (RH Wing-to-Pylon Interface)',
      interfaceStandard: 'Boeing D6-51991 / ATA 54-10 Symmetrical Port',
      parentLevel: 'L0',
      childLevel: 'L1',
      compatibleModuleId: 'MOD-L1-PYLON-RH',
      staIn: 518.0,
      blIn: 190.97,
      wlIn: 192.0,
      wsIn: 204.25,
      toeInDeg: -1.0,
      boltCircleMm: 420,
      fusePinDiaMm: 69.85,
      loadTransferAxes: ['Fx (Thrust)', 'Fy (Side)', 'Fz (Vertical Weight)', 'Mx', 'My', 'Mz'],
      worldPos: fsBlWlToWorld(518.0, 190.97, 192.0),
      description: '右翼对称发动机吊架接口（WBL +190.97 / WS 204.25）。'
    },
    {
      id: 'PORT-MLG-LH',
      name: '左主起落架耳轴挂载舱 (LH Main Landing Gear Trunnion Port)',
      interfaceStandard: 'ATA 32-11 Cantilevered MLG Trunnion & Drag Strut Socket',
      parentLevel: 'L0',
      childLevel: 'L1-EXT',
      compatibleModuleId: 'MOD-L1-MLG-LH',
      staIn: 706.26,
      blIn: -162.5,
      wlIn: 182.0,
      wsIn: 253.0,
      boltCircleMm: 380,
      loadTransferAxes: ['Fz (Landing Impact)', 'Fx (Braking Drag)', 'Fy (Side Drift)'],
      worldPos: fsBlWlToWorld(706.26, -162.5, 182.0),
      description: '位于中央翼盒后方 STA 706.26 主起落架承力梁与机翼后梁之间，承载着陆冲击与刹车纵向载荷。'
    },
    {
      id: 'PORT-NLG-FWD',
      name: '前起落架耳轴挂载舱 (Nose Landing Gear Trunnion Port)',
      interfaceStandard: 'ATA 32-21 NLG Trunnion & Lock Link Interface',
      parentLevel: 'L0',
      childLevel: 'L1-EXT',
      compatibleModuleId: 'MOD-L1-NLG',
      staIn: 224.8,
      blIn: 0.0,
      wlIn: 166.0,
      boltCircleMm: 290,
      loadTransferAxes: ['Fz (Nose Load)', 'Fx (Towing/Taxi)', 'Mz (Steering Torque)'],
      worldPos: fsBlWlToWorld(224.8, 0.0, 166.0),
      description: '位于 Section 41 前机身 STA 224.8 / BL 0.0 前起落架舱壁。'
    },
    {
      id: 'PORT-APU-TAIL',
      name: '尾椎 APU 辅助动力装置挂载舱 (Tailcone APU Firewall Mount Port)',
      interfaceStandard: 'ATA 49-10 3-Point Vibration Isolator Trunnion Mount',
      parentLevel: 'L0',
      childLevel: 'L1-EXT',
      compatibleModuleId: 'MOD-L1-APU-131-9B',
      staIn: 1156.0,
      blIn: 0.0,
      wlIn: 242.0,
      boltCircleMm: 310,
      loadTransferAxes: ['Fx', 'Fy', 'Fz'],
      worldPos: fsBlWlToWorld(1156.0, 0.0, 242.0),
      description: '位于 Section 48 尾椎防火墙（STA 1126）后方 STA 1156 处，挂载 Honeywell 131-9B 辅助动力装置。'
    }
  ]
};

/**
 * L1 Wing Pylon & Nacelle Assembly Datum (ATA 54 / ATA 71)
 */
export const L1_PYLON_NACELLE_DATUM = {
  moduleId: 'MOD-L1-PYLON-LH',
  name: 'L1 左翼吊架扭矩盒与短舱总成 (B737-800 Wing Pylon & Nacelle System)',
  referenceManual: 'Boeing 737-800 IPC ATA 54 (Nacelles/Pylons) & ATA 71 (Powerplant)',
  parentPortId: 'PORT-PYLON-LH',
  originStaIn: 452.0, // Forward lip of inlet cowl at STA 452.0, Fan Frame at STA 492.0, Rear Mount at STA 556.0
  originBlIn: -190.97,
  originWlIn: 162.0,  // Engine centerline WL 162.0 (30 inches below wing front spar WL 192.0)
  subcomponents: [
    {
      id: 'PYLON-TORQUE-BOX',
      code: 'ATA 54-11',
      name: '钛合金主承力吊架扭矩盒 (Titanium Pylon Primary Torque Box & Upper Link)',
      axialOffsetMm: 1450,
      verticalOffsetMm: 720,
      explodeVec: { x: 0, y: 1.35, z: 0 },
      material: 'Ti-6Al-4V Forged Bulkheads + Inconel 718 Aft Heat Shield',
      description: '连接机翼前梁（WS 204.25）与发动机前/后安装节的主传力盒段，内设防火隔舱、引气导管与液压/燃油断开接头。'
    },
    {
      id: 'THRUST-STRUT-PAIR',
      code: 'ATA 71-22',
      name: '双斜向推力拉杆与球铰横梁 (Diagonal Thrust Links & Whiffletree Balance Beam)',
      axialOffsetMm: 1200,
      verticalOffsetMm: 460,
      explodeVec: { x: -0.3, y: 0.95, z: 0 },
      material: '15-5PH High-Strength Precipitation Hardening Stainless Steel',
      description: '将 CFM56 风扇机匣 12 点钟位置的轴向推力（Fx = 121.4 kN）传递至吊架扭矩盒底部，通过平衡横梁消除偏心弯矩。'
    },
    {
      id: 'INLET-COWL',
      code: 'ATA 71-11',
      name: '短舱进气道唇口与消音内筒 (Acoustic Inlet Cowl & Thermal Anti-Ice Lip)',
      axialOffsetMm: 0,
      verticalOffsetMm: 0,
      explodeVec: { x: -1.6, y: 0, z: 0 },
      material: '2219 Aluminum Spin-Formed Lip + Graphite/Epoxy Acoustic Honeycomb Barrel',
      description: '位于发动机 Sta. 0 前方，内含热空气防冰笛管（Piccolo Tube）与双自由度穿孔吸音蜂窝夹层。'
    },
    {
      id: 'FAN-COWL-LH',
      code: 'ATA 71-13-L',
      name: '左侧风扇包皮舱门 (Left Hand Hinged Fan Cowl Door)',
      axialOffsetMm: 820,
      verticalOffsetMm: 0,
      explodeVec: { x: 0, y: 0.25, z: -1.45 },
      material: 'Carbon Fiber Reinforced Polymer (CFRP) Sandwich Panel',
      description: '铰接于吊架上缘，打开角度可达 55°，完全暴露 CFM56 风扇机匣与 6 点钟附件机匣（AGB）供航线维护。'
    },
    {
      id: 'FAN-COWL-RH',
      code: 'ATA 71-13-R',
      name: '右侧风扇包皮舱门 (Right Hand Hinged Fan Cowl Door)',
      axialOffsetMm: 820,
      verticalOffsetMm: 0,
      explodeVec: { x: 0, y: 0.25, z: 1.45 },
      material: 'Carbon Fiber Reinforced Polymer (CFRP) Sandwich Panel',
      description: '右侧铰接风扇包皮舱门，底部设三组承力拉扣（Tension Latches）与左侧包皮锁紧成环向箍。'
    },
    {
      id: 'TR-CDUCT-PAIR',
      code: 'ATA 78-31',
      name: 'C型反推力装置与叶栅套筒总成 (Translating Sleeve C-Duct Thrust Reverser)',
      axialOffsetMm: 1850,
      verticalOffsetMm: 0,
      explodeVec: { x: 0.85, y: -0.2, z: -1.1 },
      material: 'Aluminum-Graphite Composite Translating Cowl + Magnesium/Composite Turning Cascades',
      description: '由液压作动筒驱动后移，展开阻流门（Blocker Doors）封闭外涵道，使涵道气流经周向偏转叶栅向前排出产生反推力。'
    }
  ],
  childMountingPorts: [
    {
      id: 'PORT-ENG-FWD-STA12',
      name: '发动机前安装节接口 (Forward Engine Mount @ Fan Frame Sta. 12)',
      interfaceStandard: 'CFMI CTC-044 / ATA 71-21 Forward Cone Bolt & Clevis Interface',
      parentLevel: 'L1',
      childLevel: 'L2',
      compatibleModuleId: 'MOD-L2-CFM56-7B',
      engineAxialMm: 780, // Fan Frame 12 o'clock flange
      radiusMm: 810,
      clockDeg: 0,
      boltCircleMm: 260,
      loadTransferAxes: ['Fy (Lateral Side Load)', 'Fz (Forward Vertical Weight)', 'Fx (via Dual Thrust Links)'],
      description: '刚性对位 CFM56 风扇框架（Fan Frame Sta. 12）12 点钟外环凸缘，承担前部垂直载荷、侧向载荷与全部轴向推力。'
    },
    {
      id: 'PORT-ENG-AFT-STA5',
      name: '发动机后安装节接口 (Aft Engine Mount @ Turbine Rear Frame Sta. 5)',
      interfaceStandard: 'CFMI CTC-044 / ATA 71-22 Rear Tangential Link & Torque Restraint',
      parentLevel: 'L1',
      childLevel: 'L2',
      compatibleModuleId: 'MOD-L2-CFM56-7B',
      engineAxialMm: 2290, // Turbine Rear Frame 12 o'clock flange
      radiusMm: 495,
      clockDeg: 0,
      boltCircleMm: 220,
      loadTransferAxes: ['Fz (Rear Vertical Weight)', 'Fy (Rear Side Load)', 'Mx (Engine Roll Torque Reaction)'],
      description: '对位涡轮后框架（TRF Sta. 5）12 点钟安装凸耳，承受后部垂直/侧向载荷与转子反扭矩（Mx），同时释放轴向热膨胀（ΔX）。'
    }
  ]
};

/**
 * L2 CFM56-7B Turbofan Engine 4 Major Modules / 6 Core Functional Sections + 5 Bearings + 2 Shafts
 * Directly transcribed from CFMI Training Manual `cfm56_basic_engine_ctc044.pdf` Pages 24, 30, 32, 34
 */
export const L2_CFM56_DATUM = {
  moduleId: 'MOD-L2-CFM56-7B',
  name: 'L2 CFM56-7B27 双转子大涵道比涡扇发动机 (6 Core Sections + 5 Bearings + N1/N2 Spools)',
  referenceManual: 'CFMI Official Manual CTC-044 (Pages 24, 30, 32, 34) & Rolls-Royce The Jet Engine',
  parentPortIds: ['PORT-ENG-FWD-STA12', 'PORT-ENG-AFT-STA5'],
  specs: {
    bypassRatio: '5.1 : 1',
    overallPressureRatio: '32.8 : 1',
    maxTakeoffThrustKn: 121.4, // 27,300 lbf
    fanDiameterMm: 1549,       // 61.0 inches
    overallLengthMm: 2508,     // 98.7 inches
    n1LpMaxRpm: 5380,          // 100% N1 = 5175 RPM
    n2HpMaxRpm: 15183          // 100% N2 = 14460 RPM
  },
  bearingsAndSumps: [
    { id: 'BRG-1', number: 1, type: 'Ball Bearing (Thrust + Radial)', rotor: 'N1 (LP Shaft)', sump: 'Forward Sump A (Fan Frame)', axialMm: 460, radiusMm: 155 },
    { id: 'BRG-2', number: 2, type: 'Roller Bearing (Radial)', rotor: 'N1 (LP Shaft)', sump: 'Forward Sump A (Fan Frame)', axialMm: 640, radiusMm: 165 },
    { id: 'BRG-3', number: 3, type: 'Duplex Ball + Roller Bearing (HP Thrust + Radial)', rotor: 'N2 (HP Shaft)', sump: 'Forward Sump A (Rear Cone)', axialMm: 830, radiusMm: 205 },
    { id: 'BRG-4', number: 4, type: 'Intershaft / Rear HP Roller Bearing', rotor: 'N2 (HP Shaft Aft)', sump: 'Rear Sump B (TRF Centerbody)', axialMm: 1840, radiusMm: 190 },
    { id: 'BRG-5', number: 5, type: 'Rear LP Roller Bearing', rotor: 'N1 (LP Shaft Aft)', sump: 'Rear Sump B (TRF Centerbody)', axialMm: 2220, radiusMm: 150 }
  ],
  coreSections: [
    {
      id: 'SEC-M1-FAN-BOOSTER',
      majorModule: '1. Fan Major Module (Blue in CTC-044 p.34)',
      name: 'M1 风扇转子、三级低压增压级与风扇主承力框架 (Fan, 3-Stage Booster & Fan Frame)',
      stationCode: 'Sta. 0 → Sta. 25',
      axialStartMm: 0,
      axialEndMm: 860,
      outerRadiusMm: 774.5, // 1549mm diameter
      innerRadiusMm: 160,
      bladeCount: 24, // 24 wide-chord titanium fan blades
      boosterStages: 3,
      ogvStruts: 12, // 12 radial structural struts in Fan Frame
      explodeAxialMm: -720,
      explodeRadialMm: 0,
      color: 0x38bdf8,
      description: '包含 24 片宽弦实心钛合金风扇叶片（Ti-6Al-4V）、与风扇同轴旋转的 3 级低压增压压气机（LPC Booster）、12 根径向支板组成的风扇承力框架（Fan Frame，顶置前安装节 @ Sta. 12），以及前滑油腔 Sump A 内的 1# 滚珠轴承与 2# 滚柱轴承。'
    },
    {
      id: 'SEC-M2-HPC-9STAGE',
      majorModule: '2. Core Engine Major Module — Forward (Red in CTC-044 p.34)',
      name: 'M2 九级高压压气机与可变静子叶片系统 (9-Stage High-Pressure Compressor & VSV)',
      stationCode: 'Sta. 25 → Sta. 3',
      axialStartMm: 860,
      axialEndMm: 1460,
      outerRadiusMm: 430,
      innerRadiusMm: 210,
      stages: 9,
      vsvStages: 'IGV + Stages 1, 2, 3 Variable Stator Vanes',
      explodeAxialMm: -260,
      explodeRadialMm: 0,
      color: 0x60a5fa,
      description: '由高压转子（N2）驱动的 9 级轴流式高压压气机，前端设 3# 推力滚珠/滚柱组合轴承，进气导流叶片（IGV）与前 3 级静子采用电液伺服作动环联动调节迎角以防止喘振，第 4 级与第 9 级提供飞机引气与涡轮叶片冷却气源。'
    },
    {
      id: 'SEC-M3-COMBUSTOR',
      majorModule: '2. Core Engine Major Module — Mid (Red in CTC-044 p.34)',
      name: 'M3 短环形燃烧室与 20 支旋流燃油喷嘴 (Short Annular Combustion Chamber)',
      stationCode: 'Sta. 3 → Sta. 39',
      axialStartMm: 1460,
      axialEndMm: 1730,
      outerRadiusMm: 455,
      innerRadiusMm: 255,
      fuelNozzleCount: 20,
      explodeAxialMm: 120,
      explodeRadialMm: 0,
      color: 0xf59e0b,
      description: '高压压气机出口扩压器（Sta. 3）后方的短环形燃烧室，周向均布 20 支双油路雾化燃油喷嘴与文丘里旋流器，内外火焰筒采用多层气膜冷却（Film Cooling Louvers）承受 2000°C 核心火焰。支持点击下钻至 L3。'
    },
    {
      id: 'SEC-M4-HPT-SINGLE',
      majorModule: '2. Core Engine Major Module — Aft (Red in CTC-044 p.34)',
      name: 'M4 单级高功高压涡轮与主动间隙控制环 (Single-Stage High-Pressure Turbine & ACC)',
      stationCode: 'Sta. 4 → Sta. 42',
      axialStartMm: 1730,
      axialEndMm: 1910,
      outerRadiusMm: 465,
      innerRadiusMm: 230,
      rotorBladeCount: 72,
      ngvVaneCount: 42,
      explodeAxialMm: 420,
      explodeRadialMm: 0,
      color: 0xef4444,
      drillDownTargetId: 'MOD-L3-HPT-CORE',
      description: '全机热负荷与离心应力最高的核心模块：由 1 级高压涡轮导向器（NGV）与 72 片单晶气冷涡轮叶片（Rene N5 枞树形榫头 Fir-Tree Root）组成，直接驱动 9 级高压压气机（N2 = 15,183 RPM）。支持下钻进入 L3 叶片榫槽与冷却通道级拆解！'
    },
    {
      id: 'SEC-M5-LPT-TRF',
      majorModule: '3. Low-Pressure Turbine Major Module (Yellow in CTC-044 p.34)',
      name: 'M5 四级低压涡轮与涡轮后承力框架 (4-Stage LPT & Turbine Rear Frame TRF)',
      stationCode: 'Sta. 495 → Sta. 5 → Sta. 8',
      axialStartMm: 1910,
      axialEndMm: 2508,
      outerRadiusMm: 530,
      innerRadiusMm: 165,
      stages: 4,
      explodeAxialMm: 820,
      explodeRadialMm: 0,
      color: 0xa78bfa,
      description: '4 级低压涡轮膨胀提取燃气剩余能量，通过贯穿整机中心的同心内轴（N1 LP Shaft）驱动前端 1.55m 钛合金风扇与 3 级增压级。尾部涡轮后框架（TRF Sta. 5）支承后滑油腔 Sump B（4# 与 5# 滚柱轴承）及发动机后安装节。'
    },
    {
      id: 'SEC-M6-ACCESSORY-AGB',
      majorModule: '4. Accessory Drive Major Module (Green in CTC-044 p.34)',
      name: 'M6 中央锥齿轮箱、径向传动轴与附件齿轮箱 (IGB, Radial Drive Shaft & AGB)',
      stationCode: 'Sta. 12 @ 6:00 Clocking',
      axialStartMm: 480,
      axialEndMm: 1120,
      outerRadiusMm: 840,
      innerRadiusMm: 195,
      clockDeg: 180, // 6 o'clock bottom of fan case
      explodeAxialMm: -180,
      explodeRadialMm: -520,
      color: 0x10b981,
      description: '从高压转子（N2）前端经中央进气齿轮箱（IGB 锥齿轮副）引出功率，通过穿过风扇框架 6 点钟空心支板的径向传动轴（RDS）驱动转换齿轮箱（TGB）与弧形附件齿轮箱（AGB：挂载 IDG 发电机、液压泵、燃油泵与气动起动机）。'
    }
  ],
  childMountingPorts: [
    {
      id: 'PORT-HPT-ROTOR-SPLINE',
      name: '高压涡轮盘与 N2 鼓筒轴法兰接口 (HPT Rotor Disk-to-HP Shaft Curvic/Flange Coupling)',
      interfaceStandard: 'CFMI CTC-044 / Rolls-Royce Curvic Coupling & 72-Slot Fir-Tree Rim',
      parentLevel: 'L2',
      childLevel: 'L3',
      compatibleModuleId: 'MOD-L3-HPT-CORE',
      engineAxialMm: 1820,
      radiusMm: 345,
      clockDeg: 0,
      boltCircleMm: 410,
      loadTransferAxes: ['Mx (Shaft Torque 42,000 N·m)', 'Fx (Axial Gas Load)', 'Fr (Centrifugal Rim Tension)'],
      description: '位于发动机轴向站位 Sta. 4（+1820mm），通过高精度端面弧齿（Curvic Coupling）与高强度螺栓圆周连接高压涡轮盘与 N2 高压轴后锥体。点击此接口或 M4 模块可直接下钻进入 L3 高压涡轮与燃烧室微观级拆解。'
    }
  ]
};

/**
 * L3 High-Pressure Turbine (HPT) & Annular Combustor Micro-Assembly Datum
 * Based on Rolls-Royce "The Jet Engine" Turbine & Combustor chapters + CFM56 CTC-044 Page 30/32
 */
export const L3_HPT_MICRO_DATUM = {
  moduleId: 'MOD-L3-HPT-CORE',
  name: 'L3 高压涡轮盘、枞树形气冷单晶叶片与环形燃烧室喷嘴微观总成 (HPT & Combustor Micro-System)',
  referenceManual: 'Rolls-Royce The Jet Engine (Ch. 5 Combustion / Ch. 6 Turbines) & CFM56 CTC-044',
  parentPortId: 'PORT-HPT-ROTOR-SPLINE',
  components: [
    {
      id: 'L3-HPT-DISK',
      name: '粉末冶金镍基超合金高压涡轮轮盘 (Rene 88DT Powder-Metallurgy HPT Rotor Disk)',
      datumStation: 'Ax.Sta +1820mm | Bore R=145mm → Rim R=365mm',
      material: 'Rene 88DT Nickel-Base Superalloy Forging',
      explodeVec: { x: 0, y: 0, z: 0 },
      description: '轮盘中心孔采用厚轮毂抗周向应力设计，外缘精密拉削 72 道轴向枞树形榫槽（3-Tang Fir-Tree Broached Slots），盘腔内部引入高压压气机第 9 级冷气直通叶片根部进气孔。'
    },
    {
      id: 'L3-FIR-TREE-BLADES',
      name: '单晶定向凝固气膜冷却涡轮工作叶片 ×72 (Single-Crystal Rene N5 Film-Cooled Blades)',
      datumStation: 'Ax.Sta +1820mm | Pitch Circle R=415mm | 5.0° Angular Pitch',
      material: 'Rene N5 Single-Crystal Superalloy + EB-PVD YSZ Thermal Barrier Coating (TBC)',
      explodeVec: { x: 0.45, y: 0.85, z: 0 },
      description: '叶根采用三齿枞树形榫头（Fir-Tree Root）与锁片定位，允许热态微动膨胀而消除应力集中；叶身内部铸造多回程蛇形冷却通道（Serpentine Passages + Pin-Fins），前缘开设淋浴头气膜孔（Showerhead Film Cooling Holes）。'
    },
    {
      id: 'L3-STAGE1-NGV',
      name: '第一级高压涡轮导向器静叶环 (Stage-1 High-Pressure Nozzle Guide Vane Ring)',
      datumStation: 'Ax.Sta +1745mm | Pitch Circle R=410mm | 42 Cooled Vanes',
      material: 'Cobalt/Nickel Superalloy X-40 / Mar-M-509 with Internal Impingement Tube',
      explodeVec: { x: -0.95, y: 0, z: 0 },
      description: '位于燃烧室出口喉部（Sta. 4），将轴向高温燃气加速至接近音速并偏转约 65° 冲击高压涡轮工作叶片，静叶内嵌冲击冷却套管。'
    },
    {
      id: 'L3-ACC-SHROUD',
      name: '高压涡轮主动叶尖间隙控制外环与蜂窝封严块 (HPT Active Clearance Control Case & Abradable Shroud)',
      datumStation: 'Ax.Sta +1820mm | Shroud ID R=468mm | Case OD R=515mm',
      material: 'Inconel 718 Case + Sintered NiCrAlY Honeycomb Abradable Seal Segments',
      explodeVec: { x: 0.65, y: 1.15, z: 0 },
      description: '巡航状态下由 FADEC 控制引射外涵冷气吹拂涡轮机匣外环使其均匀收缩，将叶尖径向间隙精准控制在 0.4mm 以内，降低燃油消耗率（SFC）1.5% 以上。'
    },
    {
      id: 'L3-COMBUSTOR-NOZZLES',
      name: '环形燃烧室内外火焰筒与 20 支双锥旋流喷嘴环 (Annular Liner & 20 Duplex Fuel Swirlers)',
      datumStation: 'Ax.Sta +1475mm → +1720mm | Swirler Pitch Circle R=355mm',
      material: 'Hastelloy X / Haynes 188 Multi-Louvre Liner + Cobalt-Alloy Fuel Nozzles',
      explodeVec: { x: -1.85, y: 0, z: 0 },
      description: '20 支燃油喷嘴按 18° 分度角均布于环形火焰筒头部，初级旋流器形成中心回流区稳定火焰，次级掺混孔注入稀释空气将出口燃气温度廓线调整至涡轮导向器承受范围内。'
    }
  ]
};

/**
 * Second Root Twin System: Suspension Bridge Engineering Datum (Wai-Fah Chen Bridge Engineering Handbook Ch. 18)
 * Demonstrates that the Digital Twin Workbench & MountingPort architecture supports cross-domain civil/bridge engineering.
 */
export const BRIDGE_CH18_DATUM = {
  bridgeName: '现代大跨径钢箱梁悬索大桥 (1,385m Main Span Orthotropic Box-Girder Suspension Bridge)',
  referenceManual: 'Wai-Fah Chen & Lian Duan — Bridge Engineering Handbook, Chapter 18: Suspension Bridges',
  datumSystem: 'Chainage Station (K+m) | Elevation (EL m) | Transverse Offset (CL m)',
  spans: {
    westAnchorageChainage: 165.0,  // K0+165
    westPylonChainage: 500.0,      // K0+500
    midspanChainage: 1000.0,       // K1+000 (Main Span = 1000m scaled datum, 500m to 1500m)
    eastPylonChainage: 1500.0,     // K1+500
    eastAnchorageChainage: 1835.0, // K1+835
    deckElevationM: 65.0,          // EL +65.0m navigation clearance
    pylonTopElevationM: 195.0,     // EL +195.0m tower top saddle
    mainCableSagM: 105.0,          // Sag-to-span ratio f/L = 1 : 9.52 (Wai-Fah Chen Ch.18 optimal range 1/9 to 1/11)
    cableCenterOffsetClM: 16.5     // CL ±16.5m main cable transverse spacing (33.0m deck width)
  },
  mountingPorts: [
    {
      id: 'PORT-BRG-SADDLE-NW',
      name: '西索塔北肢塔顶主鞍座挂载槽 (West Pylon North Tower-Top Main Cable Saddle Port)',
      interfaceStandard: 'Bridge Eng. Handbook Ch.18.4 Cast-Steel Groove Saddle & PTFE Sliding Plate',
      parentLevel: 'L0',
      childLevel: 'L1',
      compatibleModuleId: 'MOD-BRG-L1-PYLON-SADDLE',
      datumCoord: 'K0+500 | EL +195.0m | CL -16.5m',
      boltCircleMm: 1800,
      loadTransferAxes: ['Fz (Vertical Cable Compression 340 MN)', 'Fx (Unbalanced Horizontal Force)'],
      worldPos: bridgeDatumToWorld(500.0, 195.0, -16.5),
      description: '位于西主塔 K0+500 塔顶高程 EL +195.0m 处，将主缆（PPWS 平行钢丝索股）的巨大竖向压力传递至门式钢筋混凝土索塔柱。'
    },
    {
      id: 'PORT-BRG-ANCHOR-W',
      name: '西岸重力式锚碇散索鞍与拉杆锚室接口 (West Gravity Anchorage Splay Saddle & Strand Shoe Chamber)',
      interfaceStandard: 'Bridge Eng. Handbook Ch.18.6 Gravity Block Splay Saddle & Prestressed Anchor Rods',
      parentLevel: 'L0',
      childLevel: 'L1',
      compatibleModuleId: 'MOD-BRG-L1-ANCHORAGE',
      datumCoord: 'K0+165 | EL +28.0m | CL ±16.5m',
      boltCircleMm: 3200,
      loadTransferAxes: ['Fx (Main Cable Tension 260 MN)', 'Fz (Uplift Resistance via Gravity Deadweight)'],
      worldPos: bridgeDatumToWorld(165.0, 28.0, -16.5),
      description: '位于西岸 K0+165 处，主缆经散索鞍（Splay Saddle）发散为 127 股平行钢丝束股，锚固于混凝土重力锚体后锚室预应力拉杆上。'
    },
    {
      id: 'PORT-BRG-DECK-MID',
      name: '跨中主缆索夹、吊索与正交异性钢箱梁耳板接口 (Midspan Cable Clamp, Hanger & Orthotropic Box Girder Port)',
      interfaceStandard: 'Bridge Eng. Handbook Ch.18.3 Aerodynamic Streamlined Box Girder & Pin-Ended Hanger',
      parentLevel: 'L1',
      childLevel: 'L2',
      compatibleModuleId: 'MOD-BRG-L2-BOX-GIRDER',
      datumCoord: 'K1+000 | EL +65.0m | CL ±16.5m',
      boltCircleMm: 650,
      loadTransferAxes: ['Fz (Deck Dead + Live Traffic Load)', 'Fy (Wind Drag)', 'Mx (Torsional Flutter Stiffness)'],
      worldPos: bridgeDatumToWorld(1000.0, 65.0, 0.0),
      description: '位于主跨中心 K1+000 处，展示流线型扁平闭口钢箱梁（梁高 3.5m，宽 33.0m）内部 U 形加劲肋、横隔板、风嘴与吊索销接耳板结构。'
    }
  ]
};
