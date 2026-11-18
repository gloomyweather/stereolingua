// dev helper: print every word's form in the given languages (npx vite-node scripts/dump-forms.ts -- lang1 lang2)
import { words } from '../src/data/index';
for (const L of process.argv.slice(2).filter((a) => a !== '--')) {
  const parts = words.map((w) => {
    const f = w.forms.find((x) => x.lang === L);
    return f ? `${w.id}=${f.form}${f.translit ? `(${f.translit})` : ''}${f.note ? ` [${f.note.slice(0, 50)}]` : ''}` : null;
  });
  console.log(`== ${L}: ${parts.filter(Boolean).join(' | ')}`);
}
