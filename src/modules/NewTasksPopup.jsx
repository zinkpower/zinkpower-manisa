// ZINKPOWER Manisa — modules/NewTasksPopup.jsx V12
import {
  P, GR, LT,
  Btn,
} from "../core.jsx";

export default function NewTasksPopup({ user, data, t, lang, newTaskIds, onClose }) {
  const tasks = (data.tasks || []).filter(tk => (newTaskIds || []).includes(tk.id));
  if (tasks.length === 0) return null;

  const isTr = lang === 'tr';
  const title = isTr ? 'Sana atanan yeni görevler' : 'Neue Aufgaben für dich';
  const sub = isTr
    ? `${tasks.length} yeni görev sana atandı`
    : (tasks.length === 1
        ? '1 neue Aufgabe wurde dir zugewiesen'
        : `${tasks.length} neue Aufgaben wurden dir zugewiesen`);

  return (
    <div style={{
      position:'fixed', inset:0, background:'rgba(0,0,0,0.6)',
      zIndex:10000, display:'flex', alignItems:'center',
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
            <b style={{ fontSize:15 }}>⭐ {title}</b>
            <div style={{ fontSize:11, opacity:0.85, marginTop:2 }}>{sub}</div>
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
          {tasks.map(tk => (
            <div key={tk.id} style={{
              border:`1px solid ${LT}`, borderRadius:8,
              padding:12, marginBottom:10
            }}>
              <div style={{ fontWeight:'bold', color:P, fontSize:14, marginBottom:3 }}>
                {tk.topic}
              </div>
              {tk.desc && <div style={{ fontSize:12, color:GR, marginTop:3 }}>{tk.desc}</div>}
              <div style={{ fontSize:11, color:GR, marginTop:6 }}>
                👤 {t.task_created_by} <b>{tk.createdBy}</b>
                {tk.due && <span> · 📅 {t.task_due}: <b>{tk.due}</b></span>}
              </div>
            </div>
          ))}

          <div style={{ marginTop:14, display:'flex', justifyContent:'flex-end' }}>
            <Btn onClick={onClose}>{t.rem_ok}</Btn>
          </div>
        </div>
      </div>
    </div>
  );
}
