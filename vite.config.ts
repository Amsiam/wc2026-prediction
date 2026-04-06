import { defineConfig } from 'vite'
import { devtools } from '@tanstack/devtools-vite'
import tsconfigPaths from 'vite-tsconfig-paths'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import tailwindcss from '@tailwindcss/vite'
import { nitro } from 'nitro/vite'

const config = defineConfig({
  esbuild: {
    jsxInject: `import React from 'react'`,
  },
  plugins: [
    devtools(),
    tailwindcss(),
    tanstackStart({ srcDirectory: 'app' }),
    nitro(),
    tsconfigPaths({ projects: ['./tsconfig.json'] }),
  ],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./app/test-setup.ts'],
  },
})

export default config
