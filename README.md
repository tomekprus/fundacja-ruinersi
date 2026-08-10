# Fundacja Ruinersi na Dolnym Śląsku — prototyp strony

Statyczna strona: czysty HTML + CSS + jeden plik JS. Bez build-stepu, bez zależności
npm. Otwierasz plik w przeglądarce i widzisz stronę; wrzucasz katalog na GitHub
i włączasz Pages — działa.

## Podgląd lokalny

Formularze i daty działają też z `file://`, ale najbezpieczniej podnieść serwer:

```bash
python -m http.server 8765
# http://localhost:8765
```

## Struktura

```
index.html                    Strona główna
o-fundacji.html               O Fundacji (misja, ludzie, nagrody, partnerzy, dokumenty)
klaster.html                  Klaster Dziedzictwa Dolnego Śląska
projekty.html                 Lista projektów z filtrem kategorii
projekt-zlot-ruinersow.html   Szablon strony projektu   → docelowo /projekty/[slug]
aktualnosci.html              Archiwum aktualności
aktualnosc-iii-zlot.html      Szablon artykułu          → docelowo /aktualnosci/[slug]
kontakt.html                  Kontakt, dane Fundacji, FAQ
wesprzyj.html                 Wsparcie (Patronite, przelew, praca)
404.html                      Strona błędu
sitemap.xml  robots.txt  .nojekyll

assets/css/style.css          Cały arkusz stylów, podzielony na numerowane sekcje
assets/js/main.js             Menu, daty (Intl), filtr projektów, formularze
assets/img/logo-ruinersi.jpg  Logotyp pobrany z profilu Patronite fundacji
```

Nagłówek i stopka są powielone w każdym pliku — to cena za brak build-stepu.
Zmieniasz nawigację? Zmień ją w każdym pliku HTML (albo przenieś projekt na
generator statyczny, patrz „Dalsze kroki”).

---

## 1. Czcionki — wymagają Twojego działania

Projekt zakłada **Museo Slab 700** (nagłówki) i **Museo Sans 300** (tekst).
To kroje komercyjne (exljbris) — **nie ma ich w Google Fonts** i nie wolno ich
hostować bez licencji webfontowej.

Do czasu ich dostarczenia strona renderuje się na zamiennikach z Google Fonts:
**Bitter 700** i **Mulish 300**. Wygląda poprawnie, ale to nie jest docelowa typografia.

Masz trzy drogi:

**A. Pliki webfontów (kupione na myfonts.com / fonts.com)**

Wrzuć do `assets/fonts/`:

```
MuseoSlab-700.woff2
MuseoSans-300.woff2
MuseoSans-500.woff2
MuseoSans-700.woff2
```

Nic więcej nie trzeba — `@font-face` w sekcji 1a `style.css` już na nie wskazuje.

**B. Adobe Fonts (Creative Cloud)**

Museo Slab i Museo Sans są w bibliotece Adobe Fonts. Utwórz web project,
usuń bloki `@font-face` z sekcji 1a i dodaj do `<head>` każdej strony:

```html
<link rel="stylesheet" href="https://use.typekit.net/TWÓJ-KIT.css">
```

**C. Zostaw zamienniki** — jeśli licencja jest poza budżetem.
Wtedy warto usunąć `"Museo Slab"` i `"Museo Sans"` ze zmiennych
`--font-display` / `--font-body`, żeby nie generować niepotrzebnych zapytań.

Wagi w CSS są sterowane zmiennymi `--w-body: 300` i `--w-ui: 700`.

---

## 2. Fotografie

Prototyp nie zawiera zdjęć. W każdym miejscu, gdzie ma być fotografia, stoi blok
z opisem oczekiwanego kadru:

```html
<figure class="ph ph--wide">
  <figcaption class="ph-label">Fotografia — więźba dachowa, wymiana belki</figcaption>
</figure>
```

Podmiana — zachowaj te same proporcje:

```html
<img src="assets/img/wiezba.jpg" alt="Cieśla dopasowuje nową belkę w więźbie dachowej"
     width="1600" height="1067" loading="lazy">
```

Dostępne proporcje: `ph--banner` (24:9), `ph--wide` (16:9), `ph--photo` (3:2),
`ph--square`, `ph--portrait` (4:5).

Zdjęcia hero na górze strony **nie** oznaczaj `loading="lazy"`.
Zapisuj w WebP lub AVIF, maksymalnie 1600–2000 px szerokości.

---

## 3. Co trzeba uzupełnić przed publikacją

Wszystkie miejsca z brakującymi danymi są oznaczone w kodzie klasą `todo`
i widoczne na stronie jako czerwone plakietki. Szukaj `class="todo"`
oraz atrybutu `data-todo`.

| Gdzie | Co |
|---|---|
| `kontakt.html` | adres, KRS, NIP, REGON, osoba do kontaktu dla mediów |
| `kontakt.html`, `klaster.html` | adresy e-mail (`kontakt@ruinersi.org`, `klaster@ruinersi.org`) |
| `o-fundacji.html` | imiona, nazwiska, funkcje i biogramy zarządu i Rady |
| `o-fundacji.html` | pliki PDF: statut, KRS, sprawozdania, standardy ochrony małoletnich |
| `o-fundacji.html` | nagrody: rok, nazwa, link |
| `klaster.html` | nazwy partnerów, lata przystąpienia, liczby w sekcji „w liczbach” |
| `wesprzyj.html` | numer rachunku bankowego, rzeczywiste kwoty |
| wszystkie stopki | adresy Facebooka, Instagrama, YouTube |
| wszystkie stopki | polityka prywatności, informacja o cookies |
| `index.html`, `sitemap.xml`, `robots.txt` | domena `ruinersi.example` → docelowa |

Treści opisowe (misja, historia, opisy projektów, artykuł) są **przykładowe** —
napisane tak, by wyglądały wiarygodnie i pokazywały docelową długość tekstu.
Przeczytaj je i podmień na prawdziwe. Dane rejestrowe nie zostały zmyślone.

---

## 4. Formularze

Statyczny hosting nie wyśle maila. Formularze na `kontakt.html` i `klaster.html`
walidują dane, a następnie składają wiadomość i otwierają program pocztowy
(`mailto:`). To działa, ale jest niewygodne dla użytkownika.

Przepięcie na Formspree (darmowy plan wystarczy na start):

1. Załóż formularz na formspree.io, skopiuj jego endpoint.
2. W `<form>` usuń `data-mailto` i dodaj:
   ```html
   <form class="form" action="https://formspree.io/f/TWÓJ-ID" method="POST">
   ```
3. Walidacja z `main.js` przestanie przechwytywać wysyłkę — przejmie ją Formspree.

---

## 5. Publikacja na GitHub Pages

```bash
cd C:\Users\prust\Documents\ruinersi-fundacja
git init
git add .
git commit -m "Prototyp strony Fundacji Ruinersi"
git branch -M main
git remote add origin https://github.com/UŻYTKOWNIK/REPO.git
git push -u origin main
```

Następnie w repozytorium: **Settings → Pages → Source: Deploy from a branch →
`main` / `/ (root)`**.

Plik `.nojekyll` jest już w repo — bez niego GitHub przepuszcza pliki przez Jekyll
i katalogi zaczynające się od podkreślenia znikają.

Wszystkie ścieżki są względne, więc strona zadziała zarówno pod
`użytkownik.github.io/repo/`, jak i na własnej domenie. Wyjątek: `404.html`
używa ścieżek bezwzględnych (`/assets/...`), bo GitHub serwuje ją spod dowolnego
adresu — przy publikacji w podkatalogu popraw je na `/repo/assets/...`.

Własna domena: dodaj plik `CNAME` z samą nazwą domeny i skonfiguruj DNS.

---

## 6. Wielojęzyczność (PL / EN / DE / CS)

Prototyp jest po polsku, ale przygotowany pod tłumaczenia:

- teksty interfejsu i komunikaty formularzy siedzą w obiekcie `I18N` w `main.js`,
  a nie w komponentach — dopisujesz klucze dla `en`, `de`, `cs`;
- daty nigdy nie są składane z nazw miesięcy w kodzie. W HTML jest tylko
  `<time datetime="2026-06-27" data-format="long">`, a formatowaniem zajmuje się
  `Intl.DateTimeFormat` z locale pobranym z `<html lang>`;
- układy są płynne, nagłówki mają miarę liczoną w `ch`, przyciski nie mają
  sztywnych szerokości — dłuższe teksty niemieckie się zmieszczą;
- przełącznik języka jest w stopce. Nieaktywne wersje **nie są linkami**,
  więc nie ma martwych adresów;
- Bitter i Mulish (oraz Museo) obsługują pełne latin-ext: `ą ć ę ł ń ó ś ź ż
  ä ö ü ß č ď ě ň ř š ť ů ž`.

Czego prototyp **nie** ma i co trzeba dorobić przy wdrażaniu tłumaczeń:
routing per język, tłumaczone slugi (`/de/ueber-uns`), `hreflang`, wielojęzyczna
sitemapa. W `index.html` i `sitemap.xml` są komentarze wskazujące, gdzie je wstawić.

---

## 7. Dostępność i wydajność

Zrobione: semantyczny HTML, poprawna hierarchia nagłówków, `lang="pl"`, skip link,
widoczny focus, obsługa klawiatury, etykiety formularzy, komunikaty błędów
powiązane przez `aria-describedby`, `role="alert"`, obsługa `prefers-reduced-motion`,
brak funkcji zależnych wyłącznie od hover.

Do sprawdzenia po dodaniu prawdziwych zdjęć: kontrast tekstu na fotografiach,
rozmiary plików, `srcset` dla dużych obrazów.

Strona ładuje jeden arkusz CSS, jeden plik JS (~6 kB) i czcionki. Bez frameworka,
bez bibliotek animacyjnych.

---

## 8. Dalsze kroki

Jeśli treści zacznie przybywać — a przy archiwum projektów i aktualności to
kwestia miesięcy — powielanie nagłówka i stopki w każdym pliku przestanie się
opłacać. Wtedy warto przenieść projekt na generator statyczny (Astro, Eleventy,
Next.js z `output: 'export'`), zachowując ten sam CSS. Struktura HTML jest na to
przygotowana: sekcje są niezależne, klasy nie zakładają konkretnej strony.
