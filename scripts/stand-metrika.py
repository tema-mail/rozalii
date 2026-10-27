"""Стенд раздела «Метрика и каналы» админки rozalii – отчёт собирает настоящий сборщик кабинета-стандарта
(gaz-mag analytics/providers: metrika.py, metrika_report.py – перенос TEYES / EV SIBIR), но вместо API Метрики и
Search Console ему отвечает генератор ниже. Цифры выдуманы, на экране это подписано.

Владелец 26.10.2026: «где метрика, где SEO-шка – возьми какие-нибудь данные стенда, не нулевые, чтобы я мог показать,
что внутри кабинета». Настоящий счётчик rozalii.ru – 113737961, создан 22.10.2026, данных почти нет; когда они
накопятся, этот скрипт заменяется на сбор по токену (как у gaz-mag analytics/collect.py).

Запуск: python3 scripts/stand-metrika.py  →  src/data/stand/metrika.json (в репозитории: данных клиента в нём нет).
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


def main() -> None:
    m = mk.Metrika("stand", fetch=lambda url, headers, timeout: json.dumps(answer(url)).encode())
    now = dt.datetime(2026, 10, 28, 4, 0, tzinfo=dt.timezone.utc)
    report = mr.build(m, StandGsc(), now)
    report["stand"] = True
    out = ROOT / "src" / "data" / "stand"
    out.mkdir(parents=True, exist_ok=True)
    (out / "metrika.json").write_text(json.dumps({"report": report, "saved_at": now.isoformat(), "last_try": None}, ensure_ascii=False))
    print("стенд Метрики:", {k: round(v["summary"]["visits"]) for k, v in report["periods"].items()}, "ошибок:", len(report["errors"]))


if __name__ == "__main__":
    main()
