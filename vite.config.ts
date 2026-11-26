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
      // Read by scripts/prepare-deploy.mjs to preload each page's own chunks.
      manifest: true,
      chunkSizeWarningLimit: 600,
      rollupOptions: {
        output: {
          manualChunks(id) {
            // Match the package itself, after the last node_modules/. pnpm
            // folder names carry peer deps ("..._react-dom@19..."), so a
            // plain includes('react-dom') pulled every React library (Radix,
            // Motion, Floating UI...) into vendor-react: 520 kB on every page.
            const pkg = id.split('node_modules/').pop()?.split('/').slice(0, 2).join('/');
            if (!pkg || pkg === id) return;
            if (/^(react|react-dom|scheduler)\//.test(pkg)) return 'vendor-react';
            if (pkg.startsWith('@tanstack/')) return 'vendor-tanstack';
            // Everything else (three, ogl, gsap, motion, Radix...) is split by
            // Rolldown per page, so a page only loads what it uses.
          },
        },
      },
    },
  }
})
