"""Стенд раздела «Метрика и каналы» админки rozalii – отчёт собирает настоящий сборщик кабинета-стандарта
(gaz-mag analytics/providers: metrika.py, metrika_report.py – перенос TEYES / EV SIBIR), но вместо API Метрики и
Search Console ему отвечает генератор ниже. Цифры выдуманы, на экране это подписано.

Владелец 26.10.2026: «где метрика, где SEO-шка – возьми какие-нибудь данные стенда, не нулевые, чтобы я мог показать,
что внутри кабинета». Настоящий счётчик rozalii.ru – 113737961, создан 22.10.2026, данных почти нет; когда они
накопятся, этот скрипт заменяется на сбор по токену (как у gaz-mag analytics/collect.py).

Запуск: python3 scripts/stand-metrika.py  →  src/data/stand/metrika.json, demand.json («Товарный спрос», форма ALEX KROWN) и positions.json («Позиции», форма gaz-mag)
(в репозитории: данных клиента в них нет).
"""
from __future__ import annotations

import datetime as dt
import hashlib
import json
import math
import os
import pathlib
import sys
import urllib.parse

ROOT = pathlib.Path(__file__).resolve().parent.parent
GAZ = pathlib.Path(os.environ.get("STANDARD_ANALYTICS", "~/Sites/gaz-mag/analytics")).expanduser()
sys.path.insert(0, str(GAZ))
# настоящий ключ Google стенду не нужен – модуль подписи (cryptography) подменяется пустым, если его нет
try:
    import cryptography  # noqa: F401
except ImportError:
    import types
    for name in ("cryptography", "cryptography.hazmat", "cryptography.hazmat.primitives",
                 "cryptography.hazmat.primitives.asymmetric", "cryptography.hazmat.primitives.asymmetric.padding"):
        sys.modules[name] = types.ModuleType(name)
    sys.modules["cryptography.hazmat.primitives"].hashes = sys.modules["cryptography.hazmat.primitives"].serialization = None
    sys.modules["cryptography.hazmat.primitives.asymmetric"].padding = None
from providers import metrika as mk  # noqa: E402
from providers import metrika_report as mr  # noqa: E402

mk.COUNTER = 113737961
mk.GOALS = {
    "lead": ("Оформление заказа", (901,)),
    "phone": ("Клик по телефону", (902,)),
    "messenger": ("Переход в WhatsApp или Telegram", (903,)),
    "ybiz": ("Заявка из Яндекс Бизнеса", (904,)),
    "purchase": ("Добавление в корзину", (905,)),
}
GOAL_RATE = {901: 0.034, 902: 0.051, 903: 0.022, 904: 0.004, 905: 0.083}
SOURCES = [  # (источник, поисковик, доля визитов, отказы %, множитель конверсии)
    ("organic", "yandex", 0.37, 16, 1.2), ("organic", "google", 0.12, 19, 1.0), ("direct", "", 0.24, 14, 1.3),
    ("ad", "", 0.11, 27, 0.8), ("referral", "", 0.07, 21, 0.9), ("messenger", "", 0.05, 9, 1.6), ("social", "", 0.04, 31, 0.5),
]
REFERRALS = [("yandex.ru/maps", 0.34), ("2gis.ru", 0.22), ("ritual.ru", 0.12), ("vk.com", 0.1), ("avito.ru", 0.09),
             ("sergiev-posad.ru", 0.07), ("chatgpt.com", 0.04), ("alice.yandex.ru", 0.02)]
PAGES = [("/catalog/ritual_wreaths", 0.31), ("/", 0.22), ("/catalog", 0.11), ("/catalog/ritual_baskets", 0.07),
         ("/catalog/ritual_wreaths/tproduct/683702384973-amur", 0.05), ("/deliveri", 0.04),
         ("/catalog/ritual_wreaths/tproduct/363646447713-florentsiya", 0.035), ("/additional_services/farewell_hall", 0.03),
         ("/contact", 0.025), ("/catalog/pot", 0.02), ("/catalog/ritual_wreaths/tproduct/334054129253-liliya", 0.018)]
PHRASES = [("ритуальные венки", 0.14), ("венки сергиев посад", 0.11), ("розалия венки", 0.08), ("купить венок на кладбище", 0.06),
           ("ритуальные венки сергиев посад", 0.05), ("траурный венок", 0.045), ("венки хотьково", 0.03), ("ритуальная корзина", 0.03),
           ("венок 110 см", 0.025), ("венки оптом от производителя", 0.02), ("искусственные венки", 0.02), ("венки пушкино", 0.015)]
QUERIES = [("ритуальные венки", 3400, 4.2), ("венки сергиев посад", 520, 2.1), ("купить венок на кладбище", 1900, 7.8),
           ("траурный венок", 1500, 9.4), ("ритуальная корзина", 640, 6.3), ("венки оптом", 880, 11.2), ("розалия венки", 140, 1.0),
           ("искусственные венки", 900, 12.5), ("венок 110 см", 260, 5.5), ("ритуальные венки мытищи", 210, 8.1),
           ("венки пушкино", 300, 9.0), ("венки хотьково", 90, 3.4)]


def noise(*key) -> float:
    h = hashlib.md5("|".join(map(str, key)).encode()).digest()
    return h[0] / 255


def day_visits(d: dt.date) -> float:
    """Визиты за день: рост сайта к сегодняшнему дню, неделя (выходные выше), пики к родительским дням и Радонице."""
    age = (dt.date(2026, 10, 27) - d).days
    growth = 1 / (1 + age / 240)
    week = 1.15 if d.weekday() >= 5 else 1.0
    season = 1 + 0.35 * math.exp(-((d.timetuple().tm_yday - 120) / 12) ** 2) + 0.15 * math.exp(-((d.timetuple().tm_yday - 305) / 6) ** 2)
    return 62 * growth * week * season * (0.85 + 0.3 * noise("d", d))


def days(a: str, b: str):
    d, end = dt.date.fromisoformat(a), dt.date.fromisoformat(b)
    while d <= end:
        yield d
        d += dt.timedelta(days=1)


def metric(name: str, v: float, bounce: float, conv: float, d) -> float:
    if name == "ym:s:visits":
        return v
    if name == "ym:s:users":
        return v * 0.81
    if name == "ym:s:percentNewVisitors":
        return 71.5
    if name == "ym:s:bounceRate":
        return bounce
    if name == "ym:s:pageDepth":
        return 2.7
    if name == "ym:s:avgVisitDurationSeconds":
        return 104
    if name.startswith("ym:s:goal"):
        gid = int(name[len("ym:s:goal"):-len("reaches")])
        return v * GOAL_RATE.get(gid, 0) * conv * (0.8 + 0.4 * noise("g", gid, d))
    return 0


def rnd(m: str, x: float) -> float:
    """Визиты и достижения целей Метрика отдаёт целыми, доли и средние – дробными."""
    return round(x, 2) if m in AVG else round(x)


AVG = {"ym:s:percentNewVisitors", "ym:s:bounceRate", "ym:s:pageDepth", "ym:s:avgVisitDurationSeconds"}


def answer(url: str) -> dict:
    u = urllib.parse.urlparse(url)
    if u.path.startswith("/management/"):
        return {"counter": {"time_zone_name": "Europe/Moscow"}}
    q = dict(urllib.parse.parse_qsl(u.query))
    metrics = q["metrics"].split(",")
    dims = [x for x in q.get("dimensions", "").split(",") if x]
    flt = q.get("filters", "")
    organic, yandex_only = "=='organic'" in flt, "SearchEngineRoot=='yandex'" in flt
    referral = "=='referral'" in flt
    cells: dict[tuple, list] = {}  # ключ разреза → [(визиты, отказы, конверсия, день)]
    for d in days(q["date1"], q["date2"]):
        dv = day_visits(d)
        for src, eng, share, bounce, conv in SOURCES:
            if organic and src != "organic" or yandex_only and eng != "yandex" or referral and src != "referral":
                continue
            v = dv * share * (0.85 + 0.3 * noise(src, eng, d))
            subs = [((), 1.0)]
            if mk.DIM_REFERER in dims:
                subs = [((r,), s) for r, s in REFERRALS]
            elif mk.DIM_START in dims:
                subs = [((p,), s) for p, s in PAGES]
            elif mk.PHRASE in dims:
                subs = [((p,), s * 0.55) for p, s in PHRASES]  # остальное – скрытые фразы
            for sub, s in subs:
                key = []
                for dim in dims:
                    key.append({"ym:s:date": d.isoformat(), mk.DIM_SOURCE: src, mk.DIM_ENGINE: eng}.get(dim, sub[0] if sub else ""))
                cells.setdefault(tuple(key), []).append((v * s, bounce, conv, d))
    rows = []
    for key, parts in cells.items():
        vals = []
        for m in metrics:
            if m in AVG:
                w = sum(p[0] for p in parts) or 1
                vals.append(sum(metric(m, *p) * p[0] for p in parts) / w)
            else:
                vals.append(sum(metric(m, *p) for p in parts))
        rows.append({"dimensions": [{"id": k, "name": k} for k in key], "metrics": [rnd(m, x) for m, x in zip(metrics, vals)]})
    if dims:
        rows.sort(key=lambda r: -r["metrics"][0])
    totals = [0.0] * len(metrics)
    allparts = [p for ps in cells.values() for p in ps]
    w = sum(p[0] for p in allparts) or 1
    for i, m in enumerate(metrics):
        totals[i] = (sum(metric(m, *p) * p[0] for p in allparts) / w) if m in AVG else sum(metric(m, *p) for p in allparts)
    if mk.PHRASE in dims:  # итог по Яндексу без группировки – со скрытыми фразами
        totals = [t / 0.55 if metrics[i] not in AVG else t for i, t in enumerate(totals)]
    return {"data": rows[: int(q.get("limit", 100))], "totals": [rnd(m, x) for m, x in zip(metrics, totals)]}


class StandGsc:
    """Ответы Search Console по запросам из Вордстата (docs/seo/research) – клики, показы, позиции."""

    def _query(self, body: dict) -> list[dict]:
        n = sum(1 for _ in days(body["startDate"], body["endDate"]))
        k = n / 30 * (1 / (1 + (dt.date(2026, 10, 27) - dt.date.fromisoformat(body["endDate"])).days / 240))
        rows = []
        for q, imp, pos in QUERIES:
            i = imp * k * (0.8 + 0.4 * noise("gsc", q, body["startDate"]))
            p = pos * (0.9 + 0.25 * noise("pos", q, body["startDate"]))
            ctr = max(0.005, 0.32 / p)
            rows.append({"keys": [q], "impressions": round(i), "clicks": round(i * ctr), "ctr": ctr, "position": round(p, 1)})
        if body.get("dimensions"):
            return rows
        im = sum(r["impressions"] for r in rows)
        cl = sum(r["clicks"] for r in rows)
        return [{"clicks": cl, "impressions": im, "ctr": cl / im if im else 0,
                 "position": sum(r["position"] * r["impressions"] for r in rows) / im if im else None}]


def demand_slice(a: str, b: str) -> dict:
    """Срез «Товарного спроса» (форма ALEX KROWN scripts/demand-collect.mjs): по товару – просмотры карточки, добавления
    в корзину, заказанные штуки, выручка (цен на сайте нет – 0); входы сразу на карточку по каналам; фразы поиска."""
    products = json.loads((ROOT / "src" / "data" / "products.json").read_text())
    live = [p for p in products if not p.get("hidden")]
    # у товаров с настоящим названием спрос выше, у заглушек «… — товар 01» – ниже
    weight = {p["id"]: (1.0 if "— товар" not in p["title"] else 0.35) * (0.3 + 1.4 * noise("w", p["id"])) for p in live}
    total_w = sum(weight.values())
    rows, entries = [], {}
    span = list(days(a, b))
    for p in live:
        views = sum(day_visits(d) * 1.1 * weight[p["id"]] / total_w * (0.8 + 0.4 * noise("v", p["id"], d)) for d in span)
        views = round(views)
        if not views:
            continue
        baskets = round(views * 0.11 * (0.6 + 0.8 * noise("b", p["id"], a)))
        qty = round(views * 0.034 * (0.2 + 1.6 * noise("q", p["id"], a)))
        rows.append({"dims": [p["title"], p["id"]], "m": [views, baskets, qty, 0]})
        for src, share in (("Поисковые системы", 0.42), ("Прямые заходы", 0.18), ("Социальные сети", 0.05), ("Рекламные системы", 0.1), ("Внутренние переходы", 0.25)):
            v = round(views * 0.3 * share * (0.6 + 0.8 * noise("e", p["id"], src, a)))
            if v:
                entries[(p["path"], src)] = v
    rows.sort(key=lambda r: -r["m"][0])
    n = len(span) / 30 * (1 / (1 + (dt.date(2026, 10, 27) - dt.date.fromisoformat(b)).days / 240))
    phrases = [{"dims": [ph], "m": [max(1, round(day_visits(dt.date.fromisoformat(b)) * 30 * n * 0.37 * s))]} for ph, s in PHRASES]
    return {"products": {"rows": rows}, "productEntries": {"rows": [{"dims": [k[0], k[1]], "m": [v]} for k, v in sorted(entries.items(), key=lambda x: -x[1])]},
            "phrases": {"rows": phrases}}


# запросы раздела «Позиции»: спрос – настоящий Вордстат 08.09–07.10.2026 (docs/seo/research/wordstat-2026-10-27.json),
# Москва и область; направление – розница / опт / город
POS_QUERIES = [("ритуальные венки", 2268, "Венки"), ("траурные венки", 1119, "Венки"), ("венок на кладбище", 778, "Венки"),
               ("венки ритуальные купить", 673, "Венки"), ("искусственные венки", 489, "Венки"), ("ритуальные венки москва", 288, "Венки"),
               ("венок из искусственных цветов", 251, "Венки"), ("купить венок ритуальный в москве", 233, "Венки"),
               ("ритуальные корзины", 302, "Корзины"), ("корзины ритуальные из искусственных", 69, "Корзины"),
               ("венки оптом", 128, "Опт"), ("ритуальные венки оптом", 19, "Опт"), ("венки оптом от производителя", 17, "Опт"),
               ("венки сергиев посад", 39, "Сергиев Посад и соседи"), ("ритуальные венки сергиев посад", 9, "Сергиев Посад и соседи"),
               ("венки пушкино", 90, "Сергиев Посад и соседи"), ("венки мытищи", 76, "Сергиев Посад и соседи"), ("венки хотьково", 13, "Сергиев Посад и соседи")]
URL_OF = {"Венки": "rozalii.ru/catalog/ritual_wreaths", "Корзины": "rozalii.ru/catalog/ritual_baskets", "Опт": "rozalii.ru/corparate",
          "Сергиев Посад и соседи": "rozalii.ru/"}


def positions(now: dt.datetime) -> dict:
    """Отчёт «Позиций» в форме gaz-mag (/api/admin/report/positions): снимок выдачи по региону и месяцы Вебмастера / Search Console."""
    at, was = now.isoformat(timespec="seconds"), (now - dt.timedelta(days=31)).isoformat(timespec="seconds")

    def place(q: str, eng: str, when: str) -> int | None:
        x = noise("pos", q, eng, when)
        local = "сергиев" in q or "хотьково" in q
        if x < (0.15 if local else 0.35):
            return None  # нет в топ-20
        return max(1, round((3 if local else 9) + 14 * (x - 0.5) * (0.6 if local else 1)))

    def spot(q: str, eng: str, d: str) -> dict:
        p, before = place(q, eng, "now"), place(q, eng, "prev")
        return {"position": p, "depth": 20, "url": f"https://{URL_OF[d]}" if p else None, "at": at, "prev": before, "had_prev": True}

    rows = [{"query": q, "demand": dem, "direction": d, "yandex": spot(q, "yandex", d), "google": spot(q, "google", d)} for q, dem, d in POS_QUERIES]
    months = []
    end = dt.date(2026, 10, 26)
    for eng in ("yandex", "google"):
        # города Search Console не отдаёт – у Google только «Все», как в эталоне
        for region, name, k in ((0, "Все", 1.0), (1, "Москва и область", 0.72))[: 2 if eng == "yandex" else 1]:
            mrows = []
            for q, dem, d in POS_QUERIES:
                p = place(q, eng, "now")
                if p is None:
                    continue
                imp = round(dem * k * (0.5 if eng == "google" else 1) * (0.25 + 0.6 * noise("imp", q, eng)))
                pp = place(q, eng, "prev")
                mrows.append({"query": q, "position": p + round(noise("f", q) * 9) / 10, "impressions": imp, "clicks": round(imp * min(0.3, 0.32 / p)),
                              "prev_position": pp, "prev_impressions": round(imp * (0.7 + 0.5 * noise("pi", q))) if pp else None,
                              "prev_clicks": round(imp * 0.6 * min(0.3, 0.32 / pp)) if pp else None,
                              "direction": d, "brand": False})
            mrows.append({"query": "розалия венки", "position": 1.0, "impressions": round(48 * k), "clicks": round(21 * k), "prev_position": 1.2,
                          "prev_impressions": round(30 * k), "prev_clicks": round(12 * k), "direction": "Бренд", "brand": True})
            months.append({"engine": eng, "region": region, "name": name, "date_from": (end - dt.timedelta(days=29)).isoformat(), "date_to": end.isoformat(),
                           "collected_at": at, "prev": {"date_from": (end - dt.timedelta(days=59)).isoformat(), "date_to": (end - dt.timedelta(days=30)).isoformat(), "collected_at": was},
                           "rows": sorted(mrows, key=lambda r: -r["impressions"]), "gone": []})
    return {"stand": True, "nsk": {"rows": rows, "measured_from": at, "measured_to": at}, "months": months, "google": None, "yandex": None, "built_at": at}


def main() -> None:
    m = mk.Metrika("stand", fetch=lambda url, headers, timeout: json.dumps(answer(url)).encode())
    now = dt.datetime(2026, 10, 28, 4, 0, tzinfo=dt.timezone.utc)
    report = mr.build(m, StandGsc(), now)
    report["stand"] = True
    out = ROOT / "src" / "data" / "stand"
    out.mkdir(parents=True, exist_ok=True)
    (out / "metrika.json").write_text(json.dumps({"report": report, "saved_at": now.isoformat(), "last_try": None}, ensure_ascii=False))
    dm = {"collectedAt": now.isoformat(), "counter": mk.COUNTER, "stand": True,
          "periods": {k: {"date1": v["date1"], "date2": v["date2"], **demand_slice(v["date1"], v["date2"])} for k, v in report["periods"].items()},
          "modes": {k: {"label": v["label"], "prevLabel": v["prev_label"], "date1": v["date1"], "date2": v["date2"], "prev1": v["prev1"], "prev2": v["prev2"],
                        "now": demand_slice(v["date1"], v["date2"]), "prev": demand_slice(v["prev1"], v["prev2"])} for k, v in report["modes"].items()}}
    (out / "demand.json").write_text(json.dumps(dm, ensure_ascii=False))
    (out / "positions.json").write_text(json.dumps(positions(now), ensure_ascii=False))
    print("стенд Метрики:", {k: round(v["summary"]["visits"]) for k, v in report["periods"].items()}, "ошибок:", len(report["errors"]))


if __name__ == "__main__":
    main()
