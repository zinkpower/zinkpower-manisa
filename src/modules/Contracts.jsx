// ZINKPOWER Manisa — modules/Contracts.jsx V17
// V17: Budget-Übersicht oben im Modul (4 Kacheln + Auslastungsbalken)
//      - Verträge: Anzahl
//      - Gebunden: Summe aller Vertragsbeträge
//      - Restbudget für neue Aufträge: Gesamtbudget − Gebunden
//      - Auslastung: Prozent (Gebunden / Gesamtbudget)
//      - Farbiger Fortschrittsbalken wie im Budget-Modul
//      - Quelle: data.budget.total (im Budget-Modul gepflegt)
// V12: Storage bereits aktiv
import { useState, useRef } from "react";
import {
  P, GR, LT, GN, YL, RD,
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

  // V17: Budget-Berechnungen
  const committed   = items.reduce((s, c) => s + (c.amount || 0), 0);
  const totalBudget = (data.budget && data.budget.total) || 0;
  const remaining   = totalBudget - committed;
  const pct         = totalBudget > 0
    ? Math.min(100, (committed / totalBudget) * 100)
    : 0;
  const barColor = pct > 90 ? RD : pct > 70 ? YL : GN;

  // Mio-Formatierung für große Beträge
  function fmtM(v) {
    return (v / 1e6).toFixed(2) + 'M €';
  }

  return (
    <div>
      <PH title={t.contracts}>
        {canEdit && <Btn onClick={() => { setShow(s => !s); setF(ef); }}>+ {t.add}</Btn>}
      </PH>

      {/* V17: 4-Kachel-Übersicht */}
      <div style={{
        display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(150px, 1fr))',
        gap:10, marginBottom:12
      }}>
        {/* Verträge (Anzahl) */}
        <div style={{
          background:'#fff', borderRadius:10, padding:'12px 14px',
          boxShadow:'0 1px 8px rgba(40,56,152,0.07)',
          borderTop:`3px solid ${P}`
        }}>
          <div style={{ fontSize:11, color:GR, marginBottom:4 }}>{t.contracts}</div>
          <div style={{ fontSize:22, fontWeight:'bold', color:P }}>{items.length}</div>
        </div>

        {/* Gebunden */}
        <div style={{
          background:'#fff', borderRadius:10, padding:'12px 14px',
          boxShadow:'0 1px 8px rgba(40,56,152,0.07)',
          borderTop:`3px solid ${P}`
        }}>
          <div style={{ fontSize:11, color:GR, marginBottom:4 }}>{t.committed}</div>
          <div style={{ fontSize:22, fontWeight:'bold', color:P }}>{fmtM(committed)}</div>
        </div>

        {/* Restbudget für neue Aufträge */}
        <div style={{
          background:'#fff', borderRadius:10, padding:'12px 14px',
          boxShadow:'0 1px 8px rgba(40,56,152,0.07)',
          borderTop:`3px solid ${remaining >= 0 ? GN : RD}`
        }}>
          <div style={{ fontSize:11, color:GR, marginBottom:4 }}>
            Restbudget / Kalan B&uuml;t&ccedil;e
          </div>
          <div style={{
            fontSize:22, fontWeight:'bold',
            color: remaining >= 0 ? GN : RD
          }}>
            {fmtM(remaining)}
          </div>
          {totalBudget === 0 && (
            <div style={{ fontSize:10, color:YL, marginTop:2 }}>
              ⚠️ Budget nicht gesetzt
            </div>
          )}
        </div>

        {/* Auslastung */}
        <div style={{
          background:'#fff', borderRadius:10, padding:'12px 14px',
          boxShadow:'0 1px 8px rgba(40,56,152,0.07)',
          borderTop:`3px solid ${barColor}`
        }}>
          <div style={{ fontSize:11, color:GR, marginBottom:4 }}>
            Auslastung / Kullan&#305;m
          </div>
          <div style={{ fontSize:22, fontWeight:'bold', color:barColor }}>
            {pct.toFixed(1)}%
          </div>
        </div>
      </div>

      {/* V17: Fortschrittsbalken */}
      {totalBudget > 0 && (
        <Card>
          <div style={{
            fontSize:12, color:GR, marginBottom:8,
            display:'flex', justifyContent:'space-between'
          }}>
            <span>
              {t.committed}: {committed.toLocaleString()} € von {totalBudget.toLocaleString()} €
            </span>
            <span style={{ fontWeight:'bold', color:barColor }}>
              {pct.toFixed(1)}%
            </span>
          </div>
          <div style={{
            height:24, background:'#eef0f6',
            borderRadius:10, overflow:'hidden'
          }}>
            <div style={{
              height:'100%', width: pct + '%',
              background: barColor,
              borderRadius:10, transition:'width 0.5s',
              display:'flex', alignItems:'center', justifyContent:'center',
              fontSize:11, fontWeight:'bold', color:'#fff'
            }}>
              {pct > 8 ? `${committed.toLocaleString()} €` : ''}
            </div>
          </div>
          <div style={{
            fontSize:11, color:GR, marginTop:6, fontStyle:'italic'
          }}>
            ℹ️ Budget wird im Budget-Modul gepflegt / Bütçe, Bütçe modülünde yönetilir
          </div>
        </Card>
      )}

      {totalBudget === 0 && (
        <Card>
          <div style={{
            background: YL + '15', borderRadius:8, padding:'10px 14px',
            fontSize:12, color:'#7a5500'
          }}>
            ⚠️ Gesamtbudget ist noch nicht gesetzt. Bitte im Budget-Modul festlegen.
            <br/>
            Toplam bütçe henüz belirlenmedi. Lütfen Bütçe modülünde ayarlayın.
          </div>
        </Card>
      )}

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
