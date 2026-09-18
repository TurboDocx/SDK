import path from "path";

import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

// The browser never imports @turbodocx/sdk — the demo SPA calls its own backend (server.ts) over
// /api/*, and that server holds the key and talks to TurboDocx. So no node-builtin polyfills are
// needed here. In dev we proxy /api to the backend so the browser makes same-origin requests.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  publicDir: false,
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: `http://localhost:${process.env.SERVER_PORT || 4000}`,
        changeOrigin: true,
      },
    },
  },
});
