# MAVIK GCOS — Passeport Patrimoine Premium

Statut : spécification fonctionnelle de référence
Version cible : 0.31 Pré-diagnostic client

## 1. Rôle du Passeport

Le Passeport Patrimoine est le document principal du véhicule dans MAVIK. Il constitue sa mémoire technique, documentaire et visuelle. Il doit être vivant, versionné et enrichi automatiquement à chaque intervention.

## 2. Principes obligatoires

- Une information n’est saisie qu’une seule fois.
- Le Passeport réutilise les données existantes : client, véhicule, intervention, devis, documents, médias, observations, consommations et déclarations du propriétaire.
- Aucun document n’est dupliqué : il est référencé depuis le Passeport.
- Le Passeport doit être ouvrable depuis tous les écrans pertinents de MAVIK.
- L’accès au Passeport ne doit jamais dépasser deux clics.
- La longueur du Passeport est dynamique selon la richesse du dossier.
- Le technicien saisit le minimum ; MAVIK et Jarvis structurent et rédigent le reste.
- MAVIK ne doit pas imposer de calendrier de contrôle automatique arbitraire.
- Les recommandations de suivi sont personnalisées selon l’état réel du véhicule, son usage et les constats réalisés.

## 3. Structure fonctionnelle

### 3.1 Couverture Premium

- Logo GentleCarE
- Titre du document
- Marque et modèle
- Immatriculation
- VIN
- Année
- Kilométrage
- Numéro du Passeport
- Version
- Date de génération
- QR code d’accès au dossier numérique

### 3.2 Identité du véhicule

- Marque
- Modèle
- Version
- Motorisation
- Couleur
- Immatriculation
- VIN
- Année
- Kilométrage
- Particularités
- Valeur ou rareté, lorsque pertinente

### 3.3 Pré-diagnostic client avant devis

Avant la validation et l’envoi d’un devis, MAVIK doit demander au client les problèmes connus du véhicule.

Le pré-diagnostic doit permettre de recueillir :

- l’historique connu du véhicule ;
- la durée de possession ;
- l’utilisation principale : quotidienne, loisir, collection, compétition ou autre ;
- les conditions de stockage : garage fermé, extérieur, bord de mer ou autre ;
- les problèmes connus ;
- les symptômes constatés ;
- les zones qui inquiètent le propriétaire ;
- les réparations ou restaurations antérieures connues ;
- les traitements anticorrosion déjà réalisés ;
- les accidents connus ;
- les priorités du client ;
- les commentaires libres ;
- les photographies transmises par le client ;
- la date de déclaration.

Catégories minimales de problèmes connus :

- corrosion visible ou supposée ;
- fuite moteur ;
- fuite de boîte ;
- fuite de pont ;
- fuite de direction assistée ;
- fuite de liquide de refroidissement ;
- fuite de frein ;
- bruit ;
- vibration ;
- grincement ;
- claquement ;
- protection anticorrosion ancienne ou inconnue ;
- réparation précédente ;
- autre anomalie.

Le devis ne doit pas être considéré comme complet tant que cette étape n’a pas été renseignée ou explicitement marquée comme « aucun problème connu déclaré ».

### 3.4 Déclarations du propriétaire

Les informations recueillies lors du pré-diagnostic sont conservées dans une rubrique permanente du Passeport intitulée « Déclarations du propriétaire ».

Pour chaque déclaration, MAVIK doit conserver :

- la description du client ;
- la catégorie ;
- la zone concernée ;
- la date ;
- les photographies associées ;
- le niveau d’inquiétude exprimé ;
- le lien avec le devis ;
- le lien avec l’intervention correspondante ;
- le constat GentleCarE ;
- le statut : confirmé, non constaté, à contrôler, nouvelle anomalie découverte ou résolu ;
- l’évolution constatée au fil des interventions.

### 3.5 Historique des interventions

Pour chaque intervention :

- Date
- Type de prestation
- Numéro d’intervention
- Techniciens
- Statut
- Résumé automatique
- Lien vers le rapport complet
- Lien vers les documents associés

### 3.6 État d’entrée

- Demande du client
- Problèmes connus déclarés avant devis
- État visuel
- Réserves
- Corrosion visible
- Dégradations visibles
- Photographies de réception
- Observations contradictoires

### 3.7 Diagnostic et observations

Chaque observation doit contenir :

- Catégorie
- Zone
- Description
- Recommandation
- Priorité
- Niveau de sévérité : vert, jaune, orange ou rouge
- Photo générale
- Gros plan
- Annotation éventuelle
- Décision prise
- Client informé ou non
- Suivi requis
- Lien éventuel avec une déclaration préalable du propriétaire

### 3.8 Protocole cryogénique

- Machine utilisée
- Buses
- Pression minimale et maximale
- Zones traitées
- Durée
- Quantité de glace carbonique
- Incidents ou limites

### 3.9 Protection Dinitrol

- Produits appliqués
- Numéros de lot
- Quantités
- Zones masquées
- Cavités
- Zones protégées
- Conditions d’application
- Temps de séchage

### 3.10 Avant / Après

- Comparaisons par zone
- Photo avant
- Photo après
- Commentaire technique
- Éléments restant visibles
- Résultat obtenu

### 3.11 Contrôle qualité

- Checklist finale
- Conformité au devis
- Réserves finales
- Nettoyage final
- Validation du responsable
- Date de validation

### 3.12 Conseils et suivi

- Recommandations personnalisées
- Surveillance conseillée
- Retouches éventuelles
- Limites de garantie
- Actions suggérées par Jarvis
- Justification technique de chaque recommandation

Aucune échéance fixe ne doit être générée automatiquement. Une date de contrôle ne peut être ajoutée que lorsqu’elle est décidée et validée explicitement par GentleCarE pour le véhicule concerné.

### 3.13 Certificat

- Numéro unique
- Signature
- Date
- QR code
- Empreinte ou hash du document
- Mention de version

### 3.14 Galerie et archive numérique

- Réception
- Photos fournies avant devis
- Avant
- Pendant
- Observations
- Après
- Livraison
- Vidéos
- Documents associés

## 4. Historique vivant

Le Passeport ne doit pas être recréé à zéro à chaque intervention. Il doit conserver l’historique et permettre :

- la comparaison entre interventions ;
- le suivi de la progression d’une corrosion ou anomalie ;
- la comparaison des photos d’une même zone ;
- la détection des observations résolues, stables ou aggravées ;
- la comparaison entre les problèmes déclarés et les constats GentleCarE ;
- la conservation de toutes les versions précédentes.

## 5. Accès universel dans MAVIK

Le Passeport doit être accessible depuis :

- la fiche client ;
- la fiche véhicule ;
- l’intervention ;
- le devis ;
- la facture ;
- le planning ;
- le centre documentaire ;
- la galerie ;
- la recherche globale ;
- Jarvis.

Chaque accès ouvre le même document et la même version de référence.

## 6. Automatisation par Jarvis

Jarvis doit pouvoir :

- détecter les informations manquantes ;
- empêcher l’envoi d’un devis sans pré-diagnostic renseigné ou refus explicite du client ;
- générer une checklist d’inspection à partir des problèmes connus ;
- identifier les zones sensibles à contrôler ;
- proposer les photographies obligatoires à prendre ;
- comparer les déclarations du client avec les constats atelier ;
- rédiger les résumés techniques ;
- classer les photos ;
- proposer les meilleures comparaisons avant/après ;
- transformer les observations brutes en texte client clair ;
- générer des recommandations personnalisées ;
- signaler les incohérences ;
- préparer le Passeport pour validation ;
- empêcher la publication d’un Passeport incomplet selon les règles définies.

## 7. Statuts du Passeport

- Brouillon
- Incomplet
- À valider
- Validé
- Publié
- Archivé
- Remplacé par une version ultérieure

## 8. Règles de versionnement

- Chaque génération crée une version traçable.
- Une version validée ne peut pas être modifiée silencieusement.
- Toute correction crée une nouvelle version.
- Les versions antérieures restent consultables.
- Le document publié indique toujours son numéro de version et sa date.

## 9. Première implantation technique

La première étape de développement doit réutiliser le moteur existant de rapport d’intervention, puis le faire évoluer vers :

1. un modèle de données Passeport ;
2. un modèle de pré-diagnostic rattaché au devis et au véhicule ;
3. une génération HTML Premium ;
4. une liaison avec les déclarations, observations et médias ;
5. une version durable par véhicule ;
6. une ouverture universelle depuis les modules concernés ;
7. un historique multi-interventions ;
8. une checklist Jarvis générée avant intervention.

## 10. Critères d’acceptation de la version 0.31

- Le pré-diagnostic est proposé avant la validation du devis.
- Le client peut déclarer ses problèmes connus et transmettre des photos.
- L’absence de problème connu peut être explicitement enregistrée.
- Les déclarations sont rattachées au client, au véhicule et au devis.
- Jarvis génère une checklist d’inspection à partir des déclarations.
- Les constats GentleCarE peuvent être comparés aux déclarations du propriétaire.
- Les déclarations apparaissent dans le Passeport Patrimoine.
- Aucune échéance de contrôle fixe n’est imposée automatiquement.
- Un Passeport peut être généré depuis une intervention.
- Il reprend automatiquement les données existantes.
- Il contient au minimum identité, déclarations, intervention, observations, médias, avant/après, contrôle qualité et recommandations.
- Il est versionné.
- Il est rattaché au véhicule.
- Il est ouvrable depuis la fiche véhicule et l’intervention.
- Jarvis détecte les champs manquants.
- Une version validée reste immuable.
