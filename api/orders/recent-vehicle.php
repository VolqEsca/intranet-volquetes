<?php
require_once __DIR__ . '/../../config.php';
require_once __DIR__ . '/../cors.php';
require_once __DIR__ . '/../auth_check.php';
require_once __DIR__ . '/../permission_check.php';
require_module_permission('orders');

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['error' => 'Método no permitido']);
    exit;
}

$client_id = isset($_GET['client_id']) ? intval($_GET['client_id']) : 0;

if (!$client_id) {
    http_response_code(400);
    echo json_encode(['error' => 'client_id requerido']);
    exit;
}

try {
    // Obtener la última OR del cliente con datos de vehículo
    $stmt = $pdo->prepare("
        SELECT brand, model, license_plate, unit_type_id
        FROM work_orders
        WHERE client_id = ?
          AND (brand IS NOT NULL OR license_plate IS NOT NULL)
        ORDER BY created_at DESC
        LIMIT 1
    ");
    $stmt->execute([$client_id]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($row) {
        echo json_encode([
            'success' => true,
            'data' => [
                'brand'        => $row['brand'],
                'model'        => $row['model'],
                'license_plate'=> $row['license_plate'],
                'unit_type_id' => $row['unit_type_id'],
            ]
        ]);
    } else {
        echo json_encode(['success' => true, 'data' => null]);
    }

} catch (PDOException $e) {
    error_log("Error en recent-vehicle.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Error al consultar el vehículo reciente']);
}
?>
