# VERSO Sprint 5 — Reforma UI/UX
**Fecha:** 2026-05-20  
**Estado:** PLAN APROBADO — pendiente confirmaciones de Miguel  
**Criterio de éxito:** Consistencia visual completa cross-módulo + responsive funcional + sistema de diseño documentado

---

## Fases

### FASE 1 — Sistema de diseño base (tokens + componentes) 
**Status:** pending  
**Riesgo:** ninguno — solo config y componentes, sin tocar lógica  
- [ ] `tailwind.config.ts`: eliminar rampa `primary-50/900` (residuo), añadir tokens de espaciado
- [ ] `index.css`: estandarizar `body { background: #f8fafc }` — actualmente `bg-gray-100` inconsistente
- [ ] `Layout.tsx`: cambiar `bg-slate-100` → `bg-[#f8fafc]`; añadir breakpoints responsive en `<main>`

### FASE 2 — Header + Sidebar (impacto visual global)
**Status:** pending  
**Riesgo:** bajo — cambios cosméticos + decisión buscador (requiere confirmación Miguel)  
- [ ] `Header.tsx`: **DECISIÓN PENDIENTE** — eliminar buscador placeholder O implementar búsqueda client-side
- [ ] `Sidebar.tsx`: corregir versión footer `v14.3.1` → `v2.1.0`
- [ ] `Sidebar.tsx`: eliminar caja anidada del footer (`bg-[#f8fafc] rounded-lg border`) → texto plano
- [ ] `Sidebar.tsx`: estandarizar color sección "Módulos" (`text-gray-400`) → `text-[#5487c0]` (mismo peso que "Favoritos" en azul más ligero)

### FASE 3 — VacationsPage (más roto visualmente)
**Status:** pending  
**Riesgo:** medio — el módulo más complejo, pero los cambios son cosméticos  
- [ ] Eliminar `min-h-screen bg-gray-50` del wrapper raíz (redundante con Layout)
- [ ] **DECISIÓN PENDIENTE** — ¿colapsar header interno al patrón estándar o mantenerlo?
- [ ] Corregir panel métricas: eliminar `bg-gradient-to-r from-blue-50 to-indigo-50` → `bg-white border border-[#e2e8f0]`
- [ ] Corregir iconos de métricas: `bg-green-500` / `bg-orange-500` → `bg-[#5487c0]` o `bg-[#a2bade]`; solo saldo negativo en `bg-[#dc2626]`
- [ ] Estandarizar `border-gray-300` → `border-gray-200` en selects de navegación

### FASE 4 — OrdersPage (tabla principal)
**Status:** pending  
**Riesgo:** bajo — correcciones cosméticas, tabla ya funcional  
- [ ] Estandarizar `border-gray-300` → `border-gray-200` en inputs de filtro
- [ ] Bulk action bar: `bg-blue-50 border-secondary` → `bg-[#a2bade]/15 border-[#a2bade]`
- [ ] Selección de filas: `bg-blue-50` → `bg-[#a2bade]/10`
- [ ] Error state: `bg-red-50 border border-red-200` → patrón border-left `border-l-4 border-[#dc2626]` (como Dashboard)
- [ ] Eliminar `p-6` del wrapper raíz de OrdersPage (el Layout ya provee `p-8`)

### FASE 5 — Dashboard (ya el mejor módulo)
**Status:** pending  
**Riesgo:** ninguno  
- [ ] Eliminar `bg-gradient-to-br from-[#f8fafc] to-[#f1f5f9]` → fondo plano `bg-transparent`
- [ ] **DECISIÓN PENDIENTE** — ¿eliminar emoji 👋 del H1?
- [ ] Considerar reducir `text-4xl` del saludo a `text-3xl` (jerarquía más contenida)

### FASE 6 — Responsive
**Status:** pending  
**Riesgo:** medio (nueva funcionalidad, no toca lógica existente)  
- [ ] **DECISIÓN PENDIENTE** — Sidebar: drawer/hamburger en móvil vs declarar desktop-only
- [ ] `Layout.tsx`: `p-8` → `p-4 md:p-8` en `<main>`
- [ ] Tables: verificar `overflow-x-auto` en todos los módulos (Orders ya lo tiene)
- [ ] Header: ajustar para pantallas < 768px

### FASE 7 — Pulido final
**Status:** pending  
**Riesgo:** ninguno  
- [ ] Actualizar versión sidebar → `v2.1.0` (tras confirmar con Miguel cuál es el número correcto)
- [ ] `UsersPage.tsx`: eliminar `<Card>` wrapper del buscador (antipatrón "caja en caja")
- [ ] Verificar consistencia final cross-módulo

---

## Decisiones pendientes de Miguel

1. **Header buscador**: ¿eliminar o implementar búsqueda real?
2. **Dashboard emoji** 👋: ¿mantener o eliminar?
3. **Vacations header interno**: ¿colapsar o mantener?
4. **Sidebar responsive**: ¿drawer móvil o desktop-only?
5. **Número de versión footer**: ¿v2.1.0 es correcto o se mantiene el versionado actual?

---

## Errores históricos a no repetir

- NO tocar `calculateSmartBreakdown()` ni lógica de vacaciones
- NO usar rampa `primary-50/900`
- NO colores fuera de paleta (`bg-blue-50`, `bg-green-500`, `bg-orange-500`)
- NO `position:absolute` sin `relative + overflow-hidden`
