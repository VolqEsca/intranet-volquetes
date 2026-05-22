<?php
require_once __DIR__ . '/../../config.php';
require_once __DIR__ . '/../cors.php';
require_once __DIR__ . '/../auth_check.php';

header('Content-Type: application/json');

$rol = $_SESSION['user']['rol'] ?? '';
if ($rol !== 'admin' && $rol !== 'Administrador') {
    http_response_code(403);
    echo json_encode(['error' => 'Sin permisos']);
    exit();
}

try {
    $stmt = $pdo->query("SELECT id, username, email, nombre, apellidos, rol, created_at FROM usuarios");
    $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode($users);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Error al obtener usuarios']);
}
?>

