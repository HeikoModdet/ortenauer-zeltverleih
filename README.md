# Ortenauer Zeltverleih – modernisierte Website

Modernisierte, statische Neuauflage der Website `ortenauer-zeltverleih.de`.
- **Texte & Bilder bleiben original** (aus dem Mirror übernommen)
- **Moderne Party-Effekte**: animierte Konfetti-Partikel, Glassmorphism, Scroll-Animationen, Farbverläufe, Hover-Effekte
- **Formular funktioniert**: öffnet das E-Mail-Programm mit fertig ausgefüllter Anfrage (kein Server nötig)
- **Admin-Panel** (login-geschützt, nur für den Administrator)
- **GitHub Pages hostbar** – einfach per Git-Commit aktualisieren

> Das **Original bleibt als Backup** unter `/home/hermes/Projekte/ortenauer-zeltverleih/` (vollständiger wget-Mirror, 243 Dateien).

---

## Projektstruktur

```
ortenauer-zeltverleih-neu/
├── index.html          → Startseite (Hero, Über, Leistungen, Referenzen, Partner, Kontakt)
├── impressum.html      → Impressum (Original-Text)
├── datenschutz.html    → Datenschutz (kompletter Original-Text)
├── admin.html          → Admin-Panel (login-geschützt)
├── content/
│   └── site.json       → ☑ alle Texte/Bilder/Kontaktdaten als editierbare Datenquelle
├── css/style.css       → Design & Animationen
├── js/
│   ├── main.js         → lädt site.json, rendert Inhalt, Partikel, Formular
│   ├── pages.js        → Nav-Toggle für Unterseiten
│   └── auth.js         → Admin-Passwort-Hash (Zugangskontrolle)
└── images/             → alle Original-Bilder
```

---

## Wie ändere ich Texte & Bilder? (2 Wege)

### Weg A – Admin-Panel (empfohlen, ohne Code)
1. `admin.html` öffnen (lokal oder auf der gehosteten Seite: `/admin.html`)
2. Mit dem **Admin-Passwort** anmelden
3. Inhalte bearbeiten (Texte, Zelte, Referenzen, Partner, Kontaktdaten), Bilder per Galerie wählen
4. **Speichern** → **Export JSON** → Datei als `content/site.json` übernehmen & auf GitHub committen

### Weg B – direkt in der JSON
`content/site.json` ist eine einfache Datenquelle. Alle angezeigten Texte und Bildpfade stehen dort. Nach dem Ändern neu hochladen bzw. committen.

---

## Admin-Passwort

Das Admin-Passwort ist **gehasht** in `js/auth.js` hinterlegt (kein Klartext).

**Aktuelles Admin-Passwort:**

```
pQ6aDtceGfEqEbrj
```

⚠️ Dieses Passwort sofort nach dem ersten Einloggen über das Admin-Panel bzw. vor der Veröffentlichung ändern.

### Passwort ändern
1. Neues Passwort wählen, z. B. `MeinNeuesPasswort2026`
2. SHA-256-Hash erzeugen:
   ```bash
   printf '%s' 'MeinNeuesPasswort2026' | sha256sum | cut -d' ' -f1
   ```
3. Wert in `js/auth.js` ersetzen:
   ```js
   var OZ_ADMIN_HASH = "<neuer-hash>";
   ```
4. Comitten – nur das gehostete `auth.js` zählt (der Admin loggt sich gegen die gehostete Version an).

Sicherheits-Hinweis: Das Admin-Panel ergänzt bestenfalls eine *Zugangsschranke* für unautorisierte Nutzer. Für echte Mehraugen-Sicherheit sollte es nur über eine URL aufgerufen werden, die nicht verlinkt ist, und zusätzlich durch GitHub-Seiten-Schutz (siehe unten) abgesichert werden.

---

## Auf GitHub Pages publizieren

Der `config`-Freund: Die Seite ist rein statisch und kann auf jede GitHub-Pages-Struktur (User-Site `meinname.github.io` oder Repo-Projekt-Seite `meinname/ortename-zeltverleih`) kopiert werden.

Beispiel (ein eigenes GitHub-Repo `ortenauer-zeltverleih`):
```bash
cd /home/hermes/Projekte/ortenauer-zeltverleih-neu
git init
git add .
git commit -m "Modernisierte Website – Ortenauer Zeltverleih"
git branch -M main
gh repo create ortenauer-zeltverleih --public --source=. --push
# Seiten aktivieren (einmalig):
gh api -X POST repos/<USER>/ortenauer-zeltverleih/pages \
  -f 'source[branch]=main' -f 'source[path]=/'
```
Danach ist die Seite online unter:
`https://<USER>.github.io/ortenauer-zeltverleih/`

Auf GitHub Pages **lagert der Seiten-Build** dem Push bis zu 1–3 Minuten hinterher – nach dem Push kurz warten, dann live prüfen.

---

## Formular

Das Formular funktioniert ohne Server: Nach Absenden öffnet es das E-Mail-Programm mit einer **fertig ausgefüllten E-Mail** an
`info@ortenauer-zeltverleih.de` (Betreff, Anrede, alle Felder). Empfänger-Adresse änderst du in `content/site.json` unter `form.mailto`.

---

## Lokal testen

Ohne Server funktioniert der JSON-Fetch mancher Browser nicht. Am besten einen Mini-Server starten:
```bash
cd /home/hermes/Projekte/ortenauer-zeltverleih-neu
python3 -m http.server 8000
# → http://localhost:8000
```