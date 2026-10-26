import { useState } from 'preact/hooks';
import { maskPhone } from '../lib/phone';
import { sendLead, validate, type Lead } from '../lib/forms';
import { readCart, writeCart } from '../lib/cart';
import { u } from '../lib/url';
import { R } from '../lib/site';

interface Props { kind: Lead['kind']; button?: string; withCart?: boolean; placeholder?: string }

// Форма заявки: имя, телефон с маской, комментарий, ПУСТАЯ галочка согласия (кнопка неактивна до отметки – КоАП 13.11).
// withCart – заявка из корзины: товары уходят в заявке, корзина очищается после отправки.
export default function LeadForm({ kind, button = 'Отправить заявку', withCart = false, placeholder = 'Что нужно, дата, адрес' }: Props) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [comment, setComment] = useState('');
  const [consent, setConsent] = useState(false);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: Event) => {
    e.preventDefault();
    const items = withCart ? readCart().map(({ title, color, qty, ribbon }) => ({ title, color, qty, ribbon })) : undefined;
    const lead: Lead = { kind, name, phone, comment, consent, items, page: location.pathname };
    const bad = validate(lead) || (withCart && !items?.length ? 'В заявке нет товаров' : null);
    if (bad) { setErr(bad); return; }
    setBusy(true); setErr('');
    try {
      await sendLead(lead);
      if (withCart) writeCart([]);
      location.href = u(R.thanks);
    } catch (x) { setErr((x as Error).message); setBusy(false); }
  };

  return (
    <form onSubmit={submit} noValidate>
      <label class="field"><span>Имя</span>
        <input name="name" autoComplete="name" value={name} onInput={(e) => setName((e.target as HTMLInputElement).value)} required />
      </label>
      <label class="field"><span>Телефон</span>
        <input name="phone" type="tel" autoComplete="tel" inputMode="tel" placeholder="+7 (___) ___-__-__" value={phone}
          onInput={(e) => setPhone(maskPhone((e.target as HTMLInputElement).value))} required />
      </label>
      <label class="field"><span>Комментарий</span>
        <textarea name="comment" rows={3} placeholder={placeholder} value={comment} onInput={(e) => setComment((e.target as HTMLTextAreaElement).value)} />
      </label>
      <label class="check">
        <input type="checkbox" checked={consent} onChange={(e) => setConsent((e.target as HTMLInputElement).checked)} />
        <span>Согласен(-на) на <a href={u(R.consent)} target="_blank">обработку персональных данных</a> по <a href={u(R.policy)} target="_blank">политике конфиденциальности</a></span>
      </label>
      {err && <div class="err" role="alert">{err}</div>}
      <button type="submit" class="btn btn--wide" disabled={!consent || busy}>{busy ? 'Отправляем…' : button}</button>
    </form>
  );
}
