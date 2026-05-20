<?php

if (!isset($_SESSION['user']['id'])) {
    http_response_code(401);
    header('Content-Type: application/json');
    echo json_encode(['error' => 'No autorizado']);
    exit;
}

// CORS (mismo patrón)
$requestOrigin = $_SERVER['HTTP_ORIGIN'] ?? '';
$allowedOrigins = ['https://intranet.volquetesescalante.com'];

if (in_array($requestOrigin, $allowedOrigins)) {
    header("Access-Control-Allow-Origin: " . $requestOrigin);
} elseif (preg_match('/^https:\/\/.*\.webcontainer\.io$/', $requestOrigin)) {
    header("Access-Control-Allow-Origin: " . $requestOrigin);
} else {
    header('Access-Control-Allow-Origin: *');
}

header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

$DB_HOST = 'localhost';
$DB_USER = 'verso';
$DB_PASS = 'verso_dev_2026';
$DB_NAME = 'verso_dev';

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

    $conn = new mysqli($DB_HOST, $DB_USER, $DB_PASS, $DB_NAME);
    if ($conn->connect_error) {
        throw new Exception('Error de conexión BD');
    }
    $conn->set_charset("utf8mb4");

    // SOLUCIÓN: Obtener festivos por rango de fechas, no por año
    $holidays = [];
    $sqlHol = "SELECT holiday_date 
               FROM holidays 
               WHERE holiday_date BETWEEN ? AND ? 
                 AND is_active = TRUE";
    $stmtHol = $conn->prepare($sqlHol);
    $stmtHol->bind_param("ss", $startDate, $endDate);
    $stmtHol->execute();
    $resHol = $stmtHol->get_result();
    while ($row = $resHol->fetch_assoc()) {
        $holidays[] = $row['holiday_date'];
    }
    $stmtHol->close();

    $conn->close();

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
