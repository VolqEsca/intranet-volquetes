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

$data = json_decode(file_get_contents('php://input'), true);

if (!isset($data['username']) || !isset($data['password']) || !isset($data['rol'])) {
    echo json_encode(['error' => 'Datos incompletos']);
    http_response_code(400);
    exit();
}

$allowedRoles = ['admin', 'operador'];
if (!in_array($data['rol'], $allowedRoles, true)) {
    echo json_encode(['error' => 'Rol inválido']);
    http_response_code(400);
    exit();
}

// Whitelist de módulos válidos (idéntica a permissions.php)
$VALID_MODULES = ['dashboard', 'orders', 'manufacturing-orders', 'employees', 'vacations'];

try {
    $stmt = $pdo->prepare("SELECT id FROM usuarios WHERE username = ?");
    $stmt->execute([$data['username']]);

    if ($stmt->fetch()) {
        http_response_code(409);
        echo json_encode(['error' => 'El usuario ya existe']);
        exit();
    }

    $pdo->beginTransaction();

    $stmt = $pdo->prepare("
        INSERT INTO usuarios (username, password, email, nombre, apellidos, rol, created_at)
        VALUES (?, ?, ?, ?, ?, ?, NOW())
    ");

    $hashedPassword = password_hash($data['password'], PASSWORD_BCRYPT);

    $stmt->execute([
        $data['username'],
        $hashedPassword,
        $data['email'],
        $data['nombre'] ?? '',
        $data['apellidos'] ?? '',
        $data['rol']
    ]);

    $newUserId = $pdo->lastInsertId();

    // Insertar permisos de módulo si vienen en el body (solo para operadores)
    if (
        $data['rol'] === 'operador'
        && isset($data['permissions'])
        && is_array($data['permissions'])
        && count($data['permissions']) > 0
    ) {
        $stmtPerm = $pdo->prepare(
            "INSERT INTO user_module_permissions (user_id, module, action, granted) VALUES (?, ?, 'access', 1)"
        );
        foreach ($data['permissions'] as $slug) {
            if (!in_array($slug, $VALID_MODULES, true)) continue;
            $stmtPerm->execute([$newUserId, $slug]);
        }
    }

    $pdo->commit();

    echo json_encode([
        'success' => true,
        'id'      => $newUserId,
        'message' => 'Usuario creado exitosamente'
    ]);

} catch (PDOException $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    error_log("Error en create.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Error al crear usuario']);
}
?>