/* =========================================================================
   Fundacja Ruinersi na Dolnym Śląsku — skrypty strony.
   Bez zależności zewnętrznych.
   ========================================================================= */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function initCurrentAssets() {
    var path = window.location.pathname.split("/").pop() || "index.html";
    if (path === "klaster.html") {
      var founderLogos = document.querySelectorAll(".founder-logos .founder-logo");
      [
        { index: 1, src: "assets/img/domowprzyslupowych.jpg", alt: "Fundacja Dolina Domów Przysłupowych" },
        { index: 3, src: "assets/img/dom-kolodzieja.png", alt: "Stowarzyszenie Dom Kołodzieja" }
      ].forEach(function (asset) {
        var slot = founderLogos[asset.index];
        if (!slot) return;
        slot.classList.remove("ph"); slot.innerHTML = "";
        var img = document.createElement("img");
        img.src = asset.src; img.alt = asset.alt; img.loading = "lazy"; slot.appendChild(img);
      });

      var founderLinks = {
        "Fundacja Dolina Domów Przysłupowych": "https://www.facebook.com/dolinadomowprzyslupowych/?locale=pl_PL",
        "Stowarzyszenie Gildia Przewodników Sudeckich – Zamek Wleń": "https://www.facebook.com/gildiaprzewodnikow/?locale=pl_PL",
        "Stowarzyszenie Dom Kołodzieja": "https://www.domkolodzieja.pl/",
        "Stowarzyszenie Wieża Książęca w Siedlęcinie": "https://wiezasiedlecin.pl/stowarzyszenie/"
      };
      document.querySelectorAll(".founder-name").forEach(function (node) {
        var name = node.textContent.trim();
        var href = founderLinks[name];
        if (!href) return;
        var link = document.createElement("a");
        link.href = href; link.target = "_blank"; link.rel = "noopener noreferrer";
        link.textContent = name; node.textContent = ""; node.appendChild(link);
      });
    }
    if (path === "o-fundacji.html") {
      var award = document.querySelector(".award-photo");
      if (award) award.src = "assets/img/nagroda_ruinersi.jpg";
    }
  }

  function initRetiredLinks() {
    document.querySelectorAll('.nav a[href="aktualnosci.html"]').forEach(function (link) {
      var item = link.closest("li"); if (item) item.remove(); else link.remove();
    });
    document.querySelectorAll('a[href="zloty.html"]').forEach(function (link) {
      var item = link.closest("li"); if (item && item.closest(".site-foot")) item.remove(); else link.remove();
    });
  }

  function initNav() {
    var toggle = document.querySelector(".nav-toggle"), nav = document.getElementById("nav");
    if (!toggle || !nav) return;
    var mobileQuery = window.matchMedia("(max-width: 1240px)");
    function syncInert() { var open = toggle.getAttribute("aria-expanded") === "true"; if (mobileQuery.matches && !open) nav.setAttribute("inert", ""); else nav.removeAttribute("inert"); }
    function close() { toggle.setAttribute("aria-expanded", "false"); nav.setAttribute("data-open", "false"); syncInert(); }
    toggle.addEventListener("click", function () { var open = toggle.getAttribute("aria-expanded") === "true"; toggle.setAttribute("aria-expanded", String(!open)); nav.setAttribute("data-open", String(!open)); syncInert(); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && toggle.getAttribute("aria-expanded") === "true") { close(); toggle.focus(); } });
    if (mobileQuery.addEventListener) mobileQuery.addEventListener("change", syncInert); else mobileQuery.addListener(syncInert); syncInert();
  }

  function initReveal() {
    var items = document.querySelectorAll(".reveal"); if (!items.length) return;
    if (reduceMotion || !("IntersectionObserver" in window)) { items.forEach(function (el) { el.classList.add("in"); }); return; }
    var io = new IntersectionObserver(function (entries) { entries.forEach(function (entry) { if (!entry.isIntersecting) return; entry.target.classList.add("in"); io.unobserve(entry.target); }); }, { rootMargin: "0px 0px -6% 0px", threshold: .06 });
    items.forEach(function (el) { io.observe(el); });
  }

  function initDates() {
    var opts = { long:{day:"numeric",month:"long",year:"numeric"}, short:{day:"numeric",month:"short",year:"numeric"}, month:{month:"long",year:"numeric"} };
    document.querySelectorAll("time[datetime][data-format]").forEach(function(node){ var d=new Date(node.getAttribute("datetime")); if(isNaN(d))return; try{node.textContent=new Intl.DateTimeFormat("pl-PL",opts[node.dataset.format]||opts.long).format(d);}catch(e){} });
  }

  function initFilters() {
    var bar=document.querySelector(".filters"), list=document.getElementById("projects"); if(!bar||!list)return;
    var cards=Array.prototype.slice.call(list.querySelectorAll(".project")), buttons=Array.prototype.slice.call(bar.querySelectorAll(".filter")), empty=document.getElementById("projects-empty");
    buttons.forEach(function(btn){var v=btn.dataset.filter,n=v==="all"?cards.length:cards.filter(function(c){return c.dataset.category===v;}).length,s=btn.querySelector(".filter-count");if(s)s.textContent=n;});
    function apply(v){var shown=0;cards.forEach(function(c){var m=v==="all"||c.dataset.category===v;c.hidden=!m;if(m)shown++;});buttons.forEach(function(b){b.setAttribute("aria-pressed",String(b.dataset.filter===v));});if(empty)empty.hidden=shown>0;}
    bar.addEventListener("click",function(e){var b=e.target.closest(".filter");if(b)apply(b.dataset.filter);}); apply("all");
  }

  function initForms() {
    document.querySelectorAll("form[data-mailto]").forEach(function(form){
      var status=form.querySelector(".form-status");
      function err(i,m){var s=form.querySelector('[data-error-for="'+i.name+'"]');if(s)s.textContent=m||"";i.setAttribute("aria-invalid",m?"true":"false");}
      function validate(){var ok=true;form.querySelectorAll("[name]").forEach(function(i){if(i.type==="checkbox"){if(i.required&&!i.checked){err(i,"To pole jest wymagane.");ok=false;}else err(i,"");return;}var v=(i.value||"").trim();if(i.required&&!v){err(i,"To pole jest wymagane.");ok=false;}else if(i.type==="email"&&v&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)){err(i,"Podaj poprawny adres e-mail.");ok=false;}else err(i,"");});return ok;}
      form.addEventListener("submit",function(e){e.preventDefault();if(!validate()){if(status)status.textContent="Uzupełnij zaznaczone pola.";var f=form.querySelector('[aria-invalid="true"]');if(f)f.focus();return;}var a=form.dataset.mailto,s=form.querySelector('[name="temat"]'),subject=(s&&s.value.trim())||form.dataset.subject||"",lines=[];[["Imię i nazwisko","imie"],["E-mail","email"],["Telefon","telefon"],["Temat","temat"]].forEach(function(x){var n=form.querySelector('[name="'+x[1]+'"]');if(n&&n.value.trim())lines.push(x[0]+": "+n.value.trim());});var w=form.querySelector('[name="wiadomosc"]');if(w)lines.push("","Wiadomość:",w.value.trim());window.location.href="mailto:"+a+"?subject="+encodeURIComponent(subject)+"&body="+encodeURIComponent(lines.join("\r\n"));if(status)status.textContent="Otwieramy Twój program pocztowy z gotową wiadomością.";});
    });
  }

  function initYear(){document.querySelectorAll("[data-year]").forEach(function(el){el.textContent=new Date().getFullYear();});}
  function ready(fn){if(document.readyState!=="loading")fn();else document.addEventListener("DOMContentLoaded",fn);}
  ready(function(){initCurrentAssets();initRetiredLinks();initNav();initReveal();initDates();initFilters();initForms();initYear();});
})();
