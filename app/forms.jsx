// ============================================================
// FORMS — Add/edit modals for income, expense, budget, credit card, loan
// ============================================================

const { useState: useS, useEffect: useE, useMemo: useM } = React;

// Generic form field wrapper
const F = ({ label, children, span }) => (
  <div className="field" style={span ? { gridColumn: `span ${span}` } : undefined}>
    <label className="field-label">{label}</label>
    {children}
  </div>
);

// Color palette for accounts and cards
const PALETTE = ['#7C5CFF','#FF4F32','#10B981','#F59E0B','#EF4444','#8B5CF6','#EC4899','#14B8A6','#0EA5E9','#6366F1'];

// ── INCOME FORM ───────────────────────────────────────────
function IncomeForm({ data, initial, onSave, onClose, onDelete }) {
  const [f, setF] = useS(() => initial || {
    date: today(), sourceId: data.incomeSources[0]?.id || '',
    description: '', amount: '', currency: 'COP',
    accountId: data.accounts[0]?.id || '',
    isRenta: true, notes: '',
  });
  const save = () => {
    if (!f.amount || parseFloat(f.amount) <= 0) return;
    onSave({ ...f, amount: parseFloat(f.amount) });
  };
  return <>
    <div className="field-row field-row-2">
      <F label="Fecha"><input className="input" type="date" value={f.date} onChange={e => setF({ ...f, date: e.target.value })} /></F>
      <F label="Fuente">
        <CustomSelect className="select" value={f.sourceId} onChange={e => setF({ ...f, sourceId: e.target.value })}>
          {data.incomeSources.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </CustomSelect>
      </F>
    </div>
    <F label="Descripción"><input className="input" value={f.description} onChange={e => setF({ ...f, description: e.target.value })} placeholder="Opcional" /></F>
    <div className="field-row field-row-2">
      <F label="Monto"><input className="input" type="number" step="0.01" value={f.amount} onChange={e => setF({ ...f, amount: e.target.value })} placeholder="0" /></F>
      <F label="Moneda">
        <CustomSelect className="select" value={f.currency} onChange={e => setF({ ...f, currency: e.target.value })}>
          <option value="COP">COP</option><option value="USD">USD</option>
        </CustomSelect>
      </F>
    </div>
    <F label="Cuenta destino">
      <CustomSelect className="select" value={f.accountId || ''} onChange={e => setF({ ...f, accountId: e.target.value || null })}>
        <option value="">Sin asignar</option>
        {sortAccountsHierarchical(data.accounts.filter(a => a.active)).map(a => <option key={a.id} value={a.id}>{a.parentId ? '↳ ' : ''}{a.name} ({a.currency})</option>)}
      </CustomSelect>
    </F>
    <label className="checkbox-row">
      <input type="checkbox" className="checkbox" checked={!!f.isRenta} onChange={e => setF({ ...f, isRenta: e.target.checked })} />
      <span>Constitutivo de renta (ingreso real)</span>
    </label>
    <F label="Notas"><input className="input" value={f.notes || ''} onChange={e => setF({ ...f, notes: e.target.value })} placeholder="Opcional" /></F>
    <div className="modal-actions">
      {onDelete && <button className="btn btn-ghost" style={{ color: 'var(--negative)' }} onClick={onDelete}><Icon.trash size={16} /> Eliminar</button>}
      <div style={{ flex: 1 }} />
      <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
      <button className="btn btn-primary" onClick={save}>Guardar</button>
    </div>
  </>;
}

// ── BUDGET FORM ───────────────────────────────────────────
function BudgetForm({ data, initial, onSave, onClose, onDelete, defaultMonth, defaultGroupId }) {
  const [f, setF] = useS(() => initial || {
    month: defaultMonth || currentMonthKey(),
    categoryId: data.expenseCategories[0]?.id || '',
    description: '', plannedAmount: '', currency: 'COP',
    groupId: defaultGroupId || '',
    isFixed: true,
    accountId: '',
  });
  const groups = data.budgetGroups || [];
  const save = () => {
    if (!f.plannedAmount) return;
    onSave({ ...f, plannedAmount: parseFloat(f.plannedAmount), groupId: f.groupId || null, accountId: f.accountId || null });
  };
  return <>
    <div className="field-row field-row-2">
      <F label="Mes"><input className="input" type="month" value={f.month} onChange={e => setF({ ...f, month: e.target.value })} /></F>
      <F label="Categoría">
        <CustomSelect className="select" value={f.categoryId} onChange={e => setF({ ...f, categoryId: e.target.value })}>
          {data.expenseCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </CustomSelect>
      </F>
    </div>
    <F label="Descripción"><input className="input" value={f.description} onChange={e => setF({ ...f, description: e.target.value })} placeholder="Ej: Arriendo, Netflix..." /></F>
    <div className="field-row field-row-2">
      <F label="Monto estimado"><input className="input" type="number" step="0.01" value={f.plannedAmount} onChange={e => setF({ ...f, plannedAmount: e.target.value })} placeholder="0" /></F>
      <F label="Moneda">
        <CustomSelect className="select" value={f.currency} onChange={e => setF({ ...f, currency: e.target.value })}>
          <option value="COP">COP</option><option value="USD">USD</option>
        </CustomSelect>
      </F>
    </div>
    <div className="field-row field-row-2">
      <F label="Tipo">
        <CustomSelect className="select" value={f.isFixed ? 'fixed' : 'variable'} onChange={e => setF({ ...f, isFixed: e.target.value === 'fixed' })}>
          <option value="fixed">Fija</option>
          <option value="variable">Variable</option>
        </CustomSelect>
      </F>
      <F label="Cuenta asignada">
        <CustomSelect className="select" value={f.accountId || ''} onChange={e => setF({ ...f, accountId: e.target.value || null })}>
          <option value="">Sin asignar</option>
          {sortAccountsHierarchical(data.accounts.filter(a => a.active)).map(a => <option key={a.id} value={a.id}>{a.parentId ? '↳ ' : ''}{a.name}</option>)}
        </CustomSelect>
      </F>
    </div>
    {groups.length > 0 && (
      <F label="Grupo (opcional)">
        <CustomSelect className="select" value={f.groupId || ''} onChange={e => setF({ ...f, groupId: e.target.value || null })}>
          <option value="">Sin grupo</option>
          {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
        </CustomSelect>
      </F>
    )}
    <div className="modal-actions">
      {onDelete && <button className="btn btn-ghost" style={{ color: 'var(--negative)' }} onClick={onDelete}><Icon.trash size={16} /> Eliminar</button>}
      <div style={{ flex: 1 }} />
      <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
      <button className="btn btn-primary" onClick={save}>Guardar</button>
    </div>
  </>;
}

// ── EXPENSE FORM (GastoForm-style) ──────────────────────
function ExpenseForm({ data, initial, onSave, onClose, onDelete, editScope }) {
  const isEdit = !!initial?.id;
  const [f, setF] = useS(() => initial ? {
    type: initial.type || 'puntual',
    date: initial.date || today(),
    categoryId: initial.categoryId || data.expenseCategories[0]?.id || '',
    description: initial.description || '',
    amount: initial.amount || '',
    currency: initial.currency || 'COP',
    accountId: initial.accountId || '',
    status: initial.status || 'planned',
    recurrence: initial.recurrence || 'monthly',
    endDate: '',
    groupId: initial.groupId || '',
    showInBudget: initial.showInBudget || false,
    notes: initial.notes || '',
  } : {
    type: 'puntual', date: today(),
    categoryId: data.expenseCategories[0]?.id || '',
    description: '', amount: '', currency: 'COP', accountId: '',
    status: 'planned', recurrence: 'monthly', endDate: '',
    groupId: '', showInBudget: false, notes: '',
  });
  const set = (k, v) => setF(p => ({ ...p, [k]: v }));
  const groups = data.budgetGroups || [];

  // Calculate default endDate based on recurrence + startDate
  const calcDefaultEnd = (startDate, recurrence) => {
    if (!startDate) return '';
    const d = new Date(startDate + 'T12:00:00');
    if (recurrence === 'yearly')       d.setFullYear(d.getFullYear() + 5);
    else if (recurrence === 'monthly') d.setMonth(d.getMonth() + 12);
    else if (recurrence === 'weekly')  d.setMonth(d.getMonth() + 12);
    return d.toISOString().slice(0, 10);
  };

  // Auto-update endDate when type/recurrence/startDate changes
  const setWithDefault = (k, v) => setF(p => {
    const next = { ...p, [k]: v };
    if ((k === 'type' && v === 'recurrente') || k === 'recurrence' || k === 'date') {
      if (next.type === 'recurrente') {
        next.endDate = calcDefaultEnd(next.date, next.recurrence);
      }
    }
    return next;
  });

  const previewCount = (!isEdit && f.type === 'recurrente' && f.date && f.endDate)
    ? generateRecurrenceDates(f.date, f.endDate, f.recurrence).length : 0;

  const save = () => {
    if (!f.amount || !f.date) return;
    if (!isEdit && f.type === 'recurrente' && !f.endDate) return;
    onSave({ ...f, amount: parseFloat(f.amount), groupId: f.groupId || null, accountId: f.accountId || null });
  };

  return <>
    {!isEdit && (
      <div className="field-row field-row-2">
        <F label="Tipo">
          <CustomSelect className="select" value={f.type} onChange={e => setWithDefault('type', e.target.value)}>
            <option value="puntual">Puntual (fecha única)</option>
            <option value="recurrente">Recurrente</option>
          </CustomSelect>
        </F>
        <F label={f.type === 'puntual' ? 'Fecha' : 'Fecha de inicio'}>
          <input className="input" type="date" value={f.date} onChange={e => setWithDefault('date', e.target.value)} />
        </F>
      </div>
    )}
    {isEdit && (
      <F label="Fecha"><input className="input" type="date" value={f.date} onChange={e => set('date', e.target.value)} /></F>
    )}
    {/* Recurrence controls — new creation */}
    {!isEdit && f.type === 'recurrente' && (
      <div className="field-row field-row-2">
        <F label="Recurrencia">
          <CustomSelect className="select" value={f.recurrence} onChange={e => setWithDefault('recurrence', e.target.value)}>
            <option value="weekly">Semanal</option>
            <option value="monthly">Mensual</option>
            <option value="yearly">Anual</option>
          </CustomSelect>
        </F>
        <F label="Fecha de fin *">
          <input className="input" type="date" value={f.endDate || ''} onChange={e => set('endDate', e.target.value)}
            style={!f.endDate ? {borderColor:'var(--negative)',boxShadow:'0 0 0 1px var(--negative)'} : {}}/>
        </F>
      </div>
    )}
    {!isEdit && f.type === 'recurrente' && previewCount > 0 && (
      <div style={{ padding: '6px 10px', background: 'var(--positive-soft)', borderRadius: 6, fontSize: 12, color: 'var(--positive)', marginBottom: 2 }}>
        Se crearán <strong>{previewCount} gastos independientes</strong> ({recurrenceLabel(f.recurrence).toLowerCase()})
      </div>
    )}
    {/* Recurrence controls — editing a series */}
    {isEdit && initial.recurrenceGroupId && (editScope === 'thisAndFuture' || editScope === 'all') && (
      <div className="field-row field-row-2">
        <F label="Recurrencia de la serie">
          <CustomSelect className="select" value={f.recurrence} onChange={e => set('recurrence', e.target.value)}>
            <option value="weekly">Semanal</option>
            <option value="monthly">Mensual</option>
            <option value="yearly">Anual</option>
          </CustomSelect>
        </F>
        <F label="Convertir a">
          <CustomSelect className="select" value={f.type} onChange={e => set('type', e.target.value)}>
            <option value="recurrente">Recurrente (mantener serie)</option>
            <option value="puntual">Puntual (eliminar futuros)</option>
          </CustomSelect>
        </F>
      </div>
    )}
    <div className="field-row field-row-2">
      <F label="Categoría">
        <CustomSelect className="select" value={f.categoryId} onChange={e => set('categoryId', e.target.value)}>
          {data.expenseCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </CustomSelect>
      </F>
      <F label="Descripción">
        <input className="input" value={f.description} onChange={e => set('description', e.target.value)} placeholder="Ej: Mercado Éxito" />
      </F>
    </div>
    <div className="field-row field-row-3">
      <F label="Monto" span={2}><input className="input" type="number" step="0.01" value={f.amount} onChange={e => set('amount', e.target.value)} placeholder="0" /></F>
      <F label="Moneda">
        <CustomSelect className="select" value={f.currency} onChange={e => set('currency', e.target.value)}>
          <option value="COP">COP</option><option value="USD">USD</option>
        </CustomSelect>
      </F>
    </div>
    <F label="Cuenta">
      <CustomSelect className="select" value={f.accountId || ''} onChange={e => set('accountId', e.target.value || null)}>
        <option value="">Sin asignar</option>
        {sortAccountsHierarchical(data.accounts.filter(a => a.active)).map(a => <option key={a.id} value={a.id}>{a.parentId ? '↳ ' : ''}{a.name}</option>)}
      </CustomSelect>
    </F>
    {groups.length > 0 && (
      <F label="Grupo de presupuesto">
        <CustomSelect className="select" value={f.groupId || ''} onChange={e => set('groupId', e.target.value || null)}>
          <option value="">Sin grupo</option>
          {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
        </CustomSelect>
      </F>
    )}
    <label className="checkbox-row">
      <input type="checkbox" className="checkbox" checked={!!f.showInBudget} onChange={e => set('showInBudget', e.target.checked)} />
      <span>Incluir en presupuesto</span>
    </label>
    <F label="Notas"><input className="input" value={f.notes || ''} onChange={e => set('notes', e.target.value)} placeholder="Opcional" /></F>
    {isEdit && editScope && editScope !== 'single' && (
      <div style={{ padding: '6px 10px', background: 'var(--warning-soft)', borderRadius: 6, fontSize: 12, color: 'var(--warning)' }}>
        {editScope === 'thisAndFuture' ? 'Se editará este gasto y todos los siguientes de la serie' : 'Se editarán todos los gastos de la serie'}
      </div>
    )}
    <div className="modal-actions">
      {onDelete && <button className="btn btn-ghost" style={{ color: 'var(--negative)' }} onClick={onDelete}><Icon.trash size={16} /> Eliminar</button>}
      <div style={{ flex: 1 }} />
      <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
      <button className="btn btn-primary" onClick={save}
        disabled={!f.amount || !f.date || (!isEdit && f.type === 'recurrente' && !f.endDate)}>
        Guardar
      </button>
    </div>
  </>;
}

// ── CREDIT CARD ITEM FORM ────────────────────────────────
function CCItemForm({ data, initial, onSave, onClose, onDelete, defaultCardId }) {
  const defaultCard = defaultCardId || data.creditCards[0]?.id || '';
  const src = initial || {};
  const initDate = src.purchaseDate || today();
  const initType = src.type || 'single';
  const initCard = data.creditCards.find(c => c.id === (src.cardId || defaultCard));
  const defaultRate = initType === 'installment' ? (initCard?.monthlyInterestRate || 0) : 0;

  const [f, setF] = useS({
    cardId: src.cardId || defaultCard,
    purchaseDate: initDate,
    description: src.description || '',
    categoryId: src.categoryId || '10',
    totalAmount: src.totalAmount || '',
    installments: src.installments || 1,
    type: initType,
    interestRate: src.interestRate !== undefined ? src.interestRate : defaultRate,
    startMonth: src.startMonth || calcStartMonth(initDate),
    endMonth: src.endMonth || '',
    notes: src.notes || '',
  });
  const set = (k, v) => setF(p => ({ ...p, [k]: v }));

  const [startMonthManual, setStartMonthManual] = useS(!!initial?.id);
  const [interestManual, setInterestManual] = useS(!!initial?.id);

  const handleDateChange = (v) => {
    set('purchaseDate', v);
    if (!startMonthManual) set('startMonth', calcStartMonth(v));
  };
  const handleTypeChange = (newType) => {
    set('type', newType);
    if (!interestManual) {
      const card = data.creditCards.find(c => c.id === f.cardId);
      set('interestRate', newType === 'installment' ? (card?.monthlyInterestRate || 0) : 0);
    }
  };
  const handleCardChange = (cardId) => {
    set('cardId', cardId);
    if (!interestManual && f.type === 'installment') {
      const card = data.creditCards.find(c => c.id === cardId);
      set('interestRate', card?.monthlyInterestRate || 0);
    }
  };

  const card = data.creditCards.find(c => c.id === f.cardId);
  const cur = card?.currency || 'COP';

  // Preview
  const showPreview = f.totalAmount && f.type === 'installment' && parseInt(f.installments) > 1;
  const baseInstallment = showPreview ? Math.round(parseFloat(f.totalAmount) / parseInt(f.installments)) : 0;
  const rate = parseFloat(f.interestRate) || 0;
  const withInterest = showPreview ? Math.round(baseInstallment * (1 + rate / 100)) : 0;

  const save = () => {
    if (!f.totalAmount || !f.cardId) return;
    onSave({
      ...f,
      totalAmount: parseFloat(f.totalAmount),
      installments: parseInt(f.installments) || 1,
      interestRate: parseFloat(f.interestRate) || 0,
    });
  };

  return <>
    {data.creditCards.length === 0 && (
      <div style={{ padding: '10px 12px', background: 'var(--warning-soft)', borderRadius: 8, fontSize: 13, marginBottom: 12, color: 'var(--warning)' }}>
        Primero crea una tarjeta en Ajustes → Tarjetas
      </div>
    )}
    <div className="field-row field-row-2">
      <F label="Tarjeta">
        <CustomSelect className="select" value={f.cardId} onChange={e => handleCardChange(e.target.value)}>
          <option value="">— Selecciona —</option>
          {data.creditCards.filter(c => c.active !== false).map(c => (
            <option key={c.id} value={c.id}>{c.name}{c.lastFour ? ` (••${c.lastFour})` : ''}</option>
          ))}
        </CustomSelect>
      </F>
      <F label="Tipo">
        <CustomSelect className="select" value={f.type} onChange={e => handleTypeChange(e.target.value)}>
          <option value="single">Pago único (diferido)</option>
          <option value="installment">Compra a cuotas</option>
          <option value="subscription">Suscripción (recurrente)</option>
        </CustomSelect>
      </F>
    </div>
    <div className="field-row field-row-2">
      <F label="Descripción">
        <input className="input" value={f.description} onChange={e => set('description', e.target.value)} placeholder="Ej: Supermercado / Televisor / Netflix" />
      </F>
      <F label="Categoría">
        <CustomSelect className="select" value={f.categoryId} onChange={e => set('categoryId', e.target.value)}>
          {data.expenseCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </CustomSelect>
      </F>
    </div>
    <div className="field-row field-row-3">
      <F label={f.type === 'subscription' ? 'Monto mensual' : 'Monto total'}>
        <input className="input" type="number" step="0.01" value={f.totalAmount} onChange={e => set('totalAmount', e.target.value)} />
      </F>
      {f.type === 'installment' && (
        <F label="Nº cuotas">
          <input className="input" type="number" min="2" value={f.installments} onChange={e => set('installments', e.target.value)} />
        </F>
      )}
      <F label="Fecha de compra">
        <input className="input" type="date" value={f.purchaseDate} onChange={e => handleDateChange(e.target.value)} />
      </F>
    </div>
    <div className="field-row field-row-2">
      <F label="Mes inicio pago">
        <input className="input" type="month" value={f.startMonth} onChange={e => { set('startMonth', e.target.value); setStartMonthManual(true); }} />
        <span style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 3, display: 'block' }}>Auto: 1–15 → mismo mes · 16–31 → mes siguiente</span>
      </F>
      <F label="Interés mensual (%)">
        <input className="input" type="number" step="0.01" min="0" value={f.interestRate} onChange={e => { set('interestRate', e.target.value); setInterestManual(true); }} />
      </F>
    </div>
    {f.type === 'subscription' && (
      <F label="Último mes de pago (opcional)">
        <input className="input" type="month" value={f.endMonth || ''} onChange={e => set('endMonth', e.target.value || null)} />
      </F>
    )}
    {showPreview && (
      <div style={{ padding: '8px 12px', background: 'var(--info-soft)', borderRadius: 8, fontSize: 13, marginBottom: 4 }}>
        Cuota mensual: <strong>{fmtNum(withInterest, cur)} {cur}</strong>
        {rate > 0 && <span style={{ color: 'var(--text-3)' }}> (base {fmtNum(baseInstallment, cur)} + {rate}% interés)</span>}
        {' '}por {f.installments} meses desde {formatMonthLabel(f.startMonth || currentMonthKey())}
      </div>
    )}
    <F label="Notas">
      <input className="input" value={f.notes || ''} onChange={e => set('notes', e.target.value)} placeholder="Opcional" />
    </F>
    <div className="modal-actions">
      {onDelete && <button className="btn btn-ghost" style={{ color: 'var(--negative)' }} onClick={onDelete}><Icon.trash size={16} /> Eliminar</button>}
      <div style={{ flex: 1 }} />
      <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
      <button className="btn btn-primary" onClick={save} disabled={!f.cardId || !f.totalAmount}>Guardar</button>
    </div>
  </>;
}

// ── CREDIT CARD (the card itself) ─────────────────────────
function CardForm({ initial, onSave, onClose, onDelete }) {
  const [f, setF] = useS(() => initial || {
    name: '', bank: '', lastFour: '', cutoffDay: 15, paymentDay: 1,
    creditLimit: '', currency: 'COP',
    color: PALETTE[0], monthlyInterestRate: 0, active: true,
  });
  const set = (k, v) => setF(p => ({ ...p, [k]: v }));
  return <>
    <div className="field-row field-row-2">
      <F label="Nombre"><input className="input" value={f.name} onChange={e => set('name', e.target.value)} placeholder="Visa Platinum" /></F>
      <F label="Banco"><input className="input" value={f.bank} onChange={e => set('bank', e.target.value)} /></F>
    </div>
    <div className="field-row field-row-2">
      <F label="Últimos 4 dígitos"><input className="input" value={f.lastFour || ''} onChange={e => set('lastFour', e.target.value)} maxLength={4} placeholder="1234" /></F>
      <F label="Moneda">
        <CustomSelect className="select" value={f.currency} onChange={e => set('currency', e.target.value)}>
          <option value="COP">COP</option><option value="USD">USD</option>
        </CustomSelect>
      </F>
    </div>
    <div className="field-row field-row-3">
      <F label="Día de corte"><input className="input" type="number" min="1" max="31" value={f.cutoffDay} onChange={e => set('cutoffDay', e.target.value)} /></F>
      <F label="Día de pago"><input className="input" type="number" min="1" max="31" value={f.paymentDay} onChange={e => set('paymentDay', e.target.value)} /></F>
      <F label="Interés mensual %"><input className="input" type="number" step="0.01" min="0" value={f.monthlyInterestRate || 0} onChange={e => set('monthlyInterestRate', parseFloat(e.target.value) || 0)} /></F>
    </div>
    <F label="Cupo de crédito"><input className="input" type="number" value={f.creditLimit || ''} onChange={e => set('creditLimit', e.target.value)} /></F>
    <F label="Color">
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 4 }}>
        {PALETTE.map(c => (
          <button key={c} type="button" onClick={() => set('color', c)}
            style={{ width: 28, height: 28, borderRadius: '50%', background: c, border: f.color === c ? '3px solid var(--text)' : '3px solid transparent', cursor: 'pointer', flexShrink: 0 }} />
        ))}
      </div>
    </F>
    <label className="checkbox-row">
      <input type="checkbox" className="checkbox" checked={f.active !== false} onChange={e => set('active', e.target.checked)} />
      <span>Tarjeta activa</span>
    </label>
    <div className="modal-actions">
      {onDelete && <button className="btn btn-ghost" style={{ color: 'var(--negative)' }} onClick={onDelete}><Icon.trash size={16} /> Eliminar</button>}
      <div style={{ flex: 1 }} />
      <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
      <button className="btn btn-primary" onClick={() => f.name && onSave({
        ...f,
        cutoffDay: parseInt(f.cutoffDay) || 15,
        paymentDay: parseInt(f.paymentDay) || 1,
        creditLimit: parseFloat(f.creditLimit) || 0,
        monthlyInterestRate: parseFloat(f.monthlyInterestRate) || 0,
      })}>Guardar</button>
    </div>
  </>;
}

// ── LOAN FORM ─────────────────────────────────────────────
function LoanForm({ data, initial, onSave, onClose, onDelete, isDebt }) {
  const [f, setF] = useS(() => initial || {
    person: '', amount: '', currency: 'COP',
    date: today(), dueDate: '', notes: '', status: 'pending',
    accountId: data.accounts[0]?.id || '',
    payments: [],
  });
  const existingPersons = [...new Set((data.loansGiven || []).map(l => l.person).filter(Boolean))];
  return <>
    <F label={isDebt ? 'Acreedor' : 'Persona'}>
      <input className="input" list="loan-persons" value={f.person} onChange={e => setF({ ...f, person: e.target.value })} />
      <datalist id="loan-persons">{existingPersons.map(p => <option key={p} value={p} />)}</datalist>
    </F>
    <div className="field-row field-row-2">
      <F label="Monto"><input className="input" type="number" step="0.01" value={f.amount} onChange={e => setF({ ...f, amount: e.target.value })} /></F>
      <F label="Moneda">
        <CustomSelect className="select" value={f.currency} onChange={e => setF({ ...f, currency: e.target.value })}>
          <option value="COP">COP</option><option value="USD">USD</option>
        </CustomSelect>
      </F>
    </div>
    <div className="field-row field-row-2">
      <F label="Fecha"><input className="input" type="date" value={f.date} onChange={e => setF({ ...f, date: e.target.value })} /></F>
      <F label="Vencimiento"><input className="input" type="date" value={f.dueDate || ''} onChange={e => setF({ ...f, dueDate: e.target.value })} /></F>
    </div>
    <F label="Notas"><textarea className="textarea" value={f.notes || ''} onChange={e => setF({ ...f, notes: e.target.value })} style={{ minHeight: 60 }} /></F>
    <div className="modal-actions">
      {onDelete && <button className="btn btn-ghost" style={{ color: 'var(--negative)' }} onClick={onDelete}><Icon.trash size={16} /> Eliminar</button>}
      <div style={{ flex: 1 }} />
      <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
      <button className="btn btn-primary" onClick={() => f.person && f.amount && onSave({ ...f, amount: parseFloat(f.amount), payments: f.payments || [] })}>Guardar</button>
    </div>
  </>;
}

// ── ACCOUNT FORM ──────────────────────────────────────────
function AccountForm({ data, initial, onSave, onClose, onDelete }) {
  const [f, setF] = useS(() => initial || {
    name: '', bank: '', currency: 'COP', type: 'checking',
    active: true, parentId: null, color: PALETTE[0],
  });
  const set = (k, v) => setF(p => ({ ...p, [k]: v }));
  const parentAccounts = (data.accounts || []).filter(a => !a.parentId && a.id !== initial?.id);
  return <>
    <F label="Nombre"><input className="input" value={f.name} onChange={e => set('name', e.target.value)} placeholder="Ej: Cuenta de Ahorros Bancolombia" /></F>
    <div className="field-row field-row-2">
      <F label="Banco / Origen"><input className="input" value={f.bank || ''} onChange={e => set('bank', e.target.value)} placeholder="Ej: Bancolombia" /></F>
      <F label="Moneda">
        <CustomSelect className="select" value={f.currency} onChange={e => set('currency', e.target.value)}>
          <option value="COP">COP</option><option value="USD">USD</option><option value="EUR">EUR</option>
        </CustomSelect>
      </F>
    </div>
    <div className="field-row field-row-2">
      <F label="Tipo">
        <CustomSelect className="select" value={f.type} onChange={e => set('type', e.target.value)}>
          <option value="checking">Cuenta Corriente</option>
          <option value="savings">Cuenta de Ahorros</option>
          <option value="cash">Efectivo</option>
          <option value="pocket">Bolsillo / Cajita</option>
        </CustomSelect>
      </F>
      <F label="Cuenta padre (si es bolsillo)">
        <CustomSelect className="select" value={f.parentId || ''} onChange={e => set('parentId', e.target.value || null)}>
          <option value="">— Ninguna (cuenta principal) —</option>
          {parentAccounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
        </CustomSelect>
      </F>
    </div>
    <F label="Color">
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 4 }}>
        {PALETTE.map(c => (
          <button key={c} type="button" onClick={() => set('color', c)}
            style={{ width: 28, height: 28, borderRadius: '50%', background: c, border: f.color === c ? '3px solid var(--text)' : '3px solid transparent', cursor: 'pointer', flexShrink: 0 }} />
        ))}
      </div>
    </F>
    <label className="checkbox-row">
      <input type="checkbox" className="checkbox" checked={f.active !== false} onChange={e => set('active', e.target.checked)} />
      <span>Cuenta activa</span>
    </label>
    <div className="modal-actions">
      {onDelete && <button className="btn btn-ghost" style={{ color: 'var(--negative)' }} onClick={onDelete}><Icon.trash size={16} /> Eliminar</button>}
      <div style={{ flex: 1 }} />
      <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
      <button className="btn btn-primary" onClick={() => f.name.trim() && onSave(f)}>Guardar</button>
    </div>
  </>;
}

Object.assign(window, { IncomeForm, BudgetForm, ExpenseForm, CCItemForm, CardForm, LoanForm, AccountForm, PALETTE });
