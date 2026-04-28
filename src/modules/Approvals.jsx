// ZINKPOWER Manisa — modules/Approvals.jsx V12
// Fix: uploadFile prop + folder="approvals" + 3-Abschnitte-Ansicht (V11)
import { useState } from "react";
import {
  P, GR, GN, YL, RD,
  CORE,
  Badge, Btn, Card, IForm, Fi, Ft, Fs, PicUpload, Thumbs, PH, CopyBtn,
} from "../core.jsx";

export default function Approvals({ data, save, uploadFile, user, t }) {
  const [items,        setItems]        = useState(() => data.approvals || []);
  const [activeId,     setActiveId]     = useState(null);
  const [form,         setForm]         = useState({ comment:'', photos:[] });
  const [showAdd,      setShowAdd]      = useState(false);
  const [nf,           setNf]           = useState({ title:'', assigned:'peter', notes:'' });
  const [showApproved, setShowApproved] = useState(false);
  const [showRejected, setShowRejected] = useState(false);
  const isAdmin = user.role === 'admin';

  function canApr(item) { return item.assigned === user.id || isAdmin; }

  function doApr(id, action) {
    const u = items.map(i => i.id === id ? {
      ...i, status: action, comment: form.comment, photos: form.photos,
      by: user.name,
      approvedDate: new Date().toISOString().split('T')[0]
    } : i);
    setItems(u); save('approvals', u);
    setActiveId(null); setForm({ comment:'', photos:[] });
  }

  function addNew() {
    const u = [...items, { ...nf, id: Date.now(), status:'open', photos:[] }];
    setItems(u); save('approvals', u);
    setShowAdd(false); setNf({ title:'', assigned:'peter', notes:'' });
  }

  function reopen(id) {
    const u = items.map(i => i.id === id ? {
      ...i, status:'open',
      comment: undefined, by: undefined, approvedDate: undefined
    } : i);
    setItems(u); save('approvals', u);
  }

  const sortDate = (a, b) => (b.approvedDate || '').localeCompare(a.approvedDate || '');
  const open     = items.filter(i => i.status === 'open');
  const approved = items.filter(i => i.status === 'approved').sort(sortDate);
  const rejected = items.filter(i => i.status === 'rejected').sort(sortDate);

  function renderCard(item, isArchive) {
    return (
      <Card key={item.id}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
          <div style={{ flex:1, opacity: isArchive ? 0.85 : 1 }}>
            <div style={{ fontWeight:'bold', color:P, fontSize:14, marginBottom:4 }}>
              {item.title}<CopyBtn text={item.title} t={t} sm/>
            </div>
            <div style={{ fontSize:12, color:GR }}>
              👤 {t.assigned}: <b>{CORE.find(u => u.id === item.assigned)?.name || item.assigned}</b>
            </div>
            {item.notes && (
              <div style={{ fontSize:12, color:GR, marginTop:2 }}>
                {item.notes}<CopyBtn text={item.notes} t={t} sm/>
              </div>
            )}
            {item.comment && (
              <div style={{ fontSize:12, color:GR, marginTop:3, fontStyle:'italic' }}>
                💬 {item.comment} ({item.by})<CopyBtn text={item.comment} t={t} sm/>
              </div>
            )}
            {isArchive && item.approvedDate && (
              <div style={{ fontSize:11, color:GR, marginTop:3 }}>
                📅 {item.approvedDate} · 👤 {item.by}
              </div>
            )}
            <Thumbs photos={item.photos}/>
          </div>
          <div style={{
            display:'flex', flexDirection:'column', alignItems:'flex-end',
            gap:6, marginLeft:12, flexShrink:0
          }}>
            <Badge status={item.status} t={t}/>
            {item.status === 'open' && canApr(item) && (
              <>
                <Btn sm col={GN} onClick={() => {
                  const u = items.map(i => i.id === item.id ? {
                    ...i, status:'approved', comment:'', photos:[],
                    by: user.name, approvedDate: new Date().toISOString().split('T')[0]
                  } : i);
                  setItems(u); save('approvals', u);
                }}>✓ {t.approve}</Btn>
                <Btn sm outline onClick={() => {
                  setActiveId(item.id); setForm({ comment:'', photos:[] });
                }}>💬 {t.comment}</Btn>
              </>
            )}
            {isArchive && isAdmin && (
              <Btn sm outline onClick={() => reopen(item.id)}>↩ {t.task_reopen}</Btn>
            )}
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div>
      <PH title={t.approvals}>
        {isAdmin && <Btn onClick={() => setShowAdd(s => !s)}>+ {t.add}</Btn>}
      </PH>

      {showAdd && (
        <IForm title={`${t.add} ${t.approvals}`} onClose={() => setShowAdd(false)}>
          <Fi label={t.title}    value={nf.title}    onChange={v => setNf({ ...nf, title:v })}/>
          <Fs label={t.assigned} value={nf.assigned} onChange={v => setNf({ ...nf, assigned:v })}
              opts={CORE.map(u => ({ v: u.id, l: u.name }))}/>
          <Ft label={t.notes}    value={nf.notes}    onChange={v => setNf({ ...nf, notes:v })}/>
          <div style={{ display:'flex', gap:8 }}>
            <Btn outline onClick={() => setShowAdd(false)}>{t.cancel}</Btn>
            <Btn onClick={addNew}>{t.save}</Btn>
          </div>
        </IForm>
      )}

      {activeId && (
        <IForm
          title={`${t.approvals}: ${items.find(i => i.id === activeId)?.title || ''}`}
          onClose={() => setActiveId(null)}
        >
          <Ft label={t.comment} value={form.comment} onChange={v => setForm({ ...form, comment:v })}/>
          <PicUpload
            onPhoto={p => setForm({ ...form, photos: [...form.photos, p] })}
            t={t}
            uploadFile={uploadFile}
            folder="approvals"
          />
          <Thumbs photos={form.photos}/>
          <div style={{ display:'flex', gap:8, marginTop:8 }}>
            <Btn danger onClick={() => doApr(activeId, 'rejected')}>{t.reject}</Btn>
            <Btn onClick={() => doApr(activeId, 'approved')}>{t.approve}</Btn>
          </div>
        </IForm>
      )}

      <div style={{
        display:'flex', alignItems:'center', gap:8, marginBottom:8,
        padding:'6px 10px', background: YL + '20', borderRadius:8
      }}>
        <span style={{ width:10, height:10, borderRadius:'50%', background:YL, display:'inline-block' }}/>
        <b style={{ fontSize:13, color:'#8a6300' }}>{t.open} ({open.length})</b>
      </div>

      {open.length === 0 ? (
        <Card>
          <div style={{ color:GR, textAlign:'center', padding:16, fontSize:13 }}>
            {t.no_data}
          </div>
        </Card>
      ) : (
        open.map(item => renderCard(item, false))
      )}

      {approved.length > 0 && (
        <div style={{ marginTop:14 }}>
          <div
            onClick={() => setShowApproved(s => !s)}
            style={{
              display:'flex', alignItems:'center', gap:8, padding:'8px 12px',
              background: GN + '15', borderRadius:8, cursor:'pointer'
            }}
          >
            <span style={{ fontSize:14 }}>{showApproved ? '▼' : '▶'}</span>
            <b style={{ fontSize:13, color:GN }}>✓ {t.approved} ({approved.length})</b>
          </div>
          {showApproved && (
            <div style={{ marginTop:8 }}>
              {approved.map(item => renderCard(item, true))}
            </div>
          )}
        </div>
      )}

      {rejected.length > 0 && (
        <div style={{ marginTop:14 }}>
          <div
            onClick={() => setShowRejected(s => !s)}
            style={{
              display:'flex', alignItems:'center', gap:8, padding:'8px 12px',
              background: RD + '15', borderRadius:8, cursor:'pointer'
            }}
          >
            <span style={{ fontSize:14 }}>{showRejected ? '▼' : '▶'}</span>
            <b style={{ fontSize:13, color:RD }}>✕ {t.rejected} ({rejected.length})</b>
          </div>
          {showRejected && (
            <div style={{ marginTop:8 }}>
              {rejected.map(item => renderCard(item, true))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
