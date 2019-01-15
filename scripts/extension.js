document.addEventListener('DOMContentLoaded', async function () {
    document.getElementById('status').textContent = "Extension loaded";


    var fileInput = document.getElementById('fileInput');
    fileInput.addEventListener('change', function (e) {
        var file = fileInput.files[0];
        var reader = new FileReader();
        reader.onload = function (e) {
            console.log(reader.result);
            chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
                chrome.tabs.sendMessage(tabs[0].id, { csvContent: reader.result }, function (response) {

                    $('#status').html('Processing...');
                });
            });

        }
        reader.readAsText(file);



    });

    /*
        var button = document.getElementById('readCSV');
        button.addEventListener('click', function () {
            $('#status').html('Processing');
    
            chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
                chrome.tabs.sendMessage(tabs[0].id, {}, function (response) {
    
                    $('#status').html('Processing...');
                });
            });
        });*/
});


// lorque le traitement est fini, content envoi un message qui est capturé par l'extension, 
// on MAJ alors la vue
chrome.runtime.onMessage.addListener(
    function (request, sender, sendResponse) {

        if (request.finish) {
            let notFounds = [];
            for (var key in request.playersFromCSV) {
                if (!request.playersFromCSV[key].updated) {
                    notFounds.push({
                        name: key,
                        value: request.playersFromCSV[key].value
                    });
                }
            }

            if (notFounds.length > 0) {
                let notFoundsTable = "<table><tr><th>Name</th><th>Value</th></tr>";
                notFounds.forEach(function (item) {
                    notFoundsTable += `<tr><td>${item.name}</td><td>${item.value}</td></tr>`
                });
                notFoundsTable += "</table>";
                $('#status').html("FINISH <br>not found in this page : <br>" + notFoundsTable);

            } else {

                $('#status').html('FINISH');
            }

        }
    });