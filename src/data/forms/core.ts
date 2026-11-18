import type { FormsByWord } from './index';

const R = (form: string, note?: string) => ({ lang: 'pie', form, attested: false, ...(note ? { note } : {}) });

const forms: FormsByWord = {
  mother: [R('*méh₂tēr')],
  father: [R('*ph₂tḗr')],
  brother: [R('*bʰréh₂tēr')],
  night: [R('*nókʷts')],
  two: [R('*dwóh₁')],
  three: [R('*tréyes')],
  heart: [R('*ḱḗr', 'oblique stem *ḱr̥d-')],
  star: [R('*h₂stḗr')],
  new: [R('*néwos')],
  name: [R('*h₁nómn̥')],
  water: [R('*wódr̥', 'heteroclitic r/n-stem; oblique *udén-')],
  wolf: [R('*wĺ̥kʷos')],
  daughter: [R('*dʰugh₂tḗr')],
  moon: [R('*mḗh₁n̥s', 'also “month”')],
  tooth: [R('*h₃dónts', 'older reconstruction *h₁dónts “eating” (from *h₁ed- “eat”); Greek odónt- points to *h₃')],
  foot: [R('*pṓds')],
  mead: [R('*médʰu', '“honey; mead”')],
  snow: [R('*snóygʷʰos')],
  sugar: [{ lang: 'arabic', form: 'سكر', translit: 'sukkar', attested: true }],
  orange: [{ lang: 'arabic', form: 'نارنج', translit: 'nāranj', attested: true, note: 'bitter orange' }],
  tea: [
    { lang: 'chinese', form: '茶', translit: 'chá', attested: true, note: 'Mandarin/Cantonese “cha” form' },
    { lang: 'hokkien', form: '茶', translit: 'tê', attested: true },
    { lang: 'arabic', form: 'شاي', translit: 'shāy', attested: true },
    { lang: 'turkish', form: 'çay', attested: true },
  ],
  coffee: [
    { lang: 'arabic', form: 'قهوة', translit: 'qahwa', attested: true, note: 'originally also a word for wine' },
    { lang: 'turkish', form: 'kahve', attested: true },
  ],
  chocolate: [{ lang: 'nahuatl', form: 'chocolātl', attested: true, note: 'first written down c. 1580; origin debated (perhaps *chicolātl “beaten drink”); “xocolatl” is not attested' }],
  algebra: [{ lang: 'arabic', form: 'الجبر', translit: 'al-jabr', attested: true, note: '“restoration, setting of broken parts”' }],
  robot: [{ lang: 'turkish', form: 'robot', attested: true }],
  zero: [
    { lang: 'arabic', form: 'صفر', translit: 'ṣifr', attested: true, note: '“empty”' },
    { lang: 'turkish', form: 'sıfır', attested: true },
    { lang: 'hebrew', form: 'אפס', translit: 'efes', attested: true, note: 'not cognate' },
  ],
  paradise: [
    { lang: 'arabic', form: 'فردوس', translit: 'firdaws', attested: true },
    { lang: 'hebrew', form: 'פרדס', translit: 'pardes', attested: true, note: '“orchard”; Iranian loan' },
    { lang: 'turkish', form: 'cennet', attested: true, note: 'not cognate' },
  ],
  pyjamas: [{ lang: 'turkish', form: 'pijama', attested: true }],
  tomato: [
    { lang: 'nahuatl', form: 'tomatl', attested: true, note: 'the tomatillo; the red tomato was xītomatl' },
    { lang: 'turkish', form: 'domates', attested: true },
    { lang: 'arabic', form: 'طماطم', translit: 'ṭamāṭim', attested: true },
  ],
};

export default forms;
