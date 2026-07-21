# Changelog MAVIK GCOS

Toutes les évolutions fonctionnelles, architecturales et documentaires significatives sont consignées ici.

## 2026-07-21 — Betty voix d’abord pour une personne aveugle

### Ajouté

- Sélection du profil par la voix et code oral à quatre chiffres, sans répétition, affichage ni journalisation du secret.
- Parcours de première connexion question par question : voix, rythme et briefing de démarrage.
- Bouton permanent **Parler à Betty**, raccourci `Alt+B`, réponses vocales et confirmation orale des écritures.
- Accueil varié et sobre, petite conversation, réponse honnête lorsque la météo ou une source réelle n’est pas connectée.
- Briefing métier commun sur e-mails, rendez-vous, commandes, devis, règlements et tâches, filtré par rôle.
- Documentation de sécurité, limites navigateur et priorité future donnée à WebAuthn.
- Le serveur de démonstration passe en version `0.36.0`.

### Sécurité et limites

- Le microphone ne démarre qu’après une action de la personne ; aucune écoute permanente n’est activée.
- Le code oral reste un recours d’accessibilité : le navigateur peut traiter la voix avec un service externe.
- Une passkey ou une biométrie locale est la cible recommandée ; un paiement ne peut jamais être validé par la seule voix.
- Le mode reste candidat tant qu’il n’a pas été testé avec des personnes aveugles sur plusieurs appareils.

## 2026-07-21 — Betty inclusive par profil

### Ajouté

- Préférences combinables par utilisateur, sans demander de diagnostic : texte seul, alertes visuelles, mouvements réduits, grandes zones d'action et priorité lecteur d'écran.
- Outil **Ma voix** : la personne écrit une phrase et Betty la prononce localement sur son appareil.
- Liens d'accès direct, messages écrits permanents et renforcement du parcours clavier.
- Mémorisation et normalisation côté serveur des préférences d'accessibilité, sans modifier les droits métier.
- Catalogue neutre et backlog pour les futures instances MAVIK, toutes options désactivées par défaut.
- Le serveur de démonstration passe en version `0.35.0`.

### Limites assumées

- Cette étape ne vaut pas certification RGAA ou WCAG.
- Transcription en direct, langue des signes, contacteur, pilotage oculaire, dispositifs de CAA et alternatives au code PIN restent à prototyper et à tester avec les personnes concernées.

## 2026-07-20 — Betty Operational Brain

### Ajouté
- Bus d’Événements persistant pour recevoir et rendre visibles les événements Gmail, Agenda, CRM, Stock, Comptabilité, Téléphonie, Documents, Opérations, IA et MAVIK.
- Cerveau opérationnel qui relie les événements aux données métier, calcule la charge et classe les priorités avec une explication.
- Rafraîchissement automatique de l’interface toutes les trente secondes avec signalement d’une nouvelle priorité.
- Journal visible selon le rôle, isolation par entreprise, déduplication des événements et masquage des secrets techniques.
- Point d’entrée sécurisé pour les futurs connecteurs et API de synthèse, statut et consultation des événements.

### Transparence
- La démonstration indique clairement qu’elle ne surveille aucun système réel.
- Betty n’annonce une analyse en temps réel que lorsqu’au moins une source a effectivement transmis un événement.
- Les actions préparées restent soumises à validation lorsqu’elles ont un impact sur l’entreprise.
- Le serveur passe en version `0.34.0`.

## 2026-07-20 — Betty Core v1

### Transformé
- La spécification décisionnelle V1 est réécrite comme fondation Betty Core pour Avenor, sans identité ni donnée d’un client.
- Les modules deviennent Direction, Commercial, Secrétariat, Comptabilité, Produit, Support, Agenda, Discussion et Documents.
- Betty dispose désormais d’une mémoire persistante, d’un journal d’audit, de notifications par rôle et de recommandations expliquées.
- Les créations demandées en conversation nécessitent une confirmation humaine explicite avant écriture.

### Technique
- Ajout des API `/api/betty/brief`, `/api/betty/command`, `/api/betty/memory` et `/api/betty/audit`.
- La discussion de l’interface Avenor utilise Betty Core lorsque le serveur MAVIK est installé et conserve un mode démonstration local.
- Le serveur de démonstration passe en version `0.33.0`.

## 2026-07-20 — Betty adaptative et profils métiers

### Ajouté
- Betty demande dès l’identification, à l’écrit et vocalement, qui veut travailler avec elle.
- Sélection visuelle du profil, grand pavé numérique, clavier et commande adaptée.
- À la première connexion, l’utilisateur confirme son identité puis choisit et confirme son propre code.
- Bouton Profil, quatre adaptations d’interface et ouverture automatique de l’espace correspondant au rôle.

### Sécurité
- Limitation des tentatives de code avant verrouillage temporaire.
- Les codes restent dérivés et ne sont jamais conservés en clair.

## 2026-07-20 — Betty pour société de logiciels

### Ajouté
- Tableau de bord Avenor / Betty avec cinq espaces : Commercial, Secrétariat, Comptabilité, Produit & développement et Direction.
- Mascotte officielle Betty intégrée dans l'interface avec une animation douce sur ses patins.
- Cycle de gestion des opportunités, logiciels, projets, abonnements, factures, dépenses, contrats, tickets de support et réunions.
- Messagerie interne par canaux d'équipe.
- Agenda unifié multi-source compatible avec les flux privés Google, Outlook et iCal.
- Rôles dédiés commercial, secrétariat, comptabilité, développement et support.

### Sécurité et données
- Les adresses privées des agendas sont masquées par l'API.
- Les données d'exemple Avenor sont séparées des données de production GentleCarE.
- La connexion effective d'un compte agenda reste soumise à l'autorisation explicite de son propriétaire.
- L'animation peut être mise en pause et respecte automatiquement la préférence système de réduction des mouvements.

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
