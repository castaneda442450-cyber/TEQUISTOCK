
// ─── Login Screen ─────────────────────────────────────────────────────────────
const LoginScreen = ({ onLogin, darkMode }) => {
  const [email, setEmail] = React.useState('admin@tequistock.mx');
  const [pass, setPass] = React.useState('');
  const [showPass, setShowPass] = React.useState(false);
  const [errors, setErrors] = React.useState({});
  const [loading, setLoading] = React.useState(false);

  const validate = () => {
    const e = {};
    if (!email) e.email = 'El correo es requerido';
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = 'Correo inválido';
    if (!pass) e.pass = 'La contraseña es requerida';
    return e;
  };

  const submit = (ev) => {
    ev.preventDefault();
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setLoading(true);
    setTimeout(() => { setLoading(false); onLogin(email); }, 900);
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: `linear-gradient(135deg, ${window.C.navy} 0%, ${window.C.darkGreen} 60%, ${window.C.terracota}88 100%)`,
      position: 'relative', overflow: 'hidden', transition: 'background 0.2s ease',
    }}>
      {/* Decorative pattern */}
      <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.05 }} xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="geo" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
            <polygon points="30,0 60,30 30,60 0,30" fill="none" stroke="white" strokeWidth="1"/>
            <circle cx="30" cy="30" r="8" fill="none" stroke="white" strokeWidth="1"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#geo)"/>
      </svg>

      <div style={{
        background: window.C.surface, borderRadius: 16, padding: '44px 40px', width: '100%', maxWidth: 420,
        boxShadow: '0 32px 80px rgba(0,0,0,0.28)', position: 'relative', zIndex: 1, transition: 'background 0.2s ease',
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <img src="logo.png" alt="Tequistock" style={{ width: 80, height: 80, margin: '0 auto 12px', borderRadius: 12, display: 'block' }} />
          <div style={{ fontSize: 22, fontWeight: 800, color: window.C.textMain, letterSpacing: 1 }}>TEQUISTOCK</div>
          <div style={{ fontSize: 13, color: window.C.textSub, marginTop: 4 }}>Control de Inventarios</div>
        </div>

        <form onSubmit={submit}>
          {/* Email */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: window.C.textSub, marginBottom: 5 }}>Correo Electrónico</div>
            <div style={{ position: 'relative' }}>
              <Icon name="user" size={15} color={window.C.textMuted} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
              <input type="email" value={email} onChange={e => { setEmail(e.target.value); setErrors(p => ({...p, email: ''})); }}
                placeholder="correo@restaurante.mx"
                style={{ ...inputStyle(errors.email), paddingLeft: 36, width: '100%', boxSizing: 'border-box', borderColor: errors.email ? '#FF6B4A' : window.C.border, background: window.C.surface, color: window.C.textMain, transition: 'all 0.15s' }}
                onFocus={e => { e.target.style.borderColor = window.C.terracota; e.target.style.boxShadow = `0 0 0 3px ${window.C.terracota}18`; }}
                onBlur={e => { e.target.style.borderColor = errors.email ? '#FF6B4A' : window.C.border; e.target.style.boxShadow = ''; }} />
            </div>
            {errors.email && <div style={{ fontSize: 11, color: '#FF6B4A', marginTop: 4 }}>{errors.email}</div>}
          </div>

          {/* Password */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: window.C.textSub, marginBottom: 5 }}>Contraseña</div>
            <div style={{ position: 'relative' }}>
              <Icon name="logout" size={15} color={window.C.textMuted} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
              <input type={showPass ? 'text' : 'password'} value={pass} onChange={e => { setPass(e.target.value); setErrors(p => ({...p, pass: ''})); }}
                placeholder="••••••••"
                style={{ ...inputStyle(errors.pass), paddingLeft: 36, paddingRight: 40, width: '100%', boxSizing: 'border-box', borderColor: errors.pass ? '#FF6B4A' : window.C.border, background: window.C.surface, color: window.C.textMain, transition: 'all 0.15s' }}
                onFocus={e => { e.target.style.borderColor = window.C.terracota; e.target.style.boxShadow = `0 0 0 3px ${window.C.terracota}18`; }}
                onBlur={e => { e.target.style.borderColor = errors.pass ? '#FF6B4A' : window.C.border; e.target.style.boxShadow = ''; }} />
              <button type="button" onClick={() => setShowPass(p => !p)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: window.C.textMuted, padding: 0 }}>
                <Icon name={showPass ? 'eye' : 'eye'} size={15} />
              </button>
            </div>
            {errors.pass && <div style={{ fontSize: 11, color: '#FF6B4A', marginTop: 4 }}>{errors.pass}</div>}
          </div>

          <button type="submit" disabled={loading} style={{
            width: '100%', padding: '12px', background: window.C.terracota, color: '#fff', border: 'none',
            borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: loading ? 'wait' : 'pointer',
            fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            transition: 'all 0.15s',
          }}
          onMouseEnter={e => { if (!loading) e.currentTarget.style.background = window.C.terracotaDark; }}
          onMouseLeave={e => { e.currentTarget.style.background = window.C.terracota; }}>
            {loading ? (
              <><span style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: 50, animation: 'spin 0.7s linear infinite', display: 'inline-block' }} /> Iniciando sesión...</>
            ) : 'Iniciar Sesión'}
          </button>
        </form>

        <div style={{ marginTop: 20, textAlign: 'center', fontSize: 11, color: window.C.textMuted }}>
          Demo: usa cualquier contraseña
        </div>
      </div>
    </div>
  );
};

window.LoginScreen = LoginScreen;
