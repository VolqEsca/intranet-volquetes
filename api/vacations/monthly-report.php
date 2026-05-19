<?php
require_once __DIR__ . '/../cors.php';
require_once __DIR__ . '/../auth_check.php';
require_once __DIR__ . '/../../config.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['error' => 'Método no permitido']);
    exit;
}

$year = (int)($_GET['year'] ?? date('Y'));
$month = (int)($_GET['month'] ?? date('n'));

if ($year < 2000 || $year > 2100 || $month < 1 || $month > 12) {
    http_response_code(400);
    echo json_encode(['error' => 'Parámetros año/mes inválidos']);
    exit;
}

try {
    // Obtener festivos del mes para cálculos precisos
    $stmt_holidays = $pdo->prepare("
        SELECT holiday_date 
        FROM holidays 
        WHERE YEAR(holiday_date) = ? AND is_active = TRUE
    ");
    $stmt_holidays->execute([$year]);
    $holidays = array_column($stmt_holidays->fetchAll(PDO::FETCH_ASSOC), 'holiday_date');

    // Obtener ausencias que intersectan con el mes objetivo
    $firstDay = sprintf("%04d-%02d-01", $year, $month);
    $lastDay = date('Y-m-t', strtotime($firstDay));

    $sql = "
        SELECT 
            e.full_name,
            ea.absence_type,
            ea.start_date,
            ea.end_date
        FROM employee_absences ea
        JOIN employees e ON ea.employee_id = e.id
        WHERE ea.status = 'approved'
          AND e.status = 'active'
          AND ea.absence_type IN ('vacation', 'unpaid_leave')
          AND (
            (ea.start_date BETWEEN ? AND ?) OR
            (ea.end_date BETWEEN ? AND ?) OR
            (ea.start_date <= ? AND ea.end_date >= ?)
          )
        ORDER BY 
            FIELD(ea.absence_type, 'vacation', 'unpaid_leave'),
            e.full_name,
            ea.start_date
    ";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$firstDay, $lastDay, $firstDay, $lastDay, $firstDay, $lastDay]);
    $absences = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Procesar ausencias con desglose semanal
    $processedData = processMonthlyAbsences($absences, $year, $month, $holidays);

    echo json_encode([
        'success' => true,
        'year' => $year,
        'month' => $month,
        'data' => $processedData
    ]);

} catch (PDOException $e) {
    error_log("Error en monthly-report.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Error al generar el reporte'
    ]);
}

/**
 * Procesa ausencias y las agrupa por empleado con desglose semanal
 */
function processMonthlyAbsences($absences, $year, $month, $holidays) {
    $result = [
        'vacations' => [],
        'unpaid_leaves' => []
    ];

    foreach ($absences as $absence) {
        $type = $absence['absence_type'];
        $employeeName = $absence['full_name'];
        
        // Generar rangos semanales para esta ausencia
        $weeklyRanges = generateWeeklyRanges(
            $absence['start_date'], 
            $absence['end_date'], 
            $year, 
            $month, 
            $holidays
        );

        // Filtrar rangos con 0 días laborales
        $weeklyRanges = array_filter($weeklyRanges, function($range) {
            return $range['working_days'] > 0;
        });

        if (empty($weeklyRanges)) {
            continue;
        }

        $targetArray = $type === 'vacation' ? 'vacations' : 'unpaid_leaves';
        
        if (!isset($result[$targetArray][$employeeName])) {
            $result[$targetArray][$employeeName] = [];
        }

        $result[$targetArray][$employeeName] = array_merge(
            $result[$targetArray][$employeeName], 
            $weeklyRanges
        );
    }

    // Ordenar por nombre de empleado
    ksort($result['vacations']);
    ksort($result['unpaid_leaves']);

    return $result;
}

/**
 * Genera rangos semanales (L-V) dentro del mes objetivo
 */
function generateWeeklyRanges($startDate, $endDate, $targetYear, $targetMonth, $holidays) {
    $ranges = [];
    $current = new DateTime($startDate);
    $end = new DateTime($endDate);
    
    // Límites del mes objetivo
    $monthStart = new DateTime(sprintf("%04d-%02d-01", $targetYear, $targetMonth));
    $monthEnd = new DateTime($monthStart->format('Y-m-t'));

    // Ajustar fechas al mes objetivo
    if ($current < $monthStart) {
        $current = clone $monthStart;
    }
    if ($end > $monthEnd) {
        $end = clone $monthEnd;
    }

    while ($current <= $end) {
        // Encontrar inicio de semana laboral
        $weekStart = clone $current;
        $dayOfWeek = (int)$weekStart->format('N'); // 1=Lunes, 7=Domingo
        
        // Si es fin de semana, avanzar al siguiente lunes
        if ($dayOfWeek > 5) {
            $daysToMonday = 8 - $dayOfWeek;
            $weekStart->modify("+{$daysToMonday} days");
            $current = clone $weekStart;
            if ($current > $end) break;
        }

        // Encontrar fin de semana laboral (viernes o último día de ausencia)
        $weekEnd = clone $weekStart;
        $daysToFriday = 5 - (int)$weekStart->format('N');
        $weekEnd->modify("+{$daysToFriday} days");

        // Ajustar al límite de la ausencia y del mes
        if ($weekEnd > $end) {
            $weekEnd = clone $end;
        }
        if ($weekEnd > $monthEnd) {
            $weekEnd = clone $monthEnd;
        }

        // Calcular días laborales en este rango
        $workingDays = calculateWorkingDaysInRange($weekStart, $weekEnd, $holidays);

        if ($workingDays > 0) {
            $ranges[] = [
                'start_date' => $weekStart->format('Y-m-d'),
                'end_date' => $weekEnd->format('Y-m-d'),
                'working_days' => $workingDays
            ];
        }

        // Avanzar al siguiente lunes
        $current = clone $weekEnd;
        $current->modify('+1 day');
        
        // Saltar fin de semana si es necesario
        $nextDayOfWeek = (int)$current->format('N');
        if ($nextDayOfWeek > 5) {
            $daysToMonday = 8 - $nextDayOfWeek;
            $current->modify("+{$daysToMonday} days");
        }
    }

    return $ranges;
}

/**
 * Calcula días laborales en un rango específico
 */
function calculateWorkingDaysInRange($start, $end, $holidays) {
    $workingDays = 0;
    $current = clone $start;

    while ($current <= $end) {
        $dayOfWeek = (int)$current->format('N');
        $dateString = $current->format('Y-m-d');
        
        // Solo contar si es día laboral (L-V) y no festivo
        if ($dayOfWeek <= 5 && !in_array($dateString, $holidays)) {
            $workingDays++;
        }
        
        $current->modify('+1 day');
    }

    return $workingDays;
}
?>
