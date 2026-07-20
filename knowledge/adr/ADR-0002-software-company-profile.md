# ADR-0002 — Organisation de la société de logiciels

- Statut : accepté
- Date : 2026-07-20

## Contexte

Le profil de démonstration Avenor / Betty doit représenter le fonctionnement complet d'une société qui crée, commercialise et maintient des logiciels, sans reprendre les données métier de GentleCarE.

## Décision

Le moteur MAVIK conserve une seule base de code et ajoute un profil opérationnel organisé en cinq pôles : commercial, secrétariat, comptabilité, produit & développement et direction.

Les données sont structurées dans des collections dédiées aux opportunités, logiciels, projets, abonnements, factures, dépenses, contrats, tickets de support et réunions. La messagerie utilise des canaux d'équipe. L'agenda accepte plusieurs sources Google, Outlook ou iCal via un pont serveur qui masque les adresses privées.

## Conséquences

- La démonstration Betty peut couvrir le cycle prospect → vente → abonnement → facturation → support.
- Les droits peuvent être attribués par fonction sans donner un accès administrateur global.
- Les agendas restent utilisables en mode démonstration, mais leur connexion réelle exige une autorisation explicite du propriétaire du compte.
- Toute donnée GentleCarE demeure exclue du profil Avenor / Betty.
