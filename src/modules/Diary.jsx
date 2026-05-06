// ZINKPOWER Manisa — modules/Diary.jsx V14
// V14: Klick auf Foto-Thumbnail öffnet Großansicht (wie in Gallery)
// V13: Admin kann Bautagebuch-Einträge löschen
// V12: Fotos werden nach Supabase Storage hochgeladen statt als Base64
import { useState, useEffect } from "react";
import {
  P, GR, LT, GN, YL, RD,
  MNAMES, DNAMES,
  Btn, Card, IForm, Fi, Ft, PicUpload, PH, CopyBtn,
} from "../core.jsx";

export default function Diary({ data, save, uploadFile, user, t }) {
  const [items, setItems]       = useState(() => data.diary || []);
  const [show, setShow]         = useState(false);
  const [delId, setDelId]       = useState(null);
  const [bigPhoto, setBigPhoto] = useState(null);   // V14: Großansicht
  const [wx, setWx]             = useState(null);
  const [wxStatus, setWxStatus] = useState('loading');
  const today = new Date().toISOString().split('T')[0];
  const now   = new Date();
  const [calYear,  setCalYear]  = useState(now.getFullYear());
  const [calMonth, setCalMonth] = useState(now.getMonth());
  const [selDay,   setSelDay]   = useState(today);
  const ef = { date: today, workers: '', work_done: '', special: '', photos: [], wx: null };
  const [f, setF] = useState(ef);
  const isAdmin = user.role === 'admin';

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

  function del(id) {
    const u = items.filter(i => i.id !== id);
    setItems(u);
    save('diary', u);
    setDelId(null);
  }

  // ── Kalender ──────────────────────────────────────────────────
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

  const delEntry = delId ? items.find(i => i.id === delId) : null;

  // ── V14: Klickbare Thumbnails ─────────────────────────────────
  function ClickableThumbs({ photos, entry }) {
    if (!photos || !photos.length) return null;
    return (
      <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginTop:8 }}>
        {photos.map((p, i) => (
          <img
            key={i}
            src={p}
            alt=""
            onClick={() => setBigPhoto({
              src: p,
              date: entry?.date,
              author: entry?.author,
              index: i + 1,
              total: photos.length
            })}
            style={{
              width:54, height:54, objectFit:'cover',
              borderRadius:6, border:`2px solid ${LT}`,
              cursor:'pointer',
              transition:'transform 0.15s, border-color 0.15s'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'scale(1.05)';
              e.currentTarget.style.borderColor = P;
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.borderColor = LT;
            }}
          />
        ))}
      </div>
    );
  }

  return (
    <div>
      {/* V14: Großansichts-Overlay */}
      {bigPhoto && (
        <div
          onClick={() => setBigPhoto(null)}
          style={{
            position:'fixed', inset:0, background:'rgba(0,0,0,0.92)',
            zIndex:9999, display:'flex', flexDirection:'column',
            alignItems:'center', justifyContent:'center',
            padding:16, cursor:'pointer'
          }}
        >
          <img
            src={bigPhoto.src}
            alt=""
            style={{
              maxWidth:'100%', maxHeight:'85vh',
              objectFit:'contain', borderRadius:8,
              boxShadow:'0 8px 32px rgba(0,0,0,0.5)'
            }}
          />
          <div style={{
            color:'#fff', fontSize:13, marginTop:14,
            textAlign:'center', lineHeight:1.5
          }}>
            {bigPhoto.date && <div>📅 {bigPhoto.date}</div>}
            {bigPhoto.author && <div>👤 {bigPhoto.author}</div>}
            {bigPhoto.total > 1 && (
              <div style={{ opacity:0.7 }}>
                {bigPhoto.index} / {bigPhoto.total}
              </div>
            )}
            <div style={{ marginTop:8, fontSize:11, opacity:0.6 }}>
              Klick zum Schließen / Kapatmak için tıkla
            </div>
          </div>
        </div>
      )}

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

          <PicUpload
            onPhoto={p => setF({ ...f, photos: [...f.photos, p] })}
            t={t}
            uploadFile={uploadFile}
            folder="diary"
          />
          <ClickableThumbs photos={f.photos} entry={null}/>

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

      {/* Lösch-Bestätigungs-Dialog */}
      {delEntry && isAdmin && (
        <IForm
          title={`${t.diary} ${t.really_delete}`}
          onClose={() => setDelId(null)}
        >
          <div style={{ fontSize:13, marginBottom:14 }}>
            <div style={{
              background: RD + '15', padding:'10px 12px',
              borderRadius:8, marginBottom:10
            }}>
              <div style={{ fontWeight:'bold', color:RD, marginBottom:4 }}>
                📅 {delEntry.date}
              </div>
              {delEntry.author && (
                <div style={{ fontSize:11, color:GR }}>👤 {delEntry.author}</div>
              )}
              {delEntry.work_done && (
                <div style={{ fontSize:12, color:GR, marginTop:6 }}>
                  {delEntry.work_done.length > 120
                    ? delEntry.work_done.slice(0, 120) + '…'
                    : delEntry.work_done}
                </div>
              )}
              {delEntry.photos && delEntry.photos.length > 0 && (
                <div style={{ fontSize:11, color:GR, marginTop:6 }}>
                  📷 {delEntry.photos.length} Foto{delEntry.photos.length > 1 ? 's' : ''}
                </div>
              )}
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
                <ClickableThumbs photos={e.photos} entry={e}/>

                {isAdmin && (
                  <div style={{
                    display:'flex', justifyContent:'flex-end',
                    marginTop:10, paddingTop:8,
                    borderTop:`1px solid ${LT}`
                  }}>
                    <Btn sm danger onClick={() => setDelId(e.id)}>
                      🗑 {t.delete}
                    </Btn>
                  </div>
                )}
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
}
