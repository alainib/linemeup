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
                let content = "FINISH <br><br><br> Players from CSV not found in this page : <br><br>" + notFoundsTable;
                $('#status').html(content);

                let htmlCode = `<!DOCTYPE html><html><head></head><body><style>.container{background: white;}table{border-collapse: collapse;width: 100%;}th, td{text-align: left;padding: 8px;}tr:nth-child(even){background-color: #f2f2f2}th{background-color: #4CAF50;color: white;}</style>${content}</body></html>`;
                var url = "data:text/html," + encodeURIComponent(htmlCode);
                chrome.tabs.create({ url: url });


            } else {

                $('#status').html('FINISH');
            }

        }
    });