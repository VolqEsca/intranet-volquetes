<?php
require_once __DIR__ . '/../../config.php';
require_once __DIR__ . '/../cors.php';
require_once __DIR__ . '/../auth_check.php';
require_once __DIR__ . '/../permission_check.php';
require_module_permission('vacations');

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Método no permitido']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);

if (!isset($data['employee_id']) || !isset($data['year'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Faltan datos requeridos']);
    exit;
}

try {
    $pdo->beginTransaction();

    $employee_id = (int)$data['employee_id'];
    $year = (int)$data['year'];
    
    // Verificar registro existente
    $stmt = $pdo->prepare("SELECT * FROM vacation_balances WHERE employee_id = ? AND year = ?");
    $stmt->execute([$employee_id, $year]);
    $existing = $stmt->fetch(PDO::FETCH_ASSOC);

    $annual_days = isset($data['annual_days']) ? (int)$data['annual_days'] : ($existing ? $existing['annual_days'] : 22);
    $carried_over_days = isset($data['carried_over_days']) ? (int)$data['carried_over_days'] : ($existing ? $existing['carried_over_days'] : 0);
    $manual_adjustments = isset($data['manual_adjustments']) ? (int)$data['manual_adjustments'] : ($existing ? $existing['manual_adjustments'] : 0);
    $adjustment_reason = isset($data['adjustment_reason']) ? $data['adjustment_reason'] : null;

    if ($existing) {
        $stmt = $pdo->prepare("
            UPDATE vacation_balances 
            SET annual_days = ?, carried_over_days = ?, manual_adjustments = ?, adjustment_reason = ?
            WHERE employee_id = ? AND year = ?
        ");
        $stmt->execute([$annual_days, $carried_over_days, $manual_adjustments, $adjustment_reason, $employee_id, $year]);
        $old_value = $existing['manual_adjustments'];
    } else {
        $stmt = $pdo->prepare("
            INSERT INTO vacation_balances (employee_id, year, annual_days, carried_over_days, consumed_days, manual_adjustments, adjustment_reason)
            VALUES (?, ?, ?, ?, 0, ?, ?)
        ");
        $stmt->execute([$employee_id, $year, $annual_days, $carried_over_days, $manual_adjustments, $adjustment_reason]);
        $old_value = 0;
    }

    // Auditoría completa
    $user_id = $_SESSION['user']['id'] ?? 0;
    $change_description = sprintf(
        "Ajuste: %+d días (%+d → %+d). Motivo: %s",
        $manual_adjustments - $old_value,
        $old_value,
        $manual_adjustments,
        $adjustment_reason ?: 'Sin especificar'
    );
    
    $stmt = $pdo->prepare("
        INSERT INTO absence_history (absence_id, action, field_changed, old_value, new_value, user_id, created_at)
        VALUES (NULL, 'balance_adjusted', 'manual_adjustments', ?, ?, ?, NOW())
    ");
    $stmt->execute([$old_value, $manual_adjustments, $user_id]);

    $pdo->commit();

    // Calcular saldo final
    $consumed = $existing ? $existing['consumed_days'] : 0;
    $total_generated = $annual_days + $carried_over_days + $manual_adjustments;
    $final_available = $total_generated - $consumed;

    echo json_encode([
        'success' => true,
        'message' => 'Saldo actualizado correctamente',
        'data' => [
            'annual_days' => $annual_days,
            'carried_over_days' => $carried_over_days,
            'manual_adjustments' => $manual_adjustments,
            'total_generated' => $total_generated,
            'final_available' => $final_available,
            'change_description' => $change_description
        ]
    ]);

} catch (Exception $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Error: ' . $e->getMessage()]);
}
?>
