document.addEventListener('DOMContentLoaded', async function () {
    document.getElementById('status').textContent = "Extension loaded";
    var button = document.getElementById('readCSV');
    button.addEventListener('click', function () {
        $('#status').html('Clicked change links button');

        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
            chrome.tabs.sendMessage(tabs[0].id, {}, function (response) {
                $('#status').html('changed data in page');
            });
        });
    });
});

