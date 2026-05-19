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

try {
    $stmt = $pdo->prepare("SELECT id FROM usuarios WHERE username = ?");
    $stmt->execute([$data['username']]);
    
    if ($stmt->fetch()) {
        echo json_encode(['error' => 'El usuario ya existe']);
        http_response_code(409);
        exit();
    }
    
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
    
    echo json_encode([
        'success' => true,
        'id' => $pdo->lastInsertId(),
        'message' => 'Usuario creado exitosamente'
    ]);
    
} catch (PDOException $e) {
    error_log("Error en create.php: " . $e->getMessage());
    echo json_encode(['error' => 'Error al crear usuario']);
    http_response_code(500);
}
?>