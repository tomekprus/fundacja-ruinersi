# Baner zgody na statystyki — plan wdrożenia

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Podłączyć Google Analytics 4 wyłącznie po świadomej zgodzie użytkownika, wraz z brakującą stroną polityki prywatności.

**Architecture:** Cała logika zgody w osobnym pliku `assets/js/zgoda.js`, niezależnym od `main.js`. Skrypt GA4 nie istnieje w DOM do momentu kliknięcia „Zgadzam się". Markup paska wstrzykiwany przez JavaScript jako pierwszy element `<body>`; odnośnik do wycofania zgody na stałe w HTML stopki. Testy jednostkowe w Node na atrapie DOM, bez zależności.

**Tech Stack:** Waniliowy JavaScript w stylu ES5 (zgodnie z resztą repozytorium), CSS w istniejącym `style.css`, statyczny HTML bez build-stepu, Node wyłącznie do uruchamiania testów i kontroli składni.

## Global Constraints

- Identyfikator GA4: `G-FVW52GBWYN` — dokładnie ten, w jednym miejscu w kodzie.
- `cookie_expires`: `34214400` (396 dni). Liczba w treści paska musi się z tym zgadzać.
- W treści paska występuje sformułowanie `13 miesięcy` — nie „14", nie „2 lata".
- Klucz w `localStorage`: `ruinersi-zgoda`. Schemat: `{"analityka":bool,"wersja":1,"data":"ISO8601"}`.
- Oba przyciski mają identyczną klasę `zgoda-btn` i identyczny styl. Zakaz wyróżniania „Zgadzam się" kolorem.
- Pasek: `role="region"`, `aria-label="Zgoda na statystyki"`, wstawiany jako **pierwszy** element `<body>`.
- `ad_storage`, `ad_user_data`, `ad_personalization` pozostają `denied` na stałe.
- Styl kodu jak w repozytorium: `var`, funkcje nazwane, bez strzałek, bez `const`/`let`, bez zależności zewnętrznych.
- Nazwy w kodzie po polsku tam, gdzie dotyczą domeny (`zgoda`, `analityka`, `pokazPasek`) — spójnie z `main.js`, który używa polskich nazw.
- Cache-buster arkuszy podbijany do `?v=20260813-2` na wszystkich stronach naraz.
- `materialy-edukacyjne.html` jest wyłączona ze wszystkich zmian.

---

## File Structure

| Plik | Odpowiedzialność |
|---|---|
| `assets/js/zgoda.js` | Odczyt/zapis decyzji, Consent Mode v2, warunkowe doklejenie GA4, budowa i obsługa paska |
| `.tools/test-zgoda.js` | Harness testowy: atrapa DOM i `localStorage`, asercje |
| `assets/css/style.css` | Sekcja stylów paska, dopisana na końcu |
| `prywatnosc.html` | Polityka prywatności + sekcja zmiany zgody |
| 11 plików HTML | Dołączenie `zgoda.js` |
| 10 stron | Odnośnik „Prywatność" w `foot-base` |
| `sitemap.xml` | Wpis `prywatnosc.html` |

---

### Task 1: Harness testowy i odczyt/zapis decyzji

**Files:**
- Create: `.tools/test-zgoda.js`
- Create: `assets/js/zgoda.js`

**Interfaces:**
- Consumes: nic
- Produces: `window.RuinersiZgoda.start()`, `window.RuinersiZgoda.pokaz()`, `window.RuinersiZgoda._wewn.odczytaj()`, `window.RuinersiZgoda._wewn.zapisz(bool)`

- [ ] **Step 1: Napisz harness z atrapą DOM i pierwszymi testami**

Utwórz `.tools/test-zgoda.js`:

```js
/* Testy logiki zgody. Uruchomienie: node .tools/test-zgoda.js
   Bez zaleznosci — atrapa DOM wystarcza, bo logika zgody jest czysta. */
const fs = require("fs");
const path = require("path");

let passed = 0, failed = 0;
function ok(warunek, opis) {
  if (warunek) { passed++; console.log("  OK   " + opis); }
  else { failed++; console.log("  FAIL " + opis); }
}

function makeEl(tag) {
  return {
    tagName: (tag || "div").toUpperCase(), id: "", className: "", src: "", async: false,
    type: "", innerHTML: "", textContent: "", style: {}, dataset: {}, children: [],
    attrs: {}, listeners: {},
    setAttribute(k, v) { this.attrs[k] = v; },
    getAttribute(k) { return Object.prototype.hasOwnProperty.call(this.attrs, k) ? this.attrs[k] : null; },
    appendChild(c) { this.children.push(c); return c; },
    insertBefore(c) { this.children.unshift(c); return c; },
    removeChild(c) { this.children = this.children.filter(x => x !== c); return c; },
    remove() { if (this.parent) this.parent.removeChild(this); },
    addEventListener(t, fn) { (this.listeners[t] = this.listeners[t] || []).push(fn); },
    querySelector() { return null; },
    querySelectorAll() { return []; },
    focus() { this.focused = true; }
  };
}

function freshEnv(zapisanaZgoda) {
  const store = {};
  if (zapisanaZgoda !== undefined) store["ruinersi-zgoda"] = zapisanaZgoda;
  const head = makeEl("head"), body = makeEl("body");
  const byId = {};
  const win = {
    location: { pathname: "/index.html", hash: "" },
    localStorage: {
      getItem: k => (k in store ? store[k] : null),
      setItem: (k, v) => { store[k] = String(v); },
      removeItem: k => { delete store[k]; }
    },
    matchMedia: () => ({ matches: false, addEventListener() {}, addListener() {} }),
    _store: store
  };
  win.document = {
    readyState: "loading",
    head, body,
    createElement: makeEl,
    getElementById: id => byId[id] || null,
    querySelector: () => null,
    querySelectorAll: () => [],
    addEventListener() {}
  };
  const origAppend = head.appendChild.bind(head);
  head.appendChild = function (c) { if (c.id) byId[c.id] = c; return origAppend(c); };
  return win;
}

function load(win) {
  const src = fs.readFileSync(path.join(__dirname, "..", "assets", "js", "zgoda.js"), "utf8");
  new Function("window", "document", src)(win, win.document);
  return win.RuinersiZgoda;
}

function gaWczytany(win) { return !!win.document.getElementById("ga-script"); }
function pasek(win) { return win.document.body.children.find(c => c.className === "zgoda") || null; }

console.log("\nBrak zapisanej decyzji:");
{
  const win = freshEnv(); const api = load(win); api.start();
  ok(pasek(win) !== null, "pasek zostaje zbudowany");
  ok(!gaWczytany(win), "GA NIE jest wczytany przed zgoda");
  ok(win.document.body.children[0].className === "zgoda", "pasek jest pierwszym elementem body");
  const p = pasek(win);
  ok(p.getAttribute("role") === "region", 'role="region"');
  ok(p.getAttribute("aria-label") === "Zgoda na statystyki", "aria-label ustawiony");
}

console.log("\nZapis decyzji:");
{
  const win = freshEnv(); const api = load(win);
  api._wewn.zapisz(true);
  const d = JSON.parse(win._store["ruinersi-zgoda"]);
  ok(d.analityka === true, "analityka=true zapisane");
  ok(d.wersja === 1, "wersja=1 zapisana");
  ok(typeof d.data === "string" && d.data.indexOf("T") > 0, "data w ISO8601");
}

console.log("\nOdczyt decyzji:");
{
  const win = freshEnv('{"analityka":true,"wersja":1,"data":"2026-08-13T10:00:00.000Z"}');
  const api = load(win);
  ok(api._wewn.odczytaj().analityka === true, "odczytuje zapisana zgode");
}
{
  const win = freshEnv('{"analityka":true,"wersja":99,"data":"x"}');
  const api = load(win);
  ok(api._wewn.odczytaj() === null, "obca wersja traktowana jak brak decyzji");
}
{
  const win = freshEnv("to nie jest json");
  const api = load(win);
  ok(api._wewn.odczytaj() === null, "uszkodzony zapis nie wywraca skryptu");
}

console.log("\n" + (failed ? "NIEPOWODZENIE" : "WSZYSTKO OK") + ": " + passed + " przeszlo, " + failed + " nie\n");
process.exit(failed ? 1 : 0);
```

- [ ] **Step 2: Uruchom testy, żeby zobaczyć, że failują**

Run: `node .tools/test-zgoda.js`
Expected: błąd — plik `assets/js/zgoda.js` nie istnieje (`ENOENT`).

- [ ] **Step 3: Napisz minimalny `zgoda.js`**

Utwórz `assets/js/zgoda.js`:

```js
/* Fundacja Ruinersi na Dolnym Śląsku — zgoda na statystyki.
   Celowo w osobnym pliku niż main.js: awaria jednego nie może unieruchomić drugiego. */
(function (window, document) {
  "use strict";

  var KLUCZ = "ruinersi-zgoda";
  var WERSJA = 1;
  var GA_ID = "G-FVW52GBWYN";
  var COOKIE_EXPIRES = 34214400; /* 396 dni = 13 miesiecy */

  function odczytaj() {
    try {
      var surowe = window.localStorage.getItem(KLUCZ);
      if (!surowe) return null;
      var dane = JSON.parse(surowe);
      if (!dane || dane.wersja !== WERSJA || typeof dane.analityka !== "boolean") return null;
      return dane;
    } catch (e) {
      return null;
    }
  }

  function zapisz(analityka) {
    var dane = { analityka: !!analityka, wersja: WERSJA, data: new Date().toISOString() };
    try {
      window.localStorage.setItem(KLUCZ, JSON.stringify(dane));
    } catch (e) {}
    return dane;
  }

  function zbudujPasek() {
    var pasek = document.createElement("div");
    pasek.className = "zgoda";
    pasek.setAttribute("role", "region");
    pasek.setAttribute("aria-label", "Zgoda na statystyki");
    document.body.insertBefore(pasek, document.body.firstChild);
    return pasek;
  }

  function start() {
    if (odczytaj()) return;
    zbudujPasek();
  }

  window.RuinersiZgoda = { start: start, _wewn: { odczytaj: odczytaj, zapisz: zapisz } };
})(window, document);
```

- [ ] **Step 4: Uruchom testy — muszą przejść**

Run: `node .tools/test-zgoda.js`
Expected: `WSZYSTKO OK: 11 przeszlo, 0 nie`

- [ ] **Step 5: Sprawdź składnię**

Run: `node --check assets/js/zgoda.js`
Expected: brak wyjścia, kod wyjścia 0

- [ ] **Step 6: Commit**

```bash
git add .tools/test-zgoda.js assets/js/zgoda.js
git commit -m "Zapis i odczyt decyzji o zgodzie na statystyki"
```

---

### Task 2: Consent Mode v2 i warunkowe wczytanie GA4

**Files:**
- Modify: `assets/js/zgoda.js`
- Modify: `.tools/test-zgoda.js`

**Interfaces:**
- Consumes: `odczytaj()`, `zapisz(bool)` z Task 1
- Produces: `ustawDomyslne()`, `wlaczAnalityke()`, `zastosuj(bool)`

- [ ] **Step 1: Dopisz testy ładowania GA**

W `.tools/test-zgoda.js`, przed linią `console.log("\n" + (failed ?`, wstaw:

```js
console.log("\nConsent Mode i ladowanie GA:");
{
  const win = freshEnv(); const api = load(win); api.start();
  const domyslne = win.dataLayer.find(a => a[0] === "consent" && a[1] === "default");
  ok(!!domyslne, "consent default zostal ustawiony");
  ok(domyslne[2].analytics_storage === "denied", "analytics_storage domyslnie denied");
  ok(domyslne[2].ad_storage === "denied", "ad_storage denied");
  ok(domyslne[2].ad_user_data === "denied", "ad_user_data denied");
  ok(domyslne[2].ad_personalization === "denied", "ad_personalization denied");
}
{
  const win = freshEnv(); const api = load(win); api.start();
  api.zastosuj(true);
  const s = win.document.getElementById("ga-script");
  ok(!!s, "po zgodzie skrypt GA jest doklejony");
  ok(s.src === "https://www.googletagmanager.com/gtag/js?id=G-FVW52GBWYN", "poprawny src z identyfikatorem");
  ok(s.async === true, "skrypt asynchroniczny");
  const upd = win.dataLayer.find(a => a[0] === "consent" && a[1] === "update");
  ok(upd && upd[2].analytics_storage === "granted", "consent update na granted");
  const cfg = win.dataLayer.find(a => a[0] === "config");
  ok(cfg && cfg[2].cookie_expires === 34214400, "cookie_expires = 34214400 (396 dni)");
  ok(JSON.parse(win._store["ruinersi-zgoda"]).analityka === true, "decyzja zapisana");
}
{
  const win = freshEnv(); const api = load(win); api.start();
  api.zastosuj(false);
  ok(!gaWczytany(win), "po odmowie GA NIE jest wczytany");
  ok(JSON.parse(win._store["ruinersi-zgoda"]).analityka === false, "odmowa zapisana");
}
{
  const win = freshEnv('{"analityka":true,"wersja":1,"data":"2026-08-13T10:00:00.000Z"}');
  const api = load(win); api.start();
  ok(pasek(win) === null, "przy zapisanej zgodzie pasek sie nie pokazuje");
  ok(gaWczytany(win), "przy zapisanej zgodzie GA wczytany od razu");
}
{
  const win = freshEnv('{"analityka":false,"wersja":1,"data":"2026-08-13T10:00:00.000Z"}');
  const api = load(win); api.start();
  ok(pasek(win) === null, "przy zapisanej odmowie pasek sie nie pokazuje");
  ok(!gaWczytany(win), "przy zapisanej odmowie GA nigdy nie jest wczytywany");
}
{
  const win = freshEnv(); const api = load(win); api.start();
  api.zastosuj(true); api.zastosuj(true);
  const ile = win.document.head.children.filter(c => c.id === "ga-script").length;
  ok(ile === 1, "dwukrotna zgoda nie dokleja skryptu dwa razy");
}
```

- [ ] **Step 2: Uruchom testy — nowe muszą failować**

Run: `node .tools/test-zgoda.js`
Expected: FAIL, m.in. `TypeError: Cannot read properties of undefined (reading 'find')` przy `win.dataLayer` — funkcje jeszcze nie istnieją.

- [ ] **Step 3: Zaimplementuj Consent Mode i loader**

W `assets/js/zgoda.js` zamień funkcję `start` oraz eksport na poniższe, dopisując przed nimi trzy nowe funkcje:

```js
  function gtag() {
    window.dataLayer.push(arguments);
  }

  function ustawDomyslne() {
    window.dataLayer = window.dataLayer || [];
    gtag("consent", "default", {
      analytics_storage: "denied",
      ad_storage: "denied",
      ad_user_data: "denied",
      ad_personalization: "denied",
      wait_for_update: 500
    });
  }

  function wlaczAnalityke() {
    if (document.getElementById("ga-script")) return;
    gtag("consent", "update", { analytics_storage: "granted" });
    var skrypt = document.createElement("script");
    skrypt.id = "ga-script";
    skrypt.async = true;
    skrypt.src = "https://www.googletagmanager.com/gtag/js?id=" + GA_ID;
    document.head.appendChild(skrypt);
    gtag("js", new Date());
    gtag("config", GA_ID, { cookie_expires: COOKIE_EXPIRES });
  }

  function zastosuj(analityka) {
    zapisz(analityka);
    if (analityka) wlaczAnalityke();
  }

  function start() {
    ustawDomyslne();
    var decyzja = odczytaj();
    if (decyzja) {
      if (decyzja.analityka) wlaczAnalityke();
      return;
    }
    zbudujPasek();
  }

  window.RuinersiZgoda = {
    start: start,
    zastosuj: zastosuj,
    _wewn: { odczytaj: odczytaj, zapisz: zapisz }
  };
```

- [ ] **Step 4: Uruchom testy — muszą przejść**

Run: `node .tools/test-zgoda.js`
Expected: `WSZYSTKO OK: 27 przeszlo, 0 nie`

- [ ] **Step 5: Commit**

```bash
git add .tools/test-zgoda.js assets/js/zgoda.js
git commit -m "Consent Mode v2 i wczytanie GA4 dopiero po zgodzie"
```

---

### Task 3: Treść paska, przyciski i wycofanie zgody

**Files:**
- Modify: `assets/js/zgoda.js`
- Modify: `.tools/test-zgoda.js`

**Interfaces:**
- Consumes: `zastosuj(bool)`, `zbudujPasek()` z Task 1–2
- Produces: `window.RuinersiZgoda.pokaz()` — używane przez `prywatnosc.html` w Task 5

- [ ] **Step 1: Dopisz testy treści i interakcji**

W `.tools/test-zgoda.js`, przed linią `console.log("\n" + (failed ?`, wstaw:

```js
console.log("\nTresc i interakcje paska:");
{
  const win = freshEnv(); const api = load(win); api.start();
  const html = pasek(win).innerHTML;
  ok(html.indexOf("13 miesięcy") > -1, "tekst mowi o 13 miesiacach");
  ok(html.indexOf("Google Analytics") > -1, "tekst nazywa narzedzie wprost");
  ok(html.indexOf("USA") > -1, "tekst wspomina transfer do USA");
  ok(html.indexOf("Bez zgody nie wczytujemy") > -1, "tekst mowi, ze odmowa cos znaczy");
  ok(html.indexOf('href="prywatnosc.html"') > -1, "jest odnosnik do polityki prywatnosci");
  const liczbaBtn = (html.match(/class="zgoda-btn"/g) || []).length;
  ok(liczbaBtn === 2, "dokladnie dwa przyciski o identycznej klasie");
  ok(html.indexOf('data-zgoda="nie"') > -1 && html.indexOf('data-zgoda="tak"') > -1, "oba warianty decyzji obecne");
}
{
  const win = freshEnv(); const api = load(win); api.start();
  api.pokaz();
  const ile = win.document.body.children.filter(c => c.className === "zgoda").length;
  ok(ile === 1, "pokaz() nie duplikuje paska");
}
{
  const win = freshEnv('{"analityka":false,"wersja":1,"data":"2026-08-13T10:00:00.000Z"}');
  const api = load(win); api.start();
  ok(pasek(win) === null, "po odmowie paska nie ma");
  api.pokaz();
  ok(pasek(win) !== null, "pokaz() przywraca pasek — wycofanie zgody mozliwe");
}
{
  const win = freshEnv();
  win.location.hash = "#zgoda";
  const api = load(win); api.start();
  ok(pasek(win) !== null, "hash #zgoda otwiera pasek");
}
```

- [ ] **Step 2: Uruchom testy — nowe muszą failować**

Run: `node .tools/test-zgoda.js`
Expected: FAIL — `innerHTML` paska jest pusty, `api.pokaz is not a function`.

- [ ] **Step 3: Uzupełnij markup, obsługę kliknięć i `pokaz()`**

W `assets/js/zgoda.js` zamień `zbudujPasek` na poniższą wersję i dopisz `pokaz` oraz `ukryj`. Zaktualizuj też `zastosuj` i `start`:

```js
  var TRESC =
    '<div class="zgoda-inner">' +
      '<p class="zgoda-text">' +
        '<span class="zgoda-eyebrow">Prywatność</span>' +
        'Chcemy liczyć odwiedziny w Google Analytics — to zapisze identyfikator ' +
        'Twojej przeglądarki na 13 miesięcy i wyśle dane do Google, także do USA. ' +
        'Bez zgody nie wczytujemy tego skryptu.' +
      '</p>' +
      '<div class="zgoda-akcje">' +
        '<button type="button" class="zgoda-btn" data-zgoda="nie">Nie zgadzam się</button>' +
        '<button type="button" class="zgoda-btn" data-zgoda="tak">Zgadzam się</button>' +
        '<a class="zgoda-link" href="prywatnosc.html">Polityka prywatności</a>' +
      '</div>' +
    '</div>';

  var pasekEl = null;

  function ukryj() {
    if (pasekEl && pasekEl.remove) pasekEl.remove();
    pasekEl = null;
  }

  function zbudujPasek() {
    if (pasekEl) return pasekEl;
    var pasek = document.createElement("div");
    pasek.className = "zgoda";
    pasek.setAttribute("role", "region");
    pasek.setAttribute("aria-label", "Zgoda na statystyki");
    pasek.innerHTML = TRESC;
    pasek.addEventListener("click", function (e) {
      var cel = e.target;
      if (!cel || !cel.getAttribute) return;
      var wybor = cel.getAttribute("data-zgoda");
      if (!wybor) return;
      zastosuj(wybor === "tak");
    });
    document.body.insertBefore(pasek, document.body.firstChild);
    pasekEl = pasek;
    return pasek;
  }

  function pokaz() {
    return zbudujPasek();
  }
```

Zamień `zastosuj` i `start` na:

```js
  function zastosuj(analityka) {
    zapisz(analityka);
    if (analityka) wlaczAnalityke();
    ukryj();
  }

  function start() {
    ustawDomyslne();
    var decyzja = odczytaj();
    if (decyzja && decyzja.analityka) wlaczAnalityke();
    if (!decyzja || window.location.hash === "#zgoda") zbudujPasek();
  }
```

Zamień eksport i dopisz automatyczny start na końcu pliku, tuż przed `})(window, document);`:

```js
  window.RuinersiZgoda = {
    start: start,
    pokaz: pokaz,
    zastosuj: zastosuj,
    _wewn: { odczytaj: odczytaj, zapisz: zapisz }
  };

  if (document.readyState !== "loading") start();
  else document.addEventListener("DOMContentLoaded", start);
```

- [ ] **Step 4: Uruchom testy — muszą przejść**

Run: `node .tools/test-zgoda.js`
Expected: `WSZYSTKO OK: 40 przeszlo, 0 nie`

- [ ] **Step 5: Sprawdź składnię obu skryptów**

Run: `node --check assets/js/zgoda.js && node --check assets/js/main.js`
Expected: brak wyjścia, kod wyjścia 0

- [ ] **Step 6: Commit**

```bash
git add .tools/test-zgoda.js assets/js/zgoda.js
git commit -m "Treść paska zgody, obsługa wyboru i wycofanie zgody"
```

---

### Task 4: Style paska

**Files:**
- Modify: `assets/css/style.css` (dopisz na końcu pliku)

**Interfaces:**
- Consumes: klasy `zgoda`, `zgoda-inner`, `zgoda-text`, `zgoda-eyebrow`, `zgoda-akcje`, `zgoda-btn`, `zgoda-link` z Task 3
- Produces: nic

- [ ] **Step 1: Dopisz sekcję stylów na końcu `assets/css/style.css`**

```css
/* ---------------------------------------------------------------
   Pasek zgody na statystyki
   Oba przyciski maja identyczny styl — wyrozniony "Zgadzam sie"
   bylby ciemnym wzorcem i podwazalby waznosc zgody.
   --------------------------------------------------------------- */

.zgoda {
  position: fixed;
  inset: auto 0 0 0;
  z-index: 60;
  background: var(--plaster);
  border-top: 1px solid var(--graphite);
  box-shadow: 0 -12px 32px color-mix(in srgb, var(--graphite) 12%, transparent);
}

.zgoda-inner {
  width: 100%;
  max-width: var(--wrap);
  margin-inline: auto;
  padding: clamp(.9rem, 2vw, 1.35rem) var(--gutter);
  display: flex;
  align-items: center;
  gap: clamp(1rem, 3vw, 2.5rem);
}

.zgoda-text {
  margin: 0;
  font-size: var(--fs-small);
  line-height: 1.55;
  color: var(--graphite-soft);
  max-width: 68ch;
}

.zgoda-eyebrow {
  display: block;
  font-size: var(--fs-micro);
  font-weight: var(--w-ui);
  letter-spacing: .13em;
  text-transform: uppercase;
  color: var(--brick);
  margin-bottom: .3rem;
}

.zgoda-akcje {
  display: flex;
  align-items: center;
  gap: .75rem;
  flex-wrap: wrap;
  margin-left: auto;
}

.zgoda-btn {
  font-family: var(--font-body);
  font-size: var(--fs-small);
  font-weight: var(--w-ui);
  line-height: 1;
  white-space: nowrap;
  color: var(--graphite);
  background: transparent;
  border: 1px solid var(--graphite);
  padding: .7rem 1.15rem;
  cursor: pointer;
  transition: background .2s var(--ease), color .2s var(--ease);
}

.zgoda-btn:hover {
  background: var(--graphite);
  color: var(--plaster);
}

.zgoda-link {
  font-size: var(--fs-micro);
  font-weight: var(--w-ui);
  letter-spacing: .1em;
  text-transform: uppercase;
  color: var(--graphite-faint);
  white-space: nowrap;
}

@media (max-width: 860px) {
  .zgoda-inner {
    flex-direction: column;
    align-items: flex-start;
    gap: .9rem;
  }

  .zgoda-akcje {
    margin-left: 0;
  }
}
</style-guard>
```

**Uwaga:** ostatnia linia `</style-guard>` jest omyłkowa — **nie wpisuj jej**. Sekcja kończy się zamykającym nawiasem media query.

- [ ] **Step 2: Podbij cache-buster na wszystkich stronach**

```bash
python - <<'PY'
import io, re, glob
for page in sorted(glob.glob('*.html')):
    s = io.open(page, encoding='utf-8').read()
    n = re.sub(r'href="(assets/css/[a-z-]+\.css)(\?v=[^"]*)?"', r'href="\1?v=20260813-2"', s)
    if n != s:
        io.open(page, 'w', encoding='utf-8', newline='').write(n)
        print("bump:", page)
PY
```

Expected: 10 linii `bump:` (wszystkie strony poza `materialy-edukacyjne.html`).

- [ ] **Step 3: Sprawdź, że CSS się nie rozjechał**

Run: `python -c "import io;s=io.open('assets/css/style.css',encoding='utf-8').read();print('nawiasy:',s.count('{'),s.count('}'));assert s.count('{')==s.count('}')"`
Expected: równa liczba nawiasów otwierających i zamykających

- [ ] **Step 4: Commit**

```bash
git add assets/css/style.css *.html
git commit -m "Style paska zgody i odświeżenie arkusza"
```

---

### Task 5: Strona polityki prywatności

**Files:**
- Create: `prywatnosc.html`
- Modify: `sitemap.xml`

**Interfaces:**
- Consumes: `window.RuinersiZgoda.pokaz()` z Task 3
- Produces: adres `prywatnosc.html`, do którego linkuje pasek i stopka

- [ ] **Step 1: Utwórz `prywatnosc.html`**

Skopiuj `wiedza.html` do `prywatnosc.html`, a następnie w kopii:

1. W `<head>` ustaw dokładnie:
   - `<title>Polityka prywatności — Fundacja Ruinersi na Dolnym Śląsku</title>`
   - `<meta name="description" content="Jakie dane zbiera strona Fundacji Ruinersi na Dolnym Śląsku, w jakim celu i jak nimi zarządzać.">`
   - `<link rel="canonical" href="https://ruinersi.org/prywatnosc.html">`
2. Usuń z `<head>` blok `<style>` skopiowany z `wiedza.html` (dotyczy `.book-grid` i `.resource-rows`, nieużywanych tutaj).
3. W nawigacji usuń `aria-current="page"`, jeśli występuje.
4. Zastąp całą zawartość `<main>...</main>` poniższym blokiem.

```html
<main id="main">
<section class="page-head"><div class="wrap"><span class="eyebrow">Prywatność</span><h1 class="h1">Polityka prywatności</h1><p class="lead">Krótko i konkretnie: co ta strona zbiera, po co i jak to zmienić.</p></div></section>
<section class="section section--ruled"><div class="wrap"><div class="editorial">
<h2 class="h3">Administrator danych</h2>
<p>Fundacja Ruinersi na Dolnym Śląsku, Radogoszcz 67A, 59-800 Lubań, KRS 0001164062, NIP 6131596172, REGON 541276341. Kontakt: <a href="mailto:biuro@ruinersi.org">biuro@ruinersi.org</a>.</p>
<h2 class="h3">Statystyki odwiedzin</h2>
<p>Za Twoją zgodą korzystamy z Google Analytics 4, żeby wiedzieć, które treści są czytane. Skrypt nie jest wczytywany, dopóki nie wyrazisz zgody — odmowa oznacza, że nie trafia on na stronę w ogóle.</p>
<p>Narzędzie zapisuje w Twojej przeglądarce identyfikator, który pozwala odróżnić kolejne wizyty. Nie jest to Twoje imię ani adres e-mail. Identyfikator wygasa po 13 miesiącach. Dane trafiają do Google LLC i mogą być przetwarzane poza Europejskim Obszarem Gospodarczym, w tym w Stanach Zjednoczonych.</p>
<h2 class="h3">Formularz kontaktowy</h2>
<p>Wiadomość z formularza przesyłamy przez usługę Web3Forms, która pośredniczy w dostarczeniu jej na naszą skrzynkę. Przekazujesz nam wtedy dane, które sam wpiszesz w formularzu. Używamy ich wyłącznie po to, żeby odpowiedzieć.</p>
<h2 class="h3">Filmy z YouTube</h2>
<p>Osadzone nagrania korzystają z trybu <code>youtube-nocookie</code>, który nie zakłada ciasteczek przy wczytaniu strony. Po uruchomieniu odtwarzania obowiązują zasady YouTube.</p>
<h2 class="h3">Czcionki</h2>
<p>Strona pobiera kroje pisma z Google Fonts. Wiąże się to z przekazaniem Twojego adresu IP do Google w momencie wczytywania strony.</p>
<h2 class="h3">Twoje prawa</h2>
<p>Masz prawo dostępu do swoich danych, ich sprostowania, usunięcia, ograniczenia przetwarzania, a także prawo wniesienia sprzeciwu i skargi do Prezesa Urzędu Ochrony Danych Osobowych. Zgodę na statystyki możesz wycofać w każdej chwili — poniżej.</p>
</div></div></section>
<section class="section section--sunk section--ruled" id="zgoda"><div class="wrap"><div class="section-head"><span class="eyebrow">Twój wybór</span><h2 class="h2">Zgoda na statystyki</h2></div><p class="lead">Możesz zmienić decyzję w dowolnym momencie. Wycofanie zgody jest tak samo łatwe jak jej udzielenie.</p><p class="mt-2"><button type="button" class="btn" id="zmien-zgode">Zmień decyzję</button></p><p class="ph-note mt-1">Jeśli JavaScript jest wyłączony, statystyki i tak nie działają — nie mamy wtedy czego zbierać.</p></div></section>
</main>
```

5. Bezpośrednio przed `</body>` dopisz:

```html
<script>document.getElementById("zmien-zgode").addEventListener("click",function(){if(window.RuinersiZgoda)window.RuinersiZgoda.pokaz();});</script>
```

- [ ] **Step 2: Dodaj wpis do `sitemap.xml`**

Przed `</urlset>` wstaw:

```xml
  <url><loc>https://ruinersi.org/prywatnosc.html</loc><priority>0.3</priority></url>
```

- [ ] **Step 3: Sprawdź poprawność strukturalną**

```bash
python - <<'PY'
import io, re
s = io.open('prywatnosc.html', encoding='utf-8').read()
for tag in ('section', 'div', 'main', 'p'):
    o = len(re.findall(r'<%s[\s>]' % tag, s)); c = len(re.findall(r'</%s>' % tag, s))
    print("%-8s otwarte=%d zamkniete=%d %s" % (tag, o, c, "OK" if o == c else "<<< NIEROWNO"))
print("canonical:", re.search(r'rel="canonical" href="([^"]+)"', s).group(1))
print("h1:", len(re.findall(r'<h1', s)))
print("odnosnik do zgody w main:", 'id="zgoda"' in s)
PY
```

Expected: wszystkie znaczniki równo, canonical `https://ruinersi.org/prywatnosc.html`, dokładnie jeden `h1`.

- [ ] **Step 4: Commit**

```bash
git add prywatnosc.html sitemap.xml
git commit -m "Strona polityki prywatności z możliwością zmiany zgody"
```

---

### Task 6: Podpięcie na wszystkich stronach

**Files:**
- Modify: 11 plików HTML (wszystkie poza `materialy-edukacyjne.html`)

**Interfaces:**
- Consumes: `assets/js/zgoda.js` z Task 1–3, `prywatnosc.html` z Task 5
- Produces: działający baner na całym serwisie

- [ ] **Step 1: Dopisz skrypt i odnośnik w stopce**

```bash
python - <<'PY'
import io, glob

WYKLUCZONE = {'materialy-edukacyjne.html'}
SKRYPT = '<script src="assets/js/zgoda.js"></script>'
STARA_STOPKA = 'KRS 0001164062</p>'
NOWA_STOPKA = 'KRS 0001164062 · <a href="prywatnosc.html">Prywatność</a></p>'

skrypt_n = stopka_n = 0
for page in sorted(glob.glob('*.html')):
    if page in WYKLUCZONE:
        continue
    s = io.open(page, encoding='utf-8').read()
    orig = s
    if SKRYPT not in s:
        assert '</body>' in s, 'brak </body> w ' + page
        s = s.replace('</body>', SKRYPT + '</body>', 1)
        skrypt_n += 1
    if STARA_STOPKA in s and 'prywatnosc.html">Prywatność' not in s:
        s = s.replace(STARA_STOPKA, NOWA_STOPKA, 1)
        stopka_n += 1
    if s != orig:
        io.open(page, 'w', encoding='utf-8', newline='').write(s)
print("skrypt dodany na %d stronach, odnosnik w stopce na %d" % (skrypt_n, stopka_n))
PY
```

Expected: `skrypt dodany na 11 stronach, odnosnik w stopce na 10`

- [ ] **Step 2: Zweryfikuj rozkład zmian**

```bash
python - <<'PY'
import io, glob
for page in sorted(glob.glob('*.html')):
    s = io.open(page, encoding='utf-8').read()
    print("  %-26s zgoda.js=%d  stopka=%d" % (
        page, s.count('assets/js/zgoda.js'), s.count('prywatnosc.html">Prywatność')))
PY
```

Expected: `zgoda.js=1` wszędzie poza `materialy-edukacyjne.html` (`0`); `stopka=1` wszędzie poza `materialy-edukacyjne.html` i `404.html` (`0`).

- [ ] **Step 3: Kontrola martwych odnośników**

```bash
python - <<'PY'
import io, re, glob, os
srcs = glob.glob('*.html') + glob.glob('assets/js/*.js') + glob.glob('assets/css/*.css')
miss = []; tot = 0
pat = re.compile(r'assets/[A-Za-z0-9_./%-]+\.[A-Za-z0-9]+')
for f in srcs:
    s = io.open(f, encoding='utf-8').read()
    for p in set(pat.findall(s)):
        tot += 1
        if not os.path.exists(p): miss.append((f, p))
    for h in set(re.findall(r'href="([A-Za-z0-9_.-]+\.html)"', s)):
        tot += 1
        if not os.path.exists(h): miss.append((f, h))
print("sprawdzono %d sciezek, martwych: %d" % (tot, len(miss)))
for f, p in miss: print("   BRAK:", f, "->", p)
assert not miss
PY
```

Expected: `martwych: 0`

- [ ] **Step 4: Pełny zestaw testów i kontrola składni**

```bash
node .tools/test-zgoda.js && node --check assets/js/zgoda.js && node --check assets/js/main.js && node .tools/smoke-main.js
```

Expected: `WSZYSTKO OK: 40 przeszlo, 0 nie`, brak błędów składni, `main.js executed without throwing`.

**Uwaga:** jeśli `.tools/smoke-main.js` nie istnieje w repozytorium, pomiń ten człon polecenia — `main.js` nie jest w tym zadaniu modyfikowany.

- [ ] **Step 5: Commit**

```bash
git add *.html
git commit -m "Podłącz baner zgody i odnośnik do polityki na wszystkich stronach"
```

---

### Task 7: Weryfikacja w przeglądarce i wdrożenie

**Files:** brak zmian w kodzie, chyba że weryfikacja coś wykaże

**Interfaces:**
- Consumes: całość Task 1–6
- Produces: potwierdzone wdrożenie

- [ ] **Step 1: Uruchom serwer lokalny**

```bash
python -m http.server 8765
```

Otwórz `http://localhost:8765/`.

- [ ] **Step 2: Sprawdź pierwszą wizytę**

W DevTools, zakładka Network, filtr `googletagmanager`. Wyczyść `localStorage` (Application → Local Storage → usuń `ruinersi-zgoda`) i przeładuj.

Expected: pasek widoczny na dole; **zero** żądań do `googletagmanager.com`; brak ciasteczek `_ga` w Application → Cookies.

- [ ] **Step 3: Sprawdź odmowę**

Kliknij „Nie zgadzam się", przeładuj stronę.

Expected: pasek się nie pokazuje; nadal zero żądań do `googletagmanager.com`; w `localStorage` klucz `ruinersi-zgoda` z `"analityka":false`.

- [ ] **Step 4: Sprawdź zgodę i czas życia ciasteczka**

Wyczyść `localStorage`, przeładuj, kliknij „Zgadzam się".

Expected: pojawia się żądanie do `googletagmanager.com/gtag/js?id=G-FVW52GBWYN`; w Application → Cookies pojawia się `_ga` z datą wygaśnięcia około 396 dni w przyszłości (nie 2 lata).

- [ ] **Step 5: Sprawdź wycofanie zgody**

Kliknij „Prywatność" w stopce, na stronie polityki kliknij „Zmień decyzję".

Expected: pasek wraca i pozwala zmienić wybór.

- [ ] **Step 6: Sprawdź dostępność klawiaturą**

Przeładuj z wyczyszczonym `localStorage`. Naciśnij Tab od załadowania strony.

Expected: fokus trafia na przyciski paska w pierwszej kolejności (pasek jest pierwszym elementem `<body>`); obramowanie fokusu jest widoczne; Enter aktywuje przycisk; pasek nie więzi fokusu — dalsze Taby przechodzą do treści strony.

- [ ] **Step 7: Sprawdź zachowanie bez JavaScriptu**

Wyłącz JavaScript w DevTools i przeładuj.

Expected: paska nie ma, żadnych żądań do Google, strona czytelna, odnośnik „Prywatność" w stopce działa.

- [ ] **Step 8: Wypchnij i zweryfikuj na produkcji**

```bash
git push origin main
```

Po wdrożeniu:

```bash
curl -s https://ruinersi.org/assets/js/zgoda.js -o /tmp/z.js && node --check /tmp/z.js && echo "skladnia OK"
curl -s -o /dev/null -w "prywatnosc.html HTTP %{http_code}\n" https://ruinersi.org/prywatnosc.html
curl -s https://ruinersi.org/index.html | grep -c 'assets/js/zgoda.js'
curl -s https://ruinersi.org/index.html | grep -o 'googletagmanager' | wc -l
```

Expected: składnia OK; `prywatnosc.html HTTP 200`; `1` wystąpienie `zgoda.js`; **`0`** wystąpień `googletagmanager` w statycznym HTML — skrypt pojawia się wyłącznie po kliknięciu.

---

## Po wdrożeniu — zadanie poza kodem

W panelu Google Analytics ustaw okres przechowywania danych zdarzeń
(Administracja → Ustawienia danych → Przechowywanie danych). To ustawienie nie
istnieje w repozytorium i nie da się go zmienić z poziomu kodu. Zalecane 14
miesięcy; wartość domyślna bywa krótsza.

Treść polityki prywatności jest szkieletem przygotowanym rzetelnie, ale **nie
jest poradą prawną**. Przed uznaniem jej za wiążącą zweryfikuj zwłaszcza
podstawę prawną przetwarzania i sformułowanie o transferze danych do USA.
