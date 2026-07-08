// ZINKPOWER Manisa — modules/Issues.jsx V19
// V19: Vier-Augen-Prinzip beim Mangel-Abschluss
//      - Neuer Zwischenstatus 'review' (Zur Prüfung gemeldet / Kontrole hazır)
//      - Nicht-Admins können nur open → review melden ("Fertig gemeldet")
//      - NUR Admin kann review → resolved abschließen (nach eigener Prüfung)
//      - Admin kann review → open zurückweisen (Mangel nicht wirklich behoben)
//      - Admin kann resolved → open wieder öffnen
//      - Drei Abschnitte: Offen (rot) / Zur Prüfung (gelb) / Beseitigt (grün)
// V12: uploadFile prop + folder="issues"
import { useState } from "react";
import {
  P, GR, LT, GN, YL, RD,
  CORE,
  Btn, Card, IForm, Fi, Ft, Fs, PicUpload, Thumbs, PH, Av, CopyBtn,
} from "../core.jsx";

export default function Issues({ data, save, uploadFile, user, t }) {
  const [items,  setItems]  = useState(() => data.issues || []);
  const [show,   setShow]   = useState(false);
  const [editId, setEditId] = useState(null);

  const allU     = [...CORE, ...(data.extraUsers || [])];
  const contacts = data.contacts || [];
  const isAdmin  = user.role === 'admin';

  const ef = {
    title:'', desc:'', priority:'medium',
    assigned:'', assignedContacts:[], photos:[]
  };
  const [f, setF] = useState(ef);

  const pc       = { high: RD, medium: YL, low: GN };
  const pLabel   = { high: t.high, medium: t.medium, low: t.low };
  const pLabelTr = { high:'Yüksek', medium:'Orta', low:'Düşük' };

  function add() {
    if (editId) {
      const u = items.map(i => i.id === editId ? { ...i, ...f } : i);
      setItems(u); save('issues', u);
    } else {
      const u = [...items, {
        ...f, id: Date.now(), status:'open',
        by: user.name, date: new Date().toISOString().split('T')[0]
      }];
      setItems(u); save('issues', u);
    }
    setShow(false); setEditId(null); setF(ef);
  }

  function openEdit(item) {
    setF({
      title: item.title || '', desc: item.desc || '',
      priority: item.priority || 'medium',
      assigned: item.assigned || '',
      assignedContacts: item.assignedContacts || [],
      photos: item.photos || []
    });
    setEditId(item.id); setShow(true);
  }

  // V19: Status-Übergänge mit Berechtigungs-Logik
  // open → review: jeder (Bearbeiter meldet Fertigstellung)
  function reportDone(id) {
    const u = items.map(i => i.id === id ? {
      ...i, status:'review',
      reportedBy:   user.name,
      reportedDate: new Date().toISOString().split('T')[0]
    } : i);
    setItems(u); save('issues', u);
  }

  // review → resolved: NUR Admin (nach Prüfung)
  function confirmResolved(id) {
    if (!isAdmin) return;
    const u = items.map(i => i.id === id ? {
      ...i, status:'resolved',
      resolvedBy:   user.name,
      resolvedDate: new Date().toISOString().split('T')[0]
    } : i);
    setItems(u); save('issues', u);
  }

  // review → open: NUR Admin (Zurückweisung)
  function rejectReview(id) {
    if (!isAdmin) return;
    const u = items.map(i => i.id === id ? {
      ...i, status:'open',
      reportedBy: undefined, reportedDate: undefined
    } : i);
    setItems(u); save('issues', u);
  }

  // resolved → open: NUR Admin
  function reopen(id) {
    if (!isAdmin) return;
    const u = items.map(i => i.id === id ? {
      ...i, status:'open',
      reportedBy: undefined, reportedDate: undefined,
      resolvedBy: undefined, resolvedDate: undefined
    } : i);
    setItems(u); save('issues', u);
  }

  function toggleContact(cid) {
    const list = f.assignedContacts || [];
    setF({
      ...f,
      assignedContacts: list.includes(cid) ? list.filter(x => x !== cid) : [...list, cid]
    });
  }

  function buildMsg(item, lang) {
    const pri = lang === 'tr' ? pLabelTr[item.priority] : pLabel[item.priority];
    if (lang === 'tr') {
      return `Merhaba,\n\nZINKPOWER Manisa şantiyesinde aşağıdaki kusur size atanmıştır:\n\n📋 Başlık: ${item.title}\n⚠️ Öncelik: ${pri}\n📅 Tarih: ${item.date}\n👤 Bildiren: ${item.by}\n\n${item.desc ? `Açıklama:\n${item.desc}\n\n` : ''}Lütfen en kısa sürede inceleyin.\n\nİyi çalışmalar`;
    }
    return `Hallo,\n\nauf der Baustelle ZINKPOWER Manisa wurde Ihnen folgender Mangel zugewiesen:\n\n📋 Titel: ${item.title}\n⚠️ Priorität: ${pri}\n📅 Datum: ${item.date}\n👤 Gemeldet von: ${item.by}\n\n${item.desc ? `Beschreibung:\n${item.desc}\n\n` : ''}Bitte zeitnah prüfen.\n\nMit freundlichen Grüßen`;
  }
  function mailLink(c, item) {
    const subj = encodeURIComponent(`[ZINKPOWER Manisa] Mangel: ${item.title}`);
    const body = encodeURIComponent(buildMsg(item, 'de') + '\n\n— — —\n\n' + buildMsg(item, 'tr'));
    return `mailto:${c.email}?subject=${subj}&body=${body}`;
  }
  function waLink(c, item) {
    const phone = (c.mobile || c.phone || '').replace(/[^\d+]/g, '').replace(/^\+/, '');
    const text  = encodeURIComponent(buildMsg(item, 'de') + '\n\n— — —\n\n' + buildMsg(item, 'tr'));
    return `https://wa.me/${phone}?text=${text}`;
  }

  const open     = items.filter(i => i.status === 'open');
  const review   = items.filter(i => i.status === 'review');
  const resolved = items.filter(i => i.status === 'resolved');

  function renderAssignedContacts(item) {
    const list = (item.assignedContacts || []).map(cid => contacts.find(c => c.id === cid)).filter(Boolean);
    if (!list.length) return null;
    return (
      <div style={{
        marginTop:10, padding:10, background:'#f8f9fc',
        borderRadius:8, border:`1px solid ${LT}`
      }}>
        <div style={{ fontSize:11, color:GR, marginBottom:6, fontWeight:'bold' }}>
          👥 Zuständig / Sorumlu:
        </div>
        {list.map(c => (
          <div key={c.id} style={{
            display:'flex', alignItems:'center', gap:8,
            marginBottom:6, flexWrap:'wrap'
          }}>
            <Av name={c.name} size={28}/>
            <div style={{ flex:1, minWidth:120 }}>
              <div style={{ fontSize:12, fontWeight:'bold', color:P }}>{c.name}</div>
              {c.company && <div style={{ fontSize:10, color:GR }}>{c.company}</div>}
            </div>
            <div style={{ display:'flex', gap:4, flexWrap:'wrap' }}>
              {c.email && (
                <a href={mailLink(c, item)} style={{ textDecoration:'none' }}>
                  <Btn sm outline>📧 E-Mail</Btn>
                </a>
              )}
              {(c.mobile || c.phone) && (
                <a href={waLink(c, item)} target="_blank" rel="noreferrer" style={{ textDecoration:'none' }}>
                  <Btn sm col={GN}>📱 WhatsApp</Btn>
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div>
      <PH title={t.issues}>
        <Btn onClick={() => { setF(ef); setEditId(null); setShow(s => !s); }}>+ {t.add}</Btn>
      </PH>

      {show && (
        <IForm
          title={editId ? `${t.edit} ${t.issues}` : `${t.add} ${t.issues}`}
          onClose={() => { setShow(false); setEditId(null); }}
        >
          <Fi label={t.title} value={f.title} onChange={v => setF({ ...f, title:v })}
              ph="Kurze Beschreibung des Mangels"/>
          <Ft label={t.desc} value={f.desc} onChange={v => setF({ ...f, desc:v })} rows={3}/>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
            <Fs label={t.priority} value={f.priority}
                onChange={v => setF({ ...f, priority:v })}
                opts={['high','medium','low'].map(p => ({ v:p, l:t[p] }))}/>
            <Fs label={t.assigned} value={f.assigned}
                onChange={v => setF({ ...f, assigned:v })}
                opts={[{ v:'', l:'–' }, ...allU.map(u => ({ v: u.name, l: u.name }))]}/>
          </div>

          <div style={{ marginBottom:10 }}>
            <label style={{ display:'block', fontSize:11, color:GR, marginBottom:4 }}>
              👥 Kontakte zuweisen / Kişi ata (mehrere möglich)
            </label>
            {contacts.length === 0 ? (
              <div style={{
                fontSize:12, color:GR, fontStyle:'italic',
                padding:8, background:'#f8f9fc', borderRadius:6
              }}>
                Keine Kontakte vorhanden. Erst im Modul „Kontakte" anlegen.
              </div>
            ) : (
              <div style={{
                maxHeight:160, overflowY:'auto',
                border:'1px solid #ddd', borderRadius:6, padding:6
              }}>
                {contacts.map(c => {
                  const active = (f.assignedContacts || []).includes(c.id);
                  return (
                    <div
                      key={c.id}
                      onClick={() => toggleContact(c.id)}
                      style={{
                        display:'flex', alignItems:'center', gap:8,
                        padding:'6px 8px', cursor:'pointer',
                        background: active ? LT : 'transparent',
                        borderRadius:4, marginBottom:2
                      }}
                    >
                      <div style={{
                        width:18, height:18, borderRadius:4,
                        background: active ? P : '#fff',
                        border: `2px solid ${active ? P : '#ccc'}`,
                        display:'flex', alignItems:'center', justifyContent:'center',
                        flexShrink:0
                      }}>
                        {active && <span style={{ color:'#fff', fontSize:11, lineHeight:1 }}>✓</span>}
                      </div>
                      <div style={{ flex:1, fontSize:12 }}>
                        <div style={{
                          fontWeight: active ? 'bold' : 'normal',
                          color: active ? P : '#333'
                        }}>{c.name}</div>
                        <div style={{ fontSize:10, color:GR }}>
                          {c.company && `${c.company} · `}
                          {c.email && `✉ ${c.email}`}
                          {(c.mobile || c.phone) && ` · 📱 ${c.mobile || c.phone}`}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <PicUpload
            onPhoto={p => setF({ ...f, photos: [...f.photos, p] })}
            t={t}
            uploadFile={uploadFile}
            folder="issues"
          />
          <Thumbs photos={f.photos}/>

          <div style={{ display:'flex', gap:8, marginTop:8 }}>
            <Btn outline onClick={() => { setShow(false); setEditId(null); }}>{t.cancel}</Btn>
            <Btn disabled={!f.title} onClick={add}>{t.save}</Btn>
          </div>
        </IForm>
      )}

      {/* ══════════ OFFEN ══════════ */}
      {open.length > 0 && (
        <div style={{ marginBottom:8 }}>
          <div style={{
            display:'flex', alignItems:'center', gap:8, marginBottom:8,
            padding:'6px 10px', background: RD + '15', borderRadius:8
          }}>
            <span style={{ width:10, height:10, borderRadius:'50%', background:RD, display:'inline-block' }}/>
            <b style={{ fontSize:13, color:RD }}>Mängel offen / Açık</b>
            <span style={{ fontSize:12, color:RD }}>({open.length})</span>
          </div>
          {open.map(item => (
            <Card key={item.id}>
              <div style={{ display:'flex', justifyContent:'space-between' }}>
                <div style={{ flex:1 }}>
                  <div style={{
                    display:'flex', alignItems:'center', gap:8,
                    marginBottom:4, flexWrap:'wrap'
                  }}>
                    <span style={{
                      padding:'2px 8px',
                      background: pc[item.priority] + '25',
                      color: pc[item.priority],
                      borderRadius:6, fontSize:11, fontWeight:'bold'
                    }}>{pLabel[item.priority]}</span>
                    <b style={{ color:P, fontSize:13 }}>{item.title}</b>
                    <CopyBtn text={item.title} t={t} sm/>
                  </div>
                  {item.desc && (
                    <div style={{ fontSize:12, color:GR, marginBottom:3 }}>
                      {item.desc}<CopyBtn text={item.desc} t={t} sm/>
                    </div>
                  )}
                  <div style={{ fontSize:11, color:GR }}>
                    📅 {item.date} · 👤 {item.by}
                    {item.assigned ? ` · → ${item.assigned}` : ''}
                  </div>
                  <Thumbs photos={item.photos}/>
                  {renderAssignedContacts(item)}
                </div>
                <div style={{
                  marginLeft:12, flexShrink:0,
                  display:'flex', flexDirection:'column', gap:6
                }}>
                  <Btn sm outline onClick={() => openEdit(item)}>✏️ {t.edit}</Btn>
                  {/* V19: Nicht-Admin meldet nur, Admin kann direkt abschließen */}
                  <Btn sm col={YL} onClick={() => reportDone(item.id)}>
                    📣 Fertig gemeldet
                  </Btn>
                  {isAdmin && (
                    <Btn sm col={GN} onClick={() => confirmResolved(item.id)}>
                      ✓ Beseitigt
                    </Btn>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* ══════════ ZUR PRÜFUNG ══════════ */}
      {review.length > 0 && (
        <div style={{ marginBottom:8 }}>
          <div style={{
            display:'flex', alignItems:'center', gap:8, marginBottom:8,
            padding:'6px 10px', background: YL + '15', borderRadius:8
          }}>
            <span style={{ width:10, height:10, borderRadius:'50%', background:YL, display:'inline-block' }}/>
            <b style={{ fontSize:13, color:'#8a6300' }}>Zur Prüfung / Kontrole hazır</b>
            <span style={{ fontSize:12, color:'#8a6300' }}>({review.length})</span>
          </div>
          {review.map(item => (
            <Card key={item.id}>
              <div style={{ display:'flex', justifyContent:'space-between' }}>
                <div style={{ flex:1 }}>
                  <div style={{
                    display:'flex', alignItems:'center', gap:8,
                    marginBottom:4, flexWrap:'wrap'
                  }}>
                    <span style={{
                      padding:'2px 8px', background: YL + '25', color: YL,
                      borderRadius:6, fontSize:11, fontWeight:'bold'
                    }}>⏳ Prüfung / Kontrol</span>
                    <b style={{ color:P, fontSize:13 }}>{item.title}</b>
                  </div>
                  {item.desc && <div style={{ fontSize:12, color:GR, marginBottom:3 }}>{item.desc}</div>}
                  <div style={{ fontSize:11, color:GR }}>
                    📅 {item.date} · 👤 {item.by}
                    {item.assigned ? ` · → ${item.assigned}` : ''}
                  </div>
                  {item.reportedBy && (
                    <div style={{ fontSize:11, color:'#8a6300', marginTop:3, fontWeight:'bold' }}>
                      📣 Fertig gemeldet von {item.reportedBy} ({item.reportedDate})
                    </div>
                  )}
                  <Thumbs photos={item.photos}/>
                  {renderAssignedContacts(item)}
                </div>
                <div style={{
                  marginLeft:12, flexShrink:0,
                  display:'flex', flexDirection:'column', gap:6
                }}>
                  {isAdmin ? (
                    <>
                      <Btn sm col={GN} onClick={() => confirmResolved(item.id)}>
                        ✓ Geprüft &amp; beseitigt
                      </Btn>
                      <Btn sm danger onClick={() => rejectReview(item.id)}>
                        ↩ Zurückweisen
                      </Btn>
                    </>
                  ) : (
                    <div style={{
                      fontSize:10, color:GR, textAlign:'right',
                      maxWidth:120, fontStyle:'italic'
                    }}>
                      Wartet auf Admin-Prüfung / Yönetici kontrolü bekleniyor
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* ══════════ BESEITIGT ══════════ */}
      {resolved.length > 0 && (
        <div>
          <div style={{
            display:'flex', alignItems:'center', gap:8, marginBottom:8,
            padding:'6px 10px', background: GN + '15', borderRadius:8
          }}>
            <span style={{ width:10, height:10, borderRadius:'50%', background:GN, display:'inline-block' }}/>
            <b style={{ fontSize:13, color:GN }}>Mängel beseitigt / Giderildi</b>
            <span style={{ fontSize:12, color:GN }}>({resolved.length})</span>
          </div>
          {resolved.map(item => (
            <Card key={item.id}>
              <div style={{ display:'flex', justifyContent:'space-between' }}>
                <div style={{ flex:1 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
                    <span style={{
                      padding:'2px 8px', background: GN + '25', color:GN,
                      borderRadius:6, fontSize:11, fontWeight:'bold'
                    }}>✓ Beseitigt</span>
                    <b style={{ color:GR, fontSize:13 }}>{item.title}</b>
                  </div>
                  {item.desc && <div style={{ fontSize:12, color:GR, marginBottom:3 }}>{item.desc}</div>}
                  <div style={{ fontSize:11, color:GR }}>
                    📅 {item.date} · 👤 {item.by}
                    {item.reportedBy ? ` · 📣 ${item.reportedBy} (${item.reportedDate})` : ''}
                    {item.resolvedBy ? ` · ✓ ${item.resolvedBy} (${item.resolvedDate})` : ''}
                  </div>
                  <Thumbs photos={item.photos}/>
                </div>
                {isAdmin && (
                  <div style={{ marginLeft:12, flexShrink:0 }}>
                    <Btn sm outline onClick={() => reopen(item.id)}>↩ Wieder öffnen</Btn>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {items.length === 0 && (
        <Card><div style={{ color:GR, textAlign:'center', padding:20 }}>{t.no_data}</div></Card>
      )}
    </div>
  );
}
