<?php
// /api/manufacturing-orders/update.php
require_once __DIR__ . '/../cors.php';
require_once __DIR__ . '/../auth_check.php';
require_once __DIR__ . '/../../config.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'PUT') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Método no permitido']);
    exit;
}

// =========================================================================
// EXTRACCIÓN ROBUSTA DEL ID - MÚLTIPLES FUENTES PARA MÁXIMA COMPATIBILIDAD
// =========================================================================
$order_id = null;

// Método 1: Query parameter (?id=123) - PRINCIPAL
if (isset($_GET['id']) && is_numeric($_GET['id'])) {
    $order_id = (int)$_GET['id'];
}

// Método 2: Desde el cuerpo JSON (fallback)
if (!$order_id) {
    $rawInput = file_get_contents('php://input');
    $data = json_decode($rawInput, true);
    
    if (isset($data['id']) && is_numeric($data['id'])) {
        $order_id = (int)$data['id'];
    }
} else {
    // Si ya tenemos ID de GET, solo parseamos el JSON para los datos
    $rawInput = file_get_contents('php://input');
    $data = json_decode($rawInput, true);
}

// Validar que tenemos un ID válido
if (!$order_id || $order_id <= 0) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'ID de orden requerido y válido',
        'debug' => [
            'GET_id' => $_GET['id'] ?? 'no proporcionado',
            'method' => $_SERVER['REQUEST_METHOD']
        ]
    ]);
    exit;
}

// Validar JSON
if (json_last_error() !== JSON_ERROR_NONE || !is_array($data)) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'Datos JSON inválidos'
    ]);
    exit;
}

// =========================================================================
// VERIFICAR QUE LA ORDEN EXISTE
// =========================================================================
try {
    $checkStmt = $pdo->prepare("SELECT order_number FROM manufacturing_orders WHERE id = ?");
    $checkStmt->execute([$order_id]);
    $existingOrder = $checkStmt->fetch(PDO::FETCH_ASSOC);

    if (!$existingOrder) {
        http_response_code(404);
        echo json_encode([
            'success' => false,
            'message' => 'Orden de fabricación no encontrada'
        ]);
        exit;
    }

    $orderNumber = $existingOrder['order_number'];

} catch (PDOException $e) {
    error_log("Error verificando orden {$order_id}: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Error interno del servidor'
    ]);
    exit;
}

// =========================================================================
// PREPARAR DATOS PARA ACTUALIZACIÓN
// =========================================================================
$updateFields = [];
$updateValues = [];

// Campos permitidos para actualización
$allowedFields = [
    'client_name', 'bodywork_type', 'brand', 'model', 'chassis_number',
    'budget_number', 'order_date', 'vehicle_reception_date', 
    'expected_completion_date', 'description', 'priority', 'status'
];

foreach ($allowedFields as $field) {
    if (array_key_exists($field, $data)) {
        $value = $data[$field];
        
        // ✅ PROCESAMIENTO ESPECÍFICO PARA FECHAS
        if (in_array($field, ['order_date', 'vehicle_reception_date', 'expected_completion_date'])) {
            if (empty($value) || $value === '') {
                $value = null;
            } else {
                // Validar y normalizar formato de fecha
                if (preg_match('/^\d{4}-\d{2}-\d{2}$/', $value)) {
                    // Ya está en formato YYYY-MM-DD
                } elseif (preg_match('/^\d{2}\/\d{2}\/\d{4}$/', $value)) {
                    // Convertir DD/MM/YYYY a YYYY-MM-DD
                    $dateParts = explode('/', $value);
                    $value = $dateParts[2] . '-' . $dateParts[1] . '-' . $dateParts[0];
                } else {
                    $value = null;
                }
            }
        }
        
        // ✅ PROCESAMIENTO PARA STRINGS OPCIONALES
        if (is_string($value) && trim($value) === '' && $field !== 'client_name') {
            $value = null;
        }
        
        $updateFields[] = "$field = ?";
        $updateValues[] = $value;
    }
}

// Validar que hay campos para actualizar
if (empty($updateFields)) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'No se proporcionaron campos para actualizar'
    ]);
    exit;
}

// ✅ VALIDACIÓN CRÍTICA: Cliente no puede estar vacío
if (isset($data['client_name']) && empty(trim($data['client_name']))) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'El nombre del cliente no puede estar vacío'
    ]);
    exit;
}

// =========================================================================
// EJECUTAR ACTUALIZACIÓN
// =========================================================================
try {
    // Añadir updated_at automático
    $updateFields[] = 'updated_at = NOW()';
    $updateValues[] = $order_id; // Para el WHERE

    $sql = "UPDATE manufacturing_orders SET " . implode(', ', $updateFields) . " WHERE id = ?";
    
    $stmt = $pdo->prepare($sql);
    $result = $stmt->execute($updateValues);

    if (!$result) {
        throw new Exception('Error ejecutando la actualización');
    }

    // ✅ RESPUESTA EXITOSA CONSISTENTE CON EL PATRÓN DE VERSO
    echo json_encode([
        'success' => true,
        'message' => "Orden {$orderNumber} actualizada exitosamente"
    ]);

} catch (PDOException $e) {
    error_log("Error PDO actualizando orden {$order_id}: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Error de base de datos al actualizar la orden'
    ]);

} catch (Exception $e) {
    error_log("Error general actualizando orden {$order_id}: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Error interno al actualizar la orden'
    ]);
}
?>
