/* =========================================================================
   Fundacja Ruinersi — skrypty prototypu. Bez zależności zewnętrznych.
   ========================================================================= */

(function () {
  "use strict";

  var I18N = {
    pl: {
      "form.error.required": "To pole jest wymagane.",
      "form.error.email": "Podaj poprawny adres e-mail.",
      "form.error.summary": "Uzupełnij zaznaczone pola.",
      "form.sending": "Otwieramy Twój program pocztowy z gotową wiadomością.",
      "form.fallback": "Jeśli nic się nie otworzyło, napisz bezpośrednio na {email}.",
      "nav.menu": "Menu",
      "date.locale": "pl-PL"
    }
  };

  var LANG = (document.documentElement.lang || "pl").slice(0, 2);
  var DICT = I18N[LANG] || I18N.pl;

  function t(key, vars) {
    var s = DICT[key] || I18N.pl[key] || key;
    if (vars) Object.keys(vars).forEach(function (k) { s = s.replace("{" + k + "}", vars[k]); });
    return s;
  }

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* --- Drobne korekty treści i zdjęcia Zarządu ---------------------------- */

  function initContentAdjustments() {
    var path = window.location.pathname.split("/").pop() || "index.html";

    /* Ujednolicona nazwa Fundacji przy logo na wszystkich podstronach. */
    var brandText = document.querySelector(".brand-text");
    if (brandText) {
      brandText.innerHTML = "<b>Fundacja Ruinersi</b><small>na Dolnym Śląsku</small>";
    }

    if (path === "index.html" || path === "") {
      document.querySelectorAll("main > section").forEach(function (section) {
        var eyebrow = section.querySelector(".eyebrow");
        if (eyebrow && eyebrow.textContent.trim() === "Aktualności") section.remove();
      });
    }

    if (path === "o-fundacji.html") {
      var photos = {
        "Darek Borkowski": "assets/img/darek-borkowski.webp",
        "Tomasz Prus": "assets/img/tomasz-prus.webp"
      };

      document.querySelectorAll("#ludzie .person").forEach(function (card) {
        var heading = card.querySelector("h3");
        if (!heading) return;
        var src = photos[heading.textContent.trim()];
        if (!src) return;

        var oldFigure = card.querySelector("figure");
        if (!oldFigure) return;

        var figure = document.createElement("figure");
        figure.style.cssText = "aspect-ratio:4/5;overflow:hidden;margin:0;background:var(--plaster-sunk);";

        var img = document.createElement("img");
        img.src = src;
        img.alt = heading.textContent.trim();
        img.loading = "lazy";
        img.decoding = "async";
        img.style.cssText = "width:100%;height:100%;object-fit:cover;display:block;";

        figure.appendChild(img);
        oldFigure.replaceWith(figure);
      });
    }
  }

  function initGlobalNavLinks() {
    var list = document.querySelector("#nav > ul");
    if (!list) return;

    var path = window.location.pathname.split("/").pop() || "index.html";
    var navItems = [
      { href: "index.html", label: "Strona główna" },
      { href: "o-fundacji.html", label: "O Fundacji" },
      { href: "aktualnosci.html", label: "Aktualności" },
      { href: "klaster.html", label: "Klaster" },
      { href: "projekty.html", label: "Projekty" },
      { href: "materialy-edukacyjne.html", label: "Materiały edukacyjne" },
      { href: "media.html", label: "Media" },
      { href: "kontakt.html", label: "Kontakt" }
    ];

    var itemsByHref = {};
    Array.prototype.slice.call(list.querySelectorAll("li")).forEach(function (item) {
      var link = item.querySelector("a[href]");
      if (link) itemsByHref[link.getAttribute("href")] = item;
    });

    navItems.forEach(function (entry) {
      var item = itemsByHref[entry.href];
      var link;

      if (!item) {
        item = document.createElement("li");
        link = document.createElement("a");
        link.href = entry.href;
        link.textContent = entry.label;
        item.appendChild(link);
      } else {
        link = item.querySelector("a[href]");
        link.textContent = entry.label;
      }

      if (path === entry.href || (path === "" && entry.href === "index.html")) {
        link.setAttribute("aria-current", "page");
      } else {
        link.removeAttribute("aria-current");
      }

      list.appendChild(item);
    });
  }

  function initNav() {
    var toggle = document.querySelector(".nav-toggle");
    var nav = document.getElementById("nav");
    if (!toggle || !nav) return;
    function close() { toggle.setAttribute("aria-expanded", "false"); nav.setAttribute("data-open", "false"); }
    toggle.addEventListener("click", function () { var open = toggle.getAttribute("aria-expanded") === "true"; toggle.setAttribute("aria-expanded", String(!open)); nav.setAttribute("data-open", String(!open)); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && toggle.getAttribute("aria-expanded") === "true") { close(); toggle.focus(); } });
    window.addEventListener("resize", function () { if (window.innerWidth > 1080) close(); });
  }

  function initReveal() {
    var items = document.querySelectorAll(".reveal");
    if (!items.length) return;
    if (reduceMotion || !("IntersectionObserver" in window)) { items.forEach(function (el) { el.classList.add("in"); }); return; }
    var io = new IntersectionObserver(function (entries) { entries.forEach(function (entry) { if (!entry.isIntersecting) return; entry.target.classList.add("in"); io.unobserve(entry.target); }); }, { rootMargin: "0px 0px -6% 0px", threshold: 0.06 });
    items.forEach(function (el) { io.observe(el); });
  }

  function initDates() {
    var nodes = document.querySelectorAll("time[datetime][data-format]");
    if (!nodes.length) return;
    var opts = { long: { day: "numeric", month: "long", year: "numeric" }, short: { day: "numeric", month: "short", year: "numeric" }, month: { month: "long", year: "numeric" } };
    nodes.forEach(function (node) { var date = new Date(node.getAttribute("datetime")); if (isNaN(date)) return; var style = node.dataset.format || "long"; try { node.textContent = new Intl.DateTimeFormat(t("date.locale"), opts[style] || opts.long).format(date); } catch (e) {} });
  }

  function initFilters() {
    var bar = document.querySelector(".filters"); var list = document.getElementById("projects"); if (!bar || !list) return;
    var cards = Array.prototype.slice.call(list.querySelectorAll(".project")); var buttons = Array.prototype.slice.call(bar.querySelectorAll(".filter")); var empty = document.getElementById("projects-empty");
    buttons.forEach(function (btn) { var value = btn.dataset.filter; var n = value === "all" ? cards.length : cards.filter(function (c) { return c.dataset.category === value; }).length; var slot = btn.querySelector(".filter-count"); if (slot) slot.textContent = n; });
    function apply(value) { var shown = 0; cards.forEach(function (card) { var match = value === "all" || card.dataset.category === value; card.hidden = !match; if (match) shown++; }); buttons.forEach(function (btn) { btn.setAttribute("aria-pressed", String(btn.dataset.filter === value)); }); if (empty) empty.hidden = shown > 0; }
    bar.addEventListener("click", function (e) { var btn = e.target.closest(".filter"); if (btn) apply(btn.dataset.filter); }); apply("all");
  }

  function initForms() {
    document.querySelectorAll("form[data-mailto]").forEach(function (form) {
      var status = form.querySelector(".form-status");
      function setError(input, message) { var slot = form.querySelector('[data-error-for="' + input.name + '"]'); if (slot) slot.textContent = message || ""; input.setAttribute("aria-invalid", message ? "true" : "false"); }
      function validate() { var ok = true; form.querySelectorAll("[name]").forEach(function (input) { var value = (input.value || "").trim(); if (input.required && !value) { setError(input, t("form.error.required")); ok = false; } else if (input.type === "email" && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) { setError(input, t("form.error.email")); ok = false; } else setError(input, ""); }); return ok; }
      form.addEventListener("input", function (e) { if (e.target.getAttribute("aria-invalid") === "true") validate(); });
      form.addEventListener("submit", function (e) { e.preventDefault(); if (!validate()) { if (status) status.textContent = t("form.error.summary"); var first = form.querySelector('[aria-invalid="true"]'); if (first) first.focus(); return; } var address = form.dataset.mailto; var lines = []; form.querySelectorAll("[name]").forEach(function (input) { var label = form.querySelector('label[for="' + input.id + '"]'); lines.push((label ? label.textContent.trim() : input.name) + ":\n" + input.value.trim()); }); var subjectField = form.querySelector('[name="temat"]'); var subject = (subjectField && subjectField.value.trim()) || form.dataset.subject || ""; window.location.href = "mailto:" + address + "?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(lines.join("\n\n")); if (status) status.textContent = t("form.sending") + " " + t("form.fallback", { email: address }); });
    });
  }

  function initYear() { document.querySelectorAll("[data-year]").forEach(function (el) { el.textContent = new Date().getFullYear(); }); }
  function ready(fn) { if (document.readyState !== "loading") fn(); else document.addEventListener("DOMContentLoaded", fn); }
  ready(function () { initContentAdjustments(); initGlobalNavLinks(); initNav(); initReveal(); initDates(); initFilters(); initForms(); initYear(); });
})();
