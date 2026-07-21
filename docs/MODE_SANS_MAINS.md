# MAVIK Betty — mode sans les mains

## Promesse

Une personne qui ne peut pas utiliser ses mains doit pouvoir comprendre son travail, naviguer, ouvrir une fonction, dicter une demande et confirmer ou annuler sans souris ni écran tactile.

Le mode ne suppose pas que la personne puisse parler. Il propose deux moyens combinables :

- une session de commandes vocales ;
- un balayage automatique utilisable avec un contacteur unique.

Ces moyens modifient l'interaction, jamais le rôle ni les droits métier.

## Session vocale

La personne ou son dispositif active une fois **Démarrer sans les mains** ou le raccourci `Alt+M`. Betty annonce clairement que le microphone est actif. Les commandes de navigation reconnues sont :

- « suivant » et « précédent » ;
- « lire » ;
- « ouvrir » ou « activer » ;
- « ouvre l'agenda », « ouvre les messages » ou le nom d'un espace autorisé ;
- « confirmer » et « annuler » ;
- « arrête le mode ».

Les demandes métier ordinaires sont transmises à Betty. Une action importante conserve la même reformulation, la même vérification des droits et la même confirmation humaine.

La session n'est jamais activée par défaut, ne fonctionne pas en arrière-plan et s'arrête immédiatement avec « arrête le mode », `Échap` ou le bouton d'arrêt visible. La reconnaissance vocale dépend du navigateur et peut utiliser un service externe.

## Contacteur unique

La personne active **Démarrer le contacteur** ou `Alt+S`. Toutes les 2,5 secondes, le focus passe à la commande utilisable suivante avec un indicateur très visible. Le contacteur, configuré par le système comme Entrée ou Espace, active la commande ciblée.

Le balayage :

- ignore les commandes masquées ou désactivées ;
- reste dans la boîte de dialogue ouverte lorsqu'il y en a une ;
- suit le même ordre logique que le clavier ;
- peut être arrêté immédiatement ;
- ne déclenche jamais une action à lui seul.

## Limites et prochaines validations

- essais réels avec commandes vocales, contacteurs USB/Bluetooth et commandes d'accessibilité des systèmes ;
- compatibilité avec Windows Voice Access, Voice Control d'Apple et Android Voice Access ;
- réglage personnel de la vitesse de balayage ;
- groupes de balayage pour les pages comportant beaucoup de commandes ;
- adaptation au pilotage oculaire et aux dispositifs de commande alternative ;
- solution locale ou contractuellement maîtrisée pour les paroles professionnelles sensibles.

Cette première version est candidate. Elle ne devient « éprouvée » qu'après audit WCAG/RGAA, tests multi-appareils et essais avec des personnes concernées.
