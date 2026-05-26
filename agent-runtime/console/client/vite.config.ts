import react from "@vitejs/plugin-react";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import { loadKnownEnv } from "../server/src/utils/env";
import { resolveDevApiTarget } from "./viteProxy";

const consoleDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
loadKnownEnv(consoleDir);
const apiTarget = resolveDevApiTarget(process.env.AGENTLAB_CONSOLE_HOST, process.env.AGENTLAB_CONSOLE_PORT);

export default defineConfig({
  root: "client",
  plugins: [react()],
  server: {
    host: "127.0.0.1",
    port: 5173,
    proxy: {
      "/api": apiTarget,
    },
  },
  build: {
    outDir: "../dist/client",
    emptyOutDir: true,
  },
});
