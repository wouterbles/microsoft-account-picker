# Microsoft Account Auto-Picker

A Chrome extension that automatically selects the correct Microsoft account based on the service you're accessing. No more clicking through account pickers!

## Features

- **Auto-learns** your account preferences - just use Microsoft services normally
- **Auto-clicks** the right account on future logins
- **Per-service rules** - use different accounts for different services (e.g., work account for Azure Portal, personal for Xbox)
- **Toggle rules** on/off without deleting them
- **Clean UI** to manage saved rules

## Installation

1. Clone or download this repository
2. Open Chrome and navigate to `chrome://extensions`
3. Enable "Developer mode" (toggle in top right)
4. Click "Load unpacked" and select the extension folder
5. The extension icon should appear in your toolbar

## How It Works

1. **Learning**: When you visit a Microsoft login page and select an account, the extension remembers your choice for that specific service (identified by `client_id` or redirect URL).

2. **Auto-selecting**: On future visits to the same service, the extension automatically clicks the account you previously selected.

3. **Managing rules**: Click the extension icon to view, toggle, or delete saved rules.

## Supported Login Flows

- OAuth2 / OpenID Connect (most Microsoft services)
- SAML 2.0
- WS-Federation

## Privacy

- All data is stored locally in your browser using Chrome's sync storage
- No data is sent to external servers
- No analytics or tracking

## License

MIT License - see [LICENSE](LICENSE) file for details.
