document.addEventListener('DOMContentLoaded', async () => {
  const listElement = document.getElementById('list');
  const emptyState = document.getElementById('empty');
  const clearAllBtn = document.getElementById('clear-all');
  const versionEl = document.getElementById('version');
  const exportBtn = document.getElementById('export-btn');
  const importInput = document.getElementById('import-input');

  // Display version from manifest
  const manifest = browser.runtime.getManifest();
  versionEl.textContent = manifest.version;

  // Export functionality
  exportBtn.addEventListener('click', async () => {
    const data = await browser.storage.sync.get(null);
    const exportData = {
      version: manifest.version,
      exportedAt: new Date().toISOString(),
      rules: data
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const date = new Date().toISOString().split('T')[0];

    const a = document.createElement('a');
    a.href = url;
    a.download = `ms-account-picker-rules-${date}.json`;
    a.click();

    URL.revokeObjectURL(url);
  });

  // Import functionality
  importInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const text = await file.text();
      const importData = JSON.parse(text);

      // Validate structure
      let rules = {};
      if (importData.rules && typeof importData.rules === 'object') {
        rules = importData.rules;
      } else if (typeof importData === 'object' && !importData.version) {
        // Support raw rules object (backwards compatibility)
        rules = importData;
      } else {
        throw new Error('Invalid file format');
      }

      // Filter valid rules
      const validRules = {};
      for (const [key, value] of Object.entries(rules)) {
        if (typeof value === 'string' || (value && typeof value === 'object' && value.email)) {
          validRules[key] = value;
        }
      }

      const count = Object.keys(validRules).length;
      if (count === 0) {
        alert('No valid rules found in the file.');
        return;
      }

      if (confirm(`Import ${count} rule${count > 1 ? 's' : ''}? This will merge with your existing rules.`)) {
        await browser.storage.sync.set(validRules);
        // Reload popup to show updated rules
        window.location.reload();
      }
    } catch (err) {
      alert('Failed to import: Invalid JSON file.');
    }

    // Reset input so same file can be selected again
    importInput.value = '';
  });

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
