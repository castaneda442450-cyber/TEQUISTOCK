-- Enable pgcrypto extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- TABLA: categorias
CREATE TABLE public.categorias (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre text NOT NULL UNIQUE,
  color text NOT NULL,
  created_at timestamp DEFAULT now()
);

-- TABLA: productos
CREATE TABLE public.productos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre text NOT NULL,
  categoria_id uuid NOT NULL REFERENCES public.categorias(id) ON DELETE RESTRICT,
  unidad text NOT NULL,
  stock_actual integer NOT NULL DEFAULT 0,
  stock_minimo integer NOT NULL DEFAULT 5,
  last_price numeric(10,2) NOT NULL DEFAULT 0,
  imagen_url text,
  created_at timestamp DEFAULT now()
);

-- TABLA: proveedores
CREATE TABLE public.proveedores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company text NOT NULL,
  contact text NOT NULL,
  email text,
  phone text,
  address text,
  total_spent numeric(12,2) NOT NULL DEFAULT 0,
  activo boolean NOT NULL DEFAULT true,
  created_at timestamp DEFAULT now()
);

-- TABLA: proveedor_productos (M:N)
CREATE TABLE public.proveedor_productos (
  supplier_id uuid NOT NULL REFERENCES public.proveedores(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.productos(id) ON DELETE CASCADE,
  PRIMARY KEY (supplier_id, product_id)
);

-- TABLA: ordenes_compra
CREATE TABLE public.ordenes_compra (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  folio text NOT NULL UNIQUE,
  supplier_id uuid NOT NULL REFERENCES public.proveedores(id) ON DELETE RESTRICT,
  fecha timestamp NOT NULL,
  total numeric(12,2) NOT NULL DEFAULT 0,
  has_invoice boolean NOT NULL DEFAULT false,
  invoice_url text,
  created_at timestamp DEFAULT now()
);

-- TABLA: detalle_orden
CREATE TABLE public.detalle_orden (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  orden_id uuid NOT NULL REFERENCES public.ordenes_compra(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.productos(id) ON DELETE RESTRICT,
  qty integer NOT NULL,
  price numeric(10,2) NOT NULL,
  subtotal numeric(12,2) GENERATED ALWAYS AS (qty * price) STORED,
  created_at timestamp DEFAULT now()
);

-- TABLA: movimientos
CREATE TABLE public.movimientos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.productos(id) ON DELETE RESTRICT,
  tipo text NOT NULL CHECK (tipo IN ('entrada', 'salida', 'merma')),
  qty integer NOT NULL,
  fecha timestamp NOT NULL DEFAULT now(),
  user_id uuid NOT NULL,
  notes text,
  ref_id uuid,
  motivo_merma text CHECK (
    (tipo = 'merma' AND motivo_merma IN ('Vencimiento', 'Mala calidad', 'Accidente', 'Otro'))
    OR (tipo != 'merma' AND motivo_merma IS NULL)
  ),
  value_lost numeric(12,2),
  created_at timestamp DEFAULT now()
);

-- TRIGGER: actualizar_stock (atomic, prevents negative stock via FOR UPDATE lock)
CREATE OR REPLACE FUNCTION actualizar_stock()
RETURNS TRIGGER AS $$
DECLARE
  current_stock integer;
BEGIN
  IF NEW.tipo = 'entrada' THEN
    UPDATE public.productos
      SET stock_actual = stock_actual + NEW.qty
      WHERE id = NEW.product_id;
  ELSIF NEW.tipo IN ('salida', 'merma') THEN
    SELECT stock_actual INTO current_stock
      FROM public.productos
      WHERE id = NEW.product_id
      FOR UPDATE;
    IF current_stock < NEW.qty THEN
      RAISE EXCEPTION 'Stock insuficiente: disponible=%, solicitado=%', current_stock, NEW.qty
        USING ERRCODE = 'P0001';
    END IF;
    UPDATE public.productos
      SET stock_actual = stock_actual - NEW.qty
      WHERE id = NEW.product_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Constraint: stock_actual can never go negative
ALTER TABLE public.productos
  ADD CONSTRAINT productos_stock_non_negative CHECK (stock_actual >= 0);

CREATE TRIGGER trigger_actualizar_stock
AFTER INSERT ON public.movimientos
FOR EACH ROW
EXECUTE FUNCTION actualizar_stock();

-- RLS ENABLE
ALTER TABLE public.categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proveedores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proveedor_productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ordenes_compra ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.detalle_orden ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.movimientos ENABLE ROW LEVEL SECURITY;

-- RLS POLICIES
-- categorias: full CRUD para authenticated
CREATE POLICY "SELECT categorias" ON public.categorias
  FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "INSERT categorias" ON public.categorias
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "UPDATE categorias" ON public.categorias
  FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "DELETE categorias" ON public.categorias
  FOR DELETE
  USING (auth.role() = 'authenticated');

CREATE POLICY "SELECT productos" ON public.productos
  FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "SELECT proveedores" ON public.proveedores
  FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "SELECT proveedor_productos" ON public.proveedor_productos
  FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "SELECT ordenes_compra" ON public.ordenes_compra
  FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "SELECT detalle_orden" ON public.detalle_orden
  FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "SELECT movimientos" ON public.movimientos
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- INSERT
CREATE POLICY "INSERT productos" ON public.productos
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "INSERT proveedores" ON public.proveedores
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "INSERT proveedor_productos" ON public.proveedor_productos
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "INSERT ordenes_compra" ON public.ordenes_compra
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "INSERT detalle_orden" ON public.detalle_orden
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "INSERT movimientos" ON public.movimientos
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- UPDATE (solo en tablas específicas)
CREATE POLICY "UPDATE productos" ON public.productos
  FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "UPDATE proveedores" ON public.proveedores
  FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "UPDATE ordenes_compra" ON public.ordenes_compra
  FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "UPDATE proveedor_productos" ON public.proveedor_productos
  FOR UPDATE
  USING (auth.role() = 'authenticated');

-- DELETE bloqueado en movimientos (no hay policy — audit log inmutable)
-- DELETE permitido en otras tablas
CREATE POLICY "DELETE productos" ON public.productos
  FOR DELETE
  USING (auth.role() = 'authenticated');

CREATE POLICY "DELETE proveedores" ON public.proveedores
  FOR DELETE
  USING (auth.role() = 'authenticated');

CREATE POLICY "DELETE ordenes_compra" ON public.ordenes_compra
  FOR DELETE
  USING (auth.role() = 'authenticated');

CREATE POLICY "DELETE proveedor_productos" ON public.proveedor_productos
  FOR DELETE
  USING (auth.role() = 'authenticated');

-- REALTIME
ALTER PUBLICATION supabase_realtime ADD TABLE public.movimientos;
ALTER PUBLICATION supabase_realtime ADD TABLE public.productos;

-- SEED DATA: Categorías
INSERT INTO public.categorias (nombre, color) VALUES
('Carnes', '#BA3026'),
('Lácteos', '#C2972E'),
('Verduras', '#106653'),
('Bebidas', '#0B4455'),
('Granos', '#7B5E2A'),
('Condimentos', '#5D4037'),
('Mariscos', '#0288D1')
ON CONFLICT (nombre) DO NOTHING;

-- SEED DATA: Proveedores
INSERT INTO public.proveedores (company, contact, email, phone, address) VALUES
('Distribuidora Central', 'Juan García', 'juan@distribuidora.mx', '+52 555 1234567', 'Av. Paseo de la Reforma 505, CDMX'),
('Carnes Premium', 'Carlos López', 'carlos@carnes.mx', '+52 555 7654321', 'Calle 5 de Febrero 123, CDMX'),
('Verduras Frescas', 'María González', 'maria@verduras.mx', '+52 555 9876543', 'Mercado Central, CDMX'),
('Bebidas México', 'Roberto Martínez', 'robert@bebidas.mx', '+52 555 5555555', 'Blvd. Tolstoi 456, CDMX'),
('Lácteos Puros', 'Patricia Sánchez', 'patricia@lacteos.mx', '+52 555 3333333', 'Calzada de Tlalpan 789, CDMX'),
('Especias Gourmet', 'Fernando Ruiz', 'fernando@especias.mx', '+52 555 2222222', 'Avenida Paseo 321, CDMX')
ON CONFLICT DO NOTHING;

-- SEED DATA: Productos (23 productos)
INSERT INTO public.productos (nombre, categoria_id, unidad, stock_actual, stock_minimo, last_price) VALUES
('Carne de Res', (SELECT id FROM public.categorias WHERE nombre='Carnes'), 'kg', 45, 20, 150.00),
('Pechuga de Pollo', (SELECT id FROM public.categorias WHERE nombre='Carnes'), 'kg', 60, 25, 80.00),
('Filete de Cerdo', (SELECT id FROM public.categorias WHERE nombre='Carnes'), 'kg', 35, 15, 120.00),
('Costillas de Res', (SELECT id FROM public.categorias WHERE nombre='Carnes'), 'kg', 28, 10, 180.00),
('Camarones Jumbo', (SELECT id FROM public.categorias WHERE nombre='Mariscos'), 'kg', 20, 10, 350.00),
('Queso Oaxaca', (SELECT id FROM public.categorias WHERE nombre='Lácteos'), 'kg', 12, 5, 85.00),
('Leche Entera', (SELECT id FROM public.categorias WHERE nombre='Lácteos'), 'L', 40, 20, 22.00),
('Crema Ácida', (SELECT id FROM public.categorias WHERE nombre='Lácteos'), 'L', 18, 8, 45.00),
('Lechuga Romana', (SELECT id FROM public.categorias WHERE nombre='Verduras'), 'pz', 50, 15, 8.00),
('Tomate Rojo', (SELECT id FROM public.categorias WHERE nombre='Verduras'), 'kg', 35, 15, 12.00),
('Cebolla Blanca', (SELECT id FROM public.categorias WHERE nombre='Verduras'), 'kg', 40, 20, 10.00),
('Chile Poblano', (SELECT id FROM public.categorias WHERE nombre='Verduras'), 'kg', 25, 10, 25.00),
('Cilantro Fresco', (SELECT id FROM public.categorias WHERE nombre='Verduras'), 'manojo', 30, 10, 5.00),
('Cerveza Corona', (SELECT id FROM public.categorias WHERE nombre='Bebidas'), 'caja', 15, 5, 250.00),
('Refresco Coca Cola', (SELECT id FROM public.categorias WHERE nombre='Bebidas'), 'caja', 20, 8, 180.00),
('Agua Mineral', (SELECT id FROM public.categorias WHERE nombre='Bebidas'), 'caja', 50, 20, 60.00),
('Arroz Blanco', (SELECT id FROM public.categorias WHERE nombre='Granos'), 'kg', 25, 10, 18.00),
('Frijoles Negros', (SELECT id FROM public.categorias WHERE nombre='Granos'), 'kg', 20, 8, 22.00),
('Masa para Tortillas', (SELECT id FROM public.categorias WHERE nombre='Granos'), 'kg', 15, 5, 12.00),
('Comino', (SELECT id FROM public.categorias WHERE nombre='Condimentos'), 'kg', 2, 1, 180.00),
('Orégano Seco', (SELECT id FROM public.categorias WHERE nombre='Condimentos'), 'kg', 1, 0.5, 220.00),
('Pimienta Negra', (SELECT id FROM public.categorias WHERE nombre='Condimentos'), 'kg', 1, 0.5, 250.00),
('Sal de Mar', (SELECT id FROM public.categorias WHERE nombre='Condimentos'), 'kg', 5, 2, 15.00)
ON CONFLICT DO NOTHING;

-- SEED DATA: Proveedor-Productos (links)
INSERT INTO public.proveedor_productos (supplier_id, product_id)
SELECT sp.id, p.id FROM (
  SELECT (SELECT id FROM public.proveedores WHERE company='Carnes Premium') as sp_id,
         ARRAY[p1.id, p2.id, p3.id, p4.id] as product_ids
  FROM public.productos p1, public.productos p2, public.productos p3, public.productos p4
  WHERE p1.nombre='Carne de Res' AND p2.nombre='Pechuga de Pollo'
    AND p3.nombre='Filete de Cerdo' AND p4.nombre='Costillas de Res'
) sub,
LATERAL UNNEST(sub.product_ids) as p(id)
WHERE sub.sp_id IS NOT NULL
ON CONFLICT DO NOTHING;

-- SEED DATA: Órdenes de Compra (14 órdenes de ejemplo)
INSERT INTO public.ordenes_compra (folio, supplier_id, fecha, total, has_invoice, invoice_url) VALUES
('ORD-2024-001', (SELECT id FROM public.proveedores WHERE company='Distribuidora Central'), '2024-04-01', 2500.00, true, 'invoices/ord-2024-001.pdf'),
('ORD-2024-002', (SELECT id FROM public.proveedores WHERE company='Carnes Premium'), '2024-04-02', 3200.00, true, 'invoices/ord-2024-002.pdf'),
('ORD-2024-003', (SELECT id FROM public.proveedores WHERE company='Verduras Frescas'), '2024-04-03', 800.00, false, NULL),
('ORD-2024-004', (SELECT id FROM public.proveedores WHERE company='Bebidas México'), '2024-04-04', 1500.00, true, 'invoices/ord-2024-004.pdf'),
('ORD-2024-005', (SELECT id FROM public.proveedores WHERE company='Lácteos Puros'), '2024-04-05', 1200.00, false, NULL),
('ORD-2024-006', (SELECT id FROM public.proveedores WHERE company='Especias Gourmet'), '2024-04-06', 600.00, true, 'invoices/ord-2024-006.pdf'),
('ORD-2024-007', (SELECT id FROM public.proveedores WHERE company='Distribuidora Central'), '2024-04-10', 2800.00, true, 'invoices/ord-2024-007.pdf'),
('ORD-2024-008', (SELECT id FROM public.proveedores WHERE company='Carnes Premium'), '2024-04-12', 3500.00, true, 'invoices/ord-2024-008.pdf'),
('ORD-2024-009', (SELECT id FROM public.proveedores WHERE company='Verduras Frescas'), '2024-04-14', 900.00, false, NULL),
('ORD-2024-010', (SELECT id FROM public.proveedores WHERE company='Bebidas México'), '2024-04-16', 1800.00, true, 'invoices/ord-2024-010.pdf'),
('ORD-2024-011', (SELECT id FROM public.proveedores WHERE company='Lácteos Puros'), '2024-04-18', 1400.00, true, 'invoices/ord-2024-011.pdf'),
('ORD-2024-012', (SELECT id FROM public.proveedores WHERE company='Especias Gourmet'), '2024-04-20', 700.00, false, NULL),
('ORD-2024-013', (SELECT id FROM public.proveedores WHERE company='Distribuidora Central'), '2024-04-22', 3000.00, true, 'invoices/ord-2024-013.pdf'),
('ORD-2024-014', (SELECT id FROM public.proveedores WHERE company='Carnes Premium'), '2024-04-24', 2900.00, true, 'invoices/ord-2024-014.pdf')
ON CONFLICT DO NOTHING;

-- SEED DATA: Movimientos (consumos y mermas)
INSERT INTO public.movimientos (product_id, tipo, qty, user_id, notes, motivo_merma, value_lost) VALUES
-- Consumos
((SELECT id FROM public.productos WHERE nombre='Carne de Res'), 'salida', 5, gen_random_uuid(), 'Consumo diario', NULL, NULL),
((SELECT id FROM public.productos WHERE nombre='Pechuga de Pollo'), 'salida', 8, gen_random_uuid(), 'Consumo diario', NULL, NULL),
((SELECT id FROM public.productos WHERE nombre='Lechuga Romana'), 'salida', 10, gen_random_uuid(), 'Ensaladas', NULL, NULL),
((SELECT id FROM public.productos WHERE nombre='Tomate Rojo'), 'salida', 3, gen_random_uuid(), 'Consumo diario', NULL, NULL),
((SELECT id FROM public.productos WHERE nombre='Queso Oaxaca'), 'salida', 2, gen_random_uuid(), 'Platillos especiales', NULL, NULL),
((SELECT id FROM public.productos WHERE nombre='Agua Mineral'), 'salida', 5, gen_random_uuid(), 'Consumo diario', NULL, NULL),
((SELECT id FROM public.productos WHERE nombre='Cilantro Fresco'), 'salida', 3, gen_random_uuid(), 'Garnish', NULL, NULL),
((SELECT id FROM public.productos WHERE nombre='Cebolla Blanca'), 'salida', 4, gen_random_uuid(), 'Consumo diario', NULL, NULL),
((SELECT id FROM public.productos WHERE nombre='Filete de Cerdo'), 'salida', 2, gen_random_uuid(), 'Especial del día', NULL, NULL),
((SELECT id FROM public.productos WHERE nombre='Leche Entera'), 'salida', 3, gen_random_uuid(), 'Bebidas', NULL, NULL),
-- Mermas
((SELECT id FROM public.productos WHERE nombre='Cilantro Fresco'), 'merma', 2, gen_random_uuid(), NULL, 'Vencimiento', 10.00),
((SELECT id FROM public.productos WHERE nombre='Tomate Rojo'), 'merma', 1, gen_random_uuid(), NULL, 'Mala calidad', 12.00),
((SELECT id FROM public.productos WHERE nombre='Lechuga Romana'), 'merma', 3, gen_random_uuid(), NULL, 'Vencimiento', 24.00),
((SELECT id FROM public.productos WHERE nombre='Leche Entera'), 'merma', 1, gen_random_uuid(), NULL, 'Accidente', 22.00),
((SELECT id FROM public.productos WHERE nombre='Queso Oaxaca'), 'merma', 0.5, gen_random_uuid(), NULL, 'Mala calidad', 42.50),
((SELECT id FROM public.productos WHERE nombre='Pechuga de Pollo'), 'merma', 1, gen_random_uuid(), NULL, 'Vencimiento', 80.00),
((SELECT id FROM public.productos WHERE nombre='Chile Poblano'), 'merma', 2, gen_random_uuid(), NULL, 'Mala calidad', 50.00)
ON CONFLICT DO NOTHING;

-- ─────────────────────────────────────────────────────────────────────────────
-- MIGRACIONES — Cierre de turno, conteos físicos y fichas técnicas
-- ─────────────────────────────────────────────────────────────────────────────

-- Convertir movimientos.qty a numeric para soportar decimales
ALTER TABLE public.movimientos ALTER COLUMN qty TYPE numeric(10,3);

-- CAMPO: productos.frecuencia_conteo
ALTER TABLE public.productos
  ADD COLUMN IF NOT EXISTS frecuencia_conteo text NOT NULL DEFAULT 'semanal'
    CHECK (frecuencia_conteo IN ('diario', 'semanal', 'mensual'));

-- TABLA: conteos_fisicos
CREATE TABLE IF NOT EXISTS public.conteos_fisicos (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id    uuid NOT NULL REFERENCES public.productos(id) ON DELETE RESTRICT,
  user_id       uuid NOT NULL,
  fecha         date NOT NULL DEFAULT CURRENT_DATE,
  qty_fisica    numeric(10,3) NOT NULL,
  qty_teorica   numeric(10,3) NOT NULL,
  diferencia    numeric(10,3) GENERATED ALWAYS AS (qty_fisica - qty_teorica) STORED,
  notas         text,
  tipo_conteo   text NOT NULL CHECK (tipo_conteo IN ('diario', 'preparacion', 'emergencia')),
  created_at    timestamp DEFAULT now()
);

ALTER TABLE public.conteos_fisicos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "conteos_select" ON public.conteos_fisicos
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "conteos_insert" ON public.conteos_fisicos
  FOR INSERT TO authenticated WITH CHECK (true);

-- TABLA: fichas_tecnicas
CREATE TABLE IF NOT EXISTS public.fichas_tecnicas (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  platillo_nombre  text NOT NULL,
  producto_id      uuid NOT NULL REFERENCES public.productos(id) ON DELETE RESTRICT,
  qty_por_porcion  numeric(10,3) NOT NULL,
  unidad           text NOT NULL,
  activo           boolean NOT NULL DEFAULT true,
  created_at       timestamp DEFAULT now()
);

ALTER TABLE public.fichas_tecnicas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "fichas_select" ON public.fichas_tecnicas
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "fichas_insert" ON public.fichas_tecnicas
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "fichas_update" ON public.fichas_tecnicas
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "fichas_delete" ON public.fichas_tecnicas
  FOR DELETE TO authenticated USING (true);

-- FUNCIÓN RPC: procesar_cierre_turno
CREATE OR REPLACE FUNCTION public.procesar_cierre_turno(
  p_items    jsonb,
  p_user_id  uuid,
  p_tipo     text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_item          jsonb;
  v_product_id    uuid;
  v_qty_consumida numeric(10,3);
  v_qty_fisica    numeric(10,3);
  v_stock_actual  numeric(10,3);
  v_last_price    numeric(10,3);
  v_qty_teorica   numeric(10,3);
  v_diferencia    numeric(10,3);
BEGIN
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_product_id    := (v_item->>'product_id')::uuid;
    v_qty_consumida := (v_item->>'qty_consumida')::numeric;
    v_qty_fisica    := (v_item->>'qty_fisica')::numeric;

    SELECT stock_actual, last_price
      INTO v_stock_actual, v_last_price
      FROM public.productos
     WHERE id = v_product_id
       FOR UPDATE;

    IF v_qty_fisica > (v_stock_actual - v_qty_consumida) THEN
      RAISE EXCEPTION
        'qty_fisica (%) supera el stock disponible (%) para producto %',
        v_qty_fisica, (v_stock_actual - v_qty_consumida), v_product_id;
    END IF;

    IF v_qty_consumida > 0 THEN
      INSERT INTO public.movimientos
        (product_id, tipo, qty, user_id, notes, fecha)
      VALUES
        (v_product_id, 'salida', v_qty_consumida, p_user_id,
         'Cierre de turno', CURRENT_DATE);
    END IF;

    SELECT stock_actual INTO v_qty_teorica
      FROM public.productos WHERE id = v_product_id;

    INSERT INTO public.conteos_fisicos
      (product_id, user_id, fecha, qty_fisica, qty_teorica, tipo_conteo)
    VALUES
      (v_product_id, p_user_id, CURRENT_DATE,
       v_qty_fisica, v_qty_teorica, p_tipo);

    v_diferencia := v_qty_fisica - v_qty_teorica;
    IF v_diferencia < -0.5 AND ABS(v_diferencia) > (0.15 * v_qty_teorica) THEN
      INSERT INTO public.movimientos
        (product_id, tipo, qty, user_id, notes, motivo_merma, value_lost, fecha)
      VALUES (
        v_product_id, 'merma', ABS(v_diferencia), p_user_id,
        'Diferencia detectada en cierre de turno',
        'Otro',
        ABS(v_diferencia) * v_last_price,
        CURRENT_DATE
      );
    END IF;
  END LOOP;
END;
$$;

-- MIGRACIÓN — Conteo por Zonas

CREATE TABLE public.zonas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre text NOT NULL,
  descripcion text,
  color text NOT NULL DEFAULT '#0B4455',
  icono text NOT NULL DEFAULT 'warehouse',
  activo boolean NOT NULL DEFAULT true,
  created_at timestamp DEFAULT now()
);
ALTER TABLE public.zonas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "zonas_all" ON public.zonas FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.zona_productos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  zona_id uuid NOT NULL REFERENCES public.zonas(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.productos(id) ON DELETE CASCADE,
  created_at timestamp DEFAULT now(),
  UNIQUE(zona_id, product_id)
);
ALTER TABLE public.zona_productos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "zona_productos_all" ON public.zona_productos FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE INDEX idx_zona_productos_zona_id    ON public.zona_productos(zona_id);
CREATE INDEX idx_zona_productos_product_id ON public.zona_productos(product_id);

-- FUNCIÓN RPC: procesar_conteo_zona
-- NOTA: el caller (Server Action) debe enviar p_items ya ordenado por
-- product_id ascendente para que el orden de los FOR UPDATE sea
-- determinístico entre llamadas concurrentes y se evite deadlock.
CREATE OR REPLACE FUNCTION public.procesar_conteo_zona(
  p_items   jsonb,
  p_user_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_item             jsonb;
  v_product_id       uuid;
  v_cantidad_contada numeric(10,3);
  v_stock_actual     numeric(10,3);
  v_diff             numeric(10,3);
  v_entradas         int := 0;
  v_salidas          int := 0;
  v_sin_cambio       int := 0;
BEGIN
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_product_id       := (v_item->>'product_id')::uuid;
    v_cantidad_contada := (v_item->>'cantidad_contada')::numeric;

    SELECT stock_actual INTO v_stock_actual
      FROM public.productos
     WHERE id = v_product_id
       FOR UPDATE;

    v_diff := v_cantidad_contada - v_stock_actual;

    IF v_diff > 0 THEN
      INSERT INTO public.movimientos (product_id, tipo, qty, user_id, notes, fecha)
      VALUES (v_product_id, 'entrada', v_diff, p_user_id, 'Ajuste por conteo de zona', now());
      v_entradas := v_entradas + 1;
    ELSIF v_diff < 0 THEN
      INSERT INTO public.movimientos (product_id, tipo, qty, user_id, notes, fecha)
      VALUES (v_product_id, 'salida', ABS(v_diff), p_user_id, 'Ajuste por conteo de zona', now());
      v_salidas := v_salidas + 1;
    ELSE
      v_sin_cambio := v_sin_cambio + 1;
    END IF;
  END LOOP;

  RETURN jsonb_build_object('entradas', v_entradas, 'salidas', v_salidas, 'sin_cambio', v_sin_cambio);
END;
$$;

-- MIGRACIÓN — Conteo multi-zona (flujo guiado)

-- FUNCIÓN RPC: procesar_conteo_multizona
-- Reemplaza a procesar_conteo_zona para el flujo guiado multi-zona.
-- procesar_conteo_zona se deja intacta en la BD (no se elimina) pero ya
-- no la invoca la app.
--
-- El caller ya sumó, por producto, las cantidades contadas en TODAS las
-- zonas visitadas en la sesión — cada product_id aparece UNA sola vez en
-- p_totales con su total_fisico acumulado. Esto es lo que corrige el bug:
-- se lee stock_actual UNA sola vez por producto (FOR UPDATE) y se compara
-- contra el TOTAL acumulado, nunca contra ajustes intermedios de otras
-- zonas.
--
-- NOTA: el caller debe enviar p_totales ya ordenado por product_id
-- ascendente (mismo patrón anti-deadlock que procesar_conteo_zona).
CREATE OR REPLACE FUNCTION public.procesar_conteo_multizona(
  p_totales    jsonb,
  p_user_id    uuid,
  p_frecuencia text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_item         jsonb;
  v_product_id   uuid;
  v_total_fisico numeric(10,3);
  v_stock_actual numeric(10,3);
  v_diff         numeric(10,3);
  v_entradas     int := 0;
  v_salidas      int := 0;
  v_sin_cambio   int := 0;
BEGIN
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_totales)
  LOOP
    v_product_id   := (v_item->>'product_id')::uuid;
    v_total_fisico := (v_item->>'total_fisico')::numeric;

    SELECT stock_actual INTO v_stock_actual
      FROM public.productos
     WHERE id = v_product_id
       FOR UPDATE;

    v_diff := v_total_fisico - v_stock_actual;

    IF v_diff > 0 THEN
      INSERT INTO public.movimientos (product_id, tipo, qty, user_id, notes, fecha)
      VALUES (v_product_id, 'entrada', v_diff, p_user_id,
              'Ajuste por conteo de zonas (' || p_frecuencia || ')', now());
      v_entradas := v_entradas + 1;
    ELSIF v_diff < 0 THEN
      INSERT INTO public.movimientos (product_id, tipo, qty, user_id, notes, fecha)
      VALUES (v_product_id, 'salida', ABS(v_diff), p_user_id,
              'Ajuste por conteo de zonas (' || p_frecuencia || ')', now());
      v_salidas := v_salidas + 1;
    ELSE
      v_sin_cambio := v_sin_cambio + 1;
    END IF;
  END LOOP;

  RETURN jsonb_build_object('entradas', v_entradas, 'salidas', v_salidas, 'sin_cambio', v_sin_cambio);
END;
$$;

-- FUNCIÓN RPC: get_zonas_pendientes
-- Dado un conjunto de product_ids recién contados, la frecuencia elegida,
-- y las zonas ya visitadas en la sesión (a excluir), retorna las zonas
-- activas restantes que comparten al menos uno de esos productos con esa
-- frecuencia. Solo lectura — no requiere SECURITY DEFINER, las políticas
-- RLS existentes (SELECT para authenticated) ya permiten esta consulta.
CREATE OR REPLACE FUNCTION public.get_zonas_pendientes(
  p_product_ids     uuid[],
  p_frecuencia      text,
  p_zonas_excluidas uuid[]
)
RETURNS TABLE (id uuid, nombre text, color text, icono text)
LANGUAGE sql
STABLE
AS $$
  SELECT DISTINCT z.id, z.nombre, z.color, z.icono
    FROM public.zonas z
    JOIN public.zona_productos zp ON zp.zona_id = z.id
    JOIN public.productos p ON p.id = zp.product_id
   WHERE zp.product_id = ANY(p_product_ids)
     AND p.frecuencia_conteo = p_frecuencia
     AND z.id <> ALL(p_zonas_excluidas)
     AND z.activo = true
   ORDER BY z.nombre;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- MIGRACIÓN — Porcionado
-- ─────────────────────────────────────────────────────────────────────────────

-- TABLA: porcion_config
-- Define qué productos se porcionan y su tamaño estándar de porción.
-- porcion_unit debe ser compatible (misma familia de unidades) con la unidad
-- del producto — la validación se hace en el server action con units.ts.
CREATE TABLE IF NOT EXISTS public.porcion_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL UNIQUE REFERENCES public.productos(id) ON DELETE CASCADE,
  porcion_size numeric(10,3) NOT NULL,
  porcion_unit text NOT NULL,
  min_porciones int NOT NULL DEFAULT 0,
  -- umbral (%) de merma que dispara la alerta/confirmación en la UI, por producto
  merma_alerta_pct numeric(5,2) NOT NULL DEFAULT 15,
  activo boolean NOT NULL DEFAULT true,
  created_at timestamp DEFAULT now()
);
ALTER TABLE public.porcion_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "porcion_config_all" ON public.porcion_config
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- TABLA: porcionados
-- Registra cada evento de porcionado. Sin historial en la UI (solo agregación
-- del día), pero es log persistente.
CREATE TABLE IF NOT EXISTS public.porcionados (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.productos(id) ON DELETE RESTRICT,
  -- Cantidad de producto usada (en la unidad ingresada por el usuario)
  cantidad_usada numeric(10,3) NOT NULL,
  unidad_usada text NOT NULL,
  -- Porciones obtenidas
  porciones_obtenidas int NOT NULL,
  -- Tamaño real de cada porción (puede diferir del estándar configurado)
  porcion_size_real numeric(10,3) NOT NULL,
  porcion_unit text NOT NULL,
  -- Merma calculada (en unidad del producto)
  merma_cantidad numeric(10,3) NOT NULL DEFAULT 0,
  merma_unidad text NOT NULL,
  -- Quién y cuándo
  user_id uuid NOT NULL,
  fecha date NOT NULL DEFAULT CURRENT_DATE,
  notas text,
  created_at timestamp DEFAULT now()
);
ALTER TABLE public.porcionados ENABLE ROW LEVEL SECURITY;
CREATE POLICY "porcionados_all" ON public.porcionados
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_porcionados_product_fecha
  ON public.porcionados(product_id, fecha);

-- FUNCIÓN RPC: registrar_porcionado
-- Escritura atómica en dos tablas (porcionados + movimientos). El movimiento
-- 'salida' descuenta stock vía el trigger actualizar_stock(); si el trigger
-- lanza P0001 (stock insuficiente), TODO el bloque revierte, incluido el
-- insert en porcionados.
--
-- Toda la conversión de unidades y el cálculo de merma se hacen en TypeScript
-- (units.ts) — esta función solo persiste los valores ya calculados.
-- p_qty_movimiento ya viene convertido a la unidad del producto y redondeado
-- a entero (movimientos.qty es integer).
CREATE OR REPLACE FUNCTION public.registrar_porcionado(
  p_product_id         uuid,
  p_cantidad_usada     numeric,
  p_unidad_usada       text,
  p_porciones_obtenidas int,
  p_porcion_size_real  numeric,
  p_porcion_unit       text,
  p_merma_cantidad     numeric,
  p_merma_unidad       text,
  p_qty_movimiento     int,
  p_user_id            uuid,
  p_notas              text
)
RETURNS public.porcionados
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.porcionados;
BEGIN
  INSERT INTO public.porcionados (
    product_id, cantidad_usada, unidad_usada, porciones_obtenidas,
    porcion_size_real, porcion_unit, merma_cantidad, merma_unidad,
    user_id, notas
  )
  VALUES (
    p_product_id, p_cantidad_usada, p_unidad_usada, p_porciones_obtenidas,
    p_porcion_size_real, p_porcion_unit, p_merma_cantidad, p_merma_unidad,
    p_user_id, p_notas
  )
  RETURNING * INTO v_row;

  INSERT INTO public.movimientos (product_id, tipo, qty, user_id, notes)
  VALUES (
    p_product_id, 'salida', p_qty_movimiento, p_user_id,
    'Porcionado — ' || p_porciones_obtenidas || ' porciones de ' ||
    p_porcion_size_real || p_porcion_unit
  );

  RETURN v_row;
END;
$$;
