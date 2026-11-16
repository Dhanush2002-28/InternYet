import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

// When the real jspdf package is not installed (offline PC without a full
// node_modules copy), Vite aliases "jspdf" to the built-in offline fallback
// so the whole app still works and PDFs open as a printable preview.
const jspdfInstalled = existsSync(
  fileURLToPath(new URL("./node_modules/jspdf/package.json", import.meta.url))
);

export default defineConfig({
  plugins: [react()],
  server: { port: 5173, host: true },
  build: { outDir: "dist" },
  resolve: {
    alias: jspdfInstalled
      ? undefined
      : { jspdf: fileURLToPath(new URL("./src/utils/pdf/jspdf-fallback.js", import.meta.url)) }
  }
});