import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import nodePolyfills from "rollup-plugin-node-polyfills";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3001,
    open: true,
  },
  build: {
    outDir: "dist",
    sourcemap: true,
    rollupOptions: {
      plugins: [
        nodeResolve({ 
          browser: true,
          preferBuiltins: false 
        }),
        commonjs(),
        nodePolyfills(),
      ],
      onwarn(warning, warn) {
        // Suppress specific warnings for cleaner output
        if (warning.code === 'MODULE_LEVEL_DIRECTIVE') return;
        if (warning.message?.includes('annotation that Rollup cannot interpret')) return;
        warn(warning);
      },
    },
  },
  resolve: {
    alias: {
      "@": "/src",
      buffer: "buffer",
      crypto: "/src/mock-crypto.ts",
      zlib: "/src/mock-zlib.ts",
      stream: "/src/mock-stream.ts",
      http: "/src/mock-http.ts",
      https: "/src/mock-https.ts",
      url: "/src/mock-url.ts",
    },
  },
  define: {
    global: "globalThis",
    process: { env: {} },
  },
  optimizeDeps: {
    include: ["buffer"],
  },
});
