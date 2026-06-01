<?php
require_once __DIR__ . '/../../config.php';
require_once __DIR__ . '/../cors.php';
require_once __DIR__ . '/../auth_check.php';
require_once __DIR__ . '/../permission_check.php';
require_module_permission('vacations');

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'PUT') {
    http_response_code(405);
    echo json_encode(['error' => 'Método no permitido']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);

// Validar datos requeridos (mismo patrón que create.php)
$required_fields = ['id', 'absence_type', 'start_date', 'end_date'];
foreach ($required_fields as $field) {
    if (!isset($data[$field]) || (empty($data[$field]) && $data[$field] !== 0)) {
        http_response_code(400);
        echo json_encode(['error' => "El campo '$field' es requerido"]);
        exit;
    }
}

// ✅ ACTUALIZADO: Añadido 'unpaid_leave' a los tipos válidos
$validTypes = ['vacation', 'special_permit', 'sick_leave', 'unpaid_leave'];
if (!in_array($data['absence_type'], $validTypes)) {
    http_response_code(400);
    echo json_encode(['error' => 'Tipo de ausencia inválido']);
    exit;
}

try {
    // Calcular días laborales (misma función que create.php)
    function calculateWorkingDays($pdo, $startDate, $endDate) {
        $start = new DateTime($startDate);
        $end = new DateTime($endDate);
        $end->modify('+1 day');
        
        $workingDays = 0;
        
        $stmt = $pdo->prepare("SELECT holiday_date FROM holidays WHERE holiday_date BETWEEN ? AND ? AND is_active = TRUE");
        $stmt->execute([$startDate, $endDate]);
        $dbHolidays = $stmt->fetchAll(PDO::FETCH_COLUMN);
        
        $interval = new DateInterval('P1D');
        $period = new DatePeriod($start, $interval, $end);
        
        foreach ($period as $dt) {
            $dayOfWeek = $dt->format('N');
            $dateString = $dt->format('Y-m-d');
            if ($dayOfWeek < 6 && !in_array($dateString, $dbHolidays)) {
                $workingDays++;
            }
        }
        return $workingDays;
    }

    $new_working_days = calculateWorkingDays($pdo, $data['start_date'], $data['end_date']);
    
    if ($new_working_days <= 0) {
        http_response_code(400);
        echo json_encode(['error' => 'El rango de fechas no contiene días laborales']);
        exit;
    }

    $pdo->beginTransaction();

    // 1. Obtener datos actuales con bloqueo
    $stmt = $pdo->prepare("
        SELECT ea.*, e.full_name as employee_name
        FROM employee_absences ea
        JOIN employees e ON ea.employee_id = e.id
        WHERE ea.id = ?
        FOR UPDATE
    ");
    $stmt->execute([$data['id']]);
    $old_absence = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$old_absence) {
        throw new Exception('Ausencia no encontrada');
    }

    $year = (int)date('Y', strtotime($data['start_date']));

    // 2. ✅ REVERTIR SALDO ANTERIOR (solo si era vacation aprobada)
    // 'unpaid_leave' NO entra aquí = NO se revierte nada (comportamiento correcto)
    $rollback_days = 0;
    if ($old_absence['absence_type'] === 'vacation' && $old_absence['status'] === 'approved') {
        $stmt = $pdo->prepare("
            UPDATE vacation_balances 
            SET consumed_days = consumed_days - ? 
            WHERE employee_id = ? AND year = ?
        ");
        $stmt->execute([$old_absence['working_days_count'], $old_absence['employee_id'], $old_absence['year']]);
        $rollback_days = $old_absence['working_days_count'];
    }

    // 3. ACTUALIZAR LA AUSENCIA
    $sql = "UPDATE employee_absences SET 
            absence_type = ?, 
            start_date = ?, 
            end_date = ?, 
            working_days_count = ?, 
            year = ?, 
            notes = ? 
            WHERE id = ?";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        $data['absence_type'],
        $data['start_date'],
        $data['end_date'],
        $new_working_days,
        $year,
        $data['notes'] ?? null,
        $data['id']
    ]);

    // 3b. RECALCULAR absence_breakdown (fix B1: edición no actualizaba el desglose por mes)
    $stmt = $pdo->prepare("DELETE FROM `absence_breakdown` WHERE absence_id = ?");
    $stmt->execute([$data['id']]);

    // Iterar día a día y agrupar días laborables por year_month (lógica de calculateSmartBreakdown)
    $bdStart = new DateTime($data['start_date']);
    $bdEnd   = new DateTime($data['end_date']);
    $bdEnd->modify('+1 day');
    $bdInterval = new DateInterval('P1D');
    $bdPeriod   = new DatePeriod($bdStart, $bdInterval, $bdEnd);

    $bdHolidayStmt = $pdo->prepare(
        "SELECT holiday_date FROM holidays WHERE holiday_date BETWEEN ? AND ? AND is_active = TRUE"
    );
    $bdHolidayStmt->execute([$data['start_date'], $data['end_date']]);
    $bdHolidays = $bdHolidayStmt->fetchAll(PDO::FETCH_COLUMN);

    $bdByMonth = [];
    foreach ($bdPeriod as $bdDt) {
        $dow      = (int)$bdDt->format('N');
        $dateStr  = $bdDt->format('Y-m-d');
        $yearMonth = $bdDt->format('Y-m');
        if ($dow < 6 && !in_array($dateStr, $bdHolidays)) {
            $bdByMonth[$yearMonth] = ($bdByMonth[$yearMonth] ?? 0) + 1;
        }
    }

    $bdInsert = $pdo->prepare(
        "INSERT INTO `absence_breakdown` (absence_id, `year_month`, working_days) VALUES (?, ?, ?)"
    );
    foreach ($bdByMonth as $ym => $days) {
        $bdInsert->execute([$data['id'], $ym, $days]);
    }

    // 4. ✅ APLICAR NUEVO SALDO (solo si la NUEVA ausencia es vacation)
    // 'unpaid_leave' NO entra aquí = NO descuenta saldo (comportamiento correcto)
    $applied_days = 0;
    if ($data['absence_type'] === 'vacation') {
        // Asegurar que existe saldo para el año (si cambió año)
        $stmt_check = $pdo->prepare("SELECT id FROM vacation_balances WHERE employee_id = ? AND year = ?");
        $stmt_check->execute([$old_absence['employee_id'], $year]);
        
        if (!$stmt_check->fetch()) {
             $stmt_create = $pdo->prepare("INSERT INTO vacation_balances (employee_id, year, annual_days, carried_over_days, consumed_days, manual_adjustments) VALUES (?, ?, 22, 0, 0, 0)");
             $stmt_create->execute([$old_absence['employee_id'], $year]);
        }

        $stmt = $pdo->prepare("UPDATE vacation_balances SET consumed_days = consumed_days + ? WHERE employee_id = ? AND year = ?");
        $stmt->execute([$new_working_days, $old_absence['employee_id'], $year]);
        $applied_days = $new_working_days;
    }

    // 5. Registrar en historial (auditoría)
    $stmt = $pdo->prepare("
        INSERT INTO absence_history (absence_id, action, old_value, user_id, created_at)
        VALUES (?, 'updated', ?, ?, NOW())
    ");
    $stmt->execute([
        $data['id'],
        json_encode($old_absence),
        $_SESSION['user']['id'] ?? 0
    ]);

    $pdo->commit();

    echo json_encode([
        'success' => true,
        'message' => "Ausencia actualizada para {$old_absence['employee_name']}" . 
                    ($rollback_days > 0 || $applied_days > 0 ? 
                     " (saldo: -{$rollback_days} +{$applied_days} días)" : ""),
        'data' => [
            'id' => $data['id'],
            'working_days_count' => $new_working_days,
            'rollback_days' => $rollback_days,
            'applied_days' => $applied_days
        ]
    ]);

} catch (PDOException $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    error_log("Error PDO en update.php: " . $e->getMessage());
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
