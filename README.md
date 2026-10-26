# La dernière porte

Jeu de fuite en première personne inspiré des Backrooms, jouable sans installation ni connexion.

## Jouer
Ouvrez index.html dans Chrome ou Edge, puis cliquez sur Entrer dans le niveau.

1. Réactivez les trois boîtiers électriques.
2. Trouvez les clés dorées de la Volkswagen Golf (vous pouvez les ramasser avant les boîtiers).
3. Revenez à la Golf grise dans le couloir du départ et appuyez sur E.
4. Conduisez dans le parking et rejoignez la porte SORTIE au fond pour gagner.

Le poursuivant conserve votre portrait et son haltère. Il commence à bouger après sept secondes. La voiture ouvre une seconde zone avec de larges allées et des séparations en béton.

## Commandes à pied
- ZQSD ou WASD : se déplacer.
- Souris : regarder ; flèches gauche/droite également possibles.
- Maj : courir (endurance limitée).
- E : boîtier, clés, Golf ou placard à proximité.
- Échap : pause, libération de la souris et réglage de sensibilité.

## Cachettes
Les placards verts permettent de se cacher avec E. Appuyez de nouveau sur E pour sortir. Si le poursuivant vous voit entrer à proximité, la cachette ne vous protège pas. Si vous entrez sans être vu, restez caché pendant qu’il vient chercher votre dernière position.

## Conduite
- Z / W ou flèche haut : accélérer.
- S ou flèche bas : freiner puis reculer.
- Q / A et D ou flèches gauche/droite : braquer.
- Souris : regarder sur les côtés, sans modifier la direction du véhicule.
- C : recentrer la vue vers la route.
- Échap : pause.

## Souris
La sensibilité par défaut est réduite. Le jeu demande le mouvement brut lorsque le navigateur le prend en charge, ignore les grands sauts de coordonnées et les événements à la capture de la souris, puis limite la rotation accumulée par image. Réglez la sensibilité dans le menu pause ; elle est mémorisée lorsque le navigateur le permet.

## VS Code
Ouvrez Backrooms.code-workspace ; F5 lance le jeu dans Chrome. game.js contient le rendu raycasting, les cartes, les textures et les mécaniques ; style.css et index.html contiennent l’interface. Le portrait est dans assets/pursuer-face.png.
