document.addEventListener('DOMContentLoaded', function () {
    const triggerButton = document.getElementById('triggerButton');

    triggerButton.addEventListener('click', function () {
        // Send a message to the active tab to trigger the content script
        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
            const activeTab = tabs[0];
            chrome.tabs.sendMessage(activeTab.id, { action: 'triggerEverything' });
        });
    });
});
