# MAVIK GCOS — Centre de Commandement

Statut : spécification fonctionnelle validée
Version cible : 0.36

## 1. Objectif

Le Centre de Commandement constitue l’écran d’accueil opérationnel de MAVIK. Il doit permettre au dirigeant de comprendre immédiatement la situation de l’entreprise, sans parcourir plusieurs modules.

## 2. Vue Aujourd’hui

La page d’accueil regroupe au minimum :

### Atelier
- Véhicules présents
- Véhicules en attente
- Interventions en cours
- Interventions terminées
- Dossiers incomplets

### Planning
- Rendez-vous du jour
- Réceptions
- Livraisons
- Départs
- Événements importants

### Commercial
- Devis à préparer
- Devis à envoyer
- Devis en attente de réponse
- Relances à effectuer
- Nouveaux prospects

### Stock
- Glace carbonique
- Produits Dinitrol
- Consommables
- Seuils d’alerte
- Risques de rupture

### Administratif
- Factures à éditer
- Paiements en attente
- Documents à signer
- Dossiers à compléter

## 3. Rôle de Jarvis

Jarvis agit comme chef d’orchestre du Centre de Commandement. Il doit :

- détecter les éléments prioritaires ;
- signaler les dossiers incomplets ;
- classer les actions par urgence ;
- regrouper les informations issues des différents modules ;
- expliquer pourquoi une action est prioritaire ;
- éviter les doublons de notifications.

Jarvis ne décide pas à la place du dirigeant. Il hiérarchise, synthétise et propose.

## 4. Niveaux de priorité

Les actions doivent être classées selon quatre niveaux :

1. Critique
2. Urgent
3. Aujourd’hui
4. Cette semaine

Chaque priorité doit comporter :

- un titre clair ;
- la source de l’information ;
- la raison de la priorité ;
- l’action attendue ;
- un accès direct au dossier concerné.

## 5. Centre de notifications

Les notifications sont centralisées dans une seule interface et peuvent provenir de :

- Atelier
- Commercial
- Clients
- Fournisseurs
- Banque
- Ressources humaines
- SAV
- Comptabilité
- Documents
- Stock

Chaque notification possède un statut :

- Nouvelle
- Vue
- En cours
- Terminée
- Ignorée avec justification

## 6. Indicateurs opérationnels

Le Centre de Commandement peut afficher notamment :

- nombre de devis réalisés ;
- taux d’acceptation ;
- nombre de véhicules traités ;
- temps moyen d’intervention ;
- chiffre d’affaires facturé ;
- délai moyen entre devis et intervention ;
- dossiers incomplets ;
- interventions en retard ;
- alertes de stock.

Ces indicateurs doivent rester lisibles et orientés vers l’action.

## 7. Mode Jarvis

L’écran d’accueil peut afficher une synthèse personnalisée :

> Bonjour David.

Puis :

- les trois actions les plus importantes ;
- les notifications critiques ;
- les rendez-vous du jour ;
- les véhicules présents ;
- les alertes de stock ;
- les dossiers nécessitant une validation.

## 8. Briefing du matin

Le Briefing du matin est une fonctionnalité validée du Centre de Commandement.

Chaque matin, Jarvis prépare automatiquement un résumé opérationnel contenant :

- ce qui a changé depuis la veille ;
- les rendez-vous de la journée ;
- les véhicules attendus ;
- les interventions en cours ;
- les devis et relances prioritaires ;
- les commandes à effectuer ;
- les paiements ou documents en attente ;
- les points de vigilance ;
- les éventuelles incohérences détectées.

Le briefing doit être court, hiérarchisé et directement exploitable.

## 9. Règles du briefing

- Ne pas répéter une information déjà clôturée.
- Ne pas créer de fausse urgence.
- Expliquer les alertes importantes.
- Donner un accès direct au dossier concerné.
- Signaler explicitement les informations manquantes.
- Différencier les faits des suggestions de Jarvis.
- Permettre de marquer une action comme traitée.

## 10. Première implantation technique

La première version doit :

1. agréger les données existantes sans les dupliquer ;
2. afficher les rendez-vous, interventions, devis, relances et alertes de stock ;
3. calculer les priorités selon des règles explicites ;
4. générer un briefing du matin ;
5. permettre l’ouverture directe de chaque dossier ;
6. conserver un historique des actions terminées.

## 11. Critères d’acceptation

- Le dirigeant comprend la situation du jour depuis un seul écran.
- Les trois principales priorités sont visibles immédiatement.
- Le briefing du matin est généré à partir de données réelles.
- Chaque alerte renvoie au dossier d’origine.
- Une action terminée disparaît des priorités actives sans être supprimée de l’historique.
- Les suggestions de Jarvis sont clairement distinguées des faits.
