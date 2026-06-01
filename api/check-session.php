<?php
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

require_once __DIR__ . '/cors.php';
require_once __DIR__ . '/../config.php';

header('Content-Type: application/json');

if (isset($_SESSION['user']) && isset($_SESSION['user']['id'])) {
    $rol    = $_SESSION['user']['rol'] ?? '';
    $userId = $_SESSION['user']['id'];

    // Recargar permisos desde BD en cada comprobación de sesión
    // Admin tiene bypass completo; operador consulta user_module_permissions
    $permissions = [];
    if ($rol !== 'admin') {
        try {
            $permStmt = $pdo->prepare(
                "SELECT CONCAT(module, ':', action) as perm
                 FROM user_module_permissions
                 WHERE user_id = ? AND granted = 1"
            );
            $permStmt->execute([$userId]);
            $permissions = $permStmt->fetchAll(PDO::FETCH_COLUMN);
        } catch (PDOException $e) {
            // Degradación silenciosa: mantener permisos de sesión si BD falla
            $permissions = $_SESSION['user']['permissions'] ?? [];
        }
    }
    $_SESSION['user']['permissions'] = $permissions;

    echo json_encode([
        'authenticated' => true,
        'user' => [
            'id'          => $userId,
            'username'    => $_SESSION['user']['username'],
            'rol'         => $rol,
            'email'       => $_SESSION['user']['email']    ?? null,
            'nombre'      => $_SESSION['user']['nombre']   ?? null,
            'apellidos'   => $_SESSION['user']['apellidos'] ?? null,
            'permissions' => $permissions,
        ],
        'last_activity' => $_SESSION['last_activity'] ?? null
    ]);
} else {
    echo json_encode([
        'authenticated' => false
    ]);
}
?>