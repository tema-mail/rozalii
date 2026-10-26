// Согласие на cookie (152-ФЗ, ст. 9: согласие – активное действие). Образец – gaz-mag.
// Необходимые (корзина, сам выбор) хранятся всегда; Метрика и карта Яндекса – только после согласия.
export interface Consent { v: 1; necessary: true; yandex: boolean; metrika: boolean; at: string }

const KEY = 'rz_consent';
export const CONSENT_EVENT = 'rz-consent';
export const OPEN_EVENT = 'rz-consent-open';

export function readConsent(): Consent | null {
  try {
    const c = JSON.parse(localStorage.getItem(KEY) || 'null');
    return c && c.v === 1 ? c : null;
  } catch { return null; }
}

export function saveConsent(yandex: boolean, metrika: boolean) {
  const c: Consent = { v: 1, necessary: true, yandex, metrika, at: new Date().toISOString() };
  try { localStorage.setItem(KEY, JSON.stringify(c)); } catch { /* приватный режим – выбор живёт до закрытия */ }
  window.dispatchEvent(new CustomEvent(CONSENT_EVENT, { detail: c }));
  return c;
}
