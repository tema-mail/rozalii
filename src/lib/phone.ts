/** Маска телефона +7 (XXX) XXX-XX-XX. Ввод с «+7», «8», «7» или сразу с кода – одинаково (образец gaz-mag;
 *  26.10.2026 site-forms: при наборе «+79…» по цифре старая маска считала «7» частью кода и номер съезжал). */
export function maskPhone(raw: string): string {
  const s = raw.trim();
  if (!s || s === '+') return s;
  let n: string;
  if (s.startsWith('+7')) n = s.slice(2).replace(/\D/g, '');
  else if (s.startsWith('+')) n = s.replace(/\D/g, '');
  else {
    const d = s.replace(/\D/g, '');
    n = /^[78]/.test(d) ? d.slice(1) : d;
  }
  n = n.slice(0, 10);
  let out = '+7';
  if (n.length) out += ' (' + n.slice(0, 3);
  if (n.length > 3) out += ') ' + n.slice(3, 6); // скобка – только после 4-й цифры, иначе Backspace на ней застревает
  if (n.length > 6) out += '-' + n.slice(6, 8);
  if (n.length > 8) out += '-' + n.slice(8, 10);
  return out;
}
export const phoneOk = (v: string) => v.replace(/\D/g, '').length === 11;
