<?php
require_once __DIR__ . '/../cors.php';
require_once __DIR__ . '/../auth_check.php';
require_once __DIR__ . '/../permission_check.php';
require_module_permission('vacations');
require_once __DIR__ . '/../../config.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'DELETE') {
    http_response_code(405);
    echo json_encode(['error' => 'Método no permitido']);
    exit;
}

$absence_id = isset($_GET['id']) ? (int)$_GET['id'] : 0;

if ($absence_id <= 0) {
    http_response_code(400);
    echo json_encode(['error' => 'ID de ausencia no válido']);
    exit;
}

try {
    $pdo->beginTransaction();

    // Obtener ausencia con bloqueo
    $stmt = $pdo->prepare("
        SELECT ea.*, e.full_name as employee_name
        FROM employee_absences ea
        JOIN employees e ON ea.employee_id = e.id
        WHERE ea.id = ?
        FOR UPDATE
    ");
    $stmt->execute([$absence_id]);
    $absence = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$absence) {
        throw new Exception('Ausencia no encontrada');
    }

    // ==========================================
    // ROLLBACK DE SALDO (solo si está aprobada)
    // ==========================================
    $rollback_days = 0;
    if ($absence['status'] === 'approved' && $absence['absence_type'] === 'vacation') {
        $stmt = $pdo->prepare("
            UPDATE vacation_balances 
            SET consumed_days = consumed_days - ? 
            WHERE employee_id = ? AND year = ?
        ");
        $stmt->execute([
            $absence['working_days_count'], 
            $absence['employee_id'], 
            $absence['year']
        ]);
        $rollback_days = $absence['working_days_count'];
    }

    // Registrar en historial antes de eliminar
    $stmt = $pdo->prepare("
        INSERT INTO absence_history (absence_id, action, old_value, user_id, created_at)
        VALUES (?, 'deleted', ?, ?, NOW())
    ");
    $stmt->execute([
        $absence_id,
        json_encode($absence),
        $_SESSION['user']['id'] ?? 0
    ]);

    // Eliminar ausencia
    $stmt = $pdo->prepare("DELETE FROM employee_absences WHERE id = ?");
    $stmt->execute([$absence_id]);

    $pdo->commit();

    echo json_encode([
        'success' => true,
        'message' => "Ausencia eliminada para {$absence['employee_name']}" . 
                    ($rollback_days > 0 ? " - {$rollback_days} días restaurados al saldo" : ""),
        'data' => [
            'absence_id' => $absence_id,
            'rollback_days' => $rollback_days
        ]
    ]);

} catch (PDOException $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    error_log("Error PDO en delete.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Error de base de datos',
        'details' => $e->getMessage()
    ]);

} catch (Exception $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
?>
