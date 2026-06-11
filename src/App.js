import { useState, useEffect, useMemo, useCallback } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

const C = {
  bg:"#080C12",surface:"#0F1520",card:"#131B28",border:"#1E2D42",
  teal:"#0ECFB0",gold:"#F4B942",green:"#10E870",red:"#FF3B5C",
  blue:"#4A9EFF",purple:"#9B6DFF",textMain:"#E8EDF5",
  textMuted:"#5A7494",textDim:"#2A3D55",white:"#FFFFFF",
  orange:"#FF8C42",
};

// ── STORAGE HELPERS (persistent + localStorage fallback) ──────────
const STORAGE_KEY = "stealth_trades_v3";

async function storageSave(trades) {
  try {
    await window.storage.set(STORAGE_KEY, JSON.stringify(trades));
  } catch(e) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(trades)); } catch{}
  }
}

async function storageLoad() {
  // Try persistent storage first
  try {
    const result = await window.storage.get(STORAGE_KEY);
    if (result && result.value) return JSON.parse(result.value);
  } catch(e) {}
  // Fallback to localStorage
  try {
    const s = localStorage.getItem("stealth_trades_v2");
    if (s) return JSON.parse(s);
  } catch(e) {}
  return null;
}

// ── SHARED COMPONENTS ─────────────────────────────────────────────
function Badge({text,color=C.teal,small=false}){
  return <span style={{background:color+"22",color,border:`1px solid ${color}44`,borderRadius:4,padding:small?"1px 6px":"2px 8px",fontSize:small?10:11,fontWeight:700,letterSpacing:"0.05em",whiteSpace:"nowrap"}}>{text}</span>;
}
function Card({children,style={}}){
  return <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:16,...style}}>{children}</div>;
}
function SLabel({children,color=C.teal}){
  return <div style={{color,fontFamily:"'Space Mono', monospace",fontSize:11,fontWeight:700,letterSpacing:"0.15em",textTransform:"uppercase",marginBottom:10}}>{children}</div>;
}
function Divider(){return <div style={{height:1,background:C.border,margin:"14px 0"}}/>;}
const lbl={color:C.textMuted,fontSize:11,letterSpacing:"0.08em",textTransform:"uppercase",display:"block",marginBottom:4};
const inp={background:C.surface,border:`1px solid ${C.border}`,borderRadius:8,padding:"10px 12px",color:C.textMain,fontSize:13,width:"100%",boxSizing:"border-box",fontFamily:"inherit"};
function Row2({children}){return <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>{children}</div>;}

function formatDate(d){if(!d)return"";try{const dt=new Date(d+"T12:00:00");return dt.toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"});}catch{return d;}}
function resultColor(r){return r==="WIN"?C.green:r==="LOSS"?C.red:C.textMuted;}

// ── PARSE EOD (flexible month handling + What Worked fix) ─────────
function parseEOD(text){
  const ext={};
  const MONTH_MAP = {
    jan:"January",feb:"February",mar:"March",apr:"April",
    may:"May",jun:"June",jul:"July",aug:"August",
    sep:"September",oct:"October",nov:"November",dec:"December"
  };
  // Normalize month abbreviations
  let normalized = text.replace(/\b(Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\b/gi, m => {
    const key = m.toLowerCase().slice(0,3);
    return MONTH_MAP[key] || m;
  });

  const dayM=normalized.match(/DAY\s+(\d+)/i);if(dayM)ext.day=parseInt(dayM[1]);
  const dateM=normalized.match(/—\s+([A-Za-z]+ \d+,?\s*\d{4})/);
  if(dateM){try{const d=new Date(dateM[1]);if(!isNaN(d))ext.date=d.toISOString().split("T")[0];}catch{}}
  // Also try — MONTH DD format without year
  if(!ext.date){
    const dateM2=normalized.match(/—\s+([A-Za-z]+ \d{1,2})\b/);
    if(dateM2){try{const d=new Date(dateM2[1]+", "+new Date().getFullYear());if(!isNaN(d))ext.date=d.toISOString().split("T")[0];}catch{}}
  }

  const stratM=normalized.match(/(2up\/2up|2dn\/2dn|3-|1-)/i);if(stratM)ext.strat=stratM[1];
  const storyM=normalized.match(/\|\s*(Calls [A-E]|Puts [A-E]|No Story Match|Skip|Fight Story|Neutral Discovery)/i);if(storyM)ext.story=storyM[1];
  const dirM=normalized.match(/Entry:\s*(CALLS|PUTS)/i);if(dirM){ext.direction=dirM[1].toUpperCase();ext.correctDirection=dirM[1].toUpperCase();}
  // System direction
  const sysM=normalized.match(/System:\s*(CALLS|PUTS)/i);if(sysM)ext.correctDirection=sysM[1].toUpperCase();
  const closeM=normalized.match(/Close%\s+([\d.]+)%/i);if(closeM)ext.closePercent=closeM[1];
  const fiveM=normalized.match(/5D%\s+([\d.]+)%/i);if(fiveM)ext.fiveDayPercent=fiveM[1];
  const gapM=normalized.match(/Gap:\s*(Up|Down|Flat)\s*([+\-]?[\d.]+)/i);if(gapM)ext.gap=`${gapM[1]} ${gapM[2]}`;
  const rangeM=normalized.match(/(Tight|Mid|Wide)\s+([\d.]+)/i);if(rangeM)ext.range=`${rangeM[1]} ${rangeM[2]}`;
  const volM=normalized.match(/Today IWM\s+([\d.]+)%\s*\/\s*IWO\s+([\d.]+)%/i);if(volM)ext.volToday=`IWM ${volM[1]}% / IWO ${volM[2]}%`;
  const openM=normalized.match(/Open[:\s]+([\d.]+)/i);if(openM)ext.openPrice=openM[1];
  // What Worked — fixed to capture multiline
  const wwM=normalized.match(/What\s+Worked:?\s*([\s\S]+?)(?:\n\s*(?:Learning|Tags|Act 2|Target|Entry|System):|$)/i);
  if(wwM)ext.whatWorked=wwM[1].trim();
  const learningM=normalized.match(/Learning:?\s*([\s\S]+?)(?:\n\s*(?:Tags|What Worked|Act 2|Target|Entry|System):|$)/i);
  if(learningM)ext.learning=learningM[1].trim();
  // Journal
  const journalM=normalized.match(/Journal:?\s*([\s\S]+?)(?:\n\s*(?:Tags|Learning|What Worked):|$)/i);
  if(journalM)ext.journal=journalM[1].trim();
  const tagsM=normalized.match(/Tags:\s*(.+?)$/im);if(tagsM)ext.tags=tagsM[1].trim().split(/\s+/).map(t=>t.replace(/^#/,""));
  const entryTM=normalized.match(/Entry:.*?@\s*(\d+:\d+)/i);if(entryTM)ext.entryTime=entryTM[1];
  const exitTM=normalized.match(/→\s*(?:HOD|LOD).*?@\s*(\d+:\d+)/i);if(exitTM)ext.exitTime=exitTM[1];
  const gradeM=normalized.match(/\b(A\+|A|B\+)\b/);if(gradeM)ext.grade=gradeM[1];
  const playM=normalized.match(/(One-Act|Two-Act)/i);if(playM)ext.playType=playM[1];

  // Result
  const resultM=normalized.match(/\b(WIN|LOSS|SKIP)\b/i);if(resultM)ext.result=resultM[1].toUpperCase();
  // PnL
  const pnlM=normalized.match(/\$([+-]?[\d.]+)\s*(?:P&L|profit|loss)?/i);if(pnlM)ext.pnl=parseFloat(pnlM[1]);
  const pctM=normalized.match(/([\d.]+)%\s*(?:gain|return|win|profit)/i);if(pctM)ext.pct=parseFloat(pctM[1]);

  return ext;
}

// ── PARSE MORNING VARIABLES (flexible paste parser) ───────────────
function parseMorningVars(text){
  const v={};
  if(!text) return v;
  // IWM/IWO Vol
  const iwmM=text.match(/IWM\s+Vol[:\s]*([\d.]+)%/i)||text.match(/IWM\s*[:\-]\s*([\d.]+)%/i);
  if(iwmM) v.iwmVol=iwmM[1];
  const iwoM=text.match(/IWO\s+Vol[:\s]*([\d.]+)%/i)||text.match(/IWO\s*[:\-]\s*([\d.]+)%/i);
  if(iwoM) v.iwoVol=iwoM[1];
  // Pace
  const iwmPaceM=text.match(/IWM\s+Pace[:\s]*[-]?([\d.]+)%/i);if(iwmPaceM)v.iwmPace=iwmPaceM[1];
  const iwoPaceM=text.match(/IWO\s+Pace[:\s]*[-]?([\d.]+)%/i);if(iwoPaceM)v.iwoPace=iwoPaceM[1];
  // CVD
  const cvdM=text.match(/CVD[:\s]*([+\-]?[\d.,]+\.?\d*K?)/i);
  if(cvdM){let val=cvdM[1].replace(/,/,"");if(val.toUpperCase().includes("K"))val=parseFloat(val)*1000;v.cvd=parseFloat(val);}
  // Close% and 5D%
  const cpM=text.match(/Close%?\s*[:\s=]*([\d.]+)%?/i)||text.match(/Prior\s+Close\s*%\s*=\s*([\d.]+)%/i);if(cpM)v.closePercent=parseFloat(cpM[1]);
  const dpM=text.match(/5[-\s]?Day\s+Position\s*%\s*=\s*([\d.]+)%/i)||text.match(/5D%?\s*[:\s=]*([\d.]+)%?/i);if(dpM)v.fiveDayPercent=parseFloat(dpM[1]);
  // SVP
  const vahM=text.match(/VAH[:\s]+([\d.]+)/i);if(vahM)v.vah=parseFloat(vahM[1]);
  const pocM=text.match(/POC[:\s]+([\d.]+)/i);if(pocM)v.poc=parseFloat(pocM[1]);
  const valM=text.match(/VAL[:\s]+([\d.]+)/i);if(valM)v.val=parseFloat(valM[1]);
  // Strat
  const stratM=text.match(/(2up\/2up|2dn\/2dn|3-|1-)/i);if(stratM)v.strat=stratM[1];
  // Macro
  const macroM=text.match(/Macro[:\s]*(.+?)(?:\n|$)/i);if(macroM&&macroM[1].trim()!=="None")v.macro=macroM[1].trim();
  // PMH/PML/PDH/PDL if included
  const pmhM=text.match(/PMH[:\s]+([\d.]+)/i);if(pmhM)v.pmh=parseFloat(pmhM[1]);
  const pmlM=text.match(/PML[:\s]+([\d.]+)/i);if(pmlM)v.pml=parseFloat(pmlM[1]);
  const pdhM=text.match(/PDH[:\s]+([\d.]+)/i);if(pdhM)v.pdh=parseFloat(pdhM[1]);
  const pdlM=text.match(/PDL[:\s]+([\d.]+)/i);if(pdlM)v.pdl=parseFloat(pdlM[1]);
  return v;
}

// ── CLASSIFY ENGINE ───────────────────────────────────────────────
function classify(v, botData){
  if(!v.open) return null;
  const open=parseFloat(v.open)||0;
  const pmh=parseFloat(v.pmh||botData?.pmh)||0;
  const pml=parseFloat(v.pml||botData?.pml)||0;
  const pdh=parseFloat(v.pdh||botData?.pdh)||0;
  const pdl=parseFloat(v.pdl||botData?.pdl)||0;
  const vah=parseFloat(v.vah)||0;
  const val=parseFloat(v.val)||0;
  const cp=parseFloat(v.closePercent)||0;
  const dp=parseFloat(v.fiveDayPercent)||0;
  const iwm=parseFloat(v.iwmVol)||0;
  const iwo=parseFloat(v.iwoVol)||0;
  const cvd=parseFloat(v.cvd)||0;

  // Gap
  const gap = botData?.gap || (pmh ? `${open > pmh ? "Up" : "Down"} ${Math.abs(open - pmh).toFixed(2)}` : "Unknown");
  const gapAmt = botData?.gap_amount || 0;
  const gapDir = gap.startsWith("Up") ? "Up" : gap.startsWith("Down") ? "Down" : "Flat";

  // Position
  const distPMH=pmh?Math.abs(pmh-open):99;
  const distPML=pml?Math.abs(open-pml):99;
  const closer=distPMH<distPML?"PMH":"PML";
  const dist=Math.min(distPMH,distPML);
  const position=dist<=0.20?`AT ${closer} (${dist.toFixed(2)})`
    :dist<=1.50?`NEAR ${closer} (${dist.toFixed(2)})`
    :`MID (PMH ${distPMH.toFixed(2)}, PML ${distPML.toFixed(2)})`;

  // Vars zones
  const cpZone=cp>=94?"Extreme High":cp>=70?"High":cp>=31?"Neutral":cp>=12?"Low":"Extreme Low";
  const dpZone=dp>=90?"Extreme High":dp>=70?"High":dp>=31?"Neutral":dp>=21?"Low":"Extreme Low";
  const extHigh=cp>=94||dp>=90;
  const extLow=cp<=11||dp<=20;

  // Vol state
  const bothSurged=iwm>=100&&iwo>=100;
  const iwoWeak=iwo<75;
  const iwmWeak=iwm<75;
  const splitVol=(iwm>=100)!==(iwo>=100);

  // Base bias
  let bias="SKIP";
  let reason="";
  if(gapDir==="Up"&&closer==="PMH"){bias="CALLS";reason="Gap up + closer PMH = continuation calls";}
  else if(gapDir==="Down"&&closer==="PML"){bias="PUTS";reason="Gap down + closer PML = continuation puts";}
  else if(gapDir==="Up"&&closer==="PML"){bias="CALLS";reason="Gap up + floor = reversal candidate calls";}
  else if(gapDir==="Down"&&closer==="PMH"){bias="PUTS";reason="Gap down + ceiling = reversal candidate puts";}
  else{bias="SKIP";reason="Flat gap — discovery";}

  // Override checks
  let override="";
  if(extHigh&&closer==="PMH"){bias="PUTS";override="Extreme High vars AT ceiling → PUTS";}
  else if(extLow&&closer==="PML"){bias="CALLS";override="Extreme Low vars AT floor → CALLS";}
  else if(extLow&&closer==="PMH"){bias="PUTS";override="Extreme Low vars AT ceiling → Puts Story B";}

  // Grade
  let grade="B+";
  if(bothSurged&&dist<=0.20){grade="A+";}
  else if(bothSurged&&dist<=1.50){grade="A+";}
  else if((bothSurged||extHigh||extLow)&&dist<=1.50){grade="A";}
  else if(splitVol||iwoWeak){grade="B+";}

  // Entry type
  let entryType="Type 2 — Sweep";
  let entryNote="Wait for sweep zone to hold";
  if(dist<=0.20&&bothSurged){entryType="Type 1 — Immediate";entryNote="AT level + fuel = enter 6:30 first 10-15 sec";}
  else if(botData?.fvg_zone&&botData.fvg_zone!=="No FVG"&&!bothSurged){entryType="Type 3 — Fake Spike then Sweep";entryNote="FVG opposite + not both surged = fake spike first, enter at FVG hold";}
  else if(gapAmt>=2.0&&!iwoWeak&&!iwmWeak){entryType="Type 2 — Sweep";entryNote="FVG sweep zone, enter at hold";}

  // Entry timing
  let entryTime="6:45–7:05";
  if(grade==="A+"){entryTime="6:30–6:32";}
  else if(grade==="A"){entryTime="6:35–6:45";}

  // Suppressor check
  const suppressors=[];
  if(iwoWeak){suppressors.push(`S2 IWO weak (${iwo}% < 75%)`);}
  if(iwmWeak){suppressors.push(`S2 IWM weak (${iwm}% < 75%)`);}
  if(cp>=70&&dp>=70){suppressors.push(`S3 Both vars High/ExtHigh (Close% ${cp}% / 5D% ${dp}%)`);}
  const suppVerdict=suppressors.length===0?"No suppressors — full capacity"
    :suppressors.length===1&&bothSurged?"1 suppressor + both surged — fuel overrides"
    :suppressors.length===1?"1 suppressor — first target only"
    :suppressors.length>=2&&bothSurged?"2 suppressors + both surged — watch carefully"
    :"SUPPRESSED — first target only";

  // Lightning tier
  let lightningTier="";
  let lightningNote="";
  if(bothSurged&&dist<=1.50&&suppressors.length===0){lightningTier="⚡ TIER 1";lightningNote="Both >=100% + AT/NEAR level = avg 5.81+";}
  else if((iwm>=100||iwo>=100)&&dist<=1.50){lightningTier="⚡ TIER 2";lightningNote="One >=100% + AT/NEAR level = avg 4.5-5.5";}
  else if((extHigh||extLow)&&botData?.open_air?.max_gap_puts>=1.5){lightningTier="⚡ TIER 3";lightningNote="Extreme vars + open air = gravity driven";}
  else{lightningTier="No ⚡";lightningNote="Check suppressors";}

  // Cliff edge
  const cliff=botData?.cliff_edge;
  const cliffFlag=cliff?.calls_cliff?"⚡⚡ CALLS CLIFF EDGE":cliff?.puts_cliff?"⚡⚡ PUTS CLIFF EDGE":"";

  // CVD read
  const cvdRead=cvd>10000?"Strongly positive — aligned calls":cvd<-10000?"Strongly negative — aligned puts":cvd>0?"Slightly positive":"Slightly negative";

  // Sweep zone
  const fvg=botData?.fvg_zone||"Check chart";
  const sweepZone=fvg!=="No FVG"?fvg:`${closer==="PMH"?"PML":"PMH"} area`;

  // FVG
  const fvgZone=botData?.fvg_zone||"No FVG";

  // Open air runway
  const runway=bias==="CALLS"?botData?.open_air?.runway_calls:botData?.open_air?.runway_puts;
  const maxGap=bias==="CALLS"?botData?.open_air?.max_gap_above:botData?.open_air?.max_gap_below;

  return {
    bias,grade,reason,override,entryType,entryNote,entryTime,
    position,gapDir,gapAmt,
    cpZone,dpZone,bothSurged,splitVol,iwoWeak,
    suppressors,suppVerdict,
    lightningTier,lightningNote,cliffFlag,
    cvdRead,sweepZone,fvgZone,runway,maxGap,
    svpLocation:vah&&val?`VAH ${vah} VAL ${val}`:"—",
  };
}

// ── MORNING PAGE ──────────────────────────────────────────────────
function MorningPage(){
  const [botData,setBotData]=useState(null);
  const [botLoading,setBotLoading]=useState(false);
  const [botError,setBotError]=useState(null);
  const [lastRefresh,setLastRefresh]=useState(null);
  const [pasteText,setPasteText]=useState("");
  const [manualVars,setManualVars]=useState({});
  const [result,setResult]=useState(null);
  const [biasResult,setBiasResult]=useState(null);
  const [biasLoading,setBiasLoading]=useState(false);

  const fetchBot=useCallback((isRefresh=false)=>{
    setBotLoading(true);setBotError(null);
    fetch("/morning_brief.json?t="+Date.now())
      .then(r=>{if(!r.ok)throw new Error("Bot data unavailable");return r.json();})
      .then(d=>{setBotData(d);setLastRefresh(new Date().toLocaleTimeString());setBotLoading(false);})
      .catch(e=>{setBotError(e.message);setBotLoading(false);});
  },[]);

  useEffect(()=>{fetchBot();},[fetchBot]);

  useEffect(()=>{
    if(pasteText.trim()){
      const v=parseMorningVars(pasteText);
      setManualVars(v);
    }
  },[pasteText]);

  const runBiasCheck=useCallback(async()=>{
    if(!pasteText.trim()) return;
    setBiasLoading(true);
    setBiasResult(null);
    
    // Build context from bot data
    const botContext = botData ? `
Bot Level Scanner:
PMH: ${botData.variables?.pmh || botData.pmh || "N/A"}
PML: ${botData.variables?.pml || botData.pml || "N/A"}
PDH: ${botData.variables?.pdh || botData.pdh || "N/A"}
PDL: ${botData.variables?.pdl || botData.pdl || "N/A"}
5DH: ${botData.five_dh || "N/A"} | 5DL: ${botData.five_dl || "N/A"}
PWH: ${botData.pwh || "N/A"} | PWL: ${botData.pwl || "N/A"}
Gap: ${botData.gap || "N/A"}
FVG: ${botData.fvg_zone || "N/A"}
PM Range: ${botData.pm_range || "N/A"}
Level Tests: ${JSON.stringify(botData.level_scanner || {})}
Cliff Edge: ${botData.cliff_edge?.flag || "None"}
Open Air Calls: ${botData.open_air?.runway_calls || "N/A"} (max gap ${botData.open_air?.max_gap_above || "N/A"})
Open Air Puts: ${botData.open_air?.runway_puts || "N/A"} (max gap ${botData.open_air?.max_gap_below || "N/A"})
GEX: Flip ${botData.gex?.flip_level || "N/A"} | Calls ceiling ${botData.gex?.call_walls?.[0]?.strike || "N/A"} | King node ${botData.gex?.king_nodes?.[0]?.strike || "N/A"}
` : "";

    const systemPrompt = `You are the Stealth Signals IWM 0DTE classification engine running v2.30. 
Run the full 10-step classification on the variables provided.
Output in this exact format:

BIAS: [CALLS 🟢 / PUTS 🔴 / SKIP]
GRADE: [A+ / A / B+ / Skip]
ENTRY TYPE: [Type 1 Immediate / Type 2 Sweep / Type 3 Fake Spike]
ENTRY: [time window]
SWEEP: [level or None]
TARGET 1: [level]
TARGET 2: [level if applicable]
⚡ LIGHTNING: [tier and note]
SUPPRESSOR: [S1/S2/S3 flags or None]
GEX: [Flip X | Calls ceiling X | Puts target X]
ACT 2 FLAG: [if applicable]

Keep it concise. No explanations. Just the output.`;

    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: systemPrompt,
          messages: [{
            role: "user",
            content: `${botContext}

Morning Variables:
${pasteText}`
          }]
        })
      });
      const data = await response.json();
      const text = data.content?.[0]?.text || "Classification failed";
      setBiasResult(text);
    } catch(e) {
      setBiasResult("Error: " + e.message);
    }
    setBiasLoading(false);
  },[pasteText, botData]);

  const classify_result=useMemo(()=>{
    if(!manualVars.closePercent&&!manualVars.iwmVol) return null;
    const merged={
      open:botData?.variables?.open||manualVars.open,
      pmh:botData?.variables?.pmh||manualVars.pmh,
      pml:botData?.variables?.pml||manualVars.pml,
      pdh:botData?.variables?.pdh||manualVars.pdh,
      pdl:botData?.variables?.pdl||manualVars.pdl,
      ...manualVars,
    };
    return classify(merged, botData?.variables||botData);
  },[manualVars,botData]);

  const v=botData?.variables||botData||{};
  const cliff=botData?.cliff_edge||{};
  const oa=botData?.open_air||{};
  const gex=botData?.gex||{};
  const levels=botData?.level_scanner||{};

  return(
    <div style={{display:"flex",flexDirection:"column",gap:14}}>

      {/* LEVEL SCANNER */}
      <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,overflow:"hidden"}}>
        <div style={{padding:"14px 16px",borderBottom:`1px solid ${C.border}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <span style={{color:C.teal,fontSize:16}}>⚡</span>
            <span style={{color:C.teal,fontFamily:"'Space Mono',monospace",fontSize:13,fontWeight:700,letterSpacing:"0.1em"}}>LEVEL SCANNER</span>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            {lastRefresh&&<span style={{color:C.textDim,fontSize:10,fontFamily:"'Space Mono',monospace"}}>{lastRefresh}</span>}
            {botData&&<div style={{width:6,height:6,borderRadius:"50%",background:C.green}}/>}
            {!botData&&!botLoading&&<div style={{width:6,height:6,borderRadius:"50%",background:C.textDim}}/>}
            <button onClick={()=>fetchBot(true)} style={{background:"none",border:`1px solid ${C.border}`,borderRadius:5,padding:"4px 8px",color:C.textMuted,fontSize:10,cursor:"pointer"}}>↻</button>
          </div>
        </div>
        {botLoading&&<div style={{color:C.textMuted,fontSize:12,textAlign:"center",padding:24,fontFamily:"'Space Mono',monospace"}}>Scanning levels...</div>}
        {botError&&<div style={{color:C.red,fontSize:11,padding:"10px 16px"}}>{botError}</div>}
        {!botLoading&&!botError&&botData&&(<>
          {Object.keys(levels).length>0&&(
            <div>
              <div style={{display:"grid",gridTemplateColumns:"70px 1fr 60px 60px 36px",padding:"8px 16px",borderBottom:`1px solid ${C.border}`}}>
                {["LEVEL","VALUE","TESTED","STATUS","EQ"].map(h=>(
                  <div key={h} style={{color:C.textMuted,fontSize:9,letterSpacing:"0.1em",fontFamily:"'Space Mono',monospace"}}>{h}</div>
                ))}
              </div>
              {Object.entries(levels).map(([name,d],i)=>(
                <div key={name} style={{display:"grid",gridTemplateColumns:"70px 1fr 60px 60px 36px",padding:"10px 16px",borderBottom:i<Object.entries(levels).length-1?`1px solid ${C.border+"60"}`:"none",background:d.tested>2?C.gold+"08":"transparent"}}>
                  <div style={{color:C.textMain,fontFamily:"'Space Mono',monospace",fontSize:12,fontWeight:700}}>{name}</div>
                  <div style={{color:d.value?C.textMain:C.textDim,fontFamily:"'Space Mono',monospace",fontSize:12,fontWeight:700}}>{d.value||"—"}</div>
                  <div style={{color:d.tested>2?C.gold:d.tested>0?C.textMain:C.textDim,fontFamily:"'Space Mono',monospace",fontSize:11}}>{d.tested>0?`×${d.tested}`:"—"}</div>
                  <div style={{color:d.status==="Broke"?C.red:d.status==="Held"?C.green:C.textDim,fontSize:11}}>{d.status||"—"}</div>
                  <div style={{color:C.orange,fontSize:11}}>{d.eq&&d.eq!=="—"?"⚠️":""}</div>
                </div>
              ))}
            </div>
          )}
          <div style={{padding:"12px 16px",borderTop:`1px solid ${C.border}`,display:"flex",flexDirection:"column",gap:8}}>
            {(cliff.puts_cliff||cliff.calls_cliff)&&(
              <div style={{padding:"8px 10px",background:C.gold+"15",border:`1px solid ${C.gold}60`,borderRadius:6}}>
                <span style={{color:C.gold,fontFamily:"'Space Mono',monospace",fontWeight:700,fontSize:11}}>⚡⚡ {cliff.flag}</span>
              </div>
            )}
            {(oa.runway_calls||oa.runway_puts)&&(
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
                <div style={{background:C.surface,borderRadius:6,padding:"6px 8px"}}>
                  <div style={{color:C.textDim,fontSize:9,fontFamily:"'Space Mono',monospace",marginBottom:2}}>CALLS RUNWAY</div>
                  <div style={{color:C.green,fontFamily:"'Space Mono',monospace",fontSize:10,fontWeight:700}}>{oa.runway_calls}</div>
                  {oa.max_gap_above&&<div style={{color:C.textDim,fontSize:9}}>gap {oa.max_gap_above}</div>}
                </div>
                <div style={{background:C.surface,borderRadius:6,padding:"6px 8px"}}>
                  <div style={{color:C.textDim,fontSize:9,fontFamily:"'Space Mono',monospace",marginBottom:2}}>PUTS RUNWAY</div>
                  <div style={{color:C.red,fontFamily:"'Space Mono',monospace",fontSize:10,fontWeight:700}}>{oa.runway_puts}</div>
                  {oa.max_gap_below&&<div style={{color:C.textDim,fontSize:9}}>gap {oa.max_gap_below}</div>}
                </div>
              </div>
            )}
            <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
              {v.fvg_zone&&v.fvg_zone!=="No FVG"&&(
                <div style={{padding:"5px 8px",background:C.gold+"10",borderRadius:5,border:`1px solid ${C.gold}30`}}>
                  <span style={{color:C.gold,fontSize:10,fontFamily:"'Space Mono',monospace",fontWeight:700}}>FVG </span>
                  <span style={{color:C.textMain,fontSize:10,fontFamily:"'Space Mono',monospace"}}>{v.fvg_zone}</span>
                </div>
              )}
              {v.equal_highs?.length>0&&(
                <div style={{padding:"5px 8px",background:C.orange+"10",borderRadius:5,border:`1px solid ${C.orange}30`}}>
                  <span style={{color:C.orange,fontSize:10,fontFamily:"'Space Mono',monospace",fontWeight:700}}>EQ HI </span>
                  <span style={{color:C.textMain,fontSize:10,fontFamily:"'Space Mono',monospace"}}>{v.equal_highs.join(" · ")}</span>
                </div>
              )}
              {v.equal_lows?.length>0&&(
                <div style={{padding:"5px 8px",background:C.orange+"10",borderRadius:5,border:`1px solid ${C.orange}30`}}>
                  <span style={{color:C.orange,fontSize:10,fontFamily:"'Space Mono',monospace",fontWeight:700}}>EQ LO </span>
                  <span style={{color:C.textMain,fontSize:10,fontFamily:"'Space Mono',monospace"}}>{v.equal_lows.join(" · ")}</span>
                </div>
              )}
            </div>
            {gex.flip_level&&(
              <div style={{padding:"8px 10px",background:C.surface,borderRadius:6,border:`1px solid ${C.purple}30`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div>
                  <span style={{color:C.purple,fontFamily:"'Space Mono',monospace",fontSize:10,fontWeight:700}}>⚡ SIGNAL MAP</span>
                  <span style={{color:C.textDim,fontSize:10}}> · Flip {gex.flip_level} · {gex.regime}</span>
                </div>
                <button onClick={()=>window.dispatchEvent(new CustomEvent('navigate',{detail:'signals'}))}
                  style={{background:C.purple+"20",border:`1px solid ${C.purple}40`,borderRadius:5,padding:"4px 10px",color:C.purple,fontSize:10,cursor:"pointer",fontWeight:700}}>
                  View →
                </button>
              </div>
            )}
          </div>
        </>)}
        {!botLoading&&!botError&&!botData&&(
          <div style={{padding:24,textAlign:"center"}}>
            <div style={{color:C.textDim,fontSize:11,fontFamily:"'Space Mono',monospace"}}>No bot data — runs at 6AM PST</div>
          </div>
        )}
      </div>

      {/* PRE MARKET BIAS CHECK */}
      <Card style={{borderColor:C.blue+"40"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
          <SLabel color={C.blue}>📊 Pre Market Bias Check</SLabel>
          <span style={{color:C.textMuted,fontSize:10,fontFamily:"'Space Mono',monospace"}}>{new Date().toLocaleDateString("en-US",{weekday:"short",month:"short",day:"numeric"})}</span>
        </div>
        <div style={{color:C.textMuted,fontSize:12,marginBottom:10}}>Paste your morning variables — same format you send to Claude.</div>
        <textarea
          value={pasteText}
          onChange={e=>{setPasteText(e.target.value);setBiasResult(null);}}
          placeholder={"IWO Vol: 137%\nIWO Pace: -70.7%\nIWM Vol: 95%\nIWM Pace: -74.3%\n\nPrior Close % = 85.4%\n5-Day Position % = 87.0%\n\nCVD: -22.719K\n\nVAH: 290.34\nPOC: 289.40\nVAL: 289.17\n\nIWO 1D 2down | IWM 1D 3-\nIWO 1H 2down | IWM 1H 1-\n\nMacro: None"}
          style={{...inp,height:150,resize:"vertical",fontFamily:"'Space Mono',monospace",fontSize:11,lineHeight:1.6}}
        />
        {Object.keys(manualVars).length>0&&(
          <div style={{marginTop:8,display:"flex",flexWrap:"wrap",gap:5}}>
            {Object.entries(manualVars).filter(([,v])=>v!==undefined&&v!=="").slice(0,8).map(([k,val])=>(
              <div key={k} style={{background:C.surface,borderRadius:4,padding:"2px 7px",fontSize:10}}>
                <span style={{color:C.textMuted}}>{k}: </span>
                <span style={{color:C.teal,fontWeight:700}}>{String(val).slice(0,15)}</span>
              </div>
            ))}
          </div>
        )}
        <button
          onClick={runBiasCheck}
          disabled={biasLoading||!pasteText.trim()}
          style={{marginTop:12,background:biasLoading?"#1a2a3a":C.green+"20",border:`1px solid ${biasLoading?C.border:C.green}60`,borderRadius:10,padding:"14px",color:biasLoading?C.textMuted:C.green,fontSize:14,fontWeight:700,cursor:biasLoading||!pasteText.trim()?"not-allowed":"pointer",width:"100%",display:"flex",alignItems:"center",justifyContent:"center",gap:8,transition:"all 0.2s"}}>
          {biasLoading ? (
            <><span style={{fontSize:16}}>⏳</span> Running bias check...</>
          ) : (
            <><span style={{fontSize:16}}>🚀</span> RUN BIAS CHECK</>
          )}
        </button>
      </Card>

      {/* BIAS CHECK RESULT */}
      {biasResult&&(
        <Card style={{borderColor:biasResult.includes("CALLS")?C.green:biasResult.includes("PUTS")?C.red:biasResult.includes("SKIP")?C.textMuted:C.blue}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
            <SLabel color={biasResult.includes("CALLS")?C.green:biasResult.includes("PUTS")?C.red:C.blue}>🤖 Bias Check Result</SLabel>
            <button onClick={()=>setBiasResult(null)} style={{background:"none",border:"none",color:C.textMuted,fontSize:16,cursor:"pointer"}}>×</button>
          </div>
          <div style={{fontFamily:"'Space Mono',monospace",fontSize:12,lineHeight:2,whiteSpace:"pre-wrap",color:C.textMain}}>
            {biasResult.split("\n").map((line,i)=>{
              const isKey = line.startsWith("BIAS:") || line.startsWith("GRADE:") || line.startsWith("⚡") || line.startsWith("GEX:");
              const isBias = line.startsWith("BIAS:");
              const color = isBias ? (line.includes("CALLS")?C.green:line.includes("PUTS")?C.red:C.textMuted) : isKey ? C.gold : C.textMain;
              return <div key={i} style={{color,fontWeight:isKey?700:400}}>{line}</div>;
            })}
          </div>
        </Card>
      )}

      {/* CLASSIFICATION OUTPUT */}
      {classify_result&&(
        <Card style={{borderColor:classify_result.bias==="CALLS"?C.green:classify_result.bias==="PUTS"?C.red:C.border}}>
          <SLabel color={classify_result.bias==="CALLS"?C.green:classify_result.bias==="PUTS"?C.red:C.textMuted}>⚡ Classification</SLabel>

          {/* Main output */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:14}}>
            <div style={{background:C.surface,borderRadius:8,padding:14,textAlign:"center"}}>
              <div style={{color:C.textMuted,fontSize:10,marginBottom:4}}>BIAS</div>
              <div style={{color:classify_result.bias==="CALLS"?C.green:classify_result.bias==="PUTS"?C.red:C.textMuted,fontFamily:"'Space Mono', monospace",fontSize:24,fontWeight:700}}>
                {classify_result.bias==="CALLS"?"🟢":classify_result.bias==="PUTS"?"🔴":"⬜"} {classify_result.bias}
              </div>
            </div>
            <div style={{background:C.surface,borderRadius:8,padding:14,textAlign:"center"}}>
              <div style={{color:C.textMuted,fontSize:10,marginBottom:4}}>GRADE</div>
              <div style={{color:classify_result.grade==="A+"?C.gold:classify_result.grade==="A"?C.green:C.blue,fontFamily:"'Space Mono', monospace",fontSize:24,fontWeight:700}}>
                {classify_result.grade}
              </div>
            </div>
          </div>

          <Divider/>

          {/* Entry type */}
          <div style={{marginBottom:12}}>
            <div style={{color:C.textMuted,fontSize:10,marginBottom:4}}>ENTRY TYPE</div>
            <div style={{color:C.textMain,fontFamily:"'Space Mono', monospace",fontSize:12,fontWeight:700}}>{classify_result.entryType}</div>
            <div style={{color:C.textMuted,fontSize:11,marginTop:2}}>{classify_result.entryNote}</div>
            <div style={{color:C.gold,fontFamily:"'Space Mono', monospace",fontSize:12,marginTop:4}}>Entry window: {classify_result.entryTime}</div>
          </div>

          <Divider/>

          {/* Lightning + Suppressors */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12}}>
            <div style={{background:C.surface,borderRadius:8,padding:10}}>
              <div style={{color:C.textMuted,fontSize:10,marginBottom:4}}>LIGHTNING</div>
              <div style={{color:C.gold,fontFamily:"'Space Mono', monospace",fontSize:13,fontWeight:700}}>{classify_result.lightningTier}</div>
              <div style={{color:C.textMuted,fontSize:10,marginTop:2}}>{classify_result.lightningNote}</div>
            </div>
            <div style={{background:C.surface,borderRadius:8,padding:10}}>
              <div style={{color:C.textMuted,fontSize:10,marginBottom:4}}>SUPPRESSORS</div>
              <div style={{color:classify_result.suppressors.length===0?C.green:classify_result.suppressors.length>=2?C.red:C.orange,fontFamily:"'Space Mono', monospace",fontSize:12,fontWeight:700}}>
                {classify_result.suppressors.length===0?"Clean ✅":`${classify_result.suppressors.length} flagged`}
              </div>
              <div style={{color:C.textMuted,fontSize:10,marginTop:2}}>{classify_result.suppVerdict}</div>
            </div>
          </div>

          {classify_result.suppressors.length>0&&(
            <div style={{marginBottom:12,padding:"8px 10px",background:C.red+"10",borderRadius:6,border:`1px solid ${C.red}30`}}>
              {classify_result.suppressors.map((s,i)=>(
                <div key={i} style={{color:C.red,fontSize:11,marginBottom:i<classify_result.suppressors.length-1?4:0}}>⚠️ {s}</div>
              ))}
            </div>
          )}

          {classify_result.cliffFlag&&(
            <div style={{marginBottom:12,padding:"8px 10px",background:C.gold+"15",borderRadius:6,border:`1px solid ${C.gold}40`}}>
              <span style={{color:C.gold,fontFamily:"'Space Mono', monospace",fontWeight:700,fontSize:12}}>{classify_result.cliffFlag}</span>
            </div>
          )}

          <Divider/>

          {/* 4-line output */}
          <div style={{background:C.surface,borderRadius:8,padding:12,fontFamily:"'Space Mono', monospace",fontSize:11,lineHeight:1.8}}>
            <div><span style={{color:C.textMuted}}>BIAS: </span><span style={{color:classify_result.bias==="CALLS"?C.green:C.red,fontWeight:700}}>{classify_result.bias}</span></div>
            <div><span style={{color:C.textMuted}}>GRADE: </span><span style={{color:classify_result.grade==="A+"?C.gold:C.green,fontWeight:700}}>{classify_result.grade}</span></div>
            <div><span style={{color:C.textMuted}}>ENTRY: </span><span style={{color:C.textMain}}>{classify_result.entryType} — {classify_result.entryTime}</span></div>
            <div><span style={{color:C.textMuted}}>SWEEP: </span><span style={{color:C.textMain}}>{classify_result.sweepZone}</span></div>
            {classify_result.lightningTier.includes("⚡")&&<div><span style={{color:C.textMuted}}>LIGHTNING: </span><span style={{color:C.gold,fontWeight:700}}>{classify_result.lightningTier}</span></div>}
            {classify_result.cliffFlag&&<div><span style={{color:C.textMuted}}>CLIFF: </span><span style={{color:C.gold,fontWeight:700}}>{classify_result.cliffFlag}</span></div>}
          </div>

          {classify_result.override&&(
            <div style={{marginTop:10,padding:"8px 10px",background:C.blue+"10",borderRadius:6,border:`1px solid ${C.blue}30`}}>
              <span style={{color:C.blue,fontSize:11}}>Override: {classify_result.override}</span>
            </div>
          )}

          {/* Runway */}
          {classify_result.runway&&(
            <div style={{marginTop:10,padding:"8px 10px",background:C.surface,borderRadius:6}}>
              <span style={{color:C.textMuted,fontSize:11}}>Runway: </span>
              <span style={{color:C.teal,fontFamily:"'Space Mono', monospace",fontSize:11,fontWeight:700}}>{classify_result.runway}</span>
              {classify_result.maxGap&&<span style={{color:C.textMuted,fontSize:10}}> (max gap {classify_result.maxGap})</span>}
            </div>
          )}
        </Card>
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
      .then(r=>{if(!r.ok)throw new Error("Bot data unavailable");return r.json();})
      .then(d=>{
        if(d.gex&&d.gex.flip_level){
          setGex(d.gex);
          setLastRefresh(new Date().toLocaleTimeString());
        } else {
          setError("GEX data not available yet — bot runs at 6AM PST");
        }
        setLoading(false);
      })
      .catch(e=>{setError(e.message);setLoading(false);});
  },[]);

  useEffect(()=>{fetchGex();},[fetchGex]);

  if(loading) return <div style={{color:C.textMuted,textAlign:"center",padding:40,fontFamily:"'Space Mono', monospace",fontSize:12}}>Loading Signal Map...</div>;
  if(error) return(
    <Card>
      <SLabel color={C.purple}>⚡ Signal Map</SLabel>
      <div style={{color:C.red,fontSize:12,padding:10,background:C.red+"15",borderRadius:6,border:`1px solid ${C.red}40`,marginBottom:10}}>{error}</div>
      <button onClick={fetchGex} style={{background:C.surface,border:`1px solid ${C.purple}40`,borderRadius:6,padding:"8px 14px",color:C.purple,fontSize:12,cursor:"pointer",width:"100%"}}>↻ Retry</button>
    </Card>
  );
  if(!gex.flip_level) return(
    <div style={{display:"flex",flexDirection:"column",gap:14}}>
      <Card style={{borderColor:C.purple+"40"}}>
        <SLabel color={C.purple}>⚡ Signal Map</SLabel>
        <div style={{color:C.textMuted,fontSize:13,textAlign:"center",padding:20,lineHeight:1.8}}>
          GEX data not available yet.<br/>
          <span style={{fontSize:11,color:C.textDim}}>Bot runs at 6AM PST — data will populate after next run.</span>
        </div>
        <button onClick={fetchGex} style={{background:C.surface,border:`1px solid ${C.purple}40`,borderRadius:6,padding:"10px",color:C.purple,fontSize:12,cursor:"pointer",width:"100%",marginTop:8}}>
          ↻ Check for data
        </button>
        {gex.error&&(
          <div style={{marginTop:10,padding:"8px 10px",background:C.red+"10",borderRadius:6,border:`1px solid ${C.red}30`}}>
            <span style={{color:C.red,fontSize:11}}>{gex.error}</span>
          </div>
        )}
      </Card>
      <Card>
        <SLabel color={C.textMuted}>What to expect</SLabel>
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {[
            ["👑 King Nodes","Strikes with largest negative GEX — puts targets"],
            ["🟢 Call Walls","Strikes with largest positive GEX — calls resistance"],
            ["⚡ Flip Level","Where positive GEX ends and negative begins"],
            ["🧲 Magnet","Single strongest negative GEX strike"],
          ].map(([label,desc])=>(
            <div key={label} style={{display:"flex",gap:10,padding:"8px 0",borderBottom:`1px solid ${C.border}`}}>
              <span style={{fontSize:13,minWidth:120,color:C.textMain,fontWeight:600}}>{label}</span>
              <span style={{fontSize:12,color:C.textMuted}}>{desc}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );

  const isNegative=gex.regime==="NEGATIVE";

  // Safety check — ensure all required fields exist before rendering
  const safeKingNodes = gex.king_nodes || [];
  const safeCallWalls = gex.call_walls || [];
  const safeMagnet = gex.magnet || null;

  return(
    <div style={{display:"flex",flexDirection:"column",gap:14}}>
      {/* Header */}
      <Card style={{borderColor:C.purple+"60"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
          <div>
            <div style={{color:C.purple,fontFamily:"'Space Mono', monospace",fontSize:16,fontWeight:700}}>⚡ SIGNAL MAP</div>
            <div style={{color:C.textMuted,fontSize:11}}>IWM GEX Levels — {new Date().toLocaleDateString("en-US",{month:"short",day:"numeric"})}</div>
          </div>
          <div style={{textAlign:"right",display:"flex",flexDirection:"column",alignItems:"flex-end",gap:4}}>
            <button onClick={fetchGex} style={{background:C.surface,border:`1px solid ${C.purple}40`,borderRadius:6,padding:"5px 10px",color:C.purple,fontSize:11,cursor:"pointer"}}>↻ Refresh</button>
            {lastRefresh&&<div style={{color:C.textMuted,fontSize:10}}>Updated {lastRefresh}</div>}
            <div style={{color:isNegative?C.red:C.green,fontFamily:"'Space Mono', monospace",fontSize:12,fontWeight:700}}>
              {isNegative?"⬇ NEG":"⬆ POS"} REGIME
            </div>
          </div>
        </div>

        {/* Flip level */}
        <div style={{padding:"12px 14px",background:C.surface,borderRadius:8,border:`2px solid ${C.gold}`,marginBottom:14,textAlign:"center"}}>
          <div style={{color:C.textMuted,fontSize:10,marginBottom:4,letterSpacing:"0.1em"}}>FLIP LEVEL — LINE IN THE SAND</div>
          <div style={{color:C.gold,fontFamily:"'Space Mono', monospace",fontSize:28,fontWeight:700}}>{gex.flip_level}</div>
          <div style={{color:C.textMuted,fontSize:11,marginTop:4}}>
            Above = positive regime (dealers slow moves) · Below = negative regime (dealers amplify moves)
          </div>
        </div>

        {/* Above = call walls */}
        {safeCallWalls.length>0&&(
          <div style={{marginBottom:14}}>
            <div style={{color:C.green,fontSize:11,fontWeight:700,letterSpacing:"0.1em",marginBottom:8}}>▲ ABOVE (calls face resistance)</div>
            {safeCallWalls.map((w,i)=>(
              <div key={i} style={{display:"flex",alignItems:"center",gap:10,marginBottom:6}}>
                <div style={{width:36,height:36,borderRadius:8,background:C.green+"20",border:`1px solid ${C.green}40`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                  <span style={{fontSize:14}}>🟢</span>
                </div>
                <div style={{flex:1}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline"}}>
                    <span style={{color:C.textMain,fontFamily:"'Space Mono', monospace",fontSize:14,fontWeight:700}}>{w.strike}</span>
                    <span style={{color:C.green,fontFamily:"'Space Mono', monospace",fontSize:12}}>+{w.gex}M</span>
                  </div>
                  <div style={{height:4,background:C.surface,borderRadius:2,marginTop:4,overflow:"hidden"}}>
                    <div style={{width:`${Math.min((w.gex/(safeCallWalls[0]?.gex||1))*100,100)}%`,height:"100%",background:C.green+"80",borderRadius:2}}/>
                  </div>
                </div>
                <div style={{color:C.textMuted,fontSize:10,minWidth:60,textAlign:"right"}}>
                  {i===0?"← STRONGEST":i===1?"WALL":"wall"}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Divider at flip */}
        <div style={{display:"flex",alignItems:"center",gap:10,margin:"10px 0"}}>
          <div style={{flex:1,height:1,background:C.gold+"60"}}/>
          <span style={{color:C.gold,fontFamily:"'Space Mono', monospace",fontSize:11,fontWeight:700}}>FLIP {gex.flip_level}</span>
          <div style={{flex:1,height:1,background:C.gold+"60"}}/>
        </div>

        {/* Below = king nodes */}
        {safeKingNodes.length>0&&(
          <div>
            <div style={{color:C.red,fontSize:11,fontWeight:700,letterSpacing:"0.1em",marginBottom:8}}>▼ BELOW (puts targets)</div>
            {safeKingNodes.map((n,i)=>{
              const isKing=Math.abs(n.gex)>20;
              const isMagnet=gex.magnet?.strike===n.strike;
              return(
                <div key={i} style={{display:"flex",alignItems:"center",gap:10,marginBottom:6}}>
                  <div style={{width:36,height:36,borderRadius:8,background:isKing?C.gold+"20":C.red+"15",border:`1px solid ${isKing?C.gold:C.red}40`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                    <span style={{fontSize:14}}>{isMagnet?"🧲":isKing?"👑":"🚪"}</span>
                  </div>
                  <div style={{flex:1}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline"}}>
                      <span style={{color:C.textMain,fontFamily:"'Space Mono', monospace",fontSize:14,fontWeight:700}}>{n.strike}</span>
                      <span style={{color:C.red,fontFamily:"'Space Mono', monospace",fontSize:12}}>{n.gex}M</span>
                    </div>
                    <div style={{height:4,background:C.surface,borderRadius:2,marginTop:4,overflow:"hidden"}}>
                      <div style={{width:`${Math.min((Math.abs(n.gex)/Math.abs(safeKingNodes[0]?.gex||1))*100,100)}%`,height:"100%",background:isKing?C.gold+"80":C.red+"60",borderRadius:2}}/>
                    </div>
                  </div>
                  <div style={{color:isKing?C.gold:C.textMuted,fontSize:10,minWidth:60,textAlign:"right",fontWeight:isKing?700:400}}>
                    {isMagnet?"MAGNET":isKing?"KING":i===0?"primary":"secondary"}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Summary targets */}
      <Card>
        <SLabel color={C.purple}>Trade Targets</SLabel>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          <div style={{background:C.surface,borderRadius:8,padding:12,border:`1px solid ${C.green}30`}}>
            <div style={{color:C.textMuted,fontSize:10,marginBottom:4}}>CALLS MAX</div>
            <div style={{color:C.green,fontFamily:"'Space Mono', monospace",fontSize:18,fontWeight:700}}>
              {safeCallWalls[0]?.strike||"—"}
            </div>
            <div style={{color:C.textMuted,fontSize:11}}>Positive GEX wall — dealers slow calls here</div>
          </div>
          <div style={{background:C.surface,borderRadius:8,padding:12,border:`1px solid ${C.red}30`}}>
            <div style={{color:C.textMuted,fontSize:10,marginBottom:4}}>PUTS TARGET</div>
            <div style={{color:C.red,fontFamily:"'Space Mono', monospace",fontSize:18,fontWeight:700}}>
              {safeKingNodes[0]?.strike||"—"}{safeKingNodes[1]?.strike?` → ${safeKingNodes[1].strike}`:""}
            </div>
            <div style={{color:C.textMuted,fontSize:11}}>King node — institutional magnet below</div>
          </div>
        </div>
      </Card>

      {/* Regime note */}
      <Card>
        <SLabel color={C.purple}>Regime</SLabel>
        <div style={{padding:"10px 12px",background:isNegative?C.red+"10":C.green+"10",borderRadius:8,border:`1px solid ${isNegative?C.red:C.green}30`}}>
          <div style={{color:isNegative?C.red:C.green,fontFamily:"'Space Mono', monospace",fontWeight:700,marginBottom:6}}>
            {isNegative?"NEGATIVE GAMMA":"POSITIVE GAMMA"}
          </div>
          <div style={{color:C.textMuted,fontSize:12,lineHeight:1.6}}>
            {isNegative
              ?"Price is below flip level. Dealers are short gamma — moves AMPLIFY in both directions. Puts targets are magnetic."
              :"Price is above flip level. Dealers are long gamma — moves SLOW near key strikes. Pinning behavior likely."}
          </div>
        </div>
      </Card>
    </div>
  );
}


// ── SIDEBAR COMPONENT ─────────────────────────────────────────────
function Sidebar({trades, page, setPage, isOpen, onClose}){
  const traded = trades.filter(t => t.result !== "SKIP");
  const wins = traded.filter(t => t.result === "WIN");
  const losses = traded.filter(t => t.result === "LOSS");
  
  // Current streak
  let streak = 0;
  let streakType = null;
  const sorted = [...traded].sort((a,b) => (b.day||0) - (a.day||0));
  for(const t of sorted){
    if(!streakType) streakType = t.result;
    if(t.result === streakType) streak++;
    else break;
  }
  
  // This week
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay());
  const weekTrades = traded.filter(t => {
    if(!t.date) return false;
    return new Date(t.date+"T12:00:00") >= weekStart;
  });
  const weekPnL = weekTrades.reduce((s,t) => s+(t.pnl||0), 0);
  const weekWins = weekTrades.filter(t => t.result==="WIN").length;
  const weekLosses = weekTrades.filter(t => t.result==="LOSS").length;
  
  // This month
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthTrades = traded.filter(t => {
    if(!t.date) return false;
    return new Date(t.date+"T12:00:00") >= monthStart;
  });
  const monthPnL = monthTrades.reduce((s,t) => s+(t.pnl||0), 0);
  const monthWins = monthTrades.filter(t => t.result==="WIN").length;
  const monthLosses = monthTrades.filter(t => t.result==="LOSS").length;

  const nav = [
    {id:"morning", label:"Morning", icon:"📡"},
    {id:"signals", label:"Signal Map", icon:"⚡"},
    {id:"calendar", label:"Calendar", icon:"📅"},
    {id:"log", label:"Trade Log", icon:"📋"},
    {id:"analytics", label:"Stats", icon:"📊"},
  ];

  if(!isOpen) return null;

  return(
    <>
      {/* Backdrop */}
      <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",zIndex:200}}/>
      {/* Drawer */}
      <div style={{position:"fixed",top:0,left:0,bottom:0,width:280,background:C.surface,borderRight:`1px solid ${C.border}`,zIndex:201,display:"flex",flexDirection:"column",overflow:"hidden"}}>
        {/* Header */}
        <div style={{padding:"16px 20px",borderBottom:`1px solid ${C.border}`,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <span style={{fontSize:18}}>⚡</span>
            <span style={{fontFamily:"'Space Mono',monospace",fontSize:13,fontWeight:700,color:C.textMain}}>STEALTH SIGNALS</span>
          </div>
          <button onClick={onClose} style={{background:"none",border:"none",color:C.textMuted,fontSize:20,cursor:"pointer"}}>×</button>
        </div>
        
        {/* Nav */}
        <div style={{padding:"12px 12px 0"}}>
          {nav.map(n=>(
            <button key={n.id} onClick={()=>{setPage(n.id);onClose();}}
              style={{width:"100%",background:page===n.id?C.teal+"15":"none",border:`1px solid ${page===n.id?C.teal+"40":"transparent"}`,borderRadius:8,padding:"10px 12px",color:page===n.id?C.teal:C.textMuted,fontSize:13,cursor:"pointer",display:"flex",alignItems:"center",gap:10,marginBottom:4,textAlign:"left"}}>
              <span style={{fontSize:16}}>{n.icon}</span>
              <span style={{fontFamily:"'DM Sans',sans-serif",fontWeight:page===n.id?700:400}}>{n.label}</span>
            </button>
          ))}
        </div>
        
        <div style={{height:1,background:C.border,margin:"12px 0"}}/>
        
        {/* Quick Stats */}
        <div style={{padding:"0 12px",flex:1,overflowY:"auto"}}>
          {/* Current Streak */}
          <div style={{background:C.card,borderRadius:10,padding:"12px 14px",marginBottom:10,border:`1px solid ${C.border}`}}>
            <div style={{color:C.textMuted,fontSize:10,letterSpacing:"0.12em",textTransform:"uppercase",marginBottom:6}}>🔥 Current Streak</div>
            {streak > 0 ? (
              <div style={{color:streakType==="WIN"?C.green:C.red,fontFamily:"'Space Mono',monospace",fontSize:18,fontWeight:700}}>
                {streak} {streakType==="WIN"?"win":"loss"}{streak>1?"s":""} {streakType==="WIN"?"🤑":"🤬"}
              </div>
            ) : (
              <div style={{color:C.textMuted,fontSize:13}}>No streak yet</div>
            )}
          </div>
          
          {/* This Week */}
          <div style={{background:C.card,borderRadius:10,padding:"12px 14px",marginBottom:10,border:`1px solid ${C.border}`}}>
            <div style={{color:C.textMuted,fontSize:10,letterSpacing:"0.12em",textTransform:"uppercase",marginBottom:6}}>↗ This Week</div>
            {weekTrades.length > 0 ? (
              <>
                <div style={{color:weekPnL>=0?C.green:C.red,fontFamily:"'Space Mono',monospace",fontSize:16,fontWeight:700}}>
                  {weekPnL>=0?"+":""}${weekPnL.toFixed(2)}
                </div>
                <div style={{color:C.textMuted,fontSize:11,marginTop:2}}>{weekWins}W / {weekLosses}L · {weekTrades.length} days</div>
              </>
            ) : (
              <div style={{color:C.textMuted,fontSize:13}}>No trades this week</div>
            )}
          </div>
          
          {/* This Month */}
          <div style={{background:C.card,borderRadius:10,padding:"12px 14px",marginBottom:10,border:`1px solid ${C.border}`}}>
            <div style={{color:C.textMuted,fontSize:10,letterSpacing:"0.12em",textTransform:"uppercase",marginBottom:6}}>↘ This Month</div>
            {monthTrades.length > 0 ? (
              <>
                <div style={{color:monthPnL>=0?C.green:C.red,fontFamily:"'Space Mono',monospace",fontSize:16,fontWeight:700}}>
                  {monthPnL>=0?"+":""}${monthPnL.toFixed(2)}
                </div>
                <div style={{color:C.textMuted,fontSize:11,marginTop:2}}>{monthWins}W / {monthLosses}L · {monthTrades.length} days</div>
              </>
            ) : (
              <div style={{color:C.textMuted,fontSize:13}}>No trades this month</div>
            )}
          </div>
          
          {/* Days Logged */}
          <div style={{color:C.textMuted,fontSize:12,textAlign:"center",padding:"8px 0"}}>
            📅 {trades.length} days logged
          </div>
        </div>
        
        {/* Version */}
        <div style={{padding:"12px 20px",borderTop:`1px solid ${C.border}`,color:C.textDim,fontSize:10,fontFamily:"'Space Mono',monospace"}}>
          v2.30 · Stealth Signals
        </div>
      </div>
    </>
  );
}

// ── CALENDAR (unchanged) ──────────────────────────────────────────
function CalendarPage({trades,onSelectDay}){
  const [cur,setCur]=useState(()=>{const n=new Date();return{year:n.getFullYear(),month:n.getMonth()};});
  const [isMobile,setIsMobile]=useState(window.innerWidth<640);
  useEffect(()=>{const fn=()=>setIsMobile(window.innerWidth<640);window.addEventListener("resize",fn);return()=>window.removeEventListener("resize",fn);},[]);
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
  const weekCount=wk=>{let t=0;wk.forEach(d=>{if(!d)return;if(byDate[`${year}-${String(month+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`])t++;});return t;};
  const today=new Date();
  const todayStr=`${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,"0")}-${String(today.getDate()).padStart(2,"0")}`;
  const weekColW=isMobile?"56px":"90px";
  const cellSize=isMobile?"calc((100vw - 28px - 56px - 16px) / 7)":"calc((min(800px, 100vw) - 32px - 90px - 24px) / 7)";
  const cellH=isMobile?cellSize:"80px";
  const dayFS=isMobile?9:12;const pnlFS=isMobile?10:13;const pctFS=isMobile?8:11;
  return(
    <div>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12,flexWrap:"wrap",gap:8}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <button onClick={()=>setCur(p=>{const d=new Date(p.year,p.month-1);return{year:d.getFullYear(),month:d.getMonth()};})} style={{background:"none",border:"none",color:C.textMuted,fontSize:22,cursor:"pointer",padding:"2px 6px"}}>‹</button>
          <span style={{fontFamily:"'Space Mono', monospace",fontSize:15,fontWeight:700,color:C.textMain}}>{MONTHS[month]} {year}</span>
          <button onClick={()=>setCur(p=>{const d=new Date(p.year,p.month+1);return{year:d.getFullYear(),month:d.getMonth()};})} style={{background:"none",border:"none",color:C.textMuted,fontSize:22,cursor:"pointer",padding:"2px 6px"}}>›</button>
        </div>
        <div style={{textAlign:"right"}}>
          <div style={{color:monthPnL>=0?C.green:C.red,fontFamily:"'Space Mono', monospace",fontSize:16,fontWeight:700}}>{monthPnL>=0?"+":""}${monthPnL.toFixed(2)}</div>
          <div style={{color:C.textMuted,fontSize:11}}>{monthWins}W/{monthLosses}L · {monthTrades.length} days</div>
        </div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:`repeat(7,${cellSize}) ${weekColW}`,gap:2,marginBottom:2}}>
        {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(d=><div key={d} style={{color:C.textMuted,fontSize:isMobile?9:11,textAlign:"center",padding:"4px 0",fontFamily:"'Space Mono', monospace"}}>{isMobile?d[0]:d}</div>)}
        <div style={{color:C.textMuted,fontSize:isMobile?9:11,textAlign:"center",padding:"4px 0",fontFamily:"'Space Mono', monospace"}}>Wk</div>
      </div>
      {weeks.map((wk,wi)=>{
        const wPnL=weekPnL(wk);const wDays=weekCount(wk);
        return(<div key={wi} style={{display:"grid",gridTemplateColumns:`repeat(7,${cellSize}) ${weekColW}`,gap:2,marginBottom:2}}>
          {wk.map((d,di)=>{
            if(!d)return<div key={di} style={{width:cellSize,height:cellH,background:C.surface+"30",borderRadius:5}}/>;
            const dateStr=`${year}-${String(month+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
            const trade=byDate[dateStr];const isToday=dateStr===todayStr;
            const isBest=trade&&trade.result==="WIN"&&trade.pnl===bestPnL&&bestPnL>0;
            const bgColor=!trade?C.surface+"50":isBest?C.gold+"22":trade.result==="WIN"?C.green+"18":trade.result==="LOSS"?C.red+"18":C.surface+"50";
            const borderColor=isToday?C.teal:!trade?C.border:isBest?C.gold:trade.result==="WIN"?C.green+"60":trade.result==="LOSS"?C.red+"60":C.border;
            return(<div key={di} onClick={()=>trade&&onSelectDay(trade)}
              style={{width:cellSize,height:cellH,background:bgColor,border:`1px solid ${borderColor}`,borderRadius:5,padding:"4px 3px",cursor:trade?"pointer":"default",display:"flex",flexDirection:"column",justifyContent:"space-between",overflow:"hidden",boxSizing:"border-box"}}>
              <div style={{color:isToday?C.teal:C.textMuted,fontFamily:"'Space Mono', monospace",fontSize:dayFS,lineHeight:1}}>{d}</div>
              {trade&&trade.result!=="SKIP"&&(<div style={{textAlign:"center"}}>
                <div style={{color:isBest?C.gold:trade.pnl>=0?C.green:C.red,fontFamily:"'Space Mono', monospace",fontSize:pnlFS,fontWeight:700,lineHeight:1.1,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{trade.pnl>=0?"+":""}${trade.pnl}</div>
                {trade.pct!==0&&<div style={{color:isBest?C.gold+"aa":trade.pct>=0?C.green+"88":C.red+"88",fontSize:pctFS,lineHeight:1.1}}>{trade.pct>=0?"+":""}{trade.pct}%</div>}
              </div>)}
              {trade&&trade.result==="SKIP"&&<div style={{color:C.textDim,fontSize:8,textAlign:"center"}}>—</div>}
            </div>);
          })}
          <div style={{width:weekColW,height:cellH,background:C.surface,border:`1px solid ${C.border}`,borderRadius:5,display:"flex",flexDirection:"column",justifyContent:"center",alignItems:"center",overflow:"hidden",boxSizing:"border-box"}}>
            <div style={{color:C.textMuted,fontSize:isMobile?8:10,fontFamily:"'Space Mono', monospace",marginBottom:1}}>W{wi+1}</div>
            <div style={{color:wPnL>=0?C.green:C.red,fontFamily:"'Space Mono', monospace",fontSize:isMobile?10:12,fontWeight:700,lineHeight:1,whiteSpace:"nowrap"}}>{wPnL>=0?"+":""}${Math.abs(wPnL)}</div>
            <div style={{color:C.textDim,fontSize:isMobile?8:10,marginTop:1}}>{wDays}d</div>
          </div>
        </div>);
      })}
      <div style={{marginTop:10,display:"flex",alignItems:"center",gap:12,flexWrap:"wrap"}}>
        {[[C.gold,"Best day"],[C.green,"Win"],[C.red,"Loss"]].map(([c,l])=>(
          <div key={l} style={{display:"flex",alignItems:"center",gap:5}}><div style={{width:10,height:10,borderRadius:2,background:c+"30",border:`1px solid ${c}60`}}/><span style={{color:C.textMuted,fontSize:10}}>{l}</span></div>
        ))}
      </div>
    </div>
  );
}

// ── DAY MODAL (with journal line break fix) ───────────────────────
function DayModal({trade,onClose,onEdit,onDelete}){
  if(!trade)return null;
  const wrongDir=trade.correctDirection&&trade.direction!==trade.correctDirection&&trade.correctDirection!=="SKIP";
  const emoji=trade.result==="WIN"?"🤑":trade.result==="LOSS"?"🤬":"😐";
  return(
    <div style={{position:"fixed",inset:0,zIndex:300,background:"rgba(0,0,0,0.85)",display:"flex",alignItems:"flex-end"}} onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} style={{background:C.card,borderRadius:"16px 16px 0 0",padding:22,width:"100%",maxHeight:"92vh",overflowY:"auto",border:`1px solid ${C.border}`}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:18}}>
          <div style={{display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>
            <span style={{color:C.textMain,fontFamily:"'Space Mono', monospace",fontSize:20,fontWeight:700}}>Day {trade.day}</span>
            <span style={{color:C.textMuted,fontSize:14}}>{formatDate(trade.date)}</span>
            <Badge text={trade.result} color={resultColor(trade.result)}/>
            <span style={{fontSize:20}}>{emoji}</span>
          </div>
          <button onClick={onClose} style={{background:"none",border:"none",color:C.textMuted,fontSize:24,cursor:"pointer"}}>×</button>
        </div>
        <div style={{borderTop:`1px solid ${C.border}`,borderBottom:`1px solid ${C.border}`,padding:"14px 0",marginBottom:16}}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"8px 20px"}}>
            {[["Gap",trade.gap],["Open",trade.openPrice],["Range",trade.range],["Vol",trade.volToday],["5-Day %",trade.fiveDayPercent?`${trade.fiveDayPercent}%`:null],["Close %",trade.closePercent?`${trade.closePercent}%`:null]].filter(([,v])=>v).map(([k,v])=>(
              <div key={k} style={{display:"flex",gap:6}}><span style={{color:C.textMuted,fontSize:13}}>{k}:</span><span style={{color:C.textMain,fontSize:13,fontWeight:600}}>{v}</span></div>
            ))}
          </div>
        </div>
        {trade.result!=="SKIP"&&(
          <div style={{marginBottom:16}}>
            <div style={{color:C.textMuted,fontSize:11,letterSpacing:"0.12em",textTransform:"uppercase",marginBottom:10}}>Trade</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px 20px",marginBottom:12}}>
              <div style={{display:"flex",gap:6}}><span style={{color:C.textMuted,fontSize:13}}>Direction:</span><span style={{color:trade.direction.includes("CALLS")?C.green:C.red,fontSize:13,fontWeight:700}}>{trade.direction}</span></div>
              <div style={{display:"flex",gap:6}}><span style={{color:C.textMuted,fontSize:13}}>P/L:</span><span style={{color:trade.pnl>=0?C.green:C.red,fontSize:13,fontWeight:700}}>{trade.pct>=0?"+":""}{trade.pct}% (${Math.abs(trade.pnl)})</span></div>
              {trade.entryTime&&<div style={{display:"flex",gap:6}}><span style={{color:C.textMuted,fontSize:13}}>Entry:</span><span style={{color:C.textMain,fontSize:13,fontWeight:600}}>{trade.entryTime}{trade.entryPrice?` @ $${trade.entryPrice}`:""}</span></div>}
              {trade.exitTime&&<div style={{display:"flex",gap:6}}><span style={{color:C.textMuted,fontSize:13}}>Exit:</span><span style={{color:C.textMain,fontSize:13,fontWeight:600}}>{trade.exitTime}{trade.exitPrice?` @ $${trade.exitPrice}`:""}</span></div>}
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
              <div style={{background:C.surface,borderRadius:8,padding:"10px 12px"}}><div style={{color:C.textMuted,fontSize:10,marginBottom:3,textTransform:"uppercase"}}>You Traded</div><div style={{color:trade.direction.includes("CALLS")?C.green:C.red,fontWeight:700,fontSize:14}}>{trade.direction}</div></div>
              <div style={{background:C.surface,borderRadius:8,padding:"10px 12px"}}><div style={{color:C.textMuted,fontSize:10,marginBottom:3,textTransform:"uppercase"}}>Correct Bias</div>{wrongDir?<div style={{color:trade.correctDirection==="CALLS"?C.green:C.red,fontWeight:700,fontSize:14}}>{trade.correctDirection} ⚠️</div>:<div style={{color:C.green,fontWeight:700,fontSize:14}}>✅ Aligned</div>}</div>
            </div>
          </div>
        )}
        <div style={{borderTop:`1px solid ${C.border}`,marginBottom:16}}/>
        {trade.whatWorked&&<div style={{marginBottom:14}}><span style={{color:C.green,fontSize:13,fontWeight:700}}>What Worked: </span><span style={{color:C.textMain,fontSize:13,lineHeight:1.6}}>{trade.whatWorked}</span></div>}
        {trade.learning&&<div style={{marginBottom:14}}><span style={{color:C.blue,fontSize:13,fontWeight:700}}>Key Learning: </span><span style={{color:C.textMain,fontSize:13,lineHeight:1.6}}>{trade.learning}</span></div>}
        {trade.journal&&(
          <div style={{marginBottom:16}}>
            <div style={{color:C.textMuted,fontSize:11,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:8}}>Daily Journal</div>
            {/* Journal with line breaks preserved */}
            <div style={{color:C.textMuted,fontSize:13,lineHeight:1.7,whiteSpace:"pre-wrap"}}>
              {trade.journal}
            </div>
          </div>
        )}
        {trade.tags&&trade.tags.length>0&&<div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:20}}>{trade.tags.map(t=><Badge key={t} text={`#${t}`} color={C.teal} small/>)}</div>}
        <div style={{display:"grid",gridTemplateColumns:"1fr auto",gap:10}}>
          <button onClick={onEdit} style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:10,padding:"13px",color:C.textMain,fontSize:14,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>✏️ Edit Day</button>
          <button onClick={onDelete} style={{background:C.red+"15",border:`1px solid ${C.red}40`,borderRadius:10,padding:"13px 18px",color:C.red,fontSize:18,cursor:"pointer"}}>🗑</button>
        </div>
      </div>
    </div>
  );
}

// ── TRADE LOG (with journal line break fix + What Worked fix) ─────
function TradePage({trades,setTrades,editTrade,setEditTrade}){
  const blank={day:"",date:"",direction:"CALLS",correctDirection:"CALLS",result:"WIN",pnl:0,pct:0,strat:"N/A",story:"",grade:"A",playType:"One-Act",range:"",gap:"",openPrice:"",volToday:"",closePercent:"",fiveDayPercent:"",entryTime:"",exitTime:"",entryPrice:"",exitPrice:"",whatWorked:"",learning:"",journal:"",tags:[]};
  const [form,setForm]=useState(editTrade||blank);
  const [eodText,setEodText]=useState("");
  const [parsed,setParsed]=useState(null);
  const [missing,setMissing]=useState([]);
  const [showForm,setShowForm]=useState(!!editTrade);
  const [saved,setSaved]=useState(false);
  const setF=(k,v)=>setForm(p=>({...p,[k]:v}));

  const handleParse=()=>{
    const ext=parseEOD(eodText);
    setParsed(ext);
    setForm(p=>({...p,...ext,eodSummary:eodText}));
    const needed=["day","date","result","strat","grade"];
    setMissing(needed.filter(k=>!ext[k]));
    setShowForm(true);
  };

  const handleSave=async()=>{
    const trade={...form,day:parseInt(form.day)||trades.length+1,pnl:parseFloat(form.pnl)||0,pct:parseFloat(form.pct)||0};
    let updated;
    if(editTrade){updated=trades.map(t=>t.day===editTrade.day?trade:t);}
    else{updated=[...trades.filter(t=>t.day!==trade.day),trade].sort((a,b)=>a.day-b.day);}
    setTrades(updated);
    await storageSave(updated);
    setSaved(true);setTimeout(()=>setSaved(false),2000);
    if(editTrade){setEditTrade(null);}
    setForm(blank);setEodText("");setParsed(null);setShowForm(false);
  };

  const s={background:C.surface,border:`1px solid ${C.border}`,borderRadius:8,padding:"10px 12px",color:C.textMain,fontSize:13,width:"100%",boxSizing:"border-box",fontFamily:"inherit"};

  return(
    <div style={{maxWidth:680,margin:"0 auto"}}>
      {/* EOD Paste */}
      <Card style={{marginBottom:14}}>
        <SLabel color={C.gold}>📋 Paste EOD Summary</SLabel>
        <textarea value={eodText} onChange={e=>setEodText(e.target.value)}
          placeholder="Paste your full EOD summary here — same format as always. Parser will extract all fields automatically."
          style={{...s,height:130,resize:"vertical",fontFamily:"'Space Mono', monospace",fontSize:11,lineHeight:1.5}}/>
        <button onClick={handleParse} style={{marginTop:10,background:C.gold+"20",border:`1px solid ${C.gold}60`,borderRadius:8,padding:"11px 20px",color:C.gold,fontSize:13,fontWeight:700,cursor:"pointer",width:"100%"}}>
          Parse EOD →
        </button>
        {parsed&&(
          <div style={{marginTop:10}}>
            <div style={{color:C.textMuted,fontSize:11,marginBottom:6}}>Extracted:</div>
            <div style={{display:"flex",flexWrap:"wrap",gap:5}}>
              {Object.entries(parsed).filter(([k,v])=>v&&k!=="tags"&&k!=="eodSummary").map(([k,v])=>(
                <div key={k} style={{background:C.surface,borderRadius:4,padding:"2px 7px",fontSize:10}}>
                  <span style={{color:C.textMuted}}>{k}: </span>
                  <span style={{color:C.teal,fontWeight:700}}>{String(v).slice(0,30)}</span>
                </div>
              ))}
            </div>
            {missing.length>0&&<div style={{marginTop:8,color:C.orange,fontSize:11}}>⚠️ Missing: {missing.join(", ")} — fill in below</div>}
          </div>
        )}
      </Card>

      {/* Form */}
      {showForm&&(
        <Card>
          <SLabel color={C.blue}>Trade Details</SLabel>
          <div style={{display:"flex",flexDirection:"column",gap:12}}>
            <Row2>
              <div><label style={lbl}>Day #</label><input style={s} type="number" value={form.day} onChange={e=>setF("day",e.target.value)} placeholder="127"/></div>
              <div><label style={lbl}>Date</label><input style={s} type="date" value={form.date} onChange={e=>setF("date",e.target.value)}/></div>
            </Row2>
            <Row2>
              <div><label style={lbl}>Result</label>
                <select style={s} value={form.result} onChange={e=>setF("result",e.target.value)}>
                  {["WIN","LOSS","SKIP"].map(r=><option key={r}>{r}</option>)}
                </select>
              </div>
              <div><label style={lbl}>Grade</label>
                <select style={s} value={form.grade} onChange={e=>setF("grade",e.target.value)}>
                  {["A+","A","B+","Skip"].map(g=><option key={g}>{g}</option>)}
                </select>
              </div>
            </Row2>
            <Row2>
              <div><label style={lbl}>Direction</label>
                <select style={s} value={form.direction} onChange={e=>setF("direction",e.target.value)}>
                  {["CALLS","PUTS","CALLS/PUTS","SKIP"].map(d=><option key={d}>{d}</option>)}
                </select>
              </div>
              <div><label style={lbl}>Correct Bias</label>
                <select style={s} value={form.correctDirection} onChange={e=>setF("correctDirection",e.target.value)}>
                  {["CALLS","PUTS","SKIP"].map(d=><option key={d}>{d}</option>)}
                </select>
              </div>
            </Row2>
            <Row2>
              <div><label style={lbl}>P&L ($)</label><input style={s} type="number" value={form.pnl} onChange={e=>setF("pnl",e.target.value)}/></div>
              <div><label style={lbl}>P&L (%)</label><input style={s} type="number" value={form.pct} onChange={e=>setF("pct",e.target.value)}/></div>
            </Row2>
            <Row2>
              <div><label style={lbl}>Play Type</label>
                <select style={s} value={form.playType||""} onChange={e=>setF("playType",e.target.value)}>
                  {["One-Act","Two-Act",""].map(p=><option key={p}>{p}</option>)}
                </select>
              </div>
              <div><label style={lbl}>Strat</label><input style={s} value={form.strat} onChange={e=>setF("strat",e.target.value)} placeholder="2up/2up"/></div>
            </Row2>
            <div><label style={lbl}>What Worked</label>
              <textarea style={{...s,height:70,resize:"vertical",whiteSpace:"pre-wrap"}} value={form.whatWorked||""} onChange={e=>setF("whatWorked",e.target.value)}/></div>
            <div><label style={lbl}>Key Learning</label>
              <textarea style={{...s,height:70,resize:"vertical",whiteSpace:"pre-wrap"}} value={form.learning||""} onChange={e=>setF("learning",e.target.value)}/></div>
            <div>
              <label style={lbl}>Daily Journal</label>
              {/* Journal textarea preserves line breaks */}
              <textarea
                style={{...s,height:120,resize:"vertical",whiteSpace:"pre-wrap",lineHeight:1.6}}
                value={form.journal||""}
                onChange={e=>setF("journal",e.target.value)}
                placeholder={"Journal entry here...\n\nYou can add spaces between lines.\nEach line break is preserved."}
              />
            </div>
            <button onClick={handleSave}
              style={{background:saved?C.green+"30":C.teal+"20",border:`1px solid ${saved?C.green:C.teal}60`,borderRadius:10,padding:"14px",color:saved?C.green:C.teal,fontSize:14,fontWeight:700,cursor:"pointer"}}>
              {saved?"✅ Saved!":"💾 Save Trade"}
            </button>
          </div>
        </Card>
      )}
    </div>
  );
}

// ── ANALYTICS (unchanged) ─────────────────────────────────────────
function AnalyticsPage({trades}){
  const traded=trades.filter(d=>d.result!=="SKIP");
  const wins=traded.filter(d=>d.result==="WIN");
  const wr=traded.length?Math.round(wins.length/traded.length*100):0;
  const totalPnL=trades.reduce((s,d)=>s+(d.pnl||0),0);
  const byGrade=["A+","A","B+"].map(g=>{const days=traded.filter(d=>d.grade===g);const w=days.filter(d=>d.result==="WIN");return{grade:g,total:days.length,wins:w.length,wr:days.length?Math.round(w.length/days.length*100):0};});
  const oneAct=traded.filter(d=>d.playType==="One-Act");const twoAct=traded.filter(d=>d.playType==="Two-Act");
  const oaWR=oneAct.length?Math.round(oneAct.filter(d=>d.result==="WIN").length/oneAct.length*100):0;
  const taWR=twoAct.length?Math.round(twoAct.filter(d=>d.result==="WIN").length/twoAct.length*100):0;
  const misaligned=traded.filter(d=>d.correctDirection&&d.direction!==d.correctDirection&&d.correctDirection!=="SKIP");
  const monthly={};trades.forEach(d=>{if(!d.date)return;const m=d.date.slice(0,7);if(!monthly[m])monthly[m]=0;monthly[m]+=d.pnl||0;});
  const monthlyData=Object.entries(monthly).map(([m,p])=>({month:new Date(m+"-01").toLocaleDateString("en-US",{month:"short"}),pnl:p}));
  return(
    <div style={{display:"flex",flexDirection:"column",gap:16}}>
      <Card><div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:16,textAlign:"center"}}>
        <div><div style={{color:wr>50?C.green:C.red,fontFamily:"'Space Mono', monospace",fontSize:26,fontWeight:700}}>{wr}%</div><div style={{color:C.textMuted,fontSize:10,textTransform:"uppercase"}}>Win Rate</div></div>
        <div><div style={{color:totalPnL>=0?C.green:C.red,fontFamily:"'Space Mono', monospace",fontSize:20,fontWeight:700}}>{totalPnL>=0?"+":""}${totalPnL}</div><div style={{color:C.textMuted,fontSize:10,textTransform:"uppercase"}}>Total P&L</div></div>
        <div><div style={{color:C.teal,fontFamily:"'Space Mono', monospace",fontSize:26,fontWeight:700}}>{trades.length}</div><div style={{color:C.textMuted,fontSize:10,textTransform:"uppercase"}}>Days</div></div>
      </div></Card>
      <Card><SLabel>Monthly P&L</SLabel>
        <ResponsiveContainer width="100%" height={150}>
          <BarChart data={monthlyData}><XAxis dataKey="month" tick={{fill:C.textMuted,fontSize:10}} axisLine={false} tickLine={false}/><YAxis tick={{fill:C.textMuted,fontSize:10}} axisLine={false} tickLine={false}/><Tooltip contentStyle={{background:C.card,border:`1px solid ${C.border}`,borderRadius:8,color:C.textMain}}/><Bar dataKey="pnl" radius={4}>{monthlyData.map((d,i)=><Cell key={i} fill={d.pnl>=0?C.green:C.red} fillOpacity={0.8}/>)}</Bar></BarChart>
        </ResponsiveContainer>
      </Card>
      <Card><SLabel>Direction Alignment</SLabel>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
          <div style={{background:C.surface,borderRadius:8,padding:14,textAlign:"center",border:`1px solid ${C.green}30`}}><div style={{color:C.green,fontFamily:"'Space Mono', monospace",fontSize:22,fontWeight:700}}>{traded.length-misaligned.length}</div><div style={{color:C.textMuted,fontSize:10,marginTop:4}}>ALIGNED DAYS</div></div>
          <div style={{background:C.surface,borderRadius:8,padding:14,textAlign:"center",border:`1px solid ${C.red}30`}}><div style={{color:C.red,fontFamily:"'Space Mono', monospace",fontSize:22,fontWeight:700}}>{misaligned.length}</div><div style={{color:C.textMuted,fontSize:10,marginTop:4}}>WRONG BIAS</div></div>
        </div>
      </Card>
      <Card><SLabel>Grade Performance</SLabel>
        {byGrade.map(g=>(<div key={g.grade} style={{display:"flex",alignItems:"center",gap:12,marginBottom:10}}>
          <Badge text={g.grade} color={g.grade==="A+"?C.gold:g.grade==="A"?C.green:C.blue}/>
          <div style={{flex:1,height:6,background:C.surface,borderRadius:3,overflow:"hidden"}}><div style={{width:`${g.wr}%`,height:"100%",background:g.wr>60?C.green:g.wr>40?C.gold:C.red,borderRadius:3}}/></div>
          <span style={{color:C.textMain,fontFamily:"'Space Mono', monospace",fontSize:13,minWidth:40}}>{g.wr}%</span>
          <span style={{color:C.textMuted,fontSize:12}}>{g.wins}/{g.total}</span>
        </div>))}
      </Card>
      <Card><SLabel>Play Type</SLabel>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
          {[["ONE-ACT",oaWR,oneAct,C.green],["TWO-ACT",taWR,twoAct,C.gold]].map(([label,w,days,color])=>(
            <div key={label} style={{textAlign:"center",padding:16,background:C.surface,borderRadius:8,border:`1px solid ${color}30`}}>
              <div style={{color,fontFamily:"'Space Mono', monospace",fontSize:22,fontWeight:700}}>{w}%</div>
              <div style={{color:C.textMuted,fontSize:10,marginTop:4}}>{label}</div>
              <div style={{color:C.textMuted,fontSize:11}}>{days.filter(d=>d.result==="WIN").length}/{days.length}</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ── ROOT APP ──────────────────────────────────────────────────────
const INITIAL_TRADES = [];

export default function App(){
  const [page,setPage]=useState("morning");
  const [trades,setTrades]=useState(INITIAL_TRADES);
  const [tradesLoaded,setTradesLoaded]=useState(false);
  const [selectedDay,setSelectedDay]=useState(null);
  const [editTrade,setEditTrade]=useState(null);
  const [sidebarOpen,setSidebarOpen]=useState(false);

  // Load trades from persistent storage on mount
  useEffect(()=>{
    storageLoad().then(data=>{
      if(data&&Array.isArray(data)&&data.length>0){
        setTrades(data);
      } else {
        try{
          const old=localStorage.getItem("stealth_trades_v2");
          if(old){
            const parsed=JSON.parse(old);
            setTrades(parsed);
            storageSave(parsed);
          }
        }catch{}
      }
      setTradesLoaded(true);
    });
  },[]);

  // Listen for navigate events from child components
  useEffect(()=>{
    const handler=(e)=>setPage(e.detail);
    window.addEventListener('navigate',handler);
    return ()=>window.removeEventListener('navigate',handler);
  },[]);

  const handleEdit=()=>{setEditTrade(selectedDay);setSelectedDay(null);setPage("log");};
  const handleDelete=()=>{
    const updated=trades.filter(t=>t.day!==selectedDay?.day);
    setTrades(updated);
    storageSave(updated);
    setSelectedDay(null);
  };

  const nav=[
    {id:"morning",label:"Morning",icon:"📡"},
    {id:"signals",label:"Signal Map",icon:"⚡"},
    {id:"calendar",label:"Calendar",icon:"📅"},
    {id:"log",label:"Trade Log",icon:"📋"},
    {id:"analytics",label:"Stats",icon:"📊"},
  ];

  return(
    <div style={{background:C.bg,minHeight:"100vh",color:C.textMain,fontFamily:"'DM Sans', -apple-system, sans-serif"}}>
      {/* Header */}
      <div style={{background:C.surface,borderBottom:`1px solid ${C.border}`,padding:"14px 16px",display:"flex",alignItems:"center",justifyContent:"space-between",position:"sticky",top:0,zIndex:100}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <button onClick={()=>setSidebarOpen(true)} style={{background:"none",border:"none",cursor:"pointer",padding:"2px 6px 2px 0",display:"flex",flexDirection:"column",gap:4}}>
            <div style={{width:18,height:2,background:C.textMuted,borderRadius:1}}/>
            <div style={{width:18,height:2,background:C.textMuted,borderRadius:1}}/>
            <div style={{width:18,height:2,background:C.textMuted,borderRadius:1}}/>
          </button>
          <span style={{fontSize:20}}>⚡</span>
          <span style={{fontFamily:"'Space Mono', monospace",fontSize:15,fontWeight:700,color:C.textMain,letterSpacing:"-0.02em"}}>STEALTH SIGNALS</span>
        </div>
        <div style={{color:C.textMuted,fontFamily:"'Space Mono', monospace",fontSize:10}}>v2.30</div>
      </div>

      {/* Content */}
      <div style={{padding:"16px",maxWidth:800,margin:"0 auto",paddingBottom:24}}>
        {page==="morning"&&<MorningPage/>}
        {page==="signals"&&<SignalMapPage/>}
        {page==="calendar"&&<CalendarPage trades={trades} onSelectDay={setSelectedDay}/>}
        {page==="log"&&<TradePage trades={trades} setTrades={setTrades} editTrade={editTrade} setEditTrade={setEditTrade}/>}
        {page==="analytics"&&<AnalyticsPage trades={trades}/>}
      </div>



      {/* Day Modal */}
      {selectedDay&&(
        <DayModal trade={selectedDay} onClose={()=>setSelectedDay(null)} onEdit={handleEdit} onDelete={handleDelete}/>
      )}
      
      {/* Sidebar */}
      <Sidebar trades={trades} page={page} setPage={setPage} isOpen={sidebarOpen} onClose={()=>setSidebarOpen(false)}/>
    </div>
  );
}
