<?php
// /api/manufacturing-orders/details.php
require_once __DIR__ . '/../cors.php';
require_once __DIR__ . '/../auth_check.php';
require_once __DIR__ . '/../permission_check.php';
require_module_permission('manufacturing-orders');
require_once __DIR__ . '/../../config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['message' => 'Método no permitido']);
    exit();
}

$order_id = filter_input(INPUT_GET, 'id', FILTER_VALIDATE_INT);

if (!$order_id) {
    http_response_code(400);
    echo json_encode(['message' => 'ID de orden requerido']);
    exit();
}

try {
    $stmt = $pdo->prepare("
        SELECT 
            mo.*,
            creator.nombre as created_by_name,
            creator.email as created_by_email,
            assignee.nombre as assigned_to_name,
            assignee.email as assigned_to_email
        FROM manufacturing_orders mo
        LEFT JOIN usuarios creator ON mo.created_by = creator.id
        LEFT JOIN usuarios assignee ON mo.assigned_to = assignee.id
        WHERE mo.id = ?
    ");
    
    $stmt->execute([$order_id]);
    $order = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$order) {
        http_response_code(404);
        echo json_encode(['message' => 'Orden no encontrada']);
        exit();
    }

    // Formatear fechas
    $order['order_date'] = $order['order_date'] ? date('d/m/Y', strtotime($order['order_date'])) : null;
    $order['vehicle_reception_date'] = $order['vehicle_reception_date'] ? date('d/m/Y', strtotime($order['vehicle_reception_date'])) : null;
    $order['expected_completion_date'] = $order['expected_completion_date'] ? date('d/m/Y', strtotime($order['expected_completion_date'])) : null;
    $order['created_at'] = date('d/m/Y H:i', strtotime($order['created_at']));
    $order['updated_at'] = date('d/m/Y H:i', strtotime($order['updated_at']));

    echo json_encode($order);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['message' => 'Error al obtener detalles: ' . $e->getMessage()]);
}
?>
