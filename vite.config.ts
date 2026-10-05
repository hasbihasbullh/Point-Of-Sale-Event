import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig(() => {
  return {
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: "autoUpdate",
        includeAssets: ["icon.svg"],
        devOptions: {
          enabled: true,
          type: "module",
        },
        workbox: {
          globPatterns: ["**/*.{js,css,html,ico,png,svg,jpg,jpeg,webp}"],
          globIgnores: ["**/uploads/**"],
          maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/images\.unsplash\.com\/.*/i,
              handler: "CacheFirst",
              options: {
                cacheName: "unsplash-images-cache",
                expiration: {
                  maxEntries: 100,
                  maxAgeSeconds: 60 * 60 * 24 * 30, // 30 hari
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
            {
              urlPattern: /\/uploads\/.*/i,
              handler: "CacheFirst",
              options: {
                cacheName: "local-uploads-cache",
                expiration: {
                  maxEntries: 100,
                  maxAgeSeconds: 60 * 60 * 24 * 30,
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
          ],
        },
        manifest: {
          name: "POS System Event",
          short_name: "POS Event",
          start_url: "/",
          description: "Sistem POS Kasir, Kiosk, dan KDS Terintegrasi untuk Event Festival",
          theme_color: "#f97316",
          background_color: "#f8fafc",
          display: "standalone",
          orientation: "any",
          icons: [
            {
              src: "icon.svg",
              sizes: "192x192 512x512",
              type: "image/svg+xml",
              purpose: "any maskable",
            },
          ],
        },
      }),
    ],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "."),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== "true",
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch:
        process.env.DISABLE_HMR === "true"
          ? null
          : {
              ignored: ["**/android-kasir-pos-event/**", "**/node_modules/**"],
            },
    },
  };
});
