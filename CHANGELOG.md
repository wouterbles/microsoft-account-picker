# Changelog

## 0.1.7
- Fix Firefox Add-on validation: add required `data_collection_permissions` field
- Bump minimum Firefox version to 142.0 for data collection permissions support

## 0.1.6
- Add new icon sizes (48px, 96px) for better browser compatibility
- Refactor popup.js to use DOM methods instead of innerHTML for improved security
- Update manifest with new icon configurations

## 0.1.5
- Clean up manifest.json and remove unnecessary key tag

## 0.1.4
- Fix CRX3 build command parameter flag in release workflow

## 0.1.3
- Fix CRX packaging to use CRX3 format for Chrome Web Store compatibility

## 0.1.2
- Add verified CRX Chrome package to releases
- Add privacy policy document
- Fix text overflow on rule labels and email styles
- Add promo assets and screenshot generation scripts

## 0.1.1
- Add GitHub Actions workflow for automated releases

## 0.1.0
- Initial release
- Firefox support with browser polyfill
- Auto-pick Microsoft accounts based on configurable rules
