<?php
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

try {
    $startDate = $_GET['start'] ?? '';
    $endDate = $_GET['end'] ?? '';

    if (empty($startDate) || empty($endDate)) {
        throw new Exception('Fechas start y end requeridas');
    }

    // Validar formato fechas
    $start = DateTime::createFromFormat('Y-m-d', $startDate);
    $end = DateTime::createFromFormat('Y-m-d', $endDate);

    if (!$start || !$end) {
        throw new Exception('Formato de fecha inválido (usar YYYY-MM-DD)');
    }

    if ($start > $end) {
        throw new Exception('Fecha inicio no puede ser posterior a fecha fin');
    }

    // SOLUCIÓN: Obtener festivos por rango de fechas, no por año
    $holidays = [];
    $sqlHol = "SELECT holiday_date
               FROM holidays
               WHERE holiday_date BETWEEN ? AND ?
                 AND is_active = TRUE";
    $stmtHol = $pdo->prepare($sqlHol);
    $stmtHol->execute([$startDate, $endDate]);
    while ($row = $stmtHol->fetch(PDO::FETCH_ASSOC)) {
        $holidays[] = $row['holiday_date'];
    }

    // ALGORITMO DE CÁLCULO DÍAS LABORALES
    $workingDays = 0;
    $totalDays = 0;
    $weekendDays = 0;
    $holidayDays = 0;

    $current = clone $start;
    while ($current <= $end) {
        $totalDays++;
        $dateString = $current->format('Y-m-d');
        $dayOfWeek = (int)$current->format('w'); // 0=domingo, 6=sábado

        $isWeekend = ($dayOfWeek === 0 || $dayOfWeek === 6);
        $isHoliday = in_array($dateString, $holidays);

        if ($isWeekend) {
            $weekendDays++;
        } elseif ($isHoliday) {
            $holidayDays++;
        } else {
            $workingDays++;
        }

        $current->modify('+1 day');
    }

    echo json_encode([
        'success' => true,
        'calculation' => [
            'start_date' => $startDate,
            'end_date' => $endDate,
            'total_days' => $totalDays,
            'weekend_days' => $weekendDays,
            'holiday_days' => $holidayDays,
            'working_days' => $workingDays
        ]
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
?>
