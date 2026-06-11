<!-- security-rules v2 — B2B Damage Analysis Dashboard -->
# Security Rules

Các quy tắc bảo mật cho dự án B2B Damage Analysis Dashboard.

## Input & Output
- Never use `innerHTML` with user-supplied content — use `esc()` function (dashboard.js:15-20)
- The `esc()` function creates a temporary text node to safely escape HTML entities
- All values from API/user data MUST be wrapped in `esc()` before `innerHTML`
- Never use `eval()`, `document.write()`, or `dangerouslySetInnerHTML`
- ✅ Implemented: All innerHTML usage verified safe with esc() wrapper

## Authentication & Session
- Google Sign-In OAuth with JWT validation (exp, iss, email_verified)
- Server-side email whitelist check via `?action=checkEmail` API
- Fallback: @ghn.vn domain allowed when server has Internal error
- Session stored in localStorage with 24h TTL (`ghn_session_ts`)
- Logout clears ALL sensitive localStorage items (email, session, API URLs)
- ✅ Implemented: dashboard.js lines 382-510

## Secrets & API Keys
- API base URL encoded in base64 (NOT encryption — accepted risk for client-side architecture)
- OAuth Client ID in HTML data attribute (expected for web apps per Google docs)
- API token derived from script URL hash (deterministic — accepted risk)
- ⚠️ Accepted Risk: Full Google Apps Script URL decodable from source

## CSRF
- POST to Google Apps Script uses `mode: 'no-cors'` + API_TOKEN
- ⚠️ Accepted Risk: Token is deterministic, no true CSRF protection (requires backend)

## Transport
- All external resources loaded via HTTPS
- HSTS meta tag present
- ✅ Implemented

## Security Headers (via meta tags)
Actual CSP implemented in index.html:
```
default-src 'self';
script-src 'self' https://cdn.jsdelivr.net https://accounts.google.com https://docs.google.com;
style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://accounts.google.com;
font-src https://fonts.gstatic.com;
img-src 'self' data: https:;
connect-src 'self' https://script.google.com https://docs.google.com https://*.googleusercontent.com https://cdn.jsdelivr.net https://accounts.google.com https://corsproxy.io https://api.allorigins.win;
frame-src https://accounts.google.com;
```
- X-Content-Type-Options: nosniff ✅
- X-Frame-Options: DENY ✅
- Referrer-Policy: strict-origin-when-cross-origin ✅
- ⚠️ Note: `unsafe-inline` in style-src (needed for Chart.js inline styles)
- ⚠️ Note: Permissions-Policy only works as HTTP header, removed from meta tags

## Subresource Integrity (SRI)
- Chart.js: integrity hash ✅
- chartjs-plugin-datalabels: integrity hash ✅
- SheetJS (xlsx): integrity hash ✅
- Google Identity Services: NO SRI (Google doesn't provide stable hashes — accepted risk)
- Google Fonts CSS: NO SRI (dynamically generated — accepted risk)

## Accessibility (ARIA)
- Login overlay: `role="dialog" aria-modal="true" aria-label="Đăng nhập"` ✅
- Sidebar: `role="navigation" aria-label="Điều hướng chính"` ✅
- Nav menu: `role="menubar"` ✅
- Loading overlay: `role="alert" aria-live="assertive"` ✅
- All canvas charts: `role="img"` + descriptive `aria-label` ✅
- `prefers-reduced-motion` media query ✅

## Rate Limiting
- Server-side: 30 requests/minute per IP (Google Apps Script CacheService)
- ✅ Implemented: Code.gs lines 9-16

## Data Exposure
- `<meta name="robots" content="noindex, nofollow">` ✅
- Error messages: generic user-facing text, details only in console.error() ✅
- Debug info removed from Report UI (console only) ✅
- IndexedDB data unencrypted (accepted risk for client-side)

## Accepted Risks (Client-Side Architecture Limitations)
1. API URL decodable from base64 in source code
2. Login bypass via localStorage manipulation (no backend session validation)
3. No real auth on POST endpoint (needs backend proxy)
4. Data routed through third-party CORS proxies (corsproxy.io, allorigins.win)
5. JSONP callback injection risk in Google Sheets visualization API fallback
