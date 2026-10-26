// Отправка заявок. Приёмник на сервере появится при выводе в бой (PUBLIC_LEAD_URL); до этого – тестовый стенд:
// заявка не уходит, а сохраняется в браузере, и страница «Спасибо» честно это говорит.
import { phoneOk } from './phone';

export interface Lead {
  kind: 'order' | 'opt' | 'service' | 'question';
  name: string; phone: string; comment?: string; consent: boolean;
  items?: { title: string; category: string; sku: string; url: string; color: string; qty: number; ribbon: string }[];
  page: string;
}

const URL_ = import.meta.env.PUBLIC_LEAD_URL as string | undefined;
export const isStand = !URL_;

export function validate(l: Lead): string | null {
  if (!l.name.trim()) return 'Укажите имя';
  if (!phoneOk(l.phone)) return 'Укажите телефон полностью';
  if (!l.consent) return 'Нужно согласие на обработку персональных данных';
  return null;
}

export async function sendLead(l: Lead): Promise<void> {
  const err = validate(l);
  if (err) throw new Error(err);
  if (URL_) {
    const r = await fetch(URL_, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(l) });
    if (!r.ok) throw new Error('Не получилось отправить – позвоните нам, пожалуйста');
    return;
  }
  try {
    const all = JSON.parse(localStorage.getItem('rz_leads') || '[]');
    all.push({ ...l, at: new Date().toISOString() });
    localStorage.setItem('rz_leads', JSON.stringify(all));
  } catch { /* стенд без хранилища – просто идём дальше */ }
}
