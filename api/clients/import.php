<?php
require_once __DIR__ . '/../../config.php';
require_once __DIR__ . '/../cors.php';
require_once __DIR__ . '/../auth_check.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Método no permitido']);
    exit;
}

if (!isset($_FILES['file']) || $_FILES['file']['error'] !== UPLOAD_ERR_OK) {
    http_response_code(400);
    echo json_encode(['error' => 'No se ha subido ningún archivo']);
    exit;
}

require_once dirname(dirname(dirname(__FILE__))) . '/vendor/autoload.php';

use PhpOffice\PhpSpreadsheet\IOFactory;

try {
    $spreadsheet = IOFactory::load($_FILES['file']['tmp_name']);
    $data = $spreadsheet->getActiveSheet()->toArray();

    if (count($data) < 2) {
        throw new Exception('Archivo vacío');
    }

    // Preparar statements reutilizables fuera del bucle
    $stmtCheck  = $pdo->prepare("SELECT id FROM clients WHERE cif_nif = ?");
    $stmtUpdate = $pdo->prepare("UPDATE clients SET name=?, contact_person=?, phone=?, notes=?, updated_at=NOW() WHERE cif_nif=?");
    $stmtInsert = $pdo->prepare("INSERT INTO clients (name, cif_nif, contact_person, phone, email, address, notes, active, created_at, updated_at) VALUES (?, ?, ?, ?, '', '', ?, 1, NOW(), NOW())");

    $imported = 0;
    $updated  = 0;

    for ($i = 1; $i < count($data); $i++) {
        $name = trim($data[$i][0] ?? '');
        $cif  = trim($data[$i][1] ?? '');

        if (empty($name) || empty($cif)) continue;

        $contact = trim($data[$i][2] ?? '');
        $phone   = trim($data[$i][3] ?? '');
        $notes   = trim($data[$i][4] ?? '');

        $stmtCheck->execute([$cif]);
        $exists = (bool) $stmtCheck->fetch();

        if ($exists) {
            $stmtUpdate->execute([$name, $contact, $phone, $notes, $cif]);
            $updated++;
        } else {
            $stmtInsert->execute([$name, $cif, $contact, $phone, $notes]);
            $imported++;
        }
    }

    echo json_encode([
        'success'  => true,
        'imported' => $imported,
        'updated'  => $updated,
        'total'    => $imported + $updated
    ]);

} catch (PDOException $e) {
    error_log("Error PDO clients/import.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Error de base de datos']);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
?>
