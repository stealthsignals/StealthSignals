import { useState, useEffect, useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

const C = {
  bg: "#080C12", surface: "#0F1520", card: "#131B28", border: "#1E2D42",
  teal: "#0ECFB0", gold: "#F4B942", green: "#10E870", red: "#FF3B5C",
  blue: "#4A9EFF", purple: "#9B6DFF", textMain: "#E8EDF5",
  textMuted: "#5A7494", textDim: "#2A3D55",
};

const INITIAL_TRADES = [
  { day: 1, date: "2025-12-09", direction: "CALLS", correctDirection: "CALLS", result: "WIN", pnl: -8, pct: -50, strat: "N/A", story: "Neutral Discovery", grade: "B+", playType: "Two-Act", range: "N/A", entryTime: "", exitTime: "", entryPrice: "", exitPrice: "", learning: "", journal: "", tags: ["Calls","NeutralDiscovery"] },
  { day: 2, date: "2025-12-10", direction: "SKIP", correctDirection: "SKIP", result: "SKIP", pnl: 0, pct: 0, strat: "FOMC", story: "FOMC Skip", grade: "Skip", playType: null, range: null, entryTime: "", exitTime: "", entryPrice: "", exitPrice: "", learning: "", journal: "", tags: ["Skip","FOMC"] },
  { day: 3, date: "2025-12-11", direction: "CALLS/PUTS", correctDirection: "CALLS", result: "WIN", pnl: 21, pct: 0, strat: "2up/2up", story: "Fight Story", grade: "A", playType: "Two-Act", range: "Wide 3.77", entryTime: "", exitTime: "", entryPrice: "", exitPrice: "", learning: "", journal: "", tags: ["TwoAct","FightStory"] },
  { day: 4, date: "2025-12-12", direction: "PUTS", correctDirection: "PUTS", result: "WIN", pnl: 0, pct: 0, strat: "2up/2up", story: "Puts A", grade: "A+", playType: "One-Act", range: "Tight 1.18", entryTime: "", exitTime: "", entryPrice: "", exitPrice: "", learning: "", journal: "", tags: ["Puts","PutsStoryA"] },
  { day: 8, date: "2025-12-18", direction: "PUTS", correctDirection: "PUTS", result: "WIN", pnl: 7, pct: 8, strat: "N/A", story: "Puts B", grade: "A", playType: "One-Act", range: "Mid 2.10", entryTime: "", exitTime: "", entryPrice: "", exitPrice: "", learning: "", journal: "", tags: ["Puts","PutsStoryB"] },
  { day: 9, date: "2025-12-19", direction: "PUTS", correctDirection: "CALLS", result: "LOSS", pnl: -70, pct: -70, strat: "N/A", story: "N/A", grade: "B+", playType: null, range: null, entryTime: "", exitTime: "", entryPrice: "", exitPrice: "", learning: "", journal: "", tags: ["Puts"] },
  { day: 10, date: "2025-12-22", direction: "CALLS", correctDirection: "CALLS", result: "WIN", pnl: 54, pct: 164, strat: "N/A", story: "N/A", grade: "A", playType: "One-Act", range: null, entryTime: "", exitTime: "", entryPrice: "", exitPrice: "", learning: "", journal: "", tags: ["Calls"] },
  { day: 11, date: "2025-12-23", direction: "PUTS", correctDirection: "PUTS", result: "WIN", pnl: 110, pct: 122, strat: "N/A", story: "N/A", grade: "A+", playType: "One-Act", range: null, entryTime: "", exitTime: "", entryPrice: "", exitPrice: "", learning: "", journal: "", tags: ["Puts"] },
  { day: 15, date: "2026-01-02", direction: "PUTS", correctDirection: "PUTS", result: "WIN", pnl: 272, pct: 148, strat: "N/A", story: "N/A", grade: "A+", playType: "One-Act", range: null, entryTime: "", exitTime: "", entryPrice: "", exitPrice: "", learning: "", journal: "", tags: ["Puts"] },
  { day: 16, date: "2026-01-05", direction: "CALLS", correctDirection: "CALLS", result: "WIN", pnl: 540, pct: 120, strat: "N/A", story: "N/A", grade: "A+", playType: "One-Act", range: null, entryTime: "", exitTime: "", entryPrice: "", exitPrice: "", learning: "", journal: "", tags: ["Calls"] },
  { day: 17, date: "2026-01-06", direction: "CALLS", correctDirection: "CALLS", result: "WIN", pnl: 168, pct: 20, strat: "N/A", story: "N/A", grade: "A", playType: "One-Act", range: null, entryTime: "", exitTime: "", entryPrice: "", exitPrice: "", learning: "", journal: "", tags: ["Calls"] },
  { day: 18, date: "2026-01-07", direction: "CALLS/PUTS", correctDirection: "PUTS", result: "LOSS", pnl: -617, pct: -70, strat: "N/A", story: "N/A", grade: "B+", playType: "Two-Act", range: null, entryTime: "", exitTime: "", entryPrice: "", exitPrice: "", learning: "", journal: "", tags: ["Calls","Puts"] },
  { day: 21, date: "2026-01-12", direction: "PUTS", correctDirection: "PUTS", result: "WIN", pnl: 16, pct: 15, strat: "N/A", story: "N/A", grade: "A", playType: "One-Act", range: null, entryTime: "", exitTime: "", entryPrice: "", exitPrice: "", learning: "", journal: "", tags: ["Puts"] },
  { day: 35, date: "2026-02-02", direction: "CALLS", correctDirection: "CALLS", result: "WIN", pnl: 66, pct: 194, strat: "N/A", story: "N/A", grade: "A+", playType: "One-Act", range: null, entryTime: "", exitTime: "", entryPrice: "", exitPrice: "", learning: "", journal: "", tags: ["Calls"] },
  { day: 39, date: "2026-02-09", direction: "CALLS", correctDirection: "CALLS", result: "WIN", pnl: 224, pct: 187, strat: "N/A", story: "N/A", grade: "A+", playType: "One-Act", range: null, entryTime: "", exitTime: "", entryPrice: "", exitPrice: "", learning: "", journal: "", tags: ["Calls"] },
  { day: 48, date: "2026-02-23", direction: "PUTS", correctDirection: "PUTS", result: "WIN", pnl: 66, pct: 236, strat: "N/A", story: "N/A", grade: "A+", playType: "One-Act", range: null, entryTime: "", exitTime: "", entryPrice: "", exitPrice: "", learning: "", journal: "", tags: ["Puts"] },
  { day: 49, date: "2026-02-24", direction: "CALLS", correctDirection: "CALLS", result: "WIN", pnl: 90, pct: 94, strat: "N/A", story: "N/A", grade: "A+", playType: "One-Act", range: null, entryTime: "", exitTime: "", entryPrice: "", exitPrice: "", learning: "", journal: "", tags: ["Calls"] },
  { day: 51, date: "2026-02-26", direction: "CALLS", correctDirection: "CALLS", result: "WIN", pnl: 124, pct: 207, strat: "N/A", story: "N/A", grade: "A+", playType: "One-Act", range: null, entryTime: "", exitTime: "", entryPrice: "", exitPrice: "", learning: "", journal: "", tags: ["Calls"] },
  { day: 60, date: "2026-03-30", direction: "PUTS", correctDirection: "PUTS", result: "WIN", pnl: 129, pct: 179, strat: "N/A", story: "Puts B", grade: "A+", playType: "One-Act", range: null, entryTime: "", exitTime: "", entryPrice: "", exitPrice: "", learning: "", journal: "", tags: ["Puts","PutsStoryB"] },
  { day: 61, date: "2026-04-02", direction: "CALLS", correctDirection: "CALLS", result: "WIN", pnl: 12, pct: 15, strat: "N/A", story: "Calls A", grade: "A", playType: "One-Act", range: null, entryTime: "", exitTime: "", entryPrice: "", exitPrice: "", learning: "", journal: "", tags: ["Calls","CallsStoryA"] },
  { day: 75, date: "2026-05-01", direction: "CALLS", correctDirection: "CALLS", result: "WIN", pnl: 12, pct: 18, strat: "2up/2up", story: "Calls A", grade: "B+", playType: "Two-Act", range: "Mid", entryTime: "", exitTime: "", entryPrice: "", exitPrice: "", learning: "", journal: "", tags: ["Calls","SplitVol"] },
  { day: 76, date: "2026-05-04", direction: "PUTS", correctDirection: "PUTS", result: "LOSS", pnl: -45, pct: -53, strat: "2dn/2dn", story: "Puts C", grade: "B+", playType: "Two-Act", range: "Mid", entryTime: "", exitTime: "", entryPrice: "", exitPrice: "", learning: "", journal: "", tags: ["Puts","SplitVol"] },
  { day: 77, date: "2026-05-05", direction: "PUTS", correctDirection: "PUTS", result: "LOSS", pnl: -77, pct: -69, strat: "2dn/2dn", story: "Puts C", grade: "B+", playType: "Two-Act", range: "Tight", entryTime: "", exitTime: "", entryPrice: "", exitPrice: "", learning: "", journal: "", tags: ["Puts","SplitVol"] },
  { day: 78, date: "2026-05-06", direction: "CALLS", correctDirection: "PUTS", result: "LOSS", pnl: -40, pct: -57, strat: "2up/2up", story: "N/A", grade: "B+", playType: null, range: "Tight", entryTime: "", exitTime: "", entryPrice: "", exitPrice: "", learning: "", journal: "", tags: ["Calls","Misclassified"] },
  { day: 79, date: "2026-05-07", direction: "CALLS", correctDirection: "PUTS", result: "LOSS", pnl: -45, pct: -60, strat: "2up/2up", story: "Puts A", grade: "A", playType: "One-Act", range: "Tight", entryTime: "", exitTime: "", entryPrice: "", exitPrice: "", learning: "", journal: "", tags: ["Calls","Misclassified"] },
  { day: 83, date: "2026-05-13", direction: "CALLS", correctDirection: "CALLS", result: "WIN", pnl: 1, pct: 6, strat: "2up/2up", story: "N/A", grade: "A", playType: "One-Act", range: "Tight", entryTime: "", exitTime: "", entryPrice: "", exitPrice: "", learning: "", journal: "", tags: ["Calls"] },
  { day: 84, date: "2026-05-14", direction: "PUTS", correctDirection: "PUTS", result: "WIN", pnl: 26, pct: 113, strat: "2dn/2dn", story: "Puts C", grade: "A", playType: "One-Act", range: "Mid", entryTime: "", exitTime: "", entryPrice: "", exitPrice: "", learning: "", journal: "", tags: ["Puts","PutsStoryC"] },
  { day: 111, date: "2026-05-19", direction: "PUTS", correctDirection: "PUTS", result: "WIN", pnl: 10, pct: 12, strat: "2dn/2dn", story: "Puts C", grade: "A+", playType: "One-Act", range: "Wide", entryTime: "", exitTime: "", entryPrice: "", exitPrice: "", learning: "", journal: "", tags: ["Puts","Capitulation"] },
  { day: 112, date: "2026-05-20", direction: "PUTS", correctDirection: "PUTS", result: "LOSS", pnl: -93, pct: -70, strat: "2dn/2dn", story: "N/A", grade: "B+", playType: null, range: "Wide", entryTime: "", exitTime: "", entryPrice: "", exitPrice: "", learning: "", journal: "", tags: ["Puts","Misclassified"] },
  { day: 113, date: "2026-05-21", direction: "CALLS", correctDirection: "CALLS", result: "WIN", pnl: 40, pct: 133, strat: "2up/2up", story: "Calls B", grade: "A+", playType: "One-Act", range: "Wide", entryTime: "6:30", exitTime: "8:45", entryPrice: "0.30", exitPrice: "0.70", learning: "Both vol surged + gap up above VAH = One-Act freight train.", journal: "", tags: ["Calls","CallsStoryB"] },
  { day: 114, date: "2026-05-22", direction: "CALLS", correctDirection: "PUTS", result: "LOSS", pnl: -40, pct: -54, strat: "2up/2up", story: "Calls B", grade: "A", playType: "One-Act", range: "Wide 2.89", entryTime: "6:30", exitTime: "7:15", entryPrice: "0.74", exitPrice: "0.34", learning: "AT ceiling + tight window = exit faster.", journal: "", tags: ["Calls","ATCeiling","TightWindow"] },
  { day: 115, date: "2026-05-26", direction: "CALLS", correctDirection: "CALLS", result: "WIN", pnl: 0, pct: 0, strat: "2up/2up", story: "Calls B", grade: "B+", playType: "One-Act", range: "Tight 0.98", entryTime: "", exitTime: "", entryPrice: "", exitPrice: "", learning: "", journal: "", tags: ["Calls"] },
  { day: 116, date: "2026-05-27", direction: "CALLS", correctDirection: "CALLS", result: "LOSS", pnl: -30, pct: -56, strat: "2up/2up", story: "Calls B", grade: "B+", playType: "One-Act", range: "Mid 1.94", entryTime: "6:30", exitTime: "6:44", entryPrice: "0.18", exitPrice: "0.08", learning: "Open above VAH + CVD diverging + slow pace = standard entry not early.", journal: "Struggling with entry timing.", tags: ["Calls","SlowPace"] },
  { day: 117, date: "2026-05-28", direction: "CALLS", correctDirection: "SKIP", result: "LOSS", pnl: -9, pct: -45, strat: "2up/2up", story: "Skip", grade: "Skip", playType: "Two-Act", range: "Mid 1.71", entryTime: "", exitTime: "", entryPrice: "", exitPrice: "", learning: "", journal: "", tags: ["Skip","SplitVol"] },
  { day: 118, date: "2026-05-29", direction: "PUTS", correctDirection: "PUTS", result: "WIN", pnl: 0, pct: 0, strat: "3-/3-", story: "Puts E", grade: "B+", playType: "One-Act", range: "Tight 0.90", entryTime: "6:30", exitTime: "7:25", entryPrice: "0.45", exitPrice: "1.12", learning: "Extreme High vars + gap down below VAL = One-Act liquidation.", journal: "", tags: ["Puts","Liquidation"] },
];

function Badge({ text, color = C.teal, small = false }) {
  return <span style={{ background: color+"22", color, border:`1px solid ${color}44`, borderRadius:4, padding: small?"1px 6px":"2px 8px", fontSize: small?10:11, fontWeight:700, letterSpacing:"0.05em", whiteSpace:"nowrap" }}>{text}</span>;
}
function Card({ children, style={} }) {
  return <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:16, ...style }}>{children}</div>;
}
function SLabel({ children, color=C.teal }) {
  return <div style={{ color, fontFamily:"'Space Mono', monospace", fontSize:11, fontWeight:700, letterSpacing:"0.15em", textTransform:"uppercase", marginBottom:10 }}>{children}</div>;
}
const inp = { background:"#0F1520", border:`1px solid #1E2D42`, borderRadius:8, color:"#E8EDF5", padding:"10px 14px", fontSize:14, width:"100%", boxSizing:"border-box", outline:"none", fontFamily:"inherit" };
const sel = {...inp};
const lbl = { color:"#5A7494", fontSize:11, letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:5, display:"block" };
function Row2({ children }) { return <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>{children}</div>; }
function resultColor(r) { return r==="WIN"?C.green:r==="LOSS"?C.red:C.textDim; }
function formatDate(ds) { if(!ds)return""; const d=new Date(ds+"T12:00:00"); return d.toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"}); }

function classify(v) {
  if(!v.priorClose||!v.open)return null;
  const gap=parseFloat(v.open)-parseFloat(v.priorClose);
  const gapDir=gap>0.33?"Up":gap<-0.33?"Down":"Flat";
  const gapAmt=Math.abs(gap).toFixed(2);
  let svpLocation="Unknown";
  if(v.vah&&v.val){
    if(parseFloat(v.open)>parseFloat(v.vah))svpLocation="Above VAH";
    else if(parseFloat(v.open)<parseFloat(v.val))svpLocation="Below VAL";
    else svpLocation="Inside VA";
  }
  let fvgZone="No FVG";
  if(v.pmh&&v.pml&&v.priorClose){
    if(gapDir==="Down"&&parseFloat(v.pmh)>parseFloat(v.priorClose))fvgZone=`${v.priorClose}–${v.pmh} (above open)`;
    else if(gapDir==="Up"&&parseFloat(v.pml)<parseFloat(v.priorClose))fvgZone=`${v.pml}–${v.priorClose} (below open)`;
  }
  const cp=parseFloat(v.closePercent);
  const cpZone=cp<=11?"Extreme Low":cp<=30?"Low":cp<=69?"Neutral":cp<=89?"High":"Extreme High";
  const dp=parseFloat(v.fiveDayPercent);
  const dpZone=dp<=20?"Extreme Low":dp<=35?"Low":dp<=75?"Neutral":dp<=89?"High":"Extreme High";
  let position="MID";
  if(v.pmh&&v.pml){const dC=Math.abs(parseFloat(v.pmh)-parseFloat(v.open));const dF=Math.abs(parseFloat(v.open)-parseFloat(v.pml));const closer=dC<dF?"ceiling":"floor";const dist=Math.min(dC,dF);position=dist<=0.20?`AT ${closer}`:dist<=1.50?`NEAR ${closer}`:"MID";}
  let playType="One-Act",playReason="";
  if(svpLocation==="Inside VA"){playType="Two-Act";playReason="Open inside value";}
  else{const eH=cpZone==="Extreme High"||dpZone==="Extreme High";const eL=cpZone==="Extreme Low"||dpZone==="Extreme Low";
    if(eH&&gapDir==="Up"){playType="Two-Act";playReason="Extreme High + gap up — bull trap";}
    else if(eH&&gapDir==="Down"&&svpLocation==="Below VAL"){playType="One-Act";playReason="Ceiling shattered — liquidation";}
    else if(eL&&gapDir==="Down"){playType="Two-Act";playReason="Extreme Low + gap down — bear trap risk";}
  }
  const strat=v.strat||"";
  let bias="SKIP";
  if(strat.includes("2up"))bias="CALLS";
  else if(strat.includes("2dn"))bias="PUTS";
  if(cpZone==="Extreme High"&&gapDir==="Down"&&svpLocation==="Below VAL")bias="PUTS";
  if(cpZone==="Extreme Low"&&gapDir==="Up"&&svpLocation==="Above VAH")bias="CALLS";
  const maxP=Math.max(parseFloat(v.iwmPace)||0,parseFloat(v.iwoPace)||0);
  const paceLabel=maxP>=90?"Explosive":maxP>=70?"Standard":"Slow";
  let grade="Skip";
  if(bias!=="SKIP"){if(paceLabel==="Explosive")grade="A+";else if((v.volChange||"").includes("Improved")||(v.volChange||"").includes("Surged"))grade="A";else grade="B+";}
  const entry=grade==="A+"?"Early 6:30–6:32":grade==="A"?"Standard 6:35–6:45":grade==="B+"?"Late 6:50–7:05":"N/A";
  let sweep="Nearest level";if(fvgZone!=="No FVG")sweep=`FVG: ${fvgZone}`;
  return{gap:`${gapDir} ${gapAmt}`,gapDir,svpLocation,fvgZone,cpZone,dpZone,position,playType,playReason,bias,grade,entry,sweep,paceLabel};
}

function parseEOD(text) {
  const extracted={};
  const dayMatch=text.match(/DAY\s+(\d+)/i);if(dayMatch)extracted.day=parseInt(dayMatch[1]);
  const dateMatch=text.match(/—\s+([A-Za-z]+ \d+,\s*\d+)/);
  if(dateMatch){const d=new Date(dateMatch[1]);if(!isNaN(d))extracted.date=d.toISOString().split("T")[0];}
  const stratMatch=text.match(/(2up\/2up|2dn\/2dn|3-|1-)/i);if(stratMatch)extracted.strat=stratMatch[1];
  const storyMatch=text.match(/\|\s*(Calls [A-E]|Puts [A-E]|No Story Match|Skip|Fight Story|Neutral Discovery)/i);if(storyMatch)extracted.story=storyMatch[1];
  const dirMatch=text.match(/Entry:\s*(CALLS|PUTS)/i);if(dirMatch)extracted.direction=dirMatch[1].toUpperCase();
  const closeMatch=text.match(/Close%\s+([\d.]+)%/i);if(closeMatch)extracted.closePercent=closeMatch[1];
  const fiveDMatch=text.match(/5D%\s+([\d.]+)%/i);if(fiveDMatch)extracted.fiveDayPercent=fiveDMatch[1];
  const gapMatch=text.match(/Gap:\s*(Up|Down|Flat)\s*([\+\-]?[\d.]+)/i);if(gapMatch)extracted.gap=`${gapMatch[1]} ${gapMatch[2]}`;
  const rangeMatch=text.match(/(Tight|Mid|Wide)\s+([\d.]+)/i);if(rangeMatch)extracted.range=`${rangeMatch[1]} ${rangeMatch[2]}`;
  const volMatch=text.match(/Today IWM\s+([\d.]+)%\s*\/\s*IWO\s+([\d.]+)%/i);if(volMatch)extracted.volToday=`IWM ${volMatch[1]}% / IWO ${volMatch[2]}%`;
  const openMatch=text.match(/Open[:\s]+([\d.]+)/i);if(openMatch)extracted.openPrice=openMatch[1];
  const learningMatch=text.match(/Learning:\s*(.+?)(?:\n|Tags:|$)/is);if(learningMatch)extracted.learning=learningMatch[1].trim();
  const tagsMatch=text.match(/Tags:\s*(.+?)$/im);if(tagsMatch)extracted.tags=tagsMatch[1].trim().split(/\s+/).map(t=>t.replace(/^#/,""));
  const entryTimeMatch=text.match(/Entry:.*?@\s*(\d+:\d+)/i);if(entryTimeMatch)extracted.entryTime=entryTimeMatch[1];
  const exitTimeMatch=text.match(/→\s*(?:HOD|LOD).*?@\s*(\d+:\d+)/i);if(exitTimeMatch)extracted.exitTime=exitTimeMatch[1];
  const gradeMatch=text.match(/\b(A\+|A|B\+)\b/);if(gradeMatch)extracted.grade=gradeMatch[1];
  const playMatch=text.match(/(One-Act|Two-Act)/i);if(playMatch)extracted.playType=playMatch[1];
  return extracted;
}

// ── CALENDAR ─────────────────────────────────────────────────────
function CalendarPage({trades,onSelectDay}){
  const [cur,setCur]=useState(()=>{const n=new Date();return{year:n.getFullYear(),month:n.getMonth()};});
  const {year,month}=cur;
  const MONTHS=["January","February","March","April","May","June","July","August","September","October","November","December"];
  const firstDay=new Date(year,month,1).getDay();
  const daysInMonth=new Date(year,month+1,0).getDate();
  const tradesByDate=useMemo(()=>{const m={};trades.forEach(t=>{if(t.date)m[t.date]=t;});return m;},[trades]);
  const monthTrades=useMemo(()=>trades.filter(t=>{if(!t.date||t.result==="SKIP")return false;const d=new Date(t.date+"T12:00:00");return d.getFullYear()===year&&d.getMonth()===month;}),[trades,year,month]);
  const monthPnL=monthTrades.reduce((s,t)=>s+(t.pnl||0),0);
  const monthWins=monthTrades.filter(t=>t.result==="WIN").length;
  const monthLosses=monthTrades.filter(t=>t.result==="LOSS").length;

  // Find best day of month
  const bestPnL=Math.max(...monthTrades.filter(t=>t.result==="WIN").map(t=>t.pnl||0),0);

  const weeks=[];
  let week=new Array(firstDay).fill(null);
  for(let d=1;d<=daysInMonth;d++){
    week.push(d);
    if(week.length===7||d===daysInMonth){while(week.length<7)week.push(null);weeks.push([...week]);week=[];}
  }
  const weekPnL=wk=>{let t=0;wk.forEach(d=>{if(!d)return;const ds=`${year}-${String(month+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;const tr=tradesByDate[ds];if(tr)t+=tr.pnl||0;});return t;};
  const weekTrades=wk=>{let t=0;wk.forEach(d=>{if(!d)return;const ds=`${year}-${String(month+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;if(tradesByDate[ds])t++;});return t;};
  const today=new Date();
  const todayStr=`${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,"0")}-${String(today.getDate()).padStart(2,"0")}`;

  // Mobile: show without week column, just 7 cols
  return(
    <div>
      {/* Header */}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14,flexWrap:"wrap",gap:8}}>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <button onClick={()=>setCur(p=>{const d=new Date(p.year,p.month-1);return{year:d.getFullYear(),month:d.getMonth()};})} style={{background:"none",border:"none",color:C.textMuted,fontSize:22,cursor:"pointer",padding:"4px 8px"}}>‹</button>
          <div style={{fontFamily:"'Space Mono', monospace",fontSize:16,fontWeight:700,color:C.textMain}}>{MONTHS[month]} {year}</div>
          <button onClick={()=>setCur(p=>{const d=new Date(p.year,p.month+1);return{year:d.getFullYear(),month:d.getMonth()};})} style={{background:"none",border:"none",color:C.textMuted,fontSize:22,cursor:"pointer",padding:"4px 8px"}}>›</button>
        </div>
        <div style={{textAlign:"right"}}>
          <div style={{display:"flex",alignItems:"baseline",gap:8}}>
            <span style={{color:monthPnL>=0?C.green:C.red,fontFamily:"'Space Mono', monospace",fontSize:17,fontWeight:700}}>{monthPnL>=0?"+":""}${monthPnL.toFixed(2)}</span>
          </div>
          <div style={{color:C.textMuted,fontSize:11}}>{monthWins}W/{monthLosses}L · {monthTrades.length} days</div>
        </div>
      </div>

      {/* Day headers */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:2,marginBottom:2}}>
        {["S","M","T","W","T","F","S"].map((d,i)=><div key={i} style={{color:C.textMuted,fontSize:10,textAlign:"center",padding:"4px 0",fontFamily:"'Space Mono', monospace"}}>{d}</div>)}
      </div>

      {/* Weeks */}
      {weeks.map((wk,wi)=>{
        const wPnL=weekPnL(wk);
        const wT=weekTrades(wk);
        return(
          <div key={wi} style={{marginBottom:2}}>
            <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:2}}>
              {wk.map((d,di)=>{
                if(!d)return<div key={di} style={{minHeight:60,background:C.surface+"30",borderRadius:6}}/>;
                const dateStr=`${year}-${String(month+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
                const trade=tradesByDate[dateStr];
                const isToday=dateStr===todayStr;
                const isBest=trade&&trade.result==="WIN"&&trade.pnl===bestPnL&&bestPnL>0;
                const bgColor=!trade?C.surface+"50":isBest?C.gold+"20":trade.result==="WIN"?C.green+"18":trade.result==="LOSS"?C.red+"18":C.surface+"50";
                const borderColor=isToday?C.teal:!trade?C.border:isBest?C.gold+"80":trade.result==="WIN"?C.green+"50":trade.result==="LOSS"?C.red+"50":C.border;
                return(
                  <div key={di} onClick={()=>trade&&onSelectDay(trade)}
                    style={{minHeight:60,background:bgColor,border:`1px solid ${borderColor}`,borderRadius:6,padding:"5px 6px",cursor:trade?"pointer":"default"}}>
                    <div style={{color:isToday?C.teal:C.textMuted,fontFamily:"'Space Mono', monospace",fontSize:10,marginBottom:3}}>{d}</div>
                    {trade&&trade.result!=="SKIP"&&(
                      <>
                        <div style={{color:isBest?C.gold:trade.pnl>=0?C.green:C.red,fontFamily:"'Space Mono', monospace",fontSize:11,fontWeight:700,lineHeight:1.2}}>
                          {trade.pnl>=0?"+":""}${trade.pnl}
                        </div>
                        {trade.pct!==0&&<div style={{color:isBest?C.gold+"bb":trade.pct>=0?C.green+"99":C.red+"99",fontSize:9,lineHeight:1.2}}>{trade.pct>=0?"+":""}{trade.pct}%</div>}
                      </>
                    )}
                    {trade&&trade.result==="SKIP"&&<div style={{color:C.textDim,fontSize:9}}>SKIP</div>}
                  </div>
                );
              })}
            </div>
            {/* Week summary bar */}
            <div style={{background:C.surface,borderRadius:"0 0 6px 6px",padding:"4px 10px",display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:1}}>
              <span style={{color:C.textMuted,fontSize:10,fontFamily:"'Space Mono', monospace"}}>Wk {wi+1} · {wT}d</span>
              <span style={{color:wPnL>=0?C.green:C.red,fontFamily:"'Space Mono', monospace",fontSize:11,fontWeight:700}}>{wPnL>=0?"+":""}${wPnL.toFixed(0)}</span>
            </div>
          </div>
        );
      })}
      <div style={{marginTop:12,display:"flex",alignItems:"center",gap:14,flexWrap:"wrap"}}>
        {[[C.gold,"Best day"],[C.green,"Win"],[C.red,"Loss"]].map(([c,l])=>(
          <div key={l} style={{display:"flex",alignItems:"center",gap:5}}><div style={{width:10,height:10,borderRadius:2,background:c+"30",border:`1px solid ${c}60`}}/><span style={{color:C.textMuted,fontSize:10}}>{l}</span></div>
        ))}
      </div>
    </div>
  );
}

// ── DAY MODAL ─────────────────────────────────────────────────────
function DayModal({trade,onClose,onEdit,onDelete}){
  if(!trade)return null;
  const wrongDir=trade.direction!==trade.correctDirection&&trade.correctDirection&&trade.correctDirection!=="SKIP";
  return(
    <div style={{position:"fixed",inset:0,zIndex:300,background:"rgba(0,0,0,0.85)",display:"flex",alignItems:"flex-end"}} onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} style={{background:C.card,borderRadius:"16px 16px 0 0",padding:22,width:"100%",maxHeight:"88vh",overflowY:"auto",border:`1px solid ${C.border}`}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:18}}>
          <div>
            <div style={{display:"flex",alignItems:"center",gap:10,flexWrap:"wrap",marginBottom:4}}>
              <span style={{color:C.textMain,fontFamily:"'Space Mono', monospace",fontSize:17,fontWeight:700}}>Day {trade.day}</span>
              <span style={{color:C.textMuted,fontSize:13}}>{formatDate(trade.date)}</span>
              <Badge text={trade.result} color={resultColor(trade.result)}/>
            </div>
          </div>
          <button onClick={onClose} style={{background:"none",border:"none",color:C.textMuted,fontSize:24,cursor:"pointer"}}>×</button>
        </div>

        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:16}}>
          {[["The Strat",trade.strat],["Play Type",trade.playType],["Range",trade.range],["Story",trade.story],["Grade",trade.grade]].filter(([,v])=>v&&v!=="N/A").map(([k,v])=>(
            <div key={k} style={{background:C.surface,borderRadius:8,padding:"10px 12px"}}>
              <div style={{color:C.textMuted,fontSize:10,marginBottom:3,textTransform:"uppercase"}}>{k}</div>
              <div style={{color:C.textMain,fontFamily:"'Space Mono', monospace",fontSize:12}}>{v}</div>
            </div>
          ))}
        </div>

        {trade.result!=="SKIP"&&(
          <div style={{background:C.surface,borderRadius:8,padding:"14px 16px",marginBottom:14}}>
            <div style={{color:C.teal,fontSize:11,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:12}}>Trade</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              <div>
                <div style={{color:C.textMuted,fontSize:10,marginBottom:3}}>YOU TOOK</div>
                <div style={{color:trade.direction.includes("CALLS")?C.green:C.red,fontWeight:700,fontSize:13}}>{trade.direction}</div>
              </div>
              {wrongDir?(
                <div>
                  <div style={{color:C.textMuted,fontSize:10,marginBottom:3}}>CORRECT BIAS</div>
                  <div style={{color:trade.correctDirection==="CALLS"?C.green:trade.correctDirection==="PUTS"?C.red:C.textMuted,fontWeight:700,fontSize:13}}>
                    {trade.correctDirection} ⚠️
                  </div>
                </div>
              ):(
                <div>
                  <div style={{color:C.textMuted,fontSize:10,marginBottom:3}}>CORRECT BIAS</div>
                  <div style={{color:C.green,fontWeight:700,fontSize:13}}>✅ Aligned</div>
                </div>
              )}
              <div><span style={{color:C.textMuted,fontSize:10}}>P/L </span><span style={{color:trade.pnl>=0?C.green:C.red,fontFamily:"'Space Mono', monospace",fontWeight:700}}>{trade.pnl>=0?"+":""}${trade.pnl} ({trade.pct>=0?"+":""}{trade.pct}%)</span></div>
              {trade.entryTime&&<div><span style={{color:C.textMuted,fontSize:10}}>Entry </span><span style={{color:C.textMain,fontFamily:"'Space Mono', monospace",fontSize:12}}>{trade.entryTime}{trade.entryPrice?` @ $${trade.entryPrice}`:""}</span></div>}
              {trade.exitTime&&<div><span style={{color:C.textMuted,fontSize:10}}>Exit </span><span style={{color:C.textMain,fontFamily:"'Space Mono', monospace",fontSize:12}}>{trade.exitTime}{trade.exitPrice?` @ $${trade.exitPrice}`:""}</span></div>}
            </div>
          </div>
        )}

        {trade.learning&&<div style={{marginBottom:14}}><div style={{color:C.blue,fontSize:11,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:6}}>Key Learning</div><div style={{color:C.textMain,fontSize:13,lineHeight:1.6}}>{trade.learning}</div></div>}
        {trade.journal&&<div style={{marginBottom:14}}><div style={{color:C.textMuted,fontSize:11,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:6}}>Daily Journal</div><div style={{color:C.textMuted,fontSize:13,lineHeight:1.6}}>{trade.journal}</div></div>}
        {trade.tags&&trade.tags.length>0&&<div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:18}}>{trade.tags.map(t=><Badge key={t} text={`#${t}`} color={C.teal} small/>)}</div>}

        <div style={{display:"grid",gridTemplateColumns:"1fr auto",gap:10}}>
          <button onClick={onEdit} style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:10,padding:"12px",color:C.textMain,fontSize:14,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>✏️ Edit Day</button>
          <button onClick={onDelete} style={{background:C.red+"15",border:`1px solid ${C.red}40`,borderRadius:10,padding:"12px 16px",color:C.red,fontSize:16,cursor:"pointer"}}>🗑</button>
        </div>
      </div>
    </div>
  );
}

// ── TRADE LOG PAGE ────────────────────────────────────────────────
function TradePage({trades,setTrades,editTrade,setEditTrade,setPage}){
  const blank={day:"",date:new Date().toISOString().split("T")[0],direction:"CALLS",correctDirection:"CALLS",result:"WIN",pnl:"",pct:"",strat:"2up/2up",story:"",grade:"A",playType:"One-Act",range:"",entryTime:"",exitTime:"",entryPrice:"",exitPrice:"",learning:"",journal:"",eodSummary:"",tags:[]};
  const [form,setForm]=useState(editTrade||blank);
  const [eodText,setEodText]=useState("");
  const [parsed,setParsed]=useState(null);
  const [missing,setMissing]=useState([]);
  const [saved,setSaved]=useState(false);
  const [showForm,setShowForm]=useState(!!editTrade);

  useEffect(()=>{if(editTrade){setForm(editTrade);setShowForm(true);setEodText(editTrade.eodSummary||"");}},[editTrade]);

  const setF=(k,v)=>setForm(p=>({...p,[k]:v}));

  const handleParse=()=>{
    const ext=parseEOD(eodText);
    setParsed(ext);
    setForm(p=>({...p,...ext,eodSummary:eodText}));
    // Check what's missing
    const needed=["day","date","direction","result","strat","grade"];
    const miss=needed.filter(k=>!ext[k]);
    setMissing(miss);
    setShowForm(true);
  };

  const handleSave=()=>{
    const trade={...form,pnl:parseFloat(form.pnl)||0,pct:parseFloat(form.pct)||0,day:parseInt(form.day)||trades.length+1,tags:typeof form.tags==="string"?form.tags.split(/\s+/).map(t=>t.replace(/^#/,"")).filter(Boolean):form.tags||[]};
    if(editTrade){setTrades(p=>p.map(t=>t.day===editTrade.day?trade:t));}
    else{setTrades(p=>[...p.filter(t=>t.day!==trade.day),trade].sort((a,b)=>a.day-b.day));}
    setEditTrade(null);setForm(blank);setEodText("");setParsed(null);setMissing([]);setSaved(true);setShowForm(false);
    setTimeout(()=>setSaved(false),3000);
  };

  return(
    <div style={{maxWidth:680,margin:"0 auto"}}>
      {saved&&<div style={{background:C.green+"20",border:`1px solid ${C.green}40`,borderRadius:10,padding:"12px 16px",marginBottom:16,color:C.green,fontFamily:"'Space Mono', monospace",fontSize:13}}>✅ Trade saved — calendar updated</div>}

      {/* PASTE SECTION — always visible */}
      <Card style={{marginBottom:14,borderColor:C.green+"40"}}>
        <SLabel color={C.green}>✂️ Paste EOD Summary — Auto-Extract</SLabel>
        {parsed&&(
          <div style={{background:C.surface,borderRadius:8,padding:"10px 14px",marginBottom:12,border:`1px solid ${C.green}30`}}>
            <div style={{color:C.green,fontSize:12,marginBottom:4}}>✅ Extracted: {Object.keys(parsed).join(", ")}</div>
            {missing.length>0&&<div style={{color:C.gold,fontSize:12}}>⚠ Please fill manually: {missing.join(", ")}</div>}
          </div>
        )}
        <textarea value={eodText} onChange={e=>setEodText(e.target.value)} placeholder="Paste your EOD summary here..." style={{...inp,minHeight:130,resize:"vertical",fontFamily:"'Space Mono', monospace",fontSize:12}}/>
        <button onClick={handleParse} style={{marginTop:10,width:"100%",background:C.green,border:"none",borderRadius:10,padding:"14px",color:"#000",fontSize:14,fontWeight:700,cursor:"pointer"}}>
          ✂️ Parse & Extract
        </button>
      </Card>

      {/* DATE + RESULT — always visible */}
      <Card style={{marginBottom:14}}>
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          <div><label style={lbl}>Date</label><input type="date" style={inp} value={form.date} onChange={e=>setF("date",e.target.value)}/></div>
          <div>
            <label style={lbl}>Trade Executed?</label>
            <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8}}>
              {["WIN","LOSS","SKIP","OBSERVE"].map(r=>(
                <button key={r} onClick={()=>setF("result",r)} style={{padding:"10px",background:form.result===r?resultColor(r)+"30":C.surface,border:`1px solid ${form.result===r?resultColor(r):C.border}`,borderRadius:8,color:form.result===r?resultColor(r):C.textMuted,fontSize:12,fontWeight:700,cursor:"pointer"}}>{r}</button>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* FULL FORM — appears after parse or edit */}
      {showForm&&(
        <>
          <Card style={{marginBottom:14}}>
            <SLabel>Direction</SLabel>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:12}}>
              <div>
                <label style={lbl}>You Traded</label>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
                  {["CALLS","PUTS"].map(d=>(
                    <button key={d} onClick={()=>setF("direction",d)} style={{padding:"10px",background:form.direction===d?(d==="CALLS"?C.green+"20":C.red+"20"):C.surface,border:`1px solid ${form.direction===d?(d==="CALLS"?C.green:C.red):C.border}`,borderRadius:8,color:form.direction===d?(d==="CALLS"?C.green:C.red):C.textMuted,fontSize:12,fontWeight:700,cursor:"pointer"}}>{d}</button>
                  ))}
                </div>
              </div>
              <div>
                <label style={lbl}>Correct Bias</label>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
                  {["CALLS","PUTS"].map(d=>(
                    <button key={d} onClick={()=>setF("correctDirection",d)} style={{padding:"10px",background:form.correctDirection===d?(d==="CALLS"?C.green+"20":C.red+"20"):C.surface,border:`1px solid ${form.correctDirection===d?(d==="CALLS"?C.green:C.red):C.border}`,borderRadius:8,color:form.correctDirection===d?(d==="CALLS"?C.green:C.red):C.textMuted,fontSize:12,fontWeight:700,cursor:"pointer"}}>{d}</button>
                  ))}
                </div>
              </div>
            </div>
          </Card>

          <Card style={{marginBottom:14}}>
            <SLabel>Classification</SLabel>
            <div style={{display:"flex",flexDirection:"column",gap:12}}>
              <Row2>
                <div><label style={lbl}>Day #</label><input style={inp} value={form.day} onChange={e=>setF("day",e.target.value)} placeholder="119"/></div>
                <div><label style={lbl}>The Strat</label><input style={inp} value={form.strat} onChange={e=>setF("strat",e.target.value)} placeholder="2up/2up"/></div>
              </Row2>
              <Row2>
                <div><label style={lbl}>Grade</label><select style={sel} value={form.grade} onChange={e=>setF("grade",e.target.value)}>{["A+","A","B+","Skip"].map(g=><option key={g}>{g}</option>)}</select></div>
                <div><label style={lbl}>Play Type</label><select style={sel} value={form.playType||"One-Act"} onChange={e=>setF("playType",e.target.value)}><option>One-Act</option><option>Two-Act</option></select></div>
              </Row2>
              <Row2>
                <div><label style={lbl}>Story Match</label><input style={inp} value={form.story} onChange={e=>setF("story",e.target.value)} placeholder="Calls A"/></div>
                <div><label style={lbl}>Range</label><input style={inp} value={form.range||""} onChange={e=>setF("range",e.target.value)} placeholder="Tight 0.90"/></div>
              </Row2>
            </div>
          </Card>

          <Card style={{marginBottom:14}}>
            <SLabel>Trade Details</SLabel>
            <div style={{display:"flex",flexDirection:"column",gap:12}}>
              <Row2>
                <div><label style={lbl}>Entry Time</label><input style={inp} value={form.entryTime} onChange={e=>setF("entryTime",e.target.value)} placeholder="6:31"/></div>
                <div><label style={lbl}>Exit Time</label><input style={inp} value={form.exitTime} onChange={e=>setF("exitTime",e.target.value)} placeholder="7:45"/></div>
              </Row2>
              <Row2>
                <div><label style={{...lbl,color:C.gold}}>Entry Price ($) *</label><input style={{...inp,border:`1px solid ${C.gold}60`}} value={form.entryPrice} onChange={e=>setF("entryPrice",e.target.value)} placeholder="0.45"/></div>
                <div><label style={{...lbl,color:C.gold}}>Exit Price ($) *</label><input style={{...inp,border:`1px solid ${C.gold}60`}} value={form.exitPrice} onChange={e=>setF("exitPrice",e.target.value)} placeholder="1.12"/></div>
              </Row2>
              <Row2>
                <div><label style={lbl}>P&L ($)</label><input style={inp} value={form.pnl} onChange={e=>setF("pnl",e.target.value)} placeholder="450 or -200"/></div>
                <div><label style={lbl}>P&L %</label><input style={inp} value={form.pct} onChange={e=>setF("pct",e.target.value)} placeholder="113 or -56"/></div>
              </Row2>
            </div>
          </Card>

          <Card style={{marginBottom:14}}>
            <SLabel>Notes</SLabel>
            <div style={{display:"flex",flexDirection:"column",gap:12}}>
              <div><label style={lbl}>Key Learning</label><textarea style={{...inp,minHeight:75,resize:"vertical"}} value={form.learning} onChange={e=>setF("learning",e.target.value)} placeholder="One clean sentence..."/></div>
              <div><label style={lbl}>Daily Journal</label><textarea style={{...inp,minHeight:75,resize:"vertical"}} value={form.journal} onChange={e=>setF("journal",e.target.value)} placeholder="Free thoughts on the day..."/></div>
              <div><label style={lbl}>Tags</label><input style={inp} value={Array.isArray(form.tags)?form.tags.map(t=>`#${t}`).join(" "):form.tags} onChange={e=>setF("tags",e.target.value.split(/\s+/).map(t=>t.replace(/^#/,"")).filter(Boolean))} placeholder="#Calls #SplitVol #ExtremeVars"/></div>
            </div>
          </Card>

          <button onClick={handleSave} style={{width:"100%",background:C.green,border:"none",borderRadius:12,padding:"16px",color:"#000",fontSize:16,fontWeight:700,cursor:"pointer",marginBottom:12}}>
            💾 Save Trade Log
          </button>
          {editTrade&&<button onClick={()=>{setEditTrade(null);setForm(blank);setShowForm(false);}} style={{width:"100%",background:C.surface,border:`1px solid ${C.border}`,borderRadius:12,padding:"14px",color:C.textMuted,fontSize:14,cursor:"pointer"}}>Cancel Edit</button>}
        </>
      )}
    </div>
  );
}

// ── CLASSIFY PAGE ─────────────────────────────────────────────────
function ClassifyPage(){
  const [vars,setVars]=useState({priorClose:"",open:"",pmh:"",pml:"",pdh:"",pdl:"",vah:"",poc:"",val:"",cvd:"",cvdDir:"Aligned",closePercent:"",fiveDayPercent:"",strat:"2up/2up",volChange:"Stayed",iwmVol:"",iwoVol:"",iwmPace:"",iwoPace:"",macro:"None",uty10:"",hyg:"",ivSkew:"N/A",callOI:"",putOI:"",fomc:false,cpi:false,geo:false,lowVol:false,wideRange:false});
  const set=(k,v)=>setVars(p=>({...p,[k]:v}));
  const result=useMemo(()=>classify(vars),[vars]);
  const anyFilter=vars.fomc||vars.cpi||vars.geo||vars.lowVol||vars.wideRange;
  const F=({label,k,placeholder=""})=><div><label style={lbl}>{label}</label><input style={inp} value={vars[k]} placeholder={placeholder} onChange={e=>set(k,e.target.value)}/></div>;
  return(
    <div style={{maxWidth:680,margin:"0 auto"}}>
      <Card style={{borderColor:anyFilter?C.red:C.border,marginBottom:14}}>
        <SLabel color={C.red}>⛔ Gate 1 — Hard Filters</SLabel>
        {[["fomc","FOMC Week"],["cpi","CPI / NFP / Core PCE in entry window"],["geo","Geopolitical active"],["lowVol","Both vol <60%"],["wideRange","PM range 4.50+ and both vars neutral"]].map(([k,label])=>(
          <label key={k} style={{display:"flex",alignItems:"center",gap:10,cursor:"pointer",marginBottom:8}}>
            <input type="checkbox" checked={vars[k]} onChange={e=>set(k,e.target.checked)} style={{width:16,height:16,accentColor:C.red}}/>
            <span style={{color:vars[k]?C.red:C.textMuted,fontSize:13}}>{label}</span>
          </label>
        ))}
        {anyFilter&&<div style={{marginTop:12,padding:"12px 16px",background:C.red+"15",borderRadius:8,border:`1px solid ${C.red}40`,color:C.red,fontWeight:700,fontFamily:"'Space Mono', monospace"}}>⛔ HARD STOP — DO NOT TRADE</div>}
      </Card>
      {!anyFilter&&(<>
        <Card style={{borderColor:C.blue+"60",marginBottom:14}}>
          <SLabel color={C.blue}>Q1 — What Is Happening?</SLabel>
          <div style={{display:"flex",flexDirection:"column",gap:12}}>
            <Row2><F label="Prior Close" k="priorClose" placeholder="292.02"/><F label="Open" k="open" placeholder="291.15"/></Row2>
            <Row2><F label="PMH" k="pmh" placeholder="292.27"/><F label="PML" k="pml" placeholder="291.37"/></Row2>
            <Row2><F label="PDH" k="pdh" placeholder="292.74"/><F label="PDL" k="pdl" placeholder="287.98"/></Row2>
            <Row2><F label="VAH" k="vah" placeholder="291.88"/><F label="POC" k="poc" placeholder="291.70"/></Row2>
            <F label="VAL" k="val" placeholder="291.53"/>
            {result&&vars.open&&(
              <div style={{padding:"12px 14px",background:C.surface,borderRadius:8,border:`1px solid ${C.blue}30`,display:"flex",gap:16,flexWrap:"wrap"}}>
                {[["GAP",result.gap,C.blue],["SVP",result.svpLocation,C.blue],["FVG",result.fvgZone,result.fvgZone==="No FVG"?C.textMuted:C.gold],["POS",result.position,C.blue]].map(([k,v,c])=>(
                  <div key={k}><span style={{color:C.textMuted,fontSize:11}}>{k} </span><span style={{color:c,fontFamily:"'Space Mono', monospace",fontSize:12,fontWeight:700}}>{v}</span></div>
                ))}
              </div>
            )}
          </div>
        </Card>
        <Card style={{borderColor:C.gold+"60",marginBottom:14}}>
          <SLabel color={C.gold}>Q2 — Where Does It Want To Go?</SLabel>
          <div style={{display:"flex",flexDirection:"column",gap:12}}>
            <Row2><F label="Close %" k="closePercent" placeholder="84.9"/><F label="5-Day %" k="fiveDayPercent" placeholder="95.5"/></Row2>
            <div><label style={lbl}>The Strat</label><select style={sel} value={vars.strat} onChange={e=>set("strat",e.target.value)}>{["2up/2up","2dn/2dn","3-","1-","Other"].map(s=><option key={s}>{s}</option>)}</select></div>
            {result&&vars.closePercent&&(
              <div style={{padding:"12px 14px",background:C.surface,borderRadius:8,border:`1px solid ${C.gold}30`}}>
                <div style={{display:"flex",gap:16,flexWrap:"wrap",marginBottom:8}}>
                  <div><span style={{color:C.textMuted,fontSize:11}}>CLOSE% </span><span style={{color:C.gold,fontFamily:"'Space Mono', monospace",fontWeight:700}}>{result.cpZone}</span></div>
                  <div><span style={{color:C.textMuted,fontSize:11}}>5D% </span><span style={{color:C.gold,fontFamily:"'Space Mono', monospace",fontWeight:700}}>{result.dpZone}</span></div>
                </div>
                <div style={{display:"flex",gap:8,alignItems:"center"}}>
                  <Badge text={result.playType} color={result.playType==="One-Act"?C.green:C.gold}/>
                  <span style={{color:C.textMuted,fontSize:12}}>{result.playReason}</span>
                </div>
              </div>
            )}
          </div>
        </Card>
        <Card style={{borderColor:C.green+"60",marginBottom:14}}>
          <SLabel color={C.green}>Q3 — What Does It Need To Get There?</SLabel>
          <div style={{display:"flex",flexDirection:"column",gap:12}}>
            <div><label style={lbl}>Vol Change</label><select style={sel} value={vars.volChange} onChange={e=>set("volChange",e.target.value)}>{["Improved","Dropped","Split","Stayed","Both Surged"].map(s=><option key={s}>{s}</option>)}</select></div>
            <Row2><F label="IWM Vol %" k="iwmVol" placeholder="90"/><F label="IWO Vol %" k="iwoVol" placeholder="154"/></Row2>
            <Row2><F label="IWM Pace %" k="iwmPace" placeholder="75.5"/><F label="IWO Pace %" k="iwoPace" placeholder="68.7"/></Row2>
            <Row2><F label="CVD" k="cvd" placeholder="+739"/><div><label style={lbl}>CVD Direction</label><select style={sel} value={vars.cvdDir} onChange={e=>set("cvdDir",e.target.value)}>{["Aligned","Diverging","Neutral"].map(s=><option key={s}>{s}</option>)}</select></div></Row2>
            <div><label style={lbl}>IV Skew (Pineify)</label><select style={sel} value={vars.ivSkew} onChange={e=>set("ivSkew",e.target.value)}>{["N/A","Bullish","Bearish","Dual-IV Explosion"].map(s=><option key={s}>{s}</option>)}</select></div>
            <Row2><F label="Call OI Strike" k="callOI" placeholder="293"/><F label="Put OI Strike" k="putOI" placeholder="290"/></Row2>
            <Row2><F label="UTY10" k="uty10" placeholder="2down"/><F label="HYG" k="hyg" placeholder="3-"/></Row2>
            <F label="Macro" k="macro" placeholder="None"/>
            {result&&vars.iwmPace&&(
              <div style={{padding:"10px 14px",background:C.surface,borderRadius:8,border:`1px solid ${C.green}30`}}>
                <span style={{color:C.textMuted,fontSize:11}}>PACE </span>
                <span style={{color:result.paceLabel==="Explosive"?C.green:result.paceLabel==="Standard"?C.blue:C.textMuted,fontFamily:"'Space Mono', monospace",fontWeight:700}}>{result.paceLabel}</span>
              </div>
            )}
          </div>
        </Card>
        {result&&vars.open&&(
          <Card style={{borderColor:result.bias==="CALLS"?C.green:result.bias==="PUTS"?C.red:C.textMuted,background:result.bias==="CALLS"?C.green+"08":result.bias==="PUTS"?C.red+"08":C.card}}>
            <SLabel color={result.bias==="CALLS"?C.green:result.bias==="PUTS"?C.red:C.textMuted}>⚡ Output</SLabel>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:14}}>
              <div><div style={{color:C.textMuted,fontSize:11,marginBottom:4}}>BIAS</div><div style={{color:result.bias==="CALLS"?C.green:result.bias==="PUTS"?C.red:C.textMuted,fontFamily:"'Space Mono', monospace",fontSize:22,fontWeight:700}}>{result.bias==="CALLS"?"🟢":result.bias==="PUTS"?"🔴":"⬜"} {result.bias}</div></div>
              <div><div style={{color:C.textMuted,fontSize:11,marginBottom:4}}>GRADE</div><div style={{color:result.grade==="A+"?C.gold:result.grade==="A"?C.green:C.blue,fontFamily:"'Space Mono', monospace",fontSize:22,fontWeight:700}}>{result.grade}</div></div>
              <div><div style={{color:C.textMuted,fontSize:11,marginBottom:4}}>ENTRY</div><div style={{color:C.textMain,fontFamily:"'Space Mono', monospace",fontSize:12}}>{result.entry}</div></div>
              <div><div style={{color:C.textMuted,fontSize:11,marginBottom:4}}>PLAY TYPE</div><Badge text={result.playType} color={result.playType==="One-Act"?C.green:C.gold}/></div>
            </div>
            <div><div style={{color:C.textMuted,fontSize:11,marginBottom:4}}>SWEEP ZONE</div><div style={{color:C.textMain,fontFamily:"'Space Mono', monospace",fontSize:12}}>{result.sweep}</div></div>
          </Card>
        )}
      </>)}
    </div>
  );
}

// ── ANALYTICS ────────────────────────────────────────────────────
function AnalyticsPage({trades}){
  const traded=trades.filter(d=>d.result!=="SKIP");
  const wins=traded.filter(d=>d.result==="WIN");
  const wr=traded.length?Math.round(wins.length/traded.length*100):0;
  const totalPnL=trades.reduce((s,d)=>s+(d.pnl||0),0);
  const byGrade=["A+","A","B+"].map(g=>{const days=traded.filter(d=>d.grade===g);const w=days.filter(d=>d.result==="WIN");return{grade:g,total:days.length,wins:w.length,wr:days.length?Math.round(w.length/days.length*100):0};});
  const oneAct=traded.filter(d=>d.playType==="One-Act");
  const twoAct=traded.filter(d=>d.playType==="Two-Act");
  const oaWR=oneAct.length?Math.round(oneAct.filter(d=>d.result==="WIN").length/oneAct.length*100):0;
  const taWR=twoAct.length?Math.round(twoAct.filter(d=>d.result==="WIN").length/twoAct.length*100):0;

  // Direction alignment stat
  const misaligned=traded.filter(d=>d.correctDirection&&d.direction!==d.correctDirection&&d.correctDirection!=="SKIP");
  const aligned=traded.filter(d=>!d.correctDirection||d.direction===d.correctDirection||d.correctDirection==="SKIP");

  const monthly={};
  trades.forEach(d=>{if(!d.date)return;const m=d.date.slice(0,7);if(!monthly[m])monthly[m]=0;monthly[m]+=d.pnl||0;});
  const monthlyData=Object.entries(monthly).map(([m,p])=>({month:new Date(m+"-01").toLocaleDateString("en-US",{month:"short"}),pnl:p}));

  return(
    <div style={{display:"flex",flexDirection:"column",gap:16}}>
      <Card>
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:16,textAlign:"center"}}>
          <div><div style={{color:wr>50?C.green:C.red,fontFamily:"'Space Mono', monospace",fontSize:26,fontWeight:700}}>{wr}%</div><div style={{color:C.textMuted,fontSize:10,textTransform:"uppercase"}}>Win Rate</div></div>
          <div><div style={{color:totalPnL>=0?C.green:C.red,fontFamily:"'Space Mono', monospace",fontSize:20,fontWeight:700}}>{totalPnL>=0?"+":""}${totalPnL}</div><div style={{color:C.textMuted,fontSize:10,textTransform:"uppercase"}}>Total P&L</div></div>
          <div><div style={{color:C.teal,fontFamily:"'Space Mono', monospace",fontSize:26,fontWeight:700}}>{trades.length}</div><div style={{color:C.textMuted,fontSize:10,textTransform:"uppercase"}}>Days</div></div>
        </div>
      </Card>
      <Card>
        <SLabel>Monthly P&L</SLabel>
        <ResponsiveContainer width="100%" height={150}>
          <BarChart data={monthlyData}><XAxis dataKey="month" tick={{fill:C.textMuted,fontSize:10}} axisLine={false} tickLine={false}/><YAxis tick={{fill:C.textMuted,fontSize:10}} axisLine={false} tickLine={false}/><Tooltip contentStyle={{background:C.card,border:`1px solid ${C.border}`,borderRadius:8,color:C.textMain}}/><Bar dataKey="pnl" radius={4}>{monthlyData.map((d,i)=><Cell key={i} fill={d.pnl>=0?C.green:C.red} fillOpacity={0.8}/>)}</Bar></BarChart>
        </ResponsiveContainer>
      </Card>
      <Card>
        <SLabel>Direction Alignment</SLabel>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
          <div style={{background:C.surface,borderRadius:8,padding:14,textAlign:"center",border:`1px solid ${C.green}30`}}>
            <div style={{color:C.green,fontFamily:"'Space Mono', monospace",fontSize:22,fontWeight:700}}>{aligned.length}</div>
            <div style={{color:C.textMuted,fontSize:10,marginTop:4}}>ALIGNED DAYS</div>
          </div>
          <div style={{background:C.surface,borderRadius:8,padding:14,textAlign:"center",border:`1px solid ${C.red}30`}}>
            <div style={{color:C.red,fontFamily:"'Space Mono', monospace",fontSize:22,fontWeight:700}}>{misaligned.length}</div>
            <div style={{color:C.textMuted,fontSize:10,marginTop:4}}>WRONG BIAS</div>
            <div style={{color:C.textMuted,fontSize:9}}>days you traded vs correct</div>
          </div>
        </div>
      </Card>
      <Card>
        <SLabel>Grade Performance</SLabel>
        {byGrade.map(g=>(
          <div key={g.grade} style={{display:"flex",alignItems:"center",gap:12,marginBottom:10}}>
            <Badge text={g.grade} color={g.grade==="A+"?C.gold:g.grade==="A"?C.green:C.blue}/>
            <div style={{flex:1,height:6,background:C.surface,borderRadius:3,overflow:"hidden"}}><div style={{width:`${g.wr}%`,height:"100%",background:g.wr>60?C.green:g.wr>40?C.gold:C.red,borderRadius:3}}/></div>
            <span style={{color:C.textMain,fontFamily:"'Space Mono', monospace",fontSize:13,minWidth:40}}>{g.wr}%</span>
            <span style={{color:C.textMuted,fontSize:12}}>{g.wins}/{g.total}</span>
          </div>
        ))}
      </Card>
      <Card>
        <SLabel>Play Type</SLabel>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
          {[["ONE-ACT",oaWR,oneAct,C.green],["TWO-ACT",taWR,twoAct,C.gold]].map(([label,wr,days,color])=>(
            <div key={label} style={{textAlign:"center",padding:16,background:C.surface,borderRadius:8,border:`1px solid ${color}30`}}>
              <div style={{color,fontFamily:"'Space Mono', monospace",fontSize:22,fontWeight:700}}>{wr}%</div>
              <div style={{color:C.textMuted,fontSize:10,marginTop:4}}>{label}</div>
              <div style={{color:C.textMuted,fontSize:11}}>{days.filter(d=>d.result==="WIN").length}/{days.length}</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ── MORNING BRIEF ────────────────────────────────────────────────
function MorningBriefPage(){
  return(
    <div style={{display:"flex",flexDirection:"column",gap:14}}>
      <Card style={{borderColor:C.teal+"40"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
          <SLabel color={C.teal}>⚡ Level Scanner</SLabel>
          <Badge text="No bot data yet" color={C.textMuted}/>
        </div>
        <table style={{width:"100%",borderCollapse:"collapse"}}>
          <thead><tr>{["Level","Value","Tested","Status","EQ"].map(h=><th key={h} style={{color:C.textMuted,fontSize:11,textAlign:"left",padding:"6px 0",borderBottom:`1px solid ${C.border}`}}>{h}</th>)}</tr></thead>
          <tbody>{["PMH","PML","PDH","PDL","PDO"].map(l=><tr key={l}><td style={{color:C.teal,fontFamily:"'Space Mono', monospace",fontSize:13,padding:"10px 0"}}>{l}</td>{["—","—","—","—"].map((v,i)=><td key={i} style={{color:C.textDim,fontSize:13,padding:"10px 0"}}>{v}</td>)}</tr>)}</tbody>
        </table>
      </Card>
      <Card>
        <SLabel color={C.blue}>📡 Auto-Calculated Variables</SLabel>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
          {["Gap","FVG Zone","Vol Change","Pace","Position","Close %","5-Day %","Play Type","The Strat"].map(v=>(
            <div key={v} style={{background:C.surface,borderRadius:8,padding:"10px 12px"}}>
              <div style={{color:C.textMuted,fontSize:10,textTransform:"uppercase",marginBottom:4}}>{v}</div>
              <div style={{color:C.textDim,fontFamily:"'Space Mono', monospace",fontSize:13}}>—</div>
            </div>
          ))}
        </div>
      </Card>
      <Card style={{borderColor:C.gold+"40"}}>
        <SLabel color={C.gold}>🤖 Bot Draft</SLabel>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
          {["BIAS","GRADE","ENTRY","SWEEP"].map(f=>(
            <div key={f} style={{background:C.surface,borderRadius:8,padding:"12px 14px"}}>
              <div style={{color:C.textMuted,fontSize:11,marginBottom:6}}>{f}</div>
              <div style={{color:C.textDim,fontFamily:"'Space Mono', monospace",fontSize:16}}>—</div>
            </div>
          ))}
        </div>
        <div style={{padding:"12px 14px",background:C.surface,borderRadius:8,color:C.textMuted,fontSize:12,fontStyle:"italic"}}>
          Bot coming soon — Python script will populate this automatically at 6:25 AM
        </div>
      </Card>
    </div>
  );
}

// ── MAIN APP ─────────────────────────────────────────────────────
export default function App(){
  const [page,setPage]=useState("classify");
  const [menuOpen,setMenuOpen]=useState(false);
  const [trades,setTrades]=useState(()=>{try{const s=localStorage.getItem("stealth_trades");return s?JSON.parse(s):INITIAL_TRADES;}catch{return INITIAL_TRADES;}});
  const [selectedDay,setSelectedDay]=useState(null);
  const [editTrade,setEditTrade]=useState(null);

  useEffect(()=>{try{localStorage.setItem("stealth_trades",JSON.stringify(trades));}catch{}},[trades]);

  const handleEdit=()=>{setEditTrade(selectedDay);setSelectedDay(null);setPage("log");};
  const handleDelete=()=>{setTrades(p=>p.filter(t=>t.day!==selectedDay.day));setSelectedDay(null);};

  const totalPnL=trades.reduce((s,d)=>s+(d.pnl||0),0);
  const traded=trades.filter(d=>d.result!=="SKIP");
  const wins=traded.filter(d=>d.result==="WIN");
  const wr=traded.length?Math.round(wins.length/traded.length*100):0;

  const nav=[
    {id:"classify",label:"Classify",icon:"⚡"},
    {id:"brief",label:"Brief",icon:"📡"},
    {id:"calendar",label:"Calendar",icon:"📅"},
    {id:"log",label:"Trade Log",icon:"📋"},
    {id:"analytics",label:"Stats",icon:"📊"},
  ];

  return(
    <div style={{background:C.bg,minHeight:"100vh",color:C.textMain,fontFamily:"'DM Sans', sans-serif"}}>
      <link href="https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=DM+Sans:wght@400;500;600&display=swap" rel="stylesheet"/>

      {/* HEADER */}
      <div style={{position:"sticky",top:0,zIndex:100,background:C.surface+"F0",backdropFilter:"blur(20px)",borderBottom:`1px solid ${C.border}`,padding:"0 16px",height:52,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <button onClick={()=>setMenuOpen(!menuOpen)} style={{background:"none",border:"none",color:C.teal,cursor:"pointer",fontSize:18,padding:4}}>☰</button>
          <span style={{color:C.teal,fontFamily:"'Space Mono', monospace",fontWeight:700,fontSize:14}}>STEALTH</span>
          <span style={{color:C.textMuted,fontFamily:"'Space Mono', monospace",fontSize:14}}>SYSTEMS</span>
        </div>
        <div style={{display:"flex",gap:14}}>
          <div style={{textAlign:"right"}}><div style={{color:wr>50?C.green:C.red,fontFamily:"'Space Mono', monospace",fontSize:12,fontWeight:700}}>{wr}%</div><div style={{color:C.textMuted,fontSize:9}}>WIN RATE</div></div>
          <div style={{textAlign:"right"}}><div style={{color:totalPnL>=0?C.green:C.red,fontFamily:"'Space Mono', monospace",fontSize:12,fontWeight:700}}>{totalPnL>=0?"+":""}${totalPnL}</div><div style={{color:C.textMuted,fontSize:9}}>TOTAL P&L</div></div>
        </div>
      </div>

      {/* SLIDE MENU */}
      {menuOpen&&(
        <div style={{position:"fixed",inset:0,zIndex:200}} onClick={()=>setMenuOpen(false)}>
          <div style={{position:"absolute",left:0,top:0,bottom:0,width:240,background:C.surface,borderRight:`1px solid ${C.border}`,padding:20,display:"flex",flexDirection:"column",gap:4}} onClick={e=>e.stopPropagation()}>
            <div style={{color:C.teal,fontFamily:"'Space Mono', monospace",fontWeight:700,fontSize:16,marginBottom:20}}>STEALTH SYSTEMS v2</div>
            {nav.map(n=>(
              <button key={n.id} onClick={()=>{setPage(n.id);setMenuOpen(false);}} style={{background:page===n.id?C.teal+"15":"none",border:`1px solid ${page===n.id?C.teal+"40":"transparent"}`,borderRadius:8,padding:"11px 14px",textAlign:"left",color:page===n.id?C.teal:C.textMuted,fontSize:14,cursor:"pointer",display:"flex",alignItems:"center",gap:10}}>
                <span>{n.icon}</span><span>{n.label}</span>
              </button>
            ))}
            <div style={{marginTop:"auto",borderTop:`1px solid ${C.border}`,paddingTop:14}}>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                <div style={{background:C.card,borderRadius:8,padding:12}}><div style={{color:wr>50?C.green:C.red,fontFamily:"'Space Mono', monospace",fontSize:18,fontWeight:700}}>{wr}%</div><div style={{color:C.textMuted,fontSize:10}}>Win Rate</div></div>
                <div style={{background:C.card,borderRadius:8,padding:12}}><div style={{color:C.teal,fontFamily:"'Space Mono', monospace",fontSize:18,fontWeight:700}}>{trades.length}</div><div style={{color:C.textMuted,fontSize:10}}>Days</div></div>
                <div style={{background:C.card,borderRadius:8,padding:12,gridColumn:"span 2"}}><div style={{color:totalPnL>=0?C.green:C.red,fontFamily:"'Space Mono', monospace",fontSize:18,fontWeight:700}}>{totalPnL>=0?"+":""}${totalPnL}</div><div style={{color:C.textMuted,fontSize:10}}>Total P&L</div></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CONTENT */}
      <div style={{padding:"16px 14px 100px",maxWidth:800,margin:"0 auto"}}>
        <div style={{marginBottom:16}}>
          <div style={{color:C.textMuted,fontSize:11,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:2}}>{new Date().toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric"})}</div>
          <div style={{color:C.textMain,fontFamily:"'Space Mono', monospace",fontSize:18,fontWeight:700}}>{nav.find(n=>n.id===page)?.label}</div>
        </div>
        {page==="classify"&&<ClassifyPage/>}
        {page==="brief"&&<MorningBriefPage/>}
        {page==="calendar"&&<CalendarPage trades={trades} onSelectDay={setSelectedDay}/>}
        {page==="log"&&<TradePage trades={trades} setTrades={setTrades} editTrade={editTrade} setEditTrade={setEditTrade} setPage={setPage}/>}
        {page==="analytics"&&<AnalyticsPage trades={trades}/>}
      </div>

      {/* BOTTOM NAV */}
      <div style={{position:"fixed",bottom:0,left:0,right:0,zIndex:100,background:C.surface+"F5",backdropFilter:"blur(20px)",borderTop:`1px solid ${C.border}`,display:"flex",justifyContent:"space-around",padding:"8px 0 12px"}}>
        {nav.map(n=>(
          <button key={n.id} onClick={()=>setPage(n.id)} style={{background:"none",border:"none",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:3,color:page===n.id?C.teal:C.textMuted,flex:1}}>
            <span style={{fontSize:18}}>{n.icon}</span>
            <span style={{fontSize:9,letterSpacing:"0.05em",textTransform:"uppercase",fontFamily:"'Space Mono', monospace"}}>{n.label}</span>
          </button>
        ))}
      </div>

      {/* DAY MODAL */}
      {selectedDay&&<DayModal trade={selectedDay} onClose={()=>setSelectedDay(null)} onEdit={handleEdit} onDelete={handleDelete}/>}
    </div>
  );
}
