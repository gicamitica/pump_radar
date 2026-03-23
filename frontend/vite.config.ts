import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const useMsw = env.VITE_USE_MSW === "true";

  return {
    plugins: [react(), tsconfigPaths(), tailwindcss()],
    build: {
      sourcemap: false,
      chunkSizeWarningLimit: 700,
    },
    optimizeDeps: {
      entries: ["index.html"],
      esbuildOptions: {
        resolveExtensions: [".js", ".mjs", ".cjs"],
      },
    },
    server: {
      host: "0.0.0.0",
      port: 3000,
      allowedHosts: true,
      proxy: useMsw
        ? undefined
        : {
            "/api": {
              target: "http://localhost:8001",
              changeOrigin: true,
              secure: false,
            },
          },
    },
  };
});
