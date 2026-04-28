// ZINKPOWER Manisa — modules/ChangeOrders.jsx V12
// Fix: uploadFile prop + folder="changeorders"
import { useState } from "react";
import {
  P, GR, LT, GN, YL, RD,
  Btn, Card, IForm, Fi, Ft, PicUpload, Thumbs, PH, CopyBtn,
} from "../core.jsx";

export default function ChangeOrders({ data, save, uploadFile, user, t }) {
  const [items,  setItems]  = useState(() => data.changeOrders || []);
  const [show,   setShow]   = useState(false);
  const [revId,  setRevId]  = useState(null);
  const [cmt,    setCmt]    = useState('');
  const ef = { title:'', desc:'', amount:'', contractor:'', photos:[] };
  const [f, setF] = useState(ef);
  const isAdmin = user.role === 'admin';

  function submit() {
    const u = [...items, {
      ...f, id: Date.now(), amount: Number(f.amount),
      status:'submitted', by: user.name,
      date: new Date().toISOString().split('T')[0]
    }];
    setItems(u); save('changeOrders', u); setShow(false); setF(ef);
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
  const sColor = { submitted:'#3498db', inReview:YL, converted:GN, rejected:RD, approved:GN };
  const sLabel = { submitted: t.submitted, inReview: t.inReview, converted:'Zum Auftrag',
                   rejected: t.rejected, approved: t.approved };

  return (
    <div>
      <PH title={t.co}><Btn onClick={() => setShow(s => !s)}>+ {t.add}</Btn></PH>

      {show && (
        <IForm title={`${t.add} ${t.co}`} onClose={() => setShow(false)}>
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
            <Btn outline onClick={() => setShow(false)}>{t.cancel}</Btn>
            <Btn onClick={submit}>{t.submitted}</Btn>
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
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
