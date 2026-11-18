/**
 * a specimen of each language: a famous first line (or a short, well-known passage),
 * in its own script, with a romanisation where needed and a plain english translation.
 */
export interface Sample {
  text: string;
  translit?: string;
  translation: string;
  source: string;
}

export const samples: Record<string, Sample> = {
  hittite: {
    text: 'nu NINDA-an ezzatteni wātar-ma ekutteni',
    translation: 'Now you will eat bread, and drink water.',
    source: 'the sentence Bedřich Hrozný used to decipher Hittite, 1915',
  },
  'vedic-sanskrit': {
    text: 'अग्निमीळे पुरोहितं यज्ञस्य देवमृत्विजम्',
    translit: 'agním īḷe puróhitaṃ yajñásya devám ṛtvíjam',
    translation: 'I praise Agni, the household priest, the god who serves the sacrifice.',
    source: 'Rigveda 1.1.1',
  },
  'classical-sanskrit': {
    text: 'धर्मक्षेत्रे कुरुक्षेत्रे समवेता युयुत्सवः',
    translit: 'dharmakṣetre kurukṣetre samavetā yuyutsavaḥ',
    translation: 'On the field of dharma, the field of the Kurus, gathered and eager to fight…',
    source: 'Bhagavad Gita 1.1',
  },
  pali: {
    text: 'Evaṃ me sutaṃ.',
    translation: 'Thus have I heard.',
    source: 'the opening of the Buddhist suttas',
  },
  avestan: {
    text: 'yaθā ahū vairiiō aθā ratuš ašāṯcīṯ hacā',
    translation: 'As the Lord is to be chosen, so is the Judge, in accordance with truth.',
    source: 'Ahuna Vairya prayer (transliterated)',
  },
  'old-persian': {
    text: 'adam Dārayavauš xšāyaθiya vazraka xšāyaθiya xšāyaθiyānām',
    translation: 'I am Darius, the great king, king of kings.',
    source: 'Behistun inscription, c. 520 BCE (transliterated)',
  },
  persian: {
    text: 'به نام خداوند جان و خرد',
    translit: 'be nām-e xodāvand-e jān o xerad',
    translation: 'In the name of the Lord of soul and wisdom.',
    source: 'Ferdowsi, Shahnameh, c. 1010',
  },
  bengali: {
    text: 'আমার সোনার বাংলা, আমি তোমায় ভালোবাসি',
    translit: 'amar sonar bangla, ami tomay bhalobashi',
    translation: 'My golden Bengal, I love you.',
    source: 'Rabindranath Tagore, 1905 (now the anthem of Bangladesh)',
  },
  'ancient-greek': {
    text: 'μῆνιν ἄειδε θεὰ Πηληϊάδεω Ἀχιλῆος',
    translit: 'mênin áeide theà Pēlēïádeō Akhilêos',
    translation: 'Sing, goddess, the wrath of Achilles, son of Peleus.',
    source: 'Homer, Iliad 1.1',
  },
  'koine-greek': {
    text: 'Ἐν ἀρχῇ ἦν ὁ λόγος',
    translit: 'En arkhêi ên ho lógos',
    translation: 'In the beginning was the Word.',
    source: 'Gospel of John 1:1',
  },
  greek: {
    text: 'Σε γνωρίζω από την κόψη του σπαθιού την τρομερή',
    translit: 'Se gnorízo apó tin kópsi tou spathioú tin tromerí',
    translation: 'I know you by the fearsome edge of your sword.',
    source: 'Dionysios Solomos, Hymn to Liberty, 1823 (the national anthem)',
  },
  'classical-armenian': {
    text: 'Ի սկզբանէ էր Բանն',
    translit: 'I skzbanē ēr Bann',
    translation: 'In the beginning was the Word.',
    source: 'Gospel of John 1:1, 5th-century translation',
  },
  'old-latin': {
    text: 'Manios med fhefhaked Numasioi',
    translation: 'Manius made me for Numerius.',
    source: 'Praeneste fibula, 7th century BCE (authenticity once doubted, now widely accepted)',
  },
  latin: {
    text: 'Arma virumque canō, Trōiae quī prīmus ab ōrīs',
    translation: 'I sing of arms and the man who first, from the shores of Troy…',
    source: 'Virgil, Aeneid 1.1',
  },
  'old-french': {
    text: 'Pro Deo amur et pro christian poblo et nostro commun salvament',
    translation: 'For the love of God and for the Christian people and our common salvation…',
    source: 'Oaths of Strasbourg, 842',
  },
  french: {
    text: 'Longtemps, je me suis couché de bonne heure.',
    translation: 'For a long time, I went to bed early.',
    source: 'Marcel Proust, Du côté de chez Swann, 1913',
  },
  'old-spanish': {
    text: 'De los sos oios tan fuertemientre llorando',
    translation: 'Weeping so bitterly from his eyes…',
    source: 'Cantar de mio Cid, line 1',
  },
  spanish: {
    text: 'En un lugar de la Mancha, de cuyo nombre no quiero acordarme…',
    translation: 'In a village of La Mancha, whose name I do not care to remember…',
    source: 'Miguel de Cervantes, Don Quixote, 1605',
  },
  portuguese: {
    text: 'As armas e os barões assinalados',
    translation: 'The arms and the renowned heroes…',
    source: 'Luís de Camões, Os Lusíadas, 1572',
  },
  'old-italian': {
    text: 'Nel mezzo del cammin di nostra vita',
    translation: 'Midway along the journey of our life…',
    source: 'Dante, Inferno 1.1',
  },
  italian: {
    text: 'Quel ramo del lago di Como, che volge a mezzogiorno…',
    translation: 'That branch of Lake Como which turns towards the south…',
    source: 'Alessandro Manzoni, I promessi sposi, 1827',
  },
  romanian: {
    text: 'A fost odată ca-n povești',
    translation: 'Once upon a time, as in the tales…',
    source: 'Mihai Eminescu, Luceafărul, 1883',
  },
  'old-irish': {
    text: 'Messe ocus Pangur Bán, cechtar nathar fria saindán',
    translation: 'I and Pangur Bán, each of us two at his own craft…',
    source: 'Pangur Bán, a monk’s poem about his cat, 9th century',
  },
  gothic: {
    text: '𐌰𐍄𐍄𐌰 𐌿𐌽𐍃𐌰𐍂 𐌸𐌿 𐌹𐌽 𐌷𐌹𐌼𐌹𐌽𐌰𐌼',
    translit: 'atta unsar þu in himinam',
    translation: 'Our father, thou in heaven…',
    source: 'Wulfila’s Bible, Matthew 6:9, 4th century',
  },
  'old-norse': {
    text: 'Hljóðs bið ek allar helgar kindir',
    translation: 'I ask for a hearing from all the holy kindreds…',
    source: 'Vǫluspá, stanza 1',
  },
  'old-english': {
    text: 'Hwæt! Wē Gār-Dena in geār-dagum þēod-cyninga þrym gefrūnon',
    translation: 'Listen! We have heard of the glory of the Spear-Danes’ kings in days of old.',
    source: 'Beowulf, lines 1–2',
  },
  'middle-english': {
    text: 'Whan that Aprille with his shoures soote / The droghte of March hath perced to the roote',
    translation: 'When April with its sweet showers has pierced the drought of March to the root…',
    source: 'Geoffrey Chaucer, The Canterbury Tales, c. 1387',
  },
  english: {
    text: 'To be, or not to be, that is the question.',
    translation: 'To be, or not to be, that is the question.',
    source: 'William Shakespeare, Hamlet, c. 1600',
  },
  scots: {
    text: 'O my Luve is like a red, red rose',
    translation: 'Oh, my love is like a red, red rose.',
    source: 'Robert Burns, 1794',
  },
  'old-high-german': {
    text: 'Ik gihorta ðat seggen',
    translation: 'I heard it said…',
    source: 'Hildebrandslied, line 1',
  },
  'middle-high-german': {
    text: 'Uns ist in alten mæren wunders vil geseit',
    translation: 'In old tales we are told of many marvels.',
    source: 'Nibelungenlied, stanza 1',
  },
  german: {
    text: 'Habe nun, ach! Philosophie, / Juristerei und Medizin, / Und leider auch Theologie / Durchaus studiert',
    translation: 'I have now, alas, studied philosophy, law and medicine, and sadly theology too, through and through.',
    source: 'Goethe, Faust I, 1808',
  },
  dutch: {
    text: 'Wilhelmus van Nassouwe / ben ik, van Duitsen bloed',
    translation: 'William of Nassau am I, of Germanic blood.',
    source: 'Het Wilhelmus, c. 1570 (the national anthem)',
  },
  'old-church-slavonic': {
    text: 'Отьче нашь иже еси на небесѣхъ',
    translit: 'Otĭče našĭ iže esi na nebesěxŭ',
    translation: 'Our Father, who art in heaven…',
    source: 'the Lord’s Prayer, Matthew 6:9',
  },
  'old-east-slavic': {
    text: 'Не лѣпо ли ны бяшетъ, братие',
    translit: 'Ne lěpo li ny bjašetŭ, bratie',
    translation: 'Would it not be fitting for us, brothers…',
    source: 'The Tale of Igor’s Campaign, 12th century',
  },
  russian: {
    text: 'Все счастливые семьи похожи друг на друга',
    translit: 'Vse sčastlivye semʹi poxoži drug na druga',
    translation: 'All happy families are alike.',
    source: 'Leo Tolstoy, Anna Karenina, 1877',
  },
  ukrainian: {
    text: 'Як умру, то поховайте мене на могилі',
    translit: 'Jak umru, to poxovajte mene na mohyli',
    translation: 'When I die, bury me on a burial mound…',
    source: 'Taras Shevchenko, Zapovit (“Testament”), 1845',
  },
  belarusian: {
    text: 'А хто там ідзе?',
    translit: 'A xto tam idze?',
    translation: 'And who goes there?',
    source: 'Janka Kupala, 1905–1907',
  },
  polish: {
    text: 'Litwo! Ojczyzno moja! ty jesteś jak zdrowie',
    translation: 'Lithuania, my homeland, you are like health…',
    source: 'Adam Mickiewicz, Pan Tadeusz, 1834',
  },
  czech: {
    text: 'Byl pozdní večer – první máj',
    translation: 'It was late evening, the first of May.',
    source: 'Karel Hynek Mácha, Máj, 1836',
  },
  lithuanian: {
    text: 'Lietuva, Tėvyne mūsų',
    translation: 'Lithuania, our homeland…',
    source: 'Vincas Kudirka, Tautiška giesmė, 1898 (the national anthem)',
  },
};
