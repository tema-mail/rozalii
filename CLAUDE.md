# Розалия (rozalii.ru) – точная копия Тильды

Производство ритуальных венков, Сергиев Посад; опт и розница. Показ: https://tema-mail.github.io/rozalii/ (noindex).

Владелец 27.10.2026: «полную точную копию тильды не придумывая, не исправляя, прям как есть – цвета, товары, порядок товаров, все функции, поиск, подкатегории». Улучшения – только после копии и по его слову.

- Страницы: `npm run port` – scripts/tilda-port.mjs (образец balance-fit): HTML и скрипты Тильды как есть, ресурсы → public/_t/, вырезаны только счётчики. Данные – src/data/pages/*.json, маршрут src/pages/[...slug].astro.
- Магазин: API Тильды отдаёт товары только домену rozalii.ru. `node scripts/store-snapshot.mjs` снимает товары, подкатегории и точный порядок для каждой пары «подкатегория × сортировка» → public/_store/data.js; public/tilda-store-local.js отвечает каталогу Тильды вместо API.
- Заявки и заказы не уходят (public/no-leads.js) – приёмник решает владелец.
- Сверка с оригиналом: `NEW=http://127.0.0.1:4795/rozalii node scripts/verify.mjs` → docs/СВЕРКА.md. Телефон проверять профилем iPhone, а не узким окном с десктопным UA (Тильда считает ширину по-разному).
- Прежняя версия «по карте сайта с ЧПУ» – ветка `v-kod-po-karte`. Демо кабинета оптовика – public/opt (`python3 scripts/opt-data.py`).
- Сборка: `PUBLIC_SITE_URL=https://tema-mail.github.io PUBLIC_BASE=/rozalii npx astro build`.
- SEO на живой Тильде (27.10.2026): `scripts/tmcp.py` – вызов MCP Тильды ключом ~/.config/tilda/mcp_token_rozalii (сервер `tilda-rozalii`), с ожиданием лимита. План – docs/seo/seo-plan.json (агент site-seo), внесение – `scripts/seo-apply.py pages|products`, резервные копии до правок – docs/seo/backup-*.json. update_page_settings сохраняет форму целиком – передавать все поля.
