import { fileURLToPath } from "url";
import path from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Resolve this config file's own directory instead of relying on
// process.cwd(). Some CI environments (Vercel included, especially with
// a stale build cache or npm workspaces) can invoke `vite build` with an
// unexpected working directory, which makes Vite fail to find index.html
// ("Could not resolve entry module 'index.html'") even though the file
// is right there. Pinning `root` explicitly removes that ambiguity.
const rootDir = path.dirname(fileURLToPath(import.meta.url));

// https://vitejs.dev/config/
export default defineConfig({
  root: rootDir,
  plugins: [react()],
  build: {
    outDir: path.resolve(rootDir, "dist"),
    emptyOutDir: true,
  },
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
