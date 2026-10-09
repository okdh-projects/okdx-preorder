import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsconfigPaths from "vite-tsconfig-paths";
import path from "node:path";
import fs from "node:fs";

// Exposes the current contents of public/images as a virtual module.
function publicImagesPlugin(): Plugin {
  const id = "virtual:public-images";
  const resolved = "\0" + id;
  const dir = path.resolve(__dirname, "public/images");
  const list = () =>
    fs.existsSync(dir)
      ? fs.readdirSync(dir).filter((f) => /\.(png|jpe?g|webp|gif|svg|avif)$/i.test(f)).sort()
      : [];
  return {
    name: "public-images",
    resolveId: (s) => (s === id ? resolved : null),
    load: (s) => (s === resolved ? `export default ${JSON.stringify(list())};` : null),
    configureServer(server) {
      server.watcher.add(dir);
      const reload = (file: string) => {
        if (!file.startsWith(dir)) return;
        const mod = server.moduleGraph.getModuleById(resolved);
        if (mod) server.moduleGraph.invalidateModule(mod);
        server.ws.send({ type: "full-reload" });
      };
      server.watcher.on("add", reload);
      server.watcher.on("unlink", reload);
    },
  };
}

export default defineConfig({
  base: "./",
  plugins: [react(), tailwindcss(), tsconfigPaths(), publicImagesPlugin()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    host: "::",
    port: 8080,
    strictPort: true,
  },
});
