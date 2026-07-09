import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: true,
    port: 5173,
    // Le navigateur accède via nginx (port 8080) : le WebSocket HMR doit viser ce port.
    hmr: { clientPort: 8080 },
  },
});
