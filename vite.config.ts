import { defineConfig } from "vite";
import { resolve } from "node:path";

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        notFound: resolve(__dirname, "404.html"),
      },
    },
    target: "es2022",
  },
  server: {
    host: "127.0.0.1",
    port: 4189,
    strictPort: true,
  },
});
