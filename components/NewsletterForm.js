import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { sprawdzEmail } from '../lib/newsletter';
import { KONTAKT_EMAIL } from '../lib/prawne';

/*
  Zapis na newsletter weekendowy: e-mail + zgoda. Wysyła JSON na /api/newsletter (Brevo, z potwierdzeniem e-mailem).
  Ochrona przed botami: ukryte pole `www_firmowa` i czas od otwarcia formularza. `id` odróżnia dwa formularze na jednej stronie.
*/
export default function NewsletterForm({ id = 'nl', zwarty = false }) {
  const [stan, setStan] = useState('gotowy'); // gotowy | wysylanie | ok
  const [bledy, setBledy] = useState({});
  const [blad, setBlad] = useState('');
  const start = useRef(0);
  const formularz = useRef(null);
  useEffect(() => { start.current = Date.now(); }, [stan]);

  async function wyslij(e) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const email = String(f.get('email') || '');
    const zgoda = f.get('zgoda') === 'on';
    const lokalne = {};
    const bladEmaila = sprawdzEmail(email);
    if (bladEmaila) lokalne.email = bladEmaila;
    if (!zgoda) lokalne.zgoda = 'Zaznacz zgodę, żebyśmy mogli wysyłać Ci newsletter.';
    setBlad('');
    if (Object.keys(lokalne).length) {
      setBledy(lokalne);
      const el = formularz.current && formularz.current.elements[lokalne.email ? 'email' : 'zgoda'];
      if (el && el.focus) el.focus();
      return;
    }
    setBledy({});
    setStan('wysylanie');
    try {
      const odp = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, zgoda, www_firmowa: String(f.get('www_firmowa') || ''), czas: Date.now() - start.current }),
      });
      const d = await odp.json().catch(() => ({}));
      if (odp.ok && d.ok) { setStan('ok'); return; }
      if (d.bledy) setBledy(d.bledy);
      setBlad(d.blad || (d.bledy ? 'Popraw zaznaczone pola.' : 'Nie udało się zapisać na newsletter.'));
    } catch (err) {
      setBlad(`Nie udało się zapisać. Sprawdź połączenie albo napisz na ${KONTAKT_EMAIL}.`);
    }
    setStan('gotowy');
  }

  if (stan === 'ok') {
    return (
      <div className={`nl nl-ok${zwarty ? ' nl-zwarty' : ''}`} role="status">
        <p><strong>Prawie gotowe!</strong> Wysłaliśmy do Ciebie e-mail z prośbą o potwierdzenie. Kliknij w nim przycisk, a przed najbliższym weekendem dostaniesz plan na sobotę i niedzielę.</p>
        <p className="nl-nota">Nic nie przyszło? Zajrzyj do folderu „Oferty” lub „Spam”.</p>
      </div>
    );
  }

  return (
    <form ref={formularz} className={`nl${zwarty ? ' nl-zwarty' : ''}`} onSubmit={wyslij} noValidate>
      <div className={`nl-rzad${bledy.email ? ' zgl-zle' : ''}`}>
        <label htmlFor={`${id}-email`} className="nl-etykieta">Twój e-mail</label>
        <div className="nl-pole-przycisk">
          <input
            id={`${id}-email`} name="email" type="email" autoComplete="email" inputMode="email" maxLength={254} required
            className="zgl-pole" placeholder="np. anna@poczta.pl"
            aria-invalid={bledy.email ? true : undefined} aria-describedby={bledy.email ? `${id}-email-blad` : undefined}
          />
          <button type="submit" className="przycisk nl-wyslij" disabled={stan === 'wysylanie'}>{stan === 'wysylanie' ? 'Wysyłanie…' : 'Zapisz mnie'}</button>
        </div>
        {bledy.email && <p className="zgl-blad" id={`${id}-email-blad`}>{bledy.email}</p>}
      </div>

      {/* pułapka na boty: ukryte pole, które człowiek zostawia puste */}
      <div className="zgl-pulapka" aria-hidden="true">
        <label>Nie wypełniaj tego pola<input type="text" name="www_firmowa" tabIndex={-1} autoComplete="off" /></label>
      </div>

      <div className={`zgl-wiersz zgl-zgoda${bledy.zgoda ? ' zgl-zle' : ''}`}>
        <label className="zgl-checkbox">
          <input type="checkbox" name="zgoda" aria-invalid={bledy.zgoda ? true : undefined} aria-describedby={bledy.zgoda ? `${id}-zgoda-blad` : undefined} />
          <span>
            Zgadzam się na otrzymywanie newslettera Frajdoplanu (raz w tygodniu, przed weekendem) na podany adres e-mail.
            Zapis możesz w każdej chwili cofnąć. Szczegóły w <Link href="/polityka-prywatnosci">polityce prywatności</Link>.
          </span>
        </label>
        {bledy.zgoda && <p className="zgl-blad" id={`${id}-zgoda-blad`}>{bledy.zgoda}</p>}
      </div>

      {blad && <p className="zgl-blad zgl-blad-ogolny" role="alert">{blad}</p>}
    </form>
  );
}
