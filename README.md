# Vaultcontor Website

Marketing-Website von Vaultcontor. Reines HTML, CSS und JavaScript, dazu ein PHP-Skript für das Demo-Formular. Kein Build-Schritt, keine Abhängigkeiten.

## Aufbau

```
webseite/                  Die komplette Website. Der INHALT dieses Ordners kommt ins Web-Verzeichnis.
server-einrichtung/        Vorlage für die Zugangsdaten des E-Mail-Versands. Kommt NICHT ins Web-Verzeichnis.
README.md                  Diese Datei.
```

### Seiten (`webseite/`)

| Datei | Inhalt |
|---|---|
| `index.html` | Startseite, unten auch das Demo-Formular |
| `funktionen.html` | Alle Funktionen |
| `assistent.html` | Der Assistent |
| `sicherheit.html` | Sicherheit |
| `pakete.html` | Pakete und Preise |
| `fragen.html` | Häufige Fragen |
| `demo.html` | Demo anfragen (Formular) |
| `404.html` | Fehlerseite „Seite nicht gefunden“ |
| `anfrage.php` | Verschickt das Demo-Formular per E-Mail an info@vaultcontor.de |

Gemeinsam genutzt:

- `assets/css/style.css`: das gesamte Design
- `assets/js/main.js`: Animationen, Menü, Formular-Logik
- `assets/fonts/`: Schrift Inter, lokal eingebunden (kein Google Fonts, DSGVO-freundlich)
- `favicon.svg`: Tab-Symbol

## Lokal ansehen

`webseite/index.html` doppelklicken. Alles funktioniert, nur das Formular verschickt lokal nichts. Es zeigt dann den Hinweis „Lokale Vorschau“. Verschickt wird erst, wenn die Seite auf einem Server mit PHP liegt.

## Auf den Server bringen

Voraussetzung: Webserver (nginx oder Apache) mit **PHP 7.4 oder neuer**.

1. Inhalt von `webseite/` ins Web-Verzeichnis hochladen, z. B. `/var/www/vaultcontor/html/`
2. `server-einrichtung/vaultcontor-mail.beispiel.php` **eine Ebene darüber** ablegen und dabei umbenennen in `vaultcontor-mail.php`:
   ```
   /var/www/vaultcontor/html/anfrage.php        ← Website
   /var/www/vaultcontor/vaultcontor-mail.php    ← Zugangsdaten
   ```
3. In `vaultcontor-mail.php` **auf dem Server** die SMTP-Daten von info@vaultcontor.de eintragen (Server, Port, Benutzer, Passwort). Die Daten stehen beim E-Mail-Anbieter unter „Einstellungen für Mailprogramme / Outlook / Thunderbird“.
4. Datei nur für PHP lesbar machen:
   ```
   chown root:www-data /var/www/vaultcontor/vaultcontor-mail.php
   chmod 640 /var/www/vaultcontor/vaultcontor-mail.php
   ```
5. 404-Seite im Webserver eintragen:
   - nginx: `error_page 404 /404.html;`
   - Apache (`.htaccess`): `ErrorDocument 404 /404.html`
6. **Testen:** Auf der Live-Seite eine Demo-Anfrage abschicken und prüfen, ob die Mail bei info@vaultcontor.de ankommt. „Antworten“ in der Mail geht direkt an den Interessenten.

> ⚠️ **Das echte Passwort kommt nie in dieses Repository.** Es steht nur in `vaultcontor-mail.php` auf dem Server. Die `.gitignore` verhindert, dass diese Datei versehentlich hochgeladen wird.

Fehlt `vaultcontor-mail.php`, versucht `anfrage.php` den Versand über die PHP-Funktion `mail()`. Das landet oft im Spam oder geht auf einem VPS gar nicht, deshalb besser SMTP einrichten.

Fehler beim Versand stehen im PHP-Fehlerprotokoll (Zeilen beginnen mit `Vaultcontor Demo-Anfrage:`).

### Schutz im Formular

- Unsichtbares Lockfeld gegen Spam-Bots
- Höchstens 5 Anfragen pro Stunde und IP-Adresse
- Alle Eingaben werden geprüft und bereinigt

## Änderungen machen

- Texte direkt in den `.html`-Dateien ändern.
- Kopf- und Fußbereich (Menü, Footer) stehen in **jeder** Seite einzeln. Wer dort etwas ändert, muss es in allen Seiten ändern.
- Nach Änderungen an `style.css` oder `main.js` die Versionsnummer in **allen** Seiten hochzählen, z. B. `style.css?v=5` → `style.css?v=6`. Sonst sehen Besucher noch die alte Version aus dem Browser-Cache. Aktuell: `?v=5`.

## Noch offen vor dem Livegang

- [ ] SMTP-Zugangsdaten auf dem Server eintragen (siehe oben)
- [ ] Formular auf dem Server einmal live testen
- [ ] Impressum, Datenschutzerklärung, AGB und Auftragsverarbeitung fehlen noch. Im Footer und unter dem Formular zeigen die Links aktuell auf `#`. **Impressum und Datenschutzerklärung sind in Deutschland Pflicht**, bevor die Seite öffentlich online geht.
