<?php
// /api/manufacturing-orders/create.php
require_once __DIR__ . '/../../config.php';
require_once __DIR__ . '/../cors.php';
require_once __DIR__ . '/../auth_check.php';
require_once __DIR__ . '/../permission_check.php';
require_module_permission('manufacturing-orders');

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Método no permitido']);
    exit;
}

// ✅ CRÍTICO: Leer JSON correctamente (no form data)
$rawInput = file_get_contents('php://input');
$data = json_decode($rawInput, true);

if (json_last_error() !== JSON_ERROR_NONE || !is_array($data)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Datos JSON inválidos']);
    exit;
}

// Obtener y sanear datos del JSON
$client_name = trim($data['client_name'] ?? '');
$bodywork_type = trim($data['bodywork_type'] ?? '');
$brand = trim($data['brand'] ?? '');
$model = trim($data['model'] ?? '');
$chassis_number = trim($data['chassis_number'] ?? '');
$budget_number = trim($data['budget_number'] ?? '');
$description = trim($data['description'] ?? '');
$priority = $data['priority'] ?? 'medium';
$assigned_to = isset($data['assigned_to']) && is_numeric($data['assigned_to']) ? (int)$data['assigned_to'] : null;

// Validación básica
if (empty($client_name)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'El nombre del cliente es obligatorio']);
    exit;
}

// Validar prioridad
$valid_priorities = ['low', 'medium', 'high'];
if (!in_array($priority, $valid_priorities)) {
    $priority = 'medium';
}

// Procesar fechas de forma robusta
$processDate = function($dateValue) {
    if (empty($dateValue)) return null;
    try {
        // Manejar diferentes formatos: ISO 8601, YYYY-MM-DD, etc.
        $timestamp = strtotime($dateValue);
        return $timestamp ? date('Y-m-d', $timestamp) : null;
    } catch (Exception $e) {
        return null;
    }
};

$order_date = $processDate($data['order_date'] ?? null);
$vehicle_reception_date = $processDate($data['vehicle_reception_date'] ?? null);
$expected_completion_date = $processDate($data['expected_completion_date'] ?? null);

// Generar número de orden OF-YYYY-XXX con bloqueo atómico
$year = date('Y');
try {
    $pdo->beginTransaction();
    
    // Obtener siguiente número con bloqueo exclusivo (evita duplicados)
    $stmt = $pdo->prepare("
        SELECT COALESCE(MAX(CAST(SUBSTRING(order_number, 9) AS UNSIGNED)), 0) as max_num 
        FROM manufacturing_orders 
        WHERE order_number LIKE ? 
        FOR UPDATE
    ");
    $stmt->execute(["OF-{$year}-%"]);
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    $next_num = ($result['max_num'] ?? 0) + 1;
    $order_number = sprintf("OF-%s-%03d", $year, $next_num);
    
} catch (PDOException $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    error_log("Error generando número de orden: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Error al generar número de orden']);
    exit;
}

// ✅ CRÍTICO: Usar sesión como en módulo de reparación
$created_by = $_SESSION['user']['id'] ?? 0;

try {
    $stmt = $pdo->prepare("
        INSERT INTO manufacturing_orders 
        (order_number, client_name, bodywork_type, brand, model, chassis_number, 
         budget_number, order_date, vehicle_reception_date, expected_completion_date, 
         description, priority, created_by, assigned_to, status) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
    ");
    
    $stmt->execute([
        $order_number,
        $client_name,
        $bodywork_type ?: null,
        $brand ?: null,
        $model ?: null,
        $chassis_number ?: null,
        $budget_number ?: null,
        $order_date,
        $vehicle_reception_date,
        $expected_completion_date,
        $description ?: null,
        $priority,
        $created_by,
        $assigned_to
    ]);

    $order_id = $pdo->lastInsertId();
    $pdo->commit();

    // ✅ Respuesta consistente con patrón de reparación
    echo json_encode([
        'success' => true,
        'message' => "Orden de fabricación {$order_number} creada exitosamente",
        'data' => [
            'id' => $order_id,
            'order_number' => $order_number,
            'client_name' => $client_name,
            'status' => 'pending',
            'priority' => $priority,
            'created_at' => date('Y-m-d H:i:s')
        ]
    ]);
    
} catch (PDOException $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    error_log("Error creando orden de fabricación: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false, 
        'message' => 'Error interno al crear la orden'
    ]);
}
?>
