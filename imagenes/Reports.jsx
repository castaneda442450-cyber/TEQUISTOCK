
// ─── Reports Screen ───────────────────────────────────────────────────────────
const ReportsScreen = ({ showToast }) => {
  const [modal, setModal] = React.useState(null);
  const [from, setFrom] = React.useState('');
  const [to, setTo] = React.useState('');
  const [results, setResults] = React.useState(null);
  const barRef = React.useRef(null);
  const barChart = React.useRef(null);

  const REPORT_TYPES = [
    { id: 'productos', title: 'Gastos por Producto', desc: 'Analiza cuánto se ha gastado en cada producto, frecuencia de compra y promedio por compra.', icon: 'package', color: C.terracota },
    { id: 'proveedores', title: 'Gastos por Proveedor', desc: 'Compara el gasto total por proveedor, número de compras y ticket promedio.', icon: 'suppliers', color: C.navy },
    { id: 'merma', title: 'Análisis de Merma', desc: 'Identifica los productos con mayor pérdida, tipo de merma predominante y valor total.', icon: 'trash', color: '#E67E22' },
    { id: 'movimientos', title: 'Movimientos de Inventario', desc: 'Historial cronológico de entradas y salidas con balance acumulado por producto.', icon: 'history', color: C.green },
  ];

  const generate = (type) => {
    setFrom(''); setTo(''); setResults(null);
    setModal({ type });
  };

  const runReport = () => {
    const { purchases, products, suppliers, consumptions, merma } = window.DB;

    const filterByDate = (arr, key = 'date') => arr.filter(item => {
      if (from && item[key] < from) return false;
      if (to && item[key] > to) return false;
      return true;
    });

    if (modal.type === 'productos') {
      const filteredPurs = filterByDate(purchases);
      const data = products.map(p => {
        let qty = 0, times = 0, total = 0;
        filteredPurs.forEach(pur => {
          const line = pur.products.find(l => l.productId === p.id);
          if (line) { qty += line.qty; times++; total += line.qty * line.price; }
        });
        return { ...p, totalQty: qty, times, total, avg: times ? total / times : 0 };
      }).filter(p => p.total > 0).sort((a, b) => b.total - a.total);
      setResults({ type: 'productos', data });
    }

    if (modal.type === 'proveedores') {
      const filteredPurs = filterByDate(purchases);
      const data = suppliers.map(s => {
        const purs = filteredPurs.filter(p => p.supplierId === s.id);
        const total = purs.reduce((sum, p) => sum + p.total, 0);
        const prods = new Set(purs.flatMap(p => p.products.map(l => l.productId))).size;
        return { ...s, purCount: purs.length, total, prods, avg: purs.length ? total / purs.length : 0 };
      }).filter(s => s.total > 0).sort((a, b) => b.total - a.total);
      setResults({ type: 'proveedores', data });
    }

    if (modal.type === 'merma') {
      const filteredMerma = filterByDate(merma);
      const byProd = {};
      filteredMerma.forEach(m => {
        if (!byProd[m.productId]) byProd[m.productId] = { qty: 0, value: 0, types: {} };
        byProd[m.productId].qty += m.qty;
        byProd[m.productId].value += m.value;
        byProd[m.productId].types[m.type] = (byProd[m.productId].types[m.type] || 0) + 1;
      });
      const totalVal = Object.values(byProd).reduce((s, v) => s + v.value, 0);
      const data = Object.entries(byProd).map(([pid, v]) => {
        const prod = products.find(p => p.id === parseInt(pid));
        const topType = Object.entries(v.types).sort((a, b) => b[1] - a[1])[0]?.[0];
        return { product: prod, qty: v.qty, value: v.value, topType, pct: totalVal ? (v.value / totalVal * 100).toFixed(1) : 0 };
      }).sort((a, b) => b.value - a.value);
      setResults({ type: 'merma', data });
    }

    if (modal.type === 'movimientos') {
      const filteredPurs = filterByDate(purchases);
      const filteredCons = filterByDate(consumptions);
      const filteredMerma = filterByDate(merma);
      const rows = [
        ...filteredPurs.flatMap(p => p.products.map(l => ({ date: p.date, type: 'Entrada', productId: l.productId, qty: l.qty, ref: p.folio || `#${p.id}` }))),
        ...filteredCons.map(c => ({ date: c.date, type: 'Consumo', productId: c.productId, qty: -c.qty, ref: c.user })),
        ...filteredMerma.map(m => ({ date: m.date, type: 'Merma', productId: m.productId, qty: -m.qty, ref: m.type })),
      ].sort((a, b) => b.date.localeCompare(a.date));
      setResults({ type: 'movimientos', data: rows });
    }
  };

  // Render bar chart after results
  React.useEffect(() => {
    if (!results || !barRef.current || !window.Chart) return;
    if (barChart.current) barChart.current.destroy();
    if (results.type === 'productos') {
      const top10 = results.data.slice(0, 10);
      barChart.current = new Chart(barRef.current.getContext('2d'), {
        type: 'bar',
        data: {
          labels: top10.map(d => d.name.length > 16 ? d.name.slice(0, 14) + '…' : d.name),
          datasets: [{ label: 'Gasto Total', data: top10.map(d => d.total), backgroundColor: C.terracota + 'CC', borderRadius: 4 }]
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { ticks: { callback: v => '$' + (v/1000).toFixed(0) + 'k' } } } }
      });
    }
    return () => barChart.current?.destroy();
  }, [results]);

  const GrandTotal = ({ label, value, color }) => (
    <div style={{ background: C.surfaceAlt, borderRadius: 8, padding: '12px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
      <span style={{ fontSize: 13, fontWeight: 600, color: C.textSub }}>{label}</span>
      <span style={{ fontSize: 18, fontWeight: 800, color: color || C.terracota }}>{fmt.money(value)}</span>
    </div>
  );

  return (
    <div style={{ padding: 28 }}>
      <div style={{ fontSize: 14, color: C.textSub, marginBottom: 22 }}>Selecciona el tipo de reporte que deseas generar:</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
        {REPORT_TYPES.map(rt => (
          <div key={rt.id} style={{ background: C.surface, borderRadius: 12, padding: 28, boxShadow: `0 2px 8px ${C.shadow}`, display: 'flex', gap: 20, alignItems: 'flex-start', transition: 'transform 0.15s, box-shadow 0.15s', cursor: 'default' }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.1)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)'; }}>
            <div style={{ width: 52, height: 52, background: rt.color + '18', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Icon name={rt.icon} size={24} color={rt.color} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: C.textMain, marginBottom: 6 }}>{rt.title}</div>
              <div style={{ fontSize: 13, color: C.textSub, lineHeight: 1.6, marginBottom: 16 }}>{rt.desc}</div>
              <Btn variant="primary" small onClick={() => generate(rt.id)} style={{ background: rt.color }}>Generar Reporte</Btn>
            </div>
          </div>
        ))}
      </div>

      {/* Report Modal */}
      <Modal open={!!modal} onClose={() => { setModal(null); setResults(null); }}
        title={REPORT_TYPES.find(r => r.id === modal?.type)?.title || 'Reporte'} width={860}
        footer={
          <div style={{ display: 'flex', gap: 10 }}>
            <Btn variant="ghost" icon="printer" onClick={() => window.print()}>Imprimir</Btn>
            <Btn variant="ghost" icon="download">Exportar PDF</Btn>
            <Btn variant="ghost" icon="download">Exportar Excel</Btn>
            <Btn variant="ghost" onClick={() => { setModal(null); setResults(null); }}>Cerrar</Btn>
          </div>
        }>
        {/* Filters */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, padding: '14px 16px', background: C.surfaceAlt, borderRadius: 8 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: C.textSub }}>Período:</span>
          <input type="date" value={from} onChange={e => setFrom(e.target.value)} style={{ ...inputStyle(false), width: 150, padding: '8px 12px' }} />
          <span style={{ color: C.textMuted }}>—</span>
          <input type="date" value={to} onChange={e => setTo(e.target.value)} style={{ ...inputStyle(false), width: 150, padding: '8px 12px' }} />
          <Btn variant="primary" small onClick={runReport}>Generar</Btn>
          {results && <span style={{ fontSize: 12, color: C.green, fontWeight: 600 }}>✓ Reporte generado</span>}
        </div>

        {!results && (
          <div style={{ textAlign: 'center', padding: 48, color: C.textMuted }}>
            <Icon name="barChart" size={48} color={C.border} />
            <div style={{ marginTop: 12, fontSize: 14 }}>Configura el período y presiona "Generar"</div>
          </div>
        )}

        {results?.type === 'productos' && (
          <div>
            <Table columns={[
              { key: 'name', label: 'Producto', render: (v, row) => <div><div style={{ fontWeight: 600 }}>{v}</div><CategoryBadge category={row.category} /></div> },
              { key: 'totalQty', label: 'Cant. Comprada', align: 'center', render: (v, row) => `${v} ${row.unit}` },
              { key: 'times', label: 'Veces Comprado', align: 'center', render: v => <Badge label={v} color={C.navy + '18'} textColor={C.navy} /> },
              { key: 'total', label: 'Gasto Total', align: 'right', render: v => <b style={{ color: C.terracota }}>{fmt.money(v)}</b> },
              { key: 'avg', label: 'Promedio/Compra', align: 'right', render: v => fmt.money(v) },
            ]} rows={results.data} emptyMessage="Sin datos para el período seleccionado" />
            <GrandTotal label="TOTAL GASTADO" value={results.data.reduce((s, d) => s + d.total, 0)} />
            {results.data.length > 0 && <div style={{ marginTop: 16, height: 220 }}><canvas ref={barRef} /></div>}
          </div>
        )}

        {results?.type === 'proveedores' && (
          <div>
            <Table columns={[
              { key: 'company', label: 'Proveedor', render: (v, row) => <div><div style={{ fontWeight: 600 }}>{v}</div><span style={{ fontSize: 11, color: C.textMuted }}>{row.contact}</span></div> },
              { key: 'purCount', label: '# Compras', align: 'center', render: v => <Badge label={v} color={C.navy + '18'} textColor={C.navy} /> },
              { key: 'prods', label: '# Productos Distintos', align: 'center' },
              { key: 'total', label: 'Total Gastado', align: 'right', render: v => <b style={{ color: C.terracota }}>{fmt.money(v)}</b> },
              { key: 'avg', label: 'Ticket Promedio', align: 'right', render: v => fmt.money(v) },
            ]} rows={results.data} emptyMessage="Sin datos" />
            <GrandTotal label="TOTAL GASTADO" value={results.data.reduce((s, d) => s + d.total, 0)} />
          </div>
        )}

        {results?.type === 'merma' && (
          <div>
            <Table columns={[
              { key: 'product', label: 'Producto', render: v => <div><div style={{ fontWeight: 600 }}>{v?.name}</div><CategoryBadge category={v?.category || ''} /></div> },
              { key: 'qty', label: 'Cant. Perdida', align: 'center', render: (v, row) => `${v} ${row.product?.unit || ''}` },
              { key: 'topType', label: 'Tipo Predominante', render: v => <MermaBadge type={v} /> },
              { key: 'value', label: 'Valor Perdido', align: 'right', render: v => <b style={{ color: C.terracota }}>{fmt.money(v)}</b> },
              { key: 'pct', label: '% del Total', align: 'right', render: v => <span style={{ fontWeight: 600 }}>{v}%</span> },
            ]} rows={results.data} emptyMessage="Sin mermas registradas" />
            <GrandTotal label="TOTAL PERDIDO" value={results.data.reduce((s, d) => s + d.value, 0)} color="#BA3026" />
          </div>
        )}

        {results?.type === 'movimientos' && (
          <Table columns={[
            { key: 'date', label: 'Fecha', render: v => <span style={{ fontSize: 12 }}>{fmt.date(v)}</span> },
            { key: 'type', label: 'Tipo', render: v => {
              const colors = { 'Entrada': [C.green + '18', C.green], 'Consumo': [C.navy + '18', C.navy], 'Merma': ['#BA302618', C.terracota] };
              const [bg, fg] = colors[v] || ['#eee', '#666'];
              return <Badge label={v} color={bg} textColor={fg} />;
            }},
            { key: 'productId', label: 'Producto', render: v => { const p = window.DB.getProduct(v); return p?.name || '—'; }},
            { key: 'qty', label: 'Cantidad', align: 'center', render: (v, row) => {
              const p = window.DB.getProduct(row.productId);
              const pos = v > 0;
              return <span style={{ fontWeight: 700, color: pos ? C.green : C.terracota }}>{pos ? '+' : ''}{v} {p?.unit}</span>;
            }},
            { key: 'ref', label: 'Referencia', render: v => <span style={{ fontSize: 12, color: C.textMuted }}>{v}</span> },
          ]} rows={results.data} emptyMessage="Sin movimientos" />
        )}
      </Modal>
    </div>
  );
};

window.ReportsScreen = ReportsScreen;
