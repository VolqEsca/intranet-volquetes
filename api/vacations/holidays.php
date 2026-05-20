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
    $year = intval($_GET['year'] ?? date('Y'));

    $sql = "SELECT
                id,
                DATE_FORMAT(holiday_date, '%Y-%m-%d') as holiday_date,
                description,
                type
            FROM holidays
            WHERE year = ? AND is_active = TRUE
            ORDER BY holiday_date ASC";

    $stmt = $pdo->prepare($sql);
    $stmt->execute([$year]);

    $holidays = [];
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        $holidays[] = [
            'id' => (int)$row['id'],
            'holiday_date' => $row['holiday_date'],
            'description' => $row['description'],
            'type' => $row['type']
        ];
    }

    echo json_encode([
        'success' => true,
        'year' => $year,
        'holidays' => $holidays,
        'total' => count($holidays)
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
?>
