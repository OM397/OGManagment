# Deployment & Build Verification

This document summarizes how the frontend build is bundled into the backend and how to verify what version is running in production.

## Build Flow (Railway / Nixpacks)
1. Install backend dependencies (backend/package.json).
2. Install frontend dependencies (frontend/package.json).
3. Build frontend with Vite producing `frontend/dist` (hashed assets).
4. Copy `frontend/dist/*` into `backend/public/` so Express serves them.
5. Start backend `server.js` (serves static assets + API).

## Forcing a Rebuild
Commit any change (e.g. add/remove a small file) to `main` so Railway triggers a new deploy.

## Version / Build Info
Endpoint: `GET /api/build-info` returns JSON:
```json
{
  "commit": "<git hash>",
  "builtAt": "<ISO timestamp>",
  "runtime": "<current server time ISO>"
}
```
The dashboard includes a small banner (top) showing the short commit hash.

### Preparing build-info.json
`backend/build-info.json` is a template committed as:
```json
{"commit": "__COMMIT_HASH__", "builtAt": "__BUILD_TIME__"}
```
During deployment you can replace placeholders (optional). If not replaced, the endpoint still works but shows nulls.

#### Example Replacement Script (optional)
Add a step (pre-start) that runs:
```bash
node -e "const fs=require('fs');const h=process.env.RAILWAY_GIT_COMMIT_SHA||'unknown';fs.writeFileSync('backend/build-info.json', JSON.stringify({commit:h,builtAt:new Date().toISOString()},null,2));"
```
For Railway Nixpacks you can append to the build phase in `railway.json`.

## Cache Busting
Vite file names include content hashes ensuring browsers fetch new bundles after deploy. If stale assets appear:
- Hard reload (Ctrl+F5)
- Verify new JS filename hashes differ from previous

## Troubleshooting
| Symptom | Action |
|---------|--------|
| UI missing recent changes | Check `/api/build-info` commit vs latest `git log -1` |
| Endpoint returns nulls | Ensure `build-info.json` exists or create it dynamically |
| CSP blocking assets | Adjust CSP directives in `server.js` (scriptSrc/styleSrc) |

