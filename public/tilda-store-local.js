/* Магазин копии rozalii.ru: отвечает скриптам каталога Тильды вместо store.tildaapi.com.
   API Тильды отдаёт товары только домену rozalii.ru, поэтому ответы собираются из снимка
   window.__RZ_STORE (public/_store/data.js, scripts/store-snapshot.mjs) с теми же параметрами,
   что шлёт каталог (порядок товаров для каждой подкатегории и сортировки – точный, снятый с Тильды): storepartuid, filters[storepartuid][0] (путь «Венки/@/Венки 110»), filters[query],
   sort[поле]=asc|desc, slice, size, getparts, getoptions. Подкатегории, поиск, сортировка и листание
   работают родными скриптами Тильды. Адреса товаров rozalii.ru → адреса копии. */
(function () {
  var S = window.__RZ_STORE;
  if (!S) return;
  var me = document.currentScript && document.currentScript.src;
  var BASE = me ? new URL('.', me).pathname.replace(/\/$/, '') : '';
  var API = /^https?:\/\/store\.tildaapi\.[a-z]+\/api\/(getproductslist|getfilters|discounts\/v1\/getactive)\/?/;

  function localUrl(u) {
    return typeof u === 'string' ? u.replace(/^https?:\/\/(www\.)?rozalii\.ru/, location.origin + BASE) : u;
  }

  function partsFlat(parts, out) {
    (parts || []).forEach(function (p) { out.push(p); partsFlat(p.subparts, out); });
    return out;
  }

  function uidsOf(p) {
    try { return JSON.parse(p.partuids || '[]').map(String); } catch (e) { return []; }
  }

  function list(q) {
    var root = S.roots[q.get('storepartuid')];
    if (!root) return { total: 0, products: [] };
    var part = q.get('filters[storepartuid][0]');
    var sortKey = '';
    q.forEach(function (dir, key) { var m = key.match(/^sort\[(\w+)\]$/); if (m) sortKey = m[1] + ':' + dir; });
    var exact = root.orders && root.orders[(part || '') + '|' + sortKey];
    var query = (q.get('filters[query]') || '').trim().toLowerCase();
    var items = (exact || root.order).map(function (u) { return S.products[u]; });
    if (exact) part = null; // точный порядок Тильды уже с подкатегорией и сортировкой
    if (part) {
      var hit = partsFlat(root.head.parts, []).filter(function (p) {
        return (p.path || []).join('/@/') === part || p.title === part || String(p.uid) === part;
      })[0];
      items = hit ? items.filter(function (p) { return uidsOf(p).indexOf(String(hit.uid)) >= 0; }) : [];
    }
    if (query) {
      items = items.filter(function (p) {
        return [p.title, p.sku, p.descr, p.text].join(' ').toLowerCase().indexOf(query) >= 0;
      });
    }
    q.forEach(function (dir, key) {
      var m = key.match(/^sort\[(\w+)\]$/);
      if (!m || exact) return;
      var f = m[1], k = dir === 'desc' ? -1 : 1, idx = {};
      root.order.forEach(function (u, i) { idx[u] = i; });
      items = items.slice().sort(function (a, b) {
        if (f === 'price') return k * ((parseFloat(a.price) || 0) - (parseFloat(b.price) || 0));
        if (f === 'title') return k * String(a.title).localeCompare(String(b.title), 'ru', { numeric: true });
        return k * (idx[a.uid] - idx[b.uid]); // created: дат в снимке нет – порядок раздела
      });
    });
    var size = parseInt(q.get('size'), 10) || items.length || 1;
    var slice = parseInt(q.get('slice'), 10) || 1;
    var page = items.slice((slice - 1) * size, slice * size).map(function (p) {
      var c = JSON.parse(JSON.stringify(p));
      c.url = localUrl(c.url);
      return c;
    });
    var out = {};
    Object.keys(root.head).forEach(function (k) { out[k] = root.head[k]; });
    if (q.get('getparts') !== 'true') delete out.parts;
    if (q.get('getoptions') !== 'true') delete out.options;
    out.total = items.length;
    out.products = page;
    out.slice = slice;
    if (slice * size < items.length) out.nextslice = slice + 1;
    return out;
  }

  function answer(url) {
    var u = new URL(url, location.href);
    var m = u.href.match(API);
    if (!m) return null;
    if (m[1] === 'getfilters') {
      var r = S.roots[u.searchParams.get('storepartuid')];
      return JSON.stringify(r ? r.filters : { sort: true, search: true, filters: [] });
    }
    if (m[1] === 'getproductslist') return JSON.stringify(list(u.searchParams));
    return '[]';
  }

  /* XHR: адрес API подменяется готовым ответом (blob) – остальная механика запроса родная */
  var open = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function (method, url) {
    var text = typeof url === 'string' ? answer(url) : null;
    if (text === null) return open.apply(this, arguments);
    var args = [].slice.call(arguments);
    args[0] = 'GET';
    args[1] = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
    return open.apply(this, args);
  };

  if (window.fetch) {
    var f = window.fetch;
    window.fetch = function (input) {
      var url = typeof input === 'string' ? input : input && input.url;
      var text = url ? answer(url) : null;
      if (text !== null) return Promise.resolve(new Response(text, { status: 200, headers: { 'Content-Type': 'application/json' } }));
      return f.apply(this, arguments);
    };
  }
})();
