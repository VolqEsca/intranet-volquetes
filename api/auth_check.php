<?php
// IMPORTANTE: Iniciar sesión si no está iniciada
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Verificar autenticación
if (!isset($_SESSION['user']) || !isset($_SESSION['user']['id'])) {
    http_response_code(401);
    echo json_encode(['error' => 'No autenticado']);
    exit;
}

// Renovar el tiempo de la sesión en cada petición
$_SESSION['last_activity'] = time();
?>