// ZINKPOWER Manisa — core.jsx V12
// Änderungen ggü. V11:
// - PicUpload: Storage-fähig mit Fallback auf Base64
// - CopyBtn: ergänzt (war in V11 importiert, aber teils fehlend)
import { useState, useEffect, useRef } from "react";

// ════════════════════════════════════════════════════════════════
// FARBEN / RENKLER
// ════════════════════════════════════════════════════════════════
export const P  = '#283898';   // ZINKPOWER Blau (RAL 5002)
export const GR = '#575756';   // ZINKPOWER Grau
export const LT = '#dde3f5';   // Hellblau (Hintergründe)
export const GN = '#27ae60';   // Grün (OK / im Plan)
export const YL = '#e67e22';   // Gelb / Orange (Warnung)
export const RD = '#e74c3c';   // Rot (kritisch)

// ════════════════════════════════════════════════════════════════
// NUTZER / KULLANICILAR (Core-Team, fest verdrahtet)
// ════════════════════════════════════════════════════════════════
export const CORE = [
  { id: 'peter',   name: 'Peter Siemund',  role: 'admin' },
  { id: 'alper',   name: 'Alper Bulca',    role: 'admin' },
  { id: 'karsten', name: 'Karsten Köhler', role: 'approver' },
  { id: 'felix',   name: 'Felix Holbe',    role: 'approver' },
];

// ════════════════════════════════════════════════════════════════
// BERECHTIGUNGEN für extra-Teilnehmer
// ════════════════════════════════════════════════════════════════
export const PERM_LIST = [
  { id: 'schedule',       label: 'Bauzeitenplan bearbeiten', labelTr: 'İnşaat takvimini düzenle' },
  { id: 'contracts_view', label: 'Verträge einsehen',        labelTr: 'Sözleşmeleri görüntüle' },
  { id: 'contracts',      label: 'Verträge hinzufügen',      labelTr: 'Sözleşme ekle' },
  { id: 'suppliers',      label: 'Lieferanten bearbeiten',   labelTr: 'Tedarikçileri düzenle' },
  { id: 'documents',      label: 'Dokumente hochladen',      labelTr: 'Belge yükle' },
  { id: 'budget',         label: 'Budget einsehen',          labelTr: 'Bütçeyi görüntüle' },
];

// ════════════════════════════════════════════════════════════════
// HELPERS
// ════════════════════════════════════════════════════════════════
export function getInit(name) {
  const p = (name || '?').trim().split(/\s+/);
  return p.length < 2
    ? p[0][0].toUpperCase()
    : (p[0][0] + p[p.length - 1][0]).toUpperCase();
}

// ════════════════════════════════════════════════════════════════
// MOBILE-HOOK
// ════════════════════════════════════════════════════════════════
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
// KALENDER-KONSTANTEN
// ════════════════════════════════════════════════════════════════
export const MNAMES = [
  'Januar / Ocak', 'Februar / Şubat', 'März / Mart', 'April / Nisan',
  'Mai / Mayıs', 'Juni / Haziran', 'Juli / Temmuz', 'August / Ağustos',
  'September / Eylül', 'Oktober / Ekim', 'November / Kasım', 'Dezember / Aralık'
];
export const DNAMES = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

// ════════════════════════════════════════════════════════════════
// ÜBERSETZUNGEN / ÇEVİRİLER
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
    rem_send_to:'Senden an', rem_no_contact:'Kein Kontakt zugewiesen', rem_ok:'OK, verstanden'
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
    rem_send_to:'Gönderilecek', rem_no_contact:'Kişi atanmamış', rem_ok:'Tamam, anladım'
  },
};

// ════════════════════════════════════════════════════════════════
// STANDARD-PHASEN (Bauzeitenplan)
// ════════════════════════════════════════════════════════════════
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

// ════════════════════════════════════════════════════════════════
// LIEFERANTEN-KATEGORIEN
// ════════════════════════════════════════════════════════════════
export const SUP_CATS = [
  'Stahlbau', 'Beschichtung / Boya', 'Elektro', 'Logistik / Nakliye',
  'Beton', 'Isolierung', 'Montage', 'Sonstiges / Diğer'
];

// ════════════════════════════════════════════════════════════════
// STANDARDDATEN (initialer State, wird von Supabase überschrieben)
// ════════════════════════════════════════════════════════════════
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
        <button
          onClick={onClose}
          style={{ background:'none', border:'none', fontSize:18, cursor:'pointer', color:GR }}
        >✕</button>
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

// ════════════════════════════════════════════════════════════════
// V12: PicUpload — Storage-fähig mit Fallback auf Base64
// Wenn uploadFile prop übergeben wird → Supabase Storage
// Ohne uploadFile prop → alte Base64-Variante (rückwärtskompatibel)
// ════════════════════════════════════════════════════════════════
export function PicUpload({ onPhoto, t, uploadFile, folder }) {
  const ref = useRef(null);
  const [busy, setBusy] = useState(false);

  async function handle(e) {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    e.target.value = '';

    // Neue Variante: Upload nach Supabase Storage
    if (uploadFile) {
      setBusy(true);
      const url = await uploadFile(f, folder || 'photos');
      setBusy(false);
      if (url) onPhoto(url);
      return;
    }

    // Fallback: alte Base64-Variante
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

// ════════════════════════════════════════════════════════════════
// CopyBtn — Text in Zwischenablage kopieren
// ════════════════════════════════════════════════════════════════
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
