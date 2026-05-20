<?php
// ✅ VERSO v14.1 - Creación Individual con Auto-inicialización de Saldos

require_once __DIR__ . '/../../config.php';
require_once __DIR__ . '/../cors.php';
require_once __DIR__ . '/../auth_check.php';

$DB_HOST = 'localhost';
$DB_USER = 'verso';
$DB_PASS = 'verso_dev_2026';
$DB_NAME = 'verso_dev';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Método no permitido']);
    exit;
}

// Funciones de validación (reutilizadas del import.php exitoso)
function validateDNI_NIE($document) {
    $document = strtoupper(trim($document));
    
    if (preg_match('/^[0-9]{8}[TRWAGMYFPDXBNJZSQVHLCKE]$/', $document)) {
        $number = intval(substr($document, 0, 8));
        $letter = substr($document, 8, 1);
        $letters = 'TRWAGMYFPDXBNJZSQVHLCKE';
        return $letters[$number % 23] === $letter;
    }
    
    if (preg_match('/^[XYZ][0-9]{7}[TRWAGMYFPDXBNJZSQVHLCKE]$/', $document)) {
        $nie_map = ['X' => '0', 'Y' => '1', 'Z' => '2'];
        $number = $nie_map[$document[0]] . substr($document, 1, 7);
        $letter = substr($document, 8, 1);
        $letters = 'TRWAGMYFPDXBNJZSQVHLCKE';
        return $letters[intval($number) % 23] === $letter;
    }
    
    return false;
}

function validateIBAN($iban) {
    if (empty($iban)) return true;
    
    $clean = strtoupper(str_replace(' ', '', trim($iban)));
    if (strlen($clean) !== 24 || substr($clean, 0, 2) !== 'ES') {
        return false;
    }
    
    $rearranged = substr($clean, 4) . substr($clean, 0, 4);
    $numericString = str_replace(
        ['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z'], 
        ['10','11','12','13','14','15','16','17','18','19','20','21','22','23','24','25','26','27','28','29','30','31','32','33','34','35'], 
        $rearranged
    );
    
    $remainder = 0;
    for ($i = 0; $i < strlen($numericString); $i++) {
        $remainder = ($remainder * 10 + intval($numericString[$i])) % 97;
    }
    
    return $remainder === 1;
}

function validateSocialSecurity($ss) {
    $clean = str_replace(' ', '', $ss);
    return preg_match('/^[0-9]{11,12}$/', $clean);
}

// =========================================================
// 🆕 FUNCIÓN: Cálculo Proporcional Convenio Metal Valladolid
// Elimina dependencia de SQL manual para siempre
// =========================================================
function calculateProportionalAnnualDays($hire_date, $target_year) {
    if (empty($hire_date)) return 0;
    
    $hire_ts = strtotime($hire_date);
    $hire_year = intval(date('Y', $hire_ts));
    
    // Caso 1: Alta en año futuro
    if ($hire_year > $target_year) {
        return 0;
    }
    
    // Caso 2: Alta en año anterior (año completo)
    if ($hire_year < $target_year) {
        return 22;
    }
    
    // Caso 3: Alta en el mismo año (proporcional)
    $eoy_ts = strtotime("$target_year-12-31");
    $days_worked = ($eoy_ts - $hire_ts) / 86400 + 1;
    $days_in_year = date('L', strtotime("$target_year-01-01")) ? 366 : 365;
    
    return round(($days_worked / $days_in_year) * 22);
}

try {
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input) {
        throw new Exception('Datos JSON inválidos');
    }
    
    // Extraer y limpiar datos
    $location = trim($input['location'] ?? '');
    $employee_code = !empty(trim($input['employee_code'] ?? '')) ? trim($input['employee_code']) : null;
    $full_name = trim($input['full_name'] ?? '');
    $dni_nie = strtoupper(str_replace(' ', '', $input['dni_nie'] ?? ''));
    $social_security_number = str_replace(' ', '', $input['social_security_number'] ?? '');
    $hire_date = $input['hire_date'] ?? '';
    $phone = str_replace([' ', '-'], '', $input['phone'] ?? '');
    $email_primary = trim($input['email_primary'] ?? '');
    $email_secondary = !empty(trim($input['email_secondary'] ?? '')) ? trim($input['email_secondary']) : null;
    $birth_date = $input['birth_date'] ?? '';
    $job_category = trim($input['job_category'] ?? '');
    $gender = !empty(trim($input['gender'] ?? '')) ? trim($input['gender']) : null;
    $contract_type = trim($input['contract_type'] ?? 'Indefinido');
    $contract_end_date = $input['contract_end_date'] ?? '';
    $iban = trim($input['iban'] ?? '');
    
    // Validaciones básicas
    $missing_fields = [];
    if (empty($location)) $missing_fields[] = 'Nave';
    if (empty($full_name)) $missing_fields[] = 'Nombre y Apellidos';
    if (empty($dni_nie)) $missing_fields[] = 'DNI/NIE';
    if (empty($social_security_number)) $missing_fields[] = 'Nº Seguridad Social';
    if (empty($hire_date)) $missing_fields[] = 'Fecha de Alta';
    if (empty($job_category)) $missing_fields[] = 'Categoría';
    if (empty($contract_type)) $missing_fields[] = 'Tipo de Contrato';

    if (!empty($missing_fields)) {
        throw new Exception('Campos obligatorios faltantes: ' . implode(', ', $missing_fields));
    }
    
    // Validaciones específicas
    if (!validateDNI_NIE($dni_nie)) {
        throw new Exception('DNI/NIE inválido');
    }
    
    if (!validateSocialSecurity($social_security_number)) {
        throw new Exception('Número de Seguridad Social debe tener 11 o 12 dígitos');
    }
    
    if (!validateIBAN($iban)) {
        throw new Exception('IBAN inválido');
    }
    
    if ($contract_type === 'Temporal' && empty($contract_end_date)) {
        throw new Exception('Contrato temporal requiere fecha de fin');
    }
    
    // Conectar BD
    $conn = new mysqli($DB_HOST, $DB_USER, $DB_PASS, $DB_NAME);
    if ($conn->connect_error) {
        throw new Exception('Error de conexión a la base de datos');
    }
    
    $conn->set_charset("utf8mb4");
    
    // Verificar DNI/NIE único
    $stmt = $conn->prepare("SELECT id FROM employees WHERE dni_nie = ?");
    $stmt->bind_param("s", $dni_nie);
    $stmt->execute();
    if ($stmt->get_result()->num_rows > 0) {
        $stmt->close();
        $conn->close();
        throw new Exception('Ya existe un empleado con este DNI/NIE');
    }
    $stmt->close();
    
    // Manejo inteligente email (como en import.php)
    if (empty($email_primary)) {
        $email_primary = strtolower(str_replace(' ', '.', $full_name)) . '@volquetesescalante.com';
        $email_primary = preg_replace('/[^a-z0-9.@]/', '', $email_primary);
    }
    
    // Limpiar IBAN para BD
    $iban_clean = !empty($iban) ? strtoupper(str_replace(' ', '', $iban)) : null;
    
    // Procesar fechas
    $hire_date_formatted = !empty($hire_date) ? date('Y-m-d', strtotime($hire_date)) : null;
    $birth_date_formatted = !empty($birth_date) ? date('Y-m-d', strtotime($birth_date)) : null;
    $contract_end_date_formatted = !empty($contract_end_date) ? date('Y-m-d', strtotime($contract_end_date)) : null;
    
    // Insertar empleado
    $stmt = $conn->prepare("INSERT INTO employees (location, employee_code, full_name, dni_nie, social_security_number, hire_date, rgpd_date, phone, email_primary, email_secondary, birth_date, job_category, gender, contract_type, contract_end_date, iban, verso_user_id, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, CURRENT_DATE, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, 'active', NOW(), NOW())");
    
    $stmt->bind_param("sssssssssssssss", $location, $employee_code, $full_name, $dni_nie, $social_security_number, $hire_date_formatted, $phone, $email_primary, $email_secondary, $birth_date_formatted, $job_category, $gender, $contract_type, $contract_end_date_formatted, $iban_clean);
    
    if (!$stmt->execute()) {
        throw new Exception('Error al crear el empleado');
    }
    
    $employee_id = $conn->insert_id;
    $stmt->close();
    
    // =========================================================
    // 🆕 VERSO v14.1: Auto-inicialización Saldos Vacaciones
    // Convenio Metal Valladolid: 22 días/año, proporcional por días trabajados
    // =========================================================
    $vacation_days_initialized = 0;
    try {
        $current_year = intval(date('Y'));
        $vacation_days_initialized = calculateProportionalAnnualDays($hire_date_formatted, $current_year);
        
        // Crear registro inicial (INSERT IGNORE para robustez)
        $stmt_balance = $conn->prepare("
            INSERT IGNORE INTO vacation_balances 
            (employee_id, year, annual_days, carried_over_days, consumed_days, manual_adjustments, adjustment_reason) 
            VALUES (?, ?, ?, 0, 0.00, 0, NULL)
        ");
        $stmt_balance->bind_param("iii", $employee_id, $current_year, $vacation_days_initialized);
        $stmt_balance->execute();
        $stmt_balance->close();
    } catch (Exception $e) {
        // Silenciar errores de vacaciones para no fallar creación empleado
        // En producción se registraría en log
    }
    // =========================================================
    
    $conn->close();
    
    echo json_encode([
        'success' => true,
        'message' => 'Empleado creado correctamente',
        'employee_id' => $employee_id,
        'vacation_days_initialized' => $vacation_days_initialized // 🆕 Feedback útil
    ]);
    
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
?>
