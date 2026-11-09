/**
 * Industrial Digital Twin Spatial Datum & MountingPort Schema
 *
 * Strictly enforces real-world engineering coordinate systems:
 * 1. Aircraft Datum (Boeing 737-800 Structural Repair Manual / IPC):
 *    - FS / STA : Fuselage Station (inches aft of forward datum plane; Nose Radome = STA 130.0)
 *    - BL / WBL : Buttock Line / Wing Buttock Line (inches left/right of fuselage centerline BL 0.0)
 *    - WL       : Water Line (inches above horizontal reference datum plane; Crown = WL 306.5, Keel = WL 148.5)
 *    - WS       : Wing Station (inches along wing front/rear spar sweep axis from WS 156.25 to WS 691.50)
 *
 * 2. Turbofan Engine Datum (CFM56-7B CTC-044 / Rolls-Royce The Jet Engine):
 *    - Engine Axial Station (Sta. 0 Intake, Sta. 12 Fan Frame, Sta. 25 HPC Inlet, Sta. 3 Combustor Inlet,
 *      Sta. 4 HPT Inlet, Sta. 495 LPT Inlet, Sta. 5 Turbine Rear Frame, Sta. 8 Core Nozzle)
 *    - Radial Pitch Circle Radius (mm / inches from engine N1/N2 coaxial centerline)
 *    - Circumferential Clocking Angle (deg / o'clock position looking forward, e.g., 6 o'clock AGB drive)
 *
 * 3. Suspension Bridge Datum (Wai-Fah Chen Bridge Engineering Handbook Ch. 18):
 *    - Chainage / Station (K+m along main bridge longitudinal axis)
 *    - Elevation (EL in meters above mean sea level)
 *    - Transverse Offset (CL in meters from deck centerline)
 */

export const INCH_TO_METER = 0.0254;
export const SCALE_3D = 0.25; // 1 meter = 0.25 Three.js world units for ergonomic CAD inspection

/**
 * Converts Boeing 737-800 (STA, BL, WL) inches into Three.js world coordinates (X, Y, Z)
 * Center of model reference: STA 601.875 (Wing Center Box midpoint), BL 0.0, WL 208.1 (Main Cabin Floor Line)
 * - X axis: Longitudinal (aft is +X, nose is -X)
 * - Y axis: Vertical (up is +Y, down is -Y)
 * - Z axis: Lateral (right/starboard wing is +Z, left/port wing is -Z)
 */
export function fsBlWlToWorld(staIn, blIn, wlIn) {
  const refSta = 601.875;
  const refWl = 208.1;
  const xMeters = (staIn - refSta) * INCH_TO_METER;
  const yMeters = (wlIn - refWl) * INCH_TO_METER;
  const zMeters = blIn * INCH_TO_METER;
  return {
    x: +(xMeters * SCALE_3D).toFixed(4),
    y: +(yMeters * SCALE_3D).toFixed(4),
    z: +(zMeters * SCALE_3D).toFixed(4),
    xMeters: +xMeters.toFixed(3),
    yMeters: +yMeters.toFixed(3),
    zMeters: +zMeters.toFixed(3),
    datumLabel: `STA ${staIn.toFixed(1)} | BL ${blIn >= 0 ? '+' : ''}${blIn.toFixed(2)} | WL ${wlIn.toFixed(1)}`
  };
}

/**
 * Converts Engine Local Axial Station (mm aft of Fan Spinner Tip Sta. 0) and Radial/Clocking
 * into offset coordinates relative to the Engine Mounting Datum.
 */
export function engineStationToLocal(axialMm, radiusMm = 0, clockDeg = 0) {
  const rad = (clockDeg * Math.PI) / 180;
  const xMeters = axialMm / 1000;
  const yMeters = (radiusMm / 1000) * Math.cos(rad);
  const zMeters = (radiusMm / 1000) * Math.sin(rad);
  return {
    x: +(xMeters * SCALE_3D).toFixed(4),
    y: +(yMeters * SCALE_3D).toFixed(4),
    z: +(zMeters * SCALE_3D).toFixed(4),
    datumLabel: `Ax.Sta +${axialMm}mm | R=${radiusMm}mm @ ${clockDeg}°`
  };
}

/**
 * Converts Suspension Bridge (Chainage m, Elevation m, Transverse Offset m) into Three.js world coordinates
 */
export function bridgeDatumToWorld(chainageM, elevationM, offsetClM) {
  const bridgeScale = 0.014; // 1000m main span -> 14 world units
  const refChainage = 1000.0; // K1+000 Midspan
  const refEl = 65.0; // Deck Reference Elevation +65.0m
  return {
    x: +((chainageM - refChainage) * bridgeScale).toFixed(4),
    y: +((elevationM - refEl) * bridgeScale).toFixed(4),
    z: +(offsetClM * bridgeScale).toFixed(4),
    datumLabel: `K${Math.floor(chainageM / 1000)}+${String(Math.round(chainageM % 1000)).padStart(3, '0')} | EL +${elevationM.toFixed(1)}m | CL ${offsetClM >= 0 ? '+' : ''}${offsetClM.toFixed(1)}m`
  };
}

/**
 * Validates a MountingPort contract between a parent slot and a child subsystem module.
 */
export function verifyMountingPortMate(parentPort, childPort) {
  return {
    portId: parentPort.id,
    interfaceStandard: parentPort.interfaceStandard,
    parentDatum: parentPort.datumCoord,
    boltCircleMm: parentPort.boltCircleMm,
    loadVector: parentPort.loadTransferAxes.join(', '),
    isCompatible: parentPort.id === childPort.parentPortId
  };
}
