// ---------------------------------------------------------------------------
// Vercel serverless entry point for the API.
//
// This is deliberately leaner than app.js: no static file serving (the
// frontend build is deployed by Vercel separately, as static output), and
// no disk-based /uploads (photos are stored as base64 data URIs in
// Supabase — see controllers/employee.controller.js).
// ---------------------------------------------------------------------------

const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const compression = require("compression");

const apiRoutes = require("./routes");
const { errorHandler, notFoundHandler } = require("./middleware/errorHandler");

function buildServerlessApp() {
  const app = express();

  app.disable("x-powered-by");
  app.set("trust proxy", 1);

  app.use(
    helmet({
      contentSecurityPolicy: false, // frontend is a separate static deployment; CSP belongs there, not on JSON API responses
    })
  );

  const origins = (process.env.CORS_ORIGINS || "*").split(",").map((o) => o.trim());
  app.use(
    cors({
      origin: origins.includes("*") ? true : origins,
      credentials: true,
    })
  );

  app.use(compression());
  app.use(express.json({ limit: "2mb" }));
  app.use(express.urlencoded({ extended: true, limit: "2mb" }));
  app.use(cookieParser());

  app.use("/api", apiRoutes);
  app.use("/api", notFoundHandler);
  app.use(errorHandler);

  return app;
}

module.exports = buildServerlessApp;
