import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { POLA, sprawdzZgloszenie } from '../lib/zgloszenia';
import { KONTAKT_EMAIL } from '../lib/prawne';

/*
  Formularz zgłoszenia (`typ`: 'wydarzenie' | 'miejsce'). Pola z lib/zgloszenia.js. Wysyła JSON na /api/zglos.
  Ochrona przed botami: ukryte pole `www_firmowa` (ludzie go nie widzą) i czas od otwarcia formularza.
  Zgłoszenie nigdy nie publikuje się samo: trafia do arkusza, gdzie czeka na przejrzenie.
*/
const TEKSTY = {
  wydarzenie: { wyslij: 'Wyślij wydarzenie', sukces: 'Dziękujemy! Wydarzenie trafiło do sprawdzenia. Jeśli się nada, dodamy je do kalendarza w ciągu kilku dni.', kolejne: 'Dodaj kolejne wydarzenie' },
  miejsce: { wyslij: 'Wyślij miejsce', sukces: 'Dziękujemy! Miejsce trafiło do sprawdzenia. Jeśli się nada, dodamy je do katalogu w ciągu kilku dni.', kolejne: 'Dodaj kolejne miejsce' },
};

export default function FormularzZgloszenia({ typ }) {
  const pola = POLA[typ];
  const t = TEKSTY[typ];
  const [stan, setStan] = useState('gotowy'); // gotowy | wysylanie | ok
  const [bledy, setBledy] = useState({});
  const [blad, setBlad] = useState('');
  const start = useRef(0);
  const formularz = useRef(null);
  useEffect(() => { start.current = Date.now(); }, [stan]);

  async function wyslij(e) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const dane = Object.fromEntries(pola.map((p) => [p.id, String(f.get(p.id) || '')]));
    const zgoda = f.get('zgoda') === 'on';
    const wynik = sprawdzZgloszenie(typ, dane);
    const lokalne = { ...(wynik.bledy || {}) };
    if (!zgoda) lokalne.zgoda = 'Zaznacz zgodę, żebyśmy mogli przetworzyć zgłoszenie.';
    setBlad('');
    if (Object.keys(lokalne).length) {
      setBledy(lokalne);
      const pierwszy = pola.find((p) => lokalne[p.id])?.id || 'zgoda';
      const el = formularz.current && formularz.current.elements[pierwszy];
      if (el && el.focus) el.focus();
      return;
    }
    setBledy({});
    setStan('wysylanie');
    try {
      const odp = await fetch('/api/zglos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ typ, pola: dane, zgoda, www_firmowa: String(f.get('www_firmowa') || ''), czas: Date.now() - start.current }),
      });
      const d = await odp.json().catch(() => ({}));
      if (odp.ok && d.ok) { setStan('ok'); if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' }); return; }
      if (d.bledy) setBledy(d.bledy);
      setBlad(d.blad || (d.bledy ? 'Popraw zaznaczone pola.' : 'Nie udało się wysłać zgłoszenia.'));
    } catch (err) {
      setBlad(`Nie udało się wysłać zgłoszenia. Sprawdź połączenie albo napisz na ${KONTAKT_EMAIL}.`);
    }
    setStan('gotowy');
  }

  if (stan === 'ok') {
    return (
      <div className="zgl-sukces" role="status">
        <p><strong>{t.sukces}</strong></p>
        <p><button type="button" className="przycisk" onClick={() => setStan('gotowy')}>{t.kolejne}</button></p>
      </div>
    );
  }

  return (
    <form ref={formularz} className="zgl" onSubmit={wyslij} noValidate>
      {pola.map((p) => {
        const id = `zgl-${typ}-${p.id}`;
        const opis = [p.pomoc && `${id}-pomoc`, bledy[p.id] && `${id}-blad`].filter(Boolean).join(' ') || undefined;
        const wspolne = { id, name: p.id, required: !!p.wymagane, 'aria-invalid': bledy[p.id] ? true : undefined, 'aria-describedby': opis, maxLength: p.max, placeholder: p.placeholder, className: 'zgl-pole' };
        return (
          <div className={`zgl-wiersz${bledy[p.id] ? ' zgl-zle' : ''}`} key={p.id}>
            <label htmlFor={id}>{p.label}{p.wymagane ? <span className="zgl-gw" aria-hidden="true"> *</span> : <span className="zgl-opc"> (opcjonalnie)</span>}</label>
            {p.typ === 'textarea' ? <textarea {...wspolne} rows={4} />
              : p.typ === 'select' ? (
                <select {...wspolne} defaultValue={p.wymagane ? '' : p.opcje[0][0]}>
                  {p.wymagane && <option value="" disabled>Wybierz…</option>}
                  {p.opcje.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              ) : <input {...wspolne} type={p.typ === 'url' ? 'url' : p.typ} autoComplete={p.typ === 'email' ? 'email' : 'off'} />}
            {p.pomoc && <p className="zgl-pomoc" id={`${id}-pomoc`}>{p.pomoc}</p>}
            {bledy[p.id] && <p className="zgl-blad" id={`${id}-blad`}>{bledy[p.id]}</p>}
          </div>
        );
      })}

      {/* pułapka na boty: ukryte pole, które człowiek zostawia puste */}
      <div className="zgl-pulapka" aria-hidden="true">
        <label>Nie wypełniaj tego pola<input type="text" name="www_firmowa" tabIndex={-1} autoComplete="off" /></label>
      </div>

      <div className={`zgl-wiersz zgl-zgoda${bledy.zgoda ? ' zgl-zle' : ''}`}>
        <label className="zgl-checkbox">
          <input type="checkbox" name="zgoda" aria-invalid={bledy.zgoda ? true : undefined} aria-describedby={bledy.zgoda ? 'zgl-zgoda-blad' : undefined} />
          <span>
            Zgadzam się na przetwarzanie danych ze zgłoszenia (w tym e-maila) w celu sprawdzenia go i ewentualnego kontaktu.
            Szczegóły w <Link href="/polityka-prywatnosci">polityce prywatności</Link>.
          </span>
        </label>
        {bledy.zgoda && <p className="zgl-blad" id="zgl-zgoda-blad">{bledy.zgoda}</p>}
      </div>

      {blad && <p className="zgl-blad zgl-blad-ogolny" role="alert">{blad}</p>}
      <p className="zgl-nota">Zgłoszenie trafia najpierw do nas. Niczego nie publikujemy automatycznie, a Twojego e-maila nigdy nie pokazujemy na stronie.</p>
      <button type="submit" className="przycisk zgl-wyslij" disabled={stan === 'wysylanie'}>{stan === 'wysylanie' ? 'Wysyłanie…' : t.wyslij}</button>
    </form>
  );
}
