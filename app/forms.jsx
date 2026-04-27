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

// ── INCOME FORM ───────────────────────────────────────────
function IncomeForm({ data, initial, onSave, onClose, onDelete }) {
  const [f, setF] = useS(() => initial || {
    date: today(), sourceId: data.incomeSources[0]?.id || '',
    description: '', amount: '', currency: 'COP', accountId: data.accounts[0]?.id || '',
  });
  const save = () => {
    if (!f.amount || parseFloat(f.amount) <= 0) return;
    onSave({ ...f, amount: parseFloat(f.amount) });
  };
  return <>
    <div className="field-row field-row-2">
      <F label="Fecha"><input className="input" type="date" value={f.date} onChange={e => setF({ ...f, date: e.target.value })} /></F>
      <F label="Fuente">
        <select className="select" value={f.sourceId} onChange={e => setF({ ...f, sourceId: e.target.value })}>
          {data.incomeSources.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </F>
    </div>
    <F label="Descripción"><input className="input" value={f.description} onChange={e => setF({ ...f, description: e.target.value })} placeholder="Opcional" /></F>
    <div className="field-row field-row-2">
      <F label="Monto"><input className="input" type="number" step="0.01" value={f.amount} onChange={e => setF({ ...f, amount: e.target.value })} placeholder="0" /></F>
      <F label="Moneda">
        <select className="select" value={f.currency} onChange={e => setF({ ...f, currency: e.target.value })}>
          <option value="COP">COP</option><option value="USD">USD</option>
        </select>
      </F>
    </div>
    <F label="Cuenta destino">
      <select className="select" value={f.accountId} onChange={e => setF({ ...f, accountId: e.target.value })}>
        {data.accounts.filter(a => a.active).map(a => <option key={a.id} value={a.id}>{a.name} ({a.currency})</option>)}
      </select>
    </F>
    <div className="modal-actions">
      {onDelete && <button className="btn btn-ghost" style={{ color: 'var(--negative)' }} onClick={onDelete}><Icon.trash size={16} /> Eliminar</button>}
      <div style={{ flex: 1 }} />
      <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
      <button className="btn btn-primary" onClick={save}>Guardar</button>
    </div>
  </>;
}

// ── BUDGET FORM ───────────────────────────────────────────
function BudgetForm({ data, initial, onSave, onClose, onDelete, defaultMonth }) {
  const [f, setF] = useS(() => initial || {
    month: defaultMonth || currentMonthKey(),
    categoryId: data.expenseCategories[0]?.id || '',
    description: '', plannedAmount: '', currency: 'COP',
    groupId: '', recurrence: 'monthly',
  });
  const save = () => {
    if (!f.plannedAmount) return;
    onSave({ ...f, plannedAmount: parseFloat(f.plannedAmount) });
  };
  return <>
    <div className="field-row field-row-2">
      <F label="Mes"><input className="input" type="month" value={f.month} onChange={e => setF({ ...f, month: e.target.value })} /></F>
      <F label="Categoría">
        <select className="select" value={f.categoryId} onChange={e => setF({ ...f, categoryId: e.target.value })}>
          {data.expenseCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </F>
    </div>
    <F label="Descripción"><input className="input" value={f.description} onChange={e => setF({ ...f, description: e.target.value })} placeholder="Ej: Arriendo, Netflix..." /></F>
    <div className="field-row field-row-2">
      <F label="Monto estimado"><input className="input" type="number" step="0.01" value={f.plannedAmount} onChange={e => setF({ ...f, plannedAmount: e.target.value })} placeholder="0" /></F>
      <F label="Moneda">
        <select className="select" value={f.currency} onChange={e => setF({ ...f, currency: e.target.value })}>
          <option value="COP">COP</option><option value="USD">USD</option>
        </select>
      </F>
    </div>
    {data.budgetGroups.length > 0 && (
      <F label="Grupo (opcional)">
        <select className="select" value={f.groupId} onChange={e => setF({ ...f, groupId: e.target.value })}>
          <option value="">Sin grupo</option>
          {data.budgetGroups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
        </select>
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

// ── EXPENSE FORM ───────────────────────────────────────────
function ExpenseForm({ data, initial, onSave, onClose, onDelete }) {
  const [f, setF] = useS(() => initial || {
    date: today(),
    categoryId: data.expenseCategories[0]?.id || '',
    description: '', amount: '', currency: 'COP',
    accountId: data.accounts[0]?.id || '',
    status: 'planned',
    isRecurring: false,
    recurrence: 'monthly',
    endDate: '',
  });
  const save = () => {
    if (!f.amount || parseFloat(f.amount) <= 0) return;
    onSave({ ...f, amount: parseFloat(f.amount) });
  };
  return <>
    <div className="field-row field-row-2">
      <F label="Fecha"><input className="input" type="date" value={f.date} onChange={e => setF({ ...f, date: e.target.value })} /></F>
      <F label="Categoría">
        <select className="select" value={f.categoryId} onChange={e => setF({ ...f, categoryId: e.target.value })}>
          {data.expenseCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </F>
    </div>
    <F label="Descripción"><input className="input" value={f.description} onChange={e => setF({ ...f, description: e.target.value })} placeholder="Ej: Mercado Éxito" /></F>
    <div className="field-row field-row-3">
      <F label="Monto" span={2}><input className="input" type="number" step="0.01" value={f.amount} onChange={e => setF({ ...f, amount: e.target.value })} placeholder="0" /></F>
      <F label="Moneda">
        <select className="select" value={f.currency} onChange={e => setF({ ...f, currency: e.target.value })}>
          <option value="COP">COP</option><option value="USD">USD</option>
        </select>
      </F>
    </div>
    <div className="field-row field-row-2">
      <F label="Cuenta">
        <select className="select" value={f.accountId} onChange={e => setF({ ...f, accountId: e.target.value })}>
          {data.accounts.filter(a => a.active).map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
        </select>
      </F>
      <F label="Estado">
        <select className="select" value={f.status} onChange={e => setF({ ...f, status: e.target.value })}>
          <option value="planned">Planeado</option>
          <option value="assigned">Asignado</option>
          <option value="executed">Ejecutado</option>
        </select>
      </F>
    </div>
    {!initial && (
      <label className="checkbox-row">
        <input type="checkbox" className="checkbox" checked={f.isRecurring} onChange={e => setF({ ...f, isRecurring: e.target.checked })} />
        <span>Es un gasto recurrente</span>
      </label>
    )}
    {f.isRecurring && !initial && (
      <div className="field-row field-row-2">
        <F label="Frecuencia">
          <select className="select" value={f.recurrence} onChange={e => setF({ ...f, recurrence: e.target.value })}>
            <option value="weekly">Semanal</option>
            <option value="monthly">Mensual</option>
            <option value="yearly">Anual</option>
          </select>
        </F>
        <F label="Hasta (opcional)"><input className="input" type="date" value={f.endDate} onChange={e => setF({ ...f, endDate: e.target.value })} /></F>
      </div>
    )}
    <div className="modal-actions">
      {onDelete && <button className="btn btn-ghost" style={{ color: 'var(--negative)' }} onClick={onDelete}><Icon.trash size={16} /> Eliminar</button>}
      <div style={{ flex: 1 }} />
      <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
      <button className="btn btn-primary" onClick={save}>Guardar</button>
    </div>
  </>;
}

// ── CREDIT CARD ITEM FORM ────────────────────────────────
function CCItemForm({ data, initial, onSave, onClose, onDelete }) {
  const [f, setF] = useS(() => initial || {
    type: 'installment',
    cardId: data.creditCards[0]?.id || '',
    purchaseDate: today(),
    description: '', totalAmount: '', currency: 'COP',
    installments: 1, interestRate: 0,
    endMonth: '',
  });
  const save = () => {
    if (!f.totalAmount) return;
    const startMonth = calcStartMonth(f.purchaseDate);
    onSave({
      ...f,
      totalAmount: parseFloat(f.totalAmount),
      interestRate: parseFloat(f.interestRate) || 0,
      installments: parseInt(f.installments) || 1,
      startMonth,
    });
  };
  return <>
    <F label="Tipo">
      <Segmented value={f.type} onChange={v => setF({ ...f, type: v })} options={[
        { value: 'installment', label: 'Cuotas' },
        { value: 'subscription', label: 'Suscripción' },
      ]} />
    </F>
    <div className="field-row field-row-2">
      <F label="Tarjeta">
        <select className="select" value={f.cardId} onChange={e => setF({ ...f, cardId: e.target.value })}>
          {data.creditCards.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </F>
      <F label="Fecha de compra"><input className="input" type="date" value={f.purchaseDate} onChange={e => setF({ ...f, purchaseDate: e.target.value })} /></F>
    </div>
    <F label="Descripción"><input className="input" value={f.description} onChange={e => setF({ ...f, description: e.target.value })} placeholder="Ej: Lavadora" /></F>
    <div className="field-row field-row-2">
      <F label="Monto total"><input className="input" type="number" step="0.01" value={f.totalAmount} onChange={e => setF({ ...f, totalAmount: e.target.value })} /></F>
      <F label="Moneda">
        <select className="select" value={f.currency} onChange={e => setF({ ...f, currency: e.target.value })}>
          <option value="COP">COP</option><option value="USD">USD</option>
        </select>
      </F>
    </div>
    {f.type === 'installment' ? (
      <div className="field-row field-row-2">
        <F label="Número de cuotas"><input className="input" type="number" min="1" value={f.installments} onChange={e => setF({ ...f, installments: e.target.value })} /></F>
        <F label="Interés %"><input className="input" type="number" step="0.01" value={f.interestRate} onChange={e => setF({ ...f, interestRate: e.target.value })} /></F>
      </div>
    ) : (
      <F label="Fin (opcional)"><input className="input" type="month" value={f.endMonth} onChange={e => setF({ ...f, endMonth: e.target.value })} /></F>
    )}
    <div className="modal-actions">
      {onDelete && <button className="btn btn-ghost" style={{ color: 'var(--negative)' }} onClick={onDelete}><Icon.trash size={16} /> Eliminar</button>}
      <div style={{ flex: 1 }} />
      <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
      <button className="btn btn-primary" onClick={save}>Guardar</button>
    </div>
  </>;
}

// ── CREDIT CARD (the card itself) ─────────────────────────
function CardForm({ initial, onSave, onClose, onDelete }) {
  const [f, setF] = useS(() => initial || {
    name: '', bank: '', cutoffDay: 15, paymentDay: 1, creditLimit: '', currency: 'COP',
  });
  return <>
    <div className="field-row field-row-2">
      <F label="Nombre"><input className="input" value={f.name} onChange={e => setF({ ...f, name: e.target.value })} placeholder="Visa Platinum" /></F>
      <F label="Banco"><input className="input" value={f.bank} onChange={e => setF({ ...f, bank: e.target.value })} /></F>
    </div>
    <div className="field-row field-row-3">
      <F label="Corte"><input className="input" type="number" min="1" max="31" value={f.cutoffDay} onChange={e => setF({ ...f, cutoffDay: e.target.value })} /></F>
      <F label="Pago"><input className="input" type="number" min="1" max="31" value={f.paymentDay} onChange={e => setF({ ...f, paymentDay: e.target.value })} /></F>
      <F label="Moneda">
        <select className="select" value={f.currency} onChange={e => setF({ ...f, currency: e.target.value })}>
          <option value="COP">COP</option><option value="USD">USD</option>
        </select>
      </F>
    </div>
    <F label="Cupo de crédito"><input className="input" type="number" value={f.creditLimit} onChange={e => setF({ ...f, creditLimit: e.target.value })} /></F>
    <div className="modal-actions">
      {onDelete && <button className="btn btn-ghost" style={{ color: 'var(--negative)' }} onClick={onDelete}><Icon.trash size={16} /> Eliminar</button>}
      <div style={{ flex: 1 }} />
      <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
      <button className="btn btn-primary" onClick={() => f.name && onSave({ ...f, cutoffDay: parseInt(f.cutoffDay), paymentDay: parseInt(f.paymentDay), creditLimit: parseFloat(f.creditLimit) || 0 })}>Guardar</button>
    </div>
  </>;
}

// ── LOAN FORM (loansGiven or debts) ───────────────────────
function LoanForm({ data, initial, onSave, onClose, onDelete, isDebt }) {
  const [f, setF] = useS(() => initial || {
    person: '', amount: '', currency: 'COP',
    date: today(), dueDate: '', notes: '', status: 'pending',
    accountId: data.accounts[0]?.id || '',
  });
  return <>
    <F label={isDebt ? 'Acreedor' : 'Persona'}><input className="input" value={f.person} onChange={e => setF({ ...f, person: e.target.value })} /></F>
    <div className="field-row field-row-2">
      <F label="Monto"><input className="input" type="number" step="0.01" value={f.amount} onChange={e => setF({ ...f, amount: e.target.value })} /></F>
      <F label="Moneda">
        <select className="select" value={f.currency} onChange={e => setF({ ...f, currency: e.target.value })}>
          <option value="COP">COP</option><option value="USD">USD</option>
        </select>
      </F>
    </div>
    <div className="field-row field-row-2">
      <F label="Fecha"><input className="input" type="date" value={f.date} onChange={e => setF({ ...f, date: e.target.value })} /></F>
      <F label="Vencimiento"><input className="input" type="date" value={f.dueDate} onChange={e => setF({ ...f, dueDate: e.target.value })} /></F>
    </div>
    <F label="Notas"><textarea className="textarea" value={f.notes} onChange={e => setF({ ...f, notes: e.target.value })} /></F>
    <div className="modal-actions">
      {onDelete && <button className="btn btn-ghost" style={{ color: 'var(--negative)' }} onClick={onDelete}><Icon.trash size={16} /> Eliminar</button>}
      <div style={{ flex: 1 }} />
      <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
      <button className="btn btn-primary" onClick={() => f.person && f.amount && onSave({ ...f, amount: parseFloat(f.amount) })}>Guardar</button>
    </div>
  </>;
}

Object.assign(window, { IncomeForm, BudgetForm, ExpenseForm, CCItemForm, CardForm, LoanForm });
