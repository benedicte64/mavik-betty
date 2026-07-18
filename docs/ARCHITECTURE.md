# Architecture GCOS

## Statut

GCOS est actuellement une application web statique déployable sur GitHub Pages. La migration vers une plateforme modulaire se fera progressivement, sans interrompre le MVP existant.

## Principes

1. **Évolution sans rupture** : les pages actuelles restent opérationnelles pendant la modularisation.
2. **Noyau indépendant du métier** : le cœur fournit événements, modules, configuration et journalisation.
3. **Modules métier découplés** : CRM, atelier, stock, planning et finance consomment les services du noyau.
4. **Validation humaine** : toute action sensible préparée par Jarvis doit être validée par un utilisateur autorisé.
5. **Traçabilité** : les changements métier significatifs produisent un événement et une entrée de journal.

## Arborescence cible progressive

```text
src/
  core/
    event-bus.js
    module-registry.js
    index.js
  jarvis/
  modules/
    crm/
    atelier/
    stock/
    planning/
  shared/

docs/
  ARCHITECTURE.md
```

## Noyau v0.1

Le premier noyau contient :

- un bus d’événements synchrone et asynchrone ;
- un registre de modules avec dépendances ;
- une API publique unique exposée par `src/core/index.js` ;
- des erreurs explicites pour empêcher les doublons et dépendances absentes.

## Migration du MVP

### Étape 1 — Fondation

Créer les primitives du noyau sans modifier les pages existantes.

### Étape 2 — Adaptation

Extraire progressivement de `index.html` les responsabilités suivantes :

- session utilisateur ;
- stockage local ;
- journal d’activité ;
- navigation et permissions.

### Étape 3 — Modules métier

Introduire en priorité :

1. CRM ;
2. véhicules ;
3. interventions atelier ;
4. photos et documents ;
5. planning.

### Étape 4 — Persistance centralisée

Remplacer progressivement `localStorage` par une API sécurisée et une base de données, avec mécanisme de migration des données locales.

## Règle de compatibilité

Chaque changement doit conserver un chemin de démarrage fonctionnel sur GitHub Pages jusqu’à la mise en service d’un hébergement applicatif dédié.
