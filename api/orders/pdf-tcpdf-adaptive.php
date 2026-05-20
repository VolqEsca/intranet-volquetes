<?php
// pdf-tcpdf-adaptive.php - SOLUCIÓN EQUILIBRADA Y DEFINITIVA
// Balance perfecto entre compactación y legibilidad profesional
// ✅ INCLUYE LIMPIEZA AUTOMÁTICA DE MENSAJES FANTASMA

require_once __DIR__ . '/../../config.php';
require_once __DIR__ . '/../cors.php';
require_once __DIR__ . '/../auth_check.php';
require_once __DIR__ . '/../permission_check.php';
require_module_permission('orders');
require_once __DIR__ . '/../../vendor/autoload.php';

use TCPDF;

// ✅ FUNCIÓN DEFINITIVA: Elimina mensajes automáticos no deseados
function cleanPDFObservations($text) {
    if (empty($text)) return '';
    
    $blockedMessages = [
        'Descripción: Orden de trabajo actualizada.',
        'Descripcion: Orden de trabajo actualizada.',
        'Orden de trabajo actualizada.',
        'Descripción: Orden actualizada.',
        'Orden actualizada.'
    ];
    
    $cleaned = $text;
    foreach ($blockedMessages as $message) {
        $cleaned = str_replace($message, '', $cleaned);
    }
    
    // Limpiar espacios y saltos duplicados
    $cleaned = preg_replace('/\s+/', ' ', $cleaned);
    $cleaned = trim($cleaned);
    
    return $cleaned;
}

class VolquetesEscalantePDF extends TCPDF {
    private $order_data;
    
    public function __construct($order_data) {
        parent::__construct('P', 'mm', 'A4', true, 'UTF-8');
        $this->order_data = $order_data;
        
        $this->SetCreator('Volquetes Escalante - VERSO');
        $this->SetAuthor('Volquetes Escalante');
        $this->SetTitle('Orden de Trabajo Nº ' . $order_data['order_number']);
        
        // Márgenes optimizados: 12mm laterales
        $this->SetMargins(12, 6, 12);
        $this->SetHeaderMargin(0);
        $this->SetFooterMargin(6);
        $this->SetFont('dejavusans', '', 12);
        $this->setFontSubsetting(true);
        $this->SetAutoPageBreak(false);
    }
    
    public function Header() {
        if ($this->PageNo() == 1) {
            try {
                $this->Image(__DIR__ . '/../../assets/logo_orden_trabajo.png', 
                            72, 8, 65, 0, 'PNG');
            } catch (Exception $e) {
                // Fallback limpio si falla el logo
                $this->SetFont('dejavusans', 'B', 16);
                $this->SetTextColor(17, 98, 166);
                $this->SetXY(12, 12);
                $this->Cell(186, 15, 'VOLQUETES ESCALANTE', 0, 1, 'C');
            }
        }
    }
    
    public function Footer() {
        $this->SetY(-18);
        $this->SetFont('dejavusans', '', 9);
        $this->SetTextColor(102, 102, 102);
        
        $footer_text = "Volquetes Escalante S.L.\n";
        $footer_text .= "Documento generado el " . date('d/m/Y') . " a las " . date('H:i') . 
                       " | O.T. " . $this->order_data['order_number'] . "\n";
        $footer_text .= "Este documento es válido para control interno y seguimiento de trabajos";
        
        $this->MultiCell(0, 4, $footer_text, 0, 'C', false, 1);
    }
}

// ✅ FUNCIÓN EQUILIBRADA - Espaciado profesional calibrado
function addSection($pdf, $title) {
    $pdf->SetFont('dejavusans', 'B', 14);
    $pdf->SetFillColor(17, 98, 166);
    $pdf->SetTextColor(255, 255, 255);
    $pdf->Cell(0, 9, '  ' . $title, 0, 1, 'L', true);
    $pdf->Ln(2.5); // ✅ Punto dulce: ni muy compacto ni muy espacioso
    
    // Reset automático
    $pdf->SetTextColor(51, 51, 51);
    $pdf->SetFont('dejavusans', '', 12);
}

// ✅ PROCESADOR SIMPLIFICADO Y ROBUSTO DE TAREAS
function processTasksFromDB($tasks_array) {
    $individual_tasks = [];
    
    foreach ($tasks_array as $task_entry) {
        if (!empty(trim($task_entry['description']))) {
            $description = trim($task_entry['description']);
            
            // ✅ Método híbrido: más robusto que preg_split, más simple que str_replace
            // Primero intentamos dividir por separadores comunes
            $separators = ['•', '-', '·', '*'];
            $found_separator = false;
            
            foreach ($separators as $sep) {
                if (strpos($description, $sep) !== false) {
                    $parts = explode($sep, $description);
                    $found_separator = true;
                    break;
                }
            }
            
            // Si no encontramos separadores, tratamos como tarea única
            if (!$found_separator) {
                $parts = [$description];
            }
            
            foreach ($parts as $part) {
                $clean_part = trim($part);
                if (!empty($clean_part) && strlen($clean_part) > 2) {
                    $individual_tasks[] = $clean_part;
                }
            }
        }
    }
    
    return $individual_tasks;
}

// ✅ FILTRO INTELIGENTE DE PLACEHOLDERS
function isGenericPlaceholder($text) {
    if (empty($text)) return true;
    $text = trim(strtolower($text));
    $placeholders = [
        'orden de trabajo', 'orden', 'trabajo', 'descripcion', 
        'descripción', 'observaciones', 'notas', 'n/a', '-'
    ];
    return in_array($text, $placeholders) || strlen($text) < 3;
}

// Función simplificada para layout dinámico
function calculateDynamicLayout($tasks_count) {
    if ($tasks_count <= 5) {
        return ['font_size' => 12, 'max_tasks' => $tasks_count, 'truncated' => false];
    } elseif ($tasks_count <= 10) {
        return ['font_size' => 11, 'max_tasks' => $tasks_count, 'truncated' => false];
    } elseif ($tasks_count <= 15) {
        return ['font_size' => 10, 'max_tasks' => $tasks_count, 'truncated' => false];
    } else {
        return ['font_size' => 10, 'max_tasks' => 12, 'truncated' => true];
    }
}

$order_id = $_GET['id'] ?? null;
if (!$order_id) {
    http_response_code(400);
    exit('Error: ID de orden no proporcionado');
}

try {
    // Consulta completa con contact_person
    $stmt = $pdo->prepare("
        SELECT 
            wo.id, wo.order_number, wo.client_id, wo.unit_type_id,
            wo.brand, wo.model, wo.license_plate, wo.status, wo.priority,
            wo.description, wo.notes, wo.entry_date, wo.estimated_delivery,
            wo.completion_date, wo.created_by, wo.created_at,
            c.name as client_name, c.cif_nif as client_cif,
            c.contact_person as client_contact_person,
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
        exit('Error: Orden no encontrada');
    }
    
    // Departamentos asignados
    $stmt = $pdo->prepare("
        SELECT d.id, d.name
        FROM departments d
        INNER JOIN work_order_departments wod ON d.id = wod.department_id
        WHERE wod.work_order_id = ?
    ");
    $stmt->execute([$order_id]);
    $assigned_departments = $stmt->fetchAll(PDO::FETCH_ASSOC);
    $assigned_names = array_column($assigned_departments, 'name');
    
    // Tareas
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
    exit('Error de base de datos');
}

// Localización
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

// ✅ Procesar tareas para obtener lista individual
$individual_tasks = processTasksFromDB($order['tasks']);
$layout = calculateDynamicLayout(count($individual_tasks));

// Crear PDF
$pdf = new VolquetesEscalantePDF($order);
$pdf->AddPage();

// === PÁGINA 1: INFORMACIÓN PRINCIPAL ===

// Título principal
$pdf->SetY(35);
$pdf->SetFont('dejavusans', 'B', 18);
$pdf->SetFillColor(248, 249, 250);
$pdf->SetTextColor(17, 98, 166);
$pdf->Cell(0, 12, 'ORDEN DE TRABAJO Nº ' . $order['order_number'], 1, 1, 'C', true);
$pdf->Ln(5);

// ✅ INFORMACIÓN DEL CLIENTE - ESTRUCTURA RESTAURADA
addSection($pdf, 'INFORMACIÓN DEL CLIENTE');

$client_html = '<table border="0" cellpadding="3" cellspacing="0" style="width:100%; font-size:12pt;">
<tr>
  <td style="width:50%; vertical-align:top;">
    <span style="font-weight:bold; color:#1162a6; font-size:12pt;">Cliente: </span>
    <span style="font-size:12pt;">' . htmlspecialchars($order['client_name'] ?: '-', ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8') . '</span>
  </td>
  <td style="width:50%; vertical-align:top;">
    <span style="font-weight:bold; color:#1162a6; font-size:12pt;">Persona de contacto: </span>
    <span style="font-size:12pt;">' . htmlspecialchars($order['client_contact_person'] ?: '-', ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8') . '</span>
  </td>
</tr>
<tr>
  <td style="width:50%; vertical-align:top;">
    <span style="font-weight:bold; color:#1162a6; font-size:12pt;">CIF: </span>
    <span style="font-size:12pt;">' . htmlspecialchars($order['client_cif'] ?: '-', ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8') . '</span>
  </td>
  <td style="width:50%; vertical-align:top;">
    <span style="font-weight:bold; color:#1162a6; font-size:12pt;">Teléfono de contacto: </span>
    <span style="font-size:12pt;">' . htmlspecialchars($order['client_phone'] ?: '-', ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8') . '</span>
  </td>
</tr>
</table>';

// ✅ CLAVE: true restaura la estructura de tabla con saltos de línea
$pdf->writeHTML($client_html, true, false, true, false, '');
$pdf->Ln(3); // ✅ Respiro moderado

// Detalles del Vehículo
addSection($pdf, 'DETALLES DEL VEHÍCULO/UNIDAD');

$vehicle_html = '<table border="0" cellpadding="3" cellspacing="0" style="width:100%; font-size:12pt;">
<tr>
  <td style="width:50%; vertical-align:top;">';

if (!empty($order['unit_type_name'])) {
    $vehicle_html .= '<span style="font-weight:bold; color:#1162a6; font-size:12pt;">Tipo: </span>
                      <span style="font-size:12pt;">' . htmlspecialchars($order['unit_type_name']) . '</span><br>';
}
if (!empty($order['license_plate'])) {
    $vehicle_html .= '<span style="font-weight:bold; color:#1162a6; font-size:12pt;">Matrícula: </span>
                      <span style="font-size:12pt;">' . htmlspecialchars($order['license_plate']) . '</span><br>';
}
$vehicle_html .= '<span style="font-weight:bold; color:#1162a6; font-size:12pt;">F. Entrada: </span>
                  <span style="font-size:12pt;">' . $format_date($order['entry_date']) . '</span>';

$vehicle_html .= '</td>
  <td style="width:50%; vertical-align:top;">';

if (!empty($order['brand'])) {
    $vehicle_html .= '<span style="font-weight:bold; color:#1162a6; font-size:12pt;">Marca: </span>
                      <span style="font-size:12pt;">' . htmlspecialchars($order['brand']) . '</span><br>';
}
if (!empty($order['model'])) {
    $vehicle_html .= '<span style="font-weight:bold; color:#1162a6; font-size:12pt;">Modelo: </span>
                      <span style="font-size:12pt;">' . htmlspecialchars($order['model']) . '</span><br>';
}
$status_text = $status_translations[$order['status']] ?? ucfirst($order['status']);
$vehicle_html .= '<span style="font-weight:bold; color:#1162a6; font-size:12pt;">Estado: </span>
                  <span style="font-size:12pt;">' . htmlspecialchars($status_text) . '</span>';

if (!empty($order['priority'])) {
    $priority_text = $priority_translations[$order['priority']] ?? ucfirst($order['priority']);
    $vehicle_html .= '<br><span style="font-weight:bold; color:#1162a6; font-size:12pt;">Prioridad: </span>
                      <span style="font-size:12pt;">' . htmlspecialchars($priority_text) . '</span>';
}

$vehicle_html .= '</td></tr></table>';

$pdf->writeHTML($vehicle_html, true, false, true, false, '');
$pdf->Ln(2); // ✅ Separación equilibrada

// Departamentos
addSection($pdf, 'DEPARTAMENTOS');

$dept_y = $pdf->GetY();
$pdf->SetFillColor(248, 249, 250);
$pdf->Rect(12, $dept_y, 186, 12, 'DF');

$pdf->SetY($dept_y + 2);
$pdf->SetFont('dejavusans', 'B', 13);

$departments_list = ['Hidráulica', 'Electricidad', 'Taller'];
$dept_text = '';

foreach ($departments_list as $dept) {
    $is_assigned = in_array($dept, $assigned_names);
    $check = $is_assigned ? '■' : '□';
    $dept_text .= $check . ' ' . $dept . '     ';
}

$pdf->SetTextColor(17, 98, 166);
$pdf->Cell(0, 8, trim($dept_text), 0, 1, 'C');
$pdf->SetTextColor(51, 51, 51);
$pdf->Ln(4); // ✅ Respiro adecuado

// ✅ TRABAJOS A REALIZAR - PROCESAMIENTO ROBUSTO DE TAREAS
addSection($pdf, 'TRABAJOS A REALIZAR');

$tasks_box_start_y = $pdf->GetY();
$pdf->SetFont('dejavusans', '', $layout['font_size']);

$tasks_displayed = 0;
$content_start_y = $pdf->GetY();
$content_end_y = $content_start_y;

if (!empty($individual_tasks)) {
    foreach ($individual_tasks as $task_text) {
        if ($tasks_displayed >= $layout['max_tasks']) {
            $remaining = count($individual_tasks) - $tasks_displayed;
            $pdf->SetFont('dejavusans', 'I', 9);
            $pdf->SetTextColor(102, 102, 102);
            $pdf->Cell(0, 5, "... y {$remaining} tareas adicionales (ver detalle completo en intranet)", 0, 1, 'C');
            $content_end_y = $pdf->GetY();
            break;
        }
        
        $current_y = $pdf->GetY();
        
        // ✅ VIÑETA INTEGRADA PERFECTAMENTE ALINEADA
        $pdf->SetTextColor(51, 51, 51);
        $task_text_with_bullet = '•  ' . trim($task_text);
        
        $pdf->SetX(15);
        $pdf->MultiCell(
            171,        // ancho del texto
            5.5,        // alto de línea
            $task_text_with_bullet,
            0,
            'L',
            false,
            1,
            '',         // x: usa SetX(15)
            $current_y, // y: posición actual
            true,
            0,
            false,
            true,
            0,
            'T'
        );
        
        $content_end_y = $pdf->GetY();
        $pdf->Ln(1); // ✅ Espaciado moderado entre tareas
        $content_end_y = $pdf->GetY();
        
        $tasks_displayed++;
    }
} else {
    $pdf->SetFont('dejavusans', 'I', $layout['font_size']);
    $pdf->SetTextColor(102, 102, 102);
    $pdf->Cell(0, 6, 'No se han especificado tareas específicas', 0, 1, 'C');
    $content_end_y = $pdf->GetY();
}

// ✅ FONDO SUTIL QUE NO TAPA CONTENIDO
$min_tasks_height = 30;
$actual_content_height = max($min_tasks_height, $content_end_y - $content_start_y + 6);

$pdf->SetAlpha(0.08);
$pdf->SetFillColor(248, 249, 250);
$pdf->Rect(12, $tasks_box_start_y, 186, $actual_content_height, 'F');
$pdf->SetAlpha(1);

$pdf->SetDrawColor(200, 200, 200);
$pdf->Rect(12, $tasks_box_start_y, 186, $actual_content_height, 'D');

$pdf->SetY($tasks_box_start_y + $actual_content_height + 5);

// ✅ OBSERVACIONES - CON LIMPIEZA AUTOMÁTICA DEFINITIVA
addSection($pdf, 'OBSERVACIONES');
$obs_start_y = $pdf->GetY();

$page_height = 297;
$footer_space = 18;
$margin_bottom = 6;
$safety_margin = 3;

$available_height = $page_height - $obs_start_y - $footer_space - $margin_bottom - $safety_margin;

$pdf->SetFillColor(250, 250, 250);
$pdf->Rect(12, $obs_start_y, 186, $available_height, 'D');

$pdf->SetY($obs_start_y + 3);
$pdf->SetX(15);
$pdf->SetFont('dejavusans', '', min($layout['font_size'], 12));
$pdf->SetTextColor(51, 51, 51);

$content_to_show = '';
$label = '';

// ✅ APLICAR LIMPIEZA ANTES DE EVALUAR - SOLUCIÓN DEFINITIVA
$clean_notes = cleanPDFObservations($order['notes'] ?? '');
$clean_description = cleanPDFObservations($order['description'] ?? '');

if (!empty($clean_notes) && !isGenericPlaceholder($clean_notes)) {
    $content_to_show = $clean_notes;
    $label = 'Notas: ';
} elseif (!empty($clean_description) && !isGenericPlaceholder($clean_description)) {
    $content_to_show = $clean_description;
    $label = 'Descripción: ';
}

if ($content_to_show) {
    $pdf->SetFont('dejavusans', 'B', $layout['font_size']);
    $pdf->Cell(0, 5, $label, 0, 1);
    $pdf->SetX(15);
    $pdf->SetFont('dejavusans', '', $layout['font_size']);
    $pdf->MultiCell(171, 5, $content_to_show, 0, 'L');
}

// === PÁGINA 2: SEGUIMIENTO Y MATERIALES ===
$pdf->AddPage();

// Título página 2
$pdf->SetY(15);
$pdf->SetFont('dejavusans', 'B', 18);
$pdf->SetFillColor(248, 249, 250);
$pdf->SetTextColor(17, 98, 166);
$pdf->Cell(0, 12, 'ORDEN DE TRABAJO Nº ' . $order['order_number'], 1, 1, 'C', true);
$pdf->Ln(5);

// Registro de Actividades
addSection($pdf, 'REGISTRO DE ACTIVIDADES DIARIAS');

$pdf->SetFont('dejavusans', 'B', 10);
$pdf->SetFillColor(17, 98, 166);
$pdf->SetTextColor(255, 255, 255);

$col_width = 88;
$col_gap = 10;
$left_col_x = 12;
$right_col_x = $left_col_x + $col_width + $col_gap;
$header_height = 8;
$row_height = 15;

$header_y = $pdf->GetY();
$pdf->SetXY($left_col_x, $header_y);
$pdf->Cell(24, $header_height, 'Fecha', 1, 0, 'C', true);
$pdf->Cell(20, $header_height, 'Horas', 1, 0, 'C', true);
$pdf->Cell(44, $header_height, 'Operario(s)', 1, 0, 'C', true);

$pdf->SetXY($right_col_x, $header_y);
$pdf->Cell(24, $header_height, 'Fecha', 1, 0, 'C', true);
$pdf->Cell(20, $header_height, 'Horas', 1, 0, 'C', true);
$pdf->Cell(44, $header_height, 'Operario(s)', 1, 1, 'C', true);

$pdf->SetFont('dejavusans', '', 9);
$pdf->SetTextColor(51, 51, 51);
$pdf->SetFillColor(255, 255, 255);

for ($i = 1; $i <= 5; $i++) {
    $current_y = $pdf->GetY();
    
    $pdf->SetXY($left_col_x, $current_y);
    $pdf->Cell(24, $row_height, '', 1, 0, 'C', true);
    $pdf->Cell(20, $row_height, '', 1, 0, 'C', true);
    $pdf->Cell(44, $row_height, '', 1, 0, 'L', true);
    
    $pdf->SetXY($right_col_x, $current_y);
    $pdf->Cell(24, $row_height, '', 1, 0, 'C', true);
    $pdf->Cell(20, $row_height, '', 1, 0, 'C', true);
    $pdf->Cell(44, $row_height, '', 1, 1, 'L', true);
}
$pdf->Ln(5);

// MATERIALES
addSection($pdf, 'MATERIAL Y REPUESTOS UTILIZADOS');
$materials_start_y = $pdf->GetY();

$available_height_p2 = $page_height - $materials_start_y - $footer_space - $margin_bottom - $safety_margin;

$pdf->SetFillColor(250, 250, 250);
$pdf->Rect(12, $materials_start_y, 186, $available_height_p2, 'D');

// Generar PDF
$filename = 'OT_' . $order['order_number'] . '_' . date('Ymd') . '.pdf';
$pdf->Output($filename, 'I');
?>
