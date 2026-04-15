import { useState } from "react";

import {
  P, GR, LT, GN, YL, RD,
  CORE, DEF, PERM_LIST,
  getInit,
  Btn, Card, IForm, Fi, PH, Av,
} from "./core.jsx";

// ════════════════════════════════════════════════════════════════
// BUDGET
// ════════════════════════════════════════════════════════════════
export function Budget({ data, save, user }) {
  const [bud, setBud]             = useState(() => data.budget || { total:0, payments:[] });
  const [showForm, setShowForm]   = useState(false);
  const [editTotal, setEditTotal] = useState(false);
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
      payments: [...payments, { ...f, id: Date.now(), amount: Number(f.amount), by: user.name }]
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

      {/* KPI-Kacheln */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12, marginBottom:14 }}>
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
            <div style={{ fontSize:22, fontWeight:'bold', color:k.c, marginBottom: k.ed ? 6 : 0 }}>
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

      {/* Auslastungs-Balken */}
      <Card>
        <div style={{ fontSize:12, color:GR, marginBottom:8, display:'flex', justifyContent:'space-between' }}>
          <span>Budget-Auslastung</span>
          <span style={{ fontWeight:'bold', color: pct > 90 ? RD : pct > 70 ? YL : GN }}>
            {pct.toFixed(1)}%
          </span>
        </div>
        <div style={{ height:24, background:'#eef0f6', borderRadius:10, overflow:'hidden' }}>
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

      {/* Gesamtbudget bearbeiten */}
      {editTotal && isAdmin && (
        <IForm title="Gesamtbudget festlegen" onClose={() => setEditTotal(false)}>
          <Fi label="Gesamtbudget (€)" value={totalInput} onChange={setTotalInput} type="number" ph="z.B. 5500000"/>
          <div style={{ display:'flex', gap:8 }}>
            <Btn outline onClick={() => setEditTotal(false)}>Abbrechen</Btn>
            <Btn onClick={saveTotal}>Speichern</Btn>
          </div>
        </IForm>
      )}

      {/* Neue Zahlung */}
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

      {/* Zahlungshistorie */}
      <Card title={`Zahlungshistorie (${payments.length})`}>
        {payments.length === 0 ? (
          <div style={{ color:GR, textAlign:'center', padding:16 }}>Noch keine Zahlungen eingetragen</div>
        ) : (
          <div>
            {[...payments].reverse().map(p => (
              <div key={p.id} style={{
                display:'flex', alignItems:'center', gap:12,
                padding:'10px 0', borderBottom:'1px solid #f2f2f2'
              }}>
                <div style={{
                  width:36, height:36, borderRadius:8, background:RD+'15',
                  display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0
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
              padding:'10px 0', marginTop:4, borderTop:`2px solid ${LT}`
            }}>
              <b>Gesamt ausgezahlt</b>
              <b style={{ color:RD, fontSize:15 }}>−{totalPaid.toLocaleString()} €</b>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// USER-MANAGEMENT
// ════════════════════════════════════════════════════════════════
export function UserManagement({ data, save, t }) {
  const [pins, setPins]         = useState(() => data.pins || DEF.pins);
  const [extras, setExtras]     = useState(() => data.extraUsers || []);
  const [pinEditId, setPinEditId] = useState(null);
  const [newPin, setNewPin]     = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinErr, setPinErr]     = useState('');
  const [showAdd, setShowAdd]   = useState(false);
  const [nf, setNf]             = useState({ firstName:'', lastName:'' });
  const [addErr, setAddErr]     = useState('');
  const [permEditId, setPermEditId] = useState(null);

  const allUsers = [...CORE, ...extras];

  function savePin(uid) {
    if (newPin.length !== 4 || !/^\d{4}$/.test(newPin)) {
      setPinErr('PIN muss genau 4 Ziffern sein'); return;
    }
    if (newPin !== confirmPin) {
      setPinErr('PINs stimmen nicht überein'); return;
    }
    const u = { ...pins, [uid]: newPin };
    setPins(u); save('pins', u);
    setPinEditId(null); setNewPin(''); setConfirmPin(''); setPinErr('');
  }

  function addUser() {
    if (!nf.firstName.trim() || !nf.lastName.trim()) {
      setAddErr('Vor- und Nachname erforderlich'); return;
    }
    const id = 'u_' + Date.now();
    const name = nf.firstName.trim() + ' ' + nf.lastName.trim();
    const newUser = { id, name, role:'participant', permissions:[] };
    const newExtras = [...extras, newUser];
    const newPins   = { ...pins, [id]: '0000' };
    setExtras(newExtras); setPins(newPins);
    save('extraUsers', newExtras); save('pins', newPins);
    setShowAdd(false); setNf({ firstName:'', lastName:'' }); setAddErr('');
  }

  function removeUser(id) {
    const ne = extras.filter(u => u.id !== id);
    setExtras(ne); save('extraUsers', ne);
  }

  function togglePerm(uid, permId) {
    const ne = extras.map(u => {
      if (u.id !== uid) return u;
      const perms = u.permissions || [];
      const next = perms.includes(permId) ? perms.filter(p => p !== permId) : [...perms, permId];
      return { ...u, permissions: next };
    });
    setExtras(ne); save('extraUsers', ne);
  }

  const permUser = extras.find(u => u.id === permEditId);

  return (
    <div>
      <PH title="🔐 Nutzerverwaltung">
        <Btn onClick={() => setShowAdd(s => !s)}>+ Teilnehmer hinzufügen</Btn>
      </PH>

      <div style={{
        background:'#fff9e6', border:`1px solid ${YL}`,
        borderRadius:8, padding:'10px 14px', marginBottom:14,
        fontSize:12, color:'#7a5500'
      }}>
        ⚠️ Standard-PIN für alle: <b>0000</b> · Bitte vor erstem Einsatz ändern.
      </div>

      {/* Neuen Teilnehmer hinzufügen */}
      {showAdd && (
        <IForm title="Neuer Teilnehmer" onClose={() => setShowAdd(false)}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
            <Fi label="Vorname"  value={nf.firstName} onChange={v => setNf({ ...nf, firstName:v })} ph="z.B. Ali"/>
            <Fi label="Nachname" value={nf.lastName}  onChange={v => setNf({ ...nf, lastName:v })}  ph="z.B. Yılmaz"/>
          </div>
          {addErr && <div style={{ color:RD, fontSize:12, marginBottom:8 }}>❌ {addErr}</div>}
          <div style={{ display:'flex', gap:8 }}>
            <Btn outline onClick={() => setShowAdd(false)}>{t.cancel}</Btn>
            <Btn onClick={addUser}>Hinzufügen</Btn>
          </div>
        </IForm>
      )}

      {/* PIN-Editor */}
      {pinEditId && (
        <IForm
          title={`PIN für ${allUsers.find(u => u.id === pinEditId)?.name || ''}`}
          onClose={() => setPinEditId(null)}
        >
          <Fi label="Neue PIN (4 Ziffern)" value={newPin}     onChange={v => setNewPin(v.replace(/\D/g,'').slice(0,4))}     type="password" ph="0000"/>
          <Fi label="PIN wiederholen"      value={confirmPin} onChange={v => setConfirmPin(v.replace(/\D/g,'').slice(0,4))} type="password"/>
          {pinErr && <div style={{ color:RD, fontSize:12, marginBottom:8 }}>❌ {pinErr}</div>}
          <div style={{ display:'flex', gap:8 }}>
            <Btn outline onClick={() => setPinEditId(null)}>{t.cancel}</Btn>
            <Btn onClick={() => savePin(pinEditId)}>{t.save}</Btn>
          </div>
        </IForm>
      )}

      {/* Berechtigungs-Editor */}
      {permEditId && permUser && (
        <IForm title={`🔑 Berechtigungen: ${permUser.name}`} onClose={() => setPermEditId(null)}>
          <div style={{ fontSize:12, color:GR, marginBottom:12 }}>
            Welche Module darf <b>{permUser.name}</b> bearbeiten?
          </div>
          {PERM_LIST.map(perm => {
            const active = (permUser.permissions || []).includes(perm.id);
            return (
              <div
                key={perm.id}
                onClick={() => togglePerm(permUser.id, perm.id)}
                style={{
                  display:'flex', alignItems:'center', gap:12,
                  padding:'10px 12px', borderRadius:8, marginBottom:6,
                  background: active ? LT : '#f8f9fc',
                  border: `1px solid ${active ? P : '#e0e0e0'}`,
                  cursor:'pointer'
                }}
              >
                <div style={{
                  width:20, height:20, borderRadius:4,
                  background: active ? P : '#fff',
                  border: `2px solid ${active ? P : '#ccc'}`,
                  display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0
                }}>
                  {active && <span style={{ color:'#fff', fontSize:13, lineHeight:1 }}>✓</span>}
                </div>
                <div>
                  <div style={{ fontSize:13, fontWeight: active ? 'bold' : 'normal', color: active ? P : '#333' }}>
                    {perm.label}
                  </div>
                  <div style={{ fontSize:11, color:GR }}>{perm.labelTr}</div>
                </div>
              </div>
            );
          })}
          <div style={{ marginTop:8 }}>
            <Btn onClick={() => setPermEditId(null)}>{t.save}</Btn>
          </div>
        </IForm>
      )}

      {/* Core-Team */}
      <Card title="Core Team">
        {CORE.map(u => (
          <div key={u.id} style={{
            display:'flex', alignItems:'center', justifyContent:'space-between',
            padding:'10px 0', borderBottom:'1px solid #f2f2f2'
          }}>
            <div style={{ display:'flex', alignItems:'center', gap:12 }}>
              <Av name={u.name}/>
              <div>
                <div style={{ fontWeight:'bold', color:P, fontSize:13 }}>{u.name}</div>
                <div style={{ fontSize:11, color:GR }}>{u.role} · {getInit(u.name)} · Vollzugriff</div>
              </div>
            </div>
            <Btn sm outline onClick={() => { setPinEditId(u.id); setNewPin(''); setConfirmPin(''); setPinErr(''); }}>
              PIN ändern
            </Btn>
          </div>
        ))}
      </Card>

      {/* Extra Teilnehmer */}
      {extras.length > 0 && (
        <Card title="Teilnehmer">
          {extras.map(u => {
            const perms = u.permissions || [];
            return (
              <div key={u.id} style={{ padding:'10px 0', borderBottom:'1px solid #f2f2f2' }}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                    <Av name={u.name}/>
                    <div>
                      <div style={{ fontWeight:'bold', color:P, fontSize:13 }}>{u.name}</div>
                      <div style={{ fontSize:11, color:GR }}>{getInit(u.name)} · PIN: ●●●●</div>
                    </div>
                  </div>
                  <div style={{ display:'flex', gap:6 }}>
                    <Btn sm outline onClick={() => setPermEditId(u.id)}>🔑 Rechte</Btn>
                    <Btn sm outline onClick={() => { setPinEditId(u.id); setNewPin(''); setConfirmPin(''); setPinErr(''); }}>PIN</Btn>
                    <Btn sm danger onClick={() => removeUser(u.id)}>✕</Btn>
                  </div>
                </div>
                {perms.length > 0 && (
                  <div style={{ marginTop:6, marginLeft:48, display:'flex', gap:6, flexWrap:'wrap' }}>
                    {perms.map(pid => {
                      const pl = PERM_LIST.find(p => p.id === pid);
                      return pl ? (
                        <span key={pid} style={{
                          fontSize:10, padding:'2px 7px',
                          background:LT, color:P, borderRadius:10,
                          border:`1px solid ${P}40`
                        }}>
                          ✓ {pl.label}
                        </span>
                      ) : null;
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </Card>
      )}
    </div>
  );
}
