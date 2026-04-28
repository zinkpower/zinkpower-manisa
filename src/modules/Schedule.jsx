// ZINKPOWER Manisa — modules/Schedule.jsx V12
import { useState } from "react";
import {
  P, GR, LT, GN, YL, RD,
  EF_PHASE,
  Btn, Card, IForm, Fi, Fs, PH,
} from "../core.jsx";

export default function Schedule({ data, save, user, t, isMobile }) {
  const [items,    setItems]    = useState(() => data.schedule || []);
  const [editId,   setEditId]   = useState(null);
  const [form,     setForm]     = useState({});
  const [showAdd,  setShowAdd]  = useState(false);
  const [newF,     setNewF]     = useState(EF_PHASE);
  const [delId,    setDelId]    = useState(null);
  const [hoverId,  setHoverId]  = useState(null);
  const [calOffset,setCalOffset]= useState(0);

  const canEdit = user.role === 'admin' || (user.permissions || []).includes('schedule');
  const today   = new Date().toISOString().split('T')[0];
  const todayD  = new Date(today);
  const sc      = { onTrack: GN, warning: YL, critical: RD };

  const labelW        = isMobile ? 110 : 190;
  const dateW         = isMobile ? 54  : 66;
  const barH          = isMobile ? 22  : 24;
  const WEEKS_VISIBLE = isMobile ? 6   : 12;
  const cellMinW      = isMobile ? 26  : 30;

  const ds = items.flatMap(i => [i.ps, i.pe].filter(Boolean));
  const mn = new Date(ds.length ? ds.reduce((a, b) => a < b ? a : b) : '2025-01-01');
  const mx = new Date(ds.length ? ds.reduce((a, b) => a > b ? a : b) : '2027-01-01');
  const sp = Math.max(1, (mx - mn) / 864e5);
  const pct = d => d ? Math.max(0, Math.min(100, (new Date(d) - mn) / 864e5 / sp * 100)) : 0;
  const tp  = (todayD - mn) / 864e5 / sp * 100;

  function monthMarkers() {
    const out = [];
    const cur = new Date(mn.getFullYear(), mn.getMonth(), 1);
    while (cur <= mx) {
      out.push({
        date: new Date(cur),
        label: String(cur.getMonth() + 1).padStart(2, '0') + '/' + String(cur.getFullYear()).slice(-2)
      });
      cur.setMonth(cur.getMonth() + 1);
    }
    const step = isMobile
      ? (out.length > 12 ? 4 : out.length > 6 ? 2 : 1)
      : (out.length > 18 ? 3 : out.length > 10 ? 2 : 1);
    return out.map((m, i) => ({ ...m, showLabel: i % step === 0 }));
  }

  function phaseInfo(item) {
    if (!item.ps || !item.pe) return null;
    const s = new Date(item.ps), e = new Date(item.pe);
    const dur = Math.round((e - s) / 864e5) + 1;
    const remaining = Math.round((e - todayD) / 864e5);
    let prog = 0;
    if      (todayD <= s) prog = 0;
    else if (todayD >= e) prog = 100;
    else                  prog = Math.round((todayD - s) / (e - s) * 100);
    return { dur, remaining, prog };
  }

  function doSave() {
    const u = items.map(i => i.id === form.id ? { ...form } : i);
    setItems(u); save('schedule', u); setEditId(null);
  }
  function doAdd() {
    if (!newF.phase || !newF.ps || !newF.pe) return;
    const u = [...items, { ...newF, id: Date.now() }];
    setItems(u); save('schedule', u); setShowAdd(false); setNewF(EF_PHASE);
  }
  function doDelete(id) {
    const u = items.filter(i => i.id !== id);
    setItems(u); save('schedule', u); setDelId(null);
  }
  function toggleHover(id) {
    if (isMobile) setHoverId(hoverId === id ? null : id);
  }

  const calStart = new Date(todayD);
  calStart.setDate(calStart.getDate() - calStart.getDay() + 1 + calOffset * 7);
  const calDays = [];
  for (let i = 0; i < WEEKS_VISIBLE * 7; i++) {
    const d = new Date(calStart);
    d.setDate(d.getDate() + i);
    calDays.push(d);
  }
  function activePhases(d) {
    return items.filter(i => i.ps && i.pe && new Date(i.ps) <= d && new Date(i.pe) >= d);
  }
  const markers = monthMarkers();

  return (
    <div>
      <PH title={t.schedule}>
        {canEdit && <Btn onClick={() => { setShowAdd(s => !s); setNewF(EF_PHASE); }}>+ {t.add}</Btn>}
      </PH>

      {!canEdit && (
        <div style={{
          background:'#fff9e6', border:`1px solid ${YL}`, borderRadius:6,
          padding:'6px 12px', marginBottom:10, fontSize:11, color:'#7a5500'
        }}>
          🔒 Nur-Ansicht / Sadece görüntüleme
        </div>
      )}

      {canEdit && showAdd && (
        <IForm title="Neue Phase / Yeni Aşama" onClose={() => setShowAdd(false)}>
          <Fi label={t.phase} value={newF.phase} onChange={v => setNewF({ ...newF, phase:v })}/>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
            <Fi label={`${t.planned} ${t.start}`} value={newF.ps} onChange={v => setNewF({ ...newF, ps:v })} type="date"/>
            <Fi label={`${t.planned} ${t.end}`}   value={newF.pe} onChange={v => setNewF({ ...newF, pe:v })} type="date"/>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
            <Fi label={`${t.actual} ${t.start}`} value={newF.as} onChange={v => setNewF({ ...newF, as:v })} type="date"/>
            <Fi label={`${t.actual} ${t.end}`}   value={newF.ae} onChange={v => setNewF({ ...newF, ae:v })} type="date"/>
          </div>
          <Fs
            label={t.status} value={newF.st}
            onChange={v => setNewF({ ...newF, st:v })}
            opts={['onTrack','warning','critical'].map(s => ({ v:s, l:t[s] }))}
          />
          <div style={{ display:'flex', gap:8 }}>
            <Btn outline onClick={() => setShowAdd(false)}>{t.cancel}</Btn>
            <Btn disabled={!newF.phase || !newF.ps || !newF.pe} onClick={doAdd}>{t.save}</Btn>
          </div>
        </IForm>
      )}

      {editId && (
        <IForm title={`${t.edit}: ${form.phase}`} onClose={() => setEditId(null)}>
          <Fi label={t.phase} value={form.phase || ''} onChange={v => setForm({ ...form, phase:v })}/>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
            <Fi label={`${t.planned} ${t.start}`} value={form.ps || ''} onChange={v => setForm({ ...form, ps:v })} type="date"/>
            <Fi label={`${t.planned} ${t.end}`}   value={form.pe || ''} onChange={v => setForm({ ...form, pe:v })} type="date"/>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
            <Fi label={`${t.actual} ${t.start}`} value={form.as || ''} onChange={v => setForm({ ...form, as:v })} type="date"/>
            <Fi label={`${t.actual} ${t.end}`}   value={form.ae || ''} onChange={v => setForm({ ...form, ae:v })} type="date"/>
          </div>
          <Fs
            label={t.status} value={form.st}
            onChange={v => setForm({ ...form, st:v })}
            opts={['onTrack','warning','critical'].map(s => ({ v:s, l:t[s] }))}
          />
          <div style={{ display:'flex', gap:8 }}>
            <Btn outline onClick={() => setEditId(null)}>{t.cancel}</Btn>
            <Btn onClick={doSave}>{t.save}</Btn>
          </div>
        </IForm>
      )}

      {delId && (
        <IForm title="Phase löschen?" onClose={() => setDelId(null)}>
          <div style={{ fontSize:13, marginBottom:14 }}>
            <b style={{ color:RD }}>{items.find(i => i.id === delId)?.phase}</b> {t.really_delete}
          </div>
          <div style={{ display:'flex', gap:8 }}>
            <Btn outline onClick={() => setDelId(null)}>{t.cancel}</Btn>
            <Btn danger onClick={() => doDelete(delId)}>{t.delete}</Btn>
          </div>
        </IForm>
      )}

      {/* Gantt */}
      <Card title="Gantt">
        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom: isMobile ? 10 : 6 }}>
          <div style={{ width:labelW, flexShrink:0 }}/>
          <div style={{ flex:1, position:'relative', height:18, minWidth:60 }}>
            {markers.map((m, i) => {
              const left = pct(m.date.toISOString().split('T')[0]);
              return m.showLabel ? (
                <div key={i} style={{
                  position:'absolute', left:left + '%', top:0, fontSize:9, color:GR,
                  whiteSpace:'nowrap', transform:'translateX(-50%)'
                }}>{m.label}</div>
              ) : null;
            })}
            {tp >= 0 && tp <= 100 && (
              <div style={{
                position:'absolute', left:tp + '%', top:14, fontSize:9, color:RD,
                fontWeight:'bold', whiteSpace:'nowrap', transform:'translateX(-50%)'
              }}>
                ↓ {String(todayD.getDate()).padStart(2,'0')}.{String(todayD.getMonth()+1).padStart(2,'0')}.{String(todayD.getFullYear()).slice(-2)}
              </div>
            )}
          </div>
          <div style={{ width:dateW, flexShrink:0 }}/>
          {canEdit && !isMobile && <div style={{ width:60, flexShrink:0 }}/>}
        </div>

        {items.map(item => {
          const info = phaseInfo(item);
          return (
            <div key={item.id} style={{ position:'relative' }}>
              <div
                style={{
                  display:'flex', alignItems:'center',
                  gap: isMobile ? 6 : 8,
                  marginBottom: isMobile ? 10 : 7
                }}
                onMouseEnter={() => !isMobile && setHoverId(item.id)}
                onMouseLeave={() => !isMobile && setHoverId(null)}
              >
                <div style={{
                  width:labelW, fontSize: isMobile ? 10 : 11, color:GR, flexShrink:0,
                  display:'flex', alignItems:'center', gap:5, overflow:'hidden'
                }}>
                  <span style={{
                    width:7, height:7, borderRadius:'50%',
                    background: sc[item.st] || GR, flexShrink:0, display:'inline-block'
                  }}/>
                  <span style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                    {item.phase}
                  </span>
                </div>

                <div
                  onClick={() => toggleHover(item.id)}
                  style={{
                    flex:1, height:barH, background:'#eef0f6', borderRadius:4,
                    position:'relative', minWidth:50, cursor:'pointer'
                  }}
                >
                  {markers.map((m, i) => {
                    const left = pct(m.date.toISOString().split('T')[0]);
                    return (
                      <div key={i} style={{
                        position:'absolute', left:left + '%', top:0,
                        height:'100%', width:1, background:'#dadeec'
                      }}/>
                    );
                  })}
                  <div style={{
                    position:'absolute', left:pct(item.ps) + '%',
                    width: Math.max(1, pct(item.pe) - pct(item.ps)) + '%',
                    height:'40%', top:'30%', background:P + '30', borderRadius:2
                  }}/>
                  {item.as && (
                    <div style={{
                      position:'absolute', left:pct(item.as) + '%',
                      width: Math.max(1, pct(item.ae || today) - pct(item.as)) + '%',
                      height:'40%', top:'30%',
                      background: sc[item.st] || P, borderRadius:2, opacity:0.85
                    }}/>
                  )}
                  {tp >= 0 && tp <= 100 && (
                    <div style={{
                      position:'absolute', left:tp + '%', top:0,
                      height:'100%', width:2, background:RD
                    }}/>
                  )}
                  {info && (
                    <div style={{
                      position:'absolute', left:pct(item.ps) + '%',
                      top:'50%', transform:'translateY(-50%)',
                      fontSize: isMobile ? 9 : 10, color:'#fff', fontWeight:'bold',
                      marginLeft:4, textShadow:'0 0 3px rgba(0,0,0,0.6)'
                    }}>
                      {info.prog}%
                    </div>
                  )}
                </div>

                <div style={{
                  width:dateW, fontSize: isMobile ? 9 : 10, color:GR,
                  flexShrink:0, textAlign:'right', lineHeight:1.2
                }}>
                  {info ? (
                    <>
                      <div>{isMobile ? item.pe.slice(5) : item.pe}</div>
                      <div style={{
                        color: info.remaining < 0 ? RD : info.remaining < 14 ? YL : GN,
                        fontWeight:'bold'
                      }}>
                        {info.remaining >= 0 ? `${info.remaining}T` : `+${Math.abs(info.remaining)}T`}
                      </div>
                    </>
                  ) : <>{item.pe}</>}
                </div>

                {canEdit && (
                  <div style={{
                    display:'flex',
                    flexDirection: isMobile ? 'column' : 'row',
                    gap: isMobile ? 2 : 4
                  }}>
                    <Btn sm outline onClick={() => { setForm({ ...item }); setEditId(item.id); }}>✏️</Btn>
                    <Btn sm danger  onClick={() => setDelId(item.id)}>✕</Btn>
                  </div>
                )}
              </div>

              {hoverId === item.id && info && (
                <div style={{
                  position: isMobile ? 'relative' : 'absolute',
                  left: isMobile ? 0 : 200,
                  top:  isMobile ? 0 : 30,
                  zIndex:50, background:'#222', color:'#fff',
                  padding:'8px 12px', borderRadius:6, fontSize:11,
                  boxShadow:'0 4px 12px rgba(0,0,0,0.3)', pointerEvents:'auto',
                  marginBottom: isMobile ? 8 : 0,
                  minWidth: isMobile ? 'auto' : 200
                }}>
                  <div style={{ fontWeight:'bold', marginBottom:4, fontSize:12 }}>{item.phase}</div>
                  <div>📅 {item.ps} → {item.pe}</div>
                  <div>⏱ Dauer / Süre: <b>{info.dur} Tage</b></div>
                  <div>📊 Fortschritt: <b>{info.prog}%</b></div>
                  <div style={{
                    color: info.remaining < 0 ? '#ff8888' : info.remaining < 14 ? '#ffd080' : '#88ff88'
                  }}>
                    {info.remaining >= 0
                      ? `⏳ Noch ${info.remaining} Tage`
                      : `⚠️ ${Math.abs(info.remaining)} Tage überzogen`}
                  </div>
                  {item.as && (
                    <div style={{ marginTop:4, paddingTop:4, borderTop:'1px solid #444' }}>
                      Ist: {item.as} → {item.ae || 'läuft'}
                    </div>
                  )}
                  {isMobile && (
                    <div
                      style={{
                        marginTop:6, fontSize:10, color:'#aaa',
                        textAlign:'right', cursor:'pointer'
                      }}
                      onClick={() => setHoverId(null)}
                    >✕ schließen</div>
                  )}
                </div>
              )}
            </div>
          );
        })}

        <div style={{ display:'flex', gap: isMobile ? 8 : 12, marginTop:10, flexWrap:'wrap' }}>
          {[[GN, t.onTrack], [YL, t.warning], [RD, t.critical]].map(([c, l]) => (
            <span key={l} style={{
              display:'flex', alignItems:'center', gap:4,
              fontSize: isMobile ? 10 : 11, color:GR
            }}>
              <span style={{
                width:8, height:8, borderRadius:'50%',
                background:c, display:'inline-block'
              }}/>
              {l}
            </span>
          ))}
          <span style={{
            display:'flex', alignItems:'center', gap:4,
            fontSize: isMobile ? 10 : 11, color:GR
          }}>
            <span style={{ width:2, height:12, background:RD, display:'inline-block' }}/>
            Heute / Bugün
          </span>
        </div>

        {isMobile && (
          <div style={{ marginTop:8, fontSize:10, color:GR, fontStyle:'italic' }}>
            💡 Auf Balken tippen für Details / Detaylar için çubuğa dokunun
          </div>
        )}
      </Card>

      {/* Tages-Kalender */}
      <Card>
        <div style={{
          display:'flex', justifyContent:'space-between',
          alignItems:'center', marginBottom:10, gap:6
        }}>
          <Btn sm outline onClick={() => setCalOffset(o => o - WEEKS_VISIBLE)}>
            ◀{isMobile ? '' : ` ${WEEKS_VISIBLE}W`}
          </Btn>
          <b style={{ color:P, fontSize: isMobile ? 11 : 13, textAlign:'center', flex:1 }}>
            📅 {isMobile ? 'Kalender / Takvim' : 'Tages-Kalender / Günlük Takvim'}
          </b>
          <div style={{ display:'flex', gap:6 }}>
            <Btn sm outline onClick={() => setCalOffset(0)}>
              {isMobile ? '•' : 'Heute'}
            </Btn>
            <Btn sm outline onClick={() => setCalOffset(o => o + WEEKS_VISIBLE)}>
              {isMobile ? '' : `${WEEKS_VISIBLE}W `}▶
            </Btn>
          </div>
        </div>

        <div style={{ overflowX:'auto', paddingTop:14 }}>
          <div style={{
            display:'grid',
            gridTemplateColumns: `repeat(${WEEKS_VISIBLE * 7},minmax(${cellMinW}px,1fr))`,
            gap:1, minWidth: WEEKS_VISIBLE * 7 * cellMinW
          }}>
            {calDays.map((d, i) => {
              const ds = d.toISOString().split('T')[0];
              const isToday   = ds === today;
              const isWeekend = d.getDay() === 0 || d.getDay() === 6;
              const phases    = activePhases(d);
              const monthChange = i === 0 || calDays[i-1].getMonth() !== d.getMonth();
              return (
                <div key={i} style={{
                  borderLeft: monthChange ? `2px solid ${P}` : '1px solid #eee',
                  background: isToday ? RD + '25' : isWeekend ? '#f5f5f5' : '#fff',
                  padding:'4px 2px', minHeight: isMobile ? 52 : 60,
                  fontSize:9, textAlign:'center', position:'relative'
                }}>
                  {monthChange && (
                    <div style={{
                      position:'absolute', top:-14, left:0, fontSize:9,
                      color:P, fontWeight:'bold', whiteSpace:'nowrap'
                    }}>
                      {String(d.getMonth() + 1).padStart(2,'0')}/{String(d.getFullYear()).slice(-2)}
                    </div>
                  )}
                  <div style={{
                    color: isToday ? RD : GR,
                    fontWeight: isToday ? 'bold' : 'normal'
                  }}>{d.getDate()}</div>
                  <div style={{ color:GR, fontSize:8 }}>
                    {['So','Mo','Di','Mi','Do','Fr','Sa'][d.getDay()]}
                  </div>
                  <div style={{ display:'flex', flexDirection:'column', gap:1, marginTop:2 }}>
                    {phases.slice(0, isMobile ? 2 : 3).map(p => (
                      <div key={p.id} title={p.phase} style={{
                        height: isMobile ? 3 : 4,
                        background: sc[p.st] || GR, borderRadius:1
                      }}/>
                    ))}
                    {phases.length > (isMobile ? 2 : 3) && (
                      <div style={{ fontSize:7, color:GR }}>
                        +{phases.length - (isMobile ? 2 : 3)}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </Card>
    </div>
  );
}
