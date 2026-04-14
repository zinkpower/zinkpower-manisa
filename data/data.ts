// ── Farben / Renkler ─────────────────────────────────────────
const P='#283898';
const GR='#575756'; 
const LT='#dde3f5'; 
const GN='#27ae60'; 
const YL='#e67e22'; 
const RD='#e74c3c';

// ── Nutzer / Kullanıcılar ─────────────────────────────────────
const CORE=[
  {id:'peter',   name:'Peter Siemund', role:'admin'},
  {id:'alper',   name:'Alper Bulca',   role:'admin'},
  {id:'karsten', name:'Karsten Köhler',role:'approver'},
  {id:'felix',   name:'Felix Holbe',   role:'approver'},
];

const T={
  de:{login:'Anmelden',sel:'Nutzer wählen',logout:'Abmelden',save:'Speichern',add:'Hinzufügen',
    cancel:'Abbrechen',approve:'Freigeben',reject:'Ablehnen',review:'Prüfen',edit:'Bearbeiten',
    dash:'Übersicht',schedule:'Bauzeitenplan',contracts:'Verträge',co:'Nachträge',
    approvals:'Freigaben',issues:'Mängel',diary:'Bautagebuch',docs:'Dokumente',
    contacts:'Kontakte',gallery:'Fotos',suppliers:'Lieferanten',budget:'Budget',
    onTrack:'Im Plan',warning:'Beobachten',critical:'Eingriff nötig',
    open:'Offen',inProgress:'In Bearbeitung',resolved:'Behoben',
    submitted:'Eingereicht',inReview:'In Prüfung',approved:'Freigegeben',rejected:'Abgelehnt',
    active:'Aktiv',ordered:'Bestellt',delivered:'Geliefert',
    no_data:'Keine Daten',loading:'Lade Wetterdaten…',new_entry:'Neuer Eintrag',
    upload:'Foto hochladen',date:'Datum',name:'Name',desc:'Beschreibung',
    amount:'Betrag (€)',comment:'Kommentar',title:'Titel',notes:'Notizen',
    contractor:'Auftragnehmer',phase:'Phase',planned:'Geplant',actual:'Ist',
    start:'Start',end:'Ende',status:'Status',priority:'Priorität',
    high:'Hoch',medium:'Mittel',low:'Niedrig',assigned:'Zugewiesen',
    phone:'Telefon',email:'E-Mail',role:'Rolle',company:'Firma',
    material:'Material',supplier:'Lieferant',quantity:'Menge',unit:'Einheit',
    expected:'Erwartet',version:'Version',category:'Kategorie',uploaded:'Hochgeladen von',
    workers:'Arbeiter',work_done:'Geleistete Arbeiten',special:'Besonderheiten',
    total:'Gesamtbudget',committed:'Gebunden',spent:'Abgerufen',remaining:'Verbleibend',
    pname:'Projektname',loc:'Standort',pstart:'Beginn',pend:'Geplantes Ende',type:'Typ'},
  tr:{login:'Giriş Yap',sel:'Kullanıcı Seç',logout:'Çıkış',save:'Kaydet',add:'Ekle',
    cancel:'İptal',approve:'Onayla',reject:'Reddet',review:'İncele',edit:'Düzenle',
    dash:'Genel Bakış',schedule:'İnşaat Takvimi',contracts:'Sözleşmeler',co:'Ek İşler',
    approvals:'Onaylar',issues:'Sorunlar',diary:'Şantiye Günlüğü',docs:'Belgeler',
    contacts:'Kişiler',gallery:'Fotoğraflar',suppliers:'Tedarikçiler',budget:'Bütçe',
    onTrack:'Planlamada',warning:'İzleniyor',critical:'Müdahale Gerekli',
    open:'Açık',inProgress:'Devam Ediyor',resolved:'Çözüldü',
    submitted:'Gönderildi',inReview:'İncelemede',approved:'Onaylandı',rejected:'Reddedildi',
    active:'Aktif',ordered:'Sipariş Edildi',delivered:'Teslim Edildi',
    no_data:'Veri yok',loading:'Hava yükleniyor…',new_entry:'Yeni Giriş',
    upload:'Fotoğraf Yükle',date:'Tarih',name:'Ad',desc:'Açıklama',
    amount:'Tutar (€)',comment:'Yorum',title:'Başlık',notes:'Notlar',
    contractor:'Müteahhit',phase:'Aşama',planned:'Planlanan',actual:'Gerçekleşen',
    start:'Başlangıç',end:'Bitiş',status:'Durum',priority:'Öncelik',
    high:'Yüksek',medium:'Orta',low:'Düşük',assigned:'Atanan',
    phone:'Telefon',email:'E-posta',role:'Rol',company:'Şirket',
    material:'Malzeme',supplier:'Tedarikçi',quantity:'Miktar',unit:'Birim',
    expected:'Beklenen',version:'Versiyon',category:'Kategori',uploaded:'Yükleyen',
    workers:'İşçiler',work_done:'Yapılan İşler',special:'Özel Durumlar',
    total:'Toplam Bütçe',committed:'Taahhüt',spent:'Harcanan',remaining:'Kalan',
    pname:'Proje Adı',loc:'Konum',pstart:'Başlangıç',pend:'Planlanan Bitiş',type:'Tür'},
};

// ── Standarddaten / Varsayılan Veriler ────────────────────────
const SCHED=[
  {id:1,phase:'Genehmigungen / İzinler',ps:'2025-03-01',pe:'2025-04-30',as:'2025-03-01',ae:'2025-05-15',st:'warning'},
  {id:2,phase:'Erdarbeiten / Hafriyat',ps:'2025-04-01',pe:'2025-06-30',as:'2025-04-15',ae:'2025-07-10',st:'warning'},
  {id:3,phase:'Fundamente / Temel',ps:'2025-05-01',pe:'2025-08-31',as:'2025-05-20',ae:'',st:'onTrack'},
  {id:4,phase:'Stahlbau / Çelik Konstrüksiyon',ps:'2025-07-01',pe:'2025-12-31',as:'2025-07-15',ae:'',st:'onTrack'},
  {id:5,phase:'Dach & Fassade / Çatı & Cephe',ps:'2025-10-01',pe:'2026-02-28',as:'',ae:'',st:'onTrack'},
  {id:6,phase:'Anlagentechnik / Tesis Teknolojisi',ps:'2025-11-01',pe:'2026-04-30',as:'',ae:'',st:'onTrack'},
  {id:7,phase:'Elektro & MSR',ps:'2026-01-01',pe:'2026-05-31',as:'',ae:'',st:'onTrack'},
  {id:8,phase:'Inbetriebnahme / Devreye Alma',ps:'2026-05-01',pe:'2026-06-30',as:'',ae:'',st:'onTrack'},
];

const DEF={
  project:{name:'ZINKPOWER Manisa',loc:'Manisa, Türkiye',pstart:'2025-03-01',pend:'2026-06-30',desc:'Neubau Feuerverzinkungsanlage / Yeni Galvaniz Tesisi'},
  schedule:SCHED,
  contracts:[{id:1,title:'Stahlbau – Sipil İnşaat',contractor:'Sipil İnşaat Ltd.',amount:2800000,date:'2025-02-15',status:'active',notes:'~170t Stahl'}],
  changeOrders:[],
  approvals:[
    {id:1,title:'Schweißnähte Stahlbau / Kaynak Dikişleri',assigned:'peter',status:'open',notes:'Haupt-Schweißnähte prüfen',photos:[]},
    {id:2,title:'Fundamentbewehrung / Temel Donatısı',assigned:'karsten',status:'open',notes:'Bewehrungsplan Rev.3',photos:[]},
    {id:3,title:'Korrosionsschutz / Korozyon Boyası',assigned:'felix',status:'open',notes:'2K-Epoxy Grundierung',photos:[]},
    {id:4,title:'Kranbahnträger / Vinç Ray Kirişi',assigned:'peter',status:'open',notes:'HEB 400, L=24m',photos:[]},
  ],
  issues:[],diary:[],documents:[],
  contacts:[{id:1,name:'Peter Siemund',role:'Geschäftsführer / Genel Müdür',company:'ZINKPOWER KOPF GRUPPE',phone:'',email:''}],
  gallery:[],suppliers:[],supplierProfiles:[],
  budget:{total:5500000,payments:[]},
  extraUsers:[],
  pins:{peter:'0000',alper:'0000',karsten:'0000',felix:'0000'},
};

export { P, GR, LT, GN, YL, RD, CORE, T,SCHED, DEF}