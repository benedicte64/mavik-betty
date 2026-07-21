# MAVIK Betty — mode vocal pour travailler sans vision

## Promesse

Une personne qui ne voit pas doit pouvoir ouvrir MAVIK, s’identifier, comprendre sa journée, poser une question et réaliser une tâche sans dépendre de l’écran.

Betty reste une IA : elle peut être chaleureuse, calme et fiable, mais ne prétend jamais être humaine. Elle indique ce qu’elle sait, d’où vient l’information et ce qui n’est pas connecté.

## Parcours livré

1. Betty demande qui veut travailler avec elle, à l’écrit et à la voix.
2. La personne peut dire son nom pour sélectionner son profil.
3. Elle choisit explicitement le mode **Tout à la voix**.
4. Betty pose une seule question à la fois : voix souhaitée, rythme, puis briefing au démarrage.
5. Le code peut être prononcé après activation volontaire du microphone. Betty indique seulement si quatre chiffres ont été compris ; elle ne les répète pas et ne les inscrit dans aucun journal.
6. Dans l’espace métier, **Parler à Betty** ou le raccourci `Alt+B` lance une écoute unique.
7. Betty répond à l’écrit et vocalement, puis demande **confirmer** ou **annuler** avant une écriture.

Le clavier, le lecteur d’écran et le texte restent disponibles à chaque étape. Aucun message essentiel ne dépend uniquement du son.

## Travail commun, puis modules d’activité

Le socle métier commun couvre :

- e-mails et réponses à préparer ;
- rendez-vous et conflits d’agenda ;
- commandes et fournisseurs ;
- devis et relances ;
- règlements et factures à suivre ;
- tâches et priorités.

Un module d’activité ajoute ensuite son vocabulaire, ses formulaires et ses règles sans changer l’identification, l’accessibilité, les droits par rôle, l’audit ou les confirmations.

## Niveau d’autonomie

| Demande | Betty peut faire | Validation |
|---|---|---|
| Lire, chercher, résumer, classer | Exécuter dans les sources autorisées | Non, sauf donnée particulièrement sensible |
| Préparer une réponse, un devis ou une commande | Produire un brouillon expliqué | Avant envoi ou engagement |
| Créer une tâche interne | Proposer puis enregistrer | Oui, oralement ou par bouton |
| Envoyer un e-mail, valider un devis, passer une commande | Exécuter seulement si le connecteur et le rôle l’autorisent | Oui, avec destinataire, montant et conséquence relus |
| Paiement ou changement financier | Préparer l’opération | Authentification forte et validation explicite ; la voix seule ne suffit pas |

## Vie privée et sécurité du code oral

La reconnaissance vocale dépend du navigateur. Selon l’appareil, l’audio peut être traité par un service externe. Le code oral est donc un recours d’accessibilité, désactivé par défaut dans le modèle vierge, et non la méthode recommandée pour une installation sensible.

La cible de production est une passkey WebAuthn ou une biométrie locale, avec récupération accessible. Tant qu’elle n’est pas disponible :

- le microphone ne démarre qu’après une action de la personne ;
- aucune écoute permanente ni phrase d’appel n’est activée ;
- le code n’est ni répété, ni affiché, ni journalisé ;
- quatre chiffres exacts sont obligatoires ;
- les tentatives restent limitées et temporairement bloquées ;
- une alternative clavier ou assistée demeure disponible.

## Ton et confiance

Betty varie sobrement son accueil. Elle peut répondre à « comment ça va ? », proposer de commencer calmement ou présenter la première priorité. Elle n’impose pas de conversation personnelle et ne prétend pas connaître la météo, les e-mails ou l’activité en temps réel si la source correspondante n’est pas connectée.

## Limites à valider avant qualification

- compatibilité de la reconnaissance vocale selon navigateur et appareil ;
- choix réellement prévisible d’une voix féminine ou masculine selon les voix installées ;
- compréhension des noms propres, accents et environnements bruyants ;
- parcours complet avec lecteur d’écran sans vision ;
- essais avec des personnes aveugles sur des tâches métier réelles ;
- remplacement prioritaire du code oral par WebAuthn ;
- phrase « Bonjour Betty » en écoute consentie, uniquement après étude de confidentialité et d’autonomie.

La cible de conception est [WCAG 2.2 niveau AA](https://www.w3.org/TR/WCAG22/). L’authentification forte future suivra [WebAuthn](https://www.w3.org/TR/webauthn-2/).
