/**
 * generative ambience on web audio. nothing plays until the reader turns sound on
 * (browsers only allow audio after a gesture). a low drone breathes under the sky;
 * hovering a star plays a soft note in its branch's mode; choosing one rings a small bell;
 * meteors pass with a filtered hush.
 */
let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let verb: ConvolverNode | null = null;
let drone: { stop: () => void } | null = null;

const BRANCH_ROOT: Record<string, number> = {
  root: 0, anatolian: -5, tocharian: 2, 'indo-iranian': 7, greek: 4, armenian: 9, albanian: -3,
  italic: 5, celtic: -7, germanic: -2, 'balto-slavic': 3, 'paleo-balkan': -4, contact: 10,
};
const PENTA = [0, 2, 4, 7, 9, 12, 14];
const hz = (semi: number) => 196 * Math.pow(2, semi / 12); // around g3

function impulse(c: AudioContext, seconds = 3.2) {
  const len = Math.floor(c.sampleRate * seconds);
  const buf = c.createBuffer(2, len, c.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const d = buf.getChannelData(ch);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.6);
  }
  return buf;
}

export function soundOn() {
  if (!ctx) {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0;
    verb = ctx.createConvolver();
    verb.buffer = impulse(ctx);
    const wet = ctx.createGain();
    wet.gain.value = 0.55;
    verb.connect(wet).connect(master);
    master.connect(ctx.destination);
  }
  void ctx.resume();
  master!.gain.cancelScheduledValues(ctx.currentTime);
  master!.gain.setTargetAtTime(0.5, ctx.currentTime, 0.8);
  if (!drone) drone = startDrone();
}

export function soundOff() {
  if (!ctx || !master) return;
  master.gain.setTargetAtTime(0, ctx.currentTime, 0.4);
  const d = drone;
  drone = null;
  window.setTimeout(() => d?.stop(), 1800);
}

function startDrone() {
  const c = ctx!;
  const out = c.createGain();
  out.gain.value = 0.11;
  const lp = c.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = 420;
  lp.Q.value = 0.6;
  const lfo = c.createOscillator();
  const lfoGain = c.createGain();
  lfo.frequency.value = 0.045;
  lfoGain.gain.value = 180;
  lfo.connect(lfoGain).connect(lp.frequency);
  const oscs = [hz(-24), hz(-17), hz(-12) * 1.003, hz(-5) * 0.997].map((f, i) => {
    const o = c.createOscillator();
    o.type = i % 2 ? 'triangle' : 'sine';
    o.frequency.value = f;
    const g = c.createGain();
    g.gain.value = i === 0 ? 0.9 : 0.35;
    o.connect(g).connect(lp);
    o.start();
    return o;
  });
  lp.connect(out);
  out.connect(master!);
  out.connect(verb!);
  lfo.start();
  return {
    stop: () => {
      oscs.forEach((o) => o.stop());
      lfo.stop();
      out.disconnect();
    },
  };
}

function tone(freq: number, dur: number, gain: number, type: OscillatorType = 'sine') {
  if (!ctx || !master || ctx.state !== 'running') return;
  const c = ctx;
  const t = c.currentTime;
  const o = c.createOscillator();
  o.type = type;
  o.frequency.value = freq;
  const g = c.createGain();
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(gain, t + 0.015);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g);
  g.connect(master);
  g.connect(verb!);
  o.start(t);
  o.stop(t + dur + 0.05);
}

let lastHover = 0;
export function hoverNote(branch: string, seed: number) {
  const now = performance.now();
  if (now - lastHover < 90) return;
  lastHover = now;
  const semi = (BRANCH_ROOT[branch] ?? 0) + PENTA[seed % PENTA.length];
  tone(hz(semi), 1.6, 0.05, 'sine');
}

export function bell(branch: string) {
  const f = hz((BRANCH_ROOT[branch] ?? 0) + 12);
  tone(f, 3.2, 0.08, 'sine');
  tone(f * 2.76, 1.6, 0.025, 'sine');
  tone(f * 5.4, 0.8, 0.01, 'sine');
}

export function hush() {
  if (!ctx || !master || ctx.state !== 'running') return;
  const c = ctx;
  const len = Math.floor(c.sampleRate * 2);
  const buf = c.createBuffer(1, len, c.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  const src = c.createBufferSource();
  src.buffer = buf;
  const bp = c.createBiquadFilter();
  bp.type = 'bandpass';
  bp.Q.value = 3;
  const t = c.currentTime;
  bp.frequency.setValueAtTime(2400, t);
  bp.frequency.exponentialRampToValueAtTime(500, t + 1.8);
  const g = c.createGain();
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(0.03, t + 0.3);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 1.9);
  src.connect(bp).connect(g);
  g.connect(master);
  g.connect(verb!);
  src.start(t);
}
