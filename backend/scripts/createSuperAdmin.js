// ---------------------------------------------------------------------------
// Create (or fix) a REAL Super Admin account directly in Supabase.
//
// Why this exists: the demo accounts (SA-001 etc.) come from
// backend/supabase_seed.sql / scripts/seed.js, which only run if you
// execute them yourself — the Vercel deployment (src/serverlessApp.js)
// never auto-seeds. If a Super Admin login gets "You do not have
// permission to perform this action", the account either doesn't exist,
// or its `role` column isn't exactly "SUPER_ADMIN" (case-sensitive).
// This script creates the account fresh, or fixes an existing one, so the
// role/password are guaranteed correct — using the exact same code path
// (store.createUser) the rest of the app uses.
//
// Usage (run from the backend/ folder, with your real Supabase project's
// env vars available — either export them or put them in backend/.env):
//
//   cd backend
//   cp .env.example .env        # if you haven't already, then fill in
//                                # SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY
//   node scripts/createSuperAdmin.js --id SA-100 --password "SomeStrongPass1!" --name "Your Name"
//
// If --password is omitted, a strong random one is generated and printed
// ONCE — save it, it is not stored anywhere in plain text.
// ---------------------------------------------------------------------------

require("dotenv").config();
const crypto = require("crypto");
const store = require("../src/data/store");
const { ROLES } = store;

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i].startsWith("--")) {
      const key = argv[i].slice(2);
      const val = argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[i + 1] : true;
      args[key] = val;
      if (val !== true) i += 1;
    }
  }
  return args;
}

function generatePassword() {
  // 16 chars, URL-safe, no ambiguous characters needed since it's shown once.
  return crypto.randomBytes(12).toString("base64").replace(/[+/=]/g, "").slice(0, 16);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  const employeeId = args.id || process.env.SUPER_ADMIN_ID || "SA-100";
  const name = args.name || process.env.SUPER_ADMIN_NAME || "Super Admin";
  const password = args.password || process.env.SUPER_ADMIN_PASSWORD || generatePassword();
  const generated = !args.password && !process.env.SUPER_ADMIN_PASSWORD;

  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error(
      "\nMissing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY.\n" +
        "Set them in backend/.env (copy backend/.env.example) or export them\n" +
        "in your shell before running this script — use the SAME project your\n" +
        "Vercel deployment is connected to.\n"
    );
    process.exit(1);
  }

  const existing = await store.findUserByEmployeeId(employeeId);

  let user;
  if (existing) {
    // Account already exists — fix it in place (role, password, reactivate)
    // rather than failing, since this is exactly the "permission error"
    // repair path.
    const bcrypt = require("bcryptjs");
    user = await store.updateUser(existing.id, {
      role: ROLES.SUPER_ADMIN,
      status: "active",
      password_hash: bcrypt.hashSync(password, 10),
      name,
      name_en: name,
    });
    console.log(`\n[updated] Existing account "${employeeId}" fixed: role=SUPER_ADMIN, status=active, password reset.`);
  } else {
    user = await store.createUser({
      employeeId,
      name,
      nameEn: name,
      password,
      role: ROLES.SUPER_ADMIN,
      designation: "Super Admin",
      language: "en",
      status: "active",
    });
    console.log(`\n[created] New Super Admin account "${employeeId}".`);
  }

  console.log("\n----------------------------------------");
  console.log(`  Employee ID: ${user.employee_id}`);
  console.log(`  Password:    ${password}${generated ? "  (auto-generated — save this now)" : ""}`);
  console.log(`  Role:        ${user.role}`);
  console.log("----------------------------------------\n");
  console.log("Log in at /login -> \"Login as Admin\" using the ID and password above.");
  console.log("Change the password afterwards from Admin -> Account.\n");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("\nFailed:", err.message);
    process.exit(1);
  });
