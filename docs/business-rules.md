# Reglas de Negocio VERSO

## Convenio Metal Valladolid — Marco Legal Inmutable

- 22 días laborables/año por empleado
- 19 festivos no laborables (14 oficiales + 5 convenio)
- Jornada: Lunes-Viernes (sábados/domingos NO cuentan)
- Proporcional nuevas altas: ROUND((días_trabajados / 365) * 22)

## Motor de Desglose Automático v14.2.1 — ARQUITECTURA CRÍTICA

Tabla absence_breakdown: registra desglose por year_month con working_days.
Resuelve el "Bug del Puente de Año" (ausencias que cruzan fin de año).

- 141 registros históricos — 0 discrepancias verificadas
- Función calculateSmartBreakdown() — NO modificar sin consultar
- Backticks obligatorios en queries con year_month (palabra reservada MySQL):

```php
$stmt = $pdo->prepare("INSERT INTO `absence_breakdown` (`year_month`, `working_days`) VALUES (?,?)");
```

## Lógica de Arrastres (calendar.php v14.2.2)

- Invariante: disponible_año_anterior === arrastre_año_siguiente
- Ajustes manuales diferenciados por signo:
  - manual < 0: total = annual + carried (vacaciones pagadas NO restan)
  - manual >= 0: total = annual + carried + manual

## Construcción de fechas ISO — Anti-corrupción

Siempre construir manualmente, nunca depender de conversión automática:

```php
$isoDate = "{$year}-" . str_pad($month, 2, '0', STR_PAD_LEFT) . "-" . str_pad($day, 2, '0', STR_PAD_LEFT);
```

## Patrón CORS — Obligatorio en TODO endpoint nuevo

```php
<?php
require_once '../config.php';      // 1. Config SIEMPRE primero
require_once '../cors.php';        // 2. CORS segundo
require_once '../auth_check.php';  // 3. Auth tercero
// A partir de aquí: lógica del endpoint
```

## Casos de Prueba Críticos

Tras cualquier cambio en el módulo de vacaciones, ejecutar:

### 1. Caso Carlos Sócrates
Empleado con ausencia multi-año (cruza fin de año). Verifica Motor Inteligente.

### 2. Query discrepancias ausencias
```sql
SELECT e.name, ab.year_month, SUM(ab.working_days) as desglosado,
       COUNT(a.id) as ausencias
FROM absence_breakdown ab
JOIN absences a ON ab.absence_id = a.id
JOIN employees e ON a.employee_id = e.id
GROUP BY e.name, ab.year_month
HAVING desglosado != (SELECT working_days FROM absences WHERE id = ab.absence_id);
```
Resultado esperado: 0 filas.

### 3. Query coherencia arrastres
```sql
SELECT e.name,
       vb_2025.available_days as disponible_2025,
       vb_2026.carried_days as arrastrado_2026
FROM vacation_balances vb_2025
JOIN vacation_balances vb_2026 ON vb_2025.employee_id = vb_2026.employee_id
JOIN employees e ON vb_2025.employee_id = e.id
WHERE vb_2025.year = 2025 AND vb_2026.year = 2026
HAVING disponible_2025 != arrastrado_2026;
```
Resultado esperado: 0 filas.
