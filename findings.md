# Sprint 5 — Findings / Auditoría Visual
**Fecha:** 2026-05-20

---

## Inconsistencias críticas identificadas

### Cross-módulo
| Elemento | UsersPage (ref) | OrdersPage | VacationsPage | Dashboard |
|---|---|---|---|---|
| Border inputs | `border-gray-200` | `border-gray-300` ❌ | `border-gray-300` ❌ | — |
| Error state | Card + text-red | `bg-red-50` ❌ | `bg-red-50` ❌ | border-left ✅ |
| BG selección/highlight | `bg-primary-dark badge` | `bg-blue-50` ❌ | `bg-green-500` ❌ | `bg-[#1162a6]/10` ✅ |
| Padding módulo | `p-6` | `p-6` + p-8 Layout | header propio ❌ | `px-8 py-10` |

### Por componente

#### Header.tsx
- Buscador completamente no funcional (placeholder decorativo)
- Bell sin funcionalidad
- Sin breakpoints responsive

#### Sidebar.tsx
- Versión incorrecta: `v14.3.1` → target es `v2.1.0`
- Sección "Módulos" usa `text-gray-400` vs "Favoritos" en `text-[#1162a6]` → jerarquía confusa
- Footer con `bg-[#f8fafc] rounded-lg border` = antipatrón "caja en caja" (mismo problema resuelto en Dashboard en v14.3.1)

#### Layout.tsx
- `bg-slate-100` inconsistente con `bg-gray-50` y `bg-[#f8fafc]` de otros módulos

#### VacationsPage.tsx
- `min-h-screen bg-gray-50` redundante con Layout
- Header interno con `bg-white border-b shadow-sm` crea segunda jerarquía de navegación
- Panel métricas: `bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200` — todo fuera de paleta
- Iconos métricas: `bg-green-500`, `bg-orange-500` — fuera de paleta (solo #dc2626 para estados negativos)

#### OrdersPage.tsx
- Bulk bar: `bg-blue-50 border-secondary` → fuera de paleta
- `p-6` + `p-8` Layout = padding doble
- Error state inconsistente con patrón Dashboard

#### DashboardPage.tsx
- Gradiente `from-[#f8fafc] to-[#f1f5f9]` innecesario
- Emoji 👋 en H1 — cuestión de tono (decisión Miguel)
- En general el módulo mejor ejecutado

#### UsersPage.tsx (referencia)
- Único problema: buscador dentro de `<Card className="p-4">` = contenedor redundante

---

## Referencias visuales Lazyweb relevantes
- **mlb-b** (0.51): tabla data-heavy con bulk actions y selección — confirma patrón Orders correcto
- **Mercury** (0.50): tabla filtrable con search bar — referencia para tabla VERSO
- **Clockify** (0.43): employee time-off con barras horizontales y filtros — referencia para Vacations
- **Everhour** (0.39): time-off dashboard con header limpio + policy setup — referencia estructura VacationsPage

---

## Sistema de diseño propuesto (tokens)

### Colores (paleta sacrosanta)
```
primary: #1162a6 — active nav, primary buttons, KPIs, iconos activos
secondary: #5487c0 — hover, secondary buttons, section labels
light-accent: #a2bade — badges, fondos filtros activos (opacity/15-20)
critical: #dc2626 — solo errores reales y saldos negativos
bg-page: #f8fafc (gray-50) — fondo base uniforme
bg-card: #ffffff — cards, panels, sidebar
border-default: #e2e8f0 (gray-200) — todos los borders
```

### Componentes base faltantes
- `Table` — componente único para sustituir las 2 implementaciones de tabla nativa
- `PageHeader` — H1 + subtítulo + botón acción (patrón repetido en todos los módulos)
- `FilterBar` — search + selects, SIN Card wrapper
- `ErrorBanner` — border-left rojo, patrón Dashboard
- `EmptyState` — con mensaje descriptivo

### Espaciado estandarizado
- Módulos: `p-6` (eliminar el extra del Layout para que sume a `p-8`)
- Secciones internas: `space-y-6`
- Card padding: `p-4` (sm), `p-6` (default)
