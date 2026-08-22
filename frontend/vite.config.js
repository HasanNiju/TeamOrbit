import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // In local dev the frontend runs on :5173 and the backend on :4000.
    // Proxying /api (and /uploads, for profile photos) keeps every fetch
    // call in the app relative ("/api/...") so no code branches on
    // environment — the same build works once the backend serves this
    // frontend itself in production.
    proxy: {
      "/api": { target: "http://localhost:4000", changeOrigin: true },
      "/uploads": { target: "http://localhost:4000", changeOrigin: true },
    },
  },
});
