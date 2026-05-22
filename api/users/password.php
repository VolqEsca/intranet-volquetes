<?php
require_once __DIR__ . '/../../config.php';
require_once __DIR__ . '/../cors.php';
require_once __DIR__ . '/../auth_check.php';


header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'PUT') {
    try {
        $data = json_decode(file_get_contents('php://input'), true);
        $currentUserId = $_SESSION['user']['id'];
        $userRole = $_SESSION['user']['rol'];
        
        if (isset($data['currentPassword'])) {
            // Cambio de contraseña personal
            $stmt = $pdo->prepare("SELECT password FROM usuarios WHERE id = ?");
            $stmt->execute([$currentUserId]);
            $user = $stmt->fetch();
            
            if (!$user || !password_verify($data['currentPassword'], $user['password'])) {
                echo json_encode(['error' => 'Contraseña actual incorrecta']);
                http_response_code(400);
                exit();
            }
            
            if (!isset($data['newPassword'])) {
                echo json_encode(['error' => 'Nueva contraseña no proporcionada']);
                http_response_code(400);
                exit();
            }

            if (strlen($data['newPassword']) < 8) {
                echo json_encode(['error' => 'La contraseña debe tener al menos 8 caracteres']);
                http_response_code(400);
                exit();
            }

            $hashedPassword = password_hash($data['newPassword'], PASSWORD_BCRYPT);
            $stmt = $pdo->prepare("UPDATE usuarios SET password = ? WHERE id = ?");
            $stmt->execute([$hashedPassword, $currentUserId]);
            
        } else {
            // Admin cambiando contraseña de otro usuario
            if ($userRole !== 'Administrador' && $userRole !== 'admin') {
                http_response_code(403);
                echo json_encode(['error' => 'Sin permisos']);
                exit();
            }
            
            $userId = (int)($data['id'] ?? 0);
            if (!$userId || !isset($data['password'])) {
                echo json_encode(['error' => 'Datos incompletos']);
                http_response_code(400);
                exit();
            }

            if (strlen($data['password']) < 8) {
                echo json_encode(['error' => 'La contraseña debe tener al menos 8 caracteres']);
                http_response_code(400);
                exit();
            }

            $hashedPassword = password_hash($data['password'], PASSWORD_BCRYPT);
            $stmt = $pdo->prepare("UPDATE usuarios SET password = ? WHERE id = ?");
            $stmt->execute([$hashedPassword, $userId]);
        }
        
        echo json_encode(['success' => true, 'message' => 'Contraseña actualizada']);
        
    } catch (Exception $e) {
        error_log("Error en password.php: " . $e->getMessage());
        echo json_encode(['error' => 'Error al actualizar contraseña']);
        http_response_code(500);
    }
}
?>