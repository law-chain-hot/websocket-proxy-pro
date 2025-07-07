import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import webExtension from "vite-plugin-web-extension";

export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    webExtension({
      manifest: "./src/manifest.json",
      watchFilePaths: ["src/**/*"],
      webExtConfig: {
        startUrl: "https://example.com",
      },
      additionalInputs: [
        "src/content/injected.js",
        "src/devtools/panel.html",
        "src/popup/popup.html",
      ],
    }),
  ],
  build: {
    minify: mode === "development" ? false : true,
    sourcemap: mode === "development",
    rollupOptions: {
      output: {
        inlineDynamicImports: false,
      },
    },
    watch:
      mode === "development"
        ? {
            include: ["src/**/*"],
            exclude: ["node_modules/**", "dist/**"],
            buildDelay: 300,
          }
        : null,
  },
}));
