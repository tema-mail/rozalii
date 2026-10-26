# Тексты и картинки страниц Тильды → docs/source/pages/*.md (для переноса содержания).
import re, html, pathlib, sys
d = pathlib.Path(__file__).resolve().parent.parent / "docs/source/pages"
for f in sorted(d.glob("*.html")):
    s = f.read_text(errors="ignore")
    s = re.sub(r"<(script|style|noscript)[^>]*>.*?</\1>", "", s, flags=re.S)
    out, seen = [], set()
    for m in re.finditer(r'<(div|h1|h2|h3|span|p|a|li|img)\b([^>]*)>', s):
        attrs = m.group(2)
        if m.group(1) == "img" or "data-original=" in attrs:
            src = re.search(r'data-original=["\'](.*?)["\']', attrs) or re.search(r'\ssrc="(https://static[^"]+)"', attrs)
            if src and src.group(1) not in seen:
                seen.add(src.group(1)); out.append("IMG " + src.group(1))
            continue
        cls = re.search(r'class=["\'](.*?)["\']', attrs)
        if not cls or not re.search(r'tn-atom|t-title|t-descr|t-text|t-name|t-heading|t-uptitle|t-card__title|t-card__descr|t-btn', cls.group(1)):
            continue
        end = s.find("</" + m.group(1), m.end())
        txt = re.sub(r"<br\s*/?>", "\n", s[m.end():end])
        txt = html.unescape(re.sub(r"<[^>]+>", " ", txt))
        txt = re.sub(r"[ \t]+", " ", txt).strip()
        if txt and txt not in seen and len(txt) > 1:
            seen.add(txt); out.append(txt)
    (d / (f.stem + ".md")).write_text("\n".join(out))
    print(f.stem, len(out))
