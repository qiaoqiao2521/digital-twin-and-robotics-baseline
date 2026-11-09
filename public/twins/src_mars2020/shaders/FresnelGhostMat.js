import * as THREE from '../../vendor/three.module.js';

export const clipState = {
  enabled: false,
  axis: 3, // 1: Longitudinal (Z), 2: Horizontal (Y), 3: Lateral (X)
  offset: 0.0,
  edgeWidth: 0.032,
  glowColor: new THREE.Color(0xff5e1a),
  innerColor: new THREE.Color(0x38bdf8),
};

export function createFresnelGhostMaterial(opts = {}) {
  const rimColor = new THREE.Color(opts.rimColor || 0x38bdf8);
  const coreColor = new THREE.Color(opts.coreColor || 0x050c1a);
  const opacity = opts.opacity ?? 0.16;

  return new THREE.ShaderMaterial({
    uniforms: {
      uRimColor: { value: rimColor },
      uCoreColor: { value: coreColor },
      uOpacity: { value: opacity },
      uTime: { value: 0 },
      uClipEnabled: { value: 0.0 },
      uClipAxis: { value: 3.0 },
      uClipOffset: { value: 0.0 },
    },
    vertexShader: /* glsl */ `
      varying vec3 vNormalW;
      varying vec3 vViewDir;
      varying vec3 vWorldPos;
      void main() {
        vec4 worldPos = modelMatrix * vec4(position, 1.0);
        vWorldPos = worldPos.xyz;
        vNormalW = normalize(mat3(modelMatrix) * normal);
        vViewDir = normalize(cameraPosition - worldPos.xyz);
        gl_Position = projectionMatrix * viewMatrix * worldPos;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uRimColor;
      uniform vec3 uCoreColor;
      uniform float uOpacity;
      uniform float uTime;
      uniform float uClipEnabled;
      uniform float uClipAxis;
      uniform float uClipOffset;
      varying vec3 vNormalW;
      varying vec3 vViewDir;
      varying vec3 vWorldPos;

      void main() {
        if (uClipEnabled > 0.5) {
          float coord = uClipAxis < 1.5 ? vWorldPos.z : (uClipAxis < 2.5 ? vWorldPos.y : vWorldPos.x);
          if (coord > uClipOffset) discard;
        }
        float ndotv = abs(dot(normalize(vNormalW), normalize(vViewDir)));
        float fresnel = pow(1.0 - ndotv, 2.35);
        float scan = 0.86 + 0.14 * sin(vWorldPos.y * 28.0 - uTime * 2.8);
        vec3 col = mix(uCoreColor, uRimColor, fresnel) * scan;
        float alpha = clamp(uOpacity + fresnel * 0.66, 0.04, 0.90);
        gl_FragColor = vec4(col, alpha);
      }
    `,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
  });
}

export function injectLaserClipShader(material) {
  material.side = THREE.DoubleSide;
  material.userData.clipUniforms = {
    uClipEnabled: { value: 0.0 },
    uClipAxis: { value: 3.0 },
    uClipOffset: { value: 0.0 },
    uClipEdgeWidth: { value: clipState.edgeWidth },
    uClipGlowColor: { value: clipState.glowColor },
    uClipInnerColor: { value: clipState.innerColor },
  };

  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, material.userData.clipUniforms);

    shader.vertexShader =
      `varying vec3 vClipWorldPos;\n` +
      shader.vertexShader.replace(
        `#include <worldpos_vertex>`,
        `#include <worldpos_vertex>\n  vClipWorldPos = (modelMatrix * vec4(transformed, 1.0)).xyz;`
      );

    shader.fragmentShader =
      `
      uniform float uClipEnabled;
      uniform float uClipAxis;
      uniform float uClipOffset;
      uniform float uClipEdgeWidth;
      uniform vec3 uClipGlowColor;
      uniform vec3 uClipInnerColor;
      varying vec3 vClipWorldPos;
      \n` +
      shader.fragmentShader.replace(
        `void main() {`,
        `void main() {
          float clipDist = 999.0;
          if (uClipEnabled > 0.5) {
            float coord = uClipAxis < 1.5 ? vClipWorldPos.z : (uClipAxis < 2.5 ? vClipWorldPos.y : vClipWorldPos.x);
            clipDist = uClipOffset - coord;
            if (clipDist < 0.0) discard;
          }
        `
      ).replace(
        `#include <dithering_fragment>`,
        `#include <dithering_fragment>
          if (uClipEnabled > 0.5 && clipDist < uClipEdgeWidth) {
            float t = 1.0 - (clipDist / uClipEdgeWidth);
            float hotCore = smoothstep(0.55, 1.0, t);
            vec3 edgeCol = mix(uClipGlowColor, uClipInnerColor, hotCore);
            gl_FragColor.rgb = mix(gl_FragColor.rgb, edgeCol * 2.8, pow(t, 1.35));
          }
        `
      );
  };
  material.needsUpdate = true;
  return material;
}
