// ZINKPOWER Manisa — App.jsx V11
import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

import {
  P, GR, LT, RD,
  CORE, T, DEF,
  getInit, useIsMobile,
  Btn, IForm, Fi, Fs,
} from "./core.jsx";

import {
  Dashboard, Schedule, Contracts, ChangeOrders, Approvals,
  Issues, Diary, Documents, Contacts, Gallery, Suppliers,
  Tasks, ReminderPopup, NewTasksPopup,
} from "./modules_core.jsx";

import {
  Budget, UserManagement,
} from "./modules_admin.jsx";

// ════════════════════════════════════════════════════════════════
// SUPABASE
// ════════════════════════════════════════════════════════════════
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

// ════════════════════════════════════════════════════════════════
// LOGIN
// ════════════════════════════════════════════════════════════════
function Login({ setUser, lang, setLang, t, allUsers, pins }) {
  const [sel, setSel] = useState('');
  const [pin, setPin] = useState('');
  const [err, setErr] = useState(false);

  function tryLogin() {
    const u = allUsers.find(x => x.id === sel);
    if (!u) return;
    if (pin === (pins[sel] || '0000')) {
      setUser(u);
    } else {
      setErr(true);
      setPin('');
    }
  }

  return (
    <div style={{
      display:'flex', justifyContent:'center', alignItems:'center',
      minHeight:'100vh', background:'#f0f2f8', fontFamily:'Arial', padding:20
    }}>
      <div style={{
        background:'#fff', borderRadius:14, padding:36, width:310,
        boxShadow:'0 4px 24px rgba(40,56,152,0.15)'
      }}>
        <div style={{ textAlign:'center', marginBottom:20 }}>
          <div style={{
            fontFamily:'"Arial Black","Arial Bold",Arial', fontWeight:900,
            fontSize:26, color:P, letterSpacing:2, lineHeight:1.1,
            textTransform:'uppercase'
          }}>
            ZINKPOWER<sup style={{ fontSize:11, verticalAlign:'super', fontWeight:900 }}>®</sup>
          </div>
          <div style={{
            background:GR, color:'#fff', padding:'6px 0',
            fontSize:13, letterSpacing:1, fontFamily:'Arial',
            fontWeight:400, marginTop:6
          }}>
            KOPF GRUPPE
          </div>
        </div>

        <div style={{ textAlign:'center', color:GR, fontSize:11, marginBottom:20, letterSpacing:2 }}>
          Manisa İnşaat / Bauprojekt
        </div>

        <div style={{ display:'flex', gap:6, marginBottom:16 }}>
          {['de','tr'].map(l => (
            <button
              key={l}
              onClick={() => setLang(l)}
              style={{
                flex:1, padding:'7px 0',
                background: lang === l ? P : '#fff',
                color: lang === l ? '#fff' : GR,
                border: `1px solid ${lang === l ? P : '#ddd'}`,
                borderRadius:6, fontSize:12, cursor:'pointer',
                fontFamily:'Arial', fontWeight:'bold'
              }}
            >
              {l === 'de' ? '🇩🇪 DE' : '🇹🇷 TR'}
            </button>
          ))}
        </div>

        <Fs
          label={t.sel}
          value={sel}
          onChange={v => { setSel(v); setPin(''); setErr(false); }}
          opts={[
            { v:'', l:`-- ${t.sel} --` },
            ...allUsers.map(u => ({ v: u.id, l: u.name }))
          ]}
        />

        {sel && (
          <Fi
            label="PIN"
            value={pin}
            onChange={v => { setPin(v.replace(/\D/g,'').slice(0,4)); setErr(false); }}
            type="password"
            ph="4-stellige PIN"
          />
        )}

        {err && <div style={{ color:RD, fontSize:12, marginBottom:6 }}>❌ Falsche PIN / Yanlış PIN</div>}

        <div style={{ marginTop:8 }}>
          <Btn disabled={!sel || pin.length !== 4} onClick={tryLogin}>{t.login}</Btn>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// HAUPT-APP
// ════════════════════════════════════════════════════════════════
export default function App() {
  const [user, setUser]       = useState(null);
  const [lang, setLang]       = useState('de');
  const [mod, setMod]         = useState('dash');
  const [data, setData]       = useState(() => ({ ...DEF }));
  const [sideOpen, setSideOpen] = useState(true);
  const [navOpen, setNavOpen]   = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);

  const [pinModal, setPinModal] = useState(false);
  const [myPin, setMyPin]       = useState('');
  const [myPin2, setMyPin2]     = useState('');
  const [myPinErr, setMyPinErr] = useState('');

  const [reminderShown, setReminderShown] = useState(false);
  const [showReminder, setShowReminder]   = useState(false);

  // V8: Neu zugewiesene Aufgaben-Benachrichtigung
  const [newTaskIds, setNewTaskIds]             = useState([]);
  const [showNewTasks, setShowNewTasks]         = useState(false);
  const [newTaskCheckDone, setNewTaskCheckDone] = useState(false);

  const isMobile = useIsMobile();
  const t = T[lang] || T.de;

  // ── Daten initial laden ──────────────────────────────────────
  useEffect(() => {
    async function load() {
      const { data: rows } = await supabase
        .from('project_data')
        .select('key, value');
      if (rows && rows.length > 0) {
        const loaded = {};
        rows.forEach(row => {
          try { loaded[row.key] = JSON.parse(row.value); } catch (e) {}
        });
        setData(d => ({ ...d, ...loaded }));
      }
      setDataLoaded(true);
    }
    load();
  }, []);

  // ── Speichern (lokal + Supabase) ──────────────────────────────
  async function save(key, val) {
    setData(d => ({ ...d, [key]: val }));
    await supabase.from('project_data').upsert({
      key,
      value: JSON.stringify(val),
      updated_at: new Date().toISOString(),
    });
  }

  // ── Datei in Supabase Storage hochladen (V11) ─────────────────
  async function uploadFile(file, folder='files') {
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const path = `${folder}/${Date.now()}_${safeName}`;
    const { error } = await supabase.storage.from('project-files').upload(path, file);
    if (error) {
      console.error('Upload error:', error);
      alert('Upload fehlgeschlagen / Yükleme başarısız:\n' + (error.message || ''));
      return null;
    }
    const { data: urlData } = supabase.storage.from('project-files').getPublicUrl(path);
    return urlData.publicUrl;
  }

  // ── PIN selbst ändern ─────────────────────────────────────────
  function saveMyPin() {
    if (myPin.length !== 4 || !/^\d{4}$/.test(myPin)) {
      setMyPinErr('PIN tam 4 rakam olmalı / PIN muss 4 Ziffern sein');
      return;
    }
    if (myPin !== myPin2) {
      setMyPinErr('PINs stimmen nicht überein / PIN\'ler eşleşmiyor');
      return;
    }
    const current = data.pins || {};
    const updated = { ...current, [user.id]: myPin };
    save('pins', updated);
    setPinModal(false); setMyPin(''); setMyPin2(''); setMyPinErr('');
  }

  // ── ReminderPopup nach Login einmalig zeigen ─────────────────
  useEffect(() => {
    if (user && !reminderShown) {
      setShowReminder(true);
      setReminderShown(true);
    }
  }, [user, reminderShown]);

  // ── V8: Check auf neu zugewiesene Aufgaben ───────────────────
  useEffect(() => {
    if (!user || !dataLoaded || newTaskCheckDone) return;
    const myTaskIds = (data.tasks || [])
      .filter(tk => tk.status !== 'done')
      .filter(tk => (tk.assignedUsers || []).includes(user.id))
      .map(tk => tk.id);
    const lastSeenMap = data.lastSeenTasks || {};
    const hadPreviousSession = user.id in lastSeenMap;
    const lastSeen = lastSeenMap[user.id] || [];
    const newIds = hadPreviousSession
      ? myTaskIds.filter(id => !lastSeen.includes(id))
      : [];
    if (newIds.length > 0) {
      setNewTaskIds(newIds);
      setShowNewTasks(true);
    }
    const updated = { ...lastSeenMap, [user.id]: myTaskIds };
    save('lastSeenTasks', updated);
    setNewTaskCheckDone(true);
  }, [user, dataLoaded, newTaskCheckDone, data.tasks]);

  // ── Nach Logout zurücksetzen ─────────────────────────────────
  useEffect(() => {
    if (!user) {
      setReminderShown(false);
      setShowReminder(false);
      setMod('dash');
      setNewTaskCheckDone(false);
      setShowNewTasks(false);
      setNewTaskIds([]);
    }
  }, [user]);

  const allUsers = [...CORE, ...(data.extraUsers || [])];
  const pins = data.pins || DEF.pins;

  if (!user) {
    return <Login
      setUser={setUser}
      lang={lang} setLang={setLang}
      t={t}
      allUsers={allUsers} pins={pins}
    />;
  }

  // ── Navigation ───────────────────────────────────────────────
  const hasNewTaskBadge = newTaskIds.length > 0;
  const nav = [
    { id:'dash',         l:t.dash,      i:'🏠' },
    { id:'schedule',     l:t.schedule,  i:'📅' },
    { id:'tasks',        l:t.tasks,     i:'📋', badge: hasNewTaskBadge },
    { id:'contracts',    l:t.contracts, i:'📄' },
    { id:'changeOrders', l:t.co,        i:'➕' },
    { id:'approvals',    l:t.approvals, i:'✅' },
    { id:'issues',       l:t.issues,    i:'⚠️' },
    { id:'diary',        l:t.diary,     i:'📒' },
    { id:'docs',         l:t.docs,      i:'📁' },
    { id:'contacts',     l:t.contacts,  i:'👥' },
    { id:'gallery',      l:t.gallery,   i:'🖼️' },
    { id:'suppliers',    l:t.suppliers, i:'🚚' },
    ...(user.role === 'admin'
      ? [{ id:'budget', l:t.budget, i:'💶' }, { id:'users', l:'Nutzer', i:'🔐' }]
      : (user.permissions || []).includes('budget')
        ? [{ id:'budget', l:t.budget, i:'💶' }]
        : []),
  ];

  const mp = { data, save, uploadFile, user, t, isMobile };

  const views = {
    dash:         <Dashboard {...mp}/>,
    schedule:     <Schedule {...mp}/>,
    tasks:        <Tasks {...mp}/>,
    contracts:    <Contracts {...mp}/>,
    changeOrders: <ChangeOrders {...mp}/>,
    approvals:    <Approvals {...mp}/>,
    issues:       <Issues {...mp}/>,
    diary:        <Diary {...mp}/>,
    docs:         <Documents {...mp}/>,
    contacts:     <Contacts {...mp}/>,
    gallery:      <Gallery {...mp}/>,
    suppliers:    <Suppliers {...mp}/>,
    budget:       <Budget {...mp}/>,
    users:        <UserManagement {...mp}/>,
  };

  const pinDialog = pinModal && (
    <div style={{
      position:'fixed', inset:0, background:'rgba(0,0,0,0.45)',
      zIndex:9999, display:'flex', alignItems:'center',
      justifyContent:'center', padding:16
    }}>
      <div style={{
        background:'#fff', borderRadius:12, padding:24, width:320,
        maxWidth:'100%', boxShadow:'0 8px 32px rgba(0,0,0,0.2)'
      }}>
        <div style={{
          display:'flex', justifyContent:'space-between',
          alignItems:'center', marginBottom:16
        }}>
          <b style={{ color:P, fontSize:15 }}>🔐 PIN ändern / Değiştir</b>
          <button
            onClick={() => { setPinModal(false); setMyPin(''); setMyPin2(''); setMyPinErr(''); }}
            style={{ background:'none', border:'none', fontSize:20, cursor:'pointer', color:GR }}
          >✕</button>
        </div>
        <Fi
          label="Neuer PIN / Yeni PIN (4 Ziffern)"
          value={myPin}
          onChange={v => { setMyPin(v.replace(/\D/g,'').slice(0,4)); setMyPinErr(''); }}
          type="password" ph="0000"
        />
        <Fi
          label="PIN wiederholen / PIN Tekrar"
          value={myPin2}
          onChange={v => { setMyPin2(v.replace(/\D/g,'').slice(0,4)); setMyPinErr(''); }}
          type="password"
        />
        {myPinErr && <div style={{ color:RD, fontSize:12, marginBottom:8 }}>❌ {myPinErr}</div>}
        <div style={{ display:'flex', gap:8, marginTop:4 }}>
          <Btn outline onClick={() => { setPinModal(false); setMyPin(''); setMyPin2(''); setMyPinErr(''); }}>
            Abbrechen / İptal
          </Btn>
          <Btn onClick={saveMyPin}>Speichern / Kaydet</Btn>
        </div>
      </div>
    </div>
  );

  // V8: Popups koordinieren – NewTasksPopup zuerst, danach ReminderPopup
  const popups = (
    <>
      {showNewTasks && <NewTasksPopup
        user={user} data={data} t={t} lang={lang}
        newTaskIds={newTaskIds}
        onClose={() => setShowNewTasks(false)}
      />}
      {showReminder && !showNewTasks && <ReminderPopup
        user={user} data={data} t={t}
        onClose={() => setShowReminder(false)}
      />}
    </>
  );

  // ════════════════════════════════════════════════════════════
  // MOBILE LAYOUT
  // ════════════════════════════════════════════════════════════
  if (isMobile) {
    return (
      <>
        {pinDialog}
        {popups}
        <div style={{ display:'flex', flexDirection:'column', minHeight:'100vh', fontFamily:'Arial', background:'#f0f2f8' }}>
          <div style={{
            background:P, color:'#fff', padding:'12px 16px',
            display:'flex', alignItems:'center', gap:12, flexShrink:0
          }}>
            <div style={{ flex:1 }}>
              <div style={{ fontWeight:'bold', fontSize:13, letterSpacing:1 }}>ZINKPOWER®</div>
              <div style={{ fontSize:9, opacity:0.7, letterSpacing:2 }}>KOPF GRUPPE · Manisa</div>
            </div>
            <div style={{ fontSize:11, color:'rgba(255,255,255,0.8)' }}>{getInit(user.name)}</div>
            <button
              onClick={() => setNavOpen(o => !o)}
              style={{
                background:'rgba(255,255,255,0.15)', border:'none',
                color:'#fff', borderRadius:8, padding:'8px 12px',
                fontSize:18, cursor:'pointer', lineHeight:1, position:'relative'
              }}
            >
              {navOpen ? '✕' : '☰'}
              {!navOpen && hasNewTaskBadge && <span style={{
                position:'absolute', top:4, right:6,
                width:10, height:10, background:RD, borderRadius:'50%',
                border:'2px solid '+P
              }}/>}
            </button>
          </div>

          {navOpen && (
            <div style={{ background:P, borderBottom:'2px solid rgba(255,255,255,0.2)' }}>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:1 }}>
                {nav.map(n => (
                  <div
                    key={n.id}
                    onClick={() => { setMod(n.id); setNavOpen(false); }}
                    style={{
                      padding:'10px 4px', textAlign:'center', cursor:'pointer',
                      background: mod === n.id ? 'rgba(255,255,255,0.2)' : 'transparent',
                      borderRadius:8, margin:4
                    }}
                  >
                    <div style={{ fontSize:20, position:'relative', display:'inline-block' }}>
                      {n.i}
                      {n.badge && <span style={{
                        position:'absolute', top:-2, right:-6,
                        width:10, height:10, background:RD, borderRadius:'50%',
                        border:'2px solid '+P
                      }}/>}
                    </div>
                    <div style={{ fontSize:9, color:'rgba(255,255,255,0.85)', marginTop:2, lineHeight:1.2 }}>{n.l}</div>
                  </div>
                ))}
              </div>
              <div style={{
                display:'flex', gap:8, padding:'8px 12px',
                borderTop:'1px solid rgba(255,255,255,0.15)', flexWrap:'wrap'
              }}>
                {['de','tr'].map(l => (
                  <button
                    key={l}
                    onClick={() => setLang(l)}
                    style={{
                      padding:'5px 14px',
                      background: lang === l ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.12)',
                      color: lang === l ? P : '#fff',
                      border:'none', borderRadius:6, fontSize:12,
                      cursor:'pointer', fontFamily:'Arial', fontWeight:'bold'
                    }}
                  >
                    {l.toUpperCase()}
                  </button>
                ))}
                <button
                  onClick={() => { setNavOpen(false); setPinModal(true); }}
                  style={{
                    padding:'5px 12px', background:'rgba(255,255,255,0.12)',
                    color:'#fff', border:'1px solid rgba(255,255,255,0.2)',
                    borderRadius:6, fontSize:11, cursor:'pointer', fontFamily:'Arial'
                  }}
                >🔐 PIN</button>
                <button
                  onClick={() => setUser(null)}
                  style={{
                    marginLeft:'auto', padding:'5px 14px',
                    background:'rgba(255,255,255,0.1)', color:'#fff',
                    border:'1px solid rgba(255,255,255,0.2)', borderRadius:6,
                    fontSize:12, cursor:'pointer', fontFamily:'Arial'
                  }}
                >{t.logout}</button>
              </div>
            </div>
          )}

          <div style={{
            background:'#fff', padding:'8px 16px',
            borderBottom:'1px solid #eee',
            display:'flex', alignItems:'center', gap:8
          }}>
            <span style={{ fontSize:18 }}>{nav.find(n => n.id === mod)?.i}</span>
            <span style={{ fontWeight:'bold', color:P, fontSize:14 }}>{nav.find(n => n.id === mod)?.l}</span>
          </div>

          <div style={{ flex:1, overflowY:'auto', padding:12 }}>
            {views[mod] || <div style={{ color:GR }}>{t.no_data}</div>}
          </div>
        </div>
      </>
    );
  }

  // ════════════════════════════════════════════════════════════
  // DESKTOP LAYOUT
  // ════════════════════════════════════════════════════════════
  return (
    <>
      {pinDialog}
      {popups}
      <div style={{ display:'flex', minHeight:'100vh', fontFamily:'Arial', background:'#f0f2f8' }}>
        <div style={{
          width: sideOpen ? 210 : 48,
          background:P, color:'#fff',
          display:'flex', flexDirection:'column',
          transition:'width 0.2s', flexShrink:0,
          overflow:'hidden', minHeight:'100vh'
        }}>
          <div
            onClick={() => setSideOpen(s => !s)}
            style={{
              padding:'10px 8px',
              borderBottom:'1px solid rgba(255,255,255,0.15)',
              display:'flex', alignItems:'center', cursor:'pointer',
              gap:8, minHeight:52
            }}
          >
            {sideOpen && (
              <div style={{ flex:1, overflow:'hidden' }}>
                <div style={{ fontWeight:'bold', fontSize:12, whiteSpace:'nowrap', color:'#fff', letterSpacing:1 }}>ZINKPOWER®</div>
                <div style={{ fontSize:9, opacity:0.7, color:'#fff', letterSpacing:2 }}>KOPF GRUPPE</div>
              </div>
            )}
            <span style={{ fontSize:14, flexShrink:0, color:'#fff' }}>{sideOpen ? '◀' : '▶'}</span>
          </div>

          <div style={{ flex:1, overflowY:'auto' }}>
            {nav.map(n => (
              <div
                key={n.id}
                onClick={() => setMod(n.id)}
                style={{
                  padding:'9px 10px',
                  display:'flex', alignItems:'center', gap:8, cursor:'pointer',
                  background: mod === n.id ? 'rgba(255,255,255,0.18)' : 'transparent',
                  borderLeft: mod === n.id ? '3px solid #fff' : '3px solid transparent',
                  overflow:'hidden'
                }}
              >
                <span style={{ fontSize:15, flexShrink:0, position:'relative', display:'inline-block' }}>
                  {n.i}
                  {n.badge && <span style={{
                    position:'absolute', top:-3, right:-5,
                    width:9, height:9, background:RD, borderRadius:'50%',
                    border:'1.5px solid '+P
                  }}/>}
                </span>
                {sideOpen && <span style={{ fontSize:12, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{n.l}</span>}
              </div>
            ))}
          </div>

          <div style={{ padding:'10px 8px', borderTop:'1px solid rgba(255,255,255,0.15)' }}>
            {sideOpen && (
              <div style={{ display:'flex', gap:4, marginBottom:8 }}>
                {['de','tr'].map(l => (
                  <button
                    key={l}
                    onClick={() => setLang(l)}
                    style={{
                      flex:1, padding:'4px 0',
                      background: lang === l ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.12)',
                      color: lang === l ? P : '#fff',
                      border:'none', borderRadius:4, fontSize:11,
                      cursor:'pointer', fontFamily:'Arial', fontWeight:'bold'
                    }}
                  >
                    {l.toUpperCase()}
                  </button>
                ))}
              </div>
            )}
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom: sideOpen ? 8 : 0 }}>
              <div style={{
                width:30, height:30, borderRadius:'50%',
                background:'rgba(255,255,255,0.22)',
                display:'flex', alignItems:'center', justifyContent:'center',
                fontWeight:'bold', fontSize:11, flexShrink:0
              }}>{getInit(user.name)}</div>
              {sideOpen && <span style={{ fontSize:12, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{user.name}</span>}
            </div>
            {sideOpen && (
              <button
                onClick={() => setPinModal(true)}
                style={{
                  width:'100%', padding:'5px 0',
                  background:'rgba(255,255,255,0.08)',
                  color:'rgba(255,255,255,0.8)',
                  border:'1px solid rgba(255,255,255,0.15)',
                  borderRadius:5, fontSize:11, cursor:'pointer',
                  fontFamily:'Arial', marginBottom:4
                }}
              >🔐 PIN ändern / Değiştir</button>
            )}
            {sideOpen && (
              <button
                onClick={() => setUser(null)}
                style={{
                  width:'100%', padding:'5px 0',
                  background:'rgba(255,255,255,0.1)', color:'#fff',
                  border:'1px solid rgba(255,255,255,0.2)',
                  borderRadius:5, fontSize:11, cursor:'pointer', fontFamily:'Arial'
                }}
              >{t.logout}</button>
            )}
          </div>
        </div>

        <div style={{ flex:1, overflowY:'auto', padding:20 }}>
          {views[mod] || <div style={{ color:GR }}>{t.no_data}</div>}
        </div>
      </div>
    </>
  );
}
