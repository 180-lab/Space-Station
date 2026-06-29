import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(({ command, mode }) => {
  const isProduction = mode === 'production' || command === 'build';
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      minify: 'esbuild',
      sourcemap: false, // Ensures hackers cannot reconstruct original source using sourcemaps
      cssMinify: true,
      rollupOptions: {
        output: {
          manualChunks: undefined, // Let Vite optimize chunking
        }
      }
    },
    esbuild: isProduction ? {
      drop: ['console', 'debugger'], // Drops all logging and debugging statements in production build
      minifyIdentifiers: true,       // Mangles variable and function names into unreadable single characters
      minifySyntax: true,            // Compact syntax optimization
      minifyWhitespace: true,        // Heavy whitespace compression
      keepNames: false,              // Disables preservation of names for maximum obfuscation
      legalComments: 'none',         // Removes license and legal comments from build output
    } : {},
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {
        ignored: ['**/galaxy_state.json'],
      },
      allowedHosts: true,
    },
  };
});
