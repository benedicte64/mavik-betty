# Changelog MAVIK GCOS

Toutes les évolutions fonctionnelles, architecturales et documentaires significatives sont consignées ici.

## 2026-07-20 — Betty pour société de logiciels

### Ajouté
- Tableau de bord Avenor / Betty avec cinq espaces : Commercial, Secrétariat, Comptabilité, Produit & développement et Direction.
- Cycle de gestion des opportunités, logiciels, projets, abonnements, factures, dépenses, contrats, tickets de support et réunions.
- Messagerie interne par canaux d'équipe.
- Agenda unifié multi-source compatible avec les flux privés Google, Outlook et iCal.
- Rôles dédiés commercial, secrétariat, comptabilité, développement et support.

### Sécurité et données
- Les adresses privées des agendas sont masquées par l'API.
- Les données d'exemple Avenor sont séparées des données de production GentleCarE.
- La connexion effective d'un compte agenda reste soumise à l'autorisation explicite de son propriétaire.

### Tests
- Ajout d'un test de fumée du profil société de logiciels et de la synchronisation multi-agenda.
- Extension des tests de messagerie aux canaux internes.
- Suppression de l'ancien workflow GitHub Pages en double, qui pouvait annuler le déploiement officiel.
- Validation complète obligatoire avant toute publication GitHub Pages sur `main`.

## 2026-07-20 — Fondation MAVIK OS

### Ajouté
- Document fondateur `00_MAVIK_OS_FOUNDATION.md`.
- Formalisation des dix lois de MAVIK.
- Définition du modèle relationnel métier et du moteur de contexte.
- Définition des règles de traçabilité, validation humaine, sécurité et confidentialité.
- Consolidation des modules CRM, Atelier, Mission Control, Jarvis, Mémoire, Bibliothèque technique, Gestion documentaire, Jumeau numérique et Réseau GentleCarE.
- Roadmap consolidée de v0.30 à v10.x.

### Décisions
- MAVIK est défini comme le système d’exploitation intelligent du patrimoine automobile.
- Jarvis assiste, explique et contrôle ; la décision finale reste humaine.
- Le pré-diagnostic devient une étape structurante avant devis lorsqu’il est pertinent.
- Une information métier doit avoir une source de vérité unique et être réutilisée sans duplication.
- Toute nouvelle fonctionnalité doit faire gagner du temps, réduire les erreurs ou créer de la valeur, sous réserve des exigences de sécurité et d’intégrité.

### Documentation antérieure intégrée à la vision
- Passeport Patrimoine.
- Pré-diagnostic client et déclarations du propriétaire.
- Dossier Patrimoine.
- Workflow atelier et verrouillage qualité.
- Base de connaissances Jarvis.
- Assistant décisionnel.
- Mission Control et briefing du matin.
- Mémoire de l’entreprise.
- Jumeau numérique du véhicule.
- Réseau intelligent GentleCarE.
- Bêta Atelier et plateforme v1.0.
