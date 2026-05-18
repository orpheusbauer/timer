# Timer a paliers

Chronometre visuel pour suivre une duree totale et afficher des paliers intermediaires pendant le decompte.

Le projet est une application web statique : HTML, CSS et JavaScript natif, sans dependance, sans serveur et sans build.

## Demo

Page GitHub : https://github.com/orpheusbauer/timer
Page Démo : https://orpheusbauer.fr/timerchrono/

## A quoi ca sert ?

Ce timer est utile quand une session doit etre decoupee en etapes visibles : exercice, meditation, presentation, atelier, revision, cuisine, entrainement ou toute autre activite avec des moments de transition.

L'interface affiche :

- le temps ecoule ;
- le temps restant ;
- le prochain palier ;
- une barre de progression horizontale ;
- une jauge verticale avec les paliers places a leur position temporelle.

## Fonctionnalites

- Reglage d'une duree totale en minutes et secondes.
- Ajout de paliers nommes a un moment precis du timer.
- Tri automatique des paliers par ordre chronologique.
- Mise en evidence du prochain palier.
- Notification visuelle lorsqu'un palier est atteint.
- Etat termine quand la duree totale est ecoulee.
- Pause, reprise et reinitialisation.
- Mode clair / mode sombre, memorise dans le navigateur.
- Interface responsive pour ordinateur et mobile.

## Utilisation rapide

1. Ouvrir la page de demo ou le fichier `index.html` dans un navigateur moderne.
2. Regler la `Duree totale`.
3. Ajouter un palier avec une note et un temps, par exemple `Respiration` a `02:00`.
4. Recommencer pour chaque etape importante.
5. Cliquer sur `Demarrer`.
6. Utiliser `Pause` puis `Reprendre` si necessaire.
7. Cliquer sur `Reinitialiser` pour repartir de zero.

## Regles des paliers

Un palier doit :

- avoir une note ;
- etre place apres `00:00` ;
- etre strictement avant la duree totale ;
- ne pas partager le meme temps qu'un autre palier.

Les paliers sont stockes uniquement pendant la session courante. Changer de page ou recharger le navigateur remet la liste a zero.

## Donnees et confidentialite

Le timer n'envoie aucune donnee a un serveur.

Le seul element conserve dans le navigateur est le theme choisi, via `localStorage`, sous la cle `timerchrono-theme`.

La duree, le temps ecoule et les paliers restent en memoire JavaScript pendant l'utilisation de la page.

## Lancer le projet localement

Aucune installation n'est necessaire.

```bash
git clone git@github.com:orpheusbauer/timer.git
cd timer
```

Ouvrir ensuite `index.html` dans un navigateur.

Si le navigateur bloque certains comportements locaux, servir simplement le dossier avec n'importe quel serveur statique.

## Structure

```text
.
+-- index.html
`-- assets
    +-- css
    |   `-- style.css
    `-- js
        `-- app.js
```

- `index.html` contient la structure de l'application.
- `assets/css/style.css` gere les themes, la jauge, les panneaux et le responsive.
- `assets/js/app.js` gere le timer, les paliers, les notifications et le changement de theme.

## Technologies

- HTML5
- CSS3
- JavaScript natif
- `localStorage` pour memoriser le theme

## Limites actuelles

- Les paliers ne sont pas sauvegardes apres rechargement de la page.
- Il n'y a pas d'alerte sonore, seulement une notification visuelle.
- Le timer repose sur `setInterval`, ce qui convient a l'usage courant mais ne remplace pas un chronometrage scientifique de haute precision.
