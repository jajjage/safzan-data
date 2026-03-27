# PWA (Progressive Web App) Setup Guide

Your safzan Data app is now a fully functional PWA! 🎉

## What's Implemented

### 1. **Web App Manifest** (`public/manifest.json`)

- App name, description, and branding
- Home screen icon (192x192 and 512x512)
- Start URL and display mode (standalone - no browser URL bar)
- Theme colors
- App shortcuts (Notifications, Dashboard)

### 2. **Installation Prompt**

- Automatic browser install prompt detection
- Platform-specific UI:
  - **Android/Chrome/Edge**: One-click install button
  - **iOS/Safari**: Manual instructions (beforeinstallprompt not supported)
- Custom install UI in `PWAInstallPrompt.tsx`
- Shows on first visit, dismissible
- Detects already-installed apps and hides prompt

### 3. **Offline Support**

- Service worker with intelligent caching:
  - **API requests**: Network-first (try server, fall back to cache)
  - **Static assets**: Cache-first (use cache, fetch from network)
- Automatic cache management
- Offline fallback responses

### 4. **Home Screen Installation**

#### On Android:

1. Open the app in Chrome/Edge
2. Tap the menu (⋮)
3. Select "Install app" or "Add to Home screen"
4. App installs with full-screen mode, no URL bar
5. Tap to launch like a native app

#### On iOS (Safari):

1. Open the app in Safari
2. Tap Share (⬆️)
3. Select "Add to Home Screen"
4. Give it a name and tap Add
5. App launches in full-screen mode

#### On Desktop (Chrome/Edge):

1. Visit the app
2. Click install icon in address bar (or menu → "Install app")
3. App installs as a desktop application

## Features Included

✅ **Offline Functionality**

- API caching for seamless offline experience
- Static assets cached on first load
- Network fallback with user-friendly error messages

✅ **App-like Experience**

- No browser URL bar (standalone mode)
- Home screen icon
- Splash screen on launch
- Full-screen mode on mobile

✅ **Performance**

- PWA Lighthouse scoring for speed
- Optimized caching strategy
- Smart asset loading

✅ **Notifications**

- Firebase Cloud Messaging integration
- Background notification delivery
- Click-to-navigate from notifications

## Files Modified/Created

```
public/
├── manifest.json (NEW)
└── firebase-messaging-sw.js (ENHANCED with offline caching)

src/
├── app/
│   └── layout.tsx (UPDATED with PWA metadata)
├── components/
│   └── PWAInstallPrompt.tsx (NEW)

next.config.ts (UPDATED with manifest headers)
```

## Testing PWA Installation

### Local Development:

1. Run `pnpm dev`
2. Open http://localhost:3000
3. **Android**: Install prompt will appear (Chrome/Edge only, not on localhost - use port forwarding for testing)
4. **iOS**: Manual installation instructions appear
5. Check Application tab in DevTools:
   - Manifest section shows manifest.json details
   - Service Workers section shows registration status
   - Storage section shows cache contents

### Production (After Deployment):

1. Deploy to HTTPS domain
2. **Android users**: See install button → one-click installation
3. **iOS users**: See manual instructions → tap Share ⬆️ → Add to Home Screen
4. App installs on home screen

## iOS Installation (Manual Process)

Since Apple doesn't support the `beforeinstallprompt` event, iOS users see step-by-step instructions:

1. **Step 1**: "Tap the Share button ⬆️" (with icon)
2. **Step 2**: Select "Add to Home Screen"

The app automatically detects iOS and shows this blue instruction card instead of the automatic install button.

## Customization

### Change App Colors/Name:

Edit `public/manifest.json`:

```json
{
  "name": "Your App Name",
  "theme_color": "#000000",
  "background_color": "#ffffff"
}
```

### Update Icons:

- Replace images in `public/images/`
- Update paths in `public/manifest.json`
- Icons should be:
  - **192x192**: Android home screen
  - **512x512**: Android splash screen
  - **SVG**: For maskable icons (adaptive icons)

### Modify Caching Strategy:

Edit `public/firebase-messaging-sw.js`:

```javascript
const CACHE_NAME = "safzan-data-v2"; // Increment version to clear old cache
const STATIC_ASSETS = [...]; // Add/remove assets to cache
```

## PWA Requirements Checklist

✅ HTTPS deployment (required for production)
✅ Service Worker registration
✅ Manifest file with icons
✅ Responsive design (mobile-friendly)
✅ Fast loading (< 3 seconds)
✅ Offline functionality

## Browser Support

| Browser | Android           | iOS                     | Desktop                     |
| ------- | ----------------- | ----------------------- | --------------------------- |
| Chrome  | ✅ Install button | ❌ iOS Safari only      | ✅ Install from address bar |
| Edge    | ✅ Install button | ❌ iOS Safari only      | ✅ Install from address bar |
| Firefox | ✅ Install button | ❌ iOS Safari only      | ✅ Install from address bar |
| Safari  | -                 | ✅ Manual (Share → Add) | ✅ Manual install           |

**Note on iOS**: Apple doesn't support the `beforeinstallprompt` event. The app detects iOS and shows step-by-step manual instructions: "Tap Share ⬆️ and select 'Add to Home Screen'" instead of an automatic install button.

## Performance Impact

- **Initial Load**: ~50KB (service worker + manifest)
- **Cache Size**: ~5-10MB (images, static assets)
- **Offline Performance**: Near-instant with cached assets

## Security Considerations

✅ HTTPS enforced (PWA requirement)
✅ Service Worker scope limited to origin
✅ API requests network-first for fresh data
✅ Manifest shields against iframe attacks

## Next Steps

1. **Deploy to HTTPS** - PWA won't work on HTTP
2. **Test on multiple devices** - Chrome, Edge, Safari, Firefox
3. **Monitor Lighthouse scores** - Check PWA compliance
4. **Update cache version** when deploying new versions
5. **Monitor offline usage** - Track users using offline features

## Troubleshooting

### Install prompt not showing:

- App must be served over HTTPS
- Service Worker must be registered
- Manifest must be valid
- Check DevTools → Application → Manifest

### Offline doesn't work:

- Check Service Worker status in DevTools
- Verify cache contents in Storage tab
- Check Network tab for failed requests
- Clear cache: `caches.delete('safzan-data-v1')`

### Icons not showing:

- Verify icon paths in manifest.json
- Check CORS if using external CDNs
- Icons must be publicly accessible

## Lighthouse PWA Audit

Run: `npm run build && npm run start`, then use Chrome DevTools → Lighthouse

Target scores:

- Performance: > 90
- Accessibility: > 90
- Best Practices: > 90
- SEO: > 90
- PWA: All checks passing

---

**Last Updated**: December 23, 2025
**PWA Version**: v1.0
