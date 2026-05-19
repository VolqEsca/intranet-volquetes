<?php
// api/orders/delete.php - SOLUCIÓN DEFINITIVA VERSO
require_once __DIR__ . '/../../config.php';

// Extraer ID de la orden de múltiples fuentes posibles
$orderId = null;

// Método 1: Query parameter (?id=123)
if (isset($_GET['id']) && is_numeric($_GET['id'])) {
    $orderId = (int)$_GET['id'];
}

// Método 2: Path parameter (/orders/123)
if (!$orderId) {
    $path = $_SERVER['REQUEST_URI'];
    if (preg_match('/\/orders\/(\d+)$/', $path, $matches)) {
        $orderId = (int)$matches[1];
    }
}

// Método 3: Variable global (si viene de router)
if (!$orderId && isset($GLOBALS['orderId'])) {
    $orderId = (int)$GLOBALS['orderId'];
}

// Validar que tenemos un ID válido
if (!$orderId || $orderId <= 0) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => 'ID de orden requerido y debe ser válido'
    ]);
    exit;
}

try {
    // Verificar que la orden existe
    $checkStmt = $pdo->prepare("SELECT order_number FROM work_orders WHERE id = ?");
    $checkStmt->execute([$orderId]);
    $orderData = $checkStmt->fetch(PDO::FETCH_ASSOC);

    if (!$orderData) {
        http_response_code(404);
        echo json_encode([
            'success' => false,
            'error' => 'Orden no encontrada'
        ]);
        exit;
    }

    $orderNumber = $orderData['order_number'];

    // Iniciar transacción para eliminación segura
    $pdo->beginTransaction();

    // Eliminar tareas relacionadas
    $deleteTasksStmt = $pdo->prepare("DELETE FROM work_order_tasks WHERE work_order_id = ?");
    $deleteTasksStmt->execute([$orderId]);

    // Eliminar relaciones con departamentos
    $deleteDeptStmt = $pdo->prepare("DELETE FROM work_order_departments WHERE work_order_id = ?");
    $deleteDeptStmt->execute([$orderId]);

    // Eliminar la orden principal
    $deleteOrderStmt = $pdo->prepare("DELETE FROM work_orders WHERE id = ?");
    $deleteOrderStmt->execute([$orderId]);

    // Confirmar transacción
    $pdo->commit();

    // Respuesta exitosa
    echo json_encode([
        'success' => true,
        'message' => "Orden {$orderNumber} eliminada exitosamente"
    ]);

} catch (PDOException $e) {
    // Rollback en caso de error
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    
    error_log("Error eliminando orden {$orderId}: " . $e->getMessage());
    
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Error interno del servidor al eliminar la orden'
    ]);
    
} catch (Exception $e) {
    // Rollback para cualquier otro error
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    
    error_log("Error general eliminando orden {$orderId}: " . $e->getMessage());
    
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Error inesperado al eliminar la orden'
    ]);
}
?>
