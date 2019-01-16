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

/**
 * clean le nom du joueur
 * @param {*} name 
 */
function tools_cleanName(name) {
    let replaceme = [".", ",", "'"];
    let tmp = name.toLowerCase();
    for (var j in replaceme) {
        tmp = tools_replaceAll(tmp, replaceme[j], "");
    }
    return tmp;
}

function stringContain(str, substring) {
    return str.toLowerCase().indexOf(substring) !== -1;
}

function log(param1, param2) {
    let debug = true;
    if (debug) {
        if (param2 != param2) {
            console.log(param1, param2);
        } else {
            console.log(param1);
        }
    }
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
const positionPool = 22;
// ---------------------------------------------------------------


/**
 Comment ca marche ?

 - lit le csv et en crée un tableau joueur + valeur
 - sur le site de linemeup, les joueurs sont paginés, donc page par page on les cherches puis met à jour leur valeur
  
*/



chrome.runtime.onMessage.addListener(async function (request, sender, sendResponse) {
    log("start from content.js")
    let playersFromCSV = await createPlayersFromCSV(request.csvContent);
    /*
    vu que les joueurs sont paginées, pour chaque page, il faut récupérer les joueurs et les mettre à jour
    */
    updateNextPage(playersFromCSV);
    //  sendResponse({ data: playersFromCSV, success: true });
});


/**
 * met a jour la prochaine page , on commence par la courante
 * 
 * met a jour les données des joueur de la page courante
 * puis si page suivante va dessus et rappel recursif 
 * 
 * 
 * @param {*} playersFromCSV 
 */
function updateNextPage(playersFromCSV) {
    updateCurrentPage(playersFromCSV);
    let nextPaginationDiv = getNextPaginationDiv();
    // log("nextPaginationDiv", nextPaginationDiv);
    if (nextPaginationDiv) {
        setTimeout(function () {
            nextPaginationDiv.dispatchEvent(new Event("click", { bubbles: true }));
            // var event=new MouseEvent('click',{'view':window,'bubbles':true,'cancelable':true});
            setTimeout(function () {
                updateNextPage(playersFromCSV);
            }, 2000);
        }, 5000);
    } else {
        chrome.runtime.sendMessage({ playersFromCSV, finish: true }, function (response) { });
    }
}

/**
 * met a jour la page de pagination courante
 * @param {*} playersFromCSV 
 */
function updateCurrentPage(playersFromCSV) {


    let updateLine = function (valueFP, playersFromCSV, name, iPoolUnChecked) {
        valueFP.value = playersFromCSV[name].value;
        // colorie en jaune l'input modifié
        valueFP.style.backgroundColor = "#ffff00"
        // appel les evenements crée dans react une fois la donnée modifiée
        valueFP.dispatchEvent(new Event("change", { bubbles: true }));
        valueFP.dispatchEvent(new Event("blur", { bubbles: true }));
        // ce joueur a été trouvé 
        playersFromCSV[name].updated = true;
        // coche la pool si jamais elle été décochée avant
        if (iPoolUnChecked) {
            // log("click on Pool", playersFromLinemeup[name]);
            iPoolUnChecked.dispatchEvent(new Event("click", { bubbles: true }));
        }
    }


    // on cherche les lignes du tableau avec les joueurs à modifier 
    var tds = document.querySelectorAll('table.statsTable-table > tbody > tr');
    if (tds == null || tds.length < 0) {
        alert("Error: table of player not found !");
    } else {
        // on parcour les élements enfants de ce tableau 
        // on les stocks dans un tableau associatif avec la clé comme nom de joueur        
        let playersFromLinemeup = createPlayersFromLinemeup(tds);
        log(playersFromLinemeup);

        // on parcour les joueurs de playersFromLinemeup et on regarde si ils sont dans playersFromCSV 
        for (var name in playersFromLinemeup) {
            const { valueFP, iPoolChecked, iPoolUnChecked } = playersFromLinemeup[name]
            let mappedName = getMappedName(name);
            if (playersFromCSV[name]) { // le joueur existe dans les deux
                updateLine(valueFP, playersFromCSV, name, iPoolUnChecked);
            } else if (playersFromCSV[mappedName]) {
                updateLine(valueFP, playersFromCSV, mappedName, iPoolUnChecked);
            } else {
                // le joueur n'existe que dans linemeup , on decoche de la pool                
                if (iPoolChecked) {
                    // log("click on Pool", playersFromLinemeup[name]);
                    iPoolChecked.dispatchEvent(new Event("click", { bubbles: true }));
                }
            }
        }
        /*
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

                }
            }
        }
        */
    }
}

/**
 * lit le CSV source, le découpe par joueur
 * retourne un objet avec key = nom de joueur  , value :sa valeur
 * @param csvContent text content of the CSV file
 */
async function createPlayersFromCSV(csvContent) {
    /*
    const url = chrome.runtime.getURL(`data/${filename}`);
    // lit le fichier
    let response = await fetch(url);
    // converti la réponse
    const text = await response.text();
    let data = text.split('\n');
    */

    // explose le text en ligne
    let data = csvContent.split('\n');
    // supprime la premiere ligne
    data.shift();
    if (data.length < 1) {
        alert("Error reading CSV file content");
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
 * trouver la div avec les boutons de pagination
 * trouve sur quel page on est
 * si on est sur la dernière return null sinon return le prochain
 */
function getNextPaginationDiv() {
    var paginationsDivs = document.querySelectorAll('td.statsTable-footer > div > div.block_shadow > div');

    log("paginationsDivs", paginationsDivs);

    if (paginationsDivs == null) {
        // les divs n'ont pas été trouvé ! erreur
        alert("Error: paginationsDivs is null, you need to re run this extension for each players page");
        return null;
    } else if (paginationsDivs.length < 2) {
        // div trouvé et il n'y a qu'une seule page, rien à faire
        return null;
    } else {
        for (var i = 0; i < paginationsDivs.length; i++) {
            // log(paginationsDivs[i].textContent,paginationsDivs[i].className)
            // on cherche la div de la page courante
            if (stringContain(paginationsDivs[i].className, "selected")) {
                // log("found");
                // une fois trouvée on renvoi la suivante si elle existe 
                if (paginationsDivs[i + 1]) {
                    return paginationsDivs[i + 1]
                } else {
                    return null;
                }
            }
        }
    }
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
        // pour le bouton de pool deja coché
        var iPoolChecked = tds[i].childNodes[positionPool].querySelector('td > div > i.ic-check_box');
        // pour le bouton de pool deja decoché
        var iPoolUnChecked = tds[i].childNodes[positionPool].querySelector('td > div > i.ic-check_box_outline_blank');

        playersFromLinemeup[textname] = { valueFP, iPoolChecked, iPoolUnChecked }
    }
    log("create", playersFromLinemeup);
    return playersFromLinemeup;
}

/**
 * certains noms ne sont pas écrit de la meme facon entre "linemeup" et "basketballmonster"
 * cette fonction permet d'avoir le nom "basketballmonster" via  celui de "linemeup"
 * @param string lineMeUpName
 * @return string csv name  
 */
function getMappedName(lineMeUpName) {
    lineMeUpName = tools_cleanName(lineMeUpName);
    return mapping[lineMeUpName];
}


// mettre les noms en minuscule !!!!!!!
const mapping = {
    "in linemeup": "in csv",
    "maximilian kleber": "maxi kleber",
    "ishmael smith": "ish smith",
    "james ennis iii": "james ennis",
    "tyrone wallace": "ty wallace",
}
