<?php
/* =====================================================================
   Vaultcontor · Demo-Anfrage
   Nimmt das Formular von demo.html entgegen und schickt es per E-Mail
   an info@vaultcontor.de.

   Versand:
   - Liegt eine Datei "vaultcontor-mail.php" EINE EBENE ÜBER dem
     Web-Verzeichnis, wird per SMTP mit diesen Zugangsdaten gesendet
     (empfohlen, landet zuverlässig im Postfach).
   - Sonst wird die PHP-Funktion mail() des Servers verwendet.
   ===================================================================== */

declare(strict_types=1);

const EMPFAENGER  = 'info@vaultcontor.de';
const MAX_PRO_STD = 5;   // höchstens so viele Anfragen pro Stunde und IP-Adresse

const BRANCHEN = ['Dachdecker', 'Bau', 'Schreiner', 'Elektro', 'Sanitär und Heizung', 'Maler', 'Garten',
                  'Reinigung und Hausmeisterservice', 'IT-Support', 'Anderes Handwerk', 'Andere Dienstleistung'];
const PAKETE   = ['Noch unsicher', 'Start', 'Standard', 'Pro'];

date_default_timezone_set('Europe/Berlin');

$alsJson = stripos($_SERVER['HTTP_ACCEPT'] ?? '', 'application/json') !== false;

/* ---------- Antwort an den Browser ---------- */
function antwort(bool $ok, string $meldung, int $status = 200): void
{
    global $alsJson;
    http_response_code($status);
    header('Cache-Control: no-store');
    header('X-Content-Type-Options: nosniff');

    if ($alsJson) {
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode(['ok' => $ok, 'meldung' => $meldung], JSON_UNESCAPED_UNICODE);
        exit;
    }

    // Ohne JavaScript: einfache Seite im Stil der Website
    header('Content-Type: text/html; charset=utf-8');
    $titel = $ok ? 'Danke, ist angekommen.' : 'Das hat leider nicht geklappt.';
    $m = htmlspecialchars($meldung, ENT_QUOTES, 'UTF-8');
    if (!$ok) $m .= ' Oder schreib uns direkt an <a href="mailto:' . EMPFAENGER . '" style="text-decoration:underline">' . EMPFAENGER . '</a>.';
    echo '<!doctype html><html lang="de"><head><meta charset="utf-8">'
       . '<meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex">'
       . '<title>' . $titel . ' – Vaultcontor</title><link rel="icon" href="favicon.svg" type="image/svg+xml">'
       . '<link rel="stylesheet" href="assets/css/style.css"></head><body>'
       . '<main><section class="nf page-top"><div class="wrap"><div class="sec-h">'
       . '<span class="eyebrow">Demo anfragen</span><h1>' . $titel . '</h1><p>' . $m . '</p></div>'
       . '<div class="hero-cta"><a href="index.html" class="btn lime">Zur Startseite</a>'
       . '<a href="demo.html" class="btn">Zurück zum Formular</a></div></div></section></main></body></html>';
    exit;
}

/* ---------- Eingaben prüfen ---------- */
function feld(string $name, int $max): string
{
    $v = $_POST[$name] ?? '';
    if (!is_string($v) || preg_match('//u', $v) !== 1) return '';      // nur gültiges UTF-8
    $v = preg_replace('/[\x00-\x1F\x7F]+/u', ' ', $v);                   // keine Steuerzeichen / Zeilenumbrüche
    $v = trim(preg_replace('/\s{2,}/u', ' ', $v));
    return function_exists('mb_substr') ? mb_substr($v, 0, $max, 'UTF-8') : substr($v, 0, $max);
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    header('Allow: POST');
    antwort(false, 'Bitte nutze das Formular auf der Seite „Demo anfragen“.', 405);
}

// Lockfeld für Spam-Programme: Menschen sehen es nicht und lassen es leer
if (feld('website', 200) !== '') {
    antwort(true, 'Wir melden uns innerhalb eines Werktags bei dir.');
}

$name    = feld('name', 100);
$firma   = feld('firma', 150);
$email   = feld('email', 200);
$branche = feld('branche', 60);
$paket   = feld('paket', 30);

if ($name === '' || $firma === '' || filter_var($email, FILTER_VALIDATE_EMAIL) === false) {
    antwort(false, 'Bitte fülle Name, Betrieb und eine gültige E-Mail-Adresse aus.', 422);
}
if (!in_array($branche, BRANCHEN, true)) $branche = 'Keine Angabe';
if (!in_array($paket, PAKETE, true))     $paket   = 'Noch unsicher';

/* ---------- Begrenzung: höchstens MAX_PRO_STD Anfragen pro Stunde und IP ---------- */
$ip    = $_SERVER['REMOTE_ADDR'] ?? 'unbekannt';
$datei = sys_get_temp_dir() . '/vaultcontor-anfrage-' . hash('sha256', $ip) . '.json';
$jetzt = time();
$fh    = @fopen($datei, 'c+');
if ($fh !== false) {
    flock($fh, LOCK_EX);
    $zeiten = json_decode((string) stream_get_contents($fh), true);
    $zeiten = array_values(array_filter(is_array($zeiten) ? $zeiten : [], fn($t) => is_int($t) && $t > $jetzt - 3600));
    if (count($zeiten) >= MAX_PRO_STD) {
        flock($fh, LOCK_UN);
        fclose($fh);
        antwort(false, 'Es kamen gerade sehr viele Anfragen von deinem Anschluss. Bitte versuche es später noch einmal.', 429);
    }
    $zeiten[] = $jetzt;
    ftruncate($fh, 0);
    rewind($fh);
    fwrite($fh, json_encode($zeiten));
    flock($fh, LOCK_UN);
    fclose($fh);
}

/* ---------- E-Mail zusammenbauen ---------- */
function kodiert(string $s): string
{
    return '=?UTF-8?B?' . base64_encode($s) . '?=';
}

$konfigDatei = dirname(__DIR__) . '/vaultcontor-mail.php';
$konfig = is_file($konfigDatei) ? (include $konfigDatei) : [];
if (!is_array($konfig)) $konfig = [];
$absender = filter_var($konfig['absender'] ?? '', FILTER_VALIDATE_EMAIL) ?: EMPFAENGER;
$domain   = substr(strrchr($absender, '@'), 1);

$betreff = 'Demo-Anfrage: ' . $firma;
$text = "Neue Demo-Anfrage über die Website\r\n\r\n"
      . "Name:     $name\r\n"
      . "Betrieb:  $firma\r\n"
      . "E-Mail:   $email\r\n"
      . "Branche:  $branche\r\n"
      . "Paket:    $paket\r\n\r\n"
      . 'Eingegangen am ' . date('d.m.Y') . ' um ' . date('H:i') . " Uhr.\r\n"
      . "Auf diese E-Mail antworten schreibt direkt an $name.\r\n";
$inhalt = rtrim(chunk_split(base64_encode($text), 76, "\r\n"));

$kopf = [
    'Date: ' . date('r'),
    'From: ' . kodiert('Vaultcontor Website') . " <$absender>",
    'Reply-To: ' . kodiert($name) . " <$email>",
    'Message-ID: <' . bin2hex(random_bytes(16)) . "@$domain>",
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: base64',
];

/* ---------- Versand per SMTP ---------- */
function smtp_senden(array $k, string $von, string $an, string $daten, string $domain): void
{
    $host   = (string) $k['smtp_host'];
    $port   = (int) ($k['smtp_port'] ?? 587);
    $direkt = $port === 465;   // 465 = SSL von Anfang an, sonst STARTTLS
    $ctx = stream_context_create(['ssl' => ['verify_peer' => true, 'verify_peer_name' => true, 'peer_name' => $host]]);
    $fp = @stream_socket_client(($direkt ? 'ssl://' : 'tcp://') . "$host:$port", $nr, $fehler, 20, STREAM_CLIENT_CONNECT, $ctx);
    if ($fp === false) throw new RuntimeException("Keine Verbindung zu $host:$port ($fehler)");
    stream_set_timeout($fp, 20);

    $lesen = function (array $erwartet) use ($fp): void {
        $antwort = '';
        while (($zeile = fgets($fp, 1024)) !== false) {
            $antwort .= $zeile;
            if (strlen($zeile) < 4 || $zeile[3] !== '-') break;
        }
        if (!in_array((int) substr($antwort, 0, 3), $erwartet, true)) {
            throw new RuntimeException('SMTP-Antwort: ' . trim($antwort));
        }
    };
    $befehl = function (string $zeile, array $erwartet) use ($fp, $lesen): void {
        fwrite($fp, $zeile . "\r\n");
        $lesen($erwartet);
    };

    try {
        $lesen([220]);
        $befehl("EHLO $domain", [250]);
        if (!$direkt) {
            $befehl('STARTTLS', [220]);
            $methode = STREAM_CRYPTO_METHOD_TLSv1_2_CLIENT;
            if (defined('STREAM_CRYPTO_METHOD_TLSv1_3_CLIENT')) $methode |= STREAM_CRYPTO_METHOD_TLSv1_3_CLIENT;
            if (stream_socket_enable_crypto($fp, true, $methode) !== true) throw new RuntimeException('STARTTLS fehlgeschlagen');
            $befehl("EHLO $domain", [250]);
        }
        $befehl('AUTH LOGIN', [334]);
        $befehl(base64_encode((string) $k['smtp_user']), [334]);
        $befehl(base64_encode((string) $k['smtp_pass']), [235]);
        $befehl("MAIL FROM:<$von>", [250]);
        $befehl("RCPT TO:<$an>", [250, 251]);
        $befehl('DATA', [354]);
        fwrite($fp, preg_replace('/^\./m', '..', $daten) . "\r\n.\r\n");
        $lesen([250]);
        @fwrite($fp, "QUIT\r\n");
    } finally {
        fclose($fp);
    }
}

$smtpBereit = !empty($konfig['smtp_host']) && !empty($konfig['smtp_user']) && !empty($konfig['smtp_pass'])
           && strpos((string) $konfig['smtp_pass'], 'HIER-') !== 0;

try {
    if ($smtpBereit) {
        $daten = implode("\r\n", array_merge(['To: <' . EMPFAENGER . '>', 'Subject: ' . kodiert($betreff)], $kopf))
               . "\r\n\r\n" . $inhalt;
        smtp_senden($konfig, $absender, EMPFAENGER, $daten, $domain);
    } else {
        $ok = mail(EMPFAENGER, kodiert($betreff), $inhalt, implode("\r\n", $kopf), '-f' . $absender);
        if (!$ok) throw new RuntimeException('mail() hat den Versand abgelehnt');
    }
} catch (Throwable $e) {
    error_log('Vaultcontor Demo-Anfrage: ' . $e->getMessage());
    antwort(false, 'Die Anfrage konnte gerade nicht verschickt werden.', 500);
}

antwort(true, 'Wir melden uns innerhalb eines Werktags bei dir.');
