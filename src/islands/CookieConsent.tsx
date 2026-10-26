import { useEffect, useRef, useState } from 'preact/hooks';
import { OPEN_EVENT, readConsent, saveConsent } from '../lib/consent';
import { u } from '../lib/url';
import { R } from '../lib/site';

// Окно согласия на cookie – по центру, при первом входе: «Принять все», «Только необходимые», «Настроить» (стандарт владельца).
// Повторно открывается кнопкой «Настройки cookie» в подвале. Образец – gaz-mag.
// Метрика – только при PUBLIC_METRIKA_ID (на показе её нет); карты Яндекса на сайте пока нет – о ней не пишем.
const HAS_METRIKA = !!import.meta.env.PUBLIC_METRIKA_ID;

export default function CookieConsent() {
  const [open, setOpen] = useState(false);
  const [details, setDetails] = useState(false);
  const [yandex, setYandex] = useState(false);
  const [metrika, setMetrika] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const c = readConsent();
    if (!c) setOpen(true); else { setYandex(c.yandex); setMetrika(c.metrika); }
    const reopen = () => { const cur = readConsent(); setYandex(!!cur?.yandex); setMetrika(!!cur?.metrika); setDetails(true); setOpen(true); };
    window.addEventListener(OPEN_EVENT, reopen);
    return () => window.removeEventListener(OPEN_EVENT, reopen);
  }, []);

  useEffect(() => {
    if (!open) return;
    setTimeout(() => box.current?.querySelector<HTMLElement>('button')?.focus(), 50);
  }, [open]);

  const done = (y: boolean, m: boolean) => { saveConsent(y, m); setOpen(false); setDetails(false); };
  if (!open) return null;

  return (
    <div class="cc" role="dialog" aria-modal="true" aria-labelledby="cc-title">
      <div class="cc__bg" />
      <div class="cc__box" ref={box}>
        <h2 class="cc__title" id="cc-title">Мы используем cookie</h2>
        <p>Сайт хранит в браузере заявку и ваш выбор по cookie – без этого заказ не оформить.
          {HAS_METRIKA && ' С вашего согласия включаем Яндекс Метрику – статистику посещений; она сохраняет свои cookie.'}</p>
        {details && (
          <div class="cc__opts">
            <label class="cc__opt"><input type="checkbox" checked disabled /><span><b>Необходимые</b> – корзина и выбор по cookie. Работают всегда.</span></label>
            {HAS_METRIKA && <label class="cc__opt"><input type="checkbox" checked={metrika} onChange={(e) => setMetrika((e.target as HTMLInputElement).checked)} /><span><b>Аналитика</b> – Яндекс Метрика: статистика посещений и Вебвизор. Данные обрабатывает ООО «Яндекс».</span></label>}
          </div>
        )}
        <p class="cc__docs">Подробнее: <a href={u(R.policy)}>Политика конфиденциальности</a> · <a href={u(R.consent)}>Согласие на обработку персональных данных</a></p>
        <div class="cc__btns">
          {details
            ? <button type="button" class="btn" onClick={() => done(yandex, metrika)}>Сохранить выбор</button>
            : <button type="button" class="btn" onClick={() => done(true, true)}>Принять все</button>}
          <button type="button" class="btn btn--line" onClick={() => done(false, false)}>Только необходимые</button>
          {!details && <button type="button" class="link" onClick={() => setDetails(true)}>Настроить</button>}
        </div>
      </div>
    </div>
  );
}
