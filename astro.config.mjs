import { defineConfig } from 'astro/config'
import vue from '@astrojs/vue'
import sitemap from '@astrojs/sitemap'
import icon from 'astro-icon'
import compressor from 'astro-compressor'
import playformCompress from '@playform/compress'
import playformInline from '@playform/inline'
import tailwindcss from '@tailwindcss/vite'
export default defineConfig({
	site: 'https://mksw.netlify.app',

	prefetch: {
		prefetchAll: true,
	},

	integrations: [vue(), sitemap(), icon(), playformInline(), playformCompress(), compressor()],

	vite: {
		plugins: [tailwindcss()],
	},
})
