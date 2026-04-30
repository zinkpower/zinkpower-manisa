// ZINKPOWER Manisa — core.jsx V14
// Änderungen ggü. V13:
// - Übersetzungen für Login-Sperre (3 Fehlversuche) DE/TR
// - DEF.lockState: {} als initialer State
// - Sonst unverändert
import { useState, useEffect, useRef } from "react";

// ════════════════════════════════════════════════════════════════
// FARBEN
// ════════════════════════════════════════════════════════════════
export const P  = '#283898';
export const GR = '#575756';
export const LT = '#dde3f5';
export const GN = '#27ae60';
export const YL = '#e67e22';
export const RD = '#e74c3c';

export const CORE = [
  { id: 'peter',   name: 'Peter Siemund',  role: 'admin' },
  { id: 'alper',   name: 'Alper Bulca',    role: 'admin' },
  { id: 'karsten', name: 'Karsten Köhler', role: 'approver' },
  { id: 'felix',   name: 'Felix Holbe',    role: 'approver' },
];

export const PERM_LIST = [
  { id: 'schedule',       label: 'Bauzeitenplan bearbeiten', labelTr: 'İnşaat takvimini düzenle' },
  { id: 'contracts_view', label: 'Verträge einsehen',        labelTr: 'Sözleşmeleri görüntüle' },
  { id: 'contracts',      label: 'Verträge hinzufügen',      labelTr: 'Sözleşme ekle' },
  { id: 'suppliers',      label: 'Lieferanten bearbeiten',   labelTr: 'Tedarikçileri düzenle' },
  { id: 'documents',      label: 'Dokumente hochladen',      labelTr: 'Belge yükle' },
  { id: 'budget',         label: 'Budget einsehen',          labelTr: 'Bütçeyi görüntüle' },
];

export function getInit(name) {
  const p = (name || '?').trim().split(/\s+/);
  return p.length < 2
    ? p[0][0].toUpperCase()
    : (p[0][0] + p[p.length - 1][0]).toUpperCase();
}

export function useIsMobile() {
  const [mob, setMob] = useState(window.innerWidth < 768);
  useEffect(() => {
    const h = () => setMob(window.innerWidth < 768);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);
  return mob;
}

// ════════════════════════════════════════════════════════════════
// PASSWORT-UTILITIES (V13)
// ════════════════════════════════════════════════════════════════
export function isLegacyPin(stored) {
  return typeof stored === 'string';
}

export function validatePassword(pw) {
  if (!pw || pw.length < 8) return 'pw_err_length';
  if (!/\p{Lu}/u.test(pw))  return 'pw_err_upper';
  if (!/\p{N}/u.test(pw))   return 'pw_err_digit';
  if (!/[^\p{L}\p{N}]/u.test(pw)) return 'pw_err_special';
  return null;
}

function bytesToB64(bytes) {
  let s = '';
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return btoa(s);
}
function b64ToBytes(b64) {
  const s = atob(b64);
  const bytes = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) bytes[i] = s.charCodeAt(i);
  return bytes;
}

const PBKDF2_ITERATIONS = 100000;

async function deriveBits(password, salt) {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  );
  return crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
    key,
    256
  );
}

export async function hashPassword(password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const bits = await deriveBits(password, salt);
  return {
    v: 2,
    salt: bytesToB64(salt),
    hash: bytesToB64(new Uint8Array(bits)),
  };
}

export async function verifyPassword(password, stored) {
  if (!stored || typeof stored !== 'object' || !stored.salt || !stored.hash) return false;
  try {
    const salt = b64ToBytes(stored.salt);
    const bits = await deriveBits(password, salt);
    const computed = bytesToB64(new Uint8Array(bits));
    if (computed.length !== stored.hash.length) return false;
    let diff = 0;
    for (let i = 0; i < computed.length; i++) {
      diff |= computed.charCodeAt(i) ^ stored.hash.charCodeAt(i);
    }
    return diff === 0;
  } catch (e) {
    console.error('verifyPassword error:', e);
    return false;
  }
}

// ════════════════════════════════════════════════════════════════
// V14: LOCK-HELFER (3 Fehlversuche)
// ════════════════════════════════════════════════════════════════
export const MAX_LOGIN_ATTEMPTS = 3;

export function getLock(lockState, uid) {
  return (lockState && lockState[uid]) || { fails: 0, locked: false };
}

// ════════════════════════════════════════════════════════════════
// KALENDER
// ════════════════════════════════════════════════════════════════
export const MNAMES = [
  'Januar / Ocak', 'Februar / Şubat', 'März / Mart', 'April / Nisan',
  'Mai / Mayıs', 'Juni / Haziran', 'Juli / Temmuz', 'August / Ağustos',
  'September / Eylül', 'Oktober / Ekim', 'November / Kasım', 'Dezember / Aralık'
];
export const DNAMES = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

// ════════════════════════════════════════════════════════════════
// ÜBERSETZUNGEN
// ════════════════════════════════════════════════════════════════
export const T = {
  de: {
    login:'Anmelden', sel:'Nutzer wählen', logout:'Abmelden', save:'Speichern', add:'Hinzufügen',
    cancel:'Abbrechen', approve:'Freigeben', reject:'Ablehnen', review:'Prüfen', edit:'Bearbeiten',
    dash:'Übersicht', schedule:'Bauzeitenplan', contracts:'Verträge', co:'Nachträge',
    approvals:'Freigaben', issues:'Mängel', diary:'Bautagebuch', docs:'Dokumente',
    contacts:'Kontakte', gallery:'Fotos', suppliers:'Lieferanten', budget:'Budget',
    onTrack:'Im Plan', warning:'Beobachten', critical:'Eingriff nötig',
    open:'Offen', inProgress:'In Bearbeitung', resolved:'Behoben',
    submitted:'Eingereicht', inReview:'In Prüfung', approved:'Freigegeben', rejected:'Abgelehnt',
    active:'Aktiv', ordered:'Bestellt', delivered:'Geliefert',
    no_data:'Keine Daten', loading:'Lade Wetterdaten…', new_entry:'Neuer Eintrag',
    upload:'Foto hochladen', date:'Datum', name:'Name', desc:'Beschreibung',
    amount:'Betrag (€)', comment:'Kommentar', title:'Titel', notes:'Notizen',
    contractor:'Auftragnehmer', phase:'Phase', planned:'Geplant', actual:'Ist',
    start:'Start', end:'Ende', status:'Status', priority:'Priorität',
    high:'Hoch', medium:'Mittel', low:'Niedrig', assigned:'Zugewiesen',
    phone:'Telefon', email:'E-Mail', role:'Rolle', company:'Firma',
    material:'Material', supplier:'Lieferant', quantity:'Menge', unit:'Einheit',
    expected:'Erwartet', version:'Version', category:'Kategorie', uploaded:'Hochgeladen von',
    workers:'Arbeiter', work_done:'Geleistete Arbeiten', special:'Besonderheiten',
    total:'Gesamtbudget', committed:'Gebunden', spent:'Abgerufen', remaining:'Verbleibend',
    pname:'Projektname', loc:'Standort', pstart:'Beginn', pend:'Geplantes Ende', type:'Typ',
    delete:'Löschen', really_delete:'wirklich löschen?',
    tasks:'Aufgaben', task_topic:'Thema', task_topic_ph:'z.B. Statik prüfen',
    task_due:'Frist', task_assigned_users:'App-Nutzer zuweisen', task_assigned_contacts:'Kontakte zuweisen',
    task_no_contacts:'Keine Kontakte vorhanden', task_assigned_to:'Zugewiesen an',
    task_login_user:'App-Nutzer', task_created_by:'Erstellt von', task_done:'Erledigt',
    task_open_title:'Offene Aufgaben', task_done_title:'Erledigte Aufgaben',
    task_no_open:'Keine offenen Aufgaben', task_overdue_suffix:'T überfällig',
    task_today:'heute fällig', task_in_days:'in', task_orig_deadline:'urspr. Frist',
    task_reopen:'Wieder öffnen', task_edit:'Aufgabe bearbeiten', task_new:'Neue Aufgabe',
    task_delete_q:'Aufgabe löschen?', task_info_nonadmin:'Du siehst nur Aufgaben, die du erstellt hast oder die dir zugewiesen wurden.',
    rem_title:'Erinnerung: fällige Aufgaben', rem_overdue:'ÜBERFÄLLIG', rem_today:'HEUTE',
    rem_tomorrow:'MORGEN', rem_count_singular:'Aufgabe fällig', rem_count_plural:'Aufgaben fällig',
    rem_send_to:'Senden an', rem_no_contact:'Kein Kontakt zugewiesen', rem_ok:'OK, verstanden',

    // V13: Passwort-Flow
    password:'Passwort',
    pin_or_password:'PIN / Passwort',
    pw_change_required:'Passwort ändern erforderlich',
    pw_change_intro:'Aus Sicherheitsgründen muss dein PIN durch ein neues Passwort ersetzt werden.',
    pw_current:'Aktueller PIN / aktuelles Passwort',
    pw_new:'Neues Passwort',
    pw_repeat:'Passwort wiederholen',
    pw_rules_title:'Anforderungen:',
    pw_rule_length:'Mindestens 8 Zeichen',
    pw_rule_upper:'Mindestens 1 Großbuchstabe',
    pw_rule_digit:'Mindestens 1 Zahl',
    pw_rule_special:'Mindestens 1 Sonderzeichen',
    pw_err_length:'Mindestens 8 Zeichen erforderlich',
    pw_err_upper:'Mindestens 1 Großbuchstabe erforderlich',
    pw_err_digit:'Mindestens 1 Zahl erforderlich',
    pw_err_special:'Mindestens 1 Sonderzeichen erforderlich',
    pw_err_mismatch:'Passwörter stimmen nicht überein',
    pw_err_current_wrong:'Aktueller PIN/Passwort falsch',
    pw_err_wrong:'Falsches Passwort',
    pw_change_btn:'Passwort speichern',
    pw_processing:'Verarbeite…',

    // V14: Lock (3 Fehlversuche)
    err_attempts_2:'Falsches Passwort — noch 2 Versuche',
    err_attempts_1:'Falsches Passwort — letzter Versuch!',
    err_locked_now:'🔒 Account gesperrt! Bitte Admin kontaktieren.',
    err_locked:'🔒 Account gesperrt — bitte Admin kontaktieren',
  },
  tr: {
    login:'Giriş Yap', sel:'Kullanıcı Seç', logout:'Çıkış', save:'Kaydet', add:'Ekle',
    cancel:'İptal', approve:'Onayla', reject:'Reddet', review:'İncele', edit:'Düzenle',
    dash:'Genel Bakış', schedule:'İnşaat Takvimi', contracts:'Sözleşmeler', co:'Ek İşler',
    approvals:'Onaylar', issues:'Sorunlar', diary:'Şantiye Günlüğü', docs:'Belgeler',
    contacts:'Kişiler', gallery:'Fotoğraflar', suppliers:'Tedarikçiler', budget:'Bütçe',
    onTrack:'Planlamada', warning:'İzleniyor', critical:'Müdahale Gerekli',
    open:'Açık', inProgress:'Devam Ediyor', resolved:'Çözüldü',
    submitted:'Gönderildi', inReview:'İncelemede', approved:'Onaylandı', rejected:'Reddedildi',
    active:'Aktif', ordered:'Sipariş Edildi', delivered:'Teslim Edildi',
    no_data:'Veri yok', loading:'Hava yükleniyor…', new_entry:'Yeni Giriş',
    upload:'Fotoğraf Yükle', date:'Tarih', name:'Ad', desc:'Açıklama',
    amount:'Tutar (€)', comment:'Yorum', title:'Başlık', notes:'Notlar',
    contractor:'Müteahhit', phase:'Aşama', planned:'Planlanan', actual:'Gerçekleşen',
    start:'Başlangıç', end:'Bitiş', status:'Durum', priority:'Öncelik',
    high:'Yüksek', medium:'Orta', low:'Düşük', assigned:'Atanan',
    phone:'Telefon', email:'E-posta', role:'Rol', company:'Şirket',
    material:'Malzeme', supplier:'Tedarikçi', quantity:'Miktar', unit:'Birim',
    expected:'Beklenen', version:'Versiyon', category:'Kategori', uploaded:'Yükleyen',
    workers:'İşçiler', work_done:'Yapılan İşler', special:'Özel Durumlar',
    total:'Toplam Bütçe', committed:'Taahhüt', spent:'Harcanan', remaining:'Kalan',
    pname:'Proje Adı', loc:'Konum', pstart:'Başlangıç', pend:'Planlanan Bitiş', type:'Tür',
    delete:'Sil', really_delete:'gerçekten silinsin mi?',
    tasks:'Görevler', task_topic:'Konu', task_topic_ph:'örn. Statik kontrolü',
    task_due:'Son Tarih', task_assigned_users:'Uygulama kullanıcısı ata', task_assigned_contacts:'Kişi ata',
    task_no_contacts:'Kişi yok', task_assigned_to:'Atanan',
    task_login_user:'Uygulama kullanıcısı', task_created_by:'Oluşturan', task_done:'Tamamlandı',
    task_open_title:'Açık Görevler', task_done_title:'Tamamlanan Görevler',
    task_no_open:'Açık görev yok', task_overdue_suffix:'G gecikti',
    task_today:'bugün son', task_in_days:'kalan', task_orig_deadline:'orijinal son',
    task_reopen:'Yeniden Aç', task_edit:'Görevi Düzenle', task_new:'Yeni Görev',
    task_delete_q:'Görev silinsin mi?', task_info_nonadmin:'Sadece oluşturduğunuz veya size atanan görevleri görüyorsunuz.',
    rem_title:'Hatırlatma: süresi dolan görevler', rem_overdue:'GECİKTİ', rem_today:'BUGÜN',
    rem_tomorrow:'YARIN', rem_count_singular:'görev son tarihi', rem_count_plural:'görev son tarihi',
    rem_send_to:'Gönderilecek', rem_no_contact:'Kişi atanmamış', rem_ok:'Tamam, anladım',

    // V13: Şifre akışı
    password:'Şifre',
    pin_or_password:'PIN / Şifre',
    pw_change_required:'Şifre değiştirmek zorunlu',
    pw_change_intro:'Güvenlik nedeniyle PIN\'iniz yeni bir şifre ile değiştirilmelidir.',
    pw_current:'Mevcut PIN / şifre',
    pw_new:'Yeni şifre',
    pw_repeat:'Şifreyi tekrar girin',
    pw_rules_title:'Gereksinimler:',
    pw_rule_length:'En az 8 karakter',
    pw_rule_upper:'En az 1 büyük harf',
    pw_rule_digit:'En az 1 rakam',
    pw_rule_special:'En az 1 özel karakter',
    pw_err_length:'En az 8 karakter olmalı',
    pw_err_upper:'En az 1 büyük harf olmalı',
    pw_err_digit:'En az 1 rakam olmalı',
    pw_err_special:'En az 1 özel karakter olmalı',
    pw_err_mismatch:'Şifreler eşleşmiyor',
    pw_err_current_wrong:'Mevcut PIN/şifre yanlış',
    pw_err_wrong:'Yanlış şifre',
    pw_change_btn:'Şifreyi kaydet',
    pw_processing:'İşleniyor…',

    // V14: Kilit (3 hatalı deneme)
    err_attempts_2:'Yanlış şifre — 2 deneme kaldı',
    err_attempts_1:'Yanlış şifre — son deneme!',
    err_locked_now:'🔒 Hesap kilitlendi! Yöneticiyle iletişime geçin.',
    err_locked:'🔒 Hesap kilitli — yöneticiyle iletişime geçin',
  },
};

export const SCHED = [
  { id:1, phase:'Genehmigungen / İzinler',           ps:'2025-03-01', pe:'2025-04-30', as:'2025-03-01', ae:'2025-05-15', st:'warning' },
  { id:2, phase:'Erdarbeiten / Hafriyat',            ps:'2025-04-01', pe:'2025-06-30', as:'2025-04-15', ae:'2025-07-10', st:'warning' },
  { id:3, phase:'Fundamente / Temel',                ps:'2025-05-01', pe:'2025-08-31', as:'2025-05-20', ae:'',           st:'onTrack' },
  { id:4, phase:'Stahlbau / Çelik Konstrüksiyon',    ps:'2025-07-01', pe:'2025-12-31', as:'2025-07-15', ae:'',           st:'onTrack' },
  { id:5, phase:'Dach & Fassade / Çatı & Cephe',     ps:'2025-10-01', pe:'2026-02-28', as:'',           ae:'',           st:'onTrack' },
  { id:6, phase:'Anlagentechnik / Tesis Teknolojisi', ps:'2025-11-01', pe:'2026-04-30', as:'',           ae:'',           st:'onTrack' },
  { id:7, phase:'Elektro & MSR',                     ps:'2026-01-01', pe:'2026-05-31', as:'',           ae:'',           st:'onTrack' },
  { id:8, phase:'Inbetriebnahme / Devreye Alma',     ps:'2026-05-01', pe:'2026-06-30', as:'',           ae:'',           st:'onTrack' },
];

export const EF_PHASE = { phase:'', ps:'', pe:'', as:'', ae:'', st:'onTrack' };

export const SUP_CATS = [
  'Stahlbau', 'Beschichtung / Boya', 'Elektro', 'Logistik / Nakliye',
  'Beton', 'Isolierung', 'Montage', 'Sonstiges / Diğer'
];

export const DEF = {
  project: {
    name:'ZINKPOWER Manisa', loc:'Manisa, Türkiye',
    pstart:'2025-03-01', pend:'2026-06-30',
    desc:'Neubau Feuerverzinkungsanlage / Yeni Galvaniz Tesisi'
  },
  schedule: SCHED,
  contracts: [
    { id:1, title:'Stahlbau – Sipil İnşaat', contractor:'Sipil İnşaat Ltd.',
      amount:2800000, date:'2025-02-15', status:'active', notes:'~170t Stahl' }
  ],
  changeOrders: [],
  approvals: [
    { id:1, title:'Schweißnähte Stahlbau / Kaynak Dikişleri',  assigned:'peter',   status:'open', notes:'Haupt-Schweißnähte prüfen', photos:[] },
    { id:2, title:'Fundamentbewehrung / Temel Donatısı',       assigned:'karsten', status:'open', notes:'Bewehrungsplan Rev.3',       photos:[] },
    { id:3, title:'Korrosionsschutz / Korozyon Boyası',        assigned:'felix',   status:'open', notes:'2K-Epoxy Grundierung',       photos:[] },
    { id:4, title:'Kranbahnträger / Vinç Ray Kirişi',          assigned:'peter',   status:'open', notes:'HEB 400, L=24m',             photos:[] },
  ],
  issues: [], diary: [], documents: [],
  contacts: [
    { id:1, name:'Peter Siemund', role:'Geschäftsführer / Genel Müdür',
      company:'ZINKPOWER KOPF GRUPPE', phone:'', email:'' }
  ],
  gallery: [], suppliers: [], supplierProfiles: [],
  budget: { total:5500000, payments:[] },
  tasks: [],
  extraUsers: [],
  pins: { peter:'0000', alper:'0000', karsten:'0000', felix:'0000' },
  // V14: Login-Fehlversuche je User
  lockState: {},
};

// ════════════════════════════════════════════════════════════════
// UI-BAUSTEINE
// ════════════════════════════════════════════════════════════════

export function Badge({ status, t }) {
  const m = {
    onTrack:GN, warning:YL, critical:RD,
    open:YL, inProgress:'#3498db', resolved:GN,
    submitted:'#3498db', inReview:YL, approved:GN, rejected:RD,
    active:GN, ordered:YL, delivered:GN
  };
  const c = m[status] || GR;
  return (
    <span style={{
      padding:'2px 9px', background:c+'25', color:c,
      borderRadius:10, fontSize:11, fontWeight:'bold'
    }}>
      {t[status] || status}
    </span>
  );
}

export function Btn({ onClick, children, sm, danger, outline, disabled, col }) {
  const c = col || P;
  const bg = disabled ? '#ccc' : danger ? RD : outline ? 'transparent' : c;
  const fg = disabled ? '#999' : outline ? c : '#fff';
  return (
    <button
      onClick={onClick}
      disabled={!!disabled}
      style={{
        padding: sm ? '4px 11px' : '7px 15px',
        background: bg, color: fg,
        border: outline ? `1px solid ${c}` : 'none',
        borderRadius: 6,
        fontSize: sm ? 11 : 13,
        cursor: disabled ? 'default' : 'pointer',
        fontFamily: 'Arial', fontWeight: 'bold'
      }}
    >
      {children}
    </button>
  );
}

export function Card({ children, title, action }) {
  return (
    <div style={{
      background:'#fff', borderRadius:10, padding:18,
      marginBottom:12, boxShadow:'0 1px 8px rgba(40,56,152,0.07)'
    }}>
      {(title || action) && (
        <div style={{
          display:'flex', justifyContent:'space-between',
          alignItems:'center', marginBottom:12
        }}>
          {title && <b style={{ color:P, fontSize:14 }}>{title}</b>}
          {action}
        </div>
      )}
      {children}
    </div>
  );
}

export function IForm({ title, onClose, children }) {
  return (
    <div style={{
      background:'#f8f9fc', border:`1px solid ${LT}`,
      borderRadius:10, padding:18, marginBottom:12
    }}>
      <div style={{
        display:'flex', justifyContent:'space-between',
        alignItems:'center', marginBottom:14
      }}>
        <b style={{ color:P, fontSize:14 }}>{title}</b>
        {onClose && (
          <button
            onClick={onClose}
            style={{ background:'none', border:'none', fontSize:18, cursor:'pointer', color:GR }}
          >✕</button>
        )}
      </div>
      {children}
    </div>
  );
}

export function Fi({ label, value, onChange, type, ph }) {
  return (
    <div style={{ marginBottom:9 }}>
      {label && <label style={{ display:'block', fontSize:11, color:GR, marginBottom:2 }}>{label}</label>}
      <input
        type={type || 'text'}
        value={value}
        placeholder={ph || ''}
        onChange={e => onChange(e.target.value)}
        style={{
          width:'100%', padding:'7px 10px', border:'1px solid #ddd',
          borderRadius:6, fontSize:13, fontFamily:'Arial', boxSizing:'border-box'
        }}
      />
    </div>
  );
}

export function Ft({ label, value, onChange, rows }) {
  return (
    <div style={{ marginBottom:9 }}>
      {label && <label style={{ display:'block', fontSize:11, color:GR, marginBottom:2 }}>{label}</label>}
      <textarea
        value={value}
        rows={rows || 3}
        onChange={e => onChange(e.target.value)}
        style={{
          width:'100%', padding:'7px 10px', border:'1px solid #ddd',
          borderRadius:6, fontSize:13, fontFamily:'Arial',
          resize:'vertical', boxSizing:'border-box'
        }}
      />
    </div>
  );
}

export function Fs({ label, value, onChange, opts }) {
  return (
    <div style={{ marginBottom:9 }}>
      {label && <label style={{ display:'block', fontSize:11, color:GR, marginBottom:2 }}>{label}</label>}
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{
          width:'100%', padding:'7px 10px', border:'1px solid #ddd',
          borderRadius:6, fontSize:13, fontFamily:'Arial'
        }}
      >
        {opts.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
      </select>
    </div>
  );
}

export function PicUpload({ onPhoto, t, uploadFile, folder }) {
  const ref = useRef(null);
  const [busy, setBusy] = useState(false);

  async function handle(e) {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    e.target.value = '';

    if (uploadFile) {
      setBusy(true);
      const url = await uploadFile(f, folder || 'photos');
      setBusy(false);
      if (url) onPhoto(url);
      return;
    }

    const r = new FileReader();
    r.onload = ev => onPhoto(ev.target.result);
    r.readAsDataURL(f);
  }

  return (
    <>
      <input
        ref={ref} type="file" accept="image/*"
        onChange={handle} style={{ display:'none' }}
      />
      <Btn sm outline disabled={busy} onClick={() => ref.current && ref.current.click()}>
        {busy ? '⏳ Upload…' : `📷 ${t.upload}`}
      </Btn>
    </>
  );
}

export function Thumbs({ photos }) {
  if (!photos || !photos.length) return null;
  return (
    <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginTop:8 }}>
      {photos.map((p, i) => (
        <img
          key={i} src={p} alt=""
          style={{
            width:54, height:54, objectFit:'cover',
            borderRadius:6, border:`2px solid ${LT}`
          }}
        />
      ))}
    </div>
  );
}

export function PH({ title, children }) {
  return (
    <div style={{
      display:'flex', justifyContent:'space-between',
      alignItems:'center', marginBottom:14
    }}>
      <h2 style={{ color:P, fontSize:17, margin:0 }}>{title}</h2>
      <div style={{ display:'flex', gap:8 }}>{children}</div>
    </div>
  );
}

export function Av({ name, size }) {
  const sz = size || 36;
  return (
    <div style={{
      width:sz, height:sz, borderRadius:'50%', background:P,
      color:'#fff', display:'flex', alignItems:'center',
      justifyContent:'center', fontWeight:'bold',
      fontSize: sz * 0.33, flexShrink:0
    }}>
      {getInit(name)}
    </div>
  );
}

export function CopyBtn({ text, t, sm }) {
  const [copied, setCopied] = useState(false);
  function copy(e) {
    e.stopPropagation();
    if (!text) return;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      });
    } else {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); setCopied(true); setTimeout(()=>setCopied(false),1500); } catch(err){}
      document.body.removeChild(ta);
    }
  }
  return (
    <button
      onClick={copy}
      title="Kopieren / Kopyala"
      style={{
        background:'none', border:'none', cursor:'pointer',
        padding: sm ? '0 4px' : '2px 6px', marginLeft:4,
        fontSize: sm ? 11 : 13, color: copied ? GN : GR,
        verticalAlign:'middle'
      }}
    >
      {copied ? '✓' : '📋'}
    </button>
  );
}

export function PasswordRules({ pw, t }) {
  const checks = [
    { k:'pw_rule_length',  ok: pw.length >= 8 },
    { k:'pw_rule_upper',   ok: /\p{Lu}/u.test(pw) },
    { k:'pw_rule_digit',   ok: /\p{N}/u.test(pw) },
    { k:'pw_rule_special', ok: /[^\p{L}\p{N}]/u.test(pw) },
  ];
  return (
    <div style={{
      background:'#f8f9fc', borderRadius:6, padding:'8px 12px',
      marginBottom:10, fontSize:11
    }}>
      <div style={{ color:GR, marginBottom:4, fontWeight:'bold' }}>
        {t.pw_rules_title}
      </div>
      {checks.map(c => (
        <div key={c.k} style={{
          display:'flex', alignItems:'center', gap:6, marginTop:2,
          color: c.ok ? GN : GR
        }}>
          <span style={{ fontSize:12, lineHeight:1 }}>{c.ok ? '✓' : '○'}</span>
          <span>{t[c.k]}</span>
        </div>
      ))}
    </div>
  );
}
