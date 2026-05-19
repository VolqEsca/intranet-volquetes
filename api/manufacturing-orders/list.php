<?php
require_once __DIR__ . '/../cors.php';
require_once __DIR__ . '/../auth_check.php';
require_once __DIR__ . '/../../config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['message' => 'Método no permitido']);
    exit();
}

// ✅ PARÁMETRO ESPECIAL PARA MOSTRAR TODAS LAS ÓRDENES
$showAll = isset($_GET['all']) && $_GET['all'] === '1';

// ✅ PARÁMETROS OPTIMIZADOS - UNIFICADOS CON REPARACIÓN
$page = filter_input(INPUT_GET, 'page', FILTER_VALIDATE_INT) ?: 1;
$limit = filter_input(INPUT_GET, 'limit', FILTER_VALIDATE_INT) ?: 100; // ✅ Aumentado de 10 a 100
$limit = min(max(10, $limit), 1000); // ✅ Seguridad: entre 10 y 1000

// ✅ FILTROS CON SANITIZACIÓN MEJORADA (compatible PHP 8.2+)
$search = isset($_GET['search']) ? trim((string)$_GET['search']) : '';
$status_filter = isset($_GET['status']) ? trim((string)$_GET['status']) : '';
$priority_filter = isset($_GET['priority']) ? trim((string)$_GET['priority']) : '';
$sort_by = isset($_GET['sort_by']) ? trim((string)$_GET['sort_by']) : 'created_at';
$sort_order = isset($_GET['sort_order']) ? trim((string)$_GET['sort_order']) : 'DESC';

// Validar parámetros de ordenamiento (SIN CAMBIOS)
$valid_sort_columns = ['order_number', 'client_name', 'brand', 'model', 'status', 'priority', 'order_date', 'created_at'];
if (!in_array($sort_by, $valid_sort_columns)) {
    $sort_by = 'created_at';
}

$valid_sort_orders = ['ASC', 'DESC'];
if (!in_array(strtoupper($sort_order), $valid_sort_orders)) {
    $sort_order = 'DESC';
}

// Construir consulta con filtros (SIN CAMBIOS)
$where_conditions = [];
$params = [];

if (!empty($search)) {
    $where_conditions[] = "(mo.order_number LIKE ? OR mo.client_name LIKE ? OR mo.brand LIKE ? OR mo.model LIKE ? OR mo.chassis_number LIKE ?)";
    $search_param = "%$search%";
    $params = array_merge($params, [$search_param, $search_param, $search_param, $search_param, $search_param]);
}

if (!empty($status_filter)) {
    $where_conditions[] = "mo.status = ?";
    $params[] = $status_filter;
}

if (!empty($priority_filter)) {
    $where_conditions[] = "mo.priority = ?";
    $params[] = $priority_filter;
}

$where_clause = !empty($where_conditions) ? 'WHERE ' . implode(' AND ', $where_conditions) : '';

try {
    // Contar total de registros (SIN CAMBIOS)
    $count_sql = "SELECT COUNT(*) as total FROM manufacturing_orders mo $where_clause";
    $count_stmt = $pdo->prepare($count_sql);
    $count_stmt->execute($params);
    $total_records = $count_stmt->fetch(PDO::FETCH_ASSOC)['total'];

    // ✅ CALCULAR PAGINACIÓN CONDICIONALMENTE
    $offset = ($page - 1) * $limit;
    $total_pages = $showAll ? 1 : ceil($total_records / $limit);

    // ✅ CONSULTA PRINCIPAL CON JOINS (CORREGIDA)
    $sql = "
        SELECT 
            mo.id,
            mo.order_number,
            mo.client_name,
            mo.bodywork_type,
            mo.brand,
            mo.model,
            mo.chassis_number,
            mo.budget_number,
            mo.order_date,
            mo.vehicle_reception_date,
            mo.expected_completion_date,
            mo.description,
            mo.priority,
            mo.status,
            mo.created_at,
            mo.updated_at,
            creator.nombre as created_by_name,
            assignee.nombre as assigned_to_name
        FROM manufacturing_orders mo
        LEFT JOIN usuarios creator ON mo.created_by = creator.id
        LEFT JOIN usuarios assignee ON mo.assigned_to = assignee.id
        $where_clause
        ORDER BY mo.$sort_by $sort_order
    ";

    // ✅ APLICAR LÍMITE SOLO SI NO ES "MOSTRAR TODO"
    $stmt_params = $params;
    if (!$showAll) {
        $sql .= " LIMIT ? OFFSET ?";
        $stmt_params[] = $limit;
        $stmt_params[] = $offset;
    }

    $stmt = $pdo->prepare($sql);
    $stmt->execute($stmt_params);
    $orders = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Formatear fechas para el frontend (SIN CAMBIOS)
    foreach ($orders as &$order) {
        $order['order_date'] = $order['order_date'] ? date('d/m/Y', strtotime($order['order_date'])) : null;
        $order['vehicle_reception_date'] = $order['vehicle_reception_date'] ? date('d/m/Y', strtotime($order['vehicle_reception_date'])) : null;
        $order['expected_completion_date'] = $order['expected_completion_date'] ? date('d/m/Y', strtotime($order['expected_completion_date'])) : null;
        $order['created_at'] = date('d/m/Y H:i', strtotime($order['created_at']));
        $order['updated_at'] = date('d/m/Y H:i', strtotime($order['updated_at']));
    }

    // ✅ RESPUESTA MEJORADA CON INFORMACIÓN COMPLETA
    echo json_encode([
        'orders' => $orders,
        'pagination' => [
            'current_page' => $page,
            'total_pages' => $total_pages,
            'total_records' => $total_records,
            'limit' => $showAll ? $total_records : $limit,
            'showingAll' => $showAll
        ]
    ]);

} catch (PDOException $e) {
    error_log("Error al obtener órdenes de fabricación: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['message' => 'Error al obtener las órdenes: ' . $e->getMessage()]);
}
?>
