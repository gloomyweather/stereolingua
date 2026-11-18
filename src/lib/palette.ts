import type { Branch } from '../data/types';

/**
 * branch tints, mixed like hand-colouring on an engraved plate.
 * each hue has a reason: anatolian = fired clay of the hittite tablets, italic = tyrian purple,
 * armenian = apricot, celtic = verdigris, germanic = north-sea slate, indo-iranian = saffron,
 * hellenic = aegean blue, balto-slavic = birch-leaf gold, albanian = eagle red.
 * always paired with a label: colour is never the only cue.
 */
export const BRANCH_TINT: Record<Branch, string> = {
  root: '#f1e7cf',
  anatolian: '#d0916a',
  tocharian: '#b9a1db',
  'indo-iranian': '#e2ad5e',
  greek: '#74aee0',
  armenian: '#f2b585',
  albanian: '#de7564',
  italic: '#cf8fbd',
  celtic: '#72c4a0',
  germanic: '#93a8de',
  'balto-slavic': '#c8cc72',
  'paleo-balkan': '#bba98c',
  contact: '#8d95a8',
};

/** kept for older imports */
export const BRANCH_COLOR = BRANCH_TINT;

export const BRANCH_LABEL: Record<Branch, string> = {
  root: 'Proto-Indo-European',
  anatolian: 'Anatolian',
  tocharian: 'Tocharian',
  'indo-iranian': 'Indo-Iranian',
  greek: 'Hellenic',
  armenian: 'Armenian',
  albanian: 'Albanian',
  italic: 'Italic',
  celtic: 'Celtic',
  germanic: 'Germanic',
  'balto-slavic': 'Balto-Slavic',
  'paleo-balkan': 'Paleo-Balkan',
  contact: 'Neighbours',
};

/** three-letter abbreviations, in the manner of constellation catalogues */
export const BRANCH_ABBR: Record<Branch, string> = {
  root: 'Rad',
  anatolian: 'Ana',
  tocharian: 'Toc',
  'indo-iranian': 'Iir',
  greek: 'Hel',
  armenian: 'Arm',
  albanian: 'Alb',
  italic: 'Ita',
  celtic: 'Cel',
  germanic: 'Ger',
  'balto-slavic': 'Bsl',
  'paleo-balkan': 'Pbk',
  contact: 'Vic',
};

/** the plate's own inks, for three.js */
export const INK = {
  night: '#070b17',
  ivory: '#ece3cc',
  gilt: '#d8b56d',
  rubric: '#e0604a',
};
