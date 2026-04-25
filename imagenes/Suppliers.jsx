
// ─── Suppliers Screen ─────────────────────────────────────────────────────────
const SuppliersScreen = ({ showToast }) => {
  const [suppliers, setSuppliers] = React.useState([...window.DB.suppliers]);
  const [search, setSearch] = React.useState('');
  const [modal, setModal] = React.useState(null);
  const [detailTab, setDetailTab] = React.useState('info');
  const [form, setForm] = React.useState({});
  const [errors, setErrors] = React.useState({});

  const filtered = suppliers.filter(s =>
    !search || s.company.toLowerCase().includes(search.toLowerCase()) || s.contact.toLowerCase().includes(search.toLowerCase())
  );

  const openNew = () => { setForm({ company: '', contact: '', email: '', phone: '', address: '', products: [] }); setErrors({}); setModal({ mode: 'new' }); };
  const openEdit = (s) => { setForm({ ...s, products: [...(s.products || [])] }); setErrors({}); setModal({ mode: 'edit', supplier: s }); };
  const openDelete = (s) => setModal({ mode: 'delete', supplier: s });
  const openDetail = (s) => { setDetailTab('info'); setModal({ mode: 'detail', supplier: s }); };

  const validate = () => {
    const e = {};
    if (!form.company?.trim()) e.company = 'Nombre de empresa requerido';
    if (form.email && !/\S+@\S+\.\S+/.test(form.email)) e.email = 'Email inválido';
    return e;
  };

  const save = () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    if (modal.mode === 'new') {
      const ns = { ...form, id: window.DB.uid(), totalSpent: 0 };
      window.DB.suppliers.push(ns);
      setSuppliers([...window.DB.suppliers]);
      showToast('Proveedor creado', 'success');
    } else {
      const idx = window.DB.suppliers.findIndex(s => s.id === form.id);
      window.DB.suppliers[idx] = { ...form };
      setSuppliers([...window.DB.suppliers]);
      showToast('Proveedor actualizado', 'success');
    }
    setModal(null);
  };

  const remove = () => {
    window.DB.suppliers = window.DB.suppliers.filter(s => s.id !== modal.supplier.id);
    setSuppliers([...window.DB.suppliers]);
    showToast('Proveedor eliminado', 'success');
    setModal(null);
  };

  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const toggleProduct = (pid) => {
    setForm(prev => {
      const ps = prev.products || [];
      return { ...prev, products: ps.includes(pid) ? ps.filter(x => x !== pid) : [...ps, pid] };
    });
  };

  const supplierPurchases = (sid) => window.DB.purchases.filter(p => p.supplierId === sid);

  const FormFields = () => (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
      <div style={{ gridColumn: '1 / -1' }}>
        <Input label="Nombre de la Empresa *" value={form.company || ''} onChange={e => f('company', e.target.value)} error={errors.company} placeholder="Ej. Carnes del Norte S.A." />
      </div>
      <Input label="Nombre del Contacto" value={form.contact || ''} onChange={e => f('contact', e.target.value)} placeholder="Ej. Roberto Garza" />
      <Input label="Email" type="email" value={form.email || ''} onChange={e => f('email', e.target.value)} error={errors.email} placeholder="contacto@empresa.mx" />
      <Input label="Teléfono" value={form.phone || ''} onChange={e => f('phone', e.target.value)} placeholder="8181234567" />
      <div style={{ gridColumn: '1 / -1' }}>
        <Textarea label="Dirección" value={form.address || ''} onChange={e => f('address', e.target.value)} placeholder="Calle, Ciudad, Estado" style={{ minHeight: 60 }} />
      </div>
      <div style={{ gridColumn: '1 / -1' }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: C.textSub, marginBottom: 8 }}>Productos que surte</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, maxHeight: 130, overflowY: 'auto', padding: 4 }}>
          {window.DB.products.map(p => {
            const sel = (form.products || []).includes(p.id);
            return (
              <div key={p.id} onClick={() => toggleProduct(p.id)} style={{
                padding: '5px 12px', borderRadius: 20, border: `1.5px solid ${sel ? C.green : C.border}`,
                background: sel ? C.green + '18' : C.surface, cursor: 'pointer', fontSize: 12, fontWeight: sel ? 600 : 400,
                color: sel ? C.green : C.textSub, transition: 'all 0.2s ease'
              }}>{p.name}</div>
            );
          })}
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ padding: 28 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 22 }}>
        <SearchBar value={search} onChange={setSearch} placeholder="Buscar proveedor..." />
        <div style={{ marginLeft: 'auto' }}>
          <Btn icon="plus" variant="success" onClick={openNew}>Nuevo Proveedor</Btn>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
        {filtered.map(s => {
          const prodCount = (s.products || []).length;
          const purCount = supplierPurchases(s.id).length;
          return (
            <div key={s.id} style={{ background: C.surface, borderRadius: 10, boxShadow: `0 2px 8px ${C.shadow}`, padding: 22, display: 'flex', flexDirection: 'column', gap: 12, transition: 'transform 0.15s, box-shadow 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.1)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)'; }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <div style={{ width: 44, height: 44, background: C.navy + '18', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name="suppliers" size={20} color={C.navy} />
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={() => openEdit(s)} style={{ background: C.navy + '18', border: 'none', borderRadius: 6, padding: '6px 8px', cursor: 'pointer' }}><Icon name="edit" size={13} color={C.navy} /></button>
                  <button onClick={() => openDelete(s)} style={{ background: '#BA302618', border: 'none', borderRadius: 6, padding: '6px 8px', cursor: 'pointer' }}><Icon name="trash" size={13} color="#BA3026" /></button>
                </div>
              </div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: C.textMain, marginBottom: 2 }}>{s.company}</div>
                <div style={{ fontSize: 12, color: C.textSub }}>{s.contact}</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                {s.email && <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, color: C.textSub }}><Icon name="user" size={12} color={C.textMuted} />{s.email}</div>}
                {s.phone && <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, color: C.textSub }}><Icon name="invoice" size={12} color={C.textMuted} />{s.phone}</div>}
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <Badge label={`${prodCount} productos`} color={C.green + '18'} textColor={C.green} />
                <Badge label={`${purCount} compras`} color={C.navy + '18'} textColor={C.navy} />
              </div>
              <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: 11, color: C.textMuted }}>Gasto total</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: C.terracota }}>{fmt.money(s.totalSpent)}</div>
                </div>
                <Btn variant="secondary" small onClick={() => openDetail(s)}>Ver detalles</Btn>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: 60, color: C.textMuted }}>
            <Icon name="suppliers" size={40} color={C.border} /><div style={{ marginTop: 12 }}>No se encontraron proveedores</div>
          </div>
        )}
      </div>

      {/* New/Edit Modal */}
      <Modal open={modal?.mode === 'new' || modal?.mode === 'edit'} onClose={() => setModal(null)}
        title={modal?.mode === 'new' ? 'Nuevo Proveedor' : `Editar: ${modal?.supplier?.company}`} width={620}
        footer={<><Btn variant="ghost" onClick={() => setModal(null)}>Cancelar</Btn><Btn variant="success" onClick={save}>Guardar</Btn></>}>
        <FormFields />
      </Modal>

      {/* Delete */}
      <ConfirmModal open={modal?.mode === 'delete'} onClose={() => setModal(null)} onConfirm={remove}
        title="Eliminar Proveedor" message={`¿Eliminar a "${modal?.supplier?.company}"?`} />

      {/* Detail Modal */}
      <Modal open={modal?.mode === 'detail'} onClose={() => setModal(null)}
        title={modal?.supplier?.company} width={680}
        footer={<Btn variant="ghost" onClick={() => setModal(null)}>Cerrar</Btn>}>
        {modal?.mode === 'detail' && (() => {
          const s = modal.supplier;
          const purs = supplierPurchases(s.id);
          const prods = window.DB.products.filter(p => (s.products || []).includes(p.id));
          return (
            <div>
              <div style={{ display: 'flex', gap: 0, marginBottom: 20, borderBottom: `1px solid ${C.border}` }}>
                {['info','compras','productos'].map(tab => (
                  <button key={tab} onClick={() => setDetailTab(tab)} style={{
                    padding: '10px 20px', border: 'none', background: 'none', cursor: 'pointer',
                    fontFamily: 'inherit', fontSize: 13, fontWeight: detailTab === tab ? 700 : 400,
                    color: detailTab === tab ? C.terracota : C.textSub, borderBottom: `2.5px solid ${detailTab === tab ? C.terracota : 'transparent'}`, transition: 'all 0.2s ease'
                  }}>{tab.charAt(0).toUpperCase() + tab.slice(1)}</button>
                ))}
              </div>
              {detailTab === 'info' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  {[['Empresa', s.company],['Contacto', s.contact],['Email', s.email],['Teléfono', s.phone],['Dirección', s.address, true]].map(([l, v, full]) => v ? (
                    <div key={l} style={{ gridColumn: full ? '1/-1' : undefined }}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: C.textMuted, marginBottom: 4 }}>{l}</div>
                      <div style={{ fontSize: 13, color: C.textMain }}>{v}</div>
                    </div>
                  ) : null)}
                </div>
              )}
              {detailTab === 'compras' && (
                <Table columns={[
                  { key: 'date', label: 'Fecha', render: v => fmt.date(v) },
                  { key: 'folio', label: 'Folio' },
                  { key: 'products', label: '# Productos', align: 'center', render: v => v.length },
                  { key: 'total', label: 'Total', align: 'right', render: v => <b>{fmt.money(v)}</b> },
                ]} rows={purs} emptyMessage="Sin compras registradas" />
              )}
              {detailTab === 'productos' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {prods.map(p => (
                    <div key={p.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: C.bg, borderRadius: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <CategoryBadge category={p.category} />
                        <span style={{ fontSize: 13, fontWeight: 600, color: C.textMain }}>{p.name}</span>
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 600, color: C.terracota }}>{fmt.money(p.lastPrice)} / {p.unit}</span>
                    </div>
                  ))}
                  {prods.length === 0 && <div style={{ color: C.textMuted, textAlign: 'center', padding: 24 }}>Sin productos asignados</div>}
                </div>
              )}
            </div>
          );
        })()}
      </Modal>
    </div>
  );
};

window.SuppliersScreen = SuppliersScreen;
