# Socle de référence accessibilité de MAVIK Betty

## Décision

MAVIK Betty adopte un double niveau de référence :

- **cible de conception et de développement** : WCAG 2.2 niveau AA ;
- **contrôle réglementaire et contractuel** : version applicable de l'EN 301 549 et méthode française RGAA 4.1.2.

Ce socle s'applique à Betty et à toute capacité rendue générique pour un futur MAVIK client. Il ne constitue pas, à lui seul, une déclaration de conformité. Une telle déclaration exige un audit représentatif, des preuves et des essais avec des personnes concernées.

## Les trois références

### 1. WCAG 2.2 — la cible technique internationale

Les WCAG reposent sur quatre principes : contenu **perceptible**, interface **utilisable**, information **compréhensible** et implémentation **robuste**.

MAVIK vise le niveau AA de WCAG 2.2. Cette version est rétrocompatible avec WCAG 2.1 et ajoute notamment des exigences utiles à Betty sur le focus non masqué, les gestes de glissement, la taille minimale des cibles et l'authentification accessible.

Référence officielle : <https://www.w3.org/TR/WCAG22/>.

### 2. EN 301 549 v3.2.1 — la référence européenne TIC

L'EN 301 549 v3.2.1 couvre les produits et services numériques, y compris les pages web, documents non web et logiciels non web. Pour les pages web, ses clauses 9.1 à 9.4 et 9.6 correspondent à WCAG 2.1 niveau AA.

Elle ne doit donc pas être présentée comme une transposition de WCAG 2.2. MAVIK conçoit selon WCAG 2.2 AA tout en conservant une matrice de preuve vers les clauses applicables de l'EN 301 549.

Référence officielle : <https://www.etsi.org/deliver/etsi_en/301500_301599/301549/03.02.01_60/en_301549v030201p.pdf>.

### 3. RGAA 4.1.2 — la méthode française de vérification

La méthode technique RGAA 4.1.2 comporte 106 critères répartis en 13 thématiques. Elle fournit une méthode opérationnelle d'audit alignée sur WCAG 2.1. Elle n'est pas une simple traduction de l'EN 301 549 et ne couvre pas les applications mobiles natives.

Références officielles :

- <https://accessibilite.numerique.gouv.fr/methode/introduction/> ;
- <https://accessibilite.numerique.gouv.fr/methode/criteres-et-tests/>.

Le RGAA 5 est annoncé pour fin 2026. Cette évolution reste sous veille ; elle ne remplace pas le référentiel publié tant que sa version définitive n'est pas disponible.

## Exigences prioritaires du mode voix d'abord

| Domaine | Exigence MAVIK Betty | Preuve attendue |
|---|---|---|
| Alternatives | Toute image, icône, donnée visuelle ou graphique utile possède un équivalent textuel pertinent. | Audit DOM, lecteur d'écran et revue éditoriale. |
| Structure | Un seul titre principal pertinent, puis une hiérarchie de titres et de régions cohérente. | Navigation par titres et régions avec NVDA, VoiceOver ou TalkBack. |
| Navigation | Toutes les fonctions restent utilisables au clavier ; la voix est un mode supplémentaire, jamais l'unique issue. | Parcours complet sans souris et ordre de focus documenté. |
| Dynamique | Tout changement important est annoncé sans déplacer le focus de façon imprévisible. | Vérification des zones `aria-live`, rôles de statut et gestion du focus. |
| Parole | Ce que Betty dit existe aussi sous forme textuelle ; l'écoute et la parole disposent d'un arrêt immédiat. | Contrôle visuel et vocal, test sans son et test avec lecteur d'écran. |
| Authentification | Le parcours ne dépend pas d'un test cognitif. Une passkey ou une solution locale accessible doit remplacer à terme le code oral. | Test WCAG 2.2 3.3.8, récupération accessible et audit de sécurité. |
| Action sensible | Betty annonce l'objet, le destinataire et l'effet, puis demande une confirmation explicite. | Journal d'audit, essai confirmer/annuler et contrôle des droits. |
| Personnalisation | Le rythme, la voix et le niveau de détail sont choisis par la personne, séparément de son rôle métier. | Tests de profil, réversibilité et absence d'élévation de privilège. |

## Barrière de livraison

Une évolution d'interface ne peut être qualifiée d'accessible uniquement parce qu'un test automatisé réussit. Avant promotion au statut « éprouvé », elle doit réunir :

1. contrôles automatiques reproductibles ;
2. parcours clavier complet ;
3. essai avec au moins un lecteur d'écran de bureau et un mobile pertinent ;
4. zoom, contraste, réduction des mouvements et absence de dépendance au son ;
5. test métier avec les droits de chaque rôle concerné ;
6. essai utilisateur avec une personne concernée ;
7. liste des écarts, responsable, échéance et possibilité de retour arrière.

Toutes les options issues de ce socle restent désactivées par défaut dans le programme vierge.
