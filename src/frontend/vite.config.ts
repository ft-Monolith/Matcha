import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],

  resolve: {
    alias: {
      "@common": fileURLToPath(new URL("../common", import.meta.url)),
      "@web": fileURLToPath(new URL("./Web", import.meta.url)),
      "@shadcn": fileURLToPath(new URL("./shadcn", import.meta.url)),
    },
  },

  server: {
    host: true,
    port: 5173,
    strictPort: true,
    hmr: { protocol: "wss", clientPort: 8443 },
    watch: { usePolling: true },
  },
});
