import { useState, useEffect, useRef } from "react";
import {
  P, GR, LT, GN, YL, RD,
  CORE, EF_PHASE, MNAMES, DNAMES, SUP_CATS,
  Badge, Btn, Card, IForm, Fi, Ft, Fs, PicUpload, Thumbs, PH, Av,
} from "./core.jsx";

// ════════════════════════════════════════════════════════════════
// DASHBOARD
// ════════════════════════════════════════════════════════════════
export function Dashboard({data,save,user,t,isMobile}){
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

// ════════════════════════════════════════════════════════════════
// SCHEDULE (reiche Version: Tooltip, Fortschritt, Tages-Kalender, Mobil)
// ════════════════════════════════════════════════════════════════
export function Schedule({data,save,user,t,isMobile}){
  const [items,setItems]=useState(()=>data.schedule||[]);
  const [editId,setEditId]=useState(null);
  const [form,setForm]=useState({});
  const [showAdd,setShowAdd]=useState(false);
  const [newF,setNewF]=useState(EF_PHASE);
  const [delId,setDelId]=useState(null);
  const [hoverId,setHoverId]=useState(null);
  const [calOffset,setCalOffset]=useState(0);
  const canEdit=user.role==='admin'||(user.permissions||[]).includes('schedule');
  const today=new Date().toISOString().split('T')[0];
  const todayD=new Date(today);
  const sc={onTrack:GN,warning:YL,critical:RD};
  const labelW=isMobile?110:190, dateW=isMobile?54:66, barH=isMobile?22:24;
  const WEEKS_VISIBLE=isMobile?6:12, cellMinW=isMobile?26:30;
  const ds=items.flatMap(i=>[i.ps,i.pe].filter(Boolean));
  const mn=new Date(ds.length?ds.reduce((a,b)=>a<b?a:b):'2025-01-01');
  const mx=new Date(ds.length?ds.reduce((a,b)=>a>b?a:b):'2027-01-01');
  const sp=Math.max(1,(mx-mn)/864e5);
  const pct=d=>d?Math.max(0,Math.min(100,(new Date(d)-mn)/864e5/sp*100)):0;
  const tp=(todayD-mn)/864e5/sp*100;
  function monthMarkers(){
    const out=[];const cur=new Date(mn.getFullYear(),mn.getMonth(),1);
    while(cur<=mx){out.push({date:new Date(cur),label:String(cur.getMonth()+1).padStart(2,'0')+'/'+String(cur.getFullYear()).slice(-2)});cur.setMonth(cur.getMonth()+1);}
    const step=isMobile?(out.length>12?4:out.length>6?2:1):(out.length>18?3:out.length>10?2:1);
    return out.map((m,i)=>({...m,showLabel:i%step===0}));
  }
  function phaseInfo(item){
    if(!item.ps||!item.pe)return null;
    const s=new Date(item.ps),e=new Date(item.pe);
    const dur=Math.round((e-s)/864e5)+1;
    const remaining=Math.round((e-todayD)/864e5);
    let prog=0;
    if(todayD<=s)prog=0;else if(todayD>=e)prog=100;else prog=Math.round((todayD-s)/(e-s)*100);
    return {dur,remaining,prog};
  }
  function doSave(){const u=items.map(i=>i.id===form.id?{...form}:i);setItems(u);save('schedule',u);setEditId(null);}
  function doAdd(){if(!newF.phase||!newF.ps||!newF.pe)return;const u=[...items,{...newF,id:Date.now()}];setItems(u);save('schedule',u);setShowAdd(false);setNewF(EF_PHASE);}
  function doDelete(id){const u=items.filter(i=>i.id!==id);setItems(u);save('schedule',u);setDelId(null);}
  function toggleHover(id){if(isMobile)setHoverId(hoverId===id?null:id);}
  const calStart=new Date(todayD);
  calStart.setDate(calStart.getDate()-calStart.getDay()+1+calOffset*7);
  const calDays=[];
  for(let i=0;i<WEEKS_VISIBLE*7;i++){const d=new Date(calStart);d.setDate(d.getDate()+i);calDays.push(d);}
  function activePhases(d){return items.filter(i=>i.ps&&i.pe&&new Date(i.ps)<=d&&new Date(i.pe)>=d);}
  const markers=monthMarkers();
  return <div>
    <PH title={t.schedule}>{canEdit&&<Btn onClick={()=>{setShowAdd(s=>!s);setNewF(EF_PHASE);}}>+ {t.add}</Btn>}</PH>
    {!canEdit&&<div style={{background:'#fff9e6',border:`1px solid ${YL}`,borderRadius:6,padding:'6px 12px',marginBottom:10,fontSize:11,color:'#7a5500'}}>🔒 Nur-Ansicht / Sadece görüntüleme – Bearbeitung erfordert Berechtigung</div>}
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
      <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:isMobile?10:6}}>
        <div style={{width:labelW,flexShrink:0}}/>
        <div style={{flex:1,position:'relative',height:18,minWidth:60}}>
          {markers.map((m,i)=>{const left=pct(m.date.toISOString().split('T')[0]);return m.showLabel?<div key={i} style={{position:'absolute',left:left+'%',top:0,fontSize:9,color:GR,whiteSpace:'nowrap',transform:'translateX(-50%)'}}>{m.label}</div>:null;})}
          {tp>=0&&tp<=100&&<div style={{position:'absolute',left:tp+'%',top:14,fontSize:9,color:RD,fontWeight:'bold',whiteSpace:'nowrap',transform:'translateX(-50%)'}}>↓ {String(todayD.getDate()).padStart(2,'0')}.{String(todayD.getMonth()+1).padStart(2,'0')}.{String(todayD.getFullYear()).slice(-2)}</div>}
        </div>
        <div style={{width:dateW,flexShrink:0}}/>
        {canEdit&&!isMobile&&<div style={{width:60,flexShrink:0}}/>}
      </div>
      {items.map(item=>{
        const info=phaseInfo(item);
        return <div key={item.id} style={{position:'relative'}}>
          <div style={{display:'flex',alignItems:'center',gap:isMobile?6:8,marginBottom:isMobile?10:7}} onMouseEnter={()=>!isMobile&&setHoverId(item.id)} onMouseLeave={()=>!isMobile&&setHoverId(null)}>
            <div style={{width:labelW,fontSize:isMobile?10:11,color:GR,flexShrink:0,display:'flex',alignItems:'center',gap:5,overflow:'hidden'}}>
              <span style={{width:7,height:7,borderRadius:'50%',background:sc[item.st]||GR,flexShrink:0,display:'inline-block'}}/>
              <span style={{overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{item.phase}</span>
            </div>
            <div onClick={()=>toggleHover(item.id)} style={{flex:1,height:barH,background:'#eef0f6',borderRadius:4,position:'relative',minWidth:50,cursor:'pointer'}}>
              {markers.map((m,i)=>{const left=pct(m.date.toISOString().split('T')[0]);return <div key={i} style={{position:'absolute',left:left+'%',top:0,height:'100%',width:1,background:'#dadeec'}}/>;})}
              <div style={{position:'absolute',left:pct(item.ps)+'%',width:Math.max(1,pct(item.pe)-pct(item.ps))+'%',height:'40%',top:'30%',background:P+'30',borderRadius:2}}/>
              {item.as&&<div style={{position:'absolute',left:pct(item.as)+'%',width:Math.max(1,pct(item.ae||today)-pct(item.as))+'%',height:'40%',top:'30%',background:sc[item.st]||P,borderRadius:2,opacity:0.85}}/>}
              {tp>=0&&tp<=100&&<div style={{position:'absolute',left:tp+'%',top:0,height:'100%',width:2,background:RD}}/>}
              {info&&<div style={{position:'absolute',left:pct(item.ps)+'%',top:'50%',transform:'translateY(-50%)',fontSize:isMobile?9:10,color:'#fff',fontWeight:'bold',marginLeft:4,textShadow:'0 0 3px rgba(0,0,0,0.6)'}}>{info.prog}%</div>}
            </div>
            <div style={{width:dateW,fontSize:isMobile?9:10,color:GR,flexShrink:0,textAlign:'right',lineHeight:1.2}}>
              {info?<><div>{isMobile?item.pe.slice(5):item.pe}</div><div style={{color:info.remaining<0?RD:info.remaining<14?YL:GN,fontWeight:'bold'}}>{info.remaining>=0?`${info.remaining}T`:`+${Math.abs(info.remaining)}T`}</div></>:<>{item.pe}</>}
            </div>
            {canEdit&&<div style={{display:'flex',flexDirection:isMobile?'column':'row',gap:isMobile?2:4}}>
              <Btn sm outline onClick={()=>{setForm({...item});setEditId(item.id);}}>✏️</Btn>
              <Btn sm danger onClick={()=>setDelId(item.id)}>✕</Btn>
            </div>}
          </div>
          {hoverId===item.id&&info&&<div style={{position:isMobile?'relative':'absolute',left:isMobile?0:200,top:isMobile?0:30,zIndex:50,background:'#222',color:'#fff',padding:'8px 12px',borderRadius:6,fontSize:11,boxShadow:'0 4px 12px rgba(0,0,0,0.3)',pointerEvents:'auto',marginBottom:isMobile?8:0,minWidth:isMobile?'auto':200}}>
            <div style={{fontWeight:'bold',marginBottom:4,fontSize:12}}>{item.phase}</div>
            <div>📅 {item.ps} → {item.pe}</div>
            <div>⏱ Dauer / Süre: <b>{info.dur} Tage</b></div>
            <div>📊 Fortschritt: <b>{info.prog}%</b></div>
            <div style={{color:info.remaining<0?'#ff8888':info.remaining<14?'#ffd080':'#88ff88'}}>{info.remaining>=0?`⏳ Noch ${info.remaining} Tage`:`⚠️ ${Math.abs(info.remaining)} Tage überzogen`}</div>
            {item.as&&<div style={{marginTop:4,paddingTop:4,borderTop:'1px solid #444'}}>Ist: {item.as} → {item.ae||'läuft'}</div>}
            {isMobile&&<div style={{marginTop:6,fontSize:10,color:'#aaa',textAlign:'right',cursor:'pointer'}} onClick={()=>setHoverId(null)}>✕ schließen</div>}
          </div>}
        </div>;
      })}
      <div style={{display:'flex',gap:isMobile?8:12,marginTop:10,flexWrap:'wrap'}}>
        {[[GN,t.onTrack],[YL,t.warning],[RD,t.critical]].map(([c,l])=>(<span key={l} style={{display:'flex',alignItems:'center',gap:4,fontSize:isMobile?10:11,color:GR}}><span style={{width:8,height:8,borderRadius:'50%',background:c,display:'inline-block'}}/>{l}</span>))}
        <span style={{display:'flex',alignItems:'center',gap:4,fontSize:isMobile?10:11,color:GR}}><span style={{width:2,height:12,background:RD,display:'inline-block'}}/>Heute / Bugün</span>
      </div>
      {isMobile&&<div style={{marginTop:8,fontSize:10,color:GR,fontStyle:'italic'}}>💡 Auf Balken tippen für Details / Detaylar için çubuğa dokunun</div>}
    </Card>
    <Card>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10,gap:6}}>
        <Btn sm outline onClick={()=>setCalOffset(o=>o-WEEKS_VISIBLE)}>◀{isMobile?'':` ${WEEKS_VISIBLE}W`}</Btn>
        <b style={{color:P,fontSize:isMobile?11:13,textAlign:'center',flex:1}}>📅 {isMobile?'Kalender / Takvim':'Tages-Kalender / Günlük Takvim'}</b>
        <div style={{display:'flex',gap:6}}>
          <Btn sm outline onClick={()=>setCalOffset(0)}>{isMobile?'•':'Heute'}</Btn>
          <Btn sm outline onClick={()=>setCalOffset(o=>o+WEEKS_VISIBLE)}>{isMobile?'':`${WEEKS_VISIBLE}W `}▶</Btn>
        </div>
      </div>
      <div style={{overflowX:'auto',paddingTop:14}}>
        <div style={{display:'grid',gridTemplateColumns:`repeat(${WEEKS_VISIBLE*7},minmax(${cellMinW}px,1fr))`,gap:1,minWidth:WEEKS_VISIBLE*7*cellMinW}}>
          {calDays.map((d,i)=>{
            const ds=d.toISOString().split('T')[0];
            const isToday=ds===today;
            const isWeekend=d.getDay()===0||d.getDay()===6;
            const phases=activePhases(d);
            const monthChange=i===0||calDays[i-1].getMonth()!==d.getMonth();
            return <div key={i} style={{borderLeft:monthChange?`2px solid ${P}`:'1px solid #eee',background:isToday?RD+'25':isWeekend?'#f5f5f5':'#fff',padding:'4px 2px',minHeight:isMobile?52:60,fontSize:9,textAlign:'center',position:'relative'}}>
              {monthChange&&<div style={{position:'absolute',top:-14,left:0,fontSize:9,color:P,fontWeight:'bold',whiteSpace:'nowrap'}}>{String(d.getMonth()+1).padStart(2,'0')}/{String(d.getFullYear()).slice(-2)}</div>}
              <div style={{color:isToday?RD:GR,fontWeight:isToday?'bold':'normal'}}>{d.getDate()}</div>
              <div style={{color:GR,fontSize:8}}>{['So','Mo','Di','Mi','Do','Fr','Sa'][d.getDay()]}</div>
              <div style={{display:'flex',flexDirection:'column',gap:1,marginTop:2}}>
                {phases.slice(0,isMobile?2:3).map(p=><div key={p.id} title={p.phase} style={{height:isMobile?3:4,background:sc[p.st]||GR,borderRadius:1}}/>)}
                {phases.length>(isMobile?2:3)&&<div style={{fontSize:7,color:GR}}>+{phases.length-(isMobile?2:3)}</div>}
              </div>
            </div>;
          })}
        </div>
      </div>
    </Card>
  </div>;
}

// ════════════════════════════════════════════════════════════════
// CONTRACTS (mit contracts_view + contracts Permissions)
// ════════════════════════════════════════════════════════════════
export function Contracts({data,save,user,t}){
  const canSee=user.role==='admin'||(user.permissions||[]).includes('contracts_view')||(user.permissions||[]).includes('contracts');
  const canEdit=user.role==='admin'||(user.permissions||[]).includes('contracts');
  const [items,setItems]=useState(()=>data.contracts||[]);
  const [show,setShow]=useState(false);
  const [delId,setDelId]=useState(null);
  const [viewFile,setViewFile]=useState(null);
  const ef={title:'',contractor:'',amount:'',date:'',status:'active',notes:'',file:null,fileName:''};
  const [f,setF]=useState(ef);
  const isAdmin=user.role==='admin';
  const fileRef=useRef(null);
  if(!canSee)return <Card><div style={{color:RD,textAlign:'center',padding:24}}>🔒 Verträge – nur autorisierte Nutzer / Yalnızca yetkili kullanıcılar</div></Card>;
  function handleFile(e){const file=e.target.files&&e.target.files[0];if(!file)return;const r=new FileReader();r.onload=ev=>setF(prev=>({...prev,file:ev.target.result,fileName:file.name}));r.readAsDataURL(file);e.target.value='';}
  function add(){if(!f.title||!f.contractor)return;const u=[...items,{...f,id:Date.now(),amount:Number(f.amount)}];setItems(u);save('contracts',u);setShow(false);setF(ef);}
  function del(id){const u=items.filter(i=>i.id!==id);setItems(u);save('contracts',u);setDelId(null);}
  const tot=items.reduce((s,c)=>s+(c.amount||0),0);
  return <div>
    <PH title={t.contracts}>{canEdit&&<Btn onClick={()=>{setShow(s=>!s);setF(ef);}}>+ {t.add}</Btn>}</PH>
    <div style={{background:'#fff',borderRadius:10,padding:'12px 18px',marginBottom:12,boxShadow:'0 1px 8px rgba(40,56,152,0.07)',display:'flex',gap:28}}>
      <div><div style={{fontSize:11,color:GR}}>{t.contracts}</div><div style={{fontSize:22,fontWeight:'bold',color:P}}>{items.length}</div></div>
      <div><div style={{fontSize:11,color:GR}}>{t.committed}</div><div style={{fontSize:22,fontWeight:'bold',color:P}}>{(tot/1e6).toFixed(2)}M €</div></div>
    </div>
    {show&&canEdit&&<IForm title={`${t.add} ${t.contracts}`} onClose={()=>setShow(false)}>
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
        <div style={{display:'flex',alignItems:'center',gap:8}}><Btn sm outline onClick={()=>fileRef.current&&fileRef.current.click()}>📎 Datei wählen</Btn>{f.fileName&&<span style={{fontSize:12,color:GN}}>✓ {f.fileName}</span>}</div>
      </div>
      <div style={{display:'flex',gap:8}}><Btn outline onClick={()=>setShow(false)}>{t.cancel}</Btn><Btn disabled={!f.title||!f.contractor} onClick={add}>{t.save}</Btn></div>
    </IForm>}
    {delId&&canEdit&&<IForm title="Vertrag löschen?" onClose={()=>setDelId(null)}>
      <div style={{fontSize:13,marginBottom:14}}><b style={{color:RD}}>{items.find(i=>i.id===delId)?.title}</b> wirklich löschen?</div>
      <div style={{display:'flex',gap:8}}><Btn outline onClick={()=>setDelId(null)}>{t.cancel}</Btn><Btn danger onClick={()=>del(delId)}>Löschen</Btn></div>
    </IForm>}
    {viewFile&&<IForm title="📎 Vertragsdokument" onClose={()=>setViewFile(null)}>
      {viewFile.startsWith('data:image')?<img src={viewFile} alt="Vertrag" style={{width:'100%',borderRadius:8}}/>:<div style={{textAlign:'center',padding:20}}><div style={{fontSize:40,marginBottom:12}}>📄</div><a href={viewFile} download="vertrag.pdf"><Btn>⬇️ PDF herunterladen</Btn></a></div>}
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
      </Card>)}
  </div>;
}

// ════════════════════════════════════════════════════════════════
// CHANGE ORDERS (Nachträge)
// ════════════════════════════════════════════════════════════════
export function ChangeOrders({data,save,user,t}){
  const [items,setItems]=useState(()=>data.changeOrders||[]);
  const [show,setShow]=useState(false);
  const [revId,setRevId]=useState(null);
  const [cmt,setCmt]=useState('');
  const ef={title:'',desc:'',amount:'',contractor:'',photos:[]};
  const [f,setF]=useState(ef);
  const isAdmin=user.role==='admin';
  function submit(){const u=[...items,{...f,id:Date.now(),amount:Number(f.amount),status:'submitted',by:user.name,date:new Date().toISOString().split('T')[0]}];setItems(u);save('changeOrders',u);setShow(false);setF(ef);}
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

// ════════════════════════════════════════════════════════════════
// APPROVALS
// ════════════════════════════════════════════════════════════════
export function Approvals({data,save,user,t}){
  const [items,setItems]=useState(()=>data.approvals||[]);
  const [activeId,setActiveId]=useState(null);
  const [form,setForm]=useState({comment:'',photos:[]});
  const [showAdd,setShowAdd]=useState(false);
  const [nf,setNf]=useState({title:'',assigned:'peter',notes:''});
  const isAdmin=user.role==='admin';
  function canApr(item){return item.assigned===user.id||isAdmin;}
  function doApr(id,action){const u=items.map(i=>i.id===id?{...i,status:action,comment:form.comment,photos:form.photos,by:user.name,approvedDate:new Date().toISOString().split('T')[0]}:i);setItems(u);save('approvals',u);setActiveId(null);setForm({comment:'',photos:[]});}
  function addNew(){const u=[...items,{...nf,id:Date.now(),status:'open',photos:[]}];setItems(u);save('approvals',u);setShowAdd(false);setNf({title:'',assigned:'peter',notes:''});}
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
      <div style={{display:'flex',gap:8,marginTop:8}}><Btn danger onClick={()=>doApr(activeId,'rejected')}>{t.reject}</Btn><Btn onClick={()=>doApr(activeId,'approved')}>{t.approve}</Btn></div>
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

// ════════════════════════════════════════════════════════════════
// ISSUES (mit Kontaktzuweisung + WhatsApp/E-Mail)
// ════════════════════════════════════════════════════════════════
export function Issues({data,save,user,t}){
  const [items,setItems]=useState(()=>data.issues||[]);
  const [show,setShow]=useState(false);
  const [editId,setEditId]=useState(null);
  const allU=[...CORE,...(data.extraUsers||[])];
  const contacts=data.contacts||[];
  const ef={title:'',desc:'',priority:'medium',assigned:'',assignedContacts:[],photos:[]};
  const [f,setF]=useState(ef);
  const pc={high:RD,medium:YL,low:GN};
  const pLabel={high:t.high,medium:t.medium,low:t.low};
  const pLabelTr={high:'Yüksek',medium:'Orta',low:'Düşük'};
  function add(){
    if(editId){const u=items.map(i=>i.id===editId?{...i,...f}:i);setItems(u);save('issues',u);}
    else{const u=[...items,{...f,id:Date.now(),status:'open',by:user.name,date:new Date().toISOString().split('T')[0]}];setItems(u);save('issues',u);}
    setShow(false);setEditId(null);setF(ef);
  }
  function openEdit(item){setF({title:item.title||'',desc:item.desc||'',priority:item.priority||'medium',assigned:item.assigned||'',assignedContacts:item.assignedContacts||[],photos:item.photos||[]});setEditId(item.id);setShow(true);}
  function setStatus(id,status){const u=items.map(i=>i.id===id?{...i,status,resolvedBy:status==='resolved'?user.name:undefined,resolvedDate:status==='resolved'?new Date().toISOString().split('T')[0]:undefined}:i);setItems(u);save('issues',u);}
  function toggleContact(cid){const list=f.assignedContacts||[];const next=list.includes(cid)?list.filter(x=>x!==cid):[...list,cid];setF({...f,assignedContacts:next});}
  function buildMsg(item,lang){
    const pri=lang==='tr'?pLabelTr[item.priority]:pLabel[item.priority];
    if(lang==='tr')return `Merhaba,\n\nZINKPOWER Manisa şantiyesinde aşağıdaki kusur size atanmıştır:\n\n📋 Başlık: ${item.title}\n⚠️ Öncelik: ${pri}\n📅 Tarih: ${item.date}\n👤 Bildiren: ${item.by}\n\n${item.desc?`Açıklama:\n${item.desc}\n\n`:''}Lütfen en kısa sürede inceleyin.\n\nİyi çalışmalar`;
    return `Hallo,\n\nauf der Baustelle ZINKPOWER Manisa wurde Ihnen folgender Mangel zugewiesen:\n\n📋 Titel: ${item.title}\n⚠️ Priorität: ${pri}\n📅 Datum: ${item.date}\n👤 Gemeldet von: ${item.by}\n\n${item.desc?`Beschreibung:\n${item.desc}\n\n`:''}Bitte zeitnah prüfen.\n\nMit freundlichen Grüßen`;
  }
  function mailLink(c,item){const subj=encodeURIComponent(`[ZINKPOWER Manisa] Mangel: ${item.title}`);const body=encodeURIComponent(buildMsg(item,'de')+'\n\n— — —\n\n'+buildMsg(item,'tr'));return `mailto:${c.email}?subject=${subj}&body=${body}`;}
  function waLink(c,item){const phone=(c.mobile||c.phone||'').replace(/[^\d+]/g,'').replace(/^\+/,'');const text=encodeURIComponent(buildMsg(item,'de')+'\n\n— — —\n\n'+buildMsg(item,'tr'));return `https://wa.me/${phone}?text=${text}`;}
  const open=items.filter(i=>i.status==='open');
  const resolved=items.filter(i=>i.status==='resolved');
  function renderAssignedContacts(item){
    const list=(item.assignedContacts||[]).map(cid=>contacts.find(c=>c.id===cid)).filter(Boolean);
    if(!list.length)return null;
    return <div style={{marginTop:10,padding:10,background:'#f8f9fc',borderRadius:8,border:`1px solid ${LT}`}}>
      <div style={{fontSize:11,color:GR,marginBottom:6,fontWeight:'bold'}}>👥 Zuständig / Sorumlu:</div>
      {list.map(c=>(
        <div key={c.id} style={{display:'flex',alignItems:'center',gap:8,marginBottom:6,flexWrap:'wrap'}}>
          <Av name={c.name} size={28}/>
          <div style={{flex:1,minWidth:120}}>
            <div style={{fontSize:12,fontWeight:'bold',color:P}}>{c.name}</div>
            {c.company&&<div style={{fontSize:10,color:GR}}>{c.company}</div>}
          </div>
          <div style={{display:'flex',gap:4,flexWrap:'wrap'}}>
            {c.email&&<a href={mailLink(c,item)} style={{textDecoration:'none'}}><Btn sm outline>📧 E-Mail</Btn></a>}
            {(c.mobile||c.phone)&&<a href={waLink(c,item)} target="_blank" rel="noreferrer" style={{textDecoration:'none'}}><Btn sm col={GN}>📱 WhatsApp</Btn></a>}
          </div>
        </div>
      ))}
    </div>;
  }
  return <div>
    <PH title={t.issues}><Btn onClick={()=>{setF(ef);setEditId(null);setShow(s=>!s);}}>+ {t.add}</Btn></PH>
    {show&&<IForm title={editId?`${t.edit} ${t.issues}`:`${t.add} ${t.issues}`} onClose={()=>{setShow(false);setEditId(null);}}>
      <Fi label={t.title} value={f.title} onChange={v=>setF({...f,title:v})} ph="Kurze Beschreibung des Mangels"/>
      <Ft label={t.desc} value={f.desc} onChange={v=>setF({...f,desc:v})} rows={3}/>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
        <Fs label={t.priority} value={f.priority} onChange={v=>setF({...f,priority:v})} opts={['high','medium','low'].map(p=>({v:p,l:t[p]}))}/>
        <Fs label={t.assigned} value={f.assigned} onChange={v=>setF({...f,assigned:v})} opts={[{v:'',l:'–'},...allU.map(u=>({v:u.name,l:u.name}))]}/>
      </div>
      <div style={{marginBottom:10}}>
        <label style={{display:'block',fontSize:11,color:GR,marginBottom:4}}>👥 Kontakte zuweisen / Kişi ata (mehrere möglich)</label>
        {contacts.length===0?<div style={{fontSize:12,color:GR,fontStyle:'italic',padding:8,background:'#f8f9fc',borderRadius:6}}>Keine Kontakte vorhanden. Erst im Modul „Kontakte" anlegen.</div>:
          <div style={{maxHeight:160,overflowY:'auto',border:'1px solid #ddd',borderRadius:6,padding:6}}>
            {contacts.map(c=>{
              const active=(f.assignedContacts||[]).includes(c.id);
              return <div key={c.id} onClick={()=>toggleContact(c.id)} style={{display:'flex',alignItems:'center',gap:8,padding:'6px 8px',cursor:'pointer',background:active?LT:'transparent',borderRadius:4,marginBottom:2}}>
                <div style={{width:18,height:18,borderRadius:4,background:active?P:'#fff',border:`2px solid ${active?P:'#ccc'}`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>{active&&<span style={{color:'#fff',fontSize:11,lineHeight:1}}>✓</span>}</div>
                <div style={{flex:1,fontSize:12}}>
                  <div style={{fontWeight:active?'bold':'normal',color:active?P:'#333'}}>{c.name}</div>
                  <div style={{fontSize:10,color:GR}}>{c.company&&`${c.company} · `}{c.email&&`✉ ${c.email}`}{(c.mobile||c.phone)&&` · 📱 ${c.mobile||c.phone}`}</div>
                </div>
              </div>;
            })}
          </div>}
      </div>
      <PicUpload onPhoto={p=>setF({...f,photos:[...f.photos,p]})} t={t}/>
      <Thumbs photos={f.photos}/>
      <div style={{display:'flex',gap:8,marginTop:8}}><Btn outline onClick={()=>{setShow(false);setEditId(null);}}>{t.cancel}</Btn><Btn disabled={!f.title} onClick={add}>{t.save}</Btn></div>
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
            {renderAssignedContacts(item)}
          </div>
          <div style={{marginLeft:12,flexShrink:0,display:'flex',flexDirection:'column',gap:6}}>
            <Btn sm outline onClick={()=>openEdit(item)}>✏️ {t.edit}</Btn>
            <Btn sm col={GN} onClick={()=>setStatus(item.id,'resolved')}>✓ Beseitigt</Btn>
          </div>
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

// ════════════════════════════════════════════════════════════════
// DIARY (mit Wetter + Kalender)
// ════════════════════════════════════════════════════════════════
export function Diary({data,save,user,t}){
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
  function add(){const u=[...items,{...f,id:Date.now(),createdDate:today,author:user.name}].sort((a,b)=>b.date.localeCompare(a.date));setItems(u);save('diary',u);setShow(false);}
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

// ════════════════════════════════════════════════════════════════
// DOCUMENTS
// ════════════════════════════════════════════════════════════════
export function Documents({data,save,user,t}){
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
        <thead><tr style={{background:LT}}>{[t.title,t.category,t.version,t.date,t.uploaded,t.notes,''].map(h=><th key={h} style={{padding:'7px 10px',textAlign:'left',color:GR,fontSize:11}}>{h}</th>)}</tr></thead>
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

// ════════════════════════════════════════════════════════════════
// CONTACTS
// ════════════════════════════════════════════════════════════════
export function Contacts({data,save,user,t}){
  const [items,setItems]=useState(()=>data.contacts||[]);
  const [show,setShow]=useState(false);
  const [delId,setDelId]=useState(null);
  const isAdmin=user.role==='admin';
  const ef={name:'',position:'',company:'',phone:'',mobile:'',email:'',address:'',notes:''};
  const [f,setF]=useState(ef);
  function add(){if(!f.name.trim())return;const u=[...items,{...f,id:Date.now(),by:user.name}];setItems(u);save('contacts',u);setShow(false);setF(ef);}
  function del(id){const u=items.filter(i=>i.id!==id);save('contacts',u);setItems(u);setDelId(null);}
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

// ════════════════════════════════════════════════════════════════
// GALLERY
// ════════════════════════════════════════════════════════════════
export function Gallery({data,save,user,t}){
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
      r.onload=ev=>{const entry={id:Date.now()+Math.random(),src:ev.target.result,date:uploadDate,author:user.name,filename:file.name};setItems(prev=>{const next=[...prev,entry];save('gallery',next);return next;});};
      r.readAsDataURL(file);
    });
    e.target.value='';
  }
  const daysInMonth=new Date(calYear,calMonth+1,0).getDate();
  const firstWeekday=(new Date(calYear,calMonth,1).getDay()+6)%7;
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

// ════════════════════════════════════════════════════════════════
// SUPPLIERS (Profile + Lieferungen)
// ════════════════════════════════════════════════════════════════
export function Suppliers({data,save,user,t}){
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
  function addProfile(){if(!fp.name.trim())return;const u=[...profiles,{...fp,id:Date.now(),by:user.name,addedDate:today}];setProfiles(u);save('supplierProfiles',u);setShowForm(false);setFp(efP);}
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
        })}
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
          <thead><tr style={{background:LT}}>{[t.material,t.supplier,`${t.quantity}/${t.unit}`,t.ordered,t.expected,t.delivered,t.status,''].map(h=><th key={h} style={{padding:'7px 10px',textAlign:'left',color:GR,fontSize:11}}>{h}</th>)}</tr></thead>
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

// ════════════════════════════════════════════════════════════════
// TASKS (Aufgaben / Görevler)
// ════════════════════════════════════════════════════════════════
export function Tasks({data,save,user,t}){
  const [items,setItems]=useState(()=>data.tasks||[]);
  const [show,setShow]=useState(false);
  const [editId,setEditId]=useState(null);
  const [showDone,setShowDone]=useState(false);
  const [delId,setDelId]=useState(null);
  const allU=[...CORE,...(data.extraUsers||[])];
  const contacts=data.contacts||[];
  const isAdmin=user.role==='admin';
  const today=new Date().toISOString().split('T')[0];
  const ef={topic:'',desc:'',due:'',assignedUsers:[],assignedContacts:[]};
  const [f,setF]=useState(ef);
  function visibleFor(item){if(isAdmin)return true;if(item.createdById===user.id)return true;if((item.assignedUsers||[]).includes(user.id))return true;return false;}
  function add(){
    if(!f.topic.trim())return;
    if(editId){const u=items.map(i=>i.id===editId?{...i,...f}:i);setItems(u);save('tasks',u);}
    else{const newItem={...f,id:Date.now(),status:'open',createdBy:user.name,createdById:user.id,createdAt:today};const u=[...items,newItem];setItems(u);save('tasks',u);}
    setShow(false);setEditId(null);setF(ef);
  }
  function openEdit(item){setF({topic:item.topic||'',desc:item.desc||'',due:item.due||'',assignedUsers:item.assignedUsers||[],assignedContacts:item.assignedContacts||[]});setEditId(item.id);setShow(true);}
  function setDone(id,done){const u=items.map(i=>i.id===id?{...i,status:done?'done':'open',doneBy:done?user.name:undefined,doneAt:done?today:undefined}:i);setItems(u);save('tasks',u);}
  function del(id){const u=items.filter(i=>i.id!==id);save('tasks',u);setItems(u);setDelId(null);}
  function toggleUser(uid){const list=f.assignedUsers||[];const next=list.includes(uid)?list.filter(x=>x!==uid):[...list,uid];setF({...f,assignedUsers:next});}
  function toggleContact(cid){const list=f.assignedContacts||[];const next=list.includes(cid)?list.filter(x=>x!==cid):[...list,cid];setF({...f,assignedContacts:next});}
  function buildMsg(item,lang){
    const dueText=item.due?(lang==='tr'?`Son tarih: ${item.due}`:`Frist: ${item.due}`):(lang==='tr'?'Son tarih belirtilmedi':'Keine Frist gesetzt');
    if(lang==='tr')return `Merhaba,\n\nZINKPOWER Manisa toplantısında size aşağıdaki görev atanmıştır:\n\n📋 Konu: ${item.topic}\n📅 ${dueText}\n👤 Bildiren: ${item.createdBy}\n\n${item.desc?`Açıklama:\n${item.desc}\n\n`:''}İyi çalışmalar`;
    return `Hallo,\n\nim ZINKPOWER Manisa Meeting wurde Ihnen folgende Aufgabe zugewiesen:\n\n📋 Thema: ${item.topic}\n📅 ${dueText}\n👤 Erstellt von: ${item.createdBy}\n\n${item.desc?`Beschreibung:\n${item.desc}\n\n`:''}Mit freundlichen Grüßen`;
  }
  function mailLink(c,item){const subj=encodeURIComponent(`[ZINKPOWER Manisa] Aufgabe: ${item.topic}`);const body=encodeURIComponent(buildMsg(item,'de')+'\n\n— — —\n\n'+buildMsg(item,'tr'));return `mailto:${c.email}?subject=${subj}&body=${body}`;}
  function waLink(c,item){const phone=(c.mobile||c.phone||'').replace(/[^\d+]/g,'').replace(/^\+/,'');const text=encodeURIComponent(buildMsg(item,'de')+'\n\n— — —\n\n'+buildMsg(item,'tr'));return `https://wa.me/${phone}?text=${text}`;}
  function dueColor(due){if(!due)return GR;const d=new Date(due);const diff=Math.round((d-new Date(today))/864e5);if(diff<0)return RD;if(diff<=7)return YL;return GN;}
  function dueText(due){if(!due)return '–';const d=new Date(due);const diff=Math.round((d-new Date(today))/864e5);if(diff<0)return `${due} (${Math.abs(diff)}T überfällig)`;if(diff===0)return `${due} (heute)`;return `${due} (in ${diff}T)`;}
  function renderAssignees(item){
    const userList=(item.assignedUsers||[]).map(uid=>allU.find(u=>u.id===uid)).filter(Boolean);
    const contactList=(item.assignedContacts||[]).map(cid=>contacts.find(c=>c.id===cid)).filter(Boolean);
    if(!userList.length&&!contactList.length)return null;
    return <div style={{marginTop:8,padding:10,background:'#f8f9fc',borderRadius:8,border:`1px solid ${LT}`}}>
      <div style={{fontSize:11,color:GR,marginBottom:6,fontWeight:'bold'}}>👥 Zugewiesen an:</div>
      {userList.map(u=>(<div key={'u'+u.id} style={{display:'flex',alignItems:'center',gap:8,marginBottom:4}}><Av name={u.name} size={24}/><div style={{fontSize:12,fontWeight:'bold',color:P}}>{u.name}</div><span style={{fontSize:10,color:GR}}>· Login-Nutzer</span></div>))}
      {contactList.map(c=>(
        <div key={'c'+c.id} style={{display:'flex',alignItems:'center',gap:8,marginTop:6,flexWrap:'wrap'}}>
          <Av name={c.name} size={24}/>
          <div style={{flex:1,minWidth:120}}>
            <div style={{fontSize:12,fontWeight:'bold',color:P}}>{c.name}</div>
            {c.company&&<div style={{fontSize:10,color:GR}}>{c.company}</div>}
          </div>
          <div style={{display:'flex',gap:4,flexWrap:'wrap'}}>
            {c.email&&<a href={mailLink(c,item)} style={{textDecoration:'none'}}><Btn sm outline>📧</Btn></a>}
            {(c.mobile||c.phone)&&<a href={waLink(c,item)} target="_blank" rel="noreferrer" style={{textDecoration:'none'}}><Btn sm col={GN}>📱</Btn></a>}
          </div>
        </div>
      ))}
    </div>;
  }
  const visible=items.filter(visibleFor);
  const open=visible.filter(i=>i.status!=='done').sort((a,b)=>{if(!a.due&&!b.due)return 0;if(!a.due)return 1;if(!b.due)return -1;return a.due.localeCompare(b.due);});
  const done=visible.filter(i=>i.status==='done').sort((a,b)=>(b.doneAt||'').localeCompare(a.doneAt||''));
  return <div>
    <PH title="📋 Aufgaben / Görevler"><Btn onClick={()=>{setF(ef);setEditId(null);setShow(s=>!s);}}>+ {t.add}</Btn></PH>
    {!isAdmin&&<div style={{background:'#eef5ff',border:`1px solid ${P}40`,borderRadius:6,padding:'6px 12px',marginBottom:10,fontSize:11,color:P}}>ℹ️ Du siehst nur Aufgaben, die du erstellt hast oder die dir zugewiesen sind</div>}
    {show&&<IForm title={editId?'Aufgabe bearbeiten':'Neue Aufgabe / Yeni Görev'} onClose={()=>{setShow(false);setEditId(null);}}>
      <Fi label="Thema / Konu *" value={f.topic} onChange={v=>setF({...f,topic:v})} ph="Kurzes Besprechungs-Thema"/>
      <Ft label="Beschreibung / Açıklama" value={f.desc} onChange={v=>setF({...f,desc:v})} rows={2}/>
      <Fi label="Frist / Son tarih" value={f.due} onChange={v=>setF({...f,due:v})} type="date"/>
      <div style={{marginBottom:10}}>
        <label style={{display:'block',fontSize:11,color:GR,marginBottom:4}}>👤 Login-Nutzer zuweisen</label>
        <div style={{maxHeight:120,overflowY:'auto',border:'1px solid #ddd',borderRadius:6,padding:6}}>
          {allU.map(u=>{
            const active=(f.assignedUsers||[]).includes(u.id);
            return <div key={u.id} onClick={()=>toggleUser(u.id)} style={{display:'flex',alignItems:'center',gap:8,padding:'5px 8px',cursor:'pointer',background:active?LT:'transparent',borderRadius:4,marginBottom:2}}>
              <div style={{width:16,height:16,borderRadius:3,background:active?P:'#fff',border:`2px solid ${active?P:'#ccc'}`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>{active&&<span style={{color:'#fff',fontSize:10,lineHeight:1}}>✓</span>}</div>
              <span style={{fontSize:12,color:active?P:'#333',fontWeight:active?'bold':'normal'}}>{u.name}</span>
            </div>;
          })}
        </div>
      </div>
      <div style={{marginBottom:10}}>
        <label style={{display:'block',fontSize:11,color:GR,marginBottom:4}}>👥 Externe Kontakte zuweisen</label>
        {contacts.length===0?<div style={{fontSize:12,color:GR,fontStyle:'italic',padding:8,background:'#f8f9fc',borderRadius:6}}>Keine Kontakte vorhanden.</div>:
          <div style={{maxHeight:120,overflowY:'auto',border:'1px solid #ddd',borderRadius:6,padding:6}}>
            {contacts.map(c=>{
              const active=(f.assignedContacts||[]).includes(c.id);
              return <div key={c.id} onClick={()=>toggleContact(c.id)} style={{display:'flex',alignItems:'center',gap:8,padding:'5px 8px',cursor:'pointer',background:active?LT:'transparent',borderRadius:4,marginBottom:2}}>
                <div style={{width:16,height:16,borderRadius:3,background:active?P:'#fff',border:`2px solid ${active?P:'#ccc'}`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>{active&&<span style={{color:'#fff',fontSize:10,lineHeight:1}}>✓</span>}</div>
                <div style={{flex:1,fontSize:12}}>
                  <div style={{fontWeight:active?'bold':'normal',color:active?P:'#333'}}>{c.name}</div>
                  {c.company&&<div style={{fontSize:10,color:GR}}>{c.company}</div>}
                </div>
              </div>;
            })}
          </div>}
      </div>
      <div style={{display:'flex',gap:8,marginTop:8}}><Btn outline onClick={()=>{setShow(false);setEditId(null);}}>{t.cancel}</Btn><Btn disabled={!f.topic.trim()} onClick={add}>{t.save}</Btn></div>
    </IForm>}
    {delId&&<IForm title="Aufgabe löschen?" onClose={()=>setDelId(null)}>
      <div style={{fontSize:13,marginBottom:14}}><b style={{color:RD}}>{items.find(i=>i.id===delId)?.topic}</b> wirklich löschen?</div>
      <div style={{display:'flex',gap:8}}><Btn outline onClick={()=>setDelId(null)}>{t.cancel}</Btn><Btn danger onClick={()=>del(delId)}>Löschen</Btn></div>
    </IForm>}
    <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:8,padding:'6px 10px',background:P+'12',borderRadius:8}}>
      <span style={{fontSize:14}}>📌</span><b style={{fontSize:13,color:P}}>Offene Themen ({open.length})</b>
    </div>
    {open.length===0?<Card><div style={{color:GR,textAlign:'center',padding:20,fontSize:13}}>Keine offenen Aufgaben 🎉</div></Card>:
      open.map(item=>{
        const canEditThis=isAdmin||item.createdById===user.id;
        return <Card key={item.id}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:8}}>
            <div style={{flex:1}}>
              <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:4,flexWrap:'wrap'}}>
                <b style={{color:P,fontSize:14}}>{item.topic}</b>
                {item.due&&<span style={{padding:'2px 8px',background:dueColor(item.due)+'25',color:dueColor(item.due),borderRadius:6,fontSize:11,fontWeight:'bold'}}>📅 {dueText(item.due)}</span>}
              </div>
              {item.desc&&<div style={{fontSize:12,color:GR,marginBottom:3}}>{item.desc}</div>}
              <div style={{fontSize:11,color:GR}}>👤 erstellt von <b>{item.createdBy}</b> · 📅 {item.createdAt}</div>
              {renderAssignees(item)}
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:4,flexShrink:0}}>
              <Btn sm col={GN} onClick={()=>setDone(item.id,true)}>✓ Erledigt</Btn>
              {canEditThis&&<Btn sm outline onClick={()=>openEdit(item)}>✏️</Btn>}
              {canEditThis&&<Btn sm danger onClick={()=>setDelId(item.id)}>✕</Btn>}
            </div>
          </div>
        </Card>;
      })}
    {done.length>0&&<div style={{marginTop:16}}>
      <div onClick={()=>setShowDone(s=>!s)} style={{display:'flex',alignItems:'center',gap:8,padding:'8px 12px',background:GN+'12',borderRadius:8,cursor:'pointer'}}>
        <span style={{fontSize:14}}>{showDone?'▼':'▶'}</span><b style={{fontSize:13,color:GN}}>✓ Erledigte Themen ({done.length})</b>
      </div>
      {showDone&&<div style={{marginTop:8}}>
        {done.map(item=>{
          const canEditThis=isAdmin||item.createdById===user.id;
          return <Card key={item.id}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:8}}>
              <div style={{flex:1,opacity:0.75}}>
                <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:4}}>
                  <span style={{padding:'2px 8px',background:GN+'25',color:GN,borderRadius:6,fontSize:11,fontWeight:'bold'}}>✓ Erledigt</span>
                  <b style={{color:GR,fontSize:13,textDecoration:'line-through'}}>{item.topic}</b>
                </div>
                {item.desc&&<div style={{fontSize:12,color:GR,marginBottom:3}}>{item.desc}</div>}
                <div style={{fontSize:11,color:GR}}>👤 {item.createdBy} → ✓ <b>{item.doneBy}</b> am {item.doneAt}{item.due&&<span> · ursprl. Frist: {item.due}</span>}</div>
              </div>
              <div style={{display:'flex',flexDirection:'column',gap:4,flexShrink:0}}>
                <Btn sm outline onClick={()=>setDone(item.id,false)}>↩ Öffnen</Btn>
                {canEditThis&&<Btn sm danger onClick={()=>setDelId(item.id)}>✕</Btn>}
              </div>
            </div>
          </Card>;
        })}
      </div>}
    </div>}
  </div>;
}

// ════════════════════════════════════════════════════════════════
// REMINDER POPUP (Login-Hatırlatma)
// ════════════════════════════════════════════════════════════════
export function ReminderPopup({user,data,onClose}){
  const items=data.tasks||[];
  const contacts=data.contacts||[];
  const today=new Date().toISOString().split('T')[0];
  const tomorrow=new Date();tomorrow.setDate(tomorrow.getDate()+1);
  const tomorrowStr=tomorrow.toISOString().split('T')[0];
  const isAdmin=user.role==='admin';
  function visibleFor(item){if(isAdmin)return true;if(item.createdById===user.id)return true;if((item.assignedUsers||[]).includes(user.id))return true;return false;}
  const due=items.filter(i=>{if(i.status==='done')return false;if(!i.due)return false;if(!visibleFor(i))return false;return i.due<=tomorrowStr;}).sort((a,b)=>a.due.localeCompare(b.due));
  if(due.length===0)return null;
  function buildMsg(item){
    const dueLabel=item.due===today?'HEUTE':item.due===tomorrowStr?'MORGEN':`ÜBERFÄLLIG seit ${item.due}`;
    const de=`Hallo,\n\nErinnerung: folgende Aufgabe ist fällig (${dueLabel}):\n\n📋 ${item.topic}\n📅 Frist: ${item.due}\n${item.desc?`\n${item.desc}\n`:''}\nBitte erledigen.\n\nGruß`;
    const tr=`Merhaba,\n\nHatırlatma: aşağıdaki görev son tarihinde:\n\n📋 ${item.topic}\n📅 Son tarih: ${item.due}\n${item.desc?`\n${item.desc}\n`:''}\nLütfen tamamlayın.\n\nİyi çalışmalar`;
    return de+'\n\n— — —\n\n'+tr;
  }
  function waLink(c,item){const phone=(c.mobile||c.phone||'').replace(/[^\d+]/g,'').replace(/^\+/,'');return `https://wa.me/${phone}?text=${encodeURIComponent(buildMsg(item))}`;}
  function mailLink(c,item){const subj=encodeURIComponent(`[ZINKPOWER] Erinnerung: ${item.topic}`);return `mailto:${c.email}?subject=${subj}&body=${encodeURIComponent(buildMsg(item))}`;}
  function dueBadge(d){if(d<today)return {bg:RD,fg:'#fff',label:`⚠️ ÜBERFÄLLIG (${d})`};if(d===today)return {bg:RD,fg:'#fff',label:`🔴 HEUTE FÄLLIG (${d})`};return {bg:YL,fg:'#fff',label:`🟡 MORGEN FÄLLIG (${d})`};}
  return <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.6)',zIndex:9999,display:'flex',alignItems:'center',justifyContent:'center',padding:16}}>
    <div style={{background:'#fff',borderRadius:12,padding:0,width:560,maxWidth:'100%',maxHeight:'85vh',overflowY:'auto',boxShadow:'0 8px 32px rgba(0,0,0,0.3)'}}>
      <div style={{background:P,color:'#fff',padding:'14px 18px',borderRadius:'12px 12px 0 0',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <div>
          <b style={{fontSize:15}}>🔔 Aufgaben-Erinnerung</b>
          <div style={{fontSize:11,opacity:0.85,marginTop:2}}>{due.length} {due.length===1?'Aufgabe':'Aufgaben'} bald fällig oder überfällig</div>
        </div>
        <button onClick={onClose} style={{background:'rgba(255,255,255,0.15)',border:'none',color:'#fff',borderRadius:6,padding:'4px 10px',fontSize:18,cursor:'pointer'}}>✕</button>
      </div>
      <div style={{padding:16}}>
        {due.map(item=>{
          const b=dueBadge(item.due);
          const contactList=(item.assignedContacts||[]).map(cid=>contacts.find(c=>c.id===cid)).filter(Boolean);
          return <div key={item.id} style={{border:`1px solid ${LT}`,borderRadius:8,padding:12,marginBottom:10}}>
            <div style={{marginBottom:6}}>
              <span style={{display:'inline-block',padding:'3px 10px',background:b.bg,color:b.fg,borderRadius:6,fontSize:11,fontWeight:'bold',marginBottom:6}}>{b.label}</span>
              <div style={{fontWeight:'bold',color:P,fontSize:14}}>{item.topic}</div>
              {item.desc&&<div style={{fontSize:12,color:GR,marginTop:3}}>{item.desc}</div>}
              <div style={{fontSize:11,color:GR,marginTop:4}}>👤 erstellt von {item.createdBy}</div>
            </div>
            {contactList.length>0&&<div style={{marginTop:8,padding:8,background:'#f8f9fc',borderRadius:6}}>
              <div style={{fontSize:11,color:GR,marginBottom:6,fontWeight:'bold'}}>📤 Erinnerung senden an:</div>
              {contactList.map(c=>(
                <div key={c.id} style={{display:'flex',alignItems:'center',gap:8,marginBottom:6,flexWrap:'wrap'}}>
                  <Av name={c.name} size={26}/>
                  <div style={{flex:1,minWidth:100}}>
                    <div style={{fontSize:12,fontWeight:'bold',color:P}}>{c.name}</div>
                    {c.company&&<div style={{fontSize:10,color:GR}}>{c.company}</div>}
                  </div>
                  <div style={{display:'flex',gap:4,flexWrap:'wrap'}}>
                    {(c.mobile||c.phone)&&<a href={waLink(c,item)} target="_blank" rel="noreferrer" style={{textDecoration:'none'}}><Btn sm col={GN}>📱 WhatsApp</Btn></a>}
                    {c.email&&<a href={mailLink(c,item)} style={{textDecoration:'none'}}><Btn sm outline>📧 E-Mail</Btn></a>}
                  </div>
                </div>
              ))}
            </div>}
            {contactList.length===0&&<div style={{fontSize:11,color:GR,fontStyle:'italic',marginTop:6}}>Kein externer Kontakt zugewiesen – Erinnerung kann nur intern weitergegeben werden.</div>}
          </div>;
        })}
        <div style={{marginTop:14,display:'flex',justifyContent:'flex-end'}}>
          <Btn onClick={onClose}>OK, verstanden</Btn>
        </div>
      </div>
    </div>
  </div>;
}
