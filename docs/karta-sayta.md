# Карта сайта rozalii.ru → Astro (с корзиной)

Снято 26.10.2026 с живого сайта: sitemap.xml (15 адресов), sitemap-store.xml (69 товаров), robots.txt, HTML всех страниц,
store API Тильды (`storepartuid=111128780593`, `recid=4437545301`, проект 36049009). Сырые товары – `source/products.json`.

Бизнес по факту: производство ритуальных венков, корзин и композиций, Сергиев Посад; опт (основное) и розница;
доставка по Сергиеву Посаду и ближайшим городам (Дмитров, Краснозаводск, Пушкино…), опт – ТК по России.

## Цифры

| Что | Сколько |
|---|---|
| Страниц в sitemap.xml | 15 (Главная, Каталог, 3 раздела, 4 инфо, хаб услуг + 3 услуги, 2 юр.) |
| Скрытых страниц (robots) | 2 – шаблоны «Copy of Copy of Heder/Footer» (`/page231453409.html`, `/page231454909.html`) |
| Битых внутренних ссылок | 2 – `/catalog/compositions` и `/delivery` (обе 404, стоят на главной) |
| Разделов каталога | 3 верхних (Венки 58, Корзины плетёные 8, Горшки 3) + 5 подразделов у венков без своих страниц (90 – 9, 110 – 25, 125 – 11, 140 элитные – 10, 140 под заказ – 3) |
| Товаров | 69 (все в sitemap-store и в API, расхождений нет) |
| Из них с именем-заглушкой «… – товар 01» | 53; с настоящим именем – 16 |
| Товаров с цветовыми вариантами | 19 (58 вариантов, у каждого своё фото) |
| Товаров с ценой | **0** – цена пустая у всех 69 и у всех вариантов |
| Фото | 108 (у 50 товаров по одному) |
| Новых страниц на Astro (индексируемых) | 1 + 1 + 3 + 69 + 1 + 3 + 6 = 84 (+ 4 «новое» на решение) |

## Дерево

```
/                                   Главная
├── /katalog                        Хаб (все товары, чипы разделов)
│   ├── /katalog/ritualnye-venki            Каталог (58) – чипы: 90 / 110 / 125 / 140 элитные / 140 под заказ
│   │     └── /katalog/ritualnye-venki/venok-amur-110-sm …   Карточки
│   ├── /katalog/ritualnye-korziny          Каталог (8)
│   ├── /katalog/kompozitsii-v-gorshkakh    Каталог (3)
│   └── /katalog/kompozitsii                «новое» – ссылка есть на главной, раздела нет (вопрос 3)
├── /uslugi                         Хаб (Дополнительные услуги)
│   ├── /uslugi/dostavka-k-mestu-proshchaniya
│   ├── /uslugi/vozlozhenie-k-pamyatnoy-date
│   ├── /uslugi/oformlenie-zala-proshchaniya
│   └── /uslugi/traurnye-lenty               «новое» – сейчас только блок с якорем (вопрос 5)
├── /korporativnym                  Опт (Корпоративным клиентам)
├── /dostavka                       Доставка и оплата
├── /o-nas                          О компании
├── /kontakty                       Контакты
├── /politika-konfidentsialnosti    Юридическая
├── /polzovatelskoe-soglashenie     Юридическая
└── техн.: /korzina, /zakaz-prinyat, /404, /admin, /sitemap.xml, /robots.txt
```

Правило адреса карточки: `/katalog/<раздел>/<тип>-<имя>-<размер>-sm`. Размер в адресе обязателен: на сайте есть одноимённые
венки разных размеров («Амур» 110 и 90, «Диагональ» 110 и 90, «Память» 110 и 125) – без размера адреса совпали бы.
Заглушки получили временный адрес с номером (`venok-110-sm-04`); как только владелец даст имена – адрес по имени, 301 не нужен,
если переименовать до запуска. Самый длинный адрес – 58 знаков.

## Страницы (кроме карточек)

| Новый адрес | Название | Сущность | Откуда (старый адрес) | Индекс |
|---|---|---|---|---|
| / | Ритуальные венки и композиции от производителя в Сергиевом Посаде | Главная | / | да |
| /katalog | Каталог ритуальных венков и композиций | Хаб | /catalog | да |
| /katalog/ritualnye-venki | Ритуальные венки | Каталог | /catalog/ritual_wreaths | да |
| /katalog/ritualnye-korziny | Ритуальные корзины | Каталог | /catalog/ritual_baskets | да |
| /katalog/kompozitsii-v-gorshkakh | Композиции в горшках | Каталог | /catalog/pot | да |
| /katalog/kompozitsii | Композиции – «новое», только если есть товары | Каталог | /catalog/compositions (сейчас 404) | да, если появится |
| /uslugi | Дополнительные услуги | Хаб | /additional_services | да |
| /uslugi/dostavka-k-mestu-proshchaniya | Доставка венков к месту прощания | Страница | /additional_services/to_the_place_of_farewell | да |
| /uslugi/vozlozhenie-k-pamyatnoy-date | Доставка и возложение венков к памятной дате | Страница | /additional_services/the_memorable_date | да |
| /uslugi/oformlenie-zala-proshchaniya | Оформление зала прощания | Страница | /additional_services/farewell_hall | да |
| /uslugi/traurnye-lenty | Траурные ленты с надписью – «новое» | Страница | блок на /additional_services (#mourning-ribbons) | да, если делаем |
| /korporativnym | Ритуальные венки оптом от производителя | Страница | /corparate | да |
| /dostavka | Доставка и оплата | Страница | /deliveri, /delivery (404) | да |
| /o-nas | О компании | Страница | /about | да |
| /kontakty | Контакты | Страница | /contact | да |
| /politika-konfidentsialnosti | Политика конфиденциальности | Юридическая | /policy | да |
| /polzovatelskoe-soglashenie | Пользовательское соглашение | Юридическая | /agreement | да |
| /korzina | Корзина | Техническая | – (у Тильды попап) | нет, закрыто от поиска |
| /zakaz-prinyat | Спасибо, заказ принят | Техническая | – | нет, закрыто от поиска |
| /404 | Страница не найдена | Техническая | – | нет, закрыто от поиска |
| /admin | Админка (за логином целиком) | Техническая | – | нет, закрыто от поиска |
| /sitemap.xml, /robots.txt | Карта сайта, правила для роботов | Техническая | /sitemap.xml + /sitemap-store.xml | – |

Отзывы остаются блоком на главной (`/#otzyvy`), отдельной страницы в источнике нет.

## Карточки товаров (69)

| Новый адрес | Название (предложение) | Сущность | Откуда (старый адрес) | Индекс |
|---|---|---|---|---|
| /katalog/kompozitsii-v-gorshkakh/kompozitsiya-v-gorshke-01 | Композиция в горшке 01 *(имя-заглушка)* | Карточка товара | /catalog/pot/tproduct/893485335523-gorshki-tovar-01 | да |
| /katalog/kompozitsii-v-gorshkakh/kompozitsiya-v-gorshke-02 | Композиция в горшке 02 *(имя-заглушка)* | Карточка товара | /catalog/pot/tproduct/806062424243-gorshki-tovar-02 | да |
| /katalog/kompozitsii-v-gorshkakh/kompozitsiya-v-gorshke-03 | Композиция в горшке 03 *(имя-заглушка)* | Карточка товара | /catalog/pot/tproduct/243753903473-gorshki-tovar-03 | да |
| /katalog/ritualnye-korziny/pletenaya-korzina-01 | Плетёная корзина 01 *(имя-заглушка)* | Карточка товара | /catalog/ritual_baskets/tproduct/400756739713-korzini-pletennie-tovar-01 | да |
| /katalog/ritualnye-korziny/pletenaya-korzina-02 | Плетёная корзина 02 *(имя-заглушка)* | Карточка товара | /catalog/ritual_baskets/tproduct/393078372883-korzini-pletennie-tovar-02 | да |
| /katalog/ritualnye-korziny/pletenaya-korzina-03 | Плетёная корзина 03 *(имя-заглушка)* | Карточка товара | /catalog/ritual_baskets/tproduct/779948694463-korzini-pletennie-tovar-03 | да |
| /katalog/ritualnye-korziny/pletenaya-korzina-04 | Плетёная корзина 04 *(имя-заглушка)* | Карточка товара | /catalog/ritual_baskets/tproduct/858759090423-korzini-pletennie-tovar-04 | да |
| /katalog/ritualnye-korziny/pletenaya-korzina-05 | Плетёная корзина 05 *(имя-заглушка)* | Карточка товара | /catalog/ritual_baskets/tproduct/558290938043-korzini-pletennie-tovar-05 | да |
| /katalog/ritualnye-korziny/pletenaya-korzina-06 | Плетёная корзина 06 *(имя-заглушка)* | Карточка товара | /catalog/ritual_baskets/tproduct/318126349383-korzini-pletennie-tovar-06 | да |
| /katalog/ritualnye-korziny/pletenaya-korzina-07 | Плетёная корзина 07 *(имя-заглушка)* | Карточка товара | /catalog/ritual_baskets/tproduct/354885413983-korzini-pletennie-tovar-07 | да |
| /katalog/ritualnye-korziny/pletenaya-korzina-08 | Плетёная корзина 08 *(имя-заглушка)* | Карточка товара | /catalog/ritual_baskets/tproduct/246708027253-korzini-pletennie-tovar-08 | да |
| /katalog/ritualnye-venki/venok-elitnyy-140-sm-01 | Венок элитный 140 см, №01 *(имя-заглушка)* | Карточка товара | /catalog/ritual_wreaths/tproduct/676595958013-140-el-2-tovar-01 | да |
| /katalog/ritualnye-venki/venok-elitnyy-140-sm-02 | Венок элитный 140 см, №02 *(имя-заглушка)* | Карточка товара | /catalog/ritual_wreaths/tproduct/439531332053-140-el-2-tovar-02 | да |
| /katalog/ritualnye-venki/venok-elitnyy-140-sm-03 | Венок элитный 140 см, №03 *(имя-заглушка)* | Карточка товара | /catalog/ritual_wreaths/tproduct/683584542043-140-el-2-tovar-03 | да |
| /katalog/ritualnye-venki/venok-elitnyy-140-sm-04 | Венок элитный 140 см, №04 *(имя-заглушка)* | Карточка товара | /catalog/ritual_wreaths/tproduct/948023388093-140-el-2-tovar-04 | да |
| /katalog/ritualnye-venki/venok-elitnyy-140-sm-05 | Венок элитный 140 см, №05 *(имя-заглушка)* | Карточка товара | /catalog/ritual_wreaths/tproduct/421342824183-140-el-2-tovar-05 | да |
| /katalog/ritualnye-venki/venok-elitnyy-140-sm-06 | Венок элитный 140 см, №06 *(имя-заглушка)* | Карточка товара | /catalog/ritual_wreaths/tproduct/818098962463-140-el-2-tovar-06 | да |
| /katalog/ritualnye-venki/venok-elitnyy-140-sm-07 | Венок элитный 140 см, №07 *(имя-заглушка)* | Карточка товара | /catalog/ritual_wreaths/tproduct/924045230643-140-el-2-tovar-07 | да |
| /katalog/ritualnye-venki/venok-elitnyy-140-sm-08 | Венок элитный 140 см, №08 *(имя-заглушка)* | Карточка товара | /catalog/ritual_wreaths/tproduct/616749233613-140-el-2-tovar-08 | да |
| /katalog/ritualnye-venki/venok-elitnyy-140-sm-09 | Венок элитный 140 см, №09 *(имя-заглушка)* | Карточка товара | /catalog/ritual_wreaths/tproduct/140984189463-140-el-2-tovar-09 | да |
| /katalog/ritualnye-venki/venok-florentsiya-elitnyy-140-sm | Венок «Флоренция» элитный 140 см – 4 цв. | Карточка товара | /catalog/ritual_wreaths/tproduct/363646447713-florentsiya | да |
| /katalog/ritualnye-venki/venok-110-sm-01 | Венок 110 см, №01 *(имя-заглушка)* – 2 цв. | Карточка товара | /catalog/ritual_wreaths/tproduct/778066232073-venki-110-tovar-01 | да |
| /katalog/ritualnye-venki/venok-amur-110-sm | Венок «Амур» 110 см – 3 цв. | Карточка товара | /catalog/ritual_wreaths/tproduct/683702384973-amur | да |
| /katalog/ritualnye-venki/venok-diagonal-110-sm | Венок «Диагональ» 110 см – 2 цв. | Карточка товара | /catalog/ritual_wreaths/tproduct/519006791653-diagonal | да |
| /katalog/ritualnye-venki/venok-110-sm-04 | Венок 110 см, №04 *(имя-заглушка)* – 5 цв. | Карточка товара | /catalog/ritual_wreaths/tproduct/446133019823-venki-110-tovar-04 | да |
| /katalog/ritualnye-venki/venok-110-sm-05 | Венок 110 см, №05 *(имя-заглушка)* – 3 цв. | Карточка товара | /catalog/ritual_wreaths/tproduct/770211024963-venki-110-tovar-05 | да |
| /katalog/ritualnye-venki/venok-110-sm-06 | Венок 110 см, №06 *(имя-заглушка)* – 2 цв. | Карточка товара | /catalog/ritual_wreaths/tproduct/573369476743-venki-110-tovar-06 | да |
| /katalog/ritualnye-venki/venok-110-sm-07 | Венок 110 см, №07 *(имя-заглушка)* – 4 цв. | Карточка товара | /catalog/ritual_wreaths/tproduct/291331091803-venki-110-tovar-07 | да |
| /katalog/ritualnye-venki/venok-110-sm-08 | Венок 110 см, №08 *(имя-заглушка)* – 2 цв. | Карточка товара | /catalog/ritual_wreaths/tproduct/466638561093-venki-110-tovar-08 | да |
| /katalog/ritualnye-venki/venok-110-sm-09 | Венок 110 см, №09 *(имя-заглушка)* – 3 цв. | Карточка товара | /catalog/ritual_wreaths/tproduct/847450288093-venki-110-tovar-09 | да |
| /katalog/ritualnye-venki/venok-110-sm-10 | Венок 110 см, №10 *(имя-заглушка)* – 3 цв. | Карточка товара | /catalog/ritual_wreaths/tproduct/744855633563-venki-110-tovar-10 | да |
| /katalog/ritualnye-venki/venok-liliya-110-sm | Венок «Лилия» 110 см – 4 цв. | Карточка товара | /catalog/ritual_wreaths/tproduct/334054129253-liliya | да |
| /katalog/ritualnye-venki/venok-luch-110-sm | Венок «Луч» 110 см – 2 цв. | Карточка товара | /catalog/ritual_wreaths/tproduct/781760509943-luch | да |
| /katalog/ritualnye-venki/venok-110-sm-13 | Венок 110 см, №13 *(имя-заглушка)* | Карточка товара | /catalog/ritual_wreaths/tproduct/636559134473-venki-110-tovar-13 | да |
| /katalog/ritualnye-venki/venok-110-sm-14 | Венок 110 см, №14 *(имя-заглушка)* | Карточка товара | /catalog/ritual_wreaths/tproduct/635692062583-venki-110-tovar-14 | да |
| /katalog/ritualnye-venki/venok-110-sm-15 | Венок 110 см, №15 *(имя-заглушка)* | Карточка товара | /catalog/ritual_wreaths/tproduct/117630952853-venki-110-tovar-15 | да |
| /katalog/ritualnye-venki/venok-siren-110-sm | Венок «Сирень» 110 см | Карточка товара | /catalog/ritual_wreaths/tproduct/192914144583-siren | да |
| /katalog/ritualnye-venki/venok-verona-110-sm | Венок «Верона» 110 см – 2 цв. | Карточка товара | /catalog/ritual_wreaths/tproduct/850770617843-verona | да |
| /katalog/ritualnye-venki/venok-kaplya-110-sm | Венок «Капля» 110 см | Карточка товара | /catalog/ritual_wreaths/tproduct/403438239123-kaplya | да |
| /katalog/ritualnye-venki/venok-nezhnost-110-sm | Венок «Нежность» 110 см | Карточка товара | /catalog/ritual_wreaths/tproduct/734060460463-nezhnost | да |
| /katalog/ritualnye-venki/venok-pamyat-110-sm | Венок «Память» 110 см | Карточка товара | /catalog/ritual_wreaths/tproduct/804428191953-pamyat | да |
| /katalog/ritualnye-venki/venok-provans-110-sm | Венок «Прованс» 110 см | Карточка товара | /catalog/ritual_wreaths/tproduct/342716842773-provans | да |
| /katalog/ritualnye-venki/venok-elegiya-110-sm | Венок «Элегия» 110 см | Карточка товара | /catalog/ritual_wreaths/tproduct/572262236833-elegiya | да |
| /katalog/ritualnye-venki/venok-110-sm-23 | Венок 110 см, №23 *(имя-заглушка)* | Карточка товара | /catalog/ritual_wreaths/tproduct/411454310953-venki-110-tovar-23 | да |
| /katalog/ritualnye-venki/venok-110-sm-24 | Венок 110 см, №24 *(имя-заглушка)* | Карточка товара | /catalog/ritual_wreaths/tproduct/832743454933-venki-110-tovar-24 | да |
| /katalog/ritualnye-venki/venok-110-sm-25 | Венок 110 см, №25 *(имя-заглушка)* | Карточка товара | /catalog/ritual_wreaths/tproduct/922138369853-venki-110-tovar-25 | да |
| /katalog/ritualnye-venki/venok-amur-90-sm | Венок «Амур» 90 см – 5 цв. | Карточка товара | /catalog/ritual_wreaths/tproduct/342344192333-amur | да |
| /katalog/ritualnye-venki/venok-diagonal-90-sm | Венок «Диагональ» 90 см – 3 цв. | Карточка товара | /catalog/ritual_wreaths/tproduct/823238585333-diagonal | да |
| /katalog/ritualnye-venki/venok-90-sm-03 | Венок 90 см, №03 *(имя-заглушка)* | Карточка товара | /catalog/ritual_wreaths/tproduct/268101753333-venki-90-tovar-03 | да |
| /katalog/ritualnye-venki/venok-90-sm-04 | Венок 90 см, №04 *(имя-заглушка)* | Карточка товара | /catalog/ritual_wreaths/tproduct/549709676523-venki-90-tovar-04 | да |
| /katalog/ritualnye-venki/venok-90-sm-05 | Венок 90 см, №05 *(имя-заглушка)* | Карточка товара | /catalog/ritual_wreaths/tproduct/140323239003-venki-90-tovar-05 | да |
| /katalog/ritualnye-venki/venok-90-sm-06 | Венок 90 см, №06 *(имя-заглушка)* – 2 цв. | Карточка товара | /catalog/ritual_wreaths/tproduct/692166336323-venki-90-tovar-06 | да |
| /katalog/ritualnye-venki/venok-90-sm-07 | Венок 90 см, №07 *(имя-заглушка)* | Карточка товара | /catalog/ritual_wreaths/tproduct/718126351993-venki-90-tovar-07 | да |
| /katalog/ritualnye-venki/venok-90-sm-08 | Венок 90 см, №08 *(имя-заглушка)* – 3 цв. | Карточка товара | /catalog/ritual_wreaths/tproduct/187793060513-venki-90-tovar-08 | да |
| /katalog/ritualnye-venki/venok-90-sm-09 | Венок 90 см, №09 *(имя-заглушка)* – 4 цв. | Карточка товара | /catalog/ritual_wreaths/tproduct/745703507863-venki-90-tovar-09 | да |
| /katalog/ritualnye-venki/venok-125-sm-01 | Венок 125 см, №01 *(имя-заглушка)* | Карточка товара | /catalog/ritual_wreaths/tproduct/479745558153-venki-125-tovar-01 | да |
| /katalog/ritualnye-venki/venok-125-sm-02 | Венок 125 см, №02 *(имя-заглушка)* | Карточка товара | /catalog/ritual_wreaths/tproduct/493611219543-venki-125-tovar-02 | да |
| /katalog/ritualnye-venki/venok-125-sm-03 | Венок 125 см, №03 *(имя-заглушка)* | Карточка товара | /catalog/ritual_wreaths/tproduct/869014373103-venki-125-tovar-03 | да |
| /katalog/ritualnye-venki/venok-125-sm-04 | Венок 125 см, №04 *(имя-заглушка)* | Карточка товара | /catalog/ritual_wreaths/tproduct/109483081453-venki-125-tovar-04 | да |
| /katalog/ritualnye-venki/venok-125-sm-05 | Венок 125 см, №05 *(имя-заглушка)* | Карточка товара | /catalog/ritual_wreaths/tproduct/807048204553-venki-125-tovar-05 | да |
| /katalog/ritualnye-venki/venok-125-sm-06 | Венок 125 см, №06 *(имя-заглушка)* | Карточка товара | /catalog/ritual_wreaths/tproduct/814619078003-venki-125-tovar-06 | да |
| /katalog/ritualnye-venki/venok-125-sm-07 | Венок 125 см, №07 *(имя-заглушка)* | Карточка товара | /catalog/ritual_wreaths/tproduct/286289508743-venki-125-tovar-07 | да |
| /katalog/ritualnye-venki/venok-125-sm-08 | Венок 125 см, №08 *(имя-заглушка)* | Карточка товара | /catalog/ritual_wreaths/tproduct/658410559203-venki-125-tovar-08 | да |
| /katalog/ritualnye-venki/venok-125-sm-09 | Венок 125 см, №09 *(имя-заглушка)* | Карточка товара | /catalog/ritual_wreaths/tproduct/436273345343-venki-125-tovar-09 | да |
| /katalog/ritualnye-venki/venok-pamyat-125-sm | Венок «Память» 125 см | Карточка товара | /catalog/ritual_wreaths/tproduct/361598492293-pamyat | да |
| /katalog/ritualnye-venki/venok-serdtse-125-sm | Венок «Сердце» 125 см | Карточка товара | /catalog/ritual_wreaths/tproduct/429021369293-serdtse | да |
| /katalog/ritualnye-venki/venok-140-sm-pod-zakaz-01 | Венок 140 см под заказ, №01 *(имя-заглушка)* | Карточка товара | /catalog/ritual_wreaths/tproduct/533013343503-venki-140-zakaz-tovar-01 | да |
| /katalog/ritualnye-venki/venok-140-sm-pod-zakaz-02 | Венок 140 см под заказ, №02 *(имя-заглушка)* | Карточка товара | /catalog/ritual_wreaths/tproduct/733204135013-venki-140-zakaz-tovar-02 | да |
| /katalog/ritualnye-venki/venok-140-sm-pod-zakaz-03 | Венок 140 см под заказ, №03 *(имя-заглушка)* | Карточка товара | /catalog/ritual_wreaths/tproduct/595126867683-venki-140-zakaz-tovar-03 | да |

## 301 «старый → новый»

Страницы:

| Старый | Новый |
|---|---|
| /catalog | /katalog |
| /catalog/ritual_wreaths | /katalog/ritualnye-venki |
| /catalog/ritual_baskets | /katalog/ritualnye-korziny |
| /catalog/pot | /katalog/kompozitsii-v-gorshkakh |
| /catalog/compositions | /katalog (или /katalog/kompozitsii, если раздел появится) |
| /additional_services | /uslugi |
| /additional_services/to_the_place_of_farewell | /uslugi/dostavka-k-mestu-proshchaniya |
| /additional_services/the_memorable_date | /uslugi/vozlozhenie-k-pamyatnoy-date |
| /additional_services/farewell_hall | /uslugi/oformlenie-zala-proshchaniya |
| /corparate | /korporativnym |
| /deliveri | /dostavka |
| /delivery | /dostavka |
| /about | /o-nas |
| /contact | /kontakty |
| /policy | /politika-konfidentsialnosti |
| /agreement | /polzovatelskoe-soglashenie |
| /page231453409.html | / (шаблон шапки, не переносим) |
| /page231454909.html | / (шаблон подвала, не переносим) |
| /sitemap-store.xml | /sitemap.xml |

Товары – 69 строк выше (колонка «Откуда» → «Новый адрес»). Правило для сервера: Тильда отдаёт карточку по любому пути с
`/tproduct/<uid>-…` (например `/tproduct/…`, `/catalog/tproduct/…`, `/about/tproduct/…`), поэтому редирект делать по uid
(первые 12 цифр после `tproduct/`), а не по полному адресу: `*/tproduct/<uid>-*` → новый адрес из `products.json` (поле `uid`).

## Меню сейчас и чем плохо

Шапка и подвал (одинаковые): Главная · Корпоративным клиентам · Каталог · Дополнительные услуги · Доставка и оплата ·
Отзывы (якорь `/#reviews`) · О компании · Контакты. Плюс телефон, адрес, «Связаться с нами», корзина, поиск.

1. 8 пунктов в одну строку, нет выпадашек: разделы каталога (Венки / Корзины / Горшки) и услуги из меню не видны.
2. «Корпоративным клиентам» стоит вторым, перед Каталогом, – розничный покупатель венка сначала видит опт.
3. «Главная» в меню лишняя (есть логотип), «Отзывы» – якорь, со внутренних страниц перебрасывает на главную.
4. Противоречивые контакты: шапка +7 977 090-73-44 и «ул. Инженерная, 21»; страница Контакты +7 926 267-79-99, +7 926 128-33-38,
   venkisp@yandex.ru и «д. Воронцово, 41с2».
5. Хвосты чужого шаблона: Telegram/MAX/VK ведут на HoliFlori (`t.me/HoliFlori_sales_bot`, `vk.com/holiflori`), кнопка «Заказать букет»,
   попап «подобрать букет»; на Контактах соцсети – пустые якоря `#telegram #max #vk`. Отзывы ссылаются на venkisp.ru.
6. На главной ссылки на несуществующие `/catalog/compositions` и `/delivery`.
7. Подзаголовки в адресах Тильды на английском с ошибками (`deliveri`, `corparate`).

Предложение по меню: Каталог (выпадает: Венки, Корзины, Композиции в горшках) · Услуги (4 пункта) · Оптом · Доставка и оплата ·
О компании · Контакты; телефон и мессенджеры справа, корзина.

## Фильтры и характеристики в данных

- **Цена / старая цена** – поля есть, но пустые у всех товаров. Фильтр и сортировка по цене сейчас невозможны.
- **Раздел / подраздел** – есть: Венки, Корзины плетёные, Горшки; у венков 5 подразделов.
- **Размер** – только через подраздел венков (90 / 110 / 125 / 140). У корзин и горшков размеров нет. → чипы размера на странице венков.
- **Класс** – «элитные» и «под заказ» (оба 140) – тоже из подразделов. → чип «Под заказ».
- **Цвет** – одна опция «Цвет» у 19 товаров, 58 вариантов, у варианта своё фото и артикул. Значения грязные: «Голубые цветыцветы»,
  «Орнажевые цветы», «Красные цветы 2», а «С белой лентой / С чёрной лентой» – это цвет ленты, а не цветов (смешаны в одной опции).
- **Артикул** – у 50 товаров (POT-, BASKET-, EL140-, W90-, W110-, W125-, W140Z-), у 19 с вариантами – только у вариантов.
- **Состав, материал (искусственные/живые), остаток, вес, габариты, характеристики** – пусто у всех. Описания – 4 шаблонных текста на все 69.
- Бренд у всех «Розалия».
- Фильтры каталога в Тильде выключены (`filters: []`), включены только сортировка и поиск.

## Итоги по сущностям (индексируемые, без «новое»)

Главная 1 · Хаб 2 (Каталог, Услуги) · Каталог 3 · Карточка товара 69 · Страница 7 (3 услуги, Опт, Доставка, О нас, Контакты) ·
Юридическая 2 = **84**. Техническая 4 + sitemap/robots (закрыто). «Новое» на решение: /katalog/kompozitsii, /uslugi/traurnye-lenty.

## Вопросы владельцу

1. **Цены.** Ни у одного товара нет цены. На новом сайте с корзиной: ставим цены (дайте прайс) или карточки «цена по запросу» + заявка?
   Корзина без цен не работает.
2. **Имена 53 товаров** – сейчас «Венки 110 – товар 04». Дадите названия (как «Амур», «Лилия»)? Пока ставлю `venok-110-sm-04`.
3. **«Композиции»**: на главной кнопка ведёт на `/catalog/compositions` (404). Это отдельный раздел с товарами или это и есть «Горшки»?
4. **«Горшки»** в данных – «цветочная композиция в декоративном горшке». Можно назвать раздел «Композиции в горшках» (`kompozitsii-v-gorshkakh`)?
5. **Траурные ленты** – делать отдельную страницу услуги (`/uslugi/traurnye-lenty`) или оставить опцией к товару (текст ленты в корзине)?
6. **Размеры 90/110/125/140** – это сантиметры (диаметр/высота)? Отдельные страницы под размеры не делаю, только чипы – согласны?
7. **Цвет ленты** (белая/чёрная) – отдельной опцией от цвета цветов? И правим ли опечатки в цветах.
8. **Контакты**: какой телефон и какой адрес верные (Инженерная, 21 – магазин, Воронцово, 41с2 – производство?) и какие мессенджеры/VK
   ваши – сейчас стоят HoliFlori.
9. **Бренд и домен**: в товарах «Розалия», почта и отзывы – venkisp.ru. Это один бизнес? venkisp.ru живой – склеивать с новым сайтом?
10. **«Корпоративным»** по тексту – страница опта. Адрес `/optom` вместо `/korporativnym` (короче и совпадает с запросом «венки оптом»)?
