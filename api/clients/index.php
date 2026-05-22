<?php
// /api/clients/index.php
require_once __DIR__ . '/../../config.php';
require_once __DIR__ . '/../cors.php';
require_once __DIR__ . '/../auth_check.php';
require_once __DIR__ . '/../permission_check.php';
require_module_permission('orders');

$method = $_SERVER['REQUEST_METHOD'];
$path = $_SERVER['REQUEST_URI'];

// Eliminar query string si existe
$path = strtok($path, '?');

// Determinar la acción basada en la ruta
if (preg_match('/\/api\/clients\/(\d+)$/', $path, $matches)) {
    $clientId = $matches[1];
    
    switch ($method) {
        case 'GET':
            getClient($clientId);
            break;
        case 'PUT':
            updateClient($clientId);
            break;
        case 'DELETE':
            deleteClient($clientId);
            break;
        default:
            http_response_code(405);
            echo json_encode(['error' => 'Método no permitido']);
    }
} elseif ($path === '/api/clients/delete-bulk' && $method === 'POST') {
    deleteBulkClients();
} elseif ($path === '/api/clients/import' && $method === 'POST') {
    require_once __DIR__ . '/import.php';
} elseif ($path === '/api/clients/template' && $method === 'GET') {
    require_once __DIR__ . '/template.php';
} else {
    // Listar todos los clientes
    if ($method === 'GET') {
        listClients();
    } elseif ($method === 'POST') {
        createClient();
    } else {
        http_response_code(405);
        echo json_encode(['error' => 'Método no permitido']);
    }
}

function listClients() {
    global $pdo;
    
    try {
        $query = "SELECT * FROM clients WHERE active = 1 ORDER BY name ASC";
        $stmt = $pdo->prepare($query);
        $stmt->execute();
        
        $clients = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Convertir active a booleano
        foreach ($clients as &$client) {
            $client['active'] = (bool)$client['active'];
        }
        
        echo json_encode([
            'success' => true,
            'data' => $clients
        ]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'error' => 'Error al obtener clientes: ' . $e->getMessage()
        ]);
    }
}

function getClient($id) {
    global $pdo;
    
    try {
        $query = "SELECT * FROM clients WHERE id = ?";
        $stmt = $pdo->prepare($query);
        $stmt->execute([$id]);
        
        $client = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$client) {
            http_response_code(404);
            echo json_encode(['error' => 'Cliente no encontrado']);
            return;
        }
        
        // Convertir active a booleano
        $client['active'] = (bool)$client['active'];
        
        echo json_encode([
            'success' => true,
            'data' => $client
        ]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'error' => 'Error al obtener cliente: ' . $e->getMessage()
        ]);
    }
}

function createClient() {
    global $pdo;
    
    $data = json_decode(file_get_contents('php://input'), true);
    
    // Validación
    if (empty($data['name']) || empty($data['cif_nif'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Nombre y CIF/NIF son obligatorios']);
        return;
    }
    
    try {
        // Verificar si ya existe un cliente con ese CIF/NIF
        $checkQuery = "SELECT id FROM clients WHERE cif_nif = ?";
        $checkStmt = $pdo->prepare($checkQuery);
        $checkStmt->execute([$data['cif_nif']]);
        
        if ($checkStmt->fetch()) {
            http_response_code(400);
            echo json_encode(['error' => 'Ya existe un cliente con ese CIF/NIF']);
            return;
        }
        
        $query = "INSERT INTO clients (name, cif_nif, contact_person, phone, email, address, notes, active, created_at, updated_at) 
                  VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())";
        
        $stmt = $pdo->prepare($query);
        $stmt->execute([
            $data['name'],
            $data['cif_nif'],
            $data['contact_person'] ?? null,
            $data['phone'] ?? null,
            $data['email'] ?? null,
            $data['address'] ?? null,
            $data['notes'] ?? null,
            $data['active'] ?? 1
        ]);
        
        echo json_encode([
            'success' => true,
            'id' => $pdo->lastInsertId()
        ]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'error' => 'Error al crear cliente: ' . $e->getMessage()
        ]);
    }
}

function updateClient($id) {
    global $pdo;
    
    $data = json_decode(file_get_contents('php://input'), true);
    
    // Validación
    if (empty($data['name']) || empty($data['cif_nif'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Nombre y CIF/NIF son obligatorios']);
        return;
    }
    
    try {
        // Verificar si existe otro cliente con ese CIF/NIF
        $checkQuery = "SELECT id FROM clients WHERE cif_nif = ? AND id != ?";
        $checkStmt = $pdo->prepare($checkQuery);
        $checkStmt->execute([$data['cif_nif'], $id]);
        
        if ($checkStmt->fetch()) {
            http_response_code(400);
            echo json_encode(['error' => 'Ya existe otro cliente con ese CIF/NIF']);
            return;
        }
        
        $query = "UPDATE clients SET 
                  name = ?, 
                  cif_nif = ?, 
                  contact_person = ?, 
                  phone = ?, 
                  email = ?, 
                  address = ?, 
                  notes = ?, 
                  active = ?,
                  updated_at = NOW()
                  WHERE id = ?";
        
        $stmt = $pdo->prepare($query);
        $stmt->execute([
            $data['name'],
            $data['cif_nif'],
            $data['contact_person'] ?? null,
            $data['phone'] ?? null,
            $data['email'] ?? null,
            $data['address'] ?? null,
            $data['notes'] ?? null,
            isset($data['active']) ? ($data['active'] ? 1 : 0) : 1,
            $id
        ]);
        
        if ($stmt->rowCount() === 0) {
            http_response_code(404);
            echo json_encode([
                'success' => false,
                'error' => 'Cliente no encontrado o sin cambios'
            ]);
            return;
        }
        
        echo json_encode([
            'success' => true,
            'message' => 'Cliente actualizado correctamente'
        ]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'error' => 'Error al actualizar cliente: ' . $e->getMessage()
        ]);
    }
}

function deleteClient($id) {
    global $pdo;
    
    try {
        // Verificar si el cliente tiene órdenes asociadas
        $checkQuery = "SELECT COUNT(*) as count FROM work_orders WHERE client_id = ?";
        $checkStmt = $pdo->prepare($checkQuery);
        $checkStmt->execute([$id]);
        $result = $checkStmt->fetch(PDO::FETCH_ASSOC);
        
        if ($result['count'] > 0) {
            // Marcar como inactivo en lugar de eliminar
            $query = "UPDATE clients SET active = 0, updated_at = NOW() WHERE id = ?";
        } else {
            // Eliminar completamente si no tiene órdenes
            $query = "DELETE FROM clients WHERE id = ?";
        }
        
        $stmt = $pdo->prepare($query);
        $stmt->execute([$id]);
        
        if ($stmt->rowCount() === 0) {
            http_response_code(404);
            echo json_encode([
                'success' => false,
                'error' => 'Cliente no encontrado'
            ]);
            return;
        }
        
        echo json_encode([
            'success' => true,
            'message' => 'Cliente eliminado correctamente'
        ]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'error' => 'Error al eliminar cliente: ' . $e->getMessage()
        ]);
    }
}

function deleteBulkClients() {
    global $pdo;
    
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (empty($data['ids']) || !is_array($data['ids'])) {
        http_response_code(400);
        echo json_encode(['error' => 'IDs inválidos']);
        return;
    }
    
    try {
        $pdo->beginTransaction();
        
        $placeholders = str_repeat('?,', count($data['ids']) - 1) . '?';
        
        // Marcar como inactivos
        $query = "UPDATE clients SET active = 0, updated_at = NOW() WHERE id IN ($placeholders)";
        $stmt = $pdo->prepare($query);
        $stmt->execute($data['ids']);
        
        $affectedRows = $stmt->rowCount();
        
        $pdo->commit();
        
        echo json_encode([
            'success' => true,
            'message' => $affectedRows . ' cliente(s) eliminado(s) correctamente',
            'deleted' => $affectedRows
        ]);
    } catch (PDOException $e) {
        $pdo->rollBack();
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'error' => 'Error al eliminar clientes: ' . $e->getMessage()
        ]);
    }
}
?>
