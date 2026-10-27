import { defineConfig } from 'astro/config';

// Точная копия rozalii.ru с Тильды (scripts/tilda-port.mjs). Показ – GitHub Pages: адрес и подпапку задаёт workflow.
const SITE = process.env.PUBLIC_SITE_URL || 'https://rozalii.ru';
const BASE = process.env.PUBLIC_BASE || '/';

export default defineConfig({
  site: SITE,
  base: BASE,
  trailingSlash: 'ignore',
  build: { format: 'directory' },
  devToolbar: { enabled: false },
});
