// Корзина-заявка в браузере: без цен (у источника их нет) – менеджер называет стоимость после заявки.
export interface CartItem { uid: string; title: string; url: string; photo: string; color: string; qty: number; ribbon: string; sku: string; category: string }

const KEY = 'rz_cart';
export const CART_EVENT = 'rz-cart';

export function readCart(): CartItem[] {
  try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { return []; }
}

export function writeCart(items: CartItem[]) {
  try { localStorage.setItem(KEY, JSON.stringify(items)); } catch { /* приватный режим */ }
  window.dispatchEvent(new CustomEvent(CART_EVENT, { detail: items }));
}

/** Одинаковый товар того же цвета и с той же лентой складывается в одну строку. */
export function addToCart(item: CartItem) {
  const items = readCart();
  const same = items.find((x) => x.uid === item.uid && x.color === item.color && x.ribbon === item.ribbon);
  if (same) same.qty += item.qty; else items.push(item);
  writeCart(items);
}

export const cartCount = (items = readCart()) => items.reduce((a, x) => a + x.qty, 0);
