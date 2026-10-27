# План админки rozalii (27.10.2026)

Владелец: «обычная админка сайта, не ЛК, не опт; полная, без срезов по ИИ». Основа – кабинет-стандарт Milovini
(~/Sites/milovini-samara) и его перенос gaz-mag (~/Sites/gaz-mag): Страницы сайта, Товары, Заявки, Метрика (+ Товарный
спрос как ALEX KROWN), SEO-аналитика, Позиции (без вкладки «Нейросети»), Рекомендации (замок). Без «Продаж» (эквайринга нет),
без Точки А. Весь кабинет – за логином (lock-admin.mjs при выкладке). Аналитика – стендовые данные с пометкой «пример»
(владелец 26.10: «возьми какие-нибудь данные стенда, не нулевые»), реальная Метрика 113737961 – с 22.10, почти пустая.

Сайт – копия Тильды: товар живёт в двух местах – public/_store/data.js (каталог через tilda-store-local.js) и HTML
карточки src/data/pages/catalog__*__tproduct__*.json. Источник правды для админки – src/data/products.json и
src/data/parts.json (модель Milovini); сборка накладывает их на снимок и на HTML карточек.

## Шаги (≤3 файла кода, коммит после каждого; push – только когда замок уже стоит, шаг 1б)

1а. Каркас: package.json (+preact, @astrojs/preact), astro.config.mjs, src/layouts/Admin.astro (+ src/styles/admin.css из Milovini). Без push.
1б. Замок: scripts/lock-admin.mjs, scripts/admin-crypto.mjs (Milovini), .github/workflows/pages.yml – шаг замка после
    сборки и проверка, что секреты ADMIN_LOGIN/ADMIN_PASS заданы; секреты – gh secret set, копия – ~/.config/rozalii/.
2а. Снимок отдельно от выдачи: scripts/store-snapshot.mjs пишет src/data/store-snapshot.json (не public/), src/lib/catalog.ts
    (products.json + parts.json + наложение на снимок: название, цена, описание, артикул, фото, разделы, скрыт, новые товары
    в конец порядков, новые подразделы в дерево), src/pages/_store/data.js.ts – тот же window.__RZ_STORE для
    tilda-store-local.js. Сверка scripts/verify.mjs: порядки 54/54.
2б. scripts/admin-data.mjs (один раз: снимок → products.json, parts.json; есть файл – не трогает без --force),
    src/pages/[...slug].astro – правки поверх HTML карточки (h1, title, цена, var product) и страницы новых товаров по
    образцу карточки того же раздела; скрытый товар – страница не собирается. npm run port правки не трогает (они вне pages/).
3.  src/pages/admin/index.astro – «Страницы сайта» по сущностям, группы сворачиваются (localStorage).
4.  src/islands/admin/gh.ts, GhConnect.tsx, src/pages/admin/products.astro (пишут products.json, parts.json, public/uploads).
5.  ProductsAdmin.tsx, ProductEditor.tsx (варианты «Цвет» – по gaz-mag), CsvImport.tsx.
6.  Заявки: leads.astro + Leads.tsx (Milovini; пример с меткой; удаление внутри → окно «в архив / удалить / отмена», «Архив»).
7.  Метрика: scripts/stand-metrika.py (сборщик gaz-mag analytics/providers, fetch подменён стендом), Metrika.tsx (gaz-mag)
    читает JSON сборки, src/pages/admin/metrika.astro.
8а. Товарный спрос: demand.ts, DemandView.astro (ALEX KROWN). 8б. DemandCompare.astro + переключатель на metrika.astro.
9а. Позиции: Positions.tsx, WmMonth.tsx, posUtil.ts (gaz-mag), без «Нейросетей». 9б. positions.astro, seo.astro,
    recommendations.astro + Locked.astro (gaz-mag src/components/admin).
10. Карточка страницы: scripts/page-cards.py + scripts/admin/page_seo_ev.py (Milovini), запуск в npm run build после
    astro build, до замка.
11. Приёмка: admin-reference-check, admin-acceptor; живое сохранение с откатом.
