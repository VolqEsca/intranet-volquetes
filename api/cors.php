<?php
// api/cors.php - Sistema CORS VERSO

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';

$allowedOrigins = [
    'https://intranet.volquetesescalante.com',
    'http://localhost:5173',
    'http://localhost:5174',
    'http://127.0.0.1:5173',
];

$isAllowed = in_array($origin, $allowedOrigins, true);

if ($isAllowed && $origin) {
    header("Access-Control-Allow-Origin: $origin");
    header('Vary: Origin');
} else {
    // Fallback seguro para producción
    header('Access-Control-Allow-Origin: https://intranet.volquetesescalante.com');
}

// ✅ CABECERAS CORS COMPLETAS
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS, PATCH');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, Accept, Origin');
header('Access-Control-Max-Age: 86400'); // Cache preflight por 24 horas

// ✅ MANEJO DE PREFLIGHT OPTIONS REQUEST
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204); // No Content
    exit;
}
?>
