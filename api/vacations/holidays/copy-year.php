<?php
// ✅ PATRÓN VERSO PROBADO: Mismo que create.php
require_once __DIR__ . '/../../cors.php';       // Desde /holidays/ sube 2 niveles a /api/
require_once __DIR__ . '/../../auth_check.php';
require_once __DIR__ . '/../../permission_check.php';
require_module_permission('vacations'); // Autenticación centralizada
require_once __DIR__ . '/../../../config.php';  // PDO centralizado (sube 3 niveles)

header('Content-Type: application/json');

// Validar método (igual que create.php)
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Método no permitido']);
    exit;
}

try {
    // Obtener datos de entrada
    $data = json_decode(file_get_contents('php://input'), true);
    $targetYear = intval($data['target_year'] ?? date('Y') + 1);

    // Validar año objetivo
    $currentYear = date('Y');
    if ($targetYear < $currentYear - 1 || $targetYear > $currentYear + 10) {
        http_response_code(400);
        echo json_encode(['error' => 'Año objetivo fuera de rango permitido']);
        exit;
    }

    // ✅ DEFINICIÓN ESTRICTA: Formato MM-DD para evitar swap día/mes
    $standardHolidays = [
        ['01-01', 'Año Nuevo', 'national'],
        ['01-06', 'Reyes Magos', 'national'],
        ['04-23', 'Día de Castilla y León', 'regional'],
        ['05-01', 'Fiesta del Trabajo', 'national'],
        ['05-13', 'San Pedro Regalado', 'local'],
        ['08-15', 'Asunción de la Virgen', 'national'],
        ['09-08', 'Nuestra Señora de San Lorenzo', 'local'],
        ['10-12', 'Fiesta Nacional de España', 'national'],
        ['11-01', 'Todos los Santos', 'national'],
        ['12-06', 'Día de la Constitución', 'national'],
        ['12-08', 'Inmaculada Concepción', 'national'],
        ['12-25', 'Natividad del Señor', 'national']
    ];

    $copied = 0;
    $skipped = 0;
    $errors = [];

    // ✅ USAR PDO DE CONFIG.PHP (patrón create.php)
    $pdo->beginTransaction();

    $stmt = $pdo->prepare("
        INSERT IGNORE INTO holidays (holiday_date, description, type, year, is_active) 
        VALUES (?, ?, ?, ?, 1)
    ");

    foreach ($standardHolidays as $holiday) {
        try {
            // ✅ CONSTRUCCIÓN MANUAL ISO: YYYY-MM-DD (sin ambigüedad)
            $isoDate = $targetYear . '-' . $holiday[0]; // Ej: 2026-08-15
            $desc = $holiday[1];
            $type = $holiday[2];

            $stmt->execute([$isoDate, $desc, $type, $targetYear]);
            
            if ($stmt->rowCount() > 0) {
                $copied++;
            } else {
                $skipped++; // Ya existía
            }
            
        } catch (PDOException $e) {
            $errors[] = "Error en festivo {$holiday[1]}: " . $e->getMessage();
        }
    }

    $pdo->commit();

    // Respuesta exitosa
    $response = [
        'success' => true,
        'message' => "Festivos estándar generados para $targetYear",
        'stats' => [
            'copied' => $copied,
            'skipped' => $skipped,
            'total_fixed' => count($standardHolidays),
            'pending_manual' => 7
        ],
        'warning' => "Recuerda añadir manualmente: Semana Santa $targetYear y los 5 días de descanso del convenio"
    ];

    if (!empty($errors)) {
        $response['errors'] = $errors;
    }

    echo json_encode($response);

} catch (PDOException $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    error_log("Error PDO en copy-year.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Error de base de datos al generar festivos',
        'details' => $e->getMessage()
    ]);

} catch (Exception $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    error_log("Error general en copy-year.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Error interno al generar festivos',
        'details' => $e->getMessage()
    ]);
}
?>
