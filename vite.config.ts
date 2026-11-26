import { defineConfig, loadEnv } from 'vite'
import path from 'node:path'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

function normalizeBasePath(value?: string) {
  const rawValue = value?.trim() || '/'

  if (rawValue === '/') {
    return '/'
  }

  const trimmedValue = rawValue.replace(/^\/+|\/+$/g, '')

  return trimmedValue ? `/${trimmedValue}/` : '/'
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const cmsOrigin = env.VITE_NETPRO_API_URL?.trim()

  return {
    base: normalizeBasePath(env.VITE_APP_BASE_PATH),
    // The CMS only allows its own site origins through CORS. In dev, the app
    // calls /netpro-api/* here and Vite forwards it server-side. See
    // src/shared/config/cms.ts.
    server: cmsOrigin
      ? {
          proxy: {
            '/netpro-api': {
              target: cmsOrigin,
              changeOrigin: true,
              secure: true,
              rewrite: (p) => p.replace(/^\/netpro-api/, ''),
            },
          },
        }
      : undefined,
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    build: {
      chunkSizeWarningLimit: 600,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes('node_modules')) return;
            if (id.includes('react-dom') || id.includes('/react/') || id.includes('/scheduler/')) return 'vendor-react';
            if (id.includes('@tanstack')) return 'vendor-tanstack';
            if (id.includes('/three/') || id.includes('/ogl/') || id.includes('/gsap/')) return 'vendor-3d';
            if (id.includes('/motion/')) return 'vendor-motion';
          },
        },
      },
    },
  }
})
