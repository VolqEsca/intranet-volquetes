<?php
require_once __DIR__ . '/../../config.php';
require_once __DIR__ . '/../cors.php';
require_once __DIR__ . '/../auth_check.php';


header('Content-Type: application/json');

if ($_SESSION['user']['rol'] !== 'Administrador' && $_SESSION['user']['rol'] !== 'admin') {
    echo json_encode(['error' => 'No autorizado']);
    http_response_code(403);
    exit();
}

$userId = $_GET['id'] ?? null;

if (!$userId) {
    echo json_encode(['error' => 'ID de usuario no proporcionado']);
    http_response_code(400);
    exit();
}

if ($userId == $_SESSION['user']['id']) {
    echo json_encode(['error' => 'No puedes eliminarte a ti mismo']);
    http_response_code(400);
    exit();
}

try {
    $stmt = $pdo->prepare("DELETE FROM usuarios WHERE id = ?");
    $stmt->execute([$userId]);
    
    if ($stmt->rowCount() > 0) {
        echo json_encode([
            'success' => true,
            'message' => 'Usuario eliminado exitosamente'
        ]);
    } else {
        echo json_encode(['error' => 'Usuario no encontrado']);
        http_response_code(404);
    }
    
} catch (PDOException $e) {
    error_log("Error en delete.php: " . $e->getMessage());
    echo json_encode(['error' => 'Error al eliminar usuario']);
    http_response_code(500);
}
?>