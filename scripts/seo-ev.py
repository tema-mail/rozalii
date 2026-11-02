"""Раздел «SEO-аналитика» админки rozalii – кодом эталона EV SIBIR (seo_map.render_body), как у ALEX KROWN
scripts/seo-ev.py, без переписывания экрана. Всё настоящее (02.11.2026 – без стенда):
– реестр ключевых слов – keywords, которые 27.10.2026 поставлены на живой rozalii.ru (docs/seo/seo-plan.json: 15 страниц
  и 69 товаров; копия сайта снята с Тильды раньше, в её HTML их нет);
– спрос – Вордстат 08.09–07.10.2026 (docs/seo/research/wordstat-2026-10-27.json): Москва и область вместо «НСК»
  эталона, Россия – как «РФ»; фразы, которых в выгрузке нет, – «не собрано», не ноль;
– позиция Яндекса – снятая выдача 27.10.2026 (serp-2026-10-27.json, топ-10): rozalii.ru не нашёлся ни по одному запросу;
– места – реальный снимок «Позиций» (src/data/live/positions.json, XMLRiver); показов нет: Вебмастер ещё не загрузил
  данные сайта, Search Console к rozalii.ru не подключена.

Запуск: python3 scripts/seo-ev.py  →  src/data/seo-ev.json
"""
from __future__ import annotations

import datetime as dt
import html
import json
import os
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
RES = ROOT / "docs" / "seo" / "research"
EV = pathlib.Path(os.environ.get("EV_SERVER", "~/Documents/ev-sibir/server")).expanduser()
sys.path.insert(0, str(EV))
import seo_map  # noqa: E402

PAGE_NAMES = {"": "Главная", "catalog": "Каталог", "catalog/ritual_wreaths": "Каталог: Ритуальные венки",
              "catalog/ritual_baskets": "Каталог: Ритуальные корзины", "catalog/pot": "Каталог: Горшки"}
SECTION_OF = {"634569741283": "Венки", "682128127473": "Корзины", "840602458883": "Горшки"}


def cluster_of(alias: str) -> str:
    """Кластер – по разделу адреса, как page_seo.cluster_of у EV."""
    if alias in PAGE_NAMES:
        return PAGE_NAMES[alias] if alias else "Главная: производство ритуальных венков"
    if alias.startswith("additional_services"):
        return "Услуги: доставка, оформление зала"
    if alias in ("policy", "agreement"):
        return "Юридическая страница – вне поискового продвижения"
    return "Страница компании"


def registry() -> tuple[list[dict], int]:
    plan = json.loads((ROOT / "docs" / "seo" / "seo-plan.json").read_text())
    products = {p["id"]: p for p in json.loads((ROOT / "src" / "data" / "products.json").read_text())}
    pages: list[tuple[str, str, str]] = []  # (адрес, кластер, keywords)
    for alias, m in plan["pages"].items():
        if alias in ("policy", "agreement"):
            continue  # как EXCLUDE_ROUTES у EV: юридические вне семантики
        pages.append(("/" + alias + ("/" if alias else ""), cluster_of(alias), m.get("keywords", "")))
    for uid, m in plan["products"].items():
        p = products.get(uid)
        if not p or p.get("hidden"):
            continue
        sec = next((SECTION_OF[x] for x in p["parts"] if x in SECTION_OF), "Каталог")
        pages.append((p["path"] + "/", f"Карточка товара: {sec}", m.get("keywords", "")))
    rows, by = [], {}
    for route, cluster, kws in pages:
        for kw in [k.strip() for k in kws.split(",") if k.strip()]:
            key = kw.lower()
            if key not in by:
                by[key] = {"phrase": kw, "pages": [], "cluster": cluster,
                           **{k: dict(seo_map.NOT_COLLECTED) for k in ("demand_nsk", "demand_rf", "yandex_impressions", "google_impressions", "yandex_position", "google_position")},
                           "real_query_match": False}
                rows.append(by[key])
            if route not in by[key]["pages"]:
                by[key]["pages"].append(route)
    return rows, len(pages)


def enrich(rows: list[dict]) -> dict:
    """Спрос Вордстата (точное совпадение фразы или её уточнения из топа) и место в снятой выдаче Яндекса."""
    ws = json.loads((RES / "wordstat-2026-10-27.json").read_text())
    period = "08.09–07.10.2026"
    demand: dict[tuple[str, str], int] = {}
    for x in ws["popular"]:
        demand.setdefault((x["p"].lower(), x["r"]), x["t"])
        for q, n in x.get("top", []):
            demand.setdefault((q.lower(), x["r"]), n)
    serp = json.loads((RES / "serp-2026-10-27.json").read_text())
    checked = {s["q"].lower() for s in serp["serps"]}
    stats = {"mo": 0, "rf": 0, "serp": 0}
    for r in rows:
        k = r["phrase"].lower()
        if (k, "1") in demand:
            r["demand_nsk"] = {"status": "measured", "value": demand[(k, "1")], "period": period}
            stats["mo"] += 1
        if (k, "225") in demand:
            r["demand_rf"] = {"status": "measured", "value": demand[(k, "225")], "period": period}
            stats["rf"] += 1
        if k in checked:
            r["yandex_position"] = {"status": "measured", "position": None, "checked_depth": 10}
            stats["serp"] += 1
    # места – реальный снимок выдачи «Позиций» (scripts/real-analytics.py → src/data/live/positions.json, XMLRiver, Москва
    # и область, топ-20), точное совпадение фразы; показов нет – Вебмастер ещё не загрузил сайт, Search Console не подключена
    live = json.loads((ROOT / "src" / "data" / "live" / "positions.json").read_text())
    snap = {x["query"].lower(): x for x in live["nsk"]["rows"]}
    stats["live"], stats["live_at"] = 0, (live["nsk"].get("measured_to") or "")[:10]
    for r in rows:
        x = snap.get(r["phrase"].lower())
        if not x:
            continue
        for eng in ("yandex", "google"):
            if x.get(eng):
                r[f"{eng}_position"] = {"status": "measured", "position": x[eng]["position"], "checked_depth": x[eng]["depth"] or 20}
        stats["live"] += 1
    return stats


def main() -> None:
    rows, n_pages = registry()
    stats = enrich(rows)
    body = seo_map.render_body(rows, [], None, n_pages)
    swap = [
        ("Спрос НСК", "Спрос МО"), ("по Новосибирску и по России отдельно", "по Москве и области и по России отдельно"),
        ("Пока не собрано: нужен доступ к XMLRiver или Яндекс.Директ.", f"Собрано из Вордстата {html.escape('08.09–07.10.2026')} по фразам исследования: МО – у {stats['mo']} слов, РФ – у {stats['rf']}; остальное – не собрано."),
        ("Отмечено «да», если похожая формулировка реально встретилась в выгрузке Яндекс.Вебмастера", "Отмечено «да», если похожая формулировка встретилась в выгрузке Яндекс.Вебмастера (сейчас пусто: Вебмастер rozalii.ru ещё не загрузил данные)"),
        (f"Реестр ключевых слов сайта EV Sibir ({n_pages} страниц), сверенный с реальными поисковыми запросами. Архитектура и дисциплина — по технологии, собранной для TEYES; масштаб — под наш сайт.",
         f"Реестр ключевых слов rozalii.ru ({n_pages} страниц и карточек) – keywords, поставленные на живой сайт 27.10.2026. Спрос – Вордстат 08.09–07.10.2026. Места в Яндексе и Google – реальный снимок выдачи XMLRiver {'.'.join(reversed(stats['live_at'].split('-')))} (Москва и область, топ-20) у {stats['live']} фраз «Позиций»; у остальных – выдача Яндекса 27.10.2026 (топ-10), где сайта не было. Показов и «реального запроса» нет: Вебмастер ещё не загрузил данные сайта, Search Console к rozalii.ru не подключена."),
    ]
    swap += [
        ("считается по разделу страницы (марка, модель, документ)", "считается по разделу страницы (каталог, карточка товара, услуги)"),
        ("Подменять эти поля нулями нельзя — именно это было главной ошибкой, которую разобрали на примере TEYES: 20 измеренных строк из 6 466 показывались как завершённый сбор.",
         "Подменять эти поля нулями нельзя: иначе несобранное выглядит как проверенный ноль."),
    ]
    for a, b in swap:
        if a not in body:
            raise SystemExit(f"в разметке EV нет текста для замены: {a[:60]}")
        body = body.replace(a, b)
    body = body.replace("—", "–")  # длинное тире владелец запретил (12.10.2026)
    out = {"fetched_at": dt.datetime.now(dt.timezone.utc).isoformat(timespec="seconds"), "css": seo_map.CSS, "html": body,
           "stats": {"rows": len(rows), "pages": n_pages, **stats}}
    (ROOT / "src" / "data" / "seo-ev.json").write_text(json.dumps(out, ensure_ascii=False))
    print(f"реестр: {len(rows)} слов на {n_pages} страницах; спрос МО {stats['mo']}, РФ {stats['rf']}; выдача {stats['serp']}")


if __name__ == "__main__":
    main()
