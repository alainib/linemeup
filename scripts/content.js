/**
 * replace all the occurence of "find" with "replace" in the "str" string
 * @param str
 * @param find
 * @param replace
 * @returns string
*/
function escapeRegExp(string) {
    return string.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1");
}
function tools_replaceAll(str, find, replace) {
    if (str == null) {
        return null
    }
    return str.replace(new RegExp(escapeRegExp(find), 'g'), replace);
}
function tools_cleanName(name) {
    let replaceme = [".", ",", "'"];
    let tmp = name.toLowerCase();
    for (var j in replaceme) {
        tmp = tools_replaceAll(tmp, replaceme[j], " ");
    }
    return tmp;
}

/**
 * PARAMETRAGE 
 */
// nom du fichier csv
const filename = "data.csv";

// conf pour le site https://app.linemeup.fr/nba/contests
// indice de colonne contenant le nom
const positionName = 0;
// indice de la colonne contenant la valeur à modifier
const positionFP = 18;
// ---------------------------------------------------------------


/**
 Comment ca marche ?

 - lit le csv et en crée un tableau joueur + valeur
 - sur le site de linemeup, les joueurs sont paginés, donc page par page on les cherches puis met à jour leur valeur
  
*/



chrome.runtime.onMessage.addListener(async function (request, sender, sendResponse) {

    let playersFromCSV = await createPlayersFromCSV();
    /*
     vu que les joueurs sont paginées, pour chaque page, il faut récupérer les joueurs et les mettre à jour
     on peut avoir soit une seul page
     soit plusieurs avec 
        1   
        1 2 >>
        1 2 3 >> 
        du coup il faut traiter page par page  
    */
    var paginations = document.querySelectorAll('td.statsTable-footer > div > div.block_shadow');
    console.log(paginations);

    /*
    var tds = document.querySelectorAll('table.statsTable-table > tbody > tr');
    if (tds == null || tds.length < 0) {
        alert("Error: table of player not found !");
    } else {
        // on parcour les élements enfants de ce tableau 
        // on les stocks dans un tableau associatif avec la clé comme nom de joueur        
        let playersFromLinemeup = createPlayersFromLinemeup(tds);
        updateInputsValue(playersFromCSV, playersFromLinemeup);
    }
    */
    /*
    if (paginations == null || paginations.length < 0) {
        updateCurrentPage(playersFromCSV);
    } else {

        updateCurrentPage(playersFromCSV);

    }
        */



    /*
    var data = request.data || {};
    
    var linksList = document.querySelectorAll('a');
    [].forEach.call(linksList, function (header) {
    header.innerHTML = request.data;
    });
    
    sendResponse({ data: data, success: true }); 
    */
    sendResponse({ data: {}, success: true });



});


/**
 * lit le CSV source, le découpe par joueur
 * retourne un objet avec key = nom de joueur  , value :sa valeur
 */
async function createPlayersFromCSV() {

    const url = chrome.runtime.getURL(`data/${filename}`);
    // lit le fichier
    let response = await fetch(url);
    // converti la réponse
    const text = await response.text();
    // explose le text en ligne
    let data = text.split('\n');
    // supprime la premiere ligne
    data.shift();
    if (data.length < 1) {
        alert("Error: reading CSV file");
    }
    let playersFromCSV = {};
    for (var i in data) {
        // explose chaque ligne en player + value
        let tmp = data[i].split(',');
        // si la valeur est non null (ex différent de ligne vide) on rajout au tableau final
        if (tmp[1]) {
            tmp[0] = tools_cleanName(tmp[0]);
            tmp[1] = tmp[1].replace(".", ",");
            // updated permet de savoir si cet element à été deja trouvé et utilisé pour mettre à jour
            // vu qu'il y a pagination ca evite de re chercher les joueurs deja mis à jour dans les pages précédentes
            playersFromCSV[tmp[0]] = { value: tmp[1], updated: false }// parseFloat(tmp[1]); 
        }
    }
    return playersFromCSV;
}

/**
 * prend une liste de <td> et crée le tableau des joueurs à mettre à jour par la suite
 * 
 * @param {*} tds 
 */
function createPlayersFromLinemeup(tds) {
    let playersFromLinemeup = {};
    for (var i = 0; i < tds.length; i++) {
        var name = tds[i].childNodes[positionName];
        var textname = tools_cleanName(name.querySelector('.statsTable-row-name-name').innerText);
        var valueFP = tds[i].childNodes[positionFP].querySelector('input');

        playersFromLinemeup[textname] = { valueFP }
    }
    return playersFromLinemeup;
}





/**
 * met à jour les input a partir des données du CSV
 * @param {*} playersFromCSV 
 * @param {*} playersFromLinemeup 
 */
function updateInputsValue(playersFromCSV, playersFromLinemeup) {
    // on parcour les joueurs de playersFromCSV et on essaie de mettre a jour dans playersFromLinemeup
    for (var key in playersFromCSV) {
        if (!playersFromCSV[key].updated) {
            if (playersFromLinemeup[key]) {
                playersFromLinemeup[key].valueFP.value = playersFromCSV[key].value;
                // colorie en jaune l'input modifié
                playersFromLinemeup[key].valueFP.style.backgroundColor = "#ffff00"
                // appel les evenements crée dans react une fois la donnée modifiée
                playersFromLinemeup[key].valueFP.dispatchEvent(new Event("change", { bubbles: true }));
                playersFromLinemeup[key].valueFP.dispatchEvent(new Event("blur", { bubbles: true }));
                // ne plus utiliser 
                playersFromCSV[key].updated = true;

            } else {
                console.log("player not found : <<" + key + ">>");

            }
        }
    }
}

/**
 * met a jour la page de pagination courante
 * @param {*} playersFromCSV 
 */
function updateCurrentPage(playersFromCSV) {
    // on cherche les lignes du tableau avec les joueurs à modifier 
    var tds = document.querySelectorAll('table.statsTable-table > tbody > tr');
    if (tds == null || tds.length < 0) {
        alert("Error: table of player not found !");
    } else {
        // on parcour les élements enfants de ce tableau 
        // on les stocks dans un tableau associatif avec la clé comme nom de joueur        
        let playersFromLinemeup = createPlayersFromLinemeup(tds);
        updateInputsValue(playersFromCSV, playersFromLinemeup);
    }
}