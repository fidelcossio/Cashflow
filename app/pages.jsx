// ============================================================
// PAGES — Income, Budget, Expenses, Credit Cards, Loans, Config
// ============================================================

const { useState: usS, useEffect: usE, useMemo: usM, useCallback: usC, useRef: usR } = React;

// ═══════════════════════════════════════════════════════════
// INCOME
// ═══════════════════════════════════════════════════════════
function IncomePage({ data, setData, month, setMonth }) {
  const toast = useToast();
  const [confirm, confirmNode] = useConfirm();
  const [modal, setModal] = usS(null);

  const items = usM(() =>
    data.income.filter(i => i.date && i.date.startsWith(month)).sort((a,b) => b.date.localeCompare(a.date)),
    [data.income, month]);

  const rentaBag    = usM(() => sumByCurrency(items.filter(i=>i.isRenta!==false), i=>i.amount, i=>i.currency), [items]);
  const noRentaBag  = usM(() => sumByCurrency(items.filter(i=>i.isRenta===false),  i=>i.amount, i=>i.currency), [items]);
  const totalBag    = usM(() => addCBags(rentaBag, noRentaBag), [rentaBag, noRentaBag]);

  const save = (v) => {
    setData(d => ({
      ...d,
      income: modal === 'new'
        ? [...d.income, { id: uid(), ...v }]
        : d.income.map(x => x.id === modal.edit ? { ...x, ...v } : x)
    }));
    toast(modal === 'new' ? 'Ingreso registrado' : 'Ingreso actualizado');
    setModal(null);
  };
  const del = async (id) => {
    const ok = await confirm({ message: '¿Eliminar este ingreso?', ok: 'Eliminar', danger: true });
    if (!ok) return;
    setData(d => ({ ...d, income: d.income.filter(x => x.id !== id) }));
    toast('Ingreso eliminado');
    setModal(null);
  };

  const copyPrevMonth = async () => {
    const [y, m] = month.split('-').map(Number);
    const prev = getMonthKey(new Date(y, m - 2, 1));
    const prevItems = data.income.filter(i => i.date && i.date.startsWith(prev));
    if (!prevItems.length) { toast('No hay ingresos en el mes anterior'); return; }
    if (items.length > 0) {
      const ok = await confirm({ message: `El mes actual tiene ${items.length} ingreso(s). Se reemplazarán con los del mes anterior. ¿Continuar?`, ok: 'Copiar', danger: true });
      if (!ok) return;
    }
    const withoutCurrent = data.income.filter(i => !i.date.startsWith(month));
    const copied = prevItems.map(i => ({ ...i, id: uid(), date: month + i.date.slice(7), accountId: null }));
    setData(d => ({ ...d, income: [...withoutCurrent, ...copied] }));
    toast(`${copied.length} ingreso(s) copiado(s)`);
  };

  // Inline account selector per income row
  const AccountSelect = ({ value, onChange }) => (
    <select
      className="select"
      style={{ fontSize: 12, padding: '2px 8px', minWidth: 0, maxWidth: 150, height: 28,
        background: value ? 'var(--warning-soft,#FCE8C9)' : 'var(--surface-2)',
        color: value ? 'var(--warning-color,#B8721A)' : 'var(--text-2)' }}
      value={value || ''}
      onChange={e => onChange(e.target.value || null)}
      onClick={e => e.stopPropagation()}
    >
      <option value="">Planificado</option>
      {data.accounts.filter(a => a.active).map(a =>
        <option key={a.id} value={a.id}>{a.parentId ? '↳ ' : ''}{a.name}</option>)}
    </select>
  );

  const FmtBag = ({ bag }) => Object.entries(bag).filter(([,v]) => v > 0).map(([cur, val]) =>
    <span key={cur} style={{ marginRight: 8 }}><span className="ccy-tag">{cur}</span>{fmtNum(val, cur)}</span>);

  return <div className="page col-5">
    {confirmNode}
    <PageHeader title="Ingresos" subtitle="Registro de ingresos mensuales"
      right={<>
        <MonthPicker month={month} onChange={setMonth} />
        <button className="btn btn-ghost" onClick={copyPrevMonth}><Icon.refresh size={14}/> Copiar mes ant.</button>
        <button className="btn btn-primary" onClick={() => setModal('new')}><Icon.plus size={16}/> Nuevo</button>
      </>} />

    <div className="grid-3 keep-2">
      <Card pad="md"><Stat label="Renta" value={<FmtBag bag={rentaBag}/>} tone="pos"/></Card>
      <Card pad="md"><Stat label="No renta" value={<FmtBag bag={noRentaBag}/>}/></Card>
      <Card pad="md"><Stat label="Total" value={<FmtBag bag={totalBag}/>} tone="pos"/></Card>
    </div>

    <Card pad="none">
      {items.length === 0
        ? <Empty icon="income" title="Sin ingresos este mes" desc="Empieza agregando tu primer ingreso."
            action={<button className="btn btn-primary" onClick={() => setModal('new')}><Icon.plus size={16}/> Agregar</button>}/>
        : <div style={{ padding: 8 }}>
            {items.map(i => {
              const src = data.incomeSources.find(s => s.id === i.sourceId);
              const isRenta = i.isRenta !== false;
              return <div key={i.id} className="tx-row">
                <div className="tx-icon cat-3"><Icon.arrowDown size={16}/></div>
                <button className="grow" style={{ textAlign:'left', minWidth:0 }}
                  onClick={() => setModal({ edit: i.id, data: i })}>
                  <div className="tx-title truncate">{i.description || src?.name || 'Ingreso'}</div>
                  <div className="tx-sub">{formatDateLong(i.date)} {i.notes && <span>· {i.notes}</span>}</div>
                </button>
                <div style={{ display:'flex', alignItems:'center', gap: 8 }}>
                  <span className={`chip ${isRenta ? 'chip-pos' : ''}`} style={{ fontSize:10, padding:'1px 6px' }}>
                    {isRenta ? 'Renta' : 'No renta'}
                  </span>
                  <AccountSelect
                    value={i.accountId}
                    onChange={v => setData(d => ({ ...d, income: d.income.map(x => x.id === i.id ? {...x, accountId:v} : x) }))}
                  />
                  <div className="amount-sm text-pos"><span className="ccy-tag">{i.currency}</span>{fmtNum(i.amount, i.currency)}</div>
                </div>
              </div>;
            })}
          </div>}
    </Card>

    <Modal open={modal === 'new'} onClose={() => setModal(null)} title="Nuevo ingreso">
      <IncomeForm data={data} onClose={() => setModal(null)} onSave={save}/>
    </Modal>
    <Modal open={!!(modal && modal.edit)} onClose={() => setModal(null)} title="Editar ingreso">
      {modal && modal.edit && <IncomeForm data={data} initial={modal.data} onClose={() => setModal(null)} onSave={save} onDelete={() => del(modal.edit)}/>}
    </Modal>
  </div>;
}

// ═══════════════════════════════════════════════════════════
// BUDGET
// ═══════════════════════════════════════════════════════════
function BudgetPage({ data, setData, month, setMonth }) {
  const toast = useToast();
  const [confirm, confirmNode] = useConfirm();
  const [modal, setModal] = usS(null); // null | 'new-entry' | {editEntry:id} | 'new-group' | {editGroup:id} | 'notes'
  const [groupBy, setGroupBy] = usS('group');
  const [openGroups, setOpenGroups] = usS({ __sin_grupo: true });
  const toggleGroup = (k) => setOpenGroups(p => ({...p, [k]: !p[k]}));
  const [dragItem, setDragItem] = usS(null);
  const [dragOverGroup, setDragOverGroup] = usS(null);
  const canDrag = groupBy !== 'category'; // disabled in category view
  const dragRef = usR(false); // tracks whether mousedown was on the drag handle
  const handleDragStart = (e, item) => { setDragItem(item); e.dataTransfer.effectAllowed = 'move'; };
  const handleDragEnd = () => { setDragItem(null); setDragOverGroup(null); };
  const handleDragOver = (e, gKey) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; if (dragOverGroup !== gKey) setDragOverGroup(gKey); };
  const handleDrop = (e, gKey, section) => {
    e.preventDefault();
    if (!dragItem || dragItem.sectionKey === gKey) { setDragItem(null); setDragOverGroup(null); return; }
    if (groupBy === 'group') {
      const targetGroupId = section.id;
      if (dragItem._fromCC) {
        const asgns = (data.ccBudgetAssignments||[]).filter(a=>a.ccKey!==dragItem.ccKey);
        const existing = (data.ccBudgetAssignments||[]).find(a=>a.ccKey===dragItem.ccKey);
        setData(d=>({...d,ccBudgetAssignments:[...asgns,{...(existing||{id:uid(),ccKey:dragItem.ccKey,accountId:dragItem.accountId||null}),groupId:targetGroupId}]}));
      } else if (dragItem._fromExp) {
        setData(d=>({...d,expenses:(d.expenses||[]).map(i=>i.id===dragItem.expId?{...i,groupId:targetGroupId}:i)}));
      } else {
        setData(d=>({...d,budget:d.budget.map(i=>i.id===dragItem.id?{...i,groupId:targetGroupId}:i)}));
      }
      toast('Entrada movida al grupo');
    } else {
      const targetAccId = section.id === '__none__' ? null : section.id;
      if (dragItem._fromCC) {
        const asgns = (data.ccBudgetAssignments||[]).filter(a=>a.ccKey!==dragItem.ccKey);
        const existing = (data.ccBudgetAssignments||[]).find(a=>a.ccKey===dragItem.ccKey);
        setData(d=>({...d,ccBudgetAssignments:[...asgns,{...(existing||{id:uid(),ccKey:dragItem.ccKey,groupId:dragItem.groupId||null}),accountId:targetAccId}]}));
      } else if (dragItem._fromExp) {
        setData(d=>({...d,expenses:(d.expenses||[]).map(i=>i.id===dragItem.expId?{...i,accountId:targetAccId}:i)}));
      } else {
        setData(d=>({...d,budget:d.budget.map(i=>i.id===dragItem.id?{...i,accountId:targetAccId}:i)}));
      }
      toast('Cuenta asignada');
    }
    setOpenGroups(p=>({...p,[gKey]:true}));
    setDragItem(null); setDragOverGroup(null);
  };

  const ccTypeLabel = (t) => ({single:'Diferido',installment:'Cuotas',subscription:'Suscripción'})[t]||t;
  const ccTypeChip  = (t) => t==='installment'?'chip-warn':t==='subscription'?'chip-accent':'';

  const groups = data.budgetGroups || [];
  const monthEntries = usM(() => data.budget.filter(i => i.month === month), [data.budget, month]);

  // CC virtual items
  const ccVirtual = usM(() => (data.creditCard || []).map(i => {
    const pay = getCCPaymentForMonth(i, month);
    if (!pay) return null;
    const card = data.creditCards.find(c => c.id === i.cardId);
    const n = parseInt(i.installments) || 1;
    const [sy,sm] = (i.startMonth || month).split('-').map(Number);
    const [my,mm] = month.split('-').map(Number);
    const num = (my-sy)*12+(mm-sm)+1;
    const ccKey = `${i.id}__${month}`;
    const asgn = (data.ccBudgetAssignments || []).find(a => a.ccKey === ccKey);
    const catId = i.categoryId || '10';
    const category = data.expenseCategories.find(c => c.id === catId) || null;
    return {
      _fromCC:true, id:`cc_${i.id}_${month}`, ccKey, ccItemId:i.id,
      description:i.description, plannedAmount:pay,
      cardName:card?.name||'TC', cardColor:card?.color||'#6366f1',
      currency:card?.currency||'COP',
      label: n>1 ? `Cuota ${num}/${n}` : i.type==='subscription'?'Suscripción':'Diferido',
      type:i.type, purchaseDate:i.purchaseDate||i.startMonth||month,
      installNum:num, installTotal:n,
      category,
      groupId: asgn?.groupId||null, accountId: asgn?.accountId||null,
      executed: !!asgn?.executed,
    };
  }).filter(Boolean), [data.creditCard, data.creditCards, data.ccBudgetAssignments, month]);

  // Expense virtual items (showInBudget)
  const expVirtual = usM(() => (data.expenses || []).filter(exp => exp.showInBudget && getExpenseMonth(exp) === month)
    .map(exp => {
      const cat = data.expenseCategories.find(c => c.id === exp.categoryId);
      return {
        _fromExp:true, id:`exp_${exp.id}`, expId:exp.id,
        description:exp.description, plannedAmount:parseFloat(exp.amount)||0,
        catLabel:cat?.name||'—', currency:exp.currency||'COP',
        date:exp.date, recurrence:exp.recurrence||null, recurrenceGroupId:exp.recurrenceGroupId||null,
        category: cat || null,
        groupId:exp.groupId||null, accountId:exp.accountId||null,
        executed:!!exp.executed,
      };
    }), [data.expenses, data.expenseCategories, month]);

  // Totals
  const totalIncomeBag = usM(() => sumByCurrency(data.income.filter(i => i.date && i.date.startsWith(month)), i=>i.amount, i=>i.currency), [data.income, month]);
  const totalEntriesBag = usM(() => sumByCurrency(monthEntries, i=>i.plannedAmount, i=>i.currency||'COP'), [monthEntries]);
  const totalCCBag = usM(() => sumByCurrency(ccVirtual, i=>i.plannedAmount, i=>i.currency), [ccVirtual]);
  const totalExpBag = usM(() => sumByCurrency(expVirtual, i=>i.plannedAmount, i=>i.currency), [expVirtual]);
  const totalAllBag = usM(() => addCBags(totalEntriesBag, totalCCBag, totalExpBag), [totalEntriesBag, totalCCBag, totalExpBag]);
  const excedenteBag = usM(() => subtractCBags(totalIncomeBag, totalAllBag), [totalIncomeBag, totalAllBag]);

  // Sections
  const allSections = usM(() => {
    if (groupBy === 'group') {
      const all = [...groups, { id: null, name: 'Sin grupo', goal: null }];
      return all.map(g => {
        const gKey = g.id || '__sin_grupo';
        const sEntries = monthEntries.filter(i => (i.groupId||null) === g.id);
        const sCCItems = ccVirtual.filter(i => (i.groupId||null) === g.id);
        const sExpItems = expVirtual.filter(i => (i.groupId||null) === g.id);
        return { ...g, gKey, sEntries, sCCItems, sExpItems };
      }).filter(s => s.id === null || s.sEntries.length || s.sCCItems.length || s.sExpItems.length);
    } else if (groupBy === 'account') {
      const byAcc = {};
      const put = (key, kind, item) => { if (!byAcc[key]) byAcc[key]={entries:[],cc:[],exp:[]}; byAcc[key][kind].push(item); };
      monthEntries.forEach(e => put(e.accountId||'__none__','entries',e));
      ccVirtual.forEach(e => put(e.accountId||'__none__','cc',e));
      expVirtual.forEach(e => put(e.accountId||'__none__','exp',e));
      if (!byAcc['__none__']) byAcc['__none__']={entries:[],cc:[],exp:[]};
      return Object.entries(byAcc).map(([key,v]) => {
        const acc = key==='__none__' ? null : data.accounts.find(a=>a.id===key);
        return { id:key, name:acc?acc.name:'Planificado', goal:null, gKey:key, sEntries:v.entries, sCCItems:v.cc, sExpItems:v.exp };
      }).sort((a,b) => a.id==='__none__'?-1:b.id==='__none__'?1:a.name.localeCompare(b.name));
    } else {
      // category view
      const byCat = {};
      const put = (key, kind, item) => { if (!byCat[key]) byCat[key]={entries:[],cc:[],exp:[]}; byCat[key][kind].push(item); };
      monthEntries.forEach(e => put(e.categoryId||'__none__','entries',e));
      ccVirtual.forEach(e => put(e.category?.id||'__none__','cc',e));
      expVirtual.forEach(e => put(e.category?.id||'__none__','exp',e));
      return Object.entries(byCat).map(([key,v]) => {
        const cat = key==='__none__' ? null : data.expenseCategories.find(c=>c.id===key);
        return { id:key, name:cat?.name||'Sin categoría', goal:null, gKey:'cat_'+key, sEntries:v.entries, sCCItems:v.cc, sExpItems:v.exp };
      }).sort((a,b) => a.name.localeCompare(b.name));
    }
  }, [groupBy, groups, monthEntries, ccVirtual, expVirtual, data.accounts, data.expenseCategories]);

  // Inline EstadoSelect — same style as IncomePage AccountSelect
  const EstadoSelect = ({ value, onChange }) => (
    <select className="select"
      style={{ fontSize:12, padding:'2px 8px', minWidth:0, maxWidth:150, height:28,
        background:value?'var(--warning-soft,#FCE8C9)':'var(--surface-2)',
        color:value?'var(--warning-color,#B8721A)':'var(--text-2)' }}
      value={value||''} onChange={e=>onChange(e.target.value||null)} onClick={e=>e.stopPropagation()}>
      <option value="">Planificado</option>
      {data.accounts.filter(a=>a.active).map(a=><option key={a.id} value={a.id}>{a.parentId?'↳ ':''}{a.name}</option>)}
    </select>
  );

  // Save / delete entry
  const saveEntry = (v) => {
    setData(d => ({
      ...d,
      budget: modal === 'new-entry'
        ? [...d.budget, { id:uid(), ...v }]
        : d.budget.map(x => x.id===modal.editEntry ? {...x,...v} : x)
    }));
    toast(modal==='new-entry'?'Entrada agregada':'Entrada actualizada');
    setModal(null);
  };
  const delEntry = async (id) => {
    const ok = await confirm({ message:'¿Eliminar esta entrada?', ok:'Eliminar', danger:true });
    if (!ok) return;
    setData(d => ({...d, budget:d.budget.filter(x=>x.id!==id)}));
    toast('Eliminada'); setModal(null);
  };

  // Save group
  const saveGroup = (v) => {
    const entry = {...v, goal:v.goal?parseFloat(v.goal):null};
    setData(d => ({
      ...d,
      budgetGroups: modal==='new-group'
        ? [...(d.budgetGroups||[]), {id:uid(),...entry}]
        : (d.budgetGroups||[]).map(g=>g.id===modal.editGroup?{...g,...entry}:g)
    }));
    toast(modal==='new-group'?'Grupo creado':'Grupo actualizado');
    setModal(null);
  };
  const delGroup = async (id) => {
    const ok = await confirm({ message:'¿Eliminar este grupo? Las entradas quedarán sin grupo.', ok:'Eliminar', danger:true });
    if (!ok) return;
    setData(d => ({
      ...d,
      budgetGroups:(d.budgetGroups||[]).filter(g=>g.id!==id),
      budget:d.budget.map(b=>b.groupId===id?{...b,groupId:null}:b),
    }));
    toast('Grupo eliminado'); setModal(null);
  };

  // Copiar mes anterior
  const copyPrevMonth = async () => {
    const [y,m] = month.split('-').map(Number);
    const prev = getMonthKey(new Date(y, m-2, 1));
    const prevItems = data.budget.filter(i => i.month===prev);
    if (!prevItems.length) { toast('No hay entradas en el mes anterior'); return; }
    const current = data.budget.filter(i=>i.month===month);
    if (current.length>0) {
      const ok = await confirm({ message:`El mes actual tiene ${current.length} entrada(s). Se reemplazarán. ¿Continuar?`, ok:'Copiar', danger:true });
      if (!ok) return;
    }
    const without = data.budget.filter(i=>i.month!==month);
    setData(d => ({...d, budget:[...without, ...prevItems.map(i=>({...i,id:uid(),month,accountId:null}))]}));
    toast(`${prevItems.length} entrada(s) copiada(s)`);
  };

  const noteText = usM(() => data.budgetNotes?.[month]||'', [data.budgetNotes, month]);

  const FmtBag = ({bag}) => Object.entries(bag).filter(([,v])=>Math.abs(v)>0).map(([cur,val])=>
    <span key={cur} style={{marginRight:4}}>
      <span className="ccy-tag">{cur}</span>
      <span style={{color:val<0?'var(--negative)':'inherit'}}>{fmtNum(val,cur)}</span>
    </span>);

  return <div className="page col-5">
    {confirmNode}
    <PageHeader title="Presupuesto" subtitle="Entradas planificadas del mes"
      right={<>
        <MonthPicker month={month} onChange={setMonth}/>
        <button className="btn btn-ghost" onClick={() => setModal('new-group')}><Icon.layers size={14}/> Grupos</button>
        <button className="btn btn-ghost" onClick={copyPrevMonth}><Icon.refresh size={14}/> Copiar mes ant.</button>
        <button className="btn btn-primary" onClick={() => setModal('new-entry')}><Icon.plus size={16}/> Nueva entrada</button>
      </>}/>

    <div className="grid-3 keep-2">
      <Card pad="md"><Stat label="Total ingresos" value={<FmtBag bag={totalIncomeBag}/>}/></Card>
      <Card pad="md"><Stat label="Por asignar" value={<FmtBag bag={excedenteBag}/>} tone={Object.values(excedenteBag).every(v=>v>=0)?'pos':'neg'}/></Card>
      <Card pad="md"><Stat label="Asignado" value={<FmtBag bag={totalAllBag}/>}/></Card>
    </div>

    <div className="row" style={{ justifyContent:'space-between', alignItems:'center' }}>
      <Segmented value={groupBy} onChange={setGroupBy} options={[{value:'group',label:'Por grupo'},{value:'account',label:'Por cuenta'},{value:'category',label:'Por categoría'}]}/>
      <button className="btn btn-ghost btn-sm" onClick={() => setModal('notes')}>
        <Icon.edit size={13}/> Anotaciones
      </button>
    </div>

    {allSections.map(section => {
      const {gKey, sEntries, sCCItems, sExpItems} = section;
      const sTotalBag = addCBags(
        sumByCurrency(sEntries, i=>i.plannedAmount, i=>i.currency||'COP'),
        sumByCurrency(sCCItems, i=>i.plannedAmount, i=>i.currency),
        sumByCurrency(sExpItems, i=>i.plannedAmount, i=>i.currency)
      );
      const totalCount = sEntries.length+sCCItems.length+sExpItems.length;
      const execCount = sEntries.filter(i=>i.executed).length+sCCItems.filter(i=>i.executed).length+sExpItems.filter(i=>i.executed).length;
      const rawPct = section.goal>0 ? ((sTotalBag['COP']||0)/section.goal*100) : null;
      const pct = rawPct!==null ? Math.min(rawPct,100) : null;
      const barTone = rawPct===null?'default':rawPct>140?'negative':rawPct>110?'warning':rawPct>=99?'positive':'default';
      const isOpen = !!openGroups[gKey];

      const isDragTarget = canDrag && dragOverGroup === gKey && dragItem?.sectionKey !== gKey;
      return <Card key={gKey} pad="none" style={{ marginBottom:8, outline:isDragTarget?'2px solid var(--accent)':'none', outlineOffset:2, transition:'outline .1s' }}
        onDragOver={canDrag ? e=>handleDragOver(e,gKey) : undefined}
        onDrop={canDrag ? e=>handleDrop(e,gKey,section) : undefined}
        onDragLeave={canDrag ? e=>{ if (!e.currentTarget.contains(e.relatedTarget)) setDragOverGroup(null); } : undefined}>
        {/* Header */}
        <button className="card-pad row-between" style={{ width:'100%', textAlign:'left', cursor:'pointer' }}
          onClick={() => { if (!dragItem) toggleGroup(gKey); }}>
          <div className="row" style={{ gap:10 }}>
            <span style={{ fontSize:12, color:'var(--text-3)', transform:isOpen?'rotate(90deg)':'rotate(0)', display:'inline-block', transition:'transform .2s' }}>▶</span>
            <span className="h4">{section.name}</span>
            <span className="chip" style={{ fontSize:10, padding:'1px 6px' }}>{totalCount}</span>
            {section.id && section.goal && <span className="muted-2" style={{fontSize:11}}>Meta: {fmtCompact(section.goal,'COP')}</span>}
            {groupBy==='group' && section.id && (
              <button className="btn-ico sm" style={{marginLeft:4}} onClick={e=>{e.stopPropagation();setModal({editGroup:section.id,data:section});}}>
                <Icon.edit size={11}/>
              </button>
            )}
          </div>
          <div className="row" style={{gap:12}}>
            <span style={{fontSize:12,fontWeight:600,color:'var(--text)'}}>
              <FmtBag bag={sTotalBag}/>
            </span>
            {totalCount>0 && <span className="muted-2" style={{fontSize:11}}>{execCount}/{totalCount} ✓</span>}
            <Icon.chevDown size={14} style={{transform:isOpen?'rotate(180deg)':'none',transition:'transform .2s'}}/>
          </div>
        </button>

        {/* Goal bar */}
        {pct!==null && isOpen && <div style={{padding:'0 16px 8px'}}><Bar pct={pct} tone={barTone}/></div>}

        {/* Items */}
        {isOpen && <>
          <div className="divider"/>
          <div style={{padding:8}}>
            {/* Budget entries */}
            {sEntries.map(b => {
              const cat = data.expenseCategories.find(c=>c.id===b.categoryId);
              return <div key={b.id} className="tx-row"
                draggable={true}
                onMouseDown={e=>{ dragRef.current = !!e.target.closest('[data-dh]'); }}
                onDragStart={e=>{ if(!dragRef.current){e.preventDefault();return;} handleDragStart(e,{id:b.id,_fromCC:false,sectionKey:gKey,groupId:section.id,accountId:b.accountId}); }}
                onDragEnd={handleDragEnd}
                style={{opacity:b.executed?0.6:dragItem?.id===b.id?0.4:1}}>
                <div data-dh style={{cursor:'grab',display:'contents'}}>
                  <CategoryDot category={cat}/>
                </div>
                <button className="grow" style={{textAlign:'left',minWidth:0}} onClick={()=>setModal({editEntry:b.id,data:b})}>
                  <div className="tx-title truncate">{b.description||cat?.name||'—'}</div>
                  <div className="tx-sub">{b.isFixed===false?'Variable':'Fija'}</div>
                </button>
                <div style={{display:'flex',alignItems:'center',gap:6,flexShrink:0}}>
                  <button className="btn-ico sm"
                    style={{color:b.executed?'var(--positive)':'var(--text-3)'}}
                    title={b.executed?'Marcar pendiente':'Marcar ejecutado'}
                    onClick={e=>{e.stopPropagation();setData(d=>({...d,budget:d.budget.map(x=>x.id===b.id?{...x,executed:!x.executed}:x)}));}}>
                    <Icon.check size={14}/>
                  </button>
                  <button className="btn-ico sm" onClick={e=>{e.stopPropagation();delEntry(b.id);}}>
                    <Icon.trash size={12}/>
                  </button>
                  <span className="amount-sm" style={{flexShrink:0}}><span className="ccy-tag">{b.currency||'COP'}</span>{fmtNum(b.plannedAmount,b.currency||'COP')}</span>
                </div>
              </div>;
            })}
            {/* CC virtual items */}
            {sCCItems.map(cc => (
              <div key={cc.id} className="tx-row"
                draggable={true}
                onMouseDown={e=>{ dragRef.current = !!e.target.closest('[data-dh]'); }}
                onDragStart={e=>{ if(!dragRef.current){e.preventDefault();return;} handleDragStart(e,{ccKey:cc.ccKey,_fromCC:true,sectionKey:gKey,groupId:section.id,accountId:cc.accountId}); }}
                onDragEnd={handleDragEnd}
                style={{opacity:cc.executed?0.6:dragItem?.ccKey===cc.ccKey?0.4:1}}>
                <div data-dh style={{cursor:'grab',display:'contents'}}>
                  <CategoryDot category={cc.category}/>
                </div>
                <div className="grow" style={{minWidth:0}}>
                  <div className="tx-title truncate">{cc.description}</div>
                  <div className="tx-sub">
                    <span className={`chip ${ccTypeChip(cc.type)}`} style={{fontSize:9,padding:'0 4px',marginRight:4}}>{ccTypeLabel(cc.type)}</span>
                    {cc.type==='installment'&&`${cc.installNum}/${cc.installTotal} · `}
                    {formatDate(cc.purchaseDate)}
                  </div>
                </div>
                <div style={{display:'flex',alignItems:'center',gap:6,flexShrink:0}}>
                  <button className="btn-ico sm"
                    style={{color:cc.executed?'var(--positive)':'var(--text-3)'}}
                    title={cc.executed?'Marcar pendiente':'Marcar ejecutado'}
                    onClick={e=>{e.stopPropagation();
                      const asgns=(data.ccBudgetAssignments||[]).filter(a=>a.ccKey!==cc.ccKey);
                      const existing=(data.ccBudgetAssignments||[]).find(a=>a.ccKey===cc.ccKey);
                      setData(d=>({...d,ccBudgetAssignments:[...asgns,{...(existing||{id:uid(),ccKey:cc.ccKey}),executed:!cc.executed}]}));
                    }}>
                    <Icon.check size={14}/>
                  </button>
                  <span className="amount-sm" style={{flexShrink:0}}><span className="ccy-tag">{cc.currency}</span>{fmtNum(cc.plannedAmount,cc.currency)}</span>
                </div>
              </div>
            ))}
            {/* showInBudget expense items */}
            {sExpItems.map(exp => (
              <div key={exp.id} className="tx-row"
                draggable={true}
                onMouseDown={e=>{ dragRef.current = !!e.target.closest('[data-dh]'); }}
                onDragStart={e=>{ if(!dragRef.current){e.preventDefault();return;} handleDragStart(e,{expId:exp.expId,_fromExp:true,sectionKey:gKey,groupId:section.id,accountId:exp.accountId}); }}
                onDragEnd={handleDragEnd}
                style={{opacity:exp.executed?0.6:dragItem?.expId===exp.expId?0.4:1}}>
                <div data-dh style={{cursor:'grab',display:'contents'}}>
                  <CategoryDot category={exp.category}/>
                </div>
                <div className="grow" style={{minWidth:0}}>
                  <div className="tx-title truncate">{exp.description||exp.catLabel}</div>
                  <div className="tx-sub" style={{display:'flex',alignItems:'center',gap:4}}>
                    {exp.recurrenceGroupId && <span className="chip" style={{fontSize:9,padding:'0 4px'}}>{recurrenceLabel(exp.recurrence)}</span>}
                    <span>{formatDate(exp.date)}</span>
                  </div>
                </div>
                <div style={{display:'flex',alignItems:'center',gap:6,flexShrink:0}}>
                  <button className="btn-ico sm"
                    style={{color:exp.executed?'var(--positive)':'var(--text-3)'}}
                    title={exp.executed?'Marcar pendiente':'Marcar ejecutado'}
                    onClick={e=>{e.stopPropagation();setData(d=>({...d,expenses:(d.expenses||[]).map(x=>x.id===exp.expId?{...x,executed:!x.executed}:x)}));}}>
                    <Icon.check size={14}/>
                  </button>
                  <span className="amount-sm" style={{flexShrink:0}}><span className="ccy-tag">{exp.currency}</span>{fmtNum(exp.plannedAmount,exp.currency)}</span>
                </div>
              </div>
            ))}
            {totalCount===0 && <div className="muted-2" style={{textAlign:'center',fontSize:13,padding:'8px 0'}}>Sin entradas · <button className="btn btn-ghost btn-sm" style={{fontSize:12}} onClick={()=>setModal('new-entry')}>+ Agregar</button></div>}
          </div>
          {groupBy==='group' && section.id && <div className="card-pad" style={{paddingTop:0}}>
            <button className="btn btn-ghost btn-sm" style={{fontSize:12}} onClick={()=>setModal('new-entry')}>
              <Icon.plus size={12}/> Agregar a este grupo
            </button>
          </div>}
        </>}
      </Card>;
    })}

    {allSections.length===0 && <Card pad="md">
      <Empty icon="budget" title="Sin presupuesto este mes" desc="Agrega entradas o grupos para comenzar."
        action={<button className="btn btn-primary" onClick={()=>setModal('new-entry')}><Icon.plus size={16}/> Nueva entrada</button>}/>
    </Card>}

    {/* New/Edit entry */}
    <Modal open={modal==='new-entry'||!!(modal&&modal.editEntry)} onClose={()=>setModal(null)} title={modal&&modal.editEntry?'Editar entrada':'Nueva entrada'}>
      <BudgetForm data={data} defaultMonth={month} initial={modal&&modal.data} onClose={()=>setModal(null)} onSave={saveEntry} onDelete={modal&&modal.editEntry?()=>delEntry(modal.editEntry):undefined}/>
    </Modal>

    {/* New/Edit group */}
    <Modal open={modal==='new-group'||!!(modal&&modal.editGroup)} onClose={()=>setModal(null)} title={modal&&modal.editGroup?'Editar grupo':'Nuevo grupo'} size="sm">
      <GroupForm groups={groups} initial={modal&&modal.data} onClose={()=>setModal(null)} onSave={saveGroup} onDelete={modal&&modal.editGroup?()=>delGroup(modal.editGroup):undefined}/>
    </Modal>

    {/* Notes */}
    <Modal open={modal==='notes'} onClose={()=>setModal(null)} title={`Anotaciones · ${formatMonthLabel(month)}`} size="sm">
      <NotesForm value={noteText} onSave={val=>{setData(d=>({...d,budgetNotes:{...(d.budgetNotes||{}),[month]:val}}));toast('Anotaciones guardadas');setModal(null);}} onClose={()=>setModal(null)}/>
    </Modal>
  </div>;
}

// Mini forms used inside BudgetPage
function GroupForm({ groups, initial, onClose, onSave, onDelete }) {
  const [name, setName] = usS(initial?.name||'');
  const [goal, setGoal] = usS(initial?.goal||'');
  return <div>
    <div className="field"><label className="field-label">Nombre del grupo</label>
      <input className="input" value={name} onChange={e=>setName(e.target.value)} placeholder="Ej: Hogar, Personal, Ahorro"/></div>
    <div className="field"><label className="field-label">Meta mensual COP (opcional)</label>
      <input className="input" type="number" value={goal} onChange={e=>setGoal(e.target.value)} placeholder="Dejar vacío si no aplica"/></div>
    <div className="modal-actions">
      {onDelete && <button className="btn btn-negative" onClick={onDelete}>Eliminar</button>}
      <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
      <button className="btn btn-primary" disabled={!name.trim()} onClick={()=>onSave({name,goal})}>Guardar</button>
    </div>
  </div>;
}

function NotesForm({ value, onSave, onClose }) {
  const [text, setText] = usS(value||'');
  return <div>
    <textarea className="input" rows={6} style={{resize:'vertical'}} value={text} onChange={e=>setText(e.target.value)} placeholder="Notas del mes..."/>
    <div className="modal-actions">
      <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
      <button className="btn btn-primary" onClick={()=>onSave(text)}>Guardar</button>
    </div>
  </div>;
}

// ═══════════════════════════════════════════════════════════
// EXPENSES
// ═══════════════════════════════════════════════════════════
function ExpensesPage({ data, setData, month, setMonth }) {
  const toast = useToast();
  const [confirm, confirmNode] = useConfirm();
  const [modal, setModal] = usS(null);
  const [recAction, setRecAction] = usS(null); // {item, action:'edit'|'delete'}
  const [groupBy, setGroupBy] = usS('group');
  const [openGroups, setOpenGroups] = usS({});
  const toggleGroup = (k) => setOpenGroups(p => ({...p, [k]: p[k]===false ? true : false}));
  const isOpen = (k) => openGroups[k] !== false;
  const [dragItem, setDragItem] = usS(null);
  const [dragOverGroup, setDragOverGroup] = usS(null);
  const canDrag = groupBy !== 'category'; // disabled in category view
  const dragRef = usR(false);
  const handleDragStart = (e, item) => { setDragItem(item); e.dataTransfer.effectAllowed = 'move'; };
  const handleDragEnd = () => { setDragItem(null); setDragOverGroup(null); };
  const handleDragOver = (e, gKey) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; if (dragOverGroup !== gKey) setDragOverGroup(gKey); };
  const handleDrop = (e, gKey, section) => {
    e.preventDefault();
    if (!dragItem || dragItem.sectionKey === gKey) { setDragItem(null); setDragOverGroup(null); return; }
    if (groupBy === 'group') {
      const targetGroupId = section.key === '__none__' ? null : section.key;
      setData(d=>({...d, expenses:d.expenses.map(i=>i.id===dragItem.id?{...i,groupId:targetGroupId}:i)}));
      toast('Gasto movido al grupo');
    } else {
      const targetAccId = section.key === '__none__' ? null : section.key;
      setData(d=>({...d, expenses:d.expenses.map(i=>i.id===dragItem.id?{...i,accountId:targetAccId}:i)}));
      toast('Cuenta asignada');
    }
    setOpenGroups(p=>({...p,[gKey]:p[gKey]===false?true:p[gKey]}));
    setDragItem(null); setDragOverGroup(null);
  };

  const groups = data.budgetGroups || [];

  const monthExpenses = usM(() =>
    (data.expenses||[]).filter(e => getExpenseMonth(e)===month).sort((a,b)=>a.date.localeCompare(b.date)),
    [data.expenses, month]);

  const overdueCount = usM(() => monthExpenses.filter(e=>isExpenseOverdue(e)).length, [monthExpenses]);
  const totalBag = usM(() => sumByCurrency(monthExpenses, e=>parseFloat(e.amount)||0, e=>e.currency), [monthExpenses]);
  const executedBag = usM(() => sumByCurrency(monthExpenses.filter(e=>e.executed), e=>parseFloat(e.amount)||0, e=>e.currency), [monthExpenses]);

  const grouped = usM(() => {
    if (groupBy==='group') {
      const byGroup = {};
      monthExpenses.forEach(exp => { const k=exp.groupId||'__none__'; if(!byGroup[k])byGroup[k]=[]; byGroup[k].push(exp); });
      const order = ['__none__', ...groups.map(g=>g.id)];
      return order.filter(k=>byGroup[k]?.length>0).map(k=>({
        key:k, label:k==='__none__'?'Sin grupo':(groups.find(g=>g.id===k)?.name||'Sin grupo'), items:byGroup[k]
      }));
    } else if (groupBy==='account') {
      const byAcc = {};
      monthExpenses.forEach(exp => { const k=exp.accountId||'__none__'; if(!byAcc[k])byAcc[k]=[]; byAcc[k].push(exp); });
      return Object.entries(byAcc).map(([k,items]) => {
        const acc = k==='__none__'?null:data.accounts.find(a=>a.id===k);
        return { key:k, label:acc?acc.name:'Planificado', items };
      }).sort((a,b)=>a.label==='Planificado'?-1:b.label==='Planificado'?1:a.label.localeCompare(b.label));
    } else {
      const byCat = {};
      monthExpenses.forEach(exp => { const k=exp.categoryId||'__none__'; if(!byCat[k])byCat[k]=[]; byCat[k].push(exp); });
      return Object.entries(byCat).map(([k,items]) => {
        const cat = k==='__none__'?null:data.expenseCategories.find(c=>c.id===k);
        return { key:k, label:cat?.name||'Sin categoría', items };
      }).sort((a,b)=>a.label.localeCompare(b.label));
    }
  }, [monthExpenses, groupBy, groups, data.accounts, data.expenseCategories]);

  // Inline account selector — same style as IncomePage AccountSelect
  const AccSelect = ({value, onChange}) => (
    <select className="select"
      style={{fontSize:12, padding:'2px 8px', minWidth:0, maxWidth:150, height:28,
        background:value?'var(--warning-soft,#FCE8C9)':'var(--surface-2)',
        color:value?'var(--warning-color,#B8721A)':'var(--text-2)'}}
      value={value||''} onChange={e=>onChange(e.target.value||null)} onClick={e=>e.stopPropagation()}>
      <option value="">Planificado</option>
      {data.accounts.filter(a=>a.active).map(a=><option key={a.id} value={a.id}>{a.parentId?'↳ ':''}{a.name}</option>)}
    </select>
  );

  // Save
  const save = (v) => {
    if (modal==='new' && v.isRecurring) {
      const dates = generateRecurrenceDates(v.date, v.endDate||null, v.recurrence);
      const gid = uid();
      const items = dates.map(d => ({
        ...v, id:uid(), date:d, month:d.slice(0,7), recurrenceGroupId:gid, executed:false
      }));
      setData(d => ({...d, expenses:[...d.expenses, ...items]}));
      toast(`${items.length} gasto(s) programados`);
    } else if (modal && modal.edit && modal.editScope && modal.editScope !== 'single' && modal.data?.recurrenceGroupId) {
      // Scoped edit: apply to siblings based on scope
      const gid = modal.data.recurrenceGroupId;
      const siblings = data.expenses.filter(e => e.recurrenceGroupId === gid);
      const base = {...v, month:(v.date||'').slice(0,7), executed:v.status==='executed'};
      let targets;
      if (modal.editScope === 'thisAndFuture') {
        targets = new Set(siblings.filter(e => e.date >= modal.data.date).map(e => e.id));
      } else { // 'all'
        targets = new Set(siblings.map(e => e.id));
      }
      setData(d => ({...d, expenses:d.expenses.map(x => targets.has(x.id) ? {...x,...base} : x)}));
      toast(`${targets.size} gasto(s) actualizado(s)`);
    } else {
      const base = {...v, month:(v.date||'').slice(0,7), executed:v.status==='executed'};
      setData(d => ({
        ...d,
        expenses: modal==='new'
          ? [...d.expenses, {id:uid(),...base}]
          : d.expenses.map(x=>x.id===modal.edit?{...x,...base}:x)
      }));
      toast(modal==='new'?'Gasto registrado':'Gasto actualizado');
    }
    setModal(null);
  };

  const handleEdit = (exp) => {
    if (exp.recurrenceGroupId) { setRecAction({item:exp, action:'edit'}); }
    else { setModal({edit:exp.id, data:exp, editScope:'single'}); }
  };

  const handleDelete = async (exp) => {
    if (exp.recurrenceGroupId) { setRecAction({item:exp, action:'delete'}); }
    else {
      const ok = await confirm({message:'¿Eliminar este gasto?',ok:'Eliminar',danger:true});
      if (!ok) return;
      setData(d=>({...d, expenses:d.expenses.filter(x=>x.id!==exp.id)}));
      toast('Eliminado');
    }
  };

  const executeRecAction = async (scope) => {
    const {item, action} = recAction;
    const gid = item.recurrenceGroupId;
    if (action==='edit') {
      setRecAction(null);
      setModal({edit:item.id, data:item, editScope:scope});
    } else {
      const siblings = gid ? data.expenses.filter(e=>e.recurrenceGroupId===gid) : [item];
      let toRemove;
      if (scope==='single') toRemove = new Set([item.id]);
      else if (scope==='thisAndFuture') toRemove = new Set(siblings.filter(e=>e.date>=item.date).map(e=>e.id));
      else toRemove = new Set(siblings.map(e=>e.id));
      setData(d=>({...d, expenses:d.expenses.filter(e=>!toRemove.has(e.id))}));
      toast(`${toRemove.size} gasto(s) eliminado(s)`);
      setRecAction(null);
    }
  };

  const FmtBag = ({bag}) => Object.entries(bag).filter(([,v])=>v>0).map(([cur,val])=>
    <span key={cur} style={{marginRight:6}}><span className="ccy-tag">{cur}</span>{fmtNum(val,cur)}</span>);

  return <div className="page col-5">
    {confirmNode}
    <PageHeader title="Gastos compartidos" subtitle="Gastos planificados y recurrentes"
      right={<>
        <MonthPicker month={month} onChange={setMonth}/>
        <button className="btn btn-primary" onClick={()=>setModal('new')}><Icon.plus size={16}/> Nuevo</button>
      </>}/>

    <div className="grid-3 keep-2">
      <Card pad="md"><Stat label="Total mes" value={<FmtBag bag={totalBag}/>}/></Card>
      <Card pad="md"><Stat label="Ejecutado" value={<FmtBag bag={executedBag}/>} tone="neg"/></Card>
      <Card pad="md"><Stat label="⚠ Vencidos" value={overdueCount} tone={overdueCount>0?'neg':'pos'}/></Card>
    </div>

    <Segmented value={groupBy} onChange={setGroupBy} options={[{value:'group',label:'Por grupo'},{value:'account',label:'Por cuenta'},{value:'category',label:'Por categoría'}]}/>

    {monthExpenses.length===0
      ? <Card pad="md"><Empty icon="receipt" title="Sin gastos este mes" desc="Registra tu primer gasto."
          action={<button className="btn btn-primary" onClick={()=>setModal('new')}><Icon.plus size={16}/> Agregar</button>}/></Card>
      : <div className="col-4">
          {grouped.map(section => {
            const open = isOpen(section.key);
            const sTotalBag = sumByCurrency(section.items, e=>parseFloat(e.amount)||0, e=>e.currency);
            const isDragTarget = canDrag && dragOverGroup === section.key && dragItem?.sectionKey !== section.key;
            return <Card key={section.key} pad="none"
              style={{outline:isDragTarget?'2px solid var(--accent)':'none', outlineOffset:2, transition:'outline .1s'}}
              onDragOver={canDrag ? e=>handleDragOver(e,section.key) : undefined}
              onDrop={canDrag ? e=>handleDrop(e,section.key,section) : undefined}
              onDragLeave={canDrag ? e=>{ if (!e.currentTarget.contains(e.relatedTarget)) setDragOverGroup(null); } : undefined}>
              <button className="card-pad row-between" style={{width:'100%',textAlign:'left',cursor:'pointer',borderRadius:0}}
                onClick={()=>{ if (!dragItem) toggleGroup(section.key); }}>
                <div className="row" style={{gap:10}}>
                  <span style={{fontSize:12,color:'var(--text-3)',transform:open?'rotate(90deg)':'none',display:'inline-block',transition:'transform .2s'}}>▶</span>
                  <span className="h4">{section.label}</span>
                  <span className="chip" style={{fontSize:10,padding:'1px 6px'}}>{section.items.length}</span>
                </div>
                <span style={{fontSize:13,fontWeight:600}}><FmtBag bag={sTotalBag}/></span>
              </button>
              {open && <>
                <div className="divider"/>
                <div style={{padding:8}}>
                  {section.items.map(exp => {
                    const cat = data.expenseCategories.find(c=>c.id===exp.categoryId);
                    const overdue = isExpenseOverdue(exp);
                    return <div key={exp.id} className="tx-row"
                      draggable={true}
                      onMouseDown={e=>{ dragRef.current = !!e.target.closest('[data-dh]'); }}
                      onDragStart={e=>{ if(!dragRef.current){e.preventDefault();return;} handleDragStart(e,{id:exp.id,sectionKey:section.key,groupId:section.key==='__none__'?null:section.key,accountId:exp.accountId}); }}
                      onDragEnd={handleDragEnd}
                      style={{opacity:exp.executed?0.6:dragItem?.id===exp.id?0.4:1}}>
                      <div data-dh style={{cursor:'grab',display:'contents'}}>
                        <CategoryDot category={cat}/>
                      </div>
                      <button className="grow" style={{textAlign:'left',minWidth:0}} onClick={()=>handleEdit(exp)}>
                        <div className="tx-title truncate">
                          {overdue && <span style={{color:'var(--negative)',marginRight:4}}>⚠</span>}
                          {exp.description||cat?.name||'Gasto'}
                        </div>
                        <div className="tx-sub" style={{display:'flex',alignItems:'center',gap:4}}>
                          {exp.recurrenceGroupId && <span className="chip" style={{fontSize:9,padding:'0 4px'}}>{recurrenceLabel(exp.recurrence)}</span>}
                          <span>{formatDate(exp.date)}</span>
                        </div>
                      </button>
                      <div style={{display:'flex',alignItems:'center',gap:6}}>
                        <button className="btn-ico sm"
                          style={{color:exp.executed?'var(--positive)':'var(--text-3)'}}
                          title={exp.executed?'Marcar pendiente':'Marcar ejecutado'}
                          onClick={e=>{e.stopPropagation();setData(d=>({...d,expenses:d.expenses.map(x=>x.id===exp.id?{...x,executed:!x.executed}:x)}));}}>
                          <Icon.check size={14}/>
                        </button>
                        <button className="btn-ico sm" onClick={e=>{e.stopPropagation();handleDelete(exp);}}>
                          <Icon.trash size={12}/>
                        </button>
                        <span className="amount-sm"><span className="ccy-tag">{exp.currency}</span>{fmtNum(parseFloat(exp.amount)||0,exp.currency)}</span>
                      </div>
                    </div>;
                  })}
                </div>
              </>}
            </Card>;
          })}
        </div>}

    {/* New/Edit form */}
    <Modal open={modal==='new'||!!(modal&&modal.edit)} onClose={()=>setModal(null)} title={modal&&modal.edit?'Editar gasto':'Nuevo gasto'}>
      <ExpenseForm data={data} initial={modal&&modal.data} editScope={modal&&modal.editScope}
        onClose={()=>setModal(null)} onSave={save}
        onDelete={modal&&modal.edit?()=>{setModal(null);handleDelete(modal.data);}:undefined}/>
    </Modal>

    {/* Recurrence scope dialog */}
    {recAction && <div className="modal-backdrop" onClick={()=>setRecAction(null)}>
      <div className="modal" style={{maxWidth:400}} onClick={e=>e.stopPropagation()}>
        <div className="modal-head">
          <h3 className="modal-title">{recAction.action==='delete'?'¿Qué deseas eliminar?':'¿Qué deseas editar?'}</h3>
          <button className="btn-ico" onClick={()=>setRecAction(null)}><Icon.close/></button>
        </div>
        <div className="modal-body">
          <p className="muted" style={{marginBottom:12,fontSize:13}}>
            Este gasto forma parte de una serie recurrente ({recurrenceLabel(recAction.item.recurrence)}).
          </p>
          <div style={{display:'flex',flexDirection:'column',gap:8}}>
            <button className="btn btn-outline" style={{justifyContent:'flex-start'}} onClick={()=>executeRecAction('single')}>Solo este gasto</button>
            <button className="btn btn-outline" style={{justifyContent:'flex-start'}} onClick={()=>executeRecAction('thisAndFuture')}>Este y todos los siguientes</button>
            <button className="btn btn-outline" style={{justifyContent:'flex-start',color:'var(--negative)'}} onClick={()=>executeRecAction('all')}>Todos los de la serie</button>
          </div>
        </div>
      </div>
    </div>}
  </div>;
}

// ═══════════════════════════════════════════════════════════
// CREDIT CARDS
// ═══════════════════════════════════════════════════════════
function CreditPage({ data, setData, month, setMonth }) {
  const toast = useToast();
  const [confirm, confirmNode] = useConfirm();
  const [modal, setModal] = usS(null);
  const [openCards, setOpenCards] = usS({});
  const toggleCard = (id) => setOpenCards(p=>({...p,[id]:!p[id]}));

  const getItemCur = (i) => { const c=data.creditCards.find(c=>c.id===i.cardId); return c?.currency||'COP'; };

  const totalThisMonthBag = usM(() => sumByCurrency(data.creditCard, i=>getCCPaymentForMonth(i,month), getItemCur), [data.creditCard, month]);

  const hasIndefiniteSubs = usM(() => data.creditCard.some(i=>i.type==='subscription'&&!i.endMonth&&getCCPaymentForMonth(i,month)>0), [data.creditCard, month]);
  const totalCapitalBag = usM(() => sumByCurrency(data.creditCard.filter(i=>calcRemainingCapital(i)!=null), i=>calcRemainingCapital(i), getItemCur), [data.creditCard]);
  const totalInterestBag = usM(() => sumByCurrency(data.creditCard.filter(i=>calcRemainingInterest(i)!=null), i=>calcRemainingInterest(i), getItemCur), [data.creditCard]);

  const itemsByCard = usM(() => {
    const map = {};
    data.creditCards.forEach(c=>{map[c.id]=[];});
    data.creditCard.forEach(i=>{if(!map[i.cardId])map[i.cardId]=[];map[i.cardId].push(i);});
    return map;
  }, [data.creditCards, data.creditCard]);

  const orphans = usM(() => data.creditCard.filter(i=>!i.cardId||!data.creditCards.find(c=>c.id===i.cardId)), [data.creditCard, data.creditCards]);

  const saveCard = (v) => {
    setData(d=>({...d, creditCards:modal==='new-card'?[...d.creditCards,{id:uid(),...v}]:d.creditCards.map(c=>c.id===modal.editCard?{...c,...v}:c)}));
    toast(modal==='new-card'?'Tarjeta creada':'Tarjeta actualizada'); setModal(null);
  };
  const delCard = async (id) => {
    const ok = await confirm({message:'¿Eliminar esta tarjeta y todos sus cargos?',ok:'Eliminar',danger:true});
    if(!ok)return;
    setData(d=>({...d,creditCards:d.creditCards.filter(c=>c.id!==id),creditCard:d.creditCard.filter(i=>i.cardId!==id)}));
    toast('Tarjeta eliminada'); setModal(null);
  };
  const saveItem = (v) => {
    setData(d=>({...d, creditCard:modal==='new-item'||modal&&modal.newForCard?[...d.creditCard,{id:uid(),...v}]:d.creditCard.map(i=>i.id===modal.editItem?{...i,...v}:i)}));
    toast(modal==='new-item'||modal&&modal.newForCard?'Cargo registrado':'Cargo actualizado'); setModal(null);
  };
  const delItem = async (id) => {
    const ok = await confirm({message:'¿Eliminar este cargo?',ok:'Eliminar',danger:true});
    if(!ok)return;
    setData(d=>({...d,creditCard:d.creditCard.filter(i=>i.id!==id)}));
    toast('Eliminado'); setModal(null);
  };

  const FmtBag = ({bag,neg}) => Object.entries(bag).filter(([,v])=>v>0).map(([cur,val])=>
    <span key={cur} style={{marginRight:6,color:neg?'var(--negative)':undefined}}>
      <span className="ccy-tag">{cur}</span>{fmtNum(val,cur)}
    </span>);

  const typeLabel = (t) => ({single:'Diferido',installment:'Cuotas',subscription:'Suscripción'})[t]||t;
  const typeChipClass = (t) => t==='installment'?'chip-warn':t==='subscription'?'':t==='single'?'':'';

  return <div className="page col-5">
    {confirmNode}
    <PageHeader title="Tarjetas de crédito" subtitle="Cuotas, diferidos y suscripciones"
      right={<>
        <MonthPicker month={month} onChange={setMonth}/>
        <button className="btn btn-ghost" onClick={()=>setModal('new-card')}><Icon.plus size={14}/> Tarjeta</button>
        <button className="btn btn-primary" disabled={data.creditCards.length===0} onClick={()=>setModal('new-item')}><Icon.plus size={16}/> Cargo</button>
      </>}/>

    <div className="grid-4 keep-2">
      <Card pad="md"><Stat label={`Pago ${formatMonthShort(month)}`} value={<FmtBag bag={totalThisMonthBag} neg/>} tone="neg"/></Card>
      <Card pad="md">
        <Stat label={`Deuda capital${hasIndefiniteSubs?' *':''}`} value={<FmtBag bag={totalCapitalBag}/>}/>
        {hasIndefiniteSubs && <div className="muted-2" style={{fontSize:10,marginTop:2}}>* Sin subs indefinidas</div>}
      </Card>
      <Card pad="md"><Stat label="Deuda intereses" value={<FmtBag bag={totalInterestBag}/>} tone="warn"/></Card>
      <Card pad="md"><Stat label="Tarjetas activas" value={data.creditCards.filter(c=>c.active!==false).length}/></Card>
    </div>

    {data.creditCards.length===0
      ? <Card pad="lg"><Empty icon="card" title="Sin tarjetas" desc="Agrega una tarjeta para gestionar cuotas."
          action={<button className="btn btn-primary" onClick={()=>setModal('new-card')}><Icon.plus size={16}/> Nueva tarjeta</button>}/></Card>
      : <div className="col-4">
          {data.creditCards.filter(c=>c.active!==false).map(card => {
            const cardItems = itemsByCard[card.id]||[];
            const cardPay = cardItems.reduce((s,i)=>s+getCCPaymentForMonth(i,month),0);
            const cardCap = cardItems.reduce((s,i)=>{const v=calcRemainingCapital(i);return v!=null?s+v:s;},0);
            const cardInt = cardItems.reduce((s,i)=>{const v=calcRemainingInterest(i);return v!=null?s+v:s;},0);
            const isOp = !!openCards[card.id];
            return <Card key={card.id} pad="none">
              <button className="card-pad row-between" style={{width:'100%',textAlign:'left',cursor:'pointer'}}
                onClick={()=>toggleCard(card.id)}>
                <div className="row" style={{gap:12}}>
                  <div style={{width:12,height:12,borderRadius:'50%',background:card.color||'#6366f1',flexShrink:0,marginTop:2}}/>
                  <div>
                    <div className="h4">{card.name}{card.lastFour&&<span className="muted-2" style={{fontFamily:'monospace',marginLeft:6,fontSize:11}}>••••{card.lastFour}</span>}</div>
                    <div className="tx-sub">{card.bank} · deuda: {fmtCompact(cardCap+cardInt,card.currency||'COP')}</div>
                  </div>
                </div>
                <div style={{display:'flex',alignItems:'center',gap:12}}>
                  <div style={{textAlign:'right'}}>
                    <div className="muted-2" style={{fontSize:11}}>Pago {formatMonthShort(month)}</div>
                    <div style={{fontWeight:700,fontSize:14,color:cardPay>0?'var(--negative)':'var(--text-3)'}}>{fmtNum(cardPay,card.currency||'COP')}</div>
                  </div>
                  <button className="btn-ico sm" onClick={e=>{e.stopPropagation();setModal({editCard:card.id,data:card});}}>
                    <Icon.edit size={13}/>
                  </button>
                  <Icon.chevDown size={14} style={{transform:isOp?'rotate(180deg)':'none',transition:'transform .2s'}}/>
                </div>
              </button>
              {isOp && <>
                <div className="divider"/>
                <div style={{padding:8}}>
                  {cardItems.length===0
                    ? <div className="muted-2" style={{textAlign:'center',fontSize:13,padding:12}}>Sin cargos en esta tarjeta</div>
                    : cardItems.sort((a,b)=>b.purchaseDate.localeCompare(a.purchaseDate)).map(i=>{
                        const pay = getCCPaymentForMonth(i,month);
                        const n = parseInt(i.installments)||1;
                        const [sy,sm] = (i.startMonth||month).split('-').map(Number);
                        const [my,mm] = month.split('-').map(Number);
                        const installNum = Math.min(Math.max((my-sy)*12+(mm-sm)+1,1),n);
                        const isActive = pay>0;
                        return <div key={i.id} className="tx-row" style={{opacity:i.type==='subscription'&&!isActive?0.5:1}}>
                          <div className="tx-icon cat-2"><Icon.receipt size={14}/></div>
                          <button className="grow" style={{textAlign:'left',minWidth:0}} onClick={()=>setModal({editItem:i.id,data:i})}>
                            <div className="tx-title truncate">{i.description}</div>
                            <div className="tx-sub">
                              <span className={`chip ${typeChipClass(i.type)}`} style={{fontSize:9,padding:'0 4px',marginRight:4}}>{typeLabel(i.type)}</span>
                              {i.type==='installment'&&`${installNum}/${n} · `}
                              {formatDate(i.purchaseDate)}
                              {i.notes&&<span> · {i.notes}</span>}
                            </div>
                          </button>
                          <div style={{display:'flex',alignItems:'center',gap:6}}>
                            <button className="btn-ico sm" onClick={e=>{e.stopPropagation();delItem(i.id);}}>
                              <Icon.trash size={12}/>
                            </button>
                            <div className="amount-sm" style={{color:isActive?'var(--negative)':'var(--text-3)'}}>
                              {isActive?<><span className="ccy-tag">{card.currency||'COP'}</span>{fmtNum(pay,card.currency||'COP')}</>:'—'}
                            </div>
                          </div>
                        </div>;
                      })
                  }
                </div>
                <div className="card-pad" style={{paddingTop:0}}>
                  <button className="btn btn-ghost btn-sm" style={{fontSize:12}}
                    onClick={()=>setModal({newForCard:card.id})}>
                    <Icon.plus size={12}/> Agregar cargo a {card.name}
                  </button>
                </div>
              </>}
            </Card>;
          })}
        </div>}

    {/* Orphan items */}
    {orphans.length>0 && <Card pad="none" style={{borderLeft:'3px solid var(--warning-color,#B8721A)'}}>
      <div className="card-pad row-between">
        <span className="h4" style={{color:'var(--warning-color,#B8721A)'}}>⚠ Cargos sin tarjeta ({orphans.length})</span>
        <span className="muted-2" style={{fontSize:12}}>Edítalos para asignar tarjeta</span>
      </div>
      <div className="divider"/>
      <div style={{padding:8}}>
        {orphans.map(i=>(
          <div key={i.id} className="tx-row">
            <div className="tx-icon"><Icon.receipt size={14}/></div>
            <button className="grow" style={{textAlign:'left',minWidth:0}} onClick={()=>setModal({editItem:i.id,data:i})}>
              <div className="tx-title">{i.description}</div>
              <div className="tx-sub">{formatDate(i.purchaseDate)}</div>
            </button>
            <span className="amount-sm">{fmtNum(parseFloat(i.totalAmount)||0,'COP')}</span>
          </div>
        ))}
      </div>
    </Card>}

    <Modal open={modal==='new-card'||!!(modal&&modal.editCard)} onClose={()=>setModal(null)} title={modal&&modal.editCard?'Editar tarjeta':'Nueva tarjeta'}>
      <CardForm initial={modal&&modal.data} onClose={()=>setModal(null)} onSave={saveCard} onDelete={modal&&modal.editCard?()=>delCard(modal.editCard):undefined}/>
    </Modal>
    <Modal open={modal==='new-item'||!!(modal&&(modal.editItem||modal.newForCard))} onClose={()=>setModal(null)} title={modal&&modal.editItem?'Editar cargo':'Nuevo cargo'}>
      <CCItemForm data={data} initial={modal&&modal.data} defaultCardId={modal&&modal.newForCard}
        onClose={()=>setModal(null)} onSave={saveItem}
        onDelete={modal&&modal.editItem?()=>delItem(modal.editItem):undefined}/>
    </Modal>
  </div>;
}

// ═══════════════════════════════════════════════════════════
// LOANS — loansGiven + debts
// ═══════════════════════════════════════════════════════════
function LoansPage({ data, setData }) {
  const toast = useToast();
  const [confirm, confirmNode] = useConfirm();
  const [tab, setTab] = usS('given');
  const [modal, setModal] = usS(null);
  const [payModal, setPayModal] = usS(null);
  const [personPayModal, setPersonPayModal] = usS(null);
  const [openPersons, setOpenPersons] = usS({});
  const togglePerson = (p) => setOpenPersons(prev=>({...prev,[p]:prev[p]===false?true:false}));
  const isPersonOpen = (p) => openPersons[p]!==false;

  const statusLabel = {pending:'Pendiente',partial:'Parcial',paid:'Pagado'};
  const statusTone = {pending:'warn',partial:'warn',paid:'pos'};

  // Per-person sections (given tab only)
  const personSections = usM(() => {
    if (tab!=='given') return [];
    const byPerson = {};
    (data.loansGiven||[]).forEach(l=>{
      const p=l.person||'Sin nombre'; if(!byPerson[p])byPerson[p]=[]; byPerson[p].push(l);
    });
    return Object.entries(byPerson).map(([person,loans])=>{
      loans.sort((a,b)=>a.date.localeCompare(b.date));
      const totalBag = sumByCurrency(loans, l=>l.amount, l=>l.currency);
      const paidBag = sumByCurrency(loans, l=>(l.payments||[]).reduce((s,p)=>s+p.amount,0), l=>l.currency);
      const pendingBag = subtractCBags(totalBag, paidBag);
      const activeCount = loans.filter(l=>l.status!=='paid').length;
      return {person,loans,totalBag,paidBag,pendingBag,activeCount};
    }).sort((a,b)=>a.activeCount>0&&b.activeCount===0?-1:a.activeCount===0&&b.activeCount>0?1:a.person.localeCompare(b.person));
  },[data.loansGiven, tab]);

  const debtList = data.debts||[];

  const totalPendingGiven = usM(()=>sumByCurrency(
    (data.loansGiven||[]).filter(l=>l.status!=='paid'),
    l=>{const paid=(l.payments||[]).reduce((s,p)=>s+p.amount,0); return l.amount-paid;},
    l=>l.currency
  ),[data.loansGiven]);

  const totalPendingDebt = usM(()=>sumByCurrency(debtList.filter(x=>x.status!=='paid'),x=>x.amount,x=>x.currency),[debtList]);

  const saveGiven = (v) => {
    setData(d=>({...d,loansGiven:modal==='new'?[...d.loansGiven,{id:uid(),payments:[],...v}]:d.loansGiven.map(x=>x.id===modal.edit?{...x,...v}:x)}));
    toast(modal==='new'?'Préstamo registrado':'Actualizado'); setModal(null);
  };
  const saveDebt = (v) => {
    setData(d=>({...d,debts:modal==='new'?[...(d.debts||[]),{id:uid(),...v}]:(d.debts||[]).map(x=>x.id===modal.edit?{...x,...v}:x)}));
    toast(modal==='new'?'Deuda registrada':'Actualizada'); setModal(null);
  };
  const delGiven = async (id) => {
    const ok = await confirm({message:'¿Eliminar este préstamo?',ok:'Eliminar',danger:true});
    if(!ok)return;
    setData(d=>({...d,loansGiven:d.loansGiven.filter(x=>x.id!==id)}));
    toast('Eliminado'); setModal(null);
  };
  const delDebt = async (id) => {
    const ok = await confirm({message:'¿Eliminar esta deuda?',ok:'Eliminar',danger:true});
    if(!ok)return;
    setData(d=>({...d,debts:(d.debts||[]).filter(x=>x.id!==id)}));
    toast('Eliminada'); setModal(null);
  };

  // Payment cell with tooltip
  const PaidCell = ({loan}) => {
    const [showTip, setShowTip] = usS(false);
    const payments = loan.payments||[];
    const paid = payments.reduce((s,p)=>s+p.amount,0);
    return <div style={{position:'relative',display:'inline-block'}}
      onMouseEnter={()=>payments.length>0&&setShowTip(true)}
      onMouseLeave={()=>setShowTip(false)}>
      <span style={{color:'var(--positive)',cursor:payments.length>0?'help':'default',fontWeight:600}}>
        {fmtNum(paid,loan.currency)}
      </span>
      {showTip && payments.length>0 && <div style={{position:'absolute',bottom:'100%',left:0,background:'var(--surface)',border:'1px solid var(--line-strong)',
        borderRadius:8,padding:'8px 12px',boxShadow:'var(--shadow-3)',zIndex:200,minWidth:220,fontSize:12}}>
        <div style={{fontWeight:600,marginBottom:6}}>Historial de abonos</div>
        {payments.map((p,i)=>(
          <div key={i} style={{display:'flex',justifyContent:'space-between',gap:12,padding:'2px 0',borderBottom:i<payments.length-1?'1px solid var(--line)':'none'}}>
            <span className="muted-2">{p.date}</span>
            <span style={{fontWeight:500}}>{fmtNum(p.amount,p.currency||loan.currency)}</span>
          </div>
        ))}
        {payments.some(p=>p.notes) && payments.filter(p=>p.notes).map((p,i)=>(
          <div key={`n${i}`} style={{fontSize:11,color:'var(--text-3)',marginTop:4}}>{p.date}: {p.notes}</div>
        ))}
      </div>}
    </div>;
  };

  // Single loan payment form
  const PaymentForm = ({loan, onClose}) => {
    const [amount, setAmount] = usS('');
    const [date, setDate] = usS(today());
    const [notes, setNotes] = usS('');
    const save = () => {
      if(!amount)return;
      const payment={id:uid(),date,amount:parseFloat(amount),currency:loan.currency,notes};
      const payments=[...(loan.payments||[]),payment];
      const totalPaid=payments.reduce((s,p)=>s+p.amount,0);
      const status=totalPaid>=loan.amount?'paid':totalPaid>0?'partial':'pending';
      setData(d=>({...d,loansGiven:d.loansGiven.map(i=>i.id===loan.id?{...i,payments,status}:i)}));
      toast('Abono registrado'); onClose();
    };
    return <div>
      <p className="muted" style={{fontSize:13,marginBottom:12}}>Préstamo a {loan.person} por {fmtStr(loan.amount,loan.currency)}</p>
      <div className="field-row">
        <div className="field"><label className="field-label">Fecha</label><input className="input" type="date" value={date} onChange={e=>setDate(e.target.value)}/></div>
        <div className="field"><label className="field-label">Monto ({loan.currency})</label><input className="input" type="number" value={amount} onChange={e=>setAmount(e.target.value)}/></div>
      </div>
      <div className="field"><label className="field-label">Nota (opcional)</label><input className="input" value={notes} onChange={e=>setNotes(e.target.value)}/></div>
      <div className="modal-actions">
        <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
        <button className="btn btn-primary" onClick={save} disabled={!amount}>Registrar abono</button>
      </div>
    </div>;
  };

  // Per-person payment form (distributes oldest-first, same-currency first)
  const PersonPayForm = ({person, loans, onClose}) => {
    const [amount, setAmt] = usS('');
    const [currency, setCurrency] = usS('COP');
    const [date, setDate] = usS(today());
    const [notes, setNotes] = usS('');
    const [exchangeRate, setExchangeRate] = usS('');
    const [showExchange, setShowExchange] = usS(false);
    const activeLoans = loans.filter(l=>l.status!=='paid').sort((a,b)=>a.date.localeCompare(b.date));
    const hasSameCur = activeLoans.some(l=>l.currency===currency);
    const hasOtherCur = activeLoans.some(l=>l.currency!==currency);
    const preview = usM(()=>{
      if(!amount)return[];
      let remaining=parseFloat(amount)||0;
      const rate=parseFloat(exchangeRate)||0;
      const result=[];
      const sameCur=activeLoans.filter(l=>l.currency===currency);
      const diffCur=activeLoans.filter(l=>l.currency!==currency);
      for(const l of [...sameCur,...diffCur]){
        if(remaining<=0)break;
        const paid=(l.payments||[]).reduce((s,p)=>s+p.amount,0);
        const owing=l.amount-paid;
        if(owing<=0)continue;
        if(l.currency===currency){
          const apply=Math.min(remaining,owing);
          result.push({loanId:l.id,applyAmount:apply,currency:l.currency,loanDesc:`${l.date} — ${fmtStr(l.amount,l.currency)}`});
          remaining-=apply;
        } else if(rate>0){
          const remConverted=remaining*rate;
          const apply=Math.min(remConverted,owing);
          const spent=apply/rate;
          result.push({loanId:l.id,applyAmount:apply,currency:l.currency,loanDesc:`${l.date} — ${fmtStr(l.amount,l.currency)}`,converted:true,spent});
          remaining-=spent;
        }
      }
      return result;
    },[amount,currency,exchangeRate,activeLoans]);
    const save=()=>{
      if(!amount||preview.length===0)return;
      let updated=[...data.loansGiven];
      preview.forEach(p=>{
        updated=updated.map(l=>{
          if(l.id!==p.loanId)return l;
          const payment={id:uid(),date,amount:p.applyAmount,currency:p.currency,notes:notes+(p.converted?` (convertido desde ${currency})`:'')};
          const payments=[...(l.payments||[]),payment];
          const totalPaid=payments.reduce((s,pp)=>s+pp.amount,0);
          const status=totalPaid>=l.amount?'paid':totalPaid>0?'partial':'pending';
          return{...l,payments,status};
        });
      });
      setData(d=>({...d,loansGiven:updated}));
      toast(`Abono distribuido en ${preview.length} préstamo(s)`);
      onClose();
    };
    return <div>
      <p className="muted" style={{fontSize:13,marginBottom:12}}>Abonar a préstamos de <strong>{person}</strong> ({activeLoans.length} activo(s))</p>
      <div className="field-row">
        <div className="field"><label className="field-label">Fecha</label><input className="input" type="date" value={date} onChange={e=>setDate(e.target.value)}/></div>
        <div className="field"><label className="field-label">Monto</label><input className="input" type="number" value={amount} onChange={e=>setAmt(e.target.value)}/></div>
        <div className="field"><label className="field-label">Moneda</label>
          <select className="select" value={currency} onChange={e=>setCurrency(e.target.value)}>
            <option value="COP">COP</option><option value="USD">USD</option>
          </select>
        </div>
      </div>
      {hasSameCur&&hasOtherCur&&amount&&parseFloat(amount)>0&&(
        <div style={{padding:'8px 12px',background:'var(--accent-soft)',borderRadius:8,fontSize:12,marginBottom:8,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <span>Hay deudas en otra moneda. Puedes definir tipo de cambio.</span>
          <button className="btn btn-ghost btn-sm" style={{fontSize:11}} onClick={()=>setShowExchange(!showExchange)}>{showExchange?'Ocultar':'Definir TRM'}</button>
        </div>
      )}
      {(!hasSameCur&&hasOtherCur&&amount)&&(
        <div style={{padding:'8px 12px',background:'var(--warning-soft,#FCE8C9)',borderRadius:8,fontSize:12,color:'var(--warning-color,#B8721A)',marginBottom:8}}>
          No hay deudas en {currency}. Se necesita tipo de cambio.
        </div>
      )}
      {(showExchange||(!hasSameCur&&hasOtherCur))&&(
        <div className="field"><label className="field-label">Tasa: 1 {currency} = ? {activeLoans.find(l=>l.currency!==currency)?.currency}</label>
          <input className="input" type="number" step="any" value={exchangeRate} onChange={e=>setExchangeRate(e.target.value)} placeholder="Ej: 4200"/>
        </div>
      )}
      <div className="field"><label className="field-label">Nota (opcional)</label><input className="input" value={notes} onChange={e=>setNotes(e.target.value)}/></div>
      {preview.length>0&&(
        <div style={{marginBottom:12,padding:'10px 12px',background:'var(--surface-2)',borderRadius:8,fontSize:12}}>
          <div style={{fontWeight:600,marginBottom:6}}>Distribución:</div>
          {preview.map((p,i)=>(
            <div key={i} style={{display:'flex',justifyContent:'space-between',padding:'2px 0',borderBottom:i<preview.length-1?'1px solid var(--line)':'none'}}>
              <span className="muted-2">{p.loanDesc}</span>
              <span style={{fontWeight:600}}>{fmtNum(p.applyAmount,p.currency)}{p.converted&&<span className="muted-2" style={{marginLeft:4}}>(conv.)</span>}</span>
            </div>
          ))}
        </div>
      )}
      <div className="modal-actions">
        <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
        <button className="btn btn-primary" disabled={preview.length===0} onClick={save}>Distribuir abono</button>
      </div>
    </div>;
  };

  const FmtBag = ({bag,tone}) => Object.entries(bag).filter(([,v])=>v>0).map(([cur,val])=>
    <span key={cur} style={{marginRight:6,color:tone==='pos'?'var(--positive)':tone==='neg'?'var(--negative)':undefined}}>
      <span className="ccy-tag">{cur}</span>{fmtNum(val,cur)}
    </span>);

  return <div className="page col-5">
    {confirmNode}
    <PageHeader title="Préstamos y deudas" subtitle="Dinero que prestaste o que debes"
      right={<button className="btn btn-primary" onClick={()=>setModal('new')}><Icon.plus size={16}/> Nuevo</button>}/>

    <Segmented value={tab} onChange={setTab} options={[{value:'given',label:'Prestado'},{value:'debts',label:'Debo'}]}/>

    {/* GIVEN TAB */}
    {tab==='given' && <>
      <div className="grid-3 keep-2">
        <Card pad="md"><Stat label="Por cobrar" value={<FmtBag bag={totalPendingGiven} tone="pos"/>} tone="pos"/></Card>
        <Card pad="md"><Stat label="Préstamos activos" value={(data.loansGiven||[]).filter(l=>l.status!=='paid').length}/></Card>
        <Card pad="md"><Stat label="Personas" value={personSections.length}/></Card>
      </div>
      {personSections.length===0
        ? <Card pad="md"><Empty icon="loan" title="Sin préstamos registrados" desc="Registra los préstamos que has hecho."
            action={<button className="btn btn-primary" onClick={()=>setModal('new')}><Icon.plus size={16}/> Agregar</button>}/></Card>
        : <div className="col-4">
            {personSections.map(section=>{
              const open=isPersonOpen(section.person);
              return <Card key={section.person} pad="none">
                <button className="card-pad row-between" style={{width:'100%',textAlign:'left',cursor:'pointer'}}
                  onClick={()=>togglePerson(section.person)}>
                  <div className="row" style={{gap:10}}>
                    <div className="tx-icon cat-5" style={{width:32,height:32}}><Icon.user size={16}/></div>
                    <div>
                      <div className="h4">{section.person}</div>
                      <div className="tx-sub">{section.loans.length} préstamo(s) · {section.activeCount===0?<span style={{color:'var(--positive)'}}>Todo pagado</span>:`${section.activeCount} activo(s)`}</div>
                    </div>
                  </div>
                  <div style={{display:'flex',alignItems:'center',gap:12}}>
                    {section.activeCount>0&&(
                      <button className="btn btn-ghost btn-sm" style={{fontSize:11}} onClick={e=>{e.stopPropagation();setPersonPayModal({person:section.person,loans:section.loans});}}>
                        Abonar
                      </button>
                    )}
                    <div style={{textAlign:'right'}}>
                      <div className="muted-2" style={{fontSize:11}}>Pendiente</div>
                      <div style={{fontWeight:700,fontSize:13}}><FmtBag bag={section.pendingBag}/></div>
                    </div>
                    <Icon.chevDown size={14} style={{transform:open?'rotate(180deg)':'none',transition:'transform .2s'}}/>
                  </div>
                </button>
                {open&&<>
                  <div className="divider"/>
                  <div style={{padding:8}}>
                    {section.loans.map(l=>{
                      const paid=(l.payments||[]).reduce((s,p)=>s+p.amount,0);
                      const saldo=l.amount-paid;
                      return <div key={l.id} className="tx-row" style={{opacity:l.status==='paid'?0.55:1}}>
                        <div className="grow" style={{minWidth:0}}>
                          <div className="tx-title">{formatDateLong(l.date)} · {fmtStr(l.amount,l.currency)}</div>
                          <div className="tx-sub">{l.notes||'—'}</div>
                        </div>
                        <div style={{display:'flex',alignItems:'center',gap:8}}>
                          <div style={{textAlign:'right',fontSize:12}}>
                            <div><PaidCell loan={l}/><span className="muted-2" style={{marginLeft:4}}>abonado</span></div>
                            <div style={{color:saldo>0?'var(--negative)':'var(--positive)',fontWeight:600}}>{fmtNum(saldo,l.currency)} saldo</div>
                          </div>
                          <span className={`chip chip-${statusTone[l.status]||'warn'}`} style={{fontSize:11}}>{statusLabel[l.status]}</span>
                          {l.status!=='paid'&&<button className="btn btn-ghost btn-sm" style={{fontSize:11}} onClick={()=>setPayModal(l)}>Abonar</button>}
                          <button className="btn-ico sm" onClick={()=>setModal({edit:l.id,data:l})}><Icon.edit size={12}/></button>
                          <button className="btn-ico sm" onClick={()=>delGiven(l.id)}><Icon.trash size={12}/></button>
                        </div>
                      </div>;
                    })}
                  </div>
                </>}
              </Card>;
            })}
          </div>}
    </>}

    {/* DEBTS TAB */}
    {tab==='debts' && <>
      <div className="grid-2 keep-2">
        <Card pad="md"><Stat label="Por pagar" value={<FmtBag bag={totalPendingDebt} tone="neg"/>} tone="neg"/></Card>
        <Card pad="md"><Stat label="Deudas activas" value={debtList.filter(x=>x.status!=='paid').length}/></Card>
      </div>
      <Card pad="none">
        {debtList.length===0
          ? <Empty icon="loan" title="No debes nada" desc="Registra tus deudas."
              action={<button className="btn btn-primary" onClick={()=>setModal('new')}><Icon.plus size={16}/> Agregar</button>}/>
          : <div style={{padding:8}}>
              {debtList.map(l=>(
                <div key={l.id} className="tx-row">
                  <div className="tx-icon cat-2"><Icon.user size={16}/></div>
                  <button className="grow" style={{textAlign:'left',minWidth:0}} onClick={()=>setModal({edit:l.id,data:l})}>
                    <div className="tx-title">{l.person}</div>
                    <div className="tx-sub">{formatDate(l.date)}{l.dueDate?` · vence ${formatDate(l.dueDate)}`:''}</div>
                  </button>
                  <div style={{display:'flex',alignItems:'center',gap:8}}>
                    <div className={`amount-sm ${l.status==='paid'?'muted-2':'text-neg'}`}
                      style={l.status==='paid'?{textDecoration:'line-through'}:undefined}>
                      <span className="ccy-tag">{l.currency}</span>{fmtNum(l.amount,l.currency)}
                    </div>
                    <button className={`chip chip-${statusTone[l.status]||'warn'}`} style={{border:0,cursor:'pointer',fontSize:11}}
                      onClick={()=>{const status=l.status==='paid'?'pending':'paid';setData(d=>({...d,debts:(d.debts||[]).map(x=>x.id===l.id?{...x,status}:x)}))}}>
                      {statusLabel[l.status]}
                    </button>
                    <button className="btn-ico sm" onClick={()=>delDebt(l.id)}><Icon.trash size={12}/></button>
                  </div>
                </div>
              ))}
            </div>}
      </Card>
    </>}

    <Modal open={modal==='new'||!!(modal&&modal.edit)} onClose={()=>setModal(null)} title={tab==='given'?(modal&&modal.edit?'Editar préstamo':'Nuevo préstamo'):(modal&&modal.edit?'Editar deuda':'Nueva deuda')}>
      <LoanForm data={data} isDebt={tab==='debts'} initial={modal&&modal.data}
        onClose={()=>setModal(null)}
        onSave={tab==='given'?saveGiven:saveDebt}
        onDelete={modal&&modal.edit?(tab==='given'?()=>delGiven(modal.edit):()=>delDebt(modal.edit)):undefined}/>
    </Modal>
    <Modal open={!!payModal} onClose={()=>setPayModal(null)} title="Registrar abono">
      {payModal&&<PaymentForm loan={payModal} onClose={()=>setPayModal(null)}/>}
    </Modal>
    <Modal open={!!personPayModal} onClose={()=>setPersonPayModal(null)} title="Abonar por persona" size="lg">
      {personPayModal&&<PersonPayForm person={personPayModal.person} loans={personPayModal.loans} onClose={()=>setPersonPayModal(null)}/>}
    </Modal>
  </div>;
}

// ═══════════════════════════════════════════════════════════
// CONFIG
// ═══════════════════════════════════════════════════════════
function ConfigPage({ data, setData, theme, setTheme }) {
  const toast = useToast();
  const [confirm, confirmNode] = useConfirm();
  const [section, setSection] = usS('accounts');
  const [modal, setModal] = usS(null);

  // ── Data export/import ──────────────────────────────────
  const exportData = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href=url; a.download=`finanzas-backup-${today()}.json`; a.click();
    URL.revokeObjectURL(url);
  };
  const importData = (file) => {
    const r = new FileReader();
    r.onload = () => { try { const d=JSON.parse(r.result); setData({...defaultData,...d}); toast('Datos importados'); } catch(e){ alert('JSON inválido'); } };
    r.readAsText(file);
  };
  const reset = async () => {
    const ok = await confirm({message:'¿Borrar todos los datos? Esta acción no se puede deshacer.',ok:'Borrar todo',danger:true});
    if(!ok)return;
    localStorage.removeItem(STORAGE_KEY); setData({...defaultData}); toast('Datos borrados');
  };

  // ── Generic save/delete ─────────────────────────────────
  const saveItem = (collection, item, oldId) => {
    setData(d=>({
      ...d,
      [collection]: oldId
        ? d[collection].map(i=>i.id===oldId?{...i,...item}:i)
        : [...d[collection],{...item,id:uid()}]
    }));
    toast(oldId?'Actualizado':'Creado'); setModal(null);
  };
  const delItem = async (collection, id, name) => {
    const ok = await confirm({message:`¿Eliminar "${name}"?`,ok:'Eliminar',danger:true});
    if(!ok) return false;
    setData(d=>({...d,[collection]:d[collection].filter(i=>i.id!==id)}));
    toast('Eliminado');
    return true;
  };

  // ── Inline forms ────────────────────────────────────────
  const AccountModalForm = ({item, onClose}) => {
    const init = item||{name:'',bank:'',currency:'COP',type:'checking',active:true,parentId:null,color:PALETTE[0]};
    const [form,setForm] = usS(init);
    const set=(k,v)=>setForm(f=>({...f,[k]:v}));
    const parentAccounts = data.accounts.filter(a=>!a.parentId&&a.id!==item?.id);
    return <div>
      <div className="field"><label className="field-label">Nombre</label><input className="input" value={form.name} onChange={e=>set('name',e.target.value)} placeholder="Ej: Cuenta Principal"/></div>
      <div className="field-row">
        <div className="field"><label className="field-label">Banco</label><input className="input" value={form.bank||''} onChange={e=>set('bank',e.target.value)} placeholder="Ej: Bancolombia"/></div>
        <div className="field"><label className="field-label">Moneda</label>
          <select className="select" value={form.currency} onChange={e=>set('currency',e.target.value)}>
            <option value="COP">COP</option><option value="USD">USD</option><option value="EUR">EUR</option>
          </select>
        </div>
      </div>
      <div className="field-row">
        <div className="field"><label className="field-label">Tipo</label>
          <select className="select" value={form.type} onChange={e=>set('type',e.target.value)}>
            <option value="checking">Corriente</option><option value="savings">Ahorros</option>
            <option value="cash">Efectivo</option><option value="pocket">Bolsillo</option>
          </select>
        </div>
        <div className="field"><label className="field-label">Cuenta padre (bolsillo)</label>
          <select className="select" value={form.parentId||''} onChange={e=>set('parentId',e.target.value||null)}>
            <option value="">— Principal —</option>
            {parentAccounts.map(a=><option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
        </div>
      </div>
      <div className="field"><label className="field-label">Color</label>
        <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
          {PALETTE.map(c=><button key={c} type="button" onClick={()=>set('color',c)}
            style={{width:28,height:28,borderRadius:'50%',background:c,border:form.color===c?'3px solid var(--text)':'3px solid transparent',cursor:'pointer'}}/>)}
        </div>
      </div>
      <label className="checkbox-row"><input type="checkbox" checked={!!form.active} onChange={e=>set('active',e.target.checked)}/><span>Cuenta activa</span></label>
      <div className="modal-actions">
        {item&&<button className="btn btn-negative" onClick={()=>delItem('accounts',item.id,item.name).then(ok=>ok&&onClose())}>Eliminar</button>}
        <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
        <button className="btn btn-primary" disabled={!form.name.trim()} onClick={()=>saveItem('accounts',form,item?.id)}>Guardar</button>
      </div>
    </div>;
  };

  const CategoryModalForm = ({item, onClose}) => {
    const ICON_OPTS = [
      {k:'home',l:'Casa'},{k:'cart',l:'Mercado'},{k:'car',l:'Auto'},{k:'bolt',l:'Servicios'},
      {k:'health',l:'Salud'},{k:'film',l:'Entret.'},{k:'user',l:'Personal'},{k:'shield',l:'Seguros'},
      {k:'book',l:'Educación'},{k:'tag',l:'General'},{k:'receipt',l:'Facturas'},{k:'wallet',l:'Finanzas'},
      {k:'pin',l:'Viajes'},{k:'card',l:'Tarjetas'},{k:'layers',l:'Categoría'},{k:'swap',l:'Cambio'},
      {k:'income',l:'Ingresos'},{k:'loan',l:'Préstamo'},{k:'sparkles',l:'Especial'},{k:'clock',l:'Tiempo'},
      {k:'cog',l:'Config'},{k:'gift',l:'Regalos'},{k:'calendar',l:'Fechas'},{k:'star',l:'Favorito'},
      {k:'trending',l:'Inversión'},{k:'trendingDown',l:'Deudas'},{k:'bell',l:'Alertas'},{k:'flag',l:'Metas'},
      {k:'sun',l:'Vacaciones'},{k:'moon',l:'Noche'},{k:'pieChart',l:'Estadística'},{k:'bullseye',l:'Objetivo'},
      {k:'send',l:'Envíos'},{k:'refresh',l:'Recurrente'},{k:'alert',l:'Urgente'},{k:'data',l:'Internet'},
      {k:'budget',l:'Presupuesto'},{k:'expense',l:'Gastos'},{k:'spark',l:'Destello'},{k:'eye',l:'Revisión'},
      {k:'paw',l:'Mascotas'},{k:'briefcase',l:'Trabajo'},{k:'dumbbell',l:'Ejercicio'},
    ];
    const [name,setName] = usS(item?.name||'');
    const [icon,setIcon] = usS(item?.icon||'tag');
    return <div>
      <div className="field"><label className="field-label">Nombre</label>
        <input className="input" value={name} onChange={e=>setName(e.target.value)} placeholder="Ej: Mercado"/>
      </div>
      <div className="field"><label className="field-label">Ícono</label>
        <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
          {ICON_OPTS.map(({k,l})=>{
            const IconCmp = Icon[k];
            if (!IconCmp) return null;
            const sel = icon===k;
            return <button key={k} type="button" onClick={()=>setIcon(k)} title={l}
              style={{width:48,height:48,borderRadius:'var(--r-2)',
                border:sel?'2px solid var(--accent)':'2px solid var(--line)',
                background:sel?'color-mix(in srgb,var(--accent) 12%,var(--surface))':'var(--surface-2)',
                color:sel?'var(--accent)':'var(--text-3)',
                cursor:'pointer',display:'flex',flexDirection:'column',alignItems:'center',
                justifyContent:'center',gap:3,transition:'all .12s'}}>
              <IconCmp size={17}/>
              <span style={{fontSize:9,lineHeight:1,color:'inherit'}}>{l}</span>
            </button>;
          })}
        </div>
      </div>
      <div className="modal-actions">
        {item&&<button className="btn btn-negative" onClick={()=>delItem('expenseCategories',item.id,item.name).then(ok=>ok&&onClose())}>Eliminar</button>}
        <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
        <button className="btn btn-primary" disabled={!name.trim()} onClick={()=>saveItem('expenseCategories',{name,icon},item?.id)}>Guardar</button>
      </div>
    </div>;
  };

  const SourceModalForm = ({item, onClose}) => {
    const [name,setName] = usS(item?.name||'');
    return <div>
      <div className="field"><label className="field-label">Nombre de la fuente</label><input className="input" value={name} onChange={e=>setName(e.target.value)} placeholder="Ej: Freelance"/></div>
      <div className="modal-actions">
        {item&&<button className="btn btn-negative" onClick={()=>delItem('incomeSources',item.id,item.name).then(ok=>ok&&onClose())}>Eliminar</button>}
        <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
        <button className="btn btn-primary" disabled={!name.trim()} onClick={()=>saveItem('incomeSources',{name},item?.id)}>Guardar</button>
      </div>
    </div>;
  };

  const ExchangeRateForm = ({onClose}) => {
    const [rates,setRates] = usS(data.exchangeRates||[]);
    const addRate = ()=>setRates([...rates,{from:'USD',to:'COP',rate:0,date:today()}]);
    const upd = (i,k,v)=>{const r=[...rates];r[i]={...r[i],[k]:v};setRates(r);};
    return <div>
      {rates.map((r,i)=>(
        <div key={i} className="field-row" style={{alignItems:'flex-end',marginBottom:8}}>
          <div className="field"><label className="field-label">De</label><input className="input" value={r.from} onChange={e=>upd(i,'from',e.target.value)}/></div>
          <div className="field"><label className="field-label">A</label><input className="input" value={r.to} onChange={e=>upd(i,'to',e.target.value)}/></div>
          <div className="field" style={{flex:2}}><label className="field-label">Tasa</label><input className="input" type="number" value={r.rate} onChange={e=>upd(i,'rate',parseFloat(e.target.value)||0)}/></div>
          <button className="btn-ico sm" style={{marginBottom:4}} onClick={()=>setRates(rates.filter((_,j)=>j!==i))}><Icon.trash size={14}/></button>
        </div>
      ))}
      <button className="btn btn-ghost btn-sm" onClick={addRate} style={{marginBottom:16}}><Icon.plus size={14}/> Agregar tasa</button>
      <div className="modal-actions">
        <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
        <button className="btn btn-primary" onClick={()=>{setData(d=>({...d,exchangeRates:rates}));toast('Tasas actualizadas');onClose();}}>Guardar</button>
      </div>
    </div>;
  };

  // Get modal title
  const getModalTitle = () => {
    if(!modal)return'';
    if(modal.type==='account')return modal.item?'Editar cuenta':'Nueva cuenta';
    if(modal.type==='category')return modal.item?'Editar categoría':'Nueva categoría';
    if(modal.type==='source')return modal.item?'Editar fuente':'Nueva fuente';
    if(modal.type==='rates')return'Tasas de cambio';
    return'';
  };

  return <div className="page col-5">
    {confirmNode}
    <PageHeader title="Configuración" subtitle="Cuentas, categorías y preferencias"/>

    {/* Theme */}
    <Card pad="md">
      <div className="eyebrow" style={{marginBottom:10}}>Apariencia</div>
      <div className="row" style={{gap:8}}>
        <button className={`btn ${theme==='pulse'?'btn-primary':'btn-outline'}`} onClick={()=>setTheme('pulse')}><Icon.sun size={14}/> Pulse</button>
        <button className={`btn ${theme==='edge'?'btn-primary':'btn-outline'}`} onClick={()=>setTheme('edge')}><Icon.moon size={14}/> Edge</button>
      </div>
    </Card>

    {/* Section tabs */}
    <Segmented value={section} onChange={setSection} options={[
      {value:'accounts',label:'Cuentas'},
      {value:'categories',label:'Categorías'},
      {value:'sources',label:'Fuentes'},
      {value:'rates',label:'Tasas'},
      {value:'data',label:'Datos'},
    ]}/>

    {/* ACCOUNTS */}
    {section==='accounts'&&<Card pad="none">
      <div className="card-pad row-between">
        <h3 className="h3">Cuentas</h3>
        <button className="btn btn-ghost btn-sm" onClick={()=>setModal({type:'account'})}><Icon.plus size={14}/> Agregar</button>
      </div>
      <div className="divider"/>
      <div style={{padding:8}}>
        {data.accounts.filter(a=>!a.parentId).map(a=>(
          <React.Fragment key={a.id}>
            <div className="tx-row">
              <AccountDot account={a} size={36}/>
              <div className="grow">
                <div className="tx-title">{a.name}</div>
                <div className="tx-sub">{a.bank||'—'} · {a.currency} · {a.active?'Activa':'Inactiva'}</div>
              </div>
              <button className="btn-ico sm" onClick={()=>setModal({type:'account',item:a})}><Icon.edit size={13}/></button>
            </div>
            {data.accounts.filter(p=>p.parentId===a.id).map(pocket=>(
              <div key={pocket.id} className="tx-row" style={{paddingLeft:32,opacity:0.85}}>
                <AccountDot account={pocket} size={28}/>
                <div className="grow">
                  <div className="tx-title" style={{fontSize:13}}>↳ {pocket.name}</div>
                  <div className="tx-sub">{pocket.currency} · Bolsillo</div>
                </div>
                <button className="btn-ico sm" onClick={()=>setModal({type:'account',item:pocket})}><Icon.edit size={13}/></button>
              </div>
            ))}
          </React.Fragment>
        ))}
      </div>
    </Card>}

    {/* CATEGORIES */}
    {section==='categories'&&<Card pad="none">
      <div className="card-pad row-between">
        <h3 className="h3">Categorías de gasto</h3>
        <button className="btn btn-ghost btn-sm" onClick={()=>setModal({type:'category'})}><Icon.plus size={14}/> Agregar</button>
      </div>
      <div className="divider"/>
      <div style={{padding:12,display:'flex',flexWrap:'wrap',gap:8}}>
        {data.expenseCategories.map(c=>{
          const iconKey = CATEGORY_ICON?.[c.icon];
          const IconCmp = iconKey ? Icon[iconKey] : null;
          return (
            <button key={c.id} className="chip" style={{fontSize:13,padding:'6px 12px',cursor:'pointer',display:'flex',alignItems:'center',gap:6}}
              onClick={()=>setModal({type:'category',item:c})}>
              {IconCmp
                ? <IconCmp size={14}/>
                : <span style={{fontSize:14}}>{c.icon}</span>}
              {c.name} <Icon.edit size={11} style={{opacity:0.5}}/>
            </button>
          );
        })}
      </div>
    </Card>}

    {/* INCOME SOURCES */}
    {section==='sources'&&<Card pad="none">
      <div className="card-pad row-between">
        <h3 className="h3">Fuentes de ingreso</h3>
        <button className="btn btn-ghost btn-sm" onClick={()=>setModal({type:'source'})}><Icon.plus size={14}/> Agregar</button>
      </div>
      <div className="divider"/>
      <div style={{padding:8}}>
        {data.incomeSources.map(s=>(
          <div key={s.id} className="tx-row">
            <div className="tx-icon cat-3"><Icon.income size={14}/></div>
            <div className="grow"><div className="tx-title">{s.name}</div></div>
            <button className="btn-ico sm" onClick={()=>setModal({type:'source',item:s})}><Icon.edit size={13}/></button>
          </div>
        ))}
      </div>
    </Card>}

    {/* EXCHANGE RATES */}
    {section==='rates'&&<Card pad="md">
      <div className="row-between" style={{marginBottom:16}}>
        <h3 className="h3">Tasas de cambio</h3>
        <button className="btn btn-ghost btn-sm" onClick={()=>setModal({type:'rates'})}><Icon.edit size={13}/> Editar</button>
      </div>
      {(data.exchangeRates||[]).length===0
        ? <p className="muted">No hay tasas configuradas.</p>
        : (data.exchangeRates||[]).map((r,i)=>(
            <div key={i} className="tx-row">
              <div className="tx-icon cat-6"><Icon.swap size={14}/></div>
              <div className="grow"><div className="tx-title">1 {r.from} = {fmtNum(r.rate,'COP')} {r.to}</div><div className="tx-sub">{r.date}</div></div>
            </div>
          ))}
    </Card>}

    {/* DATA */}
    {section==='data'&&<Card pad="md">
      <div className="col-4">
        <div>
          <h3 className="h3">Exportar</h3>
          <p className="muted" style={{fontSize:13,marginTop:4}}>Descarga una copia de todos tus datos en JSON.</p>
          <button className="btn btn-outline" style={{marginTop:12}} onClick={exportData}><Icon.download size={14}/> Exportar JSON</button>
        </div>
        <div className="divider"/>
        <div>
          <h3 className="h3">Importar</h3>
          <p className="muted" style={{fontSize:13,marginTop:4}}>Reemplaza todos tus datos con los de un archivo JSON.</p>
          <label className="btn btn-outline" style={{marginTop:12,display:'inline-flex',cursor:'pointer'}}>
            <Icon.upload size={14}/> Seleccionar archivo
            <input type="file" accept="application/json" style={{display:'none'}} onChange={e=>e.target.files[0]&&importData(e.target.files[0])}/>
          </label>
        </div>
        <div className="divider"/>
        <div>
          <h3 className="h3" style={{color:'var(--negative)'}}>Zona peligrosa</h3>
          <p className="muted" style={{fontSize:13,marginTop:4}}>Borrar todos los datos locales permanentemente.</p>
          <button className="btn btn-negative" style={{marginTop:12}} onClick={reset}><Icon.trash size={14}/> Borrar todo</button>
        </div>
      </div>
    </Card>}

    {/* Modal */}
    <Modal open={!!modal} onClose={()=>setModal(null)} title={getModalTitle()}>
      {modal?.type==='account'&&<AccountModalForm item={modal.item} onClose={()=>setModal(null)}/>}
      {modal?.type==='category'&&<CategoryModalForm item={modal.item} onClose={()=>setModal(null)}/>}
      {modal?.type==='source'&&<SourceModalForm item={modal.item} onClose={()=>setModal(null)}/>}
      {modal?.type==='rates'&&<ExchangeRateForm onClose={()=>setModal(null)}/>}
    </Modal>
  </div>;
}

Object.assign(window, { IncomePage, BudgetPage, ExpensesPage, CreditPage, LoansPage, ConfigPage });
