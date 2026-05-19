<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

echo "<h3>VERSO - Debug Error 500</h3>";

try {
    echo "<p>1. PHP básico: ✅ OK</p>";
    
    // Test TCPDF (ruta basada en tus otros PDFs funcionando)
    $tcpdfPath = __DIR__ . '/../../vendor/tecnickcom/tcpdf/tcpdf.php';
    echo "<p>2. Buscando TCPDF en: {$tcpdfPath}</p>";
    
    if (file_exists($tcpdfPath)) {
        echo "<p>3. Archivo TCPDF encontrado: ✅ OK</p>";
        require_once $tcpdfPath;
        echo "<p>4. TCPDF cargado: ✅ OK</p>";
        
        if (class_exists('TCPDF')) {
            echo "<p>5. Clase TCPDF disponible: ✅ OK</p>";
            echo "<p><strong style='color: green;'>✅ TCPDF FUNCIONA PERFECTAMENTE</strong></p>";
        } else {
            echo "<p><strong style='color: red;'>❌ ERROR: Clase TCPDF no existe después del require</strong></p>";
        }
    } else {
        echo "<p><strong style='color: red;'>❌ ERROR: Archivo TCPDF no encontrado</strong></p>";
        
        // Buscar en rutas alternativas
        $altPaths = [
            __DIR__ . '/../../../vendor/tecnickcom/tcpdf/tcpdf.php',
            __DIR__ . '/../../tcpdf/tcpdf.php'
        ];
        
        foreach ($altPaths as $altPath) {
            echo "<p>Probando ruta alternativa: {$altPath}</p>";
            if (file_exists($altPath)) {
                echo "<p><strong style='color: orange;'>⚠️ ENCONTRADO EN RUTA ALTERNATIVA: {$altPath}</strong></p>";
                break;
            }
        }
    }
    
} catch (Exception $e) {
    echo "<p><strong style='color: red;'>❌ EXCEPCIÓN CAPTURADA:</strong></p>";
    echo "<p>Mensaje: " . $e->getMessage() . "</p>";
    echo "<p>Archivo: " . $e->getFile() . "</p>";
    echo "<p>Línea: " . $e->getLine() . "</p>";
} catch (Error $e) {
    echo "<p><strong style='color: red;'>❌ ERROR FATAL PHP CAPTURADO:</strong></p>";
    echo "<p>Mensaje: " . $e->getMessage() . "</p>";
    echo "<p>Archivo: " . $e->getFile() . "</p>";
    echo "<p>Línea: " . $e->getLine() . "</p>";
}

echo "<hr>";
echo "<p><strong>Si ves este mensaje, el archivo se ejecuta sin errores fatales.</strong></p>";
?>
