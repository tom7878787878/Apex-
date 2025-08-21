import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import react from "@vitejs/plugin-react";
import { vitePlugin as remix } from "@remix-run/dev";

// ✅ Updated Vite config for Remix + React + TS
// - Uses the correct Remix Vite plugin import
// - Compatible with Node 18+ / Netlify
// - Avoids deprecated CJS API usage

export default defineConfig({
  plugins: [
    remix(),
    react(),
    tsconfigPaths()
  ],
  build: {
    target: "esnext", // Ensure modern build
  },
});
