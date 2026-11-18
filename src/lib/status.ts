import type { Language } from '../data/types';

/** attested but no longer spoken: the languages that carry † in labels, cards, the index and the outline */
export const isExtinct = (l: Language): boolean => l.end !== null && (l.status === 'extinct' || l.status === 'ancient');
