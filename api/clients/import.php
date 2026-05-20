<?php
// NO incluir auth_check.php para evitar problemas de sesión

// Verificar autenticación manualmente
if (!isset($_SESSION['user']['id'])) {
    http_response_code(401);
    header('Content-Type: application/json');
    echo json_encode(['error' => 'No autorizado']);
    exit;
}

// CORS manual
header('Access-Control-Allow-Origin: ' . ($_SERVER['HTTP_ORIGIN'] ?? '*'));
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Configuración de BD directa
$DB_HOST = 'localhost';
$DB_USER = 'verso';
$DB_PASS = 'verso_dev_2026';
$DB_NAME = 'verso_dev';

// Header JSON
header('Content-Type: application/json');

// Solo POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Método no permitido']);
    exit;
}

// Verificar archivo
if (!isset($_FILES['file']) || $_FILES['file']['error'] !== UPLOAD_ERR_OK) {
    http_response_code(400);
    echo json_encode(['error' => 'No se ha subido ningún archivo']);
    exit;
}

// Cargar PHPSpreadsheet
require_once dirname(dirname(dirname(__FILE__))) . '/vendor/autoload.php';

use PhpOffice\PhpSpreadsheet\IOFactory;

try {
    // Leer Excel
    $spreadsheet = IOFactory::load($_FILES['file']['tmp_name']);
    $data = $spreadsheet->getActiveSheet()->toArray();
    
    if (count($data) < 2) {
        throw new Exception('Archivo vacío');
    }
    
    // Conectar DB
    $conn = new mysqli($DB_HOST, $DB_USER, $DB_PASS, $DB_NAME);
    if ($conn->connect_error) {
        throw new Exception("Error de conexión");
    }
    
    $conn->set_charset("utf8mb4");
    
    // Procesar datos
    $imported = 0;
    $updated = 0;
    
    for ($i = 1; $i < count($data); $i++) {
        $name = trim($data[$i][0] ?? '');
        $cif = trim($data[$i][1] ?? '');
        
        if (empty($name) || empty($cif)) continue;
        
        $contact = trim($data[$i][2] ?? '');
        $phone = trim($data[$i][3] ?? '');
        $notes = trim($data[$i][4] ?? '');
        
        // Check if exists
        $stmt = $conn->prepare("SELECT id FROM clients WHERE cif_nif = ?");
        $stmt->bind_param("s", $cif);
        $stmt->execute();
        $exists = $stmt->get_result()->num_rows > 0;
        $stmt->close();
        
        if ($exists) {
            $stmt = $conn->prepare("UPDATE clients SET name=?, contact_person=?, phone=?, notes=?, updated_at=NOW() WHERE cif_nif=?");
            $stmt->bind_param("sssss", $name, $contact, $phone, $notes, $cif);
            if ($stmt->execute()) $updated++;
        } else {
            $stmt = $conn->prepare("INSERT INTO clients (name, cif_nif, contact_person, phone, email, address, notes, active, created_at, updated_at) VALUES (?, ?, ?, ?, '', '', ?, 1, NOW(), NOW())");
            $stmt->bind_param("sssss", $name, $cif, $contact, $phone, $notes);
            if ($stmt->execute()) $imported++;
        }
        $stmt->close();
    }
    
    $conn->close();
    
    echo json_encode([
        'success' => true,
        'imported' => $imported,
        'updated' => $updated,
        'total' => $imported + $updated
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
?>

