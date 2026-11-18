# data conventions (contract for all data authors)

- types: src/data/types.ts (do not edit).
- language files: src/data/languages/<group>.ts
  `import type { Language } from '../types'; const langs: Language[] = [...]; export default langs;`
- form files: src/data/forms/<group>.ts
  `import type { FormsByWord } from './index'; const forms: FormsByWord = { mother: [...], ... }; export default forms;`
  FormsByWord = Record<wordId, WordForm[]>.
- ids: kebab-case english, stable. root of the tree is `pie` (proto-indo-european).
  proto nodes: `proto-<name>` (proto-germanic, proto-indo-iranian, proto-balto-slavic, proto-celtic, proto-italic, proto-hellenic ...).
  stages: `old-english`, `middle-english`, `english`; `old-church-slavonic`; `vedic-sanskrit`, `classical-sanskrit`...
- years: integers, negative = bce. `start` = when the variety becomes distinct (approx), `end` = null if spoken today.
  child.start must be >= parent.start. a stage's successor starts roughly when it ends.
- status: proto | ancient | medieval | living | extinct (see types.ts).
- region: where the variety emerged / was mainly spoken; `label` like "Wessex, England".
- branch: one of the Branch keys in types.ts.
- reconstructed forms start with `*` and have attested:false. attested forms attested:true.
- non-latin scripts: `form` in native script, `translit` in standard romanisation. greek, cyrillic, armenian, devanagari, arabic-script, gothic etc.
- NEVER invent a form. if you are not confident a form is correct (and is the cognate/standard word for that meaning), omit it. fewer correct forms beat many shaky ones. if the language uses a non-cognate word for the meaning, give the actual word used and add note "not cognate" ; for inherited sets prefer the cognate when it exists with shifted meaning and note the meaning.
- summary: 2–3 sentences, engaging but factual. funFact: one surprising, verifiable fact.
- sources: short citations, e.g. "Wiktionary", "Fortson 2010", "Mallory & Adams 2006", "Ethnologue 2024", "Glottolog 5.0".
- contested: fill only when placement or grouping is genuinely disputed (one sentence).

## word ids
inherited (give forms for every language in your group where known, including proto nodes):
  mother, father, brother, night, two, three, heart, star, new, name, water, wolf,
  daughter, moon, tooth, foot, mead, snow
wanderers (living and relevant historical languages only, where the word exists):
  sugar, orange, tea, coffee, chocolate, robot, algebra, zero, paradise, pyjamas, tomato
