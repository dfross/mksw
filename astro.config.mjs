import { defineConfig } from 'astro/config'
import tailwind from '@astrojs/tailwind'
import vue from '@astrojs/vue'
import sitemap from '@astrojs/sitemap'
import partytown from '@astrojs/partytown'
import icon from 'astro-icon'
export default defineConfig({
	site: 'https://mksw.netlify.app',
	integrations: [
		tailwind(),
		vue(),
		sitemap(),
		partytown({
			config: {
				forward: ['dataLayer.push'],
			},
		}),
		icon(),
	],
})
