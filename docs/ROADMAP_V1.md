# GCOS v1 — Roadmap de livraison

Cette roadmap transforme la spécification officielle en étapes de développement vérifiables.

## Phase 0 — Stabilisation de l’existant

- Inventorier les fichiers actuels.
- Vérifier le déploiement GitHub Pages.
- Documenter les données stockées dans `localStorage`.
- Ajouter des tests simples du noyau.
- Éviter toute régression de l’interface existante.

## Phase 1 — Fondation technique

Livrables :

- GCOS Core.
- Bus d’événements.
- Registre de modules.
- Configuration centralisée.
- Stockage abstrait.
- Journal d’audit.
- Notifications.
- Gestionnaire de tâches.

Critère de sortie : le noyau démarre, charge les modules et journalise leurs actions.

## Phase 2 — Identité et permissions

Livrables :

- Comptes individuels.
- Rôles Direction, Commercial, Opérations et Technicien.
- Matrice de permissions.
- Sessions sécurisées.
- Verrouillage des actions sensibles.

Critère de sortie : chaque profil ne voit et ne modifie que les fonctions autorisées.

## Phase 3 — CRM et véhicules

Livrables :

- Création et recherche client.
- Fiche véhicule.
- Historique.
- Remises et clubs.
- Pièces jointes.

Critère de sortie : un client et son véhicule peuvent être retrouvés et réutilisés sans doublon.

## Phase 4 — Planning et atelier

Livrables :

- Rendez-vous.
- Affectation opérateur.
- Dossier d’intervention.
- Check-list d’entrée.
- Photos avant et après.
- Chronométrage.
- Cryonettoyage.
- Dinitrol.
- Contrôle qualité.

Critère de sortie : une intervention réelle peut être suivie de l’arrivée à la validation finale.

## Phase 5 — Documents et facturation

Livrables :

- Modèles de devis.
- Rapport d’intervention.
- Certificat.
- File d’attente de facturation.
- Export PDF.
- Archivage documentaire.

Critère de sortie : le dossier final est complet, exportable et traçable.

## Phase 6 — Stock et maintenance

Livrables :

- Catalogue produits.
- Mouvements de stock.
- Seuils d’alerte.
- Consommations automatiques.
- Fiches équipements.
- Échéances de maintenance.

Critère de sortie : GCOS détecte une rupture probable et une maintenance à venir.

## Phase 7 — Jarvis opérationnel

Livrables :

- Mémoire de session.
- Synthèses.
- Alertes contextuelles.
- Détection d’étapes manquantes.
- Préparation de brouillons.
- Validation humaine.

Critère de sortie : Jarvis propose des actions fiables sans exécuter seul les actions critiques.

## Phase 8 — Connecteurs

Ordre prévu :

1. Airtable.
2. Gmail.
3. Google Calendar.
4. Stockage documentaire.
5. Banque et paiements.

Critère de sortie : chaque connecteur dispose d’un test de connexion, d’un état visible et d’une désactivation propre.

## Phase 9 — Installation, sauvegarde et mises à jour

Livrables :

- Dossier `install/` complet.
- Diagnostic système.
- Sauvegarde automatisée.
- Restauration testée.
- Procédure de migration.
- Canaux Stable, Bêta et Développement.

Critère de sortie : une nouvelle installation peut être réalisée à partir de la documentation et vérifiée par une check-list.

## Phase 10 — Mise en production v1

- Tests fonctionnels complets.
- Test sur une intervention pilote.
- Formation de David, Bénédicte et Séverine.
- Correction des blocages.
- Gel de la version `1.0.0`.
- Sauvegarde initiale de production.

## Priorité immédiate

La priorité de développement suivante est :

1. Stockage abstrait et persistant.
2. Journal d’audit.
3. Gestionnaire de tâches.
4. Premier module Jarvis.
5. Tests du noyau.
