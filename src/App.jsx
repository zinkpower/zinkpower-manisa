import { useState, useEffect, useRef } from "react";
import { createClient } from "@supabase/supabase-js";

// ── Supabase ──────────────────────────────────────────────────
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

// ── Farben / Renkler ─────────────────────────────────────────
const P='#283898', GR='#575756', LT='#dde3f5', GN='#27ae60', YL='#e67e22', RD='#e74c3c';

// ── Nutzer / Kullanıcılar ─────────────────────────────────────
const CORE=[
  {id:'peter',   name:'Peter Siemund', role:'admin'},
  {id:'alper',   name:'Alper Bulca',   role:'admin'},
  {id:'karsten', name:'Karsten Köhler',role:'approver'},
  {id:'felix',   name:'Felix Holbe',   role:'approver'},
];

function getInit(name){
  const p=(name||'?').trim().split(/\s+/);
  return p.length<2?p[0][0].toUpperCase():(p[0][0]+p[p.length-1][0]).toUpperCase();
}

// ── Übersetzungen / Çeviriler ─────────────────────────────────
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

// ── UI Komponenten / UI Bileşenleri ───────────────────────────
function Badge({status,t}){
  const m={onTrack:GN,warning:YL,critical:RD,open:YL,inProgress:'#3498db',resolved:GN,
    submitted:'#3498db',inReview:YL,approved:GN,rejected:RD,active:GN,ordered:YL,delivered:GN};
  const c=m[status]||GR;
  return <span style={{padding:'2px 9px',background:c+'25',color:c,borderRadius:10,fontSize:11,fontWeight:'bold'}}>{t[status]||status}</span>;
}

function Btn({onClick,children,sm,danger,outline,disabled,col}){
  const c=col||P;
  const bg=disabled?'#ccc':danger?RD:outline?'transparent':c;
  const fg=disabled?'#999':outline?c:'#fff';
  return <button onClick={onClick} disabled={!!disabled} style={{padding:sm?'4px 11px':'7px 15px',background:bg,color:fg,border:outline?`1px solid ${c}`:'none',borderRadius:6,fontSize:sm?11:13,cursor:disabled?'default':'pointer',fontFamily:'Arial',fontWeight:'bold'}}>{children}</button>;
}

function Card({children,title,action}){
  return <div style={{background:'#fff',borderRadius:10,padding:18,marginBottom:12,boxShadow:'0 1px 8px rgba(40,56,152,0.07)'}}>
    {(title||action)&&<div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
      {title&&<b style={{color:P,fontSize:14}}>{title}</b>}{action}
    </div>}
    {children}
  </div>;
}

function IForm({title,onClose,children}){
  return <div style={{background:'#f8f9fc',border:`1px solid ${LT}`,borderRadius:10,padding:18,marginBottom:12}}>
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14}}>
      <b style={{color:P,fontSize:14}}>{title}</b>
      <button onClick={onClose} style={{background:'none',border:'none',fontSize:18,cursor:'pointer',color:GR}}>✕</button>
    </div>
    {children}
  </div>;
}

function Fi({label,value,onChange,type,ph}){
  return <div style={{marginBottom:9}}>
    {label&&<label style={{display:'block',fontSize:11,color:GR,marginBottom:2}}>{label}</label>}
    <input type={type||'text'} value={value} placeholder={ph||''} onChange={e=>onChange(e.target.value)}
      style={{width:'100%',padding:'7px 10px',border:'1px solid #ddd',borderRadius:6,fontSize:13,fontFamily:'Arial',boxSizing:'border-box'}}/>
  </div>;
}

function Ft({label,value,onChange,rows}){
  return <div style={{marginBottom:9}}>
    {label&&<label style={{display:'block',fontSize:11,color:GR,marginBottom:2}}>{label}</label>}
    <textarea value={value} rows={rows||3} onChange={e=>onChange(e.target.value)}
      style={{width:'100%',padding:'7px 10px',border:'1px solid #ddd',borderRadius:6,fontSize:13,fontFamily:'Arial',resize:'vertical',boxSizing:'border-box'}}/>
  </div>;
}

function Fs({label,value,onChange,opts}){
  return <div style={{marginBottom:9}}>
    {label&&<label style={{display:'block',fontSize:11,color:GR,marginBottom:2}}>{label}</label>}
    <select value={value} onChange={e=>onChange(e.target.value)}
      style={{width:'100%',padding:'7px 10px',border:'1px solid #ddd',borderRadius:6,fontSize:13,fontFamily:'Arial'}}>
      {opts.map(o=><option key={o.v} value={o.v}>{o.l}</option>)}
    </select>
  </div>;
}

function PicUpload({onPhoto,t}){
  const ref=useRef(null);
  function handle(e){
    const f=e.target.files&&e.target.files[0];
    if(!f)return;
    const r=new FileReader();
    r.onload=ev=>onPhoto(ev.target.result);
    r.readAsDataURL(f);
    e.target.value='';
  }
  return <>
    <input ref={ref} type="file" accept="image/*" onChange={handle} style={{display:'none'}}/>
    <Btn sm outline onClick={()=>ref.current&&ref.current.click()}>📷 {t.upload}</Btn>
  </>;
}

function Thumbs({photos}){
  if(!photos||!photos.length)return null;
  return <div style={{display:'flex',gap:6,flexWrap:'wrap',marginTop:8}}>
    {photos.map((p,i)=><img key={i} src={p} alt="" style={{width:54,height:54,objectFit:'cover',borderRadius:6,border:`2px solid ${LT}`}}/>)}
  </div>;
}

function PH({title,children}){
  return <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14}}>
    <h2 style={{color:P,fontSize:17,margin:0}}>{title}</h2>
    <div style={{display:'flex',gap:8}}>{children}</div>
  </div>;
}

function Av({name,size}){
  const sz=size||36;
  return <div style={{width:sz,height:sz,borderRadius:'50%',background:P,color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:'bold',fontSize:sz*0.33,flexShrink:0}}>{getInit(name)}</div>;
}

// ── Mobile Hook ───────────────────────────────────────────────
function useIsMobile() {
  const [mob, setMob] = useState(window.innerWidth < 768);
  useEffect(() => {
    const h = () => setMob(window.innerWidth < 768);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);
  return mob;
}

// ── Kalender-Konstanten ───────────────────────────────────────
const MNAMES=['Januar / Ocak','Februar / Şubat','März / Mart','April / Nisan','Mai / Mayıs',
  'Juni / Haziran','Juli / Temmuz','August / Ağustos','September / Eylül',
  'Oktober / Ekim','November / Kasım','Dezember / Aralık'];
const DNAMES=['Mo','Di','Mi','Do','Fr','Sa','So'];

// ── Dashboard ─────────────────────────────────────────────────
function Dashboard({data,save,user,t,isMobile}){
  const [editing,setEditing]=useState(false);
  const p=data.project||{};
  const [f,setF]=useState(p);
  const co=(data.changeOrders||[]).filter(x=>x.status==='submitted'||x.status==='inReview').length;
  const iss=(data.issues||[]).filter(x=>x.status!=='resolved').length;
  const app=(data.approvals||[]).filter(x=>x.status==='open').length;
  function doSave(){save('project',f);setEditing(false);}
  return <div>
    <PH title={t.dash}/>
    {editing?(
      <IForm title={t.pname} onClose={()=>setEditing(false)}>
        <Fi label={t.pname} value={f.name||''} onChange={v=>setF({...f,name:v})}/>
        <Fi label={t.loc} value={f.loc||''} onChange={v=>setF({...f,loc:v})}/>
        <Fi label={t.pstart} value={f.pstart||''} onChange={v=>setF({...f,pstart:v})} type="date"/>
        <Fi label={t.pend} value={f.pend||''} onChange={v=>setF({...f,pend:v})} type="date"/>
        <Ft label={t.desc} value={f.desc||''} onChange={v=>setF({...f,desc:v})}/>
        <div style={{display:'flex',gap:8}}><Btn outline onClick={()=>setEditing(false)}>{t.cancel}</Btn><Btn onClick={doSave}>{t.save}</Btn></div>
      </IForm>
    ):(
      <Card action={user.role==='admin'&&<Btn sm outline onClick={()=>{setF(p);setEditing(true);}}>✏️ {t.edit}</Btn>}>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
          {[[t.pname,p.name],[t.loc,p.loc],[t.pstart,p.pstart],[t.pend,p.pend]].map(([k,v])=>(
            <div key={k}><div style={{fontSize:11,color:GR,marginBottom:2}}>{k}</div><div style={{fontSize:14,fontWeight:'bold',color:P}}>{v}</div></div>
          ))}
        </div>
        {p.desc&&<div style={{marginTop:12,padding:'8px 12px',background:LT,borderRadius:6,fontSize:12,color:GR}}>{p.desc}</div>}
      </Card>
    )}
    <div style={{display:'grid',gridTemplateColumns:isMobile?'1fr 1fr':'repeat(4,1fr)',gap:10,marginBottom:14}}>
      {[
        {l:t.contracts,v:(data.contracts||[]).length,i:'📄',c:P},
        {l:`${t.co} (${t.open})`,v:co,i:'➕',c:co>0?YL:GN},
        {l:`${t.issues} (${t.open})`,v:iss,i:'⚠️',c:iss>0?RD:GN},
        {l:`${t.approvals} (${t.open})`,v:app,i:'✅',c:app>0?YL:GN},
      ].map(k=>(
        <div key={k.l} style={{background:'#fff',borderRadius:10,padding:'12px 14px',boxShadow:'0 1px 8px rgba(40,56,152,0.07)',borderTop:`3px solid ${k.c}`}}>
          <div style={{fontSize:20,marginBottom:4}}>{k.i}</div>
          <div style={{fontSize:26,fontWeight:'bold',color:k.c}}>{k.v}</div>
          <div style={{fontSize:10,color:GR}}>{k.l}</div>
        </div>
      ))}
    </div>
    {(data.diary||[]).length>0&&<Card title={t.diary}>
      {(data.diary||[]).slice(-3).reverse().map(e=>(
        <div key={e.id} style={{padding:'6px 0',borderBottom:'1px solid #f2f2f2',fontSize:12}}>
          <span style={{color:GR,marginRight:8}}>{e.date}</span><span>{(e.work_done||'').slice(0,80)}</span>
        </div>
      ))}
    </Card>}
  </div>;
}

// ── Schedule ──────────────────────────────────────────────────
const EF_PHASE={phase:'',ps:'',pe:'',as:'',ae:'',st:'onTrack'};
function Schedule({data,save,user,t}){
  const [items,setItems]=useState(()=>data.schedule||[]);
  const [editId,setEditId]=useState(null);
  const [form,setForm]=useState({});
  const [showAdd,setShowAdd]=useState(false);
  const [newF,setNewF]=useState(EF_PHASE);
  const [delId,setDelId]=useState(null);
  const isAdmin=user.role==='admin';
  const canEdit=user.role==='admin'||(user.permissions||[]).includes('schedule');
  const today=new Date().toISOString().split('T')[0];
  const sc={onTrack:GN,warning:YL,critical:RD};
  const ds=items.flatMap(i=>[i.ps,i.pe].filter(Boolean));
  const mn=new Date(ds.length?ds.reduce((a,b)=>a<b?a:b):'2025-01-01');
  const mx=new Date(ds.length?ds.reduce((a,b)=>a>b?a:b):'2027-01-01');
  const sp=Math.max(1,(mx-mn)/864e5);
  const pct=d=>d?Math.max(0,Math.min(100,(new Date(d)-mn)/864e5/sp*100)):0;
  const tp=(new Date(today)-mn)/864e5/sp*100;
  function doSave(){const u=items.map(i=>i.id===form.id?{...form}:i);setItems(u);save('schedule',u);setEditId(null);}
  function doAdd(){
    if(!newF.phase||!newF.ps||!newF.pe)return;
    const u=[...items,{...newF,id:Date.now()}];
    setItems(u);save('schedule',u);setShowAdd(false);setNewF(EF_PHASE);
  }
  function doDelete(id){const u=items.filter(i=>i.id!==id);setItems(u);save('schedule',u);setDelId(null);}
  return <div>
    <PH title={t.schedule}>{canEdit&&<Btn onClick={()=>{setShowAdd(s=>!s);setNewF(EF_PHASE);}}>+ {t.add}</Btn>}</PH>
    {canEdit&&showAdd&&<IForm title="Neue Phase / Yeni Aşama" onClose={()=>setShowAdd(false)}>
      <Fi label={t.phase} value={newF.phase} onChange={v=>setNewF({...newF,phase:v})}/>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
        <Fi label={`${t.planned} ${t.start}`} value={newF.ps} onChange={v=>setNewF({...newF,ps:v})} type="date"/>
        <Fi label={`${t.planned} ${t.end}`} value={newF.pe} onChange={v=>setNewF({...newF,pe:v})} type="date"/>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
        <Fi label={`${t.actual} ${t.start}`} value={newF.as} onChange={v=>setNewF({...newF,as:v})} type="date"/>
        <Fi label={`${t.actual} ${t.end}`} value={newF.ae} onChange={v=>setNewF({...newF,ae:v})} type="date"/>
      </div>
      <Fs label={t.status} value={newF.st} onChange={v=>setNewF({...newF,st:v})} opts={['onTrack','warning','critical'].map(s=>({v:s,l:t[s]}))}/>
      <div style={{display:'flex',gap:8}}><Btn outline onClick={()=>setShowAdd(false)}>{t.cancel}</Btn><Btn disabled={!newF.phase||!newF.ps||!newF.pe} onClick={doAdd}>{t.save}</Btn></div>
    </IForm>}
    {editId&&<IForm title={`${t.edit}: ${form.phase}`} onClose={()=>setEditId(null)}>
      <Fi label={t.phase} value={form.phase||''} onChange={v=>setForm({...form,phase:v})}/>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
        <Fi label={`${t.planned} ${t.start}`} value={form.ps||''} onChange={v=>setForm({...form,ps:v})} type="date"/>
        <Fi label={`${t.planned} ${t.end}`} value={form.pe||''} onChange={v=>setForm({...form,pe:v})} type="date"/>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
        <Fi label={`${t.actual} ${t.start}`} value={form.as||''} onChange={v=>setForm({...form,as:v})} type="date"/>
        <Fi label={`${t.actual} ${t.end}`} value={form.ae||''} onChange={v=>setForm({...form,ae:v})} type="date"/>
      </div>
      <Fs label={t.status} value={form.st} onChange={v=>setForm({...form,st:v})} opts={['onTrack','warning','critical'].map(s=>({v:s,l:t[s]}))}/>
      <div style={{display:'flex',gap:8}}><Btn outline onClick={()=>setEditId(null)}>{t.cancel}</Btn><Btn onClick={doSave}>{t.save}</Btn></div>
    </IForm>}
    {delId&&<IForm title="Phase löschen?" onClose={()=>setDelId(null)}>
      <div style={{fontSize:13,marginBottom:14}}><b style={{color:RD}}>{items.find(i=>i.id===delId)?.phase}</b> wirklich löschen?</div>
      <div style={{display:'flex',gap:8}}><Btn outline onClick={()=>setDelId(null)}>{t.cancel}</Btn><Btn danger onClick={()=>doDelete(delId)}>Löschen</Btn></div>
    </IForm>}
    <Card title="Gantt">
      {items.map(item=>(
        <div key={item.id} style={{display:'flex',alignItems:'center',gap:8,marginBottom:7}}>
          <div style={{width:190,fontSize:11,color:GR,flexShrink:0,display:'flex',alignItems:'center',gap:5,overflow:'hidden'}}>
            <span style={{width:7,height:7,borderRadius:'50%',background:sc[item.st]||GR,flexShrink:0,display:'inline-block'}}/>
            <span style={{overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{item.phase}</span>
          </div>
          <div style={{flex:1,height:16,background:'#eef0f6',borderRadius:4,position:'relative',minWidth:60}}>
            <div style={{position:'absolute',left:pct(item.ps)+'%',width:Math.max(1,pct(item.pe)-pct(item.ps))+'%',height:'50%',top:'25%',background:P+'30',borderRadius:2}}/>
            {item.as&&<div style={{position:'absolute',left:pct(item.as)+'%',width:Math.max(1,pct(item.ae||today)-pct(item.as))+'%',height:'50%',top:'25%',background:sc[item.st]||P,borderRadius:2,opacity:0.85}}/>}
            {tp>=0&&tp<=100&&<div style={{position:'absolute',left:tp+'%',top:0,height:'100%',width:2,background:RD}}/>}
          </div>
          <div style={{width:66,fontSize:10,color:GR,flexShrink:0}}>{item.pe}</div>
          {canEdit&&<div style={{display:'flex',gap:4}}>
            <Btn sm outline onClick={()=>{setForm({...item});setEditId(item.id);}}>✏️</Btn>
            <Btn sm danger onClick={()=>setDelId(item.id)}>✕</Btn>
          </div>}
        </div>
      ))}
      <div style={{display:'flex',gap:12,marginTop:10,flexWrap:'wrap'}}>
        {[[GN,t.onTrack],[YL,t.warning],[RD,t.critical]].map(([c,l])=>(
          <span key={l} style={{display:'flex',alignItems:'center',gap:4,fontSize:11,color:GR}}>
            <span style={{width:8,height:8,borderRadius:'50%',background:c,display:'inline-block'}}/>{l}
          </span>
        ))}
      </div>
    </Card>
    <Card>
      <div style={{overflowX:'auto'}}>
        <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
          <thead><tr style={{background:LT}}>
            {[t.phase,`${t.planned} ${t.start}`,`${t.planned} ${t.end}`,`${t.actual} ${t.start}`,`${t.actual} ${t.end}`,t.status].map(h=>(
              <th key={h} style={{padding:'7px 10px',textAlign:'left',color:GR,fontSize:11}}>{h}</th>
            ))}
            {canEdit&&<th/>}
          </tr></thead>
          <tbody>
            {items.map(item=>(
              <tr key={item.id} style={{borderBottom:'1px solid #f2f2f2'}}>
                <td style={{padding:'7px 10px',fontWeight:'bold',fontSize:12}}>{item.phase}</td>
                <td style={{padding:'7px 10px',color:GR,fontSize:12}}>{item.ps}</td>
                <td style={{padding:'7px 10px',color:GR,fontSize:12}}>{item.pe}</td>
                <td style={{padding:'7px 10px',color:GR,fontSize:12}}>{item.as||'–'}</td>
                <td style={{padding:'7px 10px',color:GR,fontSize:12}}>{item.ae||'–'}</td>
                <td style={{padding:'7px 10px'}}><Badge status={item.st} t={t}/></td>
                {canEdit&&<td style={{padding:'7px 10px'}}>
                  <div style={{display:'flex',gap:4}}>
                    <Btn sm outline onClick={()=>{setForm({...item});setEditId(item.id);}}>✏️</Btn>
                    <Btn sm danger onClick={()=>setDelId(item.id)}>✕</Btn>
                  </div>
                </td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  </div>;
}

// ── Contracts ─────────────────────────────────────────────────
function Contracts({data,save,user,t}){
  const [items,setItems]=useState(()=>data.contracts||[]);
  const [show,setShow]=useState(false);
  const [delId,setDelId]=useState(null);
  const [viewFile,setViewFile]=useState(null);
  const ef={title:'',contractor:'',amount:'',date:'',status:'active',notes:'',file:null,fileName:''};
  const [f,setF]=useState(ef);
  const isAdmin=user.role==='admin';
  const fileRef=useRef(null);
  function handleFile(e){
    const file=e.target.files&&e.target.files[0];
    if(!file)return;
    const reader=new FileReader();
    reader.onload=ev=>setF(prev=>({...prev,file:ev.target.result,fileName:file.name}));
    reader.readAsDataURL(file);
    e.target.value='';
  }
  function add(){
    if(!f.title||!f.contractor)return;
    const u=[...items,{...f,id:Date.now(),amount:Number(f.amount)}];
    setItems(u);save('contracts',u);setShow(false);setF(ef);
  }
  function del(id){const u=items.filter(i=>i.id!==id);setItems(u);save('contracts',u);setDelId(null);}
  const tot=items.reduce((s,c)=>s+(c.amount||0),0);
  return <div>
    <PH title={t.contracts}>{isAdmin&&<Btn onClick={()=>{setShow(s=>!s);setF(ef);}}>+ {t.add}</Btn>}</PH>
    <div style={{background:'#fff',borderRadius:10,padding:'12px 18px',marginBottom:12,boxShadow:'0 1px 8px rgba(40,56,152,0.07)',display:'flex',gap:28}}>
      <div><div style={{fontSize:11,color:GR}}>{t.contracts}</div><div style={{fontSize:22,fontWeight:'bold',color:P}}>{items.length}</div></div>
      <div><div style={{fontSize:11,color:GR}}>{t.committed}</div><div style={{fontSize:22,fontWeight:'bold',color:P}}>{(tot/1e6).toFixed(2)}M €</div></div>
    </div>
    {show&&isAdmin&&<IForm title={`${t.add} ${t.contracts}`} onClose={()=>setShow(false)}>
      <Fi label={t.title} value={f.title} onChange={v=>setF({...f,title:v})} ph="z.B. Stahlbau Sipil"/>
      <Fi label={t.contractor} value={f.contractor} onChange={v=>setF({...f,contractor:v})}/>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
        <Fi label={t.amount} value={f.amount} onChange={v=>setF({...f,amount:v})} type="number"/>
        <Fi label={t.date} value={f.date} onChange={v=>setF({...f,date:v})} type="date"/>
      </div>
      <Ft label={t.notes} value={f.notes} onChange={v=>setF({...f,notes:v})}/>
      <div style={{marginBottom:10}}>
        <label style={{display:'block',fontSize:11,color:GR,marginBottom:4}}>Vertragsdokument (PDF / Bild)</label>
        <input ref={fileRef} type="file" accept=".pdf,image/*" onChange={handleFile} style={{display:'none'}}/>
        <div style={{display:'flex',alignItems:'center',gap:8}}>
          <Btn sm outline onClick={()=>fileRef.current&&fileRef.current.click()}>📎 Datei wählen</Btn>
          {f.fileName&&<span style={{fontSize:12,color:GN}}>✓ {f.fileName}</span>}
        </div>
      </div>
      <div style={{display:'flex',gap:8}}><Btn outline onClick={()=>setShow(false)}>{t.cancel}</Btn><Btn disabled={!f.title||!f.contractor} onClick={add}>{t.save}</Btn></div>
    </IForm>}
    {delId&&isAdmin&&<IForm title="Vertrag löschen?" onClose={()=>setDelId(null)}>
      <div style={{fontSize:13,marginBottom:14}}><b style={{color:RD}}>{items.find(i=>i.id===delId)?.title}</b> wirklich löschen?</div>
      <div style={{display:'flex',gap:8}}><Btn outline onClick={()=>setDelId(null)}>{t.cancel}</Btn><Btn danger onClick={()=>del(delId)}>Löschen</Btn></div>
    </IForm>}
    {viewFile&&<IForm title="📎 Vertragsdokument" onClose={()=>setViewFile(null)}>
      {viewFile.startsWith('data:image')?<img src={viewFile} alt="Vertrag" style={{width:'100%',borderRadius:8}}/>:
        <div style={{textAlign:'center',padding:20}}>
          <div style={{fontSize:40,marginBottom:12}}>📄</div>
          <a href={viewFile} download="vertrag.pdf"><Btn>⬇️ PDF herunterladen</Btn></a>
        </div>}
    </IForm>}
    {items.length===0?<Card><div style={{color:GR,textAlign:'center',padding:20}}>{t.no_data}</div></Card>:
      items.map(item=><Card key={item.id}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
          <div style={{flex:1}}>
            <div style={{fontWeight:'bold',color:P,fontSize:14,marginBottom:4}}>{item.title}</div>
            <div style={{fontSize:12,color:GR}}>{t.contractor}: {item.contractor}</div>
            <div style={{fontSize:12,color:GR}}>{t.date}: {item.date}</div>
            {item.notes&&<div style={{fontSize:12,color:GR,marginTop:3}}>{item.notes}</div>}
            {item.file&&<div style={{marginTop:8}}><Btn sm outline onClick={()=>setViewFile(item.file)}>📎 {item.fileName||'Dokument'}</Btn></div>}
          </div>
          <div style={{textAlign:'right',marginLeft:12,flexShrink:0}}>
            <div style={{fontSize:18,fontWeight:'bold',color:P,marginBottom:4}}>{(item.amount||0).toLocaleString()} €</div>
            <Badge status={item.status} t={t}/>
            {isAdmin&&<div style={{marginTop:8}}><Btn sm danger onClick={()=>setDelId(item.id)}>✕</Btn></div>}
          </div>
        </div>
      </Card>)
    }
  </div>;
}

// ── ChangeOrders ──────────────────────────────────────────────
function ChangeOrders({data,save,user,t}){
  const [items,setItems]=useState(()=>data.changeOrders||[]);
  const [show,setShow]=useState(false);
  const [revId,setRevId]=useState(null);
  const [cmt,setCmt]=useState('');
  const ef={title:'',desc:'',amount:'',contractor:'',photos:[]};
  const [f,setF]=useState(ef);
  const isAdmin=user.role==='admin';
  function submit(){
    const u=[...items,{...f,id:Date.now(),amount:Number(f.amount),status:'submitted',by:user.name,date:new Date().toISOString().split('T')[0]}];
    setItems(u);save('changeOrders',u);setShow(false);setF(ef);
  }
  function doReject(id){const u=items.map(i=>i.id===id?{...i,status:'rejected',comment:cmt,revBy:user.name}:i);setItems(u);save('changeOrders',u);setRevId(null);setCmt('');}
  function doConvert(id){
    const item=items.find(i=>i.id===id);if(!item)return;
    const updCO=items.map(i=>i.id===id?{...i,status:'converted',comment:cmt,revBy:user.name}:i);
    const newContract={id:Date.now(),title:`Nachtrag: ${item.title}`,contractor:item.contractor||'–',amount:item.amount||0,date:new Date().toISOString().split('T')[0],status:'active',notes:item.desc||''};
    const updContracts=[...(data.contracts||[]),newContract];
    setItems(updCO);save('changeOrders',updCO);save('contracts',updContracts);setRevId(null);setCmt('');
  }
  const rev=items.find(i=>i.id===revId);
  const sColor={submitted:'#3498db',inReview:YL,converted:GN,rejected:RD,approved:GN};
  const sLabel={submitted:t.submitted,inReview:t.inReview,converted:'Zum Auftrag',rejected:t.rejected,approved:t.approved};
  return <div>
    <PH title={t.co}><Btn onClick={()=>setShow(s=>!s)}>+ {t.add}</Btn></PH>
    {show&&<IForm title={`${t.add} ${t.co}`} onClose={()=>setShow(false)}>
      <Fi label={t.title} value={f.title} onChange={v=>setF({...f,title:v})}/>
      <Fi label={t.contractor} value={f.contractor} onChange={v=>setF({...f,contractor:v})} ph="Auftragnehmer / Müteahhit"/>
      <Ft label={t.desc} value={f.desc} onChange={v=>setF({...f,desc:v})}/>
      <Fi label={t.amount} value={f.amount} onChange={v=>setF({...f,amount:v})} type="number"/>
      <PicUpload onPhoto={p=>setF({...f,photos:[...f.photos,p]})} t={t}/>
      <Thumbs photos={f.photos}/>
      <div style={{display:'flex',gap:8,marginTop:8}}><Btn outline onClick={()=>setShow(false)}>{t.cancel}</Btn><Btn onClick={submit}>{t.submitted}</Btn></div>
    </IForm>}
    {rev&&isAdmin&&<IForm title={`Nachtrag prüfen: ${rev.title}`} onClose={()=>setRevId(null)}>
      <div style={{background:LT,borderRadius:8,padding:12,marginBottom:12,fontSize:13}}>
        {rev.contractor&&<div><b>{t.contractor}:</b> {rev.contractor}</div>}
        <div><b>{t.desc}:</b> {rev.desc}</div>
        <div><b>{t.amount}:</b> {(rev.amount||0).toLocaleString()} €</div>
        <div style={{fontSize:11,color:GR,marginTop:4}}>👤 {rev.by} · 📅 {rev.date}</div>
      </div>
      <Thumbs photos={rev.photos}/>
      <Ft label={t.comment} value={cmt} onChange={setCmt}/>
      <div style={{display:'flex',gap:8,marginTop:4}}>
        <Btn danger onClick={()=>doReject(rev.id)}>✕ {t.reject}</Btn>
        <Btn col={GN} onClick={()=>doConvert(rev.id)}>📋 Zum Auftrag</Btn>
      </div>
    </IForm>}
    {items.length===0&&<Card><div style={{color:GR,textAlign:'center',padding:20}}>{t.no_data}</div></Card>}
    {items.map(item=>{
      const sc=sColor[item.status]||GR;
      const sl=sLabel[item.status]||item.status;
      return <Card key={item.id}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
          <div style={{flex:1}}>
            <div style={{fontWeight:'bold',color:P,fontSize:14,marginBottom:4}}>{item.title}</div>
            {item.contractor&&<div style={{fontSize:12,color:GR}}>🏢 {item.contractor}</div>}
            <div style={{fontSize:12,color:GR,marginTop:2}}>{item.desc}</div>
            <div style={{fontSize:11,color:GR,marginTop:3}}>📅 {item.date} · 👤 {item.by}</div>
            {item.comment&&<div style={{fontSize:12,color:GR,marginTop:3,fontStyle:'italic'}}>💬 {item.comment} ({item.revBy})</div>}
            {item.status==='converted'&&<div style={{fontSize:11,color:GN,marginTop:4,fontWeight:'bold'}}>✓ Als Vertrag übernommen</div>}
            <Thumbs photos={item.photos}/>
          </div>
          <div style={{textAlign:'right',marginLeft:12,flexShrink:0}}>
            <div style={{fontSize:16,fontWeight:'bold',color:P,marginBottom:6}}>{(item.amount||0).toLocaleString()} €</div>
            <span style={{padding:'2px 9px',background:sc+'25',color:sc,borderRadius:10,fontSize:11,fontWeight:'bold'}}>{sl}</span>
            {isAdmin&&item.status==='submitted'&&<div style={{marginTop:8}}><Btn sm onClick={()=>{setRevId(item.id);setCmt('');}}>🔍 {t.review}</Btn></div>}
          </div>
        </div>
      </Card>;
    })}
  </div>;
}

// ── Approvals ─────────────────────────────────────────────────
function Approvals({data,save,user,t}){
  const [items,setItems]=useState(()=>data.approvals||[]);
  const [activeId,setActiveId]=useState(null);
  const [form,setForm]=useState({comment:'',photos:[]});
  const [showAdd,setShowAdd]=useState(false);
  const [nf,setNf]=useState({title:'',assigned:'peter',notes:''});
  const isAdmin=user.role==='admin';
  function canApr(item){return item.assigned===user.id||isAdmin;}
  function doApr(id,action){
    const u=items.map(i=>i.id===id?{...i,status:action,comment:form.comment,photos:form.photos,by:user.name,approvedDate:new Date().toISOString().split('T')[0]}:i);
    setItems(u);save('approvals',u);setActiveId(null);setForm({comment:'',photos:[]});
  }
  function addNew(){
    const u=[...items,{...nf,id:Date.now(),status:'open',photos:[]}];
    setItems(u);save('approvals',u);setShowAdd(false);setNf({title:'',assigned:'peter',notes:''});
  }
  return <div>
    <PH title={t.approvals}>{isAdmin&&<Btn onClick={()=>setShowAdd(s=>!s)}>+ {t.add}</Btn>}</PH>
    {showAdd&&<IForm title={`${t.add} ${t.approvals}`} onClose={()=>setShowAdd(false)}>
      <Fi label={t.title} value={nf.title} onChange={v=>setNf({...nf,title:v})}/>
      <Fs label={t.assigned} value={nf.assigned} onChange={v=>setNf({...nf,assigned:v})} opts={CORE.map(u=>({v:u.id,l:u.name}))}/>
      <Ft label={t.notes} value={nf.notes} onChange={v=>setNf({...nf,notes:v})}/>
      <div style={{display:'flex',gap:8}}><Btn outline onClick={()=>setShowAdd(false)}>{t.cancel}</Btn><Btn onClick={addNew}>{t.save}</Btn></div>
    </IForm>}
    {activeId&&<IForm title={`Freigabe: ${items.find(i=>i.id===activeId)?.title||''}`} onClose={()=>setActiveId(null)}>
      <Ft label={t.comment} value={form.comment} onChange={v=>setForm({...form,comment:v})}/>
      <PicUpload onPhoto={p=>setForm({...form,photos:[...form.photos,p]})} t={t}/>
      <Thumbs photos={form.photos}/>
      <div style={{display:'flex',gap:8,marginTop:8}}>
        <Btn danger onClick={()=>doApr(activeId,'rejected')}>{t.reject}</Btn>
        <Btn onClick={()=>doApr(activeId,'approved')}>{t.approve}</Btn>
      </div>
    </IForm>}
    {items.map(item=><Card key={item.id}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
        <div style={{flex:1}}>
          <div style={{fontWeight:'bold',color:P,fontSize:14,marginBottom:4}}>{item.title}</div>
          <div style={{fontSize:12,color:GR}}>👤 {t.assigned}: <b>{CORE.find(u=>u.id===item.assigned)?.name||item.assigned}</b></div>
          {item.notes&&<div style={{fontSize:12,color:GR,marginTop:2}}>{item.notes}</div>}
          {item.comment&&<div style={{fontSize:12,color:GR,marginTop:3,fontStyle:'italic'}}>💬 {item.comment} ({item.by})</div>}
          <Thumbs photos={item.photos}/>
        </div>
        <div style={{display:'flex',flexDirection:'column',alignItems:'flex-end',gap:6,marginLeft:12,flexShrink:0}}>
          <Badge status={item.status} t={t}/>
          {item.status==='open'&&canApr(item)&&<>
            <Btn sm col={GN} onClick={()=>{const u=items.map(i=>i.id===item.id?{...i,status:'approved',comment:'',photos:[],by:user.name,approvedDate:new Date().toISOString().split('T')[0]}:i);setItems(u);save('approvals',u);}}>✓ Freigeben</Btn>
            <Btn sm outline onClick={()=>{setActiveId(item.id);setForm({comment:'',photos:[]});}}>💬 Mit Kommentar</Btn>
          </>}
        </div>
      </div>
    </Card>)}
  </div>;
}

// ── Issues ────────────────────────────────────────────────────
function Issues({data,save,user,t}){
  const [items,setItems]=useState(()=>data.issues||[]);
  const [show,setShow]=useState(false);
  const allU=[...CORE,...(data.extraUsers||[])];
  const ef={title:'',desc:'',priority:'medium',assigned:'',photos:[]};
  const [f,setF]=useState(ef);
  const pc={high:RD,medium:YL,low:GN};
  const pLabel={high:t.high,medium:t.medium,low:t.low};
  function add(){
    const u=[...items,{...f,id:Date.now(),status:'open',by:user.name,date:new Date().toISOString().split('T')[0]}];
    setItems(u);save('issues',u);setShow(false);setF(ef);
  }
  function setStatus(id,status){
    const u=items.map(i=>i.id===id?{...i,status,resolvedBy:status==='resolved'?user.name:undefined,resolvedDate:status==='resolved'?new Date().toISOString().split('T')[0]:undefined}:i);
    setItems(u);save('issues',u);
  }
  const open=items.filter(i=>i.status==='open');
  const resolved=items.filter(i=>i.status==='resolved');
  return <div>
    <PH title={t.issues}><Btn onClick={()=>setShow(s=>!s)}>+ {t.add}</Btn></PH>
    {show&&<IForm title={`${t.add} ${t.issues}`} onClose={()=>setShow(false)}>
      <Fi label={t.title} value={f.title} onChange={v=>setF({...f,title:v})} ph="Kurze Beschreibung des Mangels"/>
      <Ft label={t.desc} value={f.desc} onChange={v=>setF({...f,desc:v})} rows={3}/>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
        <Fs label={t.priority} value={f.priority} onChange={v=>setF({...f,priority:v})} opts={['high','medium','low'].map(p=>({v:p,l:t[p]}))}/>
        <Fs label={t.assigned} value={f.assigned} onChange={v=>setF({...f,assigned:v})} opts={[{v:'',l:'–'},...allU.map(u=>({v:u.name,l:u.name}))]}/>
      </div>
      <div style={{marginBottom:10}}><label style={{display:'block',fontSize:11,color:GR,marginBottom:4}}>📷 Fotos</label><PicUpload onPhoto={p=>setF({...f,photos:[...f.photos,p]})} t={t}/></div>
      <Thumbs photos={f.photos}/>
      <div style={{display:'flex',gap:8,marginTop:8}}><Btn outline onClick={()=>setShow(false)}>{t.cancel}</Btn><Btn disabled={!f.title} onClick={add}>{t.save}</Btn></div>
    </IForm>}
    {open.length>0&&<div style={{marginBottom:8}}>
      <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:8,padding:'6px 10px',background:RD+'15',borderRadius:8}}>
        <span style={{width:10,height:10,borderRadius:'50%',background:RD,display:'inline-block'}}/><b style={{fontSize:13,color:RD}}>Mängel offen</b><span style={{fontSize:12,color:RD}}>({open.length})</span>
      </div>
      {open.map(item=><Card key={item.id}>
        <div style={{display:'flex',justifyContent:'space-between'}}>
          <div style={{flex:1}}>
            <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:4}}>
              <span style={{padding:'2px 8px',background:pc[item.priority]+'25',color:pc[item.priority],borderRadius:6,fontSize:11,fontWeight:'bold'}}>{pLabel[item.priority]}</span>
              <b style={{color:P,fontSize:13}}>{item.title}</b>
            </div>
            {item.desc&&<div style={{fontSize:12,color:GR,marginBottom:3}}>{item.desc}</div>}
            <div style={{fontSize:11,color:GR}}>📅 {item.date} · 👤 {item.by}{item.assigned?` · → ${item.assigned}`:''}</div>
            <Thumbs photos={item.photos}/>
          </div>
          <div style={{marginLeft:12,flexShrink:0}}><Btn sm col={GN} onClick={()=>setStatus(item.id,'resolved')}>✓ Mangel beseitigt</Btn></div>
        </div>
      </Card>)}
    </div>}
    {resolved.length>0&&<div>
      <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:8,padding:'6px 10px',background:GN+'15',borderRadius:8}}>
        <span style={{width:10,height:10,borderRadius:'50%',background:GN,display:'inline-block'}}/><b style={{fontSize:13,color:GN}}>Mängel beseitigt</b><span style={{fontSize:12,color:GN}}>({resolved.length})</span>
      </div>
      {resolved.map(item=><Card key={item.id}>
        <div style={{display:'flex',justifyContent:'space-between'}}>
          <div style={{flex:1}}>
            <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:4}}>
              <span style={{padding:'2px 8px',background:GN+'25',color:GN,borderRadius:6,fontSize:11,fontWeight:'bold'}}>✓ Beseitigt</span>
              <b style={{color:GR,fontSize:13}}>{item.title}</b>
            </div>
            {item.desc&&<div style={{fontSize:12,color:GR,marginBottom:3}}>{item.desc}</div>}
            <div style={{fontSize:11,color:GR}}>📅 {item.date} · 👤 {item.by}{item.resolvedBy?` · ✓ ${item.resolvedBy} (${item.resolvedDate})`:''}</div>
            <Thumbs photos={item.photos}/>
          </div>
          <div style={{marginLeft:12,flexShrink:0}}><Btn sm outline onClick={()=>setStatus(item.id,'open')}>↩ Wieder öffnen</Btn></div>
        </div>
      </Card>)}
    </div>}
    {items.length===0&&<Card><div style={{color:GR,textAlign:'center',padding:20}}>{t.no_data}</div></Card>}
  </div>;
}

// ── Diary ─────────────────────────────────────────────────────
function Diary({data,save,user,t}){
  const [items,setItems]=useState(()=>data.diary||[]);
  const [show,setShow]=useState(false);
  const [wx,setWx]=useState(null);
  const [wxStatus,setWxStatus]=useState('loading');
  const today=new Date().toISOString().split('T')[0];
  const now=new Date();
  const [calYear,setCalYear]=useState(now.getFullYear());
  const [calMonth,setCalMonth]=useState(now.getMonth());
  const [selDay,setSelDay]=useState(today);
  const ef={date:today,workers:'',work_done:'',special:'',photos:[],wx:null};
  const [f,setF]=useState(ef);
  useEffect(()=>{
    fetch('https://api.open-meteo.com/v1/forecast?latitude=38.62&longitude=27.43&current=temperature_2m,weathercode,wind_speed_10m&timezone=Europe%2FIstanbul')
      .then(r=>r.json()).then(d=>{if(d&&d.current){setWx({temp:Math.round(d.current.temperature_2m),code:d.current.weathercode,wind:Math.round(d.current.wind_speed_10m)});setWxStatus('ok');}else setWxStatus('error');})
      .catch(()=>setWxStatus('error'));
  },[]);
  function wi(c){if(c==null)return'🌡️';if(c===0)return'☀️';if(c<=3)return'⛅';if(c<=48)return'🌫️';if(c<=67)return'🌧️';if(c<=77)return'❄️';return'⛈️';}
  function add(){
    const u=[...items,{...f,id:Date.now(),createdDate:today,author:user.name}].sort((a,b)=>b.date.localeCompare(a.date));
    setItems(u);save('diary',u);setShow(false);
  }
  const daysInMonth=new Date(calYear,calMonth+1,0).getDate();
  const firstWeekday=(new Date(calYear,calMonth,1).getDay()+6)%7;
  const monthStr=`${calYear}-${String(calMonth+1).padStart(2,'0')}`;
  const entryDays=new Set(items.filter(i=>(i.date||'').startsWith(monthStr)).map(i=>i.date));
  const selEntries=items.filter(i=>i.date===selDay);
  function prevMonth(){if(calMonth===0){setCalYear(y=>y-1);setCalMonth(11);}else setCalMonth(m=>m-1);}
  function nextMonth(){if(calMonth===11){setCalYear(y=>y+1);setCalMonth(0);}else setCalMonth(m=>m+1);}
  return <div>
    <PH title={t.diary}><Btn onClick={()=>{setF({...ef,date:selDay||today,wx:wx?{...wx}:null});setShow(true);}}>+ {t.new_entry}</Btn></PH>
    <Card>
      <div style={{display:'flex',alignItems:'center',gap:14}}>
        <div style={{fontSize:28}}>{wxStatus==='ok'?wi(wx.code):wxStatus==='error'?'📡':'⏳'}</div>
        <div><b style={{color:P}}>Manisa</b>
          {wxStatus==='ok'&&<div style={{fontSize:13,color:GR}}>{wx.temp}°C · 💨 {wx.wind} km/h</div>}
          {wxStatus==='loading'&&<div style={{fontSize:12,color:GR}}>{t.loading}</div>}
          {wxStatus==='error'&&<div style={{fontSize:12,color:YL}}>Wetterdaten nicht verfügbar</div>}
        </div>
      </div>
    </Card>
    <Card>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14}}>
        <Btn sm outline onClick={prevMonth}>◀</Btn>
        <b style={{color:P,fontSize:14}}>{MNAMES[calMonth]} {calYear}</b>
        <Btn sm outline onClick={nextMonth}>▶</Btn>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:3,marginBottom:4}}>
        {DNAMES.map(d=><div key={d} style={{textAlign:'center',fontSize:11,color:GR,fontWeight:'bold',padding:'3px 0'}}>{d}</div>)}
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:3}}>
        {Array(firstWeekday).fill(null).map((_,i)=><div key={'e'+i}/>)}
        {Array(daysInMonth).fill(null).map((_,i)=>{
          const day=i+1;
          const ds=`${calYear}-${String(calMonth+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
          const isToday=ds===today,isSel=ds===selDay,hasEntry=entryDays.has(ds);
          return <div key={day} onClick={()=>setSelDay(ds)} style={{textAlign:'center',padding:'7px 2px',borderRadius:8,cursor:'pointer',position:'relative',fontSize:13,fontWeight:isToday||isSel?'bold':'normal',background:isSel?P:isToday?LT:'transparent',color:isSel?'#fff':isToday?P:'#333',border:isSel?`2px solid ${P}`:isToday?`2px solid ${P}40`:'2px solid transparent'}}>
            {day}
            {hasEntry&&<div style={{position:'absolute',bottom:2,left:'50%',transform:'translateX(-50%)',width:5,height:5,borderRadius:'50%',background:isSel?'#fff':P}}/>}
          </div>;
        })}
      </div>
    </Card>
    {show&&<IForm title={t.new_entry} onClose={()=>setShow(false)}>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
        <Fi label="Eintrag für / Hangi Gün İçin" value={f.date} onChange={v=>setF({...f,date:v})} type="date"/>
        <div style={{background:LT,borderRadius:6,padding:'7px 10px',fontSize:12,color:GR}}>
          <div style={{fontWeight:'bold',marginBottom:2}}>Eingereicht am</div>
          <div style={{color:P,fontWeight:'bold'}}>{today}</div>
        </div>
      </div>
      <Fi label={t.workers} value={f.workers} onChange={v=>setF({...f,workers:v})}/>
      <Ft label={t.work_done} value={f.work_done} onChange={v=>setF({...f,work_done:v})} rows={4}/>
      <Ft label={t.special} value={f.special} onChange={v=>setF({...f,special:v})}/>
      <PicUpload onPhoto={p=>setF({...f,photos:[...f.photos,p]})} t={t}/>
      <Thumbs photos={f.photos}/>
      {f.wx&&<div style={{background:LT,borderRadius:6,padding:'7px 12px',fontSize:12,color:GR,margin:'8px 0'}}>{wi(f.wx.code)} {f.wx.temp}°C – wird gespeichert</div>}
      <div style={{display:'flex',gap:8}}><Btn outline onClick={()=>setShow(false)}>{t.cancel}</Btn><Btn onClick={add}>{t.save}</Btn></div>
    </IForm>}
    {selDay&&<div>
      <div style={{fontSize:13,fontWeight:'bold',color:P,marginBottom:10,padding:'8px 14px',background:LT,borderRadius:8,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <span>📅 {selDay}</span>
        <span style={{fontWeight:'normal',color:GR,fontSize:12}}>{selEntries.length===0?'Kein Eintrag':`${selEntries.length} Eintrag${selEntries.length>1?'e':''}`}</span>
      </div>
      {selEntries.length===0?(
        <div style={{textAlign:'center',padding:'16px 0',color:GR,fontSize:13}}>
          <div style={{marginBottom:10}}>Noch kein Eintrag für diesen Tag.</div>
          <Btn sm onClick={()=>{setF({...ef,date:selDay,wx:wx?{...wx}:null});setShow(true);}}>+ Eintrag für diesen Tag</Btn>
        </div>
      ):selEntries.map(e=><Card key={e.id}>
        <div style={{display:'flex',justifyContent:'space-between',marginBottom:6,flexWrap:'wrap',gap:6}}>
          <div>
            <b style={{color:P}}>Arbeitstag: {e.date}</b>
            {e.createdDate&&e.createdDate!==e.date&&<div style={{fontSize:11,color:YL,marginTop:2}}>⏱ Eingetragen am: {e.createdDate}</div>}
          </div>
          <div style={{display:'flex',gap:10,fontSize:11,color:GR}}>
            {e.wx&&<span>{wi(e.wx.code)} {e.wx.temp}°C</span>}
            <span>👤 {e.author}</span>
          </div>
        </div>
        {e.workers&&<div style={{fontSize:12,color:GR,marginBottom:2}}>👷 {e.workers}</div>}
        {e.work_done&&<div style={{fontSize:13,marginBottom:2}}>{e.work_done}</div>}
        {e.special&&<div style={{fontSize:12,color:YL,fontStyle:'italic'}}>⚠️ {e.special}</div>}
        <Thumbs photos={e.photos}/>
      </Card>)}
    </div>}
  </div>;
}

// ── Documents ─────────────────────────────────────────────────
function Documents({data,save,user,t}){
  const [items,setItems]=useState(()=>data.documents||[]);
  const [show,setShow]=useState(false);
  const today=new Date().toISOString().split('T')[0];
  const ef={title:'',category:'plan',version:'1.0',notes:'',date:today};
  const [f,setF]=useState(ef);
  const isAdmin=user.role==='admin';
  const ci={plan:'📐',permit:'🏛️',report:'📊',certificate:'🏆',contract:'📄',other:'📎'};
  function add(){const u=[...items,{...f,id:Date.now(),by:user.name}];setItems(u);save('documents',u);setShow(false);setF(ef);}
  function del(id){const u=items.filter(i=>i.id!==id);setItems(u);save('documents',u);}
  return <div>
    <PH title={t.docs}><Btn onClick={()=>setShow(s=>!s)}>+ {t.add}</Btn></PH>
    {show&&<IForm title={`${t.add} ${t.docs}`} onClose={()=>setShow(false)}>
      <Fi label={t.title} value={f.title} onChange={v=>setF({...f,title:v})}/>
      <Fs label={t.category} value={f.category} onChange={v=>setF({...f,category:v})} opts={Object.keys(ci).map(c=>({v:c,l:ci[c]+' '+c}))}/>
      <Fi label={t.version} value={f.version} onChange={v=>setF({...f,version:v})}/>
      <Fi label={t.date} value={f.date} onChange={v=>setF({...f,date:v})} type="date"/>
      <Ft label={t.notes} value={f.notes} onChange={v=>setF({...f,notes:v})}/>
      <div style={{display:'flex',gap:8}}><Btn outline onClick={()=>setShow(false)}>{t.cancel}</Btn><Btn onClick={add}>{t.save}</Btn></div>
    </IForm>}
    {items.length===0?<Card><div style={{color:GR,textAlign:'center',padding:20}}>{t.no_data}</div></Card>:
      <Card><div style={{overflowX:'auto'}}><table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
        <thead><tr style={{background:LT}}>
          {[t.title,t.category,t.version,t.date,t.uploaded,t.notes,''].map(h=><th key={h} style={{padding:'7px 10px',textAlign:'left',color:GR,fontSize:11}}>{h}</th>)}
        </tr></thead>
        <tbody>{items.map(item=><tr key={item.id} style={{borderBottom:'1px solid #f2f2f2'}}>
          <td style={{padding:'7px 10px'}}>{ci[item.category]||'📎'} {item.title}</td>
          <td style={{padding:'7px 10px',color:GR}}>{item.category}</td>
          <td style={{padding:'7px 10px',color:GR}}>v{item.version}</td>
          <td style={{padding:'7px 10px',color:GR}}>{item.date}</td>
          <td style={{padding:'7px 10px',color:GR}}>{item.by}</td>
          <td style={{padding:'7px 10px',color:GR}}>{item.notes}</td>
          <td style={{padding:'7px 10px'}}>{isAdmin&&<Btn sm danger onClick={()=>del(item.id)}>✕</Btn>}</td>
        </tr>)}</tbody>
      </table></div></Card>}
  </div>;
}

// ── Contacts ──────────────────────────────────────────────────
function Contacts({data,save,user,t}){
  const [items,setItems]=useState(()=>data.contacts||[]);
  const [show,setShow]=useState(false);
  const [delId,setDelId]=useState(null);
  const isAdmin=user.role==='admin';
  const ef={name:'',position:'',company:'',phone:'',mobile:'',email:'',address:'',notes:''};
  const [f,setF]=useState(ef);
  function add(){if(!f.name.trim())return;const u=[...items,{...f,id:Date.now(),by:user.name}];setItems(u);save('contacts',u);setShow(false);setF(ef);}
  function del(id){const u=items.filter(i=>i.id!==id);setItems(u);save('contacts',u);setDelId(null);}
  return <div>
    <PH title={t.contacts}><Btn onClick={()=>setShow(s=>!s)}>+ {t.add}</Btn></PH>
    {show&&<IForm title={`${t.add} ${t.contacts}`} onClose={()=>setShow(false)}>
      <Fi label={`${t.name} *`} value={f.name} onChange={v=>setF({...f,name:v})} ph="Vor- und Nachname"/>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
        <Fi label="Position / Görev" value={f.position} onChange={v=>setF({...f,position:v})}/>
        <Fi label={t.company} value={f.company} onChange={v=>setF({...f,company:v})}/>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
        <Fi label="Telefon (Festnetz)" value={f.phone} onChange={v=>setF({...f,phone:v})} type="tel"/>
        <Fi label="Mobil / Cep" value={f.mobile} onChange={v=>setF({...f,mobile:v})} type="tel"/>
      </div>
      <Fi label={t.email} value={f.email} onChange={v=>setF({...f,email:v})} type="email"/>
      <Fi label="Adresse / Adres" value={f.address} onChange={v=>setF({...f,address:v})}/>
      <Ft label={t.notes} value={f.notes} onChange={v=>setF({...f,notes:v})} rows={2}/>
      <div style={{display:'flex',gap:8}}><Btn outline onClick={()=>setShow(false)}>{t.cancel}</Btn><Btn disabled={!f.name.trim()} onClick={add}>{t.save}</Btn></div>
    </IForm>}
    {delId&&isAdmin&&<IForm title="Kontakt löschen?" onClose={()=>setDelId(null)}>
      <div style={{fontSize:13,marginBottom:14}}><b style={{color:RD}}>{items.find(i=>i.id===delId)?.name}</b> wirklich löschen?</div>
      <div style={{display:'flex',gap:8}}><Btn outline onClick={()=>setDelId(null)}>{t.cancel}</Btn><Btn danger onClick={()=>del(delId)}>Löschen</Btn></div>
    </IForm>}
    {items.length===0&&<Card><div style={{color:GR,textAlign:'center',padding:20}}>{t.no_data}</div></Card>}
    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))',gap:12}}>
      {items.map(item=><div key={item.id} style={{background:'#fff',borderRadius:12,padding:18,boxShadow:'0 1px 8px rgba(40,56,152,0.07)'}}>
        <div style={{display:'flex',alignItems:'flex-start',gap:12,marginBottom:12}}>
          <Av name={item.name||'?'} size={44}/>
          <div style={{flex:1}}>
            <div style={{fontWeight:'bold',color:P,fontSize:14,lineHeight:1.3}}>{item.name}</div>
            {item.position&&<div style={{fontSize:12,color:GR,marginTop:2}}>{item.position}</div>}
            {item.company&&<div style={{fontSize:12,color:GR}}>🏢 {item.company}</div>}
          </div>
          {isAdmin&&<button onClick={()=>setDelId(item.id)} style={{background:'none',border:'none',color:'#ccc',cursor:'pointer',fontSize:16,padding:0}}>✕</button>}
        </div>
        <div style={{display:'flex',flexDirection:'column',gap:6}}>
          {item.mobile&&<a href={`tel:${item.mobile}`} style={{textDecoration:'none'}}><div style={{display:'flex',alignItems:'center',gap:10,padding:'8px 12px',background:GN+'15',borderRadius:8,border:`1px solid ${GN}30`}}><span style={{fontSize:18}}>📱</span><div><div style={{fontSize:10,color:GR}}>Mobil</div><div style={{fontSize:13,fontWeight:'bold',color:GN}}>{item.mobile}</div></div><span style={{marginLeft:'auto',fontSize:12,color:GN,fontWeight:'bold'}}>Anrufen →</span></div></a>}
          {item.phone&&<a href={`tel:${item.phone}`} style={{textDecoration:'none'}}><div style={{display:'flex',alignItems:'center',gap:10,padding:'8px 12px',background:'#f0f8f0',borderRadius:8,border:'1px solid #cce5cc'}}><span style={{fontSize:18}}>📞</span><div><div style={{fontSize:10,color:GR}}>Festnetz</div><div style={{fontSize:13,fontWeight:'bold',color:'#2d7a2d'}}>{item.phone}</div></div><span style={{marginLeft:'auto',fontSize:12,color:'#2d7a2d',fontWeight:'bold'}}>Anrufen →</span></div></a>}
          {item.email&&<a href={`mailto:${item.email}`} style={{textDecoration:'none'}}><div style={{display:'flex',alignItems:'center',gap:10,padding:'8px 12px',background:P+'10',borderRadius:8,border:`1px solid ${P}25`}}><span style={{fontSize:18}}>✉️</span><div style={{flex:1,overflow:'hidden'}}><div style={{fontSize:10,color:GR}}>E-Mail</div><div style={{fontSize:12,fontWeight:'bold',color:P,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{item.email}</div></div><span style={{marginLeft:'auto',fontSize:12,color:P,fontWeight:'bold',flexShrink:0}}>Senden →</span></div></a>}
          {item.address&&<a href={`https://maps.google.com/?q=${encodeURIComponent(item.address)}`} target="_blank" rel="noreferrer" style={{textDecoration:'none'}}><div style={{display:'flex',alignItems:'center',gap:10,padding:'8px 12px',background:'#fff8f0',borderRadius:8,border:`1px solid ${YL}40`}}><span style={{fontSize:18}}>📍</span><div><div style={{fontSize:10,color:GR}}>Adresse</div><div style={{fontSize:12,fontWeight:'bold',color:YL}}>{item.address}</div></div><span style={{marginLeft:'auto',fontSize:12,color:YL,fontWeight:'bold'}}>Maps →</span></div></a>}
        </div>
        {item.notes&&<div style={{marginTop:10,padding:'6px 10px',background:'#f8f9fc',borderRadius:6,fontSize:12,color:GR}}>💬 {item.notes}</div>}
      </div>)}
    </div>
  </div>;
}

// ── Gallery ───────────────────────────────────────────────────
function Gallery({data,save,user,t}){
  const [items,setItems]=useState(()=>data.gallery||[]);
  const [big,setBig]=useState(null);
  const ref=useRef(null);
  const today=new Date().toISOString().split('T')[0];
  const now=new Date();
  const [calYear,setCalYear]=useState(now.getFullYear());
  const [calMonth,setCalMonth]=useState(now.getMonth());
  const [selDay,setSelDay]=useState(today);
  function upload(e){
    const uploadDate=new Date().toISOString().split('T')[0];
    Array.from(e.target.files||[]).forEach(file=>{
      const r=new FileReader();
      r.onload=ev=>{
        const entry={id:Date.now()+Math.random(),src:ev.target.result,date:uploadDate,author:user.name,filename:file.name};
        setItems(prev=>{const next=[...prev,entry];save('gallery',next);return next;});
      };
      r.readAsDataURL(file);
    });
    e.target.value='';
  }
  const daysInMonth=new Date(calYear,calMonth+1,0).getDate();
  const firstWeekday=(new Date(calYear,calMonth,1).getDay()+6)%7;
  const monthStr=`${calYear}-${String(calMonth+1).padStart(2,'0')}`;
  const selPhotos=items.filter(i=>i.date===selDay);
  function prevMonth(){if(calMonth===0){setCalYear(y=>y-1);setCalMonth(11);}else setCalMonth(m=>m-1);}
  function nextMonth(){if(calMonth===11){setCalYear(y=>y+1);setCalMonth(0);}else setCalMonth(m=>m+1);}
  return <div>
    <PH title={t.gallery}>
      <input ref={ref} type="file" accept="image/*" multiple onChange={upload} style={{display:'none'}}/>
      <Btn onClick={()=>ref.current&&ref.current.click()}>📷 {t.upload}</Btn>
    </PH>
    {big&&<div onClick={()=>setBig(null)} style={{background:'rgba(0,0,0,0.85)',borderRadius:10,padding:16,marginBottom:14,textAlign:'center',cursor:'pointer'}}>
      <img src={big.src} alt="" style={{maxWidth:'100%',maxHeight:'60vh',borderRadius:8}}/>
      <div style={{color:'#fff',fontSize:12,marginTop:6}}>📅 {big.date} · 👤 {big.author}{big.filename?` · ${big.filename}`:''} · (klicken zum Schließen)</div>
    </div>}
    <Card>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14}}>
        <Btn sm outline onClick={prevMonth}>◀</Btn>
        <b style={{color:P,fontSize:14}}>{MNAMES[calMonth]} {calYear}</b>
        <Btn sm outline onClick={nextMonth}>▶</Btn>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:3,marginBottom:4}}>
        {DNAMES.map(d=><div key={d} style={{textAlign:'center',fontSize:11,color:GR,fontWeight:'bold',padding:'3px 0'}}>{d}</div>)}
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:3}}>
        {Array(firstWeekday).fill(null).map((_,i)=><div key={'e'+i}/>)}
        {Array(daysInMonth).fill(null).map((_,i)=>{
          const day=i+1;
          const ds=`${calYear}-${String(calMonth+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
          const isToday=ds===today,isSel=ds===selDay;
          const count=items.filter(x=>x.date===ds).length;
          return <div key={day} onClick={()=>setSelDay(ds)} style={{textAlign:'center',padding:'7px 2px',borderRadius:8,cursor:'pointer',position:'relative',fontSize:13,fontWeight:isToday||isSel?'bold':'normal',background:isSel?P:isToday?LT:'transparent',color:isSel?'#fff':isToday?P:'#333',border:isSel?`2px solid ${P}`:isToday?`2px solid ${P}40`:'2px solid transparent'}}>
            {day}
            {count>0&&<div style={{position:'absolute',bottom:1,left:'50%',transform:'translateX(-50%)',fontSize:9,fontWeight:'bold',color:isSel?'#fff':P,lineHeight:1}}>{count>9?'9+':count}</div>}
          </div>;
        })}
      </div>
    </Card>
    <div>
      <div style={{fontSize:13,fontWeight:'bold',color:P,marginBottom:10,padding:'8px 14px',background:LT,borderRadius:8,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <span>📅 {selDay}</span>
        <span style={{fontWeight:'normal',color:GR,fontSize:12}}>{selPhotos.length===0?'Keine Fotos':`${selPhotos.length} Foto${selPhotos.length>1?'s':''}`}</span>
      </div>
      {selPhotos.length===0?<div style={{textAlign:'center',padding:'16px 0',color:GR,fontSize:13}}>An diesem Tag wurden keine Fotos hochgeladen.</div>:
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(110px,1fr))',gap:8}}>
          {selPhotos.map(item=><div key={item.id} onClick={()=>setBig(item)} style={{cursor:'pointer',borderRadius:8,overflow:'hidden',aspectRatio:'1',background:'#eee',position:'relative'}}>
            <img src={item.src} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/>
            <div style={{position:'absolute',bottom:0,left:0,right:0,background:'rgba(0,0,0,0.4)',padding:'2px 5px',fontSize:10,color:'#fff'}}>👤 {item.author}</div>
          </div>)}
        </div>}
    </div>
    {items.length>0&&<div style={{marginTop:16,textAlign:'center',fontSize:12,color:GR}}>Gesamt: {items.length} Foto{items.length>1?'s':''}</div>}
  </div>;
}

// ── Suppliers ─────────────────────────────────────────────────
const SUP_CATS=['Stahlbau','Beschichtung / Boya','Elektro','Logistik / Nakliye','Beton','Isolierung','Montage','Sonstiges / Diğer'];
function Suppliers({data,save,user,t}){
  const [tab,setTab]=useState('profiles');
  const [profiles,setProfiles]=useState(()=>data.supplierProfiles||[]);
  const [deliveries,setDeliveries]=useState(()=>data.suppliers||[]);
  const [showForm,setShowForm]=useState(false);
  const [delId,setDelId]=useState(null);
  const [expanded,setExpanded]=useState(null);
  const isAdmin=user.role==='admin';
  const today=new Date().toISOString().split('T')[0];
  const efP={name:'',category:'Stahlbau',status:'active',address:'',phone:'',email:'',website:'',taxNo:'',cpName:'',cpPosition:'',cpPhone:'',cpEmail:'',cp2Name:'',cp2Position:'',cp2Phone:'',cp2Email:'',notes:''};
  const [fp,setFp]=useState(efP);
  const efD={material:'',supplier:'',quantity:'',unit:'',ordered:'',expected:'',notes:''};
  const [fd,setFd]=useState(efD);
  function addProfile(){
    if(!fp.name.trim())return;
    const u=[...profiles,{...fp,id:Date.now(),by:user.name,addedDate:today}];
    setProfiles(u);save('supplierProfiles',u);setShowForm(false);setFp(efP);
  }
  function delProfile(id){const u=profiles.filter(p=>p.id!==id);setProfiles(u);save('supplierProfiles',u);setDelId(null);}
  function addDelivery(){const u=[...deliveries,{...fd,id:Date.now(),status:'ordered'}];setDeliveries(u);save('suppliers',u);setShowForm(false);setFd(efD);}
  function markDel(id){const u=deliveries.map(i=>i.id===id?{...i,status:'delivered',delivered:today}:i);setDeliveries(u);save('suppliers',u);}
  const dsc={ordered:YL,delivered:GN,delayed:RD};
  const TabBtn=({id,label})=><button onClick={()=>{setTab(id);setShowForm(false);}} style={{padding:'8px 20px',background:tab===id?P:'transparent',color:tab===id?'#fff':GR,border:`1px solid ${tab===id?P:'#ddd'}`,borderRadius:8,fontSize:13,cursor:'pointer',fontFamily:'Arial',fontWeight:tab===id?'bold':'normal'}}>{label}</button>;
  return <div>
    <PH title={t.suppliers}><Btn onClick={()=>setShowForm(s=>!s)}>+ {t.add}</Btn></PH>
    <div style={{display:'flex',gap:8,marginBottom:16}}>
      <TabBtn id="profiles" label="🏢 Lieferanten-Archiv"/>
      <TabBtn id="deliveries" label="📦 Lieferungen"/>
    </div>
    {tab==='profiles'&&<div>
      {showForm&&<IForm title="Neuer Lieferant / Yeni Tedarikçi" onClose={()=>setShowForm(false)}>
        <div style={{fontWeight:'bold',color:P,fontSize:13,marginBottom:8}}>Firmendaten</div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
          <Fi label="Firmenname *" value={fp.name} onChange={v=>setFp({...fp,name:v})}/>
          <Fs label="Kategorie" value={fp.category} onChange={v=>setFp({...fp,category:v})} opts={SUP_CATS.map(c=>({v:c,l:c}))}/>
        </div>
        <Fi label="Adresse / Adres" value={fp.address} onChange={v=>setFp({...fp,address:v})}/>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
          <Fi label="Telefon" value={fp.phone} onChange={v=>setFp({...fp,phone:v})} type="tel"/>
          <Fi label="E-Mail" value={fp.email} onChange={v=>setFp({...fp,email:v})} type="email"/>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
          <Fi label="Website" value={fp.website} onChange={v=>setFp({...fp,website:v})}/>
          <Fi label="Steuernr. / Vergi No" value={fp.taxNo} onChange={v=>setFp({...fp,taxNo:v})}/>
        </div>
        <div style={{fontWeight:'bold',color:P,fontSize:13,margin:'12px 0 8px'}}>Ansprechpartner 1</div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
          <Fi label="Name" value={fp.cpName} onChange={v=>setFp({...fp,cpName:v})}/>
          <Fi label="Position" value={fp.cpPosition} onChange={v=>setFp({...fp,cpPosition:v})}/>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
          <Fi label="Telefon" value={fp.cpPhone} onChange={v=>setFp({...fp,cpPhone:v})} type="tel"/>
          <Fi label="E-Mail" value={fp.cpEmail} onChange={v=>setFp({...fp,cpEmail:v})} type="email"/>
        </div>
        <div style={{fontWeight:'bold',color:P,fontSize:13,margin:'12px 0 8px'}}>Ansprechpartner 2 (optional)</div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
          <Fi label="Name" value={fp.cp2Name} onChange={v=>setFp({...fp,cp2Name:v})}/>
          <Fi label="Position" value={fp.cp2Position} onChange={v=>setFp({...fp,cp2Position:v})}/>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
          <Fi label="Telefon" value={fp.cp2Phone} onChange={v=>setFp({...fp,cp2Phone:v})} type="tel"/>
          <Fi label="E-Mail" value={fp.cp2Email} onChange={v=>setFp({...fp,cp2Email:v})} type="email"/>
        </div>
        <Ft label={t.notes} value={fp.notes} onChange={v=>setFp({...fp,notes:v})} rows={2}/>
        <div style={{display:'flex',gap:8}}><Btn outline onClick={()=>setShowForm(false)}>{t.cancel}</Btn><Btn disabled={!fp.name.trim()} onClick={addProfile}>{t.save}</Btn></div>
      </IForm>}
      {delId&&isAdmin&&<IForm title="Lieferant löschen?" onClose={()=>setDelId(null)}>
        <div style={{fontSize:13,marginBottom:14}}><b style={{color:RD}}>{profiles.find(p=>p.id===delId)?.name}</b> wirklich löschen?</div>
        <div style={{display:'flex',gap:8}}><Btn outline onClick={()=>setDelId(null)}>{t.cancel}</Btn><Btn danger onClick={()=>delProfile(delId)}>Löschen</Btn></div>
      </IForm>}
      {profiles.length===0?<Card><div style={{color:GR,textAlign:'center',padding:20}}>{t.no_data}</div></Card>:
        profiles.map(p=>{
          const isExp=expanded===p.id;
          return <div key={p.id} style={{background:'#fff',borderRadius:12,marginBottom:12,boxShadow:'0 1px 8px rgba(40,56,152,0.07)',overflow:'hidden'}}>
            <div style={{display:'flex',alignItems:'center',gap:12,padding:'14px 18px',cursor:'pointer'}} onClick={()=>setExpanded(isExp?null:p.id)}>
              <div style={{width:44,height:44,borderRadius:10,background:P,color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:'bold',fontSize:14,flexShrink:0}}>{p.name.slice(0,2).toUpperCase()}</div>
              <div style={{flex:1}}>
                <div style={{fontWeight:'bold',color:P,fontSize:14}}>{p.name}</div>
                <div style={{fontSize:12,color:GR}}>{p.category} · von {p.by} am {p.addedDate}</div>
              </div>
              <div style={{display:'flex',alignItems:'center',gap:8}}>
                <span style={{padding:'2px 8px',background:GN+'20',color:GN,borderRadius:8,fontSize:11,fontWeight:'bold'}}>Aktiv</span>
                <span style={{color:GR,fontSize:18}}>{isExp?'▲':'▼'}</span>
              </div>
            </div>
            {isExp&&<div style={{borderTop:`1px solid ${LT}`,padding:'14px 18px'}}>
              <div style={{display:'flex',flexDirection:'column',gap:6,marginBottom:12}}>
                {p.phone&&<a href={`tel:${p.phone}`} style={{textDecoration:'none'}}><div style={{display:'flex',alignItems:'center',gap:10,padding:'8px 12px',background:'#f0f8f0',borderRadius:8,border:'1px solid #cce5cc'}}><span style={{fontSize:16}}>📞</span><div><div style={{fontSize:10,color:GR}}>Firmatelefon</div><div style={{fontSize:13,fontWeight:'bold',color:'#2d7a2d'}}>{p.phone}</div></div><span style={{marginLeft:'auto',fontSize:11,color:'#2d7a2d',fontWeight:'bold'}}>Anrufen →</span></div></a>}
                {p.email&&<a href={`mailto:${p.email}`} style={{textDecoration:'none'}}><div style={{display:'flex',alignItems:'center',gap:10,padding:'8px 12px',background:P+'10',borderRadius:8,border:`1px solid ${P}25`}}><span style={{fontSize:16}}>✉️</span><div style={{flex:1,overflow:'hidden'}}><div style={{fontSize:10,color:GR}}>E-Mail</div><div style={{fontSize:12,fontWeight:'bold',color:P,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{p.email}</div></div><span style={{marginLeft:'auto',fontSize:11,color:P,fontWeight:'bold',flexShrink:0}}>Senden →</span></div></a>}
                {p.website&&<a href={p.website.startsWith('http')?p.website:`https://${p.website}`} target="_blank" rel="noreferrer" style={{textDecoration:'none'}}><div style={{display:'flex',alignItems:'center',gap:10,padding:'8px 12px',background:'#f5f0ff',borderRadius:8,border:'1px solid #d0b8ff'}}><span style={{fontSize:16}}>🌐</span><div><div style={{fontSize:10,color:GR}}>Website</div><div style={{fontSize:12,fontWeight:'bold',color:'#6b3fa0'}}>{p.website}</div></div><span style={{marginLeft:'auto',fontSize:11,color:'#6b3fa0',fontWeight:'bold'}}>Öffnen →</span></div></a>}
              </div>
              {[{n:p.cpName,pos:p.cpPosition,ph:p.cpPhone,em:p.cpEmail,label:'Ansprechpartner 1'},{n:p.cp2Name,pos:p.cp2Position,ph:p.cp2Phone,em:p.cp2Email,label:'Ansprechpartner 2'}].map((cp,idx)=>cp.n?(
                <div key={idx} style={{marginBottom:10,padding:'12px',background:'#f8f9fc',borderRadius:8}}>
                  <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:8}}>
                    <Av name={cp.n} size={32}/>
                    <div><div style={{fontWeight:'bold',color:P,fontSize:13}}>{cp.n}</div>{cp.pos&&<div style={{fontSize:11,color:GR}}>{cp.pos} · {cp.label}</div>}</div>
                  </div>
                  <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
                    {cp.ph&&<a href={`tel:${cp.ph}`} style={{textDecoration:'none'}}><div style={{display:'flex',alignItems:'center',gap:6,padding:'5px 10px',background:GN+'15',borderRadius:6,border:`1px solid ${GN}30`}}><span style={{fontSize:14}}>📱</span><span style={{fontSize:12,fontWeight:'bold',color:GN}}>{cp.ph}</span></div></a>}
                    {cp.em&&<a href={`mailto:${cp.em}`} style={{textDecoration:'none'}}><div style={{display:'flex',alignItems:'center',gap:6,padding:'5px 10px',background:P+'10',borderRadius:6,border:`1px solid ${P}25`}}><span style={{fontSize:14}}>✉️</span><span style={{fontSize:12,fontWeight:'bold',color:P}}>{cp.em}</span></div></a>}
                  </div>
                </div>
              ):null)}
              {p.taxNo&&<div style={{fontSize:12,color:GR,marginBottom:6}}>🧾 Vergi No: <b>{p.taxNo}</b></div>}
              {p.notes&&<div style={{fontSize:12,color:GR,padding:'8px 10px',background:'#f8f9fc',borderRadius:6}}>💬 {p.notes}</div>}
              {isAdmin&&<div style={{marginTop:12,display:'flex',justifyContent:'flex-end'}}><Btn sm danger onClick={()=>setDelId(p.id)}>✕ Löschen</Btn></div>}
            </div>}
          </div>;
        })
      }
    </div>}
    {tab==='deliveries'&&<div>
      {showForm&&<IForm title="Neue Lieferung" onClose={()=>setShowForm(false)}>
        <Fi label={t.material} value={fd.material} onChange={v=>setFd({...fd,material:v})}/>
        <Fi label={t.supplier} value={fd.supplier} onChange={v=>setFd({...fd,supplier:v})}/>
        <div style={{display:'grid',gridTemplateColumns:'2fr 1fr',gap:8}}>
          <Fi label={t.quantity} value={fd.quantity} onChange={v=>setFd({...fd,quantity:v})} type="number"/>
          <Fi label={t.unit} value={fd.unit} onChange={v=>setFd({...fd,unit:v})}/>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
          <Fi label={t.ordered} value={fd.ordered} onChange={v=>setFd({...fd,ordered:v})} type="date"/>
          <Fi label={t.expected} value={fd.expected} onChange={v=>setFd({...fd,expected:v})} type="date"/>
        </div>
        <Ft label={t.notes} value={fd.notes} onChange={v=>setFd({...fd,notes:v})}/>
        <div style={{display:'flex',gap:8}}><Btn outline onClick={()=>setShowForm(false)}>{t.cancel}</Btn><Btn onClick={addDelivery}>{t.save}</Btn></div>
      </IForm>}
      {deliveries.length===0?<Card><div style={{color:GR,textAlign:'center',padding:20}}>{t.no_data}</div></Card>:
        <Card><div style={{overflowX:'auto'}}><table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
          <thead><tr style={{background:LT}}>
            {[t.material,t.supplier,`${t.quantity}/${t.unit}`,t.ordered,t.expected,t.delivered,t.status,''].map(h=><th key={h} style={{padding:'7px 10px',textAlign:'left',color:GR,fontSize:11}}>{h}</th>)}
          </tr></thead>
          <tbody>{deliveries.map(item=><tr key={item.id} style={{borderBottom:'1px solid #f2f2f2'}}>
            <td style={{padding:'7px 10px',fontWeight:'bold'}}>{item.material}</td>
            <td style={{padding:'7px 10px',color:GR}}>{item.supplier}</td>
            <td style={{padding:'7px 10px',color:GR}}>{item.quantity} {item.unit}</td>
            <td style={{padding:'7px 10px',color:GR}}>{item.ordered||'–'}</td>
            <td style={{padding:'7px 10px',color:GR}}>{item.expected||'–'}</td>
            <td style={{padding:'7px 10px',color:GR}}>{item.delivered||'–'}</td>
            <td style={{padding:'7px 10px'}}><span style={{padding:'2px 8px',background:(dsc[item.status]||GR)+'25',color:dsc[item.status]||GR,borderRadius:10,fontSize:11,fontWeight:'bold'}}>{item.status}</span></td>
            <td style={{padding:'7px 10px'}}>{!item.delivered&&<Btn sm outline onClick={()=>markDel(item.id)}>✓</Btn>}</td>
          </tr>)}</tbody>
        </table></div></Card>}
    </div>}
  </div>;
}

// ── Budget ────────────────────────────────────────────────────
function Budget({data,save,user}){
  const [bud,setBud]=useState(()=>data.budget||{total:0,payments:[]});
  const [showForm,setShowForm]=useState(false);
  const [editTotal,setEditTotal]=useState(false);
  const [totalInput,setTotalInput]=useState('');
  const today=new Date().toISOString().split('T')[0];
  const ef={date:today,recipient:'',desc:'',amount:''};
  const [f,setF]=useState(ef);
  if(user.role!=='admin')return <Card><div style={{color:RD,textAlign:'center',padding:24}}>🔒 Budget – nur Peter Siemund & Alper Bulca</div></Card>;
  const payments=bud.payments||[];
  const totalPaid=payments.reduce((s,p)=>s+Number(p.amount||0),0);
  const total=bud.total||0;
  const remaining=total-totalPaid;
  const pct=total>0?Math.min(100,totalPaid/total*100):0;
  function saveTotal(){const u={...bud,total:Number(totalInput)};setBud(u);save('budget',u);setEditTotal(false);}
  function addPayment(){
    if(!f.recipient||!f.amount)return;
    const u={...bud,payments:[...payments,{...f,id:Date.now(),amount:Number(f.amount),by:user.name}]};
    setBud(u);save('budget',u);setShowForm(false);setF(ef);
  }
  function delPayment(id){const u={...bud,payments:payments.filter(p=>p.id!==id)};setBud(u);save('budget',u);}
  return <div>
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14}}>
      <h2 style={{color:P,fontSize:17,margin:0}}>💶 Budget 🔒</h2>
      <Btn onClick={()=>setShowForm(s=>!s)}>+ Zahlung eintragen</Btn>
    </div>
    <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12,marginBottom:14}}>
      {[{l:'Gesamtbudget',v:total,c:P,ed:true},{l:'Ausgezahlt',v:totalPaid,c:RD},{l:'Verbleibend',v:remaining,c:remaining>=0?GN:RD}].map(k=>(
        <div key={k.l} style={{background:'#fff',borderRadius:10,padding:'14px 16px',boxShadow:'0 1px 8px rgba(40,56,152,0.07)',borderTop:`3px solid ${k.c}`}}>
          <div style={{fontSize:11,color:GR,marginBottom:4}}>{k.l}</div>
          <div style={{fontSize:22,fontWeight:'bold',color:k.c,marginBottom:k.ed?6:0}}>{(k.v||0).toLocaleString()} €</div>
          {k.ed&&<Btn sm outline onClick={()=>{setTotalInput(String(total));setEditTotal(true);}}>✏️ Ändern</Btn>}
        </div>
      ))}
    </div>
    <Card>
      <div style={{fontSize:12,color:GR,marginBottom:8,display:'flex',justifyContent:'space-between'}}>
        <span>Budget-Auslastung</span>
        <span style={{fontWeight:'bold',color:pct>90?RD:pct>70?YL:GN}}>{pct.toFixed(1)}%</span>
      </div>
      <div style={{height:24,background:'#eef0f6',borderRadius:10,overflow:'hidden'}}>
        <div style={{height:'100%',width:pct+'%',background:pct>90?RD:pct>70?YL:GN,borderRadius:10,transition:'width 0.5s',display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:'bold',color:'#fff'}}>
          {pct>8?`${totalPaid.toLocaleString()} €`:''}
        </div>
      </div>
    </Card>
    {editTotal&&<IForm title="Gesamtbudget festlegen" onClose={()=>setEditTotal(false)}>
      <Fi label="Gesamtbudget (€)" value={totalInput} onChange={setTotalInput} type="number" ph="z.B. 5500000"/>
      <div style={{display:'flex',gap:8}}><Btn outline onClick={()=>setEditTotal(false)}>Abbrechen</Btn><Btn onClick={saveTotal}>Speichern</Btn></div>
    </IForm>}
    {showForm&&<IForm title="Zahlung eintragen" onClose={()=>setShowForm(false)}>
      <Fi label="Datum" value={f.date} onChange={v=>setF({...f,date:v})} type="date"/>
      <Fi label="Zahlungsempfänger *" value={f.recipient} onChange={v=>setF({...f,recipient:v})} ph="z.B. Sipil İnşaat Ltd."/>
      <Fi label="Beschreibung" value={f.desc} onChange={v=>setF({...f,desc:v})} ph="z.B. Abschlagsrechnung #2"/>
      <Fi label="Betrag (€) *" value={f.amount} onChange={v=>setF({...f,amount:v})} type="number"/>
      <div style={{display:'flex',gap:8}}><Btn outline onClick={()=>setShowForm(false)}>Abbrechen</Btn><Btn disabled={!f.recipient||!f.amount} onClick={addPayment}>Speichern</Btn></div>
    </IForm>}
    <Card title={`Zahlungshistorie (${payments.length})`}>
      {payments.length===0?<div style={{color:GR,textAlign:'center',padding:16}}>Noch keine Zahlungen eingetragen</div>:
        <div>
          {[...payments].reverse().map(p=>(
            <div key={p.id} style={{display:'flex',alignItems:'center',gap:12,padding:'10px 0',borderBottom:'1px solid #f2f2f2'}}>
              <div style={{width:36,height:36,borderRadius:8,background:RD+'15',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}><span style={{fontSize:16}}>💸</span></div>
              <div style={{flex:1}}>
                <div style={{fontWeight:'bold',color:'#333',fontSize:13}}>{p.recipient}</div>
                {p.desc&&<div style={{fontSize:12,color:GR}}>{p.desc}</div>}
                <div style={{fontSize:11,color:GR}}>📅 {p.date} · {p.by}</div>
              </div>
              <div style={{textAlign:'right',flexShrink:0}}><div style={{fontSize:16,fontWeight:'bold',color:RD}}>−{Number(p.amount).toLocaleString()} €</div></div>
              <Btn sm danger onClick={()=>delPayment(p.id)}>✕</Btn>
            </div>
          ))}
          <div style={{display:'flex',justifyContent:'space-between',padding:'10px 0',marginTop:4,borderTop:`2px solid ${LT}`}}>
            <b>Gesamt ausgezahlt</b><b style={{color:RD,fontSize:15}}>−{totalPaid.toLocaleString()} €</b>
          </div>
        </div>}
    </Card>
  </div>;
}

// ── UserManagement ────────────────────────────────────────────
const PERM_LIST=[
  {id:'schedule',label:'Bauzeitenplan bearbeiten',labelTr:'İnşaat takvimini düzenle'},
  {id:'contracts',label:'Verträge hinzufügen',labelTr:'Sözleşme ekle'},
  {id:'suppliers',label:'Lieferanten bearbeiten',labelTr:'Tedarikçileri düzenle'},
  {id:'documents',label:'Dokumente hochladen',labelTr:'Belge yükle'},
];
function UserManagement({data,save,t}){
  const [pins,setPins]=useState(()=>data.pins||DEF.pins);
  const [extras,setExtras]=useState(()=>data.extraUsers||[]);
  const [pinEditId,setPinEditId]=useState(null);
  const [newPin,setNewPin]=useState('');
  const [confirmPin,setConfirmPin]=useState('');
  const [pinErr,setPinErr]=useState('');
  const [showAdd,setShowAdd]=useState(false);
  const [nf,setNf]=useState({firstName:'',lastName:''});
  const [addErr,setAddErr]=useState('');
  const [permEditId,setPermEditId]=useState(null);
  const allUsers=[...CORE,...extras];
  function savePin(uid){
    if(newPin.length!==4||!/^\d{4}$/.test(newPin)){setPinErr('PIN muss genau 4 Ziffern sein');return;}
    if(newPin!==confirmPin){setPinErr('PINs stimmen nicht überein');return;}
    const u={...pins,[uid]:newPin};setPins(u);save('pins',u);setPinEditId(null);setNewPin('');setConfirmPin('');setPinErr('');
  }
  function addUser(){
    if(!nf.firstName.trim()||!nf.lastName.trim()){setAddErr('Vor- und Nachname erforderlich');return;}
    const id='u_'+Date.now();
    const name=nf.firstName.trim()+' '+nf.lastName.trim();
    const newUser={id,name,role:'participant',permissions:[]};
    const newExtras=[...extras,newUser];
    const newPins={...pins,[id]:'0000'};
    setExtras(newExtras);setPins(newPins);save('extraUsers',newExtras);save('pins',newPins);
    setShowAdd(false);setNf({firstName:'',lastName:''});setAddErr('');
  }
  function removeUser(id){const ne=extras.filter(u=>u.id!==id);setExtras(ne);save('extraUsers',ne);}
  function togglePerm(uid,permId){
    const ne=extras.map(u=>{
      if(u.id!==uid)return u;
      const perms=u.permissions||[];
      const next=perms.includes(permId)?perms.filter(p=>p!==permId):[...perms,permId];
      return{...u,permissions:next};
    });
    setExtras(ne);save('extraUsers',ne);
  }
  const permUser=extras.find(u=>u.id===permEditId);
  return <div>
    <PH title="🔐 Nutzerverwaltung"><Btn onClick={()=>setShowAdd(s=>!s)}>+ Teilnehmer hinzufügen</Btn></PH>
    <div style={{background:'#fff9e6',border:`1px solid ${YL}`,borderRadius:8,padding:'10px 14px',marginBottom:14,fontSize:12,color:'#7a5500'}}>
      ⚠️ Standard-PIN für alle: <b>0000</b> · Bitte vor erstem Einsatz ändern.
    </div>
    {showAdd&&<IForm title="Neuer Teilnehmer" onClose={()=>setShowAdd(false)}>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
        <Fi label="Vorname" value={nf.firstName} onChange={v=>setNf({...nf,firstName:v})} ph="z.B. Ali"/>
        <Fi label="Nachname" value={nf.lastName} onChange={v=>setNf({...nf,lastName:v})} ph="z.B. Yılmaz"/>
      </div>
      {addErr&&<div style={{color:RD,fontSize:12,marginBottom:8}}>❌ {addErr}</div>}
      <div style={{display:'flex',gap:8}}><Btn outline onClick={()=>setShowAdd(false)}>{t.cancel}</Btn><Btn onClick={addUser}>Hinzufügen</Btn></div>
    </IForm>}
    {pinEditId&&<IForm title={`PIN für ${allUsers.find(u=>u.id===pinEditId)?.name||''}`} onClose={()=>setPinEditId(null)}>
      <Fi label="Neue PIN (4 Ziffern)" value={newPin} onChange={v=>setNewPin(v.replace(/\D/g,'').slice(0,4))} type="password" ph="0000"/>
      <Fi label="PIN wiederholen" value={confirmPin} onChange={v=>setConfirmPin(v.replace(/\D/g,'').slice(0,4))} type="password"/>
      {pinErr&&<div style={{color:RD,fontSize:12,marginBottom:8}}>❌ {pinErr}</div>}
      <div style={{display:'flex',gap:8}}><Btn outline onClick={()=>setPinEditId(null)}>{t.cancel}</Btn><Btn onClick={()=>savePin(pinEditId)}>{t.save}</Btn></div>
    </IForm>}
    {permEditId&&permUser&&<IForm title={`🔑 Berechtigungen: ${permUser.name}`} onClose={()=>setPermEditId(null)}>
      <div style={{fontSize:12,color:GR,marginBottom:12}}>Welche Module darf <b>{permUser.name}</b> bearbeiten?</div>
      {PERM_LIST.map(perm=>{
        const active=(permUser.permissions||[]).includes(perm.id);
        return <div key={perm.id} onClick={()=>togglePerm(permUser.id,perm.id)} style={{display:'flex',alignItems:'center',gap:12,padding:'10px 12px',borderRadius:8,marginBottom:6,background:active?LT:'#f8f9fc',border:`1px solid ${active?P:'#e0e0e0'}`,cursor:'pointer'}}>
          <div style={{width:20,height:20,borderRadius:4,background:active?P:'#fff',border:`2px solid ${active?P:'#ccc'}`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
            {active&&<span style={{color:'#fff',fontSize:13,lineHeight:1}}>✓</span>}
          </div>
          <div>
            <div style={{fontSize:13,fontWeight:active?'bold':'normal',color:active?P:'#333'}}>{perm.label}</div>
            <div style={{fontSize:11,color:GR}}>{perm.labelTr}</div>
          </div>
        </div>;
      })}
      <div style={{marginTop:8}}><Btn onClick={()=>setPermEditId(null)}>{t.save}</Btn></div>
    </IForm>}
    <Card title="Core Team">
      {CORE.map(u=>(
        <div key={u.id} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'10px 0',borderBottom:'1px solid #f2f2f2'}}>
          <div style={{display:'flex',alignItems:'center',gap:12}}>
            <Av name={u.name}/>
            <div>
              <div style={{fontWeight:'bold',color:P,fontSize:13}}>{u.name}</div>
              <div style={{fontSize:11,color:GR}}>{u.role} · {getInit(u.name)} · Vollzugriff</div>
            </div>
          </div>
          <Btn sm outline onClick={()=>{setPinEditId(u.id);setNewPin('');setConfirmPin('');setPinErr('');}}>PIN ändern</Btn>
        </div>
      ))}
    </Card>
    {extras.length>0&&<Card title="Teilnehmer">
      {extras.map(u=>{
        const perms=u.permissions||[];
        return <div key={u.id} style={{padding:'10px 0',borderBottom:'1px solid #f2f2f2'}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
            <div style={{display:'flex',alignItems:'center',gap:12}}>
              <Av name={u.name}/>
              <div>
                <div style={{fontWeight:'bold',color:P,fontSize:13}}>{u.name}</div>
                <div style={{fontSize:11,color:GR}}>{getInit(u.name)} · PIN: ●●●●</div>
              </div>
            </div>
            <div style={{display:'flex',gap:6}}>
              <Btn sm outline onClick={()=>setPermEditId(u.id)}>🔑 Rechte</Btn>
              <Btn sm outline onClick={()=>{setPinEditId(u.id);setNewPin('');setConfirmPin('');setPinErr('');}}>PIN</Btn>
              <Btn sm danger onClick={()=>removeUser(u.id)}>✕</Btn>
            </div>
          </div>
          {perms.length>0&&<div style={{marginTop:6,marginLeft:48,display:'flex',gap:6,flexWrap:'wrap'}}>
            {perms.map(pid=>{const pl=PERM_LIST.find(p=>p.id===pid);return pl?<span key={pid} style={{fontSize:10,padding:'2px 7px',background:LT,color:P,borderRadius:10,border:`1px solid ${P}40`}}>✓ {pl.label}</span>:null;})}
          </div>}
        </div>;
      })}
    </Card>}
  </div>;
}

// ── Login ─────────────────────────────────────────────────────
function Login({setUser,lang,setLang,t,allUsers,pins}){
  const [sel,setSel]=useState('');
  const [pin,setPin]=useState('');
  const [err,setErr]=useState(false);
  function tryLogin(){
    const u=allUsers.find(u=>u.id===sel);
    if(!u)return;
    if(pin===(pins[sel]||'0000')){setUser(u);}
    else{setErr(true);setPin('');}
  }
  return <div style={{display:'flex',justifyContent:'center',alignItems:'center',minHeight:'100vh',background:'#f0f2f8',fontFamily:'Arial',padding:20}}>
    <div style={{background:'#fff',borderRadius:14,padding:36,width:310,boxShadow:'0 4px 24px rgba(40,56,152,0.15)'}}>
      {/* LOGO – Alper: ersetze den Block unten durch: <img src="/logo.png" width="260" alt="ZINKPOWER" style={{display:'block',margin:'0 auto 16px'}}/> */}
      <div style={{textAlign:'center',marginBottom:20}}>
        <div style={{fontFamily:'"Arial Black","Arial Bold",Arial',fontWeight:900,fontSize:26,color:P,letterSpacing:2,lineHeight:1.1,textTransform:'uppercase'}}>
          ZINKPOWER<sup style={{fontSize:11,verticalAlign:'super',fontWeight:900}}>®</sup>
        </div>
        <div style={{background:GR,color:'#fff',padding:'6px 0',fontSize:13,letterSpacing:1,fontFamily:'Arial',fontWeight:400,marginTop:6}}>
          KOPF GRUPPE
        </div>
      </div>
      <div style={{textAlign:'center',color:GR,fontSize:11,marginBottom:20,letterSpacing:2}}>Manisa İnşaat / Bauprojekt</div>
      <div style={{display:'flex',gap:6,marginBottom:16}}>
        {['de','tr'].map(l=><button key={l} onClick={()=>setLang(l)} style={{flex:1,padding:'7px 0',background:lang===l?P:'#fff',color:lang===l?'#fff':GR,border:`1px solid ${lang===l?P:'#ddd'}`,borderRadius:6,fontSize:12,cursor:'pointer',fontFamily:'Arial',fontWeight:'bold'}}>{l==='de'?'🇩🇪 DE':'🇹🇷 TR'}</button>)}
      </div>
      <Fs label={t.sel} value={sel} onChange={v=>{setSel(v);setPin('');setErr(false);}} opts={[{v:'',l:`-- ${t.sel} --`},...allUsers.map(u=>({v:u.id,l:u.name}))]}/>
      {sel&&<Fi label="PIN" value={pin} onChange={v=>{setPin(v.replace(/\D/g,'').slice(0,4));setErr(false);}} type="password" ph="4-stellige PIN"/>}
      {err&&<div style={{color:RD,fontSize:12,marginBottom:6}}>❌ Falsche PIN / Yanlış PIN</div>}
      <div style={{marginTop:8}}><Btn disabled={!sel||pin.length!==4} onClick={tryLogin}>{t.login}</Btn></div>
    </div>
  </div>;
}

// ── App ───────────────────────────────────────────────────────
export default function App(){
  const [user,setUser]=useState(null);
  const [lang,setLang]=useState('de');
  const [mod,setMod]=useState('dash');
  const [data,setData]=useState(()=>({...DEF}));
  const [sideOpen,setSideOpen]=useState(true);
  const [navOpen,setNavOpen]=useState(false);
  const isMobile=useIsMobile();
  const t=T[lang]||T.de;

  useEffect(()=>{
    async function load(){
      const {data:rows}=await supabase.from('project_data').select('key, value');
      if(rows&&rows.length>0){
        const loaded={};
        rows.forEach(row=>{try{loaded[row.key]=JSON.parse(row.value);}catch(e){}});
        setData(d=>({...d,...loaded}));
      }
    }
    load();
  },[]);

  async function save(key,val){
    setData(d=>({...d,[key]:val}));
    await supabase.from('project_data').upsert({key,value:JSON.stringify(val),updated_at:new Date().toISOString()});
  }

  const allUsers=[...CORE,...(data.extraUsers||[])];
  const pins=data.pins||DEF.pins;

  if(!user)return <Login setUser={setUser} lang={lang} setLang={setLang} t={t} allUsers={allUsers} pins={pins}/>;

  const nav=[
    {id:'dash',l:t.dash,i:'🏠'},{id:'schedule',l:t.schedule,i:'📅'},
    {id:'contracts',l:t.contracts,i:'📄'},{id:'changeOrders',l:t.co,i:'➕'},
    {id:'approvals',l:t.approvals,i:'✅'},{id:'issues',l:t.issues,i:'⚠️'},
    {id:'diary',l:t.diary,i:'📒'},{id:'docs',l:t.docs,i:'📁'},
    {id:'contacts',l:t.contacts,i:'👥'},{id:'gallery',l:t.gallery,i:'🖼️'},
    {id:'suppliers',l:t.suppliers,i:'🚚'},
    ...(user.role==='admin'?[{id:'budget',l:t.budget,i:'💶'},{id:'users',l:'Nutzer',i:'🔐'}]:[]),
  ];

  const mp={data,save,user,t,isMobile};
  const views={
    dash:<Dashboard {...mp}/>,schedule:<Schedule {...mp}/>,contracts:<Contracts {...mp}/>,
    changeOrders:<ChangeOrders {...mp}/>,approvals:<Approvals {...mp}/>,issues:<Issues {...mp}/>,
    diary:<Diary {...mp}/>,docs:<Documents {...mp}/>,contacts:<Contacts {...mp}/>,
    gallery:<Gallery {...mp}/>,suppliers:<Suppliers {...mp}/>,budget:<Budget {...mp}/>,
    users:<UserManagement {...mp}/>,
  };

  // ── MOBILE LAYOUT ──────────────────────────────────────────
  if(isMobile){
    return <div style={{display:'flex',flexDirection:'column',minHeight:'100vh',fontFamily:'Arial',background:'#f0f2f8'}}>
      <div style={{background:P,color:'#fff',padding:'12px 16px',display:'flex',alignItems:'center',gap:12,flexShrink:0}}>
        <div style={{flex:1}}>
          <div style={{fontWeight:'bold',fontSize:13,letterSpacing:1}}>ZINKPOWER®</div>
          <div style={{fontSize:9,opacity:0.7,letterSpacing:2}}>KOPF GRUPPE · Manisa</div>
        </div>
        <div style={{fontSize:11,color:'rgba(255,255,255,0.8)'}}>{getInit(user.name)}</div>
        <button onClick={()=>setNavOpen(o=>!o)} style={{background:'rgba(255,255,255,0.15)',border:'none',color:'#fff',borderRadius:8,padding:'8px 12px',fontSize:18,cursor:'pointer',lineHeight:1}}>
          {navOpen?'✕':'☰'}
        </button>
      </div>
      {navOpen&&<div style={{background:P,borderBottom:'2px solid rgba(255,255,255,0.2)'}}>
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:1}}>
          {nav.map(n=>(
            <div key={n.id} onClick={()=>{setMod(n.id);setNavOpen(false);}} style={{padding:'10px 4px',textAlign:'center',cursor:'pointer',background:mod===n.id?'rgba(255,255,255,0.2)':'transparent',borderRadius:8,margin:4}}>
              <div style={{fontSize:20}}>{n.i}</div>
              <div style={{fontSize:9,color:'rgba(255,255,255,0.85)',marginTop:2,lineHeight:1.2}}>{n.l}</div>
            </div>
          ))}
        </div>
        <div style={{display:'flex',gap:8,padding:'8px 12px',borderTop:'1px solid rgba(255,255,255,0.15)'}}>
          {['de','tr'].map(l=>(
            <button key={l} onClick={()=>setLang(l)} style={{padding:'5px 14px',background:lang===l?'rgba(255,255,255,0.9)':'rgba(255,255,255,0.12)',color:lang===l?P:'#fff',border:'none',borderRadius:6,fontSize:12,cursor:'pointer',fontFamily:'Arial',fontWeight:'bold'}}>{l.toUpperCase()}</button>
          ))}
          <button onClick={()=>setUser(null)} style={{marginLeft:'auto',padding:'5px 14px',background:'rgba(255,255,255,0.1)',color:'#fff',border:'1px solid rgba(255,255,255,0.2)',borderRadius:6,fontSize:12,cursor:'pointer',fontFamily:'Arial'}}>{t.logout}</button>
        </div>
      </div>}
      <div style={{background:'#fff',padding:'8px 16px',borderBottom:'1px solid #eee',display:'flex',alignItems:'center',gap:8}}>
        <span style={{fontSize:18}}>{nav.find(n=>n.id===mod)?.i}</span>
        <span style={{fontWeight:'bold',color:P,fontSize:14}}>{nav.find(n=>n.id===mod)?.l}</span>
      </div>
      <div style={{flex:1,overflowY:'auto',padding:12}}>
        {views[mod]||<div style={{color:GR}}>{t.no_data}</div>}
      </div>
    </div>;
  }

  // ── DESKTOP LAYOUT ─────────────────────────────────────────
  return <div style={{display:'flex',minHeight:'100vh',fontFamily:'Arial',background:'#f0f2f8'}}>
    <div style={{width:sideOpen?210:48,background:P,color:'#fff',display:'flex',flexDirection:'column',transition:'width 0.2s',flexShrink:0,overflow:'hidden',minHeight:'100vh'}}>
      <div onClick={()=>setSideOpen(s=>!s)} style={{padding:'10px 8px',borderBottom:'1px solid rgba(255,255,255,0.15)',display:'flex',alignItems:'center',cursor:'pointer',gap:8,minHeight:52}}>
        {sideOpen&&<div style={{flex:1,overflow:'hidden'}}>
          <div style={{fontWeight:'bold',fontSize:12,whiteSpace:'nowrap',color:'#fff',letterSpacing:1}}>ZINKPOWER®</div>
          <div style={{fontSize:9,opacity:0.7,color:'#fff',letterSpacing:2}}>KOPF GRUPPE</div>
        </div>}
        <span style={{fontSize:14,flexShrink:0,color:'#fff'}}>{sideOpen?'◀':'▶'}</span>
      </div>
      <div style={{flex:1,overflowY:'auto'}}>
        {nav.map(n=><div key={n.id} onClick={()=>setMod(n.id)} style={{padding:'9px 10px',display:'flex',alignItems:'center',gap:8,cursor:'pointer',background:mod===n.id?'rgba(255,255,255,0.18)':'transparent',borderLeft:mod===n.id?'3px solid #fff':'3px solid transparent',overflow:'hidden'}}>
          <span style={{fontSize:15,flexShrink:0}}>{n.i}</span>
          {sideOpen&&<span style={{fontSize:12,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{n.l}</span>}
        </div>)}
      </div>
      <div style={{padding:'10px 8px',borderTop:'1px solid rgba(255,255,255,0.15)'}}>
        {sideOpen&&<div style={{display:'flex',gap:4,marginBottom:8}}>
          {['de','tr'].map(l=><button key={l} onClick={()=>setLang(l)} style={{flex:1,padding:'4px 0',background:lang===l?'rgba(255,255,255,0.9)':'rgba(255,255,255,0.12)',color:lang===l?P:'#fff',border:'none',borderRadius:4,fontSize:11,cursor:'pointer',fontFamily:'Arial',fontWeight:'bold'}}>{l.toUpperCase()}</button>)}
        </div>}
        <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:sideOpen?8:0}}>
          <div style={{width:30,height:30,borderRadius:'50%',background:'rgba(255,255,255,0.22)',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:'bold',fontSize:11,flexShrink:0}}>{getInit(user.name)}</div>
          {sideOpen&&<span style={{fontSize:12,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{user.name}</span>}
        </div>
        {sideOpen&&<button onClick={()=>setUser(null)} style={{width:'100%',padding:'5px 0',background:'rgba(255,255,255,0.1)',color:'#fff',border:'1px solid rgba(255,255,255,0.2)',borderRadius:5,fontSize:11,cursor:'pointer',fontFamily:'Arial'}}>{t.logout}</button>}
      </div>
    </div>
    <div style={{flex:1,overflowY:'auto',padding:20}}>
      {views[mod]||<div style={{color:GR}}>{t.no_data}</div>}
    </div>
  </div>;
}
  const [user,setUser]=useState(null);
  const [lang,setLang]=useState('de');
  const [mod,setMod]=useState('dash');
  const [data,setData]=useState(()=>({...DEF}));
  const [sideOpen,setSideOpen]=useState(true);
  const t=T[lang]||T.de;

  // Supabase: Daten laden beim Start
  useEffect(()=>{
    async function load(){
      const {data:rows}=await supabase.from('project_data').select('key, value');
      if(rows&&rows.length>0){
        const loaded={};
        rows.forEach(row=>{try{loaded[row.key]=JSON.parse(row.value);}catch(e){}});
        setData(d=>({...d,...loaded}));
      }
    }
    load();
  },[]);

  // Supabase: Daten speichern
  async function save(key,val){
    setData(d=>({...d,[key]:val}));
    await supabase.from('project_data').upsert({key,value:JSON.stringify(val),updated_at:new Date().toISOString()});
  }

  const allUsers=[...CORE,...(data.extraUsers||[])];
  const pins=data.pins||DEF.pins;

  if(!user)return <Login setUser={setUser} lang={lang} setLang={setLang} t={t} allUsers={allUsers} pins={pins}/>;

  const nav=[
    {id:'dash',l:t.dash,i:'🏠'},{id:'schedule',l:t.schedule,i:'📅'},
    {id:'contracts',l:t.contracts,i:'📄'},{id:'changeOrders',l:t.co,i:'➕'},
    {id:'approvals',l:t.approvals,i:'✅'},{id:'issues',l:t.issues,i:'⚠️'},
    {id:'diary',l:t.diary,i:'📒'},{id:'docs',l:t.docs,i:'📁'},
    {id:'contacts',l:t.contacts,i:'👥'},{id:'gallery',l:t.gallery,i:'🖼️'},
    {id:'suppliers',l:t.suppliers,i:'🚚'},
    ...(user.role==='admin'?[{id:'budget',l:t.budget,i:'💶'},{id:'users',l:'Nutzerverwaltung',i:'🔐'}]:[]),
  ];

  const mp={data,save,user,t};
  const views={
    dash:<Dashboard {...mp}/>,schedule:<Schedule {...mp}/>,contracts:<Contracts {...mp}/>,
    changeOrders:<ChangeOrders {...mp}/>,approvals:<Approvals {...mp}/>,issues:<Issues {...mp}/>,
    diary:<Diary {...mp}/>,docs:<Documents {...mp}/>,contacts:<Contacts {...mp}/>,
    gallery:<Gallery {...mp}/>,suppliers:<Suppliers {...mp}/>,budget:<Budget {...mp}/>,
    users:<UserManagement {...mp}/>,
  };

  return <div style={{display:'flex',minHeight:'100vh',fontFamily:'Arial',background:'#f0f2f8'}}>
    <div style={{width:sideOpen?210:48,background:P,color:'#fff',display:'flex',flexDirection:'column',transition:'width 0.2s',flexShrink:0,overflow:'hidden',minHeight:'100vh'}}>
      <div onClick={()=>setSideOpen(s=>!s)} style={{padding:'10px 8px',borderBottom:'1px solid rgba(255,255,255,0.15)',display:'flex',alignItems:'center',cursor:'pointer',gap:8,minHeight:52}}>
        {sideOpen&&<div style={{flex:1,overflow:'hidden'}}>
          <div style={{fontWeight:'bold',fontSize:12,whiteSpace:'nowrap',color:'#fff',letterSpacing:1}}>ZINKPOWER®</div>
          <div style={{fontSize:9,opacity:0.7,color:'#fff',letterSpacing:2}}>KOPF GRUPPE</div>
        </div>}
        <span style={{fontSize:14,flexShrink:0,color:'#fff'}}>{sideOpen?'◀':'▶'}</span>
      </div>
      <div style={{flex:1,overflowY:'auto'}}>
        {nav.map(n=><div key={n.id} onClick={()=>setMod(n.id)} style={{padding:'9px 10px',display:'flex',alignItems:'center',gap:8,cursor:'pointer',background:mod===n.id?'rgba(255,255,255,0.18)':'transparent',borderLeft:mod===n.id?'3px solid #fff':'3px solid transparent',overflow:'hidden'}}>
          <span style={{fontSize:15,flexShrink:0}}>{n.i}</span>
          {sideOpen&&<span style={{fontSize:12,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{n.l}</span>}
        </div>)}
      </div>
      <div style={{padding:'10px 8px',borderTop:'1px solid rgba(255,255,255,0.15)'}}>
        {sideOpen&&<div style={{display:'flex',gap:4,marginBottom:8}}>
          {['de','tr'].map(l=><button key={l} onClick={()=>setLang(l)} style={{flex:1,padding:'4px 0',background:lang===l?'rgba(255,255,255,0.9)':'rgba(255,255,255,0.12)',color:lang===l?P:'#fff',border:'none',borderRadius:4,fontSize:11,cursor:'pointer',fontFamily:'Arial',fontWeight:'bold'}}>{l.toUpperCase()}</button>)}
        </div>}
        <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:sideOpen?8:0}}>
          <div style={{width:30,height:30,borderRadius:'50%',background:'rgba(255,255,255,0.22)',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:'bold',fontSize:11,flexShrink:0}}>{getInit(user.name)}</div>
          {sideOpen&&<span style={{fontSize:12,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{user.name}</span>}
        </div>
        {sideOpen&&<button onClick={()=>setUser(null)} style={{width:'100%',padding:'5px 0',background:'rgba(255,255,255,0.1)',color:'#fff',border:'1px solid rgba(255,255,255,0.2)',borderRadius:5,fontSize:11,cursor:'pointer',fontFamily:'Arial'}}>{t.logout}</button>}
      </div>
    </div>
    <div style={{flex:1,overflowY:'auto',padding:20}}>
      {views[mod]||<div style={{color:GR}}>{t.no_data}</div>}
    </div>
  </div>;
};
