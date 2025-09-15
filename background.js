// background.js
// Chrome MV3: webRequest blocking is not allowed for user-installed extensions.
// Instead, inject a content script on navigation to rewrite URLs if needed.

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
	if (changeInfo.status === 'loading' && tab.url && tab.url.startsWith('http')) {
		chrome.scripting.executeScript({
			target: { tabId },
			files: ['content_script.js']
		});
	}
});
