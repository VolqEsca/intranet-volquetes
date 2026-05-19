<?php
require_once __DIR__ . '/../cors.php';
require_once __DIR__ . '/../auth_check.php';
require_once __DIR__ . '/../../config.php';

header('Content-Type: application/json');

try {
    // ✅ PARÁMETRO ESPECIAL PARA MOSTRAR TODAS LAS ÓRDENES
    $showAll = isset($_GET['all']) && $_GET['all'] === '1';
    
    // Construir consulta base con departamentos múltiples (SIN CAMBIOS)
    $sql = "
        SELECT 
            wo.id,
            wo.order_number,
            wo.client_id,
            wo.unit_type_id,
            wo.brand,
            wo.model,
            wo.license_plate,
            wo.status,
            wo.priority,
            wo.description,
            wo.entry_date,
            wo.estimated_delivery,
            wo.completion_date,
            wo.created_by,
            wo.created_at,
            wo.updated_at,
            c.name as client_name,
            c.cif_nif as client_cif,
            ut.name as unit_type_name,
            u.nombre as created_by_name,
            GROUP_CONCAT(DISTINCT d.id) as department_ids,
            GROUP_CONCAT(DISTINCT d.name ORDER BY d.name SEPARATOR ', ') as department_names,
            COUNT(DISTINCT wot.id) as task_count,
            COUNT(DISTINCT CASE WHEN wot.status = 'completed' THEN wot.id END) as completed_task_count
        FROM work_orders wo
        LEFT JOIN clients c ON wo.client_id = c.id
        LEFT JOIN unit_types ut ON wo.unit_type_id = ut.id
        LEFT JOIN usuarios u ON wo.created_by = u.id
        LEFT JOIN work_order_departments wod ON wo.id = wod.work_order_id
        LEFT JOIN departments d ON wod.department_id = d.id
        LEFT JOIN work_order_tasks wot ON wo.id = wot.work_order_id
        WHERE 1=1
    ";
    
    $params = [];
    
    // ✅ TODOS TUS FILTROS EXISTENTES - SIN CAMBIOS
    if (!empty($_GET['status'])) {
        $sql .= " AND wo.status = :status";
        $params[':status'] = $_GET['status'];
    }
    
    if (!empty($_GET['priority'])) {
        $sql .= " AND wo.priority = :priority";
        $params[':priority'] = $_GET['priority'];
    }
    
    if (!empty($_GET['department_id'])) {
        $sql .= " AND d.id = :department_id";
        $params[':department_id'] = $_GET['department_id'];
    }
    
    if (!empty($_GET['client_id'])) {
        $sql .= " AND wo.client_id = :client_id";
        $params[':client_id'] = $_GET['client_id'];
    }
    
    if (!empty($_GET['search'])) {
        $search = '%' . $_GET['search'] . '%';
        $sql .= " AND (
            wo.order_number LIKE :search1 OR 
            c.name LIKE :search2 OR 
            wo.license_plate LIKE :search3 OR
            wo.brand LIKE :search4 OR
            wo.model LIKE :search5
        )";
        $params[':search1'] = $search;
        $params[':search2'] = $search;
        $params[':search3'] = $search;
        $params[':search4'] = $search;
        $params[':search5'] = $search;
    }
    
    // Agrupar por orden (SIN CAMBIOS)
    $sql .= " GROUP BY wo.id";
    
    // Ordenar (SIN CAMBIOS)
    $orderBy = $_GET['orderBy'] ?? 'created_at';
    $orderDir = $_GET['orderDir'] ?? 'DESC';
    
    $allowedOrderColumns = [
        'order_number', 'client_name', 'status', 'priority', 
        'entry_date', 'created_at', 'updated_at'
    ];
    
    if (!in_array($orderBy, $allowedOrderColumns)) {
        $orderBy = 'created_at';
    }
    
    $orderDir = strtoupper($orderDir) === 'ASC' ? 'ASC' : 'DESC';
    $sql .= " ORDER BY {$orderBy} {$orderDir}";
    
    // ✅ PAGINACIÓN MEJORADA
    $page = isset($_GET['page']) ? max(1, intval($_GET['page'])) : 1;
    $limit = isset($_GET['limit']) ? max(1, min(1000, intval($_GET['limit']))) : 100; // ✅ Aumentado
    $offset = ($page - 1) * $limit;
    
    // ✅ CONTEO TOTAL - TU LÓGICA EXISTENTE PERFECTA
    $countSql = "
        SELECT COUNT(DISTINCT wo.id) as total
        FROM work_orders wo
        LEFT JOIN clients c ON wo.client_id = c.id
        LEFT JOIN work_order_departments wod ON wo.id = wod.work_order_id
        LEFT JOIN departments d ON wod.department_id = d.id
        WHERE 1=1
    ";
    
    // Aplicar los mismos filtros al conteo
    if (!empty($_GET['status'])) { $countSql .= " AND wo.status = :status"; }
    if (!empty($_GET['priority'])) { $countSql .= " AND wo.priority = :priority"; }
    if (!empty($_GET['department_id'])) { $countSql .= " AND d.id = :department_id"; }
    if (!empty($_GET['client_id'])) { $countSql .= " AND wo.client_id = :client_id"; }
    if (!empty($_GET['search'])) {
        $countSql .= " AND (
            wo.order_number LIKE :search1 OR 
            c.name LIKE :search2 OR 
            wo.license_plate LIKE :search3 OR
            wo.brand LIKE :search4 OR
            wo.model LIKE :search5
        )";
    }
    
    $stmt = $pdo->prepare($countSql);
    $stmt->execute($params);
    $total = $stmt->fetch(PDO::FETCH_ASSOC)['total'];
    
    // ✅ APLICAR LÍMITE SOLO SI NO ES "MOSTRAR TODO"
    if (!$showAll) {
        $sql .= " LIMIT :limit OFFSET :offset";
    }
    
    // Ejecutar consulta principal
    $stmt = $pdo->prepare($sql);
    foreach ($params as $key => $value) {
        $stmt->bindValue($key, $value);
    }
    
    // ✅ BIND PAGINACIÓN CONDICIONALMENTE
    if (!$showAll) {
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
    }
    
    $stmt->execute();
    $orders = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // ✅ PROCESAMIENTO DE DATOS - TU LÓGICA PERFECTA SIN CAMBIOS
    foreach ($orders as &$order) {
        if ($order['department_ids']) {
            $dept_ids = explode(',', $order['department_ids']);
            $dept_names = explode(', ', $order['department_names']);
            $order['departments'] = array_map(function($id, $name) {
                return ['id' => intval($id), 'name' => $name];
            }, $dept_ids, $dept_names);
        } else {
            $order['departments'] = [];
        }
        
        $order['task_progress'] = $order['task_count'] > 0 
            ? round(($order['completed_task_count'] / $order['task_count']) * 100) 
            : 0;
        
        unset($order['department_ids']);
        unset($order['department_names']);
    }
    
    // ✅ RESPUESTA MEJORADA
    echo json_encode([
        'success' => true,
        'data' => $orders,
        'pagination' => [
            'page' => $page,
            'limit' => $showAll ? $total : $limit,
            'total' => intval($total),
            'totalPages' => $showAll ? 1 : ceil($total / $limit),
            'showingAll' => $showAll
        ]
    ]);
    
} catch (Exception $e) {
    error_log("Error en list.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'error' => 'Error al obtener las órdenes',
        'details' => $e->getMessage()
    ]);
}
?>
