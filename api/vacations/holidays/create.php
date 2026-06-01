<?php
// ✅ VERSO v14.1 - Gestión Festivos: Crear con Advertencia Honesta
require_once __DIR__ . '/../../../config.php';
require_once __DIR__ . '/../../cors.php';
require_once __DIR__ . '/../../auth_check.php';
require_once __DIR__ . '/../../permission_check.php';
require_module_permission('vacations');

header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Método no permitido']);
    exit;
}

try {
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);

    // Validaciones
    if (empty($data['holiday_date'])) {
        http_response_code(400);
        echo json_encode(['error' => 'La fecha es obligatoria']);
        exit;
    }

    if (empty($data['description']) || strlen(trim($data['description'])) < 3) {
        http_response_code(400);
        echo json_encode(['error' => 'La descripción debe tener al menos 3 caracteres']);
        exit;
    }

    $validTypes = ['national', 'regional', 'local', 'agreement'];
    if (empty($data['type']) || !in_array($data['type'], $validTypes)) {
        http_response_code(400);
        echo json_encode(['error' => 'Tipo de festivo inválido']);
        exit;
    }

    // Validar formato de fecha
    $date = DateTime::createFromFormat('Y-m-d', $data['holiday_date']);
    if (!$date || $date->format('Y-m-d') !== $data['holiday_date']) {
        http_response_code(400);
        echo json_encode(['error' => 'Formato de fecha inválido (usar YYYY-MM-DD)']);
        exit;
    }

    $year = intval($date->format('Y'));

    // Verificar duplicados
    $stmt = $pdo->prepare("SELECT id FROM holidays WHERE holiday_date = ?");
    $stmt->execute([$data['holiday_date']]);
    if ($stmt->fetch()) {
        http_response_code(409);
        echo json_encode(['error' => 'Ya existe un festivo en esta fecha']);
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
    $stmt->execute([$data['holiday_date'], $data['holiday_date']]);
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    $affectedAbsences = intval($result['total']);
    // =========================================================

    // Insertar festivo
    $stmt = $pdo->prepare("
        INSERT INTO holidays (holiday_date, description, type, year, is_active)
        VALUES (?, ?, ?, ?, TRUE)
    ");
    
    $stmt->execute([
        $data['holiday_date'],
        trim($data['description']),
        $data['type'],
        $year
    ]);

    $newId = $pdo->lastInsertId();

    $response = [
        'success' => true,
        'message' => 'Festivo creado correctamente',
        'id' => $newId
    ];

    // 🆕 Advertencia HONESTA si hay ausencias afectadas
    if ($affectedAbsences > 0) {
        $response['warning'] = "⚠️ Este festivo afecta a {$affectedAbsences} ausencia(s) ya aprobada(s). Los días laborales descontados NO se recalcularán automáticamente. Revisar manualmente si es necesario ajustar saldos.";
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
