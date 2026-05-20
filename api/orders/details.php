<?php
require_once __DIR__ . '/../cors.php';
require_once __DIR__ . '/../auth_check.php';
require_once __DIR__ . '/../permission_check.php';
require_module_permission('orders');
require_once __DIR__ . '/../../config.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['error' => 'Método no permitido']);
    exit;
}

$order_id = isset($_GET['id']) ? intval($_GET['id']) : 0;

if (!$order_id) {
    http_response_code(400);
    echo json_encode(['error' => 'ID de orden requerido']);
    exit;
}

try {
    // Obtener detalles de la orden - SIN updated_at
    $stmt = $pdo->prepare("
        SELECT 
            wo.id, wo.order_number, wo.client_id, wo.unit_type_id,
            wo.brand, wo.model, wo.license_plate, wo.status, wo.priority,
            wo.description, wo.notes, wo.entry_date, wo.estimated_delivery,
            wo.completion_date, wo.created_by, wo.created_at,
            c.name as client_name,
            c.cif_nif as client_cif,
            c.contact_person as client_contact_person,
            c.phone as client_phone,
            c.email as client_email,
            c.address as client_address,
            ut.name as unit_type_name,
            u.nombre as created_by_name
        FROM work_orders wo
        LEFT JOIN clients c ON wo.client_id = c.id
        LEFT JOIN unit_types ut ON wo.unit_type_id = ut.id
        LEFT JOIN usuarios u ON wo.created_by = u.id
        WHERE wo.id = ?
    ");
    
    $stmt->execute([$order_id]);
    $order = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$order) {
        http_response_code(404);
        echo json_encode(['error' => 'Orden no encontrada']);
        exit;
    }
    
    // Obtener departamentos asignados
    $stmt = $pdo->prepare("
        SELECT d.id, d.name
        FROM departments d
        INNER JOIN work_order_departments wod ON d.id = wod.department_id
        WHERE wod.work_order_id = ?
    ");
    $stmt->execute([$order_id]);
    $order['departments'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Obtener tareas
    $stmt = $pdo->prepare("
        SELECT 
            id,
            description,
            status,
            created_at
        FROM work_order_tasks
        WHERE work_order_id = ?
        ORDER BY created_at ASC
    ");
    $stmt->execute([$order_id]);
    $order['tasks'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Obtener historial
    $stmt = $pdo->prepare("
        SELECT 
            h.action,
            h.details,
            h.created_at,
            u.nombre as user_name
        FROM work_order_history h
        LEFT JOIN usuarios u ON h.user_id = u.id
        WHERE h.work_order_id = ?
        ORDER BY h.created_at DESC
        LIMIT 10
    ");
    $stmt->execute([$order_id]);
    $order['history'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'success' => true,
        'data' => $order
    ]);
    
} catch (Exception $e) {
    error_log("Error en order details: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'error' => 'Error al obtener los detalles de la orden',
        'details' => $e->getMessage()
    ]);
}
?>
