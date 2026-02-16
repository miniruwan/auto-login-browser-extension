(async function() {
  try {
    const url = new URL(window.location.href);
    const paramsToCheck = await collectParamsToCheck(url);
    
    if (paramsToCheck.length === 0) {
      return;
    }

    chrome.storage.sync.get({ mappings: [] }, (data) => {
      const mappings = data.mappings || [];
      const mapping = findMatchingMapping(paramsToCheck, mappings);
      
      if (!mapping) {
        return;
      }

      applyLoginHint(url, mapping.loginHint);
    });
  } catch (e) {
    console.error('[Auto Login Hint Injector] Error:', e);
  }

  async function collectParamsToCheck(url) {
    const params = [
      url.searchParams.get('redirect_uri'),
      url.searchParams.get('RelayState')
    ].filter(v => v);

    if (params.length === 0) {
      const acsUrl = await extractAssertionConsumerServiceURL(url);
      if (acsUrl) {
        params.push(acsUrl);
      }
    }

    return params;
  }

  async function extractAssertionConsumerServiceURL(url) {
    const samlRequest = url.searchParams.get('SAMLRequest');
    if (!samlRequest) {
      return null;
    }

    try {
      // Decode base64
      const decoded = atob(samlRequest);
      
      // Convert to Uint8Array for decompression
      const charData = decoded.split('').map(x => x.charCodeAt(0));
      const binData = new Uint8Array(charData);
      
      // Decompress using DecompressionStream
      const blob = new Blob([binData]);
      const stream = blob.stream();
      const decompressedStream = stream.pipeThrough(new DecompressionStream('deflate-raw'));
      const decompressedBlob = await new Response(decompressedStream).blob();
      const decompressed = await decompressedBlob.text();
      
      // Match both single and double quotes
      const acsMatch = decompressed.match(/AssertionConsumerServiceURL=["']([^"']+)["']/);
      return acsMatch ? acsMatch[1] : null;
    } catch (error) {
      console.error('[Auto Login Hint Injector] Failed to decode/decompress SAMLRequest:', error);
      return null;
    }
  }

  function findMatchingMapping(paramsToCheck, mappings) {
    for (const value of paramsToCheck) {
      const mapping = mappings.find(m =>
        typeof m.redirectUriSubstring === 'string' &&
        m.redirectUriSubstring.length > 0 &&
        value.includes(m.redirectUriSubstring)
      );
      if (mapping) {
        return mapping;
      }
    }
    return null;
  }

  function applyLoginHint(url, loginHint) {
    url.searchParams.set('login_hint', loginHint);
    url.searchParams.set('prompt', 'none');
    const newUrl = url.toString();
    
    if (newUrl !== window.location.href) {
      console.log('[Auto Login Hint Injector] Redirecting to new URL with login_hint:', loginHint);
      window.location.replace(newUrl);
    }
  }
})();