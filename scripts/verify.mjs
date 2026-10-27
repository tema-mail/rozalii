/**
 * Сверка копии с оригиналом по всем перенесённым страницам.
 *
 *   NEW=http://localhost:4795/rozalii node scripts/verify.mjs [--only=slug,slug] [--widths=1440,375]
 *
 * На каждой ширине: высота документа после прокрутки до конца (картинки
 * и ленивые блоки успевают встать), ошибки JS, ответы ≥400 и обращения
 * к CDN Тильды. На оригинале запросы счётчиков обрываются – сверка не должна
 * попадать в статистику клиента. Итог – docs/СВЕРКА.md.
 */
import { chromium } from 'playwright';
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const REF = 'https://rozalii.ru';
const NEW = (process.env.NEW || 'http://localhost:4795/rozalii').replace(/\/$/, '');
const args = process.argv.slice(2);
const opt = (n) => args.find((a) => a.startsWith(`--${n}=`))?.split('=')[1];
const WIDTHS = (opt('widths') || '1440,960,640,375').split(',').map(Number);
const ONLY = opt('only')?.split(',');
const TOL = 0.01; // допустимое расхождение высоты

const COUNTERS = /mc\.yandex|googletagmanager|google-analytics|analytics\.google|doubleclick|vk\.com\/(rtrg|js\/api)|top-fwz|privacy-cs\.mail|calltouch|stat\.tildaapi|tilda-stat/;

const pages = readdirSync(join(ROOT, 'src/data/pages'))
  .map((f) => JSON.parse(readFileSync(join(ROOT, 'src/data/pages', f), 'utf8')))
  .filter((p) => !p.redirect && (!ONLY || ONLY.includes(p.path || 'index')))
  .map((p) => p.path);

const browser = await chromium.launch({ channel: 'chrome' });

async function measure(url, width, isRef) {
  const ctx = await browser.newContext({ viewport: { width, height: 900 }, isMobile: width < 500, hasTouch: width < 500 });
  const pg = await ctx.newPage();
  const out = { errors: [], bad: [], cdn: new Set() };
  /* счётчики обрываем везде: если копия по ошибке уводит на живой сайт, хит не должен уйти */
  await pg.route('**/*', (r) => (COUNTERS.test(r.request().url()) ? r.abort() : r.continue()));
  pg.on('pageerror', (e) => out.errors.push(e.message.slice(0, 100)));
  pg.on('response', (r) => r.status() >= 400 && out.bad.push(`${r.status()} ${r.url().slice(0, 120)}`));
  pg.on('request', (r) => {
    const u = r.url();
    if (/tildacdn\.|tildaapi\./.test(u) && !COUNTERS.test(u)) out.cdn.add(u.replace(/^https?:\/\//, '').slice(0, 90));
  });
  try {
    await pg.goto(url, { waitUntil: 'load', timeout: 90_000 });
    await pg.waitForTimeout(2000);
    await pg.evaluate(async () => {
      for (let y = 0; y < document.documentElement.scrollHeight; y += 600) {
        window.scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 100));
      }
      window.scrollTo(0, 0);
    });
    await pg.waitForTimeout(1500);
    out.height = await pg.evaluate(() => document.documentElement.scrollHeight);
  } catch (e) {
    out.errors.push('загрузка: ' + e.message.slice(0, 80));
  }
  await ctx.close();
  return out;
}

const rows = [];
let i = 0;
await Promise.all(
  Array.from({ length: 4 }, async () => {
    while (i < pages.length * WIDTHS.length) {
      const k = i++;
      const path = pages[Math.floor(k / WIDTHS.length)];
      const w = WIDTHS[k % WIDTHS.length];
      const [ref, cur] = await Promise.all([measure(`${REF}/${path}`, w, true), measure(`${NEW}/${path}`, w, false)]);
      const diff = ref.height && cur.height ? (cur.height - ref.height) / ref.height : 1;
      /* ошибки, которых нет на оригинале */
      const newErrors = cur.errors.filter((e) => !ref.errors.includes(e));
      /* ответы ≥400 тоже только свои: внешний виджет может падать и на оригинале */
      const tail = (s) => s.replace(/^\d+ https?:\/\/[^/]+/, '');
      const bad = cur.bad.filter((b) => !/^\d+ https?:\/\/(localhost|127\.)/.test(b) ? !ref.bad.some((x) => tail(x) === tail(b)) : true);
      const row = { path: path || '/', w, ref: ref.height, cur: cur.height, diff, newErrors, bad, cdn: [...cur.cdn] };
      rows.push(row);
      const ok = Math.abs(diff) <= TOL && !newErrors.length && !bad.length;
      console.log(`${ok ? '✓' : '✗'} ${row.path} ${w}: ${ref.height} → ${cur.height}${newErrors.length ? ' ошибки: ' + newErrors.join('; ') : ''}${bad.length ? ' 4xx: ' + bad.slice(0, 3).join('; ') : ''}`);
    }
  }),
);
await browser.close();

rows.sort((a, b) => a.path.localeCompare(b.path) || b.w - a.w);
const fails = rows.filter((r) => Math.abs(r.diff) > TOL || r.newErrors.length || r.bad.length);
const cdn = [...new Set(rows.flatMap((r) => r.cdn))].sort();
const md = [
  '# Сверка копии с оригиналом',
  '',
  `${new Date().toISOString().slice(0, 10)}, scripts/verify.mjs: ${pages.length} страниц × ${WIDTHS.join('/')} px. Допуск по высоте ±${TOL * 100}%.`,
  `Совпало: ${rows.length - fails.length} из ${rows.length}.`,
  '',
  '## Расхождения',
  '',
  fails.length ? '| Страница | Ширина | Оригинал | Копия | Δ | Что ещё |\n|---|---|---|---|---|---|' : 'Нет.',
  ...fails.map((r) => `| ${r.path} | ${r.w} | ${r.ref} | ${r.cur} | ${(r.diff * 100).toFixed(1)}% | ${[...r.newErrors, ...r.bad].join('; ').replace(/\|/g, '/')} |`),
  '',
  '## Что копия ещё грузит с CDN Тильды',
  '',
  ...(cdn.length ? cdn.map((u) => `- ${u}`) : ['Ничего.']),
  '',
].join('\n');
writeFileSync(join(ROOT, 'docs/СВЕРКА.md'), md);
console.log(`\nсовпало ${rows.length - fails.length} из ${rows.length}; отчёт – docs/СВЕРКА.md`);
