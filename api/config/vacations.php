<?php
require_once __DIR__ . '/../../config.php';
require_once __DIR__ . '/../cors.php';
require_once __DIR__ . '/../auth_check.php';

header('Content-Type: application/json');

$sessionRol = $_SESSION['user']['rol'] ?? '';
if ($sessionRol !== 'admin' && $sessionRol !== 'Administrador') {
    http_response_code(403);
    echo json_encode(['error' => 'Solo administradores pueden gestionar la configuración']);
    exit;
}

// GET — devuelve todas las claves vacation_* y location_* + conteo de empleados por ubicación
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $stmt = $pdo->prepare(
        "SELECT clave, valor, tipo, descripcion
         FROM configuracion_sistema
         WHERE clave LIKE 'vacation_%' OR clave LIKE 'location_%'
         ORDER BY clave ASC"
    );
    $stmt->execute();
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $config = [];
    foreach ($rows as $row) {
        $config[$row['clave']] = [
            'valor'       => $row['tipo'] === 'integer' ? (int)$row['valor'] : $row['valor'],
            'tipo'        => $row['tipo'],
            'descripcion' => $row['descripcion'],
        ];
    }

    // Conteo de empleados activos por ubicación (para mostrar junto a inputs de nave)
    $stmtCounts = $pdo->prepare(
        "SELECT location, COUNT(*) as count FROM employees WHERE status = 'active' GROUP BY location"
    );
    $stmtCounts->execute();
    $countRows = $stmtCounts->fetchAll(PDO::FETCH_ASSOC);
    $employeeCounts = [];
    foreach ($countRows as $row) {
        $employeeCounts[$row['location']] = (int)$row['count'];
    }

    echo json_encode(['success' => true, 'config' => $config, 'employee_counts' => $employeeCounts]);
    exit;
}

// PUT — actualiza una clave; para location_* ejecuta transacción que renombra employees
if ($_SERVER['REQUEST_METHOD'] === 'PUT') {
    $body = json_decode(file_get_contents('php://input'), true);

    $clave = $body['clave'] ?? '';
    $valor = $body['valor'] ?? null;

    if (empty($clave) || $valor === null) {
        http_response_code(400);
        echo json_encode(['error' => 'Parámetros clave y valor son obligatorios']);
        exit;
    }

    if (!str_starts_with($clave, 'vacation_') && !str_starts_with($clave, 'location_')) {
        http_response_code(400);
        echo json_encode(['error' => 'Clave no permitida en este endpoint']);
        exit;
    }

    $stmtCheck = $pdo->prepare("SELECT clave, tipo, valor FROM configuracion_sistema WHERE clave = ?");
    $stmtCheck->execute([$clave]);
    $existing = $stmtCheck->fetch(PDO::FETCH_ASSOC);

    if (!$existing) {
        http_response_code(404);
        echo json_encode(['error' => "Clave '{$clave}' no encontrada"]);
        exit;
    }

    if ($existing['tipo'] === 'integer' && !is_numeric($valor)) {
        http_response_code(400);
        echo json_encode(['error' => 'El valor debe ser numérico para esta clave']);
        exit;
    }

    if ($clave === 'vacation_annual_days_type' && !in_array($valor, ['laborables', 'naturales'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Valor inválido para tipo de días (laborables|naturales)']);
        exit;
    }

    $oldValor = $existing['valor'];

    // Para location_*: renombrar también en tabla employees dentro de una transacción
    if (str_starts_with($clave, 'location_') && (string)$oldValor !== (string)$valor) {
        $pdo->beginTransaction();
        try {
            $stmtEmp = $pdo->prepare("UPDATE employees SET location = ? WHERE location = ?");
            $stmtEmp->execute([(string)$valor, (string)$oldValor]);
            $affected = $stmtEmp->rowCount();

            $stmtUpd = $pdo->prepare("UPDATE configuracion_sistema SET valor = ? WHERE clave = ?");
            $stmtUpd->execute([(string)$valor, $clave]);

            $pdo->commit();
            echo json_encode([
                'success'           => true,
                'message'           => 'Nave renombrada correctamente',
                'employees_updated' => $affected,
            ]);
        } catch (Exception $e) {
            $pdo->rollBack();
            http_response_code(500);
            echo json_encode(['error' => 'Error en transacción: ' . $e->getMessage()]);
        }
        exit;
    }

    $stmtUpd = $pdo->prepare("UPDATE configuracion_sistema SET valor = ? WHERE clave = ?");
    $stmtUpd->execute([(string)$valor, $clave]);

    echo json_encode(['success' => true, 'message' => "Clave '{$clave}' actualizada correctamente"]);
    exit;
}

http_response_code(405);
echo json_encode(['error' => 'Método no permitido']);
