# TeamOrbit Backend + Admin Management Panel

> **This backend now lives inside the TeamOrbit monorepo** and serves the
> employee frontend too. See the **root `README.md`** (one level up) for the
> full setup, run, and deploy instructions — that's the one to follow.
>
> Everything below still applies to this folder specifically (API reference,
> data model notes) and is referenced from the root README.

This is the backend for the TeamOrbit Employee Reporting System, built to
match `Employee_Reporting_System_PRD_v1.1.md`. It includes:

1. **A REST API** for the employee frontend (login, submit reports, view
   stats/rank, edit profile) — now actually wired up to `../frontend`.
2. **An Admin Management Panel** — a clean, minimal, fast web app for Team
   Leaders and Managers (Super Admins) to view submissions, manage
   employees, and export reports to Excel. Served by this same backend at
   `/admin`.
3. **The built employee frontend**, served at `/` once you've run
   `npm run build` (from the repo root) — so the whole product is one
   deployable service with one link.

Right now it runs on **dummy, in-memory data** (regenerated every restart).
Everything is structured so swapping in Supabase/PostgreSQL later only means
rewriting `src/data/store.js` — no controller, route, or frontend code needs
to change.

---

## 1. Run it locally (from this folder directly)

You can run just the backend on its own (it'll serve the Admin Panel and
the API; the employee frontend needs a separate `npm run dev` unless you've
already built it — see root README for the one-command version).

```bash
cd backend
npm install
cp .env.example .env      # then open .env and change the secrets
npm start                 # or: npm run dev  (auto-restarts on file changes)
```

You'll see:

```
TeamOrbit backend running on port 4000
  API:         http://localhost:4000/api/health
  Admin Panel: http://localhost:4000/admin
```

Open **http://localhost:4000/admin** for the Admin Panel, or
**http://localhost:4000/** for the employee app (if `frontend/dist` has
been built — otherwise `/` redirects to `/admin`).

### Dummy login accounts (seeded automatically)

| Role             | ID     | Password  |
|------------------|--------|-----------|
| Super Admin (Manager) | `SA-001` | `admin123` |
| Super Admin (Manager) | `SA-002` | `admin123` |
| Team Leader (Admin)   | `TL-001` | `leader123` |
| Team Leader (Admin)   | `TL-002` | `leader123` |
| Team Leader (Admin)   | `TL-003` | `leader123` |
| Marketing Officer     | `EMP-001` | `demo123` |
| Marketing Officer     | `EMP-002` … `EMP-008` | `demo123` |

The Admin Panel (`/admin`) is for Team Leaders and Super Admins only —
Marketing Officer accounts are rejected there and belong in the employee
app at `/`.

---

## 2. Deploying this as a public link

See the root README's **"Deploy it"** section — since this backend now
serves the built employee frontend too, deployment is one service with one
URL: `https://your-app-url/` is the employee app, `https://your-app-url/admin`
is the Admin Panel.

---

## 3. How the employee frontend is wired up

`frontend/src/api/realApi.js` calls this backend's REST API directly
(relative `/api/...` paths — same-origin once deployed together, proxied in
local dev via `frontend/vite.config.js`). `frontend/src/api/client.js` is
the single import point every page uses; it defaults to `realApi.js` and
falls back to the old localStorage mock only if `VITE_USE_MOCK=true` is set.

Endpoints the employee app uses:
- `POST /api/auth/login` `{ employeeId, password }` → `{ token, user }`
- `POST /api/auth/logout`
- `GET  /api/me` → profile + rank
- `PATCH /api/me` → edit name/mobile/address/zone
- `POST /api/me/photo` (multipart `photo`) → upload profile photo
- `GET  /api/me/stats` → today/week/month/total + rank
- `GET  /api/me/submissions?page=1&limit=20` → submission history
- `GET  /api/submissions/window` → `{ open: boolean }` for the 8am–8pm gate
- `POST /api/submissions` `{ name, designation, address, mobile, opinion }`

---

## 4. What's dummy vs. real right now

- **Real:** auth (JWT + bcrypt), the 8am–8pm Asia/Dhaka submission window
  check, Saturday–Friday week bucketing, rank calculation, role-based
  permissions, Excel export, validation, rate limiting.
- **Dummy:** the data itself lives in memory (`src/data/store.js`) and
  resets on every restart. `src/data/seed.js` is the only file that plants
  the sample users/history — replace its calls to `store.createUser` /
  `store.submissions.push` with real Supabase/Postgres queries when you're
  ready for Phase 2, and update the functions in `store.js` to run SQL
  instead of reading arrays.

---

## 5. Project structure

```
TeamOrbit/                    (repo root — see root README)
  frontend/                   your existing React/Vite employee app
    src/api/realApi.js          talks to this backend
    src/api/client.js            mock/real switch used by every page
    dist/                       created by `npm run build`; served by the backend at "/"
  backend/                    this folder
    src/
      server.js                entry point
      app.js                    Express app — serves API, /admin, and frontend/dist
      data/
        store.js                 in-memory "database" — swap this file for Supabase later
        seed.js                  dummy data generator
      routes/                   /api/auth, /api/me+submissions, /api/admin, /api/super-admin, /api/account
      controllers/              request handlers per role
      services/                 authService (JWT/bcrypt), exportService (Excel)
      middleware/               auth, role guard, rate limiting, error handler, upload
      utils/                    Dhaka time helpers, validation, response helpers
    admin-panel/              static SPA served at /admin (no build step needed)
      index.html
      css/style.css
      js/                       api client, router, pages (dashboard, submissions, employees, ...)
    uploads/                  profile photos land here (dummy/local storage for now)
```
