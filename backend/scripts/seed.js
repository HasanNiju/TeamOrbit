// One-time seeding script. Run locally with your Supabase env vars set:
//   cd backend
//   cp .env.example .env   # then fill in SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY
//   npm run seed
require("dotenv").config();
const { seed } = require("../src/data/seed");

seed()
  .then(() => {
    console.log("Done.");
    process.exit(0);
  })
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
  });
