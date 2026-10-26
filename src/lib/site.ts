// Контакты, меню и адреса страниц – одно место для шапки, подвала, разметки и форм.
// Контакты взяты со страницы «Контакты» rozalii.ru 26.10.2026; телефон из шапки Тильды (+7 977 090-73-44) и адрес
// «ул. Инженерная, 21» расходятся с ней – вопрос владельцу №8 (docs/karta-sayta.md). Мессенджеры HoliFlori не переносим.
export const SITE = {
  name: 'Розалия',
  full: 'Розалия – производство ритуальных венков',
  city: 'Сергиев Посад',
  phones: [
    { text: '+7 (926) 267-79-99', href: 'tel:+79262677999' },
    { text: '+7 (926) 128-33-38', href: 'tel:+79261283338' },
  ],
  email: 'venkisp@yandex.ru',
  address: 'Московская обл., Сергиево-Посадский г. о., д. Воронцово, 41с2',
  addressShort: 'д. Воронцово, 41с2 (Сергиев Посад)',
  hours: 'Ежедневно 09:00–21:00, заявки принимаем круглосуточно',
  geo: ['Сергиев Посад', 'Дмитров', 'Краснозаводск', 'Пушкино', 'Пересвет', 'Мытищи', 'Хотьково', 'Королёв',
    'Александров', 'Ивантеевка', 'Переславль-Залесский', 'Орехово-Зуево'],
};

export const R = {
  home: '/', katalog: '/katalog/', uslugi: '/uslugi/', optom: '/optom/', dostavka: '/dostavka/', about: '/o-nas/',
  contacts: '/kontakty/', cart: '/korzina/', thanks: '/zakaz-prinyat/', map: '/karta-sayta/',
  policy: '/politika-konfidentsialnosti/', agreement: '/polzovatelskoe-soglashenie/',
  consent: '/soglasie-na-obrabotku-personalnyh-dannyh/', cabinet: '/opt/',
};

export const SECTIONS = [
  { slug: 'ritualnye-venki', name: 'Ритуальные венки', short: 'Венки', img: 'cat-venki' },
  { slug: 'ritualnye-korziny', name: 'Ритуальные корзины', short: 'Корзины', img: 'cat-korziny' },
  { slug: 'kompozitsii-v-gorshkakh', name: 'Композиции в горшках', short: 'Композиции', img: 'cat-kompozitsii' },
] as const;

export const SERVICES = [
  { slug: 'dostavka-k-mestu-proshchaniya', name: 'Доставка к месту прощания', img: 'k-mestu',
    text: 'Привезём венок или корзину в морг, крематорий, храм или к месту церемонии к согласованному времени.' },
  { slug: 'vozlozhenie-k-pamyatnoy-date', name: 'Доставка и возложение к памятной дате', img: 'pamyatnaya-data',
    text: 'Если не можете приехать лично, доставим и возложим венок на месте захоронения, пришлём фотоотчёт.' },
  { slug: 'oformlenie-zala-proshchaniya', name: 'Оформление зала прощания', img: 'zal',
    text: 'Оформим зал венками, живыми и искусственными композициями под формат церемонии.' },
];

export const MENU = [
  { name: 'Каталог', href: R.katalog, sub: SECTIONS.map((s) => ({ name: s.name, href: `/katalog/${s.slug}/` })) },
  { name: 'Услуги', href: R.uslugi, sub: SERVICES.map((s) => ({ name: s.name, href: `/uslugi/${s.slug}/` })) },
  { name: 'Оптом', href: R.optom },
  { name: 'Доставка и оплата', href: R.dostavka },
  { name: 'О компании', href: R.about },
  { name: 'Контакты', href: R.contacts },
];
