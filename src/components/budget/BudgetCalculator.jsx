import React, { useState, useEffect } from 'react';
import { Save } from 'lucide-react';

const t = {
  gold:'#B8973A',goldDim:'rgba(184,151,58,0.15)',goldBorder:'rgba(184,151,58,0.3)',
  dark:'#0C0C0E',surfaceAlt:'#16161A',border:'rgba(255,255,255,0.07)',
  text:'#F0EDE6',muted:'rgba(240,237,230,0.45)',dim:'rgba(240,237,230,0.22)',
  green:'#6EAF7A',greenDim:'rgba(110,175,122,0.15)',greenBorder:'rgba(110,175,122,0.3)',
  red:'#C0665A',redDim:'rgba(192,102,90,0.15)',redBorder:'rgba(192,102,90,0.3)',
};

const BUDGET_CATEGORIES = [
  { key:'housing',       label:'Housing / Rent',     suggested:30 },
  { key:'food',          label:'Food & Groceries',    suggested:15 },
  { key:'transport',     label:'Transportation',      suggested:10 },
  { key:'utilities',     label:'Utilities',           suggested:5  },
  { key:'education',     label:'Education',           suggested:10 },
  { key:'entertainment', label:'Entertainment',       suggested:5  },
  { key:'savings',       label:'Savings',             suggested:20 },
  { key:'other',         label:'Other',               suggested:5  },
];

const DEFAULT_ALLOCATIONS = BUDGET_CATEGORIES.reduce((acc,cat)=>({...acc,[cat.key]:cat.suggested}),{});

export default function BudgetCalculator({ profile, onSave }) {
  const [income,      setIncome]      = useState('');
  const [allocations, setAllocations] = useState(DEFAULT_ALLOCATIONS);

  useEffect(()=>{
    if (profile?.monthly_income)    setIncome(String(profile.monthly_income));
    if (profile?.budget_allocations) setAllocations(profile.budget_allocations);
  },[profile?.monthly_income, profile?.budget_allocations]);

  const totalPct  = Object.values(allocations).reduce((s,v)=>s+(parseFloat(v)||0),0);
  const incomeNum = parseFloat(income)||0;

  const handleSave = () => {
    const budget = Object.entries(allocations).reduce(
      (s,[,v])=>s+(incomeNum*(parseFloat(v)||0)/100),0
    );
    onSave({ monthly_income:incomeNum, monthly_budget:budget, budget_allocations:allocations });
  };

  const totalColor = totalPct===100 ? t.green : totalPct>100 ? t.red : t.muted;
  const totalBg    = totalPct===100 ? t.greenDim : totalPct>100 ? t.redDim : 'rgba(255,255,255,0.03)';
  const totalBorder= totalPct===100 ? t.greenBorder : totalPct>100 ? t.redBorder : t.border;

  return (
    <div style={{padding:'14px 16px 16px',fontFamily:"'DM Sans',sans-serif"}}>
      <style>{`
        .cc-bc-input:focus{border-color:rgba(184,151,58,0.5)!important;}
        .cc-bc-input::placeholder{color:rgba(240,237,230,0.25)!important;}
        .cc-save-btn:hover:not(:disabled){background:#D4AF5A!important;box-shadow:0 0 18px rgba(184,151,58,0.3);}
        .cc-save-btn:disabled{opacity:.4;cursor:not-allowed;}
      `}</style>

      {/* Income input */}
      <div style={{marginBottom:14}}>
        <label style={{display:'block',fontSize:10,fontWeight:600,color:t.muted,letterSpacing:'0.08em',textTransform:'uppercase',marginBottom:5}}>
          Monthly Income ($)
        </label>
        <input
          className="cc-bc-input"
          type="number" placeholder="e.g. 2000"
          value={income} onChange={e=>setIncome(e.target.value)}
          style={{width:'100%',background:t.dark,border:`1px solid rgba(255,255,255,0.1)`,borderRadius:8,color:t.text,fontSize:13,height:36,padding:'0 12px',fontFamily:"'DM Sans',sans-serif",outline:'none',boxSizing:'border-box',transition:'border-color 0.15s'}}
        />
      </div>

      {incomeNum > 0 && (
        <>
          <div style={{display:'flex',flexDirection:'column',gap:10,marginBottom:14}}>
            {BUDGET_CATEGORIES.map(cat=>{
              const pct = parseFloat(allocations[cat.key])||0;
              const amt = (incomeNum*pct/100).toFixed(0);
              return (
                <div key={cat.key}>
                  <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:4}}>
                    <span style={{fontSize:11,color:t.muted}}>{cat.label}</span>
                    <div style={{display:'flex',alignItems:'center',gap:4}}>
                      <input
                        className="cc-bc-input"
                        type="number" min="0" max="100"
                        value={allocations[cat.key]}
                        onChange={e=>setAllocations({...allocations,[cat.key]:e.target.value})}
                        style={{width:46,height:26,background:t.dark,border:`1px solid rgba(255,255,255,0.1)`,borderRadius:6,color:t.text,fontSize:11,textAlign:'right',padding:'0 6px',fontFamily:"'DM Sans',sans-serif",outline:'none',transition:'border-color 0.15s'}}
                      />
                      <span style={{fontSize:11,color:t.dim}}>%</span>
                      <span style={{fontSize:11,fontWeight:600,color:t.text,width:44,textAlign:'right'}}>${amt}</span>
                    </div>
                  </div>
                  {/* Progress bar */}
                  <div style={{height:3,borderRadius:99,background:'rgba(255,255,255,0.06)',overflow:'hidden'}}>
                    <div style={{height:'100%',borderRadius:99,background:t.gold,width:`${Math.min(pct,100)}%`,transition:'width 0.3s'}} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Total */}
          <div style={{padding:'8px 12px',borderRadius:9,marginBottom:12,background:totalBg,border:`1px solid ${totalBorder}`,textAlign:'center',fontSize:12,fontWeight:600,color:totalColor}}>
            Total: {totalPct}%{' '}
            {totalPct===100 ? '— perfectly balanced' : totalPct>100 ? '— over budget!' : `— ${100-totalPct}% unallocated`}
          </div>

          <button
            className="cc-save-btn"
            onClick={handleSave}
            disabled={totalPct!==100}
            style={{width:'100%',padding:'9px',borderRadius:8,background:t.gold,color:'#0C0C0E',border:'none',cursor:'pointer',fontSize:12,fontWeight:700,letterSpacing:'0.06em',textTransform:'uppercase',display:'flex',alignItems:'center',justifyContent:'center',gap:6,transition:'background 0.15s',fontFamily:"'DM Sans',sans-serif"}}
          >
            <Save style={{width:13,height:13}}/> Save Budget Plan
          </button>
        </>
      )}
    </div>
  );
}