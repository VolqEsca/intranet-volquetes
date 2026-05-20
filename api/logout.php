<?php
require_once __DIR__ . '/cors.php';

header('Content-Type: application/json');

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

$_SESSION = [];
session_destroy();

echo json_encode(['success' => true, 'message' => 'Sesión cerrada']);
?>
