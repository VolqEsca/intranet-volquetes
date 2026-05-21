<?php
// /api/manufacturing-orders/delete.php
require_once __DIR__ . '/../cors.php';
require_once __DIR__ . '/../auth_check.php';
require_once __DIR__ . '/../../config.php';
require_once __DIR__ . '/../permission_check.php';
require_module_permission('manufacturing-orders');

if ($_SERVER['REQUEST_METHOD'] !== 'DELETE') {
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
    // Verificar que la orden existe
    $check_stmt = $pdo->prepare("SELECT order_number FROM manufacturing_orders WHERE id = ?");
    $check_stmt->execute([$order_id]);
    $order = $check_stmt->fetch(PDO::FETCH_ASSOC);

    if (!$order) {
        http_response_code(404);
        echo json_encode(['message' => 'Orden no encontrada']);
        exit();
    }

    // Eliminar orden
    $stmt = $pdo->prepare("DELETE FROM manufacturing_orders WHERE id = ?");
    $stmt->execute([$order_id]);

    echo json_encode([
        'message' => 'Orden eliminada con éxito',
        'order_number' => $order['order_number']
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['message' => 'Error al eliminar: ' . $e->getMessage()]);
}
?>
