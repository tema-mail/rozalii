# Стенд кабинета оптовика: товары из docs/source/products.json + стендовые цены (у сайта цен нет).
import json, pathlib
root = pathlib.Path(__file__).resolve().parent.parent
src = json.loads((root / "docs/source/products.json").read_text())
RETAIL = {"Венки 90": 1900, "Венки 110": 2600, "Венки 125": 3400, "Венки 140 элитные": 5200,
          "Венки 140 под заказ": 6800, "Ритуальные корзины": 3900, "Композиции в горшках": 2200}
out = []
for p in src:
    group = p["subsection"] or p["section"]
    retail = RETAIL[group] + (len(out) % 5) * 100
    out.append({"id": p["uid"], "sku": p["sku"] or f"RZ-{len(out) + 1:03d}", "title": p["proposed_title"] or p["title"],
                "group": group, "section": p["section"], "photo": (p["photos"] or [""])[0],
                "retail": retail, "opt": round(retail * 0.62 / 10) * 10,
                "colors": sorted({v.get("color") or v.get("Цвет") or "" for v in p.get("variants", [])} - {""}),
                "url": p["new_url"]})
ORDER = list(RETAIL)
out.sort(key=lambda x: ORDER.index(x["group"]))
(root / "public/opt/data.js").write_text("window.OPT_PRODUCTS = " + json.dumps(out, ensure_ascii=False) + ";\n")
print(len(out), "товаров")
