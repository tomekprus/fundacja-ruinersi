# Strona Fundacji Ruinersi na Dolnym Śląsku

Adres: **https://ruinersi.org**

To zwykła strona z plików HTML. Nie ma tu żadnego systemu, wtyczek ani panelu
administracyjnego. Otwierasz plik w edytorze, zmieniasz tekst, wysyłasz na
GitHuba — po minucie widać zmianę na żywej stronie. Tyle.

Taki wybór ma cenę i warto ją znać z góry: **nagłówek i stopka są skopiowane
do każdego pliku osobno**. Jeśli zmieniasz coś w menu albo w stopce, musisz to
zmienić w każdym pliku. W katalogu `.tools` są skrypty, które robią to za Ciebie
(patrz niżej).

---

## Jak obejrzeć stronę u siebie, zanim wyślesz zmiany

Możesz po prostu kliknąć dwa razy na `index.html` i większość rzeczy zadziała.
Ale niektóre elementy — baner cookies, przechodzenie między stronami — działają
poprawnie tylko przez serwer. Postawienie go to jedna komenda w terminalu,
w folderze z projektem:

```
python -m http.server 8765
```

Potem wpisujesz w przeglądarce `http://localhost:8765`. Żeby zatrzymać, wracasz
do terminala i naciskasz Ctrl+C.

## Jak wysłać zmiany na stronę

```
git add -A
git commit -m "krótki opis, co zmieniłem"
git push
```

Strona przebudowuje się sama, zwykle w ciągu minuty. Jeśli po kilku minutach nic
się nie zmieniło, zajrzyj w zakładkę **Actions** na GitHubie — tam widać, czy
publikacja się udała.

**Ważne:** zmiany w plikach CSS mogą się nie pokazać, bo przeglądarka trzyma
stary arkusz w pamięci. Dlatego w każdym pliku HTML adres arkusza ma na końcu
`?v=20260813-4`. Zmieniłeś CSS? Podbij tę datę **we wszystkich plikach naraz**
(np. na `?v=20260814`), inaczej część odwiedzających zobaczy stary wygląd.

---

## Co gdzie leży

| Plik | Co to jest |
|---|---|
| `index.html` | strona główna |
| `o-fundacji.html` | misja, ludzie, historia, dane rejestrowe, dokumenty |
| `klaster.html` | Ogólnopolski Klaster Społecznej Ochrony Dziedzictwa |
| `projekty.html` | lista projektów |
| `wiedza.html` | publikacje, materiały, mapa fachowców |
| `media.html` | materiały dla mediów, kontakt prasowy |
| `kontakt.html` | formularz i dane kontaktowe |
| `wesprzyj.html` | wsparcie, Patronite, przelew |
| `prywatnosc.html` | polityka prywatności i zmiana zgody na statystyki |
| `404.html` | strona pokazywana przy błędnym adresie |
| `aktualnosci.html` | **wyłączona** — pusta, oznaczona jako niewidoczna dla Google |
| `materialy-edukacyjne.html` | tylko przekierowanie na `wiedza.html`, nie ruszaj |

```
assets/css/style.css           cały wygląd strony, podzielony na numerowane sekcje
assets/css/accessibility.css   poprawki kontrastu i obramowań — czytaj: dostępność
assets/js/main.js              menu, daty, zdjęcia, odnośniki
assets/js/zgoda.js             baner cookies i statystyki
assets/img/                    zdjęcia i logotypy
assets/docs/                   statut i odpis KRS w PDF
CNAME                          nazwa domeny — nie usuwaj tego pliku
sitemap.xml, robots.txt        informacje dla Google
```

---

## Rzeczy, które łatwo zepsuć

### 1. Jedna literówka w JavaScripcie wyłącza pół strony

To się już zdarzyło i warto wiedzieć, dlaczego. Cały `main.js` jest jedną wielką
funkcją. Jeśli gdziekolwiek w środku będzie błąd składni, przeglądarka **nie
wykona nic** z tego pliku — padnie menu na telefonie, formatowanie dat, część
zdjęć i odnośników naraz. Nie zobaczysz komunikatu o błędzie; rzeczy po prostu
przestaną się pojawiać.

Dlatego **po każdej zmianie w plikach `.js`** uruchom to:

```
node --check assets/js/main.js
node --check assets/js/zgoda.js
```

Jeśli nic nie wypisze — jest dobrze. Jeśli wypisze `SyntaxError` z numerem linii,
nie wysyłaj zmian, dopóki tego nie naprawisz. To zajmuje dwie sekundy i raz już
uratowałoby kilka tygodni pracy.

### 2. Część treści jest w JavaScripcie, nie w HTML

Niektóre zdjęcia, logotypy i odnośniki nie są wpisane w plikach HTML, tylko
dodawane przez `main.js` już w przeglądarce. Jeśli szukasz jakiegoś tekstu
w plikach HTML i go nie znajdujesz — poszukaj w `assets/js/main.js`.

Docelowo lepiej to przenosić do HTML, kawałek po kawałku. Wszystko, co jest
w HTML, jest odporne na awarie i widoczne dla Google.

### 3. Zdjęcia bywają absurdalnie ciężkie

Zdjęcia potrafią zaskoczyć wagą. Kiedyś jeden logotyp w tym projekcie
ważył 12 MB przy wyświetlaniu w polu wielkości znaczka pocztowego. Zanim wrzucisz
zdjęcie:

- zapisz je w **WebP**, nie PNG (PNG ma sens tylko przy przezroczystym tle),
- szerokość maksymalnie **1200 px** dla zwykłych zdjęć, **2000 px** dla dużego
  zdjęcia na górze strony głównej,
- celuj poniżej 200 kB na plik.

Cały katalog `assets/img` waży teraz około 1,9 MB. Jeśli zacznie rosnąć do
kilkunastu megabajtów, coś poszło nie tak.

Nie używaj polskich znaków w nazwach plików — `jak_budować.png` powodował
problemy w adresach. Pisz `jak-budowac.webp`.

---

## Baner cookies i statystyki

Strona używa Google Analytics, ale **wyłącznie po zgodzie odwiedzającego**. Nie
jest to kosmetyka: skrypt Google w ogóle nie trafia na stronę, dopóki ktoś nie
kliknie „Zgadzam się". Kliknięcie „Nie zgadzam się" oznacza, że nie zostanie
wczytany nigdy.

Wszystko siedzi w `assets/js/zgoda.js` — celowo osobno od `main.js`, żeby awaria
jednego nie unieruchamiała drugiego.

Jeśli zmieniasz cokolwiek w tym pliku albo w polityce prywatności, uruchom:

```
node .tools/test-zgoda.js
```

Powinno wypisać `WSZYSTKO OK`. To 48 automatycznych sprawdzeń, między innymi
tego, czy Google naprawdę nie wczytuje się przed zgodą i czy polityka
prywatności nie rozjechała się z tym, co robi kod. Jeśli coś wypisze `FAIL`,
przeczytaj opis — mówi wprost, co przestało się zgadzać.

**Czego nie zmieniać bez zastanowienia:**

- Oba przyciski wyglądają identycznie. To nie przypadek — wyróżnianie „Zgadzam
  się" kolorem jest uznawane za manipulację i bywa podstawą kar.
- Odnośnik „Prywatność" w stopce musi zostać. Prawo wymaga, żeby wycofanie zgody
  było tak samo łatwe jak jej udzielenie, a to jedyne miejsce, gdzie się to da.
- Polityka prywatności podaje nazwę Google Analytics, transfer danych do USA
  i 13 miesięcy. Od kiedy baner mówi ogólnie o ciasteczkach, to jedyne miejsce,
  gdzie te informacje występują.

Jedna rzecz jest **poza tym projektem**: okres przechowywania danych ustawia się
w panelu Google Analytics (Administracja → Ustawienia danych → Przechowywanie
danych). Z plików tego nie zmienisz.

---

## Formularz kontaktowy

Formularz wysyła wiadomości przez **Web3Forms** — darmową usługę pośredniczącą,
bo sama strona z plików nie umie wysyłać maili. Klucz jest wpisany w
`kontakt.html`. Jeśli wiadomości przestaną przychodzić, najpierw sprawdź
skrzynkę na web3forms.com.

## Czcionki

Strona używa **Bitter** (nagłówki) i **Mulish** (tekst) z Google Fonts.

Pierwotny projekt zakładał komercyjne kroje Museo Slab i Museo Sans. Zostały
odpuszczone świadomie — licencja na użycie w sieci to osobny, płatny produkt,
a dodatkowo to repozytorium jest publiczne, więc pliki czcionek mógłby pobrać
każdy, na co większość licencji nie pozwala. Bitter i Mulish wyglądają dobrze
i są darmowe. Sprawa zamknięta; nie ma po nich śladów w CSS.

---

## Skrypty pomocnicze w `.tools`

Uruchamia się je z folderu projektu. **Bez** `--write` tylko pokazują, co by
zmieniły — zawsze najpierw zobacz podgląd.

```
node .tools/set-site-url.js https://ruinersi.org --write
```
Ustawia adres strony we wszystkich plikach naraz: `canonical`, `og:url`,
`sitemap.xml`, `robots.txt`. Przydaje się przy zmianie domeny. **Uwaga:** ten
skrypt nie umie usunąć podkatalogu z adresów w `sitemap.xml` — po uruchomieniu
zajrzyj do tego pliku i sprawdź, czy adresy wyglądają jak
`https://ruinersi.org/kontakt.html`, a nie `https://ruinersi.org/cokolwiek/kontakt.html`.

```
node .tools/fix-nav.js --write
node .tools/fix-footer.js --write
node .tools/fix-retired-links.js --write
```
Wyrównują menu, stopkę i usuwają odnośniki do stron, których już nie ma —
we wszystkich plikach naraz. Używaj po dodaniu lub usunięciu strony.

```
node .tools/format-css.js --write
```
Porządkuje formatowanie `style.css`.

```
node .tools/test-zgoda.js
```
Sprawdza baner cookies (opisane wyżej).

---

## Co jeszcze zostało do zrobienia

W kodzie są **czerwone plakietki „do uzupełnienia"** — widać je na żywej
stronie, więc warto się ich pozbyć. Szukaj `class="todo"`:

| Gdzie | Ile | Czego brakuje |
|---|---|---|
| `media.html` | 4 | paczka z logotypami i materiałami dla mediów |
| `klaster.html` | 2 | dokumenty Klastra |
| `o-fundacji.html` | 1 | sprawozdania i standardy ochrony małoletnich |
| `wiedza.html` | 1 | okładka i link do jednej z publikacji |

Poza tym:

- W stopce nie ma odnośników do Facebooka i Instagrama w HTML — dodaje je
  `main.js`. Lepiej byłoby wpisać je normalnie.
- Statut i odpis KRS są już podpięte na `o-fundacji.html`.
- Strona `aktualnosci.html` jest pusta i wyłączona. Jeśli kiedyś wróci, jej
  poprzednia treść jest w historii Gita.

## Gdyby treści bardzo przybyło

Kopiowanie nagłówka i stopki do każdego pliku przestanie się opłacać, kiedy stron
będzie kilkadziesiąt. Wtedy warto przenieść projekt na generator stron
(Astro, Eleventy) — CSS można zabrać bez zmian, bo nic w nim nie zakłada
konkretnej strony. Ale przy dzisiejszych dwunastu plikach to byłoby dodawanie
sobie pracy.

## Notatki z decyzji

W `docs/superpowers/` leżą zapiski z ustaleń — dlaczego baner cookies wygląda
tak, a nie inaczej, i co po drodze odrzucono. Jeśli kiedyś zastanowisz się
„dlaczego to zrobiono w ten sposób", odpowiedź jest prawdopodobnie tam.
