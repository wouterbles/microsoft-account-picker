# Microsoft Account Auto-Picker

[![Chrome Web Store](https://img.shields.io/chrome-web-store/v/neaeoajchkdlbccamohnnjgkbpfagmia?style=for-the-badge&logo=google-chrome&logoColor=white)](https://chromewebstore.google.com/detail/microsoft-account-auto-pi/neaeoajchkdlbccamohnnjgkbpfagmia)
[![Firefox Add-on](https://img.shields.io/amo/v/microsoft-account-auto-picker?style=for-the-badge&logo=firefox-browser&logoColor=white)](https://addons.mozilla.org/en-US/firefox/addon/microsoft-account-auto-picker/)

Browser extension (Chrome & Firefox) that remembers which Microsoft account you use for each service and auto-selects it next time.

![Extension Popup Screenshot](promo/screenshots/screenshot-1.png)

## Install

The easiest way to install is via the official stores:

*   **Chrome**: [Chrome Web Store](https://chromewebstore.google.com/detail/microsoft-account-auto-pi/neaeoajchkdlbccamohnnjgkbpfagmia)
*   **Firefox**: [Firefox Add-ons](https://addons.mozilla.org/en-US/firefox/addon/microsoft-account-auto-picker/)

## How it works

When you pick an account on a Microsoft login page, the extension saves your choice for that service. Next time you visit, it clicks the right account for you.

Click the extension icon to see your saved rules. You can toggle them on/off or delete them.

### Import / Export

You can export your saved rules to a JSON file and import them on another machine or browser. This is useful for backing up your rules or syncing them between Work/Home computers.

## Supported flows

- OAuth2 / OpenID Connect
- SAML 2.0
- WS-Federation

## Privacy

Everything stays in your browser. No external servers, no tracking.

## License

MIT

---

## Manual Installation

### From Releases

If you prefer to install manually or don't have access to the stores:

1.  Download the latest release zip from the [Releases page](../../releases).
2.  Unzip the file.
3.  Load it into your browser (see "Load from Source" below).

### Load from Source (Development)

To build and run from the source code:

**Chrome**
1.  Clone this repo.
2.  Go to `chrome://extensions`.
3.  Enable "Developer mode".
4.  Click "Load unpacked" and select this folder.

**Firefox**
1.  Clone this repo.
2.  Go to `about:debugging#/runtime/this-firefox`.
3.  Click "Load Temporary Add-on".
4.  Select the `manifest.json` file in this folder.
    > Note: Temporary add-ons are removed when Firefox closes.
