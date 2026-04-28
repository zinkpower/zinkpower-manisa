// ZINKPOWER Manisa — modules/Contacts.jsx V12
import { useState } from "react";
import {
  P, GR, GN, YL, RD,
  Btn, Card, IForm, Fi, Ft, PH, Av, CopyBtn,
} from "../core.jsx";

export default function Contacts({ data, save, user, t }) {
  const [items, setItems] = useState(() => data.contacts || []);
  const [show,  setShow]  = useState(false);
  const [delId, setDelId] = useState(null);
  const isAdmin = user.role === 'admin';

  const ef = {
    name:'', position:'', company:'', phone:'', mobile:'',
    email:'', address:'', notes:''
  };
  const [f, setF] = useState(ef);

  function add() {
    if (!f.name.trim()) return;
    const u = [...items, { ...f, id: Date.now(), by: user.name }];
    setItems(u); save('contacts', u); setShow(false); setF(ef);
  }
  function del(id) {
    const u = items.filter(i => i.id !== id);
    save('contacts', u); setItems(u); setDelId(null);
  }

  return (
    <div>
      <PH title={t.contacts}><Btn onClick={() => setShow(s => !s)}>+ {t.add}</Btn></PH>

      {show && (
        <IForm title={`${t.add} ${t.contacts}`} onClose={() => setShow(false)}>
          <Fi label={`${t.name} *`} value={f.name} onChange={v => setF({ ...f, name:v })} ph="Vor- und Nachname"/>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
            <Fi label="Position / Görev" value={f.position} onChange={v => setF({ ...f, position:v })}/>
            <Fi label={t.company}        value={f.company}  onChange={v => setF({ ...f, company:v })}/>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
            <Fi label="Telefon (Festnetz)" value={f.phone}  onChange={v => setF({ ...f, phone:v })}  type="tel"/>
            <Fi label="Mobil / Cep"        value={f.mobile} onChange={v => setF({ ...f, mobile:v })} type="tel"/>
          </div>
          <Fi label={t.email}        value={f.email}   onChange={v => setF({ ...f, email:v })}   type="email"/>
          <Fi label="Adresse / Adres" value={f.address} onChange={v => setF({ ...f, address:v })}/>
          <Ft label={t.notes}         value={f.notes}   onChange={v => setF({ ...f, notes:v })} rows={2}/>
          <div style={{ display:'flex', gap:8 }}>
            <Btn outline onClick={() => setShow(false)}>{t.cancel}</Btn>
            <Btn disabled={!f.name.trim()} onClick={add}>{t.save}</Btn>
          </div>
        </IForm>
      )}

      {delId && isAdmin && (
        <IForm title="Kontakt löschen?" onClose={() => setDelId(null)}>
          <div style={{ fontSize:13, marginBottom:14 }}>
            <b style={{ color:RD }}>{items.find(i => i.id === delId)?.name}</b> {t.really_delete}
          </div>
          <div style={{ display:'flex', gap:8 }}>
            <Btn outline onClick={() => setDelId(null)}>{t.cancel}</Btn>
            <Btn danger onClick={() => del(delId)}>{t.delete}</Btn>
          </div>
        </IForm>
      )}

      {items.length === 0 && (
        <Card><div style={{ color:GR, textAlign:'center', padding:20 }}>{t.no_data}</div></Card>
      )}

      <div style={{
        display:'grid',
        gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))',
        gap:12
      }}>
        {items.map(item => (
          <div key={item.id} style={{
            background:'#fff', borderRadius:12, padding:18,
            boxShadow:'0 1px 8px rgba(40,56,152,0.07)'
          }}>
            <div style={{ display:'flex', alignItems:'flex-start', gap:12, marginBottom:12 }}>
              <Av name={item.name || '?'} size={44}/>
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:'bold', color:P, fontSize:14, lineHeight:1.3 }}>{item.name}</div>
                {item.position && <div style={{ fontSize:12, color:GR, marginTop:2 }}>{item.position}</div>}
                {item.company  && <div style={{ fontSize:12, color:GR }}>🏢 {item.company}</div>}
              </div>
              {isAdmin && (
                <button
                  onClick={() => setDelId(item.id)}
                  style={{
                    background:'none', border:'none', color:'#ccc',
                    cursor:'pointer', fontSize:16, padding:0
                  }}
                >✕</button>
              )}
            </div>

            <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
              {item.mobile && (
                <a href={`tel:${item.mobile}`} style={{ textDecoration:'none' }}>
                  <div style={{
                    display:'flex', alignItems:'center', gap:10, padding:'8px 12px',
                    background: GN + '15', borderRadius:8, border: `1px solid ${GN}30`
                  }}>
                    <span style={{ fontSize:18 }}>📱</span>
                    <div>
                      <div style={{ fontSize:10, color:GR }}>Mobil</div>
                      <div style={{ fontSize:13, fontWeight:'bold', color:GN }}>{item.mobile}</div>
                    </div>
                    <span style={{ marginLeft:'auto', fontSize:12, color:GN, fontWeight:'bold' }}>
                      Anrufen →
                    </span>
                  </div>
                </a>
              )}
              {item.phone && (
                <a href={`tel:${item.phone}`} style={{ textDecoration:'none' }}>
                  <div style={{
                    display:'flex', alignItems:'center', gap:10, padding:'8px 12px',
                    background:'#f0f8f0', borderRadius:8, border:'1px solid #cce5cc'
                  }}>
                    <span style={{ fontSize:18 }}>📞</span>
                    <div>
                      <div style={{ fontSize:10, color:GR }}>Festnetz</div>
                      <div style={{ fontSize:13, fontWeight:'bold', color:'#2d7a2d' }}>{item.phone}</div>
                    </div>
                    <span style={{ marginLeft:'auto', fontSize:12, color:'#2d7a2d', fontWeight:'bold' }}>
                      Anrufen →
                    </span>
                  </div>
                </a>
              )}
              {item.email && (
                <a href={`mailto:${item.email}`} style={{ textDecoration:'none' }}>
                  <div style={{
                    display:'flex', alignItems:'center', gap:10, padding:'8px 12px',
                    background: P + '10', borderRadius:8, border: `1px solid ${P}25`
                  }}>
                    <span style={{ fontSize:18 }}>✉️</span>
                    <div style={{ flex:1, overflow:'hidden' }}>
                      <div style={{ fontSize:10, color:GR }}>E-Mail</div>
                      <div style={{
                        fontSize:12, fontWeight:'bold', color:P,
                        overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'
                      }}>{item.email}</div>
                    </div>
                    <span style={{ marginLeft:'auto', fontSize:12, color:P, fontWeight:'bold', flexShrink:0 }}>
                      Senden →
                    </span>
                  </div>
                </a>
              )}
              {item.address && (
                <a
                  href={`https://maps.google.com/?q=${encodeURIComponent(item.address)}`}
                  target="_blank" rel="noreferrer"
                  style={{ textDecoration:'none' }}
                >
                  <div style={{
                    display:'flex', alignItems:'center', gap:10, padding:'8px 12px',
                    background:'#fff8f0', borderRadius:8, border: `1px solid ${YL}40`
                  }}>
                    <span style={{ fontSize:18 }}>📍</span>
                    <div>
                      <div style={{ fontSize:10, color:GR }}>Adresse</div>
                      <div style={{ fontSize:12, fontWeight:'bold', color:YL }}>{item.address}</div>
                    </div>
                    <span style={{ marginLeft:'auto', fontSize:12, color:YL, fontWeight:'bold' }}>
                      Maps →
                    </span>
                  </div>
                </a>
              )}
            </div>

            {item.notes && (
              <div style={{
                marginTop:10, padding:'6px 10px', background:'#f8f9fc',
                borderRadius:6, fontSize:12, color:GR,
                display:'flex', alignItems:'flex-start', gap:4
              }}>
                <span style={{ flex:1 }}>💬 {item.notes}</span>
                <CopyBtn text={item.notes} t={t} sm/>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
