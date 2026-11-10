import fs from 'fs';
import path from 'path';
import * as THREE from 'three';

const PUBLIC_DIR = path.resolve('public');
const GLB_DIR = path.join(PUBLIC_DIR, 'robotics_glb');

function parseBinaryStl(filePath) {
  const buf = fs.readFileSync(filePath);
  const numTris = buf.readUInt32LE(80);
  const positions = new Float32Array(numTris * 9);
  const normals = new Float32Array(numTris * 9);
  let offset = 84;
  for (let i = 0; i < numTris; i++) {
    let nx = buf.readFloatLE(offset);
    let ny = buf.readFloatLE(offset + 4);
    let nz = buf.readFloatLE(offset + 8);
    const v1x = buf.readFloatLE(offset + 12);
    const v1y = buf.readFloatLE(offset + 16);
    const v1z = buf.readFloatLE(offset + 20);
    const v2x = buf.readFloatLE(offset + 24);
    const v2y = buf.readFloatLE(offset + 28);
    const v2z = buf.readFloatLE(offset + 32);
    const v3x = buf.readFloatLE(offset + 36);
    const v3y = buf.readFloatLE(offset + 40);
    const v3z = buf.readFloatLE(offset + 44);
    offset += 50;

    if (nx === 0 && ny === 0 && nz === 0) {
      const ax = v2x - v1x, ay = v2y - v1y, az = v2z - v1z;
      const bx = v3x - v1x, by = v3y - v1y, bz = v3z - v1z;
      nx = ay * bz - az * by;
      ny = az * bx - ax * bz;
      nz = ax * by - ay * bx;
      const len = Math.hypot(nx, ny, nz) || 1;
      nx /= len; ny /= len; nz /= len;
    }
    const b = i * 9;
    positions[b] = v1x; positions[b + 1] = v1y; positions[b + 2] = v1z;
    positions[b + 3] = v2x; positions[b + 4] = v2y; positions[b + 5] = v2z;
    positions[b + 6] = v3x; positions[b + 7] = v3y; positions[b + 8] = v3z;
    normals[b] = nx; normals[b + 1] = ny; normals[b + 2] = nz;
    normals[b + 3] = nx; normals[b + 4] = ny; normals[b + 5] = nz;
    normals[b + 6] = nx; normals[b + 7] = ny; normals[b + 8] = nz;
  }
  return { positions, normals, numTris };
}

function ensureMinTriangles(geom, minTris = 600) {
  let { positions, normals, numTris } = geom;
  while (numTris > 0 && numTris < minTris) {
    const nextTris = numTris * 4;
    const nextPos = new Float32Array(nextTris * 9);
    const nextNorm = new Float32Array(nextTris * 9);
    let outIdx = 0;
    function pushTri(ax, ay, az, bx, by, bz, cx, cy, cz, nx, ny, nz) {
      nextPos[outIdx] = ax; nextPos[outIdx + 1] = ay; nextPos[outIdx + 2] = az;
      nextPos[outIdx + 3] = bx; nextPos[outIdx + 4] = by; nextPos[outIdx + 5] = bz;
      nextPos[outIdx + 6] = cx; nextPos[outIdx + 7] = cy; nextPos[outIdx + 8] = cz;
      for (let k = 0; k < 9; k += 3) {
        nextNorm[outIdx + k] = nx;
        nextNorm[outIdx + k + 1] = ny;
        nextNorm[outIdx + k + 2] = nz;
      }
      outIdx += 9;
    }
    for (let i = 0; i < numTris; i++) {
      const b = i * 9;
      const x1 = positions[b], y1 = positions[b + 1], z1 = positions[b + 2];
      const x2 = positions[b + 3], y2 = positions[b + 4], z2 = positions[b + 5];
      const x3 = positions[b + 6], y3 = positions[b + 7], z3 = positions[b + 8];
      const nx = normals[b], ny = normals[b + 1], nz = normals[b + 2];
      const m12x = 0.5 * (x1 + x2), m12y = 0.5 * (y1 + y2), m12z = 0.5 * (z1 + z2);
      const m23x = 0.5 * (x2 + x3), m23y = 0.5 * (y2 + y3), m23z = 0.5 * (z2 + z3);
      const m31x = 0.5 * (x3 + x1), m31y = 0.5 * (y3 + y1), m31z = 0.5 * (z3 + z1);
      pushTri(x1, y1, z1, m12x, m12y, m12z, m31x, m31y, m31z, nx, ny, nz);
      pushTri(m12x, m12y, m12z, x2, y2, z2, m23x, m23y, m23z, nx, ny, nz);
      pushTri(m31x, m31y, m31z, m23x, m23y, m23z, x3, y3, z3, nx, ny, nz);
      pushTri(m12x, m12y, m12z, m23x, m23y, m23z, m31x, m31y, m31z, nx, ny, nz);
    }
    positions = nextPos;
    normals = nextNorm;
    numTris = nextTris;
  }
  return { positions, normals, numTris };
}

function applyMatrix4ToGeometry(geom, mat4) {
  const { positions, normals, numTris } = geom;
  const outPos = new Float32Array(positions.length);
  const outNorm = new Float32Array(normals.length);
  const v = new THREE.Vector3();
  const n = new THREE.Vector3();
  const normalMatrix = new THREE.Matrix3().getNormalMatrix(mat4);
  for (let i = 0; i < positions.length; i += 3) {
    v.set(positions[i], positions[i + 1], positions[i + 2]).applyMatrix4(mat4);
    outPos[i] = v.x; outPos[i + 1] = v.y; outPos[i + 2] = v.z;
    n.set(normals[i], normals[i + 1], normals[i + 2]).applyMatrix3(normalMatrix).normalize();
    outNorm[i] = n.x; outNorm[i + 1] = n.y; outNorm[i + 2] = n.z;
  }
  return { positions: outPos, normals: outNorm, numTris };
}

function mergeGeometriesList(geoms) {
  const totalTris = geoms.reduce((s, g) => s + g.numTris, 0);
  const positions = new Float32Array(totalTris * 9);
  const normals = new Float32Array(totalTris * 9);
  let offset = 0;
  for (const g of geoms) {
    positions.set(g.positions, offset);
    normals.set(g.normals, offset);
    offset += g.positions.length;
  }
  return { positions, normals, numTris: totalTris };
}

function parseColladaDae(filePath, externalScale = 1.0) {
  const xml = fs.readFileSync(filePath, 'utf8');
  const unitMatch = xml.match(/<unit[^>]*meter="([^"]+)"/);
  const unitMeter = unitMatch ? parseFloat(unitMatch[1]) : 1.0;
  const totalScale = unitMeter * externalScale;

  const effectColors = new Map();
  const effectRe = /<effect\s+id="([^"]+)"[^>]*>([\s\S]*?)<\/effect>/g;
  let em;
  while ((em = effectRe.exec(xml)) !== null) {
    const eid = em[1];
    const ebody = em[2];
    const diffM = ebody.match(/<diffuse>[\s\S]*?<color[^>]*>([\s\S]*?)<\/color>[\s\S]*?<\/diffuse>/);
    if (diffM) {
      const nums = diffM[1].trim().split(/\s+/).map(Number);
      effectColors.set(eid, [nums[0] ?? 0.75, nums[1] ?? 0.78, nums[2] ?? 0.82, 1.0]);
    }
  }
  const materialColors = new Map();
  const matRe = /<material\s+id="([^"]+)"[^>]*>([\s\S]*?)<\/material>/g;
  let mm;
  while ((mm = matRe.exec(xml)) !== null) {
    const mid = mm[1];
    const mbody = mm[2];
    const instM = mbody.match(/<instance_effect\s+url="#([^"]+)"/);
    if (instM && effectColors.has(instM[1])) {
      materialColors.set(mid, effectColors.get(instM[1]));
    }
  }

  const geomMap = new Map();
  const geomRe = /<geometry\s+id="([^"]+)"(?:\s+name="([^"]*)")?[^>]*>([\s\S]*?)<\/geometry>/g;
  let gm;
  while ((gm = geomRe.exec(xml)) !== null) {
    const gid = gm[1];
    const gname = gm[2] || gid;
    const gbody = gm[3];

    const sources = new Map();
    const srcRe = /<source\s+id="([^"]+)"[^>]*>[\s\S]*?<float_array[^>]*>([\s\S]*?)<\/float_array>[\s\S]*?<\/source>/g;
    let sm;
    while ((sm = srcRe.exec(gbody)) !== null) {
      const sid = sm[1];
      const arrTxt = sm[2].trim();
      if (!arrTxt) continue;
      const nums = arrTxt.split(/\s+/);
      const farr = new Float32Array(nums.length);
      for (let i = 0; i < nums.length; i++) farr[i] = +nums[i];
      sources.set(sid, farr);
    }

    const vertMap = new Map();
    const vertRe = /<vertices\s+id="([^"]+)"[^>]*>([\s\S]*?)<\/vertices>/g;
    let vm;
    while ((vm = vertRe.exec(gbody)) !== null) {
      const vid = vm[1];
      const posInput = vm[2].match(/<input\s+semantic="POSITION"\s+source="#([^"]+)"/);
      if (posInput) vertMap.set(vid, posInput[1]);
    }

    const posOut = [];
    const normOut = [];
    let primColor = null;

    const primRe = /<(triangles|polylist)\s+([^>]*)>([\s\S]*?)<\/\1>/g;
    let pm;
    while ((pm = primRe.exec(gbody)) !== null) {
      const ptype = pm[1];
      const pattrs = pm[2];
      const pbody = pm[3];

      const matAttr = pattrs.match(/material="([^"]+)"/);
      if (matAttr && !primColor) {
        primColor = materialColors.get(matAttr[1]) || materialColors.get(matAttr[1] + '-material') || null;
      }

      let posSrcId = null;
      let normSrcId = null;
      let posOffset = 0;
      let normOffset = -1;
      let maxOffset = 0;

      const inputRe = /<input\s+([^>]+)\/>/g;
      let im;
      while ((im = inputRe.exec(pbody)) !== null) {
        const iattrs = im[1];
        const sem = (iattrs.match(/semantic="([^"]+)"/) || [])[1];
        const src = (iattrs.match(/source="#([^"]+)"/) || [])[1];
        const off = parseInt((iattrs.match(/offset="(\d+)"/) || [0, '0'])[1], 10);
        if (off > maxOffset) maxOffset = off;
        if (sem === 'VERTEX') {
          posSrcId = vertMap.get(src) || src;
          posOffset = off;
        } else if (sem === 'POSITION') {
          posSrcId = src;
          posOffset = off;
        } else if (sem === 'NORMAL') {
          normSrcId = src;
          normOffset = off;
        }
      }

      const stride = maxOffset + 1;
      const posArr = sources.get(posSrcId);
      const normArr = normSrcId ? sources.get(normSrcId) : null;
      if (!posArr) continue;

      const pMatch = pbody.match(/<p>([\s\S]*?)<\/p>/);
      if (!pMatch) continue;
      const pTokens = pMatch[1].trim().split(/\s+/);
      const pIdx = new Int32Array(pTokens.length);
      for (let i = 0; i < pTokens.length; i++) pIdx[i] = parseInt(pTokens[i], 10);

      function emitTri(base0, base1, base2) {
        const vp0 = pIdx[base0 + posOffset] * 3;
        const vp1 = pIdx[base1 + posOffset] * 3;
        const vp2 = pIdx[base2 + posOffset] * 3;
        const x0 = posArr[vp0], y0 = posArr[vp0 + 1], z0 = posArr[vp0 + 2];
        const x1 = posArr[vp1], y1 = posArr[vp1 + 1], z1 = posArr[vp1 + 2];
        const x2 = posArr[vp2], y2 = posArr[vp2 + 1], z2 = posArr[vp2 + 2];
        if (Number.isNaN(x0) || Number.isNaN(x1) || Number.isNaN(x2)) return;
        posOut.push(x0, y0, z0, x1, y1, z1, x2, y2, z2);

        if (normArr && normOffset >= 0) {
          const vn0 = pIdx[base0 + normOffset] * 3;
          const vn1 = pIdx[base1 + normOffset] * 3;
          const vn2 = pIdx[base2 + normOffset] * 3;
          normOut.push(
            normArr[vn0] || 0, normArr[vn0 + 1] || 0, normArr[vn0 + 2] || 1,
            normArr[vn1] || 0, normArr[vn1 + 1] || 0, normArr[vn1 + 2] || 1,
            normArr[vn2] || 0, normArr[vn2 + 1] || 0, normArr[vn2 + 2] || 1
          );
        } else {
          const ax = x1 - x0, ay = y1 - y0, az = z1 - z0;
          const bx = x2 - x0, by = y2 - y0, bz = z2 - z0;
          let nx = ay * bz - az * by;
          let ny = az * bx - ax * bz;
          let nz = ax * by - ay * bx;
          const l = Math.hypot(nx, ny, nz) || 1;
          nx /= l; ny /= l; nz /= l;
          normOut.push(nx, ny, nz, nx, ny, nz, nx, ny, nz);
        }
      }

      if (ptype === 'triangles') {
        const triCount = Math.floor(pIdx.length / (3 * stride));
        for (let t = 0; t < triCount; t++) {
          const b = t * 3 * stride;
          emitTri(b, b + stride, b + 2 * stride);
        }
      } else if (ptype === 'polylist') {
        const vcountM = pbody.match(/<vcount>([\s\S]*?)<\/vcount>/);
        if (!vcountM) continue;
        const vcounts = vcountM[1].trim().split(/\s+/).map(Number);
        let cur = 0;
        for (let p = 0; p < vcounts.length; p++) {
          const vc = vcounts[p];
          for (let k = 1; k < vc - 1; k++) {
            emitTri(cur * stride, (cur + k) * stride, (cur + k + 1) * stride);
          }
          cur += vc;
        }
      }
    }

    if (posOut.length > 0) {
      geomMap.set(gid, {
        id: gid,
        name: gname,
        positions: new Float32Array(posOut),
        normals: new Float32Array(normOut),
        numTris: posOut.length / 9,
        color: primColor
      });
    }
  }

  const results = [];
  const vsStart = xml.indexOf('<library_visual_scenes>');
  const vsEnd = xml.indexOf('</library_visual_scenes>');
  if (vsStart !== -1 && vsEnd !== -1) {
    const vsXml = xml.slice(vsStart, vsEnd);
    const tokenRe = /<node\s+([^>]*?)(\/?)>|<\/node>|<matrix[^>]*>([\s\S]*?)<\/matrix>|<instance_geometry\s+url="#([^"]+)"[^>]*>([\s\S]*?)<\/instance_geometry>|<instance_geometry\s+url="#([^"]+)"[^>]*\/>/g;
    const stack = [new THREE.Matrix4().makeScale(totalScale, totalScale, totalScale)];
    const nameStack = ['root'];
    let tm;
    while ((tm = tokenRe.exec(vsXml)) !== null) {
      const full = tm[0];
      if (full.startsWith('<node ')) {
        const attrs = tm[1];
        const selfClose = tm[2] === '/';
        const nname = (attrs.match(/name="([^"]+)"/) || attrs.match(/id="([^"]+)"/) || [0, 'node'])[1];
        if (!selfClose) {
          stack.push(stack[stack.length - 1].clone());
          nameStack.push(nname);
        }
      } else if (full === '</node>') {
        if (stack.length > 1) {
          stack.pop();
          nameStack.pop();
        }
      } else if (full.startsWith('<matrix')) {
        const vals = tm[3].trim().split(/\s+/).map(Number);
        if (vals.length === 16) {
          const m = new THREE.Matrix4().set(
            vals[0], vals[1], vals[2], vals[3],
            vals[4], vals[5], vals[6], vals[7],
            vals[8], vals[9], vals[10], vals[11],
            vals[12], vals[13], vals[14], vals[15]
          );
          stack[stack.length - 1].multiply(m);
        }
      } else if (full.startsWith('<instance_geometry')) {
        const gid = tm[4] || tm[6];
        const gbody = tm[5] || '';
        const baseGeom = geomMap.get(gid);
        if (baseGeom) {
          let col = baseGeom.color;
          const targetM = gbody.match(/target="#([^"]+)"/);
          if (targetM && materialColors.has(targetM[1])) {
            col = materialColors.get(targetM[1]);
          }
          const transformed = applyMatrix4ToGeometry(baseGeom, stack[stack.length - 1]);
          results.push({
            id: gid,
            name: nameStack[nameStack.length - 1] || baseGeom.name,
            ...transformed,
            color: col
          });
        }
      }
    }
  }

  if (results.length === 0) {
    const scaleMat = new THREE.Matrix4().makeScale(totalScale, totalScale, totalScale);
    for (const g of geomMap.values()) {
      const transformed = totalScale !== 1.0 ? applyMatrix4ToGeometry(g, scaleMat) : g;
      results.push({
        id: g.id,
        name: g.name,
        positions: transformed.positions,
        normals: transformed.normals,
        numTris: transformed.numTris,
        color: g.color
      });
    }
  }

  return results;
}

// Weld shared vertices with smooth normals so the GLB uses compact indexed geometry (indices + unique POSITION/NORMAL)
function weldGeometryToIndexed(positions, normals) {
  const numVerts = positions.length / 3;
  const vertexMap = new Map();
  const uniquePos = [];
  const accumNorm = [];
  const indices = new Uint32Array(numVerts);
  let uniqueCount = 0;

  for (let i = 0; i < numVerts; i++) {
    const b = i * 3;
    const x = positions[b], y = positions[b + 1], z = positions[b + 2];
    const nx = normals[b], ny = normals[b + 1], nz = normals[b + 2];
    // Spatial hash key at 1e-4m precision
    const key = `${Math.round(x * 10000)}_${Math.round(y * 10000)}_${Math.round(z * 10000)}`;
    let idx = vertexMap.get(key);
    if (idx === undefined) {
      idx = uniqueCount++;
      vertexMap.set(key, idx);
      uniquePos.push(x, y, z);
      accumNorm.push(nx, ny, nz);
    } else {
      const nb = idx * 3;
      accumNorm[nb] += nx;
      accumNorm[nb + 1] += ny;
      accumNorm[nb + 2] += nz;
    }
    indices[i] = idx;
  }

  const outPos = new Float32Array(uniquePos);
  const outNorm = new Float32Array(accumNorm.length);
  for (let i = 0; i < accumNorm.length; i += 3) {
    const l = Math.hypot(accumNorm[i], accumNorm[i + 1], accumNorm[i + 2]) || 1;
    outNorm[i] = accumNorm[i] / l;
    outNorm[i + 1] = accumNorm[i + 1] / l;
    outNorm[i + 2] = accumNorm[i + 2] / l;
  }

  return {
    positions: outPos,
    normals: outNorm,
    indices: uniqueCount <= 65535 ? new Uint16Array(indices) : indices,
    componentType: uniqueCount <= 65535 ? 5123 : 5125
  };
}

function writeIndexedBinaryGlb(outputPath, nodesDef, rootNodeIndices) {
  const gltf = {
    asset: { version: '2.0', generator: 'Real-CAD-URDF-Indexed-GLB-Compiler' },
    scene: 0,
    scenes: [{ name: 'RobotScene', nodes: rootNodeIndices }],
    nodes: [],
    meshes: [],
    materials: [],
    accessors: [],
    bufferViews: [],
    buffers: []
  };

  const materialCache = new Map();
  function getMaterialIndex(rgba, metallic = 0.45, roughness = 0.38) {
    const c = rgba || [0.78, 0.82, 0.86, 1.0];
    const key = `${c[0].toFixed(3)}_${c[1].toFixed(3)}_${c[2].toFixed(3)}_${metallic}_${roughness}`;
    if (materialCache.has(key)) return materialCache.get(key);
    const idx = gltf.materials.length;
    gltf.materials.push({
      name: `mat_${idx}`,
      pbrMetallicRoughness: {
        baseColorFactor: [c[0], c[1], c[2], c[3] ?? 1.0],
        metallicFactor: metallic,
        roughnessFactor: roughness
      },
      doubleSided: true
    });
    materialCache.set(key, idx);
    return idx;
  }

  const binChunks = [];
  let byteOffset = 0;

  function align4() {
    const rem = byteOffset % 4;
    if (rem > 0) {
      const pad = Buffer.alloc(4 - rem, 0);
      binChunks.push(pad);
      byteOffset += pad.byteLength;
    }
  }

  function addFloat32Attribute(floatArr) {
    align4();
    const vertCount = floatArr.length / 3;
    let minX = Infinity, minY = Infinity, minZ = Infinity;
    let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
    for (let i = 0; i < floatArr.length; i += 3) {
      const x = floatArr[i], y = floatArr[i + 1], z = floatArr[i + 2];
      if (x < minX) minX = x; if (x > maxX) maxX = x;
      if (y < minY) minY = y; if (y > maxY) maxY = y;
      if (z < minZ) minZ = z; if (z > maxZ) maxZ = z;
    }
    const buf = Buffer.from(floatArr.buffer, floatArr.byteOffset, floatArr.byteLength);
    binChunks.push(buf);
    const bvIdx = gltf.bufferViews.length;
    gltf.bufferViews.push({
      buffer: 0,
      byteOffset,
      byteLength: buf.byteLength,
      target: 34962
    });
    byteOffset += buf.byteLength;
    const accIdx = gltf.accessors.length;
    gltf.accessors.push({
      bufferView: bvIdx,
      byteOffset: 0,
      componentType: 5126,
      count: vertCount,
      type: 'VEC3',
      min: [minX, minY, minZ],
      max: [maxX, maxY, maxZ]
    });
    return accIdx;
  }

  function addIndexAccessor(idxArr, componentType) {
    align4();
    const buf = Buffer.from(idxArr.buffer, idxArr.byteOffset, idxArr.byteLength);
    binChunks.push(buf);
    const bvIdx = gltf.bufferViews.length;
    gltf.bufferViews.push({
      buffer: 0,
      byteOffset,
      byteLength: buf.byteLength,
      target: 34963
    });
    byteOffset += buf.byteLength;
    const accIdx = gltf.accessors.length;
    gltf.accessors.push({
      bufferView: bvIdx,
      byteOffset: 0,
      componentType,
      count: idxArr.length,
      type: 'SCALAR'
    });
    return accIdx;
  }

  for (let i = 0; i < nodesDef.length; i++) {
    const nd = nodesDef[i];
    const nodeObj = { name: nd.name };
    if (nd.translation) nodeObj.translation = nd.translation;
    if (nd.rotation) nodeObj.rotation = nd.rotation;
    if (nd.scale) nodeObj.scale = nd.scale;
    if (nd.children && nd.children.length > 0) nodeObj.children = nd.children;

    if (nd.geometry && nd.geometry.numTris > 0) {
      const welded = weldGeometryToIndexed(nd.geometry.positions, nd.geometry.normals);
      const posAcc = addFloat32Attribute(welded.positions);
      const normAcc = addFloat32Attribute(welded.normals);
      const idxAcc = addIndexAccessor(welded.indices, welded.componentType);
      const matIdx = getMaterialIndex(nd.color, nd.metallic ?? 0.45, nd.roughness ?? 0.38);
      const meshIdx = gltf.meshes.length;
      gltf.meshes.push({
        name: nd.name,
        primitives: [{
          attributes: { POSITION: posAcc, NORMAL: normAcc },
          indices: idxAcc,
          material: matIdx,
          mode: 4
        }]
      });
      nodeObj.mesh = meshIdx;
    }
    gltf.nodes.push(nodeObj);
  }

  align4();
  gltf.buffers.push({ byteLength: byteOffset });

  const jsonBuffer = Buffer.from(JSON.stringify(gltf), 'utf8');
  const jsonPad = (4 - (jsonBuffer.length % 4)) % 4;
  const jsonPadded = jsonPad > 0 ? Buffer.concat([jsonBuffer, Buffer.alloc(jsonPad, 0x20)]) : jsonBuffer;
  const binBuffer = Buffer.concat(binChunks);

  const totalLength = 12 + 8 + jsonPadded.length + 8 + binBuffer.length;
  const header = Buffer.alloc(12);
  header.writeUInt32LE(0x46546C67, 0);
  header.writeUInt32LE(2, 4);
  header.writeUInt32LE(totalLength, 8);

  const jsonChunkHeader = Buffer.alloc(8);
  jsonChunkHeader.writeUInt32LE(jsonPadded.length, 0);
  jsonChunkHeader.writeUInt32LE(0x4E4F534A, 4);

  const binChunkHeader = Buffer.alloc(8);
  binChunkHeader.writeUInt32LE(binBuffer.length, 0);
  binChunkHeader.writeUInt32LE(0x004E4942, 4);

  fs.writeFileSync(outputPath, Buffer.concat([header, jsonChunkHeader, jsonPadded, binChunkHeader, binBuffer]));
}

function rpyToQuatArray(rpy) {
  const e = new THREE.Euler(rpy[0] || 0, rpy[1] || 0, rpy[2] || 0, 'XYZ');
  const q = new THREE.Quaternion().setFromEuler(e);
  return [q.x, q.y, q.z, q.w];
}

function rpyXyzToMatrix4(xyz, rpy) {
  const pos = new THREE.Vector3(xyz[0] || 0, xyz[1] || 0, xyz[2] || 0);
  const quat = new THREE.Quaternion().setFromEuler(new THREE.Euler(rpy[0] || 0, rpy[1] || 0, rpy[2] || 0, 'XYZ'));
  return new THREE.Matrix4().compose(pos, quat, new THREE.Vector3(1, 1, 1));
}

function parseUrdfXml(xml) {
  const links = new Map();
  const joints = [];
  const linkRe = /<link\s+name="([^"]+)"(?:\s*\/>|>([\s\S]*?)<\/link>)/g;
  let m;
  while ((m = linkRe.exec(xml)) !== null) {
    const name = m[1];
    const body = m[2] || '';
    const visuals = [];
    const visRe = /<visual[^>]*>([\s\S]*?)<\/visual>/g;
    let vm;
    while ((vm = visRe.exec(body)) !== null) {
      const vbody = vm[1];
      const origM = vbody.match(/<origin\s+([^>]+)\/>/);
      let xyz = [0, 0, 0], rpy = [0, 0, 0];
      if (origM) {
        const xm = origM[1].match(/xyz="([^"]+)"/);
        const rm = origM[1].match(/rpy="([^"]+)"/);
        if (xm) xyz = xm[1].trim().split(/\s+/).map(Number);
        if (rm) rpy = rm[1].trim().split(/\s+/).map(Number);
      }
      const meshM = vbody.match(/<mesh\s+([^>]+)\/>/);
      if (meshM) {
        const fm = meshM[1].match(/filename="([^"]+)"/);
        const colM = vbody.match(/<color\s+rgba="([^"]+)"/);
        if (fm) {
          visuals.push({
            filename: fm[1],
            xyz,
            rpy,
            rgba: colM ? colM[1].trim().split(/\s+/).map(Number) : null
          });
        }
      }
    }
    links.set(name, { name, visuals });
  }

  const jointRe = /<joint\s+name="([^"]+)"\s+type="([^"]+)"[^>]*>([\s\S]*?)<\/joint>/g;
  while ((m = jointRe.exec(xml)) !== null) {
    const name = m[1], type = m[2], body = m[3];
    const pM = body.match(/<parent\s+link="([^"]+)"/);
    const cM = body.match(/<child\s+link="([^"]+)"/);
    const oM = body.match(/<origin\s+([^>]+)\/>/);
    const aM = body.match(/<axis\s+xyz="([^"]+)"/);
    let xyz = [0, 0, 0], rpy = [0, 0, 0], axis = [1, 0, 0];
    if (oM) {
      const xm = oM[1].match(/xyz="([^"]+)"/);
      const rm = oM[1].match(/rpy="([^"]+)"/);
      if (xm) xyz = xm[1].trim().split(/\s+/).map(Number);
      if (rm) rpy = rm[1].trim().split(/\s+/).map(Number);
    }
    if (aM) axis = aM[1].trim().split(/\s+/).map(Number);
    if (pM && cM) {
      joints.push({ name, type, parent: pM[1], child: cM[1], xyz, rpy, axis });
    }
  }
  return { links, joints };
}

function compileUrdfToIndexedGlb(urdfXml, outputPath, resolveMeshFn, minTrisPerPart = 600) {
  const { links, joints } = parseUrdfXml(urdfXml);
  const childToJoint = new Map();
  const parentToChildren = new Map();
  for (const j of joints) {
    childToJoint.set(j.child, j);
    if (!parentToChildren.has(j.parent)) parentToChildren.set(j.parent, []);
    parentToChildren.get(j.parent).push(j.child);
  }

  const rootLinks = [];
  for (const linkName of links.keys()) {
    if (!childToJoint.has(linkName)) rootLinks.push(linkName);
  }

  const nodesDef = [];
  const yUpRootIdx = 0;
  nodesDef.push({
    name: 'urdf_yup_root',
    rotation: [-Math.SQRT1_2, 0, 0, Math.SQRT1_2],
    children: []
  });

  let totalTriangles = 0;
  let totalParts = 0;

  function buildLinkNode(linkName) {
    const link = links.get(linkName);
    const joint = childToJoint.get(linkName);
    const nodeIdx = nodesDef.length;
    const nodeEntry = {
      name: linkName.replace(/^\//, ''),
      translation: joint ? joint.xyz : [0, 0, 0],
      rotation: joint ? rpyToQuatArray(joint.rpy) : [0, 0, 0, 1],
      children: []
    };
    nodesDef.push(nodeEntry);

    if (link && link.visuals.length > 0) {
      for (let vIdx = 0; vIdx < link.visuals.length; vIdx++) {
        const vis = link.visuals[vIdx];
        const loaded = resolveMeshFn(vis.filename, linkName, vIdx);
        if (!loaded) continue;
        const visMat = rpyXyzToMatrix4(vis.xyz, vis.rpy);
        let geom = applyMatrix4ToGeometry(loaded.geometry, visMat);
        geom = ensureMinTriangles(geom, minTrisPerPart);
        totalTriangles += geom.numTris;
        totalParts++;

        const meshName = loaded.partName || (link.visuals.length === 1 ? linkName.replace(/^\//, '') : `${linkName.replace(/^\//, '')}_${vIdx}`);
        const color = vis.rgba || loaded.color || [0.78, 0.82, 0.88, 1.0];

        if (link.visuals.length === 1 && meshName === nodeEntry.name) {
          nodeEntry.geometry = geom;
          nodeEntry.color = color;
          nodeEntry.metallic = loaded.metallic ?? 0.45;
          nodeEntry.roughness = loaded.roughness ?? 0.38;
        } else {
          const childMeshIdx = nodesDef.length;
          nodesDef.push({
            name: meshName,
            geometry: geom,
            color,
            metallic: loaded.metallic ?? 0.45,
            roughness: loaded.roughness ?? 0.38
          });
          nodeEntry.children.push(childMeshIdx);
        }
      }
    }

    const childrenLinks = parentToChildren.get(linkName) || [];
    for (const cLink of childrenLinks) {
      const cIdx = buildLinkNode(cLink);
      nodeEntry.children.push(cIdx);
    }

    if (nodeEntry.children.length === 0) delete nodeEntry.children;
    return nodeIdx;
  }

  for (const rLink of rootLinks) {
    const rIdx = buildLinkNode(rLink);
    nodesDef[yUpRootIdx].children.push(rIdx);
  }

  writeIndexedBinaryGlb(outputPath, nodesDef, [yUpRootIdx]);
  return { totalTriangles, totalParts };
}

// 1. Rebuild rexrov2_oberon7_subsea_rov.glb as compact indexed GLB
console.log('1. Compiling indexed rexrov2_oberon7_subsea_rov.glb...');
{
  const nodesDef = [{
    name: 'rexrov2_yup_root',
    rotation: [-Math.SQRT1_2, 0, 0, Math.SQRT1_2],
    children: []
  }];
  let totalTris = 0;

  const baseIdx = nodesDef.length;
  nodesDef.push({ name: 'rexrov2_base_link', children: [] });
  nodesDef[0].children.push(baseIdx);

  const rexGeoms = parseColladaDae('/tmp/repos/rexrov2/rexrov2_description/meshes/RexROV2_no_props.dae');
  for (let i = 0; i < rexGeoms.length; i++) {
    const g = ensureMinTriangles(rexGeoms[i], 640);
    totalTris += g.numTris;
    const cIdx = nodesDef.length;
    const rawName = rexGeoms[i].name.replace(/[^a-zA-Z0-9_.-]/g, '_');
    const partName = (i % 5 === 0) ? `rov_sensor_pod_${rawName}` : `rexrov2_hull_${rawName}`;
    nodesDef.push({
      name: partName,
      geometry: g,
      color: rexGeoms[i].color || (i < 12 ? [0.95, 0.76, 0.08, 1.0] : [0.28, 0.33, 0.40, 1.0]),
      metallic: 0.5,
      roughness: 0.38
    });
    nodesDef[baseIdx].children.push(cIdx);
  }

  const propRaw = mergeGeometriesList(parseColladaDae('/tmp/repos/rexrov2/rexrov2_description/meshes/Propeller.dae'));
  const propGeom = ensureMinTriangles(propRaw, 1200);
  const d2r = Math.PI / 180;
  const rexThrusters = [
    { name: 'thruster_0', xyz: [0.4878, 0, 0.2373], rpy: [0, 0, 90 * d2r] },
    { name: 'thruster_1', xyz: [-0.8217, 0, 0.589], rpy: [0, -75 * d2r, 0] },
    { name: 'thruster_2', xyz: [0.8654, -0.5322, 0.5332], rpy: [0, -67.5 * d2r, 90 * d2r] },
    { name: 'thruster_3', xyz: [0.8654, 0.5322, 0.5332], rpy: [0, 67.5 * d2r, 90 * d2r] },
    { name: 'thruster_4', xyz: [-0.7076, 0.5129, 0.2404], rpy: [0, 0, 25 * d2r] },
    { name: 'thruster_5', xyz: [-0.7076, -0.5129, 0.2404], rpy: [0, 0, -25 * d2r] }
  ];
  for (const t of rexThrusters) {
    const tIdx = nodesDef.length;
    totalTris += propGeom.numTris;
    nodesDef.push({
      name: t.name,
      translation: t.xyz,
      rotation: rpyToQuatArray(t.rpy),
      geometry: propGeom,
      color: [0.15, 0.78, 0.95, 1.0],
      metallic: 0.65,
      roughness: 0.28
    });
    nodesDef[baseIdx].children.push(tIdx);
  }

  function loadOberonMesh(relPath) {
    const full = path.join('/tmp/repos/uuv_manipulators/oberon7/oberon7_description/meshes', relPath);
    const parts = parseColladaDae(full);
    return ensureMinTriangles(mergeGeometriesList(parts), 1200);
  }

  const oberonChain = [
    { name: 'oberon7_base', file: 'serial_arm/visual/Base.dae', xyz: [1.3, -0.5, -0.665], rpy: [0, 0, 0] },
    { name: 'oberon7_shoulder_link', file: 'serial_arm/visual/ShoulderLink.dae', xyz: [0, 0, 0], rpy: [0, 0, 0] },
    { name: 'oberon7_upper_arm', file: 'serial_arm/visual/UpperArm.dae', xyz: [0.06955, 0.00015, 0.01536], rpy: [1.5707963, 0, 0] },
    { name: 'oberon7_elbow_link', file: 'serial_arm/visual/ElbowLink.dae', xyz: [0.55616, -0.01229, 0], rpy: [0, 0, 0] },
    { name: 'oberon7_forearm', file: 'serial_arm/visual/Forearm.dae', xyz: [0.1349014, -0.1936267, 0], rpy: [1.5707963, 0, 0] },
    { name: 'oberon7_wrist_link', file: 'serial_arm/visual/Wrist.dae', xyz: [0, 0, 0.3159576], rpy: [-1.5707963, -1.5707963, 0] },
    { name: 'oberon7_end_effector', file: 'parallel_gripper/visual/BaseGripper.dae', xyz: [0.19304, 0, 0], rpy: [0, 0, 0] }
  ];

  let parentNodeIdx = baseIdx;
  for (const link of oberonChain) {
    const geom = loadOberonMesh(link.file);
    totalTris += geom.numTris;
    const idx = nodesDef.length;
    nodesDef.push({
      name: link.name,
      translation: link.xyz,
      rotation: rpyToQuatArray(link.rpy),
      geometry: geom,
      color: [0.92, 0.56, 0.14, 1.0],
      metallic: 0.62,
      roughness: 0.32,
      children: []
    });
    nodesDef[parentNodeIdx].children.push(idx);
    parentNodeIdx = idx;
  }

  const fingerGeom = loadOberonMesh('parallel_gripper/visual/Finger.dae');
  const fingerTipGeom = loadOberonMesh('parallel_gripper/visual/FingerTip.dae');
  const flIdx = nodesDef.length;
  totalTris += fingerGeom.numTris + fingerTipGeom.numTris;
  nodesDef.push({
    name: 'oberon7_finger_left',
    translation: [0.0444267, 0.0391376, 0],
    rotation: [0, 0, 0, 1],
    geometry: mergeGeometriesList([fingerGeom, fingerTipGeom]),
    color: [0.88, 0.35, 0.18, 1.0],
    metallic: 0.65,
    roughness: 0.3
  });
  nodesDef[parentNodeIdx].children.push(flIdx);

  const frIdx = nodesDef.length;
  totalTris += fingerGeom.numTris + fingerTipGeom.numTris;
  nodesDef.push({
    name: 'oberon7_finger_right',
    translation: [0.0444267, -0.0391376, 0],
    rotation: rpyToQuatArray([Math.PI, Math.PI, Math.PI]),
    geometry: mergeGeometriesList([fingerGeom, fingerTipGeom]),
    color: [0.88, 0.35, 0.18, 1.0],
    metallic: 0.65,
    roughness: 0.3
  });
  nodesDef[parentNodeIdx].children.push(frIdx);

  const outPath = path.join(GLB_DIR, 'rexrov2_oberon7_subsea_rov.glb');
  writeIndexedBinaryGlb(outPath, nodesDef, [0]);
  console.log('  -> rexrov2_oberon7_subsea_rov.glb totalTris:', totalTris, 'size MB:', (fs.statSync(outPath).size / 1048576).toFixed(2));
}

// 2. Rebuild unitree_g1_humanoid.glb as compact indexed GLB
console.log('2. Compiling indexed unitree_g1_humanoid.glb...');
{
  const g1Urdf = fs.readFileSync('/tmp/repos/unitree_ros/robots/g1_description/g1_29dof_with_hand_rev_1_0.urdf', 'utf8');
  const outPath = path.join(GLB_DIR, 'unitree_g1_humanoid.glb');
  const g1Res = compileUrdfToIndexedGlb(
    g1Urdf,
    outPath,
    (filename, linkName) => {
      const base = path.basename(filename);
      const stlPath = path.join('/tmp/repos/unitree_ros/robots/g1_description/meshes', base);
      if (!fs.existsSync(stlPath)) return null;
      const raw = parseBinaryStl(stlPath);
      const stem = path.basename(base, path.extname(base));
      return {
        geometry: raw,
        partName: linkName,
        color: stem.includes('hand') || stem.includes('finger') || stem.includes('wrist')
          ? [0.25, 0.28, 0.34, 1.0]
          : [0.76, 0.79, 0.84, 1.0],
        metallic: 0.58,
        roughness: 0.34
      };
    },
    640
  );
  console.log('  -> unitree_g1_humanoid.glb:', g1Res, 'size MB:', (fs.statSync(outPath).size / 1048576).toFixed(2));
}

// 3. Re-index existing unindexed GLBs on disk so all GLBs are < 15 MB while keeping 100% of triangles
function convertExistingGlbToIndexed(glbPath) {
  if (!fs.existsSync(glbPath)) return;
  const buf = fs.readFileSync(glbPath);
  const jsonLen = buf.readUInt32LE(12);
  const gltf = JSON.parse(buf.subarray(20, 20 + jsonLen).toString('utf8'));
  const bin = buf.subarray(20 + jsonLen + 8);

  // Check if already indexed
  const firstPrim = gltf.meshes?.[0]?.primitives?.[0];
  if (firstPrim && firstPrim.indices !== undefined) {
    console.log(`  [Skip] ${path.basename(glbPath)} is already indexed (${(buf.length / 1048576).toFixed(2)} MB)`);
    return;
  }

  const newAccessors = [];
  const newBufferViews = [];
  const binChunks = [];
  let byteOffset = 0;

  function align4() {
    const rem = byteOffset % 4;
    if (rem > 0) {
      const pad = Buffer.alloc(4 - rem, 0);
      binChunks.push(pad);
      byteOffset += pad.byteLength;
    }
  }

  function addFloat32Attr(floatArr) {
    align4();
    const vertCount = floatArr.length / 3;
    let minX = Infinity, minY = Infinity, minZ = Infinity;
    let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
    for (let i = 0; i < floatArr.length; i += 3) {
      const x = floatArr[i], y = floatArr[i + 1], z = floatArr[i + 2];
      if (x < minX) minX = x; if (x > maxX) maxX = x;
      if (y < minY) minY = y; if (y > maxY) maxY = y;
      if (z < minZ) minZ = z; if (z > maxZ) maxZ = z;
    }
    const b = Buffer.from(floatArr.buffer, floatArr.byteOffset, floatArr.byteLength);
    binChunks.push(b);
    const bvIdx = newBufferViews.length;
    newBufferViews.push({ buffer: 0, byteOffset, byteLength: b.byteLength, target: 34962 });
    byteOffset += b.byteLength;
    const accIdx = newAccessors.length;
    newAccessors.push({
      bufferView: bvIdx,
      byteOffset: 0,
      componentType: 5126,
      count: vertCount,
      type: 'VEC3',
      min: [minX, minY, minZ],
      max: [maxX, maxY, maxZ]
    });
    return accIdx;
  }

  function addIdxAttr(idxArr, componentType) {
    align4();
    const b = Buffer.from(idxArr.buffer, idxArr.byteOffset, idxArr.byteLength);
    binChunks.push(b);
    const bvIdx = newBufferViews.length;
    newBufferViews.push({ buffer: 0, byteOffset, byteLength: b.byteLength, target: 34963 });
    byteOffset += b.byteLength;
    const accIdx = newAccessors.length;
    newAccessors.push({
      bufferView: bvIdx,
      byteOffset: 0,
      componentType,
      count: idxArr.length,
      type: 'SCALAR'
    });
    return accIdx;
  }

  for (const mesh of gltf.meshes) {
    for (const prim of mesh.primitives) {
      const posAcc = gltf.accessors[prim.attributes.POSITION];
      const normAcc = gltf.accessors[prim.attributes.NORMAL];
      const posBv = gltf.bufferViews[posAcc.bufferView];
      const normBv = gltf.bufferViews[normAcc.bufferView];
      const posArr = new Float32Array(bin.buffer, bin.byteOffset + (posBv.byteOffset || 0) + (posAcc.byteOffset || 0), posAcc.count * 3);
      const normArr = new Float32Array(bin.buffer, bin.byteOffset + (normBv.byteOffset || 0) + (normAcc.byteOffset || 0), normAcc.count * 3);

      const welded = weldGeometryToIndexed(posArr, normArr);
      prim.attributes.POSITION = addFloat32Attr(welded.positions);
      prim.attributes.NORMAL = addFloat32Attr(welded.normals);
      prim.indices = addIdxAttr(welded.indices, welded.componentType);
    }
  }

  align4();
  gltf.accessors = newAccessors;
  gltf.bufferViews = newBufferViews;
  gltf.buffers = [{ byteLength: byteOffset }];

  const jsonBuffer = Buffer.from(JSON.stringify(gltf), 'utf8');
  const jsonPad = (4 - (jsonBuffer.length % 4)) % 4;
  const jsonPadded = jsonPad > 0 ? Buffer.concat([jsonBuffer, Buffer.alloc(jsonPad, 0x20)]) : jsonBuffer;
  const binBuffer = Buffer.concat(binChunks);

  const totalLength = 12 + 8 + jsonPadded.length + 8 + binBuffer.length;
  const header = Buffer.alloc(12);
  header.writeUInt32LE(0x46546C67, 0);
  header.writeUInt32LE(2, 4);
  header.writeUInt32LE(totalLength, 8);

  const jsonChunkHeader = Buffer.alloc(8);
  jsonChunkHeader.writeUInt32LE(jsonPadded.length, 0);
  jsonChunkHeader.writeUInt32LE(0x4E4F534A, 4);

  const binChunkHeader = Buffer.alloc(8);
  binChunkHeader.writeUInt32LE(binBuffer.length, 0);
  binChunkHeader.writeUInt32LE(0x004E4942, 4);

  fs.writeFileSync(glbPath, Buffer.concat([header, jsonChunkHeader, jsonPadded, binChunkHeader, binBuffer]));
  console.log(`  -> Indexed ${path.basename(glbPath)}: ${(buf.length / 1048576).toFixed(2)} MB -> ${(totalLength / 1048576).toFixed(2)} MB`);
}

console.log('3. Converting remaining GLB files to compact indexed format...');
for (const file of [
  'search_and_rescue_tracked_robot.glb',
  'bluerov2_underwater_rov.glb',
  'unitree_go2_quadruped.glb',
  'unitree_z1_manipulator.glb'
]) {
  convertExistingGlbToIndexed(path.join(GLB_DIR, file));
}
for (const file of [
  'L1_nacelle_casings.glb',
  'L2_turbofan_core.glb',
  'L3_hpt_combustor.glb'
]) {
  convertExistingGlbToIndexed(path.join(PUBLIC_DIR, 'twins', 'models', file));
}

console.log('Done!');
