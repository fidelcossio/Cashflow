// ============================================================
// PAGES — Income, Budget, Expenses, Credit Cards, Loans, Config
// ============================================================

const { useState: usS, useEffect: usE, useMemo: usM } = React;

// ═══════════════════════════════════════════════════════════
// INCOME
// ═══════════════════════════════════════════════════════════
function IncomePage({ data, setData, month, setMonth }) {
  const [modal, setModal] = usS(null); // null | 'new' | {edit: id}
  const items = usM(() =>
    data.income.filter(i => i.date && i.date.startsWith(month)).sort((a, b) => b.date.localeCompare(a.date)),
    [data.income, month]);
  const totals = usM(() => sumByCurrency(items, i => i.amount, i => i.currency), [items]);

  const save = (v) => {
    setData(d => ({ ...d, income: modal === 'new' ? [...d.income, { id: uid(), ...v }] : d.income.map(x => x.id === modal.edit ? { ...x, ...v } : x) }));
    setModal(null);
  };
  const del = (id) => {
    setData(d => ({ ...d, income: d.income.filter(x => x.id !== id) }));
    setModal(null);
  };

  return <div className="page col-5">
    <PageHeader title="Ingresos" subtitle="Registra tus entradas de dinero por mes"
      right={<><MonthPicker month={month} onChange={setMonth} />
        <button className="btn btn-primary" onClick={() => setModal('new')}><Icon.plus size={16} /> Nuevo</button></>} />

    <div className="grid-2 keep-2">
      <Card pad="md"><Stat label="Ingresos COP" value={<><span className="ccy-tag">COP</span>{fmtNum(totals.COP || 0, 'COP')}</>} tone="pos" /></Card>
      <Card pad="md"><Stat label="Ingresos USD" value={<><span className="ccy-tag">USD</span>{fmtNum(totals.USD || 0, 'USD')}</>} tone="pos" /></Card>
    </div>

    <Card pad="none">
      {items.length === 0 ? (
        <Empty icon="income" title="Sin ingresos este mes" desc="Empieza agregando tu primer ingreso."
          action={<button className="btn btn-primary" onClick={() => setModal('new')}><Icon.plus size={16} /> Agregar</button>} />
      ) : (
        <div style={{ padding: 8 }}>
          {items.map(i => {
            const src = data.incomeSources.find(s => s.id === i.sourceId);
            const acc = data.accounts.find(a => a.id === i.accountId);
            return <button key={i.id} className="tx-row" style={{ textAlign: 'left', width: '100%' }} onClick={() => setModal({ edit: i.id, data: i })}>
              <div className="tx-icon cat-3"><Icon.arrowDown size={16} /></div>
              <div className="grow">
                <div className="tx-title truncate">{i.description || src?.name || 'Ingreso'}</div>
                <div className="tx-sub">{formatDateLong(i.date)} · {acc?.name || '—'}</div>
              </div>
              <div className="amount-sm text-pos"><span className="ccy-tag">{i.currency}</span>{fmtNum(i.amount, i.currency)}</div>
            </button>;
          })}
        </div>
      )}
    </Card>

    <Modal open={modal === 'new'} onClose={() => setModal(null)} title="Nuevo ingreso">
      <IncomeForm data={data} onClose={() => setModal(null)} onSave={save} />
    </Modal>
    <Modal open={modal && modal.edit} onClose={() => setModal(null)} title="Editar ingreso">
      {modal && modal.edit && <IncomeForm data={data} initial={modal.data} onClose={() => setModal(null)} onSave={save} onDelete={() => del(modal.edit)} />}
    </Modal>
  </div>;
}

// ═══════════════════════════════════════════════════════════
// BUDGET
// ═══════════════════════════════════════════════════════════
function BudgetPage({ data, setData, month, setMonth }) {
  const [modal, setModal] = usS(null);
  const items = usM(() => data.budget.filter(b => b.month === month), [data.budget, month]);
  const executedByCat = usM(() => {
    const map = {};
    data.expenses.forEach(e => {
      if (getExpenseMonth(e) !== month || !e.executed) return;
      const k = `${e.categoryId}:${e.currency}`;
      map[k] = (map[k] || 0) + (e.amount || 0);
    });
    return map;
  }, [data.expenses, month]);

  const totalPlanned = usM(() => sumByCurrency(items, b => b.plannedAmount, b => b.currency), [items]);
  const byCategory = usM(() => {
    const map = {};
    items.forEach(b => { (map[b.categoryId] = map[b.categoryId] || []).push(b); });
    return map;
  }, [items]);

  const save = (v) => {
    setData(d => ({ ...d, budget: modal === 'new' ? [...d.budget, { id: uid(), ...v }] : d.budget.map(x => x.id === modal.edit ? { ...x, ...v } : x) }));
    setModal(null);
  };
  const del = (id) => { setData(d => ({ ...d, budget: d.budget.filter(x => x.id !== id) })); setModal(null); };

  return <div className="page col-5">
    <PageHeader title="Presupuesto" subtitle="Distribuye tus ingresos entre categorías"
      right={<><MonthPicker month={month} onChange={setMonth} />
        <button className="btn btn-primary" onClick={() => setModal('new')}><Icon.plus size={16} /> Presupuestar</button></>} />

    <div className="grid-3 keep-2">
      <Card pad="md"><Stat label="Total presupuestado" value={<><span className="ccy-tag">COP</span>{fmtNum(totalPlanned.COP || 0, 'COP')}</>} /></Card>
      <Card pad="md"><Stat label="Ítems" value={items.length} /></Card>
      <Card pad="md"><Stat label="Categorías activas" value={Object.keys(byCategory).length} /></Card>
    </div>

    <div className="col-4">
      {Object.entries(byCategory).map(([catId, catItems]) => {
        const cat = data.expenseCategories.find(c => c.id === catId);
        const catTotal = catItems.reduce((s, x) => s + (x.currency === 'COP' ? x.plannedAmount : 0), 0);
        const executed = executedByCat[`${catId}:COP`] || 0;
        const pct = catTotal > 0 ? Math.min(100, Math.round(executed / catTotal * 100)) : 0;
        const tone = pct >= 100 ? 'negative' : pct >= 80 ? 'warning' : 'positive';
        return <Card key={catId} pad="none">
          <div className="card-pad">
            <div className="row-between" style={{ marginBottom: 12 }}>
              <div className="row" style={{ gap: 12 }}>
                <CategoryDot category={cat} />
                <div>
                  <div className="h4">{cat?.name || 'Sin categoría'}</div>
                  <div className="muted-2" style={{ fontSize: 12 }}>{catItems.length} ítems · {fmtCompact(executed, 'COP')} de {fmtCompact(catTotal, 'COP')}</div>
                </div>
              </div>
              <div className={`chip chip-${tone === 'negative' ? 'neg' : tone === 'warning' ? 'warn' : 'pos'}`}>{pct}%</div>
            </div>
            <Bar pct={pct} tone={tone} />
          </div>
          <div className="divider" />
          <div style={{ padding: 8 }}>
            {catItems.map(b => (
              <button key={b.id} className="tx-row" style={{ textAlign: 'left', width: '100%' }} onClick={() => setModal({ edit: b.id, data: b })}>
                <div className="tx-icon cat-8"><Icon.tag size={14} /></div>
                <div className="grow">
                  <div className="tx-title truncate">{b.description || 'Presupuesto'}</div>
                  <div className="tx-sub">{recurrenceLabel(b.recurrence || 'monthly')}</div>
                </div>
                <div className="amount-sm"><span className="ccy-tag">{b.currency}</span>{fmtNum(b.plannedAmount, b.currency)}</div>
              </button>
            ))}
          </div>
        </Card>;
      })}
      {items.length === 0 && (
        <Card pad="md">
          <Empty icon="budget" title="Sin presupuesto este mes" desc="Empieza asignando montos a categorías."
            action={<button className="btn btn-primary" onClick={() => setModal('new')}><Icon.plus size={16} /> Presupuestar</button>} />
        </Card>
      )}
    </div>

    <Modal open={modal === 'new'} onClose={() => setModal(null)} title="Nuevo ítem de presupuesto">
      <BudgetForm data={data} defaultMonth={month} onClose={() => setModal(null)} onSave={save} />
    </Modal>
    <Modal open={modal && modal.edit} onClose={() => setModal(null)} title="Editar presupuesto">
      {modal && modal.edit && <BudgetForm data={data} initial={modal.data} onClose={() => setModal(null)} onSave={save} onDelete={() => del(modal.edit)} />}
    </Modal>
  </div>;
}

// ═══════════════════════════════════════════════════════════
// EXPENSES
// ═══════════════════════════════════════════════════════════
function ExpensesPage({ data, setData, month, setMonth }) {
  const [modal, setModal] = usS(null);
  const [filter, setFilter] = usS('all'); // all | pending | executed

  const items = usM(() => {
    let list = data.expenses.filter(e => getExpenseMonth(e) === month);
    if (filter === 'pending') list = list.filter(e => !e.executed);
    if (filter === 'executed') list = list.filter(e => e.executed);
    return list.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  }, [data.expenses, month, filter]);

  const totals = usM(() => {
    const executed = sumByCurrency(items.filter(x => x.executed), e => e.amount, e => e.currency);
    const pending = sumByCurrency(items.filter(x => !x.executed), e => e.amount, e => e.currency);
    return { executed, pending };
  }, [items]);

  const toggleStatus = (id, status) => {
    setData(d => ({ ...d, expenses: d.expenses.map(e => e.id === id ? { ...e, status, executed: status === 'executed' } : e) }));
  };

  const save = (v) => {
    if (modal === 'new' && v.isRecurring) {
      const dates = generateRecurrenceDates(v.date, v.endDate, v.recurrence);
      const items = dates.map(d => ({ id: uid(), ...v, date: d, month: d.slice(0, 7), executed: false, status: 'planned' }));
      setData(d => ({ ...d, expenses: [...d.expenses, ...items] }));
    } else {
      const executed = v.status === 'executed';
      const base = { ...v, executed, month: (v.date || '').slice(0, 7) };
      setData(d => ({ ...d, expenses: modal === 'new' ? [...d.expenses, { id: uid(), ...base }] : d.expenses.map(x => x.id === modal.edit ? { ...x, ...base } : x) }));
    }
    setModal(null);
  };
  const del = (id) => { setData(d => ({ ...d, expenses: d.expenses.filter(x => x.id !== id) })); setModal(null); };

  return <div className="page col-5">
    <PageHeader title="Gastos" subtitle="Registra y controla tus egresos"
      right={<><MonthPicker month={month} onChange={setMonth} />
        <button className="btn btn-primary" onClick={() => setModal('new')}><Icon.plus size={16} /> Nuevo</button></>} />

    <div className="grid-2 keep-2">
      <Card pad="md"><Stat label="Ejecutado" value={<><span className="ccy-tag">COP</span>{fmtNum(totals.executed.COP || 0, 'COP')}</>} tone="neg" /></Card>
      <Card pad="md"><Stat label="Pendiente" value={<><span className="ccy-tag">COP</span>{fmtNum(totals.pending.COP || 0, 'COP')}</>} tone="warn" /></Card>
    </div>

    <div className="row" style={{ justifyContent: 'flex-start' }}>
      <Segmented value={filter} onChange={setFilter} options={[
        { value: 'all', label: `Todos (${items.length})` },
        { value: 'pending', label: 'Pendientes' },
        { value: 'executed', label: 'Ejecutados' },
      ]} />
    </div>

    <Card pad="none">
      {items.length === 0 ? (
        <Empty icon="receipt" title="Sin gastos" desc="Registra tu primer gasto del mes."
          action={<button className="btn btn-primary" onClick={() => setModal('new')}><Icon.plus size={16} /> Agregar</button>} />
      ) : (
        <div style={{ padding: 8 }}>
          {items.map(e => {
            const cat = data.expenseCategories.find(c => c.id === e.categoryId);
            const acc = data.accounts.find(a => a.id === e.accountId);
            const overdue = isExpenseOverdue(e);
            return <div key={e.id} className="tx-row">
              <CategoryDot category={cat} />
              <button className="grow" style={{ textAlign: 'left', minWidth: 0 }} onClick={() => setModal({ edit: e.id, data: e })}>
                <div className="tx-title truncate">{e.description || cat?.name || 'Gasto'}</div>
                <div className="tx-sub">{formatDate(e.date)} · {acc?.name || '—'} {overdue && <span className="chip chip-neg" style={{ padding: '1px 8px', fontSize: 10 }}>Vencido</span>}</div>
              </button>
              <div className="col-2" style={{ alignItems: 'flex-end', gap: 6 }}>
                <div className={`amount-sm ${e.executed ? 'text-neg' : ''}`}><span className="ccy-tag">{e.currency}</span>{fmtNum(e.amount, e.currency)}</div>
                <select className={`status-select status-${e.status || (e.executed ? 'executed' : 'planned')}`}
                        value={e.status || (e.executed ? 'executed' : 'planned')}
                        onChange={ev => toggleStatus(e.id, ev.target.value)}
                        onClick={ev => ev.stopPropagation()}>
                  <option value="planned">Planeado</option>
                  <option value="assigned">Asignado</option>
                  <option value="executed">Ejecutado</option>
                </select>
              </div>
            </div>;
          })}
        </div>
      )}
    </Card>

    <Modal open={modal === 'new'} onClose={() => setModal(null)} title="Nuevo gasto">
      <ExpenseForm data={data} onClose={() => setModal(null)} onSave={save} />
    </Modal>
    <Modal open={modal && modal.edit} onClose={() => setModal(null)} title="Editar gasto">
      {modal && modal.edit && <ExpenseForm data={data} initial={modal.data} onClose={() => setModal(null)} onSave={save} onDelete={() => del(modal.edit)} />}
    </Modal>
  </div>;
}

// ═══════════════════════════════════════════════════════════
// CREDIT CARDS
// ═══════════════════════════════════════════════════════════
function CreditPage({ data, setData, month, setMonth }) {
  const [modal, setModal] = usS(null);

  const byCard = usM(() => {
    const map = {};
    data.creditCards.forEach(c => map[c.id] = { card: c, items: [], monthTotal: 0 });
    data.creditCard.forEach(item => {
      if (!map[item.cardId]) return;
      const pay = getCCPaymentForMonth(item, month);
      map[item.cardId].items.push({ ...item, monthPay: pay });
      if (pay > 0) map[item.cardId].monthTotal += pay;
    });
    return map;
  }, [data.creditCards, data.creditCard, month]);

  const totalThisMonth = usM(() => {
    const bag = {};
    data.creditCard.forEach(i => {
      const p = getCCPaymentForMonth(i, month);
      if (p > 0) bag[i.currency] = (bag[i.currency] || 0) + p;
    });
    return bag;
  }, [data.creditCard, month]);

  const saveCard = (v) => {
    setData(d => ({ ...d, creditCards: modal === 'new-card' ? [...d.creditCards, { id: uid(), ...v }] : d.creditCards.map(c => c.id === modal.editCard ? { ...c, ...v } : c) }));
    setModal(null);
  };
  const delCard = (id) => { setData(d => ({ ...d, creditCards: d.creditCards.filter(c => c.id !== id), creditCard: d.creditCard.filter(i => i.cardId !== id) })); setModal(null); };

  const saveItem = (v) => {
    setData(d => ({ ...d, creditCard: modal === 'new-item' ? [...d.creditCard, { id: uid(), ...v }] : d.creditCard.map(i => i.id === modal.editItem ? { ...i, ...v } : i) }));
    setModal(null);
  };
  const delItem = (id) => { setData(d => ({ ...d, creditCard: d.creditCard.filter(i => i.id !== id) })); setModal(null); };

  return <div className="page col-5">
    <PageHeader title="Tarjetas de crédito" subtitle="Gestiona cuotas y suscripciones"
      right={<><MonthPicker month={month} onChange={setMonth} />
        <button className="btn btn-ghost" onClick={() => setModal('new-card')}><Icon.plus size={16} /> Tarjeta</button>
        <button className="btn btn-primary" disabled={data.creditCards.length === 0} onClick={() => setModal('new-item')}><Icon.plus size={16} /> Compra</button></>} />

    <Card pad="md">
      <div className="row" style={{ gap: 20, flexWrap: 'wrap' }}>
        <Stat label="Pago del mes COP" value={<><span className="ccy-tag">COP</span>{fmtNum(totalThisMonth.COP || 0, 'COP')}</>} />
        {totalThisMonth.USD > 0 && <Stat label="Pago del mes USD" value={<><span className="ccy-tag">USD</span>{fmtNum(totalThisMonth.USD, 'USD')}</>} />}
        <Stat label="Tarjetas" value={data.creditCards.length} />
        <Stat label="Compras activas" value={data.creditCard.length} />
      </div>
    </Card>

    {data.creditCards.length === 0 ? (
      <Card pad="lg"><Empty icon="card" title="Sin tarjetas" desc="Agrega una tarjeta para empezar a gestionar cuotas y suscripciones."
        action={<button className="btn btn-primary" onClick={() => setModal('new-card')}><Icon.plus size={16} /> Nueva tarjeta</button>} /></Card>
    ) : (
      <div className="col-4">
        {Object.values(byCard).map(({ card, items, monthTotal }) => (
          <Card key={card.id} pad="none">
            <div className="card-pad row-between">
              <div className="row" style={{ gap: 12 }}>
                <div className="tx-icon" style={{ background: 'var(--text)', color: 'var(--text-inv)' }}><Icon.card size={18} /></div>
                <div>
                  <div className="h4">{card.name}</div>
                  <div className="muted-2" style={{ fontSize: 12 }}>{card.bank} · corte {card.cutoffDay} · pago {card.paymentDay}</div>
                </div>
              </div>
              <div className="col-2" style={{ alignItems: 'flex-end' }}>
                <div className="amount-md"><span className="ccy-tag">{card.currency}</span>{fmtNum(monthTotal, card.currency)}</div>
                <button className="btn-ico sm" onClick={() => setModal({ editCard: card.id, data: card })}><Icon.edit size={14} /></button>
              </div>
            </div>
            {items.length > 0 && <div className="divider" />}
            <div style={{ padding: items.length > 0 ? 8 : 0 }}>
              {items.map(it => (
                <button key={it.id} className="tx-row" style={{ textAlign: 'left', width: '100%' }} onClick={() => setModal({ editItem: it.id, data: it })}>
                  <div className="tx-icon cat-2"><Icon.receipt size={14} /></div>
                  <div className="grow">
                    <div className="tx-title truncate">{it.description}</div>
                    <div className="tx-sub">{it.type === 'subscription' ? 'Suscripción' : `Cuota · ${it.installments}x`} · {formatDate(it.purchaseDate)}</div>
                  </div>
                  <div className="amount-sm"><span className="ccy-tag">{it.currency}</span>{fmtNum(it.monthPay, it.currency)}</div>
                </button>
              ))}
            </div>
          </Card>
        ))}
      </div>
    )}

    <Modal open={modal === 'new-card'} onClose={() => setModal(null)} title="Nueva tarjeta"><CardForm onClose={() => setModal(null)} onSave={saveCard} /></Modal>
    <Modal open={modal && modal.editCard} onClose={() => setModal(null)} title="Editar tarjeta">
      {modal && modal.editCard && <CardForm initial={modal.data} onClose={() => setModal(null)} onSave={saveCard} onDelete={() => delCard(modal.editCard)} />}
    </Modal>
    <Modal open={modal === 'new-item'} onClose={() => setModal(null)} title="Nueva compra">
      <CCItemForm data={data} onClose={() => setModal(null)} onSave={saveItem} />
    </Modal>
    <Modal open={modal && modal.editItem} onClose={() => setModal(null)} title="Editar compra">
      {modal && modal.editItem && <CCItemForm data={data} initial={modal.data} onClose={() => setModal(null)} onSave={saveItem} onDelete={() => delItem(modal.editItem)} />}
    </Modal>
  </div>;
}

// ═══════════════════════════════════════════════════════════
// LOANS — combines loansGiven + debts
// ═══════════════════════════════════════════════════════════
function LoansPage({ data, setData }) {
  const [tab, setTab] = usS('given');
  const [modal, setModal] = usS(null);
  const key = tab === 'given' ? 'loansGiven' : 'debts';
  const list = data[key] || [];
  const totals = usM(() => sumByCurrency(list.filter(x => x.status !== 'paid'), x => x.amount, x => x.currency), [list]);

  const save = (v) => {
    setData(d => ({ ...d, [key]: modal === 'new' ? [...d[key], { id: uid(), ...v }] : d[key].map(x => x.id === modal.edit ? { ...x, ...v } : x) }));
    setModal(null);
  };
  const del = (id) => { setData(d => ({ ...d, [key]: d[key].filter(x => x.id !== id) })); setModal(null); };
  const togglePaid = (id) => {
    setData(d => ({ ...d, [key]: d[key].map(x => x.id === id ? { ...x, status: x.status === 'paid' ? 'pending' : 'paid' } : x) }));
  };

  return <div className="page col-5">
    <PageHeader title="Préstamos y deudas" subtitle="Dinero que prestaste o que debes"
      right={<button className="btn btn-primary" onClick={() => setModal('new')}><Icon.plus size={16} /> Nuevo</button>} />

    <Segmented value={tab} onChange={setTab} options={[
      { value: 'given', label: 'Prestado' },
      { value: 'debts', label: 'Debo' },
    ]} />

    <Card pad="md">
      <div className="row" style={{ gap: 20, flexWrap: 'wrap' }}>
        <Stat label={tab === 'given' ? 'Por cobrar COP' : 'Por pagar COP'} value={<><span className="ccy-tag">COP</span>{fmtNum(totals.COP || 0, 'COP')}</>} tone={tab === 'given' ? 'pos' : 'neg'} />
        <Stat label="Items activos" value={list.filter(x => x.status !== 'paid').length} />
      </div>
    </Card>

    <Card pad="none">
      {list.length === 0 ? (
        <Empty icon="loan" title={tab === 'given' ? 'Nadie te debe' : 'No debes nada'} desc="Registra préstamos y deudas para no perder seguimiento."
          action={<button className="btn btn-primary" onClick={() => setModal('new')}><Icon.plus size={16} /> Agregar</button>} />
      ) : (
        <div style={{ padding: 8 }}>
          {list.map(l => (
            <div key={l.id} className="tx-row">
              <div className="tx-icon cat-5"><Icon.user size={16} /></div>
              <button className="grow" style={{ textAlign: 'left', minWidth: 0 }} onClick={() => setModal({ edit: l.id, data: l })}>
                <div className="tx-title truncate">{l.person}</div>
                <div className="tx-sub">{formatDate(l.date)}{l.dueDate ? ` · vence ${formatDate(l.dueDate)}` : ''}</div>
              </button>
              <div className="col-2" style={{ alignItems: 'flex-end' }}>
                <div className={`amount-sm ${l.status === 'paid' ? 'muted-2' : (tab === 'given' ? 'text-pos' : 'text-neg')}`}
                     style={l.status === 'paid' ? { textDecoration: 'line-through' } : undefined}>
                  <span className="ccy-tag">{l.currency}</span>{fmtNum(l.amount, l.currency)}
                </div>
                <button className={`chip ${l.status === 'paid' ? 'chip-pos' : 'chip-warn'}`} onClick={() => togglePaid(l.id)} style={{ border: 0, cursor: 'pointer' }}>
                  {l.status === 'paid' ? 'Pagado' : 'Pendiente'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>

    <Modal open={modal === 'new'} onClose={() => setModal(null)} title={tab === 'given' ? 'Nuevo préstamo' : 'Nueva deuda'}>
      <LoanForm data={data} isDebt={tab === 'debts'} onClose={() => setModal(null)} onSave={save} />
    </Modal>
    <Modal open={modal && modal.edit} onClose={() => setModal(null)} title="Editar">
      {modal && modal.edit && <LoanForm data={data} isDebt={tab === 'debts'} initial={modal.data} onClose={() => setModal(null)} onSave={save} onDelete={() => del(modal.edit)} />}
    </Modal>
  </div>;
}

// ═══════════════════════════════════════════════════════════
// CONFIG — accounts, categories, income sources, data
// ═══════════════════════════════════════════════════════════
function ConfigPage({ data, setData, theme, setTheme }) {
  const [section, setSection] = usS('accounts');

  const exportData = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `finanzas-backup-${today()}.json`; a.click();
    URL.revokeObjectURL(url);
  };
  const importData = (file) => {
    const r = new FileReader();
    r.onload = () => { try { const d = JSON.parse(r.result); setData({ ...defaultData, ...d }); } catch (e) { alert('JSON inválido'); } };
    r.readAsText(file);
  };
  const reset = () => { if (confirm('¿Borrar todo? No se puede deshacer.')) { localStorage.removeItem(STORAGE_KEY); setData({ ...defaultData }); } };

  const addAccount = () => {
    const name = prompt('Nombre de la cuenta:'); if (!name) return;
    const currency = prompt('Moneda (COP/USD):', 'COP') || 'COP';
    setData(d => ({ ...d, accounts: [...d.accounts, { id: uid(), name, bank: '', currency, type: 'checking', active: true, parentId: null, color: '#6E6259' }] }));
  };
  const addCategory = () => {
    const name = prompt('Nombre de la categoría:'); if (!name) return;
    setData(d => ({ ...d, expenseCategories: [...d.expenseCategories, { id: uid(), name, icon: 'tag' }] }));
  };
  const addSource = () => {
    const name = prompt('Nombre de la fuente:'); if (!name) return;
    setData(d => ({ ...d, incomeSources: [...d.incomeSources, { id: uid(), name }] }));
  };

  return <div className="page col-5">
    <PageHeader title="Configuración" subtitle="Cuentas, categorías, datos y apariencia" />

    <Card pad="md">
      <div className="eyebrow" style={{ marginBottom: 10 }}>Tema</div>
      <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
        <button className={`btn ${theme === 'pulse' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setTheme('pulse')}>
          <Icon.sun size={14} /> Pulse
        </button>
        <button className={`btn ${theme === 'edge' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setTheme('edge')}>
          <Icon.moon size={14} /> Edge
        </button>
      </div>
    </Card>

    <div className="row" style={{ flexWrap: 'wrap', gap: 8 }}>
      <Segmented value={section} onChange={setSection} options={[
        { value: 'accounts', label: 'Cuentas' },
        { value: 'categories', label: 'Categorías' },
        { value: 'sources', label: 'Fuentes' },
        { value: 'data', label: 'Datos' },
      ]} />
    </div>

    {section === 'accounts' && (
      <Card pad="none">
        <div className="card-pad row-between">
          <h3 className="h3">Cuentas</h3>
          <button className="btn btn-ghost btn-sm" onClick={addAccount}><Icon.plus size={14} /> Agregar</button>
        </div>
        <div className="divider" />
        <div style={{ padding: 8 }}>
          {data.accounts.map(a => (
            <div key={a.id} className="tx-row">
              <AccountDot account={a} size={40} />
              <div className="grow">
                <div className="tx-title">{a.name}</div>
                <div className="tx-sub">{a.bank || '—'} · {a.currency}</div>
              </div>
              <button className="btn-ico sm" onClick={() => {
                if (confirm(`¿Eliminar ${a.name}?`)) setData(d => ({ ...d, accounts: d.accounts.filter(x => x.id !== a.id) }));
              }}><Icon.trash size={14} /></button>
            </div>
          ))}
        </div>
      </Card>
    )}

    {section === 'categories' && (
      <Card pad="none">
        <div className="card-pad row-between">
          <h3 className="h3">Categorías</h3>
          <button className="btn btn-ghost btn-sm" onClick={addCategory}><Icon.plus size={14} /> Agregar</button>
        </div>
        <div className="divider" />
        <div style={{ padding: 8 }}>
          {data.expenseCategories.map(c => (
            <div key={c.id} className="tx-row">
              <CategoryDot category={c} />
              <div className="grow"><div className="tx-title">{c.name}</div></div>
              <button className="btn-ico sm" onClick={() => {
                if (confirm(`¿Eliminar ${c.name}?`)) setData(d => ({ ...d, expenseCategories: d.expenseCategories.filter(x => x.id !== c.id) }));
              }}><Icon.trash size={14} /></button>
            </div>
          ))}
        </div>
      </Card>
    )}

    {section === 'sources' && (
      <Card pad="none">
        <div className="card-pad row-between">
          <h3 className="h3">Fuentes de ingreso</h3>
          <button className="btn btn-ghost btn-sm" onClick={addSource}><Icon.plus size={14} /> Agregar</button>
        </div>
        <div className="divider" />
        <div style={{ padding: 8 }}>
          {data.incomeSources.map(s => (
            <div key={s.id} className="tx-row">
              <div className="tx-icon cat-3"><Icon.income size={14} /></div>
              <div className="grow"><div className="tx-title">{s.name}</div></div>
              <button className="btn-ico sm" onClick={() => {
                if (confirm(`¿Eliminar ${s.name}?`)) setData(d => ({ ...d, incomeSources: d.incomeSources.filter(x => x.id !== s.id) }));
              }}><Icon.trash size={14} /></button>
            </div>
          ))}
        </div>
      </Card>
    )}

    {section === 'data' && (
      <Card pad="md">
        <div className="col-4">
          <div>
            <h3 className="h3">Exportar</h3>
            <p className="muted" style={{ fontSize: 13, marginTop: 4 }}>Descarga una copia de todos tus datos en JSON.</p>
            <button className="btn btn-outline" style={{ marginTop: 12 }} onClick={exportData}><Icon.download size={14} /> Exportar JSON</button>
          </div>
          <div className="divider" />
          <div>
            <h3 className="h3">Importar</h3>
            <p className="muted" style={{ fontSize: 13, marginTop: 4 }}>Reemplaza todos tus datos con los de un archivo JSON.</p>
            <label className="btn btn-outline" style={{ marginTop: 12, display: 'inline-flex' }}>
              <Icon.upload size={14} /> Seleccionar archivo
              <input type="file" accept="application/json" style={{ display: 'none' }} onChange={e => e.target.files[0] && importData(e.target.files[0])} />
            </label>
          </div>
          <div className="divider" />
          <div>
            <h3 className="h3" style={{ color: 'var(--negative)' }}>Zona peligrosa</h3>
            <p className="muted" style={{ fontSize: 13, marginTop: 4 }}>Borrar todos los datos locales.</p>
            <button className="btn btn-negative" style={{ marginTop: 12 }} onClick={reset}><Icon.trash size={14} /> Borrar todo</button>
          </div>
        </div>
      </Card>
    )}
  </div>;
}

Object.assign(window, { IncomePage, BudgetPage, ExpensesPage, CreditPage, LoansPage, ConfigPage });
