<?php
// PATH: /api/dashboard/summary.php
require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/../auth_check.php';

$stats = [];

// Órdenes Activas
$stmt = $pdo->query("SELECT COUNT(id) as total FROM ordenes WHERE estado = 'Activa'");
$stats['ordenesActivas'] = $stmt->fetchColumn();

// Clientes Totales
$stmt = $pdo->query("SELECT COUNT(id) as total FROM clientes");
$stats['clientesTotales'] = $stmt->fetchColumn();

// Órdenes Pendientes
$stmt = $pdo->query("SELECT COUNT(id) as total FROM ordenes WHERE estado = 'Pendiente'");
$stats['ordenesPendientes'] = $stmt->fetchColumn();

// Órdenes Completadas (últimos 30 días)
$stmt = $pdo->query("SELECT COUNT(id) as total FROM ordenes WHERE estado = 'Completada' AND updated_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)");
$stats['ordenesCompletadas30dias'] = $stmt->fetchColumn();

// Órdenes Recientes (últimas 5)
$stmt = $pdo->query("
    SELECT o.id, o.descripcion, o.estado, o.created_at, c.nombre as cliente_nombre
    FROM ordenes o
    JOIN clientes c ON o.cliente_id = c.id
    ORDER BY o.created_at DESC
    LIMIT 5
");
$stats['ordenesRecientes'] = $stmt->fetchAll();

echo json_encode($stats);```

**Endpoints de Clientes**
```php
<?php
// PATH: /api/clients/index.php
require_once __DIR__ . '/../../config.php';
require_once __DIR__ . '/../auth_check.php';

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    // Búsqueda predictiva o listado general
    if (isset($_GET['search'])) {
        $stmt = $pdo->prepare("SELECT id, nombre FROM clientes WHERE nombre LIKE ? LIMIT 10");
        $stmt->execute(['%' . $_GET['search'] . '%']);
    } else {
        $stmt = $pdo->query("SELECT id, nombre, cif_nif, contact_person, contact_phone FROM clientes ORDER BY nombre ASC");
    }
    $clients = $stmt->fetchAll();
    echo json_encode($clients);
}

elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);

    // Validación en servidor
    if (empty($data['nombre']) || empty($data['cif_nif']) || empty($data['contact_person']) || empty($data['contact_phone'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Todos los campos son obligatorios.']);
        exit;
    }

    try {
        $stmt = $pdo->prepare("INSERT INTO clientes (nombre, cif_nif, contact_person, contact_phone) VALUES (?, ?, ?, ?)");
        $stmt->execute([$data['nombre'], $data['cif_nif'], $data['contact_person'], $data['contact_phone']]);
        $newClientId = $pdo->lastInsertId();
        
        http_response_code(201);
        echo json_encode(['message' => 'Cliente creado con éxito', 'id' => $newClientId]);

    } catch (PDOException $e) {
        // Error de CIF/NIF duplicado
        if ($e->getCode() == 23000) {
            http_response_code(409); // Conflict
            echo json_encode(['error' => 'El CIF/NIF introducido ya existe.']);
        } else {
            http_response_code(500);
            echo json_encode(['error' => 'Error en el servidor al crear el cliente.']);
        }
    }
}