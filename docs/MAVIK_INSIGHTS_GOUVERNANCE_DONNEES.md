# Mavik Insights — Gouvernance des données

## 1. Objet

Mavik Insights est le dispositif d’intelligence métier de la plateforme Mavik. Il collecte des événements d’usage et des indicateurs opérationnels afin d’améliorer Jarvis, produire des références sectorielles et créer des services statistiques commercialisables.

Le système est conçu pour maximiser la valeur analytique sans constituer ni commercialiser un fichier de personnes identifiables.

## 2. Gouvernance

- Avenor reste seul propriétaire et responsable du moteur Mavik Insights.
- Les clients Mavik peuvent consulter les finalités, activer ou désactiver les catégories optionnelles et exercer leurs droits selon les règles applicables.
- Les clients ne peuvent pas modifier le moteur de collecte, les schémas, l’anonymisation ou les algorithmes d’agrégation.
- Toute évolution du dispositif est décidée, développée et déployée par Avenor.

## 3. Données pouvant être collectées

### Activité et performance

- type de prestation ;
- durée prévue et durée réelle ;
- temps de travail, d’attente, de séchage et de contrôle ;
- retards, avances et causes métier normalisées ;
- taux d’occupation des postes, ponts, cabines et espaces de livraison ;
- taux de transformation devis/commande ;
- taux d’annulation, report et retour ;
- fréquence et nature des contrôles qualité ;
- satisfaction agrégée ;
- saisonnalité et tendances géographiques larges.

### Véhicules et interventions

- catégorie, marque, modèle, année et énergie lorsqu’ils sont nécessaires à l’analyse ;
- kilométrage par tranche ;
- niveau de corrosion ou d’encrassement selon une échelle normalisée ;
- produits et quantités consommés ;
- procédures appliquées ;
- résultat technique et anomalies constatées ;
- fréquence de réintervention.

### Stocks, achats et équipements

- consommations moyennes ;
- ruptures et seuils ;
- délais fournisseurs ;
- prix unitaires agrégés ;
- disponibilité des équipements ;
- pannes, maintenances et temps d’immobilisation.

### Usage de Mavik et Jarvis

- modules consultés ;
- temps de réponse ;
- erreurs techniques ;
- fréquence d’utilisation des fonctions ;
- taux de réussite des recherches ;
- recours à la voix ou au clavier ;
- demandes nécessitant une reformulation ;
- procédures les plus consultées ;
- efficacité des suggestions de Jarvis.

## 4. Données exclues du dispositif analytique

Ne doivent jamais être transmises dans le flux Mavik Insights :

- numéros de carte bancaire, cryptogrammes ou données de paiement complètes ;
- mots de passe, clés privées, jetons d’accès ou secrets techniques ;
- pièces d’identité complètes ;
- coordonnées bancaires complètes ;
- contenu privé sans rapport avec l’activité professionnelle ;
- données de santé, opinions politiques, religion, vie sexuelle ou autres catégories sensibles, sauf obligation légale distincte et architecture dédiée ;
- corps complets des emails, documents, photos ou enregistrements audio ;
- noms, emails, téléphones, adresses postales précises ou immatriculations en clair.

## 5. Pseudonymisation et minimisation

Avant transmission :

1. les identifiants locaux sont remplacés par des identifiants pseudonymes ;
2. les données directement identifiantes sont supprimées ;
3. les dates peuvent être arrondies selon la finalité ;
4. les localisations sont limitées à une zone suffisamment large ;
5. les nombres faibles sont regroupés afin d’éviter la réidentification ;
6. les textes libres sont exclus par défaut du flux analytique.

Un identifiant pseudonyme ne doit pas permettre à un acheteur de données d’identifier une personne. La table de correspondance, lorsqu’elle est indispensable au fonctionnement local, reste dans l’environnement client et n’est pas exportée.

## 6. Niveaux de collecte

- **Essentiel** : sécurité, disponibilité, erreurs, compatibilité et statistiques strictement nécessaires au service.
- **Amélioration produit** : usages fonctionnels, performances, succès des recherches et efficacité des recommandations.
- **Intelligence sectorielle** : indicateurs métier agrégés destinés aux benchmarks, études et produits statistiques.

Les niveaux optionnels doivent être gérés par une configuration explicite, historisée et vérifiable.

## 7. Produits commercialisables

Avenor peut produire et commercialiser :

- tableaux de référence sectoriels ;
- indices de prix et de durée ;
- tendances de consommation ;
- benchmarks de productivité ;
- analyses de saisonnalité ;
- indicateurs de fiabilité ou de maintenance ;
- modèles prédictifs entraînés sur des données suffisamment agrégées ;
- études personnalisées ne permettant pas d’identifier un client final ou une entreprise sans autorisation spécifique.

Aucune donnée brute identifiante ne doit être revendue.

## 8. Contrôles obligatoires

- journalisation des collectes et transmissions ;
- registre des versions de schéma ;
- contrôle automatique des champs interdits ;
- chiffrement en transit et au repos ;
- limitation des accès par rôle ;
- conservation limitée selon la finalité ;
- procédure d’effacement et d’export ;
- audit régulier de réidentification ;
- validation Avenor avant toute mise à disposition à un tiers.

## 9. Règle produit

Mavik Insights collecte le maximum d’informations opérationnelles utiles, mais jamais au prix de la sécurité, de la conformité ou de la confiance. La valeur commerciale provient de l’agrégation, de la qualité des modèles et de la profondeur des analyses, non de la revente de fichiers nominatifs.
