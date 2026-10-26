// Кабинет оптовика Розалия – демо в браузере. Цифры стендовые, правила вынесены в RULES.
(function () {
  const P = window.OPT_PRODUCTS;
  const byId = Object.fromEntries(P.map(p => [p.id, p]));
  const bySku = Object.fromEntries(P.map(p => [p.sku.toUpperCase(), p]));

  const RULES = {
    minOrder: 15000,
    ladder: [{ from: 0, pct: 0 }, { from: 30000, pct: 5 }, { from: 60000, pct: 8 }, { from: 120000, pct: 12 }],
    tiers: [
      { name: 'Партнёр', from: 0, limit: 40000, earn: 1, defer: 0, perks: ['Оптовые цены', 'Реализация до 40 000 ₽'] },
      { name: 'Серебро', from: 150000, limit: 80000, earn: 2, defer: 7, perks: ['Реализация до 80 000 ₽', 'Отсрочка 7 дней', '2% баллами'] },
      { name: 'Золото', from: 400000, limit: 150000, earn: 3, defer: 14, perks: ['Реализация до 150 000 ₽', 'Отсрочка 14 дней', 'Приоритет в производстве', '3% баллами'] },
      { name: 'Платина', from: 900000, limit: 300000, earn: 4, defer: 21, perks: ['Реализация до 300 000 ₽', 'Отсрочка 21 день', 'Доставка бесплатно', '4% баллами'] },
    ],
    pointsMaxPct: 10,
    tasks: [
      { id: 'report', name: 'Отчёт по реализации до срока', pts: 300 },
      { id: 'self', name: 'Заказ через кабинет без звонка менеджеру', pts: 100 },
      { id: 'review', name: 'Фото установки венка с отзывом', pts: 200 },
      { id: 'profile', name: 'Заполнить профиль компании', pts: 150 },
    ],
  };

  const it = (i, q) => ({ id: P[i % P.length].id, q });
  const SEED = {
    company: { name: 'Ритуальное агентство «Память»', legal: 'ИП Ковалёв А. С.', inn: '503812345678', city: 'Сергиев Посад', addr: 'ул. Вокзальная, 12' },
    turnover: 268400,
    points: 4820,
    pointsLog: [
      { d: '21.10', t: 'Начислено за заказ № 1041', v: +612 },
      { d: '18.10', t: 'Отчёт по реализации Р-108 до срока', v: +300 },
      { d: '12.10', t: 'Оплата баллами заказа № 1038', v: -1500 },
      { d: '02.10', t: 'Заполнен профиль компании', v: +150 },
    ],
    done: { profile: true },
    cart: {},
    orders: [
      { no: 1043, d: '24.10', items: [it(3, 10), it(12, 6), it(30, 4)], status: 'В производстве' },
      { no: 1041, d: '20.10', items: [it(5, 12), it(40, 8)], status: 'Отгружен' },
      { no: 1038, d: '09.10', items: [it(1, 20), it(22, 10), it(60, 4)], status: 'Отгружен' },
    ],
    lots: [
      { no: 'Р-112', d: '15.10', due: '29.10', items: [{ id: P[2].id, given: 6, sold: 4, ret: 0 }, { id: P[14].id, given: 4, sold: 1, ret: 0 }, { id: P[47].id, given: 3, sold: 3, ret: 0 }] },
      { no: 'Р-108', d: '01.10', due: '15.10', closed: true, items: [{ id: P[8].id, given: 8, sold: 6, ret: 2 }] },
    ],
    requests: [],
    debt: 18600, debtDue: '31.10',
  };

  let S;
  const KEY = 'rozalii-opt-v1';
  function load() { try { S = JSON.parse(localStorage.getItem(KEY)) || null; } catch (e) { S = null; } if (!S) S = JSON.parse(JSON.stringify(SEED)); }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* без хранилища демо живёт до перезагрузки */ } }
  load();

  const rub = n => Math.round(n).toLocaleString('ru-RU') + ' ₽';
  const $ = s => document.querySelector(s);
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const note = (what, from) => `<div class="note"><b>Что:</b> ${what}<br><b>Откуда:</b> ${from}</div>`;
  function toast(t) { const el = $('#toast'); el.textContent = t; el.classList.add('on'); clearTimeout(toast.t); toast.t = setTimeout(() => el.classList.remove('on'), 2600); }

  const tierOf = sum => [...RULES.tiers].reverse().find(t => sum >= t.from);
  const nextTier = sum => RULES.tiers.find(t => t.from > sum);
  const stepOf = sum => [...RULES.ladder].reverse().find(s => sum >= s.from);
  const nextStep = sum => RULES.ladder.find(s => s.from > sum);
  const itemsSum = items => items.reduce((a, x) => a + byId[x.id].opt * x.q, 0);
  const cartItems = () => Object.entries(S.cart).filter(([, q]) => q > 0).map(([id, q]) => ({ id: +id, q }));
  const onHands = () => S.lots.filter(l => !l.closed).reduce((a, l) => a + l.items.reduce((b, x) => b + (x.given - x.sold - x.ret) * byId[x.id].opt, 0), 0);
  const pendingReq = () => S.requests.filter(r => r.status === 'На согласовании').reduce((a, r) => a + r.sum, 0);
  const limitLeft = () => tierOf(S.turnover).limit - onHands() - pendingReq();
  const ST = { 'На согласовании': 'warn', 'Принят': 'info', 'В производстве': 'info', 'Готов к отгрузке': 'ok', 'Отгружен': 'ok', 'Отменён': 'bad', 'Одобрена': 'ok', 'Отклонена': 'bad', 'Передано': 'info' };
  const st = s => `<span class="st ${ST[s] || ''}">${s}</span>`;

  const ROUTES = [
    ['home', 'Главная', '⌂'], ['catalog', 'Каталог', '❖'], ['cart', 'Корзина', '◫'], ['orders', 'Заказы', '☰'],
    ['realization', 'Реализация', '⇄'], ['loyalty', 'Статус и баллы', '★'], ['finance', 'Расчёты и документы', '₽'], ['profile', 'Компания', '◉'],
  ];
  const MOB = ['home', 'catalog', 'cart', 'realization', 'loyalty'];

  function nav(cur) {
    const cnt = { cart: cartItems().reduce((a, x) => a + x.q, 0), orders: S.orders.filter(o => o.status === 'На согласовании').length, realization: S.requests.filter(r => r.status === 'На согласовании').length };
    $('#nav').innerHTML = ROUTES.map(([k, n]) => `<a href="#${k}" class="${k === cur ? 'on' : ''}">${n}${cnt[k] ? `<span class="cnt">${cnt[k]}</span>` : ''}</a>`).join('');
    $('#mob').innerHTML = ROUTES.filter(r => MOB.includes(r[0])).map(([k, n, i]) => `<a href="#${k}" class="${k === cur ? 'on' : ''}"><span>${i}</span>${n.split(' ')[0]}${cnt[k] ? ` (${cnt[k]})` : ''}</a>`).join('');
    $('#mgr').innerHTML = 'Ваш менеджер<br><b style="color:#fff">Ольга Смирнова</b><br>+7 (900) 000-00-00 · WhatsApp';
    $('#title').textContent = (ROUTES.find(r => r[0] === cur) || ROUTES[0])[1];
  }

  // ---------- Главная ----------
  function vHome() {
    const t = tierOf(S.turnover), nt = nextTier(S.turnover);
    const cs = itemsSum(cartItems()), step = stepOf(cs), ns = nextStep(cs);
    const lim = t.limit, used = onHands() + pendingReq();
    const active = S.orders.filter(o => !['Отгружен', 'Отменён'].includes(o.status));
    const openLot = S.lots.find(l => !l.closed);
    return `
    <div class="banner">${esc(S.company.name)} · ${esc(S.company.legal)} · статус <b>${t.name}</b></div>
    <div class="grid g4">
      <div class="card"><div class="k">Скидка от объёма заказа</div>
        <div class="v">${step.pct ? '−' + step.pct + '%' : 'база'}</div>
        <div class="mut">${ns ? `до −${ns.pct}% добавьте ${rub(ns.from - cs)}` : 'максимальная ступень'}</div>
        <div class="ladder">${RULES.ladder.map(s => `<div class="${s === step ? 'on' : ''}">${s.from ? 'от ' + s.from / 1000 + 'к' : '0'}<br>${s.pct ? '−' + s.pct + '%' : '—'}</div>`).join('')}</div>
        ${note('скидка считается от суммы текущей корзины, лесенка видна целиком.', 'venokmoskva.ru (скидка от суммы до 25%), kvetkiopt.by (ступень «от суммы»).')}</div>
      <div class="card"><div class="k">Лимит реализации</div>
        <div class="v">${rub(lim - used)}</div><div class="mut">свободно из ${rub(lim)}</div>
        <div class="bar"><i style="width:${Math.min(100, used / lim * 100)}%"></i></div>
        <a href="#realization">Запросить товар под реализацию →</a>
        ${note('остаток = лимит статуса − товар на руках − заявки на согласовании. При нуле кнопка заявки выключается.', 'PARTS SOFT – «остаток кредитного лимита» и формула проверки.')}</div>
      <div class="card"><div class="k">К оплате</div>
        <div class="v ${S.debt ? 'warn' : 'ok'}">${rub(S.debt)}</div><div class="mut">${S.debt ? 'срок до ' + S.debtDue : 'долгов нет'}${openLot ? ` · отчёт по ${openLot.no} до ${openLot.due}` : ''}</div>
        <a href="#finance">Расчёты и акт сверки →</a>
        ${note('долг и ближайший срок – чтобы не пропустить оплату и отчёт по реализации.', 'портал завода АЛСО (дебиторка на дашборде), ABCP (сальдо в шапке).')}</div>
      <div class="card"><div class="k">Статус · баллы</div>
        <div class="v">${t.name} · ${S.points.toLocaleString('ru-RU')}</div>
        <div class="mut">${nt ? `до «${nt.name}» – ${rub(nt.from - S.turnover)} оборота за квартал` : 'высший статус'}</div>
        <div class="bar"><i style="width:${nt ? (S.turnover - t.from) / (nt.from - t.from) * 100 : 100}%"></i></div>
        <a href="#loyalty">Что даёт статус →</a>
        ${note('уровень по обороту за квартал, баллы 1 = 1 ₽ – видно, сколько до следующего уровня.', '«Мой WB» (уровни с удержанием за период), таблица уровней emcmos.')}</div>
    </div>
    <div class="grid g2" style="margin-top:14px">
      <div class="card"><h3>Заказы в работе</h3>
        ${active.length ? `<div class="tw"><table><tr><th>№</th><th>Дата</th><th>Сумма</th><th>Статус</th></tr>${active.map(o => `<tr><td>${o.no}</td><td>${o.d}</td><td>${rub(o.sum || itemsSum(o.items))}</td><td>${st(o.status)}</td></tr>`).join('')}</table></div>` : '<div class="empty">Нет активных заказов</div>'}
        <div class="row" style="margin-top:10px"><button class="btn sec sm" data-repeat="${S.orders[0] ? S.orders[0].no : ''}">Повторить последний заказ</button><a href="#orders">Все заказы →</a></div>
        ${note('статусы заказа и повтор в одно нажатие – оптовик заказывает одно и то же.', 'АЛСО (статус «На согласовании», повтор заказа), Сотбит B2B (повтор из истории).')}</div>
      <div class="card"><h3>Быстрый заказ по артикулу</h3>
        <div class="field"><textarea id="quick" rows="4" placeholder="${P[3].sku} 10&#10;${P[40].sku} 5"></textarea></div>
        <button class="btn sm" id="quickAdd">Добавить в корзину</button>
        ${note('строка «артикул количество» – для тех, кто знает ассортимент наизусть.', 'Сотбит B2B (бланк заказа, заказ по артикулу и Excel).')}</div>
    </div>
    <div class="card" style="margin-top:14px"><h3>Объявления производителя</h3>
      <div>Перед Родительской субботой цех работает без выходных: заказы на венки 140 см принимаем до 05.11.</div>
      ${note('лента новостей производителя: сроки, новинки, перебои.', 'АЛСО (объявления завода на главной).')}</div>`;
  }

  // ---------- Каталог ----------
  let fGroup = 'Все', fQ = '';
  function vCatalog() {
    const groups = ['Все', ...new Set(P.map(p => p.group))];
    const list = P.filter(p => (fGroup === 'Все' || p.group === fGroup) && (!fQ || (p.title + ' ' + p.sku).toLowerCase().includes(fQ.toLowerCase())));
    return `
    <div class="row sp" style="margin-bottom:12px">
      <div class="chips">${groups.map(g => `<span class="chip ${g === fGroup ? 'on' : ''}" data-g="${esc(g)}">${esc(g)}</span>`).join('')}</div>
      <input id="q" value="${esc(fQ)}" placeholder="Название или артикул" style="border:1px solid var(--line);border-radius:8px;padding:7px 10px;min-width:220px">
    </div>
    ${note('те же товары, что на сайте (69 шт. из каталога), но с оптовой ценой рядом с розничной и количеством прямо в карточке.', 'общая схема B2B-порталов (Сотбит, ABCP: «профиль» цен клиента). Цены – стенд, у сайта цен нет.')}
    <div class="prods" style="margin-top:10px">${list.map(p => `
      <div class="prod"><img loading="lazy" src="${p.photo}" alt="${esc(p.title)}">
        <div class="b"><div class="mut" style="font-size:12px">${p.sku} · ${esc(p.group)}</div>
          <div class="t">${esc(p.title)}</div>
          ${p.colors.length ? `<div class="mut" style="font-size:12px">${p.colors.length} цвета</div>` : ''}
          <div class="p"><b>${rub(p.opt)}</b><s>${rub(p.retail)}</s></div>
          <div class="row sp">${qty(p.id)}</div>
        </div></div>`).join('') || '<div class="empty">Ничего не нашли</div>'}</div>`;
  }
  const qty = id => `<div class="qty"><button data-dec="${id}">−</button><input data-q="${id}" inputmode="numeric" value="${S.cart[id] || 0}"><button data-inc="${id}">+</button></div>`;

  // ---------- Корзина ----------
  let usePts = 0;
  function vCart() {
    const items = cartItems();
    if (!items.length) return `<div class="card empty">Корзина пуста. <a href="#catalog">В каталог</a></div>`;
    const sum = itemsSum(items), step = stepOf(sum), ns = nextStep(sum);
    const disc = Math.round(sum * step.pct / 100);
    const maxPts = Math.min(S.points, Math.floor((sum - disc) * RULES.pointsMaxPct / 100));
    usePts = Math.min(usePts, maxPts);
    const total = sum - disc - usePts, t = tierOf(S.turnover);
    const left = limitLeft(), short = sum - left;
    return `
    <div class="grid" style="grid-template-columns:minmax(0,2fr) minmax(280px,1fr)">
      <div class="card"><div class="tw"><table><tr><th>Товар</th><th>Цена</th><th>Кол-во</th><th>Сумма</th></tr>
        ${items.map(x => { const p = byId[x.id]; return `<tr><td><b>${esc(p.title)}</b><div class="mut" style="font-size:12px">${p.sku}</div></td><td>${rub(p.opt)}</td><td>${qty(p.id)}</td><td>${rub(p.opt * x.q)}</td></tr>`; }).join('')}
      </table></div></div>
      <div class="card"><h3>Итого</h3>
        <div class="row sp"><span>Товары</span><b>${rub(sum)}</b></div>
        <div class="row sp"><span>Скидка от объёма ${step.pct ? '−' + step.pct + '%' : ''}</span><b class="ok">${disc ? '−' + rub(disc) : '—'}</b></div>
        ${ns ? `<div class="mut" style="font-size:13px">Ещё ${rub(ns.from - sum)} – и скидка −${ns.pct}%</div>` : ''}
        <div class="field" style="margin-top:10px"><span>Оплатить баллами: <b>${usePts}</b> из ${maxPts} (до ${RULES.pointsMaxPct}%)</span><input type="range" id="pts" min="0" max="${maxPts}" step="10" value="${usePts}"></div>
        <div class="row sp" style="font-size:18px"><span>К оплате</span><b>${rub(total)}</b></div>
        <div class="mut" style="font-size:13px">Начислим ${Math.round(total * t.earn / 100)} баллов (${t.earn}% на статусе «${t.name}»)</div>
        <button class="btn" style="width:100%;margin-top:12px" id="order" ${sum < RULES.minOrder ? 'disabled' : ''}>Оформить заказ</button>
        ${sum < RULES.minOrder ? `<div class="warn" style="font-size:13px;margin-top:4px">Минимальный заказ ${rub(RULES.minOrder)}, не хватает ${rub(RULES.minOrder - sum)}</div>` : ''}
        <button class="btn line" style="width:100%;margin-top:8px" id="consign" ${short > 0 ? 'disabled' : ''}>Взять под реализацию</button>
        <div class="mut" style="font-size:13px;margin-top:4px">${short > 0 ? `<span class="bad">Превышает свободный лимит на ${rub(short)}.</span> Уберите часть или запросите увеличение у менеджера.` : `Свободный лимит реализации: ${rub(left)}. Заявку подтверждает производитель.`}</div>
        ${note('одна корзина – два пути: купить сразу со скидкой и баллами или подать заявку на реализацию в пределах лимита. Минимальный заказ проверяется до кнопки.', 'минимальный заказ – venokmoskva (30 000 ₽), hottex (20 000 ₽), floritus (10 000 ₽); лимит и блок кнопки – PARTS SOFT; оплата баллами частью суммы – «Мой WB».')}</div>
    </div>`;
  }

  // ---------- Заказы ----------
  function vOrders() {
    return `<div class="card"><div class="tw"><table><tr><th>№</th><th>Дата</th><th>Позиций</th><th>Сумма</th><th>Статус</th><th></th></tr>
      ${S.orders.map(o => `<tr><td>${o.no}</td><td>${o.d}</td><td>${o.items.reduce((a, x) => a + x.q, 0)} шт.</td><td>${rub(o.sum || itemsSum(o.items))}</td><td>${st(o.status)}</td>
        <td class="row">${o.status === 'На согласовании' ? `<button class="btn line sm" data-cancel="${o.no}">Отменить</button><button class="btn sec sm" data-approve="${o.no}">Демо: принять</button>` : ''}<button class="btn sec sm" data-repeat="${o.no}">Повторить</button></td></tr>`).join('')}
    </table></div>
    ${note('пока заказ «На согласовании», его можно отменить; дальше Принят → В производстве → Готов → Отгружен. Кнопка «Демо: принять» – это ответ производителя, в боевом кабинете её нет.', 'портал завода АЛСО (статусы, отмена до принятия, повтор).')}</div>`;
  }

  // ---------- Реализация ----------
  function vRealization() {
    const t = tierOf(S.turnover), left = limitLeft();
    const rows = S.lots.flatMap(l => l.items.map(x => ({ l, x, p: byId[x.id] })));
    return `
    <div class="grid g3">
      <div class="card"><div class="k">Лимит статуса «${t.name}»</div><div class="v">${rub(t.limit)}</div></div>
      <div class="card"><div class="k">На руках у вас</div><div class="v">${rub(onHands())}</div><div class="mut">по оптовой цене</div></div>
      <div class="card"><div class="k">Свободно</div><div class="v ${left > 0 ? 'ok' : 'bad'}">${rub(left)}</div><div class="mut">${pendingReq() ? 'с учётом заявок на согласовании' : ''}</div></div>
    </div>
    <div class="card" style="margin-top:14px"><h3>Как взять под реализацию</h3>
      <div>Соберите корзину → «Взять под реализацию» → производитель подтверждает заявку → товар приезжает → раз в 2 недели вы отчитываетесь о продажах и платите только за проданное, непроданное возвращаете.</div>
      <div class="row" style="margin-top:10px"><a class="btn sm" href="#catalog" style="text-decoration:none">Собрать заявку</a><button class="btn line sm" id="askLimit">Запросить увеличение лимита</button></div>
      ${note('реализация = консигнация: платите за проданное, возвращаете остаток. Срок отчёта и период – вопрос владельцу, здесь 14 дней.', 'механика из МоегоСклада (отчёт комиссионера) и договоров комиссии; готового B2B-образца в отрасли не нашли.')}</div>
    ${S.requests.length ? `<div class="card" style="margin-top:14px"><h3>Заявки</h3><div class="tw"><table><tr><th>№</th><th>Дата</th><th>Сумма</th><th>Статус</th><th></th></tr>
      ${S.requests.map(r => `<tr><td>${r.no}</td><td>${r.d}</td><td>${rub(r.sum)}</td><td>${st(r.status)}</td><td>${r.status === 'На согласовании' ? `<button class="btn sec sm" data-rok="${r.no}">Демо: одобрить</button> <button class="btn line sm" data-rno="${r.no}">Демо: отклонить</button>` : ''}</td></tr>`).join('')}
    </table></div></div>` : ''}
    <div class="card" style="margin-top:14px"><h3>Товар на реализации</h3><div class="tw"><table>
      <tr><th>Партия</th><th>Товар</th><th>Передано</th><th>Продано</th><th>Возврат</th><th>На руках</th><th>К оплате</th></tr>
      ${rows.map(({ l, x, p }) => `<tr${l.closed ? ' class="mut"' : ''}><td>${l.no}<div class="mut" style="font-size:12px">${l.closed ? 'закрыта' : 'отчёт до ' + l.due}</div></td><td>${esc(p.title)}</td><td>${x.given}</td><td>${x.sold}</td><td>${x.ret}</td><td><b>${x.given - x.sold - x.ret}</b></td><td>${rub(x.sold * p.opt)}</td></tr>`).join('')}
    </table></div>
    ${S.lots.some(l => !l.closed) ? `<div class="row" style="margin-top:10px"><button class="btn sm" id="report">Отчитаться о продажах</button><button class="btn line sm" id="ret">Вернуть непроданное</button></div>` : ''}
    ${note('колонки «Передано / Продано / Возврат / На руках» – оптовик всегда видит, сколько чужого товара у него и сколько он должен.', 'МойСклад, отчёт «Товары на реализации».')}</div>`;
  }

  // ---------- Статус и баллы ----------
  function vLoyalty() {
    const t = tierOf(S.turnover), nt = nextTier(S.turnover);
    return `
    <div class="grid g2">
      <div class="card"><div class="k">Ваш статус</div><div class="v">${t.name}</div>
        <div class="mut">Оборот за квартал ${rub(S.turnover)}${nt ? ` · до «${nt.name}» ${rub(nt.from - S.turnover)}` : ''}</div>
        <div class="bar"><i style="width:${nt ? (S.turnover - t.from) / (nt.from - t.from) * 100 : 100}%"></i></div>
        <div class="mut" style="font-size:13px">Статус пересчитывается в начале квартала по обороту прошлого. Не набрали порог – опускаетесь на ступень.</div></div>
      <div class="card"><div class="k">Баллы</div><div class="v">${S.points.toLocaleString('ru-RU')}</div>
        <div class="mut">1 балл = 1 ₽ · оплачивают до ${RULES.pointsMaxPct}% заказа · сгорают через 12 месяцев</div></div>
    </div>
    <div class="card" style="margin-top:14px"><h3>Уровни</h3><div class="tiers">
      ${RULES.tiers.map(x => `<div class="tier ${x === t ? 'on' : ''}"><b>${x.name}</b><div class="mut" style="font-size:13px">${x.from ? 'от ' + rub(x.from) + ' за квартал' : 'с первого заказа'}</div><ul>${x.perks.map(p => `<li>${p}</li>`).join('')}</ul></div>`).join('')}
    </div>${note('статус растёт от оборота и даёт ощутимое оптовику: больше лимит реализации, отсрочку, приоритет в цеху, а не только процент.', 'таблица уровней с привилегиями – emcmos (Basic/Silver/Gold/Platinum), удержание за период – «Мой WB».')}</div>
    <div class="grid g2" style="margin-top:14px">
      <div class="card"><h3>Задания за баллы</h3><table>
        ${RULES.tasks.map(x => `<tr><td>${x.name}</td><td><b>+${x.pts}</b></td><td>${S.done[x.id] ? st('Выполнено') : x.id === 'review' ? '<button class="btn sec sm" data-task="review">Отправить фото</button>' : '<span class="mut">по факту</span>'}</td></tr>`).join('')}
      </table>${note('баллы не только за деньги, но и за полезные производителю действия: отчёт вовремя, заказ без звонка, фото для сайта.', '«Мой WB» (задания для удержания уровня).')}</div>
      <div class="card"><h3>История</h3><table>${S.pointsLog.map(x => `<tr><td class="mut">${x.d}</td><td>${esc(x.t)}</td><td class="${x.v > 0 ? 'ok' : 'bad'}"><b>${x.v > 0 ? '+' : ''}${x.v}</b></td></tr>`).join('')}</table></div>
    </div>`;
  }

  // ---------- Расчёты и документы ----------
  function vFinance() {
    const docs = [['Договор поставки и комиссии № 17/26', '12.01'], ['Счёт № 1043', '24.10'], ['УПД № 1041', '22.10'], ['Отчёт комиссионера Р-108', '15.10'], ['Счёт № 1041', '20.10']];
    return `
    <div class="grid g3">
      <div class="card"><div class="k">Долг</div><div class="v warn">${rub(S.debt)}</div><div class="mut">оплатить до ${S.debtDue}</div></div>
      <div class="card"><div class="k">Отсрочка по статусу</div><div class="v">${tierOf(S.turnover).defer} дн.</div></div>
      <div class="card"><div class="k">Акт сверки</div><div class="row" style="margin-top:8px"><select id="per" style="border:1px solid var(--line);border-radius:8px;padding:7px"><option>III квартал 2026</option><option>Октябрь 2026</option><option>С начала года</option></select><button class="btn sm" id="akt">Запросить</button></div></div>
    </div>
    <div class="card" style="margin-top:14px"><h3>Документы</h3><table><tr><th>Документ</th><th>Дата</th><th></th></tr>
      ${docs.map(([n, d]) => `<tr><td>${n}</td><td>${d}</td><td><button class="btn line sm" data-doc>PDF</button></td></tr>`).join('')}</table>
      ${note('долг, отсрочка, акт сверки за период и все документы в одном месте – чтобы бухгалтер агентства не звонил.', 'АЛСО (УПД, ТТН, акт сверки), Сотбит (запрос акта сверки за период).')}</div>`;
  }

  // ---------- Компания ----------
  function vProfile() {
    const c = S.company;
    return `
    <div class="grid g2">
      <div class="card"><h3>Реквизиты</h3>
        ${[['Название', c.name], ['Юрлицо', c.legal], ['ИНН', c.inn], ['Город', c.city], ['Адрес доставки', c.addr]].map(([k, v]) => `<div class="field"><span class="mut">${k}</span><input value="${esc(v)}"></div>`).join('')}
        ${note('опт только для юрлиц и ИП: ИНН обязателен, адресов доставки может быть несколько.', 'hottex («только с юр. лицами и ИП»), Сотбит (несколько организаций у клиента).')}</div>
      <div class="card"><h3>Как оптовик попадает в кабинет</h3>
        <ol style="padding-left:18px;margin:0"><li>На сайте «Оптом» → заявка: ИНН, название, город, телефон.</li><li>Менеджер проверяет и заключает договор.</li><li>Оптовик получает вход по коду на почту – видит оптовые цены.</li></ol>
        <div class="mut" style="margin-top:8px">Розничный покупатель оптовых цен не видит.</div>
        ${note('регистрация в два шага с одобрением производителя.', 'ritual.ru (договор → логин в B2B-систему), Сотбит (доступ после одобрения администратором).')}</div>
    </div>`;
  }

  const VIEWS = { home: vHome, catalog: vCatalog, cart: vCart, orders: vOrders, realization: vRealization, loyalty: vLoyalty, finance: vFinance, profile: vProfile };

  function render() {
    const r = (location.hash.slice(1) || 'home');
    const key = VIEWS[r] ? r : 'home';
    nav(key);
    $('#view').innerHTML = VIEWS[key]();
  }

  const today = () => new Date().toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' });
  function setQty(id, q) { S.cart[id] = Math.max(0, q | 0); if (!S.cart[id]) delete S.cart[id]; save(); render(); }
  function repeat(no) { const o = S.orders.find(x => x.no == no); if (!o) return; o.items.forEach(x => { S.cart[x.id] = (S.cart[x.id] || 0) + x.q; }); save(); location.hash = 'cart'; toast('Заказ № ' + no + ' в корзине'); }

  document.addEventListener('click', e => {
    const d = e.target.closest('[data-g],[data-inc],[data-dec],[data-repeat],[data-cancel],[data-approve],[data-rok],[data-rno],[data-task],[data-doc],button[id]');
    if (!d) return;
    const ds = d.dataset;
    if (ds.g) { fGroup = ds.g; render(); return; }
    if (ds.inc) return setQty(ds.inc, (S.cart[ds.inc] || 0) + 1);
    if (ds.dec) return setQty(ds.dec, (S.cart[ds.dec] || 0) - 1);
    if (ds.repeat) return repeat(ds.repeat);
    if (ds.cancel) { S.orders.find(o => o.no == ds.cancel).status = 'Отменён'; save(); render(); return toast('Заказ отменён'); }
    if (ds.approve) { S.orders.find(o => o.no == ds.approve).status = 'Принят'; save(); render(); return toast('Производитель принял заказ'); }
    if (ds.rok) {
      const r = S.requests.find(x => x.no === ds.rok); r.status = 'Одобрена';
      S.lots.unshift({ no: r.no, d: today(), due: 'через 14 дн.', items: r.items.map(x => ({ id: x.id, given: x.q, sold: 0, ret: 0 })) });
      save(); render(); return toast('Заявка одобрена, товар передан');
    }
    if (ds.rno) { S.requests.find(x => x.no === ds.rno).status = 'Отклонена'; save(); render(); return toast('Заявка отклонена, лимит освобождён'); }
    if (ds.task) { S.done.review = true; S.points += 200; S.pointsLog.unshift({ d: today(), t: 'Фото установки с отзывом', v: 200 }); save(); render(); return toast('+200 баллов'); }
    if ('doc' in ds) return toast('В боевом кабинете скачается PDF');
    switch (d.id) {
      case 'reset': try { localStorage.removeItem(KEY); } catch (er) { /* нет хранилища */ } load(); usePts = 0; render(); return toast('Демо сброшено');
      case 'quickAdd': {
        let n = 0, bad = [];
        $('#quick').value.split('\n').map(s => s.trim()).filter(Boolean).forEach(s => {
          const [sku, q] = s.split(/[\s,;]+/); const p = bySku[(sku || '').toUpperCase()];
          if (p) { S.cart[p.id] = (S.cart[p.id] || 0) + (parseInt(q, 10) || 1); n++; } else bad.push(sku);
        });
        save(); render(); return toast(`Добавлено позиций: ${n}${bad.length ? ' · не нашли: ' + bad.join(', ') : ''}`);
      }
      case 'order': {
        const items = cartItems(), sum = itemsSum(items), disc = Math.round(sum * stepOf(sum).pct / 100), total = sum - disc - usePts;
        const no = Math.max(...S.orders.map(o => o.no)) + 1, earn = Math.round(total * tierOf(S.turnover).earn / 100);
        S.orders.unshift({ no, d: today(), items, sum: total, status: 'На согласовании' });
        if (usePts) S.pointsLog.unshift({ d: today(), t: 'Оплата баллами заказа № ' + no, v: -usePts });
        S.points += earn - usePts; S.pointsLog.unshift({ d: today(), t: 'Начислено за заказ № ' + no, v: earn });
        if (!S.done.self) { S.done.self = true; S.points += 100; S.pointsLog.unshift({ d: today(), t: 'Заказ через кабинет без звонка', v: 100 }); }
        S.turnover += total; S.debt += total; S.cart = {}; usePts = 0; save(); location.hash = 'orders'; return toast('Заказ № ' + no + ' отправлен на согласование');
      }
      case 'consign': {
        const items = cartItems(), sum = itemsSum(items);
        if (sum > limitLeft()) return toast('Не хватает лимита');
        const no = 'Р-' + (113 + S.requests.length);
        S.requests.unshift({ no, d: today(), items, sum, status: 'На согласовании' }); S.cart = {}; save(); location.hash = 'realization'; return toast('Заявка ' + no + ' ждёт подтверждения производителя');
      }
      case 'report': {
        const lot = S.lots.find(l => !l.closed); let pay = 0;
        lot.items.forEach(x => { const add = x.given - x.sold - x.ret > 0 ? 1 : 0; x.sold += add; pay += add * byId[x.id].opt; });
        S.debt += pay; S.turnover += pay;
        const first = !S.done.report;
        if (first) { S.done.report = true; S.points += 300; S.pointsLog.unshift({ d: today(), t: 'Отчёт по реализации ' + lot.no + ' до срока', v: 300 }); }
        save(); render(); return toast('Отчёт принят: к оплате ' + rub(pay) + (first ? ' · +300 баллов' : ''));
      }
      case 'ret': { const lot = S.lots.find(l => !l.closed); lot.items.forEach(x => { x.ret = x.given - x.sold; }); lot.closed = true; save(); render(); return toast('Возврат оформлен, лимит освобождён'); }
      case 'askLimit': return toast('Запрос отправлен менеджеру Ольге');
      case 'akt': return toast('Акт сверки придёт на почту в течение дня');
    }
  });
  document.addEventListener('input', e => {
    if (e.target.id === 'q') { fQ = e.target.value; const pos = e.target.selectionStart; render(); const q = $('#q'); q.focus(); q.setSelectionRange(pos, pos); }
  });
  document.addEventListener('change', e => { if (e.target.id === 'pts') { usePts = +e.target.value; return render(); } if (e.target.dataset.q) setQty(e.target.dataset.q, +e.target.value); });
  $('#explain').addEventListener('change', e => document.body.classList.toggle('explain', e.target.checked));
  window.addEventListener('hashchange', () => { render(); window.scrollTo(0, 0); });
  render();
})();
