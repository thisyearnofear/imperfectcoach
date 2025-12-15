import { defineConfig, Plugin, transformWithEsbuild } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

/**
 * Custom Vite plugin to handle ox package's TypeScript-in-JS files
 * The ox package (viem dependency) incorrectly exports TypeScript types in .js files
 */
function stripTypeExportsPlugin(): Plugin {
  return {
    name: 'strip-type-exports',
    enforce: 'pre',
    async transform(code, id) {
      // Only process ox package files that contain type exports
      if (id.includes('node_modules') && id.includes('ox') && id.endsWith('.js')) {
        // Check if file contains TypeScript type syntax
        if (code.includes('export type ') || code.includes('export interface ')) {
          try {
            // Use Vite's internal esbuild to strip TypeScript syntax
            const result = await transformWithEsbuild(code, id, {
              loader: 'ts', // Treat as TypeScript to strip types
              format: 'esm',
              target: 'es2020',
            });
            return {
              code: result.code,
              map: result.map,
            };
          } catch (e) {
            // If transform fails, log and continue
            console.warn(`[strip-type-exports] Failed to transform ${id}:`, e);
          }
        }
      }
      return null;
    }
  };
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  base: "/",
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    stripTypeExportsPlugin(),
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
    commonjsOptions: {
      transformMixedEsModules: true,
    },
  },
  optimizeDeps: {
    exclude: [
      // Web3 packages - exclude to avoid ox subpath resolution issues
      'ox',
      'viem',
      'wagmi',
      'ethers',
      '@rainbow-me/rainbowkit',
      'thirdweb',
      '@thirdweb-dev/react',
      '@thirdweb-dev/sdk',
      '@solana/web3.js', // Exclude Solana web3 to avoid eventemitter3 ESM issues
      '@solana/wallet-adapter-base',
      '@solana/wallet-adapter-react',
      '@solflare-wallet/sdk', // Exclude Solflare to avoid eventemitter3 issues
      'eventemitter3', // Explicitly exclude to use ESM version
      // ML/Pose packages
      '@tensorflow/tfjs-core',
      '@tensorflow/tfjs-backend-webgl',
      '@tensorflow/tfjs-backend-cpu',
      '@tensorflow/tfjs-backend-webgpu',
      '@tensorflow/tfjs-converter',
      '@tensorflow-models/pose-detection',
      '@mediapipe/pose'
    ],
  }
}));
