/* Tilt — données du prototype.
   Les calendriers de collecte et les magasins sont des EXEMPLES : en production,
   ils viendront des données ouvertes des collectivités et d'OpenStreetMap. */

window.TILT_DATA = (() => {
  // Jours : 0 = dimanche … 6 = samedi (comme Date.getDay)
  const CITIES = [
    { id: 'limoges', name: 'Limoges', cp: '87000', lat: 45.8336, lon: 1.2611,
      bins: { om: { days: [1, 4] }, emb: { days: [3], freq: 'biweekly', parity: 'even' }, bio: { days: [2] } },
      decheterie: { name: 'Déchetterie de Limoges Nord', hours: 'Lun-sam 9h-12h / 14h-18h' } },
    { id: 'panazol', name: 'Panazol', cp: '87350', lat: 45.8389, lon: 1.3097,
      bins: { om: { days: [2] }, emb: { days: [5], freq: 'biweekly', parity: 'odd' } },
      decheterie: { name: 'Déchetterie de Panazol', hours: 'Lun-sam 9h-12h / 14h-18h' } },
    { id: 'isle', name: 'Isle', cp: '87170', lat: 45.8008, lon: 1.2194,
      bins: { om: { days: [3] }, emb: { days: [1], freq: 'biweekly', parity: 'even' } },
      decheterie: { name: 'Déchetterie d’Isle', hours: 'Mar-sam 9h-12h / 14h-18h' } },
    { id: 'couzeix', name: 'Couzeix', cp: '87270', lat: 45.875, lon: 1.2389,
      bins: { om: { days: [4] }, emb: { days: [2], freq: 'biweekly', parity: 'odd' } },
      decheterie: { name: 'Déchetterie de Couzeix', hours: 'Lun-sam 9h-12h / 14h-18h' } },
    { id: 'saint-junien', name: 'Saint-Junien', cp: '87200', lat: 45.8869, lon: 0.9014,
      bins: { om: { days: [1] }, emb: { days: [4], freq: 'biweekly', parity: 'even' } },
      decheterie: { name: 'Déchetterie de Saint-Junien', hours: 'Lun-sam 9h-12h / 14h-17h30' } },
    { id: 'brive', name: 'Brive-la-Gaillarde', cp: '19100', lat: 45.1589, lon: 1.5331,
      bins: { om: { days: [2, 5] }, emb: { days: [3] } },
      decheterie: { name: 'Déchetterie de Brive', hours: 'Lun-sam 8h30-12h / 13h30-18h' } },
    { id: 'bordeaux', name: 'Bordeaux', cp: '33000', lat: 44.8378, lon: -0.5792,
      bins: { om: { days: [1, 3, 5] }, emb: { days: [4] }, bio: { days: [2] } },
      decheterie: { name: 'Centre de recyclage', hours: 'Tous les jours 9h-18h' } },
    { id: 'toulouse', name: 'Toulouse', cp: '31000', lat: 43.6047, lon: 1.4442,
      bins: { om: { days: [1, 4] }, emb: { days: [2] } },
      decheterie: { name: 'Déchèterie de Toulouse', hours: 'Lun-sam 10h-18h' } },
    { id: 'lyon', name: 'Lyon', cp: '69000', lat: 45.764, lon: 4.8357,
      bins: { om: { days: [1, 3, 5] }, emb: { days: [2] }, bio: { days: [4] } },
      decheterie: { name: 'Déchèterie Lyon 7e', hours: 'Lun-sam 8h30-12h / 13h30-18h' } },
    { id: 'nantes', name: 'Nantes', cp: '44000', lat: 47.2184, lon: -1.5536,
      bins: { om: { days: [2] }, emb: { days: [5] } },
      decheterie: { name: 'Écopoint Nantes', hours: 'Lun-sam 10h-18h' } },
    { id: 'paris', name: 'Paris', cp: '75000', lat: 48.8566, lon: 2.3522,
      bins: { om: { days: [0, 1, 2, 3, 4, 5, 6] }, emb: { days: [1, 4] }, bio: { days: [3] } },
      decheterie: { name: 'Espace tri / Recyclerie', hours: 'Selon arrondissement' } },
  ];

  const BIN_TYPES = {
    om:    { label: 'Ordures ménagères', short: 'Grise',  color: 'var(--bin-om)',    tip: 'Ce qui ne se recycle pas : couches, mouchoirs, vaisselle cassée.' },
    emb:   { label: 'Emballages & papiers', short: 'Jaune', color: 'var(--bin-emb)', tip: 'Tous les emballages, même les pots de yaourt et films plastique.' },
    bio:   { label: 'Biodéchets', short: 'Marron', color: 'var(--bin-bio)',         tip: 'Épluchures, restes de repas, marc de café.' },
    verre: { label: 'Verre', short: 'Verte', color: 'var(--bin-verre)',             tip: 'En borne d’apport volontaire : bouteilles, pots et bocaux sans couvercle.' },
  };

  // Guide du tri (consignes nationales, extension des consignes de tri depuis 2023)
  const TRI = [
    ['Pot de yaourt', 'emb', 'Depuis 2023, tous les emballages plastique vont dans le bac jaune.'],
    ['Film plastique', 'emb', 'Films, sachets et blisters : bac jaune.'],
    ['Barquette en polystyrène', 'emb', 'Bac jaune, bien vidée.'],
    ['Bouteille plastique', 'emb', 'Avec son bouchon, sans la rincer.'],
    ['Bouteille d’huile', 'emb', 'Bac jaune, bien égouttée.'],
    ['Canette', 'emb', 'Aluminium : bac jaune.'],
    ['Boîte de conserve', 'emb', 'Bac jaune, vidée (inutile de la laver).'],
    ['Carton à pizza', 'emb', 'Bac jaune s’il est vidé des restes. Très gras : bac gris.'],
    ['Brique de lait', 'emb', 'Bac jaune.'],
    ['Journal, magazine', 'emb', 'Papiers : bac jaune, sans film plastique.'],
    ['Enveloppe', 'emb', 'Même avec fenêtre : bac jaune.'],
    ['Capsule de café alu', 'emb', 'Bac jaune dans la plupart des communes. Vérifie localement.'],
    ['Aérosol', 'emb', 'Vide : bac jaune. Plein : déchetterie.'],
    ['Bouteille en verre', 'verre', 'Borne à verre, sans bouchon.'],
    ['Pot de confiture', 'verre', 'Borne à verre. Le couvercle va dans le bac jaune.'],
    ['Bocal', 'verre', 'Borne à verre, sans couvercle.'],
    ['Verre de table cassé', 'om', 'Pas dans la borne à verre : bac gris.'],
    ['Vaisselle cassée', 'om', 'Porcelaine et céramique : bac gris.'],
    ['Miroir', 'decheterie', 'Déchetterie.'],
    ['Épluchures', 'bio', 'Biodéchets ou composteur.'],
    ['Marc de café', 'bio', 'Biodéchets, filtre papier compris.'],
    ['Restes de repas', 'bio', 'Biodéchets, viande et poisson compris.'],
    ['Coquilles d’œufs', 'bio', 'Biodéchets ou compost.'],
    ['Mouchoir', 'om', 'Bac gris (ou compost s’il n’est pas souillé).'],
    ['Couche', 'om', 'Bac gris.'],
    ['Brosse à dents', 'om', 'Bac gris.'],
    ['Piles', 'magasin', 'Bornes de collecte en magasin.'],
    ['Ampoule LED', 'magasin', 'Points de collecte en magasin de bricolage.'],
    ['Téléphone', 'magasin', 'Reprise en magasin ou déchetterie (DEEE).'],
    ['Médicaments', 'pharmacie', 'Rapporte-les en pharmacie, sans le carton (bac jaune).'],
    ['Radiographie', 'pharmacie', 'Pharmacie ou déchetterie.'],
    ['Huile de friture', 'decheterie', 'Jamais dans l’évier : déchetterie.'],
    ['Peinture', 'decheterie', 'Déchetterie (déchets dangereux).'],
    ['Vêtements', 'textile', 'Borne textile, propres et secs, même abîmés.'],
    ['Chaussures', 'textile', 'Borne textile, attachées par paire.'],
    ['Gros carton', 'decheterie', 'Déchetterie s’il ne rentre pas dans le bac jaune.'],
    ['Électroménager', 'decheterie', 'Déchetterie ou reprise lors d’un achat neuf.'],
    ['Cartouche d’encre', 'magasin', 'Bornes en magasin.'],
  ];
  const TRI_DEST = {
    om: { label: 'Bac gris', color: 'var(--bin-om)' },
    emb: { label: 'Bac jaune', color: 'var(--bin-emb)' },
    bio: { label: 'Biodéchets', color: 'var(--bin-bio)' },
    verre: { label: 'Borne à verre', color: 'var(--bin-verre)' },
    decheterie: { label: 'Déchetterie', color: 'var(--ink-2)' },
    magasin: { label: 'En magasin', color: 'var(--accent)' },
    pharmacie: { label: 'Pharmacie', color: 'var(--ok)' },
    textile: { label: 'Borne textile', color: 'var(--signal)' },
  };

  // Rayons pour classer la liste de courses
  const RAYONS = [
    ['Fruits & légumes', 'leaf', ['pomme', 'banane', 'tomate', 'salade', 'carotte', 'oignon', 'ail', 'courgette', 'poireau', 'citron', 'orange', 'fraise', 'avocat', 'poivron', 'champignon', 'pomme de terre', 'patate', 'légume', 'fruit', 'herbes', 'persil', 'concombre', 'raisin', 'poire', 'kiwi', 'courge']],
    ['Boulangerie', 'bread', ['pain', 'baguette', 'croissant', 'brioche', 'viennoiserie', 'pain de mie']],
    ['Frais', 'drop', ['lait', 'yaourt', 'beurre', 'fromage', 'oeuf', 'œuf', 'crème', 'jambon', 'emmental', 'comté', 'mozzarella', 'skyr', 'compote', 'lardons']],
    ['Boucherie & poisson', 'fish', ['poulet', 'steak', 'viande', 'boeuf', 'bœuf', 'porc', 'saumon', 'poisson', 'thon frais', 'saucisse', 'dinde', 'crevette']],
    ['Épicerie', 'jar', ['pâtes', 'pates', 'riz', 'farine', 'sucre', 'café', 'cafe', 'thé', 'the', 'huile', 'vinaigre', 'sel', 'poivre', 'conserve', 'thon', 'céréales', 'cereales', 'chocolat', 'biscuit', 'confiture', 'miel', 'sauce', 'moutarde', 'lentilles', 'semoule', 'gâteaux']],
    ['Boissons', 'cup', ['eau', 'jus', 'bière', 'biere', 'vin', 'soda', 'sirop', 'coca', 'limonade']],
    ['Surgelés', 'snow', ['surgelé', 'surgele', 'glace', 'pizza', 'frites', 'épinards']],
    ['Hygiène', 'sparkle', ['dentifrice', 'shampoing', 'shampooing', 'gel douche', 'savon', 'papier toilette', 'pq', 'coton', 'déodorant', 'deodorant', 'couches', 'mouchoirs', 'rasoir', 'brosse à dents']],
    ['Entretien', 'spray', ['lessive', 'liquide vaisselle', 'éponge', 'eponge', 'sac poubelle', 'sacs poubelle', 'javel', 'nettoyant', 'pastilles lave-vaisselle', 'essuie-tout', 'sopalin', 'adoucissant']],
    ['Animaux', 'paw', ['croquettes', 'pâtée', 'patee', 'litière', 'litiere', 'friandises chien', 'friandises chat']],
  ];

  // Bibliothèque de rappels malins (ajoutables en un geste)
  // rec: daily | weekly(days) | every(n) | monthly(day) | yearly(m,d)
  const LIBRARY = [
    { title: 'Changer les draps', icon: 'bed', cat: 'Maison', rec: { type: 'every', n: 14 }, time: '10:00', why: 'Toutes les 2 semaines, c’est la recommandation des allergologues.' },
    { title: 'Tester le détecteur de fumée', icon: 'alarm', cat: 'Sécurité', rec: { type: 'monthly', day: 1 }, time: '18:30', why: 'Un appui sur le bouton une fois par mois suffit.' },
    { title: 'Nettoyer le filtre de la hotte', icon: 'wind', cat: 'Maison', rec: { type: 'every', n: 90 }, time: '18:00', why: 'Un filtre encrassé, c’est un risque d’incendie.' },
    { title: 'Changer la brosse à dents', icon: 'sparkle', cat: 'Santé', rec: { type: 'every', n: 90 }, time: '08:00', why: 'Tous les 3 mois, selon les dentistes.' },
    { title: 'Purger les radiateurs', icon: 'heat', cat: 'Maison', rec: { type: 'yearly', m: 10, d: 10 }, time: '10:00', why: 'Avant l’hiver, pour chauffer mieux et consommer moins.' },
    { title: 'Dégivrer le congélateur', icon: 'snow', cat: 'Maison', rec: { type: 'every', n: 180 }, time: '10:00', why: 'Au-delà de 3 mm de givre, la consommation explose.' },
    { title: 'Ramonage de la cheminée', icon: 'flame', cat: 'Maison', rec: { type: 'yearly', m: 9, d: 15 }, time: '10:00', why: 'Obligatoire au moins une fois par an, l’assurance peut le demander.' },
    { title: 'Vérifier la pression des pneus', icon: 'car', cat: 'Voiture', rec: { type: 'monthly', day: 1 }, time: '09:00', why: 'Des pneus sous-gonflés consomment plus et usent plus vite.' },
    { title: 'Nettoyer le lave-linge', icon: 'drop', cat: 'Maison', rec: { type: 'monthly', day: 15 }, time: '10:00', why: 'Un cycle à vide à 90 °C chaque mois évite les odeurs.' },
    { title: 'Arroser les plantes', icon: 'leaf', cat: 'Maison', rec: { type: 'every', n: 3 }, time: '19:00', why: 'Tilt adapte selon la météo : pas d’arrosage dehors s’il pleut.' },
    { title: 'Relever les compteurs', icon: 'bolt', cat: 'Budget', rec: { type: 'monthly', day: 28 }, time: '19:00', why: 'Pour suivre ta consommation et éviter les régularisations.' },
    { title: 'Vérifier les abonnements', icon: 'card', cat: 'Budget', rec: { type: 'monthly', day: 3 }, time: '19:00', why: 'Repère ceux que tu n’utilises plus avant le prélèvement.' },
    { title: 'Appeler les grands-parents', icon: 'phone', cat: 'Famille', rec: { type: 'weekly', days: [0] }, time: '17:00', why: 'Un petit appel le dimanche, ça compte.' },
    { title: 'Sortir les poubelles de la salle de bain', icon: 'trash', cat: 'Maison', rec: { type: 'weekly', days: [0] }, time: '20:00', why: 'Celles qu’on oublie toujours.' },
  ];

  // Magasins d'exemple (utilisés si OpenStreetMap n'est pas joignable)
  const SAMPLE_STORES = [
    { name: 'Supermarché du centre', kind: 'Supermarché', dx: 0.004, dy: 0.003, hours: { 1: [[8.5, 20]], 2: [[8.5, 20]], 3: [[8.5, 20]], 4: [[8.5, 20]], 5: [[8.5, 20.5]], 6: [[8.5, 20]], 0: [[9, 12.5]] }, calm: 'Calme vers 14h en semaine' },
    { name: 'Discount de la zone nord', kind: 'Discount', dx: -0.011, dy: 0.016, hours: { 1: [[8, 20]], 2: [[8, 20]], 3: [[8, 20]], 4: [[8, 20]], 5: [[8, 20]], 6: [[8, 20]] }, calm: 'Évite le samedi 10h-12h' },
    { name: 'Épicerie bio Le Panier', kind: 'Bio', dx: 0.002, dy: -0.006, hours: { 2: [[9.5, 19]], 3: [[9.5, 19]], 4: [[9.5, 19]], 5: [[9.5, 19]], 6: [[9, 18]] }, calm: 'Calme le matin' },
    { name: 'Boulangerie du coin', kind: 'Boulangerie', dx: 0.001, dy: 0.001, hours: { 1: [[6.5, 19.5]], 2: [[6.5, 19.5]], 4: [[6.5, 19.5]], 5: [[6.5, 19.5]], 6: [[6.5, 19.5]], 0: [[7, 13]] }, calm: 'Pain chaud à 17h' },
    { name: 'Marché couvert', kind: 'Marché', dx: -0.003, dy: 0.002, hours: { 2: [[7, 13]], 3: [[7, 13]], 4: [[7, 13]], 5: [[7, 13]], 6: [[7, 13.5]], 0: [[7, 13]] }, calm: 'Meilleurs prix en fin de matinée' },
    { name: 'Pharmacie de la place', kind: 'Pharmacie', dx: 0.0025, dy: -0.002, hours: { 1: [[9, 19.5]], 2: [[9, 19.5]], 3: [[9, 19.5]], 4: [[9, 19.5]], 5: [[9, 19.5]], 6: [[9, 12.5]] }, calm: 'Pharmacie de garde : 3237' },
  ];

  // Vacances scolaires zone A (académie de Limoges), à confirmer sur education.gouv.fr
  const SCHOOL_HOLIDAYS = [
    { name: 'Vacances de la Toussaint', start: '2026-10-17', end: '2026-11-02' },
    { name: 'Vacances de Noël', start: '2026-12-19', end: '2027-01-04' },
    { name: 'Vacances d’hiver', start: '2027-02-06', end: '2027-02-22' },
    { name: 'Vacances de printemps', start: '2027-04-03', end: '2027-04-19' },
  ];

  // Astuces de saison (index = mois 0-11)
  const SEASON_TIPS = [
    ['Janvier : c’est le bon mois pour vérifier tes contrats d’assurance et d’énergie.', 'Pense au ménage des grilles de VMC : 5 minutes, et l’air circule mieux.'],
    ['Février : taille les rosiers et les arbustes avant la reprise de la végétation.', 'Vérifie la date de fin de ta carte d’identité avant de réserver un voyage.'],
    ['Mars : le changement d’heure approche, on avance d’une heure le dernier dimanche du mois.', 'Grand ménage de printemps : commence par les vitres, à l’ombre.'],
    ['Avril : la déclaration de revenus ouvre ce mois-ci, prépare tes justificatifs.', 'Ressors le salon de jardin et vérifie l’état des parasols.'],
    ['Mai : jours fériés en série, vérifie les décalages de collecte des déchets.', 'Plante les tomates après les Saints de glace (11-13 mai).'],
    ['Juin : nettoie les filtres de la clim avant les fortes chaleurs.', 'Prépare un plan pour les plantes pendant les vacances.'],
    ['Juillet : ferme les volets côté soleil avant 11h, ouvre la nuit.', 'Avant de partir : coupe l’eau, débranche la box, vide le frigo.'],
    ['Août : liste des fournitures scolaires en ligne dès maintenant, les prix montent en fin de mois.', 'Arrose tôt le matin ou tard le soir pour éviter l’évaporation.'],
    ['Septembre : planifie le ramonage avant les premiers feux.', 'Vérifie que ton attestation d’assurance scolaire est à jour.'],
    ['Octobre : purge tes radiateurs avant de rallumer le chauffage.', 'Changement d’heure fin octobre : on gagne une heure de sommeil.'],
    ['Novembre : pneus hiver ou chaînes obligatoires dans les communes de montagne du 1er novembre au 31 mars.', 'Fais le plein de sel de déneigement avant la rupture de stock.'],
    ['Décembre : liste de cadeaux partagée avant le rush, et les colis partent avant le 18.', 'Coupe les guirlandes la nuit : moins de risque, moins de facture.'],
  ];

  const USEFUL_NUMBERS = [
    ['Pharmacie de garde', '3237'],
    ['SAMU', '15'],
    ['Pompiers', '18'],
    ['Police', '17'],
    ['Urgence européenne', '112'],
    ['Urgence par SMS', '114'],
  ];

  const AVATAR_COLORS = ['#2846E8', '#E8576B', '#12A150', '#D97706', '#8B5CF6', '#0EA5E9'];

  return { CITIES, BIN_TYPES, TRI, TRI_DEST, RAYONS, LIBRARY, SAMPLE_STORES, SCHOOL_HOLIDAYS, SEASON_TIPS, USEFUL_NUMBERS, AVATAR_COLORS };
})();
