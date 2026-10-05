/* Fundacja Ruinersi na Dolnym Śląsku — Einwilligung für Statistik (DE). */
(function (window, document) {
  "use strict";

  var KEY = "ruinersi-zgoda";
  var VERSION = 1;
  var GA_ID = "G-FVW52GBWYN";
  var COOKIE_EXPIRES = 34214400;

  var CONTENT =
    '<div class="zgoda-inner">' +
      '<div class="zgoda-text">' +
        '<strong class="zgoda-title">Wir verwenden Cookies</strong>' +
        '<p>Wir verwenden Cookies, um die Nutzung unserer Website zu analysieren. Mit einem Klick auf „Ich stimme zu“ willigst du in die Verwendung dieser Cookies ein.</p>' +
      '</div>' +
      '<div class="zgoda-akcje">' +
        '<button type="button" class="zgoda-btn" data-zgoda="nie">Ablehnen</button>' +
        '<button type="button" class="zgoda-btn" data-zgoda="tak">Ich stimme zu</button>' +
        '<a class="zgoda-link" href="prywatnosc.html">Datenschutzerklärung</a>' +
      '</div>' +
    '</div>';

  var bar = null;

  function read() {
    try {
      var raw = window.localStorage.getItem(KEY);
      if (!raw) return null;
      var data = JSON.parse(raw);
      if (!data || data.wersja !== VERSION || typeof data.analityka !== "boolean") return null;
      return data;
    } catch (e) { return null; }
  }

  function save(analytics) {
    var data = { analityka: !!analytics, wersja: VERSION, data: new Date().toISOString() };
    try { window.localStorage.setItem(KEY, JSON.stringify(data)); } catch (e) {}
    return data;
  }

  function gtag() { window.dataLayer.push(arguments); }

  function setDefault() {
    window.dataLayer = window.dataLayer || [];
    gtag("consent", "default", {
      analytics_storage: "denied",
      ad_storage: "denied",
      ad_user_data: "denied",
      ad_personalization: "denied",
      wait_for_update: 500
    });
  }

  function enableAnalytics() {
    if (document.getElementById("ga-script")) return;
    gtag("consent", "update", { analytics_storage: "granted" });
    var script = document.createElement("script");
    script.id = "ga-script";
    script.async = true;
    script.src = "https://www.googletagmanager.com/gtag/js?id=" + GA_ID;
    document.head.appendChild(script);
    gtag("js", new Date());
    gtag("config", GA_ID, { cookie_expires: COOKIE_EXPIRES });
  }

  function hide() {
    if (bar && bar.remove) bar.remove();
    bar = null;
  }

  function apply(analytics) {
    save(analytics);
    if (analytics) enableAnalytics();
    hide();
  }

  function build() {
    if (bar) return bar;
    var el = document.createElement("div");
    el.className = "zgoda";
    el.setAttribute("role", "region");
    el.setAttribute("aria-label", "Einwilligung zur Besuchsstatistik");
    el.innerHTML = CONTENT;
    el.addEventListener("click", function (e) {
      var target = e.target;
      if (!target || !target.getAttribute) return;
      var choice = target.getAttribute("data-zgoda");
      if (!choice) return;
      apply(choice === "tak");
    });
    document.body.insertBefore(el, document.body.firstChild);
    bar = el;
    return el;
  }

  function show() { return build(); }

  function start() {
    setDefault();
    var decision = read();
    if (decision && decision.analityka) enableAnalytics();
    if (!decision || window.location.hash === "#zgoda") build();
  }

  window.RuinersiZgoda = {
    start: start,
    pokaz: show,
    zastosuj: apply,
    _wewn: { odczytaj: read, zapisz: save }
  };

  if (document.readyState !== "loading") start();
  else document.addEventListener("DOMContentLoaded", start);
})(window, document);
