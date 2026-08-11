/* Ustawia jeden adres bazowy strony we wszystkich miejscach naraz:
   canonical, og:url, sitemap.xml, robots.txt.

   Gdy kupisz ruinersi.org, uruchom:
       node .tools/set-site-url.js https://ruinersi.org --write
   i dodaj plik CNAME z treścią "ruinersi.org".

   Bez --write skrypt tylko pokazuje, co by zmienił.                       */

const fs = require("fs");
const path = require("path");

const write = process.argv.includes("--write");
const base = (process.argv[2] || "").replace(/\/+$/, "");

if (!/^https?:\/\//.test(base)) {
  console.error("Podaj adres bazowy, np.: node .tools/set-site-url.js https://ruinersi.org --write");
  process.exit(1);
}

const root = process.cwd();

// Strony wyłączone z indeksowania — canonical im niepotrzebny
const NO_CANONICAL = new Set(["404.html"]);

const report = [];

for (const file of fs.readdirSync(root).filter(f => f.endsWith(".html"))) {
  const full = path.join(root, file);
  let html = fs.readFileSync(full, "utf8");
  const before = html;

  if (NO_CANONICAL.has(file)) { report.push(`  ${file.padEnd(30)} pominięta`); continue; }

  const url = file === "index.html" ? base + "/" : base + "/" + file;

  // materialy-edukacyjne.html to przekierowanie — jego canonical wskazuje na cel
  const target = file === "materialy-edukacyjne.html" ? base + "/wiedza.html" : url;

  const canonical = `<link rel="canonical" href="${target}">`;
  const ogUrl = `<meta property="og:url" content="${url}">`;

  if (/<link rel="canonical"[^>]*>/.test(html)) {
    html = html.replace(/<link rel="canonical"[^>]*>/, canonical);
  } else {
    html = html.replace("</head>", canonical + "</head>");
  }

  // og:url tylko tam, gdzie strona ma w ogóle Open Graph
  if (/property="og:/.test(html) && file !== "materialy-edukacyjne.html") {
    if (/<meta property="og:url"[^>]*>/.test(html)) {
      html = html.replace(/<meta property="og:url"[^>]*>/, ogUrl);
    } else {
      html = html.replace(/(<meta property="og:type"[^>]*>)/, "$1" + ogUrl);
    }
  }

  // og:image musi być adresem bezwzględnym, inaczej podgląd linku się nie wygeneruje
  html = html.replace(
    /(<meta property="og:image" content=")(?!https?:\/\/)([^"]*)(")/,
    (m, a, p, c) => a + base + "/" + p.replace(/^\/+/, "") + c
  );

  if (html !== before) {
    if (write) fs.writeFileSync(full, html, "utf8");
    report.push(`  ${file.padEnd(30)} ${target}`);
  } else {
    report.push(`  ${file.padEnd(30)} bez zmian`);
  }
}

// sitemap.xml
const sitemapPath = path.join(root, "sitemap.xml");
if (fs.existsSync(sitemapPath)) {
  let xml = fs.readFileSync(sitemapPath, "utf8");
  xml = xml.replace(/<loc>https?:\/\/[^<\/]+(\/[^<]*)?<\/loc>/g, (m, p) => `<loc>${base}${p || "/"}</loc>`);
  if (write) fs.writeFileSync(sitemapPath, xml, "utf8");
  report.push(`  ${"sitemap.xml".padEnd(30)} przepisany na ${base}`);
}

// robots.txt
const robotsPath = path.join(root, "robots.txt");
if (fs.existsSync(robotsPath)) {
  let txt = fs.readFileSync(robotsPath, "utf8");
  txt = txt.replace(/Sitemap:\s*\S+/i, `Sitemap: ${base}/sitemap.xml`);
  if (write) fs.writeFileSync(robotsPath, txt, "utf8");
  report.push(`  ${"robots.txt".padEnd(30)} Sitemap: ${base}/sitemap.xml`);
}

console.log(report.join("\n"));
console.log(write ? "\nZapisano." : "\nPodgląd — dodaj --write, aby zapisać.");
