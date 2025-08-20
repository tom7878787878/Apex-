import { defineConfig } from "vite";
import remix from "@remix-run/dev/vite";

export default defineConfig({
  plugins: [remix()],
});