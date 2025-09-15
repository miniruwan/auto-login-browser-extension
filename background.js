chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
	if (changeInfo.status === 'loading' && tab.url && tab.url.startsWith('http')) {
		chrome.scripting.executeScript({
			target: { tabId },
			files: ['content_script.js']
		});
	}
});
