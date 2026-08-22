# TeamOrbit — Employee Reporting System

One project, one deploy, one link. This repo contains:

```
frontend/     Employee app (React + Vite) — Bangla-first, mobile web app for Marketing Officers
backend/      REST API + dummy data layer + Admin Management Panel (Team Leaders / Managers)
```

The backend serves everything: the API at `/api/*`, the Admin Panel at
`/admin`, and the built employee app at `/`. Deployed once, you get:

- `https://your-app-url/` — employee app (submit reports, stats, profile)
- `https://your-app-url/admin` — Team Leader / Super Admin management panel

Both work from a phone browser or a PC — no app install needed, just the link.

Data is currently **dummy / in-memory** (resets on restart) so you can try
the whole product today. Swapping in Supabase/PostgreSQL later only touches
`backend/src/data/store.js` — see `backend/README.md` §4.

---

## Run it locally

You need [Node.js](https://nodejs.org) 18+.

```bash
npm install          # installs both frontend + backend (npm workspaces)
cp backend/.env.example backend/.env   # then edit backend/.env — change the secrets
npm run build         # builds the employee frontend into frontend/dist
npm start              # starts the backend, which now serves everything
```

Open:
- **http://localhost:4000/** — employee app
- **http://localhost:4000/admin** — admin panel

### Dummy login accounts (seeded automatically, no setup needed)

| App | Role | ID | Password |
|---|---|---|---|
| Employee app (`/`) | Marketing Officer | `EMP-001` | `demo123` |
| Admin panel (`/admin`) | Team Leader | `TL-001` | `leader123` |
| Admin panel (`/admin`) | Super Admin (Manager) | `SA-001` | `admin123` |

(A handful more of each — `EMP-002`…`EMP-008`, `TL-002`, `TL-003`,
`SA-002` — are seeded too; see `backend/README.md` for the full list.)

### Working on the frontend UI only (fast refresh, no build step)

```bash
npm run dev:backend    # terminal 1 — API + admin panel on :4000
npm run dev:frontend   # terminal 2 — Vite dev server on :5173 with hot reload
```
Open **http://localhost:5173** — it proxies `/api` calls to the backend on
:4000 automatically (see `frontend/vite.config.js`), so you get live reload
against real (dummy) data.

---

## Deploy it (get a real link)

I can't deploy this from where I built it (no network egress in this
environment), but it's set up to deploy as **one service** anywhere that
runs Node — push this repo to GitHub, then connect it to something like
[Render](https://render.com), [Railway](https://railway.app), or
[Fly.io](https://fly.io):

- **Build command:** `npm install && npm run build`
- **Start command:** `npm start`
- **Environment variables:** copy everything from `backend/.env.example`
  into the host's dashboard. At minimum, change `JWT_SECRET` to a long
  random string and change `BOOTSTRAP_SUPER_ADMIN_PASSWORD` before sharing
  the link with anyone.
- **Port:** the app reads `PORT` from the environment (most hosts set this
  automatically).

Once deployed, you'll get a permanent URL like
`https://team-orbit.onrender.com` — that's the link. Share
`https://team-orbit.onrender.com/` with Marketing Officers and
`https://team-orbit.onrender.com/admin` with Team Leaders/Managers.

**Quick temporary link for testing today**, without deploying anywhere:
```bash
npm run build && npm start          # backend now serving everything on :4000
npx ngrok http 4000                  # in another terminal
```
ngrok gives you a public `https://...ngrok-free.app` URL you can open on
your phone right now.

---

## What's real vs. dummy right now

| | Status |
|---|---|
| Auth (JWT + bcrypt), role permissions | Real |
| 8am–8pm Asia/Dhaka submission window, server-side | Real |
| Saturday–Friday week bucketing, rank calculation | Real |
| Excel export | Real |
| Frontend ↔ backend wiring (`realApi.js`) | Real |
| The actual data (users, submissions) | **Dummy** — in-memory, resets on restart |

See `backend/README.md` for exactly which file to change when you're ready
to connect Supabase/PostgreSQL.

---

## Repo structure

```
TeamOrbit/
  package.json              root scripts (npm workspaces: build/start everything)
  Employee_Reporting_System_PRD_v1.1.md
  frontend/                 React/Vite employee app
    src/api/realApi.js        talks to backend/src/routes/employee.routes.js
    src/api/client.js         switches between realApi and the old localStorage mock
    dist/                     build output (created by `npm run build`), served by backend at "/"
  backend/                  Express API + dummy data + Admin Panel
    src/                      API source — see backend/README.md for full API reference
    admin-panel/              static Admin Panel SPA, served at "/admin"
    uploads/                  uploaded profile photos
    README.md                 backend-specific details (API endpoints, data model, deploy notes)
```
