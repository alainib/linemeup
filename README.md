<h2>1) Pour l'installation</h2>
- ouvrir chrome
- taper dans l'url "chrome://extensions/"
- activer "developer mode" tout à droite en haut
- cliquer sur "charger l'extension non empaquetée" / "load unpacked"
- indiquer le chemin vers le dossier linemeup

<h2>2) Pour l'utilisation </h2>
- aller sur https://basketballmonster.com/Daily.aspx
- exporter le CSV du jour en cliquant sur "Value CSV"
- aller sur https://app.linemeup.fr/nba/contests
- choisir le bon "contest/match" ( mercredi soir, jeudi soir etc)
- vérifier que l'on est sur la première page des joueurs ( tout en bas à droite il y a  "1 2 3 >>" )
- mettre "afficher 25 lignes par page" à 100 pour faire un traitement plus rapide

<h2>3) utilisation</h2>
- cliquer sur l'extension (forme de cerveaux) 
- indiquer le chemin du CSV précedement téléchargé
- VOILA ! 

<h2>4) mapping de nom de joueurs entre les deux sites !</h2>

    Il est possible que certains joueurs ne soit pas trouvés à cause de la différence de nom entre les deux sites.
    
    Il est possible d'y rémédier en indiquant le nom sur chaque site au script pour qu'il les trouve la prochaine fois ( fermer chrome pour prendre en compte la modification de code)
   - ouvrir le fichier /linemeup/scripts/content.js avec un éditeur de texte ( nodepad++ est très bien pour ca)
   - aller tout à la fin du code et trouver `mapping`
   - rajouter pour chaque joueur une nouvelle ligne, dans l'élement de gauche mettre le nom du joueur sur linemeup et dans l'élement de droite son nom sur basketballmonster. **mettre en minuscule et sans espace avant apres le nom**
   <pre><code>
      const mapping = {
      	"in linemeup": "in csv",
      	"maximilian kleber": "maxi kleber",
      	"ishmael smith": "ish smith",
      	"james ennis iii": "james ennis",
      	"tyrone wallace": "ty wallace",
      	"shaquille harrison": "shaq harrison",
      	"wayne selden jr": "wayne selden"
      }
</code></pre>



<h2>5) pour mettre à jour le code</h2>
  - ouvrir une console ( powershell est très bien)
  - aller dans le dossier ou est linemup, par exemple taper "cd c:/linemeup"
  - git add .       (ajoute les fichiers modifiés)
  - git commit -m "votre commentaire"     (valid et envoye les modif vers le dépot local)
  - git push origin master               (envoye les mofids vers le serveur de github)
  - git pull                      ( demande les modifs qui sont sur le serveur )