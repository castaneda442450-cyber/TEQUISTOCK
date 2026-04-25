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

-- TRIGGER: actualizar_stock
CREATE OR REPLACE FUNCTION actualizar_stock()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.tipo = 'entrada' THEN
    UPDATE public.productos
    SET stock_actual = stock_actual + NEW.qty
    WHERE id = NEW.product_id;
  ELSIF NEW.tipo IN ('salida', 'merma') THEN
    UPDATE public.productos
    SET stock_actual = stock_actual - NEW.qty
    WHERE id = NEW.product_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

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
-- SELECT para todos los usuarios autenticados
CREATE POLICY "SELECT categorias" ON public.categorias
  FOR SELECT
  USING (auth.role() = 'authenticated_user');

CREATE POLICY "SELECT productos" ON public.productos
  FOR SELECT
  USING (auth.role() = 'authenticated_user');

CREATE POLICY "SELECT proveedores" ON public.proveedores
  FOR SELECT
  USING (auth.role() = 'authenticated_user');

CREATE POLICY "SELECT proveedor_productos" ON public.proveedor_productos
  FOR SELECT
  USING (auth.role() = 'authenticated_user');

CREATE POLICY "SELECT ordenes_compra" ON public.ordenes_compra
  FOR SELECT
  USING (auth.role() = 'authenticated_user');

CREATE POLICY "SELECT detalle_orden" ON public.detalle_orden
  FOR SELECT
  USING (auth.role() = 'authenticated_user');

CREATE POLICY "SELECT movimientos" ON public.movimientos
  FOR SELECT
  USING (auth.role() = 'authenticated_user');

-- INSERT
CREATE POLICY "INSERT productos" ON public.productos
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated_user');

CREATE POLICY "INSERT proveedores" ON public.proveedores
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated_user');

CREATE POLICY "INSERT proveedor_productos" ON public.proveedor_productos
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated_user');

CREATE POLICY "INSERT ordenes_compra" ON public.ordenes_compra
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated_user');

CREATE POLICY "INSERT detalle_orden" ON public.detalle_orden
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated_user');

CREATE POLICY "INSERT movimientos" ON public.movimientos
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated_user');

-- UPDATE (solo en tablas específicas)
CREATE POLICY "UPDATE productos" ON public.productos
  FOR UPDATE
  USING (auth.role() = 'authenticated_user');

CREATE POLICY "UPDATE proveedores" ON public.proveedores
  FOR UPDATE
  USING (auth.role() = 'authenticated_user');

CREATE POLICY "UPDATE ordenes_compra" ON public.ordenes_compra
  FOR UPDATE
  USING (auth.role() = 'authenticated_user');

CREATE POLICY "UPDATE proveedor_productos" ON public.proveedor_productos
  FOR UPDATE
  USING (auth.role() = 'authenticated_user');

-- DELETE bloqueado en movimientos (no hay policy)
-- DELETE permitido en otras tablas
CREATE POLICY "DELETE proveedores" ON public.proveedores
  FOR DELETE
  USING (auth.role() = 'authenticated_user');

CREATE POLICY "DELETE ordenes_compra" ON public.ordenes_compra
  FOR DELETE
  USING (auth.role() = 'authenticated_user');

CREATE POLICY "DELETE proveedor_productos" ON public.proveedor_productos
  FOR DELETE
  USING (auth.role() = 'authenticated_user');

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
