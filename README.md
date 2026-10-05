# Marge · finances personnelles automatisées

Prototype d'application mobile (PWA installable) qui répond chaque matin à une seule question : **combien je peux dépenser aujourd'hui ?**

## Les 3 automatisations au cœur

1. **Reste à vivre du jour**
   `(solde + dépenses du jour − prélèvements attendus avant la paie − épargne restant à faire − coussin de sécurité) ÷ jours jusqu'à la paie`.
   Le calcul est détaillé dans l'onglet Profil. Le simulateur « Je peux me le permettre ? » dit si un achat passe et son impact sur les jours suivants.
2. **Catégorisation automatique**
   Des règles reconnaissent les libellés bancaires français (CB, PRLV SEPA, VIR…) et donnent des noms lisibles. Quand tu corriges une catégorie, Marge l'applique aux opérations similaires et s'en souvient.
3. **Chasse aux abonnements**
   Détection des prélèvements récurrents (mensuels, toutes les 4 semaines, hebdo, annuels), hausses de prix, doublons (deux services de musique), renouvellements annuels proches, calendrier des 30 prochains jours et économie réalisable.

Aussi : projection du solde jusqu'à la paie, alertes automatiques, budgets par catégorie, comparaison avec le mois dernier, objectif d'épargne, mode clair/sombre, hors-ligne.

## Données

- **Compte d'exemple** : 3 mois d'opérations réalistes générées de façon déterministe.
- **Import CSV** : formats des banques françaises (séparateur `;` ou `,`, virgule décimale, colonnes Montant ou Débit/Crédit, UTF-8 ou Windows-1252). Un relevé d'exemple est intégré pour tester.
- Tout reste dans le navigateur (localStorage). Aucune donnée n'est envoyée.

## Lancer en local

```bash
python3 -m http.server 8000
# puis ouvrir http://localhost:8000
```

## Vers une vraie app

1. **Connexion bancaire** : passer par un agrégateur agréé DSP2 (ex. Bridge, Powens) en lecture seule. Contrat et coût par utilisateur à prévoir. L'agrément d'agrégateur (AISP) est porté par le partenaire.
2. **Comptes et chiffrement** des données côté serveur, hébergement en Europe.
3. **Notifications** (prélèvement demain, budget dépassé) via une app native (Expo) ou Web Push.
4. **RGPD et conformité** à faire valider par un juriste ou la CCI avant le lancement : données bancaires = données sensibles pour les utilisateurs, même si elles ne relèvent pas des « catégories particulières » du RGPD.
