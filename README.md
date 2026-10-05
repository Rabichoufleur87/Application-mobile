# Tilt · le pense-bête du foyer

Prototype d'application mobile (PWA installable) qui prévient chaque foyer **au bon moment** : poubelles à sortir, courses, rappels, météo, échéances.

## Ce que fait le prototype

- **Questionnaire d'accueil (2 min)** : prénom, ville (ou géolocalisation), jours de collecte, foyer (couple, enfants et leurs activités, chien, chat, plantes, voiture), rythme (réveil, coucher, télétravail), courses, sport, traitement, heures des briefs. Tilt génère ensuite les rappels adaptés.
- **Aujourd'hui** : 4 tuiles « coup d'œil » (poubelle, météo, courses, prochaine échéance) qui mènent au détail, carte « Prochaine étape » avec compte à rebours, journée rangée Matin / Après-midi / Soir (les tâches faites se replient), brief du matin ou du soir (lisible à voix haute), poubelle à sortir ce soir, timeline de la journée (glisser à droite = fait, à gauche = +1 h), check-list « avant de sortir » qui s'adapte à la météo et au planning (parapluie, sac de piscine, badge…), météo heure par heure avec conseils, comptes à rebours (échéances, changement d'heure, jours fériés, vacances scolaires), infos utiles (pharmacie, magasin ouvert, déchetterie).
- **Collectes** : prochaine collecte, calendrier 14 jours avec jours fériés, réglage des jours par bac (semaines paires/impaires), guide « Où jeter ça ? ».
- **Courses** : liste partagée classée par rayon, suggestions de rachat d'après tes habitudes, magasins à proximité avec statut ouvert/fermé et favori.
- **Rappels** : saisie en langage naturel (« appeler maman dimanche 18h », « tous les lundis sortir le chien à 7h30 »), vue semaine, rappels récurrents, échéances avec relances J-30/J-7/J-1, bibliothèque de rappels qu'on oublie toujours.
- **Recherche globale** (loupe, ou touche « / » sur ordinateur) : rappels, échéances, liste de courses, tri des déchets, magasins, numéros utiles, avec actions rapides (ajouter à la liste, créer un rappel).
- **Foyer** : membres, code d'invitation, réglage des briefs, notifications du téléphone, thème clair/sombre, numéros utiles.

## Données

| Donnée | Source dans le prototype |
| --- | --- |
| Météo | Open-Meteo en direct, sinon exemple |
| Magasins | OpenStreetMap (Overpass) en direct, sinon exemples |
| Calendriers de collecte | **Exemples** à remplacer par les données des collectivités |
| Jours fériés, changement d'heure | Calculés |
| Vacances scolaires | Zone A 2026-2027, à vérifier sur education.gouv.fr |

Tout est stocké en local sur le téléphone (localStorage).

## Lancer en local

```bash
python3 -m http.server 8000
# puis ouvrir http://localhost:8000
```

Sur téléphone, une fois hébergé en HTTPS (Netlify, Vercel, GitHub Pages) : « Ajouter à l'écran d'accueil » pour l'installer comme une app.

## Prochaines étapes pour une vraie app

1. **Notifications fiables app fermée** : passer en React Native / Expo (notifications locales programmées) ou ajouter un serveur Web Push.
2. **Vraies données de collecte** : open data des métropoles, en commençant par Limoges Métropole.
3. **Comptes et synchronisation du foyer** (ex. Supabase) pour partager liste et rappels en temps réel.
4. **RGPD** : hébergement en Europe, politique de confidentialité, consentement à la géolocalisation (à faire valider par un juriste ou la CCI).
