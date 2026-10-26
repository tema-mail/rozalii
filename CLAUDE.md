# Розалия (rozalii.ru) – перенос с Тильды на Astro

Производство ритуальных венков, Сергиев Посад; опт и розница. Показ: https://tema-mail.github.io/rozalii/ (noindex).

- Данные: `npm run data` – scripts/build-data.py (товары и фото из docs/source → src/data/catalog.json, public/img) и opt-data.py (демо кабинета оптовика public/opt).
- Карта сайта и 301 – docs/karta-sayta.md; старые адреса – src/lib/legacy.ts (Pages – страницы-переадресации, бой – /redirects.json).
- Цен у источника нет: «цена по запросу», корзина = заявка. Заявки без PUBLIC_LEAD_URL – тестовый стенд (только в браузере).
- Юр. тексты – черновики с Тильды, пробелы видны плашками; долги – docs/yur-dolgi.md. Решения и вопросы – docs/РЕШЕНИЯ.md.
- Сборка: `PUBLIC_SITE_URL=https://tema-mail.github.io PUBLIC_BASE=/rozalii PUBLIC_NOINDEX=1 npx astro build`.
- Стандарты – скилл site-lead; в бой только по слову владельца.
