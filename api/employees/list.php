<?php
require_once __DIR__ . '/../../config.php';
require_once __DIR__ . '/../cors.php';
require_once __DIR__ . '/../auth_check.php';

// Configuración de BD directa (igual que clientes)
$DB_HOST = 'localhost';
$DB_USER = 'verso';
$DB_PASS = 'verso_dev_2026';
$DB_NAME = 'verso_dev';

// Header JSON
header('Content-Type: application/json');

// Solo GET
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['error' => 'Método no permitido']);
    exit;
}

try {
    // Conectar DB (MySQLi como clientes)
    $conn = new mysqli($DB_HOST, $DB_USER, $DB_PASS, $DB_NAME);
    if ($conn->connect_error) {
        throw new Exception("Error de conexión");
    }
    
    $conn->set_charset("utf8mb4");
    
    // Parámetros (patrón manufacturing con 100 por defecto)
    $page = max(1, intval($_GET['page'] ?? 1));
    $limit = intval($_GET['limit'] ?? 100);
    $offset = ($page - 1) * $limit;
    
    // Filtros opcionales
    $search = trim($_GET['search'] ?? '');
    $location = trim($_GET['location'] ?? '');
    $contract_type = trim($_GET['contract_type'] ?? '');
    
    // Construcción dinámica WHERE
    $whereConditions = ["status = 'active'"];
    $params = [];
    $types = '';
    
    if (!empty($search)) {
        $whereConditions[] = "(full_name LIKE ? OR dni_nie LIKE ? OR email_primary LIKE ?)";
        $searchParam = "%{$search}%";
        $params[] = $searchParam;
        $params[] = $searchParam;
        $params[] = $searchParam;
        $types .= 'sss';
    }
    
    if (!empty($location)) {
        $whereConditions[] = "location = ?";
        $params[] = $location;
        $types .= 's';
    }
    
    if (!empty($contract_type)) {
        $whereConditions[] = "contract_type = ?";
        $params[] = $contract_type;
        $types .= 's';
    }
    
    $whereClause = implode(' AND ', $whereConditions);
    
    // Contar total para paginación
    $countSql = "SELECT COUNT(*) as total FROM employees WHERE {$whereClause}";
    $countStmt = $conn->prepare($countSql);
    if (!empty($params)) {
        $countStmt->bind_param($types, ...$params);
    }
    $countStmt->execute();
    $totalRecords = intval($countStmt->get_result()->fetch_assoc()['total']);
    $countStmt->close();
    
    // Consulta principal
    $sql = "SELECT 
                id, employee_code, location, full_name, dni_nie, social_security_number,
                DATE_FORMAT(hire_date, '%Y-%m-%d') as hire_date,
                DATE_FORMAT(rgpd_date, '%Y-%m-%d') as rgpd_date,
                phone, email_primary, email_secondary,
                DATE_FORMAT(birth_date, '%Y-%m-%d') as birth_date,
                job_category, gender, contract_type,
                DATE_FORMAT(contract_end_date, '%Y-%m-%d') as contract_end_date,
                iban, status, created_at, updated_at
            FROM employees 
            WHERE {$whereClause}
            ORDER BY full_name ASC
            LIMIT ? OFFSET ?";
    
    $stmt = $conn->prepare($sql);
    $allParams = array_merge($params, [$limit, $offset]);
    $allTypes = $types . 'ii';
    $stmt->bind_param($allTypes, ...$allParams);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $employees = [];
    while ($row = $result->fetch_assoc()) {
        // Formatear IBAN: ESXX XXXX XXXX XXXX XXXX XXXX
        if (!empty($row['iban'])) {
            $iban = strtoupper(str_replace(' ', '', $row['iban']));
            if (strlen($iban) === 24 && substr($iban, 0, 2) === 'ES') {
                $row['iban'] = substr($iban, 0, 4) . ' ' . 
                              substr($iban, 4, 4) . ' ' . 
                              substr($iban, 8, 4) . ' ' . 
                              substr($iban, 12, 4) . ' ' . 
                              substr($iban, 16, 4) . ' ' . 
                              substr($iban, 20, 4);
            }
        }
        $employees[] = $row;
    }
    $stmt->close();
    $conn->close();
    
    // Respuesta con formato idéntico a manufacturing
    echo json_encode([
        'employees' => $employees,
        'pagination' => [
            'current_page' => $page,
            'total_pages' => max(1, ceil($totalRecords / $limit)),
            'total_records' => $totalRecords,
            'limit' => $limit
        ]
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
?>
