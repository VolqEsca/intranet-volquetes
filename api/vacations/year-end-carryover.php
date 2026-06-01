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

// Solo admin puede ejecutar el cierre de año
if (($_SESSION['user']['rol'] ?? '') !== 'admin') {
    http_response_code(403);
    echo json_encode(['error' => 'Solo administradores pueden ejecutar el cierre de año']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);
$year = isset($data['year']) ? intval($data['year']) : 0;

if ($year < 2020 || $year > 2100) {
    http_response_code(400);
    echo json_encode(['error' => 'Año inválido. Rango permitido: 2020–2100']);
    exit;
}

$targetYear = $year + 1;

try {
    // Obtener todos los empleados activos con balance del año origen
    $stmt = $pdo->prepare("
        SELECT e.id, e.full_name, e.location,
               vb.annual_days, vb.carried_over_days, vb.consumed_days, vb.manual_adjustments
        FROM employees e
        LEFT JOIN vacation_balances vb ON vb.employee_id = e.id AND vb.year = ?
        WHERE e.status = 'active'
        ORDER BY e.full_name ASC
    ");
    $stmt->execute([$year]);
    $employees = $stmt->fetchAll(PDO::FETCH_ASSOC);

    if (empty($employees)) {
        echo json_encode(['success' => false, 'error' => 'No hay empleados activos']);
        exit;
    }

    $pdo->beginTransaction();

    $processed = [];
    $skipped   = [];

    foreach ($employees as $emp) {
        $empId = (int)$emp['id'];

        if ($emp['annual_days'] === null) {
            // Sin registro de balance en año origen → no hay nada que arrastrar
            $skipped[] = ['name' => $emp['full_name'], 'reason' => 'Sin balance en ' . $year];
            continue;
        }

        $annual      = (float)$emp['annual_days'];
        $carried     = (float)$emp['carried_over_days'];
        $consumed    = (float)$emp['consumed_days'];
        $manual      = (float)$emp['manual_adjustments'];

        // Misma lógica diferenciada por signo que calendar.php v14.2.2
        if ($manual < 0) {
            $totalGenerated = $annual + $carried;
            $totalConsumed  = $consumed + abs($manual);
        } else {
            $totalGenerated = $annual + $carried + $manual;
            $totalConsumed  = $consumed;
        }

        $available = round($totalGenerated - $totalConsumed, 2);
        // El arrastre nunca puede ser negativo (deuda no se arrastra)
        $carryOver = max(0.0, $available);

        // UPSERT: si ya existe balance para targetYear, solo actualiza carried_over_days
        $stmtCheck = $pdo->prepare(
            "SELECT id FROM vacation_balances WHERE employee_id = ? AND year = ?"
        );
        $stmtCheck->execute([$empId, $targetYear]);
        $existing = $stmtCheck->fetch();

        if ($existing) {
            $stmtUpsert = $pdo->prepare(
                "UPDATE vacation_balances SET carried_over_days = ? WHERE employee_id = ? AND year = ?"
            );
            $stmtUpsert->execute([$carryOver, $empId, $targetYear]);
        } else {
            $stmtUpsert = $pdo->prepare(
                "INSERT INTO vacation_balances (employee_id, year, annual_days, carried_over_days, consumed_days, manual_adjustments)
                 VALUES (?, ?, 22, ?, 0, 0)"
            );
            $stmtUpsert->execute([$empId, $targetYear, $carryOver]);
        }

        $processed[] = [
            'name'       => $emp['full_name'],
            'location'   => $emp['location'],
            'available'  => $available,
            'carry_over' => $carryOver
        ];
    }

    $pdo->commit();

    echo json_encode([
        'success'    => true,
        'year_from'  => $year,
        'year_to'    => $targetYear,
        'processed'  => count($processed),
        'skipped'    => count($skipped),
        'detail'     => $processed,
        'skipped_detail' => $skipped
    ]);

} catch (PDOException $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    error_log("Error PDO en year-end-carryover.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Error de base de datos']);
}
?>
