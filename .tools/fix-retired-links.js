/* Porządkuje odnośniki do stron wycofanych i podłącza arkusz dostępności.

   Powód: „Aktualności" i „Zloty Ruinersów" były usuwane z menu i stopki dopiero
   w przeglądarce, przez initRetiredLinks() w main.js. Plik zloty.html nie
   istnieje już w repozytorium, więc bez JavaScriptu — i dla robotów, które nie
   wykonują tego usuwania — osiem stron prowadziło do 404.
   Osobno: assets/css/accessibility.css nie był podlinkowany z żadnej strony,
   czyli poprawki kontrastu i focusu nie działały nigdzie.

   Uruchomienie:  node .tools/fix-retired-links.js           (podgląd)
                  node .tools/fix-retired-links.js --write   (zapis)          */

const fs = require("fs");

const write = process.argv.includes("--write");
const report = [];

for (const file of fs.readdirSync(".").filter(f => f.endsWith(".html"))) {
  let html = fs.readFileSync(file, "utf8");
  const before = html;
  const notes = [];

  // 1. „Aktualności" znika z menu w HTML, a nie dopiero w przeglądarce
  const navRe = /<nav id="nav"[\s\S]*?<\/nav>/;
  if (navRe.test(html)) {
    const nav = html.match(navRe)[0];
    const cleaned = nav.replace(/<li>\s*<a href="aktualnosci\.html"[^>]*>[^<]*<\/a>\s*<\/li>/, "");
    if (cleaned !== nav) { html = html.replace(nav, cleaned); notes.push("menu: bez Aktualności"); }
  }

  // 2. stopka: pozycja prowadząca do usuniętego zloty.html
  const footLi = /<li>\s*<a href="zloty\.html"[^>]*>[^<]*<\/a>\s*<\/li>/;
  if (footLi.test(html)) { html = html.replace(footLi, ""); notes.push("stopka: bez Zlotów"); }

  // 3. przyciski i odnośniki w treści prowadzące do zloty.html
  const inline = /<p class="mt-[0-9]"><a class="(?:btn|arrow)" href="zloty\.html">[^<]*<\/a><\/p>/g;
  const hits = (html.match(inline) || []).length;
  if (hits) { html = html.replace(inline, ""); notes.push(`treść: usunięto ${hits} odnośnik(i) do Zlotów`); }

  // 4. arkusz dostępności — dopisany zaraz po arkuszu głównym, żeby nadpisywał
  if (/assets\/css\/style\.css/.test(html) && !/accessibility\.css/.test(html)) {
    html = html.replace(
      /(<link rel="stylesheet" href="assets\/css\/style\.css[^"]*">)/,
      '$1<link rel="stylesheet" href="assets/css/accessibility.css">'
    );
    notes.push("podłączono accessibility.css");
  }

  if (html !== before && write) fs.writeFileSync(file, html, "utf8");
  report.push(`  ${file.padEnd(26)} ${notes.length ? notes.join(" · ") : "bez zmian"}`);
}

console.log(report.join("\n"));
console.log(write ? "\nZapisano." : "\nPodgląd — dodaj --write, aby zapisać.");
