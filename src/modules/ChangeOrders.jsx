// ZINKPOWER Manisa — modules/ChangeOrders.jsx V16
// V16: Datei-Anhänge zusätzlich zu Fotos
//      - Mehrere Dateien pro Nachtrag (PDF, Word, Excel, DWG, ZIP, etc.)
//      - Klick auf Datei öffnet sie in neuem Tab
//      - Admin kann einzelne Anhänge wieder entfernen
// V15: Admin kann Nachträge in jedem Status bearbeiten und löschen
// V12: Fix uploadFile prop + folder="changeorders"
import { useRef, useState } from "react";
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
  const ef = { title:'', desc:'', amount:'', contractor:'', photos:[], files:[] };
  const [f, setF] = useState(ef);
  const [uploadingFile, setUploadingFile] = useState(false);   // V16
  const fileRef = useRef(null);                                 // V16
  const isAdmin = user.role === 'admin';

  // V16: Datei-Anhang Upload
  async function handleFile(e) {
    const file = e.target.files && e.target.files[0];
    e.target.value = '';
    if (!file) return;
    setUploadingFile(true);
    const url = await uploadFile(file, 'changeorders');
    setUploadingFile(false);
    if (url) {
      setF(prev => ({
        ...prev,
        files: [...(prev.files || []), { url, name: file.name, size: file.size }]
      }));
    }
  }

  function removeFile(idx) {
    setF(prev => ({
      ...prev,
      files: (prev.files || []).filter((_, i) => i !== idx)
    }));
  }

  // V16: Datei-Icon je nach Endung
  function fileIcon(name) {
    const ext = (name || '').toLowerCase().split('.').pop();
    if (['pdf'].includes(ext)) return '📄';
    if (['doc','docx'].includes(ext)) return '📝';
    if (['xls','xlsx','csv'].includes(ext)) return '📊';
    if (['dwg','dxf'].includes(ext)) return '📐';
    if (['zip','rar','7z'].includes(ext)) return '🗜️';
    if (['jpg','jpeg','png','gif','webp','bmp'].includes(ext)) return '🖼️';
    return '📎';
  }

  function fmtSize(bytes) {
    if (!bytes) return '';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024*1024) return Math.round(bytes/1024) + ' KB';
    return (bytes / (1024*1024)).toFixed(1) + ' MB';
  }

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
      photos:     item.photos     || [],
      files:      item.files      || []
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

          {/* V16: Datei-Anhänge */}
          <div style={{ marginTop:12, marginBottom:8 }}>
            <input
              ref={fileRef}
              type="file"
              accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.dwg,.dxf,.zip,.rar,.7z,.txt,.rtf,image/*"
              onChange={handleFile}
              style={{ display:'none' }}
            />
            <Btn
              sm outline
              disabled={uploadingFile}
              onClick={() => fileRef.current && fileRef.current.click()}
            >
              {uploadingFile ? '⏳ Upload…' : '📎 Datei anhängen / Dosya ekle'}
            </Btn>
          </div>

          {/* V16: Anhang-Liste im Formular */}
          {(f.files || []).length > 0 && (
            <div style={{
              background:'#f8f9fc', borderRadius:6,
              padding:8, marginBottom:10
            }}>
              {f.files.map((file, idx) => (
                <div key={idx} style={{
                  display:'flex', alignItems:'center', gap:8,
                  padding:'4px 6px', fontSize:12
                }}>
                  <span style={{ fontSize:14 }}>{fileIcon(file.name)}</span>
                  <span style={{
                    flex:1, color:P, fontWeight:'bold',
                    overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'
                  }}>{file.name}</span>
                  {file.size && (
                    <span style={{ fontSize:10, color:GR, flexShrink:0 }}>
                      {fmtSize(file.size)}
                    </span>
                  )}
                  <button
                    onClick={() => removeFile(idx)}
                    style={{
                      background:'none', border:'none', color:RD,
                      cursor:'pointer', fontSize:14, padding:'0 4px',
                      flexShrink:0
                    }}
                    title="Entfernen / Kaldır"
                  >✕</button>
                </div>
              ))}
            </div>
          )}

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

          {/* V16: Anhänge im Review-Dialog */}
          {(rev.files || []).length > 0 && (
            <div style={{ marginTop:8, marginBottom:10, display:'flex', flexDirection:'column', gap:4 }}>
              {rev.files.map((file, idx) => (
                <a
                  key={idx}
                  href={file.url}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display:'flex', alignItems:'center', gap:8,
                    padding:'5px 10px',
                    background: P + '10',
                    borderRadius:6,
                    border: `1px solid ${P}25`,
                    textDecoration:'none',
                    fontSize:12, color:P
                  }}
                >
                  <span style={{ fontSize:14 }}>{fileIcon(file.name)}</span>
                  <span style={{
                    flex:1, fontWeight:'bold',
                    overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'
                  }}>{file.name}</span>
                  {file.size && (
                    <span style={{ fontSize:10, color:GR, flexShrink:0 }}>
                      {fmtSize(file.size)}
                    </span>
                  )}
                  <span style={{ fontSize:11, color:P, flexShrink:0 }}>→</span>
                </a>
              ))}
            </div>
          )}

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

                {/* V16: Datei-Anhänge auf Card anzeigen */}
                {(item.files || []).length > 0 && (
                  <div style={{ marginTop:8, display:'flex', flexDirection:'column', gap:4 }}>
                    {item.files.map((file, idx) => (
                      <a
                        key={idx}
                        href={file.url}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          display:'flex', alignItems:'center', gap:8,
                          padding:'5px 10px',
                          background: P + '10',
                          borderRadius:6,
                          border: `1px solid ${P}25`,
                          textDecoration:'none',
                          fontSize:12, color:P
                        }}
                      >
                        <span style={{ fontSize:14 }}>{fileIcon(file.name)}</span>
                        <span style={{
                          flex:1, fontWeight:'bold',
                          overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'
                        }}>{file.name}</span>
                        {file.size && (
                          <span style={{ fontSize:10, color:GR, flexShrink:0 }}>
                            {fmtSize(file.size)}
                          </span>
                        )}
                        <span style={{ fontSize:11, color:P, flexShrink:0 }}>→</span>
                      </a>
                    ))}
                  </div>
                )}
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
