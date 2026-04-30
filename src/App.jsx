// ZINKPOWER Manisa — App.jsx V14
// Änderungen ggü. V13:
// - Login-Sperre: nach 3 Fehlversuchen wird Account gesperrt (lockState in DB)
// - Erfolgreicher Login löscht lockState-Eintrag
// - Locked-User: Anzeige im Login-Screen, kein Passwort-Feld, deaktivierter Button
// - ForcePasswordChange responsiv (Mobile: schmaler Container, größere Touch-Targets)
import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

import {
  P, GR, LT, RD, GN, YL,
  CORE, T, DEF,
  getInit, useIsMobile,
  isLegacyPin, hashPassword, verifyPassword, validatePassword,
  MAX_LOGIN_ATTEMPTS, getLock,
  Btn, Fi, Fs, PasswordRules,
} from "./core.jsx";

import Dashboard      from "./modules/Dashboard.jsx";
import Schedule       from "./modules/Schedule.jsx";
import Contracts      from "./modules/Contracts.jsx";
import ChangeOrders   from "./modules/ChangeOrders.jsx";
import Approvals      from "./modules/Approvals.jsx";
import Issues         from "./modules/Issues.jsx";
import Diary          from "./modules/Diary.jsx";
import Documents      from "./modules/Documents.jsx";
import Contacts       from "./modules/Contacts.jsx";
import Gallery        from "./modules/Gallery.jsx";
import Suppliers      from "./modules/Suppliers.jsx";
import Tasks          from "./modules/Tasks.jsx";
import ReminderPopup  from "./modules/ReminderPopup.jsx";
import NewTasksPopup  from "./modules/NewTasksPopup.jsx";
import Budget         from "./modules/Budget.jsx";
import UserManagement from "./modules/UserManagement.jsx";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

// ════════════════════════════════════════════════════════════════
// LOGO + LANG-TOGGLE (für Login + ForcePasswordChange)
// ════════════════════════════════════════════════════════════════
function Logo() {
  return (
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
  );
}

function LangToggle({ lang, setLang }) {
  return (
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
  );
}

// ════════════════════════════════════════════════════════════════
// LOGIN — V14 (mit Lock-Logik)
// ════════════════════════════════════════════════════════════════
function Login({ onLogin, onLoginFail, lang, setLang, t, allUsers, pins, lockState }) {
  const [sel, setSel] = useState('');
  const [pin, setPin] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  // Lock-Status für gewählten User
  const lock = sel ? getLock(lockState, sel) : null;
  const isLocked = lock && lock.locked;

  async function tryLogin() {
    const u = allUsers.find(x => x.id === sel);
    if (!u || !pin || isLocked) return;
    setBusy(true);
    setErr('');

    const stored = pins[sel];
    let ok = false;
    let mustChange = false;

    if (isLegacyPin(stored)) {
      ok = pin === (stored || '0000');
      mustChange = true;
    } else {
      ok = await verifyPassword(pin, stored);
    }

    setBusy(false);
    if (ok) {
      onLogin(u, mustChange, pin);
    } else {
      // Fehlversuch zählen
      const newState = await onLoginFail(sel);
      if (newState.locked) {
        setErr(t.err_locked_now);
      } else if (newState.fails === MAX_LOGIN_ATTEMPTS - 1) {
        setErr(t.err_attempts_1);
      } else if (newState.fails === MAX_LOGIN_ATTEMPTS - 2) {
        setErr(t.err_attempts_2);
      } else {
        setErr(t.pw_err_wrong);
      }
      setPin('');
    }
  }

  function onKeyDown(e) {
    if (e.key === 'Enter' && sel && pin && !busy && !isLocked) tryLogin();
  }

  return (
    <div style={{
      display:'flex', justifyContent:'center', alignItems:'center',
      minHeight:'100vh', background:'#f0f2f8', fontFamily:'Arial', padding:20
    }}>
      <div
        style={{
          background:'#fff', borderRadius:14, padding:36, width:310,
          maxWidth:'100%', boxSizing:'border-box',
          boxShadow:'0 4px 24px rgba(40,56,152,0.15)'
        }}
        onKeyDown={onKeyDown}
      >
        <Logo/>
        <div style={{
          textAlign:'center', color:GR, fontSize:11,
          marginBottom:20, letterSpacing:2
        }}>
          Manisa İnşaat / Bauprojekt
        </div>

        <LangToggle lang={lang} setLang={setLang}/>

        <Fs
          label={t.sel}
          value={sel}
          onChange={v => { setSel(v); setPin(''); setErr(''); }}
          opts={[
            { v:'', l:`-- ${t.sel} --` },
            ...allUsers.map(u => {
              const ul = getLock(lockState, u.id);
              return { v: u.id, l: ul.locked ? `🔒 ${u.name}` : u.name };
            })
          ]}
        />

        {sel && isLocked && (
          <div style={{
            background: RD + '15', border:`1px solid ${RD}`,
            borderRadius:8, padding:'10px 12px', marginBottom:10,
            fontSize:12, color:RD, lineHeight:1.4
          }}>
            {t.err_locked}
          </div>
        )}

        {sel && !isLocked && (
          <Fi
            label={t.pin_or_password}
            value={pin}
            onChange={v => { setPin(v); setErr(''); }}
            type="password"
          />
        )}

        {err && <div style={{ color:RD, fontSize:12, marginBottom:6 }}>❌ {err}</div>}

        <div style={{ marginTop:8 }}>
          <Btn disabled={!sel || !pin || busy || isLocked} onClick={tryLogin}>
            {busy ? t.pw_processing : t.login}
          </Btn>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// FORCE PASSWORD CHANGE — V14 (mobile-optimiert)
// ════════════════════════════════════════════════════════════════
function ForcePasswordChange({
  user, pins, prefillOldPin, save,
  t, lang, setLang, onDone, onLogout
}) {
  const isMobile = useIsMobile();
  const [oldPin, setOldPin] = useState(prefillOldPin || '');
  const [newPw,  setNewPw]  = useState('');
  const [newPw2, setNewPw2] = useState('');
  const [err,    setErr]    = useState('');
  const [busy,   setBusy]   = useState(false);

  async function submit() {
    setErr(''); setBusy(true);
    try {
      const stored = pins[user.id];
      let ok = false;
      if (isLegacyPin(stored)) ok = oldPin === (stored || '0000');
      else ok = await verifyPassword(oldPin, stored);

      if (!ok) { setErr(t.pw_err_current_wrong); setBusy(false); return; }

      const ruleErr = validatePassword(newPw);
      if (ruleErr) { setErr(t[ruleErr]); setBusy(false); return; }

      if (newPw !== newPw2) { setErr(t.pw_err_mismatch); setBusy(false); return; }

      const hashed   = await hashPassword(newPw);
      const updated  = { ...pins, [user.id]: hashed };
      const saveErr  = await save('pins', updated);
      if (saveErr) {
        setErr('❌ ' + (saveErr.message || 'Save failed'));
        setBusy(false);
        return;
      }
      onDone();
    } catch (e) {
      console.error('Password change error:', e);
      setErr('Fehler / Hata: ' + (e.message || e));
      setBusy(false);
    }
  }

  function onKeyDown(e) { if (e.key === 'Enter' && !busy) submit(); }

  // Mobile-Touch-Target für Hauptbutton
  const submitDisabled = busy || !oldPin || !newPw || !newPw2;
  const submitBtnStyle = {
    width:'100%',
    padding: isMobile ? '14px' : '10px',
    background: submitDisabled ? '#ccc' : P,
    color: submitDisabled ? '#999' : '#fff',
    border:'none', borderRadius:8,
    fontSize: isMobile ? 14 : 13,
    fontWeight:'bold',
    cursor: submitDisabled ? 'default' : 'pointer',
    fontFamily:'Arial',
    minHeight: isMobile ? 48 : undefined,
    marginTop:6,
  };

  return (
    <div style={{
      display:'flex', justifyContent:'center',
      alignItems: isMobile ? 'flex-start' : 'center',
      minHeight:'100vh', background:'#f0f2f8', fontFamily:'Arial',
      padding: isMobile ? '16px 12px' : 20,
      paddingTop: isMobile ? 16 : 20,
    }}>
      <div
        onKeyDown={onKeyDown}
        style={{
          background:'#fff', borderRadius:14,
          padding: isMobile ? 20 : 32,
          width:'100%', maxWidth:360,
          boxSizing:'border-box',
          boxShadow:'0 4px 24px rgba(40,56,152,0.15)'
        }}
      >
        <Logo/>
        <LangToggle lang={lang} setLang={setLang}/>

        <div style={{
          background:'#fff8e1', border:`1px solid #f0c674`,
          borderRadius:8, padding:'10px 12px', marginBottom:14
        }}>
          <div style={{ fontSize:13, fontWeight:'bold', color:'#7a5500', marginBottom:4 }}>
            🔐 {t.pw_change_required}
          </div>
          <div style={{ fontSize:12, color:'#7a5500', lineHeight:1.4 }}>
            {t.pw_change_intro}
          </div>
        </div>

        <div style={{ fontSize:12, color:GR, marginBottom:8 }}>
          👤 <b style={{ color:P }}>{user.name}</b>
        </div>

        <Fi
          label={t.pw_current}
          value={oldPin}
          onChange={v => { setOldPin(v); setErr(''); }}
          type="password"
        />

        <Fi
          label={t.pw_new}
          value={newPw}
          onChange={v => { setNewPw(v); setErr(''); }}
          type="password"
        />

        <PasswordRules pw={newPw} t={t}/>

        <Fi
          label={t.pw_repeat}
          value={newPw2}
          onChange={v => { setNewPw2(v); setErr(''); }}
          type="password"
        />

        {err && <div style={{ color:RD, fontSize:12, marginBottom:8 }}>❌ {err}</div>}

        <button onClick={submit} disabled={submitDisabled} style={submitBtnStyle}>
          {busy ? t.pw_processing : t.pw_change_btn}
        </button>

        <div style={{
          marginTop:14, paddingTop:12, borderTop:`1px solid ${LT}`,
          textAlign:'center'
        }}>
          <button
            onClick={onLogout}
            style={{
              background:'none', border:'none', color:GR,
              fontSize:12, cursor:'pointer', textDecoration:'underline',
              padding: isMobile ? 8 : 4
            }}
          >
            {t.logout}
          </button>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// HAUPT-APP
// ════════════════════════════════════════════════════════════════
export default function App() {
  const [user, setUser]                       = useState(null);
  const [mustChangePassword, setMustChangePw] = useState(false);
  const [loginPinPrefill, setLoginPinPrefill] = useState('');
  const [lang, setLang]                       = useState('de');
  const [mod,  setMod]                        = useState('dash');
  const [data, setData]                       = useState(() => ({ ...DEF }));
  const [sideOpen, setSideOpen]               = useState(true);
  const [navOpen,  setNavOpen]                = useState(false);
  const [dataLoaded, setDataLoaded]           = useState(false);

  const [pwModal,  setPwModal]  = useState(false);
  const [pwOld,    setPwOld]    = useState('');
  const [pwNew,    setPwNew]    = useState('');
  const [pwNew2,   setPwNew2]   = useState('');
  const [pwErr,    setPwErr]    = useState('');
  const [pwBusy,   setPwBusy]   = useState(false);

  const [reminderShown, setReminderShown] = useState(false);
  const [showReminder,  setShowReminder]  = useState(false);

  const [newTaskIds,        setNewTaskIds]        = useState([]);
  const [showNewTasks,      setShowNewTasks]      = useState(false);
  const [newTaskCheckDone,  setNewTaskCheckDone]  = useState(false);

  const isMobile = useIsMobile();
  const t = T[lang] || T.de;

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

  async function save(key, val) {
    setData(d => ({ ...d, [key]: val }));
    const { error } = await supabase.from('project_data').upsert({
      key,
      value: JSON.stringify(val),
      updated_at: new Date().toISOString(),
    });
    if (error) {
      console.error('[ZINKPOWER save] failed:', key, error);
      alert(
        'Speichern fehlgeschlagen / Kayıt başarısız\n\n' +
        `Modul: ${key}\n` +
        `Fehler: ${error.message || error}\n\n` +
        'Daten wurden NICHT in der Datenbank gespeichert.\n' +
        'Veriler veritabanına KAYDEDİLMEDİ.'
      );
      return error;
    }
    return null;
  }

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

  // ── V14: Login-Callbacks mit Lock-State ──────────────────────
  function handleLogin(u, mustChange, oldPin) {
    // Lock-State zurücksetzen bei erfolgreichem Login
    const current = data.lockState || {};
    if (current[u.id]) {
      const updated = { ...current };
      delete updated[u.id];
      save('lockState', updated);
    }
    setUser(u);
    setMustChangePw(mustChange);
    setLoginPinPrefill(mustChange ? oldPin : '');
  }

  async function handleLoginFail(uid) {
    const current = data.lockState || {};
    const old = current[uid] || { fails: 0, locked: false };
    const fails  = old.fails + 1;
    const locked = fails >= MAX_LOGIN_ATTEMPTS;
    const updated = { ...current, [uid]: { fails, locked } };
    await save('lockState', updated);
    return { fails, locked };
  }

  // ── Eigenes Passwort ändern (im laufenden Login) ─────────────
  async function savePwSelf() {
    setPwErr(''); setPwBusy(true);
    try {
      const stored = (data.pins || DEF.pins)[user.id];
      let ok = false;
      if (isLegacyPin(stored)) ok = pwOld === (stored || '0000');
      else ok = await verifyPassword(pwOld, stored);

      if (!ok)        { setPwErr(t.pw_err_current_wrong); setPwBusy(false); return; }

      const ruleErr = validatePassword(pwNew);
      if (ruleErr)    { setPwErr(t[ruleErr]); setPwBusy(false); return; }

      if (pwNew !== pwNew2) { setPwErr(t.pw_err_mismatch); setPwBusy(false); return; }

      const hashed = await hashPassword(pwNew);
      const current = data.pins || DEF.pins;
      const updated = { ...current, [user.id]: hashed };
      const saveErr = await save('pins', updated);
      if (saveErr) { setPwBusy(false); return; }

      setPwModal(false); setPwOld(''); setPwNew(''); setPwNew2(''); setPwErr('');
      setPwBusy(false);
    } catch (e) {
      setPwErr('Fehler / Hata: ' + (e.message || e));
      setPwBusy(false);
    }
  }

  useEffect(() => {
    if (user && !mustChangePassword && !reminderShown) {
      setShowReminder(true);
      setReminderShown(true);
    }
  }, [user, mustChangePassword, reminderShown]);

  useEffect(() => {
    if (!user || mustChangePassword || !dataLoaded || newTaskCheckDone) return;
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
  }, [user, mustChangePassword, dataLoaded, newTaskCheckDone, data.tasks]);

  useEffect(() => {
    if (!user) {
      setReminderShown(false);
      setShowReminder(false);
      setMod('dash');
      setNewTaskCheckDone(false);
      setShowNewTasks(false);
      setNewTaskIds([]);
      setMustChangePw(false);
      setLoginPinPrefill('');
    }
  }, [user]);

  const allUsers  = [...CORE, ...(data.extraUsers || [])];
  const pins      = data.pins      || DEF.pins;
  const lockState = data.lockState || {};

  if (!user) {
    return <Login
      onLogin={handleLogin}
      onLoginFail={handleLoginFail}
      lang={lang} setLang={setLang}
      t={t}
      allUsers={allUsers} pins={pins} lockState={lockState}
    />;
  }

  if (mustChangePassword) {
    return <ForcePasswordChange
      user={user}
      pins={pins}
      prefillOldPin={loginPinPrefill}
      save={save}
      t={t} lang={lang} setLang={setLang}
      onDone={() => { setMustChangePw(false); setLoginPinPrefill(''); }}
      onLogout={() => setUser(null)}
    />;
  }

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

  const pwDialog = pwModal && (
    <div style={{
      position:'fixed', inset:0, background:'rgba(0,0,0,0.45)',
      zIndex:9999, display:'flex', alignItems:'center',
      justifyContent:'center', padding:16
    }}>
      <div style={{
        background:'#fff', borderRadius:12, padding:24, width:340,
        maxWidth:'100%', boxSizing:'border-box',
        boxShadow:'0 8px 32px rgba(0,0,0,0.2)'
      }}>
        <div style={{
          display:'flex', justifyContent:'space-between',
          alignItems:'center', marginBottom:14
        }}>
          <b style={{ color:P, fontSize:15 }}>🔐 {t.password} ändern / değiştir</b>
          <button
            onClick={() => {
              setPwModal(false); setPwOld(''); setPwNew(''); setPwNew2(''); setPwErr('');
            }}
            style={{ background:'none', border:'none', fontSize:20, cursor:'pointer', color:GR }}
          >✕</button>
        </div>
        <Fi
          label={t.pw_current}
          value={pwOld}
          onChange={v => { setPwOld(v); setPwErr(''); }}
          type="password"
        />
        <Fi
          label={t.pw_new}
          value={pwNew}
          onChange={v => { setPwNew(v); setPwErr(''); }}
          type="password"
        />
        <PasswordRules pw={pwNew} t={t}/>
        <Fi
          label={t.pw_repeat}
          value={pwNew2}
          onChange={v => { setPwNew2(v); setPwErr(''); }}
          type="password"
        />
        {pwErr && <div style={{ color:RD, fontSize:12, marginBottom:8 }}>❌ {pwErr}</div>}
        <div style={{ display:'flex', gap:8, marginTop:4 }}>
          <Btn outline onClick={() => {
            setPwModal(false); setPwOld(''); setPwNew(''); setPwNew2(''); setPwErr('');
          }}>{t.cancel}</Btn>
          <Btn disabled={pwBusy || !pwOld || !pwNew || !pwNew2} onClick={savePwSelf}>
            {pwBusy ? t.pw_processing : t.save}
          </Btn>
        </div>
      </div>
    </div>
  );

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

  if (isMobile) {
    return (
      <>
        {pwDialog}
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
                  onClick={() => { setNavOpen(false); setPwModal(true); }}
                  style={{
                    padding:'5px 12px', background:'rgba(255,255,255,0.12)',
                    color:'#fff', border:'1px solid rgba(255,255,255,0.2)',
                    borderRadius:6, fontSize:11, cursor:'pointer', fontFamily:'Arial'
                  }}
                >🔐 {t.password}</button>
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

  return (
    <>
      {pwDialog}
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
                onClick={() => setPwModal(true)}
                style={{
                  width:'100%', padding:'5px 0',
                  background:'rgba(255,255,255,0.08)',
                  color:'rgba(255,255,255,0.8)',
                  border:'1px solid rgba(255,255,255,0.15)',
                  borderRadius:5, fontSize:11, cursor:'pointer',
                  fontFamily:'Arial', marginBottom:4
                }}
              >🔐 {t.password} ändern</button>
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
