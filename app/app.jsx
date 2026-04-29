// ============================================================
// APP SHELL — Navigation, routing, theme, seeds demo data
// ============================================================

const { useState: uuS, useEffect: uuE, useMemo: uuM, useCallback: uuC } = React;

const NAV = [
  { id: 'dashboard', label: 'Inicio', icon: 'home' },
  { id: 'income', label: 'Ingresos', icon: 'income' },
  { id: 'budget', label: 'Presupuesto', icon: 'budget' },
  { id: 'expenses', label: 'Gastos compartidos', icon: 'expense' },
  { id: 'credit', label: 'Tarjetas', icon: 'card' },
  { id: 'loans', label: 'Préstamos', icon: 'loan' },
  { id: 'config', label: 'Ajustes', icon: 'cog' },
];
const BOTTOM_NAV = ['dashboard', 'income', 'budget', 'expenses', 'more'];
const MORE_PAGES = NAV.slice(4).map(n => n.id); // ['credit', 'loans', 'config']

// Seed demo data if empty (so the prototype has something to show)
function seedIfEmpty(d) {
  if (d.income.length > 0 || d.expenses.length > 0 || d.budget.length > 0) return d;
  const m = currentMonthKey();
  const [y, mo] = m.split('-');
  const day = (n) => `${y}-${mo}-${String(n).padStart(2, '0')}`;

  return {
    ...d,
    income: [
      { id: uid(), date: day(5), sourceId: '1', description: 'Salario abril', amount: 6500000, currency: 'COP', accountId: '1' },
      { id: uid(), date: day(12), sourceId: '2', description: 'Proyecto Acme', amount: 1200, currency: 'USD', accountId: '2' },
    ],
    budget: [
      { id: uid(), month: m, categoryId: '1', description: 'Arriendo', plannedAmount: 1800000, currency: 'COP', recurrence: 'monthly' },
      { id: uid(), month: m, categoryId: '2', description: 'Mercado', plannedAmount: 1200000, currency: 'COP', recurrence: 'monthly' },
      { id: uid(), month: m, categoryId: '3', description: 'Gasolina', plannedAmount: 400000, currency: 'COP', recurrence: 'monthly' },
      { id: uid(), month: m, categoryId: '4', description: 'Servicios públicos', plannedAmount: 350000, currency: 'COP', recurrence: 'monthly' },
      { id: uid(), month: m, categoryId: '6', description: 'Netflix + Spotify', plannedAmount: 65000, currency: 'COP', recurrence: 'monthly' },
    ],
    expenses: [
      { id: uid(), date: day(2), month: m, categoryId: '1', description: 'Arriendo abril', amount: 1800000, currency: 'COP', accountId: '1', status: 'executed', executed: true },
      { id: uid(), date: day(4), month: m, categoryId: '2', description: 'Éxito', amount: 320000, currency: 'COP', accountId: '1', status: 'executed', executed: true },
      { id: uid(), date: day(8), month: m, categoryId: '3', description: 'Terpel', amount: 180000, currency: 'COP', accountId: '1', status: 'executed', executed: true },
      { id: uid(), date: day(10), month: m, categoryId: '4', description: 'EPM', amount: 280000, currency: 'COP', accountId: '1', status: 'executed', executed: true },
      { id: uid(), date: day(22), month: m, categoryId: '2', description: 'Mercado quincena', amount: 450000, currency: 'COP', accountId: '1', status: 'planned', executed: false },
      { id: uid(), date: day(25), month: m, categoryId: '6', description: 'Cine', amount: 80000, currency: 'COP', accountId: '1', status: 'planned', executed: false },
      { id: uid(), date: day(28), month: m, categoryId: '5', description: 'Consulta médica', amount: 220000, currency: 'COP', accountId: '1', status: 'planned', executed: false },
    ],
    creditCards: [
      { id: uid(), name: 'Visa Platinum', bank: 'Bancolombia', cutoffDay: 15, paymentDay: 5, creditLimit: 10000000, currency: 'COP' },
    ],
    loansGiven: [
      { id: uid(), person: 'Carlos', amount: 500000, currency: 'COP', date: day(1), dueDate: '', notes: '', status: 'pending' },
    ],
  };
}

function Sidebar({ page, setPage }) {
  return <aside className="sidebar">
    <div className="sidebar-brand">
      <div className="logo">$</div>
      <div>
        <div className="name">Cashflow</div>
        <div className="sub">Personal</div>
      </div>
    </div>
    <div className="nav-section">Principal</div>
    {NAV.slice(0, 4).map(n => <NavItem key={n.id} n={n} page={page} setPage={setPage} />)}
    <div className="nav-section">Más</div>
    {NAV.slice(4).map(n => <NavItem key={n.id} n={n} page={page} setPage={setPage} />)}
  </aside>;
}
function NavItem({ n, page, setPage }) {
  const IconCmp = Icon[n.icon];
  return <button className={`nav-item ${page === n.id ? 'active' : ''}`} onClick={() => setPage(n.id)}>
    <span className="ico"><IconCmp size={18} /></span>{n.label}
  </button>;
}

function MobileTopbar({ theme, setTheme }) {
  return <div className="mobile-topbar">
    <div className="brand">
      <div className="logo">$</div>
      <span>Cashflow</span>
    </div>
    <button className="btn-ico" onClick={() => setTheme(theme === 'pulse' ? 'edge' : 'pulse')} aria-label="Cambiar tema">
      {theme === 'pulse' ? <Icon.moon size={18} /> : <Icon.sun size={18} />}
    </button>
  </div>;
}

function BottomNav({ page, setPage, openMore }) {
  return <nav className="bottom-nav">
    <div className="bottom-nav-inner">
      {BOTTOM_NAV.map(id => {
        if (id === 'more') {
          return <button key={id} className={`bn-item ${MORE_PAGES.includes(page) ? 'active' : ''}`} onClick={openMore}>
            <span className="ico"><Icon.menu size={22} /></span><span>Más</span>
          </button>;
        }
        const n = NAV.find(x => x.id === id);
        const IconCmp = Icon[n.icon];
        return <button key={id} className={`bn-item ${page === id ? 'active' : ''}`} onClick={() => setPage(id)}>
          <span className="ico"><IconCmp size={22} /></span><span>{n.label}</span>
        </button>;
      })}
    </div>
  </nav>;
}

function MoreDrawer({ open, onClose, page, setPage }) {
  if (!open) return null;
  const items = NAV.filter(n => !BOTTOM_NAV.includes(n.id));
  return <div className="drawer-overlay" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
    <div className="drawer">
      <div className="drawer-handle" />
      <h3 className="h3" style={{ padding: '0 12px 12px' }}>Más</h3>
      {items.map(n => {
        const IconCmp = Icon[n.icon];
        return <button key={n.id} className={`nav-item ${page === n.id ? 'active' : ''}`}
          style={{ width: '100%', padding: '16px 12px', fontSize: 15 }}
          onClick={() => { setPage(n.id); onClose(); }}>
          <span className="ico"><IconCmp size={20} /></span>{n.label}
        </button>;
      })}
    </div>
  </div>;
}

function App() {
  const [data, setDataRaw] = uuS(() => seedIfEmpty(loadData()));
  const [theme, setTheme] = uuS(() => localStorage.getItem('finanzas_theme') || 'pulse');
  const [page, setPage] = uuS(() => localStorage.getItem('finanzas_page') || 'dashboard');
  const [month, setMonth] = uuS(() => currentMonthKey());
  const [moreOpen, setMoreOpen] = uuS(false);

  const setData = uuC((updater) => {
    setDataRaw(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      saveData(next);
      return next;
    });
  }, []);

  uuE(() => { document.documentElement.dataset.theme = theme; localStorage.setItem('finanzas_theme', theme); }, [theme]);
  uuE(() => { localStorage.setItem('finanzas_page', page); }, [page]);

  const pageProps = { data, setData, month, setMonth, goto: setPage };
  let content;
  if (page === 'dashboard') content = <Dashboard {...pageProps} />;
  else if (page === 'income') content = <IncomePage {...pageProps} />;
  else if (page === 'budget') content = <BudgetPage {...pageProps} />;
  else if (page === 'expenses') content = <ExpensesPage {...pageProps} />;
  else if (page === 'credit') content = <CreditPage {...pageProps} />;
  else if (page === 'loans') content = <LoansPage data={data} setData={setData} />;
  else if (page === 'config') content = <ConfigPage data={data} setData={setData} theme={theme} setTheme={setTheme} />;

  return <ToastProvider>
    <div className="app-shell">
      <Sidebar page={page} setPage={setPage} />
      <MobileTopbar theme={theme} setTheme={setTheme} />
      <main className="main">
        <div className="main-inner">{content}</div>
      </main>
      <BottomNav page={page} setPage={setPage} openMore={() => setMoreOpen(true)} />
      <MoreDrawer open={moreOpen} onClose={() => setMoreOpen(false)} page={page} setPage={setPage} />
    </div>
  </ToastProvider>;
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
