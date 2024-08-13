import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { crx } from "@crxjs/vite-plugin";
import manifest from "./manifest.json";
import path from "path";
import { terser } from "rollup-plugin-terser";

export default defineConfig({
  plugins: [react(), crx({ manifest })],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    minify: "terser", // Use terser for minification
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            return "vendor";
          }
          if (id.includes("tf-worker")) {
            return "tf-worker";
          }
          if (id.includes("bucket-worker")) {
            return "bucket-worker";
          }
        },
      },
      //@ts-ignore
      plugins: [terser()], // Add terser plugin
    },
    chunkSizeWarningLimit: 1000, // Adjust chunk size warning limit
  },
});
