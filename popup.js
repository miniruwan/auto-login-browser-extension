(async function () {
  const container = document.getElementById('content');

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab || !tab.url || !tab.url.startsWith('http')) {
      container.innerHTML = '<div class="no-data">Not an HTTP page.</div>';
      return;
    }

    const url = new URL(tab.url);
    const redirectUri = url.searchParams.get('redirect_uri');
    const relayState = url.searchParams.get('RelayState');
    const acsUrl = await extractAssertionConsumerServiceURL(url);

    const params = [redirectUri, relayState, acsUrl].filter(Boolean);

    if (params.length === 0) {
      container.innerHTML = '<div class="no-data">No redirect_uri, RelayState, or AssertionConsumerServiceURL found in this URL.</div>';
      return;
    }

    let html = '';

    if (redirectUri) {
      html += buildSection('redirect_uri', redirectUri);
    }
    if (relayState) {
      html += buildSection('RelayState', relayState);
    }
    if (acsUrl) {
      html += buildSection('AssertionConsumerServiceURL', acsUrl);
    }

    // Check for matching mapping
    const mappings = await getMappings();
    const collectResult = params;
    let matchedMapping = null;
    for (const value of collectResult) {
      const m = mappings.find(
        mapping =>
          typeof mapping.redirectUriSubstring === 'string' &&
          mapping.redirectUriSubstring.length > 0 &&
          value.includes(mapping.redirectUriSubstring)
      );
      if (m) {
        matchedMapping = m;
        break;
      }
    }

    if (matchedMapping) {
      html += `<div class="match-info matched">
        <strong>Matched mapping:</strong><br>
        Substring: <code>${escapeHtml(matchedMapping.redirectUriSubstring)}</code><br>
        login_hint: <code>${escapeHtml(matchedMapping.loginHint)}</code>
      </div>`;
    } else {
      html += `<div class="match-info no-match">No matching mapping found. Configure mappings in the Options page.</div>`;
    }

    container.innerHTML = html;
  } catch (e) {
    container.innerHTML = `<div class="no-data">Error: ${escapeHtml(e.message)}</div>`;
  }

  function buildSection(label, value) {
    return `<div class="section">
      <div class="label">${escapeHtml(label)}</div>
      <div class="value">${escapeHtml(value)}</div>
    </div>`;
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function getMappings() {
    return new Promise(resolve => {
      chrome.storage.sync.get({ mappings: [] }, data => {
        resolve(data.mappings || []);
      });
    });
  }

  async function extractAssertionConsumerServiceURL(url) {
    const samlRequest = url.searchParams.get('SAMLRequest');
    if (!samlRequest) {
      return null;
    }

    try {
      const decoded = atob(samlRequest);
      const charData = decoded.split('').map(x => x.charCodeAt(0));
      const binData = new Uint8Array(charData);

      const blob = new Blob([binData]);
      const stream = blob.stream();
      const decompressedStream = stream.pipeThrough(new DecompressionStream('deflate-raw'));
      const decompressedBlob = await new Response(decompressedStream).blob();
      const decompressed = await decompressedBlob.text();

      const acsMatch = decompressed.match(/AssertionConsumerServiceURL=["']([^"']+)["']/);
      return acsMatch ? acsMatch[1] : null;
    } catch {
      return null;
    }
  }
})();
