# MAVIK GCOS — Passeport Patrimoine Premium

Statut : spécification fonctionnelle de référence
Version cible : 0.30 Foundation

## 1. Rôle du Passeport

Le Passeport Patrimoine est le document principal du véhicule dans MAVIK. Il constitue sa mémoire technique, documentaire et visuelle. Il doit être vivant, versionné et enrichi automatiquement à chaque intervention.

## 2. Principes obligatoires

- Une information n’est saisie qu’une seule fois.
- Le Passeport réutilise les données existantes : client, véhicule, intervention, devis, documents, médias, observations et consommations.
- Aucun document n’est dupliqué : il est référencé depuis le Passeport.
- Le Passeport doit être ouvrable depuis tous les écrans pertinents de MAVIK.
- L’accès au Passeport ne doit jamais dépasser deux clics.
- La longueur du Passeport est dynamique selon la richesse du dossier.
- Le technicien saisit le minimum ; MAVIK et Jarvis structurent et rédigent le reste.

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

### 3.3 Historique des interventions

Pour chaque intervention :

- Date
- Type de prestation
- Numéro d’intervention
- Techniciens
- Statut
- Résumé automatique
- Lien vers le rapport complet
- Lien vers les documents associés

### 3.4 État d’entrée

- Demande du client
- État visuel
- Réserves
- Corrosion visible
- Dégradations visibles
- Photographies de réception
- Observations contradictoires

### 3.5 Diagnostic et observations

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

### 3.6 Protocole cryogénique

- Machine utilisée
- Buses
- Pression minimale et maximale
- Zones traitées
- Durée
- Quantité de glace carbonique
- Incidents ou limites

### 3.7 Protection Dinitrol

- Produits appliqués
- Numéros de lot
- Quantités
- Zones masquées
- Cavités
- Zones protégées
- Conditions d’application
- Temps de séchage

### 3.8 Avant / Après

- Comparaisons par zone
- Photo avant
- Photo après
- Commentaire technique
- Éléments restant visibles
- Résultat obtenu

### 3.9 Contrôle qualité

- Checklist finale
- Conformité au devis
- Réserves finales
- Nettoyage final
- Validation du responsable
- Date de validation

### 3.10 Conseils et suivi

- Recommandations
- Surveillance
- Retouches
- Limites de garantie
- Date du prochain contrôle
- Actions suggérées par Jarvis

### 3.11 Certificat

- Numéro unique
- Signature
- Date
- QR code
- Empreinte ou hash du document
- Mention de version

### 3.12 Galerie et archive numérique

- Réception
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
- rédiger les résumés techniques ;
- classer les photos ;
- proposer les meilleures comparaisons avant/après ;
- transformer les observations brutes en texte client clair ;
- générer les recommandations ;
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
2. une génération HTML Premium ;
3. une liaison avec les observations et les médias ;
4. une version durable par véhicule ;
5. une ouverture universelle depuis les modules concernés ;
6. un historique multi-interventions.

## 10. Critères d’acceptation de la version 0.30

- Un Passeport peut être généré depuis une intervention.
- Il reprend automatiquement les données existantes.
- Il contient au minimum identité, intervention, observations, médias, avant/après, contrôle qualité et recommandations.
- Il est versionné.
- Il est rattaché au véhicule.
- Il est ouvrable depuis la fiche véhicule et l’intervention.
- Jarvis détecte les champs manquants.
- Une version validée reste immuable.
