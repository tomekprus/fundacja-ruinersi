/* Wstawia jednolitą stopkę na każdą podstronę.
   Dotąd pełną stopkę miała tylko strona główna — na pozostałych była sama
   linijka z copyrightem, bez linków do Patronite, YouTube i Spotify.

   Uruchomienie:  node .tools/fix-footer.js           (podgląd)
                  node .tools/fix-footer.js --write   (zapis)               */

const fs = require("fs");
const path = require("path");

const write = process.argv.includes("--write");
const root = process.cwd();

// Strony bez stopki: błąd 404 i czyste przekierowanie
const SKIP = new Set(["404.html", "materialy-edukacyjne.html"]);

const FOOTER = `<footer class="site-foot">
  <div class="wrap">
    <div class="foot-grid">
      <div>
        <p class="foot-brand-name">Fundacja Ruinersi<br>na Dolnym Śląsku</p>
        <p class="foot-blurb">Ratujemy stare domy. Chronimy wiedzę. Łączymy ludzi.</p>
      </div>
      <nav aria-labelledby="foot-fundacja">
        <h2 id="foot-fundacja">Fundacja</h2>
        <ul>
          <li><a href="o-fundacji.html">O Fundacji</a></li>
          <li><a href="spolecznosc.html">Społeczność</a></li>
          <li><a href="media.html">Media</a></li>
          <li><a href="kontakt.html">Kontakt</a></li>
        </ul>
      </nav>
      <nav aria-labelledby="foot-dzialamy">
        <h2 id="foot-dzialamy">Działamy</h2>
        <ul>
          <li><a href="klaster.html">Klaster</a></li>
          <li><a href="projekty.html">Projekty</a></li>
          <li><a href="zloty.html">Zloty Ruinersów</a></li>
          <li><a href="wiedza.html">Wiedza</a></li>
          <li><a href="wesprzyj.html">Wesprzyj nas</a></li>
        </ul>
      </nav>
      <nav aria-labelledby="foot-obserwuj">
        <h2 id="foot-obserwuj">Obserwuj</h2>
        <ul>
          <li><a href="https://www.youtube.com/channel/UCkctrP_dngIs9oc1atbDjhQ" rel="noopener">YouTube</a></li>
          <li><a href="https://open.spotify.com/show/57Cf4FxgErwgFRTLjNZqSl" rel="noopener">Spotify</a></li>
          <li><a href="https://patronite.pl/Ruinersi" rel="noopener">Patronite</a></li>
          <li><a href="https://buycoffee.to/ruinersi" rel="noopener">buycoffee.to</a></li>
        </ul>
      </nav>
    </div>
    <div class="foot-base">
      <p>© <span data-year>2026</span> Fundacja Ruinersi na Dolnym Śląsku · KRS 0001164062</p>
    </div>
  </div>
</footer>`;

const report = [];

for (const file of fs.readdirSync(root).filter(f => f.endsWith(".html"))) {
  if (SKIP.has(file)) { report.push(`  ${file.padEnd(28)} pominięta`); continue; }

  const full = path.join(root, file);
  let html = fs.readFileSync(full, "utf8");

  const re = /<footer class="site-foot">[\s\S]*?<\/footer>/;
  if (!re.test(html)) { report.push(`  ${file.padEnd(28)} BRAK stopki — sprawdź ręcznie`); continue; }

  const before = html.match(re)[0];
  const linksBefore = (before.match(/<li><a href=/g) || []).length;
  html = html.replace(re, FOOTER);

  if (write) fs.writeFileSync(full, html, "utf8");
  report.push(`  ${file.padEnd(28)} linków w stopce ${linksBefore} → 13`);
}

console.log(report.join("\n"));
console.log(write ? "\nZapisano." : "\nPodgląd — dodaj --write, aby zapisać.");
