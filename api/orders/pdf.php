<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

// pdf.php - VERSIÓN DEFINITIVA ABSOLUTA - FUENTES GRANDES + EXPANSIÓN REAL GARANTIZADA
require_once __DIR__ . '/../vendor/autoload.php';
require_once __DIR__ . '/../../config.php';

use Mpdf\Mpdf;
use Mpdf\HTMLParserMode;

$order_id = $_GET['id'] ?? null;
if (!$order_id) {
    http_response_code(400);
    echo "Error: ID de orden no proporcionado";
    exit;
}

try {
    // CONSULTA PRINCIPAL COMPLETA
    $stmt = $pdo->prepare("
        SELECT 
            wo.id, wo.order_number, wo.client_id, wo.unit_type_id,
            wo.brand, wo.model, wo.license_plate, wo.status, wo.priority,
            wo.description, wo.notes, wo.entry_date, wo.estimated_delivery,
            wo.completion_date, wo.created_by, wo.created_at,
            c.name as client_name, c.cif_nif as client_cif,
            c.phone as client_phone, c.email as client_email, c.address as client_address,
            ut.name as unit_type_name, u.nombre as created_by_name
        FROM work_orders wo
        LEFT JOIN clients c ON wo.client_id = c.id
        LEFT JOIN unit_types ut ON wo.unit_type_id = ut.id
        LEFT JOIN usuarios u ON wo.created_by = u.id
        WHERE wo.id = ?
    ");
    $stmt->execute([$order_id]);
    $order = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$order) {
        http_response_code(404);
        echo "Error: Orden no encontrada";
        exit;
    }
    
    // DEPARTAMENTOS ASIGNADOS
    $stmt = $pdo->prepare("
        SELECT d.id, d.name
        FROM departments d
        INNER JOIN work_order_departments wod ON d.id = wod.department_id
        WHERE wod.work_order_id = ?
    ");
    $stmt->execute([$order_id]);
    $assigned_departments = $stmt->fetchAll(PDO::FETCH_ASSOC);
    $assigned_names = array_column($assigned_departments, 'name');
    
    // TAREAS
    $stmt = $pdo->prepare("
        SELECT id, description, status, created_at
        FROM work_order_tasks
        WHERE work_order_id = ?
        ORDER BY created_at ASC
    ");
    $stmt->execute([$order_id]);
    $order['tasks'] = $stmt->fetchAll(PDO::FETCH_ASSOC);

} catch (PDOException $e) {
    http_response_code(500);
    echo "Error de base de datos: " . $e->getMessage();
    exit;
}

// LOCALIZACIÓN COMPLETA
$status_translations = [
    'pending' => 'Pendiente',
    'in_progress' => 'En progreso', 
    'completed' => 'Completada',
    'cancelled' => 'Cancelada'
];

$priority_translations = [
    'low' => 'Baja',
    'normal' => 'Normal',
    'high' => 'Alta', 
    'urgent' => 'Urgente'
];

$format_date = function($date_string) {
    if (empty($date_string) || $date_string === '0000-00-00') return '-';
    $timestamp = strtotime($date_string);
    return $timestamp ? date('d/m/Y', $timestamp) : '-';
};

// mPDF CONFIGURACIÓN PERFECTA CON BASE FONT GRANDE
$mpdf = new Mpdf([
    'mode' => 'utf-8',
    'format' => 'A4',
    'default_font_size' => 12,          // ✅ BASE AUMENTADA PARA LEGIBILIDAD
    'default_font' => 'helvetica',
    'margin_left' => 20,
    'margin_right' => 20,
    'margin_top' => 6,                  
    'margin_bottom' => 6,               
    'margin_header' => 0,               
    'margin_footer' => 18,              
]);

// FOOTER REAL - SIEMPRE EN PIE DE PÁGINA
$footer_html = '
<div style="text-align: center; font-size: 10px; color: #666; border-top: 1px solid #e9ecef; padding-top: 4px; line-height: 1.3;">
    <strong>Volquetes Escalante S.L.</strong><br>
    Documento generado el ' . date('d/m/Y') . ' a las ' . date('H:i') . ' | O.T. ' . htmlspecialchars($order['order_number']) . '<br>
    Este documento es válido para control interno y seguimiento de trabajos
</div>';
$mpdf->SetHTMLFooter($footer_html);

// CSS ULTRA-OPTIMIZADO - FUENTES GRANDES + TABLA DE EXPANSIÓN REAL
$css = '
    body { 
        font-family: Helvetica, Arial, sans-serif; 
        color: #333; 
        line-height: 1.4;
        margin: 0;
        padding: 0;
        font-size: 12px;               /* ✅ BASE AUMENTADA */
    }
    
    .page-header {
        text-align: center; 
        padding: 4px 0 6px 0;
        border-bottom: 2px solid #1162a6;
        margin-bottom: 8px;
    }
    
    .document-title { 
        text-align: center; 
        color: #1162a6; 
        font-size: 19px;                /* ✅ AUMENTADO PARA MÁXIMO IMPACTO */
        margin: 6px 0 10px 0; 
        font-weight: bold;
        background-color: #f8f9fa;
        padding: 8px;
        border-radius: 6px;
        border: 2px solid #e9ecef;
        text-transform: uppercase;
        letter-spacing: 0.8px;
    }
    
    .section { 
        margin-bottom: 8px;
    }
    
    .section-title { 
        background-color: #1162a6;
        color: white; 
        padding: 7px 12px; 
        margin-bottom: 5px; 
        font-size: 14px;                /* ✅ AUMENTADO PARA MÁXIMA JERARQUÍA */
        font-weight: bold;
        border-radius: 6px;
        text-transform: uppercase;
        letter-spacing: 0.6px;
    }
    
    .info-block {
        display: block;
        margin-bottom: 3px;
        padding: 1px 0;
        border-bottom: 1px dotted #e9ecef;
    }
    
    .info-label {
        font-weight: bold;
        color: #1162a6;
        display: inline-block;
        width: 100px;
        text-align: left;
        padding-right: 6px;
        font-size: 11px;                /* ✅ AUMENTADO PARA LEGIBILIDAD */
    }
    
    .info-value {
        color: #333;
        display: inline-block;
        width: calc(100% - 106px);
        vertical-align: top;
        font-size: 12px;                /* ✅ AUMENTADO PARA LEGIBILIDAD */
    }

    /* LAYOUT 2 COLUMNAS PERFECTO */
    .vehicle-table {
        width: 100%;
        border-collapse: collapse;
        margin-bottom: 5px;
    }
    .vehicle-table td {
        width: 50%;
        vertical-align: top;
        padding: 0;
    }
    .vehicle-table td:first-child {
        padding-right: 15px;
    }
    .vehicle-table td:last-child {
        padding-left: 15px;
    }

    /* DEPARTAMENTOS CON FUENTES GRANDES Y AZUL CORPORATIVO */
    .departments-container {
        text-align: center;
        padding: 10px;
        background-color: #f8f9fa;
        border-radius: 6px;
        border: 2px solid #5487c0;
        line-height: 1.6;
    }
    .dept-item {
        display: inline-block;
        margin: 0 22px;                 /* ✅ ESPACIADO MÁXIMO */
        font-size: 13px;                /* ✅ AUMENTADO PARA LEGIBILIDAD */
        font-weight: bold;
        padding: 3px 0;
        white-space: nowrap;
    }
    .dept-assigned {
        color: #1162a6;                 /* ✅ AZUL CORPORATIVO */
    }
    .dept-unassigned {
        color: #999;
        opacity: 0.8;
    }
    .check-visual {
        font-size: 18px;                /* ✅ AUMENTADO PARA VISIBILIDAD */
        margin-right: 7px;
        font-weight: bold;
    }
    .check-assigned {
        color: #1162a6;                 /* ✅ AZUL CORPORATIVO EN CHECK */
    }
    .check-unassigned {
        color: #ccc;
    }

    /* TRABAJOS CON FUENTES GRANDES */
    .expandable-tasks {
        background-color: #f8f9fa;
        padding: 12px;
        border-radius: 6px;
        border-left: 4px solid #5487c0;
        min-height: 60px;
    }
    
    .task-item {
        margin: 5px 0;
        padding-left: 15px;
        position: relative;
        font-size: 12px;                /* ✅ AUMENTADO PARA LEGIBILIDAD */
        line-height: 1.5;
    }
    
    .task-item:before {
        content: "•";
        color: #1162a6;
        font-weight: bold;
        position: absolute;
        left: 0;
        font-size: 15px;                /* ✅ AUMENTADO PARA VISIBILIDAD */
    }
    
    .no-tasks {
        color: #666;
        font-style: italic;
        text-align: center;
        padding: 20px;
        font-size: 12px;                /* ✅ AUMENTADO PARA LEGIBILIDAD */
    }
    
    /* TABLA DE ALTURA COMPLETA - TÉCNICA GARANTIZADA */
    .full-height-table {
        width: 100%;
        height: 100%;
        border-collapse: collapse;
        margin: 0;
        padding: 0;
    }
    
    .content-row {
        height: auto;
        vertical-align: top;
    }
    
    .expandable-row {
        height: 100%;                   /* ✅ ABSORBE TODO EL ESPACIO RESTANTE */
        vertical-align: top;
    }
    
    /* OBSERVACIONES EXPANDIBLES - DENTRO DE TABLA ELÁSTICA */
    .expandable-observations {
        background-color: #fff;
        padding: 15px;
        border: 1px solid #e9ecef;
        border-radius: 6px;
        font-size: 13px;                /* ✅ AUMENTADO PARA LEGIBILIDAD */
        line-height: 1.6;
        height: 100%;                   /* ✅ OCUPA TODA LA CELDA EXPANDIBLE */
        box-sizing: border-box;
    }
    
    /* TABLA SEGUIMIENTO CON FUENTES GRANDES */
    .tracking-table { 
        width: 100%; 
        border-collapse: collapse; 
        margin: 5px 0;
        background-color: white;
    }
    
    .tracking-table th { 
        background-color: #1162a6;
        color: white;
        padding: 8px 6px;
        text-align: center;
        vertical-align: middle;
        font-weight: bold;
        font-size: 11px;                /* ✅ AUMENTADO PARA LEGIBILIDAD */
        border: 1px solid #1162a6;
    }
    
    .tracking-table td { 
        border: 1px solid #ddd; 
        padding: 12px 6px;              /* ✅ AUMENTADO PARA MEJOR ESPACIO */
        text-align: center;             
        vertical-align: middle;         
        height: 75px;                   /* ✅ ALTURA MÁXIMA GENEROSA */
        font-size: 10px;                /* ✅ AUMENTADO PARA LEGIBILIDAD */
        font-weight: normal;
    }
    
    /* ÁREA MATERIALES EXPANDIBLE - DENTRO DE TABLA ELÁSTICA */
    .materials-expandible {
        border: 2px solid #1162a6;
        border-radius: 6px;
        background-color: #fafafa;
        padding: 15px;
        height: 100%;                   /* ✅ OCUPA TODA LA CELDA EXPANDIBLE */
        box-sizing: border-box;
    }
    
    .materials-header {
        background-color: #1162a6;
        color: white;
        padding: 7px 12px;
        margin: -15px -15px 15px -15px;
        border-radius: 6px 6px 0 0;
        font-weight: bold;
        font-size: 11px;                /* ✅ AUMENTADO PARA LEGIBILIDAD */
        text-align: center;
    }
';

$mpdf->WriteHTML($css, HTMLParserMode::HEADER_CSS);

// PÁGINA 1 - ESTRUCTURA DE TABLA DE ALTURA COMPLETA
$html1 = '
<div class="page-header">
    <img src="https://medios.volquetesescalante.com/verso/logo_orden_trabajo.svg" 
         alt="Logo" style="height: 52px;">
</div>

<table class="full-height-table">
    <tr class="content-row">
        <td>
            <div class="document-title">Orden de Trabajo Nº ' . htmlspecialchars($order['order_number']) . '</div>

            <div class="section">
                <div class="section-title">Información del Cliente</div>';

// Cliente info con fuentes grandes
if (!empty($order['client_name'])) {
    $html1 .= '<div class="info-block"><span class="info-label">Cliente: </span><span class="info-value">' . htmlspecialchars($order['client_name']) . '</span></div>';
}
if (!empty($order['client_cif'])) {
    $html1 .= '<div class="info-block"><span class="info-label">CIF: </span><span class="info-value">' . htmlspecialchars($order['client_cif']) . '</span></div>';
}
if (!empty($order['client_phone'])) {
    $html1 .= '<div class="info-block"><span class="info-label">Teléfono: </span><span class="info-value">' . htmlspecialchars($order['client_phone']) . '</span></div>';
}

$html1 .= '</div>';

// DETALLES VEHÍCULO - 2 COLUMNAS REALES
$html1 .= '
            <div class="section">
                <div class="section-title">Detalles del Vehículo/Unidad</div>
                <table class="vehicle-table">
                    <tr>
                        <td>';

// Columna izquierda
if (!empty($order['unit_type_name'])) {
    $html1 .= '<div class="info-block"><span class="info-label">Tipo: </span><span class="info-value">' . htmlspecialchars($order['unit_type_name']) . '</span></div>';
}
if (!empty($order['license_plate'])) {
    $html1 .= '<div class="info-block"><span class="info-label">Matrícula: </span><span class="info-value">' . htmlspecialchars($order['license_plate']) . '</span></div>';
}
$html1 .= '<div class="info-block"><span class="info-label">F. Entrada: </span><span class="info-value">' . $format_date($order['entry_date']) . '</span></div>';

$html1 .= '</td><td>';

// Columna derecha
if (!empty($order['brand'])) {
    $html1 .= '<div class="info-block"><span class="info-label">Marca: </span><span class="info-value">' . htmlspecialchars($order['brand']) . '</span></div>';
}
if (!empty($order['model'])) {
    $html1 .= '<div class="info-block"><span class="info-label">Modelo: </span><span class="info-value">' . htmlspecialchars($order['model']) . '</span></div>';
}
$html1 .= '<div class="info-block"><span class="info-label">Estado: </span><span class="info-value">' . htmlspecialchars($status_translations[$order['status']] ?? ucfirst($order['status'])) . '</span></div>';

if (!empty($order['priority'])) {
    $html1 .= '<div class="info-block"><span class="info-label">Prioridad: </span><span class="info-value">' . htmlspecialchars($priority_translations[$order['priority']] ?? ucfirst($order['priority'])) . '</span></div>';
}

$html1 .= '</td></tr></table></div>';

// DEPARTAMENTOS CON FUENTES GRANDES Y AZUL CORPORATIVO
$departments_list = ['Hidráulica', 'Electricidad', 'Taller'];
$html1 .= '
            <div class="section">
                <div class="section-title">Departamentos</div>
                <div class="departments-container">';

foreach ($departments_list as $dept_name) {
    $is_assigned = in_array($dept_name, $assigned_names);
    $check_symbol = $is_assigned ? '●' : '○';
    $check_class = $is_assigned ? 'check-assigned' : 'check-unassigned';
    $dept_class = $is_assigned ? 'dept-assigned' : 'dept-unassigned';
    
    $html1 .= '<span class="dept-item ' . $dept_class . '">
        <span class="check-visual ' . $check_class . '">' . $check_symbol . '</span>' . 
        htmlspecialchars($dept_name) . '</span>';
}

$html1 .= '</div></div>';

// TRABAJOS A REALIZAR CON FUENTES GRANDES
$html1 .= '
            <div class="section">
                <div class="section-title">Trabajos a Realizar</div>
                <div class="expandable-tasks">';

$has_tasks = false;
if (!empty($order['tasks'])) {
    foreach ($order['tasks'] as $task) {
        $task_description = trim($task['description']);
        if (!empty($task_description)) {
            $html1 .= '<div class="task-item">' . htmlspecialchars($task_description) . '</div>';
            $has_tasks = true;
        }
    }
}

if (!$has_tasks) {
    $html1 .= '<div class="no-tasks">No se han especificado tareas específicas</div>';
}

$html1 .= '</div></div>
        </td>
    </tr>';

// FILA EXPANDIBLE PARA OBSERVACIONES - ABSORBE TODO EL ESPACIO RESTANTE
if (!empty($order['description']) || !empty($order['notes'])) {
    $html1 .= '
    <tr class="expandable-row">
        <td>
            <div class="section">
                <div class="section-title">Observaciones</div>
                <div class="expandable-observations">';
    
    if (!empty($order['description'])) {
        $html1 .= '<strong>Descripción: </strong>' . nl2br(htmlspecialchars($order['description']));
    }
    
    if (!empty($order['notes']) && $order['notes'] !== $order['description']) {
        if (!empty($order['description'])) $html1 .= '<br><br>';
        $html1 .= '<strong>Notas: </strong>' . nl2br(htmlspecialchars($order['notes']));
    }
    
    $html1 .= '</div>
            </div>
        </td>
    </tr>';
}

$html1 .= '</table>';

$mpdf->WriteHTML($html1, HTMLParserMode::HTML_BODY);

// PÁGINA 2 - ESTRUCTURA DE TABLA DE ALTURA COMPLETA
$mpdf->AddPage();

$html2 = '
<table class="full-height-table">
    <tr class="content-row">
        <td>
            <div class="document-title">Seguimiento - Orden de Trabajo Nº ' . htmlspecialchars($order['order_number']) . '</div>

            <div class="section">
                <div class="section-title">Registro de Actividades Diarias</div>
                <table class="tracking-table">
                    <thead>
                        <tr>
                            <th style="width: 8%;">Día</th>
                            <th style="width: 15%;">Fecha</th>
                            <th style="width: 55%;">Actividad Realizada</th>
                            <th style="width: 22%;">Técnico/Firma</th>
                        </tr>
                    </thead>
                    <tbody>';

// 6 FILAS CON FUENTES GRANDES Y ALTURA MÁXIMA
for ($i = 1; $i <= 6; $i++) {
    $html2 .= '<tr>
        <td style="font-weight: bold;">' . $i . '</td>
        <td></td>
        <td></td>
        <td></td>
    </tr>';
}

$html2 .= '
                    </tbody>
                </table>
            </div>
        </td>
    </tr>
    <tr class="expandable-row">
        <td>
            <div class="section">
                <div class="section-title">Material y Repuestos Utilizados</div>
                <div class="materials-expandible">
                    <div class="materials-header">Espacio libre para registrar cantidad y descripción de materiales</div>
                </div>
            </div>
        </td>
    </tr>
</table>';

$mpdf->WriteHTML($html2, HTMLParserMode::HTML_BODY);

// GENERAR PDF
$filename = 'OT_' . $order['order_number'] . '_' . date('Ymd') . '.pdf';
$mpdf->Output($filename, 'I');
?>
