<?php
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

require_once __DIR__ . '/cors.php';
require_once __DIR__ . '/../config.php';

header('Content-Type: application/json');

if (isset($_SESSION['user']) && isset($_SESSION['user']['id'])) {
    echo json_encode([
        'authenticated' => true,
        'user' => [
            'id'          => $_SESSION['user']['id'],
            'username'    => $_SESSION['user']['username'],
            'rol'         => $_SESSION['user']['rol'],
            'email'       => $_SESSION['user']['email']    ?? null,
            'nombre'      => $_SESSION['user']['nombre']   ?? null,
            'apellidos'   => $_SESSION['user']['apellidos'] ?? null,
            'permissions' => $_SESSION['user']['permissions'] ?? [],
        ],
        'last_activity' => $_SESSION['last_activity'] ?? null
    ]);
} else {
    echo json_encode([
        'authenticated' => false
    ]);
}
?>