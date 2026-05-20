<?php
require_once __DIR__ . '/../../config.php';
require_once __DIR__ . '/../cors.php';
require_once __DIR__ . '/../auth_check.php';
require_once __DIR__ . '/../permission_check.php';
require_module_permission('manufacturing-orders');

if ($_SERVER['REQUEST_METHOD'] !== 'PUT') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Método no permitido']);
    exit;
}

try {
    $data = json_decode(file_get_contents('php://input'), true);

    $order_id = filter_var($data['id'] ?? null, FILTER_VALIDATE_INT);
    $new_status = $data['status'] ?? '';

    if (!$order_id || empty($new_status)) {
        throw new Exception('ID de orden y estado requeridos');
    }

    $valid_statuses = ['pending', 'in_progress', 'completed', 'delivered'];
    if (!in_array($new_status, $valid_statuses)) {
        throw new Exception('Estado inválido');
    }

    // Lee estado anterior
    $stmt = $pdo->prepare("SELECT status FROM manufacturing_orders WHERE id = ?");
    $stmt->execute([$order_id]);
    $row = $stmt->fetch();
    if (!$row) throw new Exception('Orden no encontrada');
    $oldStatus = $row['status'];

    // Actualiza estado
    $stmt = $pdo->prepare("UPDATE manufacturing_orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?");
    $stmt->execute([$new_status, $order_id]);

    // Si completa → setea completion_date
    if ($new_status === 'completed') {
        $stmt = $pdo->prepare("UPDATE manufacturing_orders SET completion_date = CURDATE() WHERE id = ?");
        $stmt->execute([$order_id]);
    }

    // Escribe en historial
    $details = "Estado cambiado de {$oldStatus} a {$new_status}";
    $stmt = $pdo->prepare(
        "INSERT INTO manufacturing_order_history (manufacturing_order_id, user_id, action, details) VALUES (?, ?, 'status_changed', ?)"
    );
    $stmt->execute([$order_id, $_SESSION['user']['id'], $details]);

    echo json_encode(['success' => true, 'message' => 'Estado actualizado con éxito']);

} catch (Exception $e) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
