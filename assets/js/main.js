/* Fundacja Ruinersi na Dolnym Śląsku — skrypty strony. */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function initCurrentAssets() {
    var path = window.location.pathname.split("/").pop() || "index.html";
    if (path === "index.html") {
      var hero = document.querySelector(".hero-figure");
      if (hero) {
        hero.classList.remove("ph", "ph--banner"); hero.classList.add("hero-photo"); hero.innerHTML = "";
        var heroImg = document.createElement("img");
        heroImg.src = "assets/img/strona-glowna.jpg"; heroImg.alt = "Społeczność Ruinersów podczas spotkania"; heroImg.fetchPriority = "high"; heroImg.decoding = "async"; hero.appendChild(heroImg);
      }
    }
    if (path === "klaster.html") {
      var founderLogos = document.querySelectorAll(".founder-logos .founder-logo");
      [{index:1,src:"assets/img/domowprzyslupowych.jpg",alt:"Fundacja Dolina Domów Przysłupowych"},{index:3,src:"assets/img/dom-kolodzieja.png",alt:"Stowarzyszenie Dom Kołodzieja"}].forEach(function(asset){
        var slot=founderLogos[asset.index]; if(!slot)return; slot.classList.remove("ph"); slot.innerHTML="";
        var img=document.createElement("img"); img.src=asset.src; img.alt=asset.alt; img.loading="lazy"; slot.appendChild(img);
      });
      var founderLinks={"Fundacja Dolina Domów Przysłupowych":"https://www.facebook.com/dolinadomowprzyslupowych/?locale=pl_PL","Stowarzyszenie Gildia Przewodników Sudeckich – Zamek Wleń":"https://www.facebook.com/gildiaprzewodnikow/?locale=pl_PL","Stowarzyszenie Dom Kołodzieja":"https://www.domkolodzieja.pl/","Stowarzyszenie Wieża Książęca w Siedlęcinie":"https://wiezasiedlecin.pl/stowarzyszenie/"};
      document.querySelectorAll(".founder-name").forEach(function(node){var name=node.textContent.trim(),href=founderLinks[name];if(!href)return;var link=document.createElement("a");link.href=href;link.target="_blank";link.rel="noopener noreferrer";link.textContent=name;node.textContent="";node.appendChild(link);});
    }
    if(path==="o-fundacji.html"){var award=document.querySelector(".award-photo");if(award)award.src="assets/img/nagroda_ruinersi.jpg";}
  }

  function initFoundationTimelineLinks(){
    var path=window.location.pathname.split("/").pop()||"index.html";if(path!=="o-fundacji.html")return;
    var resources={
      "II Zlot Ruinersów · Bukowiec":[{label:"Relacja",href:"https://muratordom.pl/remont-domu/przebudowa/drugi-zlot-ruinersow-palac-bukowiec-opanowali-pasjonaci-renowacji-starych-domow-aa-um7V-92h8-VJgH.html"}],
      "Doroczna Nagroda MKiDN":[{label:"Artykuł",href:"https://jeleniagora.naszemiasto.pl/ruinersi-doradzaja-jak-ratowac-i-remontowac-domy-przyslupowe-na-dolnym-slasku-docenila-to-ministra-kultury-i-dziedzictwa-narodowego/ar/c1p2-28123543"}],
      "Powołanie Ogólnopolskiego Klastra Społecznej Ochrony Dziedzictwa":[{label:"Artykuł",href:"https://muratordom.pl/remont-domu/przebudowa/ogolnopolski-klaster-spolecznej-ochrony-dziedzictwa-oni-opiekuja-sie-obiektami-historycznymi-na-ktore-nie-zwracaly-uwagi-urzedy-aa-fyjB-f2k4-5zBD.html"}],
      "„Stare domy na Dolnym Śląsku…” · Lubomierz":[{label:"Wideo",href:"https://www.youtube.com/watch?v=Yyz4C2CJ49A"}],
      "Lokalnie budujemy przyszłość regionu":[{label:"Wideo",href:"https://www.youtube.com/watch?v=4exFCJeVyVU"}],
      "III Zlot Ruinersów · Lubomierz":[{label:"Relacja",href:"https://muratordom.pl/remont-domu/przebudowa/iii-zlot-ruinersow-w-lubomierzu-klasztorny-skwer-i-budynki-wypelnialy-dyskusje-porady-i-opowiesci-o-remontowanych-domach-takie-spotkania-dodaja-energii-mowili-uczestnicy-aa-Yzsi-sZcZ-BEgb.html"},{label:"Rozmowa",href:"https://muratordom.pl/remont-domu/przebudowa/remont-domu-im-niestraszny-maja-recepty-i-ludzi-ktorzy-wiedza-jak-to-robic-darek-borkowski-opowiada-o-ruinersach-i-ich-wplywie-na-remonty-na-dolnym-slasku-aa-wQPN-TVXa-W9Hw.html"},{label:"Wideo",href:"https://www.youtube.com/watch?v=FXv2UBRMsCE"}]
    };
    document.querySelectorAll(".rows .row").forEach(function(row){var name=row.querySelector(".row-name"),action=row.querySelector(".row-action");if(!name||!action)return;if(name.textContent.trim()==="Spotkanie z DWKZ i gminami Związku Gmin „Kwisa”")name.textContent="Lokalnie budujemy przyszłość regionu";var links=resources[name.textContent.trim()];if(!links)return;action.innerHTML="";action.style.display="flex";action.style.flexWrap="wrap";action.style.gap=".35rem .75rem";action.style.justifyContent="flex-end";links.forEach(function(item){var link=document.createElement("a");link.href=item.href;link.target="_blank";link.rel="noopener noreferrer";link.textContent=item.label;action.appendChild(link);});});
  }

  function initCommunityLinks(){
    var groups=[{name:"Ruinersi na Dolnym Śląsku",href:"https://www.facebook.com/groups/488002923561276"},{name:"Ruinersi – Stare Domy do Uratowania",href:"https://www.facebook.com/groups/1056930299816290"}];
    var root=document.querySelector("main");if(!root)return;var walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT),nodes=[];while(walker.nextNode())nodes.push(walker.currentNode);
    nodes.forEach(function(textNode){var parent=textNode.parentElement;if(!parent||parent.closest("a,script,style"))return;var text=textNode.nodeValue;if(!text)return;var matches=[];groups.forEach(function(group){var start=0;while((start=text.indexOf(group.name,start))!==-1){var prefix=text.slice(Math.max(0,start-9),start);if(prefix!=="Fundacja ")matches.push({start:start,end:start+group.name.length,group:group});start+=group.name.length;}});if(!matches.length)return;matches.sort(function(a,b){return a.start-b.start;});var fragment=document.createDocumentFragment(),cursor=0;matches.forEach(function(match){if(match.start<cursor)return;if(match.start>cursor)fragment.appendChild(document.createTextNode(text.slice(cursor,match.start)));var link=document.createElement("a");link.href=match.group.href;link.target="_blank";link.rel="noopener noreferrer";link.textContent=text.slice(match.start,match.end);fragment.appendChild(link);cursor=match.end;});if(cursor<text.length)fragment.appendChild(document.createTextNode(text.slice(cursor)));textNode.parentNode.replaceChild(fragment,textNode);});
  }

  function initNav(){var toggle=document.querySelector(".nav-toggle"),nav=document.getElementById("nav");if(!toggle||!nav)return;var mq=window.matchMedia("(max-width: 1240px)");function sync(){var open=toggle.getAttribute("aria-expanded")==="true";if(mq.matches&&!open)nav.setAttribute("inert","");else nav.removeAttribute("inert");}function close(){toggle.setAttribute("aria-expanded","false");nav.setAttribute("data-open","false");sync();}toggle.addEventListener("click",function(){var open=toggle.getAttribute("aria-expanded")==="true";toggle.setAttribute("aria-expanded",String(!open));nav.setAttribute("data-open",String(!open));sync();});document.addEventListener("keydown",function(e){if(e.key==="Escape"&&toggle.getAttribute("aria-expanded")==="true"){close();toggle.focus();}});if(mq.addEventListener)mq.addEventListener("change",sync);else mq.addListener(sync);sync();}

  function initReveal(){var items=document.querySelectorAll(".reveal");if(!items.length)return;if(reduceMotion||!("IntersectionObserver" in window)){items.forEach(function(el){el.classList.add("in");});return;}var io=new IntersectionObserver(function(entries){entries.forEach(function(entry){if(!entry.isIntersecting)return;entry.target.classList.add("in");io.unobserve(entry.target);});},{rootMargin:"0px 0px -6% 0px",threshold:.06});items.forEach(function(el){io.observe(el);});}

  function initDates(){var opts={long:{day:"numeric",month:"long",year:"numeric"},short:{day:"numeric",month:"short",year:"numeric"},month:{month:"long",year:"numeric"}};document.querySelectorAll("time[datetime][data-format]").forEach(function(node){var d=new Date(node.getAttribute("datetime"));if(isNaN(d))return;try{node.textContent=new Intl.DateTimeFormat("pl-PL",opts[node.dataset.format]||opts.long).format(d);}catch(e){}});}

  function initFilters(){var bar=document.querySelector(".filters"),list=document.getElementById("projects");if(!bar||!list)return;var cards=Array.prototype.slice.call(list.querySelectorAll(".project")),buttons=Array.prototype.slice.call(bar.querySelectorAll(".filter")),empty=document.getElementById("projects-empty");buttons.forEach(function(btn){var v=btn.dataset.filter,n=v==="all"?cards.length:cards.filter(function(c){return c.dataset.category===v;}).length,s=btn.querySelector(".filter-count");if(s)s.textContent=n;});function apply(v){var shown=0;cards.forEach(function(c){var m=v==="all"||c.dataset.category===v;c.hidden=!m;if(m)shown++;});buttons.forEach(function(b){b.setAttribute("aria-pressed",String(b.dataset.filter===v));});if(empty)empty.hidden=shown>0;}bar.addEventListener("click",function(e){var b=e.target.closest(".filter");if(b)apply(b.dataset.filter);});apply("all");}

  function initForms(){document.querySelectorAll("form[data-mailto]").forEach(function(form){var status=form.querySelector(".form-status");function err(i,m){var s=form.querySelector('[data-error-for="'+i.name+'"]');if(s)s.textContent=m||"";i.setAttribute("aria-invalid",m?"true":"false");}function validate(){var ok=true;form.querySelectorAll("[name]").forEach(function(i){if(i.type==="checkbox"){if(i.required&&!i.checked){err(i,"To pole jest wymagane.");ok=false;}else err(i,"");return;}var v=(i.value||"").trim();if(i.required&&!v){err(i,"To pole jest wymagane.");ok=false;}else if(i.type==="email"&&v&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)){err(i,"Podaj poprawny adres e-mail.");ok=false;}else err(i,"");});return ok;}form.addEventListener("submit",function(e){e.preventDefault();if(!validate()){if(status)status.textContent="Uzupełnij zaznaczone pola.";var f=form.querySelector('[aria-invalid="true"]');if(f)f.focus();return;}var a=form.dataset.mailto,s=form.querySelector('[name="temat"]'),subject=(s&&s.value.trim())||form.dataset.subject||"",lines=[];[["Imię i nazwisko","imie"],["E-mail","email"],["Telefon","telefon"],["Temat","temat"]].forEach(function(x){var n=form.querySelector('[name="'+x[1]+'"]');if(n&&n.value.trim())lines.push(x[0]+": "+n.value.trim());});var w=form.querySelector('[name="wiadomosc"]');if(w)lines.push("","Wiadomość:",w.value.trim());window.location.href="mailto:"+a+"?subject="+encodeURIComponent(subject)+"&body="+encodeURIComponent(lines.join("\r\n"));if(status)status.textContent="Otwieramy Twój program pocztowy z gotową wiadomością.";});});}

  function initSocialFooter(){
    var list=document.querySelector('#foot-obserwuj + ul');
    if(!list)return;
    [{label:"Facebook",href:"https://www.facebook.com/fundacjaruinersi"},{label:"Instagram",href:"https://www.instagram.com/fundacjaruinersi/"}].forEach(function(item){
      var exists=Array.prototype.some.call(list.querySelectorAll("a"),function(a){return a.href.indexOf(item.href.replace(/\/$/,""))===0;});
      if(exists)return;
      var li=document.createElement("li"),a=document.createElement("a");a.href=item.href;a.target="_blank";a.rel="noopener noreferrer";a.textContent=item.label;li.appendChild(a);list.insertBefore(li,list.firstChild);
    });
  }

  function initYear(){document.querySelectorAll("[data-year]").forEach(function(el){el.textContent=new Date().getFullYear();});}
  function ready(fn){if(document.readyState!=="loading")fn();else document.addEventListener("DOMContentLoaded",fn);}
  ready(function(){initCurrentAssets();initFoundationTimelineLinks();initCommunityLinks();initNav();initReveal();initDates();initFilters();initForms();initSocialFooter();initYear();});
})();