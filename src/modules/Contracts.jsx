// ZINKPOWER Manisa — modules/Contracts.jsx V12
// Wie V11: Storage bereits aktiv, kein zusätzlicher Fix nötig
import { useState, useRef } from "react";
import {
  P, GR, GN, RD,
  Badge, Btn, Card, IForm, Fi, Ft, PH, CopyBtn,
} from "../core.jsx";

export default function Contracts({ data, save, uploadFile, user, t }) {
  const canSee  = user.role === 'admin'
    || (user.permissions || []).includes('contracts_view')
    || (user.permissions || []).includes('contracts');
  const canEdit = user.role === 'admin' || (user.permissions || []).includes('contracts');

  const [items,    setItems]    = useState(() => data.contracts || []);
  const [show,     setShow]     = useState(false);
  const [delId,    setDelId]    = useState(null);
  const [viewFile, setViewFile] = useState(null);
  const [uploading,setUploading]= useState(false);

  const ef = {
    title:'', contractor:'', amount:'', date:'', status:'active',
    notes:'', fileUrl:null, fileName:'', rawFile:null
  };
  const [f, setF] = useState(ef);
  const isAdmin = user.role === 'admin';
  const fileRef = useRef(null);

  if (!canSee) {
    return (
      <Card>
        <div style={{ color:RD, textAlign:'center', padding:24 }}>
          🔒 Verträge – nur autorisierte Nutzer / Yalnızca yetkili kullanıcılar
        </div>
      </Card>
    );
  }

  function handleFile(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    setF(prev => ({ ...prev, rawFile: file, fileName: file.name }));
    e.target.value = '';
  }
  function isImage(url) {
    return /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(url) || url.startsWith('data:image');
  }
  async function add() {
    if (!f.title || !f.contractor) return;
    let fileUrl = null;
    if (f.rawFile) {
      setUploading(true);
      fileUrl = await uploadFile(f.rawFile, 'contracts');
      setUploading(false);
      if (!fileUrl) return;
    }
    const u = [...items, { ...f, id: Date.now(), amount: Number(f.amount), fileUrl, rawFile: undefined }];
    setItems(u); save('contracts', u); setShow(false); setF(ef);
  }
  function del(id) {
    const u = items.filter(i => i.id !== id);
    setItems(u); save('contracts', u); setDelId(null);
  }
  function getFileUrl(item) { return item.fileUrl || item.file || null; }

  const tot = items.reduce((s, c) => s + (c.amount || 0), 0);

  return (
    <div>
      <PH title={t.contracts}>
        {canEdit && <Btn onClick={() => { setShow(s => !s); setF(ef); }}>+ {t.add}</Btn>}
      </PH>

      <div style={{
        background:'#fff', borderRadius:10, padding:'12px 18px', marginBottom:12,
        boxShadow:'0 1px 8px rgba(40,56,152,0.07)', display:'flex', gap:28
      }}>
        <div>
          <div style={{ fontSize:11, color:GR }}>{t.contracts}</div>
          <div style={{ fontSize:22, fontWeight:'bold', color:P }}>{items.length}</div>
        </div>
        <div>
          <div style={{ fontSize:11, color:GR }}>{t.committed}</div>
          <div style={{ fontSize:22, fontWeight:'bold', color:P }}>{(tot/1e6).toFixed(2)}M €</div>
        </div>
      </div>

      {show && canEdit && (
        <IForm title={`${t.add} ${t.contracts}`} onClose={() => setShow(false)}>
          <Fi label={t.title}      value={f.title}      onChange={v => setF({ ...f, title:v })} ph="z.B. Stahlbau Sipil"/>
          <Fi label={t.contractor} value={f.contractor} onChange={v => setF({ ...f, contractor:v })}/>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
            <Fi label={t.amount} value={f.amount} onChange={v => setF({ ...f, amount:v })} type="number"/>
            <Fi label={t.date}   value={f.date}   onChange={v => setF({ ...f, date:v })}   type="date"/>
          </div>
          <Ft label={t.notes} value={f.notes} onChange={v => setF({ ...f, notes:v })}/>
          <div style={{ marginBottom:10 }}>
            <label style={{ display:'block', fontSize:11, color:GR, marginBottom:4 }}>
              Vertragsdokument (PDF / Bild)
            </label>
            <input
              ref={fileRef} type="file" accept=".pdf,image/*"
              onChange={handleFile} style={{ display:'none' }}
            />
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <Btn sm outline onClick={() => fileRef.current && fileRef.current.click()}>
                📎 Datei wählen / Dosya Seç
              </Btn>
              {f.fileName && <span style={{ fontSize:12, color:GN }}>✓ {f.fileName}</span>}
            </div>
          </div>
          <div style={{ display:'flex', gap:8 }}>
            <Btn outline onClick={() => setShow(false)}>{t.cancel}</Btn>
            <Btn disabled={!f.title || !f.contractor || uploading} onClick={add}>
              {uploading ? '⏳ Upload…' : t.save}
            </Btn>
          </div>
        </IForm>
      )}

      {delId && canEdit && (
        <IForm title={`${t.contracts} ${t.really_delete}`} onClose={() => setDelId(null)}>
          <div style={{ fontSize:13, marginBottom:14 }}>
            <b style={{ color:RD }}>{items.find(i => i.id === delId)?.title}</b> {t.really_delete}
          </div>
          <div style={{ display:'flex', gap:8 }}>
            <Btn outline onClick={() => setDelId(null)}>{t.cancel}</Btn>
            <Btn danger onClick={() => del(delId)}>{t.delete}</Btn>
          </div>
        </IForm>
      )}

      {viewFile && (
        <IForm title="📎 Vertragsdokument" onClose={() => setViewFile(null)}>
          {isImage(viewFile.data) ? (
            <img src={viewFile.data} alt="Vertrag" style={{ width:'100%', borderRadius:8 }}/>
          ) : (
            <div style={{ textAlign:'center', padding:20 }}>
              <div style={{ fontSize:40, marginBottom:12 }}>📄</div>
              <div style={{ fontSize:13, color:GR, marginBottom:12 }}>{viewFile.name || 'Dokument'}</div>
              <a href={viewFile.data} target="_blank" rel="noreferrer" download={viewFile.name || 'vertrag'}>
                <Btn>⬇️ Herunterladen / İndir</Btn>
              </a>
            </div>
          )}
        </IForm>
      )}

      {items.length === 0 ? (
        <Card><div style={{ color:GR, textAlign:'center', padding:20 }}>{t.no_data}</div></Card>
      ) : (
        items.map(item => (
          <Card key={item.id}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:'bold', color:P, fontSize:14, marginBottom:4 }}>
                  {item.title}<CopyBtn text={item.title} t={t} sm/>
                </div>
                <div style={{ fontSize:12, color:GR }}>{t.contractor}: {item.contractor}</div>
                <div style={{ fontSize:12, color:GR }}>{t.date}: {item.date}</div>
                {item.notes && (
                  <div style={{ fontSize:12, color:GR, marginTop:3 }}>
                    {item.notes}<CopyBtn text={item.notes} t={t} sm/>
                  </div>
                )}
                {getFileUrl(item) && (
                  <div style={{ marginTop:8 }}>
                    <Btn sm outline onClick={() => setViewFile({ data: getFileUrl(item), name: item.fileName })}>
                      📎 {item.fileName || 'Dokument'}
                    </Btn>
                  </div>
                )}
              </div>
              <div style={{ textAlign:'right', marginLeft:12, flexShrink:0 }}>
                <div style={{ fontSize:18, fontWeight:'bold', color:P, marginBottom:4 }}>
                  {(item.amount || 0).toLocaleString()} €
                </div>
                <Badge status={item.status} t={t}/>
                {isAdmin && (
                  <div style={{ marginTop:8 }}>
                    <Btn sm danger onClick={() => setDelId(item.id)}>✕</Btn>
                  </div>
                )}
              </div>
            </div>
          </Card>
        ))
      )}
    </div>
  );
}
