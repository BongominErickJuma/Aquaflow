import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
export default defineConfig(function (_a) {
  var mode = _a.mode;
  var env = loadEnv(mode, process.cwd(), "");
  var proxyTarget = env.VITE_DEV_PROXY_TARGET || "http://localhost:8000";
  return {
    plugins: [react(), tailwindcss()],
    server: {
      port: 5173,
      proxy: {
        "/api": {
          target: proxyTarget,
          changeOrigin: true,
        },
        "/media": {
          target: proxyTarget,
          changeOrigin: true,
        },
      },
    },
  };
});
