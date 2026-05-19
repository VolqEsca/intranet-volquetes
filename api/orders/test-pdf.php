<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);

echo "PHP funcionando correctamente<br>";
echo "PHP Version: " . phpversion() . "<br>";

// Test básico de PDF
echo "Creando PDF de prueba...<br>";

class SimplePDF {
    function create() {
        header('Content-Type: application/pdf');
        header('Content-Disposition: inline; filename="test.pdf"');
        echo "%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\n2 0 obj\n<<\n/Type /Pages\n/Kids [3 0 R]\n/Count 1\n>>\nendobj\n3 0 obj\n<<\n/Type /Page\n/Parent 2 0 R\n/MediaBox [0 0 612 792]\n>>\nendobj\nxref\n0 4\n0000000000 65535 f \n0000000009 00000 n \n0000000074 00000 n \n0000000120 00000 n \ntrailer\n<<\n/Size 4\n/Root 1 0 R\n>>\nstartxref\n179\n%%EOF";
    }
}

$pdf = new SimplePDF();
$pdf->create();
?>