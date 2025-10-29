// vite.config.ts
import { defineConfig } from 'vite'
import solidPlugin from 'vite-plugin-solid'
import UnocssPlugin from '@unocss/vite'
import path from 'path'

export default defineConfig({
  plugins: [
    solidPlugin({
      ssr: true,
      solid: {
        hydratable: true
      }
    }),
    UnocssPlugin()
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    }
  },
  server: {
    port: 3000,
  },
  build: {
    target: 'esnext',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['solid-js', '@solidjs/router'],
          utils: ['remark', 'remark-html', 'remark-gfm', 'remark-breaks', 'front-matter']
        }
      }
    }
  },
  ssr: {
    noExternal: ['@solidjs/router']
  },
  optimizeDeps: {
    include: ['solid-js', '@solidjs/router', 'front-matter', 'remark', 'remark-html', 'remark-gfm', 'remark-breaks']
  },
  assetsInclude: ['**/*.md', '**/*.mdx']
})
