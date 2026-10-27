# Внести SEO из docs/seo/seo-plan.json в Тильду (проект 36049009): страницы – meta_title/descr/keywords,
# товары – seo_title/descr/keywords. Страница сохраняется формой целиком, поэтому передаём все её текущие поля.
#   python3 scripts/seo-apply.py pages [alias ...] | products [uid ...]
import json, subprocess, sys
P = 36049009
def t(tool, args):
    r = subprocess.run(['python3', 'scripts/tmcp.py', tool, json.dumps(args, ensure_ascii=False)], capture_output=True, text=True)
    return r.stdout.strip()
plan = json.load(open('docs/seo/seo-plan.json'))
schema = json.loads(subprocess.run(['python3', 'scripts/tmcp.py', 'describe_tool', '{"tool_name":"update_page_settings"}'], capture_output=True, text=True).stdout)
props = set(schema.get('inputSchema', schema.get('input_schema', {})).get('properties', {}).keys()) if isinstance(schema, dict) else set()
what, only = sys.argv[1], set(sys.argv[2:])
if what == 'pages':
    pages = {p['alias']: p for p in json.loads(t('get_pages', {"projectid": P})) if p['id'] not in ('231453409', '231454909')}
    for alias, seo in plan['pages'].items():
        if only and alias not in only: continue
        pid = int(pages[alias]['id'])
        cur = json.loads(t('get_page_settings', {"pageid": pid, "projectid": P}))
        args = {k: cur[k] for k in props if k in cur and cur[k] not in (None,) and not isinstance(cur[k], (dict, list))}
        args.update(pageid=pid, projectid=P, date=str(cur['date'])[:16],
                    meta_title=seo['title'], meta_descr=seo['descr'], meta_keywords=seo['keywords'])
        for k in ('sort', 'folderid'):
            if k in args:
                try: args[k] = int(args[k])
                except (TypeError, ValueError): args.pop(k)
        res = t('update_page_settings', args)
        new = json.loads(t('get_page_settings', {"pageid": pid, "projectid": P}))
        changed = sorted(k for k in cur if k not in ('changed',) and str(cur.get(k)) != str(new.get(k)))
        print(f'/{alias}: {res[:30]} | изменились: {changed}')
else:
    for uid, seo in plan['products'].items():
        if only and uid not in only: continue
        cur = json.loads(t('store_get_products', {"projectid": P, "productuid": uid}))
        res = t('store_save_products', {"projectid": P, "productuid": int(uid), "title": cur['title'],
                                        "seo_title": seo['title'], "seo_descr": seo['descr'], "seo_keywords": seo['keywords']})
        new = json.loads(t('store_get_products', {"projectid": P, "productuid": uid}))
        changed = sorted(k for k in cur if str(cur.get(k)) != str(new.get(k)))
        print(f'{uid} {cur["title"]}: {res[:30]} | изменились: {changed}')
