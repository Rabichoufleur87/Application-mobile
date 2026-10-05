/* Marge — données du prototype : catégories, règles de classement, compte d'exemple. */
window.MARGE_DATA = (() => {
  // Ordre fixe = ordre des couleurs (palette catégorielle validée daltonisme, clair et sombre)
  const CATS = [
    { id: 'courses', label: 'Courses', icon: 'cart', budget: 280 },
    { id: 'resto', label: 'Restos & sorties', icon: 'fork', budget: 120 },
    { id: 'transport', label: 'Transport', icon: 'car', budget: 120 },
    { id: 'loisirs', label: 'Loisirs', icon: 'ticket', budget: 60 },
    { id: 'shopping', label: 'Shopping', icon: 'bag', budget: 80 },
    { id: 'sante', label: 'Santé', icon: 'cross', budget: 40 },
    { id: 'abos', label: 'Abonnements', icon: 'repeat', budget: 0 },
    { id: 'logement', label: 'Logement & factures', icon: 'home', budget: 0 },
    { id: 'autres', label: 'Autres', icon: 'dots', budget: 60 },
  ];
  // Hors dépenses
  const SPECIAL = [
    { id: 'revenus', label: 'Revenus', icon: 'arrowDown' },
    { id: 'epargne', label: 'Épargne', icon: 'piggy' },
  ];

  // Règles de classement automatique (testées dans l'ordre, sur le libellé normalisé)
  const RULES = [
    ['epargne', /livret|epargne|vers ldds|vers pel/],
    ['revenus', /salaire|paie |caf |cpam|remboursement|france travail|pole emploi|recu lydia|vir inst recu|vir sepa recu/],
    ['abos', /netflix|spotify|deezer|disney|canal\+|canal plus|amazon prime|prime video|apple\.com|icloud|google storage|youtube|basic fit|fitness park|free mobile|sfr|bouygues|sosh|red by|openai|chatgpt|game pass|playstation plus/],
    ['logement', /loyer|edf|engie|veolia|saur|eau de|freebox|free telecom|orange internet|assurance|maif|macif|axa|matmut|groupama|taxe|impots|dgfip|syndic|mutuelle/],
    ['courses', /carrefour|leclerc|lidl|auchan|intermarche|monoprix|franprix|casino|super u|hyper u|aldi|picard|biocoop|grand frais|netto|boulangerie|primeur|marche /],
    ['resto', /uber eats|deliveroo|just eat|mcdo|mcdonald|burger king|kfc|restaurant|bistrot|brasserie|starbucks|cafe |sushi|pizza|o tacos|subway|bar /],
    ['transport', /sncf|ouigo|totalenergies|esso|station|uber |bolt|blablacar|ratp|stcl|parking|peage|autoroute|vinci autoroutes/],
    ['sante', /pharmacie|medecin|docteur|dr |dentiste|doctolib|opticien|laboratoire|kine/],
    ['loisirs', /cinema|pathe|ugc|cgr |fnac|steam|nintendo|concert|ticketmaster|bowling|escape|musee/],
    ['shopping', /amazon|zara|h&m|kiabi|decathlon|ikea|action |vinted|shein|sephora|primark|cdiscount|leroy merlin|darty|boulanger /],
    ['autres', /retrait|dab|frais|cotisation carte|commission/],
  ];
  // Familles pour repérer les doublons d'abonnements
  const FAMILIES = [
    ['musique', 'Musique', /spotify|deezer|apple music|youtube music/],
    ['video', 'Vidéo', /netflix|disney|canal|prime video|paramount|max /],
    ['cloud', 'Stockage en ligne', /icloud|google storage|dropbox|onedrive/],
  ];

  // Noms lisibles des marchands courants (le reste est nettoyé automatiquement)
  const PRETTY = [
    [/loyer/, 'Loyer'], [/livret a/, 'Livret A'], [/icloud/, 'iCloud'], [/edf/, 'EDF'], [/freebox|free telecom/, 'Freebox'], [/free mobile/, 'Free Mobile'],
    [/amazon prime/, 'Amazon Prime'], [/basic fit/, 'Basic-Fit'], [/netflix/, 'Netflix'], [/spotify/, 'Spotify'], [/deezer/, 'Deezer'],
    [/uber eats/, 'Uber Eats'], [/deliveroo/, 'Deliveroo'], [/harmonie mutuelle/, 'Harmonie Mutuelle'], [/maif/, 'MAIF'], [/leclerc/, 'E.Leclerc'],
    [/mcdonald/, 'McDonald’s'], [/totalenergies/, 'TotalEnergies'], [/sncf/, 'SNCF'], [/amazon/, 'Amazon'],
  ];
  const CITIES = /\s(limoges|paris|lyon|marseille|bordeaux|toulouse|nantes|lille|nice|rennes|strasbourg|montpellier)(\s.*)?$/i;

  // Générateur pseudo-aléatoire déterministe : le compte d'exemple est identique à chaque ouverture
  function rng(seed) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

  function sampleTransactions(today) {
    const r = rng(20261005);
    const pick = a => a[Math.floor(r() * a.length)];
    const between = (a, b) => Math.round((a + r() * (b - a)) * 100) / 100;
    const out = [];
    const start = new Date(today); start.setDate(start.getDate() - 92);
    const add = (d, label, amount) => { if (d <= today) out.push({ date: new Date(d), label, amount }); };
    const dayOf = (y, m, day) => new Date(y, m, day);
    const workday = d => { const x = new Date(d); while (x.getDay() === 0 || x.getDay() === 6) x.setDate(x.getDate() - 1); return x; };

    // Charges fixes et revenus, mois par mois
    for (let m = -4; m <= 0; m++) {
      const base = new Date(today.getFullYear(), today.getMonth() + m, 1);
      const y = base.getFullYear(), mo = base.getMonth();
      const inRange = d => d >= start;
      const put = (day, label, amount) => { const d = dayOf(y, mo, day); if (inRange(d)) add(d, label, amount); };
      const sal = workday(dayOf(y, mo, 28)); if (inRange(sal)) add(sal, 'VIR SEPA RECU /DE SARL ATELIER MOREAU /MOTIF SALAIRE', 1850);
      put(29, 'VIR VERS LIVRET A', -100);
      put(5, 'PRLV SEPA SCI LES TILLEULS LOYER', -620);
      put(10, 'PRLV SEPA EDF CLIENTS PARTICULIERS', -68);
      put(3, 'PRLV SEPA FREE TELECOM FREEBOX', m === 0 ? -32.99 : -29.99);
      put(3, 'PRLV SEPA FREE MOBILE', -9.99);
      put(12, 'PRLV SEPA MAIF ASSURANCE AUTO', -48.2);
      put(8, 'PRLV SEPA HARMONIE MUTUELLE', -32.5);
      put(14, 'CB NETFLIX.COM 866-579-7172', -13.49);
      put(21, 'CB SPOTIFY P1F2A3B4', -11.12);
      put(17, 'CB DEEZER SA PARIS', -11.99);
      put(24, 'CB APPLE.COM/BILL ICLOUD', -2.99);
    }
    // Salle de sport toutes les 4 semaines
    for (let d = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 86); d <= today; d.setDate(d.getDate() + 28)) add(d, 'PRLV SEPA BASIC FIT FRANCE', -29.99);
    // Abonnement annuel (renouvellement dans 14 jours)
    const prime = new Date(today); prime.setDate(prime.getDate() - 351);
    const prime2 = new Date(prime); prime2.setFullYear(prime2.getFullYear() - 1);
    add(prime2, 'CB AMAZON PRIME FR', -69.9); add(prime, 'CB AMAZON PRIME FR', -69.9);

    // Dépenses du quotidien
    for (let d = new Date(start); d < today; d.setDate(d.getDate() + 1)) {
      const wd = d.getDay();
      if (wd === 6) add(d, `CB ${pick(['LIDL 4512 LIMOGES', 'CARREFOUR MARKET LIMOGES', 'E.LECLERC LIMOGES NORD', 'INTERMARCHE SUPER'])}`, -between(35, 80));
      if (wd === 3 && r() < 0.4) add(d, `CB ${pick(['LIDL 4512 LIMOGES', 'CARREFOUR MARKET LIMOGES'])}`, -between(12, 38));
      if (r() < 0.38) add(d, 'CB BOULANGERIE DU CHAMP DE JUILLET', -between(1.2, 6.8));
      if ((wd === 5 || wd === 6) && r() < 0.3) add(d, `CB ${pick(['UBER EATS HELP.UBER.COM', 'DELIVEROO FRANCE', 'MCDONALDS LIMOGES', 'LE BISTROT DES HALLES', 'O TACOS LIMOGES'])}`, -between(9, 28));
      if (r() < 0.08) add(d, 'CB STARBUCKS LIMOGES', -between(3.9, 6.2));
      if (r() < 0.05) add(d, 'CB TOTALENERGIES STATION LIMOGES', -between(42, 71));
      if (r() < 0.04) add(d, `CB ${pick(['AMAZON EU SARL', 'ACTION LIMOGES', 'ZARA LIMOGES', 'VINTED'])}`, -between(9, 58));
      if (wd === 6 && r() < 0.25) add(d, `CB ${pick(['PATHE LIMOGES', 'FNAC LIMOGES', 'STEAM PURCHASE', 'BOWLING DE LIMOGES'])}`, -between(9, 26));
      if (r() < 0.035) add(d, 'CB PHARMACIE DE LA PLACE', -between(5.5, 19));
      if (d.getDate() === 15) add(d, 'RETRAIT DAB LIMOGES REPUBLIQUE', -40);
    }
    const ago = n => { const x = new Date(today); x.setDate(x.getDate() - n); return x; };
    add(ago(40), 'CB SNCF INTERNET', -34.5);
    add(ago(23), 'CB DR MARTIN MEDECIN GENERALISTE', -30);
    add(ago(19), 'VIR SEPA RECU /DE CPAM HAUTE VIENNE /REMBOURSEMENT', 21);
    add(ago(11), 'VIR INST RECU LYDIA THOMAS', 15);
    add(ago(6), 'CB UBER TRIP HELP.UBER.COM', -14.2);
    // Aujourd'hui
    add(today, 'CB BOULANGERIE DU CHAMP DE JUILLET', -2.4);
    add(today, 'CB STARBUCKS LIMOGES', -4.9);
    return out.sort((a, b) => a.date - b.date);
  }

  // Relevé CSV d'exemple au format des banques françaises (séparateur ;, virgule décimale)
  const SAMPLE_CSV = `Date;Libellé;Débit;Crédit
28/09/2026;VIR SEPA RECU /DE SAS DUPONT /MOTIF SALAIRE;;1620,00
29/09/2026;VIR VERS LIVRET A;50,00;
30/09/2026;CB LIDL 4512 LIMOGES;46,30;
01/10/2026;CB UBER EATS HELP.UBER.COM;21,90;
02/10/2026;PRLV SEPA FREE MOBILE;19,99;
03/10/2026;CB NETFLIX.COM;13,49;
03/10/2026;CB CARREFOUR MARKET LIMOGES;63,12;
04/10/2026;CB PATHE LIMOGES;11,50;
05/10/2026;PRLV SEPA SCI LES TILLEULS LOYER;540,00;
05/10/2026;CB BOULANGERIE DU CHAMP DE JUILLET;3,10;`;

  return { CATS, SPECIAL, RULES, FAMILIES, PRETTY, CITIES, sampleTransactions, SAMPLE_CSV };
})();
