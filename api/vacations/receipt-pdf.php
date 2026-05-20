<?php
// ✅ VERSO v13.1.4 - SISTEMA DE RECIBOS PDF CON ARRASTRE DINÁMICO
// Corrección crítica: Coherencia total con calendario web mediante cálculo interanual

require_once __DIR__ . '/../../config.php';
require_once __DIR__ . '/../cors.php';
require_once __DIR__ . '/../auth_check.php';

// Validación
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    exit('Método no permitido');
}

$absenceId = isset($_GET['id']) ? intval($_GET['id']) : 0;
if ($absenceId <= 0) {
    http_response_code(400);
    exit('ID de ausencia inválido');
}

try {
    // 1. CONSULTA PRINCIPAL
    $sql = "SELECT 
                a.id, a.start_date, a.end_date, a.working_days_count, 
                a.notes, a.created_at, a.absence_type, a.year,
                e.id as emp_id, e.full_name, e.dni_nie, e.job_category, e.location, e.hire_date
            FROM employee_absences a
            JOIN employees e ON a.employee_id = e.id
            WHERE a.id = ? AND a.absence_type = 'vacation'";

    $stmt = $pdo->prepare($sql);
    $stmt->execute([$absenceId]);
    $absence = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$absence) {
        http_response_code(404);
        exit('Ausencia no encontrada');
    }

    // Leer saldo directamente de BD — fuente de verdad única
    $currentYear = intval($absence['year']);
    $sqlBalance = "SELECT
                       annual_days,
                       carried_over_days,
                       manual_adjustments,
                       consumed_days
                   FROM vacation_balances
                   WHERE employee_id = ? AND year = ?";
    $stmtBal = $pdo->prepare($sqlBalance);
    $stmtBal->execute([$absence['emp_id'], $currentYear]);
    $balance = $stmtBal->fetch(PDO::FETCH_ASSOC);

    if ($balance) {
        $annualDays   = intval($balance['annual_days']);
        $carriedOver  = floatval($balance['carried_over_days']);
        $manual       = floatval($balance['manual_adjustments']);
        $consumed     = floatval($balance['consumed_days']);

        if ($manual < 0) {
            $totalGenerado  = $annualDays + $carriedOver;
            $totalConsumido = $consumed + abs($manual);
        } else {
            $totalGenerado  = $annualDays + $carriedOver + $manual;
            $totalConsumido = $consumed;
        }
        $saldoRestante = $totalGenerado - $totalConsumido;
    } else {
        $totalGenerado  = 0;
        $totalConsumido = 0;
        $saldoRestante  = 0;
    }

    // ✅ CRÍTICO: Limpiar buffer
    while (ob_get_level()) {
        ob_end_clean();
    }

    require_once __DIR__ . '/../../vendor/autoload.php';

    // Helper fechas español
    function formatearFechaEspanol($fecha, $mesEnMayusculas = false) {
        $meses = [
            1 => 'enero', 2 => 'febrero', 3 => 'marzo', 4 => 'abril',
            5 => 'mayo', 6 => 'junio', 7 => 'julio', 8 => 'agosto', 
            9 => 'septiembre', 10 => 'octubre', 11 => 'noviembre', 12 => 'diciembre'
        ];
        
        $timestamp = strtotime($fecha);
        $dia = date('d', $timestamp);
        $mes = $meses[intval(date('n', $timestamp))];
        $ano = date('Y', $timestamp);
        
        if ($mesEnMayusculas) {
            $mes = strtoupper($mes);
        }
        
        return "$dia de $mes de $ano";
    }

    // Clase TCPDF con header/footer aprobados
    class VacationReceiptPDF extends TCPDF {
        public function Header() {
            // Logo anclado al margen izquierdo
            $logo_path = __DIR__ . '/../../assets/logo_orden_trabajo.png';
            if (file_exists($logo_path)) {
                try {
                    $this->Image($logo_path, 15, 8, 40, '', 'PNG');
                } catch (Exception $e) {
                    $this->SetFont('helvetica', 'B', 14);
                    $this->SetTextColor(17, 98, 166);
                    $this->SetXY(15, 12);
                    $this->Cell(0, 8, 'VOLQUETES ESCALANTE S.L.', 0, 1, 'L');
                }
            }

            // Texto alineado al margen derecho
            $this->SetY(10);
            $this->SetFont('helvetica', 'B', 12);
            $this->SetTextColor(0, 0, 0);
            $this->Cell(0, 6, 'VOLQUETES ESCALANTE S.L.', 0, 1, 'R');
            
            $this->SetFont('helvetica', '', 10);
            $this->Cell(0, 5, 'Polígono Industrial El Brizo', 0, 1, 'R');
            $this->Cell(0, 5, 'C/ Álamo - Parcela 123', 0, 1, 'R');
            $this->Cell(0, 5, '47162 ALDEAMAYOR DE SAN MARTÍN (VALLADOLID)', 0, 1, 'R');
            $this->Cell(0, 5, 'C.I.F.: B-47577929', 0, 1, 'R');
        }

        public function Footer() {
            $this->SetY(-25);
            $this->SetFont('helvetica', '', 8);
            $this->SetTextColor(100, 100, 100);
            
            $footerText = "Volquetes Escalante S.L.\n";
            $footerText .= "Polígono Industrial El Brizo, C/ Álamo - parcela 123\n";
            $footerText .= "47162 ALDEAMAYOR DE SAN MARTÍN, (VALLADOLID)\n";
            $footerText .= "C.I.F.: B-47577929\n";
            $footerText .= "Nº de Registro Industrial 47/43756";
            
            $this->MultiCell(0, 3, $footerText, 0, 'C', false, 1);
        }
    }

    // Crear PDF
    $pdf = new VacationReceiptPDF('P', 'mm', 'A4', true, 'UTF-8', false);
    $pdf->SetCreator('VERSO Intranet v13.1.4');
    $pdf->SetAuthor('Volquetes Escalante S.L.');
    $pdf->SetTitle('Recibo Vacaciones - ' . $absence['full_name']);
    $pdf->SetSubject('Solicitud de Vacaciones');
    $pdf->SetMargins(20, 50, 20);
    $pdf->SetAutoPageBreak(true, 30);
    $pdf->AddPage();

    // === TÍTULO PRINCIPAL ===
    $pdf->SetY(55);
    $pdf->SetFont('helvetica', 'B', 16);
    $pdf->SetTextColor(0, 0, 0);
    $pdf->Cell(0, 10, 'RECIBO DE VACACIONES', 0, 1, 'C');
    $pdf->Ln(10);

    // === FECHA Y LUGAR ===
    $pdf->SetFont('helvetica', '', 11);
    $fechaEmision = formatearFechaEspanol(date('Y-m-d'), true);
    $pdf->Cell(0, 8, "En Aldeamayor de San Martín a $fechaEmision.", 0, 1, 'L');
    $pdf->Ln(8);

    // === PÁRRAFO PRINCIPAL ===
    $pdf->SetFont('helvetica', '', 11);
    $pdf->SetTextColor(0, 0, 0);

    $nombreEmpleado = strtoupper($absence['full_name']);
    $fechaInicio = date('d/m/Y', strtotime($absence['start_date']));
    $fechaFin = date('d/m/Y', strtotime($absence['end_date']));

    $textoHibrido = "D. <b>$nombreEmpleado</b>, trabajador de esta empresa, manifiesto que de común acuerdo con la empresa, " .
                    "inicio en fecha <b>$fechaInicio</b> hasta <b>$fechaFin</b>, ambos incluidos, " .
                    "el disfrute de vacaciones.";

    $pdf->writeHTML($textoHibrido, true, false, true, false, 'J');
    $pdf->Ln(12);

    // === TOTAL DÍAS (Sin decimales, con cero delante) ===
    $diasEnteros = intval(round($absence['working_days_count']));
    $diasFormateados = str_pad($diasEnteros, 2, '0', STR_PAD_LEFT);
    
    $pdf->SetFont('helvetica', 'B', 12);
    $pdf->Cell(0, 8, "Total días vacaciones a disfrutar: $diasFormateados DÍAS LABORALES", 0, 1, 'L');
    $pdf->Ln(8);

    // === INFORMACIÓN DE SALDO CORREGIDA (v13.1.4 - Arrastre Dinámico) ===
    if ($totalGenerado > 0) {
        $pdf->SetFont('helvetica', '', 10);
        $pdf->SetTextColor(120, 120, 120); // Gris discreto
        $anio = intval($absence['year']);
        $tg = intval($totalGenerado);
        $tc = intval($totalConsumido);
        $sr = intval($saldoRestante);
        
        $textoSaldo = "Estado vacaciones $anio: Total $tg • Consumido $tc • Disponible $sr";
        $pdf->Cell(0, 6, $textoSaldo, 0, 1, 'L');
        $pdf->SetTextColor(0, 0, 0); // Reset a negro
    }

    $pdf->Ln(25);

    // === FIRMAS (Sin líneas, espacios amplios) ===
    $yFirmas = $pdf->GetY();
    
    $pdf->SetFont('helvetica', 'B', 11);
    $pdf->SetXY(35, $yFirmas);
    $pdf->Cell(60, 6, 'Fdo. (Trabajador)', 0, 0, 'C');
    $pdf->SetXY(125, $yFirmas);
    $pdf->Cell(60, 6, 'Fdo. La Empresa.', 0, 1, 'C');
    
    $pdf->Ln(25);
    
    $yNombres = $pdf->GetY();
    $pdf->SetFont('helvetica', '', 9);
    $pdf->SetXY(25, $yNombres);
    $pdf->Cell(60, 5, $nombreEmpleado, 0, 0, 'C');
    $pdf->SetXY(115, $yNombres);
    $pdf->Cell(60, 5, 'VOLQUETES ESCALANTE S.L.', 0, 1, 'C');
    $pdf->SetXY(115, $yNombres + 5);
    $pdf->Cell(60, 5, 'DIRECCIÓN', 0, 1, 'C');

    // ✅ NOMENCLATURA EXACTA
    $fechaInicio = date('d-m-Y', strtotime($absence['start_date']));
    $fechaFin = date('d-m-Y', strtotime($absence['end_date']));
    $nombreArchivo = "{$fechaInicio} - {$fechaFin}.pdf";

    $pdf->Output($nombreArchivo, 'I');

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'error' => 'Error generando recibo: ' . $e->getMessage(),
        'debug' => [
            'file' => basename(__FILE__),
            'line' => $e->getLine()
        ]
    ]);
}
?>
