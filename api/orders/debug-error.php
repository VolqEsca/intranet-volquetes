<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "<h1>🔧 Debugging Error 500 - Paso a Paso</h1>";
echo "<style>body{font-family:Arial;margin:20px;} .ok{color:#1162a6;font-weight:bold;} .error{color:#e74c3c;font-weight:bold;}</style>";

try {
    // CHECKPOINT 1: PHP básico
    echo "<p class='ok'>✅ Checkpoint 1: PHP ejecutándose</p>";
    
    // CHECKPOINT 2: Verificar autoloader
    echo "<h3>Checkpoint 2: Autoloader</h3>";
    $autoload_path = __DIR__ . '/../../vendor/autoload.php';
    echo "<p>Buscando: <code>" . htmlspecialchars($autoload_path) . "</code></p>";
    
    if (file_exists($autoload_path)) {
        echo "<p class='ok'>✅ Autoloader encontrado</p>";
        require_once $autoload_path;
        echo "<p class='ok'>✅ Autoloader cargado</p>";
    } else {
        // Probar ruta alternativa
        $alt_path = __DIR__ . '/../vendor/autoload.php';
        echo "<p>Probando ruta alternativa: <code>" . htmlspecialchars($alt_path) . "</code></p>";
        
        if (file_exists($alt_path)) {
            echo "<p class='ok'>✅ Autoloader encontrado en ruta alternativa</p>";
            require_once $alt_path;
        } else {
            echo "<p class='error'>❌ AUTOLOADER NO ENCONTRADO</p>";
            die("STOP: Sin autoloader no podemos continuar");
        }
    }
    
    // CHECKPOINT 3: TCPDF
    echo "<h3>Checkpoint 3: TCPDF</h3>";
    if (class_exists('TCPDF')) {
        echo "<p class='ok'>✅ TCPDF disponible</p>";
        $pdf = new TCPDF();
        echo "<p class='ok'>✅ TCPDF inicializado</p>";
    } else {
        echo "<p class='error'>❌ TCPDF NO disponible</p>";
        die("STOP: TCPDF no encontrado");
    }
    
    // CHECKPOINT 4: Config
    echo "<h3>Checkpoint 4: Config</h3>";
    $config_path = __DIR__ . '/../../config.php';
    echo "<p>Buscando: <code>" . htmlspecialchars($config_path) . "</code></p>";
    
    if (file_exists($config_path)) {
        echo "<p class='ok'>✅ Config encontrado</p>";
        require_once $config_path;
        echo "<p class='ok'>✅ Config cargado</p>";
    } else {
        echo "<p class='error'>❌ CONFIG NO ENCONTRADO</p>";
        die("STOP: Sin config no podemos continuar");
    }
    
    // CHECKPOINT 5: Base de datos
    echo "<h3>Checkpoint 5: Base de Datos</h3>";
    if (isset($pdo)) {
        echo "<p class='ok'>✅ PDO disponible</p>";
    } else {
        echo "<p class='error'>❌ PDO NO disponible</p>";
        die("STOP: Sin conexión BD");
    }
    
    echo "<h2 class='ok'>🎉 ¡TODOS LOS CHECKPOINTS PASADOS!</h2>";
    echo "<p>Si ves este mensaje, el problema está en el código específico del PDF, no en las dependencias básicas.</p>";
    
} catch (Throwable $e) {
    echo "<p class='error'>❌ ERROR CAPTURADO: " . htmlspecialchars($e->getMessage()) . "</p>";
    echo "<p class='error'>Línea: " . $e->getLine() . " | Archivo: " . htmlspecialchars($e->getFile()) . "</p>";
}
?>