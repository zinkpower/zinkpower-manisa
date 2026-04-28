// ZINKPOWER Manisa — modules/Suppliers.jsx V12
import { useState } from "react";
import {
  P, GR, LT, GN, YL, RD,
  SUP_CATS,
  Btn, Card, IForm, Fi, Ft, Fs, PH, Av,
} from "../core.jsx";

export default function Suppliers({ data, save, user, t }) {
  const [tab,        setTab]        = useState('profiles');
  const [profiles,   setProfiles]   = useState(() => data.supplierProfiles || []);
  const [deliveries, setDeliveries] = useState(() => data.suppliers || []);
  const [showForm,   setShowForm]   = useState(false);
  const [delId,      setDelId]      = useState(null);
  const [expanded,   setExpanded]   = useState(null);
  const isAdmin = user.role === 'admin';
  const today = new Date().toISOString().split('T')[0];

  const efP = {
    name:'', category:'Stahlbau', status:'active',
    address:'', phone:'', email:'', website:'', taxNo:'',
    cpName:'',  cpPosition:'',  cpPhone:'',  cpEmail:'',
    cp2Name:'', cp2Position:'', cp2Phone:'', cp2Email:'',
    notes:''
  };
  const [fp, setFp] = useState(efP);

  const efD = { material:'', supplier:'', quantity:'', unit:'', ordered:'', expected:'', notes:'' };
  const [fd, setFd] = useState(efD);

  function addProfile() {
    if (!fp.name.trim()) return;
    const u = [...profiles, { ...fp, id: Date.now(), by: user.name, addedDate: today }];
    setProfiles(u); save('supplierProfiles', u); setShowForm(false); setFp(efP);
  }
  function delProfile(id) {
    const u = profiles.filter(p => p.id !== id);
    setProfiles(u); save('supplierProfiles', u); setDelId(null);
  }
  function addDelivery() {
    const u = [...deliveries, { ...fd, id: Date.now(), status: 'ordered' }];
    setDeliveries(u); save('suppliers', u); setShowForm(false); setFd(efD);
  }
  function markDel(id) {
    const u = deliveries.map(i => i.id === id ? { ...i, status:'delivered', delivered: today } : i);
    setDeliveries(u); save('suppliers', u);
  }
  const dsc = { ordered: YL, delivered: GN, delayed: RD };

  const TabBtn = ({ id, label }) => (
    <button
      onClick={() => { setTab(id); setShowForm(false); }}
      style={{
        padding:'8px 20px',
        background: tab === id ? P : 'transparent',
        color: tab === id ? '#fff' : GR,
        border: `1px solid ${tab === id ? P : '#ddd'}`,
        borderRadius:8, fontSize:13, cursor:'pointer',
        fontFamily:'Arial', fontWeight: tab === id ? 'bold' : 'normal'
      }}
    >{label}</button>
  );

  return (
    <div>
      <PH title={t.suppliers}><Btn onClick={() => setShowForm(s => !s)}>+ {t.add}</Btn></PH>

      <div style={{ display:'flex', gap:8, marginBottom:16 }}>
        <TabBtn id="profiles"   label="🏢 Lieferanten-Archiv"/>
        <TabBtn id="deliveries" label="📦 Lieferungen"/>
      </div>

      {tab === 'profiles' && (
        <div>
          {showForm && (
            <IForm title="Neuer Lieferant / Yeni Tedarikçi" onClose={() => setShowForm(false)}>
              <div style={{ fontWeight:'bold', color:P, fontSize:13, marginBottom:8 }}>Firmendaten</div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                <Fi label="Firmenname *" value={fp.name}     onChange={v => setFp({ ...fp, name:v })}/>
                <Fs label="Kategorie"    value={fp.category} onChange={v => setFp({ ...fp, category:v })}
                    opts={SUP_CATS.map(c => ({ v:c, l:c }))}/>
              </div>
              <Fi label="Adresse / Adres" value={fp.address} onChange={v => setFp({ ...fp, address:v })}/>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                <Fi label="Telefon" value={fp.phone} onChange={v => setFp({ ...fp, phone:v })} type="tel"/>
                <Fi label="E-Mail"  value={fp.email} onChange={v => setFp({ ...fp, email:v })} type="email"/>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                <Fi label="Website"             value={fp.website} onChange={v => setFp({ ...fp, website:v })}/>
                <Fi label="Steuernr. / Vergi No" value={fp.taxNo}   onChange={v => setFp({ ...fp, taxNo:v })}/>
              </div>

              <div style={{ fontWeight:'bold', color:P, fontSize:13, margin:'12px 0 8px' }}>
                Ansprechpartner 1
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                <Fi label="Name"     value={fp.cpName}     onChange={v => setFp({ ...fp, cpName:v })}/>
                <Fi label="Position" value={fp.cpPosition} onChange={v => setFp({ ...fp, cpPosition:v })}/>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                <Fi label="Telefon" value={fp.cpPhone} onChange={v => setFp({ ...fp, cpPhone:v })} type="tel"/>
                <Fi label="E-Mail"  value={fp.cpEmail} onChange={v => setFp({ ...fp, cpEmail:v })} type="email"/>
              </div>

              <div style={{ fontWeight:'bold', color:P, fontSize:13, margin:'12px 0 8px' }}>
                Ansprechpartner 2 (optional)
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                <Fi label="Name"     value={fp.cp2Name}     onChange={v => setFp({ ...fp, cp2Name:v })}/>
                <Fi label="Position" value={fp.cp2Position} onChange={v => setFp({ ...fp, cp2Position:v })}/>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                <Fi label="Telefon" value={fp.cp2Phone} onChange={v => setFp({ ...fp, cp2Phone:v })} type="tel"/>
                <Fi label="E-Mail"  value={fp.cp2Email} onChange={v => setFp({ ...fp, cp2Email:v })} type="email"/>
              </div>

              <Ft label={t.notes} value={fp.notes} onChange={v => setFp({ ...fp, notes:v })} rows={2}/>
              <div style={{ display:'flex', gap:8 }}>
                <Btn outline onClick={() => setShowForm(false)}>{t.cancel}</Btn>
                <Btn disabled={!fp.name.trim()} onClick={addProfile}>{t.save}</Btn>
              </div>
            </IForm>
          )}

          {delId && isAdmin && (
            <IForm title="Lieferant löschen?" onClose={() => setDelId(null)}>
              <div style={{ fontSize:13, marginBottom:14 }}>
                <b style={{ color:RD }}>{profiles.find(p => p.id === delId)?.name}</b> {t.really_delete}
              </div>
              <div style={{ display:'flex', gap:8 }}>
                <Btn outline onClick={() => setDelId(null)}>{t.cancel}</Btn>
                <Btn danger onClick={() => delProfile(delId)}>{t.delete}</Btn>
              </div>
            </IForm>
          )}

          {profiles.length === 0 ? (
            <Card><div style={{ color:GR, textAlign:'center', padding:20 }}>{t.no_data}</div></Card>
          ) : (
            profiles.map(p => {
              const isExp = expanded === p.id;
              return (
                <div key={p.id} style={{
                  background:'#fff', borderRadius:12, marginBottom:12,
                  boxShadow:'0 1px 8px rgba(40,56,152,0.07)', overflow:'hidden'
                }}>
                  <div
                    style={{
                      display:'flex', alignItems:'center', gap:12,
                      padding:'14px 18px', cursor:'pointer'
                    }}
                    onClick={() => setExpanded(isExp ? null : p.id)}
                  >
                    <div style={{
                      width:44, height:44, borderRadius:10, background:P,
                      color:'#fff', display:'flex', alignItems:'center',
                      justifyContent:'center', fontWeight:'bold', fontSize:14, flexShrink:0
                    }}>
                      {p.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontWeight:'bold', color:P, fontSize:14 }}>{p.name}</div>
                      <div style={{ fontSize:12, color:GR }}>
                        {p.category} · von {p.by} am {p.addedDate}
                      </div>
                    </div>
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <span style={{
                        padding:'2px 8px', background: GN + '20', color:GN,
                        borderRadius:8, fontSize:11, fontWeight:'bold'
                      }}>Aktiv</span>
                      <span style={{ color:GR, fontSize:18 }}>{isExp ? '▲' : '▼'}</span>
                    </div>
                  </div>

                  {isExp && (
                    <div style={{ borderTop:`1px solid ${LT}`, padding:'14px 18px' }}>
                      <div style={{ display:'flex', flexDirection:'column', gap:6, marginBottom:12 }}>
                        {p.phone && (
                          <a href={`tel:${p.phone}`} style={{ textDecoration:'none' }}>
                            <div style={{
                              display:'flex', alignItems:'center', gap:10, padding:'8px 12px',
                              background:'#f0f8f0', borderRadius:8, border:'1px solid #cce5cc'
                            }}>
                              <span style={{ fontSize:16 }}>📞</span>
                              <div>
                                <div style={{ fontSize:10, color:GR }}>Firmatelefon</div>
                                <div style={{ fontSize:13, fontWeight:'bold', color:'#2d7a2d' }}>{p.phone}</div>
                              </div>
                              <span style={{ marginLeft:'auto', fontSize:11, color:'#2d7a2d', fontWeight:'bold' }}>
                                Anrufen →
                              </span>
                            </div>
                          </a>
                        )}
                        {p.email && (
                          <a href={`mailto:${p.email}`} style={{ textDecoration:'none' }}>
                            <div style={{
                              display:'flex', alignItems:'center', gap:10, padding:'8px 12px',
                              background: P + '10', borderRadius:8, border: `1px solid ${P}25`
                            }}>
                              <span style={{ fontSize:16 }}>✉️</span>
                              <div style={{ flex:1, overflow:'hidden' }}>
                                <div style={{ fontSize:10, color:GR }}>E-Mail</div>
                                <div style={{
                                  fontSize:12, fontWeight:'bold', color:P,
                                  overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'
                                }}>{p.email}</div>
                              </div>
                              <span style={{ marginLeft:'auto', fontSize:11, color:P, fontWeight:'bold', flexShrink:0 }}>
                                Senden →
                              </span>
                            </div>
                          </a>
                        )}
                        {p.website && (
                          <a
                            href={p.website.startsWith('http') ? p.website : `https://${p.website}`}
                            target="_blank" rel="noreferrer"
                            style={{ textDecoration:'none' }}
                          >
                            <div style={{
                              display:'flex', alignItems:'center', gap:10, padding:'8px 12px',
                              background:'#f5f0ff', borderRadius:8, border:'1px solid #d0b8ff'
                            }}>
                              <span style={{ fontSize:16 }}>🌐</span>
                              <div>
                                <div style={{ fontSize:10, color:GR }}>Website</div>
                                <div style={{ fontSize:12, fontWeight:'bold', color:'#6b3fa0' }}>{p.website}</div>
                              </div>
                              <span style={{ marginLeft:'auto', fontSize:11, color:'#6b3fa0', fontWeight:'bold' }}>
                                Öffnen →
                              </span>
                            </div>
                          </a>
                        )}
                      </div>

                      {[
                        { n:p.cpName,  pos:p.cpPosition,  ph:p.cpPhone,  em:p.cpEmail,  label:'Ansprechpartner 1' },
                        { n:p.cp2Name, pos:p.cp2Position, ph:p.cp2Phone, em:p.cp2Email, label:'Ansprechpartner 2' },
                      ].map((cp, idx) => cp.n ? (
                        <div key={idx} style={{
                          marginBottom:10, padding:'12px',
                          background:'#f8f9fc', borderRadius:8
                        }}>
                          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8 }}>
                            <Av name={cp.n} size={32}/>
                            <div>
                              <div style={{ fontWeight:'bold', color:P, fontSize:13 }}>{cp.n}</div>
                              {cp.pos && <div style={{ fontSize:11, color:GR }}>{cp.pos} · {cp.label}</div>}
                            </div>
                          </div>
                          <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                            {cp.ph && (
                              <a href={`tel:${cp.ph}`} style={{ textDecoration:'none' }}>
                                <div style={{
                                  display:'flex', alignItems:'center', gap:6, padding:'5px 10px',
                                  background: GN + '15', borderRadius:6, border: `1px solid ${GN}30`
                                }}>
                                  <span style={{ fontSize:14 }}>📱</span>
                                  <span style={{ fontSize:12, fontWeight:'bold', color:GN }}>{cp.ph}</span>
                                </div>
                              </a>
                            )}
                            {cp.em && (
                              <a href={`mailto:${cp.em}`} style={{ textDecoration:'none' }}>
                                <div style={{
                                  display:'flex', alignItems:'center', gap:6, padding:'5px 10px',
                                  background: P + '10', borderRadius:6, border: `1px solid ${P}25`
                                }}>
                                  <span style={{ fontSize:14 }}>✉️</span>
                                  <span style={{ fontSize:12, fontWeight:'bold', color:P }}>{cp.em}</span>
                                </div>
                              </a>
                            )}
                          </div>
                        </div>
                      ) : null)}

                      {p.taxNo && (
                        <div style={{ fontSize:12, color:GR, marginBottom:6 }}>
                          🧾 Vergi No: <b>{p.taxNo}</b>
                        </div>
                      )}
                      {p.notes && (
                        <div style={{
                          fontSize:12, color:GR, padding:'8px 10px',
                          background:'#f8f9fc', borderRadius:6
                        }}>💬 {p.notes}</div>
                      )}
                      {isAdmin && (
                        <div style={{ marginTop:12, display:'flex', justifyContent:'flex-end' }}>
                          <Btn sm danger onClick={() => setDelId(p.id)}>✕ {t.delete}</Btn>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {tab === 'deliveries' && (
        <div>
          {showForm && (
            <IForm title="Neue Lieferung" onClose={() => setShowForm(false)}>
              <Fi label={t.material} value={fd.material} onChange={v => setFd({ ...fd, material:v })}/>
              <Fi label={t.supplier} value={fd.supplier} onChange={v => setFd({ ...fd, supplier:v })}/>
              <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr', gap:8 }}>
                <Fi label={t.quantity} value={fd.quantity} onChange={v => setFd({ ...fd, quantity:v })} type="number"/>
                <Fi label={t.unit}     value={fd.unit}     onChange={v => setFd({ ...fd, unit:v })}/>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                <Fi label={t.ordered}  value={fd.ordered}  onChange={v => setFd({ ...fd, ordered:v })}  type="date"/>
                <Fi label={t.expected} value={fd.expected} onChange={v => setFd({ ...fd, expected:v })} type="date"/>
              </div>
              <Ft label={t.notes} value={fd.notes} onChange={v => setFd({ ...fd, notes:v })}/>
              <div style={{ display:'flex', gap:8 }}>
                <Btn outline onClick={() => setShowForm(false)}>{t.cancel}</Btn>
                <Btn onClick={addDelivery}>{t.save}</Btn>
              </div>
            </IForm>
          )}

          {deliveries.length === 0 ? (
            <Card><div style={{ color:GR, textAlign:'center', padding:20 }}>{t.no_data}</div></Card>
          ) : (
            <Card>
              <div style={{ overflowX:'auto' }}>
                <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
                  <thead>
                    <tr style={{ background:LT }}>
                      {[t.material, t.supplier, `${t.quantity}/${t.unit}`,
                        t.ordered, t.expected, t.delivered, t.status, ''].map(h => (
                        <th key={h} style={{
                          padding:'7px 10px', textAlign:'left',
                          color:GR, fontSize:11
                        }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {deliveries.map(item => (
                      <tr key={item.id} style={{ borderBottom:'1px solid #f2f2f2' }}>
                        <td style={{ padding:'7px 10px', fontWeight:'bold' }}>{item.material}</td>
                        <td style={{ padding:'7px 10px', color:GR }}>{item.supplier}</td>
                        <td style={{ padding:'7px 10px', color:GR }}>{item.quantity} {item.unit}</td>
                        <td style={{ padding:'7px 10px', color:GR }}>{item.ordered  || '–'}</td>
                        <td style={{ padding:'7px 10px', color:GR }}>{item.expected || '–'}</td>
                        <td style={{ padding:'7px 10px', color:GR }}>{item.delivered|| '–'}</td>
                        <td style={{ padding:'7px 10px' }}>
                          <span style={{
                            padding:'2px 8px',
                            background: (dsc[item.status] || GR) + '25',
                            color: dsc[item.status] || GR,
                            borderRadius:10, fontSize:11, fontWeight:'bold'
                          }}>{item.status}</span>
                        </td>
                        <td style={{ padding:'7px 10px' }}>
                          {!item.delivered && <Btn sm outline onClick={() => markDel(item.id)}>✓</Btn>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
