# GCOS v1 — Spécification produit officielle

Statut : **référence validée**  
Version : **1.0**  
Produit : **GCOS — GentleCarE Operating System**

## 1. Finalité

GCOS est le système d’exploitation métier de GentleCarE. Il centralise le pilotage de l’entreprise, les opérations atelier, les clients, les véhicules, les documents, le stock, la maintenance, le planning, les finances et l’assistant Jarvis.

La version 1 doit permettre à GentleCarE de gérer une intervention automobile complète, depuis la prise de contact jusqu’à l’archivage du rapport final.

## 2. Principes obligatoires

- Architecture modulaire et évolutive.
- Noyau stable, modules indépendants et plugins activables.
- Compatibilité avec les mises à jour futures.
- Sauvegarde avant migration.
- Traçabilité de toutes les actions sensibles.
- Validation humaine avant envoi, paiement, suppression ou modification critique.
- Comptes individuels et droits par rôle.
- Fonctionnement adapté à l’iPhone, à la tablette et à l’ordinateur.
- Données exportables afin d’éviter toute dépendance technique irréversible.

## 3. Utilisateurs et rôles initiaux

### David — Direction
Accès complet, configuration, validation, finances, atelier, fournisseurs et administration.

### Bénédicte — Direction / Commercial
CRM, devis, clients, planning, documents commerciaux et accès financier selon les permissions définies.

### Séverine — Opérations
Atelier, livraisons, préparation des véhicules, logistique, community management et distribution Dinitrol selon les permissions définies.

### Technicien
Accès aux interventions affectées, check-lists, photos, consommations et contrôle qualité.

## 4. Modules v1

### 4.1 Tableau de bord

- Planning du jour.
- Véhicules attendus et présents.
- Interventions en cours.
- Tâches prioritaires.
- Alertes de stock et de maintenance.
- Devis en attente.
- Dossiers à facturer.
- Activité récente de Jarvis.

### 4.2 CRM

- Fiche client 360°.
- Coordonnées et consentements.
- Historique des échanges.
- Véhicules liés.
- Devis, interventions, factures et documents.
- Club, remise et statut commercial.
- Recherche globale.

### 4.3 Véhicules

- Marque, modèle, année, immatriculation, VIN et kilométrage.
- Photos et historique.
- Zones sensibles et observations.
- Interventions passées et futures.

### 4.4 Atelier

Cycle obligatoire :

1. Création ou sélection du client.
2. Création ou sélection du véhicule.
3. Planification.
4. Contrôle d’entrée.
5. Photos avant.
6. Préparation du véhicule.
7. Cryonettoyage.
8. Contrôle intermédiaire.
9. Traitement Dinitrol si prévu.
10. Contrôle qualité.
11. Photos après.
12. Validation responsable.
13. Rapport final.
14. Facturation.
15. Archivage.

Données opérationnelles :

- Opérateur.
- Temps passé.
- Quantité de glace utilisée.
- Pression et paramètres utiles.
- Produits Dinitrol, quantités et lots.
- Anomalies.
- Signatures et validations.

### 4.5 Planning

- Rendez-vous client.
- Affectation des opérateurs.
- Durée prévisionnelle et réelle.
- Blocage des ressources.
- Statuts de présence du véhicule.
- Détection des conflits.

### 4.6 Stock

- Glace carbonique.
- Produits Dinitrol.
- Consommables.
- EPI.
- Pièces et fournitures.
- Seuils minimums.
- Entrées, sorties et inventaires.
- Décrémentation automatique depuis les interventions.

### 4.7 Maintenance

- IBL et machines cryogéniques.
- Compresseurs.
- Matériel de levage.
- Aspirateurs, éclairage et outillage.
- Heures d’utilisation.
- Échéances préventives.
- Contrôles réglementaires.
- Historique des coûts et réparations.

### 4.8 Documents

- Devis.
- Rapports d’intervention.
- Certificats.
- Factures.
- Photos et pièces jointes.
- Modèles versionnés.
- Export PDF.

### 4.9 Finance

- Chiffre d’affaires.
- Marge par prestation.
- Coûts de glace et de produits.
- Dossiers à facturer.
- Suivi des règlements.
- Indicateurs mensuels.

La comptabilité officielle reste assurée par les outils et professionnels comptables connectés.

### 4.10 Jarvis

Jarvis agit comme assistant d’orchestration :

- Synthèse des informations.
- Priorisation des tâches.
- Détection des étapes manquantes.
- Alertes et recommandations.
- Préparation de brouillons.
- Recherche métier.
- Assistance vocale lorsque disponible.

Jarvis ne doit pas exécuter seul une action sensible sans validation explicite.

## 5. Noyau technique

Le noyau GCOS comprend :

- Gestion des utilisateurs.
- Authentification.
- Rôles et permissions.
- Registre des modules.
- Bus d’événements.
- Configuration centralisée.
- Journal d’audit.
- Stockage et synchronisation.
- API interne.
- Sauvegarde, restauration et migrations.

## 6. Entités principales

- Company
- Site
- User
- Role
- Permission
- Client
- Vehicle
- Appointment
- Intervention
- InterventionStep
- Photo
- Product
- StockMovement
- Equipment
- MaintenanceEvent
- Quote
- Invoice
- Payment
- Document
- Task
- Notification
- Workflow
- Connector
- AuditLog

Chaque entité doit posséder un identifiant stable, des dates de création et de modification, ainsi qu’une trace de l’utilisateur responsable lorsque cela est pertinent.

## 7. Sécurité

- HTTPS obligatoire en production.
- Mots de passe ou authentification forte selon le mode de déploiement.
- Double authentification pour les comptes de direction lorsque disponible.
- Séparation des droits.
- Journalisation des actions critiques.
- Sauvegardes chiffrées.
- Aucune clé secrète dans le code source.
- Gestion centralisée des secrets et connecteurs.
- Politique de conservation et suppression des données.

## 8. Mises à jour

GCOS utilise le versionnement sémantique :

- Correctif : `1.0.1`.
- Fonction compatible : `1.1.0`.
- Rupture majeure : `2.0.0`.

Chaque mise à jour doit :

1. Vérifier les prérequis.
2. Sauvegarder les données.
3. Contrôler la compatibilité des modules.
4. Appliquer les migrations.
5. Exécuter les tests de santé.
6. Permettre un retour arrière documenté lorsque techniquement possible.

Canaux prévus :

- Stable.
- Bêta.
- Développement.

## 9. Installation et diagnostic

Le dépôt doit contenir une documentation précisant :

- Configuration minimale et recommandée des postes.
- Configuration serveur.
- Connexion Internet et réseau local.
- Navigateurs et applications nécessaires.
- Base de données.
- Sauvegardes.
- Sécurité.
- Procédure de mise à jour.
- Check-list de mise en service.

Un diagnostic automatique devra contrôler au minimum :

- Mémoire disponible.
- Espace disque.
- Accès réseau.
- Base de données.
- Sauvegardes.
- Certificats HTTPS.
- Connecteurs externes.
- Modules installés.

## 10. Connecteurs prévus

- Airtable.
- Gmail.
- Google Calendar.
- Google Drive ou stockage documentaire équivalent.
- Qonto ou export bancaire compatible.
- Signature électronique.
- Paiement en ligne.

Chaque connecteur doit pouvoir être activé, configuré, testé et désactivé indépendamment.

## 11. Critères d’acceptation de la v1

La version 1 est considérée exploitable lorsque :

- Chaque utilisateur possède un compte et des droits adaptés.
- Un client et son véhicule peuvent être créés.
- Une intervention peut être planifiée et affectée.
- Toutes les étapes atelier peuvent être validées.
- Les photos avant et après sont rattachées au dossier.
- Les consommations principales sont enregistrées.
- Un rapport final peut être généré.
- Le dossier peut passer en facturation puis être archivé.
- Les actions importantes apparaissent dans le journal d’audit.
- Une sauvegarde et une restauration ont été testées.

## 12. Hors périmètre initial

- Autonomie totale de Jarvis sans validation humaine.
- Comptabilité réglementaire complète.
- Marketplace publique complète.
- Déploiement immédiat dans cent ateliers.
- IA de diagnostic mécanique certifiée.

Ces fonctions pourront être développées après stabilisation du socle v1.
