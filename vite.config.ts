import { resolve } from 'path'
import { defineConfig } from 'vite'
import { transformerDirectives, presetUno, presetIcons } from 'unocss'
import unocss from 'unocss/vite'
import { name } from './package.json'
import eslint from 'vite-plugin-eslint2'
import dts from 'vite-plugin-dts'

export default defineConfig({
  esbuild: {
    keepNames: true,
  },
  plugins: [
    eslint({
      emitErrorAsWarning: true,
    }),
    unocss({
      presets: [
        presetUno(),
        presetIcons(),
      ],
      transformers: [
        transformerDirectives(),
      ],
    }),
    dts({
      include: ['src'],
      insertTypesEntry: true,
    }),
  ],
  build: {
    copyPublicDir: false,
    cssCodeSplit: true,
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name,
      fileName: format => `index.${format}.js`,
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
})
