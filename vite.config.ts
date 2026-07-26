import { defineConfig } from "vite";
import { cp, copyFile } from "node:fs/promises";
import { resolve } from "node:path";

export default defineConfig({
  plugins: [
    {
      name: "copy-static-site-files",
      apply: "build",
      async closeBundle() {
        await cp(
          resolve(__dirname, "assets"),
          resolve(__dirname, "dist/assets"),
          {
            recursive: true,
            force: true,
          },
        );
        await copyFile(
          resolve(__dirname, "CNAME"),
          resolve(__dirname, "dist/CNAME"),
        );
      },
    },
  ],
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
