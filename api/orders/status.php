<?php
require_once __DIR__ . '/../../config.php';
require_once __DIR__ . '/../cors.php';
require_once __DIR__ . '/../auth_check.php';

if ($_SERVER['REQUEST_METHOD'] !== 'PUT') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Método no permitido']);
    exit;
}

try {
    $data = json_decode(file_get_contents('php://input'), true);

    if (!isset($data['id']) || !isset($data['status'])) {
        throw new Exception('ID y estado son requeridos');
    }

    $validStatuses = ['pending', 'in_progress', 'completed', 'cancelled'];
    if (!in_array($data['status'], $validStatuses)) {
        throw new Exception('Estado inválido');
    }

    // Lee estado anterior
    $stmt = $pdo->prepare("SELECT status FROM work_orders WHERE id = ?");
    $stmt->execute([$data['id']]);
    $row = $stmt->fetch();
    if (!$row) throw new Exception('Orden no encontrada');
    $oldStatus = $row['status'];

    // Actualiza estado
    $stmt = $pdo->prepare("UPDATE work_orders SET status = ? WHERE id = ?");
    $stmt->execute([$data['status'], $data['id']]);

    // Si completa → setea completion_date
    if ($data['status'] === 'completed') {
        $stmt = $pdo->prepare("UPDATE work_orders SET completion_date = CURDATE() WHERE id = ?");
        $stmt->execute([$data['id']]);
    }

    // Escribe en historial
    $details = "Estado cambiado de {$oldStatus} a {$data['status']}";
    $stmt = $pdo->prepare(
        "INSERT INTO work_order_history (work_order_id, user_id, action, details) VALUES (?, ?, 'status_changed', ?)"
    );
    $stmt->execute([$data['id'], $_SESSION['user']['id'], $details]);

    echo json_encode(['success' => true, 'message' => 'Estado actualizado exitosamente']);

} catch (Exception $e) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
