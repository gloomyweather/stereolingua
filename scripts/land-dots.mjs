// generate an evenly spaced dot grid over land (fibonacci sphere ∩ natural earth 110m land)
import { readFileSync, writeFileSync } from 'node:fs';
import { feature } from 'topojson-client';
import { geoContains } from 'd3-geo';
const topo = JSON.parse(readFileSync('node_modules/world-atlas/land-110m.json', 'utf8'));
const land = feature(topo, topo.objects.land);
const N = 16000;
const golden = Math.PI * (3 - Math.sqrt(5));
const out = [];
for (let i = 0; i < N; i++) {
  const y = 1 - (i / (N - 1)) * 2;
  const r = Math.sqrt(1 - y * y);
  const th = golden * i;
  const lat = (Math.asin(y) * 180) / Math.PI;
  const lon = ((((Math.atan2(Math.sin(th) * r, Math.cos(th) * r) * 180) / Math.PI) + 540) % 360) - 180;
  if (lat < -60) continue; // skip antarctica: it only clutters the plate
  if (geoContains(land, [lon, lat])) out.push(Math.round(lat * 10), Math.round(lon * 10));
}
writeFileSync('src/data/landDots.json', JSON.stringify(out));
console.log('land dots:', out.length / 2);
