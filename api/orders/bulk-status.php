<?php
require_once __DIR__ . '/../../config.php';
require_once __DIR__ . '/../cors.php';
require_once __DIR__ . '/../auth_check.php';
require_once __DIR__ . '/../permission_check.php';
require_module_permission('orders');

if ($_SERVER['REQUEST_METHOD'] !== 'PUT') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Método no permitido']);
    exit;
}

try {
    $data = json_decode(file_get_contents('php://input'), true);

    $ids    = $data['ids']    ?? [];
    $status = $data['status'] ?? '';

    if (!is_array($ids) || empty($ids)) {
        throw new Exception('ids debe ser un array no vacío');
    }

    $validStatuses = ['pending', 'in_progress', 'completed', 'cancelled'];
    if (!in_array($status, $validStatuses)) {
        throw new Exception('Estado inválido');
    }

    $userId  = $_SESSION['user']['id'];
    $updated = 0;

    foreach ($ids as $id) {
        $id = filter_var($id, FILTER_VALIDATE_INT);
        if (!$id) continue;

        // Lee estado anterior
        $stmt = $pdo->prepare("SELECT status FROM work_orders WHERE id = ?");
        $stmt->execute([$id]);
        $row = $stmt->fetch();
        if (!$row) continue;
        $oldStatus = $row['status'];

        // Actualiza estado
        $stmt = $pdo->prepare("UPDATE work_orders SET status = ?, updated_at = NOW() WHERE id = ?");
        $stmt->execute([$status, $id]);

        // Si completa → setea completion_date
        if ($status === 'completed') {
            $stmt = $pdo->prepare("UPDATE work_orders SET completion_date = CURDATE() WHERE id = ?");
            $stmt->execute([$id]);
        }

        // Historial
        $details = "Estado cambiado de {$oldStatus} a {$status}";
        $stmt = $pdo->prepare(
            "INSERT INTO work_order_history (work_order_id, user_id, action, details) VALUES (?, ?, 'status_changed', ?)"
        );
        $stmt->execute([$id, $userId, $details]);

        $updated++;
    }

    echo json_encode(['success' => true, 'updated' => $updated]);

} catch (Exception $e) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
