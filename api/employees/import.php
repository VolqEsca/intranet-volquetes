<?php
// ✅ VERSO v14.1 - Importación Masiva con Auto-inicialización de Saldos

require_once __DIR__ . '/../../config.php';
require_once __DIR__ . '/../cors.php';
require_once __DIR__ . '/../auth_check.php';

// Configuración de BD directa (como clientes)
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

// Verificar archivo
if (!isset($_FILES['file']) || $_FILES['file']['error'] !== UPLOAD_ERR_OK) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'No se ha subido ningún archivo']);
    exit;
}

// ✅ VALIDACIÓN ROBUSTA PhpSpreadsheet
$autoloadPath = dirname(dirname(dirname(__FILE__))) . '/vendor/autoload.php';
if (!file_exists($autoloadPath)) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'PhpSpreadsheet no disponible en: ' . $autoloadPath]);
    exit;
}

require_once $autoloadPath;

use PhpOffice\PhpSpreadsheet\IOFactory;
use PhpOffice\PhpSpreadsheet\Shared\Date;

// ===== FUNCIONES DE VALIDACIÓN OPTIMIZADAS =====
function validateDNI_NIE($document) {
    $document = strtoupper(trim($document));
    
    // DNI: 8 dígitos + letra
    if (preg_match('/^[0-9]{8}[TRWAGMYFPDXBNJZSQVHLCKE]$/', $document)) {
        $number = intval(substr($document, 0, 8));
        $letter = substr($document, 8, 1);
        $letters = 'TRWAGMYFPDXBNJZSQVHLCKE';
        return $letters[$number % 23] === $letter;
    }
    
    // NIE: X/Y/Z + 7 dígitos + letra
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
    // ✅ NORMALIZACIÓN ROBUSTA para IBANs con y sin espacios
    $clean = strtoupper(str_replace(' ', '', trim($iban)));
    
    if (strlen($clean) !== 24 || substr($clean, 0, 2) !== 'ES') {
        return false;
    }
    
    // Algoritmo módulo 97 ISO 13616
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

// ✅ VALIDACIÓN SS FLEXIBLE (11 o 12 dígitos) - Realidad española
function validateSocialSecurity($ss) {
    $clean = str_replace(' ', '', $ss);
    // Aceptar 11 o 12 dígitos (algunos SS españoles históricos tienen 11)
    return preg_match('/^[0-9]{11,12}$/', $clean);
}

// ✅ FUNCIÓN MANEJO FECHAS EXCEL ESPECIALIZADA para tu formato
function processExcelDate($value) {
    if (empty($value)) return null;
    
    // Tu Excel tiene fechas como "2006-06-05 00:00:00" (string)
    if (is_string($value)) {
        $value = trim($value);
        if ($value === '') return null;
        
        // Formato de tu Excel: "YYYY-MM-DD HH:MM:SS"
        if (preg_match('/^\d{4}-\d{2}-\d{2}/', $value)) {
            return substr($value, 0, 10); // Extraer solo YYYY-MM-DD
        }
        
        // Otros formatos posibles
        $timestamp = strtotime($value);
        return $timestamp !== false ? date('Y-m-d', $timestamp) : null;
    }
    
    // Si es numérico, formato Excel
    if (is_numeric($value)) {
        try {
            return Date::excelToDateTimeObject($value)->format('Y-m-d');
        } catch (Exception $e) {
            return null;
        }
    }
    
    return null;
}

// =========================================================
// 🆕 FUNCIÓN: Cálculo Proporcional Convenio Metal Valladolid
// Reutilizada del create.php para consistencia
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
    // Leer Excel
    $spreadsheet = IOFactory::load($_FILES['file']['tmp_name']);
    $data = $spreadsheet->getActiveSheet()->toArray();
    
    if (count($data) < 2) {
        throw new Exception('Archivo vacío o sin datos');
    }
    
    // Conectar DB
    $conn = new mysqli($DB_HOST, $DB_USER, $DB_PASS, $DB_NAME);
    if ($conn->connect_error) {
        throw new Exception("Error de conexión: " . $conn->connect_error);
    }
    
    $conn->set_charset("utf8mb4");
    
    // Procesar datos
    $imported = 0;
    $updated = 0;
    $errors = [];
    $current_year = intval(date('Y')); // 🆕 Para cálculo saldos
    
    for ($i = 1; $i < count($data); $i++) {
        $row_number = $i + 1;
        
        try {
            // ✅ FILTRO PARA IGNORAR FILAS COMPLETAMENTE VACÍAS
            $is_row_empty = true;
            for ($col_idx = 0; $col_idx <= 12; $col_idx++) { // Solo 13 columnas (0-12)
                if (!empty(trim($data[$i][$col_idx] ?? ''))) {
                    $is_row_empty = false;
                    break;
                }
            }
            if ($is_row_empty) {
                continue;
            }
            
            // ✅ MAPEO CORREGIDO - 13 COLUMNAS REALES DE TU EXCEL:
            // [0]=Nave, [1]=Reloj, [2]=Nombre, [3]=DNI, [4]=SS,
            // [5]=Antigüedad, [6]=Teléfono, [7]=Email, [8]=Nacimiento, [9]=Categoría,
            // [10]=Tipo contrato, [11]=Fecha fin, [12]=IBAN
            
            $location = trim($data[$i][0] ?? '');
            $employee_code = !empty(trim($data[$i][1] ?? '')) ? trim($data[$i][1]) : null;
            $full_name = trim($data[$i][2] ?? '');
            $dni_nie = strtoupper(str_replace(' ', '', $data[$i][3] ?? ''));
            $social_security_number = str_replace(' ', '', $data[$i][4] ?? '');
            
            // ✅ FECHAS con función especializada
            $hire_date = processExcelDate($data[$i][5] ?? '');
            $phone = str_replace([' ', '-'], '', $data[$i][6] ?? ''); // Limpiar espacios y guiones
            $email_raw = trim($data[$i][7] ?? '');
            $birth_date = processExcelDate($data[$i][8] ?? '');
            $job_category = trim($data[$i][9] ?? '');
            $contract_type = trim($data[$i][10] ?? '');
            $contract_end_date = processExcelDate($data[$i][11] ?? '');
            $iban_raw = trim($data[$i][12] ?? '');
            
            // ✅ MANEJO ROBUSTO DE EMAILS CON SOLUCIÓN NOT NULL
            $email_primary = null;
            $email_secondary = null;
            if (!empty($email_raw) && $email_raw !== '-') {
                $emails = explode(' / ', $email_raw);
                $email_primary = !empty(trim($emails[0])) ? trim($emails[0]) : null;
                $email_secondary = isset($emails[1]) && !empty(trim($emails[1])) ? trim($emails[1]) : null;
            }
            
            // ✅ SOLUCIÓN ELEGANTE PARA EMAIL_PRIMARY NOT NULL
            // En lugar de cambiar la BD, usar email corporativo por defecto
            if (empty($email_primary)) {
                $email_primary = strtolower(str_replace(' ', '.', $full_name)) . '@volquetesescalante.com';
                // Limpiar caracteres especiales para email válido
                $email_primary = preg_replace('/[^a-z0-9.@]/', '', $email_primary);
            }
            
            // Normalizar IBAN (sin espacios para BD)
            $iban_clean = strtoupper(str_replace(' ', '', $iban_raw));
            
            // ✅ Campo Sexo no existe en tu Excel - se queda en NULL
            $gender = null;
            
            // ✅ VALIDACIONES OPTIMIZADAS
            $missing_fields = [];
            if (empty($location)) $missing_fields[] = 'Nave';
            if (empty($full_name)) $missing_fields[] = 'Nombre y Apellidos';
            if (empty($dni_nie)) $missing_fields[] = 'DNI/NIE';
            if (empty($social_security_number)) $missing_fields[] = 'Nº Seguridad Social';
            if (empty($hire_date)) $missing_fields[] = 'Antigüedad (Fecha Alta)';
            if (empty($job_category)) $missing_fields[] = 'Categoría';
            if (empty($contract_type)) $missing_fields[] = 'Tipo de Contrato';
            if (empty($iban_raw)) $missing_fields[] = 'IBAN';

            if (!empty($missing_fields)) {
                throw new Exception("Campos faltantes: " . implode(', ', $missing_fields));
            }
            
            // Validaciones específicas
            if (!validateDNI_NIE($dni_nie)) {
                throw new Exception("DNI/NIE inválido: " . $dni_nie);
            }
            
            // ✅ SS FLEXIBLE: Aceptar 11 o 12 dígitos (realidad española)
            if (!validateSocialSecurity($social_security_number)) {
                throw new Exception("Número SS debe tener 11 o 12 dígitos: " . $social_security_number);
            }
            
            if (!validateIBAN($iban_clean)) {
                throw new Exception("IBAN inválido: " . $iban_raw);
            }
            
            // ✅ VALIDACIÓN INTELIGENTE CONTRATOS TEMPORALES
            if ($contract_type === 'Temporal' && !$contract_end_date) {
                throw new Exception("Contrato temporal requiere Fecha Fin - Revisar fila manualmente");
            }
            
            // Verificar si existe por DNI/NIE
            $stmt = $conn->prepare("SELECT id FROM employees WHERE dni_nie = ?");
            $stmt->bind_param("s", $dni_nie);
            $stmt->execute();
            $exists = $stmt->get_result()->num_rows > 0;
            $stmt->close();
            
            if ($exists) {
                // ✅ UPDATE - No tocamos vacation_balances en updates para preservar históricos
                $stmt = $conn->prepare("UPDATE employees SET location=?, employee_code=?, full_name=?, social_security_number=?, hire_date=?, rgpd_date=CURRENT_DATE, phone=?, email_primary=?, email_secondary=?, birth_date=?, job_category=?, gender=?, contract_type=?, contract_end_date=?, iban=?, updated_at=NOW() WHERE dni_nie=?");
                $stmt->bind_param("sssssssssssssss", $location, $employee_code, $full_name, $social_security_number, $hire_date, $phone, $email_primary, $email_secondary, $birth_date, $job_category, $gender, $contract_type, $contract_end_date, $iban_clean, $dni_nie);
                if ($stmt->execute()) $updated++;
            } else {
                // ✅ INSERT - Solo aquí aplicamos inicialización de saldos
                $stmt = $conn->prepare("INSERT INTO employees (location, employee_code, full_name, dni_nie, social_security_number, hire_date, rgpd_date, phone, email_primary, email_secondary, birth_date, job_category, gender, contract_type, contract_end_date, iban, verso_user_id, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, CURRENT_DATE, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, 'active', NOW(), NOW())");
                $stmt->bind_param("sssssssssssssss", $location, $employee_code, $full_name, $dni_nie, $social_security_number, $hire_date, $phone, $email_primary, $email_secondary, $birth_date, $job_category, $gender, $contract_type, $contract_end_date, $iban_clean);
                
                if ($stmt->execute()) {
                    $imported++;
                    $new_employee_id = $conn->insert_id;
                    
                    // =========================================================
                    // 🆕 VERSO v14.1: Auto-inicialización Saldos Vacaciones
                    // Solo para empleados nuevos (INSERT), nunca en UPDATE
                    // =========================================================
                    try {
                        $annual_days = calculateProportionalAnnualDays($hire_date, $current_year);
                        
                        $stmt_balance = $conn->prepare("
                            INSERT IGNORE INTO vacation_balances 
                            (employee_id, year, annual_days, carried_over_days, consumed_days, manual_adjustments) 
                            VALUES (?, ?, ?, 0, 0.00, 0)
                        ");
                        $stmt_balance->bind_param("iii", $new_employee_id, $current_year, $annual_days);
                        $stmt_balance->execute();
                        $stmt_balance->close();
                    } catch (Exception $e) {
                        // Silenciar errores de saldo para no detener importación
                    }
                    // =========================================================
                }
            }
            $stmt->close();
            
        } catch (Exception $rowException) {
            $errors[] = "Fila {$row_number}: " . $rowException->getMessage();
        }
    }
    
    $conn->close();
    
    // ✅ RESPUESTA ROBUSTA con encoding UTF-8
    $response = [
        'success' => true,
        'imported' => $imported,
        'updated' => $updated,
        'total' => $imported + $updated,
        'errors' => $errors
    ];
    
    echo json_encode($response, JSON_UNESCAPED_UNICODE);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()], JSON_UNESCAPED_UNICODE);
}
?>
