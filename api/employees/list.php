<?php
require_once __DIR__ . '/../../config.php';
require_once __DIR__ . '/../cors.php';
require_once __DIR__ . '/../auth_check.php';
require_once __DIR__ . '/../permission_check.php';
require_module_permission('employees');

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['error' => 'Método no permitido']);
    exit;
}

try {
    // Parámetros de paginación
    $page  = max(1, intval($_GET['page']  ?? 1));
    $limit = max(1, intval($_GET['limit'] ?? 100));
    $offset = ($page - 1) * $limit;

    // Filtros opcionales
    $search        = trim($_GET['search']        ?? '');
    $location      = trim($_GET['location']      ?? '');
    $contract_type = trim($_GET['contract_type'] ?? '');

    // Construcción dinámica WHERE
    $whereConditions = ["status = 'active'"];
    $params = [];

    if (!empty($search)) {
        $whereConditions[] = "(full_name LIKE ? OR dni_nie LIKE ? OR email_primary LIKE ?)";
        $searchParam = "%{$search}%";
        $params[] = $searchParam;
        $params[] = $searchParam;
        $params[] = $searchParam;
    }

    if (!empty($location)) {
        $whereConditions[] = "location = ?";
        $params[] = $location;
    }

    if (!empty($contract_type)) {
        $whereConditions[] = "contract_type = ?";
        $params[] = $contract_type;
    }

    $whereClause = implode(' AND ', $whereConditions);

    // Contar total para paginación
    $countStmt = $pdo->prepare("SELECT COUNT(*) FROM employees WHERE {$whereClause}");
    $countStmt->execute($params);
    $totalRecords = intval($countStmt->fetchColumn());

    // LIMIT y OFFSET seguros (ya validados con intval) — incrustados directamente
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
            LIMIT {$limit} OFFSET {$offset}";

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $employees = [];
    foreach ($rows as $row) {
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

    echo json_encode([
        'employees' => $employees,
        'pagination' => [
            'current_page'  => $page,
            'total_pages'   => max(1, ceil($totalRecords / $limit)),
            'total_records' => $totalRecords,
            'limit'         => $limit
        ]
    ]);

} catch (PDOException $e) {
    error_log("Error PDO employees/list.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Error de base de datos']);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
?>
