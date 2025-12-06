// Debug flag - set to true to enable console logging
const DEBUG = false;

function log(...args) {
  if (DEBUG) console.log('[Auto-Picker]', ...args);
}

// Get query parameter from URL
function getQueryParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}

// Extract application identifier (client_id, redirect_uri domain, or tenant ID)
function getAppIdentifier() {
  const clientId = getQueryParam('client_id');
  if (clientId) return clientId;

  const redirectUri = getQueryParam('redirect_uri');
  if (redirectUri) {
    try {
      return new URL(redirectUri).hostname;
    } catch (e) {
      log('Invalid redirect_uri', e);
    }
  }

  // Fallback to Tenant ID for SAML/WS-Fed flows
  const pathMatch = window.location.pathname.match(/^\/([0-9a-fA-F-]{36})\/(saml2|wsfed)/);
  if (pathMatch) return pathMatch[1];

  return null;
}

// Get a human-readable label for the app
function getReadableLabel() {
  const redirectUri = getQueryParam('redirect_uri');
  if (redirectUri) {
    try {
      return new URL(redirectUri).hostname;
    } catch (e) {}
  }

  if (document.referrer) {
    try {
      return new URL(document.referrer).hostname;
    } catch (e) {}
  }

  if (window.location.pathname.match(/\/saml2|\/wsfed/)) {
    return 'SAML App';
  }

  return 'Unknown Service';
}

// State
let isClicking = false;

// Attempt to auto-click the matching account tile
function attemptAutoClick(email, label) {
  if (isClicking) return;

  const tiles = document.querySelectorAll('[role="listitem"], .row.tile');
  if (tiles.length === 0) return;

  log(`Scanning ${tiles.length} tiles for: ${email}`);

  for (const tile of tiles) {
    const clickable = tile.querySelector('[role="button"]') || tile;
    const testId = (clickable.getAttribute('data-test-id') || '').toLowerCase();
    const text = (tile.innerText || '').toLowerCase();
    const targetEmail = email.toLowerCase();

    if (testId === targetEmail || text.includes(targetEmail)) {
      log('Match found, clicking...');
      isClicking = true;
      clickable.focus();
      clickable.click();
      return;
    }
  }

  log('No matching tile found');
}

// Attach click listeners to learn user selections
function attachListeners(appId) {
  const tiles = document.querySelectorAll('[role="listitem"]');

  tiles.forEach(tile => {
    if (tile.dataset.autoPickerBound) return;
    tile.dataset.autoPickerBound = 'true';

    tile.addEventListener('click', () => {
      const clickable = tile.querySelector('[role="button"]');
      let selectedEmail = clickable?.getAttribute('data-test-id');

      if (!selectedEmail) {
        const emailMatch = tile.innerText.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/);
        if (emailMatch) selectedEmail = emailMatch[0];
      }

      if (selectedEmail) {
        const label = getReadableLabel();
        log(`Learning: ${label} (${appId}) -> ${selectedEmail}`);

        browser.storage.sync.set({
          [appId]: {
            email: selectedEmail,
            label: label,
            enabled: true,
            updatedAt: Date.now()
          }
        });
      }
    });
  });
}

// Main initialization
async function init(appId) {
  const storage = await browser.storage.sync.get(appId);
  const savedData = storage[appId];

  // Handle backwards compatibility (old format was just a string)
  let savedEmail = null;
  let savedLabel = getReadableLabel();
  let isEnabled = true;

  if (typeof savedData === 'string') {
    savedEmail = savedData;
  } else if (savedData) {
    savedEmail = savedData.email;
    savedLabel = savedData.label || savedLabel;
    isEnabled = savedData.enabled !== false; // default to true
  }

  // Auto-click if we have a saved email and rule is enabled
  if (savedEmail && isEnabled) {
    log(`Found rule for ${appId}: ${savedEmail}`);
    attemptAutoClick(savedEmail, savedLabel);

    // Poll for a bit in case DOM is slow to render
    let attempts = 0;
    const poller = setInterval(() => {
      if (isClicking || attempts >= 10) {
        clearInterval(poller);
        return;
      }
      attempts++;
      attemptAutoClick(savedEmail, savedLabel);
    }, 500);
  }

  // Watch for DOM changes to attach listeners and retry auto-click
  const observer = new MutationObserver(() => {
    attachListeners(appId);
    if (savedEmail && isEnabled && !isClicking) {
      attemptAutoClick(savedEmail, savedLabel);
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });
}

// Start
const appId = getAppIdentifier();
if (appId) {
  log('Detected App ID:', appId);
  init(appId);
} else {
  log('No App Identifier found. Script idle.');
}
