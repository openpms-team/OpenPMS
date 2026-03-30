// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

export default defineConfig({
	site: 'https://openpms.org',
	integrations: [
		starlight({
			title: 'OpenPMS',
			defaultLocale: 'root',
			locales: {
				root: { label: 'English', lang: 'en' },
				pt: { label: 'Português' },
				fr: { label: 'Français' },
			},
			social: [
				{ icon: 'github', label: 'GitHub', href: 'https://github.com/openpms/openpms' },
			],
			sidebar: [
				{
					label: 'Getting Started',
					items: [
						{ label: 'Introduction', slug: 'getting-started/introduction' },
						{ label: 'Instalação', slug: 'getting-started/install' },
						{ label: 'Deploy', slug: 'getting-started/deploy' },
						{ label: 'First Setup', slug: 'getting-started/first-setup' },
					],
				},
				{
					label: 'Features',
					autogenerate: { directory: 'features' },
				},
				{
					label: 'Integrations',
					autogenerate: { directory: 'integrations' },
				},
				{
					label: 'API Reference',
					autogenerate: { directory: 'api' },
				},
				{
					label: 'Legal (Portugal)',
					autogenerate: { directory: 'legal' },
				},
			],
			customCss: ['./src/styles/custom.css'],
		}),
	],
});
