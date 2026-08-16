# Employee Reporting System — Employee Frontend

React + Vite implementation of Module A from the PRD: the mobile-first,
Bangla-first Marketing Officer app with exactly three sections
(Submission, Stats, Profile).

## Run it

```bash
cd frontend
npm install
npm run dev
```

Then open the printed local URL (defaults to `http://localhost:5173`) and
resize/inspect on a phone-width viewport — that's the primary target.

### Demo login

The app ships with a mock API (`src/api/mockApi.js`) backed by
`localStorage`, seeded with one demo employee and ~40 historical
submissions so Stats/Rank aren't empty:

```
Employee ID: EMP-001
Password:    demo123
```

## What's real vs. mocked

Everything in `src/pages`, `src/components`, `src/context`, `src/i18n`,
and `src/utils` is the real frontend — it's what you'd ship. The one thing
standing in for the real system is `src/api/mockApi.js`, which fakes the
Node/Express + PostgreSQL backend described in the PRD (§52–54):

- `login`, `getSession`, `logout`
- `getProfile`, `updateProfile`
- `submitReport`, `getStats`

Every function has the same signature and return shape a real REST call
should have, and includes a simulated network delay. **To connect a real
backend**, replace the bodies of those functions with `fetch()` calls to
the routes in PRD §54 (`/login`, submission, stats endpoints) — no page
component needs to change.

## Key behaviors implemented per the PRD

- **Bangla by default**, English switch persisted per-user (Profile →
  Language), via `src/i18n` translation files — no hard-coded strings in
  components (§16).
- **Bottom navigation**, fixed on mobile with large touch targets; becomes
  a sticky top bar ≥768px without changing the information architecture
  (§4).
- **Submission window is Asia/Dhaka, 08:00–20:00**, computed via `Intl`
  independent of the device's local clock/timezone (`src/utils/dhakaTime.js`).
  The mock API re-checks this itself before accepting a report — mirroring
  the PRD's requirement that the *server*, not the browser, is authoritative
  (§10, §57). The UI also polls every 30s so the form locks/unlocks live at
  the boundary without a page reload.
- **Unlimited reports per day** — every submission is stored as an
  independent record; there is no per-day uniqueness constraint anywhere in
  the mock store (§8). The form clears and stays open for the next report
  immediately after a success toast (§9).
- **Stats** (today/week/month/total) and **rank** are computed from the
  submission records, not hard-coded (§12–13).
- **Profile editing** only allows the fields the PRD marks as
  employee-editable (name, mobile, address, photo, zone); Employee ID,
  role, totals, rank, Team Leader and Manager are always read-only (§15).
- Bangla numeral formatting for all counters/ranks when the UI language is
  Bangla (`src/utils/banglaNumerals.js`).
- Friendly Bangla/English error and loading copy throughout; no raw
  backend errors are ever shown (§19–20).

## Not in this pass

This PRD is a two-module system. Only **Module A (Employee Frontend)** is
built here, per your request. The Admin/Super-Admin backend (Module B —
dashboard, submissions table, employee management, Excel export) is a
separate, desktop-oriented app and isn't started yet.

Also out of scope for this pass, called out in the PRD itself as MVP
exclusions: offline submission support (§57) and real image
resize/compression for profile photos (client validates type/size but
doesn't compress, §49).
