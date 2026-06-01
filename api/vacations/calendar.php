<?php
// ✅ VERSO v14.2.2 - Calendar API con Lógica Consistente de Arrastres
require_once __DIR__ . '/../../config.php';
require_once __DIR__ . '/../cors.php';
require_once __DIR__ . '/../auth_check.php';
require_once __DIR__ . '/../permission_check.php';
require_module_permission('vacations');

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['error' => 'Método no permitido']);
    exit;
}

/**
 * Calcula días de vacaciones proporcionales según fecha de alta
 */
function calculateProportionalAnnualDays($hireDateStr, $year) {
    if (empty($hireDateStr)) {
        return 22.0;
    }

    try {
        $hireDate = new DateTime($hireDateStr);
        $startOfYear = new DateTime("$year-01-01");
        $endOfYear = new DateTime("$year-12-31");

        if ($hireDate <= $startOfYear) {
            return 22.0;
        }

        if ($hireDate > $endOfYear) {
            return 0.0;
        }

        $daysInYear = (int)$startOfYear->diff($endOfYear)->days + 1;
        $daysWorked = (int)$hireDate->diff($endOfYear)->days + 1;
        $proportional = (22.0 * $daysWorked) / $daysInYear;
        return round($proportional, 0);

    } catch (Exception $e) {
        error_log("Error calculando días proporcionales para $hireDateStr: " . $e->getMessage());
        return 22.0;
    }
}

try {
    $year = intval($_GET['year'] ?? date('Y'));
    $previousYear = $year - 1;

    $isMonthlyMode = isset($_GET['month']);
    $month = $isMonthlyMode ? intval($_GET['month']) : null;

    if ($year <= 0) {
        throw new Exception('Parámetro year inválido');
    }

    if ($isMonthlyMode && ($month < 1 || $month > 12)) {
        throw new Exception('Parámetro month inválido');
    }

    // ========================================
    // 1. EMPLEADOS ACTIVOS CON FECHA DE ALTA
    // ========================================
    $employees = [];
    $sqlEmp = "SELECT id, full_name, job_category, location, hire_date, status
               FROM employees
               WHERE status = 'active'
               ORDER BY full_name ASC";
    $resEmp = $pdo->query($sqlEmp);

    while ($row = $resEmp->fetch(PDO::FETCH_ASSOC)) {
        $employees[] = [
            'id' => (int)$row['id'],
            'full_name' => $row['full_name'],
            'job_category' => $row['job_category'],
            'location' => $row['location'],
            'hire_date' => $row['hire_date'],
            'status' => $row['status']
        ];
    }

    // ========================================
    // 2. SALDOS EXISTENTES (Año actual + Anterior)
    // ========================================
    $rawBalances = [];
    $sqlBal = "SELECT
                   employee_id, year,
                   carried_over_days, consumed_days, manual_adjustments
               FROM vacation_balances
               WHERE year IN (?, ?)
               ORDER BY year ASC";

    $stmtBal = $pdo->prepare($sqlBal);
    $stmtBal->execute([$year, $previousYear]);

    while ($row = $stmtBal->fetch(PDO::FETCH_ASSOC)) {
        $empId = (int)$row['employee_id'];
        $balYear = (int)$row['year'];

        if (!isset($rawBalances[$empId])) {
            $rawBalances[$empId] = [];
        }

        $rawBalances[$empId][$balYear] = [
            'carried_over_days' => (float)$row['carried_over_days'],
            'consumed_days' => (float)$row['consumed_days'],
            'manual_adjustments' => (float)($row['manual_adjustments'] ?? 0)
        ];
    }

    // ========================================
    // 3. ✅ RED DE SEGURIDAD: AUSENCIAS REALES AÑO ANTERIOR
    // ========================================
    $prevYearRealConsumption = [];
    $sqlPrevAbs = "SELECT
                       employee_id,
                       SUM(working_days_count) as total_consumed
                   FROM employee_absences
                   WHERE year = ?
                     AND absence_type = 'vacation'
                     AND status != 'rejected'
                   GROUP BY employee_id";

    $stmtPrevAbs = $pdo->prepare($sqlPrevAbs);
    $stmtPrevAbs->execute([$previousYear]);

    while ($row = $stmtPrevAbs->fetch(PDO::FETCH_ASSOC)) {
        $prevYearRealConsumption[(int)$row['employee_id']] = (float)$row['total_consumed'];
    }

    // ========================================
    // 4. CONSTRUCCIÓN DE SALDOS CON RED DE SEGURIDAD
    // ========================================
    $balances = [];

    foreach ($employees as $emp) {
        $empId = $emp['id'];
        $hireDate = $emp['hire_date'];

        // Calcular días anuales proporcionales para año actual
        $annualDaysCalculated = calculateProportionalAnnualDays($hireDate, $year);

        // ✅ LÓGICA DE HERENCIA CON RED DE SEGURIDAD
        $calculatedCarryOver = 0.0;

        if (isset($rawBalances[$empId][$previousYear])) {
            // CASO A: Existe registro explícito del año anterior → USAR ESE DATO
            $prevB = $rawBalances[$empId][$previousYear];
            $annualDaysPrevious = calculateProportionalAnnualDays($hireDate, $previousYear);

            // =========================================================
            // ✅ CORRECCIÓN v14.2.2: LÓGICA CONSISTENTE DE ARRASTRES
            // Aplica la MISMA lógica de ajustes +/- que el año actual
            // =========================================================
            $prevManual = (float)$prevB['manual_adjustments'];
            $prevCarried = (float)$prevB['carried_over_days'];
            $prevConsumed = (float)$prevB['consumed_days'];

            if ($prevManual < 0) {
                // Ajustes negativos = vacaciones pagadas (cuentan como consumidas)
                $prevTotalGenerated = $annualDaysPrevious + $prevCarried;
                $prevTotalConsumed = $prevConsumed + abs($prevManual);
            } else {
                // Ajustes positivos = arrastres extra (suman al generado)
                $prevTotalGenerated = $annualDaysPrevious + $prevCarried + $prevManual;
                $prevTotalConsumed = $prevConsumed;
            }

            // Disponible año anterior = Arrastre para este año
            $calculatedCarryOver = $prevTotalGenerated - $prevTotalConsumed;

        } else {
            // CASO B: NO existe registro → RED DE SEGURIDAD (Consultar ausencias reales)
            $realConsumption = $prevYearRealConsumption[$empId] ?? 0.0;

            if ($realConsumption > 0) {
                // Empleado SÍ tuvo ausencias el año anterior, calcular saldo real
                $annualDaysPrevious = calculateProportionalAnnualDays($hireDate, $previousYear);

                // ✅ FÓRMULA: Días Base - Días Realmente Consumidos = Saldo Real
                $calculatedCarryOver = $annualDaysPrevious - $realConsumption;
            }
            // Si no tuvo ausencias, el arrastre queda en 0.0 (correcto)
        }

        // ============================================
        // 4.b ✅ LÓGICA DIFERENCIADA POR SIGNO (AÑO ACTUAL)
        // ============================================
        if (isset($rawBalances[$empId][$year])) {
            // Registro explícito existe - RESPETAR datos de BD configurados manualmente
            $b = $rawBalances[$empId][$year];
            $manual = $b['manual_adjustments'];

            // ✅ LÓGICA DE PRECEDENCIA ROBUSTA: BD primero, cálculo como fallback
            if (isset($b['carried_over_days']) && abs((float)$b['carried_over_days']) > 0.01) {
                // Existe arrastre explícito en BD → USAR ESE
                $carriedOver = (float)$b['carried_over_days'];
            } else {
                // No hay arrastre explícito o es 0 → usar cálculo dinámico
                $carriedOver = $calculatedCarryOver;
            }

            // ✅ LÓGICA DIFERENCIADA POR SIGNO DEL AJUSTE
            if ($manual < 0) {
                // AJUSTES NEGATIVOS = Vacaciones pagadas (cuentan como consumidas)
                $consumed = $b['consumed_days'] + abs($manual);
                $totalGenerated = $annualDaysCalculated + $carriedOver;
            } else {
                // AJUSTES POSITIVOS = Arrastres extra, días adicionales
                $consumed = $b['consumed_days'];
                $totalGenerated = $annualDaysCalculated + $carriedOver + $manual;
            }
        } else {
            // Año virgen sin registro → usar cálculo dinámico completo
            $consumed = 0.0;
            $manual = 0.0;
            $carriedOver = $calculatedCarryOver;
            $totalGenerated = $annualDaysCalculated + $carriedOver;
        }

        // Cálculo final
        $available = $totalGenerated - $consumed;

        $balances[$empId] = [
            'annual_days' => $annualDaysCalculated,
            'carried_over_days' => $carriedOver,
            'consumed_days' => $consumed,
            'manual_adjustments' => $manual,
            'available_days' => $available
        ];
    }

    // ========================================
    // 5. ✅ AUSENCIAS - CORRECCIÓN CRÍTICA MULTI-MES
    // ========================================
    $absences = [];

    if ($isMonthlyMode) {
        $firstDay = sprintf('%04d-%02d-01', $year, $month);
        $lastDay = date('Y-m-t', strtotime($firstDay));

        // ✅ Filtrado por CRUCE DE FECHAS (no solo por año)
        $sqlAbs = "SELECT
                       id, employee_id, absence_type, start_date, end_date,
                       working_days_count, notes
                   FROM employee_absences
                   WHERE (start_date <= ? AND end_date >= ?)
                     AND status != 'rejected'
                   ORDER BY start_date ASC";

        $stmtAbs = $pdo->prepare($sqlAbs);
        $stmtAbs->execute([$lastDay, $firstDay]);

    } else {
        // Modo anual — filtro opcional por empleado individual
        $filterEmployeeId = isset($_GET['employee_id']) ? intval($_GET['employee_id']) : null;

        if ($filterEmployeeId !== null && $filterEmployeeId > 0) {
            $sqlAbs = "SELECT
                           id, employee_id, absence_type, start_date, end_date,
                           working_days_count, notes
                       FROM employee_absences
                       WHERE year = ? AND employee_id = ?
                       ORDER BY start_date ASC";
            $stmtAbs = $pdo->prepare($sqlAbs);
            $stmtAbs->execute([$year, $filterEmployeeId]);
        } else {
            $sqlAbs = "SELECT
                           id, employee_id, absence_type, start_date, end_date,
                           working_days_count, notes
                       FROM employee_absences
                       WHERE year = ?
                       ORDER BY start_date ASC";
            $stmtAbs = $pdo->prepare($sqlAbs);
            $stmtAbs->execute([$year]);
        }
    }

    while ($row = $stmtAbs->fetch(PDO::FETCH_ASSOC)) {
        $absences[] = [
            'id' => (int)$row['id'],
            'employee_id' => (int)$row['employee_id'],
            'absence_type' => $row['absence_type'],
            'start_date' => $row['start_date'],
            'end_date' => $row['end_date'],
            'working_days_count' => (float)$row['working_days_count'],
            'notes' => $row['notes']
        ];
    }

    // ========================================
    // 6. FESTIVOS - LÓGICA CONDICIONAL POR MODO
    // ========================================
    $holidays = [];

    if ($isMonthlyMode) {
        $sqlHol = "SELECT holiday_date, description, type
                   FROM holidays
                   WHERE year = ? AND MONTH(holiday_date) = ? AND is_active = TRUE
                   ORDER BY holiday_date ASC";
        $stmtHol = $pdo->prepare($sqlHol);
        $stmtHol->execute([$year, $month]);

    } else {
        $sqlHol = "SELECT holiday_date, description, type
                   FROM holidays
                   WHERE year = ? AND is_active = TRUE
                   ORDER BY holiday_date ASC";
        $stmtHol = $pdo->prepare($sqlHol);
        $stmtHol->execute([$year]);
    }

    while ($row = $stmtHol->fetch(PDO::FETCH_ASSOC)) {
        $holidays[] = [
            'holiday_date' => $row['holiday_date'],
            'description' => $row['description'],
            'type' => $row['type']
        ];
    }

    echo json_encode([
        'success' => true,
        'year' => $year,
        'month' => $month,
        'employees' => $employees,
        'balances' => $balances,
        'absences' => $absences,
        'holidays' => $holidays
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'error' => $e->getMessage(),
        'debug' => [
            'file' => basename(__FILE__),
            'line' => $e->getLine()
        ]
    ]);
}
?>
