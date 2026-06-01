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

$search = trim($_GET['search'] ?? '');
$limit  = max(1, min(50, intval($_GET['limit'] ?? 10)));

try {
    if (mb_strlen($search) < 2) {
        echo json_encode(['data' => []]);
        exit;
    }

    $searchParam = '%' . $search . '%';
    $stmt = $pdo->prepare(
        "SELECT id, full_name, location
         FROM employees
         WHERE status = 'active'
           AND full_name LIKE ?
         ORDER BY full_name ASC
         LIMIT ?"
    );
    $stmt->execute([$searchParam, $limit]);
    $employees = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode(['data' => $employees]);

} catch (PDOException $e) {
    error_log("Error PDO en employees-search.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Error de base de datos']);
}
?>
