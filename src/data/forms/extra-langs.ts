import type { WordForm } from '../types';
import type { FormsByWord } from './index';

// forms for the second-wave languages (languages/extra.ts), for the original 29 words
const a = (lang: string, form: string, note?: string): WordForm => ({ lang, form, attested: true, ...(note ? { note } : {}) });
const t = (lang: string, form: string, translit: string, note?: string): WordForm => ({
  lang,
  form,
  translit,
  attested: true,
  ...(note ? { note } : {}),
});

const NC = 'not cognate';
const AQ = 'not cognate: from Latin aqua';
const FILIA = 'not cognate: from Latin fīlia';
const MONTH = 'means "month"';
const GERM = 'not cognate: from Latin germānus "full (brother)"';
const OTEC = 'not cognate: from Proto-Slavic *otьcь';
const HONEY = 'honey';
const ARAB = 'from Arabic';

const forms: FormsByWord = {
  mother: [
    t('odia', 'ମା', 'mā'),
    t('assamese', 'মা', 'ma'),
    a('friulian', 'mari'),
    a('asturian', 'madre'),
    a('sicilian', 'matri'),
    a('aromanian', 'mumã', 'not cognate: a nursery word'),
    a('lower-sorbian', 'maś'),
    t('rusyn', 'мати', 'maty'),
    t('tajik', 'модар', 'modar'),
  ],
  father: [
    a('friulian', 'pari'),
    a('asturian', 'padre'),
    a('sicilian', 'patri'),
    a('aromanian', 'tatã', 'not cognate: from Latin tata, a nursery word'),
    a('lower-sorbian', 'nan', NC),
    t('tajik', 'падар', 'padar'),
  ],
  brother: [
    t('odia', 'ଭାଇ', 'bhāi'),
    t('assamese', 'ভাই', 'bhai'),
    a('friulian', 'fradi'),
    a('asturian', 'hermanu', GERM),
    a('sicilian', 'frati'),
    a('aromanian', 'frate'),
    a('kashubian', 'brat'),
    a('lower-sorbian', 'bratš'),
    t('rusyn', 'брат', 'brat'),
    t('tajik', 'бародар', 'barodar'),
    a('elfdalian', 'bruoðer'),
  ],
  night: [
    a('friulian', 'gnot'),
    a('walloon', 'nute'),
    a('asturian', 'nueche'),
    a('sicilian', 'notti'),
    a('aromanian', 'noapti'),
    a('kashubian', 'noc'),
    a('lower-sorbian', 'noc'),
    t('tajik', 'шаб', 'šab', 'not cognate; from Iranian *xšap-'),
  ],
  two: [
    a('friulian', 'doi'),
    a('asturian', 'dos'),
    a('sicilian', 'dui'),
    a('aromanian', 'doi'),
    a('kashubian', 'dwa'),
    a('lower-sorbian', 'dwa'),
    t('rusyn', 'два', 'dva'),
    t('tajik', 'ду', 'du'),
    t('sindhi', 'ٻه', 'ɓa'),
    t('assamese', 'দুই', 'dui'),
    t('odia', 'ଦୁଇ', 'dui'),
    t('dhivehi', 'ދޭއް', 'dhey'),
  ],
  three: [
    a('friulian', 'trê'),
    a('asturian', 'tres'),
    a('sicilian', 'tri'),
    a('aromanian', 'trei'),
    a('kashubian', 'trzë'),
    a('lower-sorbian', 'tśi'),
    t('rusyn', 'три', 'try'),
    t('tajik', 'се', 'se'),
    t('sindhi', 'ٽي', 'ṭe'),
    t('assamese', 'তিনি', 'tini'),
    t('odia', 'ତିନି', 'tini'),
  ],
  heart: [
    a('friulian', 'cûr'),
    a('asturian', 'corazón', 'from Vulgar Latin *corāceōnem, a derivative of cor'),
    a('sicilian', 'cori'),
    a('aromanian', 'inimã', 'not cognate: from Latin anima "soul"'),
    a('kashubian', 'serce'),
    a('lower-sorbian', 'wutšoba', 'not cognate: from Proto-Slavic *ǫtroba "entrails"'),
    t('rusyn', 'серце', 'serce'),
    t('tajik', 'дил', 'dil'),
  ],
  star: [
    a('friulian', 'stele'),
    a('asturian', 'estrella'),
    a('sicilian', 'stiḍḍa'),
    a('aromanian', 'steauã'),
    a('kashubian', 'gwiôzda'),
    a('lower-sorbian', 'gwězda'),
    t('tajik', 'ситора', 'sitora'),
  ],
  new: [
    a('friulian', 'gnûf'),
    a('asturian', 'nuevu'),
    a('sicilian', 'novu'),
    a('aromanian', 'nou'),
    a('kashubian', 'nowi'),
    a('lower-sorbian', 'nowy'),
    t('tajik', 'нав', 'nav'),
  ],
  name: [
    t('odia', 'ନାମ', 'nāma'),
    t('assamese', 'নাম', 'nam'),
    a('friulian', 'non'),
    a('asturian', 'nome'),
    a('sicilian', 'nomu'),
    a('aromanian', 'numã'),
    a('kashubian', 'miono'),
    a('lower-sorbian', 'mě'),
    t('tajik', 'ном', 'nom'),
  ],
  water: [
    a('friulian', 'aghe', AQ),
    a('walloon', 'aiwe', AQ),
    a('asturian', 'agua', AQ),
    a('sicilian', 'acqua', AQ),
    a('aromanian', 'apã', AQ),
    a('kashubian', 'wòda'),
    a('lower-sorbian', 'wóda'),
    t('rusyn', 'вода', 'voda'),
    t('tajik', 'об', 'ob', 'not cognate; from *h₂ep-'),
  ],
  wolf: [
    a('friulian', 'lôf'),
    a('asturian', 'llobu'),
    a('sicilian', 'lupu'),
    a('aromanian', 'lup'),
    a('kashubian', 'wilk'),
    a('lower-sorbian', 'wjelk'),
    t('tajik', 'гург', 'gurg'),
  ],
  daughter: [
    a('friulian', 'fie', FILIA),
    a('asturian', 'fía', FILIA),
    a('sicilian', 'figghia', FILIA),
    t('tajik', 'духтар', 'duxtar'),
  ],
  moon: [
    a('asturian', 'mes', MONTH),
    a('sicilian', 'misi', MONTH),
    t('tajik', 'моҳ', 'moh', 'moon, month'),
  ],
  tooth: [
    t('odia', 'ଦାନ୍ତ', 'dānta'),
    t('assamese', 'দাঁত', 'dãt'),
    a('friulian', 'dint'),
    a('asturian', 'diente'),
    a('sicilian', 'denti'),
    a('aromanian', 'dinte'),
    a('kashubian', 'ząb', NC),
    t('tajik', 'дандон', 'dandon'),
  ],
  foot: [
    a('friulian', 'pît'),
    a('asturian', 'pie'),
    a('sicilian', 'pedi'),
    t('tajik', 'по', 'po'),
  ],
  mead: [
    a('lower-sorbian', 'mjod', HONEY),
  ],
  snow: [
    a('friulian', 'nêf'),
    a('asturian', 'ñeve'),
    a('sicilian', 'nivi'),
    a('kashubian', 'sniég'),
    a('lower-sorbian', 'sněg'),
    t('tajik', 'барф', 'barf', 'not cognate; from Old Iranian *wafra-'),
  ],
  sugar: [
    a('friulian', 'zucar'),
    a('asturian', 'azucre'),
    a('sicilian', 'zùccaru'),
    t('tajik', 'шакар', 'šakar'),
  ],
  orange: [
    a('asturian', 'naranxa', 'from Arabic nāranj'),
    a('sicilian', 'aranciu'),
    t('tajik', 'апелсин', 'apelsin'),
  ],
  tea: [
    a('friulian', 'tè'),
    a('asturian', 'té'),
    t('tajik', 'чой', 'čoj', 'from Persian čāy, from northern Chinese cha'),
    t('sindhi', 'چانهه', 'cānhan'),
  ],
  coffee: [
    a('friulian', 'cafè'),
    a('asturian', 'café'),
    t('tajik', 'қаҳва', 'qahva', ARAB),
  ],
  chocolate: [
    a('asturian', 'chocolate'),
    t('tajik', 'шоколад', 'šokolad', 'via Russian'),
  ],
  robot: [
    a('friulian', 'robot'),
    a('asturian', 'robot'),
    t('tajik', 'робот', 'robot', 'via Russian'),
  ],
  algebra: [a('asturian', 'álxebra'), t('tajik', 'алгебра', 'algebra', 'via Russian')],
  zero: [a('friulian', 'zero'), a('asturian', 'cero'), a('sicilian', 'zeru')],
  paradise: [a('friulian', 'paradîs'), a('asturian', 'paraísu')],
  tomato: [a('asturian', 'tomate', 'from Nahuatl tomatl'), t('tajik', 'помидор', 'pomidor', 'via Russian, from Italian pomodoro')],
};

export default forms;
