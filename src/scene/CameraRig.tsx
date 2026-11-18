import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import type { OrbitControls as OrbitImpl } from 'three-stdlib';
import { layout, nodePos, GLOBE_CENTER, wordCarriers } from './model';
import { U } from './uniforms';
import { treePath } from '../lib/tree';
import { useStore, prefersReducedMotion } from '../store';
import { YEAR_MIN, YEAR_MAX } from '../lib/timeScale';

const INTRO_POS = new THREE.Vector3(6, 4, 14);
const INTRO_TARGET = new THREE.Vector3(0, 2, 0);

const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

interface Flight {
  curve: THREE.CatmullRomCurve3;
  dir: THREE.Vector3;
  d0: number;
  d1: number;
  t: number;
  dur: number;
}

export const OVERVIEW_TARGET = new THREE.Vector3(0, 28, 0);
export const OVERVIEW_POS = new THREE.Vector3(62, 46, 74);

export function CameraRig() {
  const controls = useRef<OrbitImpl>(null);
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const size = useThree((s) => s.size);
  const shift = useRef(0);
  const flight = useRef<Flight | null>(null);
  const lastInteract = useRef(performance.now());

  const flyTo = (points: THREE.Vector3[], endDist: number, dur?: number) => {
    const c = controls.current;
    if (!c) return;
    const start = c.target.clone();
    const pts = [start, ...points];
    if (pts.length === 2) pts.splice(1, 0, start.clone().lerp(points[0], 0.5));
    const curve = new THREE.CatmullRomCurve3(pts, false, 'centripetal');
    const dir = camera.position.clone().sub(c.target).normalize();
    const len = curve.getLength();
    flight.current = {
      curve,
      dir,
      d0: camera.position.distanceTo(c.target),
      d1: endDist,
      t: 0,
      dur: prefersReducedMotion ? 0.01 : dur ?? Math.min(2.6, 0.9 + len / 40),
    };
    useStore.getState().setFlying(true);
  };

  // react to selection
  useEffect(
    () =>
      useStore.subscribe((s, prev) => {
        if (s.selected === prev.selected) return;
        const m = U.uMorph.value;
        if (!s.selected) {
          if (s.view === 'globe') flyTo([GLOBE_CENTER.clone()], 62);
          else flyTo([OVERVIEW_TARGET.clone()], OVERVIEW_POS.distanceTo(OVERVIEW_TARGET));
          return;
        }
        const from = prev.selected;
        const ids = from ? treePath(layout.index, from, s.selected) : [s.selected];
        const pts = ids.slice(1).map((id) => nodePos(id, m));
        if (pts.length === 0) pts.push(nodePos(s.selected, m));
        flyTo(pts, 16);
      }),
    [],
  );

  // when the title plate is skipped mid-growth, glide from wherever the camera is to the full view
  useEffect(
    () =>
      useStore.subscribe((s, prev) => {
        if (s.phase === 'explore' && prev.phase === 'intro' && !s.selected && !s.word) {
          const c = controls.current;
          if (c && camera.position.distanceTo(OVERVIEW_POS) > 2) flyTo([OVERVIEW_TARGET.clone()], OVERVIEW_POS.distanceTo(OVERVIEW_TARGET), 1.8);
        }
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  // a word opens: pull back to frame every language it reaches, so its whole journey is visible
  useEffect(
    () =>
      useStore.subscribe((s, prev) => {
        if (s.word === prev.word) return;
        const m = U.uMorph.value;
        if (s.word) {
          const pts = [...wordCarriers(s.word).carriers.keys()].map((id) => nodePos(id, m));
          if (!pts.length) return;
          const box = new THREE.Box3().setFromPoints(pts);
          const sphere = box.getBoundingSphere(new THREE.Sphere());
          const fov = THREE.MathUtils.degToRad(camera.fov);
          const dist = Math.max(28, (sphere.radius / Math.sin(fov / 2)) * 0.95);
          flyTo([sphere.center], dist, 2.0);
        } else if (s.selected) flyTo([nodePos(s.selected, m)], 16, 1.6);
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  useEffect(
    () =>
      useStore.subscribe((s, prev) => {
        if (s.view === prev.view) return;
        if (s.selected) {
          // keep the selected star in view while it migrates
          window.setTimeout(() => flyTo([nodePos(s.selected!, s.view === 'globe' ? 1 : 0)], 22, 1.6), 50);
          return;
        }
        if (s.view === 'globe') {
          const c = controls.current;
          const dir = c ? camera.position.clone().sub(c.target).normalize() : new THREE.Vector3(0.6, 0.35, 0.7);
          flyTo([GLOBE_CENTER.clone()], 62, 2.2);
          if (flight.current) flight.current.dir = dir.lerp(new THREE.Vector3(0.45, 0.42, 0.78).normalize(), 0.7).normalize();
        } else flyTo([OVERVIEW_TARGET.clone()], OVERVIEW_POS.distanceTo(OVERVIEW_TARGET), 2.2);
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  useFrame((_, dt) => {
    const c = controls.current;
    if (!c) return;
    // keep the focused star centred in the space left of the side panel (desktop) or above the sheet (phone)
    const sel = !!useStore.getState().selected;
    const narrow = size.width <= 720;
    const want = sel ? (narrow ? size.height * 0.24 : Math.min(200, size.width * 0.14)) : 0;
    const next = shift.current + (want - shift.current) * Math.min(1, dt * 4);
    if (Math.abs(next - shift.current) > 0.05 || (shift.current !== 0 && Math.abs(next) < 0.05)) {
      shift.current = Math.abs(next) < 0.05 ? 0 : next;
      if (shift.current === 0) camera.clearViewOffset();
      else if (narrow) camera.setViewOffset(size.width, size.height, 0, shift.current, size.width, size.height);
      else camera.setViewOffset(size.width, size.height, shift.current, 0, size.width, size.height);
    }
    const st = useStore.getState();
    if (st.phase === 'intro') {
      const p = (st.growYear - YEAR_MIN) / (YEAR_MAX - YEAR_MIN);
      const e = ease(Math.min(1, p * 1.05));
      c.target.lerpVectors(INTRO_TARGET, OVERVIEW_TARGET, e);
      camera.position.lerpVectors(INTRO_POS, OVERVIEW_POS, e);
      c.update();
      return;
    }
    const f = flight.current;
    if (f) {
      f.t = Math.min(1, f.t + dt / f.dur);
      const e = ease(f.t);
      const target = f.curve.getPoint(e);
      // pull back mid-flight for a sense of travel through the branches
      const d = THREE.MathUtils.lerp(f.d0, f.d1, e) * (1 + 0.35 * Math.sin(Math.PI * e));
      c.target.copy(target);
      camera.position.copy(target).addScaledVector(f.dir, d);
      if (f.t >= 1) {
        flight.current = null;
        useStore.getState().setFlying(false);
      }
    }
    const idle = performance.now() - lastInteract.current > 9000;
    c.autoRotate = !prefersReducedMotion && idle && !f && useStore.getState().phase === 'explore';
    c.update();
  });

  return (
    <OrbitControls
      ref={controls as never}
      makeDefault
      enableDamping
      dampingFactor={0.08}
      rotateSpeed={0.6}
      zoomSpeed={0.8}
      minDistance={3}
      maxDistance={220}
      autoRotateSpeed={0.25}
      target={OVERVIEW_TARGET.toArray()}
      onStart={() => {
        lastInteract.current = performance.now();
        if (flight.current) {
          flight.current = null;
          useStore.getState().setFlying(false);
        }
      }}
      onEnd={() => (lastInteract.current = performance.now())}
    />
  );
}
