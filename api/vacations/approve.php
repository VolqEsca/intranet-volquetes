<?php
require_once __DIR__ . '/../cors.php';
require_once __DIR__ . '/../auth_check.php';
require_once __DIR__ . '/../../config.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'PUT') {
    http_response_code(405);
    echo json_encode(['error' => 'Método no permitido']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);

if (!isset($data['absence_id']) || !isset($data['action'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Faltan campos: absence_id, action']);
    exit;
}

$absence_id = (int)$data['absence_id'];
$action = $data['action'];
$rejection_reason = $data['rejection_reason'] ?? null;

if (!in_array($action, ['approve', 'reject'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Acción no válida. Use: approve o reject']);
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

    if ($absence['status'] !== 'pending') {
        throw new Exception("La ausencia ya está en estado: {$absence['status']}");
    }

    $user_id = $_SESSION['user']['id'] ?? 0;
    $new_status = $action === 'approve' ? 'approved' : 'rejected';

    // ==========================================
    // APROBAR: Actualizar saldo (AQUÍ SE DESCUENTA)
    // ==========================================
    if ($action === 'approve' && $absence['absence_type'] === 'vacation') {
        // Verificar saldo disponible una última vez
        $stmt = $pdo->prepare("
            SELECT (annual_days + carried_over_days - consumed_days) as available_days
            FROM vacation_balances 
            WHERE employee_id = ? AND year = ?
            FOR UPDATE
        ");
        $stmt->execute([$absence['employee_id'], $absence['year']]);
        $balance = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$balance || $balance['available_days'] < $absence['working_days_count']) {
            $available = $balance ? $balance['available_days'] : 0;
            throw new Exception("Imposible aprobar: saldo insuficiente ({$available} disponibles, {$absence['working_days_count']} solicitados)");
        }

        // DESCONTAR SALDO
        $stmt = $pdo->prepare("
            UPDATE vacation_balances 
            SET consumed_days = consumed_days + ? 
            WHERE employee_id = ? AND year = ?
        ");
        $stmt->execute([
            $absence['working_days_count'], 
            $absence['employee_id'], 
            $absence['year']
        ]);
    }

    // Actualizar ausencia
    $stmt = $pdo->prepare("
        UPDATE employee_absences 
        SET status = ?,
            approved_by = ?,
            approved_at = NOW(),
            rejection_reason = ?
        WHERE id = ?
    ");
    $stmt->execute([
        $new_status,
        $user_id,
        $rejection_reason,
        $absence_id
    ]);

    // Registrar en historial
    $stmt = $pdo->prepare("
        INSERT INTO absence_history (absence_id, action, new_value, user_id, created_at)
        VALUES (?, ?, ?, ?, NOW())
    ");
    $stmt->execute([
        $absence_id, 
        $new_status, 
        $rejection_reason ?? "Aprobada por usuario {$user_id}",
        $user_id
    ]);

    $pdo->commit();

    echo json_encode([
        'success' => true,
        'message' => $action === 'approve' 
            ? "Ausencia aprobada para {$absence['employee_name']} - {$absence['working_days_count']} días descontados" 
            : "Ausencia rechazada para {$absence['employee_name']}",
        'data' => [
            'absence_id' => $absence_id,
            'new_status' => $new_status,
            'working_days' => $absence['working_days_count'],
            'employee_name' => $absence['employee_name']
        ]
    ]);

} catch (PDOException $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    error_log("Error PDO en approve.php: " . $e->getMessage());
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
