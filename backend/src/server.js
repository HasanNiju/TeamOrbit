require("dotenv").config();

const buildApp = require("./app");
const { seed } = require("./data/seed");

seed();

const app = buildApp();
const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`\nTeamOrbit backend running on port ${PORT}`);
  console.log(`  API:         http://localhost:${PORT}/api/health`);
  console.log(`  Admin Panel: http://localhost:${PORT}/admin`);
  console.log(`\nDummy login accounts:`);
  console.log(`  Super Admin:  SA-001 / admin123`);
  console.log(`  Team Leader:  TL-001 / leader123`);
  console.log(`  Marketing Officer: EMP-001 / demo123\n`);
});
