// ZINKPOWER Manisa — modules/Documents.jsx V12
// Wie V11: Storage bereits aktiv
import { useState, useRef } from "react";
import {
  P, GR, GN, RD,
  Btn, Card, IForm, Fi, Ft, Fs, PH,
} from "../core.jsx";

export default function Documents({ data, save, uploadFile, user, t }) {
  const [items,    setItems]    = useState(() => data.documents || []);
  const [show,     setShow]     = useState(false);
  const [viewFile, setViewFile] = useState(null);
  const [delId,    setDelId]    = useState(null);
  const [uploading,setUploading]= useState(false);
  const today = new Date().toISOString().split('T')[0];

  const ef = {
    title:'', category:'plan', version:'1.0', notes:'', date: today,
    fileUrl:null, fileName:'', rawFile:null
  };
  const [f, setF] = useState(ef);

  const isAdmin   = user.role === 'admin';
  const canUpload = user.role === 'admin' || (user.permissions || []).includes('documents');
  const fileRef   = useRef(null);
  const ci = { plan:'📐', permit:'🏛️', report:'📊', certificate:'🏆', contract:'📄', other:'📎' };

  function handleFile(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    setF(prev => ({ ...prev, rawFile: file, fileName: file.name }));
    e.target.value = '';
  }
  function isImage(url) {
    return /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(url) || url.startsWith('data:image');
  }
  function getFileUrl(item) { return item.fileUrl || item.file || null; }

  async function add() {
    if (!f.title) return;
    let fileUrl = null;
    if (f.rawFile) {
      setUploading(true);
      fileUrl = await uploadFile(f.rawFile, 'documents');
      setUploading(false);
      if (!fileUrl) return;
    }
    const u = [...items, { ...f, id: Date.now(), by: user.name, fileUrl, rawFile: undefined }];
    setItems(u); save('documents', u); setShow(false); setF(ef);
  }
  function del(id) {
    const u = items.filter(i => i.id !== id);
    setItems(u); save('documents', u); setDelId(null);
  }

  return (
    <div>
      <PH title={t.docs}>
        {canUpload && <Btn onClick={() => { setShow(s => !s); setF(ef); }}>+ {t.add}</Btn>}
      </PH>

      {show && canUpload && (
        <IForm title={`${t.add} ${t.docs}`} onClose={() => setShow(false)}>
          <Fi label={`${t.title} *`} value={f.title} onChange={v => setF({ ...f, title:v })}/>
          <Fs
            label={t.category} value={f.category}
            onChange={v => setF({ ...f, category:v })}
            opts={Object.keys(ci).map(c => ({ v:c, l: ci[c] + ' ' + c }))}
          />
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
            <Fi label={t.version} value={f.version} onChange={v => setF({ ...f, version:v })}/>
            <Fi label={t.date}    value={f.date}    onChange={v => setF({ ...f, date:v })}    type="date"/>
          </div>
          <Ft label={t.notes} value={f.notes} onChange={v => setF({ ...f, notes:v })}/>

          <div style={{ marginBottom:10 }}>
            <label style={{ display:'block', fontSize:11, color:GR, marginBottom:4 }}>
              📎 Datei / Dosya (PDF, Bild)
            </label>
            <input
              ref={fileRef} type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,image/*"
              onChange={handleFile} style={{ display:'none' }}
            />
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <Btn sm outline onClick={() => fileRef.current && fileRef.current.click()}>
                📎 Datei wählen / Dosya Seç
              </Btn>
              {f.fileName && <span style={{ fontSize:12, color:GN }}>✓ {f.fileName}</span>}
            </div>
            {!f.fileName && (
              <div style={{ fontSize:11, color:GR, marginTop:4, fontStyle:'italic' }}>
                Ohne Datei wird nur ein Register-Eintrag erstellt.
              </div>
            )}
          </div>

          <div style={{ display:'flex', gap:8 }}>
            <Btn outline onClick={() => setShow(false)}>{t.cancel}</Btn>
            <Btn disabled={!f.title || uploading} onClick={add}>
              {uploading ? '⏳ Upload…' : t.save}
            </Btn>
          </div>
        </IForm>
      )}

      {viewFile && (
        <IForm title="📎 Dokument" onClose={() => setViewFile(null)}>
          {isImage(viewFile.data) ? (
            <img src={viewFile.data} alt={viewFile.name || 'Dokument'} style={{ width:'100%', borderRadius:8 }}/>
          ) : (
            <div style={{ textAlign:'center', padding:20 }}>
              <div style={{ fontSize:40, marginBottom:12 }}>📄</div>
              <div style={{ fontSize:13, color:GR, marginBottom:12 }}>{viewFile.name || 'Dokument'}</div>
              <a href={viewFile.data} target="_blank" rel="noreferrer" download={viewFile.name || 'dokument'}>
                <Btn>⬇️ Herunterladen / İndir</Btn>
              </a>
            </div>
          )}
        </IForm>
      )}

      {delId && isAdmin && (
        <IForm title={`${t.docs} ${t.really_delete}`} onClose={() => setDelId(null)}>
          <div style={{ fontSize:13, marginBottom:14 }}>
            <b style={{ color:RD }}>{items.find(i => i.id === delId)?.title}</b> {t.really_delete}
          </div>
          <div style={{ display:'flex', gap:8 }}>
            <Btn outline onClick={() => setDelId(null)}>{t.cancel}</Btn>
            <Btn danger onClick={() => del(delId)}>{t.delete}</Btn>
          </div>
        </IForm>
      )}

      {items.length === 0 ? (
        <Card><div style={{ color:GR, textAlign:'center', padding:20 }}>{t.no_data}</div></Card>
      ) : (
        items.map(item => (
          <Card key={item.id}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
              <div style={{ flex:1 }}>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
                  <span style={{ fontSize:18 }}>{ci[item.category] || '📎'}</span>
                  <div>
                    <div style={{ fontWeight:'bold', color:P, fontSize:14 }}>{item.title}</div>
                    <div style={{ fontSize:11, color:GR }}>
                      {item.category} · v{item.version} · {item.date} · 👤 {item.by}
                    </div>
                  </div>
                </div>
                {item.notes && <div style={{ fontSize:12, color:GR, marginTop:3 }}>{item.notes}</div>}
                <div style={{ marginTop:8, display:'flex', gap:6, flexWrap:'wrap' }}>
                  {getFileUrl(item) ? (
                    <Btn sm outline onClick={() => setViewFile({ data: getFileUrl(item), name: item.fileName })}>
                      📎 {item.fileName || 'Dokument öffnen'}
                    </Btn>
                  ) : (
                    <span style={{ fontSize:11, color:GR, fontStyle:'italic' }}>
                      Kein Dokument angehängt
                    </span>
                  )}
                </div>
              </div>
              <div style={{ marginLeft:12, flexShrink:0 }}>
                {isAdmin && <Btn sm danger onClick={() => setDelId(item.id)}>✕</Btn>}
              </div>
            </div>
          </Card>
        ))
      )}
    </div>
  );
}
