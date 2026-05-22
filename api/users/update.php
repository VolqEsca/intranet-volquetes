<?php
require_once __DIR__ . '/../../config.php';
require_once __DIR__ . '/../cors.php';
require_once __DIR__ . '/../auth_check.php';


header('Content-Type: application/json');

$data = json_decode(file_get_contents('php://input'), true);

if (!isset($data['id'])) {
    echo json_encode(['error' => 'ID de usuario no proporcionado']);
    http_response_code(400);
    exit();
}

$targetId = (int)($data['id'] ?? 0);
$currentUserId = (int)$_SESSION['user']['id'];
$userRole = $_SESSION['user']['rol'];

if (($userRole !== 'Administrador' && $userRole !== 'admin') && $currentUserId !== $targetId) {
    echo json_encode(['error' => 'No tienes permisos para editar este usuario']);
    http_response_code(403);
    exit();
}

try {
    $updateFields = [];
    $params = [];
    
    if (isset($data['username'])) {
        $updateFields[] = "username = ?";
        $params[] = $data['username'];
    }
    
    if (isset($data['email'])) {
        $updateFields[] = "email = ?";
        $params[] = $data['email'];
    }
    
    if (isset($data['nombre'])) {
        $updateFields[] = "nombre = ?";
        $params[] = $data['nombre'];
    }
    
    if (isset($data['apellidos'])) {
        $updateFields[] = "apellidos = ?";
        $params[] = $data['apellidos'];
    }
    
    if (isset($data['rol']) && ($userRole === 'Administrador' || $userRole === 'admin')) {
        $allowedRoles = ['admin', 'operador'];
        if (!in_array($data['rol'], $allowedRoles, true)) {
            echo json_encode(['error' => 'Rol inválido']);
            http_response_code(400);
            exit();
        }
        $updateFields[] = "rol = ?";
        $params[] = $data['rol'];
    }
    
    if (empty($updateFields)) {
        echo json_encode(['error' => 'No hay campos para actualizar']);
        http_response_code(400);
        exit();
    }
    
    $params[] = $targetId;

    $sql = "UPDATE usuarios SET " . implode(", ", $updateFields) . " WHERE id = ?";
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    
    echo json_encode([
        'success' => true,
        'message' => 'Usuario actualizado exitosamente'
    ]);
    
} catch (PDOException $e) {
    error_log("Error en update.php: " . $e->getMessage());
    echo json_encode(['error' => 'Error al actualizar usuario']);
    http_response_code(500);
}
?>