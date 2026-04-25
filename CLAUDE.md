# TequiStock — CLAUDE.md

App web de control de inventarios y proveedores para restaurante "Tequila Mexican Restaurant".
Stack production-ready, basada en el diseño Cloud Design (light + dark mode).

---

## Instrucción principal

Claude Code instala, configura y ejecuta TODO automáticamente.
Solo pide al usuario credenciales cuando sean estrictamente necesarias y crea él mismo los archivos de variables de entorno.
Nunca commitear secretos. Verificar `.gitignore` antes de cualquier `git add`.

---

## Skills a instalar al inicio de cada sesión

```
/plugin marketplace add anthropics/claude-code-plugins
/plugin install frontend-design@claude-code-plugins
/plugin install supabase@claude-code-plugins
/plugin install backend@claude-code-plugins
/plugin install database@claude-code-plugins
/plugin install testing@claude-code-plugins
/plugin install git@claude-code-plugins
/plugin install vercel@claude-code-plugins
```

---

## Tech Stack (production-ready)

**Framework:** Next.js 14 App Router + TypeScript estricto + Tailwind CSS
**UI:** shadcn/ui (parcial, tokens customizados) + Lucide React (íconos)
**Forms:** react-hook-form + Zod (validación schema-based)
**Data:** TanStack Query (cache/revalidación) + Server Actions
**Charts:** Chart.js + react-chartjs-2 (lo que usa el diseño original)
**Theme:** next-themes (toggle light/dark con persistencia)
**Tables:** TanStack Table (paginación, sorting, filtros server-side)
**Toasts:** Sonner
**PDFs:** @react-pdf/renderer
**Fechas:** date-fns con locale es-MX
**Backend:** Supabase (PostgreSQL + Auth + Storage + Realtime + RLS + Triggers + RPC)
**Rate limiting:** Upstash Redis (@upstash/ratelimit)
**Hosting:** Vercel con auto-deploy desde GitHub `main`
**Tipografía:** Plus Jakarta Sans (next/font/google)

---

## Sistema de Diseño — Cloud Design tokens

**Dual theme:** Light por default. Toggle a Dark vía `next-themes`. Persistencia en localStorage (NO sensible, está bien).

### Colores Light Mode
```
terracota:     #BA3026   // primario, acciones, alertas
terracotaDark: #8F221A   // hover primario
gold:          #C2972E   // acento, dorado
navy:          #0B4455   // info, secundario
green:         #106653   // éxito, stock óptimo
darkGreen:     #0D4B43   // variante verde
bg:            #FAF8F5   // fondo principal
surface:       #FFFFFF   // tarjetas, modales
surfaceAlt:    #F5F2EE   // headers, hover suaves
surfaceHover:  #F0EDE8   // hover de filas
border:        #E8E2DA   // bordes default
borderStrong:  #CEC8C0   // bordes elevados
textMain:      #1C1714   // texto principal
textSub:       #7A7068   // texto secundario
textMuted:     #B0A89E   // texto deshabilitado
navBg:         #0B4455   // fondo del sidebar (azul petróleo)
shadow:        rgba(0,0,0,0.06)
shadowMd:      rgba(0,0,0,0.10)
shadowLg:      rgba(0,0,0,0.18)
```

### Colores Dark Mode
```
terracota:     #E8705A
terracotaDark: #C85A44
gold:          #D4A843
navy:          #2A4A6B
green:         #2A9D8F
darkGreen:     #218A7D
bg:            #111318
surface:       #1C2028
surfaceAlt:    #242834
surfaceHover:  #2E3344
border:        #2E3444
borderStrong:  #3E4454
textMain:      #E8EAF0
textSub:       #9098B0
textMuted:     #606880
navBg:         #0D1117
```

### Categorías de productos (color por categoría)
```
Usuario escoje los colores de las categorías
Agregar opcion para nuevos
```
Badges de categoría: `background: {color}22` (12% opacity), `color: {color}`, `border-radius: 99px`, `font-size: 11px`, `font-weight: 600`, `padding: 2px 10px`.

### Tipos de merma
```
Vencimiento:  #BA3026
Mala calidad: #E67E22
Accidente:    #C2972E
Otro (opcion de agregar nuevos):         #78909C
```

### Tipografía
- **Familia:** Plus Jakarta Sans (weights 400, 500, 600, 700, 800, 900)
- **Headings:** font-weight 700-800, tracking-tight
- **Labels uppercase:** font-size 11px, letter-spacing 0.4px, font-weight 600
- **Body:** 13px regular, 14px headings de sección
- **Tabular:** numbers con `tabular-nums`

### Componentes — especificaciones exactas
- **Border-radius:** Cards 10px, Modales 12px, Botones 8px, Pills/Badges 99px
- **Shadows:** Cards `0 2px 8px shadow`, Hover `0 6px 20px rgba(0,0,0,0.10)`, Modales `0 32px 80px rgba(0,0,0,0.28)`
- **Animaciones:** `spin 0.7s linear infinite`, `modalIn 0.18s ease-out`, `toastIn 0.2s ease-out`
- **Hover en cards:** `transform: translateY(-2px)` + sombra elevada, transition 0.15s
- **Focus en inputs:** `border-color: terracota` + `box-shadow: 0 0 0 3px terracota22`
- **Tablas:** filas alternadas surface/surfaceAlt, hover surfaceHover

---

## Arquitectura

```
Frontend:  Server Components → fetches → Client Components para interactividad
           TanStack Query para data del cliente, Server Actions para mutaciones
           Forms con react-hook-form + Zod schemas

Backend:   Server Actions con Zod validation al inicio
           Validación de sesión con supabase.auth.getUser() siempre
           Transacciones via Supabase RPC (PostgreSQL functions)
           RevalidatePath/Tag después de cada mutación
           Rate limiting con Upstash Redis

DB:        Trigger PostgreSQL: INSERT movimientos → actualiza stock_actual
           RLS habilitado en todas las tablas (políticas por authenticated user)
           DELETE bloqueado en movimientos (log inmutable)
           Realtime habilitado en movimientos y productos.stock_actual
```

Módulos: Login · Dashboard · Productos · Proveedores · Compras · Salidas (Consumo + Merma) · Reportes

### Tablas

| Tabla | Campos clave |
|---|---|
| categorias | id, nombre, color (hex) |
| productos | id, nombre, categoria_id, unidad, stock_actual, stock_minimo, last_price, imagen_url, created_at |
| proveedores | id, company, contact, email, phone, address, total_spent, activo |
| proveedor_productos | supplier_id, product_id (M:N) |
| ordenes_compra | id, folio, supplier_id, fecha, total, has_invoice, invoice_url |
| detalle_orden | id, orden_id, product_id, qty, price, subtotal (generado) |
| movimientos | id, product_id, tipo (entrada/salida/merma), qty, fecha, user_id, notes, ref_id, motivo_merma, value_lost |

**Reglas críticas:**
- `stock_actual` solo se modifica vía trigger al insertar en `movimientos`
- Compras = transacción RPC: orden + detalles + movimientos entrada (atómica)
- Consumo: validar `qty <= stock_actual` antes del insert
- Merma: requiere `motivo_merma` + `value_lost = qty * last_price`

**Storage:**
- Bucket privado `facturas` → signed URLs con expiración 3600s
- Bucket privado `imagenes-productos` → signed URLs con expiración 3600s
- Nunca URLs públicas

---

## Patrón de Server Actions

```typescript
'use server'
import { z } from 'zod'

const Schema = z.object({ /* campos */ })

export async function accion(input: z.infer<typeof Schema>) {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autorizado' }

  const parsed = Schema.safeParse(input)
  if (!parsed.success) return { error: 'Datos inválidos', issues: parsed.error.flatten() }

  // lógica con parsed.data...
  revalidatePath('/ruta')
  return { data: resultado }
}
```

---

## Seguridad — checklist obligatorio

- ✅ `.env*` y `.env.local` SIEMPRE en `.gitignore` (verificar antes de cada commit)
- ✅ `SUPABASE_SERVICE_ROLE_KEY` solo server-side, jamás `NEXT_PUBLIC_*`
- ✅ Middleware refresca sesión en cada request a `/(dashboard)/*`
- ✅ Rate limiting login: 5 intentos/15min por IP con Upstash Redis
- ✅ Zod validation en TODOS los Server Actions
- ✅ RLS policies en todas las tablas Supabase
- ✅ Cookies: httpOnly, secure, sameSite='lax'
- ✅ Headers de seguridad en next.config.js: CSP, X-Frame-Options, X-Content-Type-Options
- ✅ Storage: signed URLs siempre, expiración corta
- ✅ Inputs: trim, escape `%` y `_` en LIKE queries
- ✅ DELETE prohibido en `movimientos` (RLS policy)

---

## Convenciones

- Código en **inglés**, UI 100% en **español**
- PascalCase componentes, camelCase variables/funciones
- Moneda: `formatCurrency()` con `Intl.NumberFormat('es-MX')`, jamás floats crudos
- Fechas: date-fns con `locale: es`
- Imports absolutos con `@/*`
- Server Components por default, `'use client'` solo cuando hace falta
- Commits convencionales: `feat:`, `fix:`, `chore:`, en inglés

---

## Restricciones absolutas

- ❌ Modificar `stock_actual` directamente — solo vía `movimientos`
- ❌ Exponer claves privadas al cliente
- ❌ Usar `localStorage` para datos sensibles (theme sí está bien)
- ❌ Texto en inglés visible en UI
- ❌ Fetches de Supabase desde Client Components
- ❌ Borrar registros de `movimientos`
- ❌ URLs públicas de Storage
- ❌ Commitear `.env*`, claves, tokens o credenciales

---

