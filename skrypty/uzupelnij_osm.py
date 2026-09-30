#!/usr/bin/env python3
"""Uzupełnia arkusz miejsc danymi z OpenStreetMap.

1. Wiersze z flagą „brak współrzędnych": szuka adresu w Nominatim (maks. 1 zapytanie
   na sekundę), wpisuje lat/lon, liczy odleglosc_km od Rynku Głównego i usuwa flagę.
   Gdy adresu nie da się znaleźć, flaga zostaje.
2. Pobiera z Overpass skateparki, tory BMX i pumptracki do 20 km od Rynku i dopisuje
   je jako nowe wiersze (pomija te, które już są w pliku).

Użycie: python3 skrypty/uzupelnij_osm.py wejscie.csv wyjscie.csv
Potrzebny dostęp do nominatim.openstreetmap.org i overpass-api.de.
"""
import csv
import json
import math
import sys
import time
import urllib.parse
import urllib.request

RYNEK = (50.0617, 19.9373)
PROMIEN_KM = 20
FLAGA = "brak współrzędnych"
UA = "frajdoplan-uzupelnianie/1.0 (kontakt przez github.com/jarecka01-ctrl/frajdoplan)"
NOMINATIM = "https://nominatim.openstreetmap.org"
OVERPASS = "https://overpass-api.de/api/interpreter"

_ostatnie = [0.0]


def pobierz(url, dane=None):
    req = urllib.request.Request(url, data=dane, headers={"User-Agent": UA, "Accept-Language": "pl"})
    with urllib.request.urlopen(req, timeout=180) as r:
        return json.loads(r.read().decode("utf-8"))


def nominatim(sciezka, **params):
    # Zasady Nominatim: maks. 1 zapytanie na sekundę.
    czekaj = 1.1 - (time.time() - _ostatnie[0])
    if czekaj > 0:
        time.sleep(czekaj)
    params["format"] = "jsonv2"
    try:
        return pobierz(f"{NOMINATIM}/{sciezka}?{urllib.parse.urlencode(params)}")
    finally:
        _ostatnie[0] = time.time()


def odleglosc(lat, lon):
    r = 6371.0
    f1, f2 = math.radians(RYNEK[0]), math.radians(lat)
    df, dl = f2 - f1, math.radians(lon - RYNEK[1])
    a = math.sin(df / 2) ** 2 + math.cos(f1) * math.cos(f2) * math.sin(dl / 2) ** 2
    return 2 * r * math.asin(math.sqrt(a))


def geokoduj(ulica, miasto):
    """Zwraca (lat, lon) albo None. Tylko trafienia z numerem/ulicą, nie sam środek miasta."""
    ulica, miasto = ulica.strip(), miasto.strip()
    proby = []
    if ulica:
        proby.append({"q": f"{ulica}, {miasto}, Polska"})
        # „Wczasowa 16, Bolęcin" → ulica + miejscowość z nawiasu
        if "," in ulica:
            u, m = [s.strip() for s in ulica.split(",", 1)]
            proby.append({"street": u, "city": m, "country": "Polska"})
        proby.append({"street": ulica.split(",")[0].strip(), "city": miasto, "country": "Polska"})
    for p in proby:
        wynik = nominatim("search", limit=1, countrycodes="pl", addressdetails=1, **p)
        if not wynik:
            continue
        w = wynik[0]
        # Odrzuć, jeśli Nominatim zwrócił tylko miejscowość/gminę zamiast adresu.
        if w.get("addresstype") in ("city", "town", "village", "hamlet", "municipality",
                                     "county", "state", "country", "administrative"):
            continue
        return float(w["lat"]), float(w["lon"])
    return None


def krok1(wiersze):
    znalezione, nieznalezione = [], []
    for w in wiersze:
        if w["flag"].strip() != FLAGA:
            continue
        wsp = geokoduj(w["street"], w["city"])
        if wsp:
            w["lat"], w["lon"] = f"{wsp[0]:.7f}", f"{wsp[1]:.7f}"
            w["odleglosc_km"] = f"{odleglosc(*wsp):.1f}"
            w["flag"] = ""
            znalezione.append(w)
        else:
            nieznalezione.append(w)
        print(("OK   " if wsp else "BRAK ") + f"{w['name']} | {w['street']}, {w['city']}", flush=True)
    return znalezione, nieznalezione


ZAPYTANIE = f"""
[out:json][timeout:120];
(
  nwr["leisure"="skatepark"](around:{PROMIEN_KM * 1000},{RYNEK[0]},{RYNEK[1]});
  nwr["sport"~"(^|;)(skateboard|bmx|pump_track|pumptrack)(;|$)"](around:{PROMIEN_KM * 1000},{RYNEK[0]},{RYNEK[1]});
  nwr["cycling"~"bmx|pump_track"](around:{PROMIEN_KM * 1000},{RYNEK[0]},{RYNEK[1]});
  nwr["name"~"pump ?track|skate ?park|bmx",i](around:{PROMIEN_KM * 1000},{RYNEK[0]},{RYNEK[1]});
);
out center tags;
"""


def rodzaj(t):
    tekst = " ".join(t.get(k, "") for k in ("name", "sport", "cycling", "leisure", "track")).lower()
    if "pump" in tekst:
        return "Pumptrack", "Pump track"
    if "bmx" in tekst:
        return "Tor BMX", "BMX track"
    return "Skatepark", "Skatepark"


def pobierz_osm():
    dane = pobierz(OVERPASS, urllib.parse.urlencode({"data": ZAPYTANIE}).encode())
    wynik = []
    for e in dane["elements"]:
        t = e.get("tags", {})
        if t.get("indoor") == "yes" or t.get("access") in ("private", "no"):
            continue
        # Pojedyncze elementy wewnątrz skateparku (rampy, rury) to nie osobne miejsca.
        if t.get("leisure") != "skatepark" and (t.get("skatepark:type") or t.get("playground")):
            continue
        lat = e.get("lat") or e.get("center", {}).get("lat")
        lon = e.get("lon") or e.get("center", {}).get("lon")
        if lat is None:
            continue
        wynik.append({"id": f"osm:{e['type']}/{e['id']}", "lat": lat, "lon": lon, "tags": t})
    # Duplikaty w samym OSM (np. skatepark + boisko sport=skateboard w tym samym miejscu).
    wynik.sort(key=lambda x: (x["tags"].get("leisure") != "skatepark", not x["tags"].get("name")))
    unikalne = []
    for w in wynik:
        if all(odleglosc_m(w, u) > 80 for u in unikalne):
            unikalne.append(w)
    return unikalne


def odleglosc_m(a, b):
    dy = (a["lat"] - b["lat"]) * 111320
    dx = (a["lon"] - b["lon"]) * 111320 * math.cos(math.radians(a["lat"]))
    return math.hypot(dx, dy)


SLOWA = ("skate", "bmx", "pump", "trial", "rolk", "deskorol")


def juz_jest(osm, wiersze):
    for w in wiersze:
        if w["place_id"] == osm["id"]:
            return True
        try:
            p = {"lat": float(w["lat"]), "lon": float(w["lon"])}
        except ValueError:
            continue
        blisko = odleglosc_m(osm, p)
        opis = f"{w['name']} {w['type']}".lower()
        if blisko < 150 and any(s in opis for s in SLOWA):
            return True
        if blisko < 40 and w["podkategoria"] == "Boiska i sport na polu":
            return True
    return False


def krok2(wiersze, pola):
    nowe = []
    partia = str(max(int(w["batch_first_seen"]) for w in wiersze if w["batch_first_seen"].isdigit()) + 1)
    for o in pobierz_osm():
        if juz_jest(o, wiersze + nowe):
            print(f"POMIJAM (już jest) {o['tags'].get('name', o['id'])}")
            continue
        t = o["tags"]
        ulica, miasto, gmina = t.get("addr:street", ""), t.get("addr:city", ""), ""
        if not (ulica and miasto):
            r = nominatim("reverse", lat=o["lat"], lon=o["lon"], zoom=17, addressdetails=1)
            a = r.get("address", {}) if isinstance(r, dict) else {}
            ulica = ulica or a.get("road") or a.get("pedestrian") or a.get("footway") or ""
            miasto = miasto or a.get("city") or a.get("town") or a.get("village") or a.get("hamlet") or ""
            gmina = a.get("municipality", "").replace("gmina ", "")
        if t.get("addr:housenumber") and ulica:
            ulica = f"{ulica} {t['addr:housenumber']}"
        nazwa_rodzaju, typ = rodzaj(t)
        nazwa = t.get("name") or (f"{nazwa_rodzaju} – {ulica}" if ulica else f"{nazwa_rodzaju} – {miasto}")
        wiersz = {k: "" for k in pola}
        wiersz.update({
            "place_id": o["id"],
            "name": nazwa,
            "type": typ,
            "street": ulica,
            "city": miasto,
            "gmina_aglomeracja": "Kraków" if miasto == "Kraków" else (gmina or miasto),
            "website": t.get("website", ""),
            "lat": f"{o['lat']:.7f}",
            "lon": f"{o['lon']:.7f}",
            "queries": "OpenStreetMap: skatepark / BMX / pumptrack",
            "batch_first_seen": partia,
            "kategoria_glowna": "Plener",
            "podkategoria": "Boiska i sport na polu",
            "pogoda": "na dworze",
            "strefa": "Kraków i okolice",
            "odleglosc_km": f"{odleglosc(o['lat'], o['lon']):.1f}",
            "sekcja": "z-marszu",
        })
        nowe.append(wiersz)
        print(f"NOWY {nazwa} ({wiersz['odleglosc_km']} km)")
    return nowe


def main(wej, wyj):
    with open(wej, encoding="utf-8-sig", newline="") as f:
        czytnik = csv.DictReader(f)
        pola, wiersze = czytnik.fieldnames, list(czytnik)
    znalezione, nieznalezione = krok1(wiersze)
    nowe = krok2(wiersze, pola)
    with open(wyj, "w", encoding="utf-8", newline="") as f:
        pis = csv.DictWriter(f, fieldnames=pola, lineterminator="\r\n")
        pis.writeheader()
        pis.writerows(wiersze + nowe)
    print(f"\nWspółrzędne znalezione: {len(znalezione)}, nie znaleziono: {len(nieznalezione)}")
    for w in nieznalezione:
        print(f"  – {w['name']} ({w['street']}, {w['city']})")
    print(f"Nowe skateparki / BMX / pumptracki: {len(nowe)}")


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
