// ============================================================
// CORE: Data layer, helpers, business logic
// Preserves all logic from V2.0
// ============================================================

const STORAGE_KEY = 'finanzas_personales_v3';
const LEGACY_KEYS = ['finanzas_personales_v2', 'finanzas_personales_v1'];

const defaultData = {
  accounts: [
    { id: '1', name: 'Cuenta Principal COP', bank: 'Bancolombia', currency: 'COP', type: 'checking', active: true, parentId: null, color: '#7C5CFF' },
    { id: '2', name: 'Cuenta USD', bank: 'Bancolombia', currency: 'USD', type: 'checking', active: true, parentId: null, color: '#10B981' },
    { id: '3', name: 'Efectivo', bank: 'Efectivo', currency: 'COP', type: 'cash', active: true, parentId: null, color: '#F59E0B' },
  ],
  expenseCategories: [
    { id: '1', name: 'Vivienda', icon: 'home' },
    { id: '2', name: 'Alimentación', icon: 'cart' },
    { id: '3', name: 'Transporte', icon: 'car' },
    { id: '4', name: 'Servicios', icon: 'bolt' },
    { id: '5', name: 'Salud', icon: 'health' },
    { id: '6', name: 'Entretenimiento', icon: 'film' },
    { id: '7', name: 'Personal', icon: 'user' },
    { id: '8', name: 'Seguros', icon: 'shield' },
    { id: '9', name: 'Educación', icon: 'book' },
    { id: '10', name: 'Otros', icon: 'tag' },
  ],
  incomeSources: [
    { id: '1', name: 'Salario Principal' },
    { id: '2', name: 'Freelance' },
  ],
  exchangeRates: [{ from: 'USD', to: 'COP', rate: 4200, date: '2026-04-01' }],
  creditCards: [],
  budgetGroups: [],
  ccBudgetAssignments: [],
  income: [],
  budget: [],
  expenses: [],
  creditCard: [],
  debts: [],
  loansGiven: [],
  savingsGoals: [],
  investments: [],
  spouseReconciliation: [],
  accountBalances: [],
  budgetNotes: {},
};

function loadData() {
  try {
    const d = localStorage.getItem(STORAGE_KEY);
    if (d) {
      const parsed = JSON.parse(d);
      return { ...defaultData, ...parsed };
    }
    // Migrate from legacy
    for (const k of LEGACY_KEYS) {
      const v = localStorage.getItem(k);
      if (v) {
        const parsed = JSON.parse(v);
        const merged = { ...defaultData, ...parsed };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
        return merged;
      }
    }
  } catch (e) { console.error('load error', e); }
  return { ...defaultData };
}

function saveData(data) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch (e) { console.error('save error', e); }
}

// ── ID + date helpers ─────────────────────────────────────────
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const monthNames = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const monthShort = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
const getMonthKey = (d) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
const formatMonthLabel = (key) => { const [y,m] = key.split('-'); return `${monthNames[parseInt(m)-1]} ${y}`; };
const formatMonthShort = (key) => { const [y,m] = key.split('-'); return `${monthShort[parseInt(m)-1]} ${y.slice(2)}`; };
const today = () => new Date().toISOString().slice(0,10);
const currentMonthKey = () => getMonthKey(new Date());
const formatDate = (str) => { if (!str) return ''; const [y,m,d] = str.split('-'); return `${d} ${monthShort[parseInt(m)-1]}`; };
const formatDateLong = (str) => { if (!str) return ''; const [y,m,d] = str.split('-'); return `${d} ${monthShort[parseInt(m)-1]} ${y}`; };

// ── Currency formatting ───────────────────────────────────────
const fmtNum = (amount, currency = 'COP') => {
  const n = parseFloat(amount) || 0;
  if (currency === 'COP') return new Intl.NumberFormat('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);
  if (currency === 'USD') return new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
  return new Intl.NumberFormat('es-CO', { minimumFractionDigits: 2 }).format(n);
};

const fmtCompact = (amount, currency = 'COP') => {
  const n = Math.abs(parseFloat(amount) || 0);
  const sign = (parseFloat(amount) || 0) < 0 ? '-' : '';
  if (currency === 'COP') {
    if (n >= 1e9) return `${sign}${(n/1e9).toFixed(1).replace(/\.0$/,'')}B`;
    if (n >= 1e6) return `${sign}${(n/1e6).toFixed(1).replace(/\.0$/,'')}M`;
    if (n >= 1e3) return `${sign}${(n/1e3).toFixed(0)}K`;
    return `${sign}${n.toFixed(0)}`;
  }
  if (n >= 1e6) return `${sign}${(n/1e6).toFixed(1)}M`;
  if (n >= 1e3) return `${sign}${(n/1e3).toFixed(1)}K`;
  return `${sign}${n.toFixed(2)}`;
};

const fmtStr = (amount, currency = 'COP') => `${currency} ${fmtNum(amount, currency)}`;

// ── Multi-currency aggregation ────────────────────────────────
function sumByCurrency(items, getAmt, getCur) {
  const t = {};
  items.forEach(i => { const c = getCur(i) || 'COP'; t[c] = (t[c] || 0) + (getAmt(i) || 0); });
  return t;
}
function addCBags(...bags) {
  const r = {};
  bags.forEach(b => Object.entries(b).forEach(([c, v]) => { r[c] = (r[c] || 0) + v; }));
  return r;
}
function subtractCBags(a, b) {
  const r = { ...a };
  Object.entries(b).forEach(([c, v]) => { r[c] = (r[c] || 0) - v; });
  return r;
}

// ── Recurring expense helpers ────────────────────────────────
function generateRecurrenceDates(startDate, endDate, recurrence) {
  const dates = [];
  const start = new Date(startDate + 'T12:00:00');
  let end;
  if (endDate) {
    end = new Date(endDate + 'T12:00:00');
  } else {
    end = new Date(start);
    if (recurrence === 'weekly') end.setMonth(end.getMonth() + 3);
    else if (recurrence === 'monthly') { end.setFullYear(end.getFullYear() + 1); end.setMonth(end.getMonth() - 1); }
    else if (recurrence === 'yearly') end.setFullYear(end.getFullYear() + 3);
  }
  let cur = new Date(start);
  let safety = 0;
  while (cur <= end && safety < 200) {
    const ds = `${cur.getFullYear()}-${String(cur.getMonth()+1).padStart(2,'0')}-${String(cur.getDate()).padStart(2,'0')}`;
    dates.push(ds);
    if (recurrence === 'weekly') cur.setDate(cur.getDate() + 7);
    else if (recurrence === 'monthly') cur.setMonth(cur.getMonth() + 1);
    else if (recurrence === 'yearly') cur.setFullYear(cur.getFullYear() + 1);
    safety++;
  }
  return dates;
}

const getExpenseMonth = (exp) => exp.date ? exp.date.slice(0, 7) : (exp.month || '');
const isExpenseOverdue = (exp) => exp.date <= today() && !exp.executed;
const recurrenceLabel = (r) => ({ weekly: 'Semanal', monthly: 'Mensual', yearly: 'Anual' })[r] || r;

// ── CC payment calculation ───────────────────────────────────
function calcStartMonth(dateStr) {
  const parts = dateStr.split('-').map(Number);
  const y = parts[0], m = parts[1], d = parts[2];
  if (d <= 15) return `${y}-${String(m).padStart(2,'0')}`;
  const next = new Date(y, m, 1);
  return getMonthKey(next);
}

function getCCPaymentForMonth(item, month) {
  if (!item.startMonth) return 0;
  const [sy,sm] = item.startMonth.split('-').map(Number);
  const [my,mm] = month.split('-').map(Number);
  const diff = (my - sy) * 12 + (mm - sm);
  const overrides = item.interestRateOverrides || {};
  const rate = overrides[month] !== undefined ? overrides[month] : (parseFloat(item.interestRate) || 0);
  const applyRate = (base) => rate > 0 ? Math.round(base * (1 + rate / 100)) : base;
  if (item.type === 'subscription') {
    if (diff < 0) return 0;
    if (item.endMonth) {
      const [ey,em] = item.endMonth.split('-').map(Number);
      if ((my - ey) * 12 + (mm - em) > 0) return 0;
    }
    return applyRate(parseFloat(item.totalAmount) || 0);
  }
  const n = parseInt(item.installments) || 1;
  if (n <= 1) return diff === 0 ? applyRate(parseFloat(item.totalAmount) || 0) : 0;
  if (diff >= 0 && diff < n) return applyRate(Math.round((parseFloat(item.totalAmount) || 0) / n));
  return 0;
}

// ── CC debt calculations ─────────────────────────────────────
function calcRemainingCapital(item, month) {
  const m = month || currentMonthKey();
  const amt = parseFloat(item.totalAmount) || 0;
  const [ny, nm] = m.split('-').map(Number);
  if (item.type === 'subscription') {
    if (!item.endMonth) return null;
    const [ey, em] = item.endMonth.split('-').map(Number);
    return Math.max(0, (ey - ny) * 12 + (em - nm) + 1) * amt;
  }
  const n = parseInt(item.installments) || 1;
  const [sy, sm] = (item.startMonth || m).split('-').map(Number);
  const remaining = Math.max(0, n - Math.max(0, (ny - sy) * 12 + (nm - sm)));
  return Math.round(amt / Math.max(n, 1)) * remaining;
}

function calcRemainingInterest(item, month) {
  const cap = calcRemainingCapital(item, month);
  if (cap === null) return null;
  return Math.round(cap * (parseFloat(item.interestRate) || 0) / 100);
}

// Expose to window
Object.assign(window, {
  STORAGE_KEY, defaultData, loadData, saveData,
  uid, monthNames, monthShort, getMonthKey, formatMonthLabel, formatMonthShort,
  today, currentMonthKey, formatDate, formatDateLong,
  fmtNum, fmtCompact, fmtStr,
  sumByCurrency, addCBags, subtractCBags,
  generateRecurrenceDates, getExpenseMonth, isExpenseOverdue, recurrenceLabel,
  calcStartMonth, getCCPaymentForMonth,
  calcRemainingCapital, calcRemainingInterest,
});
