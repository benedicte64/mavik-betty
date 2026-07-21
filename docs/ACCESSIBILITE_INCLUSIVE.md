# MAVIK Betty — accessibilité inclusive par profil

## Ambition

MAVIK Betty doit permettre à une personne de travailler, créer, décider et communiquer avec le plus d'autonomie possible, quelles que soient ses capacités visuelles, auditives, motrices, cognitives ou d'élocution.

Betty ne demande pas à l'utilisateur de déclarer un diagnostic. Elle demande comment il préfère :

- lire et percevoir l'information ;
- entendre ou recevoir une transcription ;
- s'exprimer ;
- naviguer et déclencher une action ;
- comprendre, confirmer et revenir en arrière.

Plusieurs choix peuvent être combinés. Ils appartiennent au profil de la personne, pas au poste de travail ni au rôle métier.

## Socle livré dans cette étape

- accueil écrit et vocal, avec alternative écrite permanente ;
- lien d'accès direct au contenu pour le clavier et les technologies d'assistance ;
- affichage agrandi, contraste renforcé et interface simplifiée ;
- arrêt des mouvements et animations ;
- grandes zones d'action ;
- présentation allégée pour un parcours au lecteur d'écran ;
- alertes visuelles renforcées ;
- mode texte uniquement ;
- outil **Ma voix** : l'utilisateur écrit jusqu'à 600 caractères et Betty les prononce localement sur l'appareil ;
- mémorisation séparée des préférences pour chaque utilisateur ;
- options désactivées tant que l'utilisateur ne les choisit pas.
- mode **Tout à la voix** par profil, avec choix d'un rythme calme, doux ou normal ;
- sélection du profil et saisie du code oral après activation volontaire du microphone ;
- bouton permanent **Parler à Betty** et raccourci `Alt+B` ;
- briefing vocal optionnel sur les e-mails, rendez-vous, commandes, devis, règlements et tâches ;
- confirmation ou annulation orale avant toute écriture proposée par Betty.

La synthèse vocale de **Ma voix** utilise le moteur disponible dans le navigateur ou l'appareil. MAVIK ne conserve pas le texte saisi. Pour des informations sensibles, l'installation devra sélectionner et vérifier une voix fonctionnant hors ligne, car le traitement exact dépend du navigateur et du système.

## Ce que cette étape ne prétend pas encore résoudre

La présence de réglages ne constitue pas une certification. Un audit technique et des essais avec des personnes concernées restent nécessaires.

Les capacités suivantes restent à prototyper puis à valider avant toute activation :

- transcription continue ou multi-intervenants de la parole vers le texte ;
- phrase d'appel en écoute continue ;
- langue des signes avec interprétation humaine ou avatar validé ;
- navigation par contacteur avec défilement contrôlé ;
- pilotage oculaire et compatibilité avec les dispositifs AAC/CAA ;
- vibration et signaux haptiques sur les appareils compatibles ;
- identification sans code par passkey, dispositif matériel ou parcours assisté ;
- réglages de vitesse, pauses, vocabulaire et charge cognitive ;
- documents, tableaux, graphiques et pièces jointes avec alternatives accessibles.

## Règles de conception

1. Aucun message essentiel ne dépend uniquement du son, de la couleur, d'une animation ou de la position à l'écran.
2. Toutes les actions restent possibles au clavier et doivent conserver un focus visible.
3. Betty affiche toujours ce qu'elle dit et explique toujours ce qu'elle va modifier.
4. Une préférence d'accessibilité ne donne jamais de droit métier supplémentaire.
5. Une action importante demande la même validation humaine, quel que soit le mode d'interaction.
6. Les préférences sont réversibles et conservées séparément pour chaque utilisateur.
7. Les nouveautés sont testées avec des utilisateurs concernés avant d'être qualifiées d'éprouvées.
8. La voix seule ne suffit jamais pour un paiement ou une opération financière sensible.
9. Betty ne prétend jamais disposer d'une source réelle qui n'est pas connectée.

Le parcours détaillé pour une personne aveugle est décrit dans `MODE_VOCAL_AVEUGLE.md`.

## Référentiels de contrôle

La cible de conception est WCAG 2.2 niveau AA. Pour le contexte français, le contrôle doit aussi suivre la méthode RGAA 4.1.2 actuellement publiée. Les critères automatisables doivent être intégrés à la CI, mais l'audit clavier, lecteur d'écran, zoom, contraste, compréhension et essais utilisateurs reste humain.

Le détail des références WCAG, EN 301 549 et RGAA, ainsi que la barrière de livraison, est consigné dans [`SOCLE_ACCESSIBILITE.md`](./SOCLE_ACCESSIBILITE.md).

## Prochaine recette prioritaire

Organiser cinq parcours de test : lecteur d'écran sans vision, texte seul sans son, communication par **Ma voix**, clavier ou contacteur sans souris, et interface simplifiée. Pour chaque parcours : se connecter, ouvrir son espace métier, demander une tâche à Betty, créer un brouillon, confirmer ou annuler, puis changer les préférences sans assistance technique.
