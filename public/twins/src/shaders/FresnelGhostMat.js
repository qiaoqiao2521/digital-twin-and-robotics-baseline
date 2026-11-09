import * as THREE from '../../vendor/three.module.js';

/**
 * Shader Pipeline:
 * 1. Fresnel X-Ray Ghost Shader (`createFresnelGhostMaterial`) for parent context & unselected isolation.
 * 2. Fragment Shader `discard` + Laser Edge Glow (`injectClipPlaneLaserShader`) for dynamic cross-sectioning
 *    without fragile Stencil Clipping Caps (Red Line #3 compliant).
 */

export function createSharedClipUniforms() {
  return {
    uClipEnabled: { value: 0.0 },
    uClipAxis: { value: new THREE.Vector3(0, 0, -1) }, // Default slices front-to-back or axial X
    uClipOffset: { value: 0.15 },
    uClipEdgeWidth: { value: 0.032 },
    uClipGlowColorA: { value: new THREE.Color(0xff5500) }, // Laser Orange core
    uClipGlowColorB: { value: new THREE.Color(0x38bdf8) }, // Cyan plasma outer rim
    uTime: { value: 0.0 }
  };
}

/**
 * Injects Fragment Shader `discard` + glowing laser cut contour into any Three.js MeshStandardMaterial
 */
export function injectClipPlaneLaserShader(material, sharedUniforms) {
  material.side = THREE.DoubleSide;
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uClipEnabled = sharedUniforms.uClipEnabled;
    shader.uniforms.uClipAxis = sharedUniforms.uClipAxis;
    shader.uniforms.uClipOffset = sharedUniforms.uClipOffset;
    shader.uniforms.uClipEdgeWidth = sharedUniforms.uClipEdgeWidth;
    shader.uniforms.uClipGlowColorA = sharedUniforms.uClipGlowColorA;
    shader.uniforms.uClipGlowColorB = sharedUniforms.uClipGlowColorB;

    shader.vertexShader =
      `varying vec3 vTwinWorldPos;\n` +
      shader.vertexShader.replace(
        '#include <worldpos_vertex>',
        `#include <worldpos_vertex>
         vTwinWorldPos = (modelMatrix * vec4(transformed, 1.0)).xyz;`
      );

    shader.fragmentShader =
      `uniform float uClipEnabled;
       uniform vec3 uClipAxis;
       uniform float uClipOffset;
       uniform float uClipEdgeWidth;
       uniform vec3 uClipGlowColorA;
       uniform vec3 uClipGlowColorB;
       varying vec3 vTwinWorldPos;\n` +
      shader.fragmentShader.replace(
        '#include <clipping_planes_fragment>',
        `#include <clipping_planes_fragment>
         float twinClipDist = dot(vTwinWorldPos, uClipAxis) - uClipOffset;
         if (uClipEnabled > 0.5 && twinClipDist > 0.0) {
           discard;
         }`
      ).replace(
        '#include <dithering_fragment>',
        `if (uClipEnabled > 0.5) {
           float edgeBand = abs(twinClipDist);
           if (edgeBand < uClipEdgeWidth) {
             float t = 1.0 - smoothstep(0.0, uClipEdgeWidth, edgeBand);
             vec3 laserCol = mix(uClipGlowColorB, uClipGlowColorA, pow(t, 1.6));
             gl_FragColor.rgb = mix(gl_FragColor.rgb, laserCol * 2.8, pow(t, 0.75));
           }
         }
         #include <dithering_fragment>`
      );
  };
  material.needsUpdate = true;
  return material;
}

/**
 * Creates the Holographic Fresnel X-Ray Ghost ShaderMaterial used for parent levels and dimmed unselected parts
 */
export function createFresnelGhostMaterial(sharedUniforms, tintHex = 0x38bdf8, opacityScale = 0.24) {
  return new THREE.ShaderMaterial({
    uniforms: {
      uRimColor: { value: new THREE.Color(tintHex) },
      uCoreColor: { value: new THREE.Color(0x051024) },
      uOpacity: { value: opacityScale },
      uTime: sharedUniforms.uTime,
      uClipEnabled: sharedUniforms.uClipEnabled,
      uClipAxis: sharedUniforms.uClipAxis,
      uClipOffset: sharedUniforms.uClipOffset
    },
    vertexShader: `
      varying vec3 vNormalW;
      varying vec3 vViewDirW;
      varying vec3 vWorldPos;
      void main() {
        vec4 worldPosition = modelMatrix * vec4(position, 1.0);
        vWorldPos = worldPosition.xyz;
        vNormalW = normalize(mat3(modelMatrix) * normal);
        vViewDirW = normalize(cameraPosition - worldPosition.xyz);
        gl_Position = projectionMatrix * viewMatrix * worldPosition;
      }
    `,
    fragmentShader: `
      uniform vec3 uRimColor;
      uniform vec3 uCoreColor;
      uniform float uOpacity;
      uniform float uTime;
      uniform float uClipEnabled;
      uniform vec3 uClipAxis;
      uniform float uClipOffset;
      varying vec3 vNormalW;
      varying vec3 vViewDirW;
      varying vec3 vWorldPos;

      void main() {
        float clipDist = dot(vWorldPos, uClipAxis) - uClipOffset;
        if (uClipEnabled > 0.5 && clipDist > 0.0) {
          discard;
        }
        float ndotv = abs(dot(normalize(vNormalW), normalize(vViewDirW)));
        float fresnel = pow(1.0 - ndotv, 2.25);
        float scan = 0.85 + 0.15 * sin(vWorldPos.x * 18.0 - uTime * 2.4);
        vec3 col = mix(uCoreColor, uRimColor * 1.65, fresnel) * scan;
        float alpha = clamp((0.06 + fresnel * 0.82) * (uOpacity / 0.24), 0.03, 0.72);
        gl_FragColor = vec4(col, alpha);
      }
    `,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending
  });
}
