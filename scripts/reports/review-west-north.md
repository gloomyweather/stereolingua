# review: west (Italic, Celtic) + north (Germanic, Balto-Slavic)

Files: `src/data/languages/{west,north}.ts`, `src/data/forms/{west,west-extra,north,north-extra}.ts`.
Evidence: `wiktionary-report.json`. Every non-ok entry was re-checked by hand on en.wiktionary through the API. I also used Wiktionary etymology and descendant sections (including the Proto-West-Germanic pages) and English translation tables. Speaker figures come from current Wikipedia infoboxes (one batched request), cross-checked against censuses.
`npx tsc --noEmit` is clean. `npm run validate` prints `ok`; the only warning in scope is `old-welsh: only 3 word forms`, because only three Old Welsh forms could be confirmed.

## numbers

| | count |
|---|---|
| forms before / after | 1483 / 1525 |
| form text corrected | 84 (63 spelling or lemma fixes, 19 script conversions, 2 apostrophe normalisations) |
| note / translit / IPA corrected only | 292 (265 notes, 16 translits, 17 IPA) |
| deleted | 20, plus 1 moved (Old Irish → Middle Irish *pardus*) |
| added | 62, plus the moved form |

## 1. forms

### proto-forms put into standard notation (all now resolve on Wiktionary)
- Proto-Italic: `*duo`→`*duō`, `*newos`→`*nowos`, `*nōmen`→`*nōmn̥`, `*lupos`→`*lukʷos` (Latin *lupus* is a Sabellic loan; notes say so).
- Proto-Celtic: `*atīr`→`*ɸatīr`, `*nokʷts`→`*noxs`, `*dwāu`→`*duwo`, `*trejes`→`*trīs`, `*nowijos`→`*nowiyos`, `*medu-`→`*medu`. `*dantos` means "manner" on Wiktionary, so "tooth" is now `*dants` (stem *dant-).
- Proto-Germanic: `*þrijiz`→`*þrīz`, `*hertōn`→`*hertô`, `*sternōn`→`*sternǭ`, `*dohtēr`→`*duhtēr`.
- Balto-Slavic: `*naktis`→`*náktis`, `*wilkas`→`*wilkás`, `*imę`→`*jьmę`, `*zvězda`→`*gvězda` (the note explains the later East/South Slavic *z-*).
- New proto-forms: Proto-Italic `*kord`, `*stērolā`; Proto-Celtic `*kridyom`, `*mīns`.

### attested forms corrected
- **Medieval stages, real spellings (stage chains).** ME `tooth`→`toth`, `foot`→`fot` (MED/Wiktionary lemmas). OHG `zan`→`zand`. MHG `met`→`mete`. Old Saxon `fader`→`fadar`, `mānō`→`māno`. Old Frisian `wetir`→`weter`, `stera`→`stēra`, and "two" `twā`→`twēne` (masc., the etymon of WFris *twa*). Middle Dutch `nieu`→`niewe`, `suker`→`suicker`. MLG uses unmarked spellings throughout, as Wiktionary does (`vōt`→`vot`, `snē`→`sne`). Low German `Mudder`/`Vadder`→`Moder`/`Vader` (the Wiktionary lemmas). Middle Welsh `tat`→`tad`, `dwfr`→`dwfyr`. Old Irish `nue`→`núae`, `coss`→`cos`, `snechta`→`snechtae`. Old Occitan `nueit`→`noch`. Old Spanish `coraçón`→`coraçon`. Old Italian `zefiro`→`zero` (*zefiro* only means "zephyr"; Wiktionary gives Old Italian *zero* < Medieval Latin *zēphirum*).
  Chains checked: OE→ME→English, OHG→MHG→German, Old Saxon→MLG→Low German, Old Dutch→Middle Dutch→Dutch, Old Norse→Icelandic etc., Old→Middle Irish→Irish/Gaelic/Manx, Old→Middle Welsh→Welsh, Proto-Slavic→OCS/OES→modern. No modern spellings remain in medieval stages.
- **Living languages.** Occitan `cor`→`còr`. Sardinian `coro`→`core` and `istella`→`isteddu` (the main word). Ladino `lobo`→`lovo`. Scottish Gaelic `dhà`→`dà`, `sneachd`→`sneachda`, `seòclaid`→`teòclaid`. Irish "coffee" `caifé`→`caife` (*caifé* means "café"). Cornish moved to SWF (`troes`→`troos`, `sterenn`→`steren`). Breton "orange" `orañjez`→`orañjezenn`. Upper Sorbian `med`→`měd`, `cuker`→`cokor`. Slovak `pyžama`→`pyžamo`. Serbo-Croatian "moon" is now Ijekavian `мјесец`, matching star and snow.
- **OCS / OES.** OCS `дъшти`→`дъщи`, `трие`→`трьѥ`, `влъкъ`→`влькъ`. OES "three" `три`→`трие`.
- **Crimean Gothic.** "Brother" `broe` (Busbecq's word for *bread*) → `bruder`.
- **Latin.** "Sugar" `saccharum` (New Latin) → `saccharon` (Pliny).
- **Script.** The 17 Gothic forms are now in Gothic script with transliteration (ē/ō marked, as on Wiktionary). Umbrian `utur` → `𐌖𐌕𐌖𐌓` and Oscan `futír` → `𐌚𐌖𐌕𐌝𐌓`, with transliterations. Cyrillic transliteration was made consistent (scientific, soft sign `ʹ`, Russian `x`): e.g. `sakhar`→`saxar`, `miesiac`→`mesjac`, `snieh`→`sneh`. OCS/OES jer transliterations fixed (`srŭdĭce`→`srĭdĭce`, `sŭrdĭce`→`sĭrdĭce`, `imja`→`imę`).

### notes corrected (factual ones)
- Romanian *picior*: now says it is **related**, from Late Latin *petiolus*, a double diminutive of *pēs*.
- Upper Sorbian *dźowka*: **not cognate**, from `*děvъka` "girl".
- Ukrainian *дочка* and Belarusian *дачка*: confirmed cognate (from `*dъťi` + -ка); notes say so.
- Lithuanian *pėda* / Latvian *pēda* are the anatomical foot, not just "footprint" (*koja*/*kāja* mean "leg").
- Welsh/Irish/Scottish Gaelic "sugar" came via Anglo-Norman *sucre*, not English. Irish *oráiste* is a Romance loan. Afrikaans *lemoen* is from Dutch *limoen* "lime", not Malay. Swedish *apelsin* is from Low German/Dutch. Luxembourgish *Papp* is from French *papa*. The unverified "Mutter/Vatter also used" claims were removed.
- Sardinian *lupu* is a loan from Italian (there are no wolves on Sardinia).
- Welsh/Cornish/Breton *nos/noz*: either inherited or borrowed from Latin *nox* (Wiktionary).
- French *neuf* vs *nouveau* had been reversed; now correct. Spanish *nombre*: the oblique stem, not an "accusative". Catalan *tomàquet*: metathesis of *tomàtec*.
- Macedonian *месец* means only "month" (the moon is *месечина*). Bulgarian *месец*: "month; colloquially moon". Serbo-Croatian, Bulgarian and Macedonian *majka*: derived from *mati* via `*matьka`.
- "Not cognate" added to all Slavic `*otьcь` forms. Slovene *sladkor* is built on *sladek* "sweet".

### deleted (20) and why
- Unattested or unconfirmable: Gaulish `dubron` (only inferred from place names); Old Prussian `naktis`, `tris`, `menins` (not attested as nominatives); Old Dutch `wulf` (only reconstructed `*wulf`); Old Saxon `twā`; Crimean Gothic `stern` (not in Busbecq's list); Low German `Steern`; Upper Sorbian `zub`; Latvian `pidžama`; MLG `mede` (mead).
- Wrong meaning or etymology: Breton `mez` (means "acorns"); Russian `под` (Wiktionary: derivation from the foot root "less likely").
- Unconfirmed wanderer forms: Breton `baradoz` and `robot`; Irish `róbat` (Wiktionary has *róbait*; sources disagree); Scottish Gaelic `pàrras`; Scots `name`, `tea`, `coffee` (no Scots entries, identical to English).
- Moved: Old Irish `pardus` → Middle Irish (Wiktionary dates it there).

### added (62), each confirmed on Wiktionary
- Proto-Norse runic, from the Tune stone: `ᛞᛟᚺᛏᚱᛁᛉ` dohtriʀ "daughters" and `ᚦᚱᛁᛃᛟᛉ` þrijōʀ "three". These are the only attested runic forms for our words.
- Old East Slavic: `мати`, `отьць`, `братъ`, `дъчи`, `зубъ`, `нога`, `медъ`.
- Dalmatian (Vegliot; previously no forms): `nuot`, `doi`, `tra`, `cur`, `nuf`, `naun`, `aqua`, `diant`, `pi`, `nai`, `tuota`, `stala`, `mais`, `paradais`.
- Old Dutch: `muoder`, `fadar`, `bruother`, `thrie`, `niuwi`, `dohtar`, `māno`, `tant`, `fuot`, `snēo`, `sterro`.
- Middle Irish: `ainm`, `adaig`, `trí`, `ingen`, `núa`, `snechta`. Manx: `cass`, `mee`, `inneen`, `sniaghtey`. Old Welsh: `braut`, `neguid`, `anu`. Middle Welsh `deu`. Cornish `medh`.
- Others: Crimean Gothic `mine` "moon"; Old Prussian `mūti`, `brāti`; Old Saxon `thrīe`; Old Frisian `mede`; MLG `sucker`; West Frisian `tosk` (tooth, an -sk derivative of the same root, cf. *tusk*); Upper Sorbian `wutroba`; Sardinian `mama`.

## 2. languages

- **Speakers** (native or main-language where available):
  - Irish 73k→72k (Census 2022, daily speakers outside education).
  - Scottish Gaelic 57k→70k (Census 2022).
  - Breton 200k→107k (Région Bretagne survey 2024).
  - Cornish 600→560 (Census 2021, main language).
  - Occitan 500k→200k (estimates range 110k–789k; summary says so).
  - Ladino 100k→51k.
  - Romansh 60k→40k (main language, 2019).
  - French 80M→74M.
  - Yiddish 1.5M→600k.
  - Belarusian 3.5M→5.1M (2019 census; summary notes that most speak Russian at home).
  - Ukrainian 33M→32M.
  - Latvian 1.75M→1.5M.
  - West Frisian 450k→470k.
  - Low German 3M→4M.
  - Upper Sorbian 13k→20k.
  - Unchanged: Welsh 538k (Census 2021) and Manx 2,200 (Census 2021).
- **False or doubtful facts rewritten:**
  - Old High German: the Hildebrandslied is not "the only Germanic heroic poem" (Beowulf exists); it is the only one in OHG.
  - Russian does have a verb for "to have" (*иметь*).
  - The English vocabulary statistic was conflated (dictionary vs. running text).
  - Manx: the "reclassified in 2015" date is unsupported; now "2009 listed extinct, later reclassified".
  - Gaulish "attested dual" is unsupported: `dual:false`, chip "Dual not securely attested".
  - Proto-Germanic: the substrate-vocabulary claim was replaced with Grimm's law.
  - Old Dutch: *Hebban olla vogala* is not "the oldest Dutch text"; the 6th-century Salic-law gloss is now the fun fact.
  - Other fun facts replaced: Italian ("closest to Latin in its vowels"), Sardinian ("vowel quantity"), Romanian, Proto-Slavic, Latvian (causal claim softened), Bulgarian (head-nodding was not a language fact), Belarusian.
  - Dalmatian: Udaina is the "last known" speaker, and the fun fact now says he had not spoken Vegliot for twenty years.
  - Macedonian contested note made neutral.
- **Codes and endonyms:**
  - Crimean Gothic `iso: 'gmy'` removed (that is Mycenaean Greek). Unverifiable Proto-Norse glottocode removed.
  - Modern-language labels used as endonyms were removed: ancien français, occitan ancian, castellano antiguo, galego-português, italiano antico, dalmatico, Gaeilge Mheánach, Hen Gymraeg, Middelnedderdüütsch, prūsiskan, древьнерусьскъ, and the reconstructed Gothic 𐌲𐌿𐍄𐌹𐍃𐌺.
  - Attested endonyms added: Old French *franceis*, Old Welsh *Kembraec*, Middle Welsh *Kymraec*.
- **Features:**
  - Cases: Proto-Italic 7 (was null), Proto-Germanic 6, OHG 5, MLG 4, Old Dutch 4 cases / 3 genders (was null), Dalmatian 0 cases / 2 genders.
  - Dutch genders 3→2, matching its "common and neuter" chip.
  - Breton and Cornish word order V2 (was SVO/VSO).
  - Dual: Proto-Brittonic set true (Welsh relics). Primitive Irish kept true, with a chip saying it is inferred, not attested.
  - Duplicate Latin notes cleaned up; two chips over 40 characters shortened.
- **Dates:** Old Frisian start 1200→800 (spoken from the 8th century; texts from the 13th). Gothic start 350→200 (±150).

## 3. left in place but uncertain
- Middle Welsh manuscript spellings with no Wiktionary entry (`brawt`, `troet`, `newyd`, `med`, `calon`). They follow 13th–14th-century MS orthography; Wiktionary etymologies normalise some differently (`newyð`, `með`, `callon`).
- MLG forms without Wiktionary entries (`moder`, `vader`, `broder`, `twe`, `dre`, `herte`, `sterne`, `nie`, `mane`, `tant`, `vot`, `sne`): standard Lasch/Schiller-Lübben headwords, written unmarked.
- Old Frisian `mōder`, `nī`: confirmed only through Wiktionary descendant lists.
- Middle Irish `dét`, `mid` and Old Occitan `maire`, `estela` (eDIL / troubadour usage; no Wiktionary section). Old Italian forms (Dante-era usage; Wiktionary has almost no Old Italian).
- Oscan `futír`: the nominative is cited in handbooks but has no Wiktionary entry. Its native-script spelling is my transliteration back into Old Italic.
- Low German `Tee`, Occitan `sucre`/`chocolat` (translation tables only), Slovene `raj`/`pižama`/`algebra`, Slovak `algebra`/`robot`, Afrikaans/Icelandic `algebra`, Galician `álxebra`: obvious loans, but no own entries.
- Proto-Celtic `*duwo` (Wiktionary) vs `*dwāu` (Matasović): notation differs between sources.
- Speaker figures for Occitan, Low German and Upper Sorbian are rough; published estimates vary by a factor of 2–7.

## 4. for the reviewer of `words/index.ts` (not my file)
- *zero* borrowing `latin → old-italian` has form `zefiro → zero`, and the blurb says "Venice shortened it". Wiktionary gives Old Italian *zero* directly from Medieval Latin *zēphirum*.
- Sound-change labels still say `*dohtēr` and `*hertō`; the forms now use `*duhtēr` and `*hertô`.
- *paradise* borrowing `latin → german` (year 1200) should arguably be `latin → old-high-german paradīs`.
