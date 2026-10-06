import { execSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import path from 'node:path'

import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

function commitSha() {
  try {
    return execSync('git rev-parse --short HEAD').toString().trim()
  } catch {
    return 'unknown'
  }
}

const pkg = JSON.parse(readFileSync(path.resolve(import.meta.dirname, './package.json'), 'utf-8'))

// The app's name lives only in package.json (`displayName`), so a rename is
// one edit: it fills the page title here and the header via __APP_NAME__.
const APP_NAME: string = pkg.displayName

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    { name: 'app-name', transformIndexHtml: (html) => html.replaceAll('%APP_NAME%', APP_NAME) },
  ],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  define: {
    // Same version badge as Treekit: package.json's version, bumped by hand
    // with every shipped commit; SHA and build time ride along for the tooltip.
    __APP_NAME__: JSON.stringify(APP_NAME),
    __APP_VERSION__: JSON.stringify(pkg.version),
    __COMMIT_SHA__: JSON.stringify(commitSha()),
    __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
  },
})
