# Combustion Analyzer — Next.js

This is the original Express + static-HTML "Combustion Analyzer" app,
restructured onto Next.js (App Router). **All formulas, calculations, DB
schemas, and page behaviour are unchanged** — this was a structural
migration, not a rewrite of the logic.

## What changed vs. what didn't

**Unchanged (byte-for-byte or logic-for-logic identical):**
- `formulaAFT()`, `buildFeaturesForModel()`, `applyPreprocessing()`,
  `calculateAFT()` — the AFT prediction math — `src/lib/aftEngine.js`.
- The Random Forest / Hybrid RF / ANN trainer scripts (`ann2.js`,
  `hybrid2.js`, `rf2.js`) and the model-comparison engine
  (`model_compare.js`, `model_compare_worker.js`) — copied verbatim into
  `src/lib/legacy/`.
- The Python XGBoost microservice (`ml-service/`) — copied unchanged. It's
  a separate process; Next.js just calls it over HTTP exactly like Express
  did (`ML_SERVICE_URL`).
- Every page's original HTML markup, CSS, and inline JavaScript — extracted
  verbatim into `public/legacy/*.body.html`, `*.style.css`, `*.js` and
  mounted by `src/components/LegacyPage.jsx`. See "About the frontend
  pages" below for why this approach was used instead of a full React
  rewrite.
- MongoDB collections/schemas (`Coal`, `User`) — same field names, same
  `coals` collection.
- All API routes live at the **exact same URL paths** as the old Express
  routes (`/calculate-aft`, `/optimize`, `/upload-excel`, `/auth/login`,
  `/api/coal`, `/get_coal_types`, etc.), so none of the original
  client-side `fetch()` calls needed to change.

**Changed (structural only):**
- Express route handlers → Next.js Route Handlers (`src/app/**/route.js`).
- `express-session` (in-memory) → a small cookie + in-memory-Map session
  helper with the same behaviour (`src/lib/session.js`).
- `multer` file uploads → native `request.formData()`.
- One big `app.js` → modular `src/lib/*.js` + one route file per endpoint.

## Project layout

```
src/
  app/
    page.js                  # GET /  -> same as login.html
    login.html/page.js       admin.html/page.js       model.html/page.js
    coal_table.html/page.js  ctfinal.html/page.js     date.html/page.js
    slagging_coal_page.html/page.js
    coal_blend_simulation.html/page.js
    model_compare.html/page.js
    calculate-aft/route.js  optimize/route.js  upload-excel/route.js
    update-coal/route.js    fetch-data/route.js  delete-data/route.js
    download-template/route.js  get_coal_types/route.js  consume-trial/route.js
    auth/{login,logout,status}/route.js
    api/{get-active-model,activate-model,coal,coals,coal/list,coal/all,
         coalnames,compare-models,compare-models/status/[jobId],
         get-training-dataset,last-training-upload,save-test-dataset,
         get-test-dataset,save-comparison-state,get-comparison-state}/route.js
  lib/
    aftEngine.js      # formulaAFT / calculateAFT / active-model loader
    coalUtils.js       # normalizeCoalDoc, Excel/CSV helpers
    mongodb.js           # mongoose connection singleton
    models.js             # Coal / User schemas
    session.js              # cookie-based session (replaces express-session)
    compareJobs.js            # worker_threads job runner for /api/compare-models
    persistPaths.js             # data/test.csv, data/comparison_state.json
    legacy/                       # ann2.js, hybrid2.js, rf2.js, model_compare*.js (verbatim)
  components/
    LegacyPage.jsx      # mounts each legacy page's original HTML/CSS/JS
public/
  legacy/                # extracted *.body.html, *.style.css, *.js per page
  images/, slagging_data.csv, slagging_data.xlsx
ml-service/              # unchanged Python FastAPI + XGBoost service
```

## About the frontend pages

The original app was a **classic multi-page site**: nine standalone HTML
files (some 800–4000 lines each) with inline `<style>` and large vanilla-JS
`<script>` blocks doing direct DOM manipulation, `onclick="fn()"` handlers,
`fetch()` calls, Plotly/Chart.js/jsPDF/XLSX usage, etc.

Hand-rewriting ~13,000 lines of that imperative script logic into
idiomatic React state risks silently changing behaviour — a real concern
given how much of this app is formulas and calculated tables. So instead,
each page keeps its **original HTML, CSS and JS untouched**, and
`LegacyPage.jsx` mounts it inside a real Next.js route:

1. The route (e.g. `/model.html`) is a Next.js Server Component that reads
   the extracted `model.body.html` / `model.style.css` from `public/legacy/`.
2. `LegacyPage` renders that HTML via `dangerouslySetInnerHTML` and the CSS
   in a `<style>` tag.
3. In a `useEffect`, it loads the page's external CDN scripts (Chart.js,
   XLSX, jsPDF, Plotly, etc.) **in their original order**, then the page's
   own inline script from `/legacy/model.js` — unmodified.
4. Because the real `DOMContentLoaded`/`load` events already fired before
   Next.js finished hydrating, synthetic versions are dispatched once
   everything has loaded, so the original script's own
   `document.addEventListener('DOMContentLoaded', ...)` init code still
   runs exactly as before.

Routes intentionally keep the **original filenames** (`/model.html`,
`/coal_table.html`, `/login.html`, ...) rather than being renamed to clean
slugs like `/model`, because the scripts navigate between pages using
relative/absolute links like `window.location.href = 'model.html'` —
keeping the filenames means **zero link rewriting** was needed, and real
full-page browser navigations between them (not client-side SPA routing)
preserve each page's global-scope script variables exactly like the
original multi-page app.

If/when you want to incrementally rewrite a specific page into real React
components, this structure makes that possible one page at a time without
touching the rest.

## Known behavioural notes (carried over from the original, or specific to Next.js hosting)

- **Sessions & the `/api/compare-models` job queue are in-memory** (a
  `Map`, same as the original's default `express-session` MemoryStore and
  its in-process job table). This means: works great on a single
  long-running Node process (`next start`), but won't survive a restart
  and won't work correctly across multiple serverless instances (e.g.
  Vercel functions). If you need that, swap `src/lib/session.js` for
  Redis/DB-backed sessions and `src/lib/compareJobs.js` for a real job
  queue.
- `/model-comparison` (the old `res.sendFile(path.join(__dirname,
  'model_compare.html'))` route) was already broken in the original app
  (that file doesn't exist at the project root, only under `public/`) — I
  did not "fix" this, to keep behaviour identical. The real page is at
  `/model_compare.html`.
- The MongoDB Atlas credentials from the original `.env` were copied into
  `.env.local` so the app works out of the box against the same database —
  see the security note at the top of that file. Rotating that password is
  worth doing since it was sitting in a plaintext zip.

## Running it

```bash
npm install --no-optional --ignore-scripts   # brain.js's optional GPU dep (gl) needs
                                              # native build tools; skip it, CPU path is used
npm install lightningcss                     # re-pull the native binary tailwindcss/postcss needs
npm run dev      # http://localhost:5005

# separately, the Python ML service (unchanged):
cd ml-service
python3 -m venv venv && source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --port 8002
```

`npm run build && npm run start` for production (same port, 5005).
