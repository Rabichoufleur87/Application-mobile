/* Élan — données du prototype : domaines, bibliothèque de micro-habitudes, programme, profil d'exemple. */
window.ELAN_DATA = (() => {
  const GOALS = [
    { id: 'sommeil', label: 'Mieux dormir', icon: 'moon' },
    { id: 'bouger', label: 'Bouger plus', icon: 'walk' },
    { id: 'focus', label: 'Me concentrer', icon: 'target' },
    { id: 'ecrans', label: 'Moins d’écrans', icon: 'phone' },
    { id: 'orga', label: 'M’organiser', icon: 'list' },
    { id: 'alim', label: 'Mieux manger', icon: 'apple' },
    { id: 'lecture', label: 'Lire plus', icon: 'book' },
    { id: 'serenite', label: 'Être plus serein', icon: 'leaf' },
  ];
  const OBSTACLES = [
    { id: 'temps', label: 'Je manque de temps' },
    { id: 'motivation', label: 'Ma motivation retombe vite' },
    { id: 'procra', label: 'Je procrastine' },
    { id: 'oubli', label: 'J’oublie de le faire' },
    { id: 'trop', label: 'Je veux tout changer d’un coup' },
  ];
  const STYLES = [
    { id: 'doux', label: 'Bienveillant', desc: 'Encourageant, jamais culpabilisant' },
    { id: 'cash', label: 'Direct', desc: 'Franc, droit au but, sans détour' },
    { id: 'energie', label: 'Énergique', desc: 'Motivant, plein d’entrain' },
  ];

  // Micro-habitudes : ancrage sur une routine existante, version mini (2 min) et version complète.
  const LIBRARY = [
    { id: 'ecran-soir', area: 'sommeil', icon: 'moon', name: 'Soirée sans écran', time: 'soir', anchor: 'Après m’être brossé les dents', tiny: 'Je pose mon téléphone hors de la chambre', full: '30 minutes sans écran avant de dormir', why: 'La lumière et les notifications retardent l’endormissement. Le téléphone hors de portée, c’est la tentation en moins.' },
    { id: 'coucher', area: 'sommeil', icon: 'bed', name: 'Heure de coucher fixe', time: 'soir', anchor: 'Quand l’alarme « au lit » sonne', tiny: 'Je file me mettre en pyjama', full: 'Au lit à la même heure, à 30 minutes près', why: 'Un horaire régulier règle ton horloge interne : tu t’endors plus vite et tu te réveilles plus facilement.' },
    { id: 'marche', area: 'bouger', icon: 'walk', name: 'Marcher après le repas', time: 'midi', anchor: 'Après le déjeuner', tiny: 'Je fais le tour du pâté de maisons', full: '15 minutes de marche', why: 'Marcher après manger aide la digestion et relance l’énergie de l’après-midi.' },
    { id: 'squats', area: 'bouger', icon: 'bolt', name: 'Réveil musculaire', time: 'matin', anchor: 'Pendant que le café coule', tiny: '5 squats', full: '3 séries de squats, pompes et gainage (10 min)', why: 'Commencer ridiculement petit supprime l’excuse du « pas le temps ». Le reste suit.' },
    { id: 'pomodoro', area: 'focus', icon: 'timer', name: 'Session focus', time: 'matin', anchor: 'Dès que j’ouvre mon ordinateur', tiny: '5 minutes sur la tâche la plus importante', full: 'Une session focus de 25 minutes, téléphone dans une autre pièce', why: 'Le plus dur, c’est de commencer. Une fois lancé, ton cerveau veut finir.' },
    { id: 'priorites', area: 'orga', icon: 'list', name: '3 priorités du jour', time: 'matin', anchor: 'Avec mon premier café', tiny: 'J’écris UNE priorité', full: 'J’écris mes 3 priorités dans l’appli', why: 'Savoir ce qui compte vraiment évite de passer la journée à éteindre des incendies.' },
    { id: 'demain', area: 'orga', icon: 'calendar', name: 'Préparer demain', time: 'soir', anchor: 'Après le dîner', tiny: 'Je regarde mon agenda de demain', full: '5 minutes : sac, tenue, première tâche de demain', why: 'Les matins sont plus calmes quand les décisions sont déjà prises la veille.' },
    { id: 'reseaux', area: 'ecrans', icon: 'phone', name: 'Matinée sans réseaux', time: 'matin', anchor: 'Au réveil', tiny: 'Je ne touche pas aux réseaux avant d’être habillé', full: 'Pas de réseaux sociaux avant 10h', why: 'Commencer par ton fil d’actu, c’est laisser les autres décider de ton humeur du jour.' },
    { id: 'avion', area: 'ecrans', icon: 'phone', name: 'Mode avion pour bosser', time: 'midi', anchor: 'Quand je m’assois pour travailler', tiny: 'Je retourne mon téléphone face contre la table', full: 'Téléphone en mode avion pendant que je travaille', why: 'Chaque notification coûte plusieurs minutes de concentration pour s’y remettre.' },
    { id: 'eau', area: 'alim', icon: 'drop', name: 'Un grand verre d’eau', time: 'matin', anchor: 'Dès que je pose le pied par terre', tiny: 'Trois gorgées d’eau', full: 'Un grand verre d’eau au réveil', why: 'Après une nuit, ton corps est déshydraté. C’est le geste santé le plus facile qui soit.' },
    { id: 'legume', area: 'alim', icon: 'apple', name: 'Un fruit ou légume par repas', time: 'midi', anchor: 'Quand je prépare mon assiette', tiny: 'J’ajoute un fruit au repas', full: 'Un fruit ou un légume à chaque repas', why: 'Ajouter est plus facile que s’interdire : tu améliores ton alimentation sans régime.' },
    { id: 'lire', area: 'lecture', icon: 'book', name: 'Lire chaque jour', time: 'soir', anchor: 'Une fois couché', tiny: 'Je lis une page', full: 'Je lis 10 pages', why: '10 pages par jour, c’est environ 15 livres par an.' },
    { id: 'respire', area: 'serenite', icon: 'leaf', name: 'Pause respiration', time: 'midi', anchor: 'Avant d’ouvrir mes messages de l’après-midi', tiny: '3 respirations profondes', full: '3 minutes de respiration lente (4 s inspire, 6 s expire)', why: 'Allonger l’expiration calme le système nerveux en quelques minutes.' },
    { id: 'gratitude', area: 'serenite', icon: 'heart', name: '3 bonnes choses', time: 'soir', anchor: 'En me mettant au lit', tiny: 'Je pense à une bonne chose de ma journée', full: 'J’écris 3 bonnes choses de ma journée', why: 'Entraîner ton attention sur le positif améliore l’humeur au fil des semaines.' },
  ];

  const WEEKS = [
    { n: 1, title: 'Démarrer petit', desc: 'Version mini uniquement. Le but : ne jamais sauter un jour, même si c’est ridicule.' },
    { n: 2, title: 'Ancrer', desc: 'Même geste, même moment. On colle l’habitude à ta routine jusqu’à ce qu’elle devienne automatique.' },
    { n: 3, title: 'Monter d’un cran', desc: 'Passage à la version complète. Les jours difficiles, la version mini compte toujours.' },
    { n: 4, title: 'Consolider', desc: 'Tu tiens le rythme. On prépare la suite : garder, ajuster ou ajouter une habitude.' },
  ];

  const CHALLENGES = [
    'Aujourd’hui, fais ta version complète AVANT midi.',
    'Range ton téléphone dans une autre pièce pendant 1 heure.',
    'Écris ta priorité n°1 sur un post-it et colle-le sur ton écran.',
    'Fais une session focus de 25 minutes sans regarder ton téléphone.',
    'Prépare ce soir tout ce dont tu as besoin pour réussir ton habitude demain.',
    'Marche 10 minutes en plus aujourd’hui, sans écouteurs.',
    'Couche-toi 20 minutes plus tôt que d’habitude.',
  ];

  // Profil d'exemple : 10 jours de programme avec un historique réaliste
  function demo(today) {
    const pick = id => LIBRARY.find(h => h.id === id);
    const habits = ['pomodoro', 'ecran-soir', 'marche'].map(id => Object.assign({}, pick(id)));
    const log = {};
    const pattern = [1, 1, 1, 0.5, 1, 0, 1, 1, 0.66, 1];
    const moods = [[3, 3], [4, 3], [3, 4], [2, 2], [4, 4], [2, 3], [3, 3], [4, 4], [3, 2], [4, 3]];
    for (let i = 10; i >= 1; i--) {
      const d = new Date(today); d.setDate(d.getDate() - i);
      const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const rate = pattern[10 - i], done = {};
      habits.forEach((h, j) => { if (rate >= 1 || (rate > 0 && j < Math.round(rate * 3))) done[h.id] = (10 - i) < 7 ? 'mini' : (j === 1 && i % 3 === 0 ? 'mini' : 'full'); });
      const [energy, mood] = moods[10 - i];
      log[k] = { done, energy, mood, focus: done.pomodoro ? ((10 - i) < 7 ? 5 : 25) : 0 };
    }
    return { habits, log, startOffset: 10 };
  }

  return { GOALS, OBSTACLES, STYLES, LIBRARY, WEEKS, CHALLENGES, demo };
})();
