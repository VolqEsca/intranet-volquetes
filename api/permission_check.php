<?php
/**
 * Helper de permisos por módulo.
 * Requiere que config.php y auth_check.php ya estén incluidos.
 */

function require_module_permission(string $module, string $action = 'access'): void {
    global $pdo;

    $rol = $_SESSION['user']['rol'] ?? '';

    // Admin siempre tiene acceso completo (acepta 'admin' y 'Administrador' legacy)
    if ($rol === 'admin' || $rol === 'Administrador') return;

    $userId = (int)($_SESSION['user']['id'] ?? 0);

    $stmt = $pdo->prepare(
        "SELECT 1 FROM user_module_permissions
         WHERE user_id = ? AND module = ? AND action = ? AND granted = 1"
    );
    $stmt->execute([$userId, $module, $action]);

    if (!$stmt->fetch()) {
        http_response_code(403);
        echo json_encode(['error' => 'Sin permiso para este módulo', 'module' => $module]);
        exit;
    }
}
