// ZINKPOWER Manisa — modules/ChangeOrders.jsx V15
// V15: Admin kann Nachträge in jedem Status bearbeiten und löschen
//      - Bearbeiten-Button (✏️) auf jeder Card, nur für Admin
//      - Löschen-Button (🗑) auf jeder Card, nur für Admin, mit Bestätigung
//      - Keine Status-abhängigen Sperren — Admin trägt Verantwortung
// V12: Fix uploadFile prop + folder="changeorders"
import { useState } from "react";
import {
  P, GR, LT, GN, YL, RD,
  Btn, Card, IForm, Fi, Ft, PicUpload, Thumbs, PH, CopyBtn,
} from "../core.jsx";

export default function ChangeOrders({ data, save, uploadFile, user, t }) {
  const [items,  setItems]  = useState(() => data.changeOrders || []);
  const [show,   setShow]   = useState(false);
  const [editId, setEditId] = useState(null);     // V15: Bearbeiten
  const [delId,  setDelId]  = useState(null);     // V15: Löschen
  const [revId,  setRevId]  = useState(null);
  const [cmt,    setCmt]    = useState('');
  const ef = { title:'', desc:'', amount:'', contractor:'', photos:[] };
  const [f, setF] = useState(ef);
  const isAdmin = user.role === 'admin';

  function submit() {
    if (editId) {
      // V15: Bearbeiten — bestehenden Eintrag updaten
      const u = items.map(i => i.id === editId
        ? { ...i, ...f, amount: Number(f.amount) }
        : i);
      setItems(u); save('changeOrders', u);
    } else {
      // Neuer Eintrag
      const u = [...items, {
        ...f, id: Date.now(), amount: Number(f.amount),
        status:'submitted', by: user.name,
        date: new Date().toISOString().split('T')[0]
      }];
      setItems(u); save('changeOrders', u);
    }
    setShow(false); setEditId(null); setF(ef);
  }

  function openEdit(item) {
    setF({
      title:      item.title      || '',
      desc:       item.desc       || '',
      amount:     item.amount     || '',
      contractor: item.contractor || '',
      photos:     item.photos     || []
    });
    setEditId(item.id);
    setShow(true);
  }

  function del(id) {
    const u = items.filter(i => i.id !== id);
    setItems(u); save('changeOrders', u);
    setDelId(null);
  }

  function doReject(id) {
    const u = items.map(i => i.id === id
      ? { ...i, status:'rejected', comment: cmt, revBy: user.name }
      : i);
    setItems(u); save('changeOrders', u); setRevId(null); setCmt('');
  }

  function doConvert(id) {
    const item = items.find(i => i.id === id);
    if (!item) return;
    const updCO = items.map(i => i.id === id
      ? { ...i, status:'converted', comment: cmt, revBy: user.name }
      : i);
    const newContract = {
      id: Date.now(),
      title: `Nachtrag: ${item.title}`,
      contractor: item.contractor || '–',
      amount: item.amount || 0,
      date: new Date().toISOString().split('T')[0],
      status:'active', notes: item.desc || ''
    };
    const updContracts = [...(data.contracts || []), newContract];
    setItems(updCO);
    save('changeOrders', updCO);
    save('contracts', updContracts);
    setRevId(null); setCmt('');
  }

  const rev    = items.find(i => i.id === revId);
  const delItem = delId ? items.find(i => i.id === delId) : null;
  const sColor = { submitted:'#3498db', inReview:YL, converted:GN, rejected:RD, approved:GN };
  const sLabel = { submitted: t.submitted, inReview: t.inReview, converted:'Zum Auftrag',
                   rejected: t.rejected, approved: t.approved };

  return (
    <div>
      <PH title={t.co}>
        <Btn onClick={() => {
          setF(ef); setEditId(null); setShow(s => !s);
        }}>+ {t.add}</Btn>
      </PH>

      {show && (
        <IForm
          title={editId ? `${t.edit} ${t.co}` : `${t.add} ${t.co}`}
          onClose={() => { setShow(false); setEditId(null); setF(ef); }}
        >
          <Fi label={t.title}      value={f.title}      onChange={v => setF({ ...f, title:v })}/>
          <Fi label={t.contractor} value={f.contractor} onChange={v => setF({ ...f, contractor:v })}
              ph="Auftragnehmer / Müteahhit"/>
          <Ft label={t.desc}       value={f.desc}       onChange={v => setF({ ...f, desc:v })}/>
          <Fi label={t.amount}     value={f.amount}     onChange={v => setF({ ...f, amount:v })} type="number"/>

          <PicUpload
            onPhoto={p => setF({ ...f, photos: [...f.photos, p] })}
            t={t}
            uploadFile={uploadFile}
            folder="changeorders"
          />
          <Thumbs photos={f.photos}/>

          <div style={{ display:'flex', gap:8, marginTop:8 }}>
            <Btn outline onClick={() => { setShow(false); setEditId(null); setF(ef); }}>
              {t.cancel}
            </Btn>
            <Btn onClick={submit}>
              {editId ? t.save : t.submitted}
            </Btn>
          </div>
        </IForm>
      )}

      {/* V15: Lösch-Bestätigung */}
      {delItem && isAdmin && (
        <IForm
          title={`${t.co} ${t.really_delete}`}
          onClose={() => setDelId(null)}
        >
          <div style={{ fontSize:13, marginBottom:14 }}>
            <div style={{
              background: RD + '15', padding:'10px 12px',
              borderRadius:8, marginBottom:10
            }}>
              <div style={{ fontWeight:'bold', color:RD, marginBottom:4 }}>
                {delItem.title}
              </div>
              {delItem.contractor && (
                <div style={{ fontSize:12, color:GR }}>🏢 {delItem.contractor}</div>
              )}
              <div style={{ fontSize:12, color:GR, marginTop:2 }}>
                💶 {(delItem.amount || 0).toLocaleString()} €
              </div>
              <div style={{ fontSize:11, color:GR, marginTop:4 }}>
                📅 {delItem.date} · 👤 {delItem.by} · Status: {sLabel[delItem.status] || delItem.status}
              </div>
            </div>
            <div style={{ color:RD, fontWeight:'bold' }}>
              {t.really_delete}
            </div>
            <div style={{ fontSize:11, color:GR, marginTop:4 }}>
              Diese Aktion kann nicht rückgängig gemacht werden / Bu işlem geri alınamaz
            </div>
          </div>
          <div style={{ display:'flex', gap:8 }}>
            <Btn outline onClick={() => setDelId(null)}>{t.cancel}</Btn>
            <Btn danger onClick={() => del(delId)}>🗑 {t.delete}</Btn>
          </div>
        </IForm>
      )}

      {rev && isAdmin && (
        <IForm title={`Nachtrag prüfen: ${rev.title}`} onClose={() => setRevId(null)}>
          <div style={{
            background:LT, borderRadius:8, padding:12,
            marginBottom:12, fontSize:13
          }}>
            {rev.contractor && <div><b>{t.contractor}:</b> {rev.contractor}</div>}
            <div><b>{t.desc}:</b> {rev.desc}</div>
            <div><b>{t.amount}:</b> {(rev.amount || 0).toLocaleString()} €</div>
            <div style={{ fontSize:11, color:GR, marginTop:4 }}>
              👤 {rev.by} · 📅 {rev.date}
            </div>
          </div>
          <Thumbs photos={rev.photos}/>
          <Ft label={t.comment} value={cmt} onChange={setCmt}/>
          <div style={{ display:'flex', gap:8, marginTop:4 }}>
            <Btn danger onClick={() => doReject(rev.id)}>✕ {t.reject}</Btn>
            <Btn col={GN} onClick={() => doConvert(rev.id)}>📋 Zum Auftrag</Btn>
          </div>
        </IForm>
      )}

      {items.length === 0 && (
        <Card><div style={{ color:GR, textAlign:'center', padding:20 }}>{t.no_data}</div></Card>
      )}

      {items.map(item => {
        const sc = sColor[item.status] || GR;
        const sl = sLabel[item.status] || item.status;
        return (
          <Card key={item.id}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:'bold', color:P, fontSize:14, marginBottom:4 }}>
                  {item.title}<CopyBtn text={item.title} t={t} sm/>
                </div>
                {item.contractor && (
                  <div style={{ fontSize:12, color:GR }}>🏢 {item.contractor}</div>
                )}
                {item.desc && (
                  <div style={{ fontSize:12, color:GR, marginTop:2 }}>
                    {item.desc}<CopyBtn text={item.desc} t={t} sm/>
                  </div>
                )}
                <div style={{ fontSize:11, color:GR, marginTop:3 }}>
                  📅 {item.date} · 👤 {item.by}
                </div>
                {item.comment && (
                  <div style={{ fontSize:12, color:GR, marginTop:3, fontStyle:'italic' }}>
                    💬 {item.comment} ({item.revBy})
                  </div>
                )}
                {item.status === 'converted' && (
                  <div style={{ fontSize:11, color:GN, marginTop:4, fontWeight:'bold' }}>
                    ✓ Als Vertrag übernommen
                  </div>
                )}
                <Thumbs photos={item.photos}/>
              </div>
              <div style={{ textAlign:'right', marginLeft:12, flexShrink:0 }}>
                <div style={{ fontSize:16, fontWeight:'bold', color:P, marginBottom:6 }}>
                  {(item.amount || 0).toLocaleString()} €
                </div>
                <span style={{
                  padding:'2px 9px', background: sc + '25', color: sc,
                  borderRadius:10, fontSize:11, fontWeight:'bold'
                }}>{sl}</span>

                {isAdmin && item.status === 'submitted' && (
                  <div style={{ marginTop:8 }}>
                    <Btn sm onClick={() => { setRevId(item.id); setCmt(''); }}>
                      🔍 {t.review}
                    </Btn>
                  </div>
                )}

                {/* V15: Edit + Delete für Admin in jedem Status */}
                {isAdmin && (
                  <div style={{
                    marginTop:8, display:'flex', flexDirection:'column',
                    gap:4, alignItems:'flex-end'
                  }}>
                    <Btn sm outline onClick={() => openEdit(item)}>
                      ✏️ {t.edit}
                    </Btn>
                    <Btn sm danger onClick={() => setDelId(item.id)}>
                      🗑 {t.delete}
                    </Btn>
                  </div>
                )}
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
