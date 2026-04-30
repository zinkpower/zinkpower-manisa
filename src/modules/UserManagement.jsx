// ZINKPOWER Manisa — modules/UserManagement.jsx V14
// Änderungen ggü. V13:
// - Migrations-Fortschritts-Box am oberen Rand
// - Lock-Status-Badge: 🔒 GESPERRT (zusätzlich zu Standard-PIN/Eigenes Passwort)
// - Reset-Password setzt zusätzlich den Lock-Eintrag zurück
// - Manueller Entsperr-Button (wenn nur Lock, ohne Passwort-Reset gewünscht)
import { useState } from "react";
import {
  P, GR, LT, GN, YL, RD,
  CORE, DEF, PERM_LIST,
  isLegacyPin,
  getInit,
  Btn, Card, IForm, Fi, PH, Av,
} from "../core.jsx";

export default function UserManagement({ data, save, t }) {
  const [pins,        setPins]        = useState(() => data.pins       || DEF.pins);
  const [extras,      setExtras]      = useState(() => data.extraUsers || []);
  const [resetId,     setResetId]     = useState(null);
  const [unlockId,    setUnlockId]    = useState(null);
  const [showAdd,     setShowAdd]     = useState(false);
  const [nf,          setNf]          = useState({ firstName:'', lastName:'' });
  const [addErr,      setAddErr]      = useState('');
  const [permEditId,  setPermEditId]  = useState(null);

  const allUsers  = [...CORE, ...extras];
  const lockState = data.lockState || {};

  function isUserLocked(uid) {
    const l = lockState[uid];
    return !!(l && l.locked);
  }

  function resetPassword(uid) {
    // Passwort auf '0000' (Legacy-Format) zurücksetzen
    const newPins = { ...pins, [uid]: '0000' };
    setPins(newPins);
    save('pins', newPins);

    // Lock-State ebenfalls zurücksetzen (Entsperrung)
    if (lockState[uid]) {
      const newLock = { ...lockState };
      delete newLock[uid];
      save('lockState', newLock);
    }
    setResetId(null);
  }

  function unlockOnly(uid) {
    // Nur entsperren, Passwort bleibt
    const newLock = { ...lockState };
    delete newLock[uid];
    save('lockState', newLock);
    setUnlockId(null);
  }

  function addUser() {
    if (!nf.firstName.trim() || !nf.lastName.trim()) {
      setAddErr('Vor- und Nachname erforderlich / Ad ve soyad gerekli'); return;
    }
    const id   = 'u_' + Date.now();
    const name = nf.firstName.trim() + ' ' + nf.lastName.trim();
    const newUser = { id, name, role:'participant', permissions:[] };
    const newExtras = [...extras, newUser];
    const newPins   = { ...pins, [id]: '0000' };
    setExtras(newExtras); setPins(newPins);
    save('extraUsers', newExtras); save('pins', newPins);
    setShowAdd(false); setNf({ firstName:'', lastName:'' }); setAddErr('');
  }

  function removeUser(id) {
    const ne = extras.filter(u => u.id !== id);
    setExtras(ne); save('extraUsers', ne);
    const np = { ...pins };
    delete np[id];
    setPins(np); save('pins', np);
    if (lockState[id]) {
      const newLock = { ...lockState };
      delete newLock[id];
      save('lockState', newLock);
    }
  }

  function togglePerm(uid, permId) {
    const ne = extras.map(u => {
      if (u.id !== uid) return u;
      const perms = u.permissions || [];
      const next  = perms.includes(permId)
        ? perms.filter(p => p !== permId)
        : [...perms, permId];
      return { ...u, permissions: next };
    });
    setExtras(ne); save('extraUsers', ne);
  }

  const permUser   = extras.find(u => u.id === permEditId);
  const resetUser  = allUsers.find(u => u.id === resetId);
  const unlockUser = allUsers.find(u => u.id === unlockId);

  // ── Migrations-Statistik ──────────────────────────────────────
  let migrated = 0, legacy = 0, locked = 0;
  for (const u of allUsers) {
    if (isUserLocked(u.id)) locked++;
    if (isLegacyPin(pins[u.id])) legacy++;
    else migrated++;
  }
  const total = allUsers.length;
  const pct   = total ? Math.round((migrated / total) * 100) : 0;
  const barColor = pct === 100 ? GN : pct >= 50 ? P : YL;

  // ── Badge-Komponente ──────────────────────────────────────────
  function StatusBadges({ uid }) {
    const isLocked = isUserLocked(uid);
    const isLegacy = isLegacyPin(pins[uid]);
    return (
      <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginTop:3 }}>
        {isLocked && (
          <span style={{
            fontSize:10, padding:'2px 7px', background: RD + '20', color: RD,
            borderRadius:10, fontWeight:'bold'
          }}>
            🔒 GESPERRT / KİLİTLİ
          </span>
        )}
        {isLegacy ? (
          <span style={{
            fontSize:10, padding:'2px 7px', background: YL + '20', color: YL,
            borderRadius:10, fontWeight:'bold'
          }}>
            ⚠ Standard-PIN / Varsayılan PIN
          </span>
        ) : (
          <span style={{
            fontSize:10, padding:'2px 7px', background: GN + '20', color: GN,
            borderRadius:10, fontWeight:'bold'
          }}>
            ✓ Eigenes Passwort / Kendi şifresi
          </span>
        )}
      </div>
    );
  }

  // ── User-Aktions-Buttons (Reset + Unlock) ─────────────────────
  function UserActions({ uid }) {
    const isLocked = isUserLocked(uid);
    return (
      <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
        {isLocked && (
          <Btn sm col={GN} onClick={() => setUnlockId(uid)}>
            🔓 Entsperren / Kilidi Aç
          </Btn>
        )}
        <Btn sm outline onClick={() => setResetId(uid)}>
          🔄 Passwort zurücksetzen
        </Btn>
      </div>
    );
  }

  return (
    <div>
      <PH title="🔐 Nutzerverwaltung / Kullanıcı Yönetimi">
        <Btn onClick={() => setShowAdd(s => !s)}>+ Teilnehmer / Katılımcı</Btn>
      </PH>

      {/* ── Migrations-Fortschritt ──────────────────────────── */}
      <Card>
        <div style={{ fontSize:13, fontWeight:'bold', color:P, marginBottom:10 }}>
          🔐 Sicherheitsstatus / Güvenlik Durumu
        </div>
        <div style={{
          display:'flex', alignItems:'center',
          gap:12, marginBottom:10
        }}>
          <div style={{
            flex:1, background:'#e8e8e8', borderRadius:8,
            height:14, overflow:'hidden'
          }}>
            <div style={{
              width: `${pct}%`, height:'100%',
              background: barColor,
              transition:'width 0.3s'
            }}/>
          </div>
          <div style={{
            fontSize:12, fontWeight:'bold', color:P,
            minWidth:64, textAlign:'right'
          }}>
            {migrated}/{total} ({pct}%)
          </div>
        </div>
        <div style={{
          display:'flex', gap:14, flexWrap:'wrap', fontSize:11
        }}>
          <span style={{ color:GN }}>
            ✓ {migrated} eigenes Passwort / kendi şifresi
          </span>
          <span style={{ color:YL }}>
            ⚠ {legacy} Standard-PIN / varsayılan PIN
          </span>
          {locked > 0 && (
            <span style={{ color:RD, fontWeight:'bold' }}>
              🔒 {locked} gesperrt / kilitli
            </span>
          )}
        </div>
      </Card>

      <div style={{
        background:'#fff9e6', border:`1px solid ${YL}`,
        borderRadius:8, padding:'10px 14px', marginBottom:14,
        fontSize:12, color:'#7a5500', lineHeight:1.5
      }}>
        ⚠️ <b>Standard-PIN: 0000</b> · Beim ersten Login muss jeder Nutzer ein eigenes Passwort
        setzen (mind. 8 Zeichen, 1 Großbuchstabe, 1 Zahl, 1 Sonderzeichen).
        Nach <b>3 Fehlversuchen</b> wird der Account automatisch gesperrt.
        <br/>
        İlk girişte her kullanıcı kendi şifresini ayarlamalıdır (en az 8 karakter, 1 büyük harf,
        1 rakam, 1 özel karakter). <b>3 hatalı girişten</b> sonra hesap otomatik kilitlenir.
      </div>

      {showAdd && (
        <IForm title="Neuer Teilnehmer / Yeni Katılımcı" onClose={() => setShowAdd(false)}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
            <Fi label="Vorname / Ad"      value={nf.firstName} onChange={v => setNf({ ...nf, firstName:v })} ph="z.B. Ali"/>
            <Fi label="Nachname / Soyad"  value={nf.lastName}  onChange={v => setNf({ ...nf, lastName:v })}  ph="z.B. Yılmaz"/>
          </div>
          {addErr && <div style={{ color:RD, fontSize:12, marginBottom:8 }}>❌ {addErr}</div>}
          <div style={{
            background:LT, borderRadius:6, padding:'8px 12px',
            fontSize:11, color:GR, marginBottom:10
          }}>
            ℹ️ Neuer Nutzer bekommt Standard-PIN <b>0000</b> · muss beim ersten Login eigenes Passwort setzen.
            <br/>
            Yeni kullanıcı varsayılan PIN <b>0000</b> alır · ilk girişte kendi şifresini ayarlamalıdır.
          </div>
          <div style={{ display:'flex', gap:8 }}>
            <Btn outline onClick={() => setShowAdd(false)}>{t.cancel}</Btn>
            <Btn onClick={addUser}>Hinzufügen / Ekle</Btn>
          </div>
        </IForm>
      )}

      {resetId && resetUser && (
        <IForm
          title="Passwort zurücksetzen / Şifreyi Sıfırla"
          onClose={() => setResetId(null)}
        >
          <div style={{ fontSize:13, marginBottom:14, lineHeight:1.5 }}>
            Passwort von <b style={{ color:P }}>{resetUser.name}</b> wird auf den Standard-PIN
            <b> 0000</b> zurückgesetzt.
            {isUserLocked(resetUser.id) && <> Konto wird gleichzeitig <b>entsperrt</b>.</>}
            <br/><br/>
            <b style={{ color:P }}>{resetUser.name}</b> kullanıcısının şifresi varsayılan PIN
            <b> 0000</b> olarak sıfırlanacak.
            {isUserLocked(resetUser.id) && <> Hesap aynı zamanda <b>kilidi açılacak</b>.</>}
            <div style={{
              marginTop:10, padding:10, background: YL + '15',
              borderRadius:6, fontSize:12, color:'#7a5500'
            }}>
              ℹ️ Beim nächsten Login muss der Nutzer ein neues Passwort setzen.
              <br/>
              Sonraki girişte kullanıcı yeni bir şifre belirlemelidir.
            </div>
          </div>
          <div style={{ display:'flex', gap:8 }}>
            <Btn outline onClick={() => setResetId(null)}>{t.cancel}</Btn>
            <Btn col={YL} onClick={() => resetPassword(resetId)}>
              🔄 Zurücksetzen / Sıfırla
            </Btn>
          </div>
        </IForm>
      )}

      {unlockId && unlockUser && (
        <IForm
          title="Konto entsperren / Hesap kilidini aç"
          onClose={() => setUnlockId(null)}
        >
          <div style={{ fontSize:13, marginBottom:14, lineHeight:1.5 }}>
            Konto von <b style={{ color:P }}>{unlockUser.name}</b> wird entsperrt.
            Das Passwort bleibt unverändert.
            <br/><br/>
            <b style={{ color:P }}>{unlockUser.name}</b> hesabının kilidi açılacak.
            Şifre değişmeden kalır.
          </div>
          <div style={{ display:'flex', gap:8 }}>
            <Btn outline onClick={() => setUnlockId(null)}>{t.cancel}</Btn>
            <Btn col={GN} onClick={() => unlockOnly(unlockId)}>
              🔓 Entsperren / Kilidi Aç
            </Btn>
          </div>
        </IForm>
      )}

      {permEditId && permUser && (
        <IForm
          title={`🔑 Berechtigungen: ${permUser.name}`}
          onClose={() => setPermEditId(null)}
        >
          <div style={{ fontSize:12, color:GR, marginBottom:12 }}>
            Welche Module darf <b>{permUser.name}</b> bearbeiten?
          </div>
          {PERM_LIST.map(perm => {
            const active = (permUser.permissions || []).includes(perm.id);
            return (
              <div
                key={perm.id}
                onClick={() => togglePerm(permUser.id, perm.id)}
                style={{
                  display:'flex', alignItems:'center', gap:12,
                  padding:'10px 12px', borderRadius:8, marginBottom:6,
                  background: active ? LT : '#f8f9fc',
                  border: `1px solid ${active ? P : '#e0e0e0'}`,
                  cursor:'pointer'
                }}
              >
                <div style={{
                  width:20, height:20, borderRadius:4,
                  background: active ? P : '#fff',
                  border: `2px solid ${active ? P : '#ccc'}`,
                  display:'flex', alignItems:'center', justifyContent:'center',
                  flexShrink:0
                }}>
                  {active && <span style={{ color:'#fff', fontSize:13, lineHeight:1 }}>✓</span>}
                </div>
                <div>
                  <div style={{
                    fontSize:13,
                    fontWeight: active ? 'bold' : 'normal',
                    color: active ? P : '#333'
                  }}>{perm.label}</div>
                  <div style={{ fontSize:11, color:GR }}>{perm.labelTr}</div>
                </div>
              </div>
            );
          })}
          <div style={{ marginTop:8 }}>
            <Btn onClick={() => setPermEditId(null)}>{t.save}</Btn>
          </div>
        </IForm>
      )}

      <Card title="Core Team">
        {CORE.map(u => (
          <div key={u.id} style={{
            display:'flex', alignItems:'center', justifyContent:'space-between',
            padding:'10px 0', borderBottom:'1px solid #f2f2f2',
            gap:8, flexWrap:'wrap'
          }}>
            <div style={{ display:'flex', alignItems:'center', gap:12, flex:1, minWidth:200 }}>
              <Av name={u.name}/>
              <div>
                <div style={{ fontWeight:'bold', color:P, fontSize:13 }}>{u.name}</div>
                <div style={{ fontSize:11, color:GR }}>
                  {u.role} · {getInit(u.name)} · Vollzugriff / Tam yetki
                </div>
                <StatusBadges uid={u.id}/>
              </div>
            </div>
            <UserActions uid={u.id}/>
          </div>
        ))}
      </Card>

      {extras.length > 0 && (
        <Card title="Teilnehmer / Katılımcılar">
          {extras.map(u => {
            const perms = u.permissions || [];
            return (
              <div key={u.id} style={{ padding:'10px 0', borderBottom:'1px solid #f2f2f2' }}>
                <div style={{
                  display:'flex', alignItems:'center', justifyContent:'space-between',
                  gap:8, flexWrap:'wrap'
                }}>
                  <div style={{ display:'flex', alignItems:'center', gap:12, flex:1, minWidth:200 }}>
                    <Av name={u.name}/>
                    <div>
                      <div style={{ fontWeight:'bold', color:P, fontSize:13 }}>{u.name}</div>
                      <div style={{ fontSize:11, color:GR }}>{getInit(u.name)}</div>
                      <StatusBadges uid={u.id}/>
                    </div>
                  </div>
                  <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                    <Btn sm outline onClick={() => setPermEditId(u.id)}>🔑 Rechte</Btn>
                    {isUserLocked(u.id) && (
                      <Btn sm col={GN} onClick={() => setUnlockId(u.id)}>🔓 Entsperren</Btn>
                    )}
                    <Btn sm outline onClick={() => setResetId(u.id)}>🔄 Reset</Btn>
                    <Btn sm danger  onClick={() => removeUser(u.id)}>✕</Btn>
                  </div>
                </div>
                {perms.length > 0 && (
                  <div style={{
                    marginTop:6, marginLeft:48,
                    display:'flex', gap:6, flexWrap:'wrap'
                  }}>
                    {perms.map(pid => {
                      const pl = PERM_LIST.find(p => p.id === pid);
                      return pl ? (
                        <span key={pid} style={{
                          fontSize:10, padding:'2px 7px',
                          background:LT, color:P, borderRadius:10,
                          border:`1px solid ${P}40`
                        }}>
                          ✓ {pl.label}
                        </span>
                      ) : null;
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </Card>
      )}
    </div>
  );
}
