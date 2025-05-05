import { resolve } from 'path'
import { defineConfig } from 'vite'
import { presetIcons, presetWind3, transformerDirectives } from 'unocss'
import unocss from 'unocss/vite'

export default defineConfig({
  esbuild: {
    keepNames: true,
  },
  plugins: [
    unocss({
      presets: [
        presetWind3(),
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
