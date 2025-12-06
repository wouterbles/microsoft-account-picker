document.addEventListener('DOMContentLoaded', async () => {
  const listElement = document.getElementById('list');
  const emptyState = document.getElementById('empty');
  const clearAllBtn = document.getElementById('clear-all');
  const versionEl = document.getElementById('version');

  // Display version from manifest
  const manifest = browser.runtime.getManifest();
  versionEl.textContent = manifest.version;

  const data = await browser.storage.sync.get(null);
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

    // Build card using DOM methods (avoids innerHTML security warning)
    const header = document.createElement('div');
    header.className = 'rule-header';

    const labelSpan = document.createElement('span');
    labelSpan.className = 'rule-label';
    labelSpan.textContent = label;

    const actions = document.createElement('div');
    actions.className = 'rule-actions';

    const toggleLabel = document.createElement('label');
    toggleLabel.className = 'toggle';
    toggleLabel.title = `${enabled ? 'Disable' : 'Enable'} auto-login`;

    const toggle = document.createElement('input');
    toggle.type = 'checkbox';
    toggle.checked = enabled;

    const toggleSlider = document.createElement('span');
    toggleSlider.className = 'toggle-slider';

    toggleLabel.appendChild(toggle);
    toggleLabel.appendChild(toggleSlider);

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-btn';
    deleteBtn.title = 'Remove rule';
    deleteBtn.textContent = '\u00D7';

    actions.appendChild(toggleLabel);
    actions.appendChild(deleteBtn);

    header.appendChild(labelSpan);
    header.appendChild(actions);

    const emailDiv = document.createElement('div');
    emailDiv.className = 'rule-email';
    emailDiv.textContent = email;

    card.appendChild(header);
    card.appendChild(emailDiv);

    // Toggle enable/disable
    toggle.addEventListener('change', async () => {
      const isEnabled = toggle.checked;
      card.classList.toggle('disabled', !isEnabled);
      toggleLabel.title = `${isEnabled ? 'Disable' : 'Enable'} auto-login`;

      // Update storage
      const current = await browser.storage.sync.get(appId);
      let updated = current[appId];

      if (typeof updated === 'string') {
        // Migrate old format
        updated = { email: updated, label, enabled: isEnabled, updatedAt: Date.now() };
      } else {
        updated = { ...updated, enabled: isEnabled, updatedAt: Date.now() };
      }

      await browser.storage.sync.set({ [appId]: updated });
    });

    // Delete rule
    deleteBtn.addEventListener('click', async () => {
      await browser.storage.sync.remove(appId);
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
      await browser.storage.sync.clear();
      while (listElement.firstChild) {
        listElement.removeChild(listElement.firstChild);
      }
      clearAllBtn.style.display = 'none';
      emptyState.style.display = 'block';
    }
  });
});
