/* =========================================================================
   Fundacja Ruinersi na Dolnym Śląsku — skrypty strony.
   Bez zależności zewnętrznych.
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

  function initContentEnhancements() {
    var path = window.location.pathname.split("/").pop() || "index.html";

    /* Wyróżnienie głównego CTA w nawigacji. */
    var supportLink = document.querySelector('.nav a[href="wesprzyj.html"]');
    if (supportLink) supportLink.classList.add("nav-support");
    if (!document.getElementById("nav-support-style")) {
      var style = document.createElement("style");
      style.id = "nav-support-style";
      style.textContent =
        '.nav a.nav-support{background:var(--forest-deep);color:var(--plaster);padding:.58rem .9rem;border:1px solid var(--forest-deep)}' +
        '.nav a.nav-support::after{display:none}.nav a.nav-support:hover{background:var(--forest);color:#fff;border-color:var(--forest)}' +
        '.nav a.nav-support[aria-current="page"]{background:var(--brick);border-color:var(--brick);color:#fff}' +
        '@media(max-width:1080px){.nav a.nav-support{margin:.55rem 0;padding:.8rem 1rem;border-bottom:1px solid var(--forest-deep)}}';
      document.head.appendChild(style);
    }

    if (path === "kontakt.html") {
      var contactHeads = Array.prototype.slice.call(document.querySelectorAll(".section-head .h2"));
      contactHeads.forEach(function (h) {
        if (h.textContent.trim() === "W czym możemy pomóc") {
          var section = h.closest("section");
          if (section) section.remove();
        }
      });
    }

    if (path === "o-fundacji.html") {
      var peopleSection = document.getElementById("ludzie");
      if (peopleSection) {
        var wrap = peopleSection.querySelector(".wrap");
        if (wrap && !document.getElementById("wolontariusze")) {
          var volunteers = document.createElement("div");
          volunteers.id = "wolontariusze";
          volunteers.innerHTML =
            '<div class="section-head mt-3"><span class="eyebrow">Ludzie Fundacji</span><h2 class="h3">Wolontariusze</h2><p class="lead">Fundację regularnie wspierają osoby, które poświęcają swój czas i kompetencje przy wydarzeniach, projektach, dokumentacji i działaniach organizacyjnych.</p></div>' +
            '<div class="people people--compact">' +
            ['Jan Kowalski','Janina Kowalska','Jan Kowalski','Janina Kowalska','Jan Kowalski','Janina Kowalska','Jan Kowalski','Janina Kowalska'].map(function(name){return '<article class="person"><h3 class="h4">'+name+'</h3><p class="person-role">Wolontariusz / Wolontariuszka</p><p><span class="todo">krótkie bio po uzyskaniu zgody</span></p></article>';}).join('') +
            '</div>';
          wrap.appendChild(volunteers);
        }
      }

      if (!document.getElementById("pomoc-fundacji")) {
        var limits = Array.prototype.slice.call(document.querySelectorAll(".section-head .h2")).filter(function(h){return h.textContent.trim().indexOf("Pomagamy znaleźć właściwą drogę") === 0;})[0];
        var anchorSection = limits ? limits.closest("section") : null;
        if (anchorSection) {
          var help = document.createElement("section");
          help.id = "pomoc-fundacji";
          help.className = "section section--ruled";
          help.innerHTML = '<div class="wrap"><div class="section-head"><span class="eyebrow">Najczęstsze ścieżki</span><h2 class="h2">W czym możemy pomóc</h2></div><div class="areas"><article class="area"><h3 class="h3">Mam stary dom</h3><p>Możemy pomóc uporządkować pierwsze kroki i wskazać, jakiego rodzaju specjalisty szukać. Nie zastępujemy projektanta, konstruktora ani konserwatora.</p></article><article class="area"><h3 class="h3">Jestem rzemieślnikiem lub ekspertem</h3><p>Napisz, czym się zajmujesz i gdzie działasz. Szukamy prowadzących warsztaty, konsultantów i współpracowników projektów.</p></article><article class="area"><h3 class="h3">Reprezentuję samorząd lub instytucję</h3><p>Rozmawiamy o projektach edukacyjnych, ochronie historycznej zabudowy, partnerstwach i współpracy systemowej.</p></article><article class="area"><h3 class="h3">Reprezentuję media</h3><p>Dobierzemy rozmówcę i przekażemy dostępne materiały prasowe.</p></article></div></div>';
          anchorSection.insertAdjacentElement("afterend", help);
        }
      }
    }

    if (path === "media.html") {
      document.querySelectorAll(".person").forEach(function (card) {
        var h = card.querySelector("h3");
        if (h && h.textContent.trim() === "Tomasz Prus") {
          var role = card.querySelector(".person-role");
          if (role) role.textContent = "Komunikacja, logistyka i organizacja wydarzeń";
        }
      });
    }
  }

  function initNav() {
    var toggle = document.querySelector(".nav-toggle");
    var nav = document.getElementById("nav");
    if (!toggle || !nav) return;
    function close() { toggle.setAttribute("aria-expanded", "false"); nav.setAttribute("data-open", "false"); }
    toggle.addEventListener("click", function () {
      var open = toggle.getAttribute("aria-expanded") === "true";
      toggle.setAttribute("aria-expanded", String(!open));
      nav.setAttribute("data-open", String(!open));
    });
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
    var opts = { long:{day:"numeric",month:"long",year:"numeric"}, short:{day:"numeric",month:"short",year:"numeric"}, month:{month:"long",year:"numeric"} };
    nodes.forEach(function (node) { var date = new Date(node.getAttribute("datetime")); if (isNaN(date)) return; var style=node.dataset.format||"long"; try { node.textContent=new Intl.DateTimeFormat(t("date.locale"),opts[style]||opts.long).format(date); } catch(e){} });
  }

  function initFilters() {
    var bar=document.querySelector(".filters"),list=document.getElementById("projects"); if(!bar||!list)return;
    var cards=Array.prototype.slice.call(list.querySelectorAll(".project")),buttons=Array.prototype.slice.call(bar.querySelectorAll(".filter")),empty=document.getElementById("projects-empty");
    buttons.forEach(function(btn){var value=btn.dataset.filter,n=value==="all"?cards.length:cards.filter(function(c){return c.dataset.category===value;}).length,slot=btn.querySelector(".filter-count");if(slot)slot.textContent=n;});
    function apply(value){var shown=0;cards.forEach(function(card){var match=value==="all"||card.dataset.category===value;card.hidden=!match;if(match)shown++;});buttons.forEach(function(btn){btn.setAttribute("aria-pressed",String(btn.dataset.filter===value));});if(empty)empty.hidden=shown>0;}
    bar.addEventListener("click",function(e){var btn=e.target.closest(".filter");if(btn)apply(btn.dataset.filter);});apply("all");
  }

  function initForms() {
    document.querySelectorAll("form[data-mailto]").forEach(function(form){var status=form.querySelector(".form-status");
      function setError(input,message){var slot=form.querySelector('[data-error-for="'+input.name+'"]');if(slot)slot.textContent=message||"";input.setAttribute("aria-invalid",message?"true":"false");}
      function validate(){var ok=true;form.querySelectorAll("[name]").forEach(function(input){if(input.type==="checkbox"){if(input.required&&!input.checked){setError(input,t("form.error.required"));ok=false;}else setError(input,"");return;}var value=(input.value||"").trim();if(input.required&&!value){setError(input,t("form.error.required"));ok=false;}else if(input.type==="email"&&value&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)){setError(input,t("form.error.email"));ok=false;}else setError(input,"");});return ok;}
      form.addEventListener("input",function(e){if(e.target.getAttribute("aria-invalid")==="true")validate();});form.addEventListener("change",function(e){if(e.target.getAttribute("aria-invalid")==="true")validate();});
      form.addEventListener("submit",function(e){e.preventDefault();if(!validate()){if(status)status.textContent=t("form.error.summary");var first=form.querySelector('[aria-invalid="true"]');if(first)first.focus();return;}var address=form.dataset.mailto,subjectField=form.querySelector('[name="temat"]'),subject=(subjectField&&subjectField.value.trim())||form.dataset.subject||"";var imie=form.querySelector('[name="imie"]'),email=form.querySelector('[name="email"]'),telefon=form.querySelector('[name="telefon"]'),wiadomosc=form.querySelector('[name="wiadomosc"]');var lines=[];if(imie)lines.push("Imię i nazwisko: "+imie.value.trim());if(email)lines.push("E-mail: "+email.value.trim());if(telefon&&telefon.value.trim())lines.push("Telefon: "+telefon.value.trim());if(subjectField)lines.push("Temat: "+subjectField.value.trim());if(wiadomosc)lines.push("","Wiadomość:",wiadomosc.value.trim());window.location.href="mailto:"+address+"?subject="+encodeURIComponent(subject)+"&body="+encodeURIComponent(lines.join("\r\n"));if(status)status.textContent=t("form.sending")+" "+t("form.fallback",{email:address});});
    });
  }

  function initYear(){document.querySelectorAll("[data-year]").forEach(function(el){el.textContent=new Date().getFullYear();});}
  function ready(fn){if(document.readyState!=="loading")fn();else document.addEventListener("DOMContentLoaded",fn);}

  ready(function(){initContentEnhancements();initNav();initReveal();initDates();initFilters();initForms();initYear();});
})();
