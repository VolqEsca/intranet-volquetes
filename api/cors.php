<?php
// api/cors.php - Sistema CORS Optimizado para VERSO
// Maneja desarrollo (StackBlitz) y producción de forma segura

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';

// ✅ WHITELIST DE ORIGINS SEGUROS
$allowedOrigins = [
    'https://intranet.volquetesescalante.com',  // Producción
];

// Verificar si el origin está en la whitelist o es un patrón válido
$isAllowed = false;

if (in_array($origin, $allowedOrigins, true)) {
    $isAllowed = true;
} elseif (preg_match('/^https:\/\/intranetvolquetes-[a-z0-9-]+\.local-credentialless\.webcontainer\.io$/', $origin)) {
    // ✅ PATRÓN ESPECÍFICO PARA TU STACKBLITZ ACTUAL
    $isAllowed = true;
} elseif (preg_match('/^https:\/\/[a-zA-Z0-9-]+\.(webcontainer\.io|stackblitz\.io|csb\.app)$/', $origin)) {
    // ✅ PATRONES ADICIONALES PARA OTROS ENTORNOS DE DESARROLLO
    $isAllowed = true;
} elseif (strpos($origin, 'localhost') !== false) {
    // ✅ DESARROLLO LOCAL
    $isAllowed = true;
}

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
