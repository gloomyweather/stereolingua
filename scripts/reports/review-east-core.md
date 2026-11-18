# review: east + core + word metadata

Scope: `src/data/languages/{east,core}.ts`, `src/data/forms/{east,east-extra,core}.ts`, `src/data/words/index.ts`.
State: `npx tsc --noEmit` clean, `npm run validate` ok (the only warning in my files is `hindustani: 0 forms`, left on purpose because I could not verify Early Hindi forms), `vitest` 17/17.

## How it was checked

- The wiktionary report (all non-ok rows plus the "ok but matched oddly" rows), then Wiktionary itself. The MediaWiki API returned 429 for this IP, so I fetched pages one at a time with `index.php?action=raw` (≤ 1.4 req/s, UA `stereolingua-review/0.1`). For Hittite, Luwian, Lycian, Linear B, Avestan and Old Persian I looked up the native-script titles, and I used the descendant lists on the PIE, Proto-Indo-Iranian, Proto-Iranian, Proto-Hellenic, Proto-Tocharian and Proto-Albanian pages.
- Sources outside Wiktionary: eDiAna (Lycian *tedi*, *ẽni*); Korn 2020, "Kinship terms in Balochi" (HAL); Encyclopaedia Iranica (Pashto *lewə*); the Urdu, Marathi and Nepali Wikipedias and the Albanian and Nepali Wiktionaries (wanderer words with no en.wiktionary entry); en.wikipedia for Tocharian, Hebrew, Hokkien and Nahuatl facts.
- The exact before/after diff was taken against the original data in `dist/index.html`, which was built before this review.

## Forms: counts (east + east-extra, 603 → 613 forms)

| | n |
|---|---|
| unchanged | 395 |
| form string corrected | 63 (28 of these are proto-forms: 27 notation changes plus PIIr water, see below) |
| note / transliteration / IPA corrected, form kept | 139 |
| deleted | 4 |
| added | 14 |

`forms/core.ts`: 3 changed, 0 deleted.

### 1. Cognacy flags (the UI keys "not cognate" on the note text)
- **29 non-cognates were shown as cognates** because their note did not say "not cognate". Examples: every Iranian "night" word (*šab, šap, şev, špa, æxsæv*, from *\*kʷsep-*); every Iranian "water" word (*āb, āp, av, obə, āpi-*; Ossetian *don* < *\*dānu-*); Medieval and Modern Greek *νερό(ν)* (from *νεαρὸν ὕδωρ* "fresh water"); Sinhala *vatura* (< Skt *vistara*, which Wiktionary says is "not related to water"); Armenian *gišer* (< *\*wekʷspero-*); Armenian *gayl* "wolf" (< *\*waylos* "howler"); Albanian *yll*; Bengali *notun* (< Skt *nūtana*); the native-word "wanderers" (Bengali *komola*, *cini*; Greek and Albanian *portokál(l)i*; Armenian *surč* and *lolik*; Hindi, Bengali and Armenian "algebra").
- **9 real cognates were shown as "not cognate"** because a note said "moon is X (not cognate)" about a different word. This hit the *māsa / mās / μήν / μήνας / ամիս* "month" forms and Greek *νίφα*. They are now worded "an unrelated word".

### 2. Wrong word or wrong meaning replaced
- Albanian daughter: *vajzë* means "girl" → **bijë** "daughter" (not cognate).
- Kurdish mother: *dê* ("mom") → **mak**, the true cognate ("mother", of animals). The note gives *dayik*.
- Albanian mother: added **motër** "sister", which is built on *\*méh₂tēr*. It goes first, and *nënë* is kept second as the everyday word.
- Ossetian brother: the misspelled *фсымӕр* became **ӕфсымӕр**, not cognate. The cognate **ӕрвад** "kinsman" (< *\*brātar-*) is added first.
- Ossetian new: *нӕуӕг* is Digor → Iron **ног**.
- Armenian "mead": *մեղու* means "bee" and is derived from *մեղր* "honey" < *\*mélit*, so it is not a reflex of *\*médʰu*. Replaced with **մեղր** "honey", flagged not cognate.
- Hittite heart: *kardiš* is not the nominative → **ker** (oblique *kard(i)-*).
- Mycenaean two: bare *du-wo* is not attested → **du-wo-u-pi** (PY Ep 704).
- Medieval Greek star: *ἀστέριον* → vernacular **ἀστέριν** (the source of *αστέρι*).
- Proto-Indo-Iranian water: *\*Hā́p-* was not a cognate → **\*udán-** (Vedic *udán-*). Proto-Iranian keeps *\*Hā́p-*, flagged not cognate.
- Balochi: *mās / piss / brās* are Western variants from the oblique stem (Korn 2020). They are now **māt / pit / brāt** (Southern), with the Western forms in the note. Wolf *gurg* is the Persian shape → **gurk**.
- Old Persian night *xšapā* → **xšapa**. Avestan *nauua-* → **nava-**, consistent with the other Avestan forms.
- Punjabi father *ਪਿਉ* (dialectal) → **ਪਿਓ** pio. Nepali tomato → **गोलभेडा** golbheḍā. Bengali chocolate → **চকলেট** (the lemma). Pashto *لیوه* → **لېوه** lewə.
- Tocharian A brother *prācar* → **pracar**. Luwian *annis/tatis/pāta-* → **ānnis / tātis / patās**. Hittite forms now in standard transcription: **annaš, attaš, negnaš, lāman, wātar, nēwaš, ḫašterz, armaš**.
- Ossetian *мæй, дæндаг* used Latin æ, which is why Wiktionary showed them as missing → Cyrillic **ӕ**.

### 3. Proto-forms (28 changed)
- Indo-Iranian proto-forms now follow the laryngealist notation used by Lubotsky and Wiktionary: *\*maHtā́, \*pHtā́, \*bʰráHtā, \*dwáH, \*Hnā́ma, \*Hstā́, \*ȷ́ʰā́rd*, and Proto-Iranian *\*bráHtā, \*náwah, \*wŕ̥kah*. The old *\*pitā́* also clashed with the sound-change label (see words below).
  - Accent: I kept *\*maHtā́*, following Vedic *mātā́*; Wiktionary writes *\*máHtā*.
- Proto-Hellenic forms now have accents (*\*mā́tēr, \*patḗr*), plus *\*kr̥díā* (Ionic *κραδίη* shows the PH form still had *\*r̥*), *\*údōr*, *\*lúkos*, *\*ónoma*.

### 4. Notes with wrong facts (examples from the 83 rewritten notes)
- Albanian *natë* was noted "from Latin nox" → inherited (Proto-Albanian *\*naktā*).
- Hittite *nekuz* is itself a genitive meaning "of evening"; the word for "night" is *išpant-*.
- Armenian *erku* was noted "irregular" → *\*dw- > erk-* is regular.
- Persian *barf* was noted "from Avestan" → from Old Iranian *\*wafra-*.
- Persian *pardis* was noted "from Avestan" → borrowed from another Iranian reflex. It was removed as a separate form (see 6).
- Armenian *surč* was noted "from Turkish" → origin unknown.
- Punjabi *baghiāṛ* is from Skt *vyāghra* "tiger". Ossetian *biræǧ* is a Turkic loan.
- Bengali "heart: everyday word buk" was misleading (*buk* means "chest"); removed.
- 20 transliterations were made consistent: Armenian ջ = ǰ; Ancient Greek υ = y (*thygátēr*, *méthy*); Urdu c/ś like Hindi; Sinhala ව = v; Greek *ntomáta*. Two IPA fixes: *mɑjɾ*, *ʃekæɾ*.

### 5. Added (14)
- Sogdian: *māt, ᵊθrē, nəwē, āp, δuɣd, dandā, pāδ*, all from Wiktionary Proto-Iranian descendant lists.
- Tocharian A *ñu*.
- Proto-Hellenic *\*métʰu* and *\*odónts*.
- Mycenaean *me-tu-wo* "of wine" (PY Fr 1202).
- Albanian *muaj* "month".
- Albanian *motër* and Ossetian *ӕрвад* (see 2).

### 6. Deleted (4)
- Hittite *pata-* "foot": only the logogram GÌR is attested; the reading is inferred (Wiktionary writes */\*patas/*).
- Tocharian A *mit*: only Tocharian B *mit/mīt* is attested.
- Mycenaean *o-no-ma*: not attested in Linear B.
- Persian *پردیس pardis* under paradise. It is not a direct reflex of the Avestan word, and because Persian is the target of the Arabic→Persian borrowing, the UI would have labelled it "borrowed from Arabic". It is now mentioned in the note of *ferdows*.

### core.ts forms
- Nahuatl *xocolātl* (attested:false, no `*`) → **chocolātl** (attested:true; first written c. 1580, origin debated).
- *tomatl* is noted as the tomatillo; the red tomato was *xītomatl*.
- PIE *\*h₃dónts*: the note now says the "eating" (*\*h₁ed-*) etymology needs *\*h₁*.

## Languages (east.ts, core.ts)
- **Genders set to null:** Palaic, Sogdian, Phrygian, Thracian.
- **Genders kept**, where the grammar is actually known:
  - Lycian and Lydian 2 (animate/inanimate is attested).
  - Middle Indo-Aryan 3 (Pali and Prakrit grammars).
  - Mycenaean 3.
  - Proto-Anatolian 2, Proto-Tocharian 3 (masc./fem./alternating), and PIIr, PIr and PH 3, all of which are standard reconstructions.
- **Cases:**
  - Hindi, Urdu, Hindustani and Punjabi 2 → 3 (direct/oblique/vocative).
  - Tocharian A 8 → 9 and B 8 → 10 (3 or 4 primary cases plus 6 secondary).
- **Tonal and word order:**
  - Vedic `tonal` false → true (it has a pitch accent).
  - Romani word order free → SVO.
  - Classical Armenian SOV → free.
- **Dates:** Proto-Tocharian ended 300 CE → c. 0, since A and B must have split centuries before the texts (Kim, late 1st millennium BCE). Tocharian A and B now start at 0 ± 300, and B ends at 1000.
- **Codes and names:**
  - Luwian iso `luw` is Luo of Cameroon → `xlu`.
  - Removed the MIA iso `pra`, which is not an ISO 639-3 code.
  - Old Persian native name 𐎠𐎼𐎹 reads *ariya*, Darius's own name for the language, not *pārsa*.
  - Tocharian native names → *ārśi* / *kuśiññe*; the invented "Āryaka" is removed.
- **Summaries and fun facts fixed:**
  - PIE: "nearly half of humanity's languages" → languages spoken by nearly half of humanity. The Saussure fun fact now credits Kuryłowicz (1927).
  - Hittite: *ezzan* means "chaff", not "eats" → *ezzatteni* "you eat".
  - Tocharian B: the "Italian and Spanish" comparison was self-contradictory → "not mutually intelligible".
  - Proto-Iranian: "*s > h in the west" → *s > h everywhere; only the voiceless aspirates became fricatives.
  - Persian: "u means it" is wrong (u is for people) → "he" and "she".
  - Nepali: the "closer to Indo-Aryan than to Tibeto-Burman" non-statement is rewritten.
  - Ancient Greek: Homer is not Attic.
  - Thracian: Kjolmen is a stele, not a ring.
  - Phrygian: Herodotus on the Briges.
  - Modern Greek: the fun fact merely repeated the summary.
  - Vedic and Punjabi fun facts made precise.
  - Ossetian fun fact made safer.
- **Speakers:** Hebrew 9 M → 5 M native (9 M is the total including L2). Hokkien/Southern Min 28 M → 45 M (Ethnologue Southern Min ≈ 47 M; 28 M was roughly mainland China only).

## Word metadata (words/index.ts)
- **Sound-change labels corrected:**
  - father: the PIE→PIIr "*h₂ → i" rule moved to PIA→Vedic (*\*pHtā́ → pitā́*), plus OE→English d → ð.
  - three: "OHG→MHG þ → d" → PGmc→OHG.
  - name: "*h₁ → o-" is not a sound law.
  - wolf: PGmc *f* is irregular.
  - daughter: Greek *dʰ → tʰ* is devoicing, not "Grassmann"; PGmc *\*duhtēr* (was *\*dohtēr*).
  - moon: "*ē → *ē" was vacuous.
  - tooth: the nasal loss is PGmc→OE; the Great Vowel Shift is ME→English.
  - snow: *gʷʰ → gʷ → w*.
- **Blurbs corrected:**
  - father: "t → th by Grimm" was wrong (Verner's law gave *d*; *th* is c. 1500).
  - brother: Greek coined *adelphós*, it did not borrow it.
  - heart: Sanskrit *hṛd-* is the satem exception, not an example.
  - orange: the lost *n* is Italian *un'arancia*.
  - tomato: Serbian says *paradajz*; the Italian loan is in Russian, Ukrainian and Polish.
  - chocolate: *chocolātl* is attested c. 1580 and *xocolatl* never is.
  - tooth: "probably" → "perhaps".
  - foot: "every branch" → "branch after branch".
- **Borrowing chains corrected:**
  - sugar: Greek *ζάχαρη* is not from Arabic → Pali/Prakrit → Koine *σάκχαρ(ον)* c. 50 CE.
  - orange: Sanskrit → Middle Persian, not New Persian.
  - coffee: Persian *qahve* is from Arabic, not Turkish.
  - zero: English *zero* comes from `italian`; `old-italian` ends in 1500.
  - paradise:
    - The root is Proto-Iranian *\*pari-daiza-*.
    - The source of Greek *parádeisos* is Median/Old Persian, not Avestan.
    - The false Avestan→Armenian edge is removed (Armenian took it from Parthian, which is not in the data; the forms carry the note).
    - Latin→German 1200 → Latin→Old High German c. 850.
    - Greek→Arabic is via Aramaic/Syriac.

## Left in place but uncertain
- Hittite *armaš* "moon" (old Wiktionary Swadesh list and Kloekhorst; no lemma page). Luwian *alaman-* appears only in Wiktionary's PIE descendant list, as the Hieroglyphic Luwian reading.
- Sinhala *hadavata* "cf. Skt hṛdaya" (Wiktionary gives no etymology). Sinhala *sahōdarayā* and Nepali *bwā̃so* (cognacy judged from the form) are standard words but unverified on en.wiktionary.
- Pashto *lewə* "not cognate" rests on its *\*ai* vocalism (Iranica), not on an explicit etymology. Albanian *yll* ("perhaps *\*h₂us-lo-*") and *motër* (built on "mother", exact formation debated) are also open.
- Ossetian *ærvad* is glossed "kinsman, relative, second brother" on Wiktionary.
- Proto-Hellenic *\*ónoma* vs *\*ónuma* (Cowgill's law) and *\*núkts*: notation is debated. PIIr *\*maHtā́* has its accent placed per Vedic.
- Old Persian *\*paridaida-* is reconstructed from Elamite *partetaš*.
- Middle Persian forms (MacKenzie-style transcriptions) and Avestan *dantan-*, *snaēž-* were not re-verified one by one, because Wiktionary files them under native script.
- The Hindi *hṛday* vs *dil* choice is kept: both are cognates, but neither is inherited (one is a learned Sanskrit loan, the other a Persian loan), and the note says so.
- Classical Sanskrit and Pali end dates (1200) and Armenian speakers (6.7 M) are rough. Nahuatl iso `nci` is Classical Nahuatl although the entry also covers the living language.
- The Hokkien figure depends on whether Teochew is counted.
- I did not add a Mycenaean "water" (*u-do*): Wiktionary calls the identification uncertain.

## Verdicts on the drafters' flagged items
| item | verdict |
|---|---|
| Lycian *ẽni*, *tedi* | kept: attested (eDiAna: TL 56, TL 21) |
| Luwian *alaman* | kept as *alaman-* (HLuwian) |
| Balochi *mās, piss, brās* | real Western forms, but the primaries are now Southern *māt, pit, brāt*; *šap* kept |
| Nepali *bubā*, *bwā̃so* | kept; "tomato" spelling fixed |
| Nepali *muṭu* | not present in the data |
| Romani *ruv* | kept: cognate (< Skt *vṛka*, metathesis) |
| Gujarati *varu* | kept: cognate (< Skt *vṛka*) |
| Punjabi *baghiāṛ* | kept: not cognate (< *vyāghra*) |
| Albanian *zemër* | kept, not cognate |
| Albanian *yll* | now flagged not cognate |
| Albanian *vajzë* | replaced by *bijë* |
| Albanian *borë*, *parajsë* | kept |
| Bengali *notun* | flagged not cognate |
| Armenian *meġu* | removed (bee; not a reflex) |
| Sinhala *duva*, Punjabi *ਧੀ* | kept: cognate |
| Ossetian *мыд* | kept |
| Ossetian *мӕй*, *дӕндаг* | kept, spelling fixed |
| Hittite *armas* | kept as *armaš* |
| Old Persian *\*paridaida-* | kept, with a sourced note |
| Persian *pardis* / *ferdows* | *ferdows* kept, *pardis* moved to its note |
| Persian *پاجامه* | kept ("trousers") |
| Tomato: Marathi, Nepali, Armenian, Albanian | verified (Nepali respelled) |
| Greek *νίφα* | kept: genuine cognate, flag fixed |
| Hindi *hṛday* | kept |
| Sanskrit *udaka*, *naktam* | kept, notes corrected |
