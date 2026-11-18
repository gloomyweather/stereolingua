import type { WordForm } from '../types';
import type { FormsByWord } from './index';

/** attested form */
const a = (lang: string, form: string, ipa?: string, note?: string): WordForm => ({
  lang,
  form,
  attested: true,
  ...(ipa ? { ipa } : {}),
  ...(note ? { note } : {}),
});
/** attested form in a non-Latin script, with transliteration */
const t = (lang: string, form: string, translit: string, note?: string): WordForm => ({
  lang,
  form,
  translit,
  attested: true,
  ...(note ? { note } : {}),
});
/** reconstructed form */
const r = (lang: string, form: string, note?: string): WordForm => ({
  lang,
  form,
  attested: false,
  ...(note ? { note } : {}),
});

const NC = 'not cognate';
const FILIA = 'not cognate: from Latin fīlia';
const MONTH = 'means "month"';
const ZERO = 'from Medieval Latin zephirum';

const forms: FormsByWord = {
  daughter: [
    t('oscan', '𐌚𐌖𐌕𐌝𐌓', 'futír', 'the cognate; Latin replaced it with fīlia'),
    a('latin', 'fīlia', '/ˈfiː.li.a/', 'not cognate (the inherited word was lost)'),
    a('old-french', 'fille', undefined, FILIA),
    a('french', 'fille', '/fij/', FILIA),
    a('occitan', 'filha', undefined, FILIA),
    a('catalan', 'filla', undefined, FILIA),
    a('spanish', 'hija', '/ˈi.xa/', FILIA),
    a('galician', 'filla', undefined, FILIA),
    a('portuguese', 'filha', undefined, FILIA),
    a('old-italian', 'figlia', undefined, FILIA),
    a('italian', 'figlia', '/ˈfiʎ.ʎa/', FILIA),
    a('romanian', 'fiică', undefined, FILIA),
    a('gaulish', 'duxtir', undefined, 'the cognate, on the Larzac lead tablet'),
    a('old-irish', 'ingen', undefined, NC),
    a('middle-irish', 'ingen', undefined, NC),
    a('irish', 'iníon', undefined, NC),
    a('scottish-gaelic', 'nighean', undefined, NC),
    a('manx', 'inneen', undefined, NC),
    a('middle-welsh', 'merch', undefined, NC),
    a('welsh', 'merch', undefined, 'not cognate; also "girl"'),
    a('cornish', 'myrgh', undefined, NC),
    a('breton', "merc'h", undefined, NC),
  ],

  moon: [
    a('latin', 'mēnsis', undefined, 'means "month"; the moon is lūna (not cognate)'),
    a('french', 'mois', '/mwa/', MONTH),
    a('occitan', 'mes', undefined, MONTH),
    a('catalan', 'mes', undefined, MONTH),
    a('spanish', 'mes', undefined, MONTH),
    a('galician', 'mes', undefined, MONTH),
    a('portuguese', 'mês', undefined, MONTH),
    a('italian', 'mese', undefined, MONTH),
    a('romanian', 'lună', undefined, 'not cognate: from Latin lūna; also means "month"'),
    a('dalmatian', 'mais', undefined, MONTH),
    r('proto-celtic', '*mīns', MONTH),
    a('old-irish', 'mí', undefined, MONTH),
    a('irish', 'mí', undefined, MONTH),
    a('scottish-gaelic', 'mìos', undefined, 'means "month", rarely "moon"'),
    a('manx', 'mee', undefined, MONTH),
    a('middle-welsh', 'mis', undefined, MONTH),
    a('welsh', 'mis', undefined, MONTH),
    a('cornish', 'mis', undefined, MONTH),
    a('breton', 'miz', undefined, MONTH),
  ],

  tooth: [
    a('latin', 'dēns', undefined, 'genitive dentis'),
    a('old-french', 'dent'),
    a('french', 'dent', '/dɑ̃/'),
    a('occitan', 'dent'),
    a('catalan', 'dent'),
    a('spanish', 'diente', '/ˈdjen.te/'),
    a('galician', 'dente'),
    a('portuguese', 'dente'),
    a('italian', 'dente', '/ˈdɛn.te/'),
    a('romanian', 'dinte', '/ˈdin.te/'),
    a('dalmatian', 'diant', undefined, 'Vegliot'),
    r('proto-celtic', '*dants', 'stem *dant-'),
    a('old-irish', 'dét', undefined, 'also "set of teeth"'),
    a('middle-irish', 'dét'),
    a('irish', 'déad', undefined, 'also "set of teeth"; the everyday word is fiacail'),
    a('scottish-gaelic', 'deud', undefined, 'the everyday word is fiacail'),
    a('middle-welsh', 'dant'),
    a('welsh', 'dant'),
    a('cornish', 'dans'),
    a('breton', 'dant'),
  ],

  foot: [
    a('latin', 'pēs', undefined, 'genitive pedis'),
    a('old-french', 'pié'),
    a('french', 'pied', '/pje/'),
    a('occitan', 'pè'),
    a('catalan', 'peu'),
    a('spanish', 'pie', '/pje/'),
    a('galician', 'pé'),
    a('portuguese', 'pé', '/pɛ/'),
    a('italian', 'piede', '/ˈpjɛː.de/'),
    a(
      'romanian',
      'picior',
      undefined,
      'related: from Late Latin petiolus, a double diminutive of pēs; the plain reflex of pēs was lost',
    ),
    a('dalmatian', 'pi'),
    a('old-irish', 'cos', undefined, 'not cognate; also "leg"'),
    a('irish', 'cos', undefined, NC),
    a('scottish-gaelic', 'cas', undefined, NC),
    a('manx', 'cass', undefined, NC),
    a('middle-welsh', 'troet', undefined, NC),
    a('welsh', 'troed', undefined, NC),
    a('cornish', 'troos', undefined, NC),
    a('breton', 'troad', undefined, NC),
  ],

  mead: [
    r('proto-celtic', '*medu'),
    a('old-irish', 'mid'),
    a('middle-irish', 'mid'),
    a('middle-welsh', 'med'),
    a('welsh', 'medd'),
    a('cornish', 'medh'),
  ],

  snow: [
    a('latin', 'nix', undefined, 'genitive nivis'),
    a('french', 'neige', '/nɛʒ/', 'back-formed from neiger "to snow"'),
    a('occitan', 'nèu'),
    a('catalan', 'neu'),
    a('spanish', 'nieve', '/ˈnje.βe/'),
    a('galician', 'neve'),
    a('portuguese', 'neve'),
    a('italian', 'neve', '/ˈneː.ve/'),
    a('romanian', 'nea', undefined, 'archaic or regional; the verb ninge "it snows" has the same root'),
    a('romanian', 'zăpadă', undefined, 'not cognate (Slavic loan); the usual word'),
    a('dalmatian', 'nai'),
    a('old-irish', 'snechtae'),
    a('middle-irish', 'snechta'),
    a('irish', 'sneachta'),
    a('scottish-gaelic', 'sneachda'),
    a('manx', 'sniaghtey'),
    a('welsh', 'eira', undefined, 'not cognate; the usual word'),
    a('cornish', 'ergh', undefined, NC),
    a('breton', "erc'h", undefined, NC),
  ],

  zero: [
    a('latin', 'zephirum', undefined, 'Medieval Latin, used by Fibonacci (Liber Abaci, 1202), from Arabic ṣifr'),
    a('old-italian', 'zero', undefined, ZERO),
    a('italian', 'zero', '/ˈdzɛː.ro/'),
    a('french', 'zéro', '/ze.ʁo/', 'from Italian'),
    a('catalan', 'zero'),
    a('spanish', 'cero', '/ˈθe.ɾo/'),
    a('portuguese', 'zero'),
    a('romanian', 'zero'),
  ],

  paradise: [
    a('latin', 'paradīsus', undefined, 'from Greek parádeisos'),
    a('old-french', 'paradis'),
    a('french', 'paradis', '/pa.ʁa.di/'),
    a('catalan', 'paradís'),
    a('spanish', 'paraíso', '/pa.ɾaˈi.so/'),
    a('galician', 'paraíso'),
    a('portuguese', 'paraíso'),
    a('italian', 'paradiso', '/pa.raˈdiː.zo/'),
    a('romanian', 'paradis'),
    a('romanian', 'rai', undefined, 'not cognate (Slavic loan); the usual religious word'),
    a('dalmatian', 'paradais'),
    a('middle-irish', 'pardus', undefined, 'from Latin paradīsus'),
    a('irish', 'parthas'),
    a('welsh', 'paradwys'),
  ],

  pyjamas: [
    a('french', 'pyjama', '/pi.ʒa.ma/'),
    a('catalan', 'pijama'),
    a('spanish', 'pijama', '/piˈxa.ma/'),
    a('portuguese', 'pijama'),
    a('italian', 'pigiama', '/piˈdʒaː.ma/'),
    a('romanian', 'pijama'),
  ],

  tomato: [
    a('spanish', 'tomate', '/toˈma.te/', 'from Nahuatl tomatl'),
    a('french', 'tomate', '/tɔ.mat/'),
    a('catalan', 'tomàquet', undefined, 'by metathesis of earlier tomàtec, from Spanish tomate'),
    a('galician', 'tomate'),
    a('portuguese', 'tomate'),
    a('italian', 'pomodoro', '/pɔ.moˈdɔː.ro/', 'not from Nahuatl: pomo d’oro, "golden apple"'),
    a('romanian', 'roșie', undefined, 'not from Nahuatl: "the red one"'),
    a('irish', 'tráta', undefined, 'from Spanish tomate'),
    a('welsh', 'tomato'),
  ],
};

export default forms;
