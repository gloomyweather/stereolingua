import * as THREE from 'three';
import { U, themedMaterial } from './uniforms';

/** a small cpu-driven point buffer for comet heads, trails and dotted routes */
export class Sparks {
  readonly geom = new THREE.BufferGeometry();
  readonly mat: THREE.ShaderMaterial;
  readonly points: THREE.Points;
  private pos: Float32Array;
  private alpha: Float32Array;
  private size: Float32Array;
  private col: Float32Array;
  private n = 0;

  constructor(readonly capacity: number) {
    this.pos = new Float32Array(capacity * 3);
    this.alpha = new Float32Array(capacity);
    this.size = new Float32Array(capacity);
    this.col = new Float32Array(capacity * 3);
    this.geom.setAttribute('position', new THREE.BufferAttribute(this.pos, 3).setUsage(THREE.DynamicDrawUsage));
    this.geom.setAttribute('aAlpha', new THREE.BufferAttribute(this.alpha, 1).setUsage(THREE.DynamicDrawUsage));
    this.geom.setAttribute('aSize', new THREE.BufferAttribute(this.size, 1).setUsage(THREE.DynamicDrawUsage));
    this.geom.setAttribute('aColor', new THREE.BufferAttribute(this.col, 3).setUsage(THREE.DynamicDrawUsage));
    this.geom.setDrawRange(0, 0);
    this.mat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: { uPR: U.uPR, uDay: U.uDay },
      vertexShader: /* glsl */ `
        uniform float uPR;
        attribute float aAlpha; attribute float aSize; attribute vec3 aColor;
        varying float vAlpha; varying vec3 vColor;
        void main() {
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          gl_Position = projectionMatrix * mv;
          gl_PointSize = min(aSize * uPR * (50.0 / -mv.z), 28.0 * uPR);
          vAlpha = aAlpha; vColor = aColor;
        }`,
      fragmentShader: /* glsl */ `
        uniform float uDay;
        varying float vAlpha; varying vec3 vColor;
        void main() {
          float d = length(gl_PointCoord - 0.5) * 2.0;
          float a = (exp(-d * d * 5.0) + exp(-d * 14.0)) * 0.6 * vAlpha;
          if (a < 0.003) discard;
          gl_FragColor = uDay > 0.5 ? vec4(mix(vec3(1.0), vColor * vec3(0.55, 0.4, 0.18), clamp(a * 1.6, 0.0, 1.0)), 1.0) : vec4(vColor * a, 1.0);
        }`,
    });
    themedMaterial(this.mat);
    this.points = new THREE.Points(this.geom, this.mat);
    this.points.frustumCulled = false;
    this.points.raycast = () => null;
  }

  begin() {
    this.n = 0;
  }

  push(p: THREE.Vector3, alpha: number, size: number, c: THREE.Color) {
    if (this.n >= this.capacity) return;
    const i = this.n++;
    this.pos[i * 3] = p.x;
    this.pos[i * 3 + 1] = p.y;
    this.pos[i * 3 + 2] = p.z;
    this.alpha[i] = alpha;
    this.size[i] = size;
    this.col[i * 3] = c.r;
    this.col[i * 3 + 1] = c.g;
    this.col[i * 3 + 2] = c.b;
  }

  end() {
    this.geom.setDrawRange(0, this.n);
    for (const k of ['position', 'aAlpha', 'aSize', 'aColor']) (this.geom.getAttribute(k) as THREE.BufferAttribute).needsUpdate = true;
  }
}

/** an arc between two points that clears the stars between them */
export function arcBetween(p0: THREE.Vector3, p3: THREE.Vector3, center: THREE.Vector3, globe: number) {
  const span = p0.distanceTo(p3);
  const mid = p0.clone().add(p3).multiplyScalar(0.5);
  const out = mid.clone().sub(center);
  out.y = out.y * globe; // in the tree, lift sideways and up; on the globe, straight out
  if (out.lengthSq() < 1e-6) out.set(1, 0, 0);
  out.normalize();
  const lift = out.multiplyScalar(span * 0.35).add(new THREE.Vector3(0, span * 0.18 * (1 - globe), 0));
  return {
    p0: p0.clone(),
    c1: p0.clone().lerp(p3, 0.3).add(lift),
    c2: p0.clone().lerp(p3, 0.7).add(lift),
    p3: p3.clone(),
  };
}

/** latin, greek and cyrillic can morph letter by letter; other scripts cross-fade */
export const MORPHABLE = /^[\p{Script=Latin}\p{Script=Greek}\p{Script=Cyrillic}\p{M}\s*'’ʰʷ₁₂₃.\-()/]*$/u;
