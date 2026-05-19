<?php
// NO incluir auth_check.php para evitar problemas de sesión
session_start();

// --- CORS DINÁMICO MEJORADO (basado en patrón list.php probado) ---
$requestOrigin = $_SERVER['HTTP_ORIGIN'] ?? '';
$allowedOrigins = [
    'https://intranet.volquetesescalante.com'
];

// Verificar si es origen permitido estático o StackBlitz dinámico
$isOriginAllowed = false;
if (in_array($requestOrigin, $allowedOrigins)) {
    $isOriginAllowed = true;
} elseif (preg_match('/^https:\/\/.*\.webcontainer\.io$/', $requestOrigin)) {
    // Patrón dinámico para StackBlitz
    $isOriginAllowed = true;
}

// Configurar headers CORS (patrón list.php mejorado)
if ($isOriginAllowed && $requestOrigin) {
    header("Access-Control-Allow-Origin: " . $requestOrigin);
} else {
    // Fallback para producción
    header("Access-Control-Allow-Origin: https://intranet.volquetesescalante.com");
}

header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit(0);
}

// Verificar autenticación manualmente (igual que list.php)
if (!isset($_SESSION['user']['id'])) {
    http_response_code(401);
    header('Content-Type: application/json');
    echo json_encode(['error' => 'No autorizado']);
    exit;
}

// Configuración de BD directa (igual que list.php)
$DB_HOST = 'localhost';
$DB_USER = 'verso';
$DB_PASS = 'verso_dev_2026';
$DB_NAME = 'verso_dev';

// Solo POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    header('Content-Type: application/json');
    echo json_encode(['error' => 'Método no permitido']);
    exit;
}

try {
    // Procesar datos POST JSON
    $input = json_decode(file_get_contents('php://input'), true);
    $employee_id = intval($input['employee_id'] ?? 0);
    $document_type = $input['document_type'] ?? '');

    if ($employee_id <= 0 || empty($document_type)) {
        throw new Exception('Parámetros inválidos: ID empleado y tipo documento requeridos');
    }

    $allowed_types = ['epis', 'rgpd', 'videovigilancia', 'prl'];
    if (!in_array($document_type, $allowed_types)) {
        throw new Exception('Tipo de documento no válido: ' . $document_type);
    }

    // Cargar TCPDF (mismo patrón que tus PDFs de órdenes)
    require_once(__DIR__ . '/../../vendor/tecnickcom/tcpdf/tcpdf.php');

    // Conectar DB (MySQLi como list.php)
    $conn = new mysqli($DB_HOST, $DB_USER, $DB_PASS, $DB_NAME);
    if ($conn->connect_error) {
        throw new Exception("Error de conexión");
    }
    
    $conn->set_charset("utf8mb4");

    // Obtener datos del empleado
    $stmt = $conn->prepare("SELECT full_name, dni_nie, hire_date FROM employees WHERE id = ? AND status = 'active'");
    $stmt->bind_param("i", $employee_id);
    $stmt->execute();
    $employee = $stmt->get_result()->fetch_assoc();
    $stmt->close();
    $conn->close();

    if (!$employee) {
        throw new Exception('Empleado no encontrado o inactivo');
    }

    // Validaciones críticas
    if (empty($employee['full_name'])) {
        throw new Exception('Empleado sin nombre completo registrado');
    }
    if (empty($employee['dni_nie'])) {
        throw new Exception('Empleado sin DNI/NIE registrado');
    }
    if (empty($employee['hire_date'])) {
        throw new Exception('Empleado sin fecha de alta. Complete este dato antes de generar documentos');
    }

    // Preparar datos para el PDF
    $full_name = strtoupper($employee['full_name']);
    $dni_nie = $employee['dni_nie'];
    $date_obj = new DateTime($employee['hire_date']);
    $hire_date_formatted = $date_obj->format('d/m/Y');

    // Crear PDF con TCPDF (mismo patrón que tus órdenes)
    $pdf = new TCPDF(PDF_PAGE_ORIENTATION, PDF_UNIT, PDF_PAGE_FORMAT, true, 'UTF-8', false);

    // Configuración del documento (basada en tus PDFs de órdenes)
    $pdf->SetCreator(PDF_CREATOR);
    $pdf->SetAuthor('Volquetes Escalante S.L.');
    $pdf->SetTitle(getDocumentTitle($document_type) . ' - ' . $employee['full_name']);
    $pdf->SetSubject('Documento de empleado');

    // Configuración de página (patrón de tus PDFs optimizados)
    $pdf->SetDefaultMonospacedFont(PDF_FONT_MONOSPACED);
    $pdf->SetMargins(PDF_MARGIN_LEFT, PDF_MARGIN_TOP, PDF_MARGIN_RIGHT);
    $pdf->SetHeaderMargin(PDF_MARGIN_HEADER);
    $pdf->SetFooterMargin(PDF_MARGIN_FOOTER);
    $pdf->SetAutoPageBreak(TRUE, PDF_MARGIN_BOTTOM);
    $pdf->setImageScale(PDF_IMAGE_SCALE_RATIO);

    // Añadir página
    $pdf->AddPage();

    // Logo corporativo (mismo que tus órdenes - ruta ajustada para /api/employees/)
    $logo_path = __DIR__ . '/../../assets/logo_orden_trabajo.png';
    if (file_exists($logo_path)) {
        $pdf->Image($logo_path, 15, 15, 54, '', 'PNG', '', 'T', false, 300, '', false, false, 0, false, false, false);
    }

    // Título del documento
    $pdf->SetFont('helvetica', 'B', 16);
    $pdf->SetXY(80, 20);
    $pdf->Cell(0, 10, getDocumentTitle($document_type), 0, 1, 'L');

    // Información del empleado (diseño similar a tus órdenes)
    $y_position = 45;

    // Nombre del empleado
    $pdf->SetXY(15, $y_position);
    $pdf->SetFont('helvetica', 'B', 12);
    $pdf->Cell(60, 8, 'NOMBRE DEL TRABAJADOR/A:', 0, 0, 'L');
    $pdf->SetFont('helvetica', '', 12);
    $pdf->Cell(0, 8, $full_name, 0, 1, 'L');
    $y_position += 12;

    // DNI/NIE
    $pdf->SetXY(15, $y_position);
    $pdf->SetFont('helvetica', 'B', 11);
    $pdf->Cell(30, 8, 'D.N.I. / N.I.E.:', 0, 0, 'L');
    $pdf->SetFont('helvetica', '', 11);
    $pdf->Cell(0, 8, $dni_nie, 0, 1, 'L');
    $y_position += 12;

    // Fecha (usando fecha de alta del empleado)
    $pdf->SetXY(15, $y_position);
    $pdf->SetFont('helvetica', 'B', 11);
    $pdf->Cell(20, 8, 'FECHA:', 0, 0, 'L');
    $pdf->SetFont('helvetica', '', 11);
    $pdf->Cell(0, 8, $hire_date_formatted, 0, 1, 'L');
    $y_position += 15;

    // Contenido específico por tipo de documento
    $pdf->SetXY(15, $y_position);
    $pdf->SetFont('helvetica', '', 10);
    
    $content = getDocumentContent($document_type);
    $pdf->writeHTML($content, true, false, true, false, '');

    // Información corporativa al final (mismo patrón que tus órdenes)
    $pdf->SetY(-35);
    $pdf->SetFont('helvetica', '', 8);
    $pdf->Cell(0, 4, 'Volquetes Escalante S.L.', 0, 1, 'C');
    $pdf->Cell(0, 4, 'Polígono Industrial El Brizo, C/ Álamo - parcela 123', 0, 1, 'C');
    $pdf->Cell(0, 4, '47162 ALDEAMAYOR DE SAN MARTIN, (VALLADOLID)', 0, 1, 'C');
    $pdf->Cell(0, 4, 'C.I.F.: B-47577929 - nº de Registro Industrial 47/43756', 0, 1, 'C');

    // Generar nombre de archivo
    $safe_name = strtoupper(str_replace([' ', '/', '\\', ':', '*', '?', '"', '<', '>', '|'], '_', $employee['full_name']));
    $filename_suffix = getDocumentSuffix($document_type);
    $output_filename = "{$safe_name}_{$filename_suffix}_" . date('Ymd_His') . ".pdf";

    // Limpiar buffers antes de enviar archivo (crítico para evitar corrupción)
    if (ob_get_level()) {
        ob_end_clean();
    }

    // Servir PDF para descarga
    $pdf->Output($output_filename, 'D');
    exit;

} catch (Exception $e) {
    error_log("Error generate-document-pdf.php: " . $e->getMessage());
    http_response_code(500);
    header('Content-Type: application/json');
    echo json_encode([
        'error' => $e->getMessage(),
        'debug_info' => [
            'employee_id' => $employee_id ?? 'No definido',
            'document_type' => $document_type ?? 'No definido',
            'timestamp' => date('Y-m-d H:i:s')
        ]
    ]);
}

// Funciones auxiliares para títulos y contenido
function getDocumentTitle($type) {
    switch($type) {
        case 'epis': return 'REGISTRO DE ENTREGA DE EQUIPOS DE PROTECCIÓN INDIVIDUAL';
        case 'rgpd': return 'INFORMACIÓN Y CONSENTIMIENTO - TRATAMIENTO DE DATOS PERSONALES';
        case 'videovigilancia': return 'INFORMACIÓN SOBRE INSTALACIÓN DE CÁMARAS DE VIGILANCIA';
        case 'prl': return 'REGISTRO DE ENTREGA DE INFORMACIÓN - PREVENCIÓN DE RIESGOS LABORALES';
        default: return 'DOCUMENTO DE EMPLEADO';
    }
}

function getDocumentSuffix($type) {
    switch($type) {
        case 'epis': return 'EPIs';
        case 'rgpd': return 'Consentimiento_RGPD';
        case 'videovigilancia': return 'Info_Videovigilancia';
        case 'prl': return 'Registro_Info_PRL';
        default: return 'Documento';
    }
}

function getDocumentContent($type) {
    switch($type) {
        case 'epis':
            return '
            <p><strong>VOLQUETES ESCALANTE, S.L.</strong> hace entrega al trabajador de los siguientes equipos de protección individual</p>
            <br>
            <table border="1" cellpadding="8" cellspacing="0" style="width: 100%; border-collapse: collapse;">
                <tr>
                    <td style="width: 50%; background-color: #f5f5f5;"><strong>EQUIPO: PANTALON</strong><br><strong>MARCA / MODELO:</strong> MARCA/488-P SUPTOP</td>
                    <td style="width: 50%; background-color: #f5f5f5;"><strong>EQUIPO: CAZADORA</strong><br><strong>MARCA / MODELO:</strong> MARCA/488-CSUPTOP</td>
                </tr>
                <tr>
                    <td><strong>EQUIPO: CALZADO DE SEGURIDAD</strong><br><strong>MARCA / MODELO:</strong> GARMARYGA / 2761 S1+ P</td>
                    <td><strong>EQUIPO: GUANTES DE TRABAJO</strong><br><strong>MARCA / MODELO:</strong></td>
                </tr>
                <tr>
                    <td style="background-color: #f5f5f5;"><strong>EQUIPO: GAFAS DE PROTECCION</strong><br><strong>MARCA / MODELO:</strong></td>
                    <td style="background-color: #f5f5f5;"><strong>EQUIPO: PANTALLA DE PROTECCION</strong><br><strong>MARCA / MODELO:</strong></td>
                </tr>
                <tr>
                    <td><strong>EQUIPO: PROTECCION AUDITIVA</strong><br><strong>MARCA / MODELO:</strong></td>
                    <td><strong>EQUIPO: PANTALLA DE PROTECCION</strong><br><strong>MARCA / MODELO:</strong></td>
                </tr>
            </table>
            <br>
            <p>También he recibido información sobre los trabajos y zonas en los que deberé utilizarlo, instrucciones para su uso, mantenimiento adecuado, sustitución, etc. incluidas en la "Ficha informativa de equipos de protección individual para los trabajadores". Así mismo, la empresa pone a mi disposición el folleto informativo de los EPIs.</p>
            <br>
            <p><strong>Acepto el compromiso de:</strong></p>
            <p>a) Utilizar este equipo durante la jornada laboral en las áreas cuya obligatoriedad de uso se encuentra señalizada, cuidando de su perfecto estado y conservación.</p>
            <p>b) Consultar cualquier duda sobre su correcta utilización.</p>
            <p>c) Informar de inmediato a mi mando directo de cualquier defecto, anomalía o daño del EPI que suponga una pérdida de eficacia, para que, en su caso, se proceda a solicitar un nuevo equipo.</p>
            <p>d) Devolver el EPI tras su utilización cuando y donde se me indique.</p>
            <br>
            <table border="1" cellpadding="5" cellspacing="0" style="width: 100%;">
                <tr>
                    <td><strong>Características personales que se han tenido en cuenta (talla, sexo, posibles alergias, etc.)</strong></td>
                    <td style="width: 40%;"></td>
                </tr>
            </table>
            <br>
            <ul>
                <li>Asegurarse de que el EPI es adecuado frente al riesgo contra el cual protege.</li>
                <li>Usar obligatoriamente el EPI para los trabajos en que así se haya establecido.</li>
                <li>Colocar y ajustar correctamente el EPI siguiendo las instrucciones recibidas.</li>
                <li>Tener en cuenta las limitaciones que presenta y utilizarlo únicamente cuando sea adecuado, siguiendo las instrucciones del fabricante recogidas en el manual de instrucciones o la documentación informativa facilitada por el fabricante.</li>
                <li>Llevarlo puesto mientras se esté expuesto al riesgo y en las zonas en que esté establecida la obligatoriedad de uso.</li>
                <li>Controlar su correcto estado. La eficacia del EPI depende en gran medida de su adecuado mantenimiento y limpieza o desinfección. Por ello, su cuidado deberá hacerse siguiendo las instrucciones del fabricante.</li>
                <li>Guardar el EPI en el lugar específico asignado.</li>
                <li>Informar de inmediato al responsable de cualquier defecto, anomalía o posible deterioro, que pueda entrañar una pérdida de la eficacia protectora.</li>
            </ul>
            <br>
            <p><strong>Firma del trabajador: ___________________________</strong></p>
            <br>
            <p><strong>MOTIVO DE LA ENTREGA</strong></p>
            <p>1ª ENTREGA &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; CAMBIO E.P.I. &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; DETERIORO &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; PÉRDIDA &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; OTROS</p>
            ';

        case 'rgpd':
            return '
            <h3 style="text-align: center;"><strong>INFORMACIÓN Y CONSENTIMIENTO.</strong></h3>
            <h4 style="text-align: center;"><strong>Tratamiento de datos personales de EMPLEADOS.</strong></h4>
            <br>
            <p>VOLQUETES ESCALANTE, S.L. CIF/NIF B47577929 responsable del tratamiento informa, de conformidad con lo establecido en el REGLAMENTO (UE) 2016/679 y la Ley Orgánica 3/2018 de protección de datos, que sus datos de carácter personal son tratados con la finalidad de:</p>
            <br>
            <ul>
                <li>Impartir/ desarrollar cursos de formación reglada / no reglada.</li>
                <li>Gestionar las nóminas.</li>
                <li>Mantener de la relación laboral.</li>
                <li>Cumplir con las obligaciones legales en el ámbito laboral.</li>
                <li>Atender / gestionar las reclamaciones de los interesados.</li>
                <li>Enviar información relativa al trabajo.</li>
            </ul>
            <br>
            <p>Podrá ejercer sus derechos de acceso, rectificación, limitación de tratamiento, supresión, portabilidad y oposición al tratamiento de sus datos de carácter personal, así como revocar los consentimientos que en su caso haya prestado u obtener más información, dirigiendo su petición por correo electrónico a info@volquetesescalante.com /o por correo postal a la dirección: Calle Álamo - Parcela 123 – 47162 - Aldeamayor De San Martin (Valladolid).</p>
            <br>
            <p><strong>Marque si presta su consentimiento expreso para:</strong></p>
            <p>☐ Tratar sus datos para el desarrollo de acciones formativas.</p>
            <br><br>
            <p><strong>DATOS DEL TRABAJADOR:</strong></p>
            <p><strong>Nombre y apellidos:</strong> ' . $full_name . '</p>
            <p><strong>D.N.I. / N.I.E.:</strong> ' . $dni_nie . '</p>
            <br>
            <p><strong>Fecha:</strong> ' . $hire_date_formatted . ' &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; <strong>Firma del trabajador</strong></p>
            ';

        case 'videovigilancia':
            return '
            <h3 style="text-align: center;"><strong>INFORMACIÓN A LOS TRABAJADORES</strong></h3>
            <h4 style="text-align: center;"><strong>SOBRE LA INSTALACIÓN DE CÁMARAS DE VIGILANCIA</strong></h4>
            <br>
            <p>VOLQUETES ESCALANTE, S.L. CIF/NIF B47577929 responsable del tratamiento informa, de conformidad con lo establecido en el REGLAMENTO (UE) 2016/679 y la Ley Orgánica 3/2018 de protección de datos, comunica:</p>
            <br>
            <p><strong>1.</strong> Que la empresa dispone de un sistema de vigilancia mediante cámaras en el interior y exterior de las instalaciones situadas en Polígono Industrial El Brizo, C/ Álamo- parcela 123 - 47162 ALDEAMAYOR DE SAN MARTIN, (VALLADOLID) para garantizar la seguridad de los trabajadores, clientes, usuarios y todas aquellas personas que concurran al interior de las instalaciones de la empresa.</p>
            <br>
            <p><strong>2.</strong> Que la información obtenida y almacenada mediante el sistema de grabación se utilizará exclusivamente para fines de prevención, seguridad y protección de personas y bienes que se encuentren en el establecimiento o instalación sometida a protección.</p>
            <br>
            <p><strong>3.</strong> Que la anterior información se somete a los derechos que le reconoce el Reglamento (UE) 2016/679 del Parlamento Europeo y del Consejo, de 27 de abril de 2016, relativo a la protección de las personas físicas en lo que respecta al tratamiento de datos personales y a la libre circulación de estos datos, así como a su legislación de desarrollo.</p>
            <br><br>
            <p><strong>DATOS DEL TRABAJADOR:</strong></p>
            <p><strong>Nombre y apellidos:</strong> ' . $full_name . '</p>
            <p><strong>D.N.I. / N.I.E.:</strong> ' . $dni_nie . '</p>
            <br>
            <p><strong>Fecha:</strong> ' . $hire_date_formatted . ' &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; <strong>Firma del trabajador</strong></p>
            ';

        case 'prl':
            return '
            <h3 style="text-align: center;"><strong>REGISTRO DE ENTREGA DE INFORMACIÓN</strong></h3>
            <br>
            <p><strong>DATOS IDENTIFICATIVOS DE LA EMPRESA:</strong></p>
            <p><strong>Volquetes Escalante S.L.</strong><br>
            <strong>Polígono Industrial El Brizo, C/ Álamo - parcela 123</strong><br>
            <strong>47162 ALDEAMAYOR DE SAN MARTIN, (VALLADOLID)</strong><br>
            <strong>C.I.F.: B-47577929</strong></p>
            <br>
            <p>De acuerdo con lo establecido en el artículo 18 de la Ley 31/1995 de Prevención de Riesgos Laborales, sobre información, consulta y participación de los trabajadores, el empresario adoptara las medidas adecuadas para que los trabajadores reciban todas las informaciones necesarias en relación con los riesgos para la seguridad y la salud de los trabajadores en el trabajo, así como las medidas y actividades de protección aplicables a los riesgos señalados.</p>
            <br>
            <p>En base a lo anterior, se le hace entrega de un documento informativo que contiene la siguiente información:</p>
            <br>
            <p><strong>ANDAMIOS METÁLICOS TUBULARES, USO DE PRODUCTOS QUÍMICOS, TAREAS DE LIMPIEZA, TRANSPALETA ELÉCTRICA, EQUIPOS AUXILIARES DE ELEVACIÓN, MANIPULACIÓN MANUAL DE CARGAS, NORMAS GENERALES EN CASO DE EMERGENCIA, EQUIPOS DE PROTECCIÓN INDIVIDUAL, MEDIDAS DE EMERGENCIA, ESCALERA MANUAL, SOLDADURA AUTÓGENA, RADIACIONES OPTICAS, TRASTORNOS MUSCULOESQUELETICOS, CONFORT TÉRMICO, VIBRACIONES MANO-BRAZO, BIPEDESTACION PROLONGADA, ANDAMIOS DE BORRIQUETAS, TRANSPALETA MANUAL, AMBIENTE TÉRMICO-FRIO, ERGONOMÍA EN EL USO DE HERRAMIENTAS PORTÁTILES, SOLDADURA ELÉCTRICA, HERRAMIENTAS ELÉCTRICAS PORTÁTILES, USO DE PUENTE GRÚA, POSTURAS FORZADAS, EQUIPOS DE TRABAJO ELÉCTRICOS, ALMAC.PRODUCTOS QUÍMICOS, EJERCICIOS POSTURALES, USO DE HERRAMIENTAS MANUALES, SEGURIDAD EN DESPLAZAMIENTOS, APLICACIÓN DE FUERZAS, EXPOSICIÓN LABORAL A RUIDO, BOTELLAS Y BOTELLONES DE GASES COMPRIMIDOS, EQUIPOS DE TRABAJO Y HERRAMIENTAS NEUMÁTICAS, USO DE COMPRESOR PORTÁTIL.</strong></p>
            <br>
            <p>Corresponde a cada trabajador, en la medida de sus posibilidades, cumplir con las medidas de prevención e instrucciones proporcionadas por el empresario, por su propia seguridad y salud en el trabajo y por la de aquellas otras personas a las que pueda afectar su actividad profesional, tal y como se indica en el Artículo 29 de la Ley 31/1995 de Prevención de Riesgos Laborales.</p>
            <br><br>
            <p><strong>DATOS DEL TRABAJADOR:</strong></p>
            <p><strong>Nombre y apellidos:</strong> ' . $full_name . '</p>
            <p><strong>D.N.I. / N.I.E.:</strong> ' . $dni_nie . '</p>
            <br>
            <p><strong>Fecha:</strong> ' . $hire_date_formatted . ' &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; <strong>Firma del trabajador</strong></p>
            ';

        default:
            return '<p>Contenido del documento no definido.</p>';
    }
}
?>
