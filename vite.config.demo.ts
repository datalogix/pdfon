import { resolve } from 'path'
import { defineConfig } from 'vite'
import { transformerDirectives, presetUno, presetIcons } from 'unocss'
import unocss from 'unocss/vite'

export default defineConfig({
  esbuild: {
    keepNames: true,
  },
  plugins: [
    unocss({
      presets: [
        presetUno(),
        presetIcons(),
      ],
      transformers: [
        transformerDirectives(),
      ],
    }),
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
})
