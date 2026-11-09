/**
 * CAD Datum Ruler, Station Planes & 3D Technical Callout Label Builder
 * Renders authentic industrial station ticks (FS/STA, BL/WBL, WL, Engine Axial Sta., Chainage/EL) in 3D space.
 */

import * as THREE from 'three';
import { fsBlWlToWorld, bridgeDatumToWorld } from '../schema/datum-types.js';
import { axialMmToX } from './l2-cfm56-turbofan.js';

export function createCadLabelSprite(text, colorHex = '#38bdf8', scaleWidth = 0.85) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 96;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = 'rgba(7, 12, 22, 0.86)';
  ctx.strokeStyle = colorHex;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(6, 10, 500, 76, 10);
  ctx.fill();
  ctx.stroke();

  ctx.font = 'bold 28px "JetBrains Mono", "SFMono-Regular", Consolas, monospace';
  ctx.fillStyle = colorHex;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 256, 48);

  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false });
  const sprite = new THREE.Sprite(mat);
  sprite.scale.set(scaleWidth, scaleWidth * (96 / 512), 1);
  return sprite;
}

export function buildCadDatumRuler(domain, level, materials) {
  const group = new THREE.Group();
  group.name = `CAD_DATUM_RULER_${domain}_L${level}`;

  if (domain === 'aircraft') {
    if (level === 0) {
      // Fuselage Longitudinal Station (FS / STA) Ruler Axis along WL 120.0, BL 0.0
      const pNose = fsBlWlToWorld(130.0, 0, 118.0);
      const pTail = fsBlWlToWorld(1217.0, 0, 118.0);
      group.add(
        new THREE.Line(
          new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(pNose.x, pNose.y, 0),
            new THREE.Vector3(pTail.x, pTail.y, 0)
          ]),
          materials.datumLineCyan
        )
      );

      const keyFuselageTicks = [
        { sta: 130.0, label: 'STA 130 (Sec 41 Nose)' },
        { sta: 360.0, label: 'STA 360 (Sec 41/43)' },
        { sta: 540.0, label: 'STA 540 (Wing Box Fwd)' },
        { sta: 663.75, label: 'STA 663.75 (Wing Box Aft)' },
        { sta: 727.0, label: 'STA 727 (Sec 44/46)' },
        { sta: 887.0, label: 'STA 887 (Sec 46/47)' },
        { sta: 1016.0, label: 'STA 1016 (Aft Bulkhead)' },
        { sta: 1217.0, label: 'STA 1217 (APU Tailcone)' }
      ];

      keyFuselageTicks.forEach((tk, idx) => {
        const pt = fsBlWlToWorld(tk.sta, 0, 118.0);
        const topPt = fsBlWlToWorld(tk.sta, 0, 315.0);
        group.add(
          new THREE.Line(
            new THREE.BufferGeometry().setFromPoints([
              new THREE.Vector3(pt.x, pt.y - 0.12, 0),
              new THREE.Vector3(pt.x, topPt.y, 0)
            ]),
            materials.datumLineDim
          )
        );
        const lbl = createCadLabelSprite(tk.label, idx === 2 || idx === 3 ? '#f59e0b' : '#38bdf8', 0.95);
        lbl.position.set(pt.x, pt.y - (idx % 2 === 0 ? 0.22 : 0.38), 0);
        group.add(lbl);
      });

      // Wing Buttock Line (WBL) Ruler at STA 518.0
      const wblTicks = [
        { wbl: -680.4, label: 'WBL -680.4 (LH Wingtip)' },
        { wbl: -190.97, label: 'CL NAC WBL -190.97 (WS 204.25)', gold: true },
        { wbl: 190.97, label: 'CL NAC WBL +190.97 (WS 204.25)', gold: true },
        { wbl: 680.4, label: 'WBL +680.4 (RH Wingtip)' }
      ];
      wblTicks.forEach((wt) => {
        const wp = fsBlWlToWorld(518.0, wt.wbl, 192.0);
        const lbl = createCadLabelSprite(wt.label, wt.gold ? '#fbbf24' : '#34d399', 1.05);
        lbl.position.set(wp.x - 0.25, wp.y + 0.35, wp.z);
        group.add(lbl);
      });
    } else if (level === 1) {
      // L1 Pylon & Nacelle Station Ticks
      const l1Ticks = [
        { x: -1.62, y: -1.35, label: 'STA 452.0 | Engine Sta. 0 Intake Lip' },
        { x: -0.55, y: 0.95, label: 'PORT-ENG-FWD-STA12 (Fan Frame Mount)', gold: true },
        { x: 0.55, y: 1.48, label: 'PORT-PYLON-LH @ WS 204.25 / WBL -190.97', gold: true },
        { x: 1.15, y: 0.85, label: 'PORT-ENG-AFT-STA5 (TRF Rear Mount)', gold: true }
      ];
      l1Ticks.forEach((tk) => {
        const lbl = createCadLabelSprite(tk.label, tk.gold ? '#fbbf24' : '#38bdf8', 1.35);
        lbl.position.set(tk.x, tk.y, 0);
        group.add(lbl);
      });
    } else if (level === 2) {
      // L2 CFM56 Engine Axial Stations & 5 Bearing Planes (CTC-044 p.30/32)
      const engineStations = [
        { mm: 0, label: 'Sta. 0 Intake (0mm)' },
        { mm: 460, label: 'Brg #1/#2 Sump A (+460mm)', cyan: true },
        { mm: 740, label: 'Sta. 12 Fan Frame (+740mm)', gold: true },
        { mm: 860, label: 'Sta. 25 HPC Inlet (+860mm)' },
        { mm: 1460, label: 'Sta. 3 Combustor (+1460mm)', gold: true },
        { mm: 1820, label: 'Sta. 4 HPT Rotor (+1820mm)', gold: true },
        { mm: 1955, label: 'Sta. 495 LPT Inlet (+1955mm)' },
        { mm: 2290, label: 'Sta. 5 TRF & Sump B #4/#5 (+2290mm)', cyan: true }
      ];

      engineStations.forEach((st, idx) => {
        const x = axialMmToX(st.mm);
        group.add(
          new THREE.Line(
            new THREE.BufferGeometry().setFromPoints([
              new THREE.Vector3(x, -1.45, 0),
              new THREE.Vector3(x, 1.45, 0)
            ]),
            materials.datumLineDim
          )
        );
        const color = st.gold ? '#fbbf24' : st.cyan ? '#34d399' : '#38bdf8';
        const lbl = createCadLabelSprite(st.label, color, 1.25);
        lbl.position.set(x, idx % 2 === 0 ? -1.58 : 1.58, 0);
        group.add(lbl);
      });
    } else if (level === 3) {
      // L3 HPT & Combustor Micro-Assembly Datum Labels
      const l3Labels = [
        { x: -1.35, y: 2.05, label: 'Sta. 3 Annular Combustor & 20 Swirlers (R=355mm)', color: '#f59e0b' },
        { x: -0.52, y: -1.95, label: 'Sta. 4 Stage-1 Cooled NGV Ring (42 Vanes)', color: '#38bdf8' },
        { x: 0.0, y: 2.15, label: 'Ax.Sta +1820mm | 72 Rene N5 Fir-Tree Blades (R=415mm)', color: '#ef4444' },
        { x: 0.0, y: -2.05, label: 'Rene 88DT PM Disk & Curvic Coupling Ø410mm', color: '#fbbf24' },
        { x: 0.55, y: 1.85, label: 'HPT Active Clearance Control (ACC) Honeycomb Shroud', color: '#34d399' }
      ];
      l3Labels.forEach((item) => {
        const lbl = createCadLabelSprite(item.label, item.color, 1.55);
        lbl.position.set(item.x, item.y, 0);
        group.add(lbl);
      });
    }
  } else {
    // Bridge Chainage & Elevation Datum Ruler
    if (level === 0) {
      const brgTicks = [
        { ch: 165, el: 48, label: 'K0+165 West Gravity Anchorage', color: '#f59e0b' },
        { ch: 500, el: 215, label: 'K0+500 West Pylon Saddle (EL +195.0m)', color: '#fbbf24' },
        { ch: 1000, el: 112, label: 'K1+000 Midspan Box Girder (EL +65.0m, f/L=1:9.52)', color: '#38bdf8' },
        { ch: 1500, el: 215, label: 'K1+500 East Pylon Saddle (EL +195.0m)', color: '#fbbf24' },
        { ch: 1835, el: 48, label: 'K1+835 East Gravity Anchorage', color: '#f59e0b' }
      ];
      brgTicks.forEach((tk) => {
        const wp = bridgeDatumToWorld(tk.ch, tk.el, 0);
        const lbl = createCadLabelSprite(tk.label, tk.color, 1.55);
        lbl.position.set(wp.x, wp.y, 0);
        group.add(lbl);
      });
    } else {
      const subLabels = [
        { x: 0, y: 2.05, label: 'CL ±16.5m Cast-Steel Main Cable Band & Pin Hanger Socket', color: '#fbbf24' },
        { x: 0, y: 0.95, label: 'EL +66.75m Orthotropic Deck Plate (16mm) + 8mm U-Ribs', color: '#38bdf8' },
        { x: 0, y: -0.95, label: 'EL +63.25m Streamlined Box Girder Bottom Flange & 55° Wind Fairings', color: '#34d399' }
      ];
      subLabels.forEach((item) => {
        const lbl = createCadLabelSprite(item.label, item.color, 1.65);
        lbl.position.set(item.x, item.y, 0);
        group.add(lbl);
      });
    }
  }

  return group;
}
