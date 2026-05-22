<?php
// api/orders/update.php - SOLUCIÓN DEFINITIVA HÍBRIDA VERSO
require_once __DIR__ . '/../../config.php';
require_once __DIR__ . '/../cors.php';
require_once __DIR__ . '/../auth_check.php';
require_once __DIR__ . '/../permission_check.php';
require_module_permission('orders');

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'PUT') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Método no permitido']);
    exit;
}

// ✅ EXTRACCIÓN ROBUSTA DEL ID (múltiples métodos)
$id = null;

// Método 1: Query parameter (?id=123) - Más común desde frontend
if (isset($_GET['id']) && is_numeric($_GET['id'])) {
    $id = (int)$_GET['id'];
}

// Método 2: Path parameter (/orders/123)
if (!$id) {
    $uri = strtok($_SERVER['REQUEST_URI'] ?? '', '?');
    if (preg_match('/\/orders\/(\d+)$/', $uri, $matches)) {
        $id = (int)$matches[1];
    }
}

// Método 3: Fallback para estructuras más complejas
if (!$id) {
    $uri_parts = explode('/', trim($_SERVER['REQUEST_URI'], '/'));
    $last_part = end($uri_parts);
    if (is_numeric($last_part)) {
        $id = (int)$last_part;
    }
}

if (!$id || $id <= 0) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'ID de orden requerido y válido']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);

// ✅ PREVENCIÓN DEFINITIVA - Bloquea mensajes automáticos
function sanitizeOrderField($text) {
    if (empty($text)) return $text;
    
    $blockedMessages = [
        'Descripción: Orden de trabajo actualizada.',
        'Descripcion: Orden de trabajo actualizada.',
        'Orden de trabajo actualizada.',
        'Descripción: Orden actualizada.',
        'Orden actualizada.'
    ];
    
    $cleaned = $text;
    foreach ($blockedMessages as $message) {
        $cleaned = str_replace($message, '', $cleaned);
    }
    
    $cleaned = preg_replace('/\s+/', ' ', $cleaned);
    $cleaned = trim($cleaned);
    
    return empty($cleaned) ? null : $cleaned;
}

// Aplicar sanitización a campos críticos
if (array_key_exists('notes', $data)) {
    $data['notes'] = sanitizeOrderField($data['notes']);
}
if (array_key_exists('description', $data)) {
    $data['description'] = sanitizeOrderField($data['description']);
}

if (json_last_error() !== JSON_ERROR_NONE) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'JSON inválido']);
    exit;
}

try {
    // Verificar que la orden existe y obtener client_id
    $stmt = $pdo->prepare("SELECT id, client_id FROM work_orders WHERE id = ?");
    $stmt->execute([$id]);
    $orderData = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$orderData) {
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'Orden no encontrada']);
        exit;
    }

    $clientId = $orderData['client_id'];

    // Iniciar transacción para operaciones atómicas
    $pdo->beginTransaction();

    // ✅ PASO 1: ACTUALIZAR CONTACTO DEL CLIENTE (si se proporcionó)
    $clientUpdated = false;
    if (isset($data['client_contact_person']) || isset($data['client_phone'])) {
        $clientUpdateFields = [];
        $clientParams = [':client_id' => $clientId];

        if (array_key_exists('client_contact_person', $data)) {
            $clientUpdateFields[] = "contact_person = :contact_person";
            $clientParams[':contact_person'] = $data['client_contact_person'];
        }

        if (array_key_exists('client_phone', $data)) {
            $clientUpdateFields[] = "phone = :phone";
            $clientParams[':phone'] = $data['client_phone'];
        }

        if (!empty($clientUpdateFields)) {
            $clientSql = "UPDATE clients SET " . implode(', ', $clientUpdateFields) . " WHERE id = :client_id";
            $clientStmt = $pdo->prepare($clientSql);
            $clientStmt->execute($clientParams);
            $clientUpdated = true;
        }
    }

    // ✅ PASO 2: ACTUALIZAR ORDEN DE TRABAJO
    $updateFields = [];
    $params = [':id' => $id];

    // Campos permitidos para work_orders
    $allowedFields = [
        'client_id', 'unit_type_id', 'brand', 'model', 'license_plate',
        'status', 'priority', 'description', 'entry_date', 'notes'
    ];

    foreach ($allowedFields as $field) {
        if (array_key_exists($field, $data)) {
            $updateFields[] = "$field = :$field";
            $params[":$field"] = $data[$field];
        }
    }

    // Actualizar la orden principal si hay campos para actualizar
    if (!empty($updateFields)) {
        $updateFields[] = "updated_at = NOW()";
        $sql = "UPDATE work_orders SET " . implode(', ', $updateFields) . " WHERE id = :id";
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
    }

    // Si se completa → setear completion_date
    if (isset($data['status']) && $data['status'] === 'completed') {
        $stmt = $pdo->prepare("UPDATE work_orders SET completion_date = CURDATE() WHERE id = ?");
        $stmt->execute([$id]);
    }

    // ✅ PASO 3: ACTUALIZAR DEPARTAMENTOS
    if (isset($data['department_ids']) && is_array($data['department_ids'])) {
        // Eliminar departamentos actuales
        $stmt = $pdo->prepare("DELETE FROM work_order_departments WHERE work_order_id = ?");
        $stmt->execute([$id]);

        // Insertar nuevos departamentos
        if (!empty($data['department_ids'])) {
            $stmt = $pdo->prepare("INSERT INTO work_order_departments (work_order_id, department_id) VALUES (?, ?)");
            foreach ($data['department_ids'] as $dept_id) {
                if (is_numeric($dept_id)) {
                    $stmt->execute([$id, (int)$dept_id]);
                }
            }
        }
    }

    // ✅ PASO 4: ACTUALIZAR TAREAS
    if (isset($data['tasks']) && is_array($data['tasks'])) {
        // Obtener tareas actuales
        $stmt = $pdo->prepare("SELECT id FROM work_order_tasks WHERE work_order_id = ?");
        $stmt->execute([$id]);
        $existingTaskIds = $stmt->fetchAll(PDO::FETCH_COLUMN);

        $processedTaskIds = [];

        foreach ($data['tasks'] as $task) {
            $description = trim($task['description'] ?? '');
            $status = $task['status'] ?? 'pending';

            if (isset($task['id']) && in_array($task['id'], $existingTaskIds)) {
                // Actualizar tarea existente
                $stmt = $pdo->prepare("
                    UPDATE work_order_tasks
                    SET description = ?, status = ?, updated_at = NOW()
                    WHERE id = ? AND work_order_id = ?
                ");
                $stmt->execute([$description, $status, $task['id'], $id]);
                $processedTaskIds[] = $task['id'];
            } elseif (!empty($description)) {
                // Crear nueva tarea
                $stmt = $pdo->prepare("
                    INSERT INTO work_order_tasks (work_order_id, description, status, created_at)
                    VALUES (?, ?, ?, NOW())
                ");
                $stmt->execute([$id, $description, $status]);
                $processedTaskIds[] = $pdo->lastInsertId();
            }
        }

        // Eliminar tareas no procesadas
        $tasksToDelete = array_diff($existingTaskIds, $processedTaskIds);
        if (!empty($tasksToDelete)) {
            $placeholders = implode(',', array_fill(0, count($tasksToDelete), '?'));
            $stmt = $pdo->prepare("
                DELETE FROM work_order_tasks
                WHERE work_order_id = ? AND id IN ($placeholders)
            ");
            $stmt->execute(array_merge([$id], $tasksToDelete));
        }
    }

    // ✅ PASO 5: REGISTRAR EN HISTORIAL (manejo seguro de sesiones)
    $changes = [];
    if ($clientUpdated) $changes[] = "Contacto del cliente actualizado";
    if (isset($data['status'])) $changes[] = "Estado: {$data['status']}";
    if (isset($data['priority'])) $changes[] = "Prioridad: {$data['priority']}";
    if (isset($data['department_ids'])) $changes[] = "Departamentos actualizados";
    if (isset($data['tasks'])) $changes[] = "Tareas actualizadas";

    $details = !empty($changes) ? 'Cambios: ' . implode(', ', $changes) : 'Orden actualizada';

    // Manejo seguro de usuario: usa sesión si existe, sino ID genérico
    $userId = $_SESSION['user']['id'] ?? 0;

    // Verificar si la tabla de historial existe antes de insertar
    try {
        $stmt = $pdo->prepare("
            INSERT INTO work_order_history (work_order_id, user_id, action, details, created_at)
            VALUES (?, ?, 'updated', ?, NOW())
        ");
        $stmt->execute([$id, $userId, $details]);
    } catch (PDOException $e) {
        // Si falla el historial, continuar (no es crítico)
        error_log("Error en historial (no crítico): " . $e->getMessage());
    }

    // Confirmar transacción
    $pdo->commit();

    // ✅ PASO 6: DEVOLVER ORDEN ACTUALIZADA CON DATOS COMPLETOS
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
    $stmt->execute([$id]);
    $order = $stmt->fetch(PDO::FETCH_ASSOC);

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

    // Obtener tareas actualizadas
    $stmt = $pdo->prepare("
        SELECT id, description, status, created_at, updated_at
        FROM work_order_tasks
        WHERE work_order_id = ?
        ORDER BY created_at ASC
    ");
    $stmt->execute([$id]);
    $order['tasks'] = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Limpiar campos temporales
    unset($order['department_ids'], $order['department_names']);

    echo json_encode([
        'success' => true,
        'message' => 'Orden actualizada exitosamente' . ($clientUpdated ? ' (incluyendo contacto del cliente)' : ''),
        'data' => $order
    ]);

} catch (PDOException $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    error_log("Error PDO en update.php (orden {$id}): " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Error de base de datos al actualizar la orden'
    ]);

} catch (Exception $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    error_log("Error general en update.php (orden {$id}): " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Error interno al actualizar la orden'
    ]);
}
?>
