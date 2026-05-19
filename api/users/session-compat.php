<?php
// /api/session-compat.php
// Archivo de compatibilidad para normalizar las variables de sesión

// Si existe $_SESSION['user'] pero no $_SESSION['user_id'], crear compatibilidad
if (isset($_SESSION['user']) && is_array($_SESSION['user'])) {
    // Crear variables de sesión en el formato que esperan los archivos
    $_SESSION['user_id'] = $_SESSION['user']['id'] ?? null;
    $_SESSION['username'] = $_SESSION['user']['username'] ?? null;
    $_SESSION['rol'] = $_SESSION['user']['rol'] ?? null;
    $_SESSION['email'] = $_SESSION['user']['email'] ?? null;
}

// Función helper para obtener datos de sesión de forma consistente
function getSessionUserId() {
    return $_SESSION['user_id'] ?? $_SESSION['user']['id'] ?? null;
}

function getSessionUserRole() {
    return $_SESSION['rol'] ?? $_SESSION['user']['rol'] ?? null;
}

function getSessionUsername() {
    return $_SESSION['username'] ?? $_SESSION['user']['username'] ?? null;
}
?>
