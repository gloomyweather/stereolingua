// turn the vite single-file build into an artifact page body:
// strip doctype/html/head/body wrappers (the artifact host adds its own skeleton)
import { readFileSync, writeFileSync } from 'node:fs';
const src = readFileSync('dist/index.html', 'utf8');
const head = (src.match(/<head>([\s\S]*?)<\/head>/) ?? [, ''])[1]
  .replace(/<meta charset[^>]*>\s*/i, '')
  .replace(/<meta name="viewport"[^>]*>\s*/i, '');
const body = (src.match(/<body>([\s\S]*?)<\/body>/) ?? [, ''])[1];
// title must be within the first 8KB: hoist it
const title = (head.match(/<title>[\s\S]*?<\/title>/) ?? [''])[0];
const rest = head.replace(title, '');
const out = `${title}\n${rest.trim()}\n${body.trim()}\n`;
writeFileSync('dist/stereolingua.html', out);
console.log('dist/stereolingua.html', (out.length / 1024).toFixed(0) + ' KB');
