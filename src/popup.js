document.addEventListener('DOMContentLoaded', async () => {
  const listElement = document.getElementById('list');
  const emptyState = document.getElementById('empty');
  const clearAllBtn = document.getElementById('clear-all');
  const versionEl = document.getElementById('version');

  // Display version from manifest
  const manifest = chrome.runtime.getManifest();
  versionEl.textContent = manifest.version;

  const data = await chrome.storage.sync.get(null);
  const keys = Object.keys(data);

  if (keys.length === 0) {
    emptyState.style.display = 'block';
    return;
  }

  clearAllBtn.style.display = 'block';

  keys.forEach(appId => {
    const entry = data[appId];

    // Handle backwards compatibility
    let email = '';
    let label = 'Unknown Service';
    let enabled = true;

    if (typeof entry === 'string') {
      email = entry;
    } else if (entry && typeof entry === 'object') {
      email = entry.email || '';
      label = entry.label || 'Unknown Service';
      enabled = entry.enabled !== false;
    }

    const card = document.createElement('div');
    card.className = `rule-card${enabled ? '' : ' disabled'}`;

    card.innerHTML = `
      <div class="rule-header">
        <span class="rule-label">${escapeHtml(label)}</span>
        <div class="rule-actions">
          <label class="toggle" title="${enabled ? 'Disable' : 'Enable'} auto-login">
            <input type="checkbox" ${enabled ? 'checked' : ''}>
            <span class="toggle-slider"></span>
          </label>
          <button class="delete-btn" title="Remove rule">&times;</button>
        </div>
      </div>
      <div class="rule-email">${escapeHtml(email)}</div>
    `;

    // Toggle enable/disable
    const toggle = card.querySelector('input[type="checkbox"]');
    toggle.addEventListener('change', async () => {
      const isEnabled = toggle.checked;
      card.classList.toggle('disabled', !isEnabled);
      toggle.parentElement.title = `${isEnabled ? 'Disable' : 'Enable'} auto-login`;

      // Update storage
      const current = await chrome.storage.sync.get(appId);
      let updated = current[appId];

      if (typeof updated === 'string') {
        // Migrate old format
        updated = { email: updated, label, enabled: isEnabled, updatedAt: Date.now() };
      } else {
        updated = { ...updated, enabled: isEnabled, updatedAt: Date.now() };
      }

      await chrome.storage.sync.set({ [appId]: updated });
    });

    // Delete rule
    card.querySelector('.delete-btn').addEventListener('click', async () => {
      await chrome.storage.sync.remove(appId);
      card.remove();

      if (listElement.children.length === 0) {
        emptyState.style.display = 'block';
        clearAllBtn.style.display = 'none';
      }
    });

    listElement.appendChild(card);
  });

  // Clear All button
  clearAllBtn.addEventListener('click', async () => {
    if (confirm('Are you sure? This will remove all saved rules.')) {
      await chrome.storage.sync.clear();
      listElement.innerHTML = '';
      clearAllBtn.style.display = 'none';
      emptyState.style.display = 'block';
    }
  });
});

// Escape HTML to prevent XSS
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
