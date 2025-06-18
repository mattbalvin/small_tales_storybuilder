import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { resolve } from 'path'

export default defineConfig({
  plugins: [svelte()],
  resolve: {
    alias: {
      '$lib': resolve('./src/lib'),
      '$app': resolve('./src/app')
    }
  },
  test: {
    globals: true,
    environment: 'jsdom',
  }
})