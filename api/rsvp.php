<?php
declare(strict_types=1);

// Minimal JSON API backing the shared RSVP list in a MySQL 8.4 database.
// GET  -> [{"name": "..."}, ...]  ordered by signup time
// POST -> {"name": "..."} JSON body, inserts one RSVP
//
// Deploy this file (with config.local.php next to it, see config.example.php) on any PHP 8+ host
// that can reach your MySQL 8.4 server, then point the site's RSVP_API_URL at its public URL.

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

$configFile = __DIR__ . '/config.local.php';
if (is_file($configFile)) {
    require $configFile;
} else {
    define('DB_HOST', getenv('DB_HOST') ?: '127.0.0.1');
    define('DB_NAME', getenv('DB_NAME') ?: 'trail_brief');
    define('DB_USER', getenv('DB_USER') ?: '');
    define('DB_PASS', getenv('DB_PASS') ?: '');
}

try {
    $pdo = new PDO(
        'mysql:host=' . DB_HOST . ';dbname=' . DB_NAME . ';charset=utf8mb4',
        DB_USER,
        DB_PASS,
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database connection failed']);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $stmt = $pdo->query('SELECT name FROM rsvps ORDER BY created_at ASC');
    echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
    exit;
}

if ($method === 'POST') {
    $body = json_decode((string)file_get_contents('php://input'), true);
    if (!is_array($body)) {
        $body = [];
    }

    // Honeypot: a real visitor never fills this hidden field. Pretend success without inserting
    // anything, so a bot can't tell it was filtered.
    if (!empty($body['company'])) {
        echo json_encode(['ok' => true]);
        exit;
    }

    $name = trim((string)($body['name'] ?? ''));
    if ($name === '' || mb_strlen($name) > 120) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid name']);
        exit;
    }

    $stmt = $pdo->prepare('INSERT INTO rsvps (name) VALUES (:name)');
    $stmt->execute(['name' => $name]);
    echo json_encode(['ok' => true]);
    exit;
}

http_response_code(405);
echo json_encode(['error' => 'Method not allowed']);
