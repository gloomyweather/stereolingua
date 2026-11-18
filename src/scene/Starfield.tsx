import { useMemo } from 'react';
import * as THREE from 'three';
import { U } from './uniforms';

/** black-body tint for a temperature in kelvin (approximation, tuned for a dark plate) */
function kelvin(t: number): [number, number, number] {
  t /= 100;
  let r: number, g: number, b: number;
  if (t <= 66) {
    r = 255;
    g = 99.47 * Math.log(t) - 161.12;
    b = t <= 19 ? 0 : 138.52 * Math.log(t - 10) - 305.04;
  } else {
    r = 329.7 * Math.pow(t - 60, -0.1332);
    g = 288.12 * Math.pow(t - 60, -0.0755);
    b = 255;
  }
  const c = (v: number) => Math.min(1, Math.max(0, v / 255));
  return [c(r), c(g), c(b)];
}

/** background stars: power-law magnitudes, stellar colours, a few with diffraction spikes */
export function Starfield({ count = 6500 }: { count?: number }) {
  const { geom, mat } = useMemo(() => {
    const p = new Float32Array(count * 3);
    const c = new Float32Array(count * 3);
    const s = new Float32Array(count);
    const ph = new Float32Array(count);
    const N = new THREE.Vector3(0.42, 0.78, -0.46).normalize();
    const G = new THREE.Vector3().crossVectors(N, new THREE.Vector3(0, 0, 1)).normalize();
    const T = new THREE.Vector3().crossVectors(N, G).normalize();
    const dir = new THREE.Vector3();
    let seed = 7;
    const r = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i < count; i++) {
      const rad = 420 + r() * 260;
      if (i % 5 < 2) {
        // two in five stars crowd into the milky way band (same plane as the sky shader)
        const a = r() * Math.PI * 2;
        const off = (r() + r() + r() - 1.5) * 0.22;
        dir.copy(G).multiplyScalar(Math.cos(a)).addScaledVector(T, Math.sin(a)).addScaledVector(N, off).normalize();
        p.set([dir.x * rad, dir.y * rad * 0.9 + 30, dir.z * rad], i * 3);
      } else {
        const u = r() * 2 - 1;
        const th = r() * Math.PI * 2;
        const q = Math.sqrt(1 - u * u);
        p.set([q * Math.cos(th) * rad, u * rad * 0.9 + 30, q * Math.sin(th) * rad], i * 3);
      }
      const temp = 2800 + Math.pow(r(), 1.6) * 11000;
      c.set(kelvin(temp), i * 3);
      s[i] = 0.55 + Math.pow(r(), 9) * 5.5;
      ph[i] = r() * 6.283;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(p, 3));
    g.setAttribute('aColor', new THREE.BufferAttribute(c, 3));
    g.setAttribute('aSize', new THREE.BufferAttribute(s, 1));
    g.setAttribute('aPhase', new THREE.BufferAttribute(ph, 1));
    const m = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: { uTime: U.uTime, uPR: U.uPR, uDay: U.uDay },
      vertexShader: /* glsl */ `
        uniform float uTime; uniform float uPR;
        attribute vec3 aColor; attribute float aSize; attribute float aPhase;
        varying vec3 vColor; varying float vSize; varying float vTw;
        void main() {
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          gl_Position = projectionMatrix * mv;
          vTw = 0.78 + 0.22 * sin(uTime * (1.3 + fract(aPhase) * 2.0) + aPhase * 9.0);
          vSize = aSize * uPR * (aSize > 3.0 ? 3.2 : 1.6);
          gl_PointSize = vSize;
          vColor = aColor;
        }`,
      fragmentShader: /* glsl */ `
        uniform float uDay;
        varying vec3 vColor; varying float vSize; varying float vTw;
        void main() {
          vec2 c = gl_PointCoord * 2.0 - 1.0;
          float r = length(c);
          float core = exp(-r * r * 9.0);
          float spikes = 0.0;
          if (vSize > 9.0) {
            spikes = (exp(-abs(c.x) * 40.0) + exp(-abs(c.y) * 40.0)) * smoothstep(1.0, 0.1, r) * 0.55;
          }
          float a = (core + spikes) * vTw * (1.0 - uDay);
          if (a < 0.01) discard;
          gl_FragColor = vec4(vColor * a * 0.85, 1.0);
        }`,
    });
    return { geom: g, mat: m };
  }, [count]);
  return <points geometry={geom} material={mat} frustumCulled={false} raycast={() => null} renderOrder={-5} />;
}
