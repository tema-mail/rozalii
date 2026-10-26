import { defineConfig } from 'astro/config';
import preact from '@astrojs/preact';

// Боевой домен – rozalii.ru (пока на Тильде). На время показа – GitHub Pages: адрес и подпапку задаёт workflow.
const SITE = process.env.PUBLIC_SITE_URL || 'https://rozalii.ru';
const BASE = process.env.PUBLIC_BASE || '/';

export default defineConfig({
  site: SITE,
  base: BASE,
  integrations: [preact()],
  trailingSlash: 'always',
  build: { format: 'directory', inlineStylesheets: 'auto' },
  devToolbar: { enabled: false },
});
