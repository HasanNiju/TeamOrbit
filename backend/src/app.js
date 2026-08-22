const path = require("path");
const fs = require("fs");
const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const compression = require("compression");
const morgan = require("morgan");

const apiRoutes = require("./routes");
const { errorHandler, notFoundHandler } = require("./middleware/errorHandler");

function buildApp() {
  const app = express();

  app.disable("x-powered-by");
  app.set("trust proxy", 1); // needed for correct rate-limiting/IPs behind Render/Railway/etc.

  app.use(
    helmet({
      // Admin panel is a same-origin static SPA served by this app and calls
      // its own /api endpoints only, so a default-ish CSP is fine here.
      contentSecurityPolicy: {
        directives: {
          ...helmet.contentSecurityPolicy.getDefaultDirectives(),
          "img-src": ["'self'", "data:", "blob:"],
          "script-src": ["'self'"],
          // The employee frontend loads Google Fonts (Hind Siliguri / Work
          // Sans) from a <link>, so those two origins need to be allowed
          // alongside same-origin styles/fonts.
          "style-src": ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
          "font-src": ["'self'", "https://fonts.gstatic.com"],
        },
      },
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
  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: true, limit: "1mb" }));
  app.use(cookieParser());

  if (process.env.NODE_ENV !== "test") {
    app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));
  }

  // Uploaded profile photos.
  app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));

  // API.
  app.use("/api", apiRoutes);

  // Admin Management Panel — static SPA, works from any device via this
  // same URL/link (no separate deploy needed).
  app.use("/admin", express.static(path.join(__dirname, "..", "admin-panel")));
  app.get("/admin/*", (req, res) => {
    res.sendFile(path.join(__dirname, "..", "admin-panel", "index.html"));
  });

  // Employee frontend (React/Vite build) — served at the root, so one link
  // ("https://your-app-url/") works for the employee app from a phone or PC,
  // and "/admin" is the management panel on the same host.
  const frontendDist = path.join(__dirname, "..", "..", "frontend", "dist");
  const frontendBuilt = fs.existsSync(path.join(frontendDist, "index.html"));

  if (frontendBuilt) {
    app.use(express.static(frontendDist));
    // BrowserRouter client-side routes (e.g. /login, /app/submission) need
    // to fall back to index.html so React Router can take over.
    app.get(/^\/(?!api|admin|uploads).*/, (req, res) => {
      res.sendFile(path.join(frontendDist, "index.html"));
    });
  } else {
    // Frontend hasn't been built yet (e.g. first local run before `npm run
    // build` in ../frontend) — send people somewhere useful instead of a
    // blank page.
    app.get("/", (req, res) => res.redirect("/admin"));
  }

  app.use("/api", notFoundHandler);
  app.use(errorHandler);

  return app;
}

module.exports = buildApp;
