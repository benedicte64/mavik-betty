# Modèle client MAVIK vierge

Ce dossier est la sauvegarde versionnée d'un futur MAVIK client. Il attend volontairement :

- le nom de la société ;
- le SIRET et l'adresse d'administration ;
- le nom, la voix et la personnalité de son IA ;
- la charte graphique ;
- les rôles, droits, habitudes de travail et modules retenus.

Il ne s'agit ni de Betty, ni de Jarvis, ni d'une copie de leurs données. Le modèle s'appuie sur le moteur MAVIK et conserve uniquement des capacités réutilisables, neutralisées et testées.

## État actuel

`WAITING_FOR_IDENTITY` — aucune identité client n'est définie et aucun module métier optionnel n'est activé.

Les éléments toujours présents sont les garanties du socle : séparation des données, droits par rôle, accessibilité, traçabilité, validation humaine et possibilité de retour arrière.

## Contenu

- `config/` : identité et rôles encore vierges ;
- `catalog/` : capacités disponibles et idées à évaluer ;
- `governance/` : règles de reprise du meilleur de Betty et de Jarvis ;
- `src/activate-template.js` : activation future sans modifier le modèle d'origine ;
- `tests/validate-template.js` : contrôle anti-contamination et cohérence du catalogue.

## Activation future

Lorsque le nouveau client sera connu :

1. recueillir le nom de la société, le SIRET et l'e-mail administrateur ;
2. laisser le client choisir le nom et la voix de son IA ;
3. sélectionner les modules utiles dans `catalog/capabilities.json` ;
4. définir les utilisateurs, les rôles et les solutions d'identification adaptées ;
5. tester les connecteurs et les migrations ;
6. générer une instance client séparée par `npm run activate -- ...` ;
7. faire valider humainement avant toute mise en production.

Exemple, seulement lorsque les noms seront décidés :

```bash
npm run activate -- \
  --company "Nom de la société" \
  --siret "12345678901234" \
  --admin "admin@example.fr" \
  --assistant "Nom de l'IA"
```

La commande produit un fichier de configuration dérivé dans `build/`. Le modèle vierge reste inchangé et réutilisable.

## Règle d'évolution

Une fonction trouvée dans Betty ou dans la lignée Jarvis n'est jamais copiée aveuglément. Elle passe par la grille de `governance/adoption-policy.md`, est rendue générique, documentée dans le catalogue, testée, puis laissée désactivée tant qu'un client ne l'a pas choisie.
