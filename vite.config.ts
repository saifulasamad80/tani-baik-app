// vite.config.ts
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { VitePWA, type VitePWAOptions } from "vite-plugin-pwa";

const pwaOptions: Partial<VitePWAOptions> = {
  registerType: "autoUpdate",
  injectRegister: "auto",
  manifest: {
    name: "Tani Baik",
    short_name: "Tani Baik",
    description: "Sistem manajemen pertanian terpadu dan kasir UMKM Benih Tani Baik.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#f7fbf9",
    theme_color: "#2f9d7a",
    lang: "id",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any maskable",
      },
    ],
  },
  workbox: {
    cleanupOutdatedCaches: true,
    clientsClaim: true,
    skipWaiting: true,
    globPatterns: ["**/*.{js,css,html,ico,png,svg,woff,woff2,webmanifest}"],
    globIgnores: ["**/*.map"],
    navigateFallback: "/index.html",
    maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
    runtimeCaching: [
      {
        urlPattern: /^https:\/\/.*\.supabase\.co\/.*$/i,
        handler: "NetworkOnly",
        method: "GET",
      },
    ],
  },
};

export default defineConfig({
  tanstackStart: {
    server: { entry: "server" },
  },
  vite: {
    envPrefix: ["VITE_", "NEXT_PUBLIC_"],
    plugins: [VitePWA(pwaOptions)],
  },
});
