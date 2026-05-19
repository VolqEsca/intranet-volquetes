---
name: verso-business-rules
description: "Reglas de negocio críticas de VERSO. Activar cuando se modifiquen módulos de vacaciones, empleados, o se creen endpoints PHP nuevos."
---

## Motor de Desglose Automático v14.2.1

Tabla absence_breakdown: desglose por year_month + working_days.
Función crítica: calculateSmartBreakdown() en create.php — NO modificar sin consultar.
Backticks obligatorios: `absence_breakdown`, `year_month` (palabras reservadas MySQL).

## Lógica de Arrastres

Invariante: disponible_año_anterior === arrastre_año_siguiente.
Ajustes manual < 0: total = annual + carried (vacaciones pagadas NO restan).
Ajustes manual >= 0: total = annual + carried + manual.

## Patrón CORS (obligatorio en TODO endpoint nuevo)

```php
require_once '../config.php';      // 1. PRIMERO
require_once '../cors.php';        // 2. SEGUNDO
require_once '../auth_check.php';  // 3. TERCERO
```

## Paleta VERSO

- primary-dark #1162a6 — acciones primarias, headers
- secondary #5487c0 — hover, elementos secundarios
- light-accent #a2bade — fondos suaves, badges
- Rojo crítico #dc2626 — alertas y errores
- Rampa primary-50/900 — NO usar

## Verificación tras cambios en vacaciones

Ejecutar query discrepancias (ver docs/business-rules.md) → resultado esperado: 0 filas.
Ejecutar caso Carlos Sócrates (ausencia multi-año).
