# Module — Pilotage d'une société de logiciels

## Objectif

Betty fournit à Avenor un espace de travail commun pour créer, vendre et maintenir des logiciels. Le module regroupe le suivi commercial, l'administration, la comptabilité, les produits et projets, la direction, les échanges internes et les agendas.

## Pôles métier

| Pôle | Responsabilités principales | Données de référence |
|---|---|---|
| Commercial | Prospects, opportunités, abonnements, relances et rendez-vous | `clients`, `opportunities`, `subscriptions`, `meetings` |
| Secrétariat | Accueil, réunions, contrats, tâches transverses et suivi administratif | `meetings`, `contracts`, `tasks`, `communications` |
| Comptabilité | Factures clients, dépenses, échéances et revenus récurrents | `invoices`, `expenses`, `subscriptions` |
| Produit & développement | Catalogue logiciel, projets, versions et tickets de support | `softwareProducts`, `softwareProjects`, `supportTickets`, `tasks` |
| Direction | Indicateurs consolidés, arbitrages et priorités | Synthèse des collections précédentes |

## Discussion interne

La messagerie interne est organisée par canaux : général, commercial, secrétariat, comptabilité, produit & développement et direction. Le canal direction est réservé aux rôles autorisés. Chaque message est horodaté, rattaché à son auteur et conservé dans le stockage MAVIK.

## Agenda unifié

Le pont d'agenda accepte plusieurs calendriers Google, Outlook ou iCal. Chaque source conserve son nom, sa couleur et son fournisseur. Les URL iCal privées sont stockées côté serveur et toujours masquées dans les réponses de l'API.

La connexion réelle nécessite l'autorisation du compte concerné ou une URL iCal privée fournie par l'utilisateur. Aucun identifiant ni mot de passe ne doit être enregistré dans le code ou dans les données de démonstration.

## Séparation des profils

Le profil Avenor / Betty contient uniquement des exemples liés à la création et à la vente de logiciels. Les données de production GentleCarE restent dans le profil GentleCarE / Jarvis et ne doivent jamais être injectées dans la démonstration Betty.

## Mode de démonstration

Sur GitHub Pages, les données d'exemple restent dans le navigateur. Sur une installation serveur, elles sont stockées dans les collections locales et protégées par les rôles. Le jeu de démonstration ne peut être initialisé que par la direction.
