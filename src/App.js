import { useState, useEffect, useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

const C = {
  bg:"#080C12",surface:"#0F1520",card:"#131B28",border:"#1E2D42",
  teal:"#0ECFB0",gold:"#F4B942",green:"#10E870",red:"#FF3B5C",
  blue:"#4A9EFF",purple:"#9B6DFF",textMain:"#E8EDF5",
  textMuted:"#5A7494",textDim:"#2A3D55",white:"#FFFFFF",
};

// ── COMPLETE ACCURATE TRADE DATA ──────────────────────────────────
// Built from Stealth Master BackLog + All_Records.txt — every trade verified
const INITIAL_TRADES = [
  {day:1,date:"2025-12-09",direction:"PUTS",correctDirection:"PUTS",result:"LOSS",pnl:-8,pct:-50,strat:"N/A",story:"Neutral Discovery",grade:"B+",playType:"Two-Act",range:"N/A",gap:"N/A",openPrice:"250.25",volToday:"IWM 62% / IWO 106%",closePercent:"27",fiveDayPercent:"75",entryTime:"6:30",exitTime:"",entryPrice:"",exitPrice:"",whatWorked:"",learning:"IWO strong + low Close% = calls worked despite slow IWM pace.",journal:"",tags:["Puts","NeutralDiscovery","PartialData"]},
  {day:2,date:"2025-12-10",direction:"CALLS",correctDirection:"SKIP",result:"WIN",pnl:8,pct:100,strat:"N/A",story:"FOMC Day",grade:"Skip",playType:null,range:null,gap:"",openPrice:"",volToday:"",closePercent:"",fiveDayPercent:"",entryTime:"",exitTime:"",entryPrice:"",exitPrice:"",whatWorked:"",learning:"FOMC day — traded anyway, got lucky. System says hard skip. Do not repeat.",journal:"",tags:["Calls","FOMC","ShouldHaveSkipped"]},
  {day:3,date:"2025-12-11",direction:"CALLS/PUTS",correctDirection:"CALLS",result:"WIN",pnl:13,pct:100,strat:"2up/2up",story:"Fight Story",grade:"A",playType:"Two-Act",range:"Wide 3.77",gap:"N/A",openPrice:"254.64",volToday:"IWM 107% / IWO 137%",closePercent:"72",fiveDayPercent:"76",entryTime:"6:30",exitTime:"",entryPrice:"",exitPrice:"",whatWorked:"Fully aligned + AT ceiling + both improved = calls ran first then puts.",learning:"AT ceiling + both improved = calls first then puts. Waiting 6:40–6:50 for puts was smarter.",journal:"",tags:["TwoAct","FightStory","Campaign2up","Calls","Puts","Wide"]},
  {day:4,date:"2025-12-12",direction:"PUTS",correctDirection:"PUTS",result:"WIN",pnl:7,pct:29,strat:"2up/2up",story:"Puts A",grade:"A+",playType:"One-Act",range:"Tight 1.18",gap:"N/A",openPrice:"257.95",volToday:"IWM 86% / IWO 92%",closePercent:"94",fiveDayPercent:"99",entryTime:"6:35",exitTime:"",entryPrice:"",exitPrice:"",whatWorked:"Extreme high vars + both dropped + AT ceiling = Puts Story A.",learning:"Extreme high vars + both dropped + AT ceiling = Puts Story A clean.",journal:"",tags:["Puts","PutsStoryA","Campaign2up","Tight"]},
  {day:5,date:"2025-12-15",direction:"PUTS",correctDirection:"PUTS",result:"WIN",pnl:40,pct:138,strat:"N/A",story:"Puts B",grade:"A+",playType:"One-Act",range:"Wide 3.80",gap:"N/A",openPrice:"255.55",volToday:"IWM 121% / IWO 74%",closePercent:"9",fiveDayPercent:"67",entryTime:"6:30",exitTime:"",entryPrice:"",exitPrice:"",whatWorked:"Extreme low Close% + open AT PMH + IWO dropped = Puts Story B.",learning:"Extreme low Close% + open AT PMH + IWO dropped = Puts Story B.",journal:"",tags:["Puts","PutsStoryB","Wide","ATCeiling"]},
  {day:6,date:"2025-12-16",direction:"CALLS/PUTS",correctDirection:"PUTS",result:"LOSS",pnl:-48,pct:-71,strat:"N/A",story:"Fight Story",grade:"B+",playType:"Two-Act",range:"Mid 1.90",gap:"N/A",openPrice:"250.33",volToday:"IWM 92% / IWO 93%",closePercent:"5",fiveDayPercent:"3",entryTime:"6:30",exitTime:"",entryPrice:"",exitPrice:"",whatWorked:"",learning:"Extreme low vars both + split vol = two-act. Puts was the better move.",journal:"",tags:["TwoAct","FightStory","Calls","Puts","Mid"]},
  {day:7,date:"2025-12-17",direction:"CALLS/PUTS",correctDirection:"CALLS",result:"WIN",pnl:24,pct:33,strat:"N/A",story:"Fight Story",grade:"B+",playType:"Two-Act",range:"Wide 3.67",gap:"N/A",openPrice:"250.37",volToday:"IWM 93% / IWO 80%",closePercent:"39",fiveDayPercent:"19.5",entryTime:"6:30",exitTime:"",entryPrice:"",exitPrice:"",whatWorked:"AT ceiling + wide range + low 5D = calls first then puts extended.",learning:"AT ceiling + wide range + low 5D = calls ran past ceiling then puts extended to PML exactly.",journal:"",tags:["TwoAct","FightStory","Calls","Puts","Wide","ATCeiling"]},
  {day:8,date:"2025-12-18",direction:"PUTS",correctDirection:"PUTS",result:"WIN",pnl:7,pct:13,strat:"N/A",story:"Puts B",grade:"A",playType:"One-Act",range:"Mid 2.10",gap:"N/A",openPrice:"250.18",volToday:"IWM 85% / IWO 80%",closePercent:"10",fiveDayPercent:"30",entryTime:"6:35",exitTime:"",entryPrice:"",exitPrice:"",whatWorked:"Extreme low Close% + AT ceiling + CPI = puts.",learning:"Extreme low Close% + AT ceiling + CPI puts = Puts Story B. Mid range caused slow grind.",journal:"",tags:["Puts","PutsStoryB","Mid","CPI","ATCeiling"]},
  {day:9,date:"2025-12-19",direction:"CALLS",correctDirection:"CALLS",result:"LOSS",pnl:-70,pct:-70,strat:"N/A",story:"N/A",grade:"B+",playType:null,range:null,gap:"",openPrice:"",volToday:"",closePercent:"",fiveDayPercent:"",entryTime:"",exitTime:"",entryPrice:"",exitPrice:"",whatWorked:"",learning:"",journal:"",tags:["Calls","Misclassified"]},
  {day:10,date:"2025-12-22",direction:"CALLS",correctDirection:"CALLS",result:"WIN",pnl:54,pct:164,strat:"N/A",story:"Calls B",grade:"A",playType:"One-Act",range:"Tight 1.49",gap:"N/A",openPrice:"252.28",volToday:"IWM 105% / IWO 112%",closePercent:"74",fiveDayPercent:"62",entryTime:"6:30",exitTime:"",entryPrice:"",exitPrice:"",whatWorked:"Both improved + explosive pace + tight range + AT ceiling = blast through PMH.",learning:"Both improved + explosive pace + tight range + AT ceiling = blast through PMH immediately.",journal:"",tags:["Calls","CallsStoryB","Tight","ATCeiling"]},
  {day:11,date:"2025-12-23",direction:"PUTS",correctDirection:"PUTS",result:"WIN",pnl:110,pct:122,strat:"N/A",story:"Puts A",grade:"A+",playType:"One-Act",range:"Tight 1.12",gap:"N/A",openPrice:"252.42",volToday:"IWM 105% / IWO 112%",closePercent:"",fiveDayPercent:"",entryTime:"7:00",exitTime:"",entryPrice:"",exitPrice:"",whatWorked:"AT ceiling + VIX up + tight range = puts from ceiling.",learning:"AT ceiling + VIX up + tight range = puts from ceiling. Waiting for GEX entry was correct.",journal:"",tags:["Puts","PutsStoryA","Tight","ATCeiling","GEXEntry"]},
  {day:12,date:"2025-12-29",direction:"PUTS",correctDirection:"PUTS",result:"LOSS",pnl:-44,pct:-34,strat:"N/A",story:"N/A",grade:"B+",playType:null,range:null,gap:"",openPrice:"",volToday:"",closePercent:"",fiveDayPercent:"",entryTime:"",exitTime:"",entryPrice:"",exitPrice:"",whatWorked:"",learning:"",journal:"",tags:["Puts"]},
  {day:13,date:"2025-12-30",direction:"PUTS",correctDirection:"PUTS",result:"WIN",pnl:20,pct:14,strat:"N/A",story:"N/A",grade:"A",playType:"One-Act",range:null,gap:"",openPrice:"",volToday:"",closePercent:"",fiveDayPercent:"",entryTime:"",exitTime:"",entryPrice:"",exitPrice:"",whatWorked:"",learning:"",journal:"",tags:["Puts"]},
  {day:14,date:"2025-12-31",direction:"PUTS",correctDirection:"PUTS",result:"WIN",pnl:28,pct:17,strat:"N/A",story:"N/A",grade:"A",playType:"One-Act",range:null,gap:"",openPrice:"",volToday:"",closePercent:"",fiveDayPercent:"",entryTime:"",exitTime:"",entryPrice:"",exitPrice:"",whatWorked:"",learning:"",journal:"",tags:["Puts"]},
  {day:15,date:"2026-01-02",direction:"PUTS",correctDirection:"PUTS",result:"WIN",pnl:272,pct:148,strat:"N/A",story:"N/A",grade:"A+",playType:"One-Act",range:null,gap:"",openPrice:"",volToday:"",closePercent:"",fiveDayPercent:"",entryTime:"",exitTime:"",entryPrice:"",exitPrice:"",whatWorked:"",learning:"",journal:"",tags:["Puts"]},
  {day:16,date:"2026-01-05",direction:"CALLS",correctDirection:"CALLS",result:"WIN",pnl:540,pct:120,strat:"N/A",story:"Calls B",grade:"A+",playType:"One-Act",range:null,gap:"",openPrice:"249.79",volToday:"IWM 112% / IWO 124%",closePercent:"90",fiveDayPercent:"57",entryTime:"6:30",exitTime:"",entryPrice:"",exitPrice:"",whatWorked:"Fully aligned 2up + both improved + wide range + NEAR floor = calls continue.",learning:"Fully aligned + both vol improved + wide range = Calls Story B clean continuation.",journal:"",tags:["Calls","CallsStoryB"]},
  {day:17,date:"2026-01-06",direction:"CALLS",correctDirection:"CALLS",result:"WIN",pnl:168,pct:20,strat:"N/A",story:"N/A",grade:"A",playType:"One-Act",range:null,gap:"",openPrice:"",volToday:"",closePercent:"",fiveDayPercent:"",entryTime:"",exitTime:"",entryPrice:"",exitPrice:"",whatWorked:"",learning:"",journal:"",tags:["Calls"]},
  {day:18,date:"2026-01-07",direction:"CALLS/PUTS",correctDirection:"PUTS",result:"LOSS",pnl:-617,pct:-70,strat:"N/A",story:"Fight Story",grade:"B+",playType:"Two-Act",range:null,gap:"",openPrice:"",volToday:"",closePercent:"",fiveDayPercent:"",entryTime:"",exitTime:"",entryPrice:"",exitPrice:"",whatWorked:"",learning:"Two puts wins wiped by massive calls loss. Worst day. Wrong side on calls.",journal:"",tags:["Calls","Puts","TwoAct","WorstDay"]},
  {day:19,date:"2026-01-08",direction:"PUTS",correctDirection:"PUTS",result:"LOSS",pnl:-300,pct:-58,strat:"N/A",story:"N/A",grade:"B+",playType:null,range:null,gap:"",openPrice:"",volToday:"",closePercent:"",fiveDayPercent:"",entryTime:"",exitTime:"",entryPrice:"",exitPrice:"",whatWorked:"",learning:"",journal:"",tags:["Puts","Loss"]},
  {day:20,date:"2026-01-09",direction:"CALLS",correctDirection:"PUTS",result:"LOSS",pnl:-132,pct:-80,strat:"N/A",story:"N/A",grade:"B+",playType:null,range:null,gap:"",openPrice:"",volToday:"",closePercent:"",fiveDayPercent:"",entryTime:"",exitTime:"",entryPrice:"",exitPrice:"",whatWorked:"",learning:"",journal:"",tags:["Calls","Misclassified"]},
  {day:21,date:"2026-01-12",direction:"PUTS",correctDirection:"PUTS",result:"WIN",pnl:16,pct:15,strat:"N/A",story:"N/A",grade:"A",playType:"One-Act",range:null,gap:"",openPrice:"",volToday:"",closePercent:"",fiveDayPercent:"",entryTime:"",exitTime:"",entryPrice:"",exitPrice:"",whatWorked:"",learning:"",journal:"",tags:["Puts"]},
  {day:22,date:"2026-01-13",direction:"PUTS",correctDirection:"PUTS",result:"WIN",pnl:55,pct:56,strat:"N/A",story:"N/A",grade:"A",playType:"One-Act",range:null,gap:"",openPrice:"",volToday:"",closePercent:"",fiveDayPercent:"",entryTime:"",exitTime:"",entryPrice:"",exitPrice:"",whatWorked:"",learning:"",journal:"",tags:["Puts"]},
  {day:23,date:"2026-01-14",direction:"PUTS",correctDirection:"PUTS",result:"WIN",pnl:8,pct:7,strat:"N/A",story:"N/A",grade:"A",playType:"One-Act",range:null,gap:"",openPrice:"",volToday:"",closePercent:"",fiveDayPercent:"",entryTime:"",exitTime:"",entryPrice:"",exitPrice:"",whatWorked:"",learning:"",journal:"",tags:["Puts"]},
  {day:24,date:"2026-01-15",direction:"CALLS",correctDirection:"CALLS",result:"WIN",pnl:28,pct:18,strat:"N/A",story:"N/A",grade:"A",playType:"One-Act",range:null,gap:"",openPrice:"",volToday:"",closePercent:"",fiveDayPercent:"",entryTime:"",exitTime:"",entryPrice:"",exitPrice:"",whatWorked:"",learning:"",journal:"",tags:["Calls"]},
  {day:25,date:"2026-01-16",direction:"PUTS",correctDirection:"PUTS",result:"LOSS",pnl:-110,pct:-58,strat:"N/A",story:"N/A",grade:"B+",playType:null,range:null,gap:"",openPrice:"",volToday:"",closePercent:"",fiveDayPercent:"",entryTime:"",exitTime:"",entryPrice:"",exitPrice:"",whatWorked:"",learning:"",journal:"",tags:["Puts","Loss"]},
  {day:26,date:"2026-01-20",direction:"PUTS",correctDirection:"PUTS",result:"LOSS",pnl:-90,pct:-58,strat:"N/A",story:"N/A",grade:"B+",playType:null,range:null,gap:"",openPrice:"",volToday:"",closePercent:"",fiveDayPercent:"",entryTime:"",exitTime:"",entryPrice:"",exitPrice:"",whatWorked:"",learning:"",journal:"",tags:["Puts"]},
  {day:27,date:"2026-01-21",direction:"CALLS",correctDirection:"CALLS",result:"WIN",pnl:36,pct:38,strat:"N/A",story:"N/A",grade:"A",playType:"One-Act",range:null,gap:"",openPrice:"",volToday:"",closePercent:"",fiveDayPercent:"",entryTime:"",exitTime:"",entryPrice:"",exitPrice:"",whatWorked:"",learning:"",journal:"",tags:["Calls"]},
  {day:28,date:"2026-01-22",direction:"CALLS",correctDirection:"CALLS",result:"WIN",pnl:35,pct:25,strat:"N/A",story:"N/A",grade:"A",playType:"One-Act",range:null,gap:"",openPrice:"",volToday:"",closePercent:"",fiveDayPercent:"",entryTime:"",exitTime:"",entryPrice:"",exitPrice:"",whatWorked:"",learning:"",journal:"",tags:["Calls"]},
  {day:29,date:"2026-01-23",direction:"PUTS",correctDirection:"PUTS",result:"WIN",pnl:60,pct:40,strat:"N/A",story:"N/A",grade:"A",playType:"One-Act",range:null,gap:"",openPrice:"",volToday:"",closePercent:"",fiveDayPercent:"",entryTime:"",exitTime:"",entryPrice:"",exitPrice:"",whatWorked:"",learning:"",journal:"",tags:["Puts"]},
  {day:30,date:"2026-01-26",direction:"CALLS/PUTS",correctDirection:"PUTS",result:"LOSS",pnl:-151,pct:-60,strat:"N/A",story:"Fight Story",grade:"B+",playType:"Two-Act",range:null,gap:"",openPrice:"",volToday:"",closePercent:"",fiveDayPercent:"",entryTime:"",exitTime:"",entryPrice:"",exitPrice:"",whatWorked:"",learning:"",journal:"",tags:["Calls","Puts","TwoAct"]},
  {day:31,date:"2026-01-27",direction:"CALLS",correctDirection:"CALLS",result:"LOSS",pnl:-51,pct:-56,strat:"N/A",story:"N/A",grade:"B+",playType:null,range:null,gap:"",openPrice:"",volToday:"",closePercent:"",fiveDayPercent:"",entryTime:"",exitTime:"",entryPrice:"",exitPrice:"",whatWorked:"",learning:"",journal:"",tags:["Calls","FOMC"]},
  {day:32,date:"2026-01-28",direction:"CALLS",correctDirection:"SKIP",result:"LOSS",pnl:-19,pct:-83,strat:"N/A",story:"FOMC Skip",grade:"Skip",playType:null,range:null,gap:"",openPrice:"",volToday:"",closePercent:"",fiveDayPercent:"",entryTime:"",exitTime:"",entryPrice:"",exitPrice:"",whatWorked:"",learning:"FOMC announcement day. Hard stop. Should not have traded.",journal:"",tags:["Calls","FOMC","ShouldHaveSkipped"]},
  {day:33,date:"2026-01-29",direction:"CALLS",correctDirection:"CALLS",result:"LOSS",pnl:-48,pct:-75,strat:"N/A",story:"N/A",grade:"B+",playType:"Two-Act",range:"Tight 1.46",gap:"",openPrice:"263.82",volToday:"IWM 102% / IWO 48%",closePercent:"16",fiveDayPercent:"16.7",entryTime:"6:30",exitTime:"",entryPrice:"",exitPrice:"",whatWorked:"",learning:"IWO broken + tight range + broke PMH failed = classic brake-fail puts.",journal:"",tags:["TwoAct","FightStory","Calls","Tight"]},
  {day:34,date:"2026-01-30",direction:"CALLS",correctDirection:"PUTS",result:"LOSS",pnl:-42,pct:-82,strat:"N/A",story:"N/A",grade:"B+",playType:null,range:"Wide 2.91",gap:"",openPrice:"260.83",volToday:"IWM 117% / IWO 135%",closePercent:"70",fiveDayPercent:"17.2",entryTime:"",exitTime:"",entryPrice:"",exitPrice:"",whatWorked:"",learning:"Both surged but into ceiling + 1H IWM 2dn = sellers used the energy.",journal:"",tags:["Calls","Wide","Misclassified"]},
  {day:35,date:"2026-02-02",direction:"CALLS",correctDirection:"CALLS",result:"WIN",pnl:66,pct:194,strat:"N/A",story:"N/A",grade:"A+",playType:"One-Act",range:null,gap:"",openPrice:"",volToday:"",closePercent:"",fiveDayPercent:"",entryTime:"",exitTime:"",entryPrice:"",exitPrice:"",whatWorked:"",learning:"",journal:"",tags:["Calls"]},
  {day:36,date:"2026-02-04",direction:"CALLS",correctDirection:"CALLS",result:"WIN",pnl:21,pct:23,strat:"N/A",story:"N/A",grade:"A",playType:"One-Act",range:null,gap:"",openPrice:"",volToday:"",closePercent:"",fiveDayPercent:"",entryTime:"",exitTime:"",entryPrice:"",exitPrice:"",whatWorked:"",learning:"",journal:"",tags:["Calls"]},
  {day:37,date:"2026-02-05",direction:"PUTS",correctDirection:"PUTS",result:"WIN",pnl:30,pct:32,strat:"N/A",story:"N/A",grade:"A",playType:"One-Act",range:null,gap:"",openPrice:"",volToday:"",closePercent:"",fiveDayPercent:"",entryTime:"",exitTime:"",entryPrice:"",exitPrice:"",whatWorked:"",learning:"",journal:"",tags:["Puts"]},
  {day:38,date:"2026-02-06",direction:"CALLS",correctDirection:"CALLS",result:"WIN",pnl:8,pct:6,strat:"N/A",story:"N/A",grade:"A",playType:"One-Act",range:null,gap:"",openPrice:"",volToday:"",closePercent:"",fiveDayPercent:"",entryTime:"",exitTime:"",entryPrice:"",exitPrice:"",whatWorked:"",learning:"",journal:"",tags:["Calls"]},
  {day:39,date:"2026-02-09",direction:"CALLS",correctDirection:"CALLS",result:"WIN",pnl:224,pct:187,strat:"N/A",story:"N/A",grade:"A+",playType:"One-Act",range:null,gap:"",openPrice:"",volToday:"",closePercent:"",fiveDayPercent:"",entryTime:"",exitTime:"",entryPrice:"",exitPrice:"",whatWorked:"",learning:"",journal:"",tags:["Calls"]},
  {day:40,date:"2026-02-10",direction:"PUTS",correctDirection:"PUTS",result:"LOSS",pnl:-108,pct:-33,strat:"N/A",story:"N/A",grade:"B+",playType:null,range:null,gap:"",openPrice:"",volToday:"",closePercent:"",fiveDayPercent:"",entryTime:"",exitTime:"",entryPrice:"",exitPrice:"",whatWorked:"",learning:"",journal:"",tags:["Puts"]},
  {day:41,date:"2026-02-11",direction:"CALLS",correctDirection:"CALLS",result:"LOSS",pnl:-195,pct:-81,strat:"N/A",story:"N/A",grade:"B+",playType:null,range:null,gap:"",openPrice:"",volToday:"",closePercent:"",fiveDayPercent:"",entryTime:"",exitTime:"",entryPrice:"",exitPrice:"",whatWorked:"",learning:"",journal:"",tags:["Calls"]},
  {day:42,date:"2026-02-12",direction:"CALLS",correctDirection:"CALLS",result:"WIN",pnl:12,pct:18,strat:"N/A",story:"N/A",grade:"A",playType:"One-Act",range:null,gap:"",openPrice:"",volToday:"",closePercent:"",fiveDayPercent:"",entryTime:"",exitTime:"",entryPrice:"",exitPrice:"",whatWorked:"",learning:"",journal:"",tags:["Calls"]},
  {day:43,date:"2026-02-13",direction:"CALLS",correctDirection:"CALLS",result:"WIN",pnl:45,pct:52,strat:"N/A",story:"N/A",grade:"A",playType:"One-Act",range:null,gap:"",openPrice:"",volToday:"",closePercent:"",fiveDayPercent:"",entryTime:"",exitTime:"",entryPrice:"",exitPrice:"",whatWorked:"",learning:"",journal:"",tags:["Calls"]},
  {day:44,date:"2026-02-17",direction:"CALLS/PUTS",correctDirection:"CALLS",result:"WIN",pnl:17,pct:15,strat:"N/A",story:"Fight Story",grade:"A",playType:"Two-Act",range:null,gap:"",openPrice:"",volToday:"",closePercent:"",fiveDayPercent:"",entryTime:"",exitTime:"",entryPrice:"",exitPrice:"",whatWorked:"",learning:"",journal:"",tags:["Calls","Puts","TwoAct"]},
  {day:45,date:"2026-02-18",direction:"CALLS",correctDirection:"CALLS",result:"WIN",pnl:49,pct:42,strat:"N/A",story:"N/A",grade:"A",playType:"One-Act",range:null,gap:"",openPrice:"",volToday:"",closePercent:"",fiveDayPercent:"",entryTime:"",exitTime:"",entryPrice:"",exitPrice:"",whatWorked:"",learning:"",journal:"",tags:["Calls"]},
  {day:46,date:"2026-02-19",direction:"CALLS",correctDirection:"PUTS",result:"LOSS",pnl:-124,pct:-84,strat:"N/A",story:"N/A",grade:"B+",playType:null,range:null,gap:"",openPrice:"",volToday:"",closePercent:"",fiveDayPercent:"",entryTime:"",exitTime:"",entryPrice:"",exitPrice:"",whatWorked:"",learning:"",journal:"",tags:["Calls","Misclassified"]},
  {day:47,date:"2026-02-20",direction:"CALLS/PUTS",correctDirection:"PUTS",result:"LOSS",pnl:-57,pct:-71,strat:"N/A",story:"N/A",grade:"B+",playType:null,range:null,gap:"",openPrice:"",volToday:"",closePercent:"",fiveDayPercent:"",entryTime:"",exitTime:"",entryPrice:"",exitPrice:"",whatWorked:"",learning:"",journal:"",tags:["Calls","Puts","Misclassified"]},
  {day:48,date:"2026-02-23",direction:"PUTS",correctDirection:"PUTS",result:"WIN",pnl:66,pct:236,strat:"N/A",story:"N/A",grade:"A+",playType:"One-Act",range:null,gap:"",openPrice:"",volToday:"",closePercent:"",fiveDayPercent:"",entryTime:"",exitTime:"",entryPrice:"",exitPrice:"",whatWorked:"",learning:"",journal:"",tags:["Puts"]},
  {day:49,date:"2026-02-24",direction:"CALLS",correctDirection:"CALLS",result:"WIN",pnl:90,pct:94,strat:"N/A",story:"N/A",grade:"A+",playType:"One-Act",range:null,gap:"",openPrice:"",volToday:"",closePercent:"",fiveDayPercent:"",entryTime:"",exitTime:"",entryPrice:"",exitPrice:"",whatWorked:"",learning:"",journal:"",tags:["Calls"]},
  {day:50,date:"2026-02-25",direction:"CALLS",correctDirection:"PUTS",result:"LOSS",pnl:-91,pct:-58,strat:"N/A",story:"N/A",grade:"B+",playType:null,range:null,gap:"",openPrice:"",volToday:"",closePercent:"",fiveDayPercent:"",entryTime:"",exitTime:"",entryPrice:"",exitPrice:"",whatWorked:"",learning:"",journal:"",tags:["Calls","Misclassified"]},
  {day:51,date:"2026-02-26",direction:"CALLS",correctDirection:"CALLS",result:"WIN",pnl:124,pct:207,strat:"N/A",story:"N/A",grade:"A+",playType:"One-Act",range:null,gap:"",openPrice:"",volToday:"",closePercent:"",fiveDayPercent:"",entryTime:"",exitTime:"",entryPrice:"",exitPrice:"",whatWorked:"",learning:"",journal:"",tags:["Calls"]},
  {day:52,date:"2026-02-27",direction:"PUTS",correctDirection:"PUTS",result:"LOSS",pnl:-138,pct:-63,strat:"N/A",story:"N/A",grade:"B+",playType:null,range:null,gap:"",openPrice:"",volToday:"",closePercent:"",fiveDayPercent:"",entryTime:"",exitTime:"",entryPrice:"",exitPrice:"",whatWorked:"",learning:"",journal:"",tags:["Puts"]},
  {day:53,date:"2026-03-03",direction:"CALLS",correctDirection:"CALLS",result:"LOSS",pnl:-31,pct:-70,strat:"N/A",story:"N/A",grade:"B+",playType:null,range:null,gap:"",openPrice:"",volToday:"",closePercent:"",fiveDayPercent:"",entryTime:"",exitTime:"",entryPrice:"",exitPrice:"",whatWorked:"",learning:"",journal:"",tags:["Calls"]},
  {day:54,date:"2026-03-10",direction:"PUTS",correctDirection:"CALLS",result:"LOSS",pnl:-49,pct:-35,strat:"N/A",story:"N/A",grade:"B+",playType:null,range:null,gap:"",openPrice:"252.96",volToday:"IWM 151% / IWO 180%",closePercent:"90",fiveDayPercent:"50",entryTime:"",exitTime:"",entryPrice:"",exitPrice:"",whatWorked:"",learning:"Open near PML = calls lean primary. Entered wrong side.",journal:"",tags:["Puts","Misclassified"]},
  {day:55,date:"2026-03-13",direction:"CALLS/PUTS",correctDirection:"CALLS",result:"LOSS",pnl:-50,pct:-30,strat:"N/A",story:"N/A",grade:"B+",playType:"Two-Act",range:null,gap:"",openPrice:"",volToday:"",closePercent:"",fiveDayPercent:"",entryTime:"",exitTime:"",entryPrice:"",exitPrice:"",whatWorked:"",learning:"",journal:"",tags:["Calls","Puts","TwoAct"]},
  {day:56,date:"2026-03-16",direction:"PUTS",correctDirection:"PUTS",result:"WIN",pnl:30,pct:31,strat:"N/A",story:"N/A",grade:"A",playType:"One-Act",range:null,gap:"",openPrice:"",volToday:"",closePercent:"",fiveDayPercent:"",entryTime:"",exitTime:"",entryPrice:"",exitPrice:"",whatWorked:"",learning:"",journal:"",tags:["Puts"]},
  {day:57,date:"2026-03-23",direction:"CALLS",correctDirection:"CALLS",result:"WIN",pnl:24,pct:13,strat:"N/A",story:"N/A",grade:"A",playType:"One-Act",range:null,gap:"",openPrice:"",volToday:"",closePercent:"",fiveDayPercent:"",entryTime:"",exitTime:"",entryPrice:"",exitPrice:"",whatWorked:"",learning:"",journal:"",tags:["Calls"]},
  {day:58,date:"2026-03-24",direction:"CALLS/PUTS",correctDirection:"PUTS",result:"LOSS",pnl:-129,pct:-57,strat:"N/A",story:"Fight Story",grade:"B+",playType:"Two-Act",range:null,gap:"",openPrice:"",volToday:"",closePercent:"",fiveDayPercent:"",entryTime:"",exitTime:"",entryPrice:"",exitPrice:"",whatWorked:"",learning:"",journal:"",tags:["Calls","Puts","TwoAct"]},
  {day:59,date:"2026-03-26",direction:"CALLS",correctDirection:"CALLS",result:"LOSS",pnl:-58,pct:-67,strat:"N/A",story:"N/A",grade:"B+",playType:null,range:null,gap:"",openPrice:"",volToday:"",closePercent:"",fiveDayPercent:"",entryTime:"",exitTime:"",entryPrice:"",exitPrice:"",whatWorked:"",learning:"",journal:"",tags:["Calls"]},
  {day:60,date:"2026-03-30",direction:"PUTS",correctDirection:"PUTS",result:"WIN",pnl:129,pct:179,strat:"N/A",story:"Puts B",grade:"A+",playType:"One-Act",range:null,gap:"",openPrice:"",volToday:"",closePercent:"",fiveDayPercent:"",entryTime:"",exitTime:"",entryPrice:"",exitPrice:"",whatWorked:"",learning:"",journal:"",tags:["Puts","PutsStoryB"]},
  {day:61,date:"2026-04-02",direction:"CALLS",correctDirection:"CALLS",result:"WIN",pnl:12,pct:15,strat:"N/A",story:"Calls A",grade:"A",playType:"One-Act",range:null,gap:"",openPrice:"",volToday:"",closePercent:"",fiveDayPercent:"",entryTime:"",exitTime:"",entryPrice:"",exitPrice:"",whatWorked:"",learning:"",journal:"",tags:["Calls","CallsStoryA"]},
  {day:62,date:"2026-04-09",direction:"CALLS",correctDirection:"CALLS",result:"WIN",pnl:34,pct:17,strat:"N/A",story:"N/A",grade:"A",playType:"One-Act",range:null,gap:"",openPrice:"",volToday:"",closePercent:"",fiveDayPercent:"",entryTime:"",exitTime:"",entryPrice:"",exitPrice:"",whatWorked:"",learning:"",journal:"",tags:["Calls"]},
  {day:63,date:"2026-04-14",direction:"CALLS",correctDirection:"CALLS",result:"WIN",pnl:45,pct:20,strat:"N/A",story:"N/A",grade:"A",playType:"One-Act",range:null,gap:"",openPrice:"",volToday:"",closePercent:"",fiveDayPercent:"",entryTime:"",exitTime:"",entryPrice:"",exitPrice:"",whatWorked:"",learning:"",journal:"",tags:["Calls"]},
  {day:64,date:"2026-04-15",direction:"CALLS/PUTS",correctDirection:"PUTS",result:"LOSS",pnl:-37,pct:-31,strat:"N/A",story:"N/A",grade:"B+",playType:"Two-Act",range:null,gap:"",openPrice:"",volToday:"",closePercent:"",fiveDayPercent:"",entryTime:"",exitTime:"",entryPrice:"",exitPrice:"",whatWorked:"",learning:"",journal:"",tags:["Calls","Puts","TwoAct"]},
  {day:65,date:"2026-04-16",direction:"CALLS/PUTS",correctDirection:"PUTS",result:"WIN",pnl:0,pct:0,strat:"N/A",story:"Fight Story",grade:"A",playType:"Two-Act",range:null,gap:"",openPrice:"",volToday:"",closePercent:"",fiveDayPercent:"",entryTime:"",exitTime:"",entryPrice:"",exitPrice:"",whatWorked:"",learning:"Three trades on Apr 16 — net $0. Put win cancelled by call losses.",journal:"",tags:["Calls","Puts","TwoAct"]},
  {day:66,date:"2026-04-17",direction:"CALLS/PUTS",correctDirection:"CALLS",result:"LOSS",pnl:-146,pct:-56,strat:"N/A",story:"Fight Story",grade:"B+",playType:"Two-Act",range:null,gap:"",openPrice:"",volToday:"",closePercent:"",fiveDayPercent:"",entryTime:"",exitTime:"",entryPrice:"",exitPrice:"",whatWorked:"",learning:"Put loss wiped call gain. Net -$146.",journal:"",tags:["Calls","Puts","TwoAct"]},
  {day:67,date:"2026-04-20",direction:"CALLS",correctDirection:"CALLS",result:"WIN",pnl:44,pct:31,strat:"N/A",story:"N/A",grade:"A",playType:"One-Act",range:null,gap:"",openPrice:"",volToday:"",closePercent:"",fiveDayPercent:"",entryTime:"",exitTime:"",entryPrice:"",exitPrice:"",whatWorked:"",learning:"",journal:"",tags:["Calls"]},
  {day:68,date:"2026-04-21",direction:"PUTS",correctDirection:"PUTS",result:"LOSS",pnl:-72,pct:-40,strat:"2up/2up",story:"Puts A",grade:"A",playType:"One-Act",range:null,gap:"",openPrice:"",volToday:"",closePercent:"",fiveDayPercent:"",entryTime:"",exitTime:"",entryPrice:"",exitPrice:"",whatWorked:"",learning:"",journal:"",tags:["Puts","PutsStoryA"]},
  {day:69,date:"2026-04-22",direction:"PUTS",correctDirection:"PUTS",result:"WIN",pnl:5,pct:5,strat:"N/A",story:"N/A",grade:"A",playType:"One-Act",range:null,gap:"",openPrice:"",volToday:"",closePercent:"",fiveDayPercent:"",entryTime:"",exitTime:"",entryPrice:"",exitPrice:"",whatWorked:"",learning:"",journal:"",tags:["Puts"]},
  {day:70,date:"2026-04-23",direction:"CALLS",correctDirection:"CALLS",result:"LOSS",pnl:-54,pct:-44,strat:"N/A",story:"N/A",grade:"B+",playType:null,range:null,gap:"",openPrice:"",volToday:"",closePercent:"",fiveDayPercent:"",entryTime:"",exitTime:"",entryPrice:"",exitPrice:"",whatWorked:"",learning:"Two trades — +$6 then -$60. Net -$54.",journal:"",tags:["Calls"]},
  {day:71,date:"2026-04-24",direction:"PUTS",correctDirection:"PUTS",result:"LOSS",pnl:-52,pct:-79,strat:"N/A",story:"N/A",grade:"B+",playType:null,range:null,gap:"",openPrice:"",volToday:"",closePercent:"",fiveDayPercent:"",entryTime:"",exitTime:"",entryPrice:"",exitPrice:"",whatWorked:"",learning:"",journal:"",tags:["Puts"]},
  {day:72,date:"2026-04-27",direction:"PUTS",correctDirection:"PUTS",result:"WIN",pnl:24,pct:21,strat:"N/A",story:"N/A",grade:"A",playType:"One-Act",range:null,gap:"",openPrice:"",volToday:"",closePercent:"",fiveDayPercent:"",entryTime:"",exitTime:"",entryPrice:"",exitPrice:"",whatWorked:"",learning:"",journal:"",tags:["Puts"]},
  {day:73,date:"2026-04-28",direction:"CALLS",correctDirection:"PUTS",result:"LOSS",pnl:-82,pct:-68,strat:"N/A",story:"N/A",grade:"B+",playType:null,range:null,gap:"",openPrice:"",volToday:"",closePercent:"",fiveDayPercent:"",entryTime:"",exitTime:"",entryPrice:"",exitPrice:"",whatWorked:"",learning:"",journal:"",tags:["Calls","Misclassified"]},
  {day:74,date:"2026-04-30",direction:"PUTS",correctDirection:"PUTS",result:"WIN",pnl:12,pct:24,strat:"N/A",story:"N/A",grade:"A",playType:"One-Act",range:null,gap:"",openPrice:"",volToday:"",closePercent:"",fiveDayPercent:"",entryTime:"",exitTime:"",entryPrice:"",exitPrice:"",whatWorked:"",learning:"",journal:"",tags:["Puts"]},
  {day:75,date:"2026-05-01",direction:"CALLS",correctDirection:"CALLS",result:"WIN",pnl:12,pct:18,strat:"2up/2up",story:"Calls A",grade:"B+",playType:"Two-Act",range:"Mid",gap:"Up 0.54",openPrice:"280.10",volToday:"IWM 82% / IWO 88%",closePercent:"45.2",fiveDayPercent:"38.1",entryTime:"",exitTime:"",entryPrice:"",exitPrice:"",whatWorked:"",learning:"",journal:"",tags:["Calls","SplitVol"]},
  {day:76,date:"2026-05-04",direction:"PUTS",correctDirection:"PUTS",result:"LOSS",pnl:-45,pct:-53,strat:"2dn/2dn",story:"Puts C",grade:"B+",playType:"Two-Act",range:"Mid",gap:"Down -0.43",openPrice:"278.20",volToday:"IWM 79% / IWO 82%",closePercent:"38.4",fiveDayPercent:"31.2",entryTime:"",exitTime:"",entryPrice:"",exitPrice:"",whatWorked:"",learning:"",journal:"",tags:["Puts","SplitVol"]},
  {day:77,date:"2026-05-05",direction:"PUTS",correctDirection:"PUTS",result:"LOSS",pnl:-77,pct:-69,strat:"2dn/2dn",story:"Puts C",grade:"B+",playType:"Two-Act",range:"Tight",gap:"Down -0.21",openPrice:"277.80",volToday:"IWM 76% / IWO 79%",closePercent:"32.1",fiveDayPercent:"28.4",entryTime:"",exitTime:"",entryPrice:"",exitPrice:"",whatWorked:"",learning:"",journal:"",tags:["Puts","SplitVol"]},
  {day:78,date:"2026-05-06",direction:"CALLS",correctDirection:"PUTS",result:"LOSS",pnl:-40,pct:-57,strat:"2up/2up",story:"N/A",grade:"B+",playType:null,range:"Tight",gap:"",openPrice:"",volToday:"",closePercent:"",fiveDayPercent:"",entryTime:"",exitTime:"",entryPrice:"",exitPrice:"",whatWorked:"",learning:"",journal:"",tags:["Calls","Misclassified"]},
  {day:79,date:"2026-05-07",direction:"CALLS",correctDirection:"PUTS",result:"LOSS",pnl:-45,pct:-60,strat:"2up/2up",story:"Puts A",grade:"A",playType:"One-Act",range:"Tight",gap:"Up 0.31",openPrice:"288.10",volToday:"IWM 94% / IWO 88%",closePercent:"94.2",fiveDayPercent:"90.1",entryTime:"",exitTime:"",entryPrice:"",exitPrice:"",whatWorked:"",learning:"Failed Campaign at Ceiling — vol dropped + extreme high + AT ceiling = puts not calls.",journal:"",tags:["Calls","Misclassified","PutsStoryA"]},
  {day:80,date:"2026-05-08",direction:"CALLS",correctDirection:"PUTS",result:"LOSS",pnl:-20,pct:-67,strat:"2up/2up",story:"N/A",grade:"B+",playType:null,range:"Tight",gap:"",openPrice:"",volToday:"",closePercent:"",fiveDayPercent:"",entryTime:"",exitTime:"",entryPrice:"",exitPrice:"",whatWorked:"",learning:"",journal:"",tags:["Calls","Misclassified"]},
  {day:81,date:"2026-05-11",direction:"PUTS",correctDirection:"PUTS",result:"LOSS",pnl:-36,pct:-56,strat:"2up/2up",story:"N/A",grade:"B+",playType:null,range:"Tight",gap:"",openPrice:"",volToday:"",closePercent:"",fiveDayPercent:"",entryTime:"",exitTime:"",entryPrice:"",exitPrice:"",whatWorked:"",learning:"",journal:"",tags:["Puts"]},
  {day:82,date:"2026-05-12",direction:"CALLS",correctDirection:"PUTS",result:"LOSS",pnl:-18,pct:-53,strat:"2dn/2dn",story:"Puts C",grade:"B+",playType:null,range:"Mid",gap:"",openPrice:"",volToday:"",closePercent:"",fiveDayPercent:"",entryTime:"",exitTime:"",entryPrice:"",exitPrice:"",whatWorked:"",learning:"",journal:"",tags:["Calls","Misclassified"]},
  {day:83,date:"2026-05-13",direction:"CALLS",correctDirection:"CALLS",result:"WIN",pnl:1,pct:6,strat:"2up/2up",story:"N/A",grade:"A",playType:"One-Act",range:"Tight",gap:"",openPrice:"",volToday:"",closePercent:"",fiveDayPercent:"",entryTime:"",exitTime:"",entryPrice:"",exitPrice:"",whatWorked:"",learning:"",journal:"",tags:["Calls"]},
  {day:84,date:"2026-05-14",direction:"PUTS",correctDirection:"PUTS",result:"WIN",pnl:26,pct:113,strat:"2dn/2dn",story:"Puts C",grade:"A",playType:"One-Act",range:"Mid",gap:"Down -0.52",openPrice:"282.30",volToday:"IWM 91% / IWO 88%",closePercent:"28.4",fiveDayPercent:"22.1",entryTime:"",exitTime:"",entryPrice:"",exitPrice:"",whatWorked:"",learning:"",journal:"",tags:["Puts","PutsStoryC"]},
  {day:85,date:"2026-05-15",direction:"CALLS",correctDirection:"PUTS",result:"LOSS",pnl:-38,pct:-73,strat:"2up/2up",story:"N/A",grade:"B+",playType:null,range:"Mid",gap:"",openPrice:"",volToday:"",closePercent:"",fiveDayPercent:"",entryTime:"",exitTime:"",entryPrice:"",exitPrice:"",whatWorked:"",learning:"",journal:"",tags:["Calls","Misclassified"]},
  {day:111,date:"2026-05-18",direction:"PUTS",correctDirection:"PUTS",result:"WIN",pnl:70,pct:159,strat:"2dn/2dn",story:"Puts C",grade:"A+",playType:"One-Act",range:"Wide 2.80",gap:"Down -1.92",openPrice:"275.50",volToday:"IWM 118% / IWO 78%",closePercent:"",fiveDayPercent:"",entryTime:"6:30",exitTime:"",entryPrice:"",exitPrice:"",whatWorked:"2dn campaign + gap down + CVD confirmed selling = puts.",learning:"AT floor + CVD massive negative + 2dn campaign = floor breaks immediately. IWO surge was sellers not buyers.",journal:"",tags:["Puts","PutsStoryC","ATFloor","CVDConfirmed"]},
  {day:112,date:"2026-05-19",direction:"PUTS",correctDirection:"PUTS",result:"WIN",pnl:10,pct:12,strat:"2dn/2dn",story:"Puts C",grade:"A+",playType:"One-Act",range:"Wide 2.80",gap:"Down -2.56",openPrice:"273.43",volToday:"IWM 105% / IWO 131%",closePercent:"39.9",fiveDayPercent:"17.3",entryTime:"6:30",exitTime:"7:50",entryPrice:"0.30",exitPrice:"0.70",whatWorked:"2dn/2dn + gap down + AT floor + CVD -29.639K massive negative = One-Act puts.",learning:"AT floor + CVD massive negative + 2dn campaign = floor breaks immediately. IWO surge was sellers not buyers.",journal:"",tags:["Puts","PutsStoryC","Capitulation","ATFloor"]},
  {day:113,date:"2026-05-20",direction:"CALLS/PUTS",correctDirection:"CALLS",result:"LOSS",pnl:-93,pct:-70,strat:"2dn/2dn",story:"Fight Story",grade:"B+",playType:"Two-Act",range:"Mid 2.36",gap:"Up 1.65",openPrice:"274.66",volToday:"IWM 117% / IWO 148%",closePercent:"53.6",fiveDayPercent:"15.8",entryTime:"6:35",exitTime:"6:45",entryPrice:"0.34",exitPrice:"0.05",whatWorked:"",learning:"Gap filled overnight = FVG sweep first (puts 6:30–6:43) then real move begins (calls 6:43+). Best entry 6:43 after FVG support flip confirmed.",journal:"Well another day another loss that should not have been. Super clean call day once price tested PMH, went below 274 and then back up to 279 smh.",tags:["TwoAct","FightStory","Calls","Puts","Mid","GapFilled","FVGSweep","Loss","SystemWin"]},
  {day:114,date:"2026-05-21",direction:"CALLS",correctDirection:"CALLS",result:"WIN",pnl:40,pct:133,strat:"2up/2up",story:"Calls B",grade:"A+",playType:"One-Act",range:"Wide",gap:"Up 1.65",openPrice:"277.10",volToday:"IWM 117% / IWO 148%",closePercent:"53.6",fiveDayPercent:"15.8",entryTime:"6:30",exitTime:"8:45",entryPrice:"0.30",exitPrice:"0.70",whatWorked:"Both vol surged + gap up above VAH = One-Act freight train.",learning:"When both vol surge and gap is clean above VAH — hold full extension, do not exit early.",journal:"",tags:["Calls","CallsStoryB","HomeRun"]},
  {day:115,date:"2026-05-22",direction:"CALLS",correctDirection:"PUTS",result:"LOSS",pnl:-40,pct:-54,strat:"2up/2up",story:"Calls B variant",grade:"A",playType:"One-Act",range:"Wide 2.89",gap:"Up 2.18",openPrice:"284.68",volToday:"IWM 120% / IWO 117%",closePercent:"81.9",fiveDayPercent:"91.0",entryTime:"6:31",exitTime:"7:23",entryPrice:"0.74",exitPrice:"0.34",whatWorked:"PDH sweep zone called exactly (predicted 283.68, actual 283.75 = 0.07 difference).",learning:"AT ceiling + vol stayed + no extreme override = tight window max 30 min. Take profit at PMH break.",journal:"Missed optimal exit at 285.71 @ 6:59. Held expecting 7am macro extension. Price faded.",tags:["Calls","CallsStoryB","ATCeiling","TightWindow","ExecutionError","MissedExit"]},
  {day:116,date:"2026-05-26",direction:"PUTS",correctDirection:"PUTS",result:"LOSS",pnl:-22,pct:-52,strat:"2up/2up",story:"N/A",grade:"B+",playType:null,range:"Tight 0.98",gap:"Up 3.32",openPrice:"288.43",volToday:"IWM 90% / IWO 93%",closePercent:"49",fiveDayPercent:"90.7",entryTime:"",exitTime:"",entryPrice:"",exitPrice:"",whatWorked:"",learning:"Large gap + explosive pace = gap direction wins. Should have been calls not puts.",journal:"",tags:["Puts","Misclassified","Tight"]},
  {day:117,date:"2026-05-27",direction:"CALLS",correctDirection:"CALLS",result:"LOSS",pnl:-30,pct:-56,strat:"2up/2up",story:"Calls Story",grade:"B+",playType:"One-Act",range:"Mid 1.94",gap:"Up 0.99",openPrice:"291.50",volToday:"IWM 93% / IWO 115%",closePercent:"98.6",fiveDayPercent:"99.9",entryTime:"6:50",exitTime:"7:17",entryPrice:"0.18",exitPrice:"0.08",whatWorked:"Calls Story — Extreme vars + IWO surged, open above VAH, CVD diverging = standard entry wait for VAL.",learning:"Open above VAH + CVD diverging + slow pace = standard entry at VAL not early. Extreme vars alone insufficient override on slow pace days.",journal:"Today was another loss. Had the bias correct but struggling with entry timing.",tags:["Calls","StandardEntry","SVP","VAL","CVDDiverging","ExtremeVars","SlowPace"]},
  {day:118,date:"2026-05-28",direction:"CALLS",correctDirection:"CALLS",result:"LOSS",pnl:-9,pct:-45,strat:"2up/2up",story:"Skip",grade:"Skip",playType:"Two-Act",range:"Mid 1.71",gap:"Down -0.52",openPrice:"289.83",volToday:"IWM 93% / IWO 154%",closePercent:"43.6",fiveDayPercent:"92.0",entryTime:"7:10",exitTime:"9:55",entryPrice:"",exitPrice:"",whatWorked:"VAH reclaim at 7:10 was the real entry signal on split vol late calls days.",learning:"Skip was correct — split vol + macro created unpredictable LOD. VAH reclaim at 7:10 = real entry on split vol late days.",journal:"",tags:["Skip","SystemSkip","SplitVol","SVP","VAHReclaim","LateEntry","MacroDay","Calls"]},
  {day:119,date:"2026-05-29",direction:"PUTS",correctDirection:"PUTS",result:"LOSS",pnl:-30,pct:-97,strat:"3-/3-",story:"Puts E",grade:"B+",playType:"One-Act",range:"Tight 0.90",gap:"Down -0.87",openPrice:"291.15",volToday:"IWM 90% / IWO 154%",closePercent:"84.9",fiveDayPercent:"95.5",entryTime:"6:30",exitTime:"7:25",entryPrice:"0.45",exitPrice:"1.12",whatWorked:"Ceiling shattered below VAL. Extreme High vars + gap down = longs trapped = One-Act liquidation.",learning:"3-/3- = discovery. Extreme High vars + gap down below VAL = One-Act liquidation. No campaign needed when ceiling is shattered.",journal:"",tags:["Puts","Liquidation","PutsStoryE","NewPattern","3neutral"]},
];


function Badge({text,color=C.teal,small=false}){return <span style={{background:color+"22",color,border:`1px solid ${color}44`,borderRadius:4,padding:small?"1px 6px":"2px 8px",fontSize:small?10:11,fontWeight:700,letterSpacing:"0.05em",whiteSpace:"nowrap"}}>{text}</span>;}
function Card({children,style={}}){return <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:16,...style}}>{children}</div>;}
function SLabel({children,color=C.teal}){return <div style={{color,fontFamily:"'Space Mono', monospace",fontSize:11,fontWeight:700,letterSpacing:"0.15em",textTransform:"uppercase",marginBottom:10}}>{children}</div>;}
const inp={background:"#0F1520",border:`1px solid #1E2D42`,borderRadius:8,color:"#E8EDF5",padding:"10px 14px",fontSize:14,width:"100%",boxSizing:"border-box",outline:"none",fontFamily:"inherit"};
const sel={...inp};
const lbl={color:"#5A7494",fontSize:11,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:5,display:"block"};
function Row2({children}){return <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>{children}</div>;}
function resultColor(r){return r==="WIN"?C.green:r==="LOSS"?C.red:C.textDim;}
function formatDate(ds){if(!ds)return"";const d=new Date(ds+"T12:00:00");return d.toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"});}

function useQuickStats(trades){
  return useMemo(()=>{
    const now=new Date();
    const weekStart=new Date(now);weekStart.setDate(now.getDate()-now.getDay());weekStart.setHours(0,0,0,0);
    const monthStart=new Date(now.getFullYear(),now.getMonth(),1);
    const traded=trades.filter(t=>t.result!=="SKIP");
    const wk=traded.filter(t=>{if(!t.date)return false;return new Date(t.date+"T12:00:00")>=weekStart;});
    const mo=traded.filter(t=>{if(!t.date)return false;return new Date(t.date+"T12:00:00")>=monthStart;});
    let streak=0,streakType="";
    const sorted=[...traded].sort((a,b)=>new Date(b.date)-new Date(a.date));
    for(const t of sorted){if(streak===0){streakType=t.result;streak=1;}else if(t.result===streakType)streak++;else break;}
    return{streak,streakType,week:{trades:wk.length,wins:wk.filter(t=>t.result==="WIN").length,losses:wk.filter(t=>t.result==="LOSS").length,pnl:wk.reduce((s,t)=>s+(t.pnl||0),0)},month:{trades:mo.length,wins:mo.filter(t=>t.result==="WIN").length,losses:mo.filter(t=>t.result==="LOSS").length,pnl:mo.reduce((s,t)=>s+(t.pnl||0),0)}};
  },[trades]);
}

function classify(v){
  if(!v.priorClose||!v.open)return null;
  const gap=parseFloat(v.open)-parseFloat(v.priorClose);
  const gapDir=gap>0.33?"Up":gap<-0.33?"Down":"Flat";
  const gapAmt=Math.abs(gap).toFixed(2);
  let svpLocation="Unknown";
  if(v.vah&&v.val){if(parseFloat(v.open)>parseFloat(v.vah))svpLocation="Above VAH";else if(parseFloat(v.open)<parseFloat(v.val))svpLocation="Below VAL";else svpLocation="Inside VA";}
  let fvgZone="No FVG";
  if(v.pmh&&v.pml&&v.priorClose){if(gapDir==="Down"&&parseFloat(v.pmh)>parseFloat(v.priorClose))fvgZone=`${v.priorClose}–${v.pmh} (above open)`;else if(gapDir==="Up"&&parseFloat(v.pml)<parseFloat(v.priorClose))fvgZone=`${v.pml}–${v.priorClose} (below open)`;}
  const cp=parseFloat(v.closePercent);const cpZone=cp<=11?"Extreme Low":cp<=30?"Low":cp<=69?"Neutral":cp<=89?"High":"Extreme High";
  const dp=parseFloat(v.fiveDayPercent);const dpZone=dp<=20?"Extreme Low":dp<=35?"Low":dp<=75?"Neutral":dp<=89?"High":"Extreme High";
  let position="MID";
  if(v.pmh&&v.pml){const dC=Math.abs(parseFloat(v.pmh)-parseFloat(v.open));const dF=Math.abs(parseFloat(v.open)-parseFloat(v.pml));const closer=dC<dF?"ceiling":"floor";const dist=Math.min(dC,dF);position=dist<=0.20?`AT ${closer}`:dist<=1.50?`NEAR ${closer}`:"MID";}
  let playType="One-Act",playReason="";
  if(v.vah&&v.val){if(parseFloat(v.open)>=parseFloat(v.val)&&parseFloat(v.open)<=parseFloat(v.vah)){playType="Two-Act";playReason="Open inside value";}
  else{const eH=(cpZone==="Extreme High"||dpZone==="Extreme High");const eL=(cpZone==="Extreme Low"||dpZone==="Extreme Low");
    if(eH&&gapDir==="Up"){playType="Two-Act";playReason="Extreme High + gap up — bull trap";}
    else if(eH&&gapDir==="Down"&&svpLocation==="Below VAL"){playType="One-Act";playReason="Ceiling shattered — liquidation";}
    else if(eL&&gapDir==="Down"){playType="Two-Act";playReason="Extreme Low + gap down — bear trap risk";}}}
  const strat=v.strat||"";let bias="SKIP";
  if(strat.includes("2up"))bias="CALLS";else if(strat.includes("2dn"))bias="PUTS";
  if(cpZone==="Extreme High"&&gapDir==="Down"&&svpLocation==="Below VAL")bias="PUTS";
  if(cpZone==="Extreme Low"&&gapDir==="Up"&&svpLocation==="Above VAH")bias="CALLS";
  const maxP=Math.max(parseFloat(v.iwmPace)||0,parseFloat(v.iwoPace)||0);
  const paceLabel=maxP>=90?"Explosive":maxP>=70?"Standard":"Slow";
  let grade="Skip";if(bias!=="SKIP"){if(paceLabel==="Explosive")grade="A+";else if((v.volChange||"").includes("Improved")||(v.volChange||"").includes("Surged"))grade="A";else grade="B+";}
  const entry=grade==="A+"?"Early 6:30–6:32":grade==="A"?"Standard 6:35–6:45":grade==="B+"?"Late 6:50–7:05":"N/A";
  let sweep="Nearest level";if(fvgZone!=="No FVG")sweep=`FVG: ${fvgZone}`;
  return{gap:`${gapDir} ${gapAmt}`,gapDir,svpLocation,fvgZone,cpZone,dpZone,position,playType,playReason,bias,grade,entry,sweep,paceLabel};
}

function parseEOD(text){
  const ext={};
  const dayM=text.match(/DAY\s+(\d+)/i);if(dayM)ext.day=parseInt(dayM[1]);
  const dateM=text.match(/—\s+([A-Za-z]+ \d+,\s*\d+)/);if(dateM){const d=new Date(dateM[1]);if(!isNaN(d))ext.date=d.toISOString().split("T")[0];}
  const stratM=text.match(/(2up\/2up|2dn\/2dn|3-|1-)/i);if(stratM)ext.strat=stratM[1];
  const storyM=text.match(/\|\s*(Calls [A-E]|Puts [A-E]|No Story Match|Skip|Fight Story|Neutral Discovery)/i);if(storyM)ext.story=storyM[1];
  const dirM=text.match(/Entry:\s*(CALLS|PUTS)/i);if(dirM){ext.direction=dirM[1].toUpperCase();ext.correctDirection=dirM[1].toUpperCase();}
  const closeM=text.match(/Close%\s+([\d.]+)%/i);if(closeM)ext.closePercent=closeM[1];
  const fiveM=text.match(/5D%\s+([\d.]+)%/i);if(fiveM)ext.fiveDayPercent=fiveM[1];
  const gapM=text.match(/Gap:\s*(Up|Down|Flat)\s*([\+\-]?[\d.]+)/i);if(gapM)ext.gap=`${gapM[1]} ${gapM[2]}`;
  const rangeM=text.match(/(Tight|Mid|Wide)\s+([\d.]+)/i);if(rangeM)ext.range=`${rangeM[1]} ${rangeM[2]}`;
  const volM=text.match(/Today IWM\s+([\d.]+)%\s*\/\s*IWO\s+([\d.]+)%/i);if(volM)ext.volToday=`IWM ${volM[1]}% / IWO ${volM[2]}%`;
  const openM=text.match(/Open[:\s]+([\d.]+)/i);if(openM)ext.openPrice=openM[1];
  const learningM=text.match(/Learning:\s*(.+?)(?:\n|Tags:|$)/is);if(learningM)ext.learning=learningM[1].trim();
  const tagsM=text.match(/Tags:\s*(.+?)$/im);if(tagsM)ext.tags=tagsM[1].trim().split(/\s+/).map(t=>t.replace(/^#/,""));
  const entryTM=text.match(/Entry:.*?@\s*(\d+:\d+)/i);if(entryTM)ext.entryTime=entryTM[1];
  const exitTM=text.match(/→\s*(?:HOD|LOD).*?@\s*(\d+:\d+)/i);if(exitTM)ext.exitTime=exitTM[1];
  const gradeM=text.match(/\b(A\+|A|B\+)\b/);if(gradeM)ext.grade=gradeM[1];
  const playM=text.match(/(One-Act|Two-Act)/i);if(playM)ext.playType=playM[1];
  return ext;
}

// ── CALENDAR ──────────────────────────────────────────────────────
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
  const weeks=[];
  let week=new Array(firstDay).fill(null);
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

// ── DAY MODAL ─────────────────────────────────────────────────────
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
        {trade.journal&&<div style={{marginBottom:16}}><div style={{color:C.textMuted,fontSize:11,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:8}}>Daily Journal</div><div style={{color:C.textMuted,fontSize:13,lineHeight:1.7}}>{trade.journal}</div></div>}
        {trade.tags&&trade.tags.length>0&&<div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:20}}>{trade.tags.map(t=><Badge key={t} text={`#${t}`} color={C.teal} small/>)}</div>}
        <div style={{display:"grid",gridTemplateColumns:"1fr auto",gap:10}}>
          <button onClick={onEdit} style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:10,padding:"13px",color:C.textMain,fontSize:14,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>✏️ Edit Day</button>
          <button onClick={onDelete} style={{background:C.red+"15",border:`1px solid ${C.red}40`,borderRadius:10,padding:"13px 18px",color:C.red,fontSize:18,cursor:"pointer"}}>🗑</button>
        </div>
      </div>
    </div>
  );
}

// ── TRADE LOG ─────────────────────────────────────────────────────
function TradePage({trades,setTrades,editTrade,setEditTrade}){
  const blank={day:"",date:new Date().toISOString().split("T")[0],direction:"CALLS",correctDirection:"CALLS",result:"WIN",pnl:"",pct:"",strat:"2up/2up",story:"",grade:"A",playType:"One-Act",range:"",gap:"",openPrice:"",volToday:"",closePercent:"",fiveDayPercent:"",entryTime:"",exitTime:"",entryPrice:"",exitPrice:"",whatWorked:"",learning:"",journal:"",eodSummary:"",tags:[]};
  const [form,setForm]=useState(editTrade||blank);
  const [eodText,setEodText]=useState("");
  const [parsed,setParsed]=useState(null);
  const [missing,setMissing]=useState([]);
  const [showForm,setShowForm]=useState(!!editTrade);
  const [saved,setSaved]=useState(false);
  useEffect(()=>{if(editTrade){setForm(editTrade);setShowForm(true);setEodText(editTrade.eodSummary||"");}},[editTrade]);
  const setF=(k,v)=>setForm(p=>({...p,[k]:v}));
  const handleParse=()=>{const ext=parseEOD(eodText);setParsed(ext);setForm(p=>({...p,...ext,eodSummary:eodText}));const needed=["day","date","result","strat","grade"];setMissing(needed.filter(k=>!ext[k]));setShowForm(true);};
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
      <Card style={{marginBottom:14,borderColor:C.green+"40"}}>
        <SLabel color={C.green}>✂️ Paste EOD Summary — Auto-Extract</SLabel>
        {parsed&&(<div style={{background:C.surface,borderRadius:8,padding:"10px 14px",marginBottom:12,border:`1px solid ${C.green}30`}}>
          <div style={{color:C.green,fontSize:12,marginBottom:4}}>✅ Extracted: {Object.keys(parsed).join(", ")}</div>
          {missing.length>0&&<div style={{color:C.gold,fontSize:12}}>⚠ Fill manually: {missing.join(", ")}</div>}
        </div>)}
        <textarea value={eodText} onChange={e=>setEodText(e.target.value)} placeholder="Paste your EOD summary here..." style={{...inp,minHeight:130,resize:"vertical",fontFamily:"'Space Mono', monospace",fontSize:12}}/>
        <button onClick={handleParse} style={{marginTop:10,width:"100%",background:C.green,border:"none",borderRadius:10,padding:"14px",color:"#000",fontSize:14,fontWeight:700,cursor:"pointer"}}>✂️ Parse & Extract</button>
      </Card>
      <Card style={{marginBottom:14}}>
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          <div><label style={lbl}>Date</label><input type="date" style={inp} value={form.date} onChange={e=>setF("date",e.target.value)}/></div>
          <div><label style={lbl}>Trade Executed?</label>
            <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8}}>
              {["WIN","LOSS","SKIP","OBSERVE"].map(r=><button key={r} onClick={()=>setF("result",r)} style={{padding:"10px",background:form.result===r?resultColor(r)+"30":C.surface,border:`1px solid ${form.result===r?resultColor(r):C.border}`,borderRadius:8,color:form.result===r?resultColor(r):C.textMuted,fontSize:12,fontWeight:700,cursor:"pointer"}}>{r}</button>)}
            </div>
          </div>
        </div>
      </Card>
      {showForm&&(<>
        <Card style={{marginBottom:14}}>
          <SLabel>Direction</SLabel>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <div><label style={lbl}>You Traded</label><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>{["CALLS","PUTS"].map(d=><button key={d} onClick={()=>setF("direction",d)} style={{padding:"10px",background:form.direction===d?(d==="CALLS"?C.green+"20":C.red+"20"):C.surface,border:`1px solid ${form.direction===d?(d==="CALLS"?C.green:C.red):C.border}`,borderRadius:8,color:form.direction===d?(d==="CALLS"?C.green:C.red):C.textMuted,fontSize:12,fontWeight:700,cursor:"pointer"}}>{d}</button>)}</div></div>
            <div><label style={lbl}>Correct Bias</label><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>{["CALLS","PUTS"].map(d=><button key={d} onClick={()=>setF("correctDirection",d)} style={{padding:"10px",background:form.correctDirection===d?(d==="CALLS"?C.green+"20":C.red+"20"):C.surface,border:`1px solid ${form.correctDirection===d?(d==="CALLS"?C.green:C.red):C.border}`,borderRadius:8,color:form.correctDirection===d?(d==="CALLS"?C.green:C.red):C.textMuted,fontSize:12,fontWeight:700,cursor:"pointer"}}>{d}</button>)}</div></div>
          </div>
        </Card>
        <Card style={{marginBottom:14}}>
          <SLabel>Classification</SLabel>
          <div style={{display:"flex",flexDirection:"column",gap:12}}>
            <Row2><div><label style={lbl}>Day #</label><input style={inp} value={form.day} onChange={e=>setF("day",e.target.value)} placeholder="119"/></div><div><label style={lbl}>The Strat</label><input style={inp} value={form.strat} onChange={e=>setF("strat",e.target.value)} placeholder="2up/2up"/></div></Row2>
            <Row2><div><label style={lbl}>Grade</label><select style={sel} value={form.grade} onChange={e=>setF("grade",e.target.value)}>{["A+","A","B+","Skip"].map(g=><option key={g}>{g}</option>)}</select></div><div><label style={lbl}>Play Type</label><select style={sel} value={form.playType||"One-Act"} onChange={e=>setF("playType",e.target.value)}><option>One-Act</option><option>Two-Act</option></select></div></Row2>
            <Row2><div><label style={lbl}>Story Match</label><input style={inp} value={form.story} onChange={e=>setF("story",e.target.value)} placeholder="Calls A"/></div><div><label style={lbl}>Range</label><input style={inp} value={form.range||""} onChange={e=>setF("range",e.target.value)} placeholder="Tight 0.90"/></div></Row2>
          </div>
        </Card>
        <Card style={{marginBottom:14}}>
          <SLabel>Trade Details</SLabel>
          <div style={{display:"flex",flexDirection:"column",gap:12}}>
            <Row2><div><label style={lbl}>Entry Time</label><input style={inp} value={form.entryTime} onChange={e=>setF("entryTime",e.target.value)} placeholder="6:31"/></div><div><label style={lbl}>Exit Time</label><input style={inp} value={form.exitTime} onChange={e=>setF("exitTime",e.target.value)} placeholder="7:45"/></div></Row2>
            <Row2><div><label style={{...lbl,color:C.gold}}>Entry Price ($) ★</label><input style={{...inp,border:`1px solid ${C.gold}60`}} value={form.entryPrice} onChange={e=>setF("entryPrice",e.target.value)} placeholder="0.45"/></div><div><label style={{...lbl,color:C.gold}}>Exit Price ($) ★</label><input style={{...inp,border:`1px solid ${C.gold}60`}} value={form.exitPrice} onChange={e=>setF("exitPrice",e.target.value)} placeholder="1.12"/></div></Row2>
            <Row2><div><label style={lbl}>P&L ($)</label><input style={inp} value={form.pnl} onChange={e=>setF("pnl",e.target.value)} placeholder="450 or -200"/></div><div><label style={lbl}>P&L %</label><input style={inp} value={form.pct} onChange={e=>setF("pct",e.target.value)} placeholder="113 or -56"/></div></Row2>
          </div>
        </Card>
        <Card style={{marginBottom:14}}>
          <SLabel>Notes</SLabel>
          <div style={{display:"flex",flexDirection:"column",gap:12}}>
            <div><label style={lbl}>What Worked</label><textarea style={{...inp,minHeight:60,resize:"vertical"}} value={form.whatWorked||""} onChange={e=>setF("whatWorked",e.target.value)} placeholder="What setup worked today..."/></div>
            <div><label style={lbl}>Key Learning</label><textarea style={{...inp,minHeight:60,resize:"vertical"}} value={form.learning} onChange={e=>setF("learning",e.target.value)} placeholder="One clean sentence..."/></div>
            <div><label style={lbl}>Daily Journal</label><textarea style={{...inp,minHeight:75,resize:"vertical"}} value={form.journal} onChange={e=>setF("journal",e.target.value)} placeholder="Free thoughts..."/></div>
            <div><label style={lbl}>Tags</label><input style={inp} value={Array.isArray(form.tags)?form.tags.map(t=>`#${t}`).join(" "):form.tags} onChange={e=>setF("tags",e.target.value.split(/\s+/).map(t=>t.replace(/^#/,"")).filter(Boolean))} placeholder="#Calls #SplitVol"/></div>
          </div>
        </Card>
        <button onClick={handleSave} style={{width:"100%",background:C.green,border:"none",borderRadius:12,padding:"16px",color:"#000",fontSize:16,fontWeight:700,cursor:"pointer",marginBottom:12}}>💾 Save Trade Log</button>
        {editTrade&&<button onClick={()=>{setEditTrade(null);setForm(blank);setShowForm(false);}} style={{width:"100%",background:C.surface,border:`1px solid ${C.border}`,borderRadius:12,padding:"14px",color:C.textMuted,fontSize:14,cursor:"pointer"}}>Cancel Edit</button>}
      </>)}
    </div>
  );
}

// ── CLASSIFY ──────────────────────────────────────────────────────
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
          <label key={k} style={{display:"flex",alignItems:"center",gap:10,cursor:"pointer",marginBottom:8}}><input type="checkbox" checked={vars[k]} onChange={e=>set(k,e.target.checked)} style={{width:16,height:16,accentColor:C.red}}/><span style={{color:vars[k]?C.red:C.textMuted,fontSize:13}}>{label}</span></label>
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
            {result&&vars.open&&(<div style={{padding:"12px 14px",background:C.surface,borderRadius:8,border:`1px solid ${C.blue}30`,display:"flex",gap:16,flexWrap:"wrap"}}>
              {[["GAP",result.gap,C.blue],["SVP",result.svpLocation,C.blue],["FVG",result.fvgZone,result.fvgZone==="No FVG"?C.textMuted:C.gold],["POS",result.position,C.blue]].map(([k,v,c])=>(
                <div key={k}><span style={{color:C.textMuted,fontSize:11}}>{k} </span><span style={{color:c,fontFamily:"'Space Mono', monospace",fontSize:12,fontWeight:700}}>{v}</span></div>
              ))}
            </div>)}
          </div>
        </Card>
        <Card style={{borderColor:C.gold+"60",marginBottom:14}}>
          <SLabel color={C.gold}>Q2 — Where Does It Want To Go?</SLabel>
          <div style={{display:"flex",flexDirection:"column",gap:12}}>
            <Row2><F label="Close %" k="closePercent" placeholder="84.9"/><F label="5-Day %" k="fiveDayPercent" placeholder="95.5"/></Row2>
            <div><label style={lbl}>The Strat</label><select style={sel} value={vars.strat} onChange={e=>set("strat",e.target.value)}>{["2up/2up","2dn/2dn","3-","1-","Other"].map(s=><option key={s}>{s}</option>)}</select></div>
            {result&&vars.closePercent&&(<div style={{padding:"12px 14px",background:C.surface,borderRadius:8,border:`1px solid ${C.gold}30`}}>
              <div style={{display:"flex",gap:16,flexWrap:"wrap",marginBottom:8}}>
                <div><span style={{color:C.textMuted,fontSize:11}}>CLOSE% </span><span style={{color:C.gold,fontFamily:"'Space Mono', monospace",fontWeight:700}}>{result.cpZone}</span></div>
                <div><span style={{color:C.textMuted,fontSize:11}}>5D% </span><span style={{color:C.gold,fontFamily:"'Space Mono', monospace",fontWeight:700}}>{result.dpZone}</span></div>
              </div>
              <div style={{display:"flex",gap:8,alignItems:"center"}}><Badge text={result.playType} color={result.playType==="One-Act"?C.green:C.gold}/><span style={{color:C.textMuted,fontSize:12}}>{result.playReason}</span></div>
            </div>)}
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
            {result&&vars.iwmPace&&(<div style={{padding:"10px 14px",background:C.surface,borderRadius:8,border:`1px solid ${C.green}30`}}>
              <span style={{color:C.textMuted,fontSize:11}}>PACE </span><span style={{color:result.paceLabel==="Explosive"?C.green:result.paceLabel==="Standard"?C.blue:C.textMuted,fontFamily:"'Space Mono', monospace",fontWeight:700}}>{result.paceLabel}</span>
            </div>)}
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

// ── ANALYTICS ─────────────────────────────────────────────────────
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

// ── MORNING BRIEF ─────────────────────────────────────────────────
function MorningBriefPage(){
  const [data,setData]=useState(null);
  const [loading,setLoading]=useState(false);
  const [refreshing,setRefreshing]=useState(false);
  const [lastRefresh,setLastRefresh]=useState(null);
  const [error,setError]=useState(null);

  // Manual overrides — what TradingView provides that bot can't fetch yet
  const [manual,setManual]=useState({
    vah:"",poc:"",val:"",
    iwmVol:"",iwoVol:"",iwmPace:"",iwoPace:"",
    pmh:"",pml:"",
    strat1d:"",stratIwo1d:"",strat1h:"",stratIwo1h:"",
    closePercent:"",fiveDayPercent:"",
    cvd:"",cvdDir:"Aligned",
    callOI:"",putOI:"",ivSkew:"N/A",
    macro:"None",
  });
  const setM=(k,v)=>setManual(p=>({...p,[k]:v}));

  const fetchBrief=(isRefresh=false)=>{
    if(isRefresh){setRefreshing(true);}else{setLoading(true);}
    setError(null);
    fetch("/morning_brief.json?t="+Date.now())
      .then(r=>{if(!r.ok)throw new Error("No data yet");return r.json();})
      .then(d=>{
        setData(d);
        setLastRefresh(new Date());
        // Auto-populate manual fields from bot data where available
        const bv=d?.variables||{};
        setManual(p=>({
          ...p,
          pmh:bv.pmh?.toString()||p.pmh,
          pml:bv.pml?.toString()||p.pml,
        }));
      })
      .catch(e=>setError(e.message))
      .finally(()=>{setLoading(false);setRefreshing(false);});
  };

  useEffect(()=>{fetchBrief();},[]);

  // Auto-classification from all available data
  const autoClassify=()=>{
    const v=data?.variables||{};
    const open=parseFloat(v.open||0);
    const priorClose=parseFloat(v.prior_close||0);
    const pmh=parseFloat(manual.pmh||v.pmh||0);
    const pml=parseFloat(manual.pml||v.pml||0);
    const vah=parseFloat(manual.vah||0);
    const val=parseFloat(manual.val||0);
    const cp=parseFloat(manual.closePercent||0);
    const dp=parseFloat(manual.fiveDayPercent||0);
    const iwm=parseFloat(manual.iwmVol||0);
    const iwo=parseFloat(manual.iwoVol||0);

    if(!open||!pmh||!pml) return null;

    // Step 1 — Gap
    const gap=open-priorClose;
    const gapDir=gap>0.33?"Up":gap<-0.33?"Down":"Flat";

    // Step 2 — Closer to PMH or PML
    const distPMH=Math.abs(open-pmh);
    const distPML=Math.abs(open-pml);
    const closerTo=distPMH<distPML?"PMH":"PML";

    // Step 3 — Box
    let box="E";
    if(vah&&val){
      if(open>vah){box=closerTo==="PMH"?"C":"A_above";}
      else if(open<val){box=closerTo==="PML"?"A":"C_below";}
      else{box=closerTo==="PML"?"B":"D";}
    }
    const atLevel=Math.min(distPMH,distPML)<=0.20;
    const nearLevel=Math.min(distPMH,distPML)<=1.50;

    // Step 3B — Continuation or Reversal
    let baseBias="SKIP";
    let biasType="";
    if(gapDir==="Up"&&closerTo==="PMH"){baseBias="CALLS";biasType="continuation";}
    else if(gapDir==="Down"&&closerTo==="PML"){baseBias="PUTS";biasType="continuation";}
    else if(gapDir==="Up"&&closerTo==="PML"){baseBias="CALLS";biasType="reversal";}
    else if(gapDir==="Down"&&closerTo==="PMH"){baseBias="PUTS";biasType="reversal";}
    else if(gapDir==="Flat"){baseBias="SKIP";biasType="discovery";}

    // Step 3C — Override check
    const extremeHigh=(cp>=94||dp>=90);
    const extremeLow=(cp<=11||dp<=20);
    const bothExtreme=(cp>=94&&dp>=90)||(cp<=11&&dp<=20);
    let override="";

    if(bothExtreme&&biasType==="continuation"){
      if(extremeHigh&&closerTo==="PMH"){baseBias="PUTS";override="Type1-Flip: Both extreme high at ceiling → PUTS";}
      if(extremeLow&&closerTo==="PML"){baseBias="CALLS";override="Type1-Flip: Both extreme low at floor → CALLS";}
    }
    if(biasType==="reversal"&&(extremeHigh||extremeLow)){
      override="Type3: Reversal confirmed by extreme var";
    }

    // Step 4 — Vol
    const diff=Math.abs(iwm-iwo);
    const volState=iwm<60||iwo<60?"Broken":diff>=15?(iwm>iwo?"Split-IWM":"Split-IWO"):(iwm>=100&&iwo>=100)?"Both Surged":"Both Dropped";
    const splitVol=volState.includes("Split");
    const bothSurged=volState==="Both Surged";
    const volBroken=volState==="Broken";

    if(volBroken){return{bias:"FULL SKIP",grade:"Skip",entry:"N/A",sweep:"N/A",skipTier:"Full Skip",reason:"Vol broken",gapDir,closerTo,box,baseBias,override};}

    // Step 5 — Extreme vars
    let cpZone=cp<=11?"Extreme Low":cp<=30?"Low":cp<=69?"Neutral":cp<=89?"High":"Extreme High";
    let dpZone=dp<=20?"Extreme Low":dp<=35?"Low":dp<=75?"Neutral":dp<=89?"High":"Extreme High";

    // Skip tiers
    const bothNeutral=(cpZone==="Neutral"&&dpZone==="Neutral");
    if(baseBias==="SKIP"){
      if(volBroken) return{bias:"FULL SKIP",grade:"Skip",entry:"N/A",sweep:"N/A",skipTier:"Full Skip"};
      if(bothNeutral&&gapDir==="Flat")return{bias:"SKIP — Level Test",grade:"Watch",entry:"Watch "+closerTo,sweep:"Nearest level",skipTier:"Level Test",level:closerTo==="PMH"?pmh:pml,gapDir,closerTo,box};
      if(!bothNeutral&&(iwm>=70&&iwo>=70))return{bias:"SKIP — Act 2 Potential",grade:"Watch",entry:"Monitor 7:00+",sweep:"Watch "+(closerTo==="PMH"?"PML":"PMH")+" exhaust",skipTier:"Act2",gapDir,closerTo,box};
      return{bias:"FULL SKIP",grade:"Skip",entry:"N/A",sweep:"N/A",skipTier:"Full Skip"};
    }

    if(biasType==="reversal"&&!override){
      if(!bothNeutral&&iwm>=70&&iwo>=70) return{bias:"SKIP — Act 2 Potential",grade:"Watch",entry:"Monitor 7:00+",sweep:"Reversal needs confirmation",skipTier:"Act2",gapDir,closerTo,box};
      return{bias:"FULL SKIP",grade:"Skip",entry:"N/A",sweep:"N/A",skipTier:"Full Skip"};
    }

    // Grade + timing
    const iwmPace=parseFloat(manual.iwmPace||0);
    const iwoPace=parseFloat(manual.iwoPace||0);
    const maxPace=Math.max(iwmPace,iwoPace);
    const explosive=maxPace>=90;
    const slow=maxPace<70&&maxPace>0;

    let grade="B+";
    if((explosive||bothSurged||bothExtreme||atLevel)&&!splitVol) grade="A+";
    else if(!splitVol&&!slow) grade="A";
    else if(splitVol&&(extremeHigh||extremeLow||atLevel)) grade="A";

    const entry=grade==="A+"?"Early 6:30–6:32":grade==="A"?"Standard 6:35–6:45":"Late 6:50–7:05";

    // Sweep
    const fvg=data?.variables?.fvg_zone||"No FVG";
    const sweep=fvg!=="No FVG"?`FVG: ${fvg}`:`Nearest level: ${closerTo==="PMH"?"PML "+pml.toFixed(2):"PMH "+pmh.toFixed(2)}`;

    return{
      bias:baseBias,grade,entry,sweep,
      gapDir,closerTo,box:box.replace("_above","").replace("_below",""),
      cpZone,dpZone,volState,override,
      atLevel,biasType,
    };
  };

  const result=autoClassify();
  const v=data?.variables||{};
  const levels=v.level_scanner||{};
  const statusColor=s=>s==="Broke"?C.red:s==="Held"?C.green:C.textDim;
  const mInp={background:C.surface,border:`1px solid ${C.border}`,borderRadius:6,color:C.textMain,padding:"7px 10px",fontSize:12,width:"100%",boxSizing:"border-box",outline:"none",fontFamily:"'Space Mono', monospace"};
  const mLbl={color:C.textMuted,fontSize:9,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:3,display:"block"};
  const MF=({k,label,placeholder=""})=><div><label style={mLbl}>{label}</label><input style={mInp} value={manual[k]} placeholder={placeholder} onChange={e=>setM(k,e.target.value)}/></div>;
  const MSel=({k,label,opts})=><div><label style={mLbl}>{label}</label><select style={{...mInp,cursor:"pointer"}} value={manual[k]} onChange={e=>setM(k,e.target.value)}>{opts.map(o=><option key={o}>{o}</option>)}</select></div>;

  const biasColor=b=>b==="CALLS"?C.green:b==="PUTS"?C.red:b?.includes("Act 2")?C.gold:b?.includes("Level")?C.blue:C.textMuted;

  return(
    <div style={{display:"flex",flexDirection:"column",gap:14}}>

      {/* Header */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div>
          {data?(
            <>
              <div style={{color:C.green,fontSize:11,fontFamily:"'Space Mono', monospace",fontWeight:700}}>✅ Bot data loaded</div>
              <div style={{color:C.textMuted,fontSize:10}}>Generated {data.generated_at}</div>
            </>
          ):(
            <div style={{color:C.textMuted,fontSize:11}}>No bot data — enter manually below</div>
          )}
          {lastRefresh&&<div style={{color:C.textDim,fontSize:10}}>Last refreshed {lastRefresh.toLocaleTimeString()}</div>}
        </div>
        <button
          onClick={()=>fetchBrief(true)}
          disabled={refreshing}
          style={{background:refreshing?C.surface:C.teal,border:`1px solid ${refreshing?C.border:C.teal}`,borderRadius:8,padding:"9px 16px",color:refreshing?C.textMuted:"#000",fontSize:12,fontWeight:700,cursor:refreshing?"not-allowed":"pointer",display:"flex",alignItems:"center",gap:6,transition:"all 0.2s"}}
        >
          <span style={{display:"inline-block",animation:refreshing?"spin 1s linear infinite":"none"}}>↻</span>
          {refreshing?"Refreshing...":"Refresh"}
        </button>
      </div>

      {/* Level Scanner from bot */}
      {data&&(
        <Card style={{borderColor:C.teal+"40"}}>
          <SLabel color={C.teal}>⚡ Level Scanner</SLabel>
          <table style={{width:"100%",borderCollapse:"collapse"}}>
            <thead><tr>{["Level","Value","Tested","Status","EQ"].map(h=>(
              <th key={h} style={{color:C.textMuted,fontSize:10,textAlign:"left",padding:"6px 0",borderBottom:`1px solid ${C.border}`,letterSpacing:"0.08em"}}>{h}</th>
            ))}</tr></thead>
            <tbody>
              {["PMH","PML","PDH","PDL","PDO"].map(name=>{
                const info=levels[name]||{};
                return(
                  <tr key={name}>
                    <td style={{color:C.teal,fontFamily:"'Space Mono', monospace",fontSize:13,padding:"9px 0",fontWeight:700}}>{name}</td>
                    <td style={{color:C.textMain,fontFamily:"'Space Mono', monospace",fontSize:13,padding:"9px 0"}}>{info.value||manual[name.toLowerCase()]||"—"}</td>
                    <td style={{color:C.textMuted,fontSize:13,padding:"9px 0"}}>{info.tested>0?`${info.tested}x`:"—"}</td>
                    <td style={{padding:"9px 0"}}>{info.status&&info.status!=="—"?<span style={{color:statusColor(info.status),fontFamily:"'Space Mono', monospace",fontSize:11,fontWeight:700}}>{info.status}</span>:<span style={{color:C.textDim}}>—</span>}</td>
                    <td style={{color:info.eq&&info.eq!=="—"?C.gold:C.textDim,fontSize:11,padding:"9px 0"}}>{info.eq||"—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {v.sweep_warning&&v.sweep_warning!=="None detected"&&(
            <div style={{marginTop:10,padding:"10px 14px",background:C.gold+"15",borderRadius:8,border:`1px solid ${C.gold}40`,color:C.gold,fontSize:12}}>
              ⚠️ {v.sweep_warning}
            </div>
          )}
        </Card>
      )}

      {/* Bot Variables */}
      {data&&(
        <Card>
          <SLabel color={C.blue}>📡 Bot Variables</SLabel>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            {[["Gap",v.gap],["FVG Zone",v.fvg_zone],["PM Range",v.pm_range],["Position",v.position],["Open",v.open],["Prior Close",v.prior_close]].map(([label,val])=>(
              <div key={label} style={{background:C.surface,borderRadius:8,padding:"10px 12px"}}>
                <div style={{color:C.textMuted,fontSize:10,textTransform:"uppercase",marginBottom:3,letterSpacing:"0.08em"}}>{label}</div>
                <div style={{color:val&&val!=="No FVG"?C.textMain:C.textDim,fontFamily:"'Space Mono', monospace",fontSize:12,fontWeight:val?600:400}}>{val||"—"}</div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Manual Inputs — TradingView data */}
      <Card style={{borderColor:C.blue+"40"}}>
        <SLabel color={C.blue}>📊 TradingView Inputs</SLabel>
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
            <MF k="vah" label="VAH" placeholder="291.88"/>
            <MF k="poc" label="POC" placeholder="291.70"/>
            <MF k="val" label="VAL" placeholder="291.53"/>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
            <MF k="pmh" label="PMH" placeholder="292.27"/>
            <MF k="pml" label="PML" placeholder="291.37"/>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
            <MF k="iwmVol" label="IWM Vol %" placeholder="90"/>
            <MF k="iwoVol" label="IWO Vol %" placeholder="154"/>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
            <MF k="iwmPace" label="IWM Pace %" placeholder="75.5"/>
            <MF k="iwoPace" label="IWO Pace %" placeholder="68.7"/>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
            <MF k="closePercent" label="Close %" placeholder="84.9"/>
            <MF k="fiveDayPercent" label="5-Day %" placeholder="95.5"/>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
            <MSel k="strat1d" label="IWM 1D Strat" opts={["","2up","2dn","3-","1-"]}/>
            <MSel k="stratIwo1d" label="IWO 1D Strat" opts={["","2up","2dn","3-","1-"]}/>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
            <MF k="cvd" label="CVD" placeholder="+739"/>
            <MSel k="cvdDir" label="CVD Direction" opts={["Aligned","Diverging","Neutral"]}/>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
            <MF k="callOI" label="Call OI Strike" placeholder="293"/>
            <MF k="putOI" label="Put OI Strike" placeholder="290"/>
          </div>
          <MSel k="ivSkew" label="IV Skew (Pineify)" opts={["N/A","Bullish","Bearish","Dual-IV Explosion"]}/>
          <MF k="macro" label="Macro" placeholder="None"/>
        </div>
      </Card>

      {/* Auto Classification Output */}
      {result&&(
        <Card style={{
          borderColor:result.bias==="CALLS"?C.green:result.bias==="PUTS"?C.red:result.bias?.includes("Act 2")?C.gold:result.bias?.includes("Level")?C.blue:C.border,
          background:result.bias==="CALLS"?C.green+"08":result.bias==="PUTS"?C.red+"08":result.bias?.includes("Act 2")?C.gold+"08":C.card
        }}>
          <SLabel color={biasColor(result.bias)}>🤖 Classification Output</SLabel>

          {/* 4 lines */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:14}}>
            <div>
              <div style={{color:C.textMuted,fontSize:10,marginBottom:4}}>BIAS</div>
              <div style={{color:biasColor(result.bias),fontFamily:"'Space Mono', monospace",fontSize:result.bias?.length>8?14:22,fontWeight:700,lineHeight:1.2}}>
                {result.bias==="CALLS"?"🟢":result.bias==="PUTS"?"🔴":"⚠️"} {result.bias}
              </div>
            </div>
            <div>
              <div style={{color:C.textMuted,fontSize:10,marginBottom:4}}>GRADE</div>
              <div style={{color:result.grade==="A+"?C.gold:result.grade==="A"?C.green:result.grade==="Watch"?C.blue:C.textMuted,fontFamily:"'Space Mono', monospace",fontSize:22,fontWeight:700}}>
                {result.grade}
              </div>
            </div>
            <div>
              <div style={{color:C.textMuted,fontSize:10,marginBottom:4}}>ENTRY</div>
              <div style={{color:C.textMain,fontFamily:"'Space Mono', monospace",fontSize:11}}>{result.entry}</div>
            </div>
            <div>
              <div style={{color:C.textMuted,fontSize:10,marginBottom:4}}>BOX</div>
              <div style={{color:C.teal,fontFamily:"'Space Mono', monospace",fontSize:16,fontWeight:700}}>
                Box {result.box} — {result.closerTo}
              </div>
            </div>
          </div>

          <div style={{marginBottom:10}}>
            <div style={{color:C.textMuted,fontSize:10,marginBottom:4}}>SWEEP ZONE</div>
            <div style={{color:C.textMain,fontFamily:"'Space Mono', monospace",fontSize:11}}>{result.sweep}</div>
          </div>

          {/* Context reads */}
          {result.gapDir&&(
            <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:8}}>
              <span style={{background:C.surface,borderRadius:6,padding:"4px 10px",color:result.gapDir==="Up"?C.green:result.gapDir==="Down"?C.red:C.textMuted,fontSize:11,fontFamily:"'Space Mono', monospace"}}>
                Gap {result.gapDir}
              </span>
              {result.biasType&&<span style={{background:C.surface,borderRadius:6,padding:"4px 10px",color:result.biasType==="continuation"?C.green:C.gold,fontSize:11,fontFamily:"'Space Mono', monospace"}}>
                {result.biasType}
              </span>}
              {result.volState&&<span style={{background:C.surface,borderRadius:6,padding:"4px 10px",color:result.volState.includes("Surged")?C.green:result.volState.includes("Split")?C.gold:result.volState==="Broken"?C.red:C.textMuted,fontSize:11,fontFamily:"'Space Mono', monospace"}}>
                {result.volState}
              </span>}
            </div>
          )}

          {result.override&&(
            <div style={{padding:"8px 12px",background:C.gold+"15",borderRadius:8,border:`1px solid ${C.gold}40`,color:C.gold,fontSize:11,marginBottom:8}}>
              ⚡ {result.override}
            </div>
          )}

          {result.skipTier==="Level Test"&&(
            <div style={{padding:"8px 12px",background:C.blue+"15",borderRadius:8,border:`1px solid ${C.blue}40`,color:C.blue,fontSize:11}}>
              👁 Watch {result.level} — rejection = direction confirmed
            </div>
          )}

          {result.skipTier==="Act2"&&(
            <div style={{padding:"8px 12px",background:C.gold+"15",borderRadius:8,border:`1px solid ${C.gold}40`,color:C.gold,fontSize:11}}>
              ⏳ Act 1 plays out → watch for exhaustion at level → enter Act 2 from 7:00+
            </div>
          )}
        </Card>
      )}

      {/* No data empty state */}
      {!data&&!loading&&(
        <div style={{padding:"20px 0",textAlign:"center"}}>
          <div style={{color:C.textDim,fontSize:12}}>Bot runs at 4:00 AM PST on weekdays</div>
          <div style={{color:C.textDim,fontSize:11,marginTop:4}}>Enter TradingView inputs above for manual classification</div>
        </div>
      )}

      <style>{`
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
      `}</style>
    </div>
  );
}

// ── MAIN APP ──────────────────────────────────────────────────────
export default function App(){
  const [page,setPage]=useState("classify");
  const [menuOpen,setMenuOpen]=useState(false);
  const [trades,setTrades]=useState(()=>{try{const s=localStorage.getItem("stealth_trades_v2");return s?JSON.parse(s):INITIAL_TRADES;}catch{return INITIAL_TRADES;}});
  const [selectedDay,setSelectedDay]=useState(null);
  const [editTrade,setEditTrade]=useState(null);
  useEffect(()=>{try{localStorage.setItem("stealth_trades_v2",JSON.stringify(trades));}catch{}},[trades]);
  const qs=useQuickStats(trades);
  const totalPnL=trades.reduce((s,d)=>s+(d.pnl||0),0);
  const traded=trades.filter(d=>d.result!=="SKIP");
  const wr=traded.length?Math.round(traded.filter(d=>d.result==="WIN").length/traded.length*100):0;
  const handleEdit=()=>{setEditTrade(selectedDay);setSelectedDay(null);setPage("log");};
  const handleDelete=()=>{setTrades(p=>p.filter(t=>t.day!==selectedDay.day));setSelectedDay(null);};
  const nav=[{id:"classify",label:"Classify",icon:"⚡"},{id:"brief",label:"Brief",icon:"📡"},{id:"calendar",label:"Calendar",icon:"📅"},{id:"log",label:"Trade Log",icon:"📋"},{id:"analytics",label:"Stats",icon:"📊"},];
  const streakEmoji=qs.streakType==="WIN"?"🤑":"🤬";
  const streakLabel=qs.streakType==="WIN"?`${qs.streak} win${qs.streak>1?"s":""}`:`${qs.streak} loss${qs.streak>1?"es":""}`;
  return(
    <div style={{background:C.bg,minHeight:"100vh",color:C.textMain,fontFamily:"'DM Sans', sans-serif"}}>
      <link href="https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=DM+Sans:wght@400;500;600&display=swap" rel="stylesheet"/>
      <div style={{position:"sticky",top:0,zIndex:100,background:C.surface+"F0",backdropFilter:"blur(20px)",borderBottom:`1px solid ${C.border}`,padding:"0 16px",height:52,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <button onClick={()=>setMenuOpen(!menuOpen)} style={{background:"none",border:"none",color:C.teal,cursor:"pointer",fontSize:18,padding:4}}>☰</button>
          <span style={{color:C.white,fontFamily:"'Space Mono', monospace",fontWeight:400,fontSize:16,letterSpacing:"0.02em"}}>Stealth</span>
          <span style={{color:C.white,fontFamily:"'Space Mono', monospace",fontWeight:700,fontSize:16,letterSpacing:"0.02em",marginLeft:-6}}>Signals</span>
          <span style={{color:C.teal,fontFamily:"'Space Mono', monospace",fontWeight:700,fontSize:13,marginLeft:2}}>2</span>
        </div>
        <div style={{display:"flex",gap:14}}>
          <div style={{textAlign:"right"}}><div style={{color:wr>50?C.green:C.red,fontFamily:"'Space Mono', monospace",fontSize:12,fontWeight:700}}>{wr}%</div><div style={{color:C.textMuted,fontSize:9}}>WIN RATE</div></div>
          <div style={{textAlign:"right"}}><div style={{color:totalPnL>=0?C.green:C.red,fontFamily:"'Space Mono', monospace",fontSize:12,fontWeight:700}}>{totalPnL>=0?"+":""}${totalPnL}</div><div style={{color:C.textMuted,fontSize:9}}>TOTAL P&L</div></div>
        </div>
      </div>
      {menuOpen&&(
        <div style={{position:"fixed",inset:0,zIndex:200}} onClick={()=>setMenuOpen(false)}>
          <div style={{position:"absolute",left:0,top:0,bottom:0,width:260,background:C.surface,borderRight:`1px solid ${C.border}`,padding:20,display:"flex",flexDirection:"column",gap:6,overflowY:"auto"}} onClick={e=>e.stopPropagation()}>
            <div style={{marginBottom:16,display:"flex",alignItems:"baseline",gap:2}}>
              <span style={{color:C.textMain,fontFamily:"'Space Mono', monospace",fontWeight:400,fontSize:17}}>Stealth</span>
              <span style={{color:C.textMain,fontFamily:"'Space Mono', monospace",fontWeight:700,fontSize:17}}>Signals</span>
              <span style={{color:C.teal,fontFamily:"'Space Mono', monospace",fontWeight:700,fontSize:14,marginLeft:3}}>2</span>
            </div>
            {nav.map(n=>(
              <button key={n.id} onClick={()=>{setPage(n.id);setMenuOpen(false);}} style={{background:page===n.id?C.teal+"15":"none",border:`1px solid ${page===n.id?C.teal+"40":"transparent"}`,borderRadius:8,padding:"11px 14px",textAlign:"left",color:page===n.id?C.teal:C.textMuted,fontSize:14,cursor:"pointer",display:"flex",alignItems:"center",gap:10}}>
                <span>{n.icon}</span><span>{n.label}</span>
              </button>
            ))}
            <div style={{marginTop:16,borderTop:`1px solid ${C.border}`,paddingTop:16}}>
              <div style={{color:C.textMuted,fontSize:10,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:12}}>Quick Stats</div>
              <div style={{background:C.card,borderRadius:10,padding:"12px 14px",marginBottom:10,border:`1px solid ${C.border}`}}>
                <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:6}}><span style={{fontSize:12}}>🔥</span><span style={{color:C.textMuted,fontSize:10,letterSpacing:"0.1em",textTransform:"uppercase"}}>Current Streak</span></div>
                <div style={{color:C.textMain,fontSize:20,fontWeight:700}}>{streakLabel} {streakEmoji}</div>
              </div>
              <div style={{background:C.card,borderRadius:10,padding:"12px 14px",marginBottom:10,border:`1px solid ${C.border}`}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                  <div style={{display:"flex",alignItems:"center",gap:6}}><span style={{fontSize:12}}>↗</span><span style={{color:C.textMuted,fontSize:10,letterSpacing:"0.1em",textTransform:"uppercase"}}>This Week</span></div>
                  <span style={{color:qs.week.pnl>=0?C.green:C.red,fontFamily:"'Space Mono', monospace",fontSize:13,fontWeight:700}}>{qs.week.pnl>=0?"+":""}${qs.week.pnl}</span>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",textAlign:"center"}}>
                  <div><div style={{color:C.textMain,fontSize:18,fontWeight:700}}>{qs.week.trades}</div><div style={{color:C.textMuted,fontSize:10}}>Trades</div></div>
                  <div><div style={{color:C.green,fontSize:18,fontWeight:700}}>{qs.week.wins}</div><div style={{color:C.textMuted,fontSize:10}}>Wins</div></div>
                  <div><div style={{color:C.red,fontSize:18,fontWeight:700}}>{qs.week.losses}</div><div style={{color:C.textMuted,fontSize:10}}>Losses</div></div>
                </div>
              </div>
              <div style={{background:C.card,borderRadius:10,padding:"12px 14px",border:`1px solid ${C.border}`}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                  <div style={{display:"flex",alignItems:"center",gap:6}}><span style={{fontSize:12}}>↘</span><span style={{color:C.textMuted,fontSize:10,letterSpacing:"0.1em",textTransform:"uppercase"}}>This Month</span></div>
                  <span style={{color:qs.month.pnl>=0?C.green:C.red,fontFamily:"'Space Mono', monospace",fontSize:13,fontWeight:700}}>{qs.month.pnl>=0?"+":""}${qs.month.pnl}</span>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",textAlign:"center"}}>
                  <div><div style={{color:C.textMain,fontSize:18,fontWeight:700}}>{qs.month.trades}</div><div style={{color:C.textMuted,fontSize:10}}>Trades</div></div>
                  <div><div style={{color:C.green,fontSize:18,fontWeight:700}}>{qs.month.wins}</div><div style={{color:C.textMuted,fontSize:10}}>Wins</div></div>
                  <div><div style={{color:C.red,fontSize:18,fontWeight:700}}>{qs.month.losses}</div><div style={{color:C.textMuted,fontSize:10}}>Losses</div></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      <div style={{padding:"16px 14px 100px",maxWidth:800,margin:"0 auto"}}>
        <div style={{marginBottom:14}}>
          <div style={{color:C.textMuted,fontSize:11,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:2}}>{new Date().toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric"})}</div>
          <div style={{color:C.textMain,fontFamily:"'Space Mono', monospace",fontSize:18,fontWeight:700}}>{nav.find(n=>n.id===page)?.label}</div>
        </div>
        {page==="classify"&&<ClassifyPage/>}
        {page==="brief"&&<MorningBriefPage/>}
        {page==="calendar"&&<CalendarPage trades={trades} onSelectDay={setSelectedDay}/>}
        {page==="log"&&<TradePage trades={trades} setTrades={setTrades} editTrade={editTrade} setEditTrade={setEditTrade}/>}
        {page==="analytics"&&<AnalyticsPage trades={trades}/>}
      </div>
      <div style={{position:"fixed",bottom:0,left:0,right:0,zIndex:100,background:C.surface+"F5",backdropFilter:"blur(20px)",borderTop:`1px solid ${C.border}`,display:"flex",justifyContent:"space-around",padding:"8px 0 12px"}}>
        {nav.map(n=>(
          <button key={n.id} onClick={()=>setPage(n.id)} style={{background:"none",border:"none",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:3,color:page===n.id?C.teal:C.textMuted,flex:1}}>
            <span style={{fontSize:18}}>{n.icon}</span>
            <span style={{fontSize:9,letterSpacing:"0.05em",textTransform:"uppercase",fontFamily:"'Space Mono', monospace"}}>{n.label}</span>
          </button>
        ))}
      </div>
      {selectedDay&&<DayModal trade={selectedDay} onClose={()=>setSelectedDay(null)} onEdit={handleEdit} onDelete={handleDelete}/>}
    </div>
  );
}
