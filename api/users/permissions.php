<?php
require_once __DIR__ . '/../../config.php';
require_once __DIR__ . '/../cors.php';
require_once __DIR__ . '/../auth_check.php';

header('Content-Type: application/json');

// Solo administradores pueden gestionar permisos (acepta 'admin' y 'Administrador' legacy)
$sessionRol = $_SESSION['user']['rol'] ?? '';
if ($sessionRol !== 'admin' && $sessionRol !== 'Administrador') {
    http_response_code(403);
    echo json_encode(['error' => 'Solo administradores pueden gestionar permisos']);
    exit;
}

$userId = intval($_GET['user_id'] ?? 0);
if ($userId <= 0) {
    http_response_code(400);
    echo json_encode(['error' => 'user_id requerido']);
    exit;
}

// Verificar que el usuario objetivo existe
$stmtCheck = $pdo->prepare("SELECT id, rol FROM usuarios WHERE id = ?");
$stmtCheck->execute([$userId]);
$targetUser = $stmtCheck->fetch(PDO::FETCH_ASSOC);

if (!$targetUser) {
    http_response_code(404);
    echo json_encode(['error' => 'Usuario no encontrado']);
    exit;
}

// Módulos configurables (whitelist explícita)
const VALID_MODULES = ['dashboard', 'orders', 'manufacturing-orders', 'employees', 'vacations'];
const VALID_ACTIONS = ['access'];

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $stmt = $pdo->prepare(
        "SELECT module, action, granted
         FROM user_module_permissions
         WHERE user_id = ?
         ORDER BY module, action"
    );
    $stmt->execute([$userId]);
    $perms = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        'success'     => true,
        'user_id'     => $userId,
        'is_admin'    => $targetUser['rol'] === 'admin',
        'permissions' => $perms,
    ], JSON_UNESCAPED_UNICODE);

} elseif ($_SERVER['REQUEST_METHOD'] === 'PUT') {
    $input = json_decode(file_get_contents('php://input'), true);

    if (!isset($input['grants']) || !is_array($input['grants'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Campo grants requerido (array)']);
        exit;
    }

    // Admins no tienen filas en la tabla — su acceso es incondicional
    if ($targetUser['rol'] === 'admin' || $targetUser['rol'] === 'Administrador') {
        echo json_encode(['success' => true, 'message' => 'Admin tiene acceso total — sin cambios']);
        exit;
    }

    $pdo->beginTransaction();
    try {
        $pdo->prepare("DELETE FROM user_module_permissions WHERE user_id = ?")->execute([$userId]);

        $stmtIns = $pdo->prepare(
            "INSERT INTO user_module_permissions (user_id, module, action, granted) VALUES (?,?,?,1)"
        );

        foreach ($input['grants'] as $grant) {
            $mod = $grant['module'] ?? '';
            $act = $grant['action'] ?? 'access';

            if (!in_array($mod, VALID_MODULES, true)) continue;
            if (!in_array($act, VALID_ACTIONS, true)) continue;

            $stmtIns->execute([$userId, $mod, $act]);
        }

        $pdo->commit();
        echo json_encode(['success' => true], JSON_UNESCAPED_UNICODE);

    } catch (PDOException $e) {
        $pdo->rollBack();
        error_log("Error PDO users/permissions.php: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['error' => 'Error al actualizar permisos']);
    }

} else {
    http_response_code(405);
    echo json_encode(['error' => 'Método no permitido']);
}
