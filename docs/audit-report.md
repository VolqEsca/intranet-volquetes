# Audit Report VERSO — 2026-05-19

## Resumen ejecutivo

VERSO alcanza una puntuación global de **87/100 (Healthy)**. El proyecto presenta una arquitectura de apiClient centralizado bien seguida, tipado TypeScript generalmente estricto y una UI con coherencia visual aceptable. Los puntos más débiles son la duplicación explícita del componente `DropdownMenu` entre módulos, la ausencia total de tests en una base con lógica de negocio crítica documentada, y tres flujos de error que fallan silenciosamente ante el usuario. No hay hallazgos críticos (P0) — ningún bug confirmado ni vulnerabilidad explotable.

---

## Hallazgos Críticos 🔴

**Ninguno.** El sistema no presenta bugs confirmados, vulnerabilidades explotables ni riesgo de pérdida de datos en el código frontend auditado.

---

## Hallazgos Importantes 🟡

### ARCH-001 | Major | `src/pages/ManufacturingOrders/ManufacturingOrdersPage.tsx:39-176` + `src/pages/Orders/OrdersPage.tsx:38-194`

**Problema:** El componente `DropdownMenu` (portal con lógica de posicionamiento inteligente) está copiado íntegramente entre los dos módulos. Los comentarios en el código lo confirman explícitamente: "Replicado exactamente del patrón de reparación", "Idéntico a reparación".

**Rationale:** Major (no Minor) porque el componente tiene ~150 líneas de lógica de posicionamiento; cualquier bug o mejora requiere aplicarse en dos sitios, y ya se ha demostrado que divergen (`menuHeight: 240` vs `280`, conjunto de acciones diferente).

**Evidencia:**
> `ManufacturingOrdersPage.tsx:38`: `const DropdownMenu: React.FC<{...}> = ...`
> `OrdersPage.tsx:38`: `const DropdownMenu: React.FC<{...}> = ...`
> Lógica de viewport idéntica línea a línea. `ReactDOM.createPortal(...)` en ambos.

**Solución:** Extraer a `src/components/ui/PortalDropdownMenu.tsx` con una prop `actions: DropdownAction[]` y renderizado genérico. Cada módulo pasa su lista de acciones.

**Fix prompt:**
> Crea `src/components/ui/PortalDropdownMenu.tsx` con el tipo `DropdownAction { label: string; icon: ReactNode; onClick: () => void; colorClass?: string; dividerBefore?: boolean }`. Mueve la lógica de posicionamiento viewport y el `ReactDOM.createPortal` a ese componente. Reemplaza los dos `DropdownMenu` inline en `ManufacturingOrdersPage.tsx` y `OrdersPage.tsx` pasando sus respectivas acciones como array.

---

### ARCH-007 | Major | `src/api/vacations.ts:7-13` + `src/api/employees.ts:4-29`

**Problema:** Existen dos interfaces `Employee` con formas distintas. La de `vacations.ts` es minimal (id, full_name, location, job_category, status). La de `employees.ts` es completa (25+ campos). Se importan de módulos distintos y pueden mezclarse accidentalmente.

**Rationale:** Major porque `VacationsPage.tsx` importa `Employee` de `vacations.ts` y `EmployeesPage.tsx` de `employees.ts`; si se pasan datos cruzados TypeScript no detecta la inconsistencia en runtime.

**Evidencia:**
> `vacations.ts:7`: `export interface Employee { id: number; full_name: string; location: string; job_category: string; status: 'active' | 'inactive'; }`
> `employees.ts:4`: `export interface Employee { id: number; employee_code?: string | null; location: 'Nave 01'|'Nave 02'; full_name: string; dni_nie: string; ... }` (25 campos)

**Solución:** Crear `src/types/employee.ts` con la interfaz completa (`EmployeeFull`) y una versión reducida (`EmployeeSummary`) para el contexto de vacaciones. Unificar imports.

**Fix prompt:**
> Crea `src/types/employee.ts` con `EmployeeFull` (la interfaz completa de `employees.ts`) y `EmployeeSummary` (la interfaz minimal de `vacations.ts`). Actualiza los imports en `employees.ts` (renombra a `EmployeeFull`) y en `vacations.ts` (renombra a `EmployeeSummary`). Ajusta todos los ficheros que importan `Employee` de esas rutas.

---

### ERR-002 | Major | `src/components/AuthProvider.tsx:45-51` + `src/components/AuthProvider.tsx:62-79`

**Problema:** Dos flujos de error silenciosos en autenticación. `checkSession` captura cualquier error y hace `setUser(null)` sin log ni notificación. `login` captura el error de red y devuelve `false` — el UI muestra "Usuario o contraseña incorrectos" incluso para errores de red o timeout.

**Rationale:** Major (no Minor) porque afecta el flujo crítico de autenticación: un corte de red se diagnostica igual que credenciales incorrectas, ocultando el problema real al usuario.

**Evidencia:**
> `AuthProvider.tsx:44-50`: `catch (error) { console.error("Error verificando sesión:", error); setUser(null); }`
> `AuthProvider.tsx:75-78`: `catch (error) { setUser(null); return false; }` — sin mensaje de error de red.
> `LoginPage.tsx:40-42`: muestra "Usuario o contraseña incorrectos" para cualquier `!success`.

**Solución:** En `login`, inspeccionar `error.response` (Axios): si es undefined es error de red; si es 401/403 son credenciales incorrectas. Devolver objeto `{ success: boolean; errorType: 'credentials'|'network'|'unknown' }`.

**Fix prompt:**
> En `src/components/AuthProvider.tsx`, modifica el catch del método `login` para distinguir entre error de red (no `error.response`) y credenciales incorrectas (`error.response?.status === 401`). Actualiza el tipo de retorno de `login` en `AuthContextType` a `Promise<{ success: boolean; errorType?: 'credentials'|'network'|'unknown' }>` y usa ese objeto en `LoginPage.tsx` para mostrar mensajes distintos.

---

### ERR-006 | Major | `src/pages/Orders/OrdersPage.tsx:232-241`

**Problema:** `loadOrders` captura el error con `console.error` solamente. Si la carga inicial falla, el usuario ve una tabla vacía sin ningún mensaje — parece que no hay órdenes cuando en realidad hay un error de red o sesión expirada.

**Rationale:** Major (no Minor) porque es el flujo principal del módulo Órdenes; un error silencioso impide que el usuario pueda reintentar o reportar el problema.

**Evidencia:**
> `OrdersPage.tsx:237-239`: `catch (error) { console.error('Error cargando órdenes:', error); }` — sin `setError`, sin notificación UI.

**Solución:** Añadir `const [error, setError] = useState<string|null>(null)` y mostrar el error en la tabla (igual que `ManufacturingOrdersPage.tsx` que sí lo implementa correctamente en línea 415-419).

**Fix prompt:**
> En `src/pages/Orders/OrdersPage.tsx`, añade estado `const [error, setError] = useState<string|null>(null)`. En el catch de `loadOrders`, asigna `setError(...)`. Renderiza el error antes de la tabla (el mismo patrón que usa `ManufacturingOrdersPage.tsx:415-419`). Reinicia `setError(null)` al inicio de cada carga.

---

### ERR-004 | Major | `src/pages/Employees/EmployeesPage.tsx:97-110`

**Problema:** Tres validaciones usan `alert()` nativo del navegador en lugar del `dialog.service` del proyecto. Rompe la coherencia visual — el usuario ve un popup de sistema operativo en lugar del AlertDialog corporativo.

**Rationale:** Major (no Minor) porque `EmployeesPage` es el módulo de RRHH con uso frecuente; el contraste visual entre el dialog corporativo y el `alert()` nativo es disruptivo y confuso.

**Evidencia:**
> `EmployeesPage.tsx:97`: `alert(\`${employee.full_name} no tiene fecha de alta...\`)`
> `EmployeesPage.tsx:102`: `alert(\`La fecha de alta de ${employee.full_name} tiene formato inválido...\`)`
> `EmployeesPage.tsx:107`: `alert(\`Faltan datos críticos para ${employee.full_name}...\`)`

**Solución:** Reemplazar los tres `alert(...)` por `await dialog.warning(...)` o `await dialog.error(...)`.

**Fix prompt:**
> En `src/pages/Employees/EmployeesPage.tsx`, importa `dialog` de `../../services/dialog.service`. Reemplaza las tres llamadas a `alert()` en `handleGenerateDocuments` (líneas 97, 102, 107) por `await dialog.warning(mensaje)` y añade `async` al handler. No cambies la lógica de validación.

---

### PERF-003 | Major | `src/pages/Orders/OrdersPage.tsx:232-241`

**Problema:** `loadOrders` carga todas las órdenes de una vez (`/orders/` sin parámetros de paginación) y filtra cliente-side. `ManufacturingOrdersPage.tsx` implementa paginación server-side correctamente; `OrdersPage.tsx` no.

**Rationale:** Major (no Minor) porque con crecimiento del volumen de órdenes, la respuesta crecerá sin límite. ManufacturingOrders ya resuelve esto bien en el mismo proyecto.

**Evidencia:**
> `OrdersPage.tsx:234-236`: `const response = await apiClient.get('/orders/'); setOrders(response.data.data || []);` — sin `page`, `limit` ni `search`.
> `ManufacturingOrdersPage.tsx:203-226`: implementa paginación + filtros server-side correctamente.

**Solución:** Añadir paginación y filtros server-side al endpoint de órdenes, siguiendo el patrón de `ManufacturingOrdersPage`. Mover la paginación al estado del componente.

**Fix prompt:**
> Refactoriza `loadOrders` en `src/pages/Orders/OrdersPage.tsx` para aceptar parámetros `page`, `search`, `status`, `priority` como hace `ManufacturingOrdersPage.tsx:203-226`. Añade `const [currentPage, setCurrentPage] = useState(1)` y `const [totalPages, setTotalPages] = useState(1)`. El filtrado client-side puede eliminarse si el backend lo soporta, o mantenerse como fallback.

---

### TEST-001 | Major | Todo el proyecto

**Problema:** El proyecto no tiene ningún fichero de test. Con lógica de negocio crítica documentada (`detectConflicts`, invariantes de arrastres, validadores DNI/NIE, IBAN), la única verificación es la ejecución manual.

**Rationale:** Major (no Critical según las reglas del skill) porque los tests no están, pero el código no está actualmente roto — es un riesgo de mantenimiento, no un defecto en producción hoy.

**Evidencia:**
> `find /home/neglaus/verso/src -name "*.test.*" -o -name "*.spec.*"` → 0 resultados.
> `docs/business-rules.md` documenta 3 casos de prueba críticos que se ejecutan manualmente vía SQL.

**Solución:** Priorizar tests unitarios para (1) `detectConflicts` en `vacations.ts:289-367` — función pura, ideal para tests; (2) `validateDNI_NIE` y `validateIBAN` en `utils/validators.ts`; (3) `normalizeEmployeePayload` en `employees.ts`.

**Fix prompt:**
> Instala Vitest: `npm install -D vitest @testing-library/react @testing-library/user-event jsdom`. Crea `src/utils/validators.test.ts` con casos para `validateDNI_NIE` (DNI válido, DNI letra incorrecta, NIE X/Y/Z), `validateIBAN` (IBAN válido, longitud incorrecta, módulo 97 fallido). Crea `src/api/vacations.test.ts` con tests para `detectConflicts` cubriendo severity 'none', 'info', 'warning', 'critical'.

---

### SEC-001 | Major | `src/api/index.ts:11-26`

**Problema:** El interceptor de respuesta que redirige al login en 401/403 está comentado con el comentario "TEMPORAL: Comentamos la redirección automática para debuggear". Si la sesión expira, el usuario permanece en la página con errores silenciosos en lugar de ser redirigido al login.

**Rationale:** Major (no Critical) porque el backend PHP todavía rechaza las peticiones no autenticadas; la consecuencia es UX roto (errores confusos) pero no una vulnerabilidad de seguridad.

**Evidencia:**
> `api/index.ts:11`: `// TEMPORAL: Comentamos la redirección automática para debuggear`
> `api/index.ts:18-22`: El bloque de redirect a `/login` en 401/403 está comentado.

**Solución:** Evaluar si el problema de debugging original ya está resuelto. Si es así, reactivar el bloque — o implementar una solución más robusta que distinga entre 401 en `/login` (correcto) y 401 en otras rutas (redirect).

**Fix prompt:**
> En `src/api/index.ts`, descomenta el bloque de redirect 401/403. Añade también la condición `error.config?.url?.includes('/login')` para evitar redirect infinito desde el propio endpoint de login. El resultado: `if ((status === 401 || status === 403) && !error.config?.url?.includes('/login') && !window.location.pathname.includes('/login')) { window.location.href = '/login'; }`.

---

## Mejoras Recomendadas 🔵

### SMELL-006 | Minor | `AuthProvider.tsx:29,99` + `UsersPage.tsx:60`

`console.log("Check session response:", response.data)` y `console.log("Usuarios recibidos:", response.data)` son logs de debug visibles en producción. `response.data` contiene email, nombre, apellidos, rol de todos los usuarios.

**Fix prompt:** Elimina las tres llamadas a `console.log` en `AuthProvider.tsx` (líneas 29 y 99) y `UsersPage.tsx` (línea 60). Mantén los `console.error` en los catch blocks.

---

### ARCH-002/003 | Minor | Múltiples ficheros

Tres implementaciones idénticas de `formatDate` en `ManufacturingOrdersPage.tsx:310`, `OrdersPage.tsx:359`, `EmployeesPage.tsx:134`. Dos implementaciones de `truncateText` en `ManufacturingOrdersPage.tsx:198` y `OrdersPage.tsx:209`.

**Fix prompt:** Añade `formatDate(dateString: string | null | undefined): string` y `truncateText(text: string, maxLength?: number): string` a `src/utils/validators.ts` (o crea `src/utils/formatters.ts`). Importa desde los tres componentes.

---

### FW-001/002/003 | Minor | Varios componentes

Tres componentes violan la convención de no-default-exports:
- `src/pages/ManufacturingOrders/ManufacturingOrdersPage.tsx:178`: `export default function ManufacturingOrdersPage()`
- `src/components/ui/Modal.tsx:44`: `export default Modal`
- `src/pages/Clients/NewClientModal.tsx:12`: `export default function NewClientModal`
- `src/api/employees.ts:227`: `export default employeesAPI` (junto con named export)

**Fix prompt:** Cambia los tres default exports a named exports. En `ManufacturingOrdersPage.tsx`, cambia a `export function ManufacturingOrdersPage()`. En `Modal.tsx`, cambia a `export const Modal`. Actualiza `App.tsx` e imports correspondientes.

---

### SEC-007 | Minor | `vite.config.ts:11-12`

`allowedHosts: ["hcm7s3-5173.csb.app"]` es una URL de CodeSandbox hardcodeada de desarrollo que no tiene sentido en el repo de producción. `clientPort: 443` también apunta a configuración iframe-based de StackBlitz.

**Fix prompt:** Elimina el bloque `hmr: { clientPort: 443 }` y el entry `"hcm7s3-5173.csb.app"` de `allowedHosts`. El servidor de dev local no necesita estas opciones.

---

### PERF-001 | Minor | `src/pages/Login/LoginPage.tsx:22-29`

`setInterval` que llama `setCurrentTime(new Date())` cada segundo re-renderiza todo el componente `LoginPage` incluyendo el formulario, validación de error y demás estado. El reloj debería ser un componente hijo aislado.

**Fix prompt:** Extrae `<LiveClock />` como componente separado en `LoginPage.tsx` que encapsula `currentTime`, `setCurrentTime`, `formatDate`, `formatTime`. El componente padre deja de tener el intervalo y no re-renderiza en cada tick.

---

### ARCH-011 | Minor | `src/api/employees.ts:227`

Dual export — `employeesAPI` se exporta tanto como named (`export const employeesAPI`) como default (`export default employeesAPI`). Crea ambigüedad y viola la convención del proyecto.

**Fix prompt:** Elimina la línea `export default employeesAPI` de `src/api/employees.ts`. Verifica que todos los importadores usen `{ employeesAPI }`.

---

## Deuda Técnica Acumulada

| Patrón | Ocurrencias | Impacto |
|---|---|---|
| `params: any` en API calls | 3 (`employeesAPI.list`, `manufacturingAPI.list`, `updateBalance`) | Bypassa el tipado en la capa más externa |
| `catch (err: any)` en componentes | 6+ | Aceptable en TS pero `err.response?.data?.message` podría fallar con errores no-Axios |
| `console.log` en producción | 3 | Exposición de datos de usuario en DevTools |
| Default exports | 4 ficheros | Viola convención documentada |
| `alert()` nativo | 3 en EmployeesPage | Inconsistencia UX |
| `DropdownMenu` duplicado | 2 módulos | ~300 líneas de código idéntico |
| `formatDate` / `truncateText` duplicados | 3+2 instancias | Riesgo de divergencia silenciosa |
| 0 tests | Todo el proyecto | Lógica crítica sin red de seguridad |

**Deuda más urgente:** La duplicación del `DropdownMenu` es la que tiene mayor probabilidad de causar un bug divergente — ya difieren en `menuHeight` (240 vs 280) y si se añade una acción nueva a uno de ellos el otro queda desactualizado.

---

## Calidad Visual y Diseño

### Header — Búsqueda global no funcional
`src/components/Header.tsx:43-50`: El campo de búsqueda global no tiene `onChange`, `value` ni lógica. Es un placeholder visual. **Impacto:** Los usuarios pueden intentar usarlo y no obtener respuesta.

### EmployeesPage — Native alert() rompe coherencia UX
`src/pages/Employees/EmployeesPage.tsx:97,102,107`: Los tres `alert()` de validación en `handleGenerateDocuments` muestran un popup del navegador en lugar del AlertDialog corporativo. Contraste visual disruptivo.

### Sidebar — Descubribilidad de módulos
`src/components/Sidebar.tsx:108-157`: Un usuario nuevo ve Dashboard + Configuración solamente. Los módulos (Órdenes, Fabricación, Empleados, Vacaciones) solo aparecen si han sido marcados como favoritos. No hay sección "Todos los módulos" o equivalente. **Riesgo:** Onboarding confuso para nuevos usuarios.

### VacationsPage — Inconsistencia de layout vs resto de módulos
`src/pages/Vacations/VacationsPage.tsx:245`: Usa `min-h-screen bg-gray-50` con un header de ancho máximo `max-w-[1800px]`. El resto de módulos (Orders, Employees, Manufacturing) usan `<div className="p-6">` sin background. Esta inconsistencia es probablemente intencional (el módulo de vacaciones es el más complejo) pero crea una sensación de aplicación dentro de aplicación.

### Paleta — Usos fuera de palette VERSO
- `ManufacturingOrdersPage.tsx:155`: `color: '#059669'` (verde Tailwind) para "Marcar como entregada". No está en la paleta VERSO.
- `tailwind.config.js:13-23`: La rampa `primary-50/900` está definida y es usable por Tailwind, aunque `docs/forbidden.md` la prohíbe explícitamente. El riesgo es que un desarrollador la use por autocompletado.
- Status badges (`bg-yellow-100`, `bg-green-100`, `bg-red-100`) usan colores Tailwind directos, no variables VERSO. Es una concesión práctica razonable para semántica de estado.

### Accesibilidad — Gaps en Modal y formularios
- `src/components/ui/Modal.tsx`: Sin `role="dialog"`, `aria-modal="true"`, ni `aria-labelledby`. La X de cierre no tiene `aria-label`.
- Inputs de formulario en `LoginPage.tsx` tienen `htmlFor` correctos — bien.
- `VacationsPage.tsx:319-358`: Navegación por flechas (`<button onClick={goToPreviousMonth}>`) sin `aria-label` descriptivo.

### LoginPage — Diseño sólido
Split-panel con gradiente VERSO correcto, reloj en tiempo real bien pensado, toggle de contraseña implementado. Es el componente visualmente más pulido del proyecto.

### UsersPage — Diseño card-list acertado
El listado de usuarios en cards responsivas con grid 12-columnas es un patrón correcto para este tipo de datos. La coherencia con el resto de la UI es buena.

### Button.tsx — Sistema de variantes bien implementado
4 variantes (`primary`, `secondary`, `outline`, `ghost`) con paleta VERSO aplicada correctamente. El `isLoading` con spinner `Loader2` es un añadido reciente bien ejecutado. Único detalle: el prop `fullWidth` es redundante con pasar `className="w-full"`.

---

## Plan de Reforma Sugerido

### Fase 1 — Correcciones inmediatas (2-4h, 0 riesgo)
1. Eliminar `console.log` de producción (3 líneas)
2. Reemplazar `alert()` nativo en EmployeesPage por `dialog.service`
3. Añadir feedback de error en `OrdersPage.loadOrders`
4. Reactivar interceptor 401/403 en `api/index.ts`
5. Limpiar `vite.config.ts` (quitar URLs de StackBlitz)

### Fase 2 — Deuda de arquitectura (1-2 días, riesgo bajo)
6. Extraer `PortalDropdownMenu` compartido (elimina ~300 líneas duplicadas)
7. Extraer `formatDate` y `truncateText` a `src/utils/formatters.ts`
8. Corregir default exports en 4 ficheros (y actualizar imports)
9. Unificar interfaces `Employee` en `src/types/employee.ts`

### Fase 3 — Tests (2-3 días, alta prioridad por ROI)
10. Configurar Vitest
11. Tests unitarios: `validateDNI_NIE`, `validateIBAN`, `normalizeEmployeePayload`
12. Tests unitarios: `detectConflicts` (todos los severity levels)
13. Tests de integración básicos para `AuthProvider` (mock apiClient)

### Fase 4 — Mejoras UX (1-2 días, bajo riesgo)
14. Añadir sección "Todos los módulos" en Sidebar (mejora descubribilidad)
15. Implementar búsqueda global en Header o eliminar el campo placeholder
16. Añadir `role="dialog"` y `aria-label` en Modal y controles de navegación de fechas
17. Extraer componente `<LiveClock />` en LoginPage
18. Considerar paginación server-side en OrdersPage

### Fase 5 — Tipado más estricto (opcional)
19. Tipar `params` en `employeesAPI.list`, `manufacturingAPI.list` y `vacationsAPI.updateBalance`
20. Eliminar `as any` restantes en catch blocks (usar `instanceof AxiosError`)

---

*Auditoría realizada el 2026-05-19. Ficheros PHP del backend no disponibles en este repositorio frontend (desplegados separadamente en SiteGround). Motor Inteligente `api/vacations/` excluido del análisis según instrucciones.*
