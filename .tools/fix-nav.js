/* Wpisuje jednolite menu główne do statycznego HTML każdej podstrony.
   Dotąd budował je JavaScript, przez co bez skryptu zostawał jeden link.
   Uruchomienie:  node .tools/fix-nav.js           (podgląd)
                  node .tools/fix-nav.js --write   (zapis)                */

const fs = require("fs");
const path = require("path");

const write = process.argv.includes("--write");
const root = process.cwd();

const NAV = [
  ["index.html",       "Strona główna"],
  ["o-fundacji.html",  "O Fundacji"],
  ["klaster.html",     "Klaster"],
  ["projekty.html",    "Projekty"],
  ["wiedza.html",      "Wiedza"],
  ["aktualnosci.html", "Aktualności"],
  ["media.html",       "Media"],
  ["wesprzyj.html",    "Wesprzyj nas"],
  ["kontakt.html",     "Kontakt"],
];

// Strony bez nagłówka albo będące wyłącznie przekierowaniem
const SKIP = new Set(["404.html", "materialy-edukacyjne.html"]);

function navMarkup(current) {
  const items = NAV.map(([href, label]) => {
    const cur = href === current ? ' aria-current="page"' : "";
    return `      <li><a href="${href}"${cur}>${label}</a></li>`;
  }).join("\n");
  return [
    '<nav id="nav" class="nav" aria-label="Nawigacja główna">',
    "    <ul>",
    items,
    "    </ul>",
    "  </nav>",
  ].join("\n");
}

const report = [];

for (const file of fs.readdirSync(root).filter(f => f.endsWith(".html"))) {
  if (SKIP.has(file)) { report.push(`  ${file.padEnd(30)} pominięta`); continue; }

  const full = path.join(root, file);
  let html = fs.readFileSync(full, "utf8");
  const before = html;
  const notes = [];

  // 1. menu główne
  const navRe = /<nav id="nav"[^>]*>[\s\S]*?<\/nav>/;
  if (navRe.test(html)) {
    const old = html.match(navRe)[0];
    const oldCount = (old.match(/<li>/g) || []).length;
    html = html.replace(navRe, navMarkup(file));
    notes.push(`menu ${oldCount} → ${NAV.length}`);
  } else {
    notes.push("BRAK <nav id=\"nav\"> — sprawdź ręcznie");
  }

  // 2. martwy przycisk „Wesprzyj nas” — skrypt i tak go ukrywał,
  //    a pozycja jest już w menu
  const ctaRe = /<a class="btn btn--brick nav-cta"[^>]*>.*?<\/a>/;
  if (ctaRe.test(html)) { html = html.replace(ctaRe, ""); notes.push("usunięto martwy przycisk CTA"); }

  // 3. nazwa przy logotypie — dwie stare podstrony miały wersję sprzed zmiany
  const brandRe = /<span class="brand-text"><b>Ruinersi<\/b>/;
  if (brandRe.test(html)) {
    html = html.replace(brandRe, '<span class="brand-text"><b>Fundacja Ruinersi</b>');
    notes.push("ujednolicono nazwę przy logotypie");
  }

  if (html !== before && write) fs.writeFileSync(full, html, "utf8");
  report.push(`  ${file.padEnd(30)} ${notes.join(" · ")}`);
}

console.log(report.join("\n"));
console.log(write ? "\nZapisano." : "\nPodgląd — dodaj --write, aby zapisać.");
