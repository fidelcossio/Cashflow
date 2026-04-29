// ============================================================
// PAGES — Dashboard, Income, Budget, Expenses, Credit, Loans, Config
// ============================================================

const { useState: uS, useEffect: uE, useMemo: uM, useCallback: uC } = React;

// ═══════════════════════════════════════════════════════════
// DASHBOARD — priority: budget left + upcoming due
// ═══════════════════════════════════════════════════════════
function Dashboard({ data, setData, month, setMonth, goto }) {
  const monthIncome = uM(() => {
    const items = data.income.filter(i => i.date && i.date.startsWith(month));
    return sumByCurrency(items, i => i.amount, i => i.currency);
  }, [data.income, month]);

  const monthBudget = uM(() => {
    const items = data.budget.filter(b => b.month === month);
    return sumByCurrency(items, b => b.plannedAmount, b => b.currency);
  }, [data.budget, month]);

  const monthExpenses = uM(() => {
    const items = data.expenses.filter(e => getExpenseMonth(e) === month && e.executed);
    return sumByCurrency(items, e => e.amount, e => e.currency);
  }, [data.expenses, month]);

  const ccMonth = uM(() => {
    const bag = {};
    data.creditCard.forEach(item => {
      const pay = getCCPaymentForMonth(item, month);
      if (pay > 0) bag[item.currency] = (bag[item.currency] || 0) + pay;
    });
    return bag;
  }, [data.creditCard, month]);

  const toAssign = uM(() => subtractCBags(monthIncome, addCBags(monthBudget, ccMonth)), [monthIncome, monthBudget, ccMonth]);

  // Upcoming (next 14 days, unpaid)
  const upcoming = uM(() => {
    const now = new Date();
    const in14 = new Date(); in14.setDate(in14.getDate() + 14);
    const items = [];
    data.expenses.forEach(e => {
      if (e.executed) return;
      const d = new Date((e.date || '') + 'T12:00:00');
      if (!isNaN(d) && d >= new Date(now.toDateString()) && d <= in14) {
        const cat = data.expenseCategories.find(c => c.id === e.categoryId);
        items.push({ id: e.id, kind: 'expense', date: e.date, amount: e.amount, currency: e.currency, desc: e.description || cat?.name || 'Gasto', category: cat });
      }
    });
    return items.sort((a, b) => a.date.localeCompare(b.date)).slice(0, 6);
  }, [data.expenses, data.expenseCategories]);

  // Top categories (executed)
  const topCats = uM(() => {
    const map = {};
    data.expenses.forEach(e => {
      if (getExpenseMonth(e) !== month || !e.executed || e.currency !== 'COP') return;
      map[e.categoryId] = (map[e.categoryId] || 0) + (e.amount || 0);
    });
    return Object.entries(map)
      .map(([id, amt]) => ({ cat: data.expenseCategories.find(c => c.id === id), amount: amt }))
      .filter(x => x.cat)
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);
  }, [data.expenses, data.expenseCategories, month]);
  const topMax = Math.max(...topCats.map(t => t.amount), 1);

  const totalIncomeCOP = monthIncome.COP || 0;
  const usedCOP = (monthBudget.COP || 0) + (ccMonth.COP || 0);
  const usedPct = totalIncomeCOP > 0 ? Math.min(100, Math.round(usedCOP / totalIncomeCOP * 100)) : 0;

  const [quickOpen, setQuickOpen] = uS(null); // null | 'income' | 'expense' | 'budget'

  return <div className="page col-5">
    {/* Hero card — assignable */}
    <div className="hero-card">
      <div className="grain" />
      <div style={{ position: 'relative' }}>
        <div className="row-between" style={{ marginBottom: 16 }}>
          <div>
            <div className="eyebrow" style={{ color: 'rgba(255,255,255,0.75)' }}>Disponible · {formatMonthLabel(month)}</div>
          </div>
          <MonthPicker month={month} onChange={setMonth} />
        </div>
        <div className="amount-xl" style={{ marginTop: 8 }}>
          <span className="ccy-tag">COP</span>{fmtNum(toAssign.COP || 0, 'COP')}
        </div>
        {Object.entries(toAssign).filter(([c]) => c !== 'COP').map(([c, v]) => (
          <div key={c} className="amount-md" style={{ opacity: 0.85, marginTop: 4 }}>
            <span className="ccy-tag">{c}</span>{fmtNum(v, c)}
          </div>
        ))}
        <p style={{ fontSize: 13, opacity: 0.85, marginTop: 10, maxWidth: 360 }}>
          {(toAssign.COP || 0) >= 0 ? 'Este es el saldo libre después de cubrir presupuesto y tarjeta.' : 'Has asignado más de tus ingresos. Revisa presupuesto.'}
        </p>
        <div className="row" style={{ gap: 8, marginTop: 20, flexWrap: 'wrap' }}>
          <button className="btn btn-sm" style={{ background: 'rgba(255,255,255,0.18)', color: '#fff', backdropFilter: 'blur(8px)' }} onClick={() => setQuickOpen('income')}>
            <Icon.plus size={14} /> Ingreso
          </button>
          <button className="btn btn-sm" style={{ background: 'rgba(255,255,255,0.18)', color: '#fff' }} onClick={() => setQuickOpen('expense')}>
            <Icon.minus size={14} /> Gasto
          </button>
          <button className="btn btn-sm" style={{ background: 'rgba(255,255,255,0.18)', color: '#fff' }} onClick={() => setQuickOpen('budget')}>
            <Icon.budget size={14} /> Presupuestar
          </button>
        </div>
        {/* Ring summary */}
        <div style={{ marginTop: 24 }}>
          <div className="row-between" style={{ fontSize: 12, opacity: 0.85, marginBottom: 6 }}>
            <span>Usado {usedPct}%</span>
            <span>{fmtStr(usedCOP, 'COP')} de {fmtStr(totalIncomeCOP, 'COP')}</span>
          </div>
          <div style={{ height: 8, background: 'rgba(255,255,255,0.18)', borderRadius: 999, overflow: 'hidden' }}>
            <div style={{ width: `${usedPct}%`, height: '100%', background: 'rgba(255,255,255,0.9)', borderRadius: 999, transition: 'width 600ms var(--ease-out)' }} />
          </div>
        </div>
      </div>
    </div>

    {/* Three quick stats */}
    <div className="grid-3 keep-2 stagger">
      <Card pad="md">
        <div className="col-2">
          <div className="row" style={{ gap: 8 }}>
            <div className="tx-icon cat-3" style={{ width: 32, height: 32 }}><Icon.arrowDown size={14} /></div>
            <span className="eyebrow">Ingresos</span>
          </div>
          <div className="amount-md text-pos"><span className="ccy-tag">COP</span>{fmtNum(monthIncome.COP || 0, 'COP')}</div>
          {monthIncome.USD > 0 && <div className="muted-2" style={{ fontSize: 12 }}><span className="ccy-tag">USD</span>{fmtNum(monthIncome.USD, 'USD')}</div>}
        </div>
      </Card>
      <Card pad="md">
        <div className="col-2">
          <div className="row" style={{ gap: 8 }}>
            <div className="tx-icon cat-5" style={{ width: 32, height: 32 }}><Icon.budget size={14} /></div>
            <span className="eyebrow">Presupuesto</span>
          </div>
          <div className="amount-md"><span className="ccy-tag">COP</span>{fmtNum(monthBudget.COP || 0, 'COP')}</div>
          <div className="muted-2" style={{ fontSize: 12 }}>{data.budget.filter(b => b.month === month).length} ítems</div>
        </div>
      </Card>
      <Card pad="md">
        <div className="col-2">
          <div className="row" style={{ gap: 8 }}>
            <div className="tx-icon cat-1" style={{ width: 32, height: 32 }}><Icon.arrowUp size={14} /></div>
            <span className="eyebrow">Ejecutado</span>
          </div>
          <div className="amount-md text-neg"><span className="ccy-tag">COP</span>{fmtNum(monthExpenses.COP || 0, 'COP')}</div>
          <div className="muted-2" style={{ fontSize: 12 }}>{data.expenses.filter(e => getExpenseMonth(e) === month && e.executed).length} gastos</div>
        </div>
      </Card>
    </div>

    {/* Upcoming + top cats */}
    <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(280px, 1fr))', gap:16 }}>
      <Card pad="none">
        <div className="card-pad row-between" style={{ paddingBottom: 10 }}>
          <div>
            <h3 className="h3">Próximos vencimientos</h3>
            <p className="muted-2" style={{ fontSize: 12, marginTop: 2 }}>14 días · {upcoming.length} pendientes</p>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={() => goto('expenses')}>Ver todos</button>
        </div>
        <div className="divider" />
        {upcoming.length === 0 ? (
          <Empty icon="check" title="Todo al día" desc="No tienes gastos pendientes en los próximos 14 días." />
        ) : (
          <div style={{ padding: '6px 8px' }}>
            {upcoming.map(u => {
              const overdue = new Date(u.date + 'T12:00:00') < new Date(new Date().toDateString());
              return <div key={u.id} className="tx-row">
                <CategoryDot category={u.category} />
                <div className="grow">
                  <div className="tx-title truncate">{u.desc}</div>
                  <div className="tx-sub">{formatDate(u.date)} {overdue && <span className="chip chip-neg" style={{ padding: '1px 8px', fontSize: 10, marginLeft: 6 }}>Vencido</span>}</div>
                </div>
                <div className="amount-sm text-neg"><span className="ccy-tag">{u.currency}</span>{fmtNum(u.amount, u.currency)}</div>
              </div>;
            })}
          </div>
        )}
      </Card>

      <Card pad="md">
        <div className="row-between" style={{ marginBottom: 16 }}>
          <div>
            <h3 className="h3">Top categorías</h3>
            <p className="muted-2" style={{ fontSize: 12, marginTop: 2 }}>{formatMonthShort(month)}</p>
          </div>
          <button className="btn-ico sm" onClick={() => goto('expenses')}><Icon.arrowRight size={16} /></button>
        </div>
        {topCats.length === 0 ? (
          <Empty icon="pieChart" title="Sin datos" desc="Aún no has ejecutado gastos." />
        ) : (
          <div className="col gap-4">
            {topCats.map(t => (
              <div key={t.cat.id} className="col-2">
                <div className="row-between">
                  <div className="row" style={{ gap: 10 }}>
                    <CategoryDot category={t.cat} size={28} />
                    <span style={{ fontSize: 13, fontWeight: 600 }}>{t.cat.name}</span>
                  </div>
                  <span className="amount-sm">{fmtCompact(t.amount, 'COP')}</span>
                </div>
                <Bar pct={t.amount / topMax * 100} thin tone={'accent'} />
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>

    {/* Quick modals */}
    <Modal open={quickOpen === 'income'} onClose={() => setQuickOpen(null)} title="Nuevo ingreso">
      <IncomeForm data={data} onClose={() => setQuickOpen(null)} onSave={(v) => {
        setData(d => ({ ...d, income: [...d.income, { id: uid(), ...v }] }));
        setQuickOpen(null);
      }} />
    </Modal>
    <Modal open={quickOpen === 'expense'} onClose={() => setQuickOpen(null)} title="Nuevo gasto">
      <ExpenseForm data={data} onClose={() => setQuickOpen(null)} onSave={(v) => {
        const executed = v.status === 'executed';
        const base = { id: uid(), ...v, executed, month: (v.date || '').slice(0, 7) };
        if (v.isRecurring) {
          const dates = generateRecurrenceDates(v.date, v.endDate, v.recurrence);
          const items = dates.map(d => ({ ...base, id: uid(), date: d, month: d.slice(0, 7), executed: false, status: 'planned' }));
          setData(d => ({ ...d, expenses: [...d.expenses, ...items] }));
        } else {
          setData(d => ({ ...d, expenses: [...d.expenses, base] }));
        }
        setQuickOpen(null);
      }} />
    </Modal>
    <Modal open={quickOpen === 'budget'} onClose={() => setQuickOpen(null)} title="Presupuestar">
      <BudgetForm data={data} defaultMonth={month} onClose={() => setQuickOpen(null)} onSave={(v) => {
        setData(d => ({ ...d, budget: [...d.budget, { id: uid(), ...v }] }));
        setQuickOpen(null);
      }} />
    </Modal>
  </div>;
}

window.Dashboard = Dashboard;
