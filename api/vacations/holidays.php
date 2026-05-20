<?php
require_once __DIR__ . '/../../config.php';
require_once __DIR__ . '/../cors.php';
require_once __DIR__ . '/../auth_check.php';

header('Content-Type: application/json');

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
    $year = intval($_GET['year'] ?? date('Y'));

    $conn = new mysqli($DB_HOST, $DB_USER, $DB_PASS, $DB_NAME);
    if ($conn->connect_error) {
        throw new Exception('Error de conexión');
    }
    $conn->set_charset("utf8mb4");

    $sql = "SELECT 
                id,
                DATE_FORMAT(holiday_date, '%Y-%m-%d') as holiday_date,
                description,
                type
            FROM holidays 
            WHERE year = ? AND is_active = TRUE
            ORDER BY holiday_date ASC";

    $stmt = $conn->prepare($sql);
    $stmt->bind_param("i", $year);
    $stmt->execute();
    $result = $stmt->get_result();

    $holidays = [];
    while ($row = $result->fetch_assoc()) {
        $holidays[] = [
            'id' => (int)$row['id'],
            'holiday_date' => $row['holiday_date'],
            'description' => $row['description'],
            'type' => $row['type']
        ];
    }

    $stmt->close();
    $conn->close();

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
