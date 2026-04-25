
// ─── Purchases Screen ─────────────────────────────────────────────────────────
const PurchasesScreen = ({ showToast }) => {
  const [purchases, setPurchases] = React.useState([...window.DB.purchases]);
  const [expanded, setExpanded] = React.useState(null);
  const [modal, setModal] = React.useState(null);
  const [form, setForm] = React.useState({});
  const [lines, setLines] = React.useState([]);
  const [filterSupp, setFilterSupp] = React.useState('');
  const [filterFrom, setFilterFrom] = React.useState('');
  const [filterTo, setFilterTo] = React.useState('');

  const filtered = purchases.filter(p => {
    if (filterSupp && p.supplierId !== parseInt(filterSupp)) return false;
    if (filterFrom && p.date < filterFrom) return false;
    if (filterTo && p.date > filterTo) return false;
    return true;
  }).sort((a, b) => b.date.localeCompare(a.date));

  const openNew = () => {
    setForm({ date: new Date().toISOString().split('T')[0], supplierId: '', folio: '', hasInvoice: false });
    setLines([{ productId: '', qty: '', price: '' }]);
    setModal({ mode: 'new' });
  };

  const openView = (p) => setModal({ mode: 'view', purchase: p });
  const openEdit = (p) => {
    setForm({ ...p, supplierId: p.supplierId.toString() });
    setLines(p.products.map(l => ({ ...l, qty: l.qty.toString(), price: l.price.toString() })));
    setModal({ mode: 'edit', purchase: p });
  };
  const openDelete = (p) => setModal({ mode: 'delete', purchase: p });

  const addLine = () => setLines(ls => [...ls, { productId: '', qty: '', price: '' }]);
  const removeLine = (i) => setLines(ls => ls.filter((_, idx) => idx !== i));
  const updateLine = (i, k, v) => setLines(ls => ls.map((l, idx) => idx === i ? { ...l, [k]: v } : l));

  const total = lines.reduce((s, l) => s + (parseFloat(l.qty) || 0) * (parseFloat(l.price) || 0), 0);

  const save = () => {
    if (!form.supplierId || !form.date) { showToast('Completa los campos requeridos', 'error'); return; }
    const validLines = lines.filter(l => l.productId && l.qty && l.price);
    if (!validLines.length) { showToast('Agrega al menos un producto', 'error'); return; }
    const prods = validLines.map(l => ({ productId: parseInt(l.productId), qty: parseFloat(l.qty), price: parseFloat(l.price) }));
    if (modal.mode === 'new') {
      const np = { ...form, id: window.DB.uid(), supplierId: parseInt(form.supplierId), products: prods, total };
      window.DB.purchases.push(np);
      // Update stock
      prods.forEach(l => {
        const p = window.DB.products.find(pr => pr.id === l.productId);
        if (p) { p.stock = +(p.stock + l.qty).toFixed(3); p.lastPrice = l.price; }
      });
      setPurchases([...window.DB.purchases]);
      showToast('Compra registrada — Stock actualizado ✓', 'success');
    } else {
      const idx = window.DB.purchases.findIndex(p => p.id === modal.purchase.id);
      window.DB.purchases[idx] = { ...form, supplierId: parseInt(form.supplierId), products: prods, total, id: modal.purchase.id };
      setPurchases([...window.DB.purchases]);
      showToast('Compra actualizada', 'success');
    }
    setModal(null);
  };

  const remove = () => {
    window.DB.purchases = window.DB.purchases.filter(p => p.id !== modal.purchase.id);
    setPurchases([...window.DB.purchases]);
    showToast('Compra eliminada', 'success');
    setModal(null);
  };

  const LineForm = ({ line, idx }) => {
    const suppId = parseInt(form.supplierId);
    const supp = window.DB.suppliers.find(s => s.id === suppId);
    const availProds = supp ? window.DB.products.filter(p => (supp.products || []).includes(p.id)) : window.DB.products;
    return (
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: 8, alignItems: 'end', marginBottom: 8 }}>
        <div>
          {idx === 0 && <div style={{ fontSize: 11, fontWeight: 600, color: C.textSub, marginBottom: 5 }}>Producto</div>}
          <select value={line.productId} onChange={e => updateLine(idx, 'productId', e.target.value)}
            style={{ ...inputStyle(false), padding: '9px 12px', ...SELECT_STYLE(10) }}>
            <option value="">Seleccionar...</option>
            {availProds.map(p => <option key={p.id} value={p.id}>{p.name} ({p.unit})</option>)}
          </select>
        </div>
        <div>
          {idx === 0 && <div style={{ fontSize: 11, fontWeight: 600, color: C.textSub, marginBottom: 5 }}>Cantidad</div>}
          <input type="number" value={line.qty} onChange={e => updateLine(idx, 'qty', e.target.value)} placeholder="0"
            style={{ ...inputStyle(false), padding: '9px 12px' }}
            onFocus={e => { e.target.style.borderColor = C.terracota; }} onBlur={e => { e.target.style.borderColor = C.border; }} />
        </div>
        <div>
          {idx === 0 && <div style={{ fontSize: 11, fontWeight: 600, color: C.textSub, marginBottom: 5 }}>Precio Unit.</div>}
          <input type="number" value={line.price} onChange={e => updateLine(idx, 'price', e.target.value)} placeholder="0.00"
            style={{ ...inputStyle(false), padding: '9px 12px' }}
            onFocus={e => { e.target.style.borderColor = C.terracota; }} onBlur={e => { e.target.style.borderColor = C.border; }} />
        </div>
        <div style={{ paddingBottom: 0 }}>
          {idx === 0 && <div style={{ fontSize: 11, color: 'transparent', marginBottom: 5 }}>X</div>}
          <button onClick={() => removeLine(idx)} style={{ background: '#BA302618', border: 'none', borderRadius: 6, padding: '9px 10px', cursor: 'pointer' }}>
            <Icon name="x" size={14} color="#BA3026" />
          </button>
        </div>
      </div>
    );
  };

  const cols = [
    { key: 'date', label: 'Fecha', render: v => <span style={{ fontSize: 12 }}>{fmt.date(v)}</span> },
    { key: 'folio', label: 'Folio', render: v => <span style={{ fontFamily: 'monospace', fontSize: 12, color: C.textSub }}>{v || '—'}</span> },
    { key: 'supplierId', label: 'Proveedor', render: v => <span style={{ fontSize: 13, fontWeight: 500 }}>{window.DB.getSupplier(v)?.company || '—'}</span> },
    { key: 'products', label: '# Productos', align: 'center', render: v => <Badge label={v.length} color={C.navy + '18'} textColor={C.navy} /> },
    { key: 'total', label: 'Total', align: 'right', render: v => <span style={{ fontWeight: 700, fontSize: 14, color: C.textMain }}>{fmt.money(v)}</span> },
    { key: 'hasInvoice', label: 'Factura', align: 'center', render: v => v ? <Icon name="invoice" size={16} color={C.green} /> : <span style={{ color: C.textMuted, fontSize: 12 }}>—</span> },
    { key: 'id', label: 'Acciones', align: 'center', render: (_, row) => (
      <div style={{ display: 'flex', gap: 5, justifyContent: 'center' }}>
        <button onClick={e => { e.stopPropagation(); openView(row); }} style={{ background: C.green + '18', border: 'none', borderRadius: 6, padding: '6px 8px', cursor: 'pointer' }}><Icon name="eye" size={13} color={C.green} /></button>
        <button onClick={e => { e.stopPropagation(); openEdit(row); }} style={{ background: C.navy + '18', border: 'none', borderRadius: 6, padding: '6px 8px', cursor: 'pointer' }}><Icon name="edit" size={13} color={C.navy} /></button>
        <button onClick={e => { e.stopPropagation(); openDelete(row); }} style={{ background: '#BA302618', border: 'none', borderRadius: 6, padding: '6px 8px', cursor: 'pointer' }}><Icon name="trash" size={13} color="#BA3026" /></button>
      </div>
    )},
  ];

  return (
    <div style={{ padding: 28 }}>
      {/* Filters */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 22, flexWrap: 'wrap' }}>
        <input type="date" value={filterFrom} onChange={e => setFilterFrom(e.target.value)} style={{ ...inputStyle(false), width: 150, padding: '9px 12px' }} />
        <span style={{ color: C.textMuted, fontSize: 13 }}>a</span>
        <input type="date" value={filterTo} onChange={e => setFilterTo(e.target.value)} style={{ ...inputStyle(false), width: 150, padding: '9px 12px' }} />
        <select value={filterSupp} onChange={e => setFilterSupp(e.target.value)}
          style={{ ...inputStyle(false), padding: '9px 12px', ...SELECT_STYLE(10) }}>
          <option value="">Todos los proveedores</option>
          {window.DB.suppliers.map(s => <option key={s.id} value={s.id}>{s.company}</option>)}
        </select>
        {(filterFrom || filterTo || filterSupp) && (
          <Btn variant="ghost" small onClick={() => { setFilterFrom(''); setFilterTo(''); setFilterSupp(''); }}>Limpiar</Btn>
        )}
        <div style={{ marginLeft: 'auto' }}>
          <Btn icon="plus" variant="success" onClick={openNew}>Registrar Compra</Btn>
        </div>
      </div>

      <div style={{ background: C.surface, borderRadius: 10, boxShadow: `0 2px 8px ${C.shadow}`, overflow: 'hidden' }}>
        <div style={{ padding: '14px 20px', borderBottom: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: C.textMain }}>Registro de Compras</span>
          <span style={{ fontSize: 12, color: C.textMuted }}>{filtered.length} compra(s) · Total: {fmt.money(filtered.reduce((s, p) => s + p.total, 0))}</span>
        </div>
        {/* Custom rows with expand */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: C.surfaceAlt }}>
                <th style={{ padding: '11px 14px', width: 32 }}></th>
                {cols.map((c, i) => <th key={i} style={{ padding: '11px 14px', textAlign: c.align || 'left', fontWeight: 600, color: C.textSub, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.4, borderBottom: `1.5px solid ${C.border}` }}>{c.label}</th>)}
              </tr>
            </thead>
            <tbody>
              {filtered.map((row, ri) => (
                <React.Fragment key={row.id}>
                  <tr style={{ borderBottom: `1px solid ${C.border}`, background: ri % 2 === 0 ? C.surface : C.surfaceAlt, cursor: 'pointer', transition: 'background 0.1s' }}
                    onClick={() => setExpanded(expanded === row.id ? null : row.id)}
                    onMouseEnter={e => e.currentTarget.style.background = C.surfaceHover}
                    onMouseLeave={e => e.currentTarget.style.background = ri % 2 === 0 ? C.surface : C.surfaceAlt}>
                    <td style={{ padding: '11px 14px', color: C.textMuted }}>
                      <Icon name={expanded === row.id ? 'chevronUp' : 'chevronDown'} size={14} />
                    </td>
                    {cols.map((col, ci) => (
                      <td key={ci} style={{ padding: '11px 14px', textAlign: col.align || 'left', verticalAlign: 'middle' }}>
                        {col.render ? col.render(row[col.key], row) : row[col.key]}
                      </td>
                    ))}
                  </tr>
                  {expanded === row.id && (
                    <tr style={{ background: C.surfaceAlt }}>
                      <td colSpan={cols.length + 1} style={{ padding: '12px 24px 16px' }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: C.textSub, marginBottom: 10 }}>DETALLE DE PRODUCTOS</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          {row.products.map((l, li) => {
                            const prod = window.DB.getProduct(l.productId);
                            return (
                              <div key={li} style={{ display: 'flex', alignItems: 'center', gap: 12, background: C.surface, borderRadius: 6, padding: '8px 14px' }}>
                                <CategoryBadge category={prod?.category || '—'} />
                                <span style={{ flex: 1, fontSize: 13, fontWeight: 500 }}>{prod?.name || 'Producto'}</span>
                                <span style={{ fontSize: 12, color: C.textSub }}>{l.qty} {prod?.unit}</span>
                                <span style={{ fontSize: 12, color: C.textSub }}>× {fmt.money(l.price)}</span>
                                <span style={{ fontSize: 13, fontWeight: 700, color: C.textMain }}>{fmt.money(l.qty * l.price)}</span>
                              </div>
                            );
                          })}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={cols.length + 1} style={{ padding: 40, textAlign: 'center', color: C.textMuted }}>Sin compras registradas</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* New/Edit Modal */}
      <Modal open={modal?.mode === 'new' || modal?.mode === 'edit'} onClose={() => setModal(null)}
        title={modal?.mode === 'new' ? 'Registrar Compra' : 'Editar Compra'} width={780}
        footer={<><Btn variant="ghost" onClick={() => setModal(null)}>Cancelar</Btn><Btn variant="success" onClick={save}>Guardar Compra</Btn></>}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px', marginBottom: 20 }}>
          <Field label="Fecha de Compra *">
            <input type="date" value={form.date || ''} onChange={e => setForm(p => ({ ...p, date: e.target.value }))}
              style={{ ...inputStyle(false), padding: '9px 12px' }}
              onFocus={e => { e.target.style.borderColor = C.terracota; }} onBlur={e => { e.target.style.borderColor = C.border; }} />
          </Field>
          <Select label="Proveedor *" value={form.supplierId || ''} onChange={e => setForm(p => ({ ...p, supplierId: e.target.value }))}>
            <option value="">Seleccionar proveedor...</option>
            {window.DB.suppliers.map(s => <option key={s.id} value={s.id}>{s.company}</option>)}
          </Select>
          <Input label="Folio / # Factura" value={form.folio || ''} onChange={e => setForm(p => ({ ...p, folio: e.target.value }))} placeholder="F-2024-090" />
          <Field label="¿Tiene factura?">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingTop: 8 }}>
              <input type="checkbox" id="hasInv" checked={!!form.hasInvoice} onChange={e => setForm(p => ({ ...p, hasInvoice: e.target.checked }))} />
              <label htmlFor="hasInv" style={{ fontSize: 13, color: C.textMain, cursor: 'pointer' }}>Sí, tiene factura</label>
            </div>
          </Field>
        </div>

        <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 16, marginBottom: 10 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.textMain, marginBottom: 12 }}>Productos</div>
          {lines.map((line, idx) => <LineForm key={idx} line={line} idx={idx} />)}
          <Btn variant="ghost" small icon="plus" onClick={addLine} style={{ marginTop: 4 }}>Agregar producto</Btn>
        </div>

        <div style={{ marginTop: 16, padding: '14px 18px', background: C.surfaceAlt, borderRadius: 8, display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 16 }}>
          <span style={{ fontSize: 13, color: C.textSub, fontWeight: 600 }}>TOTAL GENERAL</span>
          <span style={{ fontSize: 22, fontWeight: 800, color: C.terracota }}>{fmt.money(total)}</span>
        </div>
      </Modal>

      {/* View Modal */}
      <Modal open={modal?.mode === 'view'} onClose={() => setModal(null)} title={`Compra ${modal?.purchase?.folio || '#' + modal?.purchase?.id}`} width={560}
        footer={<Btn variant="ghost" onClick={() => setModal(null)}>Cerrar</Btn>}>
        {modal?.purchase && (() => {
          const p = modal.purchase;
          const supp = window.DB.getSupplier(p.supplierId);
          return (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
                {[['Fecha', fmt.date(p.date)],['Proveedor', supp?.company],['Folio', p.folio || '—'],['Factura', p.hasInvoice ? 'Sí' : 'No']].map(([l,v]) => (
                  <div key={l}><div style={{ fontSize: 11, color: C.textMuted, fontWeight: 600 }}>{l}</div><div style={{ fontSize: 13, fontWeight: 600, color: C.textMain }}>{v}</div></div>
                ))}
              </div>
              <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 14 }}>
                {p.products.map((l, i) => {
                  const prod = window.DB.getProduct(l.productId);
                  return (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 0', borderBottom: `1px solid ${C.border}` }}>
                      <span style={{ fontSize: 13 }}>{prod?.name}</span>
                      <span style={{ fontSize: 13, color: C.textSub }}>{l.qty} × {fmt.money(l.price)}</span>
                      <span style={{ fontSize: 13, fontWeight: 700 }}>{fmt.money(l.qty * l.price)}</span>
                    </div>
                  );
                })}
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
                  <span style={{ fontSize: 18, fontWeight: 800, color: C.terracota }}>{fmt.money(p.total)}</span>
                </div>
              </div>
            </div>
          );
        })()}
      </Modal>

      <ConfirmModal open={modal?.mode === 'delete'} onClose={() => setModal(null)} onConfirm={remove}
        title="Eliminar Compra" message={`¿Eliminar la compra ${modal?.purchase?.folio || ''}?`} />
    </div>
  );
};

window.PurchasesScreen = PurchasesScreen;
