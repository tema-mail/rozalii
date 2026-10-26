// Таблица 301 для сервера в бою: точные пути и uid товаров.
import { LEGACY, BY_UID } from '../lib/legacy';
export const GET = () => new Response(JSON.stringify({ paths: LEGACY, tproductByUid: BY_UID }, null, 1), { headers: { 'Content-Type': 'application/json' } });
