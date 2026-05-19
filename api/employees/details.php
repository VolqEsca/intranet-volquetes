/**
 * Genera contenido HTML profesional para cada tipo de documento
 */
function getEmployeeDocumentContent($type, $employee) {
    $hire_date = !empty($employee['hire_date']) ? date('d/m/Y', strtotime($employee['hire_date'])) : 'No especificada';
    $full_name = htmlspecialchars($employee['full_name'], ENT_QUOTES, 'UTF-8');
    $dni_nie = htmlspecialchars($employee['dni_nie'], ENT_QUOTES, 'UTF-8');
    $job_category = htmlspecialchars($employee['job_category'], ENT_QUOTES, 'UTF-8');
    $location = htmlspecialchars($employee['location'], ENT_QUOTES, 'UTF-8');
    
    // CSS profesional optimizado para TCPDF
    $css = '
    <style>
        body { font-family: helvetica; font-size: 10pt; line-height: 1.4; color: #333; }
        h2 { color: #1e40af; font-size: 16pt; text-align: center; margin: 25px 0 20px 0; border-bottom: 3px solid #1e40af; padding-bottom: 8px; }
        h3 { color: #2563eb; font-size: 12pt; margin: 20px 0 10px 0; border-bottom: 1px solid #cbd5e1; padding-bottom: 3px; font-weight: bold; }
        
        .header-box { 
            background-color: #f1f5f9; 
            border: 2px solid #2563eb; 
            padding: 15px; 
            margin: 20px 0; 
            border-radius: 5px;
        }
        
        .data-table { 
            width: 100%; 
            border-collapse: collapse; 
            margin: 12px 0; 
            border: 1px solid #cbd5e1;
        }
        .data-table td { 
            padding: 8px 12px; 
            border: 1px solid #e2e8f0; 
            vertical-align: top;
            font-size: 10pt;
        }
        .data-table .label { 
            background-color: #f8fafc; 
            font-weight: bold; 
            width: 25%; 
            color: #475569;
        }
        
        .equipment-table {
            width: 100%; 
            border-collapse: collapse; 
            margin: 15px 0;
            border: 2px solid #2563eb;
        }
        .equipment-table th {
            background-color: #2563eb; 
            color: white; 
            padding: 10px 8px; 
            text-align: left;
            font-weight: bold;
            font-size: 10pt;
        }
        .equipment-table td {
            padding: 8px; 
            border: 1px solid #e2e8f0;
            font-size: 9pt;
        }
        .equipment-table tr:nth-child(even) {
            background-color: #f8fafc;
        }
        
        .checkbox-section { margin: 15px 0; }
        .checkbox-item { margin: 8px 0; padding: 4px 0; font-size: 10pt; }
        .checkbox { 
            display: inline-block; 
            width: 12px; 
            height: 12px; 
            border: 1.5px solid #374151; 
            margin-right: 10px;
            vertical-align: middle;
            text-align: center;
            font-size: 10pt;
            font-weight: bold;
        }
        
        .alert-box { 
            background-color: #fef3c7; 
            border-left: 5px solid #f59e0b; 
            padding: 12px 15px; 
            margin: 20px 0;
            border-radius: 3px;
        }
        .alert-box p { margin: 0; font-weight: bold; color: #92400e; }
        
        .signature-section { 
            margin-top: 50px; 
            border-top: 2px solid #cbd5e1; 
            padding-top: 25px;
        }
        .signature-row {
            display: table;
            width: 100%;
            margin: 20px 0;
        }
        .signature-box {
            display: table-cell; 
            width: 45%; 
            text-align: center;
            vertical-align: top;
            padding: 0 10px;
        }
        .signature-line { 
            border-bottom: 1.5px solid #374151; 
            height: 35px; 
            margin: 15px 0 8px 0;
        }
        .signature-label {
            font-size: 9pt;
            color: #6b7280;
            font-weight: bold;
        }
        
        ul, ol { margin: 12px 0; padding-left: 25px; }
        li { margin: 6px 0; line-height: 1.5; }
        p { margin: 8px 0; }
        
        .section-separator { 
            border-top: 1px dashed #9ca3af; 
            margin: 25px 0; 
            height: 1px;
        }
        
        .legal-footer { 
            font-size: 8pt; 
            color: #6b7280; 
            margin-top: 30px; 
            padding-top: 15px;
            border-top: 1px solid #e5e7eb;
            text-align: center;
        }
        
        .highlight { background-color: #dbeafe; padding: 2px 4px; border-radius: 2px; }
    </style>';
    
    // Header común profesional
    $header = $css . '
    <div class="header-box">
        <table class="data-table">
            <tr>
                <td class="label">Empleado:</td>
                <td><strong>' . $full_name . '</strong></td>
                <td class="label">DNI/NIE:</td>
                <td><strong>' . $dni_nie . '</strong></td>
            </tr>
            <tr>
                <td class="label">Puesto:</td>
                <td>' . $job_category . '</td>
                <td class="label">Ubicación:</td>
                <td>' . $location . '</td>
            </tr>
            <tr>
                <td class="label">Fecha alta:</td>
                <td>' . $hire_date . '</td>
                <td class="label">Fecha documento:</td>
                <td><strong>' . date('d/m/Y') . '</strong></td>
            </tr>
        </table>
    </div>';
    
    switch ($type) {
        case 'epis':
            return $header . '
            <h2>REGISTRO DE ENTREGA DE EQUIPOS DE PROTECCIÓN INDIVIDUAL</h2>
            
            <h3>EQUIPOS DE PROTECCIÓN INDIVIDUAL ENTREGADOS</h3>
            <table class="equipment-table">
                <thead>
                    <tr>
                        <th>EQUIPO DE PROTECCIÓN</th>
                        <th>MODELO/REFERENCIA</th>
                        <th>NORMATIVA</th>
                        <th>TALLA</th>
                        <th>✓</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>Pantalón de trabajo</td>
                        <td>MARCA/488-P SUPTOP</td>
                        <td>EN ISO 13688</td>
                        <td>____</td>
                        <td style="text-align: center;"><span class="checkbox">✓</span></td>
                    </tr>
                    <tr>
                        <td>Cazadora de trabajo</td>
                        <td>Modelo corporativo</td>
                        <td>EN ISO 13688</td>
                        <td>____</td>
                        <td style="text-align: center;"><span class="checkbox">✓</span></td>
                    </tr>
                    <tr>
                        <td>Calzado de seguridad</td>
                        <td>GARMARYGA</td>
                        <td>EN ISO 20345 - S3</td>
                        <td>____</td>
                        <td style="text-align: center;"><span class="checkbox">✓</span></td>
                    </tr>
                    <tr>
                        <td>Casco de protección</td>
                        <td>Homologado</td>
                        <td>EN 397</td>
                        <td>----</td>
                        <td style="text-align: center;"><span class="checkbox">☐</span></td>
                    </tr>
                    <tr>
                        <td>Guantes de trabajo</td>
                        <td>Según actividad</td>
                        <td>EN 388</td>
                        <td>____</td>
                        <td style="text-align: center;"><span class="checkbox">☐</span></td>
                    </tr>
                    <tr>
                        <td>Chaleco reflectante</td>
                        <td>Alta visibilidad</td>
                        <td>EN ISO 20471 - Clase 2</td>
                        <td>____</td>
                        <td style="text-align: center;"><span class="checkbox">☐</span></td>
                    </tr>
                </tbody>
            </table>
            
            <h3>COMPROMISOS Y OBLIGACIONES DEL TRABAJADOR</h3>
            <ol>
                <li><strong>Uso obligatorio:</strong> Utilizar correctamente los EPIs durante toda la jornada laboral y en las tareas que lo requieran</li>
                <li><strong>Conservación:</strong> Mantener en perfecto estado de conservación y limpieza los equipos facilitados</li>
                <li><strong>Comunicación:</strong> Informar inmediatamente de deterioros, pérdidas, averías o mal funcionamiento</li>
                <li><strong>Normativa:</strong> Cumplir las normas de seguridad e higiene establecidas por la empresa</li>
                <li><strong>Responsabilidad:</strong> Asumir el coste de reposición en caso de negligencia o uso indebido</li>
            </ol>
            
            <div class="alert-box">
                <p>IMPORTANTE: El incumplimiento de estas obligaciones puede conllevar medidas disciplinarias según el convenio colectivo aplicable</p>
            </div>
            
            <h3>MOTIVO DE LA ENTREGA</h3>
            <div class="checkbox-section">
                <div class="checkbox-item"><span class="checkbox">✓</span> <strong>Primera entrega</strong> - Nueva incorporación</div>
                <div class="checkbox-item"><span class="checkbox">☐</span> Reposición por deterioro normal de uso</div>
                <div class="checkbox-item"><span class="checkbox">☐</span> Reposición por pérdida o robo</div>
                <div class="checkbox-item"><span class="checkbox">☐</span> Cambio de talla</div>
                <div class="checkbox-item"><span class="checkbox">☐</span> Otros (especificar): _________________________________</div>
            </div>
            
            <div class="signature-section">
                <p style="text-align: center; margin-bottom: 25px;">
                    <strong>En ' . $location . ', a ' . date('d') . ' de ' . getMesEspanol(date('n')) . ' de ' . date('Y') . '</strong>
                </p>
                <div class="signature-row">
                    <div class="signature-box">
                        <p><strong>EL TRABAJADOR</strong></p>
                        <div class="signature-line"></div>
                        <p class="signature-label">Fdo.: ' . $full_name . '</p>
                    </div>
                    <div class="signature-box">
                        <p><strong>LA EMPRESA</strong></p>
                        <div class="signature-line"></div>
                        <p class="signature-label">Fdo.: Volquetes Escalante S.L.</p>
                    </div>
                </div>
            </div>';
            
        case 'rgpd':
            return $header . '
            <h2>INFORMACIÓN SOBRE PROTECCIÓN DE DATOS PERSONALES (RGPD)</h2>
            
            <h3>RESPONSABLE DEL TRATAMIENTO</h3>
            <table class="data-table">
                <tr>
                    <td class="label">Razón Social:</td>
                    <td><strong>Volquetes Escalante S.L.</strong></td>
                </tr>
                <tr>
                    <td class="label">Contacto:</td>
                    <td>info@volquetesescalante.com</td>
                </tr>
                <tr>
                    <td class="label">Delegado DPO:</td>
                    <td>Disponible en la dirección de contacto</td>
                </tr>
            </table>
            
            <h3>FINALIDADES Y LEGITIMACIÓN DEL TRATAMIENTO</h3>
            <table class="equipment-table">
                <thead>
                    <tr>
                        <th>FINALIDAD DEL TRATAMIENTO</th>
                        <th>BASE LEGAL (RGPD)</th>
                        <th>OBLIGATORIO</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>Gestión y administración de la relación laboral</td>
                        <td>Art. 6.1.b - Ejecución del contrato</td>
                        <td style="text-align: center;"><strong>SÍ</strong></td>
                    </tr>
                    <tr>
                        <td>Elaboración de nóminas y cotizaciones SS</td>
                        <td>Art. 6.1.c - Obligación legal</td>
                        <td style="text-align: center;"><strong>SÍ</strong></td>
                    </tr>
                    <tr>
                        <td>Prevención de riesgos laborales</td>
                        <td>Art. 6.1.c - Obligación legal</td>
                        <td style="text-align: center;"><strong>SÍ</strong></td>
                    </tr>
                    <tr>
                        <td>Gestión de formación profesional</td>
                        <td>Art. 6.1.a - Consentimiento</td>
                        <td style="text-align: center;">NO</td>
                    </tr>
                    <tr>
                        <td>Comunicaciones internas empresa</td>
                        <td>Art. 6.1.a - Consentimiento</td>
                        <td style="text-align: center;">NO</td>
                    </tr>
                </tbody>
            </table>
            
            <h3>DERECHOS DEL INTERESADO</h3>
            <ul>
                <li><strong>Derecho de acceso:</strong> Conocer qué datos tratamos y cómo los utilizamos</li>
                <li><strong>Derecho de rectificación:</strong> Corregir datos inexactos o incompletos</li>
                <li><strong>Derecho de supresión:</strong> Solicitar el borrado cuando proceda legalmente</li>
                <li><strong>Derecho de limitación:</strong> Restringir el tratamiento en casos específicos</li>
                <li><strong>Derecho de portabilidad:</strong> Recibir sus datos en formato estructurado</li>
                <li><strong>Derecho de oposición:</strong> Oponerse al tratamiento por motivos particulares</li>
            </ul>
            
            <div class="alert-box">
                <p>EJERCICIO DE DERECHOS: Dirigir solicitud por escrito a info@volquetesescalante.com adjuntando copia del DNI/NIE</p>
            </div>
            
            <h3>CONSENTIMIENTOS ESPECÍFICOS (OPCIONALES)</h3>
            <div class="checkbox-section">
                <div class="checkbox-item"><span class="checkbox">☐</span> <strong>AUTORIZO</strong> el uso de mis datos para gestión de cursos y formación profesional</div>
                <div class="checkbox-item"><span class="checkbox">☐</span> <strong>AUTORIZO</strong> el envío de comunicaciones internas de la empresa</div>
                <div class="checkbox-item"><span class="checkbox">☐</span> <strong>AUTORIZO</strong> la cesión de datos a mutuas y servicios de prevención cuando sea necesario</div>
            </div>
            
            <div class="signature-section">
                <p style="text-align: center; margin-bottom: 25px;">
                    <strong>He leído y comprendido la información sobre el tratamiento de mis datos personales</strong>
                </p>
                <div class="signature-row">
                    <div class="signature-box">
                        <p><strong>EL TRABAJADOR</strong></p>
                        <div class="signature-line"></div>
                        <p class="signature-label">Fdo.: ' . $full_name . '</p>
                    </div>
                    <div class="signature-box">
                        <p><strong>LA EMPRESA</strong></p>
                        <div class="signature-line"></div>
                        <p class="signature-label">Fdo.: Volquetes Escalante S.L.</p>
                    </div>
                </div>
            </div>
            
            <div class="legal-footer">
                <p><strong>Marco normativo:</strong> Reglamento (UE) 2016/679, Ley Orgánica 3/2018 de Protección de Datos y garantía de derechos digitales</p>
            </div>';
            
        case 'videovigilancia':
            return $header . '
            <h2>INFORMACIÓN SOBRE SISTEMA DE VIDEOVIGILANCIA</h2>
            
            <div class="alert-box">
                <p>Las instalaciones de Volquetes Escalante S.L. disponen de sistema de videovigilancia conforme a normativa vigente</p>
            </div>
            
            <h3>CARACTERÍSTICAS DEL SISTEMA</h3>
            <table class="data-table">
                <tr>
                    <td class="label">Responsable:</td>
                    <td><strong>Volquetes Escalante S.L.</strong></td>
                </tr>
                <tr>
                    <td class="label">Finalidad principal:</td>
                    <td>Seguridad de personas, instalaciones y equipos</td>
                </tr>
                <tr>
                    <td class="label">Conservación:</td>
                    <td>Máximo 30 días (salvo requerimiento judicial)</td>
                </tr>
                <tr>
                    <td class="label">Acceso a imágenes:</td>
                    <td>Personal autorizado exclusivamente</td>
                </tr>
            </table>
            
            <h3>UBICACIÓN Y COBERTURA DEL SISTEMA</h3>
            <table class="equipment-table">
                <thead>
                    <tr>
                        <th>ZONA VIGILADA</th>
                        <th>COBERTURA ESPECÍFICA</th>
                        <th>FINALIDAD</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>Accesos principales</td>
                        <td>Entradas y salidas de personal</td>
                        <td>Control de acceso no autorizado</td>
                    </tr>
                    <tr>
                        <td>Zona de trabajo exterior</td>
                        <td>Patios, almacenes y maquinaria</td>
                        <td>Protección de equipos y materiales</td>
                    </tr>
                    <tr>
                        <td>Aparcamiento</td>
                        <td>Vehículos empresa y empleados</td>
                        <td>Prevención de vandalismo y robos</td>
                    </tr>
                    <tr>
                        <td>Perímetro instalaciones</td>
                        <td>Vallado y límites de propiedad</td>
                        <td>Detección de intrusión</td>
                    </tr>
                </tbody>
            </table>
            
            <div class="alert-box">
                <p>ZONAS SIN VIDEOVIGILANCIA: Vestuarios, aseos, comedores, zonas de descanso y espacios que afecten a la intimidad personal</p>
            </div>
            
            <h3>DERECHOS DEL TRABAJADOR</h3>
            <ul>
                <li>Derecho a ser informado sobre la existencia del sistema de videovigilancia</li>
                <li>Derecho de acceso a las imágenes que le conciernan personalmente</li>
                <li>Derecho de rectificación y supresión de las imágenes cuando proceda</li>
                <li>Derecho a presentar reclamación ante la Agencia Española de Protección de Datos</li>
                <li>Derecho a ejercer la acción de tutela ante los Tribunales de Justicia</li>
            </ul>
            
            <div class="signature-section">
                <p style="text-align: center; margin-bottom: 25px;">
                    <strong>He sido informado sobre el sistema de videovigilancia y acepto las condiciones descritas</strong>
                </p>
                <div class="signature-row">
                    <div class="signature-box" style="width: 90%; margin: 0 auto;">
                        <div class="signature-line"></div>
                        <p class="signature-label">Firma del trabajador y fecha</p>
                    </div>
                </div>
            </div>
            
            <div class="legal-footer">
                <p><strong>Marco legal:</strong> Reglamento (UE) 2016/679, LO 3/2018, Instrucción 1/2006 AEPD sobre videovigilancia</p>
            </div>';
            
        case 'prl':
            return $header . '
            <h2>INFORMACIÓN SOBRE PREVENCIÓN DE RIESGOS LABORALES</h2>
            
            <div class="alert-box">
                <p>INFORMACIÓN OBLIGATORIA según Art. 18 de la Ley 31/1995 de Prevención de Riesgos Laborales</p>
            </div>
            
            <h3>RIESGOS ESPECÍFICOS IDENTIFICADOS EN EL PUESTO</h3>
            <table class="equipment-table">
                <thead>
                    <tr>
                        <th>TIPO DE RIESGO</th>
                        <th>DESCRIPCIÓN ESPECÍFICA</th>
                        <th>MEDIDAS PREVENTIVAS</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>Mecánicos</td>
                        <td>Caídas, golpes, cortes, atrapamientos</td>
                        <td>EPIs, señalización, formación específica</td>
                    </tr>
                    <tr>
                        <td>Físicos</td>
                        <td>Ruido, vibraciones, temperaturas extremas</td>
                        <td>Protección auditiva, rotación de tareas</td>
                    </tr>
                    <tr>
                        <td>Eléctricos</td>
                        <td>Contactos directos e indirectos</td>
                        <td>Instalaciones homologadas, formación</td>
                    </tr>
                    <tr>
                        <td>Ergonómicos</td>
                        <td>Sobreesfuerzos, posturas forzadas</td>
                        <td>Técnicas de manipulación, pausas</td>
                    </tr>
                    <tr>
                        <td>Circulación vehículos</td>
                        <td>Atropellos, colisiones con maquinaria</td>
                        <td>Señalización, chalecos, segregación</td>
                    </tr>
                </tbody>
            </table>
            
            <h3>OBLIGACIONES DEL TRABAJADOR (Art. 29 LPRL)</h3>
            <ol>
                <li><strong>Seguridad propia y ajena:</strong> Velar por su seguridad y salud y la de compañeros afectados por su actividad</li>
                <li><strong>Uso correcto de equipos:</strong> Utilizar adecuadamente máquinas, herramientas, sustancias peligrosas y equipos de trabajo</li>
                <li><strong>EPIs obligatorios:</strong> Usar correctamente los medios y equipos de protección facilitados por la empresa</li>
                <li><strong>Dispositivos de seguridad:</strong> No anular ni modificar los sistemas de protección de máquinas e instalaciones</li>
                <li><strong>Comunicación de riesgos:</strong> Informar inmediatamente sobre situaciones que entrañen riesgo para la seguridad</li>
                <li><strong>Colaboración activa:</strong> Contribuir al cumplimiento de las obligaciones para proteger la seguridad y salud</li>
            </ol>
            
            <h3>ACTUACIÓN EN CASO DE EMERGENCIA</h3>
            <ul>
                <li><strong>Emergencias generales:</strong> Teléfono 112</li>
                <li><strong>Responsable PRL empresa:</strong> Consultar organigrama actualizado</li>
                <li><strong>Mutua de accidentes:</strong> Información disponible en tablón de anuncios</li>
                <li><strong>Puntos de reunión:</strong> Según plan de evacuación (consultar planos)</li>
                <li><strong>Botiquín y material emergencia:</strong> Ubicación señalizada en instalaciones</li>
            </ul>
            
            <div class="alert-box">
                <p>FORMACIÓN RECIBIDA: El trabajador ha sido informado sobre los riesgos específicos de su puesto y las medidas preventivas aplicables</p>
            </div>
            
            <div class="signature-section">
                <div class="signature-row">
                    <div class="signature-box">
                        <p><strong>EL TRABAJADOR</strong></p>
                        <div class="signature-line"></div>
                        <p class="signature-label">He recibido y comprendido la información<br>Fdo.: ' . $full_name . '</p>
                    </div>
                    <div class="signature-box">
                        <p><strong>RESPONSABLE PRL</strong></p>
                        <div class="signature-line"></div>
                        <p class="signature-label">Información facilitada<br>Fdo.: Volquetes Escalante S.L.</p>
                    </div>
                </div>
            </div>
            
            <div class="legal-footer">
                <p><strong>Marco legal:</strong> Ley 31/1995 de PRL, RD 39/1997 Reglamento de Servicios de Prevención, convenio colectivo aplicable</p>
            </div>';
            
        default:
            return $header . '
            <div style="text-align: center; margin: 50px 0;">
                <h3>DOCUMENTO EN PREPARACIÓN</h3>
                <p>El contenido de este documento está siendo desarrollado.</p>
            </div>';
    }
}

/**
 * Función auxiliar para obtener nombres de meses en español
 */
function getMesEspanol($numeroMes) {
    $meses = [
        1 => 'enero', 2 => 'febrero', 3 => 'marzo', 4 => 'abril',
        5 => 'mayo', 6 => 'junio', 7 => 'julio', 8 => 'agosto',
        9 => 'septiembre', 10 => 'octubre', 11 => 'noviembre', 12 => 'diciembre'
    ];
    return $meses[$numeroMes] ?? 'mes';
}
