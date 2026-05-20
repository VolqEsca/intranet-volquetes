<?php
require_once __DIR__ . '/../cors.php';
require_once __DIR__ . '/../auth_check.php';
require_once __DIR__ . '/../permission_check.php';
require_module_permission('orders');
require_once __DIR__ . '/../../config.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Método no permitido']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);

// Validar datos requeridos
$required_fields = ['client_id', 'unit_type_id', 'department_ids', 'status', 'priority', 'entry_date'];
foreach ($required_fields as $field) {
    if (!isset($data[$field]) || (empty($data[$field]) && $data[$field] !== 0)) {
        http_response_code(400);
        echo json_encode(['error' => "El campo '$field' es requerido"]);
        exit;
    }
}

// Validar que department_ids sea un array
if (!is_array($data['department_ids']) || empty($data['department_ids'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Debe seleccionar al menos un departamento']);
    exit;
}

try {
    // Iniciar transacción para generación atómica
    $pdo->beginTransaction();

    // ✅ LÓGICA ROBUSTA: Generación de número único garantizado
    $year = date('Y');
    
    // Obtener el último número secuencial del año con bloqueo exclusivo
    $stmt = $pdo->prepare("
        SELECT COALESCE(MAX(CAST(SUBSTRING(order_number, 10) AS UNSIGNED)), 0) as last_number
        FROM work_orders 
        WHERE order_number LIKE ?
        FOR UPDATE
    ");
    $stmt->execute(["ORD-{$year}-%"]);
    $lastNumber = $stmt->fetchColumn();

    $nextNumber = $lastNumber + 1;
    $order_number = "ORD-{$year}-" . str_pad($nextNumber, 5, '0', STR_PAD_LEFT);

    // Insertar la orden principal
    $sql = "INSERT INTO work_orders (
        order_number,
        client_id,
        unit_type_id,
        brand,
        model,
        license_plate,
        status,
        priority,
        description,
        entry_date,
        notes,
        created_by,
        created_at,
        updated_at
    ) VALUES (
        :order_number,
        :client_id,
        :unit_type_id,
        :brand,
        :model,
        :license_plate,
        :status,
        :priority,
        :description,
        :entry_date,
        :notes,
        :created_by,
        NOW(),
        NOW()
    )";

    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        ':order_number' => $order_number,
        ':client_id' => $data['client_id'],
        ':unit_type_id' => $data['unit_type_id'],
        ':brand' => $data['brand'] ?? null,
        ':model' => $data['model'] ?? null,
        ':license_plate' => $data['license_plate'] ?? null,
        ':status' => $data['status'],
        ':priority' => $data['priority'],
        ':description' => $data['description'] ?? ($data['notes'] ?? 'Orden de trabajo'),
        ':entry_date' => $data['entry_date'],
        ':notes' => $data['notes'] ?? null,
        ':created_by' => $_SESSION['user']['id'] ?? 0
    ]);

    $order_id = $pdo->lastInsertId();

    // Insertar los departamentos asociados
    $stmt = $pdo->prepare("INSERT INTO work_order_departments (work_order_id, department_id) VALUES (?, ?)");
    foreach ($data['department_ids'] as $dept_id) {
        if (is_numeric($dept_id)) {
            $stmt->execute([$order_id, (int)$dept_id]);
        }
    }

    // Insertar las tareas si se proporcionaron
    if (!empty($data['tasks']) && is_array($data['tasks'])) {
        $stmt = $pdo->prepare("
            INSERT INTO work_order_tasks (work_order_id, description, status, created_at)
            VALUES (?, ?, 'pending', NOW())
        ");

        foreach ($data['tasks'] as $task) {
            $desc = trim($task['description'] ?? '');
            if (!empty($desc)) {
                $stmt->execute([$order_id, $desc]);
            }
        }
    }

    // Registrar en el historial con manejo seguro de sesión
    $stmt = $pdo->prepare("
        INSERT INTO work_order_history (work_order_id, user_id, action, details, created_at)
        VALUES (?, ?, 'created', 'Orden creada', NOW())
    ");
    $stmt->execute([$order_id, $_SESSION['user']['id'] ?? 0]);

    // Confirmar transacción
    $pdo->commit();

    // Obtener la orden completa con sus relaciones (incluye contactos del cliente)
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
    $stmt->execute([$order_id]);
    $order = $stmt->fetch(PDO::FETCH_ASSOC);

    // Formatear departamentos
    if (!empty($order['department_ids'])) {
        $dept_ids = explode(',', $order['department_ids']);
        $dept_names = explode(', ', $order['department_names']);
        $order['departments'] = array_map(function($id, $name) {
            return ['id' => (int)$id, 'name' => trim($name)];
        }, $dept_ids, $dept_names);
    } else {
        $order['departments'] = [];
    }

    // Obtener tareas creadas
    $stmt = $pdo->prepare("
        SELECT id, description, status, created_at
        FROM work_order_tasks
        WHERE work_order_id = ?
        ORDER BY created_at ASC
    ");
    $stmt->execute([$order_id]);
    $order['tasks'] = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Limpiar campos temporales
    unset($order['department_ids'], $order['department_names']);

    echo json_encode([
        'success' => true,
        'message' => "Orden {$order_number} creada exitosamente",
        'data' => $order
    ]);

} catch (PDOException $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    error_log("Error PDO en create.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Error de base de datos al crear la orden',
        'details' => $e->getMessage()
    ]);

} catch (Exception $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    error_log("Error general en create.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Error interno al crear la orden',
        'details' => $e->getMessage()
    ]);
}
?>
