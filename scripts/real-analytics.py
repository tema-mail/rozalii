"""Реальный срез аналитики rozalii.ru для админки (владелец 02.11.2026: «сделай реальный срез по сайту и добавь всё в админку»).
Сборщик – кабинет-стандарт gaz-mag (analytics/collect.py, providers/ – без правок); здесь только константы сайта, регион
«Москва и область» вместо Новосибирска и выкладка в src/data/live/ (её читают metrika.astro, positions.astro, seo.astro);
репозиторий публичный – в git идёт только зашифрованная копия src/data/sealed/ (scripts/seal-data.mjs, ключ – вход админки).
На маке – SSL_CERT_FILE=/etc/ssl/cert.pem (у python.org-питона нет корневых сертификатов).

Режимы (python3 scripts/real-analytics.py <режим>):
  metrika        – «Метрика и каналы» по счётчику 113737961, токен ~/.config/yandex/token
  serp --paid    – ПЛАТНО: выдача Яндекса (lr=1) и Google (Москва) до топ-20 по analytics/phrases.json, ≤72 запроса ≈ 2 ₽
  positions      – собрать positions.json из analytics/serp и analytics/months (Вебмастер – когда Яндекс загрузит сайт)
  all            – metrika + positions (бесплатно)
Search Console у rozalii.ru не подключена (нет свойства) – блоки Google пишут честную причину.
"""
from __future__ import annotations

import json
import os
import pathlib
import re
import shutil
import subprocess
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
GAZ = pathlib.Path(os.environ.get("STANDARD_ANALYTICS", "~/Sites/gaz-mag/analytics")).expanduser()
sys.path.insert(0, str(GAZ))
try:  # ключа Search Console у сайта нет – модуль подписи (cryptography) не нужен, подменяется пустым, как в stand-metrika.py
    import cryptography  # noqa: F401
except ImportError:
    import types
    for name in ("cryptography", "cryptography.hazmat", "cryptography.hazmat.primitives",
                 "cryptography.hazmat.primitives.asymmetric", "cryptography.hazmat.primitives.asymmetric.padding"):
        sys.modules[name] = types.ModuleType(name)
    sys.modules["cryptography.hazmat.primitives"].hashes = sys.modules["cryptography.hazmat.primitives"].serialization = None
    sys.modules["cryptography.hazmat.primitives.asymmetric"].padding = None
import collect as c  # noqa: E402
from providers import xmlriver as xr  # noqa: E402

KEYS = {"yandex-token": "~/.config/yandex/token", "xmlriver.env": "~/.config/xmlriver/xmlriver.env"}
c.secret = lambda name: pathlib.Path(KEYS[name]).expanduser().read_text(encoding="utf-8").strip() if name in KEYS else ""
c.OUT = ROOT / "analytics"  # сырьё: metrika.json, serp/, months/ (не в выдаче сайта)
c.HERE = ROOT / "analytics"  # phrases.json – 18 фраз с настоящим спросом Вордстата (docs/seo/research, 27.10.2026)
c.SITE_URL, c.DOMAIN = "https://rozalii.ru/", "rozalii.ru"
c.gsc_mod.DOMAIN = c.xr_mod.DOMAIN = c.DOMAIN
c.mk.COUNTER = 113737961
# целей у счётчика нет (management API 02.11.2026: goals = []) – роли остаются без номеров, как у ненайденной цели gaz-mag;
# идентификаторы – будущие JS-цели сайта (Тильда: корзина, телефон, мессенджеры), появятся – подхватятся сами
c.GOAL_ROLES = [("lead", "Оформление заказа", "order"), ("phone", "Клик по телефону", "phone_click"),
                ("messenger", "Переход в Telegram или MAX", "messenger_click"), ("purchase", "Добавление в корзину", "add_to_cart")]
c.REGIONS = {0: "Все", 1: "Москва и область"}
c.BRAND = re.compile(r"розали|rozali", re.I)
c.DIRECTIONS = [("Опт", r"опт|производител"), ("Корзины", r"корзин"), ("Венки", r"вен")]


class Moscow(xr.XMLRiver):
    """Та же выдача, что у стандарта, но регион – Москва и область: Яндекс lr=1, Google loc=1011969 (Москва)."""

    def _get(self, path: str, params: dict) -> bytes:
        if params.get("lr") == 65:
            params = {**params, "lr": 1}
        if params.get("loc") == 1011984:
            params = {**params, "loc": 1011969}
        return super()._get(path, params)


c.xr_mod.XMLRiver = Moscow


def publish() -> None:
    live = ROOT / "src" / "data" / "live"
    live.mkdir(parents=True, exist_ok=True)
    for name in ("metrika.json", "positions.json"):
        if (c.OUT / name).exists():
            shutil.copyfile(c.OUT / name, live / name)
            print("→", (live / name).relative_to(ROOT))
    # в публичный репозиторий – только зашифрованное (src/data/sealed), открытое src/data/live – в .gitignore
    subprocess.run(["node", str(ROOT / "scripts" / "seal-data.mjs")], check=True)


def main(argv: list[str]) -> None:
    mode = argv[0] if argv else "all"
    if mode == "metrika":
        c.metrika()
    elif mode == "serp":
        c.serp("--paid" in argv); c.positions()
    elif mode == "positions":
        c.positions()
    elif mode == "all":
        c.metrika(); c.positions()
    else:
        raise SystemExit(__doc__)
    publish()


if __name__ == "__main__":
    main(sys.argv[1:])
