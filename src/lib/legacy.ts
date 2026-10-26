// Старые адреса Тильды → новые (docs/karta-sayta.md, раздел 301). На Pages – страницы-переадресации,
// в бою – 301 на сервере из /redirects.json; товары в бою – по uid из */tproduct/<uid>-* (Тильда отдаёт карточку по разным путям).
import { PRODUCTS, productUrl } from './catalog';

export const LEGACY: Record<string, string> = {
  '/catalog': '/katalog/', '/catalog/ritual_wreaths': '/katalog/ritualnye-venki/', '/catalog/ritual_baskets': '/katalog/ritualnye-korziny/',
  '/catalog/pot': '/katalog/kompozitsii-v-gorshkakh/', '/catalog/compositions': '/katalog/',
  '/additional_services': '/uslugi/', '/additional_services/to_the_place_of_farewell': '/uslugi/dostavka-k-mestu-proshchaniya/',
  '/additional_services/the_memorable_date': '/uslugi/vozlozhenie-k-pamyatnoy-date/', '/additional_services/farewell_hall': '/uslugi/oformlenie-zala-proshchaniya/',
  '/corparate': '/optom/', '/deliveri': '/dostavka/', '/delivery': '/dostavka/', '/about': '/o-nas/', '/contact': '/kontakty/',
  '/policy': '/politika-konfidentsialnosti/', '/agreement': '/polzovatelskoe-soglashenie/',
  ...Object.fromEntries(PRODUCTS.map((p) => [p.oldUrl, productUrl(p)])),
};

/** Для сервера: uid товара Тильды → новый адрес. */
export const BY_UID = Object.fromEntries(PRODUCTS.map((p) => [p.uid, productUrl(p)]));
