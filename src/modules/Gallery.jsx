// ZINKPOWER Manisa — modules/Gallery.jsx V12
// Fix: uploadFile statt FileReader → Storage statt Base64
import { useState, useRef } from "react";
import {
  P, GR, LT,
  MNAMES, DNAMES,
  Btn, Card, PH,
} from "../core.jsx";

export default function Gallery({ data, save, uploadFile, user, t }) {
  const [items,     setItems]     = useState(() => data.gallery || []);
  const [big,       setBig]       = useState(null);
  const [uploading, setUploading] = useState(false);
  const ref = useRef(null);

  const today = new Date().toISOString().split('T')[0];
  const now   = new Date();
  const [calYear,  setCalYear]  = useState(now.getFullYear());
  const [calMonth, setCalMonth] = useState(now.getMonth());
  const [selDay,   setSelDay]   = useState(today);

  async function upload(e) {
    const uploadDate = new Date().toISOString().split('T')[0];
    const files = Array.from(e.target.files || []);
    e.target.value = '';
    if (files.length === 0) return;

    setUploading(true);
    for (const file of files) {
      const url = await uploadFile(file, 'gallery');
      if (!url) continue;
      const entry = {
        id: Date.now() + Math.random(),
        src: url,
        date: uploadDate,
        author: user.name,
        filename: file.name
      };
      setItems(prev => {
        const next = [...prev, entry];
        save('gallery', next);
        return next;
      });
    }
    setUploading(false);
  }

  const daysInMonth  = new Date(calYear, calMonth + 1, 0).getDate();
  const firstWeekday = (new Date(calYear, calMonth, 1).getDay() + 6) % 7;
  const selPhotos    = items.filter(i => i.date === selDay);

  function prevMonth() {
    if (calMonth === 0) { setCalYear(y => y - 1); setCalMonth(11); }
    else setCalMonth(m => m - 1);
  }
  function nextMonth() {
    if (calMonth === 11) { setCalYear(y => y + 1); setCalMonth(0); }
    else setCalMonth(m => m + 1);
  }

  return (
    <div>
      <PH title={t.gallery}>
        <input
          ref={ref} type="file" accept="image/*" multiple
          onChange={upload} style={{ display:'none' }}
        />
        <Btn disabled={uploading} onClick={() => ref.current && ref.current.click()}>
          {uploading ? '⏳ Upload…' : `📷 ${t.upload}`}
        </Btn>
      </PH>

      {big && (
        <div
          onClick={() => setBig(null)}
          style={{
            background:'rgba(0,0,0,0.85)', borderRadius:10, padding:16,
            marginBottom:14, textAlign:'center', cursor:'pointer'
          }}
        >
          <img
            src={big.src} alt=""
            style={{ maxWidth:'100%', maxHeight:'60vh', borderRadius:8 }}
          />
          <div style={{ color:'#fff', fontSize:12, marginTop:6 }}>
            📅 {big.date} · 👤 {big.author}
            {big.filename ? ` · ${big.filename}` : ''}
            · (klicken zum Schließen)
          </div>
        </div>
      )}

      <Card>
        <div style={{
          display:'flex', justifyContent:'space-between',
          alignItems:'center', marginBottom:14
        }}>
          <Btn sm outline onClick={prevMonth}>◀</Btn>
          <b style={{ color:P, fontSize:14 }}>{MNAMES[calMonth]} {calYear}</b>
          <Btn sm outline onClick={nextMonth}>▶</Btn>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:3, marginBottom:4 }}>
          {DNAMES.map(d => (
            <div key={d} style={{
              textAlign:'center', fontSize:11, color:GR,
              fontWeight:'bold', padding:'3px 0'
            }}>{d}</div>
          ))}
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:3 }}>
          {Array(firstWeekday).fill(null).map((_, i) => <div key={'e'+i}/>)}
          {Array(daysInMonth).fill(null).map((_, i) => {
            const day = i + 1;
            const ds = `${calYear}-${String(calMonth+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
            const isToday = ds === today;
            const isSel   = ds === selDay;
            const count   = items.filter(x => x.date === ds).length;
            return (
              <div
                key={day}
                onClick={() => setSelDay(ds)}
                style={{
                  textAlign:'center', padding:'7px 2px', borderRadius:8,
                  cursor:'pointer', position:'relative', fontSize:13,
                  fontWeight: isToday || isSel ? 'bold' : 'normal',
                  background: isSel ? P : isToday ? LT : 'transparent',
                  color: isSel ? '#fff' : isToday ? P : '#333',
                  border: isSel
                    ? `2px solid ${P}`
                    : isToday
                      ? `2px solid ${P}40`
                      : '2px solid transparent'
                }}
              >
                {day}
                {count > 0 && (
                  <div style={{
                    position:'absolute', bottom:1, left:'50%',
                    transform:'translateX(-50%)',
                    fontSize:9, fontWeight:'bold',
                    color: isSel ? '#fff' : P, lineHeight:1
                  }}>{count > 9 ? '9+' : count}</div>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      <div>
        <div style={{
          fontSize:13, fontWeight:'bold', color:P, marginBottom:10,
          padding:'8px 14px', background:LT, borderRadius:8,
          display:'flex', justifyContent:'space-between', alignItems:'center'
        }}>
          <span>📅 {selDay}</span>
          <span style={{ fontWeight:'normal', color:GR, fontSize:12 }}>
            {selPhotos.length === 0
              ? 'Keine Fotos'
              : `${selPhotos.length} Foto${selPhotos.length > 1 ? 's' : ''}`}
          </span>
        </div>

        {selPhotos.length === 0 ? (
          <div style={{ textAlign:'center', padding:'16px 0', color:GR, fontSize:13 }}>
            An diesem Tag wurden keine Fotos hochgeladen.
          </div>
        ) : (
          <div style={{
            display:'grid',
            gridTemplateColumns:'repeat(auto-fill,minmax(110px,1fr))',
            gap:8
          }}>
            {selPhotos.map(item => (
              <div
                key={item.id}
                onClick={() => setBig(item)}
                style={{
                  cursor:'pointer', borderRadius:8, overflow:'hidden',
                  aspectRatio:'1', background:'#eee', position:'relative'
                }}
              >
                <img
                  src={item.src} alt=""
                  style={{ width:'100%', height:'100%', objectFit:'cover' }}
                />
                <div style={{
                  position:'absolute', bottom:0, left:0, right:0,
                  background:'rgba(0,0,0,0.4)',
                  padding:'2px 5px', fontSize:10, color:'#fff'
                }}>👤 {item.author}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {items.length > 0 && (
        <div style={{ marginTop:16, textAlign:'center', fontSize:12, color:GR }}>
          Gesamt: {items.length} Foto{items.length > 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
}
