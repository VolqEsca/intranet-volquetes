<?php
// /api/manufacturing-orders/status.php
require_once __DIR__ . '/../cors.php';
require_once __DIR__ . '/../auth_check.php';
require_once __DIR__ . '/../../config.php';


if ($_SERVER['REQUEST_METHOD'] !== 'PUT') {
    http_response_code(405);
    echo json_encode(['message' => 'Método no permitido']);
    exit();
}

$json_data = file_get_contents('php://input');
$data = json_decode($json_data, true);

$order_id = filter_var($data['id'] ?? null, FILTER_VALIDATE_INT);
$new_status = filter_var($data['status'] ?? '', FILTER_SANITIZE_STRING);

if (!$order_id || empty($new_status)) {
    http_response_code(400);
    echo json_encode(['message' => 'ID de orden y estado requeridos']);
    exit();
}

$valid_statuses = ['pending', 'in_progress', 'completed', 'delivered'];
if (!in_array($new_status, $valid_statuses)) {
    http_response_code(400);
    echo json_encode(['message' => 'Estado inválido']);
    exit();
}

try {
    $stmt = $pdo->prepare("
        UPDATE manufacturing_orders 
        SET status = ?, updated_at = CURRENT_TIMESTAMP 
        WHERE id = ?
    ");
    
    $stmt->execute([$new_status, $order_id]);

    if ($stmt->rowCount() === 0) {
        http_response_code(404);
        echo json_encode(['message' => 'Orden no encontrada']);
        exit();
    }

    echo json_encode(['message' => 'Estado actualizado con éxito']);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['message' => 'Error al actualizar estado: ' . $e->getMessage()]);
}
?>
