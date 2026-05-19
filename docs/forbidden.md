# Prohibiciones Absolutas VERSO

- NO modificar absence_breakdown sin entender Motor de Desglose (ver business-rules.md)
- NO modificar calendar.php sin aplicar lógica consistente ajustes +/-
- NO usar axios directamente — siempre apiClient (src/api/index.ts)
- NO crear endpoints PHP sin patrón: Config → CORS → Auth
- NO usar librerías nuevas sin confirmar compatibilidad SiteGround
- NO tocar config.php ni .htaccess
- NO mysqli en código nuevo
- NO colores fuera de paleta VERSO (#1162a6, #5487c0, #a2bade, #dc2626)
- NO position:absolute sin contenedor relative + overflow-hidden
- NO modificar calculateSmartBreakdown() sin consultar
- NO eliminar navegación dual card Empleados
- NO default exports en componentes React
- NO rampa primary-50/900 (residuo de template, no usar)
