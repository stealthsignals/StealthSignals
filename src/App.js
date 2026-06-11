import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

// ── DESIGN TOKENS ─────────────────────────────────────────────────
const C = {
  bg:"#06090F",surface:"#0C1219",card:"#111922",border:"#1A2535",
  teal:"#00D4B4",gold:"#F5C842",green:"#12E86E",red:"#FF3355",
  blue:"#4A9EFF",purple:"#9B6DFF",orange:"#FF8C42",
  textMain:"#E8EDF5",textMuted:"#4A6480",textDim:"#243040",white:"#FFFFFF",
  glowBlue:"#4A9EFF",
};

// ── STORAGE ───────────────────────────────────────────────────────
const STORAGE_KEY = "stealth_trades_v4";
async function storageSave(trades){
  try{ await window.storage.set(STORAGE_KEY, JSON.stringify(trades)); }
  catch(e){ try{ localStorage.setItem(STORAGE_KEY, JSON.stringify(trades)); }catch{} }
}
async function storageLoad(){
  try{ const r=await window.storage.get(STORAGE_KEY); if(r?.value) return JSON.parse(r.value); }catch{}
  try{ const s=localStorage.getItem("stealth_trades_v3")||localStorage.getItem("stealth_trades_v2"); if(s) return JSON.parse(s); }catch{}
  return null;
}

// ── LOGO SVG ─────────────────────────────────────────────────────
function StealthLogo({size=32}){
  return(
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      {/* Hood shape */}
      <path d="M50 8 C28 8 15 22 12 38 L10 72 C10 78 16 82 22 80 L50 74 L78 80 C84 82 90 78 90 72 L88 38 C85 22 72 8 50 8Z" fill="#0F1922" stroke="#1E2D42" strokeWidth="1.5"/>
      {/* Hood shadow inner */}
      <path d="M50 12 C32 12 20 24 18 38 L16 68 C16 73 21 76 26 74 L50 69 L74 74 C79 76 84 73 84 68 L82 38 C80 24 68 12 50 12Z" fill="#080E18"/>
      {/* Face shadow / mask area */}
      <ellipse cx="50" cy="52" rx="22" ry="16" fill="#060C14"/>
      {/* Eyes - subtle glow */}
      <ellipse cx="40" cy="46" rx="3" ry="2" fill="#12E86E" opacity="0.6"/>
      <ellipse cx="60" cy="46" rx="3" ry="2" fill="#12E86E" opacity="0.6"/>
      {/* Candlesticks - green */}
      <g transform="translate(29, 54)">
        {/* Candle 1 */}
        <line x1="4" y1="14" x2="4" y2="4" stroke="#12E86E" strokeWidth="1"/>
        <rect x="2" y="8" width="4" height="5" fill="#12E86E" rx="0.5"/>
        {/* Candle 2 */}
        <line x1="11" y1="12" x2="11" y2="2" stroke="#12E86E" strokeWidth="1"/>
        <rect x="9" y="5" width="4" height="6" fill="#12E86E" rx="0.5"/>
        {/* Candle 3 */}
        <line x1="18" y1="16" x2="18" y2="6" stroke="#12E86E" strokeWidth="1"/>
        <rect x="16" y="9" width="4" height="6" fill="#12E86E" rx="0.5"/>
        {/* Candle 4 */}
        <line x1="25" y1="13" x2="25" y2="3" stroke="#12E86E" strokeWidth="1"/>
        <rect x="23" y="6" width="4" height="6" fill="#12E86E" rx="0.5"/>
        {/* Candle 5 */}
        <line x1="32" y1="15" x2="32" y2="7" stroke="#12E86E" strokeWidth="1"/>
        <rect x="30" y="9" width="4" height="5" fill="#12E86E" rx="0.5"/>
        {/* Candle 6 */}
        <line x1="39" y1="11" x2="39" y2="1" stroke="#12E86E" strokeWidth="1"/>
        <rect x="37" y="4" width="4" height="6" fill="#12E86E" rx="0.5"/>
      </g>
    </svg>
  );
}

// ── GLOW TEXT COMPONENT ───────────────────────────────────────────
function GlowTitle(){
  const letters = "STEALTH SIGNALS".split("");
  return(
    <div style={{position:"relative",display:"inline-block"}}>
      <style>{`
        @keyframes bloomLetter {
          0%,100%{text-shadow:0 0 0px rgba(74,158,255,0);color:#E8EDF5;}
          50%{text-shadow:0 0 20px rgba(74,158,255,0.9),0 0 40px rgba(74,158,255,0.5),0 0 80px rgba(74,158,255,0.2);color:#ffffff;}
        }
        .glow-letter{
          display:inline-block;
          font-family:'Space Mono',monospace;
          font-size:clamp(22px,5vw,36px);
          font-weight:700;
          letter-spacing:0.12em;
          color:#E8EDF5;
          animation: bloomLetter 3s ease-in-out infinite;
        }
        .glow-space{ display:inline-block; width:0.4em; }
      `}</style>
      {letters.map((l,i)=>(
        l===" "
          ? <span key={i} className="glow-space"/>
          : <span key={i} className="glow-letter" style={{animationDelay:`${i*0.12}s`}}>{l}</span>
      ))}
    </div>
  );
}

// ── PARSE EOD ─────────────────────────────────────────────────────
function parseEOD(text){
  const ext={};
  const MONTH_MAP={jan:"January",feb:"February",mar:"March",apr:"April",may:"May",jun:"June",jul:"July",aug:"August",sep:"September",oct:"October",nov:"November",dec:"December"};
  let t=text.replace(/\b(Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\b/gi,m=>MONTH_MAP[m.toLowerCase().slice(0,3)]||m);
  const dayM=t.match(/DAY\s+(\d+)/i);if(dayM)ext.day=parseInt(dayM[1]);
  const dateM=t.match(/—\s+([A-Za-z]+ \d+,?\s*\d{4})/);
  if(dateM){try{const d=new Date(dateM[1]);if(!isNaN(d))ext.date=d.toISOString().split("T")[0];}catch{}}
  if(!ext.date){const d2=t.match(/—\s+([A-Za-z]+ \d{1,2})\b/);if(d2){try{const d=new Date(d2[1]+", "+new Date().getFullYear());if(!isNaN(d))ext.date=d.toISOString().split("T")[0];}catch{}}}
  const dirM=t.match(/Entry:\s*(CALLS|PUTS)/i);if(dirM){ext.direction=dirM[1].toUpperCase();ext.correctDirection=dirM[1].toUpperCase();}
  const sysM=t.match(/System:\s*(CALLS|PUTS)/i);if(sysM)ext.correctDirection=sysM[1].toUpperCase();
  const resultM=t.match(/\b(WIN|LOSS|SKIP)\b/i);if(resultM)ext.result=resultM[1].toUpperCase();
  const gradeM=t.match(/\b(A\+|A|B\+)\b/);if(gradeM)ext.grade=gradeM[1];
  const stratM=t.match(/(2up\/2up|2dn\/2dn|3-|1-)/i);if(stratM)ext.strat=stratM[1];
  const pnlM=t.match(/\$([+-]?[\d.]+)\s*(?:P&L|profit|loss)?/i);if(pnlM)ext.pnl=parseFloat(pnlM[1]);
  const pctM=t.match(/([\d.]+)%\s*(?:gain|return|win|profit)/i);if(pctM)ext.pct=parseFloat(pctM[1]);
  const closeM=t.match(/Close%?\s*[:\s=]*([\d.]+)%?/i);if(closeM)ext.closePercent=closeM[1];
  const fiveM=t.match(/5[-\s]?Day\s+Position\s*%\s*=\s*([\d.]+)%/i)||t.match(/5D%?\s*[:\s=]*([\d.]+)%?/i);if(fiveM)ext.fiveDayPercent=fiveM[1];
  const volM=t.match(/Today IWM\s+([\d.]+)%\s*\/\s*IWO\s+([\d.]+)%/i);if(volM)ext.volToday=`IWM ${volM[1]}% / IWO ${volM[2]}%`;
  const gapM=t.match(/Gap:\s*(Up|Down|Flat)\s*([+\-]?[\d.]+)/i);if(gapM)ext.gap=`${gapM[1]} ${gapM[2]}`;
  const rangeM=t.match(/(Tight|Mid|Wide)\s+([\d.]+)/i);if(rangeM)ext.range=`${rangeM[1]} ${rangeM[2]}`;
  const openM=t.match(/Open[:\s]+([\d.]+)/i);if(openM)ext.openPrice=openM[1];
  const wwM=t.match(/What\s+Worked:?\s*([\s\S]+?)(?:\n\s*(?:Learning|Tags|Act 2|Target|Entry|System):|$)/i);if(wwM)ext.whatWorked=wwM[1].trim();
  const learnM=t.match(/Learning:?\s*([\s\S]+?)(?:\n\s*(?:Tags|What Worked|Act 2|Target|Entry|System):|$)/i);if(learnM)ext.learning=learnM[1].trim();
  const journalM=t.match(/Journal:?\s*([\s\S]+?)(?:\n\s*(?:Tags|Learning|What Worked):|$)/i);if(journalM)ext.journal=journalM[1].trim();
  const tagsM=t.match(/Tags:\s*(.+?)$/im);if(tagsM)ext.tags=tagsM[1].trim().split(/\s+/).map(t=>t.replace(/^#/,""));
  const entryTM=t.match(/Entry:.*?@\s*(\d+:\d+)/i);if(entryTM)ext.entryTime=entryTM[1];
  const playM=t.match(/(One-Act|Two-Act)/i);if(playM)ext.playType=playM[1];
  return ext;
}

function resultColor(r){return r==="WIN"?C.green:r==="LOSS"?C.red:C.textMuted;}
function resultEmoji(r){return r==="WIN"?"🤑":r==="LOSS"?"🤬":"😐";}
function formatDate(d){if(!d)return"";try{return new Date(d+"T12:00:00").toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"});}catch{return d;}}

// ── SHARED UI ─────────────────────────────────────────────────────
function Card({children,style={}}){
  return <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:16,...style}}>{children}</div>;
}
function SLabel({children,color=C.teal}){
  return <div style={{color,fontFamily:"'Space Mono',monospace",fontSize:11,fontWeight:700,letterSpacing:"0.15em",textTransform:"uppercase",marginBottom:10}}>{children}</div>;
}
function Divider(){return <div style={{height:1,background:C.border,margin:"12px 0"}}/>;}

// ── DASHBOARD PAGE ────────────────────────────────────────────────
function DashboardPage({trades, onNavigate}){
  const [botData,setBotData]=useState(null);
  const [time,setTime]=useState(new Date());

  useEffect(()=>{
    fetch("/morning_brief.json?t="+Date.now()).then(r=>r.json()).then(setBotData).catch(()=>{});
    const t=setInterval(()=>setTime(new Date()),60000);
    return()=>clearInterval(t);
  },[]);

  const traded=trades.filter(t=>t.result!=="SKIP");
  const wins=traded.filter(t=>t.result==="WIN");

  // Streak
  let streak=0,streakType=null;
  const sorted=[...traded].sort((a,b)=>(b.day||0)-(a.day||0));
  for(const t of sorted){if(!streakType)streakType=t.result;if(t.result===streakType)streak++;else break;}

  // This week
  const now=new Date();
  const weekStart=new Date(now);weekStart.setDate(now.getDate()-now.getDay());
  const weekTrades=traded.filter(t=>t.date&&new Date(t.date+"T12:00:00")>=weekStart);
  const weekPnL=weekTrades.reduce((s,t)=>s+(t.pnl||0),0);
  const weekW=weekTrades.filter(t=>t.result==="WIN").length;
  const weekL=weekTrades.filter(t=>t.result==="LOSS").length;

  // 30 day win rate
  const d30=new Date(now);d30.setDate(now.getDate()-30);
  const last30=traded.filter(t=>t.date&&new Date(t.date+"T12:00:00")>=d30);
  const wr30=last30.length?Math.round(last30.filter(t=>t.result==="WIN").length/last30.length*100):0;

  // Last trade
  const lastTrade=sorted[0];

  // Market status
  const h=now.getHours(),m=now.getMinutes(),dow=now.getDay();
  const isWeekend=dow===0||dow===6;
  const totalMin=h*60+m;
  // PST offset (UTC-7 in PDT)
  const pstH=new Date(now.getTime()-7*3600000).getHours();
  const pstM=new Date(now.getTime()-7*3600000).getMinutes();
  const pstTotal=pstH*60+pstM;
  let marketStatus="CLOSED",marketColor=C.textMuted;
  if(!isWeekend){
    if(pstTotal>=390&&pstTotal<750){marketStatus="OPEN";marketColor=C.green;}
    else if(pstTotal>=60&&pstTotal<390){marketStatus="PRE-MARKET";marketColor=C.gold;}
    else if(pstTotal>=750&&pstTotal<840){marketStatus="AFTER-HOURS";marketColor=C.blue;}
  }

  const gex=botData?.gex;

  return(
    <div style={{display:"flex",flexDirection:"column",gap:20}}>
      {/* Hero — Logo + Glow Title */}
      <div style={{textAlign:"center",padding:"32px 20px 24px",display:"flex",flexDirection:"column",alignItems:"center",gap:16}}>
        <StealthLogo size={72}/>
        <GlowTitle/>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <div style={{width:6,height:6,borderRadius:"50%",background:marketColor,boxShadow:`0 0 8px ${marketColor}`}}/>
          <span style={{color:marketColor,fontFamily:"'Space Mono',monospace",fontSize:11,fontWeight:700,letterSpacing:"0.15em"}}>{marketStatus}</span>
          <span style={{color:C.textDim,fontSize:11}}>{now.toLocaleDateString("en-US",{weekday:"short",month:"short",day:"numeric"})}</span>
        </div>
      </div>

      {/* Streak */}
      {streak>0&&(
        <div style={{background:streakType==="WIN"?C.green+"12":C.red+"12",border:`1px solid ${streakType==="WIN"?C.green:C.red}30`,borderRadius:12,padding:"14px 18px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div>
            <div style={{color:C.textMuted,fontSize:10,letterSpacing:"0.12em",textTransform:"uppercase",marginBottom:4}}>Current Streak</div>
            <div style={{color:streakType==="WIN"?C.green:C.red,fontFamily:"'Space Mono',monospace",fontSize:22,fontWeight:700}}>
              {streak} {streakType==="WIN"?"WIN":"LOSS"}{streak>1?"S":""} {streakType==="WIN"?"🤑":"🤬"}
            </div>
          </div>
          <div style={{fontSize:36}}>{streakType==="WIN"?"🤑":"🤬"}</div>
        </div>
      )}

      {/* Stats row */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}}>
        {[
          ["30D WIN RATE",`${wr30}%`,wr30>60?C.green:wr30>40?C.gold:C.red],
          ["THIS WEEK",`${weekW}W/${weekL}L`,weekPnL>=0?C.green:C.red],
          ["DAYS LOGGED",`${trades.length}`,C.teal],
        ].map(([label,val,color])=>(
          <div key={label} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:10,padding:"12px 10px",textAlign:"center"}}>
            <div style={{color:C.textMuted,fontSize:9,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:6}}>{label}</div>
            <div style={{color,fontFamily:"'Space Mono',monospace",fontSize:16,fontWeight:700}}>{val}</div>
            {label==="THIS WEEK"&&<div style={{color:weekPnL>=0?C.green:C.red,fontSize:10,marginTop:2}}>{weekPnL>=0?"+":""}${weekPnL.toFixed(0)}</div>}
          </div>
        ))}
      </div>

      {/* Signal Map snapshot */}
      <div onClick={()=>onNavigate("signals")} style={{background:C.card,border:`1px solid ${C.purple}40`,borderRadius:12,padding:"14px 16px",cursor:"pointer"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:gex?.flip_level?10:0}}>
          <span style={{color:C.purple,fontFamily:"'Space Mono',monospace",fontSize:11,fontWeight:700,letterSpacing:"0.1em"}}>⚡ SIGNAL MAP</span>
          <span style={{color:C.purple,fontSize:12}}>→</span>
        </div>
        {gex?.flip_level?(
          <div style={{display:"flex",gap:16,flexWrap:"wrap"}}>
            <div><span style={{color:C.textMuted,fontSize:11}}>Flip </span><span style={{color:C.gold,fontFamily:"'Space Mono',monospace",fontSize:13,fontWeight:700}}>{gex.flip_level}</span></div>
            {gex.call_walls?.[0]&&<div><span style={{color:C.textMuted,fontSize:11}}>Calls max </span><span style={{color:C.green,fontFamily:"'Space Mono',monospace",fontSize:13,fontWeight:700}}>{gex.call_walls[0].strike}</span></div>}
            {gex.king_nodes?.[0]&&<div><span style={{color:C.textMuted,fontSize:11}}>Puts target </span><span style={{color:C.red,fontFamily:"'Space Mono',monospace",fontSize:13,fontWeight:700}}>{gex.king_nodes[0].strike}</span></div>}
            <div><span style={{color:gex.regime==="NEGATIVE"?C.red:C.green,fontSize:10,fontFamily:"'Space Mono',monospace"}}>{gex.regime}</span></div>
          </div>
        ):(
          <div style={{color:C.textDim,fontSize:12}}>Bot runs at 6AM PST</div>
        )}
      </div>

      {/* Last trade */}
      {lastTrade&&(
        <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:"14px 16px"}}>
          <div style={{color:C.textMuted,fontSize:10,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:8}}>Last Trade</div>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div>
              <div style={{color:C.textMain,fontFamily:"'Space Mono',monospace",fontSize:13,fontWeight:700}}>Day {lastTrade.day} · {formatDate(lastTrade.date)}</div>
              <div style={{color:C.textMuted,fontSize:11,marginTop:3}}>{lastTrade.direction} · {lastTrade.grade} · {lastTrade.result}</div>
            </div>
            <div style={{textAlign:"right"}}>
              <div style={{color:resultColor(lastTrade.result),fontFamily:"'Space Mono',monospace",fontSize:18,fontWeight:700}}>{resultEmoji(lastTrade.result)}</div>
              {lastTrade.pct>0&&<div style={{color:resultColor(lastTrade.result),fontSize:12}}>+{lastTrade.pct}%</div>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── SIGNAL MAP PAGE ───────────────────────────────────────────────
function SignalMapPage(){
  const [gex,setGex]=useState({});
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState(null);
  const [lastRefresh,setLastRefresh]=useState(null);

  const fetchGex=useCallback(()=>{
    setLoading(true);setError(null);
    fetch("/morning_brief.json?t="+Date.now())
      .then(r=>r.json())
      .then(d=>{
        if(d.gex?.flip_level){setGex(d.gex);setLastRefresh(new Date().toLocaleTimeString());}
        else setError("GEX data not available yet — bot runs at 6AM PST");
        setLoading(false);
      })
      .catch(e=>{setError(e.message);setLoading(false);});
  },[]);

  useEffect(()=>{fetchGex();},[fetchGex]);

  const safeKingNodes=gex.king_nodes||[];
  const safeCallWalls=gex.call_walls||[];
  const isNegative=gex.regime==="NEGATIVE";

  if(loading) return <div style={{color:C.textMuted,textAlign:"center",padding:60,fontFamily:"'Space Mono',monospace",fontSize:12}}>Loading Signal Map...</div>;

  if(error||!gex.flip_level) return(
    <div style={{display:"flex",flexDirection:"column",gap:14}}>
      <Card>
        <SLabel color={C.purple}>⚡ Signal Map</SLabel>
        <div style={{color:C.textMuted,fontSize:13,textAlign:"center",padding:30,lineHeight:1.8}}>
          {error||"GEX data not available yet."}<br/>
          <span style={{fontSize:11,color:C.textDim}}>Bot runs at 6AM PST</span>
        </div>
        <button onClick={fetchGex} style={{background:C.surface||C.bg,border:`1px solid ${C.purple}40`,borderRadius:6,padding:"10px",color:C.purple,fontSize:12,cursor:"pointer",width:"100%",marginTop:8}}>↻ Check for data</button>
      </Card>
    </div>
  );

  const maxAbsGex=Math.max(...safeCallWalls.map(w=>Math.abs(w.gex||0)),...safeKingNodes.map(n=>Math.abs(n.gex||0)),1);

  return(
    <div style={{display:"flex",flexDirection:"column",gap:14}}>
      <Card style={{borderColor:C.purple+"40",padding:0,overflow:"hidden"}}>
        {/* Header */}
        <div style={{padding:"14px 16px",borderBottom:`1px solid ${C.border}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div>
            <div style={{color:C.purple,fontFamily:"'Space Mono',monospace",fontSize:14,fontWeight:700}}>⚡ SIGNAL MAP</div>
            <div style={{color:C.textMuted,fontSize:10,marginTop:2}}>IWM · {new Date().toLocaleDateString("en-US",{month:"short",day:"numeric"})}</div>
          </div>
          <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:4}}>
            <button onClick={fetchGex} style={{background:"none",border:`1px solid ${C.purple}30`,borderRadius:5,padding:"4px 10px",color:C.purple,fontSize:10,cursor:"pointer"}}>↻ Refresh</button>
            {lastRefresh&&<span style={{color:C.textDim,fontSize:9}}>{lastRefresh}</span>}
          </div>
        </div>

        {/* Calls above */}
        {safeCallWalls.length>0&&(
          <div style={{padding:"12px 16px",borderBottom:`1px solid ${C.border}30`}}>
            <div style={{color:C.green,fontSize:10,fontFamily:"'Space Mono',monospace",letterSpacing:"0.1em",marginBottom:10}}>▲ ABOVE · CALLS RESISTANCE</div>
            {safeCallWalls.map((w,i)=>(
              <div key={i} style={{display:"flex",alignItems:"center",gap:10,marginBottom:i<safeCallWalls.length-1?8:0}}>
                <div style={{width:52,color:C.textMain,fontFamily:"'Space Mono',monospace",fontSize:13,fontWeight:700,flexShrink:0}}>{w.strike}</div>
                <div style={{flex:1,height:5,background:C.border,borderRadius:3,overflow:"hidden"}}>
                  <div style={{width:`${Math.min((Math.abs(w.gex||0)/maxAbsGex)*100,100)}%`,height:"100%",background:C.green+"80",borderRadius:3}}/>
                </div>
                <div style={{color:C.green,fontFamily:"'Space Mono',monospace",fontSize:11,minWidth:56,textAlign:"right"}}>{w.gex>0?"+":""}{w.gex}M</div>
                <div style={{color:C.textDim,fontSize:9,minWidth:48,textAlign:"right"}}>{i===0?"WALL":""}</div>
              </div>
            ))}
          </div>
        )}

        {/* Flip divider — thin and prominent */}
        <div style={{padding:"10px 16px",background:C.gold+"10",borderTop:`1px solid ${C.gold}40`,borderBottom:`1px solid ${C.gold}40`,display:"flex",alignItems:"center",gap:12}}>
          <div style={{flex:1,height:1,background:C.gold+"40"}}/>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <span style={{color:C.gold,fontFamily:"'Space Mono',monospace",fontSize:11,fontWeight:700}}>FLIP</span>
            <span style={{color:C.gold,fontFamily:"'Space Mono',monospace",fontSize:18,fontWeight:700}}>{gex.flip_level}</span>
            <span style={{background:isNegative?C.red+"20":C.green+"20",color:isNegative?C.red:C.green,border:`1px solid ${isNegative?C.red:C.green}40`,borderRadius:4,padding:"2px 6px",fontSize:9,fontFamily:"'Space Mono',monospace",fontWeight:700,letterSpacing:"0.1em"}}>{isNegative?"NEG":"POS"}</span>
          </div>
          <div style={{flex:1,height:1,background:C.gold+"40"}}/>
        </div>

        {/* Puts below */}
        {safeKingNodes.length>0&&(
          <div style={{padding:"12px 16px"}}>
            <div style={{color:C.red,fontSize:10,fontFamily:"'Space Mono',monospace",letterSpacing:"0.1em",marginBottom:10}}>▼ BELOW · PUTS TARGETS</div>
            {safeKingNodes.map((n,i)=>{
              const isKing=Math.abs(n.gex||0)>20;
              const isMagnet=gex.magnet?.strike===n.strike;
              return(
                <div key={i} style={{display:"flex",alignItems:"center",gap:10,marginBottom:i<safeKingNodes.length-1?8:0}}>
                  <div style={{width:52,color:C.textMain,fontFamily:"'Space Mono',monospace",fontSize:13,fontWeight:700,flexShrink:0,display:"flex",alignItems:"center",gap:4}}>
                    {n.strike}
                  </div>
                  <div style={{flex:1,height:5,background:C.border,borderRadius:3,overflow:"hidden"}}>
                    <div style={{width:`${Math.min((Math.abs(n.gex||0)/maxAbsGex)*100,100)}%`,height:"100%",background:isKing?C.gold+"90":C.red+"60",borderRadius:3}}/>
                  </div>
                  <div style={{color:C.red,fontFamily:"'Space Mono',monospace",fontSize:11,minWidth:56,textAlign:"right"}}>{n.gex}M</div>
                  <div style={{color:isMagnet?C.gold:isKing?C.gold:C.textDim,fontSize:9,minWidth:48,textAlign:"right",fontWeight:isMagnet||isKing?700:400}}>
                    {isMagnet?"🧲":isKing?"👑 KING":""}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Trade Targets */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
        <Card style={{borderColor:C.green+"30"}}>
          <div style={{color:C.textMuted,fontSize:9,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:6}}>Calls Max</div>
          <div style={{color:C.green,fontFamily:"'Space Mono',monospace",fontSize:22,fontWeight:700}}>{safeCallWalls[0]?.strike||"—"}</div>
          <div style={{color:C.textDim,fontSize:10,marginTop:4}}>GEX wall — resistance</div>
        </Card>
        <Card style={{borderColor:C.red+"30"}}>
          <div style={{color:C.textMuted,fontSize:9,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:6}}>Puts Target</div>
          <div style={{color:C.red,fontFamily:"'Space Mono',monospace",fontSize:22,fontWeight:700}}>
            {safeKingNodes[0]?.strike||"—"}{safeKingNodes[1]?.strike?` → ${safeKingNodes[1].strike}`:""}
          </div>
          <div style={{color:C.textDim,fontSize:10,marginTop:4}}>King node — magnet</div>
        </Card>
      </div>

      {/* Regime note */}
      <Card style={{borderColor:isNegative?C.red+"30":C.green+"30"}}>
        <div style={{color:isNegative?C.red:C.green,fontFamily:"'Space Mono',monospace",fontWeight:700,fontSize:12,marginBottom:6}}>
          {isNegative?"NEGATIVE GAMMA":"POSITIVE GAMMA"}
        </div>
        <div style={{color:C.textMuted,fontSize:12,lineHeight:1.6}}>
          {isNegative?"Below flip — dealers amplify moves. Downside targets are magnetic.":"Above flip — dealers slow moves near key strikes. Pinning behavior likely."}
        </div>
      </Card>
    </div>
  );
}

// ── CALENDAR PAGE ─────────────────────────────────────────────────
function CalendarPage({trades,onSelectDay}){
  const [cur,setCur]=useState(()=>{const n=new Date();return{year:n.getFullYear(),month:n.getMonth()};});
  const {year,month}=cur;
  const MONTHS=["January","February","March","April","May","June","July","August","September","October","November","December"];
  const firstDay=new Date(year,month,1).getDay();
  const daysInMonth=new Date(year,month+1,0).getDate();
  const byDate=useMemo(()=>{const m={};trades.forEach(t=>{if(t.date)m[t.date]=t;});return m;},[trades]);
  const monthTrades=useMemo(()=>trades.filter(t=>{if(!t.date||t.result==="SKIP")return false;const d=new Date(t.date+"T12:00:00");return d.getFullYear()===year&&d.getMonth()===month;}),[trades,year,month]);
  const monthPnL=monthTrades.reduce((s,t)=>s+(t.pnl||0),0);
  const monthWins=monthTrades.filter(t=>t.result==="WIN").length;
  const monthLosses=monthTrades.filter(t=>t.result==="LOSS").length;
  const bestPnL=Math.max(...monthTrades.filter(t=>t.result==="WIN"&&t.pnl>0).map(t=>t.pnl),0);
  const weeks=[];let week=new Array(firstDay).fill(null);
  for(let d=1;d<=daysInMonth;d++){week.push(d);if(week.length===7||d===daysInMonth){while(week.length<7)week.push(null);weeks.push([...week]);week=[];}}
  const weekPnL=wk=>{let t=0;wk.forEach(d=>{if(!d)return;const ds=`${year}-${String(month+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;const tr=byDate[ds];if(tr)t+=tr.pnl||0;});return t;};
  const today=new Date();
  const todayStr=`${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,"0")}-${String(today.getDate()).padStart(2,"0")}`;
  return(
    <div>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14,flexWrap:"wrap",gap:8}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <button onClick={()=>setCur(p=>{const d=new Date(p.year,p.month-1);return{year:d.getFullYear(),month:d.getMonth()};})} style={{background:"none",border:"none",color:C.textMuted,fontSize:22,cursor:"pointer",padding:"2px 6px"}}>‹</button>
          <span style={{fontFamily:"'Space Mono',monospace",fontSize:14,fontWeight:700,color:C.textMain}}>{MONTHS[month]} {year}</span>
          <button onClick={()=>setCur(p=>{const d=new Date(p.year,p.month+1);return{year:d.getFullYear(),month:d.getMonth()};})} style={{background:"none",border:"none",color:C.textMuted,fontSize:22,cursor:"pointer",padding:"2px 6px"}}>›</button>
        </div>
        <div style={{textAlign:"right"}}>
          <div style={{color:monthPnL>=0?C.green:C.red,fontFamily:"'Space Mono',monospace",fontSize:15,fontWeight:700}}>{monthPnL>=0?"+":""}${monthPnL.toFixed(2)}</div>
          <div style={{color:C.textMuted,fontSize:11}}>{monthWins}W/{monthLosses}L</div>
        </div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr) 48px",gap:2,marginBottom:2}}>
        {["S","M","T","W","T","F","S"].map((d,i)=><div key={i} style={{color:C.textMuted,fontSize:10,textAlign:"center",padding:"4px 0",fontFamily:"'Space Mono',monospace"}}>{d}</div>)}
        <div style={{color:C.textMuted,fontSize:10,textAlign:"center",padding:"4px 0",fontFamily:"'Space Mono',monospace"}}>Wk</div>
      </div>
      {weeks.map((wk,wi)=>{
        const wPnL=weekPnL(wk);
        return(<div key={wi} style={{display:"grid",gridTemplateColumns:"repeat(7,1fr) 48px",gap:2,marginBottom:2}}>
          {wk.map((d,di)=>{
            if(!d)return<div key={di} style={{background:C.surface||C.bg,borderRadius:5,aspectRatio:"1",opacity:0.3}}/>;
            const dateStr=`${year}-${String(month+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
            const trade=byDate[dateStr];const isToday=dateStr===todayStr;
            const isBest=trade&&trade.result==="WIN"&&trade.pnl===bestPnL&&bestPnL>0;
            const bgColor=!trade?C.card:isBest?C.gold+"20":trade.result==="WIN"?C.green+"15":trade.result==="LOSS"?C.red+"15":C.card;
            const borderColor=isToday?C.teal:!trade?C.border:isBest?C.gold:trade.result==="WIN"?C.green+"50":trade.result==="LOSS"?C.red+"50":C.border;
            return(<div key={di} onClick={()=>trade&&onSelectDay(trade)}
              style={{background:bgColor,border:`1px solid ${borderColor}`,borderRadius:5,padding:"3px",cursor:trade?"pointer":"default",display:"flex",flexDirection:"column",justifyContent:"space-between",overflow:"hidden",aspectRatio:"1"}}>
              <div style={{color:isToday?C.teal:C.textMuted,fontFamily:"'Space Mono',monospace",fontSize:9,lineHeight:1}}>{d}</div>
              {trade&&trade.result!=="SKIP"&&(
                <div style={{textAlign:"center"}}>
                  <div style={{color:isBest?C.gold:trade.pnl>=0?C.green:C.red,fontFamily:"'Space Mono',monospace",fontSize:10,fontWeight:700,lineHeight:1.1,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{trade.pnl>=0?"+":""}${trade.pnl}</div>
                </div>
              )}
            </div>);
          })}
          <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:5,display:"flex",flexDirection:"column",justifyContent:"center",alignItems:"center",padding:2}}>
            <div style={{color:wPnL>=0?C.green:C.red,fontFamily:"'Space Mono',monospace",fontSize:9,fontWeight:700,whiteSpace:"nowrap"}}>{wPnL>=0?"+":""}${Math.abs(wPnL)}</div>
          </div>
        </div>);
      })}
    </div>
  );
}

// ── DAY MODAL ─────────────────────────────────────────────────────
function DayModal({trade,onClose,onEdit,onDelete}){
  if(!trade)return null;
  const wrongDir=trade.correctDirection&&trade.direction!==trade.correctDirection&&trade.correctDirection!=="SKIP";
  return(
    <div style={{position:"fixed",inset:0,zIndex:300,background:"rgba(0,0,0,0.85)",display:"flex",alignItems:"flex-end"}} onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} style={{background:C.card,borderRadius:"16px 16px 0 0",padding:22,width:"100%",maxHeight:"92vh",overflowY:"auto",border:`1px solid ${C.border}`}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:16}}>
          <div>
            <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
              <span style={{color:C.textMain,fontFamily:"'Space Mono',monospace",fontSize:18,fontWeight:700}}>Day {trade.day}</span>
              <span style={{color:C.textMuted,fontSize:13}}>{formatDate(trade.date)}</span>
              <span style={{background:resultColor(trade.result)+"20",color:resultColor(trade.result),border:`1px solid ${resultColor(trade.result)}40`,borderRadius:4,padding:"2px 8px",fontSize:11,fontWeight:700}}>{trade.result}</span>
              <span style={{fontSize:18}}>{resultEmoji(trade.result)}</span>
            </div>
          </div>
          <button onClick={onClose} style={{background:"none",border:"none",color:C.textMuted,fontSize:22,cursor:"pointer"}}>×</button>
        </div>
        {trade.result!=="SKIP"&&(
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
            <div style={{background:C.surface||C.bg,borderRadius:8,padding:"10px 12px"}}>
              <div style={{color:C.textMuted,fontSize:10,marginBottom:2}}>Direction</div>
              <div style={{color:trade.direction?.includes("CALLS")?C.green:C.red,fontFamily:"'Space Mono',monospace",fontSize:14,fontWeight:700}}>{trade.direction}</div>
            </div>
            <div style={{background:C.surface||C.bg,borderRadius:8,padding:"10px 12px"}}>
              <div style={{color:C.textMuted,fontSize:10,marginBottom:2}}>Result</div>
              <div style={{color:trade.pnl>=0?C.green:C.red,fontFamily:"'Space Mono',monospace",fontSize:14,fontWeight:700}}>{trade.pct>0?`+${trade.pct}%`:""} ${trade.pnl}</div>
            </div>
          </div>
        )}
        <Divider/>
        {trade.whatWorked&&<div style={{marginBottom:12}}><span style={{color:C.green,fontSize:13,fontWeight:700}}>What Worked: </span><span style={{color:C.textMain,fontSize:13,lineHeight:1.6}}>{trade.whatWorked}</span></div>}
        {trade.learning&&<div style={{marginBottom:12}}><span style={{color:C.blue,fontSize:13,fontWeight:700}}>Learning: </span><span style={{color:C.textMain,fontSize:13,lineHeight:1.6}}>{trade.learning}</span></div>}
        {trade.journal&&<div style={{marginBottom:14}}><div style={{color:C.textMuted,fontSize:11,marginBottom:6,textTransform:"uppercase",letterSpacing:"0.1em"}}>Journal</div><div style={{color:C.textMuted,fontSize:13,lineHeight:1.7,whiteSpace:"pre-wrap"}}>{trade.journal}</div></div>}
        {trade.tags?.length>0&&<div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:16}}>{trade.tags.map(t=><span key={t} style={{background:C.teal+"15",color:C.teal,border:`1px solid ${C.teal}30`,borderRadius:4,padding:"2px 8px",fontSize:11}}>#{t}</span>)}</div>}
        <div style={{display:"grid",gridTemplateColumns:"1fr auto",gap:10}}>
          <button onClick={onEdit} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:10,padding:"13px",color:C.textMain,fontSize:14,cursor:"pointer"}}>✏️ Edit</button>
          <button onClick={onDelete} style={{background:C.red+"15",border:`1px solid ${C.red}40`,borderRadius:10,padding:"13px 18px",color:C.red,fontSize:18,cursor:"pointer"}}>🗑</button>
        </div>
      </div>
    </div>
  );
}

// ── TRADE LOG PAGE (search-first) ─────────────────────────────────
function TradePage({trades,setTrades,editTrade,setEditTrade}){
  const [search,setSearch]=useState("");
  const [filter,setFilter]=useState({result:"",grade:"",direction:"",lightning:""});
  const [showFilters,setShowFilters]=useState(false);
  const [showLog,setShowLog]=useState(false);
  const [eodText,setEodText]=useState("");
  const [parsed,setParsed]=useState(null);
  const [selectedTrade,setSelectedTrade]=useState(null);
  const [editMode,setEditMode]=useState(false);
  const [saved,setSaved]=useState(false);
  const [showBrowse,setShowBrowse]=useState(false);

  const blank={day:"",date:"",direction:"CALLS",correctDirection:"CALLS",result:"WIN",pnl:0,pct:0,grade:"A",whatWorked:"",learning:"",journal:"",tags:[]};
  const [form,setForm]=useState(blank);

  useEffect(()=>{if(editTrade){setForm(editTrade);setEditMode(true);setShowLog(true);}},[ editTrade]);

  const filteredTrades=useMemo(()=>{
    let t=[...trades].sort((a,b)=>(b.day||0)-(a.day||0));
    if(search){
      const q=search.toLowerCase();
      t=t.filter(tr=>
        String(tr.day||"").includes(q)||
        (tr.date||"").includes(q)||
        (tr.result||"").toLowerCase().includes(q)||
        (tr.direction||"").toLowerCase().includes(q)||
        (tr.grade||"").toLowerCase().includes(q)||
        (tr.whatWorked||"").toLowerCase().includes(q)||
        (tr.learning||"").toLowerCase().includes(q)||
        (tr.journal||"").toLowerCase().includes(q)||
        (tr.tags||[]).some(tag=>tag.toLowerCase().includes(q))||
        (tr.volToday||"").toLowerCase().includes(q)||
        String(tr.pct||"").includes(q)
      );
    }
    if(filter.result)t=t.filter(tr=>tr.result===filter.result);
    if(filter.grade)t=t.filter(tr=>tr.grade===filter.grade);
    if(filter.direction)t=t.filter(tr=>(tr.direction||"").includes(filter.direction));
    return t;
  },[trades,search,filter]);

  const handleParse=()=>{
    const ext=parseEOD(eodText);
    setParsed(ext);
    setForm(p=>({...p,...ext,eodSummary:eodText}));
  };

  const handleSave=async()=>{
    const trade={...form,day:parseInt(form.day)||trades.length+1,pnl:parseFloat(form.pnl)||0,pct:parseFloat(form.pct)||0};
    let updated;
    if(editTrade){updated=trades.map(t=>t.day===editTrade.day?trade:t);}
    else{updated=[...trades.filter(t=>t.day!==trade.day),trade].sort((a,b)=>a.day-b.day);}
    setTrades(updated);
    await storageSave(updated);
    setSaved(true);setTimeout(()=>setSaved(false),2000);
    if(editTrade)setEditTrade(null);
    setForm(blank);setEodText("");setParsed(null);setShowLog(false);setEditMode(false);
  };

  const s={background:C.card,border:`1px solid ${C.border}`,borderRadius:8,padding:"10px 12px",color:C.textMain,fontSize:13,width:"100%",boxSizing:"border-box",fontFamily:"inherit"};
  const activeFilters=Object.values(filter).filter(Boolean).length;

  return(
    <div style={{display:"flex",flexDirection:"column",gap:0}}>
      {/* Search bar */}
      <div style={{position:"sticky",top:0,background:C.bg,paddingBottom:12,zIndex:10}}>
        <div style={{display:"flex",gap:8,alignItems:"center"}}>
          <div style={{flex:1,position:"relative"}}>
            <span style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",color:C.textMuted,fontSize:16}}>🔍</span>
            <input
              value={search}
              onChange={e=>setSearch(e.target.value)}
              placeholder="Search trades..."
              style={{...s,paddingLeft:38,fontSize:14,height:44}}
            />
            {search&&<button onClick={()=>setSearch("")} style={{position:"absolute",right:10,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",color:C.textMuted,cursor:"pointer",fontSize:16}}>×</button>}
          </div>
          <button onClick={()=>setShowFilters(!showFilters)}
            style={{background:activeFilters>0?C.teal+"20":C.card,border:`1px solid ${activeFilters>0?C.teal:C.border}`,borderRadius:8,padding:"0 14px",height:44,color:activeFilters>0?C.teal:C.textMuted,fontSize:12,cursor:"pointer",whiteSpace:"nowrap",flexShrink:0}}>
            Filter{activeFilters>0?` (${activeFilters})`:""}
          </button>
          <button onClick={()=>{setShowLog(true);setEditMode(false);setForm(blank);setEodText("");setParsed(null);}}
            style={{background:C.green+"15",border:`1px solid ${C.green}40`,borderRadius:8,padding:"0 14px",height:44,color:C.green,fontSize:18,cursor:"pointer",flexShrink:0}}>+</button>
        </div>

        {/* Filters */}
        {showFilters&&(
          <div style={{marginTop:10,display:"flex",flexWrap:"wrap",gap:6}}>
            {[
              {key:"result",opts:["WIN","LOSS","SKIP"]},
              {key:"grade",opts:["A+","A","B+"]},
              {key:"direction",opts:["CALLS","PUTS"]},
            ].map(({key,opts})=>(
              <select key={key} value={filter[key]} onChange={e=>setFilter(p=>({...p,[key]:e.target.value}))}
                style={{...s,width:"auto",padding:"6px 10px",fontSize:12,flex:1}}>
                <option value="">{key.charAt(0).toUpperCase()+key.slice(1)}: All</option>
                {opts.map(o=><option key={o} value={o}>{o}</option>)}
              </select>
            ))}
            {activeFilters>0&&<button onClick={()=>setFilter({result:"",grade:"",direction:"",lightning:""})} style={{background:"none",border:`1px solid ${C.border}`,borderRadius:6,padding:"6px 10px",color:C.textMuted,fontSize:11,cursor:"pointer"}}>Clear</button>}
          </div>
        )}

        {/* Count + browse toggle */}
        <div style={{marginTop:10,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <span style={{color:C.textMuted,fontSize:12}}>
            {search||activeFilters>0?`${filteredTrades.length} results`:`${trades.length} entries`}
          </span>
          {!search&&!activeFilters&&(
            <button onClick={()=>setShowBrowse(!showBrowse)} style={{background:"none",border:"none",color:C.textMuted,fontSize:12,cursor:"pointer"}}>
              {showBrowse?"Hide all ▲":"Browse all ▼"}
            </button>
          )}
        </div>
      </div>

      {/* Results */}
      {(search||activeFilters>0||showBrowse)&&(
        <div style={{display:"flex",flexDirection:"column",gap:2}}>
          {filteredTrades.length===0&&(
            <div style={{color:C.textDim,textAlign:"center",padding:40,fontSize:13}}>No trades found</div>
          )}
          {filteredTrades.map(tr=>(
            <div key={tr.day} onClick={()=>setSelectedTrade(tr)}
              style={{display:"flex",alignItems:"center",gap:12,padding:"12px 14px",background:C.card,border:`1px solid ${C.border}`,borderRadius:10,cursor:"pointer",marginBottom:2}}>
              <div style={{color:resultColor(tr.result),fontSize:18,flexShrink:0}}>{resultEmoji(tr.result)}</div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{display:"flex",alignItems:"baseline",gap:8,flexWrap:"wrap"}}>
                  <span style={{color:C.textMain,fontFamily:"'Space Mono',monospace",fontSize:12,fontWeight:700}}>Day {tr.day}</span>
                  <span style={{color:C.textMuted,fontSize:11}}>{formatDate(tr.date)}</span>
                  {tr.grade&&<span style={{color:tr.grade==="A+"?C.gold:tr.grade==="A"?C.green:C.blue,fontSize:10,fontFamily:"'Space Mono',monospace"}}>{tr.grade}</span>}
                </div>
                <div style={{color:C.textMuted,fontSize:11,marginTop:2}}>{tr.direction} · {tr.result}</div>
              </div>
              <div style={{textAlign:"right",flexShrink:0}}>
                {tr.pnl!==0&&<div style={{color:resultColor(tr.result),fontFamily:"'Space Mono',monospace",fontSize:12,fontWeight:700}}>{tr.pnl>=0?"+":""}${tr.pnl}</div>}
                {tr.pct>0&&<div style={{color:resultColor(tr.result),fontSize:10}}>+{tr.pct}%</div>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Log Trade Panel */}
      {showLog&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.85)",zIndex:200,display:"flex",alignItems:"flex-end"}} onClick={()=>{}}>
          <div style={{background:C.card,borderRadius:"16px 16px 0 0",padding:22,width:"100%",maxHeight:"92vh",overflowY:"auto",border:`1px solid ${C.border}`}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
              <span style={{color:C.textMain,fontFamily:"'Space Mono',monospace",fontSize:15,fontWeight:700}}>{editMode?"EDIT TRADE":"LOG NEW TRADE"}</span>
              <button onClick={()=>{setShowLog(false);setEditMode(false);setEditTrade&&setEditTrade(null);}} style={{background:"none",border:"none",color:C.textMuted,fontSize:22,cursor:"pointer"}}>×</button>
            </div>

            {!editMode&&(
              <>
                <div style={{color:C.textMuted,fontSize:12,marginBottom:8}}>Paste your EOD summary</div>
                <textarea value={eodText} onChange={e=>setEodText(e.target.value)}
                  placeholder="Paste EOD summary here..."
                  style={{...s,height:120,resize:"vertical",fontFamily:"'Space Mono',monospace",fontSize:11,lineHeight:1.5}}/>
                <button onClick={handleParse} style={{marginTop:8,marginBottom:16,background:C.gold+"15",border:`1px solid ${C.gold}40`,borderRadius:8,padding:"11px",color:C.gold,fontSize:13,fontWeight:700,cursor:"pointer",width:"100%"}}>
                  Parse EOD →
                </button>
                {parsed&&(
                  <div style={{marginBottom:12,display:"flex",flexWrap:"wrap",gap:5}}>
                    {Object.entries(parsed).filter(([k,v])=>v&&k!=="tags").slice(0,10).map(([k,v])=>(
                      <span key={k} style={{background:C.surface||C.bg,borderRadius:4,padding:"2px 7px",fontSize:10}}>
                        <span style={{color:C.textMuted}}>{k}: </span>
                        <span style={{color:C.teal,fontWeight:700}}>{String(v).slice(0,20)}</span>
                      </span>
                    ))}
                  </div>
                )}
              </>
            )}

            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                <div><label style={{color:C.textMuted,fontSize:11,display:"block",marginBottom:4}}>Day #</label><input style={s} type="number" value={form.day} onChange={e=>setForm(p=>({...p,day:e.target.value}))} placeholder="128"/></div>
                <div><label style={{color:C.textMuted,fontSize:11,display:"block",marginBottom:4}}>Date</label><input style={s} type="date" value={form.date} onChange={e=>setForm(p=>({...p,date:e.target.value}))}/></div>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                <div><label style={{color:C.textMuted,fontSize:11,display:"block",marginBottom:4}}>Result</label>
                  <select style={s} value={form.result} onChange={e=>setForm(p=>({...p,result:e.target.value}))}>
                    {["WIN","LOSS","SKIP"].map(r=><option key={r}>{r}</option>)}
                  </select>
                </div>
                <div><label style={{color:C.textMuted,fontSize:11,display:"block",marginBottom:4}}>Grade</label>
                  <select style={s} value={form.grade} onChange={e=>setForm(p=>({...p,grade:e.target.value}))}>
                    {["A+","A","B+","Skip"].map(g=><option key={g}>{g}</option>)}
                  </select>
                </div>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                <div><label style={{color:C.textMuted,fontSize:11,display:"block",marginBottom:4}}>Direction</label>
                  <select style={s} value={form.direction} onChange={e=>setForm(p=>({...p,direction:e.target.value}))}>
                    {["CALLS","PUTS","CALLS/PUTS","SKIP"].map(d=><option key={d}>{d}</option>)}
                  </select>
                </div>
                <div><label style={{color:C.textMuted,fontSize:11,display:"block",marginBottom:4}}>P&L %</label><input style={s} type="number" value={form.pct} onChange={e=>setForm(p=>({...p,pct:e.target.value}))}/></div>
              </div>
              <div><label style={{color:C.textMuted,fontSize:11,display:"block",marginBottom:4}}>What Worked</label>
                <textarea style={{...s,height:60,resize:"vertical",whiteSpace:"pre-wrap"}} value={form.whatWorked||""} onChange={e=>setForm(p=>({...p,whatWorked:e.target.value}))}/></div>
              <div><label style={{color:C.textMuted,fontSize:11,display:"block",marginBottom:4}}>Learning</label>
                <textarea style={{...s,height:60,resize:"vertical"}} value={form.learning||""} onChange={e=>setForm(p=>({...p,learning:e.target.value}))}/></div>
              <div><label style={{color:C.textMuted,fontSize:11,display:"block",marginBottom:4}}>Journal</label>
                <textarea style={{...s,height:90,resize:"vertical",whiteSpace:"pre-wrap",lineHeight:1.6}} value={form.journal||""} onChange={e=>setForm(p=>({...p,journal:e.target.value}))} placeholder={"Journal entry...\n\nLine breaks preserved."}/></div>
              <button onClick={handleSave}
                style={{background:saved?C.green+"25":C.teal+"15",border:`1px solid ${saved?C.green:C.teal}50`,borderRadius:10,padding:"14px",color:saved?C.green:C.teal,fontSize:14,fontWeight:700,cursor:"pointer"}}>
                {saved?"✅ Saved!":"💾 Save Trade"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Trade Detail Modal */}
      {selectedTrade&&(
        <DayModal
          trade={selectedTrade}
          onClose={()=>setSelectedTrade(null)}
          onEdit={()=>{setForm(selectedTrade);setEditMode(true);setShowLog(true);setSelectedTrade(null);}}
          onDelete={async()=>{
            const updated=trades.filter(t=>t.day!==selectedTrade.day);
            setTrades(updated);await storageSave(updated);setSelectedTrade(null);
          }}
        />
      )}
    </div>
  );
}

// ── ANALYTICS PAGE ────────────────────────────────────────────────
function AnalyticsPage({trades}){
  const traded=trades.filter(d=>d.result!=="SKIP");
  const wins=traded.filter(d=>d.result==="WIN");
  const wr=traded.length?Math.round(wins.length/traded.length*100):0;
  const totalPnL=trades.reduce((s,d)=>s+(d.pnl||0),0);
  const byGrade=["A+","A","B+"].map(g=>{const days=traded.filter(d=>d.grade===g);const w=days.filter(d=>d.result==="WIN");return{grade:g,total:days.length,wins:w.length,wr:days.length?Math.round(w.length/days.length*100):0};});
  const monthly={};trades.forEach(d=>{if(!d.date)return;const m=d.date.slice(0,7);if(!monthly[m])monthly[m]=0;monthly[m]+=d.pnl||0;});
  const monthlyData=Object.entries(monthly).sort().map(([m,p])=>({month:new Date(m+"-01").toLocaleDateString("en-US",{month:"short"}),pnl:Math.round(p)}));
  const callsDays=traded.filter(d=>d.direction?.includes("CALLS"));
  const putsDays=traded.filter(d=>d.direction?.includes("PUTS"));
  const callsWR=callsDays.length?Math.round(callsDays.filter(d=>d.result==="WIN").length/callsDays.length*100):0;
  const putsWR=putsDays.length?Math.round(putsDays.filter(d=>d.result==="WIN").length/putsDays.length*100):0;
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
          <ResponsiveContainer width="100%" height={140}>
            <BarChart data={monthlyData} margin={{top:0,right:0,bottom:0,left:-20}}>
              <XAxis dataKey="month" tick={{fill:C.textMuted,fontSize:10}} axisLine={false} tickLine={false}/>
              <YAxis tick={{fill:C.textMuted,fontSize:9}} axisLine={false} tickLine={false}/>
              <Tooltip contentStyle={{background:C.card,border:`1px solid ${C.border}`,borderRadius:8,color:C.textMain,fontSize:11}}/>
              <Bar dataKey="pnl" radius={3}>{monthlyData.map((d,i)=><Cell key={i} fill={d.pnl>=0?C.green:C.red} fillOpacity={0.8}/>)}</Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}
      <Card><SLabel>Grade Performance</SLabel>
        {byGrade.map(g=>(<div key={g.grade} style={{display:"flex",alignItems:"center",gap:12,marginBottom:10}}>
          <span style={{background:g.grade==="A+"?C.gold+"20":g.grade==="A"?C.green+"20":C.blue+"20",color:g.grade==="A+"?C.gold:g.grade==="A"?C.green:C.blue,border:`1px solid ${g.grade==="A+"?C.gold:g.grade==="A"?C.green:C.blue}40`,borderRadius:4,padding:"2px 8px",fontSize:11,fontWeight:700,minWidth:32,textAlign:"center"}}>{g.grade}</span>
          <div style={{flex:1,height:6,background:C.border,borderRadius:3,overflow:"hidden"}}><div style={{width:`${g.wr}%`,height:"100%",background:g.wr>60?C.green:g.wr>40?C.gold:C.red,borderRadius:3,transition:"width 0.5s"}}/></div>
          <span style={{color:C.textMain,fontFamily:"'Space Mono',monospace",fontSize:12,minWidth:36}}>{g.wr}%</span>
          <span style={{color:C.textMuted,fontSize:11}}>{g.wins}/{g.total}</span>
        </div>))}
      </Card>
      <Card><SLabel>Direction Split</SLabel>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          {[["CALLS",callsWR,callsDays,C.green],["PUTS",putsWR,putsDays,C.red]].map(([label,wr,days,color])=>(
            <div key={label} style={{textAlign:"center",padding:14,background:C.card,borderRadius:8,border:`1px solid ${color}25`}}>
              <div style={{color,fontFamily:"'Space Mono',monospace",fontSize:22,fontWeight:700}}>{wr}%</div>
              <div style={{color:C.textMuted,fontSize:10,marginTop:4}}>{label}</div>
              <div style={{color:C.textDim,fontSize:11}}>{days.filter(d=>d.result==="WIN").length}/{days.length}</div>
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
  const weekStart=new Date(now);weekStart.setDate(now.getDate()-now.getDay());
  const weekTrades=traded.filter(t=>t.date&&new Date(t.date+"T12:00:00")>=weekStart);
  const weekPnL=weekTrades.reduce((s,t)=>s+(t.pnl||0),0);
  const weekW=weekTrades.filter(t=>t.result==="WIN").length;
  const weekL=weekTrades.filter(t=>t.result==="LOSS").length;
  const monthStart=new Date(now.getFullYear(),now.getMonth(),1);
  const monthTrades=traded.filter(t=>t.date&&new Date(t.date+"T12:00:00")>=monthStart);
  const monthPnL=monthTrades.reduce((s,t)=>s+(t.pnl||0),0);
  const monthW=monthTrades.filter(t=>t.result==="WIN").length;
  const monthL=monthTrades.filter(t=>t.result==="LOSS").length;

  const nav=[
    {id:"dashboard",label:"Dashboard",icon:"⚡"},
    {id:"signals",label:"Signal Map",icon:"📊"},
    {id:"calendar",label:"Calendar",icon:"📅"},
    {id:"log",label:"Trade Log",icon:"📋"},
    {id:"analytics",label:"Stats",icon:"📈"},
  ];

  const handleNav=(id)=>{setPage(id);if(isMobile)onClose();};

  const sidebarContent=(
    <div style={{display:"flex",flexDirection:"column",height:"100%",overflow:"hidden"}}>
      {/* Logo header */}
      <div style={{padding:collapsed?"12px 0":"14px 16px",display:"flex",alignItems:"center",justifyContent:collapsed?"center":"space-between",borderBottom:`1px solid ${C.border}`,flexShrink:0,minHeight:56}}>
        {!collapsed&&(
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <StealthLogo size={24}/>
            <span style={{fontFamily:"'Space Mono',monospace",fontSize:11,fontWeight:700,color:C.textMain,letterSpacing:"0.08em",whiteSpace:"nowrap"}}>STEALTH SIGNALS</span>
          </div>
        )}
        {collapsed&&<StealthLogo size={22}/>}
        {!isMobile&&(
          <button onClick={()=>setCollapsed(!collapsed)}
            style={{background:"none",border:"none",color:C.textMuted,cursor:"pointer",fontSize:14,padding:2,flexShrink:0,lineHeight:1}}>
            {collapsed?"›":"‹"}
          </button>
        )}
        {isMobile&&(
          <button onClick={onClose} style={{background:"none",border:"none",color:C.textMuted,fontSize:20,cursor:"pointer"}}>×</button>
        )}
      </div>

      {/* Nav links */}
      <div style={{padding:"8px 6px",flexShrink:0}}>
        {nav.map(n=>(
          <button key={n.id} onClick={()=>handleNav(n.id)}
            style={{width:"100%",background:page===n.id?C.teal+"18":"none",border:`1px solid ${page===n.id?C.teal+"50":"transparent"}`,borderRadius:7,padding:collapsed?"9px 0":"8px 10px",color:page===n.id?C.teal:C.textMuted,fontSize:12,cursor:"pointer",display:"flex",alignItems:"center",gap:collapsed?0:8,justifyContent:collapsed?"center":"flex-start",marginBottom:2,transition:"all 0.15s"}}>
            <span style={{fontSize:14,flexShrink:0}}>{n.icon}</span>
            {!collapsed&&<span style={{fontFamily:"'DM Sans',sans-serif",fontWeight:page===n.id?700:400,whiteSpace:"nowrap"}}>{n.label}</span>}
          </button>
        ))}
      </div>

      {/* Stats (expanded only) */}
      {!collapsed&&(<>
        <div style={{height:1,background:C.border,margin:"4px 8px",flexShrink:0}}/>
        <div style={{padding:"0 8px",flex:1,overflowY:"auto"}}>
          {streak>0&&(
            <div style={{background:C.card,borderRadius:8,padding:"10px 12px",marginBottom:8,border:`1px solid ${C.border}`}}>
              <div style={{color:C.textMuted,fontSize:9,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:4}}>🔥 Streak</div>
              <div style={{color:streakType==="WIN"?C.green:C.red,fontFamily:"'Space Mono',monospace",fontSize:14,fontWeight:700}}>
                {streak} {streakType==="WIN"?"win":"loss"}{streak>1?"s":""} {streakType==="WIN"?"🤑":"🤬"}
              </div>
            </div>
          )}
          <div style={{background:C.card,borderRadius:8,padding:"10px 12px",marginBottom:8,border:`1px solid ${C.border}`}}>
            <div style={{color:C.textMuted,fontSize:9,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:4}}>This Week</div>
            {weekTrades.length>0?(<>
              <div style={{color:weekPnL>=0?C.green:C.red,fontFamily:"'Space Mono',monospace",fontSize:13,fontWeight:700}}>{weekPnL>=0?"+":""}${weekPnL.toFixed(0)}</div>
              <div style={{color:C.textMuted,fontSize:10,marginTop:1}}>{weekW}W/{weekL}L</div>
            </>):<div style={{color:C.textDim,fontSize:11}}>No trades</div>}
          </div>
          <div style={{background:C.card,borderRadius:8,padding:"10px 12px",marginBottom:8,border:`1px solid ${C.border}`}}>
            <div style={{color:C.textMuted,fontSize:9,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:4}}>This Month</div>
            {monthTrades.length>0?(<>
              <div style={{color:monthPnL>=0?C.green:C.red,fontFamily:"'Space Mono',monospace",fontSize:13,fontWeight:700}}>{monthPnL>=0?"+":""}${monthPnL.toFixed(0)}</div>
              <div style={{color:C.textMuted,fontSize:10,marginTop:1}}>{monthW}W/{monthL}L</div>
            </>):<div style={{color:C.textDim,fontSize:11}}>No trades</div>}
          </div>
          <div style={{color:C.textDim,fontSize:10,textAlign:"center",padding:"6px 0"}}>📅 {trades.length} days</div>
        </div>
        <div style={{padding:"10px 14px",borderTop:`1px solid ${C.border}`,color:C.textDim,fontSize:9,fontFamily:"'Space Mono',monospace",flexShrink:0}}>v2.30 · Stealth Signals</div>
      </>)}
    </div>
  );

  // Mobile overlay
  if(isMobile){
    if(!isOpen)return null;
    return(<>
      <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.75)",zIndex:200}}/>
      <div style={{position:"fixed",top:0,left:0,bottom:0,width:270,background:C.surface,borderRight:`1px solid ${C.border}`,zIndex:201,display:"flex",flexDirection:"column"}}>
        {sidebarContent}
      </div>
    </>);
  }

  // Desktop persistent
  return(
    <div style={{
      width:collapsed?52:220,minWidth:collapsed?52:220,
      background:C.surface,borderRight:`1px solid ${C.border}`,
      display:"flex",flexDirection:"column",
      height:"100vh",position:"sticky",top:0,
      transition:"width 0.2s ease,min-width 0.2s ease",
      overflow:"hidden",flexShrink:0,
    }}>
      {sidebarContent}
    </div>
  );
}

// ── ROOT APP ──────────────────────────────────────────────────────
export default function App(){
  const [page,setPage]=useState("dashboard");
  const [trades,setTrades]=useState([]);
  const [tradesLoaded,setTradesLoaded]=useState(false);
  const [selectedDay,setSelectedDay]=useState(null);
  const [editTrade,setEditTrade]=useState(null);
  const [sidebarOpen,setSidebarOpen]=useState(false);
  const [sidebarCollapsed,setSidebarCollapsed]=useState(false);
  const [isMobile,setIsMobile]=useState(window.innerWidth<768);

  useEffect(()=>{
    const fn=()=>setIsMobile(window.innerWidth<768);
    window.addEventListener("resize",fn);
    return()=>window.removeEventListener("resize",fn);
  },[]);

  useEffect(()=>{
    storageLoad().then(data=>{
      if(data&&Array.isArray(data)&&data.length>0)setTrades(data);
      setTradesLoaded(true);
    });
  },[]);

  useEffect(()=>{
    const handler=(e)=>setPage(e.detail);
    window.addEventListener("navigate",handler);
    return()=>window.removeEventListener("navigate",handler);
  },[]);

  const handleEdit=()=>{setEditTrade(selectedDay);setSelectedDay(null);setPage("log");};
  const handleDelete=async()=>{
    const updated=trades.filter(t=>t.day!==selectedDay?.day);
    setTrades(updated);await storageSave(updated);setSelectedDay(null);
  };

  return(
    <div style={{background:C.bg,minHeight:"100vh",color:C.textMain,fontFamily:"'DM Sans',-apple-system,sans-serif",display:"flex"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=DM+Sans:wght@400;500;700&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        html,body{background:#06090F;height:100%;}
        ::-webkit-scrollbar{width:4px;}
        ::-webkit-scrollbar-track{background:transparent;}
        ::-webkit-scrollbar-thumb{background:#1A2535;border-radius:2px;}
        input,select,textarea{outline:none;}
        input::placeholder,textarea::placeholder{color:#243040;}
        @media(prefers-reduced-motion:reduce){.glow-letter{animation:none!important;}}
      `}</style>

      {/* Sidebar */}
      <Sidebar
        trades={trades} page={page} setPage={setPage}
        isOpen={sidebarOpen} onClose={()=>setSidebarOpen(false)}
        collapsed={sidebarCollapsed} setCollapsed={setSidebarCollapsed}
        isMobile={isMobile}
      />

      {/* Main */}
      <div style={{flex:1,display:"flex",flexDirection:"column",minWidth:0,overflow:"hidden"}}>
        {/* Mobile header */}
        {isMobile&&(
          <div style={{background:C.surface,borderBottom:`1px solid ${C.border}`,padding:"12px 16px",display:"flex",alignItems:"center",justifyContent:"space-between",position:"sticky",top:0,zIndex:100,flexShrink:0}}>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <button onClick={()=>setSidebarOpen(true)} style={{background:"none",border:"none",cursor:"pointer",padding:"4px",display:"flex",flexDirection:"column",gap:4}}>
                <div style={{width:18,height:2,background:C.textMuted,borderRadius:1}}/>
                <div style={{width:18,height:2,background:C.textMuted,borderRadius:1}}/>
                <div style={{width:18,height:2,background:C.textMuted,borderRadius:1}}/>
              </button>
              <StealthLogo size={22}/>
              <span style={{fontFamily:"'Space Mono',monospace",fontSize:12,fontWeight:700,color:C.textMain}}>STEALTH SIGNALS</span>
            </div>
            <span style={{color:C.textDim,fontFamily:"'Space Mono',monospace",fontSize:9}}>v2.30</span>
          </div>
        )}

        {/* Page content */}
        <div style={{flex:1,overflowY:"auto",padding:isMobile?"16px":"20px 28px",maxWidth:isMobile?undefined:900,width:"100%"}}>
          {page==="dashboard"&&<DashboardPage trades={trades} onNavigate={setPage}/>}
          {page==="signals"&&<SignalMapPage/>}
          {page==="calendar"&&<CalendarPage trades={trades} onSelectDay={setSelectedDay}/>}
          {page==="log"&&<TradePage trades={trades} setTrades={setTrades} editTrade={editTrade} setEditTrade={setEditTrade}/>}
          {page==="analytics"&&<AnalyticsPage trades={trades}/>}
        </div>
      </div>

      {/* Day modal (calendar) */}
      {selectedDay&&(
        <DayModal trade={selectedDay} onClose={()=>setSelectedDay(null)} onEdit={handleEdit} onDelete={handleDelete}/>
      )}
    </div>
  );
}
