// background.js
// Intercepts requests and injects login_hint if needed

chrome.webRequest.onBeforeRequest.addListener(
	async function(details) {
		try {
			const url = new URL(details.url);
			// Only process if redirect_uri is present
			if (!url.searchParams.has('redirect_uri')) return;
			// Only process if login_hint is NOT already present
			if (url.searchParams.has('login_hint')) return;

			// Get mappings from storage
			const data = await new Promise(resolve => {
				chrome.storage.sync.get({ mappings: [] }, resolve);
			});
			const mappings = data.mappings || [];
			const redirectUri = url.searchParams.get('redirect_uri');
			if (!redirectUri) return;

			// Find the first mapping where the substring is present in redirect_uri
			const mapping = mappings.find(m =>
				typeof m.redirectUriSubstring === 'string' &&
				m.redirectUriSubstring.length > 0 &&
				redirectUri.includes(m.redirectUriSubstring)
			);
			if (!mapping) return;

			// Double-check login_hint is not present (in case of edge case)
			if (url.searchParams.has('login_hint')) return;

			// Add login_hint
			url.searchParams.set('login_hint', mapping.loginHint);

			// Only redirect if the URL actually changes
			const newUrl = url.toString();
			if (newUrl !== details.url) {
				return { redirectUrl: newUrl };
			}
		} catch (e) {
			// Fail silently, but could log to console if debugging
			// console.error('Auto Login Hint Injector error:', e);
			return;
		}
	},
	{ urls: ["<all_urls>"] },
	["blocking"]
);
