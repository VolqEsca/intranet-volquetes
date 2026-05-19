# VERSO — ERP Volquetes Escalante S.L.

React 18 + TypeScript + Vite + PHP 8.2 + MySQL. Producción en SiteGround.
Docs completos: @docs/business-rules.md | @docs/forbidden.md | @docs/deploy.md | @docs/siteground-constraints.md

## Comandos

- `npm run dev` — servidor desarrollo (puerto 5173)
- `npm run build` — build producción → /dist/app-assets/
- `npx tsc --noEmit` — verificar tipos TypeScript (ejecutar tras cambios)
- `npm run lint` — ESLint
- `./deploy-php.sh` — rsync API PHP → SiteGround (excluye config.php y .htaccess)

## Arquitectura

- `src/api/index.ts` — apiClient centralizado. SIEMPRE usar este, nunca axios directo.
- `src/types/` — interfaces TypeScript. Actualizar ANTES de modificar lógica.
- `api/cors.php` + `api/auth_check.php` — patrón obligatorio en todos los endpoints PHP.
- `api/vacations/create.php` — Motor Inteligente v14.2.1. NO tocar sin consultar.
- `api/vacations/calendar.php` — lógica arrastres v14.2.2. NO tocar sin consultar.

## Paleta VERSO

- `primary-dark` #1162a6 — acciones primarias, headers, elementos de peso
- `secondary` #5487c0 — hover, elementos secundarios, bordes activos
- `light-accent` #a2bade — fondos suaves, badges, baja jerarquía
- Rojo crítico #dc2626 — alertas y errores únicamente
- Rampa primary-50/900 — NO usar, residuo de template

## Convenciones de código

- TypeScript estricto — nunca `any`. Interfaces para todo.
- Comentarios en castellano técnico.
- Componentes React: exports nombrados (no default exports).
- Estado servidor: hooks personalizados con apiClient.
- PHP: PDO únicamente, nunca mysqli. Backticks en queries con year_month.

## Antes de cada tarea

1. Leer el plan en @docs/plan-activo.md si existe
2. Verificar si afecta módulo vacaciones → aplicar casos de prueba críticos
3. Si es endpoint PHP nuevo → aplicar patrón CORS obligatorio
4. Ejecutar `npx tsc --noEmit` tras cambios en TypeScript

## Lo que NO hacer

Ver lista completa en @docs/forbidden.md
