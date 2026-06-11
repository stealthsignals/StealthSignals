import { useState, useEffect, useCallback, useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

const LOGO_SRC = "data:image/png;base64,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";

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
  for(const key of [STORAGE_KEY, "stealth_trades_v3", "stealth_trades_v2"]){
    try{
      const r = await window.storage.get(key);
      if(r?.value){
        const data = JSON.parse(r.value);
        if(Array.isArray(data) && data.length > 0){
          if(key !== STORAGE_KEY) await window.storage.set(STORAGE_KEY, r.value);
          return data;
        }
      }
    }catch{}
    try{
      const s = localStorage.getItem(key);
      if(s){
        const data = JSON.parse(s);
        if(Array.isArray(data) && data.length > 0){
          await storageSave(data);
          return data;
        }
      }
    }catch{}
  }
  return null;
}

function Logo({size=32, opacity=1}){
  return(
    <img src={LOGO_SRC} alt="SS"
      style={{width:size,height:size,objectFit:"contain",opacity,flexShrink:0,
        filter:opacity<1?"drop-shadow(0 0 4px rgba(0,180,216,0.3))":"none"}}/>
  );
}

function GlowTitle({fontSize="clamp(20px,4vw,30px)"}){
  const letters="STEALTH SIGNALS".split("");
  return(
    <div style={{display:"flex",alignItems:"center"}}>
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
function Card({children,style={}}){return<div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:16,...style}}>{children}</div>;}
function SLabel({children,color=C.teal}){return<div style={{color,fontFamily:"'Space Mono',monospace",fontSize:10,fontWeight:700,letterSpacing:"0.15em",textTransform:"uppercase",marginBottom:10}}>{children}</div>;}
function Divider(){return<div style={{height:1,background:C.border,margin:"12px 0"}}/>;}
// ── DASHBOARD ─────────────────────────────────────────────────────
function DashboardPage({trades, onNavigate}){
  const [botData,setBotData]=useState(null);
  useEffect(()=>{
    fetch("/morning_brief.json?t="+Date.now()).then(r=>r.json()).then(setBotData).catch(()=>{});
    const t=setInterval(()=>{},60000);return()=>clearInterval(t);
  },[]);
  const traded=trades.filter(t=>t.result!=="SKIP");
  let streak=0,streakType=null;
  const sorted=[...traded].sort((a,b)=>(b.day||0)-(a.day||0));
  for(const t of sorted){if(!streakType)streakType=t.result;if(t.result===streakType)streak++;else break;}
  const now=new Date();
  const weekStart=new Date(now);weekStart.setDate(now.getDate()-now.getDay());
  const weekTrades=traded.filter(t=>t.date&&new Date(t.date+"T12:00:00")>=weekStart);
  const weekPnL=weekTrades.reduce((s,t)=>s+(t.pnl||0),0);
  const weekW=weekTrades.filter(t=>t.result==="WIN").length;
  const weekL=weekTrades.filter(t=>t.result==="LOSS").length;
  const d30=new Date(now);d30.setDate(now.getDate()-30);
  const last30=traded.filter(t=>t.date&&new Date(t.date+"T12:00:00")>=d30);
  const wr30=last30.length?Math.round(last30.filter(t=>t.result==="WIN").length/last30.length*100):0;
  const lastTrade=sorted[0];
  const gex=botData?.gex;
  // Market status PST
  const pstOffset=-7;
  const pstNow=new Date(now.getTime()+(pstOffset*60+now.getTimezoneOffset())*60000);
  const pstTotal=pstNow.getHours()*60+pstNow.getMinutes();
  const dow=pstNow.getDay();
  const isWeekend=dow===0||dow===6;
  let ms="CLOSED",mc=C.textMuted;
  if(!isWeekend){
    if(pstTotal>=390&&pstTotal<750){ms="OPEN";mc=C.green;}
    else if(pstTotal>=60&&pstTotal<390){ms="PRE-MARKET";mc=C.gold;}
    else if(pstTotal>=750&&pstTotal<840){ms="AFTER-HOURS";mc=C.steel;}
  }
  return(
    <div style={{display:"flex",flexDirection:"column",gap:20}}>
      <div style={{textAlign:"center",padding:"36px 20px 24px",display:"flex",flexDirection:"column",alignItems:"center",gap:18,background:"radial-gradient(ellipse at 50% 0%, rgba(10,107,255,0.07) 0%, transparent 65%)",borderBottom:`1px solid ${C.border}`,marginBottom:4}}>
        <div style={{display:"flex",alignItems:"center",gap:14,justifyContent:"center",flexWrap:"wrap"}}>
          <Logo size={64}/>
          <div style={{display:"flex",flexDirection:"column",alignItems:"flex-start",gap:4}}>
            <GlowTitle fontSize="clamp(20px,4.5vw,32px)"/>
            <div style={{color:C.textMuted,fontSize:11,letterSpacing:"0.06em"}}>🥷🏾 IWM 0DTE · v2.30</div>
          </div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <div style={{width:7,height:7,borderRadius:"50%",background:mc,boxShadow:`0 0 8px ${mc}`}}/>
          <span style={{color:mc,fontFamily:"'Space Mono',monospace",fontSize:10,fontWeight:700,letterSpacing:"0.15em"}}>{ms}</span>
          <span style={{color:C.textDim,fontSize:11}}>{now.toLocaleDateString("en-US",{weekday:"short",month:"short",day:"numeric"})}</span>
        </div>
      </div>
      {streak>0&&(
        <div style={{background:streakType==="WIN"?"rgba(124,255,59,0.07)":"rgba(255,51,85,0.07)",border:`1px solid ${streakType==="WIN"?C.green:C.red}28`,borderRadius:12,padding:"14px 18px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div>
            <div style={{color:C.textMuted,fontSize:9,letterSpacing:"0.12em",textTransform:"uppercase",marginBottom:4}}>Current Streak</div>
            <div style={{color:streakType==="WIN"?C.green:C.red,fontFamily:"'Space Mono',monospace",fontSize:20,fontWeight:700}}>{streak} {streakType==="WIN"?"WIN":"LOSS"}{streak>1?"S":""} {streakType==="WIN"?"🤑":"🤬"}</div>
          </div>
          <div style={{fontSize:32}}>{streakType==="WIN"?"🤑":"🤬"}</div>
        </div>
      )}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}}>
        {[["30D RATE",`${wr30}%`,wr30>60?C.green:wr30>40?C.gold:C.red],["THIS WEEK",`${weekW}W/${weekL}L`,weekPnL>=0?C.green:C.red],["DAYS",`${trades.length}`,C.teal]].map(([label,val,color])=>(
          <div key={label} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:10,padding:"12px 10px",textAlign:"center"}}>
            <div style={{color:C.textMuted,fontSize:9,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:6}}>{label}</div>
            <div style={{color,fontFamily:"'Space Mono',monospace",fontSize:15,fontWeight:700}}>{val}</div>
            {label==="THIS WEEK"&&<div style={{color:weekPnL>=0?C.green:C.red,fontSize:10,marginTop:2}}>{weekPnL>=0?"+":""}${weekPnL.toFixed(0)}</div>}
          </div>
        ))}
      </div>
      <div onClick={()=>onNavigate("signals")} style={{background:C.card,border:`1px solid ${C.purple}38`,borderRadius:12,padding:"14px 16px",cursor:"pointer"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:gex?.flip_level?10:0}}>
          <span style={{color:C.purple,fontFamily:"'Space Mono',monospace",fontSize:10,fontWeight:700,letterSpacing:"0.1em"}}>⚡ SIGNAL MAP</span>
          <span style={{color:C.purple,fontSize:12}}>→</span>
        </div>
        {gex?.flip_level?(
          <div style={{display:"flex",gap:16,flexWrap:"wrap"}}>
            <div><span style={{color:C.textMuted,fontSize:11}}>Flip </span><span style={{color:C.gold,fontFamily:"'Space Mono',monospace",fontSize:13,fontWeight:700}}>{gex.flip_level}</span></div>
            {gex.call_walls?.[0]&&<div><span style={{color:C.textMuted,fontSize:11}}>Calls </span><span style={{color:C.green,fontFamily:"'Space Mono',monospace",fontSize:13,fontWeight:700}}>{gex.call_walls[0].strike}</span></div>}
            {gex.king_nodes?.[0]&&<div><span style={{color:C.textMuted,fontSize:11}}>Puts </span><span style={{color:C.red,fontFamily:"'Space Mono',monospace",fontSize:13,fontWeight:700}}>{gex.king_nodes[0].strike}</span></div>}
            <div><span style={{color:gex.regime==="NEGATIVE"?C.red:C.green,fontSize:10,fontFamily:"'Space Mono',monospace"}}>{gex.regime}</span></div>
          </div>
        ):<div style={{color:C.textDim,fontSize:12}}>Bot runs at 6AM PST</div>}
      </div>
      {lastTrade&&(
        <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:"14px 16px"}}>
          <div style={{color:C.textMuted,fontSize:9,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:8}}>Last Trade</div>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div>
              <div style={{color:C.textMain,fontFamily:"'Space Mono',monospace",fontSize:12,fontWeight:700}}>Day {lastTrade.day} · {fd(lastTrade.date)}</div>
              <div style={{color:C.textMuted,fontSize:11,marginTop:3}}>{lastTrade.direction} · {lastTrade.grade} · {lastTrade.result}</div>
            </div>
            <div style={{textAlign:"right"}}>
              <div style={{color:rc(lastTrade.result),fontSize:20}}>{re(lastTrade.result)}</div>
              {lastTrade.pct>0&&<div style={{color:rc(lastTrade.result),fontSize:11}}>+{lastTrade.pct}%</div>}
            </div>
          </div>
        </div>
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
  if(error||!gex.flip_level)return(
    <div style={{display:"flex",flexDirection:"column",gap:14}}>
      <Card>
        <SLabel color={C.purple}>⚡ Signal Map</SLabel>
        <div style={{color:C.textMuted,fontSize:13,textAlign:"center",padding:24,lineHeight:1.8}}>{error||"GEX not available yet."}<br/><span style={{fontSize:11,color:C.textDim}}>Bot runs at 6AM PST</span></div>
        <button onClick={fetchGex} style={{background:"none",border:`1px solid ${C.purple}40`,borderRadius:6,padding:"10px",color:C.purple,fontSize:12,cursor:"pointer",width:"100%",marginTop:8}}>↻ Check for data</button>
      </Card>
    </div>
  );
  return(
    <div style={{display:"flex",flexDirection:"column",gap:14}}>
      <Card style={{borderColor:C.purple+"38",padding:0,overflow:"hidden"}}>
        <div style={{padding:"14px 16px",borderBottom:`1px solid ${C.border}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div>
            <div style={{color:C.purple,fontFamily:"'Space Mono',monospace",fontSize:13,fontWeight:700}}>⚡ SIGNAL MAP</div>
            <div style={{color:C.textMuted,fontSize:10,marginTop:2}}>IWM · {new Date().toLocaleDateString("en-US",{month:"short",day:"numeric"})}</div>
          </div>
          <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:4}}>
            <button onClick={fetchGex} style={{background:"none",border:`1px solid ${C.purple}28`,borderRadius:5,padding:"4px 10px",color:C.purple,fontSize:10,cursor:"pointer"}}>↻</button>
            {lastRefresh&&<span style={{color:C.textDim,fontSize:9}}>{lastRefresh}</span>}
          </div>
        </div>
        {safeW.length>0&&(
          <div style={{padding:"12px 16px",borderBottom:`1px solid ${C.border}18`}}>
            <div style={{color:C.green,fontSize:9,fontFamily:"'Space Mono',monospace",letterSpacing:"0.12em",marginBottom:10}}>▲ ABOVE · CALLS RESISTANCE</div>
            {safeW.map((w,i)=>(
              <div key={i} style={{display:"flex",alignItems:"center",gap:10,marginBottom:i<safeW.length-1?8:0}}>
                <div style={{width:52,color:C.textMain,fontFamily:"'Space Mono',monospace",fontSize:13,fontWeight:700,flexShrink:0}}>{w.strike}</div>
                <div style={{flex:1,height:4,background:C.border,borderRadius:3,overflow:"hidden"}}>
                  <div style={{width:`${Math.min((Math.abs(w.gex||0)/mx)*100,100)}%`,height:"100%",background:C.green+"55",borderRadius:3}}/>
                </div>
                <div style={{color:C.green,fontFamily:"'Space Mono',monospace",fontSize:10,minWidth:52,textAlign:"right"}}>{w.gex>0?"+":""}{w.gex}M</div>
                <div style={{color:C.textDim,fontSize:9,minWidth:36,textAlign:"right"}}>{i===0?"WALL":""}</div>
              </div>
            ))}
          </div>
        )}
        <div style={{padding:"10px 16px",background:"rgba(245,200,66,0.05)",borderTop:`1px solid ${C.gold}30`,borderBottom:`1px solid ${C.gold}30`,display:"flex",alignItems:"center",gap:12}}>
          <div style={{flex:1,height:1,background:C.gold+"28"}}/>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <span style={{color:C.gold,fontFamily:"'Space Mono',monospace",fontSize:10,fontWeight:700,letterSpacing:"0.1em"}}>FLIP</span>
            <span style={{color:C.gold,fontFamily:"'Space Mono',monospace",fontSize:20,fontWeight:700}}>{gex.flip_level}</span>
            <span style={{background:isNeg?"rgba(255,51,85,0.14)":"rgba(124,255,59,0.14)",color:isNeg?C.red:C.green,border:`1px solid ${isNeg?C.red:C.green}38`,borderRadius:4,padding:"2px 7px",fontSize:9,fontFamily:"'Space Mono',monospace",fontWeight:700}}>{isNeg?"NEG":"POS"}</span>
          </div>
          <div style={{flex:1,height:1,background:C.gold+"28"}}/>
        </div>
        {safeK.length>0&&(
          <div style={{padding:"12px 16px"}}>
            <div style={{color:C.red,fontSize:9,fontFamily:"'Space Mono',monospace",letterSpacing:"0.12em",marginBottom:10}}>▼ BELOW · PUTS TARGETS</div>
            {safeK.map((n,i)=>{
              const isKing=Math.abs(n.gex||0)>20;
              const isMag=gex.magnet?.strike===n.strike;
              return(
                <div key={i} style={{display:"flex",alignItems:"center",gap:10,marginBottom:i<safeK.length-1?8:0}}>
                  <div style={{width:52,color:C.textMain,fontFamily:"'Space Mono',monospace",fontSize:13,fontWeight:700,flexShrink:0}}>{n.strike}</div>
                  <div style={{flex:1,height:4,background:C.border,borderRadius:3,overflow:"hidden"}}>
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
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
        <Card style={{borderColor:C.green+"20"}}>
          <div style={{color:C.textMuted,fontSize:9,textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:6}}>Calls Max</div>
          <div style={{color:C.green,fontFamily:"'Space Mono',monospace",fontSize:22,fontWeight:700}}>{safeW[0]?.strike||"—"}</div>
          <div style={{color:C.textDim,fontSize:10,marginTop:4}}>GEX wall</div>
        </Card>
        <Card style={{borderColor:C.red+"20"}}>
          <div style={{color:C.textMuted,fontSize:9,textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:6}}>Puts Target</div>
          <div style={{color:C.red,fontFamily:"'Space Mono',monospace",fontSize:22,fontWeight:700}}>{safeK[0]?.strike||"—"}{safeK[1]?.strike?` → ${safeK[1].strike}`:""}</div>
          <div style={{color:C.textDim,fontSize:10,marginTop:4}}>King node</div>
        </Card>
      </div>
      <Card style={{borderColor:isNeg?C.red+"20":C.green+"20"}}>
        <div style={{color:isNeg?C.red:C.green,fontFamily:"'Space Mono',monospace",fontWeight:700,fontSize:11,marginBottom:6}}>{isNeg?"NEGATIVE GAMMA":"POSITIVE GAMMA"}</div>
        <div style={{color:C.textMuted,fontSize:12,lineHeight:1.6}}>{isNeg?"Below flip — dealers amplify moves. Downside targets magnetic.":"Above flip — dealers slow moves. Pinning behavior likely."}</div>
      </Card>
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
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14,flexWrap:"wrap",gap:8}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <button onClick={()=>setCur(p=>{const d=new Date(p.year,p.month-1);return{year:d.getFullYear(),month:d.getMonth()};})} style={{background:"none",border:"none",color:C.textMuted,fontSize:22,cursor:"pointer",padding:"2px 6px"}}>‹</button>
          <span style={{fontFamily:"'Space Mono',monospace",fontSize:13,fontWeight:700,color:C.textMain}}>{MONTHS[month]} {year}</span>
          <button onClick={()=>setCur(p=>{const d=new Date(p.year,p.month+1);return{year:d.getFullYear(),month:d.getMonth()};})} style={{background:"none",border:"none",color:C.textMuted,fontSize:22,cursor:"pointer",padding:"2px 6px"}}>›</button>
        </div>
        <div style={{textAlign:"right"}}>
          <div style={{color:monthPnL>=0?C.green:C.red,fontFamily:"'Space Mono',monospace",fontSize:14,fontWeight:700}}>{monthPnL>=0?"+":""}${monthPnL.toFixed(2)}</div>
          <div style={{color:C.textMuted,fontSize:11}}>{mW}W/{mL}L</div>
        </div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr) 40px",gap:2,marginBottom:2}}>
        {["S","M","T","W","T","F","S"].map((d,i)=><div key={i} style={{color:C.textMuted,fontSize:9,textAlign:"center",padding:"4px 0",fontFamily:"'Space Mono',monospace"}}>{d}</div>)}
        <div style={{color:C.textMuted,fontSize:9,textAlign:"center",padding:"4px 0",fontFamily:"'Space Mono',monospace"}}>Wk</div>
      </div>
      {weeks.map((wk,wi)=>{
        const wPnL=wkPnL(wk);
        return(<div key={wi} style={{display:"grid",gridTemplateColumns:"repeat(7,1fr) 40px",gap:2,marginBottom:2}}>
          {wk.map((d,di)=>{
            if(!d)return<div key={di} style={{background:C.card,borderRadius:5,aspectRatio:"1",opacity:0.2}}/>;
            const ds=`${year}-${String(month+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
            const tr=byDate[ds];const isToday=ds===todayStr;
            const isBest=tr&&tr.result==="WIN"&&tr.pnl===bestPnL&&bestPnL>0;
            const bg=!tr?C.card:isBest?"rgba(245,200,66,0.13)":tr.result==="WIN"?"rgba(124,255,59,0.10)":tr.result==="LOSS"?"rgba(255,51,85,0.10)":C.card;
            const bc=isToday?C.teal:!tr?C.border:isBest?C.gold:tr.result==="WIN"?C.green+"45":tr.result==="LOSS"?C.red+"45":C.border;
            return(<div key={di} onClick={()=>tr&&onSelectDay(tr)}
              style={{background:bg,border:`1px solid ${bc}`,borderRadius:5,padding:"3px",cursor:tr?"pointer":"default",display:"flex",flexDirection:"column",justifyContent:"space-between",overflow:"hidden",aspectRatio:"1"}}>
              <div style={{color:isToday?C.teal:C.textMuted,fontFamily:"'Space Mono',monospace",fontSize:9}}>{d}</div>
              {tr&&tr.result!=="SKIP"&&<div style={{textAlign:"center"}}><div style={{color:isBest?C.gold:tr.pnl>=0?C.green:C.red,fontFamily:"'Space Mono',monospace",fontSize:9,fontWeight:700,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{tr.pnl>=0?"+":""}${tr.pnl}</div></div>}
            </div>);
          })}
          <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:5,display:"flex",flexDirection:"column",justifyContent:"center",alignItems:"center",padding:2}}>
            <div style={{color:wPnL>=0?C.green:C.red,fontFamily:"'Space Mono',monospace",fontSize:8,fontWeight:700,whiteSpace:"nowrap"}}>{wPnL>=0?"+":""}${Math.abs(wPnL)}</div>
          </div>
        </div>);
      })}
    </div>
  );
}

// ── DAY MODAL ─────────────────────────────────────────────────────
function DayModal({trade,onClose,onEdit,onDelete}){
  if(!trade)return null;
  return(
    <div style={{position:"fixed",inset:0,zIndex:300,background:"rgba(0,0,0,0.88)",display:"flex",alignItems:"flex-end"}} onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} style={{background:C.card,borderRadius:"16px 16px 0 0",padding:22,width:"100%",maxHeight:"92vh",overflowY:"auto",border:`1px solid ${C.border}`}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:16}}>
          <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
            <span style={{color:C.textMain,fontFamily:"'Space Mono',monospace",fontSize:16,fontWeight:700}}>Day {trade.day}</span>
            <span style={{color:C.textMuted,fontSize:12}}>{fd(trade.date)}</span>
            <span style={{background:rc(trade.result)+"18",color:rc(trade.result),border:`1px solid ${rc(trade.result)}38`,borderRadius:4,padding:"2px 8px",fontSize:10,fontWeight:700}}>{trade.result}</span>
          </div>
          <button onClick={onClose} style={{background:"none",border:"none",color:C.textMuted,fontSize:22,cursor:"pointer"}}>×</button>
        </div>
        {trade.result!=="SKIP"&&(
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
            <div style={{background:"#0B1217",borderRadius:8,padding:"10px 12px"}}>
              <div style={{color:C.textMuted,fontSize:9,marginBottom:2}}>Direction</div>
              <div style={{color:(trade.direction||"").includes("CALLS")?C.green:C.red,fontFamily:"'Space Mono',monospace",fontSize:13,fontWeight:700}}>{trade.direction}</div>
            </div>
            <div style={{background:"#0B1217",borderRadius:8,padding:"10px 12px"}}>
              <div style={{color:C.textMuted,fontSize:9,marginBottom:2}}>P&L</div>
              <div style={{color:(trade.pnl||0)>=0?C.green:C.red,fontFamily:"'Space Mono',monospace",fontSize:13,fontWeight:700}}>{trade.pct>0?`+${trade.pct}% `:""}${trade.pnl}</div>
            </div>
          </div>
        )}
        <Divider/>
        {trade.whatWorked&&<div style={{marginBottom:12}}><span style={{color:C.green,fontSize:12,fontWeight:700}}>What Worked: </span><span style={{color:C.textMain,fontSize:12,lineHeight:1.6}}>{trade.whatWorked}</span></div>}
        {trade.learning&&<div style={{marginBottom:12}}><span style={{color:C.blue,fontSize:12,fontWeight:700}}>Learning: </span><span style={{color:C.textMain,fontSize:12,lineHeight:1.6}}>{trade.learning}</span></div>}
        {trade.journal&&<div style={{marginBottom:14}}><div style={{color:C.textMuted,fontSize:10,marginBottom:6,textTransform:"uppercase",letterSpacing:"0.1em"}}>Journal</div><div style={{color:C.textMuted,fontSize:12,lineHeight:1.7,whiteSpace:"pre-wrap"}}>{trade.journal}</div></div>}
        {trade.tags?.length>0&&<div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:16}}>{trade.tags.map(t=><span key={t} style={{background:C.teal+"10",color:C.teal,border:`1px solid ${C.teal}28`,borderRadius:4,padding:"2px 8px",fontSize:10}}>#{t}</span>)}</div>}
        <div style={{display:"grid",gridTemplateColumns:"1fr auto",gap:10}}>
          <button onClick={onEdit} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:10,padding:"13px",color:C.textMain,fontSize:13,cursor:"pointer"}}>✏️ Edit</button>
          <button onClick={onDelete} style={{background:C.red+"10",border:`1px solid ${C.red}38`,borderRadius:10,padding:"13px 18px",color:C.red,fontSize:18,cursor:"pointer"}}>🗑</button>
        </div>
      </div>
    </div>
  );
}
// ── TRADE LOG ─────────────────────────────────────────────────────
function TradePage({trades,setTrades,editTrade,setEditTrade}){
  const [search,setSearch]=useState("");
  const [filter,setFilter]=useState({result:"",grade:"",direction:""});
  const [showFilters,setShowFilters]=useState(false);
  const [showLog,setShowLog]=useState(false);
  const [eodText,setEodText]=useState("");
  const [parsed,setParsed]=useState(null);
  const [selectedTrade,setSelectedTrade]=useState(null);
  const [editMode,setEditMode]=useState(false);
  const [saved,setSaved]=useState(false);
  const [showBrowse,setShowBrowse]=useState(false);
  const blank={day:"",date:"",direction:"CALLS",result:"WIN",pnl:0,pct:0,grade:"A",whatWorked:"",learning:"",journal:"",tags:[]};
  const [form,setForm]=useState(blank);
  const setF=(k,v)=>setForm(p=>({...p,[k]:v}));
  useEffect(()=>{if(editTrade){setForm(editTrade);setEditMode(true);setShowLog(true);}},[editTrade]);
  const filtered=useMemo(()=>{
    let t=[...trades].sort((a,b)=>(b.day||0)-(a.day||0));
    if(search){const q=search.toLowerCase();t=t.filter(tr=>String(tr.day||"").includes(q)||(tr.date||"").includes(q)||(tr.result||"").toLowerCase().includes(q)||(tr.direction||"").toLowerCase().includes(q)||(tr.grade||"").toLowerCase().includes(q)||(tr.whatWorked||"").toLowerCase().includes(q)||(tr.learning||"").toLowerCase().includes(q)||(tr.journal||"").toLowerCase().includes(q)||String(tr.pct||"").includes(q));}
    if(filter.result)t=t.filter(tr=>tr.result===filter.result);
    if(filter.grade)t=t.filter(tr=>tr.grade===filter.grade);
    if(filter.direction)t=t.filter(tr=>(tr.direction||"").includes(filter.direction));
    return t;
  },[trades,search,filter]);
  const handleParse=()=>{const ext=parseEOD(eodText);setParsed(ext);setForm(p=>({...p,...ext,eodSummary:eodText}));};
  const handleSave=async()=>{
    const trade={...form,day:parseInt(form.day)||trades.length+1,pnl:parseFloat(form.pnl)||0,pct:parseFloat(form.pct)||0};
    let updated;
    if(editTrade){updated=trades.map(t=>t.day===editTrade.day?trade:t);}
    else{updated=[...trades.filter(t=>t.day!==trade.day),trade].sort((a,b)=>a.day-b.day);}
    setTrades(updated);await storageSave(updated);
    setSaved(true);setTimeout(()=>setSaved(false),2000);
    if(editTrade)setEditTrade(null);
    setForm(blank);setEodText("");setParsed(null);setShowLog(false);setEditMode(false);
  };
  const s={background:C.card,border:`1px solid ${C.border}`,borderRadius:8,padding:"10px 12px",color:C.textMain,fontSize:13,width:"100%",boxSizing:"border-box",fontFamily:"inherit"};
  const activeFilters=Object.values(filter).filter(Boolean).length;
  return(
    <div style={{display:"flex",flexDirection:"column",gap:0}}>
      <div style={{position:"sticky",top:0,background:C.bg,paddingBottom:12,zIndex:10}}>
        <div style={{display:"flex",gap:8,alignItems:"center"}}>
          <div style={{flex:1,position:"relative"}}>
            <span style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",color:C.textMuted,fontSize:15}}>🔍</span>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search trades..." style={{...s,paddingLeft:38,fontSize:13,height:44}}/>
            {search&&<button onClick={()=>setSearch("")} style={{position:"absolute",right:10,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",color:C.textMuted,cursor:"pointer",fontSize:16}}>×</button>}
          </div>
          <button onClick={()=>setShowFilters(!showFilters)} style={{background:activeFilters>0?C.teal+"12":C.card,border:`1px solid ${activeFilters>0?C.teal:C.border}`,borderRadius:8,padding:"0 12px",height:44,color:activeFilters>0?C.teal:C.textMuted,fontSize:11,cursor:"pointer",whiteSpace:"nowrap",flexShrink:0}}>
            Filter{activeFilters>0?` (${activeFilters})`:""}
          </button>
          <button onClick={()=>{setShowLog(true);setEditMode(false);setForm(blank);setEodText("");setParsed(null);}} style={{background:C.green+"10",border:`1px solid ${C.green}38`,borderRadius:8,padding:"0 14px",height:44,color:C.green,fontSize:20,cursor:"pointer",flexShrink:0}}>+</button>
        </div>
        {showFilters&&(
          <div style={{marginTop:8,display:"flex",flexWrap:"wrap",gap:6}}>
            {[{key:"result",opts:["WIN","LOSS","SKIP"]},{key:"grade",opts:["A+","A","B+"]},{key:"direction",opts:["CALLS","PUTS"]}].map(({key,opts})=>(
              <select key={key} value={filter[key]} onChange={e=>setFilter(p=>({...p,[key]:e.target.value}))} style={{...s,width:"auto",padding:"6px 10px",fontSize:11,flex:1}}>
                <option value="">{key}: All</option>
                {opts.map(o=><option key={o} value={o}>{o}</option>)}
              </select>
            ))}
            {activeFilters>0&&<button onClick={()=>setFilter({result:"",grade:"",direction:""})} style={{background:"none",border:`1px solid ${C.border}`,borderRadius:6,padding:"6px 10px",color:C.textMuted,fontSize:11,cursor:"pointer"}}>Clear</button>}
          </div>
        )}
        <div style={{marginTop:10,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <span style={{color:C.textMuted,fontSize:11}}>{search||activeFilters?`${filtered.length} results`:`${trades.length} entries`}</span>
          {!search&&!activeFilters&&<button onClick={()=>setShowBrowse(!showBrowse)} style={{background:"none",border:"none",color:C.textMuted,fontSize:11,cursor:"pointer"}}>{showBrowse?"Hide all ▲":"Browse all ▼"}</button>}
        </div>
      </div>
      {(search||activeFilters||showBrowse)&&(
        <div style={{display:"flex",flexDirection:"column",gap:2}}>
          {filtered.length===0&&<div style={{color:C.textDim,textAlign:"center",padding:40,fontSize:12}}>No trades found</div>}
          {filtered.map(tr=>(
            <div key={tr.day} onClick={()=>setSelectedTrade(tr)} style={{display:"flex",alignItems:"center",gap:12,padding:"11px 14px",background:C.card,border:`1px solid ${C.border}`,borderRadius:10,cursor:"pointer",marginBottom:2}}>
              <div style={{color:rc(tr.result),fontSize:16,flexShrink:0}}>{re(tr.result)}</div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{display:"flex",alignItems:"baseline",gap:8}}>
                  <span style={{color:C.textMain,fontFamily:"'Space Mono',monospace",fontSize:11,fontWeight:700}}>Day {tr.day}</span>
                  <span style={{color:C.textMuted,fontSize:10}}>{fd(tr.date)}</span>
                  {tr.grade&&<span style={{color:tr.grade==="A+"?C.gold:tr.grade==="A"?C.green:C.blue,fontSize:9,fontFamily:"'Space Mono',monospace"}}>{tr.grade}</span>}
                </div>
                <div style={{color:C.textMuted,fontSize:10,marginTop:1}}>{tr.direction} · {tr.result}</div>
              </div>
              <div style={{textAlign:"right",flexShrink:0}}>
                {tr.pnl!==0&&<div style={{color:rc(tr.result),fontFamily:"'Space Mono',monospace",fontSize:11,fontWeight:700}}>{tr.pnl>=0?"+":""}${tr.pnl}</div>}
                {tr.pct>0&&<div style={{color:rc(tr.result),fontSize:10}}>+{tr.pct}%</div>}
              </div>
            </div>
          ))}
        </div>
      )}
      {showLog&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.88)",zIndex:200,display:"flex",alignItems:"flex-end"}}>
          <div style={{background:C.card,borderRadius:"16px 16px 0 0",padding:22,width:"100%",maxHeight:"92vh",overflowY:"auto",border:`1px solid ${C.border}`}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
              <span style={{color:C.textMain,fontFamily:"'Space Mono',monospace",fontSize:13,fontWeight:700}}>{editMode?"EDIT TRADE":"LOG NEW TRADE"}</span>
              <button onClick={()=>{setShowLog(false);setEditMode(false);if(setEditTrade)setEditTrade(null);}} style={{background:"none",border:"none",color:C.textMuted,fontSize:22,cursor:"pointer"}}>×</button>
            </div>
            {!editMode&&(
              <>
                <textarea value={eodText} onChange={e=>setEodText(e.target.value)} placeholder="Paste EOD summary..." style={{...s,height:110,resize:"vertical",fontFamily:"'Space Mono',monospace",fontSize:11,lineHeight:1.5}}/>
                <button onClick={handleParse} style={{marginTop:8,marginBottom:14,background:C.gold+"10",border:`1px solid ${C.gold}38`,borderRadius:8,padding:"11px",color:C.gold,fontSize:12,fontWeight:700,cursor:"pointer",width:"100%"}}>Parse EOD →</button>
                {parsed&&<div style={{marginBottom:12,display:"flex",flexWrap:"wrap",gap:4}}>{Object.entries(parsed).filter(([k,v])=>v&&k!=="tags").slice(0,8).map(([k,v])=><span key={k} style={{background:"#0B1217",borderRadius:4,padding:"2px 6px",fontSize:9}}><span style={{color:C.textMuted}}>{k}: </span><span style={{color:C.teal,fontWeight:700}}>{String(v).slice(0,20)}</span></span>)}</div>}
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
                <div><label style={{color:C.textMuted,fontSize:10,display:"block",marginBottom:4}}>P&L %</label><input style={s} type="number" value={form.pct} onChange={e=>setF("pct",e.target.value)}/></div>
              </div>
              <div><label style={{color:C.textMuted,fontSize:10,display:"block",marginBottom:4}}>What Worked</label><textarea style={{...s,height:56,resize:"vertical"}} value={form.whatWorked||""} onChange={e=>setF("whatWorked",e.target.value)}/></div>
              <div><label style={{color:C.textMuted,fontSize:10,display:"block",marginBottom:4}}>Learning</label><textarea style={{...s,height:56,resize:"vertical"}} value={form.learning||""} onChange={e=>setF("learning",e.target.value)}/></div>
              <div><label style={{color:C.textMuted,fontSize:10,display:"block",marginBottom:4}}>Journal</label><textarea style={{...s,height:80,resize:"vertical",whiteSpace:"pre-wrap",lineHeight:1.6}} value={form.journal||""} onChange={e=>setF("journal",e.target.value)} placeholder={"Journal...\n\nLine breaks preserved."}/></div>
              <button onClick={handleSave} style={{background:saved?C.green+"18":C.teal+"10",border:`1px solid ${saved?C.green:C.teal}45`,borderRadius:10,padding:"13px",color:saved?C.green:C.teal,fontSize:13,fontWeight:700,cursor:"pointer"}}>{saved?"✅ Saved!":"💾 Save Trade"}</button>
            </div>
          </div>
        </div>
      )}
      {selectedTrade&&<DayModal trade={selectedTrade} onClose={()=>setSelectedTrade(null)} onEdit={()=>{setForm(selectedTrade);setEditMode(true);setShowLog(true);setSelectedTrade(null);}} onDelete={async()=>{const u=trades.filter(t=>t.day!==selectedTrade.day);setTrades(u);await storageSave(u);setSelectedTrade(null);}}/>}
    </div>
  );
}
// ── ANALYTICS ─────────────────────────────────────────────────────
function AnalyticsPage({trades}){
  const traded=trades.filter(d=>d.result!=="SKIP");
  const wins=traded.filter(d=>d.result==="WIN");
  const wr=traded.length?Math.round(wins.length/traded.length*100):0;
  const totalPnL=trades.reduce((s,d)=>s+(d.pnl||0),0);
  const byGrade=["A+","A","B+"].map(g=>{const days=traded.filter(d=>d.grade===g);const w=days.filter(d=>d.result==="WIN");return{grade:g,total:days.length,wins:w.length,wr:days.length?Math.round(w.length/days.length*100):0};});
  const monthly={};trades.forEach(d=>{if(!d.date)return;const m=d.date.slice(0,7);if(!monthly[m])monthly[m]=0;monthly[m]+=d.pnl||0;});
  const monthlyData=Object.entries(monthly).sort().map(([m,p])=>({month:new Date(m+"-01").toLocaleDateString("en-US",{month:"short"}),pnl:Math.round(p)}));
  const callsD=traded.filter(d=>d.direction?.includes("CALLS"));
  const putsD=traded.filter(d=>d.direction?.includes("PUTS"));
  const cWR=callsD.length?Math.round(callsD.filter(d=>d.result==="WIN").length/callsD.length*100):0;
  const pWR=putsD.length?Math.round(putsD.filter(d=>d.result==="WIN").length/putsD.length*100):0;
  return(
    <div style={{display:"flex",flexDirection:"column",gap:14}}>
      <Card>
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:16,textAlign:"center"}}>
          <div><div style={{color:wr>60?C.green:wr>40?C.gold:C.red,fontFamily:"'Space Mono',monospace",fontSize:26,fontWeight:700}}>{wr}%</div><div style={{color:C.textMuted,fontSize:10,textTransform:"uppercase",marginTop:4}}>Win Rate</div></div>
          <div><div style={{color:totalPnL>=0?C.green:C.red,fontFamily:"'Space Mono',monospace",fontSize:20,fontWeight:700}}>{totalPnL>=0?"+":""}${totalPnL}</div><div style={{color:C.textMuted,fontSize:10,textTransform:"uppercase",marginTop:4}}>Total P&L</div></div>
          <div><div style={{color:C.teal,fontFamily:"'Space Mono',monospace",fontSize:26,fontWeight:700}}>{trades.length}</div><div style={{color:C.textMuted,fontSize:10,textTransform:"uppercase",marginTop:4}}>Days</div></div>
        </div>
      </Card>
      {monthlyData.length>0&&(
        <Card><SLabel>Monthly P&L</SLabel>
          <ResponsiveContainer width="100%" height={130}>
            <BarChart data={monthlyData} margin={{top:0,right:0,bottom:0,left:-20}}>
              <XAxis dataKey="month" tick={{fill:C.textMuted,fontSize:9}} axisLine={false} tickLine={false}/>
              <YAxis tick={{fill:C.textMuted,fontSize:8}} axisLine={false} tickLine={false}/>
              <Tooltip contentStyle={{background:C.card,border:`1px solid ${C.border}`,borderRadius:8,color:C.textMain,fontSize:10}}/>
              <Bar dataKey="pnl" radius={3}>{monthlyData.map((d,i)=><Cell key={i} fill={d.pnl>=0?C.green:C.red} fillOpacity={0.7}/>)}</Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}
      <Card><SLabel>Grade Performance</SLabel>
        {byGrade.map(g=>(<div key={g.grade} style={{display:"flex",alignItems:"center",gap:12,marginBottom:10}}>
          <span style={{background:g.grade==="A+"?C.gold+"16":g.grade==="A"?C.green+"16":C.blue+"16",color:g.grade==="A+"?C.gold:g.grade==="A"?C.green:C.blue,border:`1px solid ${g.grade==="A+"?C.gold:g.grade==="A"?C.green:C.blue}38`,borderRadius:4,padding:"2px 8px",fontSize:10,fontWeight:700,minWidth:32,textAlign:"center"}}>{g.grade}</span>
          <div style={{flex:1,height:5,background:C.border,borderRadius:3,overflow:"hidden"}}><div style={{width:`${g.wr}%`,height:"100%",background:g.wr>60?C.green:g.wr>40?C.gold:C.red,borderRadius:3}}/></div>
          <span style={{color:C.textMain,fontFamily:"'Space Mono',monospace",fontSize:11,minWidth:36}}>{g.wr}%</span>
          <span style={{color:C.textMuted,fontSize:10}}>{g.wins}/{g.total}</span>
        </div>))}
      </Card>
      <Card><SLabel>Direction</SLabel>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          {[["CALLS",cWR,callsD,C.green],["PUTS",pWR,putsD,C.red]].map(([label,w,days,color])=>(
            <div key={label} style={{textAlign:"center",padding:14,background:C.card,borderRadius:8,border:`1px solid ${color}18`}}>
              <div style={{color,fontFamily:"'Space Mono',monospace",fontSize:22,fontWeight:700}}>{w}%</div>
              <div style={{color:C.textMuted,fontSize:10,marginTop:4}}>{label}</div>
              <div style={{color:C.textDim,fontSize:10}}>{days.filter(d=>d.result==="WIN").length}/{days.length}</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ── SIDEBAR ───────────────────────────────────────────────────────
function Sidebar({trades,page,setPage,isOpen,onClose,collapsed,setCollapsed,isMobile}){
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
  const nav=[
    {id:"dashboard",label:"Dashboard",icon:"⚡"},
    {id:"signals",label:"Signal Map",icon:"📊"},
    {id:"calendar",label:"Calendar",icon:"📅"},
    {id:"log",label:"Trade Log",icon:"📋"},
    {id:"analytics",label:"Stats",icon:"📈"},
  ];
  const handleNav=(id)=>{setPage(id);if(isMobile)onClose();};
  const exp=!collapsed;

  const inner=(
    <div style={{display:"flex",flexDirection:"column",height:"100%",overflow:"hidden"}}>
      <div style={{padding:exp?"14px 14px":"12px 0",display:"flex",alignItems:"center",justifyContent:exp?"space-between":"center",borderBottom:`1px solid ${C.border}`,flexShrink:0,minHeight:56}}>
        {exp?(
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <Logo size={22} opacity={0.8}/>
            <span style={{fontFamily:"'Space Mono',monospace",fontSize:10,fontWeight:700,color:C.textMain,letterSpacing:"0.07em",whiteSpace:"nowrap"}}>STEALTH SIGNALS</span>
          </div>
        ):(
          <Logo size={20} opacity={0.35}/>
        )}
        {isMobile&&<button onClick={onClose} style={{background:"none",border:"none",color:C.textMuted,fontSize:18,cursor:"pointer"}}>×</button>}
      </div>
      <div style={{padding:"8px 6px",flexShrink:0}}>
        {nav.map(n=>(
          <button key={n.id} onClick={()=>handleNav(n.id)} title={!exp?n.label:undefined}
            style={{width:"100%",background:page===n.id?"rgba(0,180,216,0.10)":"none",border:`1px solid ${page===n.id?C.teal+"38":"transparent"}`,borderRadius:7,padding:exp?"8px 10px":"9px 0",color:page===n.id?C.teal:C.textMuted,fontSize:12,cursor:"pointer",display:"flex",alignItems:"center",gap:exp?8:0,justifyContent:exp?"flex-start":"center",marginBottom:2,transition:"all 0.15s"}}>
            <span style={{fontSize:13,flexShrink:0}}>{n.icon}</span>
            {exp&&<span style={{fontFamily:"'DM Sans',sans-serif",fontWeight:page===n.id?700:400,whiteSpace:"nowrap",fontSize:12}}>{n.label}</span>}
          </button>
        ))}
      </div>
      {exp&&(<>
        <div style={{height:1,background:C.border,margin:"4px 8px",flexShrink:0}}/>
        <div style={{padding:"0 8px",flex:1,overflowY:"auto"}}>
          {streak>0&&(
            <div style={{background:C.card,borderRadius:8,padding:"10px 12px",marginBottom:8,border:`1px solid ${C.border}`}}>
              <div style={{color:C.textMuted,fontSize:8,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:4}}>🔥 Streak</div>
              <div style={{color:streakType==="WIN"?C.green:C.red,fontFamily:"'Space Mono',monospace",fontSize:13,fontWeight:700}}>{streak} {streakType==="WIN"?"win":"loss"}{streak>1?"s":""} {streakType==="WIN"?"🤑":"🤬"}</div>
            </div>
          )}
          {[["This Week",wkPnL,wkW,wkL,wkTrades],["This Month",moPnL,moW,moL,moTrades]].map(([label,pnl,w,l,trs])=>(
            <div key={label} style={{background:C.card,borderRadius:8,padding:"10px 12px",marginBottom:8,border:`1px solid ${C.border}`}}>
              <div style={{color:C.textMuted,fontSize:8,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:4}}>{label}</div>
              {trs.length>0?(<><div style={{color:pnl>=0?C.green:C.red,fontFamily:"'Space Mono',monospace",fontSize:12,fontWeight:700}}>{pnl>=0?"+":""}${pnl.toFixed(0)}</div><div style={{color:C.textMuted,fontSize:9,marginTop:1}}>{w}W/{l}L</div></>):<div style={{color:C.textDim,fontSize:10}}>No trades</div>}
            </div>
          ))}
          <div style={{color:C.textDim,fontSize:9,textAlign:"center",padding:"4px 0"}}>📅 {trades.length} days</div>
        </div>
        <div style={{padding:"10px 14px",borderTop:`1px solid ${C.border}`,color:C.textDim,fontSize:8,fontFamily:"'Space Mono',monospace",flexShrink:0}}>v2.30 · Stealth Signals</div>
      </>)}
      {!exp&&!isMobile&&<div style={{flex:1,display:"flex",justifyContent:"center",paddingTop:16}}><div style={{color:C.textDim,fontSize:7,fontFamily:"'Space Mono',monospace",writingMode:"vertical-rl",transform:"rotate(180deg)",opacity:0.3}}>v2.30</div></div>}
    </div>
  );

  if(isMobile){
    if(!isOpen)return null;
    return(<>
      <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.75)",zIndex:200}}/>
      <div style={{position:"fixed",top:0,left:0,bottom:0,width:260,background:C.surface,borderRight:`1px solid ${C.border}`,zIndex:201,display:"flex",flexDirection:"column"}}>{inner}</div>
    </>);
  }

  return(
    <div
      onMouseEnter={()=>setCollapsed(false)}
      onMouseLeave={()=>setCollapsed(true)}
      style={{width:collapsed?52:220,minWidth:collapsed?52:220,background:C.surface,borderRight:`1px solid ${C.border}`,display:"flex",flexDirection:"column",height:"100vh",position:"sticky",top:0,transition:"width 0.22s cubic-bezier(0.4,0,0.2,1),min-width 0.22s cubic-bezier(0.4,0,0.2,1)",overflow:"hidden",flexShrink:0}}>
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
    window.addEventListener("resize",fn);
    return()=>window.removeEventListener("resize",fn);
  },[]);

  useEffect(()=>{
    storageLoad().then(data=>{
      if(data&&Array.isArray(data)&&data.length>0)setTrades(data);
    });
  },[]);

  useEffect(()=>{
    const h=(e)=>setPage(e.detail);
    window.addEventListener("navigate",h);
    return()=>window.removeEventListener("navigate",h);
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
        @media(prefers-reduced-motion:reduce){.glow-l{animation:none!important;}}
      `}</style>

      {!isMobile&&<Sidebar trades={trades} page={page} setPage={setPage} isOpen={true} onClose={()=>{}} collapsed={sidebarCollapsed} setCollapsed={setSidebarCollapsed} isMobile={false}/>}

      <div style={{flex:1,display:"flex",flexDirection:"column",minWidth:0,overflow:"hidden"}}>
        {isMobile&&(
          <div style={{background:C.surface,borderBottom:`1px solid ${C.border}`,padding:"12px 16px",display:"flex",alignItems:"center",justifyContent:"space-between",position:"sticky",top:0,zIndex:100,flexShrink:0}}>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <button onClick={()=>setSidebarOpen(true)} style={{background:"none",border:"none",cursor:"pointer",padding:"4px",display:"flex",flexDirection:"column",gap:4}}>
                <div style={{width:18,height:2,background:C.textMuted,borderRadius:1}}/>
                <div style={{width:18,height:2,background:C.textMuted,borderRadius:1}}/>
                <div style={{width:18,height:2,background:C.textMuted,borderRadius:1}}/>
              </button>
              <Logo size={20} opacity={0.9}/>
              <span style={{fontFamily:"'Space Mono',monospace",fontSize:11,fontWeight:700,color:C.textMain,letterSpacing:"0.06em"}}>STEALTH SIGNALS</span>
            </div>
            <span style={{color:C.textDim,fontFamily:"'Space Mono',monospace",fontSize:8}}>v2.30</span>
          </div>
        )}
        <div style={{flex:1,overflowY:"auto",padding:isMobile?"16px":"24px 32px",maxWidth:isMobile?undefined:920,width:"100%"}}>
          {page==="dashboard"&&<DashboardPage trades={trades} onNavigate={setPage}/>}
          {page==="signals"&&<SignalMapPage/>}
          {page==="calendar"&&<CalendarPage trades={trades} onSelectDay={setSelectedDay}/>}
          {page==="log"&&<TradePage trades={trades} setTrades={setTrades} editTrade={editTrade} setEditTrade={setEditTrade}/>}
          {page==="analytics"&&<AnalyticsPage trades={trades}/>}
        </div>
      </div>

      {isMobile&&<Sidebar trades={trades} page={page} setPage={setPage} isOpen={sidebarOpen} onClose={()=>setSidebarOpen(false)} collapsed={false} setCollapsed={()=>{}} isMobile={true}/>}
      {selectedDay&&<DayModal trade={selectedDay} onClose={()=>setSelectedDay(null)} onEdit={handleEdit} onDelete={handleDelete}/>}
    </div>
  );
}
