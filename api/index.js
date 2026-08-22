// Vercel routes every /api/* request here (see vercel.json rewrites).
// Express apps are valid Node request handlers, so exporting it directly
// works as a Vercel serverless function — no adapter needed.
const buildServerlessApp = require("../backend/src/serverlessApp");

module.exports = buildServerlessApp();
