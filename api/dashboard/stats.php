<?php
/**
 * VERSO Command Center v14.3.2 - Dashboard Stats API
 * Refinamiento: Detalle completo ausencias HOY
 */

require_once __DIR__ . '/../../config.php';
require_once __DIR__ . '/../cors.php';
require_once __DIR__ . '/../auth_check.php';

header('Content-Type: application/json; charset=utf-8');

try {
    $alerts = [];
    $kpis = [];

    // ===================================================================
    // SECCIÓN 1: KPIs PRODUCCIÓN (sin cambios)
    // ===================================================================
    
    // KPI 1: Órdenes de Reparación
    $stmt_or = $pdo->prepare("
        SELECT COUNT(*) as total
        FROM work_orders
        WHERE status IN ('pending', 'in_progress')
    ");
    $stmt_or->execute();
    $kpis['or_active'] = (int)$stmt_or->fetch(PDO::FETCH_ASSOC)['total'];

    $stmt_or_critical = $pdo->prepare("
        SELECT COUNT(*) as total
        FROM work_orders
        WHERE status IN ('pending', 'in_progress')
        AND DATEDIFF(NOW(), created_at) > 7
    ");
    $stmt_or_critical->execute();
    $kpis['or_critical'] = (int)$stmt_or_critical->fetch(PDO::FETCH_ASSOC)['total'];

    $stmt_or_progress = $pdo->prepare("
        SELECT COUNT(*) as total
        FROM work_orders
        WHERE status = 'in_progress'
    ");
    $stmt_or_progress->execute();
    $kpis['or_in_progress'] = (int)$stmt_or_progress->fetch(PDO::FETCH_ASSOC)['total'];

    // KPI 2: Órdenes de Fabricación
    $stmt_of = $pdo->prepare("
        SELECT COUNT(*) as total
        FROM manufacturing_orders
        WHERE status IN ('pending', 'in_progress')
    ");
    $stmt_of->execute();
    $kpis['of_active'] = (int)$stmt_of->fetch(PDO::FETCH_ASSOC)['total'];

    $stmt_of_pending = $pdo->prepare("
        SELECT COUNT(*) as total
        FROM manufacturing_orders
        WHERE status = 'pending'
    ");
    $stmt_of_pending->execute();
    $kpis['of_pending'] = (int)$stmt_of_pending->fetch(PDO::FETCH_ASSOC)['total'];

    $stmt_of_progress = $pdo->prepare("
        SELECT COUNT(*) as total
        FROM manufacturing_orders
        WHERE status = 'in_progress'
    ");
    $stmt_of_progress->execute();
    $kpis['of_in_progress'] = (int)$stmt_of_progress->fetch(PDO::FETCH_ASSOC)['total'];

    // ===================================================================
    // SECCIÓN 2: KPIs RRHH (Expandidos con detalle)
    // ===================================================================

    $stmt_emp = $pdo->prepare("
        SELECT COUNT(*) as total
        FROM employees
        WHERE status = 'active'
    ");
    $stmt_emp->execute();
    $kpis['employees_total'] = (int)$stmt_emp->fetch(PDO::FETCH_ASSOC)['total'];

    // 🆕 CRÍTICO: Detalle completo de ausencias HOY (nombre + tipo legible)
    $stmt_emp_absent_detail = $pdo->prepare("
        SELECT 
            e.full_name,
            ea.absence_type,
            CASE ea.absence_type
                WHEN 'vacation' THEN 'Vacaciones'
                WHEN 'sick_leave' THEN 'Baja médica'
                WHEN 'permit' THEN 'Permiso'
                WHEN 'unpaid_leave' THEN 'Excedencia'
                WHEN 'medical' THEN 'Baja médica'
                WHEN 'personal' THEN 'Asuntos propios'
                ELSE 'Ausencia'
            END as tipo_legible
        FROM employee_absences ea
        JOIN employees e ON ea.employee_id = e.id
        WHERE ea.status = 'approved'
        AND CURDATE() BETWEEN ea.start_date AND ea.end_date
        AND e.status = 'active'
        ORDER BY e.full_name ASC
    ");
    $stmt_emp_absent_detail->execute();
    $absences_detail = $stmt_emp_absent_detail->fetchAll(PDO::FETCH_ASSOC);
    
    $kpis['employees_absent_today'] = count($absences_detail);
    $kpis['employees_absent_detail'] = $absences_detail; // 🆕 Array completo con detalles

    // Saldos negativos (Motor Inteligente v14.2.2 - fórmula exacta)
    $currentYear = (int)date('Y');
    $stmt_negative = $pdo->prepare("
        SELECT COUNT(DISTINCT vb.employee_id) as total
        FROM vacation_balances vb
        WHERE vb.year = :year
        AND (
            vb.annual_days + vb.carried_over_days + 
            CASE WHEN vb.manual_adjustments > 0 THEN vb.manual_adjustments ELSE 0 END - 
            vb.consumed_days - 
            CASE WHEN vb.manual_adjustments < 0 THEN ABS(vb.manual_adjustments) ELSE 0 END
        ) < 0
    ");
    $stmt_negative->execute(['year' => $currentYear]);
    $kpis['employees_negative_balance'] = (int)$stmt_negative->fetch(PDO::FETCH_ASSOC)['total'];

    // Total ausencias históricas
    $stmt_vac_total = $pdo->prepare("
        SELECT COUNT(*) as total
        FROM employee_absences
        WHERE absence_type = 'vacation' AND status != 'rejected'
    ");
    $stmt_vac_total->execute();
    $kpis['vacations_historical_total'] = (int)$stmt_vac_total->fetch(PDO::FETCH_ASSOC)['total'];

    // ===================================================================
    // SECCIÓN 3: ALERTAS RRHH CRÍTICAS (PRESERVADAS)
    // ===================================================================
    
    // [Código de alertas sin cambios - contratos, vacaciones, cumpleaños]
    $stmt_vacaciones = $pdo->prepare("
        SELECT 
            COUNT(DISTINCT ea.employee_id) as total,
            GROUP_CONCAT(DISTINCT e.full_name ORDER BY e.full_name SEPARATOR ', ') as nombres
        FROM employee_absences ea
        JOIN employees e ON ea.employee_id = e.id
        WHERE ea.status = 'approved'
          AND ea.absence_type = 'vacation'
          AND CURDATE() BETWEEN ea.start_date AND ea.end_date
          AND e.status = 'active'
    ");
    $stmt_vacaciones->execute();
    $vacaciones = $stmt_vacaciones->fetch(PDO::FETCH_ASSOC);
    
    if ($vacaciones['total'] > 0) {
        $alerts[] = [
            'type' => 'info',
            'icon' => 'plane',
            'title' => 'Ausencias Hoy',
            'count' => (int)$vacaciones['total'],
            'message' => $vacaciones['total'] == 1 
                ? $vacaciones['nombres'] . ' está de vacaciones'
                : $vacaciones['total'] . ' empleados de vacaciones',
            'action_path' => '/vacations'
        ];
    }
    
    $stmt_cumples = $pdo->prepare("
        SELECT 
            COUNT(*) as total,
            GROUP_CONCAT(full_name ORDER BY full_name SEPARATOR ', ') as nombres
        FROM employees
        WHERE status = 'active'
          AND birth_date IS NOT NULL
          AND MONTH(birth_date) = MONTH(CURDATE())
          AND DAY(birth_date) = DAY(CURDATE())
    ");
    $stmt_cumples->execute();
    $cumples = $stmt_cumples->fetch(PDO::FETCH_ASSOC);
    
    if ($cumples['total'] > 0) {
        $alerts[] = [
            'type' => 'info',
            'icon' => 'cake',
            'title' => 'Cumpleaños Hoy',
            'count' => (int)$cumples['total'],
            'message' => $cumples['total'] == 1 
                ? '🎂 Hoy cumple ' . $cumples['nombres']
                : '🎂 ' . $cumples['total'] . ' cumpleaños: ' . $cumples['nombres'],
            'action_path' => '/employees'
        ];
    }
    
    $stmt_contratos = $pdo->prepare("
        SELECT 
            COUNT(*) as total,
            GROUP_CONCAT(
                CONCAT(full_name, ' (', DATEDIFF(contract_end_date, CURDATE()), 
                       CASE 
                           WHEN DATEDIFF(contract_end_date, CURDATE()) = 1 THEN ' día)'
                           ELSE ' días)'
                       END
                )
                ORDER BY contract_end_date ASC
                SEPARATOR ', '
            ) as detalles
        FROM employees
        WHERE status = 'active'
          AND contract_type = 'Temporal'
          AND contract_end_date IS NOT NULL
          AND contract_end_date > CURDATE()
          AND DATEDIFF(contract_end_date, CURDATE()) <= 15
    ");
    $stmt_contratos->execute();
    $contratos = $stmt_contratos->fetch(PDO::FETCH_ASSOC);
    
    if ($contratos['total'] > 0) {
        $alerts[] = [
            'type' => 'critical',
            'icon' => 'alert-triangle',
            'title' => 'Contratos por Vencer',
            'count' => (int)$contratos['total'],
            'message' => $contratos['detalles'],
            'action_path' => '/employees'
        ];
    }

    echo json_encode([
        'success' => true,
        'data' => [
            'alerts' => $alerts,
            'kpis' => $kpis,
            'timestamp' => date('Y-m-d H:i:s')
        ]
    ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    
} catch (PDOException $e) {
    error_log("Error PDO dashboard/stats: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Error al obtener estadísticas del dashboard'
    ], JSON_UNESCAPED_UNICODE);
}
?>
