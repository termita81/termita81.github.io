/** GLSL for the full-screen passes of the exposure pipeline. */

export const PASS_VERTEX = /* glsl */ `
  varying vec2 vUv;
  void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`;

export const FILL_FRAGMENT = /* glsl */ `
  uniform vec3 uColor;
  void main() { gl_FragColor = vec4(uColor, 1.0); }`;

export const ADD_FRAGMENT = /* glsl */ `
  uniform sampler2D tSrc;
  uniform float uWeight;
  varying vec2 vUv;
  void main() { gl_FragColor = vec4(texture2D(tSrc, vUv).rgb * uWeight, 1.0); }`;

export const DEVELOP_FRAGMENT = /* glsl */ `
  precision highp float;
  precision highp int;
  uniform sampler2D tAccum;
  uniform float uLight;   // light reaching the sensor relative to a correct ISO 100 exposure
  uniform float uIso;     // ISO gain, 1.0 = ISO 100
  uniform float uNoise;   // 1.0 = simulate sensor noise
  uniform float uSeed;
  varying vec2 vUv;

  const float FULL_WELL = 8000.0;  // electrons at clipping, ISO 100 (small on purpose so noise is easy to see)
  const float READ_VAR  = 4.0;     // read noise variance in electrons^2

  uint pcgHash(uint v) {
    uint s = v * 747796405u + 2891336453u;
    uint w = ((s >> ((s >> 28u) + 4u)) ^ s) * 277803737u;
    return (w >> 22u) ^ w;
  }

  float rand01(uint h) { return (float(h >> 8u) + 0.5) / 16777216.0; }

  vec3 toDisplay(vec3 c) {
    vec3 lo = c * 12.92;
    vec3 hi = 1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055;
    return mix(lo, hi, step(vec3(0.0031308), c));
  }

  void main() {
    vec3 radiance = max(texture2D(tAccum, vUv).rgb, vec3(0.0));
    vec3 electrons = radiance * uLight * FULL_WELL;
    if (uNoise > 0.5) {
      uvec2 p = uvec2(gl_FragCoord.xy);
      uint h = pcgHash(p.x + pcgHash(p.y + pcgHash(uint(uSeed))));
      uint a = pcgHash(h);
      uint b = pcgHash(a);
      uint c = pcgHash(b);
      uint d = pcgHash(c);
      float r1 = sqrt(-2.0 * log(rand01(a)));
      float r2 = sqrt(-2.0 * log(rand01(c)));
      float t1 = 6.2831853 * rand01(b);
      float t2 = 6.2831853 * rand01(d);
      vec3 gauss = vec3(r1 * cos(t1), r1 * sin(t1), r2 * cos(t2));
      electrons += sqrt(electrons + READ_VAR) * gauss;
    }
    vec3 linear = clamp(electrons / FULL_WELL * uIso, 0.0, 1.0);
    gl_FragColor = vec4(toDisplay(linear), 1.0);
  }`;
