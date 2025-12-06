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

// Queue a notification to show on next page load (survives navigation)
function queueNotification(message) {
  chrome.storage.local.set({
    pendingNotification: {
      message,
      timestamp: Date.now()
    }
  });
}

// Show a small toast notification (top-right)
function showNotification(message) {
  const existing = document.getElementById('auto-picker-toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.id = 'auto-picker-toast';
  toast.innerHTML = `
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style="flex-shrink: 0;">
      <circle cx="8" cy="8" r="7" fill="white"/>
      <path d="M4.5 8L7 10.5L11.5 6" stroke="#0078d4" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
    <span>${message}</span>
  `;
  toast.style.cssText = `
    position: fixed;
    top: 16px;
    right: 16px;
    display: flex;
    align-items: center;
    gap: 10px;
    background: #0078d4;
    color: white;
    padding: 14px 18px;
    border-radius: 8px;
    font-family: 'Segoe UI', -apple-system, sans-serif;
    font-size: 13px;
    font-weight: 500;
    box-shadow: 0 8px 24px rgba(0, 120, 212, 0.3);
    z-index: 2147483647;
    opacity: 0;
    transform: translateX(100%);
    transition: opacity 0.3s ease, transform 0.3s ease;
  `;

  document.body.appendChild(toast);

  // Slide in from right
  requestAnimationFrame(() => {
    toast.style.opacity = '1';
    toast.style.transform = 'translateX(0)';
  });

  // Remove after 4.5 seconds
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    setTimeout(() => toast.remove(), 300);
  }, 4500);
}

// Check for and show any pending notifications from previous page
async function showPendingNotification() {
  const { pendingNotification } = await chrome.storage.local.get('pendingNotification');
  
  if (pendingNotification) {
    // Only show if less than 10 seconds old (in case user navigated away)
    if (Date.now() - pendingNotification.timestamp < 10000) {
      // Small delay to let the page settle
      setTimeout(() => showNotification(pendingNotification.message), 500);
    }
    // Clear it
    chrome.storage.local.remove('pendingNotification');
  }
}

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
      
      // Queue notification for next page (this page will navigate away)
      queueNotification(`Auto-selected ${email} for ${label}`);
      
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

        chrome.storage.sync.set({
          [appId]: {
            email: selectedEmail,
            label: label,
            enabled: true,
            updatedAt: Date.now()
          }
        });

        // Queue notification for next page
        queueNotification(`Remembered ${selectedEmail} for ${label}`);
      }
    });
  });
}

// Main initialization
async function init(appId) {
  // Check for pending notifications from previous actions
  showPendingNotification();

  const storage = await chrome.storage.sync.get(appId);
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
  // Still check for pending notifications even if no appId
  showPendingNotification();
}
