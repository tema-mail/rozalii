#!/usr/bin/env python3
"""Вызов MCP Тильды проекта rozalii напрямую (пока сервер tilda-rozalii не подхвачен сессией).
   python3 scripts/tmcp.py <tool> '<json-аргументы>'   |   python3 scripts/tmcp.py --list [фильтр]
   Ключ – ~/.config/tilda/mcp_token_rozalii (600), в вывод не попадает."""
import json, sys, pathlib, subprocess
tok = pathlib.Path('~/.config/tilda/mcp_token_rozalii').expanduser().read_text().strip()
def call(method, params):
    # лимит Тильды: ответ -32033 rate_limited с retry_at – ждём и повторяем
    import time
    for _ in range(8):
        r = _call(method, params)
        err = r.get('error') or {}
        if err.get('code') != -32033: return r
        wait = max(5, int((err.get('data') or {}).get('retry_at', time.time() + 30) - time.time()) + 2)
        print(f'лимит Тильды, жду {wait} с', file=sys.stderr); time.sleep(min(wait, 300))
    return r
def _call(method, params):
    body = json.dumps({"jsonrpc": "2.0", "id": 1, "method": method, "params": params})
    out = subprocess.run(['curl', '-s', 'https://tilda.ru/api/mcp/', '-H', f'Authorization: Bearer {tok}',
        '-H', 'Content-Type: application/json', '-H', 'Accept: application/json, text/event-stream',
        '-H', 'MCP-Protocol-Version: 2025-06-18', '--data-binary', '@-'], input=body.encode(), capture_output=True).stdout.decode()
    return json.loads(out)
if __name__ == '__main__':
    if sys.argv[1] == '--list':
        f = sys.argv[2] if len(sys.argv) > 2 else ''
        for t in call('tools/list', {})['result']['tools']:
            if f in t['name']:
                print('##', t['name'], '\n', t.get('description', '')[:300], '\n', json.dumps(t['inputSchema'], ensure_ascii=False)[:1500])
    else:
        r = call('tools/call', {"name": sys.argv[1], "arguments": json.loads(sys.argv[2] if len(sys.argv) > 2 else '{}')})
        if 'error' in r: print('ERROR', json.dumps(r['error'], ensure_ascii=False)); sys.exit(1)
        for c in r['result']['content']: print(c.get('text', ''))
