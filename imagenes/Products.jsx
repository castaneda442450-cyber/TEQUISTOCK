
// ─── Products Screen ──────────────────────────────────────────────────────────
const ProductsScreen = ({ showToast }) => {
  const [products, setProducts] = React.useState([...window.DB.products]);
  const [search, setSearch] = React.useState('');
  const [catFilter, setCatFilter] = React.useState('');
  const [page, setPage] = React.useState(1);
  const [perPage] = React.useState(10);
  const [modal, setModal] = React.useState(null); // null | { mode: 'new'|'edit'|'delete', product? }
  const [form, setForm] = React.useState({});
  const [errors, setErrors] = React.useState({});

  const filtered = products.filter(p =>
    (!search || p.name.toLowerCase().includes(search.toLowerCase())) &&
    (!catFilter || p.category === catFilter)
  );
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  const openNew = () => { setForm({ name: '', category: window.DB.CATEGORIES[0], unit: 'kg', minStock: '', stock: '', lastPrice: '' }); setErrors({}); setModal({ mode: 'new' }); };
  const openEdit = (p) => { setForm({ ...p }); setErrors({}); setModal({ mode: 'edit', product: p }); };
  const openDelete = (p) => setModal({ mode: 'delete', product: p });

  const validate = () => {
    const e = {};
    if (!form.name?.trim()) e.name = 'Nombre requerido';
    if (!form.minStock && form.minStock !== 0) e.minStock = 'Stock mínimo requerido';
    if (!form.lastPrice && form.lastPrice !== 0) e.lastPrice = 'Precio requerido';
    return e;
  };

  const save = () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    if (modal.mode === 'new') {
      const np = { ...form, id: window.DB.uid(), stock: parseFloat(form.stock) || 0, minStock: parseFloat(form.minStock), lastPrice: parseFloat(form.lastPrice) };
      window.DB.products.push(np);
      setProducts([...window.DB.products]);
      showToast('Producto creado correctamente', 'success');
    } else {
      const idx = window.DB.products.findIndex(p => p.id === form.id);
      window.DB.products[idx] = { ...form, minStock: parseFloat(form.minStock), lastPrice: parseFloat(form.lastPrice) };
      setProducts([...window.DB.products]);
      showToast('Producto actualizado', 'success');
    }
    setModal(null);
  };

  const remove = () => {
    window.DB.products = window.DB.products.filter(p => p.id !== modal.product.id);
    setProducts([...window.DB.products]);
    showToast('Producto eliminado', 'success');
    setModal(null);
  };

  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const cols = [
    { key: 'name', label: 'Producto', render: (v, row) => (
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 8, background: (window.DB.CATEGORY_COLORS[row.category] || '#888') + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Icon name="package" size={16} color={window.DB.CATEGORY_COLORS[row.category] || '#888'} />
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: 13, color: C.textMain }}>{v}</div>
            <div style={{ fontSize: 11, color: C.textMuted }}>{row.unit}</div>
          </div>
        </div>
      </div>
    )},
    { key: 'category', label: 'Categoría', render: v => <CategoryBadge category={v} /> },
    { key: 'stock', label: 'Stock Actual', align: 'center', render: (v, row) => (
      <span style={{ fontWeight: 700, fontSize: 14, color: v < row.minStock ? C.terracota : C.green }}>
        {v} <span style={{ fontSize: 11, fontWeight: 400, color: C.textMuted }}>{row.unit}</span>
      </span>
    )},
    { key: 'minStock', label: 'Stock Mínimo', align: 'center', render: (v, row) => <span style={{ fontSize: 13, color: C.textSub }}>{v} {row.unit}</span> },
    { key: 'lastPrice', label: 'Último Precio', align: 'right', render: (v, row) => <span style={{ fontWeight: 600 }}>{fmt.money(v)} / {row.unit}</span> },
    { key: 'id', label: 'Acciones', align: 'center', render: (_, row) => (
      <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
        <button onClick={e => { e.stopPropagation(); openEdit(row); }} style={{ background: C.navy + '18', border: 'none', borderRadius: 6, padding: '6px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
          <Icon name="edit" size={14} color={C.navy} />
        </button>
        <button onClick={e => { e.stopPropagation(); openDelete(row); }} style={{ background: '#BA302618', border: 'none', borderRadius: 6, padding: '6px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
          <Icon name="trash" size={14} color="#BA3026" />
        </button>
      </div>
    )},
  ];

  return (
    <div style={{ padding: 28 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 22, flexWrap: 'wrap' }}>
        <SearchBar value={search} onChange={v => { setSearch(v); setPage(1); }} placeholder="Buscar por nombre..." />
        <select value={catFilter} onChange={e => { setCatFilter(e.target.value); setPage(1); }}
          style={{ ...inputStyle(false), width: 180, padding: "9px 32px 9px 12px", ...SELECT_STYLE(12) }}>
          <option value="">Todas las categorías</option>
          {window.DB.CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <div style={{ marginLeft: 'auto' }}>
          <Btn icon="plus" variant="success" onClick={openNew}>Nuevo Producto</Btn>
        </div>
      </div>

      <div style={{ background: C.surface, borderRadius: 10, boxShadow: `0 2px 8px ${C.shadow}`, overflow: 'hidden' }}>
        <div style={{ padding: '14px 20px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: C.textMain }}>Catálogo de Productos</span>
          <span style={{ fontSize: 12, color: C.textMuted }}>{filtered.length} producto(s)</span>
        </div>
        <Table columns={cols} rows={paginated} emptyMessage="No se encontraron productos" />
        <div style={{ padding: '0 16px' }}>
          <Pagination page={page} total={filtered.length} perPage={perPage} onChange={setPage} />
        </div>
      </div>

      {/* New/Edit Modal */}
      <Modal open={modal?.mode === 'new' || modal?.mode === 'edit'} onClose={() => setModal(null)}
        title={modal?.mode === 'new' ? 'Nuevo Producto' : `Editar: ${modal?.product?.name}`}
        width={580}
        footer={<><Btn variant="ghost" onClick={() => setModal(null)}>Cancelar</Btn><Btn variant="success" onClick={save}>Guardar</Btn></>}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
          <div style={{ gridColumn: '1 / -1' }}>
            <Input label="Nombre del Producto *" value={form.name || ''} onChange={e => f('name', e.target.value)} error={errors.name} placeholder="Ej. Arrachera de Res" />
          </div>
          <Select label="Categoría *" value={form.category || ''} onChange={e => f('category', e.target.value)}>
            {window.DB.CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </Select>
          <Input label="Unidad de Medida" value={form.unit || ''} onChange={e => f('unit', e.target.value)} placeholder="kg, L, pzas..." />
          <Input label="Stock Mínimo *" type="number" value={form.minStock || ''} onChange={e => f('minStock', e.target.value)} error={errors.minStock} placeholder="0" />
          <Input label="Precio Unitario *" type="number" value={form.lastPrice || ''} onChange={e => f('lastPrice', e.target.value)} error={errors.lastPrice} placeholder="0.00" />
          {modal?.mode === 'new' && (
            <div style={{ gridColumn: '1 / -1' }}>
              <Input label="Stock Inicial" type="number" value={form.stock || ''} onChange={e => f('stock', e.target.value)} placeholder="0" />
            </div>
          )}
        </div>
      </Modal>

      {/* Delete Modal */}
      <ConfirmModal open={modal?.mode === 'delete'} onClose={() => setModal(null)} onConfirm={remove}
        title="Eliminar Producto" message={`¿Estás seguro de que deseas eliminar "${modal?.product?.name}"?`} />
    </div>
  );
};

window.ProductsScreen = ProductsScreen;
