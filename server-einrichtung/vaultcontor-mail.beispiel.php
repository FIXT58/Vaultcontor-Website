<?php
/* =====================================================================
   Zugangsdaten für den Versand der Demo-Anfragen (SMTP)

   DIES IST NUR DIE VORLAGE. Das echte Passwort NIE hier eintragen,
   diese Datei liegt auf GitHub.
   Auf dem Server kopieren und umbenennen in "vaultcontor-mail.php",
   dann DORT die Daten eintragen.

   WICHTIG: Die Datei gehört NICHT ins Web-Verzeichnis, sondern
   EINE EBENE DARÜBER. Beispiel:
       /var/www/vaultcontor/html/anfrage.php        ← Website
       /var/www/vaultcontor/vaultcontor-mail.php    ← diese Datei

   Trag hier die Daten des Postfachs info@vaultcontor.de ein, so wie
   sie dein E-Mail-Anbieter für Mailprogramme (Outlook, Thunderbird)
   angibt. Beispiele für den Postausgangsserver:
       IONOS     smtp.ionos.de        Port 587
       Strato    smtp.strato.de       Port 587
       Microsoft smtp.office365.com   Port 587
   Port 587 = STARTTLS, Port 465 = SSL. Beides funktioniert.
   ===================================================================== */

return [
    'smtp_host' => 'smtp.DEIN-ANBIETER.de',
    'smtp_port' => 587,
    'smtp_user' => 'info@vaultcontor.de',
    'smtp_pass' => 'HIER-PASSWORT-EINTRAGEN',
    'absender'  => 'info@vaultcontor.de',
];
