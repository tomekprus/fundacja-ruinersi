# Baner zgody na statystyki — projekt

Data: 2026-08-13
Status: zatwierdzony do implementacji

## Problem

Fundacja chce podłączyć Google Analytics 4 (`G-FVW52GBWYN`). GA4 zapisuje dane
na urządzeniu użytkownika i przesyła je do Google, więc wymaga zgody udzielonej
przed załadowaniem skryptu.

## Stan zastany

Przeszukanie całego repozytorium wykazało, że strona **dziś nie ustawia żadnych
ciasteczek**:

- zero wystąpień `document.cookie`, `localStorage`, `sessionStorage`;
- brak jakiejkolwiek analityki (GA, GTM, Meta Pixel, Plausible, Matomo);
- oba osadzone filmy używają `youtube-nocookie.com`, który nie zakłada ciasteczek
  przy wczytaniu strony;
- brak strony polityki prywatności i brak odnośnika do niej w stopce.

Wniosek: baner jest potrzebny **wyłącznie** z powodu planowanego GA4. Wszystko,
co baner mówi, musi dotyczyć GA4 i niczego więcej.

## Zakres

1. Pasek zgody na dole ekranu, sterujący załadowaniem GA4.
2. Nowa strona `prywatnosc.html`.
3. Odnośnik „Prywatność" w stopce wszystkich stron, umożliwiający wycofanie zgody.

### Poza zakresem

- Kategorie zgód i przełączniki. Cel jest jeden (statystyki), więc przełączniki
  udawałyby wybór, którego nie ma.
- Zgoda pod osadzenia YouTube. Używany jest wariant `youtube-nocookie.com`.
- Blokowanie treści strony do czasu decyzji.

## Zachowanie

| Sytuacja | Efekt |
|---|---|
| Pierwsza wizyta | `gtag.js` niewczytany, Consent Mode v2 `denied`, pasek widoczny |
| „Zgadzam się" | zapis wyboru → `consent update` na `granted` → dopiero teraz doklejenie `gtag.js` |
| „Nie zgadzam się" | zapis wyboru, skrypt nigdy niewczytany, pasek znika |
| Kolejne wizyty | pasek ukryty, decyzja odtworzona z zapisu |
| „Prywatność" w stopce | pasek wraca, decyzję można zmienić |
| JavaScript wyłączony | brak paska i brak śledzenia |

Kluczowe: samo ustawienie `consent: denied` przy **wczytanym** skrypcie nadal
wysyła do Google żądania bez ciasteczek. Prawnie bezpieczna jest wyłącznie
nieobecność skryptu, dlatego `gtag.js` dokleja się dopiero po kliknięciu.

## Zapis decyzji

`localStorage`, klucz `ruinersi-zgoda`:

```json
{ "analityka": true, "wersja": 1, "data": "2026-08-13T10:00:00.000Z" }
```

Zapis samej decyzji jest „niezbędny" w rozumieniu ePrivacy i nie wymaga zgody.
Pole `wersja` pozwala ponownie zapytać, gdy dojdzie nowy cel przetwarzania —
bez niego trzeba by ręcznie unieważniać zapisy.

## Treść

> **PRYWATNOŚĆ**
>
> Chcemy liczyć odwiedziny w Google Analytics — to zapisze identyfikator Twojej
> przeglądarki na 13 miesięcy i wyśle dane do Google, także do USA. Bez zgody
> nie wczytujemy tego skryptu.
>
> `[ Nie zgadzam się ]` `[ Zgadzam się ]` · Polityka prywatności

Uzasadnienie konkretu zamiast formuły „używamy cookies, aby polepszyć
doświadczenie": zgoda jest ważna tylko wtedy, gdy jest świadoma, a więc gdy
użytkownik wie, kto i w jakim celu przetwarza dane. Ogólnik tego nie spełnia.
Konkret jest bezpieczniejszy prawnie i zgodny z rzeczowym tonem serwisu.

Liczba „13 miesięcy" musi odpowiadać rzeczywistości, dlatego `cookie_expires`
jest ustawiane jawnie na `34214400` sekund (396 dni). Wartość domyślna GA4 to
2 lata; 13 miesięcy to maksimum rekomendowane przez CNIL dla ciasteczek
analitycznych.

## Konfiguracja Consent Mode v2

Przed wczytaniem czegokolwiek:

```js
gtag('consent', 'default', {
  analytics_storage: 'denied',
  ad_storage: 'denied',
  ad_user_data: 'denied',
  ad_personalization: 'denied',
  wait_for_update: 500
});
```

`ad_*` pozostają `denied` na stałe — Fundacja nie prowadzi reklam. Po zgodzie
aktualizowane jest wyłącznie `analytics_storage`.

## Wygląd

Pasek przyklejony do dołu (`position: fixed`), tło `--plaster`, hairline
`--rule` u góry, akcent `--brick`, mikro-etykieta wersalikami — zgodnie
z istniejącym systemem. Szerokość treści jak `.wrap`. Na wąskich ekranach
przyciski schodzą pod tekst.

Oba przyciski mają **identyczny styl i wagę**. Wariant „akceptuj kolorem,
odrzuć szarym" jest uznawany za ciemny wzorzec i bywa podstawą kar.

`prefers-reduced-motion` respektowane — bez animacji wejścia.

## Dostępność (WCAG 2.2 AA)

- Pasek jest **pierwszym elementem `<body>`** w kolejności DOM, mimo że wizualnie
  jest na dole. Osoba korzystająca z klawiatury trafia na niego od razu.
- `role="region"` z `aria-label="Zgoda na statystyki"`. Nie modal, więc bez
  pułapki na fokus i bez `aria-modal`.
- Oba przyciski to `<button>`, osiągalne z klawiatury, z widocznym focusem.
- Kontrast tekstu i obramowań min. 4.5:1.

## Architektura

Logika trafia do **osobnego pliku `assets/js/zgoda.js`**, nie do `main.js`.
Powód: `main.js` już raz unieruchomił całą stronę pojedynczym błędem składni.
Mechanizm zgody nie powinien dzielić losu z animacjami i filtrami.

Markup paska jest **wstrzykiwany przez JavaScript**, a nie powielany w 12 plikach
HTML. Jest to bezpieczne, bo baner steruje GA4, które i tak działa wyłącznie
z JavaScriptem: awaria skryptu oznacza brak paska **i** brak śledzenia, czyli
domyślnie chroni użytkownika. Pozycjonowanie `fixed` eliminuje przeskok układu.

Odnośnik „Prywatność" w stopce jest jedynym elementem, który **musi** znaleźć się
w HTML wszystkich stron — wycofanie zgody musi być równie łatwe jak jej
udzielenie (art. 7 ust. 3 RODO), więc nie może zależeć od skryptu.

## Pliki

| Plik | Zmiana |
|---|---|
| `assets/js/zgoda.js` | nowy — logika zgody i ładowania GA4 |
| `prywatnosc.html` | nowa strona w szablonie serwisu |
| `assets/css/style.css` | style paska, bump cache-bustera |
| 11 plików HTML | `<script src="assets/js/zgoda.js">` |
| 10 stron | odnośnik „Prywatność" w stopce |
| `sitemap.xml` | wpis dla `prywatnosc.html` |

W repozytorium jest 11 plików HTML, ale nie wszystkie są pełnymi stronami:

- **9 pełnych stron** (`index`, `o-fundacji`, `klaster`, `projekty`, `wiedza`,
  `media`, `kontakt`, `wesprzyj`, `aktualnosci`) — dostają skrypt i odnośnik
  w stopce.
- **`prywatnosc.html`** (nowa) — dostaje jedno i drugie. Razem 10.
- **`404.html`** — ma arkusz stylów, ale nie ma stopki ani skryptu. Dostaje sam
  skrypt, żeby zgoda była respektowana także przy wejściu na nieistniejący
  adres. Odnośnika do wycofania zgody nie ma gdzie umieścić, ale pasek sam
  linkuje do polityki. Łącznie skrypt trafia więc na 11 plików.
- **`materialy-edukacyjne.html`** — wyłączona. To zaślepka z `meta refresh`,
  bez CSS i bez JS, przekierowująca natychmiast na `wiedza.html`.

## Strona polityki prywatności

Sekcje: administrator danych (KRS 0001164062, Radogoszcz 67A, 59-800 Lubań),
zakres i cel przetwarzania, Google Analytics wraz z transferem do USA, formularz
kontaktowy i Web3Forms, osadzenia YouTube, okresy przechowywania, prawa
użytkownika, kontakt.

Dokument jest szkieletem przygotowanym rzetelnie, ale **nie jest poradą prawną**.
Miejsca wymagające weryfikacji lub decyzji Fundacji zostaną wyraźnie oznaczone
w treści — dotyczy to zwłaszcza podstawy prawnej przetwarzania i sformułowania
o transferze do USA.

## Weryfikacja

1. `node --check` na `zgoda.js` i `main.js`.
2. Kontrola odwołań lokalnych — zero martwych ścieżek.
3. Pierwsza wizyta: brak żądań do `googletagmanager.com` i brak ciasteczek `_ga`
   przed kliknięciem.
4. Po „Zgadzam się": skrypt wczytany, `_ga` obecne, data wygaśnięcia ~396 dni.
5. Po „Nie zgadzam się": brak żądań do Google po przeładowaniu strony.
6. Przejście całego paska klawiaturą, widoczny focus.
7. Odnośnik w stopce przywraca pasek.

## Ryzyka

- **Treść prawna wymaga weryfikacji.** Szkielet nie zastępuje opinii prawnika.
- **Ustawienia po stronie GA4.** Okres przechowywania danych zdarzeń to osobne
  ustawienie w panelu Google, poza kodem. Wymaga ręcznego ustawienia i pozostaje
  poza zakresem tej zmiany.
