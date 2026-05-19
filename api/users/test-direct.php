<?php
require_once __DIR__ . '/../cors.php';
require_once __DIR__ . '/../../config.php';

header('Content-Type: application/json');

try {
    $pdo = new PDO(
        "mysql:host=$db_host;dbname=$db_name;charset=utf8mb4",
        $db_user,
        $db_pass
    );
    
    $stmt = $pdo->query("SELECT id, username, email, nombre, apellidos, rol, created_at FROM usuarios");
    $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Devolver directamente el array de usuarios
    echo json_encode($users);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}