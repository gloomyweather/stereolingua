import { useEffect } from 'react';
import { useStore } from '../store';
import '../styles/overlays.css';

export function AboutOverlay() {
  const overlay = useStore((s) => s.overlay);
  if (overlay !== 'about') return null;
  return <AboutPanel />;
}

const Key = ({ children }: { children: React.ReactNode }) => <kbd>{children}</kbd>;

function AboutPanel() {
  const setOverlay = useStore((s) => s.setOverlay);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      e.preventDefault();
      e.stopImmediatePropagation();
      setOverlay(null);
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [setOverlay]);

  return (
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && setOverlay(null)}>
      <article className="overlay-inner ov ab" role="dialog" aria-modal="true" aria-labelledby="about-title">
        <button className="ov-close" onClick={() => setOverlay(null)} aria-label="Close" autoFocus>×</button>
        <header className="ov-head">
          <h2 id="about-title" className="card-title">About this atlas</h2>
          <p className="ov-sub sc">a sky of the Indo-European tongues</p>
        </header>

        <section>
          <h3 className="sec-title">What this is</h3>
          <p className="prose">
            <i>Stereolingua</i> joins Greek <i className="form">stereós</i> ‘solid’ and Latin <i className="form">lingua</i> ‘tongue’ —
            a pairing of two Indo-European branches in one word. It is a solid map of tongues: a sky you can fly through, in which height is time.
          </p>
          <p className="prose">
            Hundreds of languages, living and dead, descend from a single speech community that left no writing at all. Here they are
            laid out as an atlas of stars, so that a reader can follow any one of them down to its roots and out again to its cousins.
          </p>
        </section>

        <section>
          <h3 className="sec-title">How to read the sky</h3>
          <p className="prose">
            <b>Height is time.</b> The root stands at the bottom, at about 4500 BCE; the crowns of the living languages stand at the top, at today.
            Antiquity is compressed and the last few centuries are stretched, since that is where most of the evidence lies.
          </p>
          <p className="prose">
            <b>Each branch is a constellation,</b> drawn in its own tint. Solid lines are lines of descent, from a language to the ones it became.
            A dotted line marks a language’s own lifetime, from its first appearance to its last speaker, or to the present.{' '}
            <b>Meteors</b> are real loanwords, travelling from the language that lent them to the one that borrowed them.
          </p>
          <p className="prose">The shape of a star encodes its grammar:</p>
          <dl className="ab-signs">
            <dt>rays</dt><dd>noun cases, one ray for each</dd>
            <dt>a ring</dt><dd>tone or pitch accent</dd>
            <dt>orbiting dots</dt><dd>grammatical genders, one for each</dd>
            <dt>a twin core</dt><dd>a dual number, for exactly two</dd>
          </dl>
          <p className="prose">Three marks say what kind of language a star is:</p>
          <dl className="ab-signs">
            <dt><span className="ab-glyph" aria-hidden>✳</span> asterisk</dt><dd>reconstructed, never written down; a hypothesis</dd>
            <dt><span className="ab-glyph" aria-hidden>○</span> hollow</dt><dd>attested, but extinct (marked † in the text)</dd>
            <dt><span className="ab-glyph" aria-hidden>●</span> solid</dt><dd>spoken today</dd>
          </dl>
          <p className="prose">
            Philological habits are kept throughout: cited forms are in <i className="form">italics</i>, glosses in <span className="gloss">single quotes</span>,
            reconstructions begin with <span className="form">*</span>, and extinct languages carry a †.
          </p>
        </section>

        <section>
          <h3 className="sec-title">Method, and honest simplifications</h3>
          <p className="prose">
            The family tree is a model, and a convenient one. Real languages shade into one another as dialect continua, and neighbours
            lend each other sounds and words long after they have parted; the older <i>wave model</i> pictures this better than any tree.
            Dates are approximate, and many carry a margin of centuries.
          </p>
          <p className="prose">
            Where a placement is debated the card says so, under the red word <span className="rubric-word sc">contested</span>. The very homeland is
            one such case: the <i>steppe hypothesis</i> puts it on the grasslands north of the Black and Caspian Seas, the <i>Anatolian hypothesis</i> in
            Anatolia some three thousand years earlier. The steppe view is the mainstream one today, strengthened by ancient DNA, and this atlas
            follows it; the question is not closed. Whether Italic and Celtic share a closer ancestor, and how
            Baltic and Slavic relate, are likewise open.
          </p>
          <p className="prose">
            Reconstructions are hypotheses: each is marked with * because no one has ever read a line of it. The usage curves in the word
            journeys come from printed books, which over-represent formal and literary language, and say little about speech.
          </p>
        </section>

        <section>
          <h3 className="sec-title">Sources</h3>
          <ul className="ab-sources">
            <li>
              Wiktionary contributors, <a href="https://en.wiktionary.org" target="_blank" rel="noopener noreferrer">en.wiktionary.org</a>, used under{' '}
              <span className="sc">CC BY-SA 4.0</span>
            </li>
            <li>
              Google Books Ngram Viewer, <a href="https://books.google.com/ngrams" target="_blank" rel="noopener noreferrer">books.google.com/ngrams</a>
            </li>
            <li>Glottolog</li>
            <li>Ethnologue</li>
            <li>Mallory &amp; Adams, <i>The Oxford Introduction to Proto-Indo-European and the Proto-Indo-European World</i> (2006)</li>
            <li>Fortson, <i>Indo-European Language and Culture: An Introduction</i>, 2nd ed. (2010)</li>
            <li>Ringe, <i>From Proto-Indo-European to Proto-Germanic</i> (2006)</li>
            <li>Beekes, <i>Etymological Dictionary of Greek</i> (2010)</li>
            <li>Kloekhorst, <i>Etymological Dictionary of the Hittite Inherited Lexicon</i> (2008)</li>
          </ul>
        </section>

        <div className="asterism" aria-hidden>✳</div>
        <figure className="ab-quote">
          <blockquote>
            <p>
              “…no philologer could examine them all three, without believing them to have sprung from some common source, which, perhaps, no longer exists.”
            </p>
          </blockquote>
          <figcaption>Sir William Jones, Calcutta, 1786</figcaption>
        </figure>

        <section>
          <h3 className="sec-title">Keyboard</h3>
          <dl className="ab-keys">
            <dt><Key>⌘K</Key> <Key>/</Key></dt><dd>open the index</dd>
            <dt><Key>↑</Key></dt><dd>to a child</dd>
            <dt><Key>↓</Key></dt><dd>to the parent</dd>
            <dt><Key>←</Key> <Key>→</Key></dt><dd>to a sibling</dd>
            <dt><Key>Esc</Key></dt><dd>step back</dd>
            <dt><Key>G</Key></dt><dd>toggle the globe</dd>
            <dt><Key>Space</Key></dt><dd>play history</dd>
          </dl>
        </section>
      </article>
    </div>
  );
}
