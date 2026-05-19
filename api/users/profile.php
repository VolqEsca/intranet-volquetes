<?php
require_once __DIR__ . '/../cors.php';





if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once __DIR__ . '/../../config.php';
header('Content-Type: application/json');

if (!isset($_SESSION['user']) || !isset($_SESSION['user']['id'])) {
    echo json_encode(['error' => 'No autorizado']);
    http_response_code(401);
    exit();
}

$currentUserId = $_SESSION['user']['id'];

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    try {
        $stmt = $pdo->prepare("
            SELECT id, username, email, nombre, apellidos, rol, created_at 
            FROM usuarios 
            WHERE id = ?
        ");
        $stmt->execute([$currentUserId]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($user) {
            echo json_encode($user);
        } else {
            echo json_encode(['error' => 'Usuario no encontrado']);
            http_response_code(404);
        }
    } catch (PDOException $e) {
        error_log("Error en profile.php GET: " . $e->getMessage());
        echo json_encode(['error' => 'Error al obtener perfil']);
        http_response_code(500);
    }
    
} else if ($_SERVER['REQUEST_METHOD'] === 'PUT') {
    $data = json_decode(file_get_contents('php://input'), true);
    
    try {
        $updateFields = [];
        $params = [];
        
        $allowedFields = ['username', 'email', 'nombre', 'apellidos'];
        
        foreach ($allowedFields as $field) {
            if (isset($data[$field])) {
                $updateFields[] = "$field = ?";
                $params[] = $data[$field];
            }
        }
        
        if (empty($updateFields)) {
            echo json_encode(['error' => 'No hay campos para actualizar']);
            http_response_code(400);
            exit();
        }
        
        $params[] = $currentUserId;
        
        $sql = "UPDATE usuarios SET " . implode(", ", $updateFields) . " WHERE id = ?";
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        
        if (isset($data['username'])) {
            $_SESSION['user']['username'] = $data['username'];
        }
        
        echo json_encode([
            'success' => true,
            'message' => 'Perfil actualizado exitosamente'
        ]);
        
    } catch (PDOException $e) {
        error_log("Error en profile.php PUT: " . $e->getMessage());
        echo json_encode(['error' => 'Error al actualizar perfil']);
        http_response_code(500);
    }
}
?>