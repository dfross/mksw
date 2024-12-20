import defaultTheme from 'tailwindcss/defaultTheme'

/** @type {import('tailwindcss').Config} */
export default {
	content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
	future: {
		hoverOnlyWhenSupported: true,
	},
	theme: {
		extend: {
			fontFamily: {
				sans: ['Lexand', ...defaultTheme.fontFamily.sans],
			},
		},
	},
	plugins: [],
	safelist: [
		'border-blue-600',
		'border-purple-600',
		'border-green-600',
		'border-orange-600',
		'text-blue-800',
		'text-purple-800',
		'text-green-800',
		'text-orange-800',
	],
}
