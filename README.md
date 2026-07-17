# GCOS — GentleCarE Operating System

MVP opérationnel de Jarvis pour GentleCarE.

## Fonctionnalités disponibles

- Tableau de bord Direction
- Tâches prioritaires avec validation
- Devis Audi S5 V8 à valider ou corriger
- Suivi des commandes Intelblast, France Air et Dinitrol
- Mode Atelier pour la Mini blanche 2005
- Checklist, chronomètre, notes et photos depuis un iPhone
- Recherche globale
- Commande vocale Jarvis lorsque le navigateur la prend en charge
- Journal automatique des actions
- Sauvegarde locale dans le navigateur

## Test immédiat

Le MVP est une application statique contenue dans `index.html`.

Dans GitHub Codespaces :

```bash
python3 -m http.server 4173
```

Puis ouvrir le port `4173` dans le navigateur.

Sur un ordinateur après clonage :

```bash
git clone https://github.com/gentlecar64-ship-it/-jarvis-gentlecare.git
cd -jarvis-gentlecare
python3 -m http.server 4173
```

Ouvrir ensuite `http://localhost:4173`.

## État technique

Cette première version ne transmet aucune donnée sensible à un serveur. Les données sont conservées dans `localStorage` sur l’appareil utilisé. L’intégration Airtable et l’authentification seront ajoutées dans les prochains sprints.
