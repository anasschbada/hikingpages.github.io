<?php
// Copy this file to config.local.php on your PHP host (same "api" folder) and fill in your real
// MySQL 8.4 credentials. config.local.php is gitignored — never commit real credentials.
//
// If your host sets these as environment variables instead (common on some PaaS setups), you can
// skip this file entirely: rsvp.php falls back to getenv('DB_HOST') etc. when config.local.php
// is absent.

define('DB_HOST', '127.0.0.1');
define('DB_NAME', 'trail_brief');
define('DB_USER', 'trail_brief_user');
define('DB_PASS', 'change-me');
