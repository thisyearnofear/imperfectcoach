import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  base: "/",
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ['react', 'react-dom'],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Split heavy libraries for better caching
          vendor: ['react', 'react-dom'],
          tensorflow: ['@tensorflow/tfjs-core', '@tensorflow/tfjs-backend-webgl', '@tensorflow/tfjs-backend-cpu'],
          mediapipe: ['@mediapipe/pose'],
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-select', '@radix-ui/react-switch'],
          wallet: ['wagmi', 'viem'],
          solana: ['@solana/web3.js', '@solana/wallet-adapter-base'],
        }
      },
      // Suppress specific warnings about ox package comments
      onwarn(warning, warn) {
        // Ignore /*#__PURE__*/ annotation warnings from ox package
        if (warning.code === 'UNRESOLVED_IMPORT' && warning.message.includes('ox')) {
          return;
        }
        if (warning.code === 'PLUGIN_WARNING' && warning.message.includes('/*#__PURE__*/')) {
          return;
        }
        if (warning.message && warning.message.includes('contains an annotation that Rollup cannot interpret')) {
          return;
        }
        warn(warning);
      }
    },
    chunkSizeWarningLimit: 2000,
    sourcemap: false,
    target: 'es2020',
    minify: 'esbuild',
  },
  optimizeDeps: {
    exclude: [
      '@tensorflow/tfjs-core',
      '@tensorflow/tfjs-backend-webgl',
      '@tensorflow/tfjs-backend-cpu',
      '@tensorflow/tfjs-backend-webgpu',
      '@tensorflow/tfjs-converter',
      '@tensorflow-models/pose-detection',
      '@mediapipe/pose'
    ]
  }
}));
