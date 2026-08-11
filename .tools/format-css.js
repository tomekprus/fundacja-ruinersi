/* Formatuje zminifikowany CSS do czytelnej postaci.
   Nie zmienia ani jednej reguły — przestawia wyłącznie białe znaki.
   Uruchomienie:  node .tools/format-css.js assets/css/style.css          (podgląd)
                  node .tools/format-css.js assets/css/style.css --write  (zapis)   */

const fs = require("fs");

const file = process.argv[2];
const write = process.argv.includes("--write");
const src = fs.readFileSync(file, "utf8");

// --- tokenizacja: dzielimy na { } ; z poszanowaniem stringów, url() i komentarzy
function tokenize(css) {
  const out = [];
  let buf = "";
  let i = 0;

  while (i < css.length) {
    const c = css[i];

    // komentarz
    if (c === "/" && css[i + 1] === "*") {
      const end = css.indexOf("*/", i + 2);
      const stop = end === -1 ? css.length : end + 2;
      if (buf.trim()) { out.push({ type: "text", value: buf.trim() }); buf = ""; }
      out.push({ type: "comment", value: css.slice(i, stop) });
      i = stop;
      continue;
    }

    // string
    if (c === '"' || c === "'") {
      const quote = c;
      buf += c; i++;
      while (i < css.length) {
        if (css[i] === "\\") { buf += css[i] + (css[i + 1] || ""); i += 2; continue; }
        buf += css[i];
        if (css[i] === quote) { i++; break; }
        i++;
      }
      continue;
    }

    if (c === "{") { out.push({ type: "open", value: buf.trim() }); buf = ""; i++; continue; }
    if (c === "}") {
      if (buf.trim()) out.push({ type: "decl", value: buf.trim() });
      buf = ""; out.push({ type: "close" }); i++; continue;
    }
    if (c === ";") {
      if (buf.trim()) out.push({ type: "decl", value: buf.trim() });
      buf = ""; i++; continue;
    }

    buf += c; i++;
  }

  if (buf.trim()) out.push({ type: "text", value: buf.trim() });
  return out;
}

// --- selektor: każdy element listy w osobnej linii, gdy jest ich więcej niż jeden
function formatSelector(sel, indent) {
  const parts = sel.split(",").map(s => s.trim().replace(/\s+/g, " ")).filter(Boolean);
  if (parts.length <= 1) return indent + parts.join("") + " {";
  return parts.map(p => indent + p).join(",\n") + " {";
}

function formatDecl(decl) {
  const idx = decl.indexOf(":");
  if (idx === -1) return decl.replace(/\s+/g, " ") + ";";
  const prop = decl.slice(0, idx).trim();
  const val = decl.slice(idx + 1).trim().replace(/\s+/g, " ");
  return prop + ": " + val + ";";
}

const tokens = tokenize(src);
let out = "";
let depth = 0;
let prev = null;

for (const tok of tokens) {
  const indent = "  ".repeat(depth);

  if (tok.type === "comment") {
    if (out && !out.endsWith("\n\n")) out += "\n";
    out += indent + tok.value + "\n";
  } else if (tok.type === "open") {
    // pusta linia przed nową regułą najwyższego poziomu
    if (depth === 0 && out && !out.endsWith("\n\n")) out += "\n";
    out += formatSelector(tok.value, indent) + "\n";
    depth++;
  } else if (tok.type === "decl") {
    out += indent + formatDecl(tok.value) + "\n";
  } else if (tok.type === "close") {
    depth = Math.max(0, depth - 1);
    out += "  ".repeat(depth) + "}\n";
  } else if (tok.type === "text") {
    out += indent + tok.value + "\n";
  }
  prev = tok;
}

out = out.replace(/\n{3,}/g, "\n\n").trimStart();

// --- kontrola: po usunięciu białych znaków i opcjonalnych średników przed }
//     obie wersje muszą być identyczne
const strip = s => s.replace(/\s+/g, "").replace(/;+\}/g, "}");
if (strip(out) !== strip(src)) {
  const a = strip(src), b = strip(out);
  let k = 0; while (k < a.length && a[k] === b[k]) k++;
  console.error("BŁĄD: formatowanie zmieniło treść CSS. Rozbieżność od znaku " + k + ":");
  console.error("  było:  ..." + a.slice(Math.max(0, k - 60), k + 60));
  console.error("  jest:  ..." + b.slice(Math.max(0, k - 60), k + 60));
  process.exit(1);
}

if (write) {
  fs.writeFileSync(file, out, "utf8");
  console.log("Zapisano " + file + " — " + src.length + " B → " + out.length + " B, treść identyczna.");
} else {
  console.log("Kontrola OK. " + src.length + " B → " + out.length + " B. Dodaj --write, aby zapisać.");
}
