/* Testy logiki zgody na statystyki.  Uruchomienie:  node .tools/test-zgoda.js

   Bez zależności. Logika zgody jest czysta, więc atrapa DOM i localStorage
   w zupełności wystarcza, a najważniejszą obietnicę — że skrypt Google
   nie trafia na stronę przed zgodą — da się sprawdzić automatycznie.      */
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
    innerHTML: "", textContent: "", style: {}, dataset: {},
    children: [], attrs: {}, listeners: {}, parent: null,
    setAttribute(k, v) { this.attrs[k] = v; },
    getAttribute(k) { return Object.prototype.hasOwnProperty.call(this.attrs, k) ? this.attrs[k] : null; },
    appendChild(c) { c.parent = this; this.children.push(c); return c; },
    insertBefore(c) { c.parent = this; this.children.unshift(c); return c; },
    removeChild(c) { this.children = this.children.filter(x => x !== c); c.parent = null; return c; },
    remove() { if (this.parent) this.parent.removeChild(this); },
    addEventListener(t, fn) { (this.listeners[t] = this.listeners[t] || []).push(fn); },
    klik(target) { (this.listeners.click || []).forEach(fn => fn({ target })); },
    querySelector() { return null; },
    querySelectorAll() { return []; }
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

const gaWczytany = win => !!win.document.getElementById("ga-script");
const pasek = win => win.document.body.children.find(c => c.className === "zgoda") || null;

console.log("\nBrak zapisanej decyzji:");
{
  const win = freshEnv(); load(win).start();
  ok(pasek(win) !== null, "pasek zostaje zbudowany");
  ok(!gaWczytany(win), "GA NIE jest wczytany przed zgoda");
  ok(win.document.body.children[0].className === "zgoda", "pasek jest pierwszym elementem body");
  ok(pasek(win).getAttribute("role") === "region", 'role="region"');
  ok(pasek(win).getAttribute("aria-label") === "Zgoda na statystyki", "aria-label ustawiony");
}

console.log("\nZapis i odczyt decyzji:");
{
  const win = freshEnv(); const api = load(win);
  api._wewn.zapisz(true);
  const d = JSON.parse(win._store["ruinersi-zgoda"]);
  ok(d.analityka === true, "analityka=true zapisane");
  ok(d.wersja === 1, "wersja=1 zapisana");
  ok(typeof d.data === "string" && d.data.indexOf("T") > 0, "data w ISO8601");
}
{
  const win = freshEnv('{"analityka":true,"wersja":1,"data":"2026-08-13T10:00:00.000Z"}');
  ok(load(win)._wewn.odczytaj().analityka === true, "odczytuje zapisana zgode");
}
{
  const win = freshEnv('{"analityka":true,"wersja":99,"data":"x"}');
  ok(load(win)._wewn.odczytaj() === null, "obca wersja traktowana jak brak decyzji");
}
{
  const win = freshEnv("to nie jest json");
  ok(load(win)._wewn.odczytaj() === null, "uszkodzony zapis nie wywraca skryptu");
}

console.log("\nConsent Mode i ladowanie GA:");
{
  const win = freshEnv(); load(win).start();
  const d = win.dataLayer.find(a => a[0] === "consent" && a[1] === "default");
  ok(!!d, "consent default zostal ustawiony");
  ok(d[2].analytics_storage === "denied", "analytics_storage domyslnie denied");
  ok(d[2].ad_storage === "denied", "ad_storage denied");
  ok(d[2].ad_user_data === "denied", "ad_user_data denied");
  ok(d[2].ad_personalization === "denied", "ad_personalization denied");
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
  load(win).start();
  ok(pasek(win) === null, "przy zapisanej zgodzie pasek sie nie pokazuje");
  ok(gaWczytany(win), "przy zapisanej zgodzie GA wczytany od razu");
}
{
  const win = freshEnv('{"analityka":false,"wersja":1,"data":"2026-08-13T10:00:00.000Z"}');
  load(win).start();
  ok(pasek(win) === null, "przy zapisanej odmowie pasek sie nie pokazuje");
  ok(!gaWczytany(win), "przy zapisanej odmowie GA nigdy nie jest wczytywany");
}
{
  const win = freshEnv(); const api = load(win); api.start();
  api.zastosuj(true); api.zastosuj(true);
  ok(win.document.head.children.filter(c => c.id === "ga-script").length === 1,
     "dwukrotna zgoda nie dokleja skryptu dwa razy");
}

console.log("\nTresc i interakcje paska:");
{
  const win = freshEnv(); load(win).start();
  const html = pasek(win).innerHTML;
  ok(html.indexOf("13 miesięcy") > -1, "tekst mowi o 13 miesiacach");
  ok(html.indexOf("Google Analytics") > -1, "tekst nazywa narzedzie wprost");
  ok(html.indexOf("USA") > -1, "tekst wspomina transfer do USA");
  ok(html.indexOf("Bez zgody nie wczytujemy") > -1, "tekst mowi, ze odmowa cos znaczy");
  ok(html.indexOf('href="prywatnosc.html"') > -1, "jest odnosnik do polityki prywatnosci");
  ok((html.match(/class="zgoda-btn"/g) || []).length === 2, "dokladnie dwa przyciski o identycznej klasie");
  ok(html.indexOf('data-zgoda="nie"') > -1 && html.indexOf('data-zgoda="tak"') > -1, "oba warianty decyzji obecne");
}
{
  const win = freshEnv(); const api = load(win); api.start();
  const btn = makeEl("button"); btn.setAttribute("data-zgoda", "tak");
  pasek(win).klik(btn);
  ok(gaWczytany(win), "klikniecie Zgadzam sie wczytuje GA");
  ok(win.document.body.children.filter(c => c.className === "zgoda").length === 0, "pasek znika po decyzji");
}
{
  const win = freshEnv(); const api = load(win); api.start();
  const btn = makeEl("button"); btn.setAttribute("data-zgoda", "nie");
  pasek(win).klik(btn);
  ok(!gaWczytany(win), "klikniecie Nie zgadzam sie nie wczytuje GA");
  ok(JSON.parse(win._store["ruinersi-zgoda"]).analityka === false, "odmowa zapisana po kliknieciu");
}
{
  const win = freshEnv(); const api = load(win); api.start();
  api.pokaz();
  ok(win.document.body.children.filter(c => c.className === "zgoda").length === 1, "pokaz() nie duplikuje paska");
}
{
  const win = freshEnv('{"analityka":false,"wersja":1,"data":"2026-08-13T10:00:00.000Z"}');
  const api = load(win); api.start();
  ok(pasek(win) === null, "po odmowie paska nie ma");
  api.pokaz();
  ok(pasek(win) !== null, "pokaz() przywraca pasek — wycofanie zgody mozliwe");
}
{
  const win = freshEnv(); win.location.hash = "#zgoda";
  load(win).start();
  ok(pasek(win) !== null, "hash #zgoda otwiera pasek");
}

console.log("\n" + (failed ? "NIEPOWODZENIE" : "WSZYSTKO OK") + ": " + passed + " przeszlo, " + failed + " nie\n");
process.exit(failed ? 1 : 0);
