<?php
require_once __DIR__ . '/../../config.php';
require_once __DIR__ . '/../cors.php';
require_once __DIR__ . '/../auth_check.php';

header('Content-Type: application/json');

$userId = $_SESSION['user_id'];

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $stmt = $pdo->prepare("SELECT favorites FROM users WHERE id = ?");
    $stmt->execute([$userId]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);

    $favorites = [];
    if ($row && $row['favorites'] !== null) {
        $decoded = json_decode($row['favorites'], true);
        if (is_array($decoded)) {
            $favorites = $decoded;
        }
    }

    echo json_encode(['success' => true, 'data' => $favorites]);

} elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $body = json_decode(file_get_contents('php://input'), true);

    if (!isset($body['favorites']) || !is_array($body['favorites'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Campo favorites requerido y debe ser un array']);
        exit;
    }

    $favoritesJson = json_encode($body['favorites']);

    $stmt = $pdo->prepare("UPDATE users SET favorites = ? WHERE id = ?");
    $stmt->execute([$favoritesJson, $userId]);

    echo json_encode(['success' => true, 'data' => $body['favorites']]);

} else {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Método no permitido']);
}
