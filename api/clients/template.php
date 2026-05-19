<?php
// /api/clients/template.php
require_once __DIR__ . '/../cors.php';
require_once __DIR__ . '/../auth_check.php';

// Crear un archivo Excel simple sin usar librerías
header('Content-Type: application/vnd.ms-excel');
header('Content-Disposition: attachment; filename="plantilla_clientes.xls"');
header('Cache-Control: max-age=0');

// Crear tabla HTML que Excel puede leer
?>
<html xmlns:o="urn:schemas-microsoft-com:office:office"
      xmlns:x="urn:schemas-microsoft-com:office:excel"
      xmlns="http://www.w3.org/TR/REC-html40">
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
    <style>
        table { border-collapse: collapse; }
        th, td { border: 1px solid #000; padding: 8px; }
        th { background-color: #1162a6; color: white; font-weight: bold; }
        td { background-color: white; }
    </style>
</head>
<body>
    <table>
        <tr>
            <th>Nombre del cliente</th>
            <th>CIF/NIF</th>
            <th>Persona de contacto</th>
            <th>Teléfono</th>
            <th>Notas</th>
        </tr>
        <tr>
            <td>Ejemplo Empresa S.L.</td>
            <td>B12345678</td>
            <td>Juan Pérez</td>
            <td>912345678</td>
            <td>Cliente preferente</td>
        </tr>
        <tr>
            <td>Transportes García S.A.</td>
            <td>A87654321</td>
            <td>María García</td>
            <td>934567890</td>
            <td></td>
        </tr>
        <tr>
            <td></td>
            <td></td>
            <td></td>
            <td></td>
            <td></td>
        </tr>
    </table>
</body>
</html>
<?php
exit;
?>
