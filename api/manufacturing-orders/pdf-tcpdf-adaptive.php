<?php
// /api/manufacturing-orders/pdf-tcpdf-adaptive.php - DISEÑO EQUILIBRADO PERFECTO V4
require_once __DIR__ . '/../../config.php';
require_once __DIR__ . '/../cors.php';
require_once __DIR__ . '/../auth_check.php';

$order_id = filter_input(INPUT_GET, 'id', FILTER_VALIDATE_INT);

if (!$order_id || $order_id <= 0) {
    http_response_code(400);
    die('ID de orden requerido y válido');
}

try {
    // =========================================================================
    // OBTENER DATOS DE LA ORDEN
    // =========================================================================
    $stmt = $pdo->prepare("
        SELECT 
            mo.*,
            creator.nombre as created_by_name,
            assignee.nombre as assigned_to_name
        FROM manufacturing_orders mo
        LEFT JOIN usuarios creator ON mo.created_by = creator.id
        LEFT JOIN usuarios assignee ON mo.assigned_to = assignee.id
        WHERE mo.id = ?
    ");
    
    $stmt->execute([$order_id]);
    $order = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$order) {
        http_response_code(404);
        die('Orden de fabricación no encontrada');
    }

    // =========================================================================
    // CONFIGURACIÓN TCPDF OPTIMIZADA
    // =========================================================================
    require_once(__DIR__ . '/../../vendor/autoload.php');

    $pdf = new TCPDF('P', 'mm', 'A4', true, 'UTF-8', false);
    
    $pdf->SetCreator('VERSO - Volquetes Escalante S.L.');
    $pdf->SetAuthor('Volquetes Escalante S.L.');
    $pdf->SetTitle('Orden de Fabricación ' . $order['order_number']);

    $pdf->SetMargins(12, 12, 12);
    $pdf->SetHeaderMargin(0);
    $pdf->SetFooterMargin(8);
    $pdf->SetAutoPageBreak(FALSE);
    $pdf->setPrintHeader(false);
    $pdf->setPrintFooter(false);
    $pdf->AddPage();

    // =========================================================================
    // PALETA DE COLORES CORPORATIVOS
    // =========================================================================
    $primaryBlue = [17, 98, 166];
    $accentBlue = [84, 135, 192];
    $darkGray = [55, 65, 81];
    $mediumGray = [107, 114, 128];
    $lightGrayBg = [248, 249, 250];
    $borderGray = [229, 231, 235];
    $noteBg = [255, 251, 235];

    // =========================================================================
    // ✅ VARIABLES EQUILIBRADAS - RESPIRACIÓN VISUAL RESTAURADA
    // =========================================================================
    $LOGO_WIDTH = 54;              // Logo prominente mantenido
    $ROW_GAP = 5;                  // ✅ Espaciado cómodo entre filas (era 4mm)
    $MINIMAL_LABEL_GAP = 1;        // ✅ GAP MÍNIMO entre ":" y contenido
    $SECTION_TITLE_HEIGHT = 7;     // ✅ Títulos más visibles (era 5mm)
    $CLIENT_BLOCK_HEIGHT = 11;     // ✅ Cliente con más aire (era 8mm)  
    $INTERNAL_PADDING = 3;         // ✅ Padding equilibrado (era 2mm)
    $SECTION_SPACING = 7;          // ✅ CLAVE: Respiración entre secciones

    // =========================================================================
    // FUNCIONES HELPER EQUILIBRADAS
    // =========================================================================
    function drawSectionBackground($pdf, $x, $y, $width, $height, $bgColor, $borderColor) {
        $pdf->SetFillColor($bgColor[0], $bgColor[1], $bgColor[2]);
        $pdf->SetDrawColor($borderColor[0], $borderColor[1], $borderColor[2]);
        $pdf->SetLineWidth(0.3);
        $pdf->Rect($x, $y, $width, $height, 'DF');
    }

    function addSectionTitleBalanced($pdf, $x, $y, $width, $title, $textColor, $titleHeight, $lightGrayBg, $borderGray, $internalPadding) {
        drawSectionBackground($pdf, $x, $y, $width, $titleHeight, $lightGrayBg, $borderGray);
        
        $pdf->SetFont('helvetica', 'B', 10);  // ✅ Font legible y profesional
        $pdf->SetTextColor($textColor[0], $textColor[1], $textColor[2]);
        $pdf->SetXY($x + $internalPadding, $y + 2);
        $pdf->Cell($width - (2 * $internalPadding), 4, strtoupper($title), 0, 0, 'L');
        return $y + $titleHeight + 2;        // ✅ Espacio tras título
    }

    // ✅ FUNCIÓN CLAVE: Elimina completamente el espacio muerto
    function addFieldRowPerfect($pdf, $x, $y, $label, $value, $totalWidth, $mediumGray, $darkGray, $rowGap, $minimalGap) {
        if ($value === '' || $value === null || trim($value) === '') {
            return $y;
        }
        
        // Configurar font para medir
        $pdf->SetFont('helvetica', 'B', 8);
        $pdf->SetTextColor($mediumGray[0], $mediumGray[1], $mediumGray[2]);
        
        // ✅ CÁLCULO DINÁMICO: Ancho real de la etiqueta (incluyendo ":")
        $labelUpper = strtoupper($label);
        $actualLabelWidth = $pdf->GetStringWidth($labelUpper);
        
        // Dibujar etiqueta con su ancho exacto
        $pdf->SetXY($x, $y);
        $pdf->Cell($actualLabelWidth, 4, $labelUpper, 0, 0, 'L');
        
        // ✅ VALOR INMEDIATAMENTE DESPUÉS: Solo gap mínimo
        $pdf->SetFont('helvetica', '', 9);
        $pdf->SetTextColor($darkGray[0], $darkGray[1], $darkGray[2]);
        $valueX = $x + $actualLabelWidth + $minimalGap;
        $pdf->SetXY($valueX, $y);
        $pdf->Cell($totalWidth - $actualLabelWidth - $minimalGap, 4, $value, 0, 0, 'L');
        
        return $y + $rowGap;
    }

    function fitTextBalanced($pdf, $text, $x, $y, $width, $maxHeight, $darkGray) {
        $fontSize = 9;
        $minFontSize = 7;
        $lineHeight = 3.6;
        
        $safeMaxHeight = $maxHeight * 0.95;
        
        while ($fontSize >= $minFontSize) {
            $pdf->SetFont('helvetica', '', $fontSize);
            $pdf->SetTextColor($darkGray[0], $darkGray[1], $darkGray[2]);
            $textHeight = $pdf->getStringHeight($width, $text);
            
            if ($textHeight <= $safeMaxHeight) {
                $pdf->SetXY($x, $y);
                $pdf->MultiCell($width, $lineHeight, $text, 0, 'L', false, 1, '', '', true, 0, false, true, $maxHeight);
                return $pdf->GetY();
            }
            $fontSize -= 0.25;
        }
        
        // Truncado inteligente
        $pdf->SetFont('helvetica', '', $minFontSize);
        $words = explode(' ', $text);
        $truncatedText = '';
        
        foreach ($words as $word) {
            $testText = $truncatedText . ($truncatedText ? ' ' : '') . $word;
            if ($pdf->getStringHeight($width, $testText . '...') <= $safeMaxHeight) {
                $truncatedText = $testText;
            } else {
                $truncatedText .= '...';
                break;
            }
        }
        
        $pdf->SetXY($x, $y);
        $pdf->MultiCell($width, $lineHeight, $truncatedText, 0, 'L', false, 1, '', '', true, 0, false, true, $maxHeight);
        return $pdf->GetY();
    }

    // =========================================================================
    // VARIABLES DE LAYOUT
    // =========================================================================
    $margin = 12;
    $pageWidth = $pdf->getPageWidth();
    $pageHeight = $pdf->getPageHeight();
    $usableWidth = $pageWidth - (2 * $margin);
    $colWidth = ($usableWidth - 6) / 2;  // ✅ Gap equilibrado entre columnas
    $leftColX = $margin;
    $rightColX = $margin + $colWidth + 6;
    $currentY = $margin;

    // =========================================================================
    // ✅ HEADER EQUILIBRADO - LOGO + PRIORIDAD INLINE
    // =========================================================================
    $logoPath = $_SERVER['DOCUMENT_ROOT'] . '/assets/logo_orden_trabajo.png';
    if (file_exists($logoPath)) {
        $pdf->Image($logoPath, $margin, $currentY, $LOGO_WIDTH, 0, 'PNG');
    }

    // Título principal
    $titleX = $margin + $LOGO_WIDTH + 6;
    $pdf->SetTextColor($primaryBlue[0], $primaryBlue[1], $primaryBlue[2]);
    $pdf->SetFont('helvetica', 'B', 18);
    $pdf->SetXY($titleX, $currentY + 3);
    $pdf->Cell(0, 8, 'ORDEN DE FABRICACIÓN', 0, 1, 'L');

    // Número de orden
    $pdf->SetFont('helvetica', 'B', 14);
    $orderNumberY = $currentY + 14;
    $pdf->SetXY($titleX, $orderNumberY);
    $orderNumber = $order['order_number'];
    $orderNumberWidth = $pdf->GetStringWidth($orderNumber);
    $pdf->Cell($orderNumberWidth, 6, $orderNumber, 0, 0, 'L');

    // ✅ PRIORIDAD PERFECTAMENTE INLINE
    $priorityLabels = ['low' => 'BAJA', 'medium' => 'MEDIA', 'high' => 'ALTA'];
    $priorityText = 'PRIORIDAD: ' . ($priorityLabels[$order['priority']] ?? 'MEDIA');

    $pdf->SetFont('helvetica', 'B', 8);
    $pdf->SetTextColor(255, 255, 255);
    $pdf->SetFillColor($accentBlue[0], $accentBlue[1], $accentBlue[2]);
    $badgeWidth = $pdf->GetStringWidth($priorityText) + 8;
    $badgeX = $titleX + $orderNumberWidth + 8;

    if ($badgeX + $badgeWidth > $pageWidth - $margin) {
        $badgeX = $pageWidth - $margin - $badgeWidth;
    }

    $pdf->RoundedRect($badgeX, $orderNumberY + 0.5, $badgeWidth, 5, 1.5, '1111', 'F');
    $pdf->SetXY($badgeX, $orderNumberY + 1.5);
    $pdf->Cell($badgeWidth, 3, $priorityText, 0, 0, 'C');

    // Línea separadora
    $pdf->SetDrawColor($borderGray[0], $borderGray[1], $borderGray[2]);
    $pdf->SetLineWidth(0.5);
    $pdf->Line($margin, $currentY + 27, $pageWidth - $margin, $currentY + 27);

    $currentY += 32;  // ✅ MÁS RESPIRACIÓN tras header

    // =========================================================================
    // ✅ INFORMACIÓN DEL CLIENTE CON AIRE
    // =========================================================================
    $currentY = addSectionTitleBalanced($pdf, $margin, $currentY, $usableWidth, 'Información del Cliente', $primaryBlue, $SECTION_TITLE_HEIGHT, $lightGrayBg, $borderGray, $INTERNAL_PADDING);

    drawSectionBackground($pdf, $margin, $currentY, $usableWidth, $CLIENT_BLOCK_HEIGHT, [255, 255, 255], $borderGray);
    $pdf->SetFont('helvetica', 'B', 12);
    $pdf->SetTextColor($darkGray[0], $darkGray[1], $darkGray[2]);
    $pdf->SetXY($margin + $INTERNAL_PADDING + 1, $currentY + 3.5);
    $pdf->Cell($usableWidth - (2 * $INTERNAL_PADDING) - 2, 4, $order['client_name'] ?: 'Cliente no especificado', 0, 0, 'L');

    $currentY += $CLIENT_BLOCK_HEIGHT + $SECTION_SPACING;  // ✅ RESPIRACIÓN ENTRE SECCIONES

    // =========================================================================
    // ✅ COLUMNAS CON GAP MÍNIMO PERFECTO
    // =========================================================================
    
    // Presupuesto con prefijo PRE- (soluciona Chrome autocomplete)
    $budget_formatted = $order['budget_number'] ? 'PRE-' . $order['budget_number'] : '';

    // Helper para formatear fechas evitando 0000-00-00
    $formatDate = function($dateStr) {
        return ($dateStr && $dateStr !== '0000-00-00') ? date('d/m/Y', strtotime($dateStr)) : '';
    };

    $fieldsLeft = [
        ['Presupuesto:', $budget_formatted],
        ['Fecha Pedido:', $formatDate($order['order_date'])],
        ['Recepción:', $formatDate($order['vehicle_reception_date'])],
        ['Fin Previsto:', $formatDate($order['expected_completion_date'])]
    ];
    
    $fieldsRight = [
        ['Carrozado:', $order['bodywork_type'] ?? ''],
        ['Marca:', $order['brand'] ?? ''],
        ['Modelo:', $order['model'] ?? ''],
        ['Bastidor:', $order['chassis_number'] ?? '']
    ];
    
    $countNonEmpty = function($fields) {
        return count(array_filter($fields, function($f) { 
            return $f[1] !== '' && $f[1] !== null && trim($f[1]) !== ''; 
        }));
    };

    $leftFieldCount = $countNonEmpty($fieldsLeft);
    $rightFieldCount = $countNonEmpty($fieldsRight);
    
    // ✅ Alturas dinámicas equilibradas
    $leftHeight = max(18, ($leftFieldCount * $ROW_GAP) + 6);
    $rightHeight = max(18, ($rightFieldCount * $ROW_GAP) + 6);

    // Columna Izquierda
    $leftY = addSectionTitleBalanced($pdf, $leftColX, $currentY, $colWidth, 'Info. Pedido', $primaryBlue, $SECTION_TITLE_HEIGHT, $lightGrayBg, $borderGray, $INTERNAL_PADDING);
    drawSectionBackground($pdf, $leftColX, $leftY, $colWidth, $leftHeight, [255, 255, 255], $borderGray);
    
    $tempY = $leftY + $INTERNAL_PADDING;
    foreach ($fieldsLeft as $field) {
        $tempY = addFieldRowPerfect($pdf, $leftColX + $INTERNAL_PADDING, $tempY, $field[0], $field[1], $colWidth - (2 * $INTERNAL_PADDING), $mediumGray, $darkGray, $ROW_GAP, $MINIMAL_LABEL_GAP);
    }

    // Columna Derecha
    $rightY = addSectionTitleBalanced($pdf, $rightColX, $currentY, $colWidth, 'Info. del Vehículo', $primaryBlue, $SECTION_TITLE_HEIGHT, $lightGrayBg, $borderGray, $INTERNAL_PADDING);
    drawSectionBackground($pdf, $rightColX, $rightY, $colWidth, $rightHeight, [255, 255, 255], $borderGray);
    
    $tempY = $rightY + $INTERNAL_PADDING;
    foreach ($fieldsRight as $field) {
        $tempY = addFieldRowPerfect($pdf, $rightColX + $INTERNAL_PADDING, $tempY, $field[0], $field[1], $colWidth - (2 * $INTERNAL_PADDING), $mediumGray, $darkGray, $ROW_GAP, $MINIMAL_LABEL_GAP);
    }

    $currentY = max($leftY + $leftHeight, $rightY + $rightHeight) + $SECTION_SPACING;  // ✅ RESPIRACIÓN

    // =========================================================================
    // ✅ DESCRIPCIÓN CON ESPACIO EQUILIBRADO
    // =========================================================================
    $currentY = addSectionTitleBalanced($pdf, $margin, $currentY, $usableWidth, 'Descripción del Trabajo', $primaryBlue, $SECTION_TITLE_HEIGHT, $lightGrayBg, $borderGray, $INTERNAL_PADDING);
    
    $description = $order['description'] ?: '';
    $observations = '';
    
    $separators = ['--- OBSERVACIONES ---', '---\nObservaciones:\n'];
    foreach ($separators as $separator) {
        if (strpos($description, $separator) !== false) {
            $parts = explode($separator, $description, 2);
            $description = trim($parts[0]);
            $observations = isset($parts[1]) ? trim($parts[1]) : '';
            break;
        }
    }

    $footerSpace = 15;
    $availableHeight = ($pageHeight - $margin - $footerSpace) - $currentY;
    
    if (trim($observations) !== '') {
        $descHeight = $availableHeight * 0.65;
        $obsHeight = $availableHeight * 0.35 - ($SECTION_TITLE_HEIGHT + 2);
        
        drawSectionBackground($pdf, $margin, $currentY, $usableWidth, $descHeight, [255, 255, 255], $borderGray);
        fitTextBalanced($pdf, $description, $margin + $INTERNAL_PADDING, $currentY + $INTERNAL_PADDING, $usableWidth - (2 * $INTERNAL_PADDING), $descHeight - (2 * $INTERNAL_PADDING), $darkGray);
        $currentY += $descHeight + 3;
        
        $currentY = addSectionTitleBalanced($pdf, $margin, $currentY, $usableWidth, 'Observaciones / Notas', $primaryBlue, $SECTION_TITLE_HEIGHT, $lightGrayBg, $borderGray, $INTERNAL_PADDING);
        drawSectionBackground($pdf, $margin, $currentY, $usableWidth, $obsHeight, $noteBg, $borderGray);
        fitTextBalanced($pdf, $observations, $margin + $INTERNAL_PADDING, $currentY + $INTERNAL_PADDING, $usableWidth - (2 * $INTERNAL_PADDING), $obsHeight - (2 * $INTERNAL_PADDING), $darkGray);
    } else {
        $descHeight = $availableHeight - 3;
        drawSectionBackground($pdf, $margin, $currentY, $usableWidth, $descHeight, [255, 255, 255], $borderGray);
        fitTextBalanced($pdf, $description, $margin + $INTERNAL_PADDING, $currentY + $INTERNAL_PADDING, $usableWidth - (2 * $INTERNAL_PADDING), $descHeight - (2 * $INTERNAL_PADDING), $darkGray);
    }

    // =========================================================================
    // FOOTER PROFESIONAL
    // =========================================================================
    $footerY = $pageHeight - 10;
    
    $pdf->SetDrawColor($borderGray[0], $borderGray[1], $borderGray[2]);
    $pdf->SetLineWidth(0.3);
    $pdf->Line($margin, $footerY - 3, $pageWidth - $margin, $footerY - 3);
    
    $pdf->SetFont('helvetica', '', 8);
    $pdf->SetTextColor($mediumGray[0], $mediumGray[1], $mediumGray[2]);
    $pdf->SetXY($margin, $footerY);
    $pdf->Cell($usableWidth / 2, 3, 'Volquetes Escalante S.L.', 0, 0, 'L');
    $pdf->Cell($usableWidth / 2, 3, 'Sistema VERSO', 0, 0, 'R');
    
    $pdf->SetXY($margin, $footerY + 4);
    $pdf->Cell(0, 3, 'Generado el ' . date('d/m/Y H:i:s'), 0, 0, 'C');

    // =========================================================================
    // SALIDA OPTIMIZADA
    // =========================================================================
    $filename = 'Orden_Fabricacion_' . $order['order_number'] . '.pdf';
    ob_clean();
    $pdf->Output($filename, 'I');

} catch (Exception $e) {
    error_log("Error PDF fabricación: " . $e->getMessage());
    http_response_code(500);
    die('Error al generar PDF: ' . $e->getMessage());
}
?>
