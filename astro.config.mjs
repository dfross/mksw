import { defineConfig } from 'astro/config'
import tailwind from '@astrojs/tailwind'
import vue from '@astrojs/vue'
import sitemap from '@astrojs/sitemap'
import icon from 'astro-icon'
import compressor from 'astro-compressor'
import playformCompress from '@playform/compress'
import playformInline from '@playform/inline'
export default defineConfig({
	site: 'https://mksw.netlify.app',
	prefetch: {
		prefetchAll: true,
	},
	integrations: [tailwind(), vue(), sitemap(), icon(), playformInline(), playformCompress(), compressor()],
})
