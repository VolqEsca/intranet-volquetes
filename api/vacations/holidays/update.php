<?php
// ✅ VERSO v13.1.4 - Sistema de Gestión de Festivos: Actualizar
require_once __DIR__ . '/../../cors.php';
require_once __DIR__ . '/../../auth_check.php';
require_once __DIR__ . '/../../../config.php';
require_once __DIR__ . '/../../permission_check.php';
require_module_permission('vacations');

header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'PUT') {
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

    $input = file_get_contents('php://input');
    $data = json_decode($input, true);

    // Verificar que el festivo existe
    $stmt = $pdo->prepare("SELECT id FROM holidays WHERE id = ?");
    $stmt->execute([$holidayId]);
    if (!$stmt->fetch()) {
        http_response_code(404);
        echo json_encode(['error' => 'Festivo no encontrado']);
        exit;
    }

    // Validaciones (mismas que create)
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

    // Verificar duplicados (excluyendo el registro actual)
    $stmt = $pdo->prepare("SELECT id FROM holidays WHERE holiday_date = ? AND id != ?");
    $stmt->execute([$data['holiday_date'], $holidayId]);
    if ($stmt->fetch()) {
        http_response_code(409);
        echo json_encode(['error' => 'Ya existe otro festivo en esta fecha']);
        exit;
    }

    // Actualizar festivo
    $stmt = $pdo->prepare("
        UPDATE holidays 
        SET holiday_date = ?, description = ?, type = ?, year = ?
        WHERE id = ?
    ");
    
    $stmt->execute([
        $data['holiday_date'],
        trim($data['description']),
        $data['type'],
        $year,
        $holidayId
    ]);

    echo json_encode([
        'success' => true,
        'message' => 'Festivo actualizado correctamente'
    ]);

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
