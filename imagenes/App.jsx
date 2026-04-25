
// ─── App Root ─────────────────────────────────────────────────────────────────
const App = () => {
  const [screen, setScreen] = React.useState('login');
  const [user, setUser] = React.useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);
  const [toasts, setToasts] = React.useState([]);
  const [darkMode, setDarkMode] = React.useState(() => localStorage.getItem('darkMode') === 'true');

  // Sync theme immediately on first render and on toggle
  window._theme = darkMode ? window.darkC : window.lightC;

  const toggleDark = () => {
    const next = !darkMode;
    window._theme = next ? window.darkC : window.lightC;
    localStorage.setItem('darkMode', next);
    document.documentElement.setAttribute('data-dark', next);
    setDarkMode(next);
  };

  // Apply data-dark on every render so it's set from localStorage on load
  React.useEffect(() => {
    document.documentElement.setAttribute('data-dark', darkMode);
  }, [darkMode]);

  const showToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts(t => [...t, { id, message, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3200);
  };

  const handleLogin  = (email) => { setUser(email); setScreen('dashboard'); };
  const handleLogout = () => { setUser(null); setScreen('login'); };

  const TITLES = {
    dashboard: 'Dashboard',      products:  'Catálogo de Productos',
    suppliers: 'Proveedores',    purchases: 'Registro de Compras',
    exits:     'Salidas de Inventario', reports: 'Reportes',
  };
  const SUBTITLES = {
    dashboard: 'Vista general del inventario',
    products:  'Gestiona todos los productos del restaurante',
    suppliers: 'Directorio de proveedores',
    purchases: 'Historial y registro de compras',
    exits:     'Consumos y mermas del inventario',
    reports:   'Análisis y exportación de datos',
  };

  if (screen === 'login') return <LoginScreen onLogin={handleLogin} darkMode={darkMode} />;

  const screenProps = { showToast, darkMode };

  return (
    <div style={{ display: 'flex', height: '100vh', background: window._theme.bg, fontFamily: "'Plus Jakarta Sans', sans-serif", color: window._theme.textMain, transition: 'background 0.25s ease, color 0.25s ease' }}>
      <Sidebar current={screen} onNav={setScreen} collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(c => !c)} darkMode={darkMode} onToggleDarkMode={toggleDark} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <TopBar title={TITLES[screen]} subtitle={SUBTITLES[screen]} user={user} onLogout={handleLogout} darkMode={darkMode} />
        <div style={{ flex: 1, overflowY: 'auto', background: window._theme.bg, transition: 'background 0.25s ease' }}>
          {screen === 'dashboard' && <DashboardScreen {...screenProps} />}
          {screen === 'products'  && <ProductsScreen  {...screenProps} />}
          {screen === 'suppliers' && <SuppliersScreen {...screenProps} />}
          {screen === 'purchases' && <PurchasesScreen {...screenProps} />}
          {screen === 'exits'     && <ExitsScreen     {...screenProps} />}
          {screen === 'reports'   && <ReportsScreen   {...screenProps} />}
        </div>
      </div>
      <ToastContainer toasts={toasts} />
    </div>
  );
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
