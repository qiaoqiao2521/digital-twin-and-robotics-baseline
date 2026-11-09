/**
 * Asynchronous Multi-GLB & HDRI Asset Loader
 * Strictly loads genuine external CATIA V5 .glb models (`L1_nacelle_casings.glb`, `L2_turbofan_core.glb`, `L3_hpt_combustor.glb`)
 * and binds PBR metallic reflection + Fragment Shader `discard` Clip Plane Laser Glow + Fresnel X-Ray Ghost materials.
 */

import * as THREE from '../../vendor/three.module.js';
import { GLTFLoader } from '../../vendor/loaders/GLTFLoader.js';
import { RGBELoader } from '../../vendor/loaders/RGBELoader.js';
import { injectClipPlaneLaserShader, createFresnelGhostMaterial } from '../shaders/FresnelGhostMat.js';

export class TwinAssetLoader {
  constructor(scene, renderer, sharedClipUniforms) {
    this.scene = scene;
    this.renderer = renderer;
    this.sharedClipUniforms = sharedClipUniforms;
    this.gltfLoader = new GLTFLoader();
    this.rgbeLoader = new RGBELoader();
    this.manifestById = new Map();
    this.loadedPacks = new Map(); // 'L1' | 'L2' | 'L3' -> Group
    this.allPartNodes = [];       // Array of { rootObj, meshes, meta, basePos, explodeVec, microPopOffset }
  }

  async loadEnvironmentHdri(url) {
    return new Promise((resolve) => {
      const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
      pmremGenerator.compileEquirectangularShader();
      this.rgbeLoader.load(
        url,
        (texture) => {
          const envMap = pmremGenerator.fromEquirectangular(texture).texture;
          this.scene.environment = envMap;
          texture.dispose();
          pmremGenerator.dispose();
          resolve(envMap);
        },
        undefined,
        () => {
          pmremGenerator.dispose();
          resolve(null);
        }
      );
    });
  }

  async loadManifest(url) {
    const resp = await fetch(url);
    const data = await resp.json();
    (data.parts || []).forEach((p) => {
      this.manifestById.set(p.id, p);
    });
    return data;
  }

  async loadGlbPack(packKey, url, onProgress) {
    if (this.loadedPacks.has(packKey)) {
      return this.loadedPacks.get(packKey);
    }

    return new Promise((resolve, reject) => {
      this.gltfLoader.load(
        url,
        (gltf) => {
          const packGroup = gltf.scene;
          packGroup.name = `PACK_${packKey}`;

          const ghostMat = createFresnelGhostMaterial(
            this.sharedClipUniforms,
            packKey === 'L1' ? 0x38bdf8 : packKey === 'L2' ? 0x06b6d4 : 0xf59e0b,
            0.22
          );

          // Traverse top-level CAD objects in the GLB
          const topChildren = [...packGroup.children];
          topChildren.forEach((partObj) => {
            const cleanId = partObj.name.replace(/\.00\d$/, '');
            const manifestMeta = this.manifestById.get(cleanId) || {};
            const ud = partObj.userData || {};

            const meta = {
              id: cleanId,
              packKey,
              level: manifestMeta.level || ud.level || packKey,
              subsystem: manifestMeta.subsystem || ud.subsystem || 'MOD_CORE',
              label_zh: manifestMeta.label_zh || ud.label_zh || cleanId,
              label_en: manifestMeta.label_en || ud.label_en || cleanId,
              desc_zh: manifestMeta.desc_zh || ud.desc_zh || '',
              spool: manifestMeta.spool || ud.spool || 'STATIC',
              exportedTriangles: manifestMeta.exportedTriangles || 0,
              explodeVector: manifestMeta.explodeVector || [
                ud.explodeX || 0,
                ud.explodeY || 0,
                ud.explodeZ || 0
              ]
            };

            const meshes = [];
            partObj.traverse((child) => {
              if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
                const origMat = child.material.clone();
                origMat.envMapIntensity = 1.08;
                injectClipPlaneLaserShader(origMat, this.sharedClipUniforms);

                const hoverMat = origMat.clone();
                hoverMat.emissive = new THREE.Color(0x0ea5e9);
                hoverMat.emissiveIntensity = 0.42;
                injectClipPlaneLaserShader(hoverMat, this.sharedClipUniforms);

                const selectedMat = origMat.clone();
                selectedMat.emissive = new THREE.Color(0xf59e0b);
                selectedMat.emissiveIntensity = 0.32;
                injectClipPlaneLaserShader(selectedMat, this.sharedClipUniforms);

                child.material = origMat;
                child.userData.origMaterial = origMat;
                child.userData.hoverMaterial = hoverMat;
                child.userData.selectedMaterial = selectedMat;
                child.userData.ghostMaterial = ghostMat;
                child.userData.partNodeRef = null; // Filled below
                meshes.push(child);
              }
            });

            if (meshes.length > 0) {
              const partNode = {
                id: meta.id,
                packKey,
                rootObj: partObj,
                meshes,
                meta,
                basePos: partObj.position.clone(),
                explodeVec: new THREE.Vector3(...meta.explodeVector),
                currentMicroPop: new THREE.Vector3(),
                targetMicroPop: new THREE.Vector3(),
                isGhost: false
              };
              meshes.forEach((m) => {
                m.userData.partNodeRef = partNode;
              });
              this.allPartNodes.push(partNode);
            }
          });

          this.scene.add(packGroup);
          this.loadedPacks.set(packKey, packGroup);
          resolve(packGroup);
        },
        (xhr) => {
          if (onProgress && xhr.total) {
            onProgress(xhr.loaded / xhr.total);
          }
        },
        (err) => reject(err)
      );
    });
  }
}
