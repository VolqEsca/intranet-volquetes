<?php
require_once __DIR__ . '/../../config.php';
require_once __DIR__ . '/../cors.php';
require_once __DIR__ . '/../auth_check.php';

// Configuración BD
$DB_HOST = 'localhost';
$DB_USER = 'verso';
$DB_PASS = 'verso_dev_2026';
$DB_NAME = 'verso_dev';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'DELETE') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Método no permitido']);
    exit;
}

try {
    $employee_id = intval($_GET['id'] ?? 0);
    
    if ($employee_id <= 0) {
        throw new Exception('ID de empleado inválido');
    }
    
    // Conectar BD
    $conn = new mysqli($DB_HOST, $DB_USER, $DB_PASS, $DB_NAME);
    if ($conn->connect_error) {
        throw new Exception('Error de conexión a la base de datos');
    }
    
    $conn->set_charset("utf8mb4");
    
    // Verificar que el empleado existe
    $stmt = $conn->prepare("SELECT full_name FROM employees WHERE id = ? AND status = 'active'");
    $stmt->bind_param("i", $employee_id);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows === 0) {
        $stmt->close();
        $conn->close();
        throw new Exception('Empleado no encontrado');
    }
    
    $employee_name = $result->fetch_assoc()['full_name'];
    $stmt->close();
    
    // ✅ DESACTIVAR EMPLEADO (SOFT DELETE - NO ELIMINACIÓN FÍSICA)
    $stmt = $conn->prepare("UPDATE employees SET status = 'inactive', updated_at = NOW() WHERE id = ?");
    $stmt->bind_param("i", $employee_id);
    
    if (!$stmt->execute()) {
        throw new Exception('Error al desactivar el empleado');
    }
    
    $stmt->close();
    $conn->close();
    
    echo json_encode([
        'success' => true,
        'message' => "Empleado {$employee_name} desactivado correctamente"
    ]);
    
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
?>
