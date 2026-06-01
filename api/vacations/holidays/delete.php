<?php
// ✅ VERSO v14.1 - Gestión Festivos: Eliminar con Advertencia Honesta
require_once __DIR__ . '/../../../config.php';
require_once __DIR__ . '/../../cors.php';
require_once __DIR__ . '/../../auth_check.php';
require_once __DIR__ . '/../../permission_check.php';
require_module_permission('vacations');

header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'DELETE') {
    http_response_code(405);
    echo json_encode(['error' => 'Método no permitido']);
    exit;
}

try {
    $holidayId = isset($_GET['id']) ? intval($_GET['id']) : 0;
    if ($holidayId <= 0) {
        http_response_code(400);
        echo json_encode(['error' => 'ID de festivo inválido']);
        exit;
    }

    // Verificar que el festivo existe y obtener su fecha
    $stmt = $pdo->prepare("SELECT holiday_date FROM holidays WHERE id = ?");
    $stmt->execute([$holidayId]);
    $holiday = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$holiday) {
        http_response_code(404);
        echo json_encode(['error' => 'Festivo no encontrado']);
        exit;
    }

    // =========================================================
    // 🆕 VERSO v14.1: Detección de Ausencias Afectadas
    // Advertencia HONESTA al usuario (sin promesas falsas)
    // =========================================================
    $stmt = $pdo->prepare("
        SELECT COUNT(*) as total 
        FROM employee_absences 
        WHERE start_date <= ? 
        AND end_date >= ? 
        AND status = 'approved'
    ");
    $stmt->execute([$holiday['holiday_date'], $holiday['holiday_date']]);
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    $affectedAbsences = intval($result['total']);
    // =========================================================

    // Eliminar festivo
    $stmt = $pdo->prepare("DELETE FROM holidays WHERE id = ?");
    $stmt->execute([$holidayId]);

    $response = [
        'success' => true,
        'message' => 'Festivo eliminado correctamente'
    ];

    // 🆕 Advertencia HONESTA (eliminamos la promesa falsa del recálculo automático)
    if ($affectedAbsences > 0) {
        $response['warning'] = "⚠️ Este festivo afectaba a {$affectedAbsences} ausencia(s) aprobada(s). Los días laborales descontados NO se recalcularán automáticamente. Revisar manualmente si es necesario ajustar saldos.";
        $response['affected_absences'] = $affectedAbsences;
        $response['requires_manual_review'] = true;
    }

    echo json_encode($response);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'error' => 'Error en base de datos',
        'details' => $e->getMessage()
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'error' => 'Error del servidor',
        'details' => $e->getMessage()
    ]);
}
?>
