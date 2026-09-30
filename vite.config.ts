import { svelte } from '@sveltejs/vite-plugin-svelte'
import { cpSync } from 'node:fs'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [
    svelte(),
    {
      name: 'copy-pdfjs-wasm',
      config() {
        cpSync('node_modules/pdfjs-dist/wasm', 'public/pdfjs-wasm', { recursive: true })
      },
    },
  ],
})
