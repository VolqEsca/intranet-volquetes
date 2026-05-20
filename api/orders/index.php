<?php
require_once __DIR__ . '/../cors.php';
require_once __DIR__ . '/../auth_check.php';
require_once __DIR__ . '/../permission_check.php';
require_module_permission('orders');

// Router simple para el módulo de órdenes
$method = $_SERVER['REQUEST_METHOD'];

// CAMBIO: Obtener la ruta de forma más confiable
$request_uri = $_SERVER['REQUEST_URI'];
$base_path = '/api/orders/';
$path = '';

if (strpos($request_uri, $base_path) !== false) {
    $path = substr($request_uri, strlen($base_path));
    // Quitar query string si existe
    $path = explode('?', $path)[0];
    // Quitar barra final si existe
    $path = rtrim($path, '/');
}

// Debug para ver qué path obtenemos
error_log("Orders Router - Path: '$path' from URI: $request_uri");

// Enrutar según el método y path
switch ($method) {
    case 'GET':
        if ($path === '' || $path === 'index.php') {
            // Listar órdenes
            require_once __DIR__ . '/list.php';
        } elseif (is_numeric($path)) {
            // Obtener una orden específica
            $_GET['id'] = $path;
            require_once __DIR__ . '/get.php';
        } elseif ($path === 'unit-types') {
            // Obtener tipos de unidad
            require_once __DIR__ . '/unit-types.php';
        } elseif ($path === 'departments') {
            // Obtener departamentos
            require_once __DIR__ . '/departments.php';
        } else {
            http_response_code(404);
            echo json_encode(['error' => 'Endpoint no encontrado', 'path' => $path]);
        }
        break;
        
    case 'POST':
        // Crear nueva orden
        require_once __DIR__ . '/create.php';
        break;
        
    case 'PUT':
        // Actualizar orden
        require_once __DIR__ . '/update.php';
        break;
        
    case 'DELETE':
        // Eliminar orden
        require_once __DIR__ . '/delete.php';
        break;
        
    default:
        http_response_code(405);
        echo json_encode(['error' => 'Método no permitido']);
        break;
}
?>
