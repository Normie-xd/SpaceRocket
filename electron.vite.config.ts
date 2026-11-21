import { resolve } from 'path'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()]
  },
  preload: {
    plugins: [externalizeDepsPlugin()]
  },
  renderer: {
    resolve: {
      alias: {
        '@renderer': resolve('src'),
        '@engine': resolve('src/engine'),
        '@scene': resolve('src/scene'),
        '@store': resolve('src/store'),
        '@components': resolve('src/components'),
        '@views': resolve('src/views'),
        '@utils': resolve('src/utils'),
        '@types-local': resolve('src/types')
      }
    },
    plugins: [react()],
    // Allow GLSL shader imports
    assetsInclude: ['**/*.glsl', '**/*.vert', '**/*.frag']
  }
})
