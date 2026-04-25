
// ─── Exits Screen (Consumo + Merma) ──────────────────────────────────────────
const ExitsScreen = ({ showToast }) => {
  const [tab, setTab] = React.useState('consumo');
  const [consumptions, setConsumptions] = React.useState([...window.DB.consumptions]);
  const [merma, setMerma] = React.useState([...window.DB.merma]);
  const [modal, setModal] = React.useState(null);
  const [form, setForm] = React.useState({});
  const [errors, setErrors] = React.useState({});

  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));

  // ── Consumo ──────────────────────────────────────────────────────────────────
  const openNewConsumo = () => {
    setForm({ date: new Date().toISOString().split('T')[0], productId: '', qty: '', notes: '' });
    setErrors({});
    setModal({ mode: 'newConsumo' });
  };

  const selectedProd = window.DB.products.find(p => p.id === parseInt(form.productId));
  const consumoValue = selectedProd ? (parseFloat(form.qty) || 0) * selectedProd.lastPrice : 0;

  const saveConsumo = () => {
    const e = {};
    if (!form.productId) e.productId = 'Selecciona un producto';
    if (!form.qty || parseFloat(form.qty) <= 0) e.qty = 'Cantidad inválida';
    if (selectedProd && parseFloat(form.qty) > selectedProd.stock) e.qty = `Stock insuficiente (disponible: ${selectedProd.stock} ${selectedProd.unit})`;
    if (Object.keys(e).length) { setErrors(e); return; }

    const nc = {
      id: window.DB.uid(), date: form.date, productId: parseInt(form.productId),
      qty: parseFloat(form.qty), unit: selectedProd.unit,
      value: consumoValue, user: 'Chef Martínez', notes: form.notes || ''
    };
    window.DB.consumptions.push(nc);
    selectedProd.stock = +(selectedProd.stock - parseFloat(form.qty)).toFixed(3);
    setConsumptions([...window.DB.consumptions]);
    showToast('Consumo registrado', 'success');
    setModal(null);
  };

  // ── Merma ────────────────────────────────────────────────────────────────────
  const openNewMerma = () => {
    setForm({ date: new Date().toISOString().split('T')[0], productId: '', qty: '', type: 'Vencimiento', reason: '' });
    setErrors({});
    setModal({ mode: 'newMerma' });
  };

  const mermaValue = selectedProd ? (parseFloat(form.qty) || 0) * selectedProd.lastPrice : 0;

  const saveMerma = () => {
    const e = {};
    if (!form.productId) e.productId = 'Selecciona un producto';
    if (!form.qty || parseFloat(form.qty) <= 0) e.qty = 'Cantidad inválida';
    if (!form.reason?.trim()) e.reason = 'Motivo requerido';
    if (Object.keys(e).length) { setErrors(e); return; }

    const nm = {
      id: window.DB.uid(), date: form.date, productId: parseInt(form.productId),
      qty: parseFloat(form.qty), type: form.type, value: mermaValue, reason: form.reason
    };
    window.DB.merma.push(nm);
    const prod = window.DB.products.find(p => p.id === parseInt(form.productId));
    if (prod) prod.stock = +(prod.stock - parseFloat(form.qty)).toFixed(3);
    setMerma([...window.DB.merma]);
    showToast('Merma registrada', 'success');
    setModal(null);
  };

  const deleteConsumo = () => {
    window.DB.consumptions = window.DB.consumptions.filter(c => c.id !== modal.item.id);
    setConsumptions([...window.DB.consumptions]);
    showToast('Consumo eliminado', 'success');
    setModal(null);
  };

  const deleteMerma = () => {
    window.DB.merma = window.DB.merma.filter(m => m.id !== modal.item.id);
    setMerma([...window.DB.merma]);
    showToast('Merma eliminada', 'success');
    setModal(null);
  };

  const consumoCols = [
    { key: 'date', label: 'Fecha', render: v => <span style={{ fontSize: 12 }}>{fmt.date(v)}</span> },
    { key: 'productId', label: 'Producto', render: v => {
      const p = window.DB.getProduct(v);
      return <div><div style={{ fontWeight: 600, fontSize: 13 }}>{p?.name}</div><CategoryBadge category={p?.category || ''} /></div>;
    }},
    { key: 'qty', label: 'Cantidad', align: 'center', render: (v, row) => <span style={{ fontWeight: 600 }}>{v} <span style={{ fontSize: 11, color: C.textMuted }}>{row.unit}</span></span> },
    { key: 'value', label: 'Valor', align: 'right', render: v => <span style={{ fontWeight: 700, color: C.navy }}>{fmt.money(v)}</span> },
    { key: 'user', label: 'Usuario', render: v => <span style={{ fontSize: 12, color: C.textSub }}>{v}</span> },
    { key: 'notes', label: 'Notas', render: v => <span style={{ fontSize: 12, color: C.textMuted, fontStyle: v ? 'normal' : 'italic' }}>{v || 'Sin notas'}</span> },
    { key: 'id', label: '', align: 'center', render: (_, row) => (
      <button onClick={e => { e.stopPropagation(); setModal({ mode: 'deleteConsumo', item: row }); }} style={{ background: '#BA302618', border: 'none', borderRadius: 6, padding: '6px 8px', cursor: 'pointer' }}>
        <Icon name="trash" size={13} color="#BA3026" />
      </button>
    )},
  ];

  const mermaCols = [
    { key: 'date', label: 'Fecha', render: v => <span style={{ fontSize: 12 }}>{fmt.date(v)}</span> },
    { key: 'productId', label: 'Producto', render: v => {
      const p = window.DB.getProduct(v);
      return <div><div style={{ fontWeight: 600, fontSize: 13 }}>{p?.name}</div><CategoryBadge category={p?.category || ''} /></div>;
    }},
    { key: 'qty', label: 'Cantidad', align: 'center', render: (v, row) => {
      const p = window.DB.getProduct(row.productId);
      return <span style={{ fontWeight: 600 }}>{v} <span style={{ fontSize: 11, color: C.textMuted }}>{p?.unit}</span></span>;
    }},
    { key: 'type', label: 'Tipo', render: v => <MermaBadge type={v} /> },
    { key: 'value', label: 'Valor Perdido', align: 'right', render: v => <span style={{ fontWeight: 700, color: C.terracota }}>{fmt.money(v)}</span> },
    { key: 'reason', label: 'Motivo', render: v => <span style={{ fontSize: 12, color: C.textSub }}>{v}</span> },
    { key: 'id', label: '', align: 'center', render: (_, row) => (
      <button onClick={e => { e.stopPropagation(); setModal({ mode: 'deleteMerma', item: row }); }} style={{ background: '#BA302618', border: 'none', borderRadius: 6, padding: '6px 8px', cursor: 'pointer' }}>
        <Icon name="trash" size={13} color="#BA3026" />
      </button>
    )},
  ];

  const totalConsumo = consumptions.reduce((s, c) => s + c.value, 0);
  const totalMerma = merma.reduce((s, m) => s + m.value, 0);

  return (
    <div style={{ padding: 28 }}>
      {/* Tabs */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 22, borderBottom: `2px solid ${C.border}`, width: 'fit-content' }}>
        {[['consumo', 'Consumo', 'exits'], ['merma', 'Merma', 'trash']].map(([id, label, icon]) => (
          <button key={id} onClick={() => setTab(id)} style={{
            padding: '11px 28px', border: 'none', background: 'none', cursor: 'pointer',
            fontFamily: 'inherit', fontSize: 14, fontWeight: tab === id ? 700 : 400,
            color: tab === id ? C.terracota : C.textSub,
            borderBottom: `2.5px solid ${tab === id ? C.terracota : 'transparent'}`,
            marginBottom: -2, display: 'flex', alignItems: 'center', gap: 8, transition: 'all 0.2s ease'
          }}>
            <Icon name={icon} size={15} color={tab === id ? C.terracota : C.textSub} />
            {label}
          </button>
        ))}
      </div>

      {tab === 'consumo' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ fontSize: 12, color: C.textSub }}>
              <b>{consumptions.length}</b> registros · Total consumido: <b style={{ color: C.navy }}>{fmt.money(totalConsumo)}</b>
            </div>
            <Btn icon="plus" variant="navy" onClick={openNewConsumo}>Registrar Consumo</Btn>
          </div>
          <div style={{ background: C.surface, borderRadius: 10, boxShadow: `0 2px 8px ${C.shadow}`, overflow: 'hidden' }}>
            <Table columns={consumoCols} rows={[...consumptions].sort((a,b) => b.date.localeCompare(a.date))} emptyMessage="Sin consumos registrados" />
          </div>
        </>
      )}

      {tab === 'merma' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ fontSize: 12, color: C.textSub }}>
              <b>{merma.length}</b> registros · Valor perdido: <b style={{ color: C.terracota }}>{fmt.money(totalMerma)}</b>
            </div>
            <Btn icon="plus" variant="danger" onClick={openNewMerma}>Registrar Merma</Btn>
          </div>
          <div style={{ background: C.surface, borderRadius: 10, boxShadow: `0 2px 8px ${C.shadow}`, overflow: 'hidden' }}>
            <Table columns={mermaCols} rows={[...merma].sort((a,b) => b.date.localeCompare(a.date))} emptyMessage="Sin mermas registradas" />
          </div>
        </>
      )}

      {/* Consumo Modal */}
      <Modal open={modal?.mode === 'newConsumo'} onClose={() => setModal(null)} title="Registrar Consumo" width={520}
        footer={<><Btn variant="ghost" onClick={() => setModal(null)}>Cancelar</Btn><Btn variant="navy" onClick={saveConsumo}>Guardar</Btn></>}>
        <Field label="Fecha">
          <input type="date" value={form.date || ''} onChange={e => f('date', e.target.value)}
            style={{ ...inputStyle(false), padding: '9px 12px' }}
            onFocus={e => e.target.style.borderColor = C.terracota} onBlur={e => e.target.style.borderColor = C.border} />
        </Field>
        <Field label="Producto *" error={errors.productId}>
          <select value={form.productId || ''} onChange={e => { f('productId', e.target.value); setErrors(p => ({...p, productId: ''})); }}
            style={{ ...inputStyle(false), padding: '9px 32px 9px 12px', ...SELECT_STYLE(10) }}
            onFocus={e => e.target.style.borderColor = C.terracota} onBlur={e => e.target.style.borderColor = C.border}>
            <option value="">Seleccionar producto...</option>
            {window.DB.products.map(p => <option key={p.id} value={p.id}>{p.name} — Stock: {p.stock} {p.unit}</option>)}
          </select>
        </Field>
        <Input label="Cantidad *" type="number" value={form.qty || ''} onChange={e => { f('qty', e.target.value); setErrors(p => ({...p, qty: ''})); }} error={errors.qty} placeholder="0" />
        {selectedProd && parseFloat(form.qty) > 0 && (
          <div style={{ background: C.surfaceAlt, borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 13 }}>
            Valor estimado: <b style={{ color: C.navy }}>{fmt.money(consumoValue)}</b>
            {parseFloat(form.qty) > selectedProd.stock * 0.8 && (
              <div style={{ color: '#E67E22', fontSize: 12, marginTop: 4 }}>⚠ Esto deja el stock bajo mínimo</div>
            )}
          </div>
        )}
        <Textarea label="Notas" value={form.notes || ''} onChange={e => f('notes', e.target.value)} placeholder="Descripción opcional..." style={{ minHeight: 64 }} />
      </Modal>

      {/* Merma Modal */}
      <Modal open={modal?.mode === 'newMerma'} onClose={() => setModal(null)} title="Registrar Merma" width={520}
        footer={<><Btn variant="ghost" onClick={() => setModal(null)}>Cancelar</Btn><Btn variant="danger" onClick={saveMerma}>Registrar Merma</Btn></>}>
        <div style={{ background: '#BA302610', border: `1px solid #BA302630`, borderRadius: 8, padding: '10px 14px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
          <Icon name="alert" size={16} color="#BA3026" />
          <span style={{ fontSize: 12, color: C.terracota, fontWeight: 500 }}>Esto reducirá el stock y afectará el inventario</span>
        </div>
        <Field label="Fecha">
          <input type="date" value={form.date || ''} onChange={e => f('date', e.target.value)}
            style={{ ...inputStyle(false), padding: '9px 12px' }}
            onFocus={e => e.target.style.borderColor = C.terracota} onBlur={e => e.target.style.borderColor = C.border} />
        </Field>
        <Field label="Producto *" error={errors.productId}>
          <select value={form.productId || ''} onChange={e => { f('productId', e.target.value); setErrors(p => ({...p, productId: ''})); }}
            style={{ ...inputStyle(false), padding: '9px 32px 9px 12px', ...SELECT_STYLE(10) }}
            onFocus={e => e.target.style.borderColor = C.terracota} onBlur={e => e.target.style.borderColor = C.border}>
            <option value="">Seleccionar producto...</option>
            {window.DB.products.map(p => <option key={p.id} value={p.id}>{p.name} — Stock: {p.stock} {p.unit}</option>)}
          </select>
        </Field>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <Input label="Cantidad *" type="number" value={form.qty || ''} onChange={e => { f('qty', e.target.value); setErrors(p => ({...p, qty: ''})); }} error={errors.qty} placeholder="0" />
          <Select label="Tipo de Merma" value={form.type || 'Vencimiento'} onChange={e => f('type', e.target.value)}>
            {window.DB.MERMA_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </Select>
        </div>
        {mermaValue > 0 && (
          <div style={{ background: '#BA302610', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 13 }}>
            Valor perdido: <b style={{ color: C.terracota }}>{fmt.money(mermaValue)}</b>
          </div>
        )}
        <Textarea label="Motivo / Descripción *" value={form.reason || ''} onChange={e => { f('reason', e.target.value); setErrors(p => ({...p, reason: ''})); }} error={errors.reason} placeholder="Describe el motivo de la merma..." />
      </Modal>

      <ConfirmModal open={modal?.mode === 'deleteConsumo'} onClose={() => setModal(null)} onConfirm={deleteConsumo}
        title="Eliminar Consumo" message="¿Eliminar este registro de consumo?" />
      <ConfirmModal open={modal?.mode === 'deleteMerma'} onClose={() => setModal(null)} onConfirm={deleteMerma}
        title="Eliminar Merma" message="¿Eliminar este registro de merma?" />
    </div>
  );
};

window.ExitsScreen = ExitsScreen;
