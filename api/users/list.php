<?php
require_once __DIR__ . '/../cors.php';
require_once __DIR__ . '/../../config.php';

header('Content-Type: application/json');

if (!isset($_SESSION['user'])) {
    http_response_code(401);
    echo json_encode(['error' => 'No autorizado']);
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

