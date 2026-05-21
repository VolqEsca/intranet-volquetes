<?php
// ✅ VERSO v14.2.1 - Motor de Desglose Automático (CORREGIDO)
require_once __DIR__ . '/../cors.php';
require_once __DIR__ . '/../auth_check.php';
require_once __DIR__ . '/../../config.php';
require_once __DIR__ . '/../permission_check.php';
require_module_permission('vacations');

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Método no permitido']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);

// Validaciones básicas (mantienen la lógica existente)
$required_fields = ['employee_id', 'absence_type', 'start_date', 'end_date'];
foreach ($required_fields as $field) {
    if (!isset($data[$field]) || (empty($data[$field]) && $data[$field] !== 0)) {
        http_response_code(400);
        echo json_encode(['error' => "El campo '$field' es requerido"]);
        exit;
    }
}

if ($data['start_date'] > $data['end_date']) {
    http_response_code(400);
    echo json_encode(['error' => 'La fecha de inicio no puede ser posterior a la fecha de fin']);
    exit;
}

$validTypes = ['vacation', 'special_permit', 'sick_leave', 'unpaid_leave'];
if (!in_array($data['absence_type'], $validTypes)) {
    http_response_code(400);
    echo json_encode(['error' => 'Tipo de ausencia inválido']);
    exit;
}

try {
    // Validación de solapamientos (mantener lógica existente)
    $stmtOverlap = $pdo->prepare("
        SELECT id, absence_type, start_date, end_date 
        FROM employee_absences 
        WHERE employee_id = ? 
        AND start_date <= ? 
        AND end_date >= ?
        AND status != 'rejected'
    ");
    
    $stmtOverlap->execute([
        $data['employee_id'], 
        $data['end_date'], 
        $data['start_date']
    ]);
    
    $existingAbsence = $stmtOverlap->fetch(PDO::FETCH_ASSOC);
    
    if ($existingAbsence) {
        http_response_code(409);
        echo json_encode([
            'error' => 'Conflicto de fechas detectado',
            'details' => "El empleado ya tiene una ausencia registrada que se solapa con este período (del {$existingAbsence['start_date']} al {$existingAbsence['end_date']}).",
            'existing_absence' => [
                'id' => $existingAbsence['id'],
                'type' => $existingAbsence['absence_type'],
                'start_date' => $existingAbsence['start_date'],
                'end_date' => $existingAbsence['end_date']
            ]
        ]);
        exit;
    }

    // =========================================================
    // 🆕 MOTOR DE DESGLOSE AUTOMÁTICO v14.2.1
    // La solución definitiva al "Bug del Puente de Año"
    // =========================================================
    function calculateSmartBreakdown($pdo, $startDate, $endDate) {
        $breakdown = [];
        $totalWorkingDays = 0;
        
        // Obtener festivos del rango completo (optimizado por rango, no por año)
        $stmt = $pdo->prepare("
            SELECT holiday_date 
            FROM holidays 
            WHERE holiday_date BETWEEN ? AND ? 
            AND is_active = TRUE
        ");
        $stmt->execute([$startDate, $endDate]);
        $holidays = array_column($stmt->fetchAll(PDO::FETCH_COLUMN), 0);
        
        // Calcular día a día, agrupando por año-mes
        $current = new DateTime($startDate);
        $end = new DateTime($endDate);
        
        while ($current <= $end) {
            $dateStr = $current->format('Y-m-d');
            $yearMonth = $current->format('Y-m');
            $dayOfWeek = (int)$current->format('N'); // 1=Lunes, 7=Domingo
            
            // Contar solo días laborales (L-V, no festivos)
            if ($dayOfWeek < 6 && !in_array($dateStr, $holidays)) {
                if (!isset($breakdown[$yearMonth])) {
                    $breakdown[$yearMonth] = 0;
                }
                $breakdown[$yearMonth]++;
                $totalWorkingDays++;
            }
            
            $current->modify('+1 day');
        }
        
        return [
            'breakdown' => $breakdown,
            'total' => $totalWorkingDays
        ];
    }
    
    $desglose = calculateSmartBreakdown($pdo, $data['start_date'], $data['end_date']);
    $working_days_count = $desglose['total'];
    
    if ($working_days_count <= 0) {
        http_response_code(400);
        echo json_encode(['error' => 'El rango de fechas no contiene días laborales']);
        exit;
    }

    // Año fiscal principal (para compatibilidad con reports existentes)
    $year = (int)date('Y', strtotime($data['start_date']));

    // =========================================================
    // 🆕 TRANSACCIÓN ATÓMICA CON DESGLOSE INTELIGENTE
    // =========================================================
    $pdo->beginTransaction();

    // 1. Crear ausencia principal (mantener estructura existente)
    $sql = "INSERT INTO employee_absences (
        employee_id, absence_type, start_date, end_date, 
        working_days_count, year, notes, status, 
        created_by, approved_by, approved_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, 'approved', ?, ?, NOW())";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        $data['employee_id'],
        $data['absence_type'],
        $data['start_date'],
        $data['end_date'],
        $working_days_count,
        $year,
        $data['notes'] ?? null,
        $_SESSION['user']['id'] ?? 0,
        $_SESSION['user']['id'] ?? 0
    ]);

    $absence_id = $pdo->lastInsertId();

    // =========================================================
    // 2. ✅ CORRECCIÓN CRÍTICA: BACKTICKS EN QUERY SQL
    // Guardar desglose detallado en nueva tabla
    // =========================================================
    $stmtBreakdown = $pdo->prepare("
        INSERT INTO `absence_breakdown` (`absence_id`, `year_month`, `working_days`)
        VALUES (?, ?, ?)
    ");
    
    foreach ($desglose['breakdown'] as $yearMonth => $days) {
        $stmtBreakdown->execute([$absence_id, $yearMonth, $days]);
    }

    // 3. ✅ ACTUALIZACIÓN INTELIGENTE DE SALDOS MULTI-AÑO
    // La corrección definitiva del bug
    if ($data['absence_type'] === 'vacation') {
        foreach ($desglose['breakdown'] as $yearMonth => $days) {
            $yearOnly = (int)substr($yearMonth, 0, 4); // 2025-12 → 2025
            
            // Verificar/crear registro de saldo para ese año específico
            $stmt_check = $pdo->prepare("SELECT id FROM vacation_balances WHERE employee_id = ? AND year = ?");
            $stmt_check->execute([$data['employee_id'], $yearOnly]);
            
            if (!$stmt_check->fetch()) {
                // Crear registro si no existe (empleados nuevos o años futuros)
                $stmt_create = $pdo->prepare("
                    INSERT INTO vacation_balances 
                    (employee_id, year, annual_days, carried_over_days, consumed_days, manual_adjustments) 
                    VALUES (?, ?, 22, 0, 0, 0)
                ");
                $stmt_create->execute([$data['employee_id'], $yearOnly]);
            }
            
            // ✅ CORRECCIÓN CRÍTICA: Actualizar saldo DEL AÑO CORRESPONDIENTE
            // con la cantidad EXACTA de días de ese año
            $stmt_update = $pdo->prepare("
                UPDATE vacation_balances 
                SET consumed_days = consumed_days + ? 
                WHERE employee_id = ? AND year = ?
            ");
            $stmt_update->execute([$days, $data['employee_id'], $yearOnly]);
        }
    }

    // 4. Registrar en historial (mantener auditoría existente)
    $stmt = $pdo->prepare("
        INSERT INTO absence_history (absence_id, action, user_id, created_at)
        VALUES (?, 'created', ?, NOW())
    ");
    $stmt->execute([$absence_id, $_SESSION['user']['id'] ?? 0]);

    // Confirmar transacción
    $pdo->commit();

    // Response con información del desglose
    $response = [
        'success' => true,
        'message' => 'Ausencia creada correctamente',
        'absence_id' => $absence_id
    ];
    
    // Información adicional si la ausencia cruza períodos
    if (count($desglose['breakdown']) > 1) {
        $desglose_info = [];
        foreach ($desglose['breakdown'] as $ym => $d) {
            $desglose_info[] = "$ym: $d días";
        }
        $response['breakdown_info'] = "⚠️ Ausencia multi-período: " . implode(', ', $desglose_info);
    }

    echo json_encode($response);

} catch (PDOException $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    error_log("Error PDO en vacations/create.php v14.2.1: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Error de base de datos al crear la ausencia',
        'details' => $e->getMessage()
    ]);

} catch (Exception $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    error_log("Error general en vacations/create.php v14.2.1: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Error interno al crear la ausencia',
        'details' => $e->getMessage()
    ]);
}
?>
