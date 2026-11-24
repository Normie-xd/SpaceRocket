import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],

  resolve: {
    alias: {
      '@engine':     resolve(__dirname, 'src/engine'),
      '@scene':      resolve(__dirname, 'src/scene'),
      '@store':      resolve(__dirname, 'src/store'),
      '@components': resolve(__dirname, 'src/components'),
      '@views':      resolve(__dirname, 'src/views'),
      '@utils':      resolve(__dirname, 'src/utils'),
      '@lib':        resolve(__dirname, 'src/lib'),
      '@types-local':resolve(__dirname, 'src/types')
    }
  },

  // Tauri dev server — must be on this port
  server: {
    port: 1420,
    strictPort: true,
    watch: {
      // Don't watch the Rust source (Tauri handles that separately)
      ignored: ['**/src-tauri/**']
    }
  },

  // Vite options tuned for Tauri
  clearScreen: false,
  envPrefix: ['VITE_', 'TAURI_'],

  build: {
    // Tauri uses Chromium on its own, we can target modern JS
    target: ['es2021', 'chrome100'],
    // Don't minify for debug builds
    minify: !process.env.TAURI_DEBUG ? 'esbuild' : false,
    sourcemap: !!process.env.TAURI_DEBUG
  },

  // Allow importing GLSL shader files (Phase 4+)
  assetsInclude: ['**/*.glsl', '**/*.vert', '**/*.frag']
})
