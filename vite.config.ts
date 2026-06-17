import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // modern browsers — smaller output, no legacy transpilation
    target: 'es2020',
    rollupOptions: {
      output: {
        // split rarely-changing libraries into their own cacheable chunks so
        // app edits don't bust the big vendor cache
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react-dom') || id.includes('/react/') || id.includes('scheduler'))
              return 'react'
            if (id.includes('framer-motion') || id.includes('motion-')) return 'motion'
            if (id.includes('gsap')) return 'gsap'
            if (id.includes('i18next')) return 'i18n'
          }
        },
      },
    },
  },
  server: {
    // dedicated port so this runs alongside the original AP Digital site (5173)
    port: 5183,
    open: false,
    // forward API calls to the Express backend during development (3002 so it
    // doesn't clash with the original site's backend on 3001)
    proxy: {
      '/api': {
        target: 'http://localhost:3002',
        changeOrigin: true,
      },
    },
  },
})
