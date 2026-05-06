// ZINKPOWER Manisa — modules/Dashboard.jsx V14
// V14: Bug-Fix — letzte 3 Bautagebuch-Einträge wurden nach 3 Einträgen "eingefroren"
//      Ursache: slice(-3) auf bereits absteigend sortiertem Array → zeigte die ältesten
//      Fix: explizite Sortierung nach createdDate (Eintragungs-Datum), dann slice(0,3)
import { useState } from "react";
import {
  P, GR, LT, GN, YL, RD,
  Btn, Card, IForm, Fi, Ft, PH, CopyBtn,
} from "../core.jsx";

export default function Dashboard({ data, save, user, t, isMobile }) {
  const [editing, setEditing] = useState(false);
  const p = data.project || {};
  const [f, setF] = useState(p);

  const co  = (data.changeOrders || []).filter(x => x.status === 'submitted' || x.status === 'inReview').length;
  const iss = (data.issues || []).filter(x => x.status !== 'resolved').length;
  const app = (data.approvals || []).filter(x => x.status === 'open').length;

  function doSave() { save('project', f); setEditing(false); }

  // V14: Letzte 3 Bautagebuch-Einträge — sortiert nach Eintragungs-Datum (createdDate),
  // damit nachgetragene Einträge auch erscheinen
  const recentDiary = [...(data.diary || [])]
    .sort((a, b) => {
      const da = a.createdDate || a.date || '';
      const db = b.createdDate || b.date || '';
      // Tie-break über id (Date.now()), damit Einträge vom selben Tag stabil sortiert sind
      if (db !== da) return db.localeCompare(da);
      return (b.id || 0) - (a.id || 0);
    })
    .slice(0, 3);

  return (
    <div>
      <PH title={t.dash}/>

      {editing ? (
        <IForm title={t.pname} onClose={() => setEditing(false)}>
          <Fi label={t.pname}  value={f.name   || ''} onChange={v => setF({ ...f, name:v })}/>
          <Fi label={t.loc}    value={f.loc    || ''} onChange={v => setF({ ...f, loc:v })}/>
          <Fi label={t.pstart} value={f.pstart || ''} onChange={v => setF({ ...f, pstart:v })} type="date"/>
          <Fi label={t.pend}   value={f.pend   || ''} onChange={v => setF({ ...f, pend:v })}   type="date"/>
          <Ft label={t.desc}   value={f.desc   || ''} onChange={v => setF({ ...f, desc:v })}/>
          <div style={{ display:'flex', gap:8 }}>
            <Btn outline onClick={() => setEditing(false)}>{t.cancel}</Btn>
            <Btn onClick={doSave}>{t.save}</Btn>
          </div>
        </IForm>
      ) : (
        <Card action={user.role === 'admin' && (
          <Btn sm outline onClick={() => { setF(p); setEditing(true); }}>✏️ {t.edit}</Btn>
        )}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
            {[[t.pname, p.name], [t.loc, p.loc], [t.pstart, p.pstart], [t.pend, p.pend]].map(([k, v]) => (
              <div key={k}>
                <div style={{ fontSize:11, color:GR, marginBottom:2 }}>{k}</div>
                <div style={{ fontSize:14, fontWeight:'bold', color:P }}>{v}</div>
              </div>
            ))}
          </div>
          {p.desc && (
            <div style={{
              marginTop:12, padding:'8px 12px', background:LT, borderRadius:6,
              fontSize:12, color:GR, display:'flex', alignItems:'flex-start', gap:4
            }}>
              <span style={{ flex:1 }}>{p.desc}</span>
              <CopyBtn text={p.desc} t={t} sm/>
            </div>
          )}
        </Card>
      )}

      <div style={{
        display:'grid',
        gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4,1fr)',
        gap:10, marginBottom:14
      }}>
        {[
          { l: t.contracts,                  v: (data.contracts || []).length, i:'📄', c: P },
          { l: `${t.co} (${t.open})`,        v: co,                            i:'➕', c: co  > 0 ? YL : GN },
          { l: `${t.issues} (${t.open})`,    v: iss,                           i:'⚠️', c: iss > 0 ? RD : GN },
          { l: `${t.approvals} (${t.open})`, v: app,                           i:'✅', c: app > 0 ? YL : GN },
        ].map(k => (
          <div key={k.l} style={{
            background:'#fff', borderRadius:10, padding:'12px 14px',
            boxShadow:'0 1px 8px rgba(40,56,152,0.07)', borderTop:`3px solid ${k.c}`
          }}>
            <div style={{ fontSize:20, marginBottom:4 }}>{k.i}</div>
            <div style={{ fontSize:26, fontWeight:'bold', color:k.c }}>{k.v}</div>
            <div style={{ fontSize:10, color:GR }}>{k.l}</div>
          </div>
        ))}
      </div>

      {recentDiary.length > 0 && (
        <Card title={t.diary}>
          {recentDiary.map(e => (
            <div key={e.id} style={{
              padding:'6px 0', borderBottom:'1px solid #f2f2f2', fontSize:12
            }}>
              <span style={{ color:GR, marginRight:8 }}>{e.date}</span>
              <span>{(e.work_done || '').slice(0, 80)}</span>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}
