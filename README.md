# Élan · coach d'habitudes et de productivité

Prototype d'application mobile (PWA installable) : un programme de 4 semaines sur mesure, des micro-habitudes impossibles à rater, une minuterie focus et un **coach IA** qui connaît ton programme.

## Ce que fait le prototype

- **Questionnaire (1 min)** : objectifs (3 max), principal obstacle, rythme, temps disponible, style de coach (bienveillant, direct, énergique).
- **Programme personnalisé** : 2 ou 3 micro-habitudes, chacune ancrée sur une routine existante (« Après mon café… »), avec une version mini (semaines 1-2) puis complète (semaines 3-4). Généré par l'IA quand elle est disponible, sinon par règles.
- **Aujourd'hui** : arc de progression du jour, check-in énergie/humeur qui adapte les conseils, mode mini les jours difficiles, alerte « ne rate pas deux fois », 3 priorités du jour, message du coach.
- **Focus** : minuterie 5/15/25/50 min, reliée à la priorité n°1, son de fin, écran maintenu allumé ; une session coche automatiquement l'habitude focus.
- **Coach** : discussion en direct. Le coach reçoit le contexte (programme, séries, énergie, priorités) et peut **modifier le programme** (ajouter, ajuster ou retirer une habitude, fixer les priorités), avec un bouton Annuler.
- **Progrès** : réussite sur 7 jours, meilleure série, minutes de focus, calendrier de régularité, courbes énergie/humeur, bilan de la semaine par l'IA.
- **Profil** : style du coach, édition des habitudes, bibliothèque de 14 micro-habitudes, thème clair/sombre.

## L'IA

- Dans la version publiée sur claude.ai, la page interroge Claude via la capacité `sample` (sur le compte de la personne, qui donne son accord au premier message).
- En local ou hors ligne, un **coach de secours** répond avec des conseils préparés (détection d'intention par mots-clés).
- Pour une vraie app : un petit serveur qui appelle l'API Claude (la clé API ne doit jamais être dans l'app), avec un historique de conversation limité et le même contexte.

## Sécurité

Élan n'est pas un professionnel de santé. Les consignes du coach prévoient d'orienter vers un médecin, et vers le **3114** (prévention du suicide, 24h/24) en cas de détresse.

## Lancer en local

```bash
python3 -m http.server 8000
# puis ouvrir http://localhost:8000
```
