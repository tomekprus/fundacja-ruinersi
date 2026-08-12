/* =========================================================================
   Fundacja Ruinersi na Dolnym Śląsku — skrypty strony.
   Bez zależności zewnętrznych.

   Zasada: JavaScript obsługuje wyłącznie zachowania interfejsu.
   Treść i struktura stron pozostają w HTML.
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

  function initCurrentAssets() {
    var path = window.location.pathname.split("/").pop() || "index.html";

    if (path === "klaster.html") {
      var founderLogos = document.querySelectorAll(".founder-logos .founder-logo");
      var assets = [
        { index: 1, src: "assets/img/domowprzyslupowych.jpg", alt: "Fundacja Dolina Domów Przysłupowych" },
        { index: 3, src: "assets/img/dom-kolodzieja.png", alt: "Stowarzyszenie Dom Kołodzieja" }
      ];

      assets.forEach(function (asset) {
        var slot = founderLogos[asset.index];
        if (!slot) return;
        slot.classList.remove("ph");
        slot.innerHTML = "";
        var img = document.createElement("img");
        img.src = asset.src;
        img.alt = asset.alt;
        img.loading = "lazy";
        slot.appendChild(img);
      });
    }

    if (path === "o-fundacji.html") {
      var award = document.querySelector(".award-photo");
      if (award) award.src = "assets/img/nagroda_ruinersi.jpg";
    }
  }

  function initRetiredLinks() {
    document.querySelectorAll('.nav a[href="aktualnosci.html"]').forEach(function (link) {
      var item = link.closest("li");
      if (item) item.remove();
      else link.remove();
    });
    document.querySelectorAll('a[href="zloty.html"]').forEach(function (link) {
      var item = link.closest("li");
      if (item && item.closest(".site-foot")) item.remove();
      else link.remove();
    });
  }

  function initNav() {
    var toggle = document.querySelector(".nav-toggle");
    var nav = document.getElementById("nav");
    if (!toggle || !nav) return;

    var mobileQuery = window.matchMedia("(max-width: 1240px)");

    function syncInert() {
      var isOpen = toggle.getAttribute("aria-expanded") === "true";
      if (mobileQuery.matches && !isOpen) nav.setAttribute("inert", "");
      else nav.removeAttribute("inert");
    }

    function close() {
      toggle.setAttribute("aria-expanded", "false");
      nav.setAttribute("data-open", "false");
      syncInert();
    }

    toggle.addEventListener("click", function () {
      var open = toggle.getAttribute("aria-expanded") === "true";
      toggle.setAttribute("aria-expanded", String(!open));
      nav.setAttribute("data-open", String(!open));
      syncInert();
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && toggle.getAttribute("aria-expanded") === "true") {
        close();
        toggle.focus();
      }
    });

    if (mobileQuery.addEventListener) mobileQuery.addEventListener("change", syncInert);
    else mobileQuery.addListener(syncInert);
    syncInert();
  }

  function initReveal() {
    var items = document.querySelectorAll(".reveal");
    if (!items.length) return;

    if (reduceMotion || !("IntersectionObserver" in window)) {
      items.forEach(function (el) { el.classList.add("in"); });
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("in");
        io.unobserve(entry.target);
      });
    }, { rootMargin: "0px 0px -6% 0px", threshold: .06 });

    items.forEach(function (el) { io.observe(el); });
  }

  function initDates() {
    var nodes = document.querySelectorAll("time[datetime][data-format]");
    if (!nodes.length) return;

    var opts = {
      long: { day: "numeric", month: "long", year: "numeric" },
      short: { day: "numeric", month: "short", year: "numeric" },
      month: { month: "long", year: "numeric" }
    };

    nodes.forEach(function (node) {
      var date = new Date(node.getAttribute("datetime"));
      if (isNaN(date)) return;
      var style = node.dataset.format || "long";
      try {
        node.textContent = new Intl.DateTimeFormat(t("date.locale"), opts[style] || opts.long).format(date);
      } catch (e) {}
    });
  }

  function initFilters() {
    var bar = document.querySelector(".filters");
    var list = document.getElementById("projects");
    if (!bar || !list) return;

    var cards = Array.prototype.slice.call(list.querySelectorAll(".project"));
    var buttons = Array.prototype.slice.call(bar.querySelectorAll(".filter"));
    var empty = document.getElementById("projects-empty");

    buttons.forEach(function (btn) {
      var value = btn.dataset.filter;
      var n = value === "all" ? cards.length : cards.filter(function (c) { return c.dataset.category === value; }).length;
      var slot = btn.querySelector(".filter-count");
      if (slot) slot.textContent = n;
    });

    function apply(value) {
      var shown = 0;
      cards.forEach(function (card) {
        var match = value === "all" || card.dataset.category === value;
        card.hidden = !match;
        if (match) shown++;
      });
      buttons.forEach(function (btn) {
        btn.setAttribute("aria-pressed", String(btn.dataset.filter === value));
      });
      if (empty) empty.hidden = shown > 0;
    }

    bar.addEventListener("click", function (e) {
      var btn = e.target.closest(".filter");
      if (btn) apply(btn.dataset.filter);
    });

    apply("all");
  }

  function initForms() {
    document.querySelectorAll("form[data-mailto]").forEach(function (form) {
      var status = form.querySelector(".form-status");

      function setError(input, message) {
        var slot = form.querySelector('[data-error-for="' + input.name + '"]');
        if (slot) slot.textContent = message || "";
        input.setAttribute("aria-invalid", message ? "true" : "false");
      }

      function validate() {
        var ok = true;
        form.querySelectorAll("[name]").forEach(function (input) {
          if (input.type === "checkbox") {
            if (input.required && !input.checked) {
              setError(input, t("form.error.required"));
              ok = false;
            } else setError(input, "");
            return;
          }

          var value = (input.value || "").trim();
          if (input.required && !value) {
            setError(input, t("form.error.required"));
            ok = false;
          } else if (input.type === "email" && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
            setError(input, t("form.error.email"));
            ok = false;
          } else setError(input, "");
        });
        return ok;
      }

      form.addEventListener("input", function (e) {
        if (e.target.getAttribute("aria-invalid") === "true") validate();
      });
      form.addEventListener("change", function (e) {
        if (e.target.getAttribute("aria-invalid") === "true") validate();
      });

      form.addEventListener("submit", function (e) {
        e.preventDefault();
        if (!validate()) {
          if (status) status.textContent = t("form.error.summary");
          var first = form.querySelector('[aria-invalid="true"]');
          if (first) first.focus();
          return;
        }

        var address = form.dataset.mailto;
        var subjectField = form.querySelector('[name="temat"]');
        var subject = (subjectField && subjectField.value.trim()) || form.dataset.subject || "";
        var imie = form.querySelector('[name="imie"]');
        var email = form.querySelector('[name="email"]');
        var telefon = form.querySelector('[name="telefon"]');
        var wiadomosc = form.querySelector('[name="wiadomosc"]');
        var lines = [];

        if (imie) lines.push("Imię i nazwisko: " + imie.value.trim());
        if (email) lines.push("E-mail: " + email.value.trim());
        if (telefon && telefon.value.trim()) lines.push("Telefon: " + telefon.value.trim());
        if (subjectField) lines.push("Temat: " + subjectField.value.trim());
        if (wiadomosc) lines.push("", "Wiadomość:", wiadomosc.value.trim());

        window.location.href = "mailto:" + address + "?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(lines.join("\r\n"));
        if (status) status.textContent = t("form.sending") + " " + t("form.fallback", { email: address });
      });
    });
  }

  function initYear() {
    document.querySelectorAll("[data-year]").forEach(function (el) {
      el.textContent = new Date().getFullYear();
    });
  }

  function ready(fn) {
    if (document.readyState !== "loading") fn();
    else document.addEventListener("DOMContentLoaded", fn);
  }

  ready(function () {
    initCurrentAssets();
    initRetiredLinks();
    initNav();
    initReveal();
    initDates();
    initFilters();
    initForms();
    initYear();
  });
})();
