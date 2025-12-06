# Vendor Dependencies

## browser-polyfill.min.js

- **Version:** 0.12.0
- **Source:** https://github.com/AcalephStorage/webextension-polyfill
- **CDN:** https://unpkg.com/webextension-polyfill@0.12.0/dist/browser-polyfill.min.js
- **License:** MPL-2.0

This polyfill provides a unified `browser.*` API for cross-browser extension development.
It is a no-op on Firefox (which natively supports `browser.*`) and provides the namespace on Chrome.

### Updating

To update to a newer version:

```bash
curl -sL "https://unpkg.com/webextension-polyfill@VERSION/dist/browser-polyfill.min.js" -o vendor/browser-polyfill.min.js
```

Replace `VERSION` with the desired version number.
