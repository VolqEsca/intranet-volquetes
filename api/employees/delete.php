<?php
require_once __DIR__ . '/../../config.php';
require_once __DIR__ . '/../cors.php';
require_once __DIR__ . '/../auth_check.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'DELETE') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Método no permitido']);
    exit;
}

try {
    $employee_id = intval($_GET['id'] ?? 0);

    if ($employee_id <= 0) {
        throw new Exception('ID de empleado inválido');
    }

    // Verificar que el empleado existe y obtener nombre
    $stmt = $pdo->prepare("SELECT full_name FROM employees WHERE id = ? AND status = 'active'");
    $stmt->execute([$employee_id]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$row) {
        throw new Exception('Empleado no encontrado');
    }

    $employee_name = $row['full_name'];

    // Soft delete — nunca eliminación física
    $stmt = $pdo->prepare("UPDATE employees SET status = 'inactive', updated_at = NOW() WHERE id = ?");
    $stmt->execute([$employee_id]);

    echo json_encode([
        'success' => true,
        'message' => "Empleado {$employee_name} desactivado correctamente"
    ]);

} catch (PDOException $e) {
    error_log("Error PDO employees/delete.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Error de base de datos']);
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
?>
