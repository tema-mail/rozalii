import { defineConfig } from 'astro/config';
import preact from '@astrojs/preact';

// Точная копия rozalii.ru с Тильды (scripts/tilda-port.mjs). Показ – GitHub Pages: адрес и подпапку задаёт workflow.
const SITE = process.env.PUBLIC_SITE_URL || 'https://rozalii.ru';
const BASE = process.env.PUBLIC_BASE || '/';

export default defineConfig({
  site: SITE,
  base: BASE,
  // острова админки (/admin) – Preact, как у кабинета-стандарта Milovini
  integrations: [preact()],
  trailingSlash: 'ignore',
  build: { format: 'directory' },
  devToolbar: { enabled: false },
});
