// ============================================================
// Shared UI components (React)
// Depends on: Icon (window.Icon), core helpers (window.*)
// ============================================================

const { useState, useEffect, useRef, useMemo, useCallback, createContext, useContext, Fragment } = React;

// ── Toast system ──────────────────────────────────────────
const ToastCtx = createContext(null);
function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const show = useCallback((msg) => {
    const id = Math.random().toString(36).slice(2);
    setToasts(ts => [...ts, { id, msg }]);
    setTimeout(() => setToasts(ts => ts.filter(t => t.id !== id)), 2400);
  }, []);
  return (
    <ToastCtx.Provider value={show}>
      {children}
      <div className="toast-wrap">
        {toasts.map(t => <div key={t.id} className="toast">{t.msg}</div>)}
      </div>
    </ToastCtx.Provider>
  );
}
const useToast = () => useContext(ToastCtx);

// ── Modal ─────────────────────────────────────────────────
function Modal({ open, onClose, title, children, actions, size = 'md' }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = prev; };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal" style={size === 'lg' ? { maxWidth: 760 } : size === 'sm' ? { maxWidth: 420 } : undefined}>
        <div className="modal-head">
          <h3 className="modal-title">{title}</h3>
          <button className="btn-ico" onClick={onClose} aria-label="Cerrar"><Icon.close /></button>
        </div>
        <div className="modal-body">
          {children}
          {actions && <div className="modal-actions">{actions}</div>}
        </div>
      </div>
    </div>
  );
}

// ── Confirm ───────────────────────────────────────────────
function useConfirm() {
  const [state, setState] = useState(null);
  const ask = useCallback((opts) => new Promise(resolve => setState({ ...opts, resolve })), []);
  const node = state && (
    <Modal open={true} onClose={() => { state.resolve(false); setState(null); }} title={state.title || '¿Confirmar?'} size="sm"
           actions={<>
             <button className="btn btn-ghost" onClick={() => { state.resolve(false); setState(null); }}>Cancelar</button>
             <button className={`btn ${state.danger ? 'btn-negative' : 'btn-primary'}`}
                     onClick={() => { state.resolve(true); setState(null); }}>
               {state.ok || 'Confirmar'}
             </button>
           </>}>
      <p className="muted">{state.message}</p>
    </Modal>
  );
  return [ask, node];
}

// ── Icon circle for category (mono icon on soft bg) ──────
const CATEGORY_SLOT = { // map categoryId or name → cat class
  '1': 'cat-1', '2': 'cat-3', '3': 'cat-2', '4': 'cat-5', '5': 'cat-4',
  '6': 'cat-6', '7': 'cat-7', '8': 'cat-8', '9': 'cat-3', '10': 'cat-8',
};
const CATEGORY_ICON = {
  'home': 'home', 'cart': 'cart', 'car': 'car', 'bolt': 'bolt', 'health': 'health',
  'film': 'film', 'user': 'user', 'shield': 'shield', 'book': 'book', 'tag': 'tag',
};
function CategoryDot({ category, size = 40 }) {
  if (!category) return <div className="tx-icon cat-8"><Icon.tag size={18} /></div>;
  const slot = CATEGORY_SLOT[category.id] || 'cat-8';
  const iconName = CATEGORY_ICON[category.icon] || 'tag';
  const IconCmp = Icon[iconName] || Icon.tag;
  return <div className={`tx-icon ${slot}`} style={{ width: size, height: size }}>
    <IconCmp size={Math.round(size * 0.45)} />
  </div>;
}

function AccountDot({ account, size = 32 }) {
  const color = account?.color || '#6E6259';
  const initials = (account?.name || '?').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  return <div style={{
    width: size, height: size, borderRadius: '50%',
    background: color, color: '#fff', display: 'grid', placeItems: 'center',
    fontSize: size * 0.36, fontWeight: 700, letterSpacing: '0.02em', flexShrink: 0,
  }}>{initials}</div>;
}

// ── Amount display with currency prefix ──────────────────
function Amount({ value, currency = 'COP', className = '', compact = false, signed = false, size = 'md' }) {
  const n = parseFloat(value) || 0;
  const cls = `amount-${size} ${className}`;
  const prefix = signed ? (n > 0 ? '+' : n < 0 ? '−' : '') : '';
  const abs = Math.abs(n);
  const formatted = compact ? fmtCompact(abs, currency) : fmtNum(abs, currency);
  return <span className={cls}><span className="ccy-tag">{currency}</span>{prefix}{formatted}</span>;
}

// ── Progress bar with tone ───────────────────────────────
function Bar({ pct, tone = 'accent', thick = false, thin = false }) {
  const p = Math.max(0, Math.min(100, pct || 0));
  const color = tone === 'positive' ? 'var(--positive)' : tone === 'negative' ? 'var(--negative)' : tone === 'warning' ? 'var(--warning)' : 'var(--accent)';
  return <div className={`bar ${thick ? 'thick' : ''} ${thin ? 'thin' : ''}`}>
    <div className="bar-fill" style={{ width: `${p}%`, background: color }} />
  </div>;
}

// ── Empty state ──────────────────────────────────────────
function Empty({ icon = 'receipt', title, desc, action }) {
  const IconCmp = Icon[icon] || Icon.receipt;
  return <div className="empty">
    <div className="empty-icon"><IconCmp size={28} /></div>
    <h4 className="h4" style={{ color: 'var(--text)', marginBottom: 4 }}>{title}</h4>
    {desc && <p style={{ fontSize: 13 }}>{desc}</p>}
    {action && <div style={{ marginTop: 16 }}>{action}</div>}
  </div>;
}

// ── Segmented control ────────────────────────────────────
function Segmented({ value, onChange, options }) {
  return <div className="seg">
    {options.map(opt => (
      <button key={opt.value} className={`seg-item ${value === opt.value ? 'active' : ''}`} onClick={() => onChange(opt.value)}>
        {opt.label}
      </button>
    ))}
  </div>;
}

// ── Month picker (arrows + label) ────────────────────────
function MonthPicker({ month, onChange }) {
  const prev = () => {
    const [y, m] = month.split('-').map(Number);
    const d = new Date(y, m - 2, 1);
    onChange(getMonthKey(d));
  };
  const next = () => {
    const [y, m] = month.split('-').map(Number);
    const d = new Date(y, m, 1);
    onChange(getMonthKey(d));
  };
  return <div className="row" style={{ gap: 4 }}>
    <button className="btn-ico sm" onClick={prev}><Icon.chevLeft size={16} /></button>
    <div style={{ minWidth: 140, textAlign: 'center', fontWeight: 600, fontSize: 14 }}>{formatMonthLabel(month)}</div>
    <button className="btn-ico sm" onClick={next}><Icon.chevRight size={16} /></button>
  </div>;
}

// ── Section header ───────────────────────────────────────
function SectionHead({ title, desc, action, eyebrow }) {
  return <div className="row-between" style={{ marginBottom: 16, gap: 16, alignItems: 'flex-end', flexWrap: 'wrap' }}>
    <div>
      {eyebrow && <div className="eyebrow" style={{ marginBottom: 6 }}>{eyebrow}</div>}
      <h2 className="h2">{title}</h2>
      {desc && <p className="muted" style={{ marginTop: 4, fontSize: 14 }}>{desc}</p>}
    </div>
    {action}
  </div>;
}

// ── Page header with title (for internal pages) ─────────
function PageHeader({ title, subtitle, right }) {
  return <header style={{ marginBottom: 24 }}>
    <div className="row-between" style={{ flexWrap: 'wrap', gap: 12 }}>
      <div>
        <h1 className="h1">{title}</h1>
        {subtitle && <p className="muted" style={{ marginTop: 6, fontSize: 15 }}>{subtitle}</p>}
      </div>
      {right && <div className="row" style={{ flexWrap: 'wrap', gap: 8 }}>{right}</div>}
    </div>
  </header>;
}

// ── Card (reusable) ──────────────────────────────────────
function Card({ children, className = '', pad = 'md', ...rest }) {
  const p = pad === 'lg' ? 'card-pad-lg' : pad === 'sm' ? 'card-pad-sm' : pad === 'none' ? '' : 'card-pad';
  return <div className={`card ${p} ${className}`} {...rest}>{children}</div>;
}

// ── Copyable value display ───────────────────────────────
function Stat({ label, value, sub, tone, icon }) {
  const IconCmp = icon ? Icon[icon] : null;
  return <div className="col-2">
    <div className="row" style={{ gap: 8, color: 'var(--text-3)' }}>
      {IconCmp && <IconCmp size={14} />}
      <span className="eyebrow" style={{ fontSize: 11 }}>{label}</span>
    </div>
    <div className={`amount-md ${tone ? `text-${tone}` : ''}`} style={{ marginTop: 2 }}>{value}</div>
    {sub && <div className="muted-2" style={{ fontSize: 12 }}>{sub}</div>}
  </div>;
}

// Expose
Object.assign(window, {
  ToastProvider, useToast,
  Modal, useConfirm,
  CategoryDot, AccountDot,
  Amount, Bar, Empty,
  Segmented, MonthPicker, SectionHead, PageHeader, Card, Stat,
  CATEGORY_SLOT, CATEGORY_ICON,
});
