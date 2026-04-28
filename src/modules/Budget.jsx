// ZINKPOWER Manisa — modules/Budget.jsx V12 (vorher in modules_admin.jsx)
import { useState } from "react";
import {
  P, GR, LT, GN, YL, RD,
  Btn, Card, IForm, Fi, PH,
} from "../core.jsx";

export default function Budget({ data, save, user }) {
  const [bud,        setBud]        = useState(() => data.budget || { total:0, payments:[] });
  const [showForm,   setShowForm]   = useState(false);
  const [editTotal,  setEditTotal]  = useState(false);
  const [totalInput, setTotalInput] = useState('');
  const today = new Date().toISOString().split('T')[0];
  const ef = { date: today, recipient:'', desc:'', amount:'' };
  const [f, setF] = useState(ef);

  const canSee  = user.role === 'admin' || (user.permissions || []).includes('budget');
  const isAdmin = user.role === 'admin';

  if (!canSee) {
    return (
      <Card>
        <div style={{ color:RD, textAlign:'center', padding:24 }}>
          🔒 Budget – nur autorisierte Nutzer / Yalnızca yetkili kullanıcılar
        </div>
      </Card>
    );
  }

  const payments  = bud.payments || [];
  const totalPaid = payments.reduce((s, p) => s + Number(p.amount || 0), 0);
  const total     = bud.total || 0;
  const remaining = total - totalPaid;
  const pct       = total > 0 ? Math.min(100, totalPaid / total * 100) : 0;

  function saveTotal() {
    const u = { ...bud, total: Number(totalInput) };
    setBud(u); save('budget', u); setEditTotal(false);
  }
  function addPayment() {
    if (!f.recipient || !f.amount) return;
    const u = {
      ...bud,
      payments: [
        ...payments,
        { ...f, id: Date.now(), amount: Number(f.amount), by: user.name }
      ]
    };
    setBud(u); save('budget', u); setShowForm(false); setF(ef);
  }
  function delPayment(id) {
    const u = { ...bud, payments: payments.filter(p => p.id !== id) };
    setBud(u); save('budget', u);
  }

  return (
    <div>
      <PH title="💶 Budget">
        {isAdmin && <Btn onClick={() => setShowForm(s => !s)}>+ Zahlung eintragen</Btn>}
      </PH>

      <div style={{
        display:'grid', gridTemplateColumns:'repeat(3,1fr)',
        gap:12, marginBottom:14
      }}>
        {[
          { l:'Gesamtbudget', v: total,     c: P,  ed: true },
          { l:'Ausgezahlt',   v: totalPaid, c: RD },
          { l:'Verbleibend',  v: remaining, c: remaining >= 0 ? GN : RD },
        ].map(k => (
          <div key={k.l} style={{
            background:'#fff', borderRadius:10, padding:'14px 16px',
            boxShadow:'0 1px 8px rgba(40,56,152,0.07)',
            borderTop:`3px solid ${k.c}`
          }}>
            <div style={{ fontSize:11, color:GR, marginBottom:4 }}>{k.l}</div>
            <div style={{
              fontSize:22, fontWeight:'bold', color:k.c,
              marginBottom: k.ed ? 6 : 0
            }}>
              {(k.v || 0).toLocaleString()} €
            </div>
            {k.ed && isAdmin && (
              <Btn sm outline onClick={() => { setTotalInput(String(total)); setEditTotal(true); }}>
                ✏️ Ändern
              </Btn>
            )}
          </div>
        ))}
      </div>

      <Card>
        <div style={{
          fontSize:12, color:GR, marginBottom:8,
          display:'flex', justifyContent:'space-between'
        }}>
          <span>Budget-Auslastung</span>
          <span style={{
            fontWeight:'bold',
            color: pct > 90 ? RD : pct > 70 ? YL : GN
          }}>{pct.toFixed(1)}%</span>
        </div>
        <div style={{
          height:24, background:'#eef0f6',
          borderRadius:10, overflow:'hidden'
        }}>
          <div style={{
            height:'100%', width: pct + '%',
            background: pct > 90 ? RD : pct > 70 ? YL : GN,
            borderRadius:10, transition:'width 0.5s',
            display:'flex', alignItems:'center', justifyContent:'center',
            fontSize:11, fontWeight:'bold', color:'#fff'
          }}>
            {pct > 8 ? `${totalPaid.toLocaleString()} €` : ''}
          </div>
        </div>
      </Card>

      {editTotal && isAdmin && (
        <IForm title="Gesamtbudget festlegen" onClose={() => setEditTotal(false)}>
          <Fi
            label="Gesamtbudget (€)" value={totalInput}
            onChange={setTotalInput} type="number" ph="z.B. 5500000"
          />
          <div style={{ display:'flex', gap:8 }}>
            <Btn outline onClick={() => setEditTotal(false)}>Abbrechen</Btn>
            <Btn onClick={saveTotal}>Speichern</Btn>
          </div>
        </IForm>
      )}

      {showForm && isAdmin && (
        <IForm title="Zahlung eintragen" onClose={() => setShowForm(false)}>
          <Fi label="Datum"               value={f.date}      onChange={v => setF({ ...f, date:v })}      type="date"/>
          <Fi label="Zahlungsempfänger *" value={f.recipient} onChange={v => setF({ ...f, recipient:v })} ph="z.B. Sipil İnşaat Ltd."/>
          <Fi label="Beschreibung"        value={f.desc}      onChange={v => setF({ ...f, desc:v })}      ph="z.B. Abschlagsrechnung #2"/>
          <Fi label="Betrag (€) *"        value={f.amount}    onChange={v => setF({ ...f, amount:v })}    type="number"/>
          <div style={{ display:'flex', gap:8 }}>
            <Btn outline onClick={() => setShowForm(false)}>Abbrechen</Btn>
            <Btn disabled={!f.recipient || !f.amount} onClick={addPayment}>Speichern</Btn>
          </div>
        </IForm>
      )}

      <Card title={`Zahlungshistorie (${payments.length})`}>
        {payments.length === 0 ? (
          <div style={{ color:GR, textAlign:'center', padding:16 }}>
            Noch keine Zahlungen eingetragen
          </div>
        ) : (
          <div>
            {[...payments].reverse().map(p => (
              <div key={p.id} style={{
                display:'flex', alignItems:'center', gap:12,
                padding:'10px 0', borderBottom:'1px solid #f2f2f2'
              }}>
                <div style={{
                  width:36, height:36, borderRadius:8,
                  background: RD + '15',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  flexShrink:0
                }}>
                  <span style={{ fontSize:16 }}>💸</span>
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:'bold', color:'#333', fontSize:13 }}>{p.recipient}</div>
                  {p.desc && <div style={{ fontSize:12, color:GR }}>{p.desc}</div>}
                  <div style={{ fontSize:11, color:GR }}>📅 {p.date} · {p.by}</div>
                </div>
                <div style={{ textAlign:'right', flexShrink:0 }}>
                  <div style={{ fontSize:16, fontWeight:'bold', color:RD }}>
                    −{Number(p.amount).toLocaleString()} €
                  </div>
                </div>
                {isAdmin && <Btn sm danger onClick={() => delPayment(p.id)}>✕</Btn>}
              </div>
            ))}
            <div style={{
              display:'flex', justifyContent:'space-between',
              padding:'10px 0', marginTop:4,
              borderTop:`2px solid ${LT}`
            }}>
              <b>Gesamt ausgezahlt</b>
              <b style={{ color:RD, fontSize:15 }}>
                −{totalPaid.toLocaleString()} €
              </b>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
