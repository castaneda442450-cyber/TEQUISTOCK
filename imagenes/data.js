
// ─── TEQUISTOCK Mock Data ───────────────────────────────────────────────────

const CATEGORIES = ['Carnes', 'Lácteos', 'Verduras', 'Bebidas', 'Granos', 'Condimentos', 'Mariscos'];

const CATEGORY_COLORS = {
  'Carnes':      '#BA3026',
  'Lácteos':     '#C2972E',
  'Verduras':    '#106653',
  'Bebidas':     '#0B4455',
  'Granos':      '#7B5E2A',
  'Condimentos': '#5D4037',
  'Mariscos':    '#0288D1'
};

const MERMA_TYPES = ['Vencimiento', 'Mala calidad', 'Accidente', 'Otro'];
const MERMA_COLORS = { 'Vencimiento': '#BA3026', 'Mala calidad': '#E67E22', 'Accidente': '#C2972E', 'Otro': '#78909C' };

let nextId = 100;
const uid = () => ++nextId;

const PRODUCTS = [
  { id: 1,  name: 'Arrachera de Res',    category: 'Carnes',      unit: 'kg',  stock: 12,  minStock: 20, lastPrice: 189 },
  { id: 2,  name: 'Pechuga de Pollo',    category: 'Carnes',      unit: 'kg',  stock: 30,  minStock: 15, lastPrice: 78  },
  { id: 3,  name: 'Costilla de Cerdo',   category: 'Carnes',      unit: 'kg',  stock: 8,   minStock: 10, lastPrice: 145 },
  { id: 4,  name: 'Camarón U15',         category: 'Mariscos',    unit: 'kg',  stock: 5,   minStock: 8,  lastPrice: 320 },
  { id: 5,  name: 'Pulpo',               category: 'Mariscos',    unit: 'kg',  stock: 3,   minStock: 5,  lastPrice: 280 },
  { id: 6,  name: 'Queso Oaxaca',        category: 'Lácteos',     unit: 'kg',  stock: 18,  minStock: 10, lastPrice: 135 },
  { id: 7,  name: 'Crema Ácida',         category: 'Lácteos',     unit: 'L',   stock: 20,  minStock: 10, lastPrice: 45  },
  { id: 8,  name: 'Leche Entera',        category: 'Lácteos',     unit: 'L',   stock: 15,  minStock: 12, lastPrice: 22  },
  { id: 9,  name: 'Tomate Saladet',      category: 'Verduras',    unit: 'kg',  stock: 25,  minStock: 15, lastPrice: 18  },
  { id: 10, name: 'Cebolla Blanca',      category: 'Verduras',    unit: 'kg',  stock: 30,  minStock: 10, lastPrice: 12  },
  { id: 11, name: 'Chile Jalapeño',      category: 'Verduras',    unit: 'kg',  stock: 4,   minStock: 5,  lastPrice: 35  },
  { id: 12, name: 'Aguacate Hass',       category: 'Verduras',    unit: 'kg',  stock: 20,  minStock: 15, lastPrice: 55  },
  { id: 13, name: 'Cilantro',            category: 'Verduras',    unit: 'kg',  stock: 2,   minStock: 3,  lastPrice: 25  },
  { id: 14, name: 'Tequila Blanco',      category: 'Bebidas',     unit: 'L',   stock: 12,  minStock: 6,  lastPrice: 185 },
  { id: 15, name: 'Mezcal Artesanal',    category: 'Bebidas',     unit: 'L',   stock: 8,   minStock: 4,  lastPrice: 320 },
  { id: 16, name: 'Cerveza Oscura',      category: 'Bebidas',     unit: 'pzas',stock: 96,  minStock: 48, lastPrice: 18  },
  { id: 17, name: 'Refresco 2L',         category: 'Bebidas',     unit: 'pzas',stock: 24,  minStock: 12, lastPrice: 28  },
  { id: 18, name: 'Arroz Morelos',       category: 'Granos',      unit: 'kg',  stock: 50,  minStock: 20, lastPrice: 22  },
  { id: 19, name: 'Frijol Negro',        category: 'Granos',      unit: 'kg',  stock: 40,  minStock: 20, lastPrice: 28  },
  { id: 20, name: 'Masa de Maíz',        category: 'Granos',      unit: 'kg',  stock: 60,  minStock: 30, lastPrice: 15  },
  { id: 21, name: 'Aceite de Maíz',      category: 'Condimentos', unit: 'L',   stock: 20,  minStock: 10, lastPrice: 38  },
  { id: 22, name: 'Sal de Mar',          category: 'Condimentos', unit: 'kg',  stock: 15,  minStock: 5,  lastPrice: 12  },
  { id: 23, name: 'Limón Persa',         category: 'Condimentos', unit: 'kg',  stock: 18,  minStock: 10, lastPrice: 22  },
];

const SUPPLIERS = [
  { id: 1, company: 'Carnes del Norte S.A.',    contact: 'Roberto Garza',      email: 'rgarza@carnesnorte.mx',    phone: '8181234567', address: 'Av. Industrial 450, Monterrey, NL', products: [1,2,3], totalSpent: 45200 },
  { id: 2, company: 'Mariscos La Flota',        contact: 'Ana Pescador',       email: 'ventas@laflota.mx',        phone: '6681234567', address: 'Puerto Norte 12, Mazatlán, SIN',    products: [4,5],   totalSpent: 18700 },
  { id: 3, company: 'Lácteos La Vaquita',       contact: 'María Flores',       email: 'mflores@lavaquita.com',    phone: '3331234567', address: 'Ranchero 33, Guadalajara, JAL',    products: [6,7,8], totalSpent: 9800  },
  { id: 4, company: 'Verduras Frescas MX',      contact: 'Juan Campesino',     email: 'jcampesino@verdurasfrex.mx', phone: '5551234567', address: 'Mercado Central, CDMX',         products: [9,10,11,12,13], totalSpent: 6400 },
  { id: 5, company: 'Distribuidora de Bebidas', contact: 'Carlos Tequilero',   email: 'ctequilero@distbeb.mx',    phone: '3341234567', address: 'Blvd. Tequila 100, Arandas, JAL', products: [14,15,16,17], totalSpent: 38900 },
  { id: 6, company: 'Abarrotes El Mercado',     contact: 'Lupita Morales',     email: 'lmorales@elmercado.mx',    phone: '5556781234', address: 'Mercado Tepito, CDMX',            products: [18,19,20,21,22,23], totalSpent: 7200 },
];

// Generate purchases for last 60 days
const today = new Date();
const daysAgo = (n) => { const d = new Date(today); d.setDate(d.getDate()-n); return d.toISOString().split('T')[0]; };

const PURCHASES = [
  { id: 1,  date: daysAgo(1),  folio: 'F-2024-089', supplierId: 1, products: [{productId:1,qty:20,price:189},{productId:2,qty:30,price:78}], total: 6120, hasInvoice: true },
  { id: 2,  date: daysAgo(2),  folio: 'F-2024-088', supplierId: 5, products: [{productId:14,qty:6,price:185},{productId:15,qty:4,price:320}], total: 2390, hasInvoice: true },
  { id: 3,  date: daysAgo(3),  folio: 'F-2024-087', supplierId: 4, products: [{productId:9,qty:20,price:18},{productId:10,qty:25,price:12},{productId:12,qty:15,price:55}], total: 1485, hasInvoice: false },
  { id: 4,  date: daysAgo(5),  folio: 'F-2024-086', supplierId: 2, products: [{productId:4,qty:8,price:320},{productId:5,qty:5,price:280}], total: 3960, hasInvoice: true },
  { id: 5,  date: daysAgo(7),  folio: 'F-2024-085', supplierId: 3, products: [{productId:6,qty:10,price:135},{productId:7,qty:15,price:45}], total: 2025, hasInvoice: true },
  { id: 6,  date: daysAgo(8),  folio: 'F-2024-084', supplierId: 1, products: [{productId:3,qty:12,price:145}], total: 1740, hasInvoice: true },
  { id: 7,  date: daysAgo(10), folio: 'F-2024-083', supplierId: 6, products: [{productId:18,qty:30,price:22},{productId:19,qty:25,price:28},{productId:20,qty:40,price:15}], total: 2260, hasInvoice: false },
  { id: 8,  date: daysAgo(12), folio: 'F-2024-082', supplierId: 5, products: [{productId:16,qty:120,price:18},{productId:17,qty:30,price:28}], total: 3000, hasInvoice: true },
  { id: 9,  date: daysAgo(14), folio: 'F-2024-081', supplierId: 1, products: [{productId:1,qty:15,price:185},{productId:2,qty:20,price:76}], total: 4295, hasInvoice: true },
  { id: 10, date: daysAgo(16), folio: 'F-2024-080', supplierId: 4, products: [{productId:11,qty:8,price:32},{productId:13,qty:5,price:22}], total: 366, hasInvoice: false },
  { id: 11, date: daysAgo(18), folio: 'F-2024-079', supplierId: 2, products: [{productId:4,qty:10,price:315}], total: 3150, hasInvoice: true },
  { id: 12, date: daysAgo(21), folio: 'F-2024-078', supplierId: 5, products: [{productId:14,qty:8,price:182},{productId:15,qty:3,price:315}], total: 2401, hasInvoice: true },
  { id: 13, date: daysAgo(25), folio: 'F-2024-077', supplierId: 3, products: [{productId:6,qty:12,price:132},{productId:8,qty:20,price:22}], total: 2024, hasInvoice: true },
  { id: 14, date: daysAgo(28), folio: 'F-2024-076', supplierId: 6, products: [{productId:21,qty:15,price:36},{productId:22,qty:10,price:12},{productId:23,qty:20,price:20}], total: 1060, hasInvoice: true },
];

const CONSUMPTIONS = [
  { id: 1, date: daysAgo(0), productId: 2,  qty: 3,  unit: 'kg',  value: 234,  user: 'Chef Martínez', notes: 'Servicio del día' },
  { id: 2, date: daysAgo(0), productId: 9,  qty: 5,  unit: 'kg',  value: 90,   user: 'Chef Martínez', notes: '' },
  { id: 3, date: daysAgo(0), productId: 18, qty: 8,  unit: 'kg',  value: 176,  user: 'Sous Chef Luna', notes: 'Arroz para banquete' },
  { id: 4, date: daysAgo(1), productId: 1,  qty: 4,  unit: 'kg',  value: 756,  user: 'Chef Martínez', notes: '' },
  { id: 5, date: daysAgo(1), productId: 12, qty: 6,  unit: 'kg',  value: 330,  user: 'Sous Chef Luna', notes: 'Guacamole especial' },
  { id: 6, date: daysAgo(2), productId: 16, qty: 24, unit: 'pzas',value: 432,  user: 'Bar Manager', notes: 'Fin de semana' },
  { id: 7, date: daysAgo(2), productId: 14, qty: 2,  unit: 'L',   value: 370,  user: 'Bar Manager', notes: '' },
  { id: 8, date: daysAgo(3), productId: 3,  qty: 5,  unit: 'kg',  value: 725,  user: 'Chef Martínez', notes: '' },
  { id: 9, date: daysAgo(3), productId: 10, qty: 8,  unit: 'kg',  value: 96,   user: 'Sous Chef Luna', notes: '' },
  { id: 10,date: daysAgo(4), productId: 4,  qty: 3,  unit: 'kg',  value: 960,  user: 'Chef Martínez', notes: 'Camarones al ajillo' },
];

const MERMA = [
  { id: 1, date: daysAgo(2), productId: 13, qty: 1.5, type: 'Vencimiento',  value: 37.5,  reason: 'Cilantro vencido en refrigerador' },
  { id: 2, date: daysAgo(4), productId: 5,  qty: 2,   type: 'Mala calidad', value: 560,   reason: 'Pulpo en mal estado al recibirlo' },
  { id: 3, date: daysAgo(5), productId: 7,  qty: 3,   type: 'Accidente',    value: 135,   reason: 'Derrame en cocina' },
  { id: 4, date: daysAgo(7), productId: 11, qty: 1,   type: 'Vencimiento',  value: 35,    reason: 'Jalapeño vencido' },
  { id: 5, date: daysAgo(10),productId: 1,  qty: 1.5, type: 'Mala calidad', value: 283.5, reason: 'Res con mal color al descongelar' },
  { id: 6, date: daysAgo(12),productId: 8,  qty: 4,   type: 'Accidente',    value: 88,    reason: 'Botella rota' },
  { id: 7, date: daysAgo(15),productId: 9,  qty: 3,   type: 'Vencimiento',  value: 54,    reason: 'Tomate pasado' },
];

// Spending trend (last 30 days) for dashboard chart
const SPENDING_TREND = Array.from({length: 30}, (_, i) => {
  const d = new Date(today); d.setDate(d.getDate() - (29 - i));
  const label = `${d.getDate()}/${d.getMonth()+1}`;
  const base = 1200 + Math.sin(i*0.4)*400;
  return {
    label,
    compras: Math.round(base + Math.random()*600),
    merma:   Math.round(80  + Math.random()*120),
  };
});

// Expose globally
window.DB = {
  CATEGORIES, CATEGORY_COLORS, MERMA_TYPES, MERMA_COLORS,
  products: [...PRODUCTS],
  suppliers: [...SUPPLIERS],
  purchases: [...PURCHASES],
  consumptions: [...CONSUMPTIONS],
  merma: [...MERMA],
  SPENDING_TREND,
  uid,
  getProduct: (id) => window.DB.products.find(p => p.id === id),
  getSupplier: (id) => window.DB.suppliers.find(s => s.id === id),
};
