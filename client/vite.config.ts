import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import yamlPlugin from '@rollup/plugin-yaml'

// CJS package: TS resolves the namespace instead of the callable default export
const yaml = yamlPlugin as unknown as typeof import('@rollup/plugin-yaml').default
import path from 'node:path'

// https://vite.dev/config/
export default defineConfig({
  base: '/AI-Knowledge/',
  plugins: [react(), tailwindcss(), yaml()],
  server: {
    fs: {
      // data files live in ../public/data until legacy cleanup
      allow: [path.resolve(__dirname, '..')],
    },
  },
})
