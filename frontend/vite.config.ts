import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      "@shared": fileURLToPath(new URL("../shared", import.meta.url)),
    },
  },
  server: {
    port: 5173,
    fs: {
      // Allow importing `shared/types.ts` which lives one level above this
      // project's root (monorepo-style sibling folder).
      allow: [fileURLToPath(new URL("..", import.meta.url))],
    },
    // Optional dev proxy so the SPA can call relative "/apps" paths and
    // avoid CORS entirely while developing against a local backend.
    // Set VITE_API_URL to an absolute URL to bypass this proxy instead.
    proxy: {
      "/apps": {
        target: "http://localhost:8000",
        changeOrigin: true,
      },
      "/pumpfun": {
        target: "http://localhost:8000",
        changeOrigin: true,
      },
      "/health": {
        target: "http://localhost:8000",
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: "dist",
    sourcemap: false,
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      output: {
        manualChunks: {
          "vendor-react": ["react", "react-dom", "react-router-dom"],
          "vendor-wallet": [
            "@solana/wallet-adapter-react",
            "@solana/wallet-adapter-react-ui",
            "@solana/wallet-adapter-wallets",
            "@solana/wallet-adapter-base",
            "@solana/web3.js",
          ],
          "vendor-prism": ["prismjs"],
        },
      },
    },
  },
});
