(function() {
  try {
    const url = new URL(window.location.href);
    const paramsToCheck = [
      url.searchParams.get('redirect_uri'),
      url.searchParams.get('RelayState')
    ];
    const hasAnyParam = paramsToCheck.some(v => v);
    if (!hasAnyParam) { // No redirect_uri or RelayState found in the url
      return;
    }
    chrome.storage.sync.get({ mappings: [] }, (data) => {
      const mappings = data.mappings || [];
      let mapping = null;
      for (const value of paramsToCheck) {
        if (!value) continue;
        mapping = mappings.find(m =>
          typeof m.redirectUriSubstring === 'string' &&
          m.redirectUriSubstring.length > 0 &&
          value.includes(m.redirectUriSubstring)
        );
        if (mapping) {
          break;
        }
      }
      if (!mapping) {
        return;
      }
      url.searchParams.set('login_hint', mapping.loginHint);
      url.searchParams.set('prompt', 'none');
      const newUrl = url.toString();
      if (newUrl !== window.location.href) {
        console.log('[Auto Login Hint Injector] Redirecting to new URL with login_hint:', mapping.loginHint);
        window.location.replace(newUrl);
      }
    });
  } catch (e) {
    console.error('[Auto Login Hint Injector] Error:', e);
  }
})();