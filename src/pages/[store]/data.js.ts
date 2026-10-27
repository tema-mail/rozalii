// /_store/data.js – товары для каталога копии Тильды (public/tilda-store-local.js читает window.__RZ_STORE).
// Папка с «_» у Astro не маршрут, поэтому адрес /_store/ задан параметром.
// Собирается при сборке: снимок магазина Тильды + правки админки (src/lib/catalog.ts, storeData).
import { snapshot, storeData } from '../../lib/catalog';

export const getStaticPaths = () => [{ params: { store: '_store' } }];

export function GET() {
  const body = `/* магазин rozalii.ru: снимок Тильды ${snapshot.date} + правки админки – src/lib/catalog.ts */\nwindow.__RZ_STORE=${JSON.stringify(storeData())};\n`;
  return new Response(body, { headers: { 'Content-Type': 'text/javascript; charset=utf-8' } });
}
