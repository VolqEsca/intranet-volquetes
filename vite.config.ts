import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    hmr: {
      clientPort: 443,
    },
    allowedHosts: ["hcm7s3-5173.csb.app"],
  },
  build: {
    outDir: 'dist',
    assetsDir: 'app-assets', // ✅ CRÍTICO: Evita colisión con /assets del backend
    emptyOutDir: true,
  }
});
