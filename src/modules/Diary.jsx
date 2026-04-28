// ZINKPOWER Manisa — modules/Diary.jsx V12
// HAUPTFIX: Fotos werden jetzt nach Supabase Storage hochgeladen statt als Base64
// im JSON gespeichert. Damit funktionieren neue Einträge wieder.
import { useState, useEffect } from "react";
import {
  P, GR, LT, GN, YL, RD,
  MNAMES, DNAMES,
  Btn, Card, IForm, Fi, Ft, PicUpload, Thumbs, PH, CopyBtn,
} from "../core.jsx";

export default function Diary({ data, save, uploadFile, user, t }) {
  const [items, setItems]       = useState(() => data.diary || []);
  const [show, setShow]         = useState(false);
  const [wx, setWx]             = useState(null);
  const [wxStatus, setWxStatus] = useState('loading');
  const today = new Date().toISOString().split('T')[0];
  const now   = new Date();
  const [calYear,  setCalYear]  = useState(now.getFullYear());
  const [calMonth, setCalMonth] = useState(now.getMonth());
  const [selDay,   setSelDay]   = useState(today);
  const ef = { date: today, workers: '', work_done: '', special: '', photos: [], wx: null };
  const [f, setF] = useState(ef);

  // ── Wetter laden (Manisa) ─────────────────────────────────────
  useEffect(() => {
    fetch('https://api.open-meteo.com/v1/forecast?latitude=38.62&longitude=27.43&current=temperature_2m,weathercode,wind_speed_10m&timezone=Europe%2FIstanbul')
      .then(r => r.json())
      .then(d => {
        if (d && d.current) {
          setWx({
            temp: Math.round(d.current.temperature_2m),
            code: d.current.weathercode,
            wind: Math.round(d.current.wind_speed_10m)
          });
          setWxStatus('ok');
        } else {
          setWxStatus('error');
        }
      })
      .catch(() => setWxStatus('error'));
  }, []);

  function wi(c) {
    if (c == null) return '🌡️';
    if (c === 0) return '☀️';
    if (c <= 3)  return '⛅';
    if (c <= 48) return '🌫️';
    if (c <= 67) return '🌧️';
    if (c <= 77) return '❄️';
    return '⛈️';
  }

  function add() {
    const u = [
      ...items,
      { ...f, id: Date.now(), createdDate: today, author: user.name }
    ].sort((a, b) => b.date.localeCompare(a.date));
    setItems(u);
    save('diary', u);
    setShow(false);
  }

  // ── Kalender-Logik ────────────────────────────────────────────
  const daysInMonth  = new Date(calYear, calMonth + 1, 0).getDate();
  const firstWeekday = (new Date(calYear, calMonth, 1).getDay() + 6) % 7;
  const monthStr     = `${calYear}-${String(calMonth + 1).padStart(2, '0')}`;
  const entryDays    = new Set(items.filter(i => (i.date || '').startsWith(monthStr)).map(i => i.date));
  const selEntries   = items.filter(i => i.date === selDay);

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
      <PH title={t.diary}>
        <Btn onClick={() => {
          setF({ ...ef, date: selDay || today, wx: wx ? { ...wx } : null });
          setShow(true);
        }}>+ {t.new_entry}</Btn>
      </PH>

      {/* Wetter-Karte */}
      <Card>
        <div style={{ display:'flex', alignItems:'center', gap:14 }}>
          <div style={{ fontSize:28 }}>
            {wxStatus === 'ok' ? wi(wx.code) : wxStatus === 'error' ? '📡' : '⏳'}
          </div>
          <div>
            <b style={{ color:P }}>Manisa</b>
            {wxStatus === 'ok' && (
              <div style={{ fontSize:13, color:GR }}>{wx.temp}°C · 💨 {wx.wind} km/h</div>
            )}
            {wxStatus === 'loading' && <div style={{ fontSize:12, color:GR }}>{t.loading}</div>}
            {wxStatus === 'error' && (
              <div style={{ fontSize:12, color:YL }}>Wetterdaten nicht verfügbar</div>
            )}
          </div>
        </div>
      </Card>

      {/* Kalender */}
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
            const isToday  = ds === today;
            const isSel    = ds === selDay;
            const hasEntry = entryDays.has(ds);
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
                {hasEntry && (
                  <div style={{
                    position:'absolute', bottom:2, left:'50%',
                    transform:'translateX(-50%)', width:5, height:5,
                    borderRadius:'50%', background: isSel ? '#fff' : P
                  }}/>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      {/* Neuer-Eintrag-Formular */}
      {show && (
        <IForm title={t.new_entry} onClose={() => setShow(false)}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
            <Fi
              label="Eintrag für / Hangi Gün İçin"
              value={f.date}
              onChange={v => setF({ ...f, date:v })}
              type="date"
            />
            <div style={{
              background:LT, borderRadius:6, padding:'7px 10px',
              fontSize:12, color:GR
            }}>
              <div style={{ fontWeight:'bold', marginBottom:2 }}>Eingereicht am</div>
              <div style={{ color:P, fontWeight:'bold' }}>{today}</div>
            </div>
          </div>

          <Fi label={t.workers} value={f.workers} onChange={v => setF({ ...f, workers:v })}/>
          <Ft label={t.work_done} value={f.work_done} onChange={v => setF({ ...f, work_done:v })} rows={4}/>
          <Ft label={t.special}   value={f.special}   onChange={v => setF({ ...f, special:v })}/>

          {/* V12: uploadFile & folder werden an PicUpload weitergereicht */}
          <PicUpload
            onPhoto={p => setF({ ...f, photos: [...f.photos, p] })}
            t={t}
            uploadFile={uploadFile}
            folder="diary"
          />
          <Thumbs photos={f.photos}/>

          {f.wx && (
            <div style={{
              background:LT, borderRadius:6, padding:'7px 12px',
              fontSize:12, color:GR, margin:'8px 0'
            }}>
              {wi(f.wx.code)} {f.wx.temp}°C – wird gespeichert
            </div>
          )}

          <div style={{ display:'flex', gap:8 }}>
            <Btn outline onClick={() => setShow(false)}>{t.cancel}</Btn>
            <Btn onClick={add}>{t.save}</Btn>
          </div>
        </IForm>
      )}

      {/* Einträge des ausgewählten Tags */}
      {selDay && (
        <div>
          <div style={{
            fontSize:13, fontWeight:'bold', color:P, marginBottom:10,
            padding:'8px 14px', background:LT, borderRadius:8,
            display:'flex', justifyContent:'space-between', alignItems:'center'
          }}>
            <span>📅 {selDay}</span>
            <span style={{ fontWeight:'normal', color:GR, fontSize:12 }}>
              {selEntries.length === 0
                ? 'Kein Eintrag'
                : `${selEntries.length} Eintrag${selEntries.length > 1 ? 'e' : ''}`}
            </span>
          </div>

          {selEntries.length === 0 ? (
            <div style={{ textAlign:'center', padding:'16px 0', color:GR, fontSize:13 }}>
              <div style={{ marginBottom:10 }}>Noch kein Eintrag für diesen Tag.</div>
              <Btn sm onClick={() => {
                setF({ ...ef, date: selDay, wx: wx ? { ...wx } : null });
                setShow(true);
              }}>+ Eintrag für diesen Tag</Btn>
            </div>
          ) : (
            selEntries.map(e => (
              <Card key={e.id}>
                <div style={{
                  display:'flex', justifyContent:'space-between',
                  marginBottom:6, flexWrap:'wrap', gap:6
                }}>
                  <div>
                    <b style={{ color:P }}>Arbeitstag: {e.date}</b>
                    {e.createdDate && e.createdDate !== e.date && (
                      <div style={{ fontSize:11, color:YL, marginTop:2 }}>
                        ⏱ Eingetragen am: {e.createdDate}
                      </div>
                    )}
                  </div>
                  <div style={{ display:'flex', gap:10, fontSize:11, color:GR }}>
                    {e.wx && <span>{wi(e.wx.code)} {e.wx.temp}°C</span>}
                    <span>👤 {e.author}</span>
                  </div>
                </div>
                {e.workers   && <div style={{ fontSize:12, color:GR, marginBottom:2 }}>👷 {e.workers}</div>}
                {e.work_done && (
                  <div style={{ fontSize:13, marginBottom:2 }}>
                    {e.work_done}<CopyBtn text={e.work_done} t={t} sm/>
                  </div>
                )}
                {e.special && (
                  <div style={{ fontSize:12, color:YL, fontStyle:'italic' }}>
                    ⚠️ {e.special}<CopyBtn text={e.special} t={t} sm/>
                  </div>
                )}
                <Thumbs photos={e.photos}/>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
}
