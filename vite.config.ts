import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        rewrite: (path) => {
          // Añadir .php si la ruta no tiene extensión
          if (!path.includes('.php') && !path.endsWith('/')) {
            return path + '.php';
          }
          return path;
        }
      }
    }
  },
  build: {
    outDir: 'dist',
    assetsDir: 'app-assets',
    emptyOutDir: true,
  }
});
