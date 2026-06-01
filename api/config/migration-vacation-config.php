<?php
// Script de migración puntual — ejecutar UNA VEZ en producción y eliminar.
// Inserta las claves de configuración del módulo de vacaciones.
require_once __DIR__ . '/../../config.php';
require_once __DIR__ . '/../cors.php';
require_once __DIR__ . '/../auth_check.php';

header('Content-Type: application/json');

$sessionRol = $_SESSION['user']['rol'] ?? '';
if ($sessionRol !== 'admin' && $sessionRol !== 'Administrador') {
    http_response_code(403);
    echo json_encode(['error' => 'Solo administradores']);
    exit;
}

$claves = [
    ['vacation_annual_days',                   '22',         'integer', 'Días laborables de vacaciones por convenio por empleado/año'],
    ['vacation_annual_days_type',              'laborables', 'string',  'Tipo de cómputo de días anuales: laborables o naturales'],
    ['vacation_conflict_warning_threshold',    '3',          'integer', 'Nº de empleados ausentes simultáneos que activa advertencia operativa'],
    ['vacation_conflict_critical_remaining',   '2',          'integer', 'Nº de empleados operativos restantes por debajo del cual se activa alerta crítica'],
    ['location_1_name',                        'Nave 01',    'string',  'Etiqueta de la primera nave/ubicación'],
    ['location_2_name',                        'Nave 02',    'string',  'Etiqueta de la segunda nave/ubicación'],
];

$stmt = $pdo->prepare(
    "INSERT IGNORE INTO configuracion_sistema (clave, valor, tipo, descripcion) VALUES (?, ?, ?, ?)"
);

$inserted = 0;
foreach ($claves as [$clave, $valor, $tipo, $desc]) {
    $stmt->execute([$clave, $valor, $tipo, $desc]);
    $inserted += $stmt->rowCount();
}

echo json_encode([
    'success' => true,
    'message' => "Migración completada: {$inserted} claves insertadas (las ya existentes se ignoraron)",
    'claves' => array_column($claves, 0),
]);
