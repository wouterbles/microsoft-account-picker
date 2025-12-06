# Microsoft Account Auto-Picker

Browser extension (Chrome & Firefox) that remembers which Microsoft account you use for each service and auto-selects it next time.

## Install

### Chrome

1. Clone this repo
2. Go to `chrome://extensions`
3. Enable "Developer mode"
4. Click "Load unpacked" and select this folder

### Firefox

1. Clone this repo
2. Go to `about:debugging#/runtime/this-firefox`
3. Click "Load Temporary Add-on"
4. Select the `manifest.json` file in this folder

> Note: Temporary add-ons are removed when Firefox closes. For permanent installation, publish to [addons.mozilla.org](https://addons.mozilla.org).

## How it works

When you pick an account on a Microsoft login page, the extension saves your choice for that service. Next time you visit, it clicks the right account for you.

Click the extension icon to see your saved rules. You can toggle them on/off or delete them.

## Supported flows

- OAuth2 / OpenID Connect
- SAML 2.0
- WS-Federation

## Privacy

Everything stays in your browser. No external servers, no tracking.

## License

MIT
