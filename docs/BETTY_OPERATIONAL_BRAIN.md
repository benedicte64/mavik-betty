# Betty Operational Brain

## Objectif

Betty doit connaître l’activité par les événements réellement transmis à MAVIK, et non prétendre surveiller une entreprise sans source de données.

## Flux

1. Un connecteur transmet un événement au Bus d’Événements.
2. MAVIK enregistre sa source, sa date, son contenu utile et l’entreprise concernée.
3. Les secrets techniques sont masqués avant conservation.
4. Le cerveau opérationnel relie l’événement aux données métier autorisées.
5. Il recalcule la charge et classe les priorités avec une raison et un impact.
6. Betty présente les faits, les recommandations et les actions qu’elle peut préparer.
7. Toute action importante attend une validation humaine explicite.
8. Lorsque l’interface installée est ouverte, elle interroge le cerveau toutes les trente secondes et signale un changement de priorité.

## Sources prévues

- Gmail et autres services d’e-mail.
- Google Agenda, Outlook et flux iCal.
- CRM et devis.
- Stock et fournisseurs.
- Comptabilité et paiements.
- Téléphonie.
- Documents et contrats.
- Opérations métier.
- Analyses IA.
- Actions réalisées directement dans MAVIK.

## Transparence des données

- Chaque événement reçu est visible dans le journal pour les rôles autorisés.
- Le journal explique la source, le type, la date et le contenu reçu.
- Les mots de passe, codes, jetons, clés API et liens privés sont masqués.
- Une personne ne voit jamais les événements d’un autre service sans droit correspondant.
- Deux entreprises ne partagent jamais le même flux d’événements.
- La démonstration locale est identifiée comme fictive et n’affiche jamais une fausse surveillance en temps réel.

## API

- `POST /api/operations/connectors/events` : réception sécurisée d’un événement externe.
- `GET /api/operations/events` : journal filtré selon le rôle connecté.
- `GET /api/operations/status` : état réel des sources ayant transmis des événements.
- `GET /api/operations/brief` : charge, compteurs, priorités et recommandations expliquées.

Le point d’entrée des connecteurs reste fermé tant que la variable `MAVIK_EVENT_INGEST_TOKEN` n’a pas été définie sur le serveur. Le connecteur doit ensuite envoyer ce secret dans l’en-tête `X-MAVIK-Event-Token`.

## État actuel

Le bus, le journal, l’isolation, le calcul des priorités et le rafraîchissement automatique de l’interface sont fonctionnels. Les connecteurs externes doivent encore être autorisés et configurés un par un. Betty ne considère une source comme active qu’après réception effective d’un événement récent.

Les notifications lorsque l’interface MAVIK est complètement fermée ne sont pas encore actives. Elles demanderont un service de notification autorisé par l’entreprise et par chaque utilisateur.
