
// ─── Shared Components ────────────────────────────────────────────────────────

// ── Icons ────────────────────────────────────────────────────────────────────
const Icon = ({ name, size = 18, color = 'currentColor', style = {} }) => {
  const paths = {
    dashboard:   <><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></>,
    products:    <><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></>,
    suppliers:   <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></>,
    purchases:   <><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></>,
    exits:       <><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></>,
    reports:     <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></>,
    box:         <><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></>,
    cart:        <><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></>,
    alert:       <><polygon points="10.29 3.86 1.82 18 22.18 18 13.71 3.86 10.29 3.86"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></>,
    trash:       <><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></>,
    edit:        <><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></>,
    eye:         <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>,
    plus:        <><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>,
    x:           <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>,
    check:       <><polyline points="20 6 9 17 4 12"/></>,
    search:      <><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></>,
    logout:      <><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></>,
    user:        <><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></>,
    chevronDown: <><polyline points="6 9 12 15 18 9"/></>,
    chevronUp:   <><polyline points="18 15 12 9 6 15"/></>,
    arrowUp:     <><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></>,
    arrowDown:   <><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/></>,
    filter:      <><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></>,
    calendar:    <><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></>,
    download:    <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></>,
    printer:     <><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></>,
    trending:    <><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></>,
    dollar:      <><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></>,
    package:     <><line x1="16.5" y1="9.4" x2="7.5" y2="4.21"/><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></>,
    barChart:    <><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/></>,
    pieChart:    <><path d="M21.21 15.89A10 10 0 1 1 8 2.83"/><path d="M22 12A10 10 0 0 0 12 2v10z"/></>,
    history:     <><polyline points="12 8 12 12 14 14"/><path d="M3.05 11a9 9 0 1 0 .5-4.14"/><polyline points="3 3 3 9 9 9"/></>,
    invoice:     <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></>,
    menu:        <><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></>,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      style={{ flexShrink: 0, ...style }}>
      {paths[name] || null}
    </svg>
  );
};

// ── Colors — Proxy that always reads from current theme ────────────────────
window.lightC = {
  terracota:     '#BA3026',
  terracotaDark: '#8F221A',
  gold:          '#C2972E',
  navy:          '#0B4455',
  green:         '#106653',
  darkGreen:     '#0D4B43',
  bg:            '#FAF8F5',
  surface:       '#FFFFFF',
  surfaceAlt:    '#F5F2EE',
  surfaceHover:  '#F0EDE8',
  border:        '#E8E2DA',
  borderStrong:  '#CEC8C0',
  textMain:      '#1C1714',
  textSub:       '#7A7068',
  textMuted:     '#B0A89E',
  navBg:         '#0B4455',
  shadow:        'rgba(0,0,0,0.06)',
  shadowMd:      'rgba(0,0,0,0.1)',
  shadowLg:      'rgba(0,0,0,0.18)',
};

window.darkC = {
  terracota:     '#E8705A',
  terracotaDark: '#C85A44',
  gold:          '#D4A843',
  navy:          '#2A4A6B',
  green:         '#2A9D8F',
  darkGreen:     '#218A7D',
  bg:            '#111318',
  surface:       '#1C2028',
  surfaceAlt:    '#242834',
  surfaceHover:  '#2E3344',
  border:        '#2E3444',
  borderStrong:  '#3E4454',
  textMain:      '#E8EAF0',
  textSub:       '#9098B0',
  textMuted:     '#606880',
  navBg:         '#0D1117',
  shadow:        'rgba(0,0,0,0.24)',
  shadowMd:      'rgba(0,0,0,0.36)',
  shadowLg:      'rgba(0,0,0,0.5)',
};

window._theme = window.lightC;
const C = new Proxy({}, { get: (_, k) => (window._theme || window.lightC)[k] });

// ── Badge ─────────────────────────────────────────────────────────────────────
const Badge = ({ label, color, textColor, style = {} }) => (
  <span style={{
    display: 'inline-flex', alignItems: 'center',
    padding: '2px 10px', borderRadius: 99, fontSize: 11, fontWeight: 600,
    background: color || '#E8E2DA', color: textColor || C.textMain,
    whiteSpace: 'nowrap', ...style
  }}>{label}</span>
);

const CategoryBadge = ({ category }) => {
  const bg = (window.DB.CATEGORY_COLORS[category] || '#888') + '22';
  const fg = window.DB.CATEGORY_COLORS[category] || '#888';
  return <Badge label={category} color={bg} textColor={fg} />;
};

const MermaBadge = ({ type }) => {
  const colors = { 'Vencimiento': ['#BA302622','#BA3026'], 'Mala calidad': ['#E67E2222','#E67E22'], 'Accidente': ['#C2972E22','#C2972E'], 'Otro': ['#78909C22','#78909C'] };
  const [bg, fg] = colors[type] || ['#eee','#666'];
  return <Badge label={type} color={bg} textColor={fg} />;
};

// ── Button ────────────────────────────────────────────────────────────────────
const Btn = ({ children, variant = 'primary', onClick, style = {}, disabled, icon, small }) => {
  const variants = {
    primary:   { background: C.terracota, color: '#fff', border: 'none' },
    secondary: { background: C.surfaceAlt, color: C.terracota, border: `1.5px solid ${C.terracota}` },
    success:   { background: C.green, color: '#fff', border: 'none' },
    danger:    { background: C.terracota, color: '#fff', border: 'none' },
    ghost:     { background: C.surfaceAlt, color: C.textSub, border: `1.5px solid ${C.border}` },
    navy:      { background: C.navy, color: '#fff', border: 'none' },
  };
  const v = variants[variant] || variants.primary;
  return (
    <button onClick={onClick} disabled={disabled} style={{
      ...v, borderRadius: 6, padding: small ? '6px 14px' : '9px 20px',
      fontSize: small ? 12 : 13, fontWeight: 600, cursor: disabled ? 'not-allowed' : 'pointer',
      display: 'inline-flex', alignItems: 'center', gap: 7, opacity: disabled ? 0.6 : 1,
      transition: 'all 0.15s', fontFamily: 'inherit', ...style
    }}
    onMouseEnter={e => { if(!disabled) e.currentTarget.style.filter = 'brightness(0.88)'; }}
    onMouseLeave={e => { e.currentTarget.style.filter = ''; }}
    >{icon && <Icon name={icon} size={14} />}{children}</button>
  );
};

// ── Input / Select / Textarea ─────────────────────────────────────────────────
const inputStyle = (err) => ({
  width: '100%', boxSizing: 'border-box', padding: '9px 12px', fontSize: 13,
  border: `1.5px solid ${err ? C.terracota : C.border}`, borderRadius: 6,
  outline: 'none', fontFamily: 'inherit', background: C.surface, color: C.textMain,
  transition: 'border 0.15s, background 0.2s, color 0.2s',
});

const Field = ({ label, error, children }) => (
  <div style={{ marginBottom: 16 }}>
    {label && <div style={{ fontSize: 12, fontWeight: 600, color: C.textSub, marginBottom: 5 }}>{label}</div>}
    {children}
    {error && <div style={{ fontSize: 11, color: C.terracota, marginTop: 4 }}>{error}</div>}
  </div>
);

const Input = ({ label, error, ...props }) => (
  <Field label={label} error={error}>
    <input {...props} style={{ ...inputStyle(error), ...props.style }}
      onFocus={e => { e.target.style.borderColor = error ? '#BA3026' : C.terracota; e.target.style.boxShadow = `0 0 0 3px ${C.terracota}18`; }}
      onBlur={e => { e.target.style.borderColor = error ? '#BA3026' : C.border; e.target.style.boxShadow = ''; }} />
  </Field>
);

const Select = ({ label, error, children, ...props }) => (
  <Field label={label} error={error}>
    <select {...props} style={{ ...inputStyle(error), ...props.style, ...SELECT_STYLE(12) }}
      onFocus={e => { e.target.style.borderColor = C.terracota; e.target.style.boxShadow = `0 0 0 3px ${C.terracota}18`; }}
      onBlur={e => { e.target.style.borderColor = error ? '#BA3026' : C.border; e.target.style.boxShadow = ''; }}>
      {children}
    </select>
  </Field>
);

const Textarea = ({ label, error, ...props }) => (
  <Field label={label} error={error}>
    <textarea {...props} style={{ ...inputStyle(error), minHeight: 80, resize: 'vertical', ...props.style }}
      onFocus={e => { e.target.style.borderColor = C.terracota; e.target.style.boxShadow = `0 0 0 3px ${C.terracota}18`; }}
      onBlur={e => { e.target.style.borderColor = error ? '#BA3026' : C.border; e.target.style.boxShadow = ''; }} />
  </Field>
);

// ── Modal ─────────────────────────────────────────────────────────────────────
const Modal = ({ open, onClose, title, children, width = 560, footer }) => {
  if (!open) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: C.surface, borderRadius: 12, width: '100%', maxWidth: width, maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: `0 24px 64px ${C.shadowLg}`, animation: 'modalIn 0.18s ease', border: `1px solid ${C.border}` }}>
        <div style={{ padding: '18px 24px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: C.surface, borderRadius: '12px 12px 0 0' }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: C.textMain }}>{title}</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.textSub, padding: 4, borderRadius: 6, display: 'flex', alignItems: 'center' }}>
            <Icon name="x" size={18} />
          </button>
        </div>
        <div style={{ padding: 24, overflowY: 'auto', flex: 1, background: C.surface }}>{children}</div>
        {footer && <div style={{ padding: '16px 24px', borderTop: `1px solid ${C.border}`, display: 'flex', justifyContent: 'flex-end', gap: 10, background: C.surfaceAlt, borderRadius: '0 0 12px 12px' }}>{footer}</div>}
      </div>
    </div>
  );
};

// ── Confirm Modal ─────────────────────────────────────────────────────────────
const ConfirmModal = ({ open, onClose, onConfirm, title, message, confirmLabel = 'Eliminar', danger = true }) => (
  <Modal open={open} onClose={onClose} title={title} width={420}
    footer={<><Btn variant="ghost" onClick={onClose}>Cancelar</Btn><Btn variant={danger ? 'danger' : 'primary'} onClick={onConfirm}>{confirmLabel}</Btn></>}>
    <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
      <div style={{ background: '#BA302618', borderRadius: 50, padding: 10, flexShrink: 0 }}>
        <Icon name="alert" size={22} color="#BA3026" />
      </div>
      <div>
        <div style={{ fontSize: 14, color: C.textMain, lineHeight: 1.6 }}>{message}</div>
        <div style={{ fontSize: 12, color: C.textMuted, marginTop: 8 }}>Esta acción no se puede deshacer.</div>
      </div>
    </div>
  </Modal>
);

// ── Toast ─────────────────────────────────────────────────────────────────────
const ToastContainer = ({ toasts }) => (
  <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 2000, display: 'flex', flexDirection: 'column', gap: 10 }}>
    {toasts.map(t => (
      <div key={t.id} style={{
        background: t.type === 'success' ? C.green : '#BA3026', color: '#fff',
        borderRadius: 8, padding: '12px 18px', fontSize: 13, fontWeight: 500,
        display: 'flex', alignItems: 'center', gap: 10, boxShadow: '0 4px 20px rgba(0,0,0,0.18)',
        animation: 'toastIn 0.2s ease', minWidth: 260
      }}>
        <Icon name={t.type === 'success' ? 'check' : 'x'} size={16} />
        {t.message}
      </div>
    ))}
  </div>
);

// ── MetricCard ────────────────────────────────────────────────────────────────
const MetricCard = ({ label, value, icon, iconBg, change, changeLabel }) => {
  const up = change >= 0;
  return (
    <div style={{ background: C.surface, borderRadius: 10, padding: '20px 22px', boxShadow: `0 2px 8px ${C.shadow}`, border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 16, transition: 'transform 0.15s, box-shadow 0.15s, background 0.2s', cursor: 'default' }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `0 6px 20px ${C.shadowMd}`; }}
      onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = `0 2px 8px ${C.shadow}`; }}>
      <div style={{ background: iconBg, borderRadius: 50, width: 48, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        {icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 11, color: C.textSub, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>{label}</div>
        <div style={{ fontSize: 22, fontWeight: 700, color: C.textMain, lineHeight: 1 }}>{value}</div>
        {change !== undefined && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 6 }}>
            <Icon name={up ? 'arrowUp' : 'arrowDown'} size={12} color={up ? C.green : '#BA3026'} />
            <span style={{ fontSize: 11, color: up ? C.green : '#BA3026', fontWeight: 600 }}>{Math.abs(change)}%</span>
            <span style={{ fontSize: 11, color: C.textMuted }}>{changeLabel || 'vs mes anterior'}</span>
          </div>
        )}
      </div>
    </div>
  );
};

// ── Sidebar ───────────────────────────────────────────────────────────────────
const NAV = [
  { id: 'dashboard', label: 'Dashboard',   icon: 'dashboard' },
  { id: 'products',  label: 'Productos',   icon: 'products'  },
  { id: 'suppliers', label: 'Proveedores', icon: 'suppliers' },
  { id: 'purchases', label: 'Compras',     icon: 'purchases' },
  { id: 'exits',     label: 'Salidas',     icon: 'exits'     },
  { id: 'reports',   label: 'Reportes',    icon: 'reports'   },
];

const Sidebar = ({ current, onNav, collapsed, onToggle, darkMode, onToggleDarkMode }) => {
  const BG      = '#0B3547';
  const ACTIVE  = '#BA3026';
  const TEXT    = 'rgba(255,255,255,0.92)';
  const MUTED   = 'rgba(255,255,255,0.48)';
  const HOVER   = 'rgba(255,255,255,0.09)';
  const DIVIDER = 'rgba(255,255,255,0.09)';
  return (
    <div style={{ width: collapsed ? 60 : 224, background: BG, display: 'flex', flexDirection: 'column', transition: 'width 0.22s ease', flexShrink: 0, height: '100vh', position: 'sticky', top: 0, boxShadow: '3px 0 18px rgba(0,0,0,0.22)' }}>
      {/* Logo */}
      <div onClick={onToggle} style={{ padding: collapsed ? '15px 0' : '14px 14px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: `1px solid ${DIVIDER}`, justifyContent: collapsed ? 'center' : 'flex-start', cursor: 'pointer' }}>
        <img src="logo.png" alt="logo" style={{ width: 38, height: 38, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} />
        {!collapsed && (
          <div>
            <div style={{ color: '#fff', fontWeight: 800, fontSize: 13, letterSpacing: 1, lineHeight: 1.1 }}>TEQUISTOCK</div>
            <div style={{ color: MUTED, fontSize: 9, letterSpacing: 0.8, textTransform: 'uppercase', marginTop: 2 }}>Inventarios</div>
          </div>
        )}
      </div>
      {/* Nav */}
      <nav style={{ flex: 1, padding: '10px 0', overflowY: 'auto' }}>
        {NAV.map(item => {
          const active = current === item.id;
          return (
            <div key={item.id} onClick={() => onNav(item.id)} title={collapsed ? item.label : undefined}
              style={{ display: 'flex', alignItems: 'center', gap: 11, padding: collapsed ? '12px 0' : '10px 12px', justifyContent: collapsed ? 'center' : 'flex-start', cursor: 'pointer', margin: '2px 8px', borderRadius: 8, background: active ? ACTIVE : 'transparent', color: active ? '#fff' : TEXT, transition: 'all 0.15s' }}
              onMouseEnter={e => { if (!active) e.currentTarget.style.background = HOVER; }}
              onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}>
              <Icon name={item.icon} size={17} color={active ? '#fff' : MUTED} />
              {!collapsed && <span style={{ fontSize: 13, fontWeight: active ? 600 : 400 }}>{item.label}</span>}
            </div>
          );
        })}
      </nav>
      {/* Dark mode toggle */}
      <div style={{ padding: collapsed ? '12px 0' : '10px 10px', borderTop: `1px solid ${DIVIDER}`, display: 'flex', justifyContent: collapsed ? 'center' : 'flex-start' }}>
        <button onClick={onToggleDarkMode} title={darkMode ? 'Modo claro' : 'Modo oscuro'}
          style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, padding: collapsed ? '9px 8px' : '9px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'inherit', fontSize: 12, fontWeight: 500, color: TEXT, transition: 'all 0.2s', width: collapsed ? 'auto' : '100%' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.14)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={darkMode ? '#FFD166' : '#A8C8FF'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
            {darkMode
              ? <g><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></g>
              : <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>}
          </svg>
          {!collapsed && <span>{darkMode ? 'Modo Claro' : 'Modo Oscuro'}</span>}
        </button>
      </div>
    </div>
  );
};

// ── TopBar ────────────────────────────────────────────────────────────────────
const TopBar = ({ title, subtitle, onLogout, user, darkMode }) => (
  <div style={{ background: window.C.surface, borderBottom: `1px solid ${window.C.border}`, padding: '14px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, transition: 'background 0.2s ease, border-color 0.2s ease' }}>
    <div>
      <div style={{ fontSize: 18, fontWeight: 700, color: window.C.textMain }}>{title}</div>
      {subtitle && <div style={{ fontSize: 12, color: window.C.textSub, marginTop: 2 }}>{subtitle}</div>}
    </div>
    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ width: 32, height: 32, borderRadius: 50, background: `${window.C.terracota}22`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="user" size={15} color={window.C.terracota} />
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: window.C.textMain }}>{user || 'Admin'}</div>
          <div style={{ fontSize: 11, color: window.C.textMuted }}>Administrador</div>
        </div>
      </div>
      <button onClick={onLogout} style={{ background: 'none', border: `1.5px solid ${window.C.border}`, borderRadius: 6, padding: '7px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: window.C.textSub, fontFamily: 'inherit', transition: 'all 0.15s' }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = window.C.textSub; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = window.C.border; }}>
        <Icon name="logout" size={14} />
        Salir
      </button>
    </div>
  </div>
);

// ── Table ─────────────────────────────────────────────────────────────────────
const Table = ({ columns, rows, onRowClick, emptyMessage }) => (
  <div style={{ overflowX: 'auto' }}>
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
      <thead>
        <tr style={{ background: C.surfaceAlt }}>
          {columns.map((col, i) => (
            <th key={i} style={{ padding: '11px 14px', textAlign: col.align || 'left', fontWeight: 600, color: C.textSub, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.4, whiteSpace: 'nowrap', borderBottom: `1.5px solid ${C.border}` }}>{col.label}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.length === 0 ? (
          <tr><td colSpan={columns.length} style={{ padding: 40, textAlign: 'center', color: C.textMuted, fontSize: 13, background: C.surface }}>{emptyMessage || 'Sin datos'}</td></tr>
        ) : rows.map((row, ri) => (
          <tr key={ri} style={{ borderBottom: `1px solid ${C.border}`, background: ri % 2 === 0 ? C.surface : C.surfaceAlt, cursor: onRowClick ? 'pointer' : 'default', transition: 'background 0.1s' }}
            onClick={() => onRowClick && onRowClick(row)}
            onMouseEnter={e => { e.currentTarget.style.background = C.surfaceHover; }}
            onMouseLeave={e => { e.currentTarget.style.background = ri % 2 === 0 ? C.surface : C.surfaceAlt; }}>
            {columns.map((col, ci) => (
              <td key={ci} style={{ padding: '11px 14px', textAlign: col.align || 'left', verticalAlign: 'middle' }}>
                {col.render ? col.render(row[col.key], row) : row[col.key]}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

// ── Pagination ────────────────────────────────────────────────────────────────
const Pagination = ({ page, total, perPage, onChange }) => {
  const pages = Math.ceil(total / perPage);
  if (pages <= 1) return null;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '14px 0', justifyContent: 'center' }}>
      {Array.from({ length: pages }, (_, i) => (
        <button key={i} onClick={() => onChange(i + 1)} style={{
          width: 30, height: 30, borderRadius: 6, border: `1.5px solid ${page === i + 1 ? C.terracota : C.border}`,
          background: page === i + 1 ? C.terracota : C.surface, color: page === i + 1 ? '#fff' : C.textSub,
          cursor: 'pointer', fontSize: 12, fontWeight: 600, fontFamily: 'inherit', transition: 'all 0.15s'
        }}>{i + 1}</button>
      ))}
    </div>
  );
};

// ── SearchBar ─────────────────────────────────────────────────────────────────
const SearchBar = ({ value, onChange, placeholder = 'Buscar...' }) => (
  <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
    <Icon name="search" size={14} color={C.textMuted} style={{ position: 'absolute', left: 11, pointerEvents: 'none' }} />
    <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
      style={{ ...inputStyle(false), paddingLeft: 34, width: 240, background: C.surface, color: C.textMain, '::placeholder': { color: C.textMuted } }}
      onFocus={e => { e.target.style.borderColor = C.terracota; e.target.style.boxShadow = `0 0 0 3px ${C.terracota}22`; }}
      onBlur={e => { e.target.style.borderColor = C.border; e.target.style.boxShadow = ''; }} />
  </div>
);

// ── SectionCard ───────────────────────────────────────────────────────────────
const SectionCard = ({ title, icon, children, style = {}, headerRight }) => (
  <div style={{ background: C.surface, borderRadius: 10, boxShadow: `0 2px 8px ${C.shadow}`, border: `1px solid ${C.border}`, overflow: 'hidden', transition: 'background 0.2s, border-color 0.2s', ...style }}>
    <div style={{ padding: '16px 20px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: C.surfaceAlt }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {icon && <div style={{ background: `${C.terracota}22`, borderRadius: 6, padding: 6, display: 'flex' }}>{icon}</div>}
        <span style={{ fontSize: 14, fontWeight: 700, color: C.textMain }}>{title}</span>
      </div>
      {headerRight}
    </div>
    <div style={{ padding: 20, background: C.surface }}>{children}</div>
  </div>
);

// ── ProgressBar ───────────────────────────────────────────────────────────────
const ProgressBar = ({ value, color }) => (
  <div style={{ height: 4, background: '#F0EDE8', borderRadius: 99, overflow: 'hidden', marginTop: 6 }}>
    <div style={{ height: '100%', width: `${Math.min(100, value)}%`, background: color || C.terracota, borderRadius: 99, transition: 'width 0.4s ease' }} />
  </div>
);

// ── Format helpers ────────────────────────────────────────────────────────────
const fmt = {
  money: (n) => '$' + (n || 0).toLocaleString('es-MX', { minimumFractionDigits: 0, maximumFractionDigits: 2 }),
  date: (s) => { if (!s) return '-'; const d = new Date(s + 'T12:00:00'); return d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' }); },
  num: (n) => (n || 0).toLocaleString('es-MX'),
};


// Select arrow helper — avoids quote conflicts inside JSX style strings
const SELECT_STYLE = (px) => {
  px = px || 12;
  return {
    appearance: 'none',
    cursor: 'pointer',
    backgroundImage: 'url("data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="%237A7068" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>') + '")',
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right ' + px + 'px center',
    backgroundColor: C.surface,
  };
};

// Expose all to window
Object.assign(window, {
  Icon, lightC, darkC, C, Badge, CategoryBadge, MermaBadge, Btn, Input, Select, Textarea,
  Field, Modal, ConfirmModal, ToastContainer, MetricCard, Sidebar, TopBar,
  Table, Pagination, SearchBar, SectionCard, ProgressBar, fmt, NAV,
  inputStyle, SELECT_STYLE,
});
