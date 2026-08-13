/* Fundacja Ruinersi na Dolnym Śląsku — zgoda na statystyki.

   Celowo w osobnym pliku niż main.js: awaria jednego nie może unieruchomić
   drugiego. Skrypt Google Analytics nie istnieje w DOM, dopóki użytkownik
   nie wyrazi zgody — samo consent:denied przy wczytanym skrypcie nadal
   odpytywałoby Google.                                                    */
(function (window, document) {
  "use strict";

  var KLUCZ = "ruinersi-zgoda";
  var WERSJA = 1;
  var GA_ID = "G-FVW52GBWYN";
  var COOKIE_EXPIRES = 34214400; /* 396 dni = 13 miesięcy, zgodnie z treścią paska */

  var TRESC =
    '<div class="zgoda-inner">' +
      '<p class="zgoda-text">' +
        '<span class="zgoda-eyebrow">Prywatność</span>' +
        'Chcemy liczyć odwiedziny w Google Analytics — to zapisze identyfikator ' +
        'Twojej przeglądarki na 13 miesięcy i wyśle dane do Google, także do USA. ' +
        'Bez zgody nie wczytujemy tego skryptu.' +
      '</p>' +
      '<div class="zgoda-akcje">' +
        '<button type="button" class="zgoda-btn" data-zgoda="nie">Nie zgadzam się</button>' +
        '<button type="button" class="zgoda-btn" data-zgoda="tak">Zgadzam się</button>' +
        '<a class="zgoda-link" href="prywatnosc.html">Polityka prywatności</a>' +
      '</div>' +
    '</div>';

  var pasekEl = null;

  function odczytaj() {
    try {
      var surowe = window.localStorage.getItem(KLUCZ);
      if (!surowe) return null;
      var dane = JSON.parse(surowe);
      if (!dane || dane.wersja !== WERSJA || typeof dane.analityka !== "boolean") return null;
      return dane;
    } catch (e) {
      return null;
    }
  }

  function zapisz(analityka) {
    var dane = { analityka: !!analityka, wersja: WERSJA, data: new Date().toISOString() };
    try {
      window.localStorage.setItem(KLUCZ, JSON.stringify(dane));
    } catch (e) {}
    return dane;
  }

  function gtag() {
    window.dataLayer.push(arguments);
  }

  function ustawDomyslne() {
    window.dataLayer = window.dataLayer || [];
    gtag("consent", "default", {
      analytics_storage: "denied",
      ad_storage: "denied",
      ad_user_data: "denied",
      ad_personalization: "denied",
      wait_for_update: 500
    });
  }

  function wlaczAnalityke() {
    if (document.getElementById("ga-script")) return;
    gtag("consent", "update", { analytics_storage: "granted" });
    var skrypt = document.createElement("script");
    skrypt.id = "ga-script";
    skrypt.async = true;
    skrypt.src = "https://www.googletagmanager.com/gtag/js?id=" + GA_ID;
    document.head.appendChild(skrypt);
    gtag("js", new Date());
    gtag("config", GA_ID, { cookie_expires: COOKIE_EXPIRES });
  }

  function ukryj() {
    if (pasekEl && pasekEl.remove) pasekEl.remove();
    pasekEl = null;
  }

  function zastosuj(analityka) {
    zapisz(analityka);
    if (analityka) wlaczAnalityke();
    ukryj();
  }

  function zbudujPasek() {
    if (pasekEl) return pasekEl;
    var pasek = document.createElement("div");
    pasek.className = "zgoda";
    pasek.setAttribute("role", "region");
    pasek.setAttribute("aria-label", "Zgoda na statystyki");
    pasek.innerHTML = TRESC;
    pasek.addEventListener("click", function (e) {
      var cel = e.target;
      if (!cel || !cel.getAttribute) return;
      var wybor = cel.getAttribute("data-zgoda");
      if (!wybor) return;
      zastosuj(wybor === "tak");
    });
    document.body.insertBefore(pasek, document.body.firstChild);
    pasekEl = pasek;
    return pasek;
  }

  function pokaz() {
    return zbudujPasek();
  }

  function start() {
    ustawDomyslne();
    var decyzja = odczytaj();
    if (decyzja && decyzja.analityka) wlaczAnalityke();
    if (!decyzja || window.location.hash === "#zgoda") zbudujPasek();
  }

  window.RuinersiZgoda = {
    start: start,
    pokaz: pokaz,
    zastosuj: zastosuj,
    _wewn: { odczytaj: odczytaj, zapisz: zapisz }
  };

  if (document.readyState !== "loading") start();
  else document.addEventListener("DOMContentLoaded", start);
})(window, document);
