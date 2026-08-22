// ---------------------------------------------------------------------------
// Supabase client — the backend's ONLY connection to persistent storage.
//
// Uses the SERVICE ROLE key (server-side only, never shipped to the
// frontend) so it bypasses Row Level Security. That's safe here because the
// only thing that talks to Supabase directly is this backend; the frontend
// always goes through /api/* routes, which enforce auth/roles themselves.
// ---------------------------------------------------------------------------

const { createClient } = require("@supabase/supabase-js");

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  // Don't crash the module load (helpful during `npm install`/build steps),
  // but every real query will fail loudly with a clear message.
  console.warn(
    "[supabase] SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are not set. " +
      "Set them in backend/.env (local) or your Vercel project's Environment " +
      "Variables (production) — see backend/supabase_schema.sql."
  );
}

const supabase = createClient(SUPABASE_URL || "https://placeholder.supabase.co", SUPABASE_SERVICE_ROLE_KEY || "placeholder", {
  auth: { persistSession: false, autoRefreshToken: false },
});

module.exports = supabase;
