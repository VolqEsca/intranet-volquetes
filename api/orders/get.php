<?php
require_once __DIR__ . '/../cors.php';
require_once __DIR__ . '/../auth_check.php';
require_once __DIR__ . '/../../config.php';
require_once __DIR__ . '/../permission_check.php';
require_module_permission('orders');

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['error' => 'Método no permitido']);
    exit;
}

// Obtener ID de la URL
$uri_parts = explode('/', trim($_SERVER['REQUEST_URI'], '/'));
$id = end($uri_parts);

if (!is_numeric($id)) {
    http_response_code(400);
    echo json_encode(['error' => 'ID inválido']);
    exit;
}

try {
    // Obtener la orden con todas sus relaciones
    $stmt = $pdo->prepare("
        SELECT 
            wo.*,
            c.name as client_name,
            c.cif_nif as client_cif,
            c.contact_person as client_contact_person,
            c.phone as client_phone,
            c.email as client_email,
            c.address as client_address,
            ut.name as unit_type_name,
            u.nombre as created_by_name,
            u.email as created_by_email,
            GROUP_CONCAT(DISTINCT d.id) as department_ids,
            GROUP_CONCAT(DISTINCT d.name ORDER BY d.name SEPARATOR ', ') as department_names
        FROM work_orders wo
        LEFT JOIN clients c ON wo.client_id = c.id
        LEFT JOIN unit_types ut ON wo.unit_type_id = ut.id
        LEFT JOIN usuarios u ON wo.created_by = u.id
        LEFT JOIN work_order_departments wod ON wo.id = wod.work_order_id
        LEFT JOIN departments d ON wod.department_id = d.id
        WHERE wo.id = ?
        GROUP BY wo.id
    ");
    $stmt->execute([$id]);
    $order = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$order) {
        http_response_code(404);
        echo json_encode(['error' => 'Orden no encontrada']);
        exit;
    }
    
    // Formatear departamentos
    if ($order['department_ids']) {
        $dept_ids = explode(',', $order['department_ids']);
        $dept_names = explode(', ', $order['department_names']);
        $order['departments'] = array_map(function($id, $name) {
            return ['id' => intval($id), 'name' => $name];
        }, $dept_ids, $dept_names);
    } else {
        $order['departments'] = [];
    }
    
    // Obtener tareas de la orden
    $stmt = $pdo->prepare("
        SELECT 
            id, 
            description, 
            status, 
            created_at, 
            updated_at,
            completed_at,
            completed_by
        FROM work_order_tasks 
        WHERE work_order_id = ? 
        ORDER BY created_at ASC
    ");
    $stmt->execute([$id]);
    $tasks = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Calcular estadísticas de tareas
    $totalTasks = count($tasks);
    $completedTasks = array_filter($tasks, function($task) {
        return $task['status'] === 'completed';
    });
    $completedCount = count($completedTasks);
    
    $order['tasks'] = $tasks;
    $order['task_stats'] = [
        'total' => $totalTasks,
        'completed' => $completedCount,
        'pending' => $totalTasks - $completedCount,
        'progress' => $totalTasks > 0 ? round(($completedCount / $totalTasks) * 100) : 0
    ];
    
    // Obtener historial de la orden
    $stmt = $pdo->prepare("
        SELECT 
            woh.*,
            u.nombre as user_name,
            u.email as user_email
        FROM work_order_history woh
        LEFT JOIN usuarios u ON woh.user_id = u.id
        WHERE woh.work_order_id = ?
        ORDER BY woh.created_at DESC
        LIMIT 10
    ");
    $stmt->execute([$id]);
    $order['history'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Obtener archivos adjuntos (si la tabla existe)
    try {
        $stmt = $pdo->prepare("
            SELECT 
                id,
                filename,
                original_name,
                file_type,
                file_size,
                uploaded_by,
                created_at
            FROM work_order_attachments
            WHERE work_order_id = ?
            ORDER BY created_at DESC
        ");
        $stmt->execute([$id]);
        $order['attachments'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
    } catch (Exception $e) {
        // Si la tabla no existe, simplemente no incluir attachments
        $order['attachments'] = [];
    }
    
    // Información adicional del cliente
    $order['client'] = [
        'id' => $order['client_id'],
        'name' => $order['client_name'],
        'cif_nif' => $order['client_cif'],
        'contact_person' => $order['client_contact_person'],
        'phone' => $order['client_phone'],
        'email' => $order['client_email'],
        'address' => $order['client_address']
    ];
    
    // Información del creador
    $order['created_by_info'] = [
        'id' => $order['created_by'],
        'name' => $order['created_by_name'],
        'email' => $order['created_by_email']
    ];
    
    // Calcular días en taller
    $entryDate = new DateTime($order['entry_date']);
    $today = new DateTime();
    $order['days_in_workshop'] = $entryDate->diff($today)->days;
    
    // Si hay fecha estimada, calcular días restantes
    if ($order['estimated_delivery']) {
        $estimatedDate = new DateTime($order['estimated_delivery']);
        $daysRemaining = $today->diff($estimatedDate)->days;
        $order['days_remaining'] = $estimatedDate > $today ? $daysRemaining : -$daysRemaining;
    }
    
    // Limpiar campos temporales y redundantes
    unset($order['department_ids']);
    unset($order['department_names']);
    unset($order['client_name']);
    unset($order['client_cif']);
    unset($order['client_contact_person']);
    unset($order['client_phone']);
    unset($order['client_email']);
    unset($order['client_address']);
    unset($order['created_by_name']);
    unset($order['created_by_email']);
    
    echo json_encode([
        'success' => true,
        'order' => $order
    ]);
    
} catch (Exception $e) {
    error_log("Error en get.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'error' => 'Error al obtener la orden',
        'details' => $e->getMessage()
    ]);
}
?>