<?php
require_once __DIR__ . '/../cors.php';
require_once __DIR__ . '/../auth_check.php';
require_once __DIR__ . '/../../config.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['error' => 'Método no permitido']);
    exit;
}

try {
    $stmt = $pdo->prepare("
        SELECT id, name 
        FROM unit_types 
        WHERE active = 1 
        ORDER BY name ASC
    ");
    $stmt->execute();
    $unitTypes = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'success' => true,
        'unit_types' => $unitTypes
    ]);
    
} catch (Exception $e) {
    error_log("Error en unit-types.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'error' => 'Error al obtener los tipos de unidad',
        'details' => $e->getMessage()
    ]);
}
?>
