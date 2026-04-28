// ZINKPOWER Manisa — modules/Tasks.jsx V12
import { useState } from "react";
import {
  P, GR, LT, GN, YL, RD,
  CORE,
  Btn, Card, IForm, Fi, Ft, PH, Av, CopyBtn,
} from "../core.jsx";

export default function Tasks({ data, save, user, t }) {
  const [items,    setItems]    = useState(() => data.tasks || []);
  const [show,     setShow]     = useState(false);
  const [editId,   setEditId]   = useState(null);
  const [showDone, setShowDone] = useState(false);
  const [delId,    setDelId]    = useState(null);

  const allU     = [...CORE, ...(data.extraUsers || [])];
  const contacts = data.contacts || [];
  const isAdmin  = user.role === 'admin';
  const today    = new Date().toISOString().split('T')[0];

  const ef = { topic:'', desc:'', due:'', assignedUsers:[], assignedContacts:[] };
  const [f, setF] = useState(ef);

  function visibleFor(item) {
    if (isAdmin) return true;
    if (item.createdById === user.id) return true;
    if ((item.assignedUsers || []).includes(user.id)) return true;
    return false;
  }

  function add() {
    if (!f.topic.trim()) return;
    if (editId) {
      const u = items.map(i => i.id === editId ? { ...i, ...f } : i);
      setItems(u); save('tasks', u);
    } else {
      const newItem = {
        ...f, id: Date.now(), status:'open',
        createdBy: user.name, createdById: user.id, createdAt: today
      };
      const u = [...items, newItem];
      setItems(u); save('tasks', u);
    }
    setShow(false); setEditId(null); setF(ef);
  }

  function openEdit(item) {
    setF({
      topic: item.topic || '', desc: item.desc || '', due: item.due || '',
      assignedUsers: item.assignedUsers || [],
      assignedContacts: item.assignedContacts || []
    });
    setEditId(item.id); setShow(true);
  }

  function setDone(id, done) {
    const u = items.map(i => i.id === id ? {
      ...i, status: done ? 'done' : 'open',
      doneBy: done ? user.name : undefined,
      doneAt: done ? today : undefined
    } : i);
    setItems(u); save('tasks', u);
  }

  function del(id) {
    const u = items.filter(i => i.id !== id);
    save('tasks', u); setItems(u); setDelId(null);
  }

  function toggleUser(uid) {
    const list = f.assignedUsers || [];
    setF({ ...f, assignedUsers: list.includes(uid) ? list.filter(x => x !== uid) : [...list, uid] });
  }
  function toggleContact(cid) {
    const list = f.assignedContacts || [];
    setF({ ...f, assignedContacts: list.includes(cid) ? list.filter(x => x !== cid) : [...list, cid] });
  }

  function buildMsg(item, lang) {
    const dueText = item.due
      ? (lang === 'tr' ? `Son tarih: ${item.due}` : `Frist: ${item.due}`)
      : (lang === 'tr' ? 'Son tarih belirtilmedi' : 'Keine Frist gesetzt');
    if (lang === 'tr') {
      return `Merhaba,\n\nZINKPOWER Manisa toplantısında size aşağıdaki görev atanmıştır:\n\n📋 Konu: ${item.topic}\n📅 ${dueText}\n👤 Bildiren: ${item.createdBy}\n\n${item.desc ? `Açıklama:\n${item.desc}\n\n` : ''}İyi çalışmalar`;
    }
    return `Hallo,\n\nim ZINKPOWER Manisa Meeting wurde Ihnen folgende Aufgabe zugewiesen:\n\n📋 Thema: ${item.topic}\n📅 ${dueText}\n👤 Erstellt von: ${item.createdBy}\n\n${item.desc ? `Beschreibung:\n${item.desc}\n\n` : ''}Mit freundlichen Grüßen`;
  }
  function mailLink(c, item) {
    const subj = encodeURIComponent(`[ZINKPOWER Manisa] Aufgabe: ${item.topic}`);
    const body = encodeURIComponent(buildMsg(item, 'de') + '\n\n— — —\n\n' + buildMsg(item, 'tr'));
    return `mailto:${c.email}?subject=${subj}&body=${body}`;
  }
  function waLink(c, item) {
    const phone = (c.mobile || c.phone || '').replace(/[^\d+]/g, '').replace(/^\+/, '');
    const text = encodeURIComponent(buildMsg(item, 'de') + '\n\n— — —\n\n' + buildMsg(item, 'tr'));
    return `https://wa.me/${phone}?text=${text}`;
  }

  function dueColor(due) {
    if (!due) return GR;
    const d = new Date(due);
    const diff = Math.round((d - new Date(today)) / 864e5);
    if (diff < 0)  return RD;
    if (diff <= 7) return YL;
    return GN;
  }
  function dueLabel(due) {
    if (!due) return '–';
    const d = new Date(due);
    const diff = Math.round((d - new Date(today)) / 864e5);
    if (diff < 0)  return `${due} (${Math.abs(diff)}${t.task_overdue_suffix})`;
    if (diff === 0) return `${due} (${t.task_today})`;
    return `${due} (${t.task_in_days} ${diff}T)`;
  }

  function renderAssignees(item) {
    const userList    = (item.assignedUsers    || []).map(uid => allU.find(u => u.id === uid)).filter(Boolean);
    const contactList = (item.assignedContacts || []).map(cid => contacts.find(c => c.id === cid)).filter(Boolean);
    if (!userList.length && !contactList.length) return null;
    return (
      <div style={{
        marginTop:8, padding:10, background:'#f8f9fc',
        borderRadius:8, border:`1px solid ${LT}`
      }}>
        <div style={{ fontSize:11, color:GR, marginBottom:6, fontWeight:'bold' }}>
          👥 {t.task_assigned_to}:
        </div>
        {userList.map(u => (
          <div key={'u' + u.id} style={{
            display:'flex', alignItems:'center', gap:8, marginBottom:4
          }}>
            <Av name={u.name} size={24}/>
            <div style={{ fontSize:12, fontWeight:'bold', color:P }}>{u.name}</div>
            <span style={{ fontSize:10, color:GR }}>· {t.task_login_user}</span>
          </div>
        ))}
        {contactList.map(c => (
          <div key={'c' + c.id} style={{
            display:'flex', alignItems:'center', gap:8, marginTop:6, flexWrap:'wrap'
          }}>
            <Av name={c.name} size={24}/>
            <div style={{ flex:1, minWidth:120 }}>
              <div style={{ fontSize:12, fontWeight:'bold', color:P }}>{c.name}</div>
              {c.company && <div style={{ fontSize:10, color:GR }}>{c.company}</div>}
            </div>
            <div style={{ display:'flex', gap:4, flexWrap:'wrap' }}>
              {c.email && (
                <a href={mailLink(c, item)} style={{ textDecoration:'none' }}>
                  <Btn sm outline>📧</Btn>
                </a>
              )}
              {(c.mobile || c.phone) && (
                <a href={waLink(c, item)} target="_blank" rel="noreferrer" style={{ textDecoration:'none' }}>
                  <Btn sm col={GN}>📱</Btn>
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  }

  const visible = items.filter(visibleFor);
  const open = visible.filter(i => i.status !== 'done').sort((a, b) => {
    if (!a.due && !b.due) return 0;
    if (!a.due) return 1;
    if (!b.due) return -1;
    return a.due.localeCompare(b.due);
  });
  const done = visible.filter(i => i.status === 'done')
    .sort((a, b) => (b.doneAt || '').localeCompare(a.doneAt || ''));

  return (
    <div>
      <PH title={`📋 ${t.tasks}`}>
        <Btn onClick={() => { setF(ef); setEditId(null); setShow(s => !s); }}>+ {t.add}</Btn>
      </PH>

      {!isAdmin && (
        <div style={{
          background:'#eef5ff', border:`1px solid ${P}40`, borderRadius:6,
          padding:'6px 12px', marginBottom:10, fontSize:11, color:P
        }}>
          ℹ️ {t.task_info_nonadmin}
        </div>
      )}

      {show && (
        <IForm
          title={editId ? t.task_edit : t.task_new}
          onClose={() => { setShow(false); setEditId(null); }}
        >
          <Fi label={`${t.task_topic} *`} value={f.topic} onChange={v => setF({ ...f, topic:v })} ph={t.task_topic_ph}/>
          <Ft label={t.desc}     value={f.desc} onChange={v => setF({ ...f, desc:v })} rows={2}/>
          <Fi label={t.task_due} value={f.due}  onChange={v => setF({ ...f, due:v })}  type="date"/>

          <div style={{ marginBottom:10 }}>
            <label style={{ display:'block', fontSize:11, color:GR, marginBottom:4 }}>
              👤 {t.task_assigned_users}
            </label>
            <div style={{
              maxHeight:120, overflowY:'auto',
              border:'1px solid #ddd', borderRadius:6, padding:6
            }}>
              {allU.map(u => {
                const active = (f.assignedUsers || []).includes(u.id);
                return (
                  <div
                    key={u.id}
                    onClick={() => toggleUser(u.id)}
                    style={{
                      display:'flex', alignItems:'center', gap:8,
                      padding:'5px 8px', cursor:'pointer',
                      background: active ? LT : 'transparent',
                      borderRadius:4, marginBottom:2
                    }}
                  >
                    <div style={{
                      width:16, height:16, borderRadius:3,
                      background: active ? P : '#fff',
                      border: `2px solid ${active ? P : '#ccc'}`,
                      display:'flex', alignItems:'center', justifyContent:'center',
                      flexShrink:0
                    }}>
                      {active && <span style={{ color:'#fff', fontSize:10, lineHeight:1 }}>✓</span>}
                    </div>
                    <span style={{
                      fontSize:12, color: active ? P : '#333',
                      fontWeight: active ? 'bold' : 'normal'
                    }}>{u.name}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ marginBottom:10 }}>
            <label style={{ display:'block', fontSize:11, color:GR, marginBottom:4 }}>
              👥 {t.task_assigned_contacts}
            </label>
            {contacts.length === 0 ? (
              <div style={{
                fontSize:12, color:GR, fontStyle:'italic',
                padding:8, background:'#f8f9fc', borderRadius:6
              }}>
                {t.task_no_contacts}
              </div>
            ) : (
              <div style={{
                maxHeight:120, overflowY:'auto',
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
                        padding:'5px 8px', cursor:'pointer',
                        background: active ? LT : 'transparent',
                        borderRadius:4, marginBottom:2
                      }}
                    >
                      <div style={{
                        width:16, height:16, borderRadius:3,
                        background: active ? P : '#fff',
                        border: `2px solid ${active ? P : '#ccc'}`,
                        display:'flex', alignItems:'center', justifyContent:'center',
                        flexShrink:0
                      }}>
                        {active && <span style={{ color:'#fff', fontSize:10, lineHeight:1 }}>✓</span>}
                      </div>
                      <div style={{ flex:1, fontSize:12 }}>
                        <div style={{
                          fontWeight: active ? 'bold' : 'normal',
                          color: active ? P : '#333'
                        }}>{c.name}</div>
                        {c.company && <div style={{ fontSize:10, color:GR }}>{c.company}</div>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div style={{ display:'flex', gap:8, marginTop:8 }}>
            <Btn outline onClick={() => { setShow(false); setEditId(null); }}>{t.cancel}</Btn>
            <Btn disabled={!f.topic.trim()} onClick={add}>{t.save}</Btn>
          </div>
        </IForm>
      )}

      {delId && (
        <IForm title={t.task_delete_q} onClose={() => setDelId(null)}>
          <div style={{ fontSize:13, marginBottom:14 }}>
            <b style={{ color:RD }}>{items.find(i => i.id === delId)?.topic}</b> {t.really_delete}
          </div>
          <div style={{ display:'flex', gap:8 }}>
            <Btn outline onClick={() => setDelId(null)}>{t.cancel}</Btn>
            <Btn danger onClick={() => del(delId)}>{t.delete}</Btn>
          </div>
        </IForm>
      )}

      <div style={{
        display:'flex', alignItems:'center', gap:8, marginBottom:8,
        padding:'6px 10px', background: P + '12', borderRadius:8
      }}>
        <span style={{ fontSize:14 }}>📌</span>
        <b style={{ fontSize:13, color:P }}>{t.task_open_title} ({open.length})</b>
      </div>

      {open.length === 0 ? (
        <Card>
          <div style={{ color:GR, textAlign:'center', padding:20, fontSize:13 }}>
            {t.task_no_open}
          </div>
        </Card>
      ) : (
        open.map(item => {
          const canEditThis = isAdmin || item.createdById === user.id;
          return (
            <Card key={item.id}>
              <div style={{
                display:'flex', justifyContent:'space-between',
                alignItems:'flex-start', gap:8
              }}>
                <div style={{ flex:1 }}>
                  <div style={{
                    display:'flex', alignItems:'center', gap:8,
                    marginBottom:4, flexWrap:'wrap'
                  }}>
                    <b style={{ color:P, fontSize:14 }}>{item.topic}</b>
                    <CopyBtn text={item.topic} t={t} sm/>
                    {item.due && (
                      <span style={{
                        padding:'2px 8px',
                        background: dueColor(item.due) + '25',
                        color: dueColor(item.due),
                        borderRadius:6, fontSize:11, fontWeight:'bold'
                      }}>
                        📅 {dueLabel(item.due)}
                      </span>
                    )}
                  </div>
                  {item.desc && (
                    <div style={{ fontSize:12, color:GR, marginBottom:3 }}>
                      {item.desc}<CopyBtn text={item.desc} t={t} sm/>
                    </div>
                  )}
                  <div style={{ fontSize:11, color:GR }}>
                    👤 {t.task_created_by} <b>{item.createdBy}</b> · 📅 {item.createdAt}
                  </div>
                  {renderAssignees(item)}
                </div>
                <div style={{ display:'flex', flexDirection:'column', gap:4, flexShrink:0 }}>
                  <Btn sm col={GN} onClick={() => setDone(item.id, true)}>✓ {t.task_done}</Btn>
                  {canEditThis && <Btn sm outline onClick={() => openEdit(item)}>✏️</Btn>}
                  {canEditThis && <Btn sm danger onClick={() => setDelId(item.id)}>✕</Btn>}
                </div>
              </div>
            </Card>
          );
        })
      )}

      {done.length > 0 && (
        <div style={{ marginTop:16 }}>
          <div
            onClick={() => setShowDone(s => !s)}
            style={{
              display:'flex', alignItems:'center', gap:8, padding:'8px 12px',
              background: GN + '12', borderRadius:8, cursor:'pointer'
            }}
          >
            <span style={{ fontSize:14 }}>{showDone ? '▼' : '▶'}</span>
            <b style={{ fontSize:13, color:GN }}>✓ {t.task_done_title} ({done.length})</b>
          </div>
          {showDone && (
            <div style={{ marginTop:8 }}>
              {done.map(item => {
                const canEditThis = isAdmin || item.createdById === user.id;
                return (
                  <Card key={item.id}>
                    <div style={{
                      display:'flex', justifyContent:'space-between',
                      alignItems:'flex-start', gap:8
                    }}>
                      <div style={{ flex:1, opacity:0.75 }}>
                        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
                          <span style={{
                            padding:'2px 8px', background: GN + '25',
                            color:GN, borderRadius:6, fontSize:11, fontWeight:'bold'
                          }}>✓ {t.task_done}</span>
                          <b style={{ color:GR, fontSize:13, textDecoration:'line-through' }}>
                            {item.topic}
                          </b>
                        </div>
                        {item.desc && <div style={{ fontSize:12, color:GR, marginBottom:3 }}>{item.desc}</div>}
                        <div style={{ fontSize:11, color:GR }}>
                          👤 {item.createdBy} → ✓ <b>{item.doneBy}</b> am {item.doneAt}
                          {item.due && <span> · {t.task_orig_deadline}: {item.due}</span>}
                        </div>
                      </div>
                      <div style={{ display:'flex', flexDirection:'column', gap:4, flexShrink:0 }}>
                        <Btn sm outline onClick={() => setDone(item.id, false)}>↩ {t.task_reopen}</Btn>
                        {canEditThis && <Btn sm danger onClick={() => setDelId(item.id)}>✕</Btn>}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
