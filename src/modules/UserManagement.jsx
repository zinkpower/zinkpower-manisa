// ZINKPOWER Manisa — modules/UserManagement.jsx V12 (vorher in modules_admin.jsx)
import { useState } from "react";
import {
  P, GR, LT, YL, RD,
  CORE, DEF, PERM_LIST,
  getInit,
  Btn, Card, IForm, Fi, PH, Av,
} from "../core.jsx";

export default function UserManagement({ data, save, t }) {
  const [pins,        setPins]        = useState(() => data.pins       || DEF.pins);
  const [extras,      setExtras]      = useState(() => data.extraUsers || []);
  const [pinEditId,   setPinEditId]   = useState(null);
  const [newPin,      setNewPin]      = useState('');
  const [confirmPin,  setConfirmPin]  = useState('');
  const [pinErr,      setPinErr]      = useState('');
  const [showAdd,     setShowAdd]     = useState(false);
  const [nf,          setNf]          = useState({ firstName:'', lastName:'' });
  const [addErr,      setAddErr]      = useState('');
  const [permEditId,  setPermEditId]  = useState(null);

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
    const id   = 'u_' + Date.now();
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
      const next  = perms.includes(permId)
        ? perms.filter(p => p !== permId)
        : [...perms, permId];
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

      {pinEditId && (
        <IForm
          title={`PIN für ${allUsers.find(u => u.id === pinEditId)?.name || ''}`}
          onClose={() => setPinEditId(null)}
        >
          <Fi
            label="Neue PIN (4 Ziffern)" value={newPin}
            onChange={v => setNewPin(v.replace(/\D/g,'').slice(0,4))}
            type="password" ph="0000"
          />
          <Fi
            label="PIN wiederholen" value={confirmPin}
            onChange={v => setConfirmPin(v.replace(/\D/g,'').slice(0,4))}
            type="password"
          />
          {pinErr && <div style={{ color:RD, fontSize:12, marginBottom:8 }}>❌ {pinErr}</div>}
          <div style={{ display:'flex', gap:8 }}>
            <Btn outline onClick={() => setPinEditId(null)}>{t.cancel}</Btn>
            <Btn onClick={() => savePin(pinEditId)}>{t.save}</Btn>
          </div>
        </IForm>
      )}

      {permEditId && permUser && (
        <IForm
          title={`🔑 Berechtigungen: ${permUser.name}`}
          onClose={() => setPermEditId(null)}
        >
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
                  display:'flex', alignItems:'center', justifyContent:'center',
                  flexShrink:0
                }}>
                  {active && <span style={{ color:'#fff', fontSize:13, lineHeight:1 }}>✓</span>}
                </div>
                <div>
                  <div style={{
                    fontSize:13,
                    fontWeight: active ? 'bold' : 'normal',
                    color: active ? P : '#333'
                  }}>{perm.label}</div>
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
                <div style={{ fontSize:11, color:GR }}>
                  {u.role} · {getInit(u.name)} · Vollzugriff
                </div>
              </div>
            </div>
            <Btn sm outline onClick={() => {
              setPinEditId(u.id); setNewPin(''); setConfirmPin(''); setPinErr('');
            }}>PIN ändern</Btn>
          </div>
        ))}
      </Card>

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
                    <Btn sm outline onClick={() => {
                      setPinEditId(u.id); setNewPin(''); setConfirmPin(''); setPinErr('');
                    }}>PIN</Btn>
                    <Btn sm danger onClick={() => removeUser(u.id)}>✕</Btn>
                  </div>
                </div>
                {perms.length > 0 && (
                  <div style={{
                    marginTop:6, marginLeft:48,
                    display:'flex', gap:6, flexWrap:'wrap'
                  }}>
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
