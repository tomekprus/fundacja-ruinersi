/* Snapshot znaczeniowy plików HTML — służy do sprawdzenia, że formatowanie
   nie zmieniło ani treści, ani struktury dokumentu.

   Uruchomienie:
       node .tools/html-snapshot.js zapisz   → tworzy .tools/.snapshot.json
       node .tools/html-snapshot.js sprawdz  → porównuje stan z zapisanym

   Snapshot obejmuje trzy rzeczy, niezależne od formatowania:
     1. tekst widoczny na stronie, z białymi znakami zwiniętymi tak, jak robi
        to przeglądarka,
     2. ciąg znaczników wraz z posortowanymi atrybutami,
     3. frazy, których main.js szuka w textContent — te nie mogą zostać
        przełamane, bo textContent NIE zwija białych znaków.                */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const PLIK = path.join(__dirname, ".snapshot.json");

/* Frazy porównywane w main.js z textContent. Muszą pozostać ciągłe. */
const FRAZY = [
  "Kolejni Partnerzy Wspierający będą publikowani dopiero po formalnym potwierdzeniu współpracy.",
  "rozwijamy Ogólnopolski Klaster Społecznej Ochrony Dziedzictwa",
  "Ogólnopolski Klaster Społecznej Ochrony Dziedzictwa",
  "Ważnym impulsem był Kongres Konserwatorów Polskich",
  "Spotkanie z DWKZ i gminami Związku Gmin",
  "Jestem rzemieślnikiem lub ekspertem",
  "Kongres Konserwatorów Polskich",
  "organizacji założycielskich",
  "Najważniejsze momenty",
  "Zloty Ruinersów",
  "Zasięg wydarzeń",
  "FuturHist 2026",
  "Wspólny cel"
];

function bezStyleISkryptow(html) {
  return html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<!--[\s\S]*?-->/g, "");
}

/* Tekst tak, jak zobaczy go użytkownik: białe znaki zwinięte do jednej spacji. */
function tekst(html) {
  return bezStyleISkryptow(html)
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/* Ciąg znaczników z atrybutami posortowanymi alfabetycznie. Pomija różnice
   w zapisie elementów pustych (<img> kontra <img />) i w cudzysłowach.      */
function struktura(html) {
  const out = [];
  const re = /<(\/?)([a-zA-Z][\w-]*)((?:\s+[^\s=/>]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+))?)*)\s*(\/?)>/g;
  let m;
  while ((m = re.exec(bezStyleISkryptow(html))) !== null) {
    const zamyk = m[1], tag = m[2].toLowerCase(), surowe = m[3] || "";
    if (zamyk) { out.push("/" + tag); continue; }
    const attrs = [];
    const ra = /([^\s=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g;
    let a;
    while ((a = ra.exec(surowe.trim())) !== null) {
      if (!a[1]) continue;
      const wart = a[2] !== undefined ? a[2] : a[3] !== undefined ? a[3] : a[4] !== undefined ? a[4] : "";
      /* wartości atrybutów też mogą zostać przełamane przez formatowanie */
      attrs.push(a[1].toLowerCase() + "=" + wart.replace(/\s+/g, " ").trim());
    }
    attrs.sort();
    out.push(tag + "[" + attrs.join("|") + "]");
  }
  return out.join(">");
}

function zbierz() {
  const wynik = {};
  for (const f of fs.readdirSync(ROOT).filter(x => x.endsWith(".html")).sort()) {
    const html = fs.readFileSync(path.join(ROOT, f), "utf8");
    wynik[f] = {
      tekst: tekst(html),
      struktura: struktura(html),
      frazy: FRAZY.filter(fr => html.includes(fr))
    };
  }
  return wynik;
}

const tryb = process.argv[2];

if (tryb === "zapisz") {
  fs.writeFileSync(PLIK, JSON.stringify(zbierz(), null, 1), "utf8");
  const s = zbierz();
  console.log("Zapisano snapshot dla " + Object.keys(s).length + " plikow.");
  for (const f of Object.keys(s)) {
    console.log("  %s  tekst %d zn., znacznikow %d, fraz %d"
      .replace("%s", f.padEnd(26))
      .replace("%d", s[f].tekst.length)
      .replace("%d", s[f].struktura.split(">").length)
      .replace("%d", s[f].frazy.length));
  }
  process.exit(0);
}

if (tryb !== "sprawdz") {
  console.error("Uzycie: node .tools/html-snapshot.js zapisz|sprawdz");
  process.exit(2);
}

const przed = JSON.parse(fs.readFileSync(PLIK, "utf8"));
const po = zbierz();
let bledy = 0;

for (const f of Object.keys(przed)) {
  const problemy = [];
  if (!po[f]) { problemy.push("plik zniknal"); }
  else {
    if (przed[f].tekst !== po[f].tekst) {
      problemy.push("TRESC sie zmienila");
      const a = przed[f].tekst, b = po[f].tekst;
      let i = 0; while (i < a.length && i < b.length && a[i] === b[i]) i++;
      problemy.push("  pierwsza roznica na pozycji " + i);
      problemy.push("  przed: ..." + a.slice(Math.max(0, i - 50), i + 60));
      problemy.push("  po   : ..." + b.slice(Math.max(0, i - 50), i + 60));
    }
    if (przed[f].struktura !== po[f].struktura) problemy.push("STRUKTURA DOM sie zmienila");
    const zgubione = przed[f].frazy.filter(fr => !po[f].frazy.includes(fr));
    if (zgubione.length) problemy.push("PRZELAMANE FRAZY: " + zgubione.join(" | "));
  }
  if (problemy.length) { bledy++; console.log("FAIL " + f); problemy.forEach(x => console.log("     " + x)); }
  else console.log("OK   " + f);
}
for (const f of Object.keys(po)) if (!przed[f]) { bledy++; console.log("FAIL " + f + " — nowy plik, brak w snapshocie"); }

console.log("\n" + (bledy ? "ROZJECHANE: " + bledy + " plik(ow)" : "BEZ ZMIAN ZNACZENIOWYCH") + "\n");
process.exit(bledy ? 1 : 0);
