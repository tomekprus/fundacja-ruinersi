/* =========================================================================
   Fundacja Ruinersi na Dolnym Śląsku — skrypty strony.
   Bez zależności zewnętrznych.

   Zasada: skrypt nie tworzy ani nie podmienia treści. Menu, nazwy, biogramy
   i teksty żyją w HTML — dzięki temu działają bez JavaScriptu i widzi je
   wyszukiwarka. Tutaj są wyłącznie zachowania: rozwijanie menu, animacje,
   formatowanie dat, filtr i obsługa formularzy.

   Teksty interfejsu trzymamy w obiekcie I18N, żeby dodanie wersji EN/DE/CS
   nie wymagało szukania napisów po kodzie. Język bierzemy z <html lang>.
   ========================================================================= */

(function () {
  "use strict";

  /* --- Słowniki interfejsu ------------------------------------------------ */

  var I18N = {
    pl: {
      "form.error.required": "To pole jest wymagane.",
      "form.error.email":    "Podaj poprawny adres e-mail.",
      "form.error.summary":  "Uzupełnij zaznaczone pola.",
      "form.sending":        "Otwieramy Twój program pocztowy z gotową wiadomością.",
      "form.fallback":       "Jeśli nic się nie otworzyło, napisz bezpośrednio na {email}.",
      "nav.menu":            "Menu",
      "date.locale":         "pl-PL"
    }
    // en / de / cs — do uzupełnienia razem z tłumaczeniami treści
  };

  var LANG = (document.documentElement.lang || "pl").slice(0, 2);
  var DICT = I18N[LANG] || I18N.pl;

  function t(key, vars) {
    var s = DICT[key] || I18N.pl[key] || key;
    if (vars) {
      Object.keys(vars).forEach(function (k) {
        s = s.replace("{" + k + "}", vars[k]);
      });
    }
    return s;
  }

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* --- Menu mobilne -------------------------------------------------------- */

  function initNav() {
    var toggle = document.querySelector(".nav-toggle");
    var nav = document.getElementById("nav");
    if (!toggle || !nav) return;

    function close() {
      toggle.setAttribute("aria-expanded", "false");
      nav.setAttribute("data-open", "false");
    }

    toggle.addEventListener("click", function () {
      var open = toggle.getAttribute("aria-expanded") === "true";
      toggle.setAttribute("aria-expanded", String(!open));
      nav.setAttribute("data-open", String(!open));
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && toggle.getAttribute("aria-expanded") === "true") {
        close();
        toggle.focus();
      }
    });

    window.addEventListener("resize", function () {
      if (window.innerWidth > 1080) close();
    });
  }

  /* --- Delikatne wejście sekcji przy przewijaniu --------------------------- */

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
    }, { rootMargin: "0px 0px -6% 0px", threshold: 0.06 });

    items.forEach(function (el) { io.observe(el); });
  }

  /* --- Daty ---------------------------------------------------------------- */
  /* Nazwy miesięcy nigdy nie są wpisane w kodzie. W HTML jest tylko
     <time datetime="2026-06-27" data-format="long">, resztę robi Intl.
     Treść zapasowa w HTML zostaje, jeśli formatowanie się nie powiedzie. */

  function initDates() {
    var nodes = document.querySelectorAll("time[datetime][data-format]");
    if (!nodes.length) return;

    var opts = {
      long:  { day: "numeric", month: "long",  year: "numeric" },
      short: { day: "numeric", month: "short", year: "numeric" },
      month: { month: "long", year: "numeric" }
    };

    nodes.forEach(function (node) {
      var date = new Date(node.getAttribute("datetime"));
      if (isNaN(date)) return;
      var style = node.dataset.format || "long";
      try {
        node.textContent = new Intl.DateTimeFormat(t("date.locale"), opts[style] || opts.long).format(date);
      } catch (e) {
        /* zostaje treść zapasowa z HTML */
      }
    });
  }

  /* --- Filtr projektów ------------------------------------------------------ */

  function initFilters() {
    var bar = document.querySelector(".filters");
    var list = document.getElementById("projects");
    if (!bar || !list) return;

    var cards = Array.prototype.slice.call(list.querySelectorAll(".project"));
    var buttons = Array.prototype.slice.call(bar.querySelectorAll(".filter"));
    var empty = document.getElementById("projects-empty");

    // Liczniki liczone z danych, nie wpisywane ręcznie
    buttons.forEach(function (btn) {
      var value = btn.dataset.filter;
      var n = value === "all"
        ? cards.length
        : cards.filter(function (c) { return c.dataset.category === value; }).length;
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

  /* --- Formularze ----------------------------------------------------------- */
  /* Strona statyczna nie ma backendu: walidujemy pola, składamy wiadomość
     i oddajemy ją programowi pocztowemu. Przepięcie na Formspree — patrz README. */

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
          // zgody i inne pola wyboru
          if (input.type === "checkbox") {
            if (input.required && !input.checked) {
              setError(input, t("form.error.required"));
              ok = false;
            } else {
              setError(input, "");
            }
            return;
          }

          var value = (input.value || "").trim();

          if (input.required && !value) {
            setError(input, t("form.error.required"));
            ok = false;
          } else if (input.type === "email" && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
            setError(input, t("form.error.email"));
            ok = false;
          } else {
            setError(input, "");
          }
        });

        return ok;
      }

      // Po pierwszym błędzie sprawdzamy na bieżąco, żeby komunikat znikał od razu
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

        var imie      = form.querySelector('[name="imie"]');
        var email     = form.querySelector('[name="email"]');
        var telefon   = form.querySelector('[name="telefon"]');
        var wiadomosc = form.querySelector('[name="wiadomosc"]');

        var lines = [];
        if (imie)    lines.push("Imię i nazwisko: " + imie.value.trim());
        if (email)   lines.push("E-mail: " + email.value.trim());
        if (telefon && telefon.value.trim()) lines.push("Telefon: " + telefon.value.trim());
        if (subjectField) lines.push("Temat: " + subjectField.value.trim());
        if (wiadomosc) lines.push("", "Wiadomość:", wiadomosc.value.trim());

        window.location.href = "mailto:" + address +
          "?subject=" + encodeURIComponent(subject) +
          "&body=" + encodeURIComponent(lines.join("\r\n"));

        if (status) {
          status.textContent = t("form.sending") + " " + t("form.fallback", { email: address });
        }
      });
    });
  }

  /* --- Rok w stopce ---------------------------------------------------------- */

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
    initNav();
    initReveal();
    initDates();
    initFilters();
    initForms();
    initYear();
  });
})();
