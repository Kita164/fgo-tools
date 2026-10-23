import { copyFileSync } from 'node:fs'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// GitHub Pages 项目站点：https://kita164.github.io/fgo-tools/
export default defineConfig({
  base: '/fgo-tools/',
  plugins: [
    react(),
    {
      name: 'github-pages-spa',
      closeBundle() {
        copyFileSync('dist/index.html', 'dist/404.html')
      },
    },
  ],
})
