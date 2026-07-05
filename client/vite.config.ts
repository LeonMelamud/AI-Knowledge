import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import yamlPlugin from '@rollup/plugin-yaml'

// CJS package: TS resolves the namespace instead of the callable default export
const yaml = yamlPlugin as unknown as typeof import('@rollup/plugin-yaml').default

// https://vite.dev/config/
export default defineConfig({
  base: '/', // custom domain ai-know.org serves from the root
  plugins: [react(), tailwindcss(), yaml()],
})
