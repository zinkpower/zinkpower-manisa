// ZINKPOWER Manisa — modules/ReminderPopup.jsx V12
import {
  P, GR, LT, GN, YL, RD,
  Btn, Av,
} from "../core.jsx";

export default function ReminderPopup({ user, data, t, onClose }) {
  const items    = data.tasks    || [];
  const contacts = data.contacts || [];
  const today    = new Date().toISOString().split('T')[0];
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  const isAdmin = user.role === 'admin';
  function visibleFor(item) {
    if (isAdmin) return true;
    if (item.createdById === user.id) return true;
    if ((item.assignedUsers || []).includes(user.id)) return true;
    return false;
  }

  const due = items.filter(i => {
    if (i.status === 'done') return false;
    if (!i.due) return false;
    if (!visibleFor(i)) return false;
    return i.due <= tomorrowStr;
  }).sort((a, b) => a.due.localeCompare(b.due));

  if (due.length === 0) return null;

  function buildMsg(item) {
    const dueLabel = item.due === today ? 'HEUTE'
      : item.due === tomorrowStr ? 'MORGEN'
      : `ÜBERFÄLLIG seit ${item.due}`;
    const de = `Hallo,\n\nErinnerung: folgende Aufgabe ist fällig (${dueLabel}):\n\n📋 ${item.topic}\n📅 Frist: ${item.due}\n${item.desc ? `\n${item.desc}\n` : ''}\nBitte erledigen.\n\nGruß`;
    const tr = `Merhaba,\n\nHatırlatma: aşağıdaki görev son tarihinde:\n\n📋 ${item.topic}\n📅 Son tarih: ${item.due}\n${item.desc ? `\n${item.desc}\n` : ''}\nLütfen tamamlayın.\n\nİyi çalışmalar`;
    return de + '\n\n— — —\n\n' + tr;
  }
  function waLink(c, item) {
    const phone = (c.mobile || c.phone || '').replace(/[^\d+]/g, '').replace(/^\+/, '');
    return `https://wa.me/${phone}?text=${encodeURIComponent(buildMsg(item))}`;
  }
  function mailLink(c, item) {
    const subj = encodeURIComponent(`[ZINKPOWER] Erinnerung: ${item.topic}`);
    return `mailto:${c.email}?subject=${subj}&body=${encodeURIComponent(buildMsg(item))}`;
  }
  function dueBadge(d) {
    if (d <  today)        return { bg: RD, fg:'#fff', label: `⚠️ ${t.rem_overdue} (${d})` };
    if (d === today)       return { bg: RD, fg:'#fff', label: `🔴 ${t.rem_today} (${d})` };
    return                       { bg: YL, fg:'#fff', label: `🟡 ${t.rem_tomorrow} (${d})` };
  }

  const countLabel = due.length === 1 ? t.rem_count_singular : t.rem_count_plural;

  return (
    <div style={{
      position:'fixed', inset:0, background:'rgba(0,0,0,0.6)',
      zIndex:9999, display:'flex', alignItems:'center',
      justifyContent:'center', padding:16
    }}>
      <div style={{
        background:'#fff', borderRadius:12, padding:0,
        width:560, maxWidth:'100%', maxHeight:'85vh', overflowY:'auto',
        boxShadow:'0 8px 32px rgba(0,0,0,0.3)'
      }}>
        <div style={{
          background:P, color:'#fff', padding:'14px 18px',
          borderRadius:'12px 12px 0 0',
          display:'flex', justifyContent:'space-between', alignItems:'center'
        }}>
          <div>
            <b style={{ fontSize:15 }}>🔔 {t.rem_title}</b>
            <div style={{ fontSize:11, opacity:0.85, marginTop:2 }}>
              {due.length} {countLabel}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background:'rgba(255,255,255,0.15)', border:'none', color:'#fff',
              borderRadius:6, padding:'4px 10px', fontSize:18, cursor:'pointer'
            }}
          >✕</button>
        </div>

        <div style={{ padding:16 }}>
          {due.map(item => {
            const b = dueBadge(item.due);
            const contactList = (item.assignedContacts || [])
              .map(cid => contacts.find(c => c.id === cid)).filter(Boolean);
            return (
              <div key={item.id} style={{
                border:`1px solid ${LT}`, borderRadius:8,
                padding:12, marginBottom:10
              }}>
                <div style={{ marginBottom:6 }}>
                  <span style={{
                    display:'inline-block', padding:'3px 10px',
                    background: b.bg, color: b.fg,
                    borderRadius:6, fontSize:11, fontWeight:'bold', marginBottom:6
                  }}>{b.label}</span>
                  <div style={{ fontWeight:'bold', color:P, fontSize:14 }}>{item.topic}</div>
                  {item.desc && <div style={{ fontSize:12, color:GR, marginTop:3 }}>{item.desc}</div>}
                  <div style={{ fontSize:11, color:GR, marginTop:4 }}>
                    👤 {t.task_created_by} {item.createdBy}
                  </div>
                </div>

                {contactList.length > 0 && (
                  <div style={{
                    marginTop:8, padding:8,
                    background:'#f8f9fc', borderRadius:6
                  }}>
                    <div style={{ fontSize:11, color:GR, marginBottom:6, fontWeight:'bold' }}>
                      📤 {t.rem_send_to}:
                    </div>
                    {contactList.map(c => (
                      <div key={c.id} style={{
                        display:'flex', alignItems:'center', gap:8,
                        marginBottom:6, flexWrap:'wrap'
                      }}>
                        <Av name={c.name} size={26}/>
                        <div style={{ flex:1, minWidth:100 }}>
                          <div style={{ fontSize:12, fontWeight:'bold', color:P }}>{c.name}</div>
                          {c.company && <div style={{ fontSize:10, color:GR }}>{c.company}</div>}
                        </div>
                        <div style={{ display:'flex', gap:4, flexWrap:'wrap' }}>
                          {(c.mobile || c.phone) && (
                            <a href={waLink(c, item)} target="_blank" rel="noreferrer" style={{ textDecoration:'none' }}>
                              <Btn sm col={GN}>📱 WhatsApp</Btn>
                            </a>
                          )}
                          {c.email && (
                            <a href={mailLink(c, item)} style={{ textDecoration:'none' }}>
                              <Btn sm outline>📧 E-Mail</Btn>
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {contactList.length === 0 && (
                  <div style={{ fontSize:11, color:GR, fontStyle:'italic', marginTop:6 }}>
                    {t.rem_no_contact}
                  </div>
                )}
              </div>
            );
          })}

          <div style={{ marginTop:14, display:'flex', justifyContent:'flex-end' }}>
            <Btn onClick={onClose}>{t.rem_ok}</Btn>
          </div>
        </div>
      </div>
    </div>
  );
}
