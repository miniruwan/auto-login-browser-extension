// content_script.js
// For Chrome: rewrite URL in-place if login_hint should be added
(function() {
  try {
    const url = new URL(window.location.href);
    console.log('[Auto Login Hint Injector] Current URL:', url.toString());
    // Always set (replace or add) login_hint, even if already present
    const redirectUri = url.searchParams.get('redirect_uri');
    const relayState = url.searchParams.get('RelayState');
    if (!redirectUri && !relayState) {
      console.log('[Auto Login Hint Injector] No redirect_uri or RelayState found.');
      return;
    }
    chrome.storage.sync.get({ mappings: [] }, (data) => {
      const mappings = data.mappings || [];
      console.log('[Auto Login Hint Injector] Loaded mappings:', mappings);
      let matchValue = null;
      let mapping = null;
      if (redirectUri) {
        mapping = mappings.find(m =>
          typeof m.redirectUriSubstring === 'string' &&
          m.redirectUriSubstring.length > 0 &&
          redirectUri.includes(m.redirectUriSubstring)
        );
        matchValue = redirectUri;
      }
      if (!mapping && relayState) {
        mapping = mappings.find(m =>
          typeof m.redirectUriSubstring === 'string' &&
          m.redirectUriSubstring.length > 0 &&
          relayState.includes(m.redirectUriSubstring)
        );
        matchValue = relayState;
      }
      if (!mapping) {
        console.log('[Auto Login Hint Injector] No mapping found for redirect_uri or RelayState.', {redirectUri, relayState});
        return;
      }
      url.searchParams.set('login_hint', mapping.loginHint);
      const newUrl = url.toString();
      if (newUrl !== window.location.href) {
        console.log('[Auto Login Hint Injector] Redirecting to new URL with login_hint:', newUrl);
        window.location.replace(newUrl);
      } else {
        console.log('[Auto Login Hint Injector] URL unchanged after adding/replacing login_hint.');
      }
    });
  } catch (e) {
    console.error('[Auto Login Hint Injector] Error:', e);
  }
})();
