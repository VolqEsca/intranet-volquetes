<?php
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
    
    // Obtener estado actual
    $stmt = $conn->prepare("SELECT status FROM work_orders WHERE id = ?");
    $stmt->bind_param("i", $data['id']);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows === 0) {
        throw new Exception('Orden no encontrada');
    }
    
    $oldStatus = $result->fetch_assoc()['status'];
    
    // Actualizar estado
    $updateStmt = $conn->prepare("UPDATE work_orders SET status = ? WHERE id = ?");
    $updateStmt->bind_param("si", $data['status'], $data['id']);
    
    if (!$updateStmt->execute()) {
        throw new Exception('Error al actualizar estado');
    }
    
    // Si se completa, actualizar fecha
    if ($data['status'] === 'completed') {
        $dateStmt = $conn->prepare("UPDATE work_orders SET completion_date = CURDATE() WHERE id = ?");
        $dateStmt->bind_param("i", $data['id']);
        $dateStmt->execute();
    }
    
    // Registrar en historial
    $historyStmt = $conn->prepare("INSERT INTO work_order_history (work_order_id, user_id, action, details) VALUES (?, ?, 'status_changed', ?)");
    $details = "Estado cambiado de $oldStatus a {$data['status']}";
    $historyStmt->bind_param("iis", $data['id'], $_SESSION['user']['id'], $details);
    $historyStmt->execute();
    
    echo json_encode([
        'success' => true,
        'message' => 'Estado actualizado exitosamente'
    ]);
    
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}
?>
