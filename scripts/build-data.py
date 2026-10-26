# Данные сайта из снимка Тильды: docs/source/products.json → src/data/catalog.json,
# фото товаров и страниц – к себе в public/img (webp 480/1000 и 800/1600), чтобы сайт не зависел от tildacdn.
# Повторный запуск докачивает только недостающее. Запуск: python3 scripts/build-data.py
import json, pathlib, re, subprocess, io
from PIL import Image

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC = json.loads((ROOT / "docs/source/products.json").read_text())
IMG = ROOT / "public/img"
CACHE = ROOT / "docs/source/cache"
for d in (IMG / "p", IMG / "s", CACHE):
    d.mkdir(parents=True, exist_ok=True)

SECTIONS = {
    "Ритуальные венки": "ritualnye-venki",
    "Ритуальные корзины": "ritualnye-korziny",
    "Композиции в горшках": "kompozitsii-v-gorshkakh",
}
# подразделы венков → чип размера на странице раздела
SUBS = {
    "Венки 90": ("90", "90 см"), "Венки 110": ("110", "110 см"), "Венки 125": ("125", "125 см"),
    "Венки 140 элитные": ("140-elit", "140 см, элитные"), "Венки 140 под заказ": ("140-zakaz", "140 см, под заказ"),
}
# опечатки и смешанные значения опции «Цвет» на Тильде
COLORS = {
    "Голубые цветыцветы": "Голубые цветы", "Орнажевые цветы": "Оранжевые цветы", "Желтые цветы": "Жёлтые цветы",
    "Красные цветы 2": "Красные цветы, вариант 2", "Красные с белыми цветами": "Красные с белыми",
}
# картинки страниц: имя на сайте ← файл из docs/source/img (снято со страниц Тильды 26.10.2026)
PAGE_IMG = {
    "hero": "44-index-Group_1171274917.png", "cat-venki": "45-index-image_38.png", "cat-korziny": "46-index-image_39.png",
    "cat-kompozitsii": "47-index-image_40.png",
    "lenty": "49-index-Rectangle_30783.png", "k-mestu": "50-index-Rectangle_30783-1.png",
    "pamyatnaya-data": "51-index-Rectangle_30783-2.png", "zal": "52-index-Rectangle_30786.png",
    "o-nas": "00-about-image.png", "kontakty": "10-contact-image.png", "optom": "15-corparate-_2026-09-10_13145892.png",
    "uslugi": "53-uslugi-_2026-09-10_16212727.png", "dostavka": "32-deliveri-image.png",
    "vozlozhenie": "27-date-Rectangle_30792.png", "proshchanie": "37-farewell-image.png", "zal-hero": "40-hall-image.png",
    "karta-dostavki": "12-contact-Rectangle_30790.png", "lenta-nadpis": "31-date-image_49.png",
    "vozlozhenie-kladbishche": "38-farewell-Rectangle_30807.png", "zal-venki": "41-hall-image_50.png",
    "opt-1": "20-corparate-1.png", "opt-2": "21-corparate-2.png", "opt-3": "22-corparate-3.png",
    "opt-4": "23-corparate-4.png", "opt-5": "24-corparate-5.png", "opt-6": "25-corparate-6.png",
    "proizvodstvo": "07-about-4.png", "dostavka-mashina": "08-about-5.png", "po-eskizu": "06-about-3.png",
}


def fetch(url):
    f = CACHE / re.sub(r"[^\w.-]", "_", url.split("tildacdn.com/")[-1])
    if not f.exists():
        subprocess.run(["curl", "-sfL", "-o", str(f), url], check=True)
    return f


def webp(src_path, out_base, widths, bg=None):
    im = Image.open(src_path)
    if im.mode in ("RGBA", "LA", "P"):
        im = im.convert("RGBA")
        if bg:
            flat = Image.new("RGB", im.size, bg); flat.paste(im, mask=im.split()[3]); im = flat
    else:
        im = im.convert("RGB")
    sizes = {}
    for w in widths:
        out = out_base.parent / f"{out_base.name}-{w}.webp"
        if not out.exists():
            c = im.copy(); c.thumbnail((w, w * 3)); c.save(out, "WEBP", quality=80, method=6)
        sizes[w] = Image.open(out).size
    return im.size, sizes


photo_ids = {}


def product_photo(url):
    if url not in photo_ids:
        name = f"p/{len(photo_ids) + 1:03d}"
        webp(fetch(url), IMG / name, (480, 1000), bg=(255, 255, 255))
        photo_ids[url] = name
    return "/img/" + photo_ids[url]


products = []
for p in SRC:
    sec = SECTIONS[p["section"]]
    sub = SUBS.get(p["subsection"] or "")
    slug = p["new_url"].rstrip("/").split("/")[-1]
    photos = [product_photo(u) for u in p["photos"]]
    variants = []
    for v in p["variants"]:
        color = COLORS.get(v.get("Цвет", ""), v.get("Цвет", ""))
        img = product_photo(v["img"]) if v.get("img") else None
        if img and img not in photos:
            photos.append(img)
        variants.append({"color": color, "sku": v.get("sku") or "", "photo": img})
    # у части товаров у вариантов нет своего фото, но фото столько же, сколько вариантов – связываем по порядку
    if variants and len(photos) == len(variants):
        for v, ph in zip(variants, photos):
            v["photo"] = v["photo"] or ph
    products.append({
        "uid": str(p["uid"]), "slug": slug, "section": sec, "sectionName": p["section"],
        "sub": sub[0] if sub else None, "subName": sub[1] if sub else None,
        "size": p["size_cm"] or (int(sub[0][:3]) if sub else None),
        "title": p["proposed_title"] or p["title"], "placeholder": bool(p["placeholder_name"]),
        "sku": p["sku"] or (variants[0]["sku"] if variants else ""),  # у товаров с исполнениями артикул только у исполнений
        "photos": photos, "variants": variants, "oldUrl": p["old_url"],
        "madeToOrder": p["subsection"] == "Венки 140 под заказ",
    })

# исходники картинок страниц: docs/source/img (не в git) или скачать по ссылке из docs/source/img/index.tsv
PAGE_URLS = dict(l.split("\t") for l in (ROOT / "docs/source/img/index.tsv").read_text().splitlines())
pages = {}
for key, fn in PAGE_IMG.items():
    src = ROOT / "docs/source/img" / fn
    _, sizes = webp(src if src.exists() else fetch(PAGE_URLS[fn]), IMG / "s" / key, (800, 1600))
    pages[key] = {"src": f"/img/s/{key}", "w": sizes[800][0], "h": sizes[800][1]}

out = ROOT / "src/data"
out.mkdir(parents=True, exist_ok=True)
(out / "catalog.json").write_text(json.dumps({"products": products, "images": pages}, ensure_ascii=False, indent=1))
print(len(products), "товаров,", len(photo_ids), "фото товаров,", len(pages), "картинок страниц")
