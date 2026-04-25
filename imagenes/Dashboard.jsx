
// ─── Dashboard Screen ─────────────────────────────────────────────────────────
const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const DIAS  = ['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo'];
const YEARS = [...new Set(window.DB.purchases.map(p => p.date.slice(0,4)))].sort().reverse();

const DashboardScreen = ({ showToast, darkMode }) => {
  const { products, suppliers, purchases, merma, SPENDING_TREND, CATEGORY_COLORS } = window.DB;

  // Filter state
  const [filterMode, setFilterMode] = React.useState('periodo'); // 'periodo' | 'mes' | 'dia'
  const [period, setPeriod]   = React.useState('30');
  const [selMonth, setSelMonth] = React.useState(new Date().getMonth()); // 0-11
  const [selYear, setSelYear]   = React.useState(new Date().getFullYear().toString());
  const [selDay, setSelDay]     = React.useState(0); // 0=Lunes

  const lineRef = React.useRef(null);
  const donutRef = React.useRef(null);
  const lineChart = React.useRef(null);
  const donutChart = React.useRef(null);

  // ── Filter purchases & merma based on active filter ─────────────────────
  const filteredPurchases = React.useMemo(() => {
    if (filterMode === 'periodo') {
      const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - parseInt(period));
      const cut = cutoff.toISOString().split('T')[0];
      return purchases.filter(p => p.date >= cut);
    }
    if (filterMode === 'mes') {
      return purchases.filter(p => {
        const d = new Date(p.date + 'T12:00:00');
        return d.getMonth() === selMonth && d.getFullYear().toString() === selYear;
      });
    }
    if (filterMode === 'dia') {
      return purchases.filter(p => {
        const d = new Date(p.date + 'T12:00:00');
        return ((d.getDay() + 6) % 7) === selDay; // Mon=0
      });
    }
    return purchases;
  }, [filterMode, period, selMonth, selYear, selDay]);

  const filteredMerma = React.useMemo(() => {
    if (filterMode === 'periodo') {
      const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - parseInt(period));
      const cut = cutoff.toISOString().split('T')[0];
      return merma.filter(m => m.date >= cut);
    }
    if (filterMode === 'mes') {
      return merma.filter(m => {
        const d = new Date(m.date + 'T12:00:00');
        return d.getMonth() === selMonth && d.getFullYear().toString() === selYear;
      });
    }
    if (filterMode === 'dia') {
      return merma.filter(m => {
        const d = new Date(m.date + 'T12:00:00');
        return ((d.getDay() + 6) % 7) === selDay;
      });
    }
    return merma;
  }, [filterMode, period, selMonth, selYear, selDay]);

  // Compute metrics from filtered data
  const totalInventory  = products.reduce((s, p) => s + p.stock * p.lastPrice, 0);
  const monthPurchases  = filteredPurchases.reduce((s, p) => s + p.total, 0);
  const monthMerma      = filteredMerma.reduce((s, m) => s + m.value, 0);
  const criticalProducts = products.filter(p => p.stock < p.minStock).length;

  // Top 5 most expensive products by spending
  const productSpend = products.map(p => {
    const spent = filteredPurchases.reduce((s, pur) => {
      const line = pur.products.find(l => l.productId === p.id);
      return s + (line ? line.qty * line.price : 0);
    }, 0);
    return { ...p, spent };
  }).sort((a, b) => b.spent - a.spent).slice(0, 5);
  const maxProdSpend = productSpend[0]?.spent || 1;

  // Top 5 suppliers by spend
  const supplierSpend = suppliers.map(s => ({
    ...s,
    totalSpent: filteredPurchases.filter(p => p.supplierId === s.id).reduce((sum, p) => sum + p.total, 0),
    purCount: filteredPurchases.filter(p => p.supplierId === s.id).length
  })).filter(s => s.totalSpent > 0).sort((a, b) => b.totalSpent - a.totalSpent).slice(0, 5);
  const maxSupSpend = supplierSpend[0]?.totalSpent || 1;

  // Top 5 merma products
  const mermaByProd = {};
  filteredMerma.forEach(m => {
    if (!mermaByProd[m.productId]) mermaByProd[m.productId] = { value: 0, qty: 0, types: {} };
    mermaByProd[m.productId].value += m.value;
    mermaByProd[m.productId].qty += m.qty;
    mermaByProd[m.productId].types[m.type] = (mermaByProd[m.productId].types[m.type] || 0) + 1;
  });
  const topMerma = Object.entries(mermaByProd).map(([pid, v]) => ({
    product: products.find(p => p.id === parseInt(pid)),
    ...v,
    topType: Object.entries(v.types).sort((a, b) => b[1] - a[1])[0]?.[0]
  })).sort((a, b) => b.value - a.value).slice(0, 5);
  const maxMermaVal = topMerma[0]?.value || 1;

  // Category bar data
  const catSpend = {};
  filteredPurchases.forEach(pur => {
    pur.products.forEach(line => {
      const prod = products.find(p => p.id === line.productId);
      if (prod) catSpend[prod.category] = (catSpend[prod.category] || 0) + line.qty * line.price;
    });
  });

  // Charts
  React.useEffect(() => {
    if (!window.Chart) return;
    const days = parseInt(period) || 30;
    const data = SPENDING_TREND.slice(-days);
    if (lineChart.current) lineChart.current.destroy();
    const lCtx = lineRef.current.getContext('2d');
    lineChart.current = new Chart(lCtx, {
      type: 'line',
      data: {
        labels: data.map(d => d.label),
        datasets: [
          { label: 'Compras', data: data.map(d => d.compras), borderColor: C.terracota, backgroundColor: C.terracota + '18', fill: true, tension: 0.4, pointRadius: 2 },
          { label: 'Merma',   data: data.map(d => d.merma),   borderColor: C.gold,      backgroundColor: C.gold + '18',      fill: true, tension: 0.4, pointRadius: 2 },
          { label: 'Neto',    data: data.map(d => d.compras - d.merma), borderColor: C.green, backgroundColor: 'transparent', tension: 0.4, pointRadius: 2, borderDash: [4,3] },
        ]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom', labels: { font: { size: 11 }, boxWidth: 12 } }, tooltip: { mode: 'index' } },
        scales: {
          x: { grid: { display: false }, ticks: { font: { size: 10 }, maxTicksLimit: 8 } },
          y: { grid: { display: false }, ticks: { font: { size: 10 }, callback: v => '$' + (v/1000).toFixed(0) + 'k' } }
        }
      }
    });

    if (donutChart.current) donutChart.current.destroy();
    const sortedCats = Object.keys(catSpend).sort((a, b) => catSpend[b] - catSpend[a]);
    const dCtx = donutRef.current.getContext('2d');
    donutChart.current = new Chart(dCtx, {
      type: 'bar',
      data: {
        labels: sortedCats,
        datasets: [{
          label: 'Gasto',
          data: sortedCats.map(c => catSpend[c]),
          backgroundColor: sortedCats.map(c => (CATEGORY_COLORS[c] || '#888') + 'CC'),
          borderColor:     sortedCats.map(c => CATEGORY_COLORS[c] || '#888'),
          borderWidth: 2,
          borderRadius: 6,
          borderSkipped: false,
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: { callbacks: { label: ctx => ' $' + ctx.parsed.y.toLocaleString('es-MX') } }
        },
        scales: {
          x: { grid: { display: false }, ticks: { font: { size: 11 }, color: (window._theme || window.lightC).textSub } },
          y: { grid: { display: false }, ticks: { font: { size: 10 }, color: (window._theme || window.lightC).textSub, callback: v => '$' + (v/1000).toFixed(0) + 'k' } }
        }
      }
    });

    return () => { lineChart.current?.destroy(); donutChart.current?.destroy(); };
  }, [period, filterMode, selMonth, selYear, selDay]);

  const criticals = products.filter(p => p.stock < p.minStock);

  return (
    <div style={{ padding: 28, display: 'flex', flexDirection: 'column', gap: 22 }}>
      {/* ── Filtros ───────────────────────────────────────────────────── */}
      <div style={{ background: C.surface, borderRadius: 10, border: `1px solid ${C.border}`, padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {/* Mode tabs */}
        <div style={{ display: 'flex', gap: 6 }}>
          {[['periodo','📅 Por período'],['mes','🗓 Por mes'],['dia','📆 Por día']].map(([m, l]) => (
            <button key={m} onClick={() => setFilterMode(m)} style={{
              padding: '7px 18px', borderRadius: 20, border: `1.5px solid ${filterMode === m ? C.terracota : C.border}`,
              background: filterMode === m ? C.terracota : C.surface, color: filterMode === m ? '#fff' : C.textSub,
              fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s ease'
            }}>{l}</button>
          ))}
        </div>

        {/* Period pills */}
        {filterMode === 'periodo' && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: 11, color: C.textMuted, fontWeight: 600 }}>RANGO:</span>
            {[['7','7 días'],['14','14 días'],['30','30 días'],['60','60 días'],['90','90 días']].map(([v, l]) => (
              <button key={v} onClick={() => setPeriod(v)} style={{
                padding: '5px 14px', borderRadius: 20, border: `1.5px solid ${period === v ? C.terracota : C.border}`,
                background: period === v ? `${C.terracota}18` : 'transparent', color: period === v ? C.terracota : C.textSub,
                fontSize: 12, fontWeight: period === v ? 700 : 400, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s'
              }}>{l}</button>
            ))}
          </div>
        )}

        {/* Month + year selector */}
        {filterMode === 'mes' && (
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 11, color: C.textMuted, fontWeight: 600, alignSelf: 'center' }}>MES:</span>
              {MESES.map((m, i) => (
                <button key={i} onClick={() => setSelMonth(i)} style={{
                  padding: '5px 12px', borderRadius: 20, border: `1.5px solid ${selMonth === i ? C.terracota : C.border}`,
                  background: selMonth === i ? `${C.terracota}18` : 'transparent', color: selMonth === i ? C.terracota : C.textSub,
                  fontSize: 11, fontWeight: selMonth === i ? 700 : 400, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s'
                }}>{m.slice(0,3)}</button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <span style={{ fontSize: 11, color: C.textMuted, fontWeight: 600 }}>AÑO:</span>
              {(YEARS.length ? YEARS : [new Date().getFullYear().toString()]).map(y => (
                <button key={y} onClick={() => setSelYear(y)} style={{
                  padding: '5px 12px', borderRadius: 20, border: `1.5px solid ${selYear === y ? C.terracota : C.border}`,
                  background: selYear === y ? `${C.terracota}18` : 'transparent', color: selYear === y ? C.terracota : C.textSub,
                  fontSize: 11, fontWeight: selYear === y ? 700 : 400, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s'
                }}>{y}</button>
              ))}
            </div>
          </div>
        )}

        {/* Day of week selector */}
        {filterMode === 'dia' && (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: 11, color: C.textMuted, fontWeight: 600 }}>DÍA:</span>
            {DIAS.map((d, i) => (
              <button key={i} onClick={() => setSelDay(i)} style={{
                padding: '5px 16px', borderRadius: 20, border: `1.5px solid ${selDay === i ? C.terracota : C.border}`,
                background: selDay === i ? `${C.terracota}18` : 'transparent', color: selDay === i ? C.terracota : C.textSub,
                fontSize: 12, fontWeight: selDay === i ? 700 : 400, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s'
              }}>{d}</button>
            ))}
          </div>
        )}

        {/* Active filter label */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 6, height: 6, borderRadius: 99, background: C.terracota }} />
          <span style={{ fontSize: 11, color: C.textMuted }}>
            {filterMode === 'periodo' && `Mostrando datos de los últimos ${period} días`}
            {filterMode === 'mes' && `Mostrando datos de ${MESES[selMonth]} ${selYear}`}
            {filterMode === 'dia' && `Mostrando datos de los días ${DIAS[selDay]}`}
            {' · '}<b style={{ color: C.textSub }}>{filteredPurchases.length} compra(s)</b>
          </span>
        </div>
      </div>

      {/* Critical alerts */}
      {criticals.length > 0 && (
        <div style={{ background: '#BA302610', border: `1.5px solid #BA302630`, borderRadius: 10, padding: '14px 18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <Icon name="alert" size={16} color={C.terracota} />
            <span style={{ fontSize: 13, fontWeight: 700, color: C.terracota }}>⚠ {criticals.length} producto(s) con stock crítico</span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {criticals.map(p => (
              <div key={p.id} style={{ background: C.surface, borderRadius: 8, padding: '8px 14px', border: `1px solid #BA302630`, display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: C.textMain }}>{p.name}</span>
                <span style={{ fontSize: 11, color: C.terracota }}>{p.stock} {p.unit} / mín {p.minStock} {p.unit}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Metric cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
        <MetricCard label="Total Inventario" value={fmt.money(totalInventory)} icon={<Icon name="box" size={20} color={C.green} />} iconBg={C.green + '22'} change={4.2} />
        <MetricCard label="Compras del Mes"  value={fmt.money(monthPurchases)} icon={<Icon name="cart" size={20} color={C.navy} />} iconBg={C.navy + '22'} change={-2.1} />
        <MetricCard label="Merma del Mes"    value={fmt.money(monthMerma)} icon={<Icon name="alert" size={20} color="#E67E22" />} iconBg="#E67E2222" change={8.5} />
        <MetricCard label="Productos Críticos" value={criticalProducts} icon={<Icon name="alert" size={20} color={C.terracota} />} iconBg={C.terracota + '22'} />
      </div>

      {/* Rankings */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
        {/* Top productos */}
        <SectionCard title="Top 5 Productos Más Costosos" icon={<Icon name="dollar" size={15} color={C.terracota} />}>
          {productSpend.map((p, i) => (
            <div key={p.id} style={{ marginBottom: i < 4 ? 16 : 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: C.textMuted }}>#{i + 1}</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: C.textMain, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</span>
                  </div>
                  <CategoryBadge category={p.category} />
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 8 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: C.terracota }}>{fmt.money(p.spent)}</div>
                  <div style={{ fontSize: 10, color: C.textMuted }}>{((p.spent / monthPurchases) * 100).toFixed(1)}%</div>
                </div>
              </div>
              <ProgressBar value={(p.spent / maxProdSpend) * 100} color={C.terracota} />
            </div>
          ))}
        </SectionCard>

        {/* Top proveedores */}
        <SectionCard title="Top 5 Proveedores" icon={<Icon name="suppliers" size={15} color={C.navy} />}>
          {supplierSpend.map((s, i) => (
            <div key={s.id} style={{ marginBottom: i < 4 ? 16 : 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: C.textMuted }}>#{i + 1}</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: C.textMain, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.company}</span>
                  </div>
                  <Badge label={`${purchases.filter(p => p.supplierId === s.id).length} compras`} color={C.navy + '18'} textColor={C.navy} />
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 8 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: C.navy }}>{fmt.money(s.totalSpent)}</div>
                  <div style={{ fontSize: 10, color: C.textMuted }}>{((s.totalSpent / monthPurchases) * 100).toFixed(1)}%</div>
                </div>
              </div>
              <ProgressBar value={(s.totalSpent / maxSupSpend) * 100} color={C.navy} />
            </div>
          ))}
        </SectionCard>

        {/* Top merma */}
        <SectionCard title="Top 5 Mayor Merma" icon={<Icon name="trash" size={15} color="#E67E22" />}>
          {topMerma.map((m, i) => (
            <div key={i} style={{ marginBottom: i < 4 ? 16 : 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: C.textMuted }}>#{i + 1}</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: C.textMain, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.product?.name}</span>
                  </div>
                  <MermaBadge type={m.topType} />
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 8 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: C.terracota }}>{fmt.money(m.value)}</div>
                  <div style={{ fontSize: 10, color: C.textMuted }}>{m.qty} {m.product?.unit}</div>
                </div>
              </div>
              <ProgressBar value={(m.value / maxMermaVal) * 100} color="#BA3026" />
            </div>
          ))}
        </SectionCard>
      </div>

      {/* Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <SectionCard title="Tendencia de Gastos" icon={<Icon name="trending" size={15} color={C.terracota} />}>
          <div style={{ height: 240 }}><canvas ref={lineRef} /></div>
        </SectionCard>
        <SectionCard title="Gasto por Categoría" icon={<Icon name="barChart" size={15} color={C.navy} />}>
          <div style={{ height: 240 }}><canvas ref={donutRef} /></div>
        </SectionCard>
      </div>
    </div>
  );
};

window.DashboardScreen = DashboardScreen;
