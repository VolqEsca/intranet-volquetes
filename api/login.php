<?php
session_start();
require_once __DIR__ . '/cors.php';
require_once __DIR__ . '/../config.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (!isset($data['username']) || !isset($data['password'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Usuario y contraseña requeridos']);
        exit;
    }
    
    try {
        $stmt = $pdo->prepare("SELECT * FROM usuarios WHERE username = ?");
        $stmt->execute([$data['username']]);
        $user = $stmt->fetch();
        
        if ($user && password_verify($data['password'], $user['password'])) {
            // Cargar permisos de módulo (solo para no-admin; admin tiene acceso total)
            $permissions = [];
            if ($user['rol'] !== 'admin') {
                $permStmt = $pdo->prepare(
                    "SELECT CONCAT(module, ':', action) as perm
                     FROM user_module_permissions
                     WHERE user_id = ? AND granted = 1"
                );
                $permStmt->execute([$user['id']]);
                $permissions = $permStmt->fetchAll(PDO::FETCH_COLUMN);
            }

            $_SESSION['user'] = [
                'id'          => $user['id'],
                'username'    => $user['username'],
                'rol'         => $user['rol'],
                'email'       => $user['email'],
                'nombre'      => $user['nombre'],
                'apellidos'   => $user['apellidos'],
                'permissions' => $permissions,
            ];
            $_SESSION['user_id'] = $user['id'];
            $_SESSION['rol'] = $user['rol'];
            $_SESSION['last_activity'] = time();

            echo json_encode([
                'success' => true,
                'user'    => $_SESSION['user']
            ]);
        } else {
            http_response_code(401);
            echo json_encode(['error' => 'Credenciales inválidas']);
        }
    } catch (Exception $e) {
        error_log("Login error: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['error' => 'Error del servidor']);
    }
}
?>
