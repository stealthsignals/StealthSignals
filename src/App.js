import { useState, useEffect, useCallback, useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, LineChart, Line, CartesianGrid } from "recharts";

const LOGO_SRC = "data:image/jpeg;base64,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";

const C = {
  bg:"#050709",surface:"#0B1217",card:"#0E1A22",border:"#152B32",
  teal:"#00B4D8",gold:"#F5C842",green:"#7CFF3B",red:"#FF3355",
  blue:"#0A6BFF",purple:"#8B5CF6",orange:"#FF8C42",steel:"#437E8C",
  textMain:"#E8EDF5",textMuted:"#4A6480",textDim:"#1E3040",
};

const STORAGE_KEY = "stealth_trades_v4";
async function storageSave(trades){
  try{ await window.storage.set(STORAGE_KEY, JSON.stringify(trades)); }
  catch(e){ try{ localStorage.setItem(STORAGE_KEY, JSON.stringify(trades)); }catch{} }
}
async function storageLoad(){
  for(const key of [STORAGE_KEY,"stealth_trades_v3","stealth_trades_v2"]){
    try{
      const r = await window.storage.get(key);
      if(r?.value){ const data=JSON.parse(r.value); if(Array.isArray(data)&&data.length>0){ if(key!==STORAGE_KEY)await window.storage.set(STORAGE_KEY,r.value); return data; } }
    }catch{}
    try{ const s=localStorage.getItem(key); if(s){ const data=JSON.parse(s); if(Array.isArray(data)&&data.length>0){ await storageSave(data); return data; } } }catch{}
  }
  return null;
}

function Logo({size=32,opacity=1,style={}}){
  return(
    <img src={LOGO_SRC} alt="SS"
      style={{width:size,height:size,objectFit:"contain",opacity,flexShrink:0,
        filter:opacity<1?"drop-shadow(0 0 6px rgba(10,107,255,0.5))":"drop-shadow(0 0 8px rgba(10,107,255,0.25))",
        ...style}}/>
  );
}

function GlowTitle({fontSize="clamp(18px,3.5vw,26px)"}){
  const letters="STEALTH SIGNALS".split("");
  return(
    <div style={{display:"flex",alignItems:"center",flexWrap:"nowrap"}}>
      <style>{`
        @keyframes wolfBloom{0%,100%{color:#E8EDF5;text-shadow:none;}50%{color:#fff;text-shadow:0 0 14px rgba(10,107,255,0.9),0 0 28px rgba(10,107,255,0.4);}}
        .glow-l{display:inline-block;font-family:'Space Mono',monospace;font-weight:700;letter-spacing:0.10em;color:#E8EDF5;animation:wolfBloom 4s ease-in-out infinite;}
        .glow-sp{display:inline-block;width:0.35em;}
        @media(prefers-reduced-motion:reduce){.glow-l{animation:none!important;}}
      `}</style>
      {letters.map((l,i)=>(
        l===" "?<span key={i} className="glow-sp"/>
        :<span key={i} className="glow-l" style={{fontSize,animationDelay:`${i*0.1}s`}}>{l}</span>
      ))}
    </div>
  );
}

function parseEOD(text){
  const ext={};
  const MM={jan:"January",feb:"February",mar:"March",apr:"April",may:"May",jun:"June",jul:"July",aug:"August",sep:"September",oct:"October",nov:"November",dec:"December"};
  let t=text.replace(/\b(Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\b/gi,m=>MM[m.toLowerCase().slice(0,3)]||m);
  const dayM=t.match(/DAY\s+(\d+)/i);if(dayM)ext.day=parseInt(dayM[1]);
  const dateM=t.match(/—\s+([A-Za-z]+ \d+,?\s*\d{4})/);
  if(dateM){try{const d=new Date(dateM[1]);if(!isNaN(d))ext.date=d.toISOString().split("T")[0];}catch{}}
  if(!ext.date){const d2=t.match(/—\s+([A-Za-z]+ \d{1,2})\b/);if(d2){try{const d=new Date(d2[1]+", "+new Date().getFullYear());if(!isNaN(d))ext.date=d.toISOString().split("T")[0];}catch{}}}
  const dirM=t.match(/Entry:\s*(CALLS|PUTS)/i);if(dirM){ext.direction=dirM[1].toUpperCase();ext.correctDirection=dirM[1].toUpperCase();}
  const sysM=t.match(/System:\s*(CALLS|PUTS)/i);if(sysM)ext.correctDirection=sysM[1].toUpperCase();
  const resultM=t.match(/\b(WIN|LOSS|SKIP)\b/i);if(resultM)ext.result=resultM[1].toUpperCase();
  const gradeM=t.match(/\b(A\+|A|B\+)\b/);if(gradeM)ext.grade=gradeM[1];
  const pnlM=t.match(/\$([+-?\d.]+)/i);if(pnlM)ext.pnl=parseFloat(pnlM[1]);
  const pctM=t.match(/([\d.]+)%\s*(?:gain|return|win|profit)/i);if(pctM)ext.pct=parseFloat(pctM[1]);
  const wwM=t.match(/What\s+Worked:?\s*([\s\S]+?)(?:\n\s*(?:Learning|Tags):|$)/i);if(wwM)ext.whatWorked=wwM[1].trim();
  const learnM=t.match(/Learning:?\s*([\s\S]+?)(?:\n\s*(?:Tags|What Worked):|$)/i);if(learnM)ext.learning=learnM[1].trim();
  const journalM=t.match(/Journal:?\s*([\s\S]+?)(?:\n\s*(?:Tags|Learning|What Worked):|$)/i);if(journalM)ext.journal=journalM[1].trim();
  const tagsM=t.match(/Tags:\s*(.+?)$/im);if(tagsM)ext.tags=tagsM[1].trim().split(/\s+/).map(t=>t.replace(/^#/,""));
  const playM=t.match(/(One-Act|Two-Act)/i);if(playM)ext.playType=playM[1];
  return ext;
}

function rc(r){return r==="WIN"?C.green:r==="LOSS"?C.red:C.textMuted;}
function re(r){return r==="WIN"?"🤑":r==="LOSS"?"🤬":"😐";}
function fd(d){if(!d)return"";try{return new Date(d+"T12:00:00").toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"});}catch{return d;}}
function fmtPnl(n,forceSign=false){const v=parseFloat(n)||0;const s=(forceSign||v>0)&&v>0?"+":"";return`${s}$${Math.abs(v).toFixed(0)}`;}

function Card({children,style={},onClick}){
  return(
    <div onClick={onClick} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:"18px 20px",...style}}>
      {children}
    </div>
  );
}
function SLabel({children,color=C.teal}){
  return<div style={{color,fontFamily:"'Space Mono',monospace",fontSize:10,fontWeight:700,letterSpacing:"0.15em",textTransform:"uppercase",marginBottom:12}}>{children}</div>;
}
function Divider(){return<div style={{height:1,background:C.border,margin:"12px 0"}}/>;}
function Badge({children,color=C.teal}){
  return<span style={{background:color+"18",color,border:`1px solid ${color}38`,borderRadius:4,padding:"2px 8px",fontSize:9,fontWeight:700,fontFamily:"'Space Mono',monospace"}}>{children}</span>;
}

// ── PAGE HEADER (logo always on right) ───────────────────────────
function PageHeader({title,sub,children}){
  return(
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:24,flexWrap:"wrap",gap:12}}>
      <div>
        <div style={{fontFamily:"'Space Mono',monospace",fontSize:22,fontWeight:700,color:C.textMain,letterSpacing:"0.04em"}}>{title}</div>
        {sub&&<div style={{color:C.textMuted,fontSize:11,marginTop:3}}>{sub}</div>}
        {children}
      </div>
      <div style={{display:"flex",alignItems:"center",gap:12,flexShrink:0}}>
        <GlowTitle fontSize="clamp(11px,1.8vw,15px)"/>
        <Logo size={44}/>
      </div>
    </div>
  );
}

// ── DASHBOARD ─────────────────────────────────────────────────────
function DashboardPage({trades,onNavigate}){
  const [botData,setBotData]=useState(null);
  useEffect(()=>{
    fetch("/morning_brief.json?t="+Date.now()).then(r=>r.json()).then(setBotData).catch(()=>{});
  },[]);

  const traded=trades.filter(t=>t.result!=="SKIP");
  const wins=traded.filter(t=>t.result==="WIN");
  const losses=traded.filter(t=>t.result==="LOSS");
  const totalPnL=traded.reduce((s,t)=>s+(t.pnl||0),0);
  const wr=traded.length?Math.round(wins.length/traded.length*100):0;

  // Streak
  let streak=0,streakType=null;
  const sorted=[...traded].sort((a,b)=>(b.day||0)-(a.day||0));
  for(const t of sorted){if(!streakType)streakType=t.result;if(t.result===streakType)streak++;else break;}

  // Week / Month
  const now=new Date();
  const wkStart=new Date(now);wkStart.setDate(now.getDate()-now.getDay());
  const wkTrades=traded.filter(t=>t.date&&new Date(t.date+"T12:00:00")>=wkStart);
  const wkPnL=wkTrades.reduce((s,t)=>s+(t.pnl||0),0);
  const wkW=wkTrades.filter(t=>t.result==="WIN").length;
  const wkL=wkTrades.filter(t=>t.result==="LOSS").length;
  const moStart=new Date(now.getFullYear(),now.getMonth(),1);
  const moTrades=traded.filter(t=>t.date&&new Date(t.date+"T12:00:00")>=moStart);
  const moPnL=moTrades.reduce((s,t)=>s+(t.pnl||0),0);
  const moW=moTrades.filter(t=>t.result==="WIN").length;
  const moL=moTrades.filter(t=>t.result==="LOSS").length;

  // Avg win/loss
  const avgWin=wins.length?wins.reduce((s,t)=>s+(t.pnl||0),0)/wins.length:0;
  const avgLoss=losses.length?losses.reduce((s,t)=>s+(t.pnl||0),0)/losses.length:0;
  const winDayPct=traded.length?Math.round(wins.length/traded.length*100):0;

  // Biggest win day
  const biggestWin=wins.length?wins.reduce((best,t)=>(t.pnl||0)>(best?.pnl||0)?t:best,null):null;

  // Grade breakdown
  const byGrade=["A+","A","B+"].map(g=>{
    const days=traded.filter(d=>d.grade===g);
    const w=days.filter(d=>d.result==="WIN");
    return{grade:g,total:days.length,wins:w.length,wr:days.length?Math.round(w.length/days.length*100):0};
  });

  // Direction
  const callsD=traded.filter(d=>d.direction?.includes("CALLS"));
  const putsD=traded.filter(d=>d.direction?.includes("PUTS"));
  const cWR=callsD.length?Math.round(callsD.filter(d=>d.result==="WIN").length/callsD.length*100):0;
  const pWR=putsD.length?Math.round(putsD.filter(d=>d.result==="WIN").length/putsD.length*100):0;

  // Monthly breakdown
  const monthly={};
  traded.forEach(d=>{if(!d.date)return;const m=d.date.slice(0,7);if(!monthly[m])monthly[m]={wins:0,losses:0,pnl:0,count:0};monthly[m].pnl+=(d.pnl||0);monthly[m].count++;if(d.result==="WIN")monthly[m].wins++;else monthly[m].losses++;});
  const monthlyData=Object.entries(monthly).sort().map(([m,v])=>({month:new Date(m+"-01").toLocaleDateString("en-US",{month:"short",year:"2-digit"}),pnl:Math.round(v.pnl),wins:v.wins,losses:v.losses,count:v.count,wr:Math.round(v.wins/v.count*100)}));
  const last6months=monthlyData.slice(-6);

  // Market status PST
  const pstOffset=-7;
  const pstNow=new Date(now.getTime()+(pstOffset*60+now.getTimezoneOffset())*60000);
  const pstTotal=pstNow.getHours()*60+pstNow.getMinutes();
  const dow=pstNow.getDay();const isWeekend=dow===0||dow===6;
  let ms="CLOSED",mc=C.textMuted;
  if(!isWeekend){if(pstTotal>=390&&pstTotal<750){ms="OPEN";mc=C.green;}else if(pstTotal>=60&&pstTotal<390){ms="PRE-MARKET";mc=C.gold;}else if(pstTotal>=750&&pstTotal<840){ms="AFTER-HOURS";mc=C.steel;}}

  const lastTrade=sorted[0];
  const gex=botData?.gex;

  return(
    <div style={{display:"flex",flexDirection:"column",gap:20}}>

      {/* Hero header — logo RIGHT */}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"28px 28px 24px",background:`radial-gradient(ellipse at 0% 50%, rgba(10,107,255,0.06) 0%, transparent 60%)`,border:`1px solid ${C.border}`,borderRadius:16,gap:16}}>
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          <GlowTitle fontSize="clamp(22px,3.5vw,32px)"/>
          <div style={{color:C.textMuted,fontSize:11,letterSpacing:"0.06em"}}>🥷🏾 IWM 0DTE · v2.30</div>
          <div style={{display:"flex",alignItems:"center",gap:8,marginTop:2}}>
            <div style={{width:7,height:7,borderRadius:"50%",background:mc,boxShadow:`0 0 8px ${mc}`}}/>
            <span style={{color:mc,fontFamily:"'Space Mono',monospace",fontSize:10,fontWeight:700,letterSpacing:"0.15em"}}>{ms}</span>
            <span style={{color:C.textDim,fontSize:11}}>{now.toLocaleDateString("en-US",{weekday:"short",month:"short",day:"numeric"})}</span>
          </div>
        </div>
        <Logo size={80} style={{borderRadius:12,filter:"drop-shadow(0 0 20px rgba(10,107,255,0.35))"}}/>
      </div>

      {/* Streak banner */}
      {streak>0&&(
        <div style={{background:streakType==="WIN"?"rgba(124,255,59,0.07)":"rgba(255,51,85,0.07)",border:`1px solid ${streakType==="WIN"?C.green:C.red}30`,borderRadius:12,padding:"14px 20px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div>
            <div style={{color:C.textMuted,fontSize:9,letterSpacing:"0.12em",textTransform:"uppercase",marginBottom:4}}>Current Streak</div>
            <div style={{color:streakType==="WIN"?C.green:C.red,fontFamily:"'Space Mono',monospace",fontSize:22,fontWeight:700}}>{streak} {streakType==="WIN"?"WIN":"LOSS"}{streak>1?"S":""} {streakType==="WIN"?"🤑":"🤬"}</div>
          </div>
          <div style={{fontSize:36}}>{streakType==="WIN"?"🤑":"🤬"}</div>
        </div>
      )}

      {/* Top KPI row */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))",gap:14}}>
        <Card>
          <div style={{color:C.textMuted,fontSize:9,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:8}}>Win Rate</div>
          <div style={{color:wr>60?C.green:wr>40?C.gold:C.red,fontFamily:"'Space Mono',monospace",fontSize:28,fontWeight:700,lineHeight:1}}>{wr}%</div>
          <div style={{color:C.textMuted,fontSize:10,marginTop:6}}>{wins.length}W / {losses.length}L</div>
        </Card>
        <Card>
          <div style={{color:C.textMuted,fontSize:9,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:8}}>Total Net P&L</div>
          <div style={{color:totalPnL>=0?C.green:C.red,fontFamily:"'Space Mono',monospace",fontSize:28,fontWeight:700,lineHeight:1}}>{fmtPnl(totalPnL,true)}</div>
          <div style={{color:C.textMuted,fontSize:10,marginTop:6}}>{trades.length} days logged</div>
        </Card>
        <Card>
          <div style={{color:C.textMuted,fontSize:9,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:8}}>Winning Days</div>
          <div style={{color:C.teal,fontFamily:"'Space Mono',monospace",fontSize:28,fontWeight:700,lineHeight:1}}>{winDayPct}%</div>
          <div style={{color:C.textMuted,fontSize:10,marginTop:6}}>{wins.length} of {traded.length}</div>
        </Card>
        {/* Biggest Win — gold outlined */}
        {biggestWin&&(
          <Card style={{border:`1px solid ${C.gold}55`,background:`linear-gradient(135deg,${C.card},rgba(245,200,66,0.06))`}}>
            <div style={{color:C.gold,fontSize:9,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:8}}>Biggest Win Day 🤑</div>
            <div style={{color:C.gold,fontFamily:"'Space Mono',monospace",fontSize:28,fontWeight:700,lineHeight:1}}>{fmtPnl(biggestWin.pnl,true)}</div>
            <div style={{color:C.textMuted,fontSize:10,marginTop:6}}>{fd(biggestWin.date)} · {biggestWin.direction}</div>
          </Card>
        )}
      </div>

      {/* Avg Win / Avg Loss */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
        <Card style={{border:`1px solid ${C.green}22`}}>
          <div style={{color:C.textMuted,fontSize:9,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:8}}>Avg Win</div>
          <div style={{color:C.green,fontFamily:"'Space Mono',monospace",fontSize:22,fontWeight:700}}>{fmtPnl(avgWin,true)}</div>
          <div style={{color:C.textMuted,fontSize:10,marginTop:4}}>per winning trade</div>
        </Card>
        <Card style={{border:`1px solid ${C.red}22`}}>
          <div style={{color:C.textMuted,fontSize:9,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:8}}>Avg Loss</div>
          <div style={{color:C.red,fontFamily:"'Space Mono',monospace",fontSize:22,fontWeight:700}}>{fmtPnl(avgLoss)}</div>
          <div style={{color:C.textMuted,fontSize:10,marginTop:4}}>per losing trade</div>
        </Card>
      </div>

      {/* Week / Month */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
        {[["This Week",wkPnL,wkW,wkL],[`${now.toLocaleDateString("en-US",{month:"long"})}`,moPnL,moW,moL]].map(([label,pnl,w,l])=>(
          <Card key={label}>
            <div style={{color:C.textMuted,fontSize:9,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:10}}>{label}</div>
            <div style={{color:pnl>=0?C.green:C.red,fontFamily:"'Space Mono',monospace",fontSize:18,fontWeight:700}}>{fmtPnl(pnl,true)}</div>
            <div style={{color:C.textMuted,fontSize:10,marginTop:4}}>{w}W / {l}L{(w+l)>0?` · ${Math.round(w/(w+l)*100)}%`:""}</div>
          </Card>
        ))}
      </div>

      {/* Signal Map snap */}
      <div onClick={()=>onNavigate("signals")} style={{background:C.card,border:`1px solid ${C.purple}38`,borderRadius:14,padding:"16px 20px",cursor:"pointer",transition:"border-color 0.2s",":hover":{borderColor:C.purple+"88"}}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:gex?.flip_level?10:0}}>
          <span style={{color:C.purple,fontFamily:"'Space Mono',monospace",fontSize:10,fontWeight:700,letterSpacing:"0.12em"}}>⚡ SIGNAL MAP</span>
          <span style={{color:C.purple,fontSize:13}}>→</span>
        </div>
        {gex?.flip_level?(
          <div style={{display:"flex",gap:20,flexWrap:"wrap"}}>
            <div><span style={{color:C.textMuted,fontSize:11}}>Flip </span><span style={{color:C.gold,fontFamily:"'Space Mono',monospace",fontSize:14,fontWeight:700}}>{gex.flip_level}</span></div>
            {gex.call_walls?.[0]&&<div><span style={{color:C.textMuted,fontSize:11}}>Calls ↑ </span><span style={{color:C.green,fontFamily:"'Space Mono',monospace",fontSize:14,fontWeight:700}}>{gex.call_walls[0].strike}</span></div>}
            {gex.king_nodes?.[0]&&<div><span style={{color:C.textMuted,fontSize:11}}>Puts ↓ </span><span style={{color:C.red,fontFamily:"'Space Mono',monospace",fontSize:14,fontWeight:700}}>{gex.king_nodes[0].strike}</span></div>}
            <Badge color={gex.regime==="NEGATIVE"?C.red:C.green}>{gex.regime}</Badge>
          </div>
        ):<div style={{color:C.textDim,fontSize:12}}>Bot runs at 6AM PST — tap to view</div>}
      </div>

      {/* Monthly P&L chart */}
      {last6months.length>0&&(
        <Card>
          <SLabel>Monthly P&L</SLabel>
          <ResponsiveContainer width="100%" height={140}>
            <BarChart data={last6months} margin={{top:0,right:0,bottom:0,left:-20}}>
              <XAxis dataKey="month" tick={{fill:C.textMuted,fontSize:9}} axisLine={false} tickLine={false}/>
              <YAxis tick={{fill:C.textMuted,fontSize:8}} axisLine={false} tickLine={false}/>
              <Tooltip contentStyle={{background:C.card,border:`1px solid ${C.border}`,borderRadius:8,color:C.textMain,fontSize:10}} formatter={(v)=>[`$${v}`,""]}/>
              <Bar dataKey="pnl" radius={3}>
                {last6months.map((d,i)=><Cell key={i} fill={d.pnl>=0?C.green:C.red} fillOpacity={0.75}/>)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* Grade breakdown */}
      <Card>
        <SLabel>Grade Performance</SLabel>
        {byGrade.map(g=>(
          <div key={g.grade} style={{display:"flex",alignItems:"center",gap:12,marginBottom:12}}>
            <span style={{background:g.grade==="A+"?C.gold+"16":g.grade==="A"?C.green+"16":C.blue+"16",color:g.grade==="A+"?C.gold:g.grade==="A"?C.green:C.blue,border:`1px solid ${g.grade==="A+"?C.gold:g.grade==="A"?C.green:C.blue}38`,borderRadius:4,padding:"2px 8px",fontSize:10,fontWeight:700,fontFamily:"'Space Mono',monospace",minWidth:32,textAlign:"center"}}>{g.grade}</span>
            <div style={{flex:1,height:6,background:C.border,borderRadius:3,overflow:"hidden"}}>
              <div style={{width:`${g.wr}%`,height:"100%",background:g.wr>60?C.green:g.wr>40?C.gold:C.red,borderRadius:3,transition:"width 0.6s"}}/>
            </div>
            <span style={{color:C.textMain,fontFamily:"'Space Mono',monospace",fontSize:11,minWidth:36,textAlign:"right"}}>{g.wr}%</span>
            <span style={{color:C.textMuted,fontSize:10,minWidth:40,textAlign:"right"}}>{g.wins}/{g.total}</span>
          </div>
        ))}
      </Card>

      {/* Direction split */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
        {[["CALLS",cWR,callsD,C.green],["PUTS",pWR,putsD,C.red]].map(([label,w,days,color])=>(
          <Card key={label} style={{border:`1px solid ${color}18`,textAlign:"center"}}>
            <div style={{color,fontFamily:"'Space Mono',monospace",fontSize:24,fontWeight:700}}>{w}%</div>
            <div style={{color:C.textMuted,fontSize:10,marginTop:4,textTransform:"uppercase",letterSpacing:"0.1em"}}>{label}</div>
            <div style={{color:C.textDim,fontSize:9,marginTop:2}}>{days.filter(d=>d.result==="WIN").length}W / {days.length} trades</div>
          </Card>
        ))}
      </div>

      {/* Monthly breakdown table */}
      {monthlyData.length>0&&(
        <Card>
          <SLabel>Monthly Breakdown</SLabel>
          <div style={{overflowX:"auto"}}>
            <table style={{width:"100%",borderCollapse:"collapse",fontFamily:"'Space Mono',monospace",fontSize:11}}>
              <thead>
                <tr style={{borderBottom:`1px solid ${C.border}`}}>
                  {["Month","Trades","Wins","Losses","Win%","Net P&L"].map(h=>(
                    <th key={h} style={{padding:"6px 8px",color:C.textMuted,fontWeight:600,textAlign:"left",fontSize:9,letterSpacing:"0.08em"}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...monthlyData].reverse().map((m,i)=>(
                  <tr key={i} style={{borderBottom:`1px solid ${C.border}18`}}>
                    <td style={{padding:"8px",color:C.textMain}}>{m.month}</td>
                    <td style={{padding:"8px",color:C.textMuted}}>{m.count}</td>
                    <td style={{padding:"8px",color:C.green}}>{m.wins}</td>
                    <td style={{padding:"8px",color:C.red}}>{m.losses}</td>
                    <td style={{padding:"8px",color:m.wr>=70?C.green:m.wr>=50?C.gold:C.red,fontWeight:700}}>{m.wr}%</td>
                    <td style={{padding:"8px",color:m.pnl>=0?C.green:C.red,fontWeight:700}}>{fmtPnl(m.pnl,true)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Last trade */}
      {lastTrade&&(
        <Card>
          <SLabel color={C.textMuted}>Last Trade</SLabel>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div>
              <div style={{color:C.textMain,fontFamily:"'Space Mono',monospace",fontSize:13,fontWeight:700}}>Day {lastTrade.day} · {fd(lastTrade.date)}</div>
              <div style={{color:C.textMuted,fontSize:11,marginTop:4}}>{lastTrade.direction} · {lastTrade.grade} · {lastTrade.result}</div>
            </div>
            <div style={{textAlign:"right"}}>
              <div style={{color:rc(lastTrade.result),fontSize:24}}>{re(lastTrade.result)}</div>
              <div style={{color:rc(lastTrade.result),fontFamily:"'Space Mono',monospace",fontSize:12,fontWeight:700,marginTop:2}}>{fmtPnl(lastTrade.pnl,true)}</div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

// ── SIGNAL MAP ────────────────────────────────────────────────────
function SignalMapPage(){
  const [gex,setGex]=useState({});
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState(null);
  const [lastRefresh,setLastRefresh]=useState(null);
  const fetchGex=useCallback(()=>{
    setLoading(true);setError(null);
    fetch("/morning_brief.json?t="+Date.now()).then(r=>r.json()).then(d=>{
      if(d.gex?.flip_level){setGex(d.gex);setLastRefresh(new Date().toLocaleTimeString());}
      else setError("GEX not available yet — bot runs at 6AM PST");
      setLoading(false);
    }).catch(e=>{setError(e.message);setLoading(false);});
  },[]);
  useEffect(()=>{fetchGex();},[fetchGex]);

  const safeK=gex.king_nodes||[];
  const safeW=gex.call_walls||[];
  const isNeg=gex.regime==="NEGATIVE";
  const mx=Math.max(...safeW.map(w=>Math.abs(w.gex||0)),...safeK.map(n=>Math.abs(n.gex||0)),1);

  if(loading)return<div style={{color:C.textMuted,textAlign:"center",padding:60,fontFamily:"'Space Mono',monospace",fontSize:12}}>Loading...</div>;

  return(
    <div style={{display:"flex",flexDirection:"column",gap:18}}>
      <PageHeader title="Signal Map" sub={`IWM · ${new Date().toLocaleDateString("en-US",{month:"short",day:"numeric"})}`}>
        <div style={{display:"flex",gap:10,marginTop:8}}>
          <button onClick={fetchGex} style={{background:"none",border:`1px solid ${C.purple}40`,borderRadius:6,padding:"6px 14px",color:C.purple,fontSize:11,cursor:"pointer"}}>↻ Refresh</button>
          {lastRefresh&&<span style={{color:C.textDim,fontSize:10,alignSelf:"center"}}>{lastRefresh}</span>}
        </div>
      </PageHeader>

      {(error||!gex.flip_level)&&(
        <Card>
          <div style={{color:C.textMuted,fontSize:13,textAlign:"center",padding:24,lineHeight:1.8}}>{error||"GEX not available yet."}<br/><span style={{fontSize:11,color:C.textDim}}>Bot runs at 6AM PST</span></div>
        </Card>
      )}

      {gex.flip_level&&(
        <>
          <Card style={{borderColor:C.purple+"38",padding:0,overflow:"hidden"}}>
            {safeW.length>0&&(
              <div style={{padding:"16px 20px",borderBottom:`1px solid ${C.border}18`}}>
                <div style={{color:C.green,fontSize:9,fontFamily:"'Space Mono',monospace",letterSpacing:"0.12em",marginBottom:12}}>▲ ABOVE · CALLS RESISTANCE</div>
                {safeW.map((w,i)=>(
                  <div key={i} style={{display:"flex",alignItems:"center",gap:10,marginBottom:i<safeW.length-1?10:0}}>
                    <div style={{width:52,color:C.textMain,fontFamily:"'Space Mono',monospace",fontSize:13,fontWeight:700,flexShrink:0}}>{w.strike}</div>
                    <div style={{flex:1,height:5,background:C.border,borderRadius:3,overflow:"hidden"}}>
                      <div style={{width:`${Math.min((Math.abs(w.gex||0)/mx)*100,100)}%`,height:"100%",background:C.green+"55",borderRadius:3}}/>
                    </div>
                    <div style={{color:C.green,fontFamily:"'Space Mono',monospace",fontSize:10,minWidth:52,textAlign:"right"}}>{w.gex>0?"+":""}{w.gex}M</div>
                    <div style={{color:C.textDim,fontSize:9,minWidth:36,textAlign:"right"}}>{i===0?"WALL":""}</div>
                  </div>
                ))}
              </div>
            )}
            <div style={{padding:"12px 20px",background:"rgba(245,200,66,0.05)",borderTop:`1px solid ${C.gold}30`,borderBottom:`1px solid ${C.gold}30`,display:"flex",alignItems:"center",gap:12}}>
              <div style={{flex:1,height:1,background:C.gold+"28"}}/>
              <div style={{display:"flex",alignItems:"center",gap:10}}>
                <span style={{color:C.gold,fontFamily:"'Space Mono',monospace",fontSize:10,fontWeight:700,letterSpacing:"0.1em"}}>FLIP</span>
                <span style={{color:C.gold,fontFamily:"'Space Mono',monospace",fontSize:22,fontWeight:700}}>{gex.flip_level}</span>
                <Badge color={isNeg?C.red:C.green}>{isNeg?"NEG":"POS"}</Badge>
              </div>
              <div style={{flex:1,height:1,background:C.gold+"28"}}/>
            </div>
            {safeK.length>0&&(
              <div style={{padding:"16px 20px"}}>
                <div style={{color:C.red,fontSize:9,fontFamily:"'Space Mono',monospace",letterSpacing:"0.12em",marginBottom:12}}>▼ BELOW · PUTS TARGETS</div>
                {safeK.map((n,i)=>{
                  const isKing=Math.abs(n.gex||0)>20;
                  const isMag=gex.magnet?.strike===n.strike;
                  return(
                    <div key={i} style={{display:"flex",alignItems:"center",gap:10,marginBottom:i<safeK.length-1?10:0}}>
                      <div style={{width:52,color:C.textMain,fontFamily:"'Space Mono',monospace",fontSize:13,fontWeight:700,flexShrink:0}}>{n.strike}</div>
                      <div style={{flex:1,height:5,background:C.border,borderRadius:3,overflow:"hidden"}}>
                        <div style={{width:`${Math.min((Math.abs(n.gex||0)/mx)*100,100)}%`,height:"100%",background:isKing?C.gold+"65":C.red+"45",borderRadius:3}}/>
                      </div>
                      <div style={{color:C.red,fontFamily:"'Space Mono',monospace",fontSize:10,minWidth:52,textAlign:"right"}}>{n.gex}M</div>
                      <div style={{color:isMag?C.gold:isKing?C.gold:C.textDim,fontSize:9,minWidth:36,textAlign:"right",fontWeight:700}}>{isMag?"🧲":isKing?"👑":""}</div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
            <Card style={{borderColor:C.green+"20"}}>
              <div style={{color:C.textMuted,fontSize:9,textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:8}}>Calls Ceiling</div>
              <div style={{color:C.green,fontFamily:"'Space Mono',monospace",fontSize:24,fontWeight:700}}>{safeW[0]?.strike||"—"}</div>
              <div style={{color:C.textDim,fontSize:10,marginTop:4}}>GEX wall</div>
            </Card>
            <Card style={{borderColor:C.red+"20"}}>
              <div style={{color:C.textMuted,fontSize:9,textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:8}}>Puts Target</div>
              <div style={{color:C.red,fontFamily:"'Space Mono',monospace",fontSize:24,fontWeight:700}}>{safeK[0]?.strike||"—"}{safeK[1]?.strike?` → ${safeK[1].strike}`:""}</div>
              <div style={{color:C.textDim,fontSize:10,marginTop:4}}>King node</div>
            </Card>
          </div>
          <Card style={{borderColor:isNeg?C.red+"20":C.green+"20"}}>
            <div style={{color:isNeg?C.red:C.green,fontFamily:"'Space Mono',monospace",fontWeight:700,fontSize:11,marginBottom:6}}>{isNeg?"NEGATIVE GAMMA":"POSITIVE GAMMA"}</div>
            <div style={{color:C.textMuted,fontSize:12,lineHeight:1.6}}>{isNeg?"Below flip — dealers amplify moves. Downside targets magnetic.":"Above flip — dealers slow moves. Pinning behavior likely."}</div>
          </Card>
        </>
      )}
    </div>
  );
}

// ── CALENDAR ──────────────────────────────────────────────────────
function CalendarPage({trades,onSelectDay}){
  const [cur,setCur]=useState(()=>{const n=new Date();return{year:n.getFullYear(),month:n.getMonth()};});
  const {year,month}=cur;
  const MONTHS=["January","February","March","April","May","June","July","August","September","October","November","December"];
  const firstDay=new Date(year,month,1).getDay();
  const daysInMonth=new Date(year,month+1,0).getDate();
  const byDate=useMemo(()=>{const m={};trades.forEach(t=>{if(t.date)m[t.date]=t;});return m;},[trades]);
  const monthTrades=useMemo(()=>trades.filter(t=>{if(!t.date||t.result==="SKIP")return false;const d=new Date(t.date+"T12:00:00");return d.getFullYear()===year&&d.getMonth()===month;}),[trades,year,month]);
  const monthPnL=monthTrades.reduce((s,t)=>s+(t.pnl||0),0);
  const mW=monthTrades.filter(t=>t.result==="WIN").length;
  const mL=monthTrades.filter(t=>t.result==="LOSS").length;
  const bestPnL=Math.max(...monthTrades.filter(t=>t.result==="WIN"&&t.pnl>0).map(t=>t.pnl),0);
  const weeks=[];let week=new Array(firstDay).fill(null);
  for(let d=1;d<=daysInMonth;d++){week.push(d);if(week.length===7||d===daysInMonth){while(week.length<7)week.push(null);weeks.push([...week]);week=[];}}
  const wkPnL=wk=>{let t=0;wk.forEach(d=>{if(!d)return;const ds=`${year}-${String(month+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;const tr=byDate[ds];if(tr)t+=tr.pnl||0;});return t;};
  const today=new Date();
  const todayStr=`${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,"0")}-${String(today.getDate()).padStart(2,"0")}`;
  return(
    <div>
      <PageHeader title={`${MONTHS[month]} ${year}`} sub={`${mW}W / ${mL}L · ${fmtPnl(monthPnL,true)}`}>
        <div style={{display:"flex",gap:8,marginTop:10}}>
          <button onClick={()=>setCur(p=>{const d=new Date(p.year,p.month-1);return{year:d.getFullYear(),month:d.getMonth()};})} style={{background:C.card,border:`1px solid ${C.border}`,color:C.textMain,borderRadius:8,padding:"6px 14px",cursor:"pointer",fontFamily:"'Space Mono',monospace",fontSize:12,transition:"border-color 0.15s"}}>‹</button>
          <button onClick={()=>setCur(p=>{const d=new Date(p.year,p.month+1);return{year:d.getFullYear(),month:d.getMonth()};})} style={{background:C.card,border:`1px solid ${C.border}`,color:C.textMain,borderRadius:8,padding:"6px 14px",cursor:"pointer",fontFamily:"'Space Mono',monospace",fontSize:12,transition:"border-color 0.15s"}}>›</button>
        </div>
      </PageHeader>
      <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,overflow:"hidden"}}>
        <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr) 48px",borderBottom:`1px solid ${C.border}`}}>
          {["S","M","T","W","T","F","S"].map((d,i)=><div key={i} style={{color:C.textMuted,fontSize:9,textAlign:"center",padding:"8px 4px",fontFamily:"'Space Mono',monospace"}}>{d}</div>)}
          <div style={{color:C.textMuted,fontSize:8,textAlign:"center",padding:"8px 2px",fontFamily:"'Space Mono',monospace"}}>Wk</div>
        </div>
        {weeks.map((wk,wi)=>{
          const wPnL=wkPnL(wk);
          return(<div key={wi} style={{display:"grid",gridTemplateColumns:"repeat(7,1fr) 48px",borderBottom:wi<weeks.length-1?`1px solid ${C.border}22`:"none"}}>
            {wk.map((d,di)=>{
              if(!d)return<div key={di} style={{minHeight:72,borderRight:`1px solid ${C.border}22`,opacity:0.15,background:C.card}}/>;
              const ds=`${year}-${String(month+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
              const tr=byDate[ds];const isToday=ds===todayStr;
              const isBest=tr&&tr.result==="WIN"&&tr.pnl===bestPnL&&bestPnL>0;
              const bg=!tr?C.card:isBest?"rgba(245,200,66,0.13)":tr.result==="WIN"?"rgba(124,255,59,0.09)":tr.result==="LOSS"?"rgba(255,51,85,0.09)":C.card;
              const bc=isToday?C.teal:!tr?C.border+"44":isBest?C.gold:tr.result==="WIN"?C.green+"40":tr.result==="LOSS"?C.red+"40":C.border+"22";
              return(<div key={di} onClick={()=>tr&&onSelectDay(tr)}
                style={{background:bg,borderLeft:`1px solid ${bc}`,borderRight:`1px solid ${C.border}22`,minHeight:72,padding:"5px 6px",cursor:tr?"pointer":"default",display:"flex",flexDirection:"column",justifyContent:"space-between",overflow:"hidden",transition:"background 0.15s"}}>
                <div style={{color:isToday?C.teal:C.textMuted,fontFamily:"'Space Mono',monospace",fontSize:9,fontWeight:isToday?700:400}}>{d}</div>
                {tr&&tr.result!=="SKIP"&&(
                  <div>
                    <div style={{color:isBest?C.gold:tr.pnl>=0?C.green:C.red,fontFamily:"'Space Mono',monospace",fontSize:9,fontWeight:700}}>{tr.pnl>=0?"+":""}${tr.pnl}</div>
                    <div style={{fontSize:9}}>{isBest?"🤑":""}</div>
                  </div>
                )}
              </div>);
            })}
            <div style={{background:C.card,borderLeft:`1px solid ${C.border}`,display:"flex",flexDirection:"column",justifyContent:"center",alignItems:"center",padding:4}}>
              <div style={{color:wPnL>=0?C.green:C.red,fontFamily:"'Space Mono',monospace",fontSize:8,fontWeight:700,whiteSpace:"nowrap"}}>{wPnL>=0?"+":""}${Math.abs(Math.round(wPnL))}</div>
            </div>
          </div>);
        })}
      </div>
    </div>
  );
}

// ── DAY MODAL ─────────────────────────────────────────────────────
function DayModal({trade,onClose,onEdit,onDelete}){
  if(!trade)return null;
  return(
    <div style={{position:"fixed",inset:0,zIndex:300,background:"rgba(0,0,0,0.88)",display:"flex",alignItems:"flex-end"}} onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} style={{background:C.card,borderRadius:"16px 16px 0 0",padding:24,width:"100%",maxHeight:"92vh",overflowY:"auto",border:`1px solid ${C.border}`}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:16}}>
          <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
            <span style={{color:C.textMain,fontFamily:"'Space Mono',monospace",fontSize:16,fontWeight:700}}>Day {trade.day}</span>
            <span style={{color:C.textMuted,fontSize:12}}>{fd(trade.date)}</span>
            <Badge color={rc(trade.result)}>{trade.result}</Badge>
          </div>
          <button onClick={onClose} style={{background:"none",border:"none",color:C.textMuted,fontSize:22,cursor:"pointer"}}>×</button>
        </div>
        {trade.result!=="SKIP"&&(
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
            <div style={{background:C.surface,borderRadius:8,padding:"10px 14px"}}>
              <div style={{color:C.textMuted,fontSize:9,marginBottom:2,textTransform:"uppercase",letterSpacing:"0.08em"}}>Direction</div>
              <div style={{color:(trade.direction||"").includes("CALLS")?C.green:C.red,fontFamily:"'Space Mono',monospace",fontSize:14,fontWeight:700}}>{trade.direction}</div>
            </div>
            <div style={{background:C.surface,borderRadius:8,padding:"10px 14px"}}>
              <div style={{color:C.textMuted,fontSize:9,marginBottom:2,textTransform:"uppercase",letterSpacing:"0.08em"}}>P&L</div>
              <div style={{color:(trade.pnl||0)>=0?C.green:C.red,fontFamily:"'Space Mono',monospace",fontSize:14,fontWeight:700}}>{trade.pct>0?`+${trade.pct}% · `:""}${trade.pnl>=0?"+":""}${trade.pnl}</div>
            </div>
          </div>
        )}
        <Divider/>
        {trade.whatWorked&&<div style={{marginBottom:12}}><span style={{color:C.green,fontSize:12,fontWeight:700}}>What Worked: </span><span style={{color:C.textMain,fontSize:12,lineHeight:1.6}}>{trade.whatWorked}</span></div>}
        {trade.learning&&<div style={{marginBottom:12}}><span style={{color:C.blue,fontSize:12,fontWeight:700}}>Learning: </span><span style={{color:C.textMain,fontSize:12,lineHeight:1.6}}>{trade.learning}</span></div>}
        {trade.journal&&<div style={{marginBottom:14}}><div style={{color:C.textMuted,fontSize:10,marginBottom:6,textTransform:"uppercase",letterSpacing:"0.1em"}}>Journal</div><div style={{color:C.textMuted,fontSize:12,lineHeight:1.7,whiteSpace:"pre-wrap"}}>{trade.journal}</div></div>}
        {trade.tags?.length>0&&<div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:16}}>{trade.tags.map(t=><Badge key={t} color={C.teal}>#{t}</Badge>)}</div>}
        <div style={{display:"grid",gridTemplateColumns:"1fr auto",gap:10}}>
          <button onClick={onEdit} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:10,padding:"13px",color:C.textMain,fontSize:13,cursor:"pointer"}}>✏️ Edit</button>
          <button onClick={onDelete} style={{background:C.red+"10",border:`1px solid ${C.red}38`,borderRadius:10,padding:"13px 18px",color:C.red,fontSize:18,cursor:"pointer"}}>🗑</button>
        </div>
      </div>
    </div>
  );
}

// ── TRADE LOG (standalone, most recent 10 + log button) ───────────
function TradeLogPage({trades,setTrades,editTrade,setEditTrade}){
  const [showForm,setShowForm]=useState(false);
  const [eodText,setEodText]=useState("");
  const [parsed,setParsed]=useState(null);
  const [editMode,setEditMode]=useState(false);
  const [saved,setSaved]=useState(false);
  const [expandedId,setExpandedId]=useState(null);
  const blank={day:"",date:"",direction:"CALLS",result:"WIN",pnl:0,pct:0,grade:"A",whatWorked:"",learning:"",journal:"",tags:[]};
  const [form,setForm]=useState(blank);
  const setF=(k,v)=>setForm(p=>({...p,[k]:v}));

  useEffect(()=>{if(editTrade){setForm(editTrade);setEditMode(true);setShowForm(true);}else{setEditMode(false);}}, [editTrade]);

  const traded=trades.filter(t=>t.result!=="SKIP");
  const wins=traded.filter(t=>t.result==="WIN");
  const losses=traded.filter(t=>t.result==="LOSS");
  const totalPnL=traded.reduce((s,t)=>s+(t.pnl||0),0);
  const avgWin=wins.length?wins.reduce((s,t)=>s+(t.pnl||0),0)/wins.length:0;
  const avgLoss=losses.length?losses.reduce((s,t)=>s+(t.pnl||0),0)/losses.length:0;

  const recent=[...trades].sort((a,b)=>(b.day||0)-(a.day||0)).slice(0,10);

  const handleParse=()=>{const ext=parseEOD(eodText);setParsed(ext);setForm(p=>({...p,...ext,eodSummary:eodText}));};
  const handleSave=async()=>{
    const trade={...form,day:parseInt(form.day)||trades.length+1,pnl:parseFloat(form.pnl)||0,pct:parseFloat(form.pct)||0};
    let updated=editTrade?trades.map(t=>t.day===editTrade.day?trade:t):[...trades.filter(t=>t.day!==trade.day),trade].sort((a,b)=>a.day-b.day);
    setTrades(updated);await storageSave(updated);
    setSaved(true);setTimeout(()=>setSaved(false),2000);
    if(editTrade)setEditTrade(null);
    setForm(blank);setEodText("");setParsed(null);setShowForm(false);setEditMode(false);
  };
  const s={background:C.card,border:`1px solid ${C.border}`,borderRadius:8,padding:"10px 12px",color:C.textMain,fontSize:13,width:"100%",boxSizing:"border-box",fontFamily:"inherit"};

  return(
    <div style={{display:"flex",flexDirection:"column",gap:20}}>
      {/* Header — logo right */}
      <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",flexWrap:"wrap",gap:12}}>
        <div>
          <div style={{fontFamily:"'Space Mono',monospace",fontSize:22,fontWeight:700,color:C.textMain}}>Trade Log</div>
          <div style={{color:C.textMuted,fontSize:11,marginTop:3}}>{trades.length} days logged</div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <GlowTitle fontSize="clamp(11px,1.8vw,15px)"/>
          <Logo size={44}/>
          {/* Log Trade button with tooltip */}
          <div style={{position:"relative",display:"inline-flex"}}>
            <button
              onClick={()=>{setEditTrade(null);setForm(blank);setEodText("");setParsed(null);setEditMode(false);setShowForm(!showForm);}}
              title="Log Trade"
              style={{background:C.green+"15",border:`1px solid ${C.green}45`,borderRadius:12,width:44,height:44,color:C.green,fontSize:24,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:300,boxShadow:`0 0 14px ${C.green}25`,transition:"all 0.2s",lineHeight:1}}>+</button>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(130px,1fr))",gap:12}}>
        {[
          ["Winning Days",`${wins.length}`,C.green],
          ["Avg Win",fmtPnl(avgWin,true),C.green],
          ["Avg Loss",fmtPnl(avgLoss),C.red],
          ["Total Net P&L",fmtPnl(totalPnL,true),totalPnL>=0?C.green:C.red],
        ].map(([label,val,color])=>(
          <Card key={label} style={{padding:"14px 16px"}}>
            <div style={{color:C.textMuted,fontSize:8,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:6}}>{label}</div>
            <div style={{color,fontFamily:"'Space Mono',monospace",fontSize:18,fontWeight:700}}>{val}</div>
          </Card>
        ))}
      </div>

      {/* Log form slide */}
      {showForm&&(
        <Card style={{border:`1px solid ${C.blue}40`}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
            <span style={{color:C.blue,fontFamily:"'Space Mono',monospace",fontSize:12,fontWeight:700}}>{editMode?"EDIT TRADE":"LOG NEW TRADE"}</span>
            <button onClick={()=>{setShowForm(false);setEditMode(false);if(setEditTrade)setEditTrade(null);}} style={{background:"none",border:"none",color:C.textMuted,fontSize:20,cursor:"pointer"}}>×</button>
          </div>
          {!editMode&&(
            <>
              <textarea value={eodText} onChange={e=>setEodText(e.target.value)} placeholder="Paste EOD summary to auto-parse..." style={{...s,height:100,resize:"vertical",fontFamily:"'Space Mono',monospace",fontSize:11,lineHeight:1.5}}/>
              <button onClick={handleParse} style={{marginTop:8,marginBottom:14,background:C.gold+"10",border:`1px solid ${C.gold}38`,borderRadius:8,padding:"10px",color:C.gold,fontSize:12,fontWeight:700,cursor:"pointer",width:"100%"}}>Parse EOD →</button>
              {parsed&&<div style={{marginBottom:12,display:"flex",flexWrap:"wrap",gap:4}}>{Object.entries(parsed).filter(([k,v])=>v&&k!=="tags").slice(0,8).map(([k,v])=><span key={k} style={{background:C.surface,borderRadius:4,padding:"2px 6px",fontSize:9}}><span style={{color:C.textMuted}}>{k}: </span><span style={{color:C.teal,fontWeight:700}}>{String(v).slice(0,20)}</span></span>)}</div>}
            </>
          )}
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              <div><label style={{color:C.textMuted,fontSize:10,display:"block",marginBottom:4}}>Day #</label><input style={s} type="number" value={form.day} onChange={e=>setF("day",e.target.value)}/></div>
              <div><label style={{color:C.textMuted,fontSize:10,display:"block",marginBottom:4}}>Date</label><input style={s} type="date" value={form.date} onChange={e=>setF("date",e.target.value)}/></div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              <div><label style={{color:C.textMuted,fontSize:10,display:"block",marginBottom:4}}>Result</label><select style={s} value={form.result} onChange={e=>setF("result",e.target.value)}>{["WIN","LOSS","SKIP"].map(r=><option key={r}>{r}</option>)}</select></div>
              <div><label style={{color:C.textMuted,fontSize:10,display:"block",marginBottom:4}}>Grade</label><select style={s} value={form.grade} onChange={e=>setF("grade",e.target.value)}>{["A+","A","B+","Skip"].map(g=><option key={g}>{g}</option>)}</select></div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              <div><label style={{color:C.textMuted,fontSize:10,display:"block",marginBottom:4}}>Direction</label><select style={s} value={form.direction} onChange={e=>setF("direction",e.target.value)}>{["CALLS","PUTS","CALLS/PUTS","SKIP"].map(d=><option key={d}>{d}</option>)}</select></div>
              <div><label style={{color:C.textMuted,fontSize:10,display:"block",marginBottom:4}}>P&L ($)</label><input style={s} type="number" value={form.pnl} onChange={e=>setF("pnl",e.target.value)}/></div>
            </div>
            <div><label style={{color:C.textMuted,fontSize:10,display:"block",marginBottom:4}}>What Worked</label><textarea style={{...s,height:56,resize:"vertical"}} value={form.whatWorked||""} onChange={e=>setF("whatWorked",e.target.value)}/></div>
            <div><label style={{color:C.textMuted,fontSize:10,display:"block",marginBottom:4}}>Learning</label><textarea style={{...s,height:56,resize:"vertical"}} value={form.learning||""} onChange={e=>setF("learning",e.target.value)}/></div>
            <div><label style={{color:C.textMuted,fontSize:10,display:"block",marginBottom:4}}>Journal</label><textarea style={{...s,height:80,resize:"vertical",whiteSpace:"pre-wrap",lineHeight:1.6}} value={form.journal||""} onChange={e=>setF("journal",e.target.value)} placeholder={"Journal...\n\nLine breaks preserved."}/></div>
            <button onClick={handleSave} style={{background:saved?C.green+"18":C.teal+"10",border:`1px solid ${saved?C.green:C.teal}45`,borderRadius:10,padding:"13px",color:saved?C.green:C.teal,fontSize:13,fontWeight:700,cursor:"pointer",transition:"all 0.2s"}}>{saved?"✅ Saved!":"💾 Save Trade"}</button>
          </div>
        </Card>
      )}

      {/* Most recent 10 */}
      <div>
        <div style={{fontFamily:"'Space Mono',monospace",fontSize:9,color:C.textMuted,letterSpacing:"0.12em",textTransform:"uppercase",marginBottom:12}}>Most Recent 10 Trades</div>
        {recent.map((tr,i)=>(
          <div key={tr.day||i} style={{marginBottom:8}}>
            <div onClick={()=>setExpandedId(expandedId===tr.day?null:tr.day)}
              style={{background:C.card,border:`1px solid ${expandedId===tr.day?C.border:C.border+"88"}`,borderRadius:12,padding:"14px 16px",cursor:"pointer",display:"flex",alignItems:"center",gap:12,transition:"border-color 0.15s"}}>
              <div style={{color:rc(tr.result),fontSize:18,flexShrink:0}}>{re(tr.result)}</div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{display:"flex",alignItems:"baseline",gap:8,flexWrap:"wrap"}}>
                  <span style={{color:C.textMain,fontFamily:"'Space Mono',monospace",fontSize:11,fontWeight:700}}>Day {tr.day}</span>
                  <span style={{color:C.textMuted,fontSize:10}}>{fd(tr.date)}</span>
                  {tr.grade&&<Badge color={tr.grade==="A+"?C.gold:tr.grade==="A"?C.green:C.blue}>{tr.grade}</Badge>}
                </div>
                <div style={{color:C.textMuted,fontSize:10,marginTop:3}}>{tr.direction} · {tr.result}</div>
              </div>
              <div style={{textAlign:"right",flexShrink:0}}>
                {tr.pnl!==0&&<div style={{color:rc(tr.result),fontFamily:"'Space Mono',monospace",fontSize:12,fontWeight:700}}>{tr.pnl>=0?"+":""}${tr.pnl}</div>}
                {tr.pct>0&&<div style={{color:rc(tr.result),fontSize:10}}>+{tr.pct}%</div>}
              </div>
              <span style={{color:C.textDim,fontSize:11,flexShrink:0}}>{expandedId===tr.day?"▲":"▼"}</span>
            </div>
            {expandedId===tr.day&&(
              <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:"0 0 12px 12px",padding:"14px 16px",marginTop:-4}}>
                {tr.whatWorked&&<div style={{marginBottom:8}}><span style={{color:C.green,fontSize:11,fontWeight:700}}>What Worked: </span><span style={{color:C.textMain,fontSize:11}}>{tr.whatWorked}</span></div>}
                {tr.learning&&<div style={{marginBottom:8}}><span style={{color:C.blue,fontSize:11,fontWeight:700}}>Learning: </span><span style={{color:C.textMain,fontSize:11}}>{tr.learning}</span></div>}
                {tr.journal&&<div style={{color:C.textMuted,fontSize:11,lineHeight:1.6,marginBottom:10,whiteSpace:"pre-wrap"}}>{tr.journal}</div>}
                {tr.tags?.length>0&&<div style={{display:"flex",flexWrap:"wrap",gap:4,marginBottom:10}}>{tr.tags.map(t=><Badge key={t} color={C.teal}>#{t}</Badge>)}</div>}
                <div style={{display:"flex",gap:8,marginTop:4}}>
                  <button onClick={()=>{setForm(tr);setEditMode(true);setShowForm(true);setExpandedId(null);}} style={{background:C.blue+"12",border:`1px solid ${C.blue}30`,borderRadius:6,padding:"5px 14px",color:C.blue,fontSize:10,cursor:"pointer",fontFamily:"'Space Mono',monospace"}}>EDIT</button>
                  <button onClick={async()=>{if(window.confirm("Delete this trade?")){{const u=trades.filter(t=>t.day!==tr.day);setTrades(u);await storageSave(u);}}}} style={{background:C.red+"10",border:`1px solid ${C.red}30`,borderRadius:6,padding:"5px 14px",color:C.red,fontSize:10,cursor:"pointer",fontFamily:"'Space Mono',monospace"}}>DELETE</button>
                </div>
              </div>
            )}
          </div>
        ))}
        {!recent.length&&<div style={{color:C.textDim,fontFamily:"'Space Mono',monospace",fontSize:12,textAlign:"center",padding:"32px 0"}}>No trades yet — tap + to log your first trade</div>}
      </div>
    </div>
  );
}

// ── SEARCH PAGE ───────────────────────────────────────────────────
function SearchPage({trades,setTrades,onSelectDay}){
  const [search,setSearch]=useState("");
  const [filterGrade,setFilterGrade]=useState("");
  const [filterResult,setFilterResult]=useState("");
  const [selectedTrade,setSelectedTrade]=useState(null);

  const filtered=useMemo(()=>{
    let t=[...trades].sort((a,b)=>(b.day||0)-(a.day||0));
    if(search){const q=search.toLowerCase();t=t.filter(tr=>String(tr.day||"").includes(q)||(tr.date||"").includes(q)||(tr.result||"").toLowerCase().includes(q)||(tr.direction||"").toLowerCase().includes(q)||(tr.grade||"").toLowerCase().includes(q)||(tr.whatWorked||"").toLowerCase().includes(q)||(tr.learning||"").toLowerCase().includes(q)||(tr.journal||"").toLowerCase().includes(q));}
    if(filterGrade)t=t.filter(tr=>tr.grade===filterGrade);
    if(filterResult)t=t.filter(tr=>tr.result===filterResult);
    return t;
  },[trades,search,filterGrade,filterResult]);

  const isFiltering=search||filterGrade||filterResult;
  const display=isFiltering?filtered:filtered.slice(0,10);
  const activeCount=[filterGrade,filterResult].filter(Boolean).length;

  return(
    <div style={{display:"flex",flexDirection:"column",gap:18}}>
      <PageHeader title="Search" sub={isFiltering?`${filtered.length} results`:`${trades.length} trades`}/>

      {/* Search bar */}
      <div style={{position:"relative"}}>
        <span style={{position:"absolute",left:14,top:"50%",transform:"translateY(-50%)",color:C.textMuted,fontSize:18,lineHeight:1}}>🔍</span>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search trades by date, direction, grade, notes..."
          style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:"13px 14px 13px 44px",color:C.textMain,fontSize:14,width:"100%",boxSizing:"border-box",fontFamily:"'DM Sans',sans-serif",outline:"none",transition:"border-color 0.15s"}}/>
        {search&&<button onClick={()=>setSearch("")} style={{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",color:C.textMuted,cursor:"pointer",fontSize:18}}>×</button>}
      </div>

      {/* Filters row */}
      <div style={{display:"flex",gap:10,flexWrap:"wrap",alignItems:"flex-end"}}>
        <div style={{display:"flex",flexDirection:"column",gap:4}}>
          <label style={{color:C.textMuted,fontSize:9,letterSpacing:"0.1em",textTransform:"uppercase"}}>Entry Timing</label>
          <select value={filterGrade} onChange={e=>setFilterGrade(e.target.value)}
            style={{background:C.card,border:`1px solid ${filterGrade?C.blue:C.border}`,borderRadius:8,padding:"8px 14px",color:filterGrade?C.blue:C.textMuted,fontSize:12,cursor:"pointer",outline:"none",fontFamily:"'Space Mono',monospace",transition:"border-color 0.15s"}}>
            <option value="">All Grades</option>
            {["A+","A","B+"].map(g=><option key={g} value={g}>{g}</option>)}
          </select>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:4}}>
          <label style={{color:C.textMuted,fontSize:9,letterSpacing:"0.1em",textTransform:"uppercase"}}>Trade Analysis</label>
          <select value={filterResult} onChange={e=>setFilterResult(e.target.value)}
            style={{background:C.card,border:`1px solid ${filterResult?C.blue:C.border}`,borderRadius:8,padding:"8px 14px",color:filterResult?C.blue:C.textMuted,fontSize:12,cursor:"pointer",outline:"none",fontFamily:"'Space Mono',monospace",transition:"border-color 0.15s"}}>
            <option value="">Win / Loss</option>
            {["WIN","LOSS","SKIP"].map(r=><option key={r} value={r}>{r}</option>)}
          </select>
        </div>
        {(activeCount>0||search)&&(
          <button onClick={()=>{setSearch("");setFilterGrade("");setFilterResult("");}}
            style={{background:"none",border:`1px solid ${C.border}`,borderRadius:8,padding:"8px 14px",color:C.textMuted,fontSize:11,cursor:"pointer",fontFamily:"'Space Mono',monospace",alignSelf:"flex-end",transition:"border-color 0.15s"}}>Clear</button>
        )}
      </div>

      {/* Results count */}
      <div style={{color:C.textMuted,fontFamily:"'Space Mono',monospace",fontSize:9,letterSpacing:"0.1em",textTransform:"uppercase"}}>
        {isFiltering?`Showing ${filtered.length} of ${trades.length}`:`Showing recent 10 of ${trades.length}`}
      </div>

      {/* Trade cards */}
      <div style={{display:"flex",flexDirection:"column",gap:8}}>
        {display.map((tr,i)=>(
          <div key={tr.day||i} onClick={()=>setSelectedTrade(tr)}
            style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:"14px 16px",cursor:"pointer",display:"flex",alignItems:"center",gap:12,transition:"background 0.15s,border-color 0.15s"}}
            onMouseEnter={e=>{e.currentTarget.style.background=C.surface;e.currentTarget.style.borderColor=C.border;}}
            onMouseLeave={e=>{e.currentTarget.style.background=C.card;e.currentTarget.style.borderColor=C.border;}}>
            <div style={{color:rc(tr.result),fontSize:18,flexShrink:0}}>{re(tr.result)}</div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{display:"flex",alignItems:"baseline",gap:8,flexWrap:"wrap"}}>
                <span style={{color:C.textMain,fontFamily:"'Space Mono',monospace",fontSize:11,fontWeight:700}}>Day {tr.day}</span>
                <span style={{color:C.textMuted,fontSize:10}}>{fd(tr.date)}</span>
                {tr.grade&&<Badge color={tr.grade==="A+"?C.gold:tr.grade==="A"?C.green:C.blue}>{tr.grade}</Badge>}
                <Badge color={tr.direction?.includes("CALLS")?C.green:C.red}>{tr.direction}</Badge>
              </div>
              {tr.whatWorked&&<div style={{color:C.textMuted,fontSize:10,marginTop:2,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{tr.whatWorked}</div>}
            </div>
            <div style={{textAlign:"right",flexShrink:0}}>
              <div style={{color:rc(tr.result),fontFamily:"'Space Mono',monospace",fontSize:12,fontWeight:700}}>{tr.pnl>=0?"+":""}${tr.pnl}</div>
              {tr.pct>0&&<div style={{color:rc(tr.result),fontSize:10}}>+{tr.pct}%</div>}
            </div>
          </div>
        ))}
        {!display.length&&(
          <div style={{color:C.textDim,fontFamily:"'Space Mono',monospace",fontSize:12,textAlign:"center",padding:"40px 0"}}>No trades match your search</div>
        )}
      </div>

      {selectedTrade&&<DayModal trade={selectedTrade} onClose={()=>setSelectedTrade(null)} onEdit={()=>{}} onDelete={async()=>{const u=trades.filter(t=>t.day!==selectedTrade.day);setTrades(u);await storageSave(u);setSelectedTrade(null);}}/>}
    </div>
  );
}

// ── SIDEBAR ───────────────────────────────────────────────────────
function Sidebar({trades,page,setPage,isOpen,onClose,collapsed,setCollapsed,isMobile}){
  const [hoveredNav,setHoveredNav]=useState(null);

  const traded=trades.filter(t=>t.result!=="SKIP");
  let streak=0,streakType=null;
  const sorted=[...traded].sort((a,b)=>(b.day||0)-(a.day||0));
  for(const t of sorted){if(!streakType)streakType=t.result;if(t.result===streakType)streak++;else break;}
  const now=new Date();
  const wkStart=new Date(now);wkStart.setDate(now.getDate()-now.getDay());
  const wkTrades=traded.filter(t=>t.date&&new Date(t.date+"T12:00:00")>=wkStart);
  const wkPnL=wkTrades.reduce((s,t)=>s+(t.pnl||0),0);
  const wkW=wkTrades.filter(t=>t.result==="WIN").length;
  const wkL=wkTrades.filter(t=>t.result==="LOSS").length;
  const moStart=new Date(now.getFullYear(),now.getMonth(),1);
  const moTrades=traded.filter(t=>t.date&&new Date(t.date+"T12:00:00")>=moStart);
  const moPnL=moTrades.reduce((s,t)=>s+(t.pnl||0),0);
  const moW=moTrades.filter(t=>t.result==="WIN").length;
  const moL=moTrades.filter(t=>t.result==="LOSS").length;

  // Page order: Dashboard, Signal Map, Calendar, Trade Log, Search
  const nav=[
    {id:"dashboard",label:"Dashboard",icon:"⚡"},
    {id:"signals",label:"Signal Map",icon:"📊"},
    {id:"calendar",label:"Calendar",icon:"📅"},
    {id:"log",label:"Trade Log",icon:"📋"},
    {id:"search",label:"Search",icon:"🔍"},
  ];
  const handleNav=(id)=>{setPage(id);if(isMobile)onClose();};
  const exp=!collapsed;

  const inner=(
    <div style={{display:"flex",flexDirection:"column",height:"100%",overflow:"hidden"}}>
      {/* Header — logo on RIGHT */}
      <div style={{padding:exp?"14px 16px":"12px 0",display:"flex",alignItems:"center",justifyContent:exp?"space-between":"center",borderBottom:`1px solid ${C.border}`,flexShrink:0,minHeight:60}}>
        {exp?(
          <div style={{display:"flex",alignItems:"center",gap:8,flex:1,overflow:"hidden"}}>
            <div style={{flex:1,minWidth:0}}>
              <GlowTitle fontSize="12px"/>
            </div>
            <Logo size={32} style={{flexShrink:0}}/>
          </div>
        ):(
          <Logo size={22} opacity={0.35}/>
        )}
        {isMobile&&<button onClick={onClose} style={{background:"none",border:"none",color:C.textMuted,fontSize:18,cursor:"pointer",marginLeft:8}}>×</button>}
      </div>

      {/* Nav items with hover highlight */}
      <nav style={{padding:"10px 8px",flexShrink:0}}>
        {nav.map(n=>{
          const isActive=page===n.id;
          const isHov=hoveredNav===n.id;
          return(
            <button key={n.id} onClick={()=>handleNav(n.id)}
              onMouseEnter={()=>setHoveredNav(n.id)}
              onMouseLeave={()=>setHoveredNav(null)}
              title={!exp?n.label:undefined}
              style={{
                width:"100%",
                background:isActive?"rgba(0,180,216,0.12)":isHov?"rgba(255,255,255,0.04)":"none",
                border:`1px solid ${isActive?C.teal+"38":"transparent"}`,
                borderRadius:8,
                padding:exp?"9px 12px":"10px 0",
                color:isActive?C.teal:isHov?C.textMain:C.textMuted,
                fontSize:12,cursor:"pointer",
                display:"flex",alignItems:"center",
                gap:exp?10:0,
                justifyContent:exp?"flex-start":"center",
                marginBottom:2,
                transition:"background 0.18s ease, color 0.18s ease, border-color 0.18s ease",
              }}>
              <span style={{fontSize:14,flexShrink:0,lineHeight:1}}>{n.icon}</span>
              {exp&&<span style={{fontFamily:"'DM Sans',sans-serif",fontWeight:isActive?700:isHov?500:400,whiteSpace:"nowrap",fontSize:13}}>{n.label}</span>}
            </button>
          );
        })}
      </nav>

      {/* Quick Stats — expanded only */}
      {exp&&(
        <>
          <div style={{height:1,background:C.border,margin:"4px 12px",flexShrink:0}}/>
          <div style={{padding:"10px 12px",flexShrink:0}}>
            <div style={{color:C.textMuted,fontSize:9,letterSpacing:"0.14em",textTransform:"uppercase",marginBottom:10,fontFamily:"'Space Mono',monospace"}}>Quick Stats</div>

            {/* Streak */}
            <div style={{background:C.card,borderRadius:10,padding:"10px 12px",marginBottom:8,border:`1px solid ${C.border}`}}>
              <div style={{color:C.textMuted,fontSize:8,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:4,display:"flex",alignItems:"center",gap:4}}>
                <span>🔥</span> Current Streak
              </div>
              {streak>0?(
                <div style={{color:streakType==="WIN"?C.green:C.red,fontFamily:"'Space Mono',monospace",fontSize:14,fontWeight:700}}>
                  {streak} {streakType==="WIN"?"win":"loss"}{streak>1?"s":""} {streakType==="WIN"?"🤑":"🤬"}
                </div>
              ):(
                <div style={{color:C.textDim,fontSize:11}}>No streak</div>
              )}
            </div>

            {/* This Week */}
            <div style={{background:C.card,borderRadius:10,padding:"10px 12px",marginBottom:8,border:`1px solid ${C.border}`}}>
              <div style={{color:C.textMuted,fontSize:8,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:4,display:"flex",alignItems:"center",gap:4}}>
                <span>↗</span> This Week
              </div>
              {wkTrades.length>0?(
                <>
                  <div style={{color:wkPnL>=0?C.green:C.red,fontFamily:"'Space Mono',monospace",fontSize:12,fontWeight:700}}>{wkPnL>=0?"+":""}${wkPnL.toFixed(0)}</div>
                  <div style={{color:C.textMuted,fontSize:9,marginTop:1}}>{wkW}W / {wkL}L</div>
                </>
              ):(
                <div style={{color:C.textDim,fontSize:11}}>No trades</div>
              )}
            </div>

            {/* This Month */}
            <div style={{background:C.card,borderRadius:10,padding:"10px 12px",marginBottom:8,border:`1px solid ${C.border}`}}>
              <div style={{color:C.textMuted,fontSize:8,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:4,display:"flex",alignItems:"center",gap:4}}>
                <span>↘</span> This Month
              </div>
              {moTrades.length>0?(
                <>
                  <div style={{color:moPnL>=0?C.green:C.red,fontFamily:"'Space Mono',monospace",fontSize:12,fontWeight:700}}>{moPnL>=0?"+":""}${moPnL.toFixed(0)}</div>
                  <div style={{color:C.textMuted,fontSize:9,marginTop:1}}>{moW}W / {moL}L</div>
                </>
              ):(
                <div style={{color:C.textDim,fontSize:11}}>No trades</div>
              )}
            </div>

            {/* Days logged */}
            <div style={{background:C.card,borderRadius:10,padding:"10px 12px",border:`1px solid ${C.border}`}}>
              <div style={{color:C.textMuted,fontSize:8,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:4}}>📅 Days Logged</div>
              <div style={{color:C.teal,fontFamily:"'Space Mono',monospace",fontSize:14,fontWeight:700}}>{trades.length}</div>
            </div>
          </div>
        </>
      )}

      {exp&&<div style={{padding:"10px 14px",borderTop:`1px solid ${C.border}`,color:C.textDim,fontSize:8,fontFamily:"'Space Mono',monospace",flexShrink:0,marginTop:"auto"}}>v2.30 · Stealth Signals</div>}
    </div>
  );

  if(isMobile){
    if(!isOpen)return null;
    return(
      <>
        <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.75)",zIndex:200}}/>
        <div style={{position:"fixed",top:0,left:0,bottom:0,width:270,background:C.surface,borderRight:`1px solid ${C.border}`,zIndex:201,display:"flex",flexDirection:"column",overflowY:"auto"}}>{inner}</div>
      </>
    );
  }

  return(
    <div
      onMouseEnter={()=>setCollapsed(false)}
      onMouseLeave={()=>setCollapsed(true)}
      style={{
        width:collapsed?56:230,
        minWidth:collapsed?56:230,
        background:C.surface,
        borderRight:`1px solid ${C.border}`,
        display:"flex",
        flexDirection:"column",
        height:"100vh",
        position:"sticky",
        top:0,
        transition:"width 0.25s cubic-bezier(0.25,0.46,0.45,0.94), min-width 0.25s cubic-bezier(0.25,0.46,0.45,0.94)",
        overflow:"hidden",
        flexShrink:0,
        overflowY:"auto",
      }}>
      {inner}
    </div>
  );
}

// ── ROOT APP ──────────────────────────────────────────────────────
export default function App(){
  const [page,setPage]=useState("dashboard");
  const [trades,setTrades]=useState([]);
  const [selectedDay,setSelectedDay]=useState(null);
  const [editTrade,setEditTrade]=useState(null);
  const [sidebarOpen,setSidebarOpen]=useState(false);
  const [sidebarCollapsed,setSidebarCollapsed]=useState(true);
  const [isMobile,setIsMobile]=useState(typeof window!=="undefined"&&window.innerWidth<768);

  useEffect(()=>{
    const fn=()=>setIsMobile(window.innerWidth<768);
    window.addEventListener("resize",fn);return()=>window.removeEventListener("resize",fn);
  },[]);

  useEffect(()=>{
    storageLoad().then(data=>{if(data&&Array.isArray(data)&&data.length>0)setTrades(data);});
  },[]);

  useEffect(()=>{
    const h=(e)=>setPage(e.detail);
    window.addEventListener("navigate",h);return()=>window.removeEventListener("navigate",h);
  },[]);

  const handleEdit=()=>{setEditTrade(selectedDay);setSelectedDay(null);setPage("log");};
  const handleDelete=async()=>{const u=trades.filter(t=>t.day!==selectedDay?.day);setTrades(u);await storageSave(u);setSelectedDay(null);};

  return(
    <div style={{background:C.bg,minHeight:"100vh",color:C.textMain,fontFamily:"'DM Sans',-apple-system,sans-serif",display:"flex"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=DM+Sans:wght@400;500;700&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        html,body{background:#050709;height:100%;}
        ::-webkit-scrollbar{width:3px;}
        ::-webkit-scrollbar-track{background:transparent;}
        ::-webkit-scrollbar-thumb{background:#152B32;border-radius:2px;}
        input,select,textarea{outline:none;}
        input::placeholder,textarea::placeholder{color:#1E3040;}
        select option{background:#0B1217;color:#E8EDF5;}
        input[type=date]::-webkit-calendar-picker-indicator{filter:invert(0.5);}
        @media(prefers-reduced-motion:reduce){.glow-l{animation:none!important;}}
      `}</style>

      {!isMobile&&(
        <Sidebar trades={trades} page={page} setPage={setPage}
          isOpen={true} onClose={()=>{}}
          collapsed={sidebarCollapsed} setCollapsed={setSidebarCollapsed}
          isMobile={false}/>
      )}

      <div style={{flex:1,display:"flex",flexDirection:"column",minWidth:0,overflow:"hidden"}}>
        {/* Mobile top bar */}
        {isMobile&&(
          <div style={{background:C.surface,borderBottom:`1px solid ${C.border}`,padding:"12px 16px",display:"flex",alignItems:"center",justifyContent:"space-between",position:"sticky",top:0,zIndex:100,flexShrink:0}}>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <button onClick={()=>setSidebarOpen(true)} style={{background:"none",border:"none",cursor:"pointer",padding:"4px",display:"flex",flexDirection:"column",gap:4}}>
                <div style={{width:18,height:2,background:C.textMuted,borderRadius:1}}/>
                <div style={{width:18,height:2,background:C.textMuted,borderRadius:1}}/>
                <div style={{width:18,height:2,background:C.textMuted,borderRadius:1}}/>
              </button>
              <Logo size={22} opacity={0.9}/>
              <span style={{fontFamily:"'Space Mono',monospace",fontSize:11,fontWeight:700,color:C.textMain,letterSpacing:"0.06em"}}>STEALTH SIGNALS</span>
            </div>
            <span style={{color:C.textDim,fontFamily:"'Space Mono',monospace",fontSize:8}}>v2.30</span>
          </div>
        )}

        {/* Main content — full width centered, max 1100px desktop */}
        <div style={{
          flex:1,
          overflowY:"auto",
          padding:isMobile?"16px 14px 80px":"32px 40px",
          maxWidth:isMobile?undefined:1100,
          width:"100%",
          margin:"0 auto",
        }}>
          {page==="dashboard"&&<DashboardPage trades={trades} onNavigate={setPage}/>}
          {page==="signals"&&<SignalMapPage/>}
          {page==="calendar"&&<CalendarPage trades={trades} onSelectDay={setSelectedDay}/>}
          {page==="log"&&<TradeLogPage trades={trades} setTrades={setTrades} editTrade={editTrade} setEditTrade={setEditTrade}/>}
          {page==="search"&&<SearchPage trades={trades} setTrades={setTrades} onSelectDay={setSelectedDay}/>}
        </div>

        {/* Mobile bottom nav */}
        {isMobile&&(
          <nav style={{position:"fixed",bottom:0,left:0,right:0,background:C.surface,borderTop:`1px solid ${C.border}`,display:"flex",zIndex:50,paddingBottom:"env(safe-area-inset-bottom,0px)"}}>
            {[
              {id:"dashboard",icon:"⚡",label:"Home"},
              {id:"signals",icon:"📊",label:"Signal"},
              {id:"calendar",icon:"📅",label:"Calendar"},
              {id:"log",icon:"📋",label:"Log"},
              {id:"search",icon:"🔍",label:"Search"},
            ].map(item=>(
              <button key={item.id} onClick={()=>setPage(item.id)} style={{flex:1,border:"none",background:"transparent",color:page===item.id?C.teal:C.textMuted,padding:"10px 0 12px",display:"flex",flexDirection:"column",alignItems:"center",gap:2,cursor:"pointer",borderTop:page===item.id?`2px solid ${C.teal}`:"2px solid transparent",transition:"color 0.15s"}}>
                <span style={{fontSize:17}}>{item.icon}</span>
                <span style={{fontFamily:"'Space Mono',monospace",fontSize:8,letterSpacing:"0.04em"}}>{item.label.toUpperCase()}</span>
              </button>
            ))}
          </nav>
        )}
      </div>

      {isMobile&&(
        <Sidebar trades={trades} page={page} setPage={setPage}
          isOpen={sidebarOpen} onClose={()=>setSidebarOpen(false)}
          collapsed={false} setCollapsed={()=>{}}
          isMobile={true}/>
      )}
      {selectedDay&&<DayModal trade={selectedDay} onClose={()=>setSelectedDay(null)} onEdit={handleEdit} onDelete={handleDelete}/>}
    </div>
  );
}
