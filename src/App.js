import { useState, useEffect, useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, Cell } from "recharts";

// ── TRADE DATA (All 119 days) ────────────────────────────────────
const TRADE_DATA = [
  { day: 1, date: "Dec 9, 2025", direction: "CALLS", result: "WIN", pnl: -8, pct: -50, strike: 249, strat: "N/A", story: "Neutral Discovery", grade: "B+", playType: "Two-Act", range: "N/A", tags: ["Calls","NeutralDiscovery"] },
  { day: 2, date: "Dec 10, 2025", direction: "SKIP", result: "SKIP", pnl: 0, pct: 0, strike: null, strat: "FOMC", story: "FOMC Skip", grade: "Skip", playType: null, range: null, tags: ["Skip","FOMC"] },
  { day: 3, date: "Dec 11, 2025", direction: "CALLS/PUTS", result: "WIN", pnl: 21, pct: 0, strike: 258, strat: "2up/2up", story: "Fight Story", grade: "A", playType: "Two-Act", range: "Wide 3.77", tags: ["TwoAct","FightStory"] },
  { day: 4, date: "Dec 12, 2025", direction: "PUTS", result: "WIN", pnl: 0, pct: 0, strike: null, strat: "2up/2up", story: "Puts A", grade: "A+", playType: "One-Act", range: "Tight 1.18", tags: ["Puts","PutsStoryA"] },
  { day: 5, date: "Dec 15, 2025", direction: "PUTS", result: "WIN", pnl: 0, pct: 0, strike: null, strat: "N/A", story: "Puts B", grade: "A+", playType: "One-Act", range: "Wide 3.80", tags: ["Puts","PutsStoryB"] },
  { day: 6, date: "Dec 16, 2025", direction: "CALLS/PUTS", result: "WIN", pnl: 0, pct: 0, strike: null, strat: "N/A", story: "Fight Story", grade: "B+", playType: "Two-Act", range: "Mid 1.90", tags: ["TwoAct","FightStory"] },
  { day: 7, date: "Dec 17, 2025", direction: "CALLS/PUTS", result: "WIN", pnl: 37, pct: 33, strike: 253, strat: "N/A", story: "Fight Story", grade: "B+", playType: "Two-Act", range: "Wide 3.67", tags: ["TwoAct"] },
  { day: 8, date: "Dec 18, 2025", direction: "PUTS", result: "WIN", pnl: 7, pct: 8, strike: null, strat: "N/A", story: "Puts B", grade: "A", playType: "One-Act", range: "Mid 2.10", tags: ["Puts","PutsStoryB","CPI"] },
  { day: 9, date: "Dec 19, 2025", direction: "PUTS", result: "LOSS", pnl: -70, pct: -70, strike: 252, strat: "N/A", story: "N/A", grade: "B+", playType: null, range: null, tags: ["Puts"] },
  { day: 10, date: "Dec 22, 2025", direction: "CALLS", result: "WIN", pnl: 54, pct: 164, strike: 254, strat: "N/A", story: "N/A", grade: "A", playType: "One-Act", range: null, tags: ["Calls"] },
  { day: 11, date: "Dec 23, 2025", direction: "PUTS", result: "WIN", pnl: 110, pct: 122, strike: 250, strat: "N/A", story: "N/A", grade: "A+", playType: "One-Act", range: null, tags: ["Puts"] },
  { day: 12, date: "Dec 29, 2025", direction: "PUTS", result: "LOSS", pnl: -44, pct: -34, strike: 249, strat: "N/A", story: "N/A", grade: "B+", playType: null, range: null, tags: ["Puts"] },
  { day: 13, date: "Dec 30, 2025", direction: "PUTS", result: "WIN", pnl: 20, pct: 14, strike: 248, strat: "N/A", story: "N/A", grade: "A", playType: "One-Act", range: null, tags: ["Puts"] },
  { day: 14, date: "Dec 31, 2025", direction: "PUTS", result: "WIN", pnl: 28, pct: 17, strike: 246, strat: "N/A", story: "N/A", grade: "A", playType: "One-Act", range: null, tags: ["Puts"] },
  { day: 15, date: "Jan 2, 2026", direction: "PUTS", result: "WIN", pnl: 272, pct: 148, strike: 246, strat: "N/A", story: "N/A", grade: "A+", playType: "One-Act", range: null, tags: ["Puts"] },
  { day: 16, date: "Jan 5, 2026", direction: "CALLS", result: "WIN", pnl: 540, pct: 120, strike: 251, strat: "N/A", story: "N/A", grade: "A+", playType: "One-Act", range: null, tags: ["Calls"] },
  { day: 17, date: "Jan 6, 2026", direction: "CALLS", result: "WIN", pnl: 168, pct: 20, strike: 254, strat: "N/A", story: "N/A", grade: "A", playType: "One-Act", range: null, tags: ["Calls"] },
  { day: 18, date: "Jan 7, 2026", direction: "CALLS/PUTS", result: "LOSS", pnl: -617, pct: -70, strike: 258, strat: "N/A", story: "N/A", grade: "B+", playType: "Two-Act", range: null, tags: ["Calls","Puts"] },
  { day: 19, date: "Jan 8, 2026", direction: "PUTS", result: "LOSS", pnl: -300, pct: -58, strike: 253, strat: "N/A", story: "N/A", grade: "B+", playType: null, range: null, tags: ["Puts"] },
  { day: 20, date: "Jan 9, 2026", direction: "CALLS", result: "LOSS", pnl: -132, pct: -80, strike: 261, strat: "N/A", story: "N/A", grade: "B+", playType: null, range: null, tags: ["Calls"] },
  { day: 21, date: "Jan 12, 2026", direction: "PUTS", result: "WIN", pnl: 16, pct: 15, strike: 257, strat: "N/A", story: "N/A", grade: "A", playType: "One-Act", range: null, tags: ["Puts"] },
  { day: 22, date: "Jan 13, 2026", direction: "PUTS", result: "WIN", pnl: 55, pct: 56, strike: 259, strat: "N/A", story: "N/A", grade: "A", playType: "One-Act", range: null, tags: ["Puts"] },
  { day: 23, date: "Jan 14, 2026", direction: "PUTS", result: "WIN", pnl: 8, pct: 7, strike: 259, strat: "N/A", story: "N/A", grade: "A", playType: "One-Act", range: null, tags: ["Puts"] },
  { day: 24, date: "Jan 15, 2026", direction: "CALLS", result: "WIN", pnl: 28, pct: 18, strike: 266, strat: "N/A", story: "N/A", grade: "A", playType: "One-Act", range: null, tags: ["Calls"] },
  { day: 25, date: "Jan 16, 2026", direction: "PUTS", result: "LOSS", pnl: -110, pct: -58, strike: 263, strat: "N/A", story: "N/A", grade: "B+", playType: null, range: null, tags: ["Puts"] },
  { day: 26, date: "Jan 20, 2026", direction: "PUTS", result: "LOSS", pnl: -90, pct: -58, strike: 259, strat: "N/A", story: "N/A", grade: "B+", playType: null, range: null, tags: ["Puts"] },
  { day: 27, date: "Jan 21, 2026", direction: "CALLS", result: "WIN", pnl: 36, pct: 38, strike: 267, strat: "N/A", story: "N/A", grade: "A", playType: "One-Act", range: null, tags: ["Calls"] },
  { day: 28, date: "Jan 22, 2026", direction: "CALLS", result: "WIN", pnl: 35, pct: 25, strike: 272, strat: "N/A", story: "N/A", grade: "A", playType: "One-Act", range: null, tags: ["Calls"] },
  { day: 29, date: "Jan 23, 2026", direction: "PUTS", result: "WIN", pnl: 60, pct: 40, strike: 266, strat: "N/A", story: "N/A", grade: "A", playType: "One-Act", range: null, tags: ["Puts"] },
  { day: 30, date: "Jan 26, 2026", direction: "CALLS/PUTS", result: "LOSS", pnl: -151, pct: -60, strike: null, strat: "N/A", story: "N/A", grade: "B+", playType: "Two-Act", range: null, tags: ["Calls","Puts"] },
  { day: 31, date: "Jan 27, 2026", direction: "CALLS", result: "LOSS", pnl: -51, pct: -56, strike: 266, strat: "N/A", story: "N/A", grade: "B+", playType: null, range: null, tags: ["Calls","FOMC"] },
  { day: 32, date: "Jan 28, 2026", direction: "CALLS", result: "LOSS", pnl: -19, pct: -83, strike: 266, strat: "N/A", story: "N/A", grade: "B+", playType: null, range: null, tags: ["Calls","FOMC"] },
  { day: 33, date: "Jan 29, 2026", direction: "CALLS", result: "LOSS", pnl: -48, pct: -75, strike: 266, strat: "N/A", story: "N/A", grade: "B+", playType: null, range: null, tags: ["Calls"] },
  { day: 34, date: "Jan 30, 2026", direction: "CALLS", result: "LOSS", pnl: -42, pct: -82, strike: 264, strat: "N/A", story: "N/A", grade: "B+", playType: null, range: null, tags: ["Calls"] },
  { day: 35, date: "Feb 2, 2026", direction: "CALLS", result: "WIN", pnl: 66, pct: 194, strike: 262, strat: "N/A", story: "N/A", grade: "A+", playType: "One-Act", range: null, tags: ["Calls"] },
  { day: 36, date: "Feb 4, 2026", direction: "CALLS", result: "WIN", pnl: 21, pct: 23, strike: 265, strat: "N/A", story: "N/A", grade: "A", playType: "One-Act", range: null, tags: ["Calls"] },
  { day: 37, date: "Feb 5, 2026", direction: "PUTS", result: "WIN", pnl: 30, pct: 32, strike: 257, strat: "N/A", story: "N/A", grade: "A", playType: "One-Act", range: null, tags: ["Puts"] },
  { day: 38, date: "Feb 6, 2026", direction: "CALLS", result: "WIN", pnl: 8, pct: 6, strike: 264, strat: "N/A", story: "N/A", grade: "A", playType: "One-Act", range: null, tags: ["Calls"] },
  { day: 39, date: "Feb 9, 2026", direction: "CALLS", result: "WIN", pnl: 224, pct: 187, strike: 266, strat: "N/A", story: "N/A", grade: "A+", playType: "One-Act", range: null, tags: ["Calls"] },
  { day: 40, date: "Feb 10, 2026", direction: "PUTS", result: "LOSS", pnl: -108, pct: -33, strike: 265, strat: "N/A", story: "N/A", grade: "B+", playType: null, range: null, tags: ["Puts"] },
  { day: 41, date: "Feb 11, 2026", direction: "CALLS", result: "LOSS", pnl: -195, pct: -81, strike: 271, strat: "N/A", story: "N/A", grade: "B+", playType: null, range: null, tags: ["Calls"] },
  { day: 42, date: "Feb 12, 2026", direction: "CALLS", result: "WIN", pnl: 12, pct: 18, strike: 267, strat: "N/A", story: "N/A", grade: "A", playType: "One-Act", range: null, tags: ["Calls"] },
  { day: 43, date: "Feb 13, 2026", direction: "CALLS", result: "WIN", pnl: 45, pct: 52, strike: 265, strat: "N/A", story: "N/A", grade: "A", playType: "One-Act", range: null, tags: ["Calls"] },
  { day: 44, date: "Feb 17, 2026", direction: "CALLS/PUTS", result: "WIN", pnl: 17, pct: 15, strike: null, strat: "N/A", story: "N/A", grade: "A", playType: "Two-Act", range: null, tags: ["Calls","Puts"] },
  { day: 45, date: "Feb 18, 2026", direction: "CALLS", result: "WIN", pnl: 49, pct: 42, strike: 266, strat: "N/A", story: "N/A", grade: "A", playType: "One-Act", range: null, tags: ["Calls"] },
  { day: 46, date: "Feb 19, 2026", direction: "CALLS", result: "LOSS", pnl: -124, pct: -84, strike: 265, strat: "N/A", story: "N/A", grade: "B+", playType: null, range: null, tags: ["Calls"] },
  { day: 47, date: "Feb 20, 2026", direction: "PUTS", result: "LOSS", pnl: -57, pct: -71, strike: null, strat: "N/A", story: "N/A", grade: "B+", playType: null, range: null, tags: ["Puts"] },
  { day: 48, date: "Feb 23, 2026", direction: "PUTS", result: "WIN", pnl: 66, pct: 236, strike: 259, strat: "N/A", story: "N/A", grade: "A+", playType: "One-Act", range: null, tags: ["Puts"] },
  { day: 49, date: "Feb 24, 2026", direction: "CALLS", result: "WIN", pnl: 90, pct: 94, strike: 263, strat: "N/A", story: "N/A", grade: "A+", playType: "One-Act", range: null, tags: ["Calls"] },
  { day: 50, date: "Feb 25, 2026", direction: "CALLS", result: "LOSS", pnl: -91, pct: -58, strike: 266, strat: "N/A", story: "N/A", grade: "B+", playType: null, range: null, tags: ["Calls"] },
  { day: 51, date: "Feb 26, 2026", direction: "CALLS", result: "WIN", pnl: 124, pct: 207, strike: 267, strat: "N/A", story: "N/A", grade: "A+", playType: "One-Act", range: null, tags: ["Calls"] },
  { day: 52, date: "Feb 27, 2026", direction: "PUTS", result: "LOSS", pnl: -138, pct: -63, strike: 258, strat: "N/A", story: "N/A", grade: "B+", playType: null, range: null, tags: ["Puts"] },
  { day: 53, date: "Mar 3, 2026", direction: "CALLS", result: "LOSS", pnl: -31, pct: -70, strike: 259, strat: "N/A", story: "N/A", grade: "B+", playType: null, range: null, tags: ["Calls"] },
  { day: 54, date: "Mar 10, 2026", direction: "PUTS", result: "LOSS", pnl: -49, pct: -35, strike: 253, strat: "N/A", story: "N/A", grade: "B+", playType: null, range: null, tags: ["Puts"] },
  { day: 55, date: "Mar 13, 2026", direction: "CALLS/PUTS", result: "LOSS", pnl: -50, pct: -30, strike: null, strat: "N/A", story: "N/A", grade: "B+", playType: "Two-Act", range: null, tags: ["Calls","Puts"] },
  { day: 56, date: "Mar 16, 2026", direction: "PUTS", result: "WIN", pnl: 30, pct: 31, strike: 248, strat: "N/A", story: "N/A", grade: "A", playType: "One-Act", range: null, tags: ["Puts"] },
  { day: 57, date: "Mar 23, 2026", direction: "CALLS", result: "WIN", pnl: 24, pct: 13, strike: 250, strat: "N/A", story: "N/A", grade: "A", playType: "One-Act", range: null, tags: ["Calls"] },
  { day: 58, date: "Mar 24, 2026", direction: "CALLS/PUTS", result: "LOSS", pnl: -129, pct: -57, strike: null, strat: "N/A", story: "N/A", grade: "B+", playType: "Two-Act", range: null, tags: ["Calls","Puts"] },
  { day: 59, date: "Mar 26, 2026", direction: "CALLS", result: "LOSS", pnl: -58, pct: -67, strike: 253, strat: "N/A", story: "N/A", grade: "B+", playType: null, range: null, tags: ["Calls"] },
  { day: 60, date: "Mar 30, 2026", direction: "PUTS", result: "WIN", pnl: 129, pct: 179, strike: 241, strat: "N/A", story: "Puts B", grade: "A+", playType: "One-Act", range: null, tags: ["Puts","PutsStoryB"] },
  { day: 61, date: "Apr 2, 2026", direction: "CALLS", result: "WIN", pnl: 12, pct: 15, strike: 252.5, strat: "N/A", story: "Calls A", grade: "A", playType: "One-Act", range: null, tags: ["Calls","CallsStoryA"] },
  { day: 62, date: "Apr 9, 2026", direction: "CALLS", result: "WIN", pnl: 34, pct: 17, strike: 262, strat: "N/A", story: "N/A", grade: "A", playType: "One-Act", range: null, tags: ["Calls"] },
  { day: 63, date: "Apr 14, 2026", direction: "CALLS", result: "WIN", pnl: 45, pct: 20, strike: 269, strat: "N/A", story: "N/A", grade: "A", playType: "One-Act", range: null, tags: ["Calls"] },
  { day: 64, date: "Apr 15, 2026", direction: "CALLS/PUTS", result: "LOSS", pnl: -37, pct: -31, strike: null, strat: "N/A", story: "N/A", grade: "B+", playType: "Two-Act", range: null, tags: ["Calls","Puts"] },
  { day: 65, date: "Apr 16, 2026", direction: "CALLS/PUTS", result: "WIN", pnl: 0, pct: 0, strike: null, strat: "N/A", story: "N/A", grade: "A", playType: "Two-Act", range: null, tags: ["Calls","Puts"] },
  { day: 66, date: "Apr 17, 2026", direction: "CALLS/PUTS", result: "LOSS", pnl: -146, pct: -56, strike: null, strat: "N/A", story: "N/A", grade: "B+", playType: "Two-Act", range: null, tags: ["Calls","Puts"] },
  { day: 67, date: "Apr 20, 2026", direction: "CALLS", result: "WIN", pnl: 44, pct: 31, strike: 277, strat: "N/A", story: "N/A", grade: "A", playType: "One-Act", range: null, tags: ["Calls"] },
  { day: 68, date: "Apr 21, 2026", direction: "PUTS", result: "LOSS", pnl: -72, pct: -40, strike: 275, strat: "2up/2up", story: "Puts A", grade: "A", playType: "One-Act", range: null, tags: ["Puts","PutsStoryA"] },
  { day: 69, date: "Apr 22, 2026", direction: "PUTS", result: "WIN", pnl: 5, pct: 5, strike: 274, strat: "N/A", story: "N/A", grade: "A", playType: "One-Act", range: null, tags: ["Puts"] },
  { day: 70, date: "Apr 23, 2026", direction: "CALLS", result: "LOSS", pnl: -54, pct: -44, strike: 279, strat: "N/A", story: "N/A", grade: "B+", playType: null, range: null, tags: ["Calls"] },
  { day: 71, date: "Apr 24, 2026", direction: "PUTS", result: "LOSS", pnl: -52, pct: -79, strike: 274, strat: "N/A", story: "N/A", grade: "B+", playType: null, range: null, tags: ["Puts"] },
  { day: 72, date: "Apr 27, 2026", direction: "PUTS", result: "WIN", pnl: 24, pct: 21, strike: 274, strat: "N/A", story: "N/A", grade: "A", playType: "One-Act", range: null, tags: ["Puts"] },
  { day: 73, date: "Apr 28, 2026", direction: "CALLS", result: "LOSS", pnl: -82, pct: -68, strike: 277, strat: "N/A", story: "N/A", grade: "B+", playType: null, range: null, tags: ["Calls"] },
  { day: 74, date: "Apr 30, 2026", direction: "PUTS", result: "WIN", pnl: 12, pct: 24, strike: 270, strat: "N/A", story: "N/A", grade: "A", playType: "One-Act", range: null, tags: ["Puts"] },
  { day: 75, date: "May 1, 2026", direction: "CALLS", result: "WIN", pnl: 12, pct: 18, strike: 280, strat: "2up/2up", story: "Calls A", grade: "B+", playType: "Two-Act", range: "Mid", tags: ["Calls","SplitVol"] },
  { day: 76, date: "May 4, 2026", direction: "PUTS", result: "LOSS", pnl: -45, pct: -53, strike: 276, strat: "2dn/2dn", story: "Puts C", grade: "B+", playType: "Two-Act", range: "Mid", tags: ["Puts","SplitVol"] },
  { day: 77, date: "May 5, 2026", direction: "PUTS", result: "LOSS", pnl: -77, pct: -69, strike: 278, strat: "2dn/2dn", story: "Puts C", grade: "B+", playType: "Two-Act", range: "Tight", tags: ["Puts","SplitVol"] },
  { day: 78, date: "May 6, 2026", direction: "CALLS", result: "LOSS", pnl: -40, pct: -57, strike: 288, strat: "2up/2up", story: "N/A", grade: "B+", playType: null, range: "Tight", tags: ["Calls"] },
  { day: 79, date: "May 7, 2026", direction: "CALLS", result: "LOSS", pnl: -45, pct: -60, strike: 288, strat: "2up/2up", story: "Puts A", grade: "A", playType: "One-Act", range: "Tight", tags: ["Calls","Misclassified"] },
  { day: 80, date: "May 8, 2026", direction: "CALLS", result: "LOSS", pnl: -20, pct: -67, strike: 285, strat: "2up/2up", story: "N/A", grade: "B+", playType: null, range: "Tight", tags: ["Calls"] },
  { day: 81, date: "May 11, 2026", direction: "PUTS", result: "LOSS", pnl: -36, pct: -56, strike: 282, strat: "2up/2up", story: "N/A", grade: "B+", playType: null, range: "Tight", tags: ["Puts"] },
  { day: 82, date: "May 12, 2026", direction: "CALLS", result: "LOSS", pnl: -18, pct: -53, strike: 284, strat: "2dn/2dn", story: "Puts C", grade: "B+", playType: null, range: "Mid", tags: ["Calls","Misclassified"] },
  { day: 83, date: "May 13, 2026", direction: "CALLS", result: "WIN", pnl: 1, pct: 6, strike: 283, strat: "2up/2up", story: "N/A", grade: "A", playType: "One-Act", range: "Tight", tags: ["Calls"] },
  { day: 84, date: "May 14, 2026", direction: "PUTS", result: "WIN", pnl: 26, pct: 113, strike: 281, strat: "2dn/2dn", story: "Puts C", grade: "A", playType: "One-Act", range: "Mid", tags: ["Puts","PutsStoryC"] },
  { day: 85, date: "May 15, 2026", direction: "CALLS", result: "LOSS", pnl: -38, pct: -73, strike: 283, strat: "2up/2up", story: "N/A", grade: "B+", playType: null, range: "Mid", tags: ["Calls"] },
  { day: 111, date: "May 19, 2026", direction: "PUTS", result: "WIN", pnl: 10, pct: 12, strike: 270, strat: "2dn/2dn", story: "Puts C", grade: "A+", playType: "One-Act", range: "Wide", tags: ["Puts","PutsStoryC","Capitulation"] },
  { day: 112, date: "May 20, 2026", direction: "PUTS", result: "LOSS", pnl: -93, pct: -70, strike: 271, strat: "2dn/2dn", story: "N/A", grade: "B+", playType: null, range: "Wide", tags: ["Puts","Misclassified"] },
  { day: 113, date: "May 21, 2026", direction: "CALLS", result: "WIN", pnl: 40, pct: 133, strike: 281, strat: "2up/2up", story: "Calls B", grade: "A+", playType: "One-Act", range: "Wide", tags: ["Calls","CallsStoryB"] },
  { day: 114, date: "May 22, 2026", direction: "CALLS", result: "LOSS", pnl: -40, pct: -54, strike: 287, strat: "2up/2up", story: "Calls B", grade: "A", playType: "One-Act", range: "Wide 2.89", tags: ["Calls","ATCeiling","TightWindow"] },
  { day: 115, date: "May 26, 2026", direction: "CALLS", result: "WIN", pnl: 0, pct: 0, strike: null, strat: "2up/2up", story: "Calls B", grade: "B+", playType: "One-Act", range: "Tight 0.98", tags: ["Calls","PMLSweep","ExactLevel"] },
  { day: 116, date: "May 27, 2026", direction: "CALLS", result: "LOSS", pnl: -30, pct: -56, strike: 294, strat: "2up/2up", story: "Calls B", grade: "B+", playType: "One-Act", range: "Mid 1.94", tags: ["Calls","ExtremeVars","SlowPace"] },
  { day: 117, date: "May 28, 2026", direction: "CALLS", result: "LOSS", pnl: -9, pct: -45, strike: 292, strat: "2up/2up", story: "Skip", grade: "Skip", playType: "Two-Act", range: "Mid 1.71", tags: ["Skip","SplitVol","LateEntry"] },
  { day: 118, date: "May 29, 2026", direction: "PUTS", result: "WIN", pnl: 0, pct: 0, strike: 293, strat: "3-/3-", story: "Puts E", grade: "B+", playType: "One-Act", range: "Tight 0.90", tags: ["Puts","Liquidation","NewPattern"] },
];

const C = {
  bg: "#080C12",
  surface: "#0F1520",
  card: "#131B28",
  border: "#1E2D42",
  teal: "#0ECFB0",
  gold: "#F4B942",
  green: "#10E870",
  red: "#FF3B5C",
  blue: "#4A9EFF",
  purple: "#9B6DFF",
  textMain: "#E8EDF5",
  textMuted: "#5A7494",
  textDim: "#2A3D55",
};

// ── HELPERS ──────────────────────────────────────────────────────
const tradedDays = TRADE_DATA.filter(d => d.result !== "SKIP");
const winDays = tradedDays.filter(d => d.result === "WIN");
const totalPnL = TRADE_DATA.reduce((s, d) => s + d.pnl, 0);
const winRate = Math.round((winDays.length / tradedDays.length) * 100);

function Badge({ text, color = C.teal }) {
  return (
    <span style={{
      background: color + "22", color, border: `1px solid ${color}44`,
      borderRadius: 4, padding: "2px 8px", fontSize: 11, fontWeight: 700,
      letterSpacing: "0.05em", whiteSpace: "nowrap"
    }}>{text}</span>
  );
}

function Card({ children, style = {} }) {
  return (
    <div style={{
      background: C.card, border: `1px solid ${C.border}`,
      borderRadius: 12, padding: 20, ...style
    }}>{children}</div>
  );
}

function SectionLabel({ children, color = C.teal }) {
  return (
    <div style={{
      color, fontFamily: "'Space Mono', monospace",
      fontSize: 11, fontWeight: 700, letterSpacing: "0.15em",
      textTransform: "uppercase", marginBottom: 12
    }}>{children}</div>
  );
}

function StatBox({ label, value, sub, color = C.textMain }) {
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ color, fontFamily: "'Space Mono', monospace", fontSize: 28, fontWeight: 700, lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ color: sub.startsWith("+") ? C.green : sub.startsWith("-") ? C.red : C.textMuted, fontSize: 12, marginTop: 4 }}>{sub}</div>}
      <div style={{ color: C.textMuted, fontSize: 11, marginTop: 4, letterSpacing: "0.08em", textTransform: "uppercase" }}>{label}</div>
    </div>
  );
}

// ── CLASSIFICATION ENGINE ────────────────────────────────────────
function classify(v) {
  if (!v.priorClose || !v.open) return null;

  const gap = parseFloat(v.open) - parseFloat(v.priorClose);
  const gapDir = gap > 0.33 ? "Up" : gap < -0.33 ? "Down" : "Flat";
  const gapAmt = Math.abs(gap).toFixed(2);

  // SVP location
  let svpLocation = "Unknown";
  if (v.vah && v.val) {
    if (parseFloat(v.open) > parseFloat(v.vah)) svpLocation = "Above VAH";
    else if (parseFloat(v.open) < parseFloat(v.val)) svpLocation = "Below VAL";
    else svpLocation = "Inside VA";
  }

  // FVG
  let fvgZone = "No FVG";
  if (v.pmh && v.pml && v.priorClose) {
    if (gapDir === "Down") {
      if (parseFloat(v.pmh) > parseFloat(v.priorClose)) {
        fvgZone = `${v.priorClose}–${v.pmh} (above open)`;
      }
    } else if (gapDir === "Up") {
      if (parseFloat(v.pml) < parseFloat(v.priorClose)) {
        fvgZone = `${v.pml}–${v.priorClose} (below open)`;
      }
    }
  }

  // Close% zone
  const cp = parseFloat(v.closePercent);
  const cpZone = cp <= 11 ? "Extreme Low" : cp <= 30 ? "Low" : cp <= 69 ? "Neutral" : cp <= 89 ? "High" : "Extreme High";
  const dp = parseFloat(v.fiveDayPercent);
  const dpZone = dp <= 20 ? "Extreme Low" : dp <= 35 ? "Low" : dp <= 75 ? "Neutral" : dp <= 89 ? "High" : "Extreme High";

  // Position
  let position = "MID";
  if (v.pmh && v.pml) {
    const distCeil = Math.abs(parseFloat(v.pmh) - parseFloat(v.open));
    const distFloor = Math.abs(parseFloat(v.open) - parseFloat(v.pml));
    const closer = distCeil < distFloor ? "ceiling" : "floor";
    const dist = Math.min(distCeil, distFloor);
    position = dist <= 0.20 ? `AT ${closer}` : dist <= 1.50 ? `NEAR ${closer}` : dist <= 3.00 ? "MID" : "FAR";
  }

  // Play type
  let playType = "One-Act";
  let playReason = "";
  if (svpLocation === "Inside VA") {
    playType = "Two-Act"; playReason = "Open inside value — balance trigger";
  } else {
    const extremeHigh = cpZone === "Extreme High" || dpZone === "Extreme High";
    const extremeLow = cpZone === "Extreme Low" || dpZone === "Extreme Low";
    if (extremeHigh && gapDir === "Up" && svpLocation === "Above VAH") playType = "Two-Act", playReason = "Extreme High + gap up above VAH — bull trap risk";
    else if (extremeHigh && gapDir === "Down" && svpLocation === "Below VAL") { playType = "One-Act"; playReason = "Ceiling shattered — liquidation"; }
    else if (extremeLow && gapDir === "Down" && svpLocation === "Below VAL") playType = "Two-Act", playReason = "Extreme Low + gap down — check vol for bear trap vs capitulation";
  }

  // Bias
  let bias = "SKIP";
  const strat = v.strat || "";
  if (strat.includes("2up")) bias = "CALLS";
  else if (strat.includes("2dn")) bias = "PUTS";
  if (cpZone === "Extreme High" && gapDir === "Down" && svpLocation === "Below VAL") bias = "PUTS";
  if (cpZone === "Extreme Low" && gapDir === "Up" && svpLocation === "Above VAH") bias = "CALLS";

  // Pace
  const iwmPace = parseFloat(v.iwmPace) || 0;
  const iwoPace = parseFloat(v.iwoPace) || 0;
  const maxPace = Math.max(iwmPace, iwoPace);
  const paceLabel = maxPace >= 90 ? "Explosive" : maxPace >= 70 ? "Standard" : "Slow";

  // Grade
  let grade = "Skip";
  if (bias !== "SKIP") {
    const vol = v.volChange || "";
    if (paceLabel === "Explosive" && (cpZone.includes("Extreme") || dpZone.includes("Extreme"))) grade = "A+";
    else if (vol.includes("Improved") || vol.includes("Surged")) grade = "A";
    else if (vol.includes("Stayed") || vol.includes("Split")) grade = "B+";
    else grade = "B+";
  }

  // Entry
  const entry = grade === "A+" ? "Early 6:30–6:32" : grade === "A" ? "Standard 6:35–6:45" : grade === "B+" ? "Late 6:50–7:05" : "N/A";

  // Sweep
  let sweep = "Nearest level";
  if (fvgZone !== "No FVG") sweep = `FVG zone: ${fvgZone}`;

  return { gap: `${gapDir} ${gapAmt}`, gapDir, svpLocation, fvgZone, cpZone, dpZone, position, playType, playReason, bias, grade, entry, sweep, paceLabel };
}

// ── MORNING CLASSIFY PAGE ────────────────────────────────────────
function ClassifyPage() {
  const [vars, setVars] = useState({
    priorClose: "", open: "", pmh: "", pml: "", pdh: "", pdl: "",
    vah: "", poc: "", val: "", cvd: "", cvdDir: "Aligned",
    closePercent: "", fiveDayPercent: "", strat: "2up/2up",
    volChange: "Stayed", iwmVol: "", iwoVol: "", iwmPace: "", iwoPace: "",
    macro: "None", uty10: "", hyg: "", ivSkew: "N/A",
    callOI: "", putOI: "",
    fomc: false, cpi: false, geo: false, lowVol: false, wideRange: false,
  });

  const set = (k, val) => setVars(p => ({ ...p, [k]: val }));
  const result = useMemo(() => classify(vars), [vars]);

  const anyFilter = vars.fomc || vars.cpi || vars.geo || vars.lowVol || vars.wideRange;

  const inputStyle = {
    background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8,
    color: C.textMain, padding: "10px 14px", fontSize: 14,
    fontFamily: "'Space Mono', monospace", width: "100%", boxSizing: "border-box",
    outline: "none",
  };

  const selectStyle = { ...inputStyle };

  const labelStyle = { color: C.textMuted, fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6, display: "block" };

  const Row = ({ children }) => <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>{children}</div>;
  const Field = ({ label, k, placeholder = "" }) => (
    <div>
      <label style={labelStyle}>{label}</label>
      <input style={inputStyle} value={vars[k]} placeholder={placeholder}
        onChange={e => set(k, e.target.value)} />
    </div>
  );

  return (
    <div style={{ maxWidth: 680, margin: "0 auto" }}>
      {/* GATE 1 */}
      <Card style={{ borderColor: anyFilter ? C.red : C.border, marginBottom: 16 }}>
        <SectionLabel color={C.red}>⛔ Gate 1 — Hard Filters</SectionLabel>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {[
            ["fomc", "FOMC Week"],
            ["cpi", "CPI / NFP / Core PCE in entry window"],
            ["geo", "Geopolitical active"],
            ["lowVol", "Both vol <60%"],
            ["wideRange", "PM range 4.50+ and both vars neutral"],
          ].map(([k, label]) => (
            <label key={k} style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
              <input type="checkbox" checked={vars[k]} onChange={e => set(k, e.target.checked)}
                style={{ width: 16, height: 16, accentColor: C.red }} />
              <span style={{ color: vars[k] ? C.red : C.textMuted, fontSize: 13 }}>{label}</span>
            </label>
          ))}
        </div>
        {anyFilter && (
          <div style={{ marginTop: 16, padding: "12px 16px", background: C.red + "15", borderRadius: 8, border: `1px solid ${C.red}40` }}>
            <div style={{ color: C.red, fontWeight: 700, fontSize: 14, fontFamily: "'Space Mono', monospace" }}>⛔ HARD STOP — DO NOT TRADE TODAY</div>
          </div>
        )}
      </Card>

      {!anyFilter && (
        <>
          {/* Q1 */}
          <Card style={{ borderColor: C.blue + "60", marginBottom: 16 }}>
            <SectionLabel color={C.blue}>Q1 — What Is Happening?</SectionLabel>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <Row>
                <Field label="Prior Close" k="priorClose" placeholder="292.02" />
                <Field label="Open" k="open" placeholder="291.15" />
              </Row>
              <Row>
                <Field label="PMH" k="pmh" placeholder="292.27" />
                <Field label="PML" k="pml" placeholder="291.37" />
              </Row>
              <Row>
                <Field label="PDH" k="pdh" placeholder="292.74" />
                <Field label="PDL" k="pdl" placeholder="287.98" />
              </Row>
              <Row>
                <Field label="VAH" k="vah" placeholder="291.88" />
                <Field label="POC" k="poc" placeholder="291.70" />
              </Row>
              <Field label="VAL" k="val" placeholder="291.53" />

              {vars.open && vars.priorClose && (
                <div style={{ padding: "12px 16px", background: C.surface, borderRadius: 8, border: `1px solid ${C.blue}30` }}>
                  <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                    <div><span style={{ color: C.textMuted, fontSize: 11 }}>GAP </span><span style={{ color: C.blue, fontFamily: "'Space Mono', monospace", fontWeight: 700 }}>{result?.gap}</span></div>
                    <div><span style={{ color: C.textMuted, fontSize: 11 }}>SVP </span><span style={{ color: C.blue, fontFamily: "'Space Mono', monospace", fontWeight: 700 }}>{result?.svpLocation}</span></div>
                    <div><span style={{ color: C.textMuted, fontSize: 11 }}>FVG </span><span style={{ color: result?.fvgZone === "No FVG" ? C.textMuted : C.gold, fontFamily: "'Space Mono', monospace", fontSize: 12 }}>{result?.fvgZone}</span></div>
                    <div><span style={{ color: C.textMuted, fontSize: 11 }}>POS </span><span style={{ color: C.blue, fontFamily: "'Space Mono', monospace", fontWeight: 700 }}>{result?.position}</span></div>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Q2 */}
          <Card style={{ borderColor: C.gold + "60", marginBottom: 16 }}>
            <SectionLabel color={C.gold}>Q2 — Where Does It Want To Go?</SectionLabel>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <Row>
                <Field label="Close %" k="closePercent" placeholder="84.9" />
                <Field label="5-Day %" k="fiveDayPercent" placeholder="95.5" />
              </Row>
              <div>
                <label style={labelStyle}>The Strat</label>
                <select style={selectStyle} value={vars.strat} onChange={e => set("strat", e.target.value)}>
                  {["2up/2up", "2dn/2dn", "3-", "1-", "1up/1dn", "Other"].map(s => <option key={s}>{s}</option>)}
                </select>
              </div>

              {vars.closePercent && vars.fiveDayPercent && (
                <div style={{ padding: "12px 16px", background: C.surface, borderRadius: 8, border: `1px solid ${C.gold}30` }}>
                  <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 8 }}>
                    <div><span style={{ color: C.textMuted, fontSize: 11 }}>CLOSE% </span><span style={{ color: C.gold, fontFamily: "'Space Mono', monospace", fontWeight: 700 }}>{result?.cpZone}</span></div>
                    <div><span style={{ color: C.textMuted, fontSize: 11 }}>5D% </span><span style={{ color: C.gold, fontFamily: "'Space Mono', monospace", fontWeight: 700 }}>{result?.dpZone}</span></div>
                  </div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <Badge text={result?.playType} color={result?.playType === "One-Act" ? C.green : C.gold} />
                    <span style={{ color: C.textMuted, fontSize: 12 }}>{result?.playReason}</span>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Q3 */}
          <Card style={{ borderColor: C.green + "60", marginBottom: 16 }}>
            <SectionLabel color={C.green}>Q3 — What Does It Need To Get There?</SectionLabel>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <label style={labelStyle}>Vol Change</label>
                <select style={selectStyle} value={vars.volChange} onChange={e => set("volChange", e.target.value)}>
                  {["Improved", "Dropped", "Split", "Stayed", "Both Surged"].map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <Row>
                <Field label="IWM Vol %" k="iwmVol" placeholder="90" />
                <Field label="IWO Vol %" k="iwoVol" placeholder="154" />
              </Row>
              <Row>
                <Field label="IWM Pace %" k="iwmPace" placeholder="75.5" />
                <Field label="IWO Pace %" k="iwoPace" placeholder="68.7" />
              </Row>
              <Row>
                <Field label="CVD" k="cvd" placeholder="+739" />
                <div>
                  <label style={labelStyle}>CVD Direction</label>
                  <select style={selectStyle} value={vars.cvdDir} onChange={e => set("cvdDir", e.target.value)}>
                    {["Aligned", "Diverging", "Neutral"].map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
              </Row>
              <div>
                <label style={labelStyle}>IV Skew (Pineify)</label>
                <select style={selectStyle} value={vars.ivSkew} onChange={e => set("ivSkew", e.target.value)}>
                  {["N/A", "Bullish", "Bearish", "Dual-IV Explosion"].map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <Row>
                <Field label="Call OI Strike" k="callOI" placeholder="293" />
                <Field label="Put OI Strike" k="putOI" placeholder="290" />
              </Row>
              <Row>
                <Field label="UTY10" k="uty10" placeholder="2down" />
                <Field label="HYG" k="hyg" placeholder="3-" />
              </Row>
              <Field label="Macro" k="macro" placeholder="None" />

              {vars.iwmPace && (
                <div style={{ padding: "12px 16px", background: C.surface, borderRadius: 8, border: `1px solid ${C.green}30` }}>
                  <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                    <div><span style={{ color: C.textMuted, fontSize: 11 }}>PACE </span><span style={{ color: result?.paceLabel === "Explosive" ? C.green : result?.paceLabel === "Standard" ? C.blue : C.textMuted, fontFamily: "'Space Mono', monospace", fontWeight: 700 }}>{result?.paceLabel}</span></div>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* OUTPUT */}
          {result && result.bias !== "SKIP" && vars.open && (
            <Card style={{ borderColor: result.bias === "CALLS" ? C.green : result.bias === "PUTS" ? C.red : C.textMuted, background: result.bias === "CALLS" ? C.green + "08" : result.bias === "PUTS" ? C.red + "08" : C.card }}>
              <SectionLabel color={result.bias === "CALLS" ? C.green : result.bias === "PUTS" ? C.red : C.textMuted}>
                ⚡ Output
              </SectionLabel>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
                <div>
                  <div style={{ color: C.textMuted, fontSize: 11, marginBottom: 4 }}>BIAS</div>
                  <div style={{ color: result.bias === "CALLS" ? C.green : result.bias === "PUTS" ? C.red : C.textMuted, fontFamily: "'Space Mono', monospace", fontSize: 24, fontWeight: 700 }}>
                    {result.bias === "CALLS" ? "🟢" : "🔴"} {result.bias}
                  </div>
                </div>
                <div>
                  <div style={{ color: C.textMuted, fontSize: 11, marginBottom: 4 }}>GRADE</div>
                  <div style={{ color: result.grade === "A+" ? C.gold : result.grade === "A" ? C.green : C.blue, fontFamily: "'Space Mono', monospace", fontSize: 24, fontWeight: 700 }}>
                    {result.grade}
                  </div>
                </div>
                <div>
                  <div style={{ color: C.textMuted, fontSize: 11, marginBottom: 4 }}>ENTRY</div>
                  <div style={{ color: C.textMain, fontFamily: "'Space Mono', monospace", fontSize: 13 }}>{result.entry}</div>
                </div>
                <div>
                  <div style={{ color: C.textMuted, fontSize: 11, marginBottom: 4 }}>PLAY TYPE</div>
                  <Badge text={result.playType} color={result.playType === "One-Act" ? C.green : C.gold} />
                </div>
              </div>
              <div>
                <div style={{ color: C.textMuted, fontSize: 11, marginBottom: 4 }}>SWEEP ZONE</div>
                <div style={{ color: C.textMain, fontFamily: "'Space Mono', monospace", fontSize: 13 }}>{result.sweep}</div>
              </div>
            </Card>
          )}

          {result && vars.open && result.bias === "SKIP" && (
            <Card style={{ borderColor: C.textMuted }}>
              <div style={{ color: C.textMuted, fontFamily: "'Space Mono', monospace", fontSize: 18, fontWeight: 700, textAlign: "center" }}>
                ⬜ SKIP — No clean story
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

// ── CALENDAR PAGE ────────────────────────────────────────────────
function CalendarPage() {
  const [selectedDay, setSelectedDay] = useState(null);

  const dayColor = (d) => {
    if (d.result === "SKIP") return C.textDim;
    if (d.result === "WIN") return C.green;
    if (d.result === "LOSS") return C.red;
    return C.textMuted;
  };

  const months = useMemo(() => {
    const m = {};
    TRADE_DATA.forEach(d => {
      const key = d.date.split(" ").slice(0, 2).join(" ");
      const month = d.date.includes("2025") ? d.date.split(" ")[0] + " 2025" : d.date.split(" ")[0] + " 2026";
      if (!m[month]) m[month] = [];
      m[month].push(d);
    });
    return m;
  }, []);

  return (
    <div>
      {Object.entries(months).reverse().map(([month, days]) => (
        <div key={month} style={{ marginBottom: 32 }}>
          <div style={{ color: C.teal, fontFamily: "'Space Mono', monospace", fontSize: 13, fontWeight: 700, letterSpacing: "0.1em", marginBottom: 12 }}>{month.toUpperCase()}</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {days.map(d => (
              <div key={d.day} onClick={() => setSelectedDay(selectedDay?.day === d.day ? null : d)}
                style={{
                  background: C.card, border: `1px solid ${selectedDay?.day === d.day ? dayColor(d) : C.border}`,
                  borderLeft: `3px solid ${dayColor(d)}`, borderRadius: 8,
                  padding: "10px 14px", cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
                }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ color: C.textMuted, fontFamily: "'Space Mono', monospace", fontSize: 11, minWidth: 40 }}>D{d.day}</span>
                  <span style={{ color: C.textMain, fontSize: 13 }}>{d.date}</span>
                  <Badge text={d.story !== "N/A" ? d.story : d.direction} color={dayColor(d)} />
                  {d.grade && d.grade !== "Skip" && <Badge text={d.grade} color={d.grade === "A+" ? C.gold : d.grade === "A" ? C.green : C.blue} />}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  {d.pnl !== 0 && <span style={{ color: d.pnl > 0 ? C.green : C.red, fontFamily: "'Space Mono', monospace", fontSize: 13, fontWeight: 700 }}>{d.pnl > 0 ? "+" : ""}${d.pnl}</span>}
                  {d.pct !== 0 && <span style={{ color: d.pct > 0 ? C.green + "88" : C.red + "88", fontSize: 11 }}>{d.pct > 0 ? "+" : ""}{d.pct}%</span>}
                </div>
              </div>
            ))}
          </div>
          {selectedDay && days.find(d => d.day === selectedDay.day) && (
            <Card style={{ marginTop: 8, borderColor: dayColor(selectedDay) + "60" }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 12 }}>
                <div><span style={{ color: C.textMuted, fontSize: 11 }}>STRAT </span><span style={{ color: C.textMain, fontFamily: "'Space Mono', monospace", fontSize: 12 }}>{selectedDay.strat}</span></div>
                <div><span style={{ color: C.textMuted, fontSize: 11 }}>PLAY </span><span style={{ color: C.textMain, fontFamily: "'Space Mono', monospace", fontSize: 12 }}>{selectedDay.playType || "—"}</span></div>
                <div><span style={{ color: C.textMuted, fontSize: 11 }}>RANGE </span><span style={{ color: C.textMain, fontFamily: "'Space Mono', monospace", fontSize: 12 }}>{selectedDay.range || "—"}</span></div>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {selectedDay.tags.map(t => <Badge key={t} text={`#${t}`} color={C.teal} />)}
              </div>
            </Card>
          )}
        </div>
      ))}
    </div>
  );
}

// ── ANALYTICS PAGE ───────────────────────────────────────────────
function AnalyticsPage() {
  const traded = TRADE_DATA.filter(d => d.result !== "SKIP");
  const wins = traded.filter(d => d.result === "WIN");
  const losses = traded.filter(d => d.result === "LOSS");
  const totalPnL = TRADE_DATA.reduce((s, d) => s + d.pnl, 0);
  const winRate = Math.round((wins.length / traded.length) * 100);

  const byGrade = ["A+", "A", "B+"].map(g => {
    const days = traded.filter(d => d.grade === g);
    const w = days.filter(d => d.result === "WIN");
    return { grade: g, total: days.length, wins: w.length, wr: days.length ? Math.round(w.length / days.length * 100) : 0 };
  });

  const byStory = {};
  traded.forEach(d => {
    const s = d.story || "Unknown";
    if (!byStory[s]) byStory[s] = { wins: 0, total: 0 };
    byStory[s].total++;
    if (d.result === "WIN") byStory[s].wins++;
  });

  const byDirection = { CALLS: { wins: 0, total: 0 }, PUTS: { wins: 0, total: 0 } };
  traded.forEach(d => {
    if (d.direction.includes("CALLS")) { byDirection.CALLS.total++; if (d.result === "WIN") byDirection.CALLS.wins++; }
    if (d.direction.includes("PUTS")) { byDirection.PUTS.total++; if (d.result === "WIN") byDirection.PUTS.wins++; }
  });

  const oneAct = traded.filter(d => d.playType === "One-Act");
  const twoAct = traded.filter(d => d.playType === "Two-Act");
  const oneActWR = oneAct.length ? Math.round(oneAct.filter(d => d.result === "WIN").length / oneAct.length * 100) : 0;
  const twoActWR = twoAct.length ? Math.round(twoAct.filter(d => d.result === "WIN").length / twoAct.length * 100) : 0;

  // Monthly P&L
  const monthly = {};
  TRADE_DATA.forEach(d => {
    const month = d.date.split(" ")[0];
    if (!monthly[month]) monthly[month] = 0;
    monthly[month] += d.pnl;
  });
  const monthlyData = Object.entries(monthly).map(([m, p]) => ({ month: m.slice(0, 3), pnl: p }));

  // Streak
  let streak = 0; let streakType = "";
  for (let i = TRADE_DATA.length - 1; i >= 0; i--) {
    const d = TRADE_DATA[i];
    if (d.result === "SKIP") continue;
    if (streak === 0) { streakType = d.result; streak = 1; }
    else if (d.result === streakType) streak++;
    else break;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Top stats */}
      <Card>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
          <StatBox label="Win Rate" value={`${winRate}%`} color={winRate > 50 ? C.green : C.red} />
          <StatBox label="Total P&L" value={`${totalPnL > 0 ? "+" : ""}$${totalPnL}`} color={totalPnL > 0 ? C.green : C.red} />
          <StatBox label="Trades" value={traded.length} color={C.teal} />
          <StatBox label="Streak" value={`${streak}${streakType === "WIN" ? "W" : "L"}`} color={streakType === "WIN" ? C.green : C.red} />
        </div>
      </Card>

      {/* Monthly P&L chart */}
      <Card>
        <SectionLabel>Monthly P&L</SectionLabel>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={monthlyData} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
            <XAxis dataKey="month" tick={{ fill: C.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: C.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, color: C.textMain }} />
            <Bar dataKey="pnl" radius={4}>
              {monthlyData.map((d, i) => <Cell key={i} fill={d.pnl >= 0 ? C.green : C.red} fillOpacity={0.8} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* Grade breakdown */}
      <Card>
        <SectionLabel>Grade Performance</SectionLabel>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {byGrade.map(g => (
            <div key={g.grade} style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <Badge text={g.grade} color={g.grade === "A+" ? C.gold : g.grade === "A" ? C.green : C.blue} />
              <div style={{ flex: 1, height: 6, background: C.surface, borderRadius: 3, overflow: "hidden" }}>
                <div style={{ width: `${g.wr}%`, height: "100%", background: g.wr > 60 ? C.green : g.wr > 40 ? C.gold : C.red, borderRadius: 3 }} />
              </div>
              <span style={{ color: C.textMain, fontFamily: "'Space Mono', monospace", fontSize: 13, minWidth: 40 }}>{g.wr}%</span>
              <span style={{ color: C.textMuted, fontSize: 12 }}>{g.wins}/{g.total}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* One-Act vs Two-Act */}
      <Card>
        <SectionLabel>Play Type Performance</SectionLabel>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div style={{ textAlign: "center", padding: 16, background: C.surface, borderRadius: 8, border: `1px solid ${C.green}30` }}>
            <div style={{ color: C.green, fontFamily: "'Space Mono', monospace", fontSize: 22, fontWeight: 700 }}>{oneActWR}%</div>
            <div style={{ color: C.textMuted, fontSize: 11, marginTop: 4 }}>ONE-ACT</div>
            <div style={{ color: C.textMuted, fontSize: 11 }}>{oneAct.filter(d => d.result === "WIN").length}/{oneAct.length}</div>
          </div>
          <div style={{ textAlign: "center", padding: 16, background: C.surface, borderRadius: 8, border: `1px solid ${C.gold}30` }}>
            <div style={{ color: C.gold, fontFamily: "'Space Mono', monospace", fontSize: 22, fontWeight: 700 }}>{twoActWR}%</div>
            <div style={{ color: C.textMuted, fontSize: 11, marginTop: 4 }}>TWO-ACT</div>
            <div style={{ color: C.textMuted, fontSize: 11 }}>{twoAct.filter(d => d.result === "WIN").length}/{twoAct.length}</div>
          </div>
        </div>
      </Card>

      {/* Direction */}
      <Card>
        <SectionLabel>Direction Performance</SectionLabel>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          {["CALLS", "PUTS"].map(dir => {
            const d = byDirection[dir];
            const wr = d.total ? Math.round(d.wins / d.total * 100) : 0;
            return (
              <div key={dir} style={{ textAlign: "center", padding: 16, background: C.surface, borderRadius: 8, border: `1px solid ${dir === "CALLS" ? C.green : C.red}30` }}>
                <div style={{ color: dir === "CALLS" ? C.green : C.red, fontFamily: "'Space Mono', monospace", fontSize: 22, fontWeight: 700 }}>{wr}%</div>
                <div style={{ color: C.textMuted, fontSize: 11, marginTop: 4 }}>{dir}</div>
                <div style={{ color: C.textMuted, fontSize: 11 }}>{d.wins}/{d.total}</div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Story breakdown */}
      <Card>
        <SectionLabel>Story Match Performance</SectionLabel>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {Object.entries(byStory).filter(([s]) => s !== "N/A" && s !== "Unknown").map(([story, data]) => {
            const wr = Math.round(data.wins / data.total * 100);
            return (
              <div key={story} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ color: C.textMain, fontSize: 13, minWidth: 120 }}>{story}</span>
                <div style={{ flex: 1, height: 6, background: C.surface, borderRadius: 3, overflow: "hidden" }}>
                  <div style={{ width: `${wr}%`, height: "100%", background: wr > 60 ? C.green : wr > 40 ? C.gold : C.red, borderRadius: 3 }} />
                </div>
                <span style={{ color: C.textMain, fontFamily: "'Space Mono', monospace", fontSize: 13, minWidth: 36 }}>{wr}%</span>
                <span style={{ color: C.textMuted, fontSize: 12 }}>{data.wins}/{data.total}</span>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

// ── TRADE LOG PAGE ───────────────────────────────────────────────
function TradeLogPage() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");

  const filtered = TRADE_DATA.filter(d => {
    const matchFilter = filter === "All" || d.result === filter || d.direction.includes(filter);
    const matchSearch = !search || d.date.toLowerCase().includes(search.toLowerCase()) ||
      d.story.toLowerCase().includes(search.toLowerCase()) ||
      d.tags.some(t => t.toLowerCase().includes(search.toLowerCase()));
    return matchFilter && matchSearch;
  }).reverse();

  return (
    <div>
      <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search by date, story, tag..."
          style={{ flex: 1, minWidth: 180, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, color: C.textMain, padding: "10px 14px", fontSize: 13, fontFamily: "'Space Mono', monospace", outline: "none" }}
        />
        <div style={{ display: "flex", gap: 6 }}>
          {["All", "WIN", "LOSS", "SKIP", "CALLS", "PUTS"].map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{
              background: filter === f ? C.teal + "22" : C.surface,
              border: `1px solid ${filter === f ? C.teal : C.border}`,
              color: filter === f ? C.teal : C.textMuted,
              borderRadius: 6, padding: "8px 12px", fontSize: 12, cursor: "pointer",
              fontFamily: "'Space Mono', monospace"
            }}>{f}</button>
          ))}
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {filtered.map(d => (
          <div key={d.day} style={{
            background: C.card, borderRadius: 8, padding: "12px 16px",
            border: `1px solid ${C.border}`, borderLeft: `3px solid ${d.result === "WIN" ? C.green : d.result === "LOSS" ? C.red : C.textDim}`,
            display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap"
          }}>
            <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
              <span style={{ color: C.textMuted, fontFamily: "'Space Mono', monospace", fontSize: 11 }}>D{d.day}</span>
              <span style={{ color: C.textMain, fontSize: 13 }}>{d.date}</span>
              <Badge text={d.direction} color={d.direction.includes("CALLS") ? C.green : d.direction === "SKIP" ? C.textMuted : C.red} />
              {d.story !== "N/A" && <Badge text={d.story} color={C.teal} />}
              {d.grade && d.grade !== "Skip" && <Badge text={d.grade} color={d.grade === "A+" ? C.gold : d.grade === "A" ? C.green : C.blue} />}
            </div>
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              {d.pnl !== 0 && <span style={{ color: d.pnl > 0 ? C.green : C.red, fontFamily: "'Space Mono', monospace", fontSize: 14, fontWeight: 700 }}>{d.pnl > 0 ? "+" : ""}${d.pnl}</span>}
              {d.pct !== 0 && <span style={{ color: d.pct > 0 ? C.green + "80" : C.red + "80", fontSize: 12 }}>{d.pct > 0 ? "+" : ""}{d.pct}%</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── MORNING BRIEF PAGE ───────────────────────────────────────────
function MorningBriefPage() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <Card style={{ borderColor: C.teal + "40" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <SectionLabel color={C.teal}>⚡ Level Scanner</SectionLabel>
          <Badge text="No bot data yet" color={C.textMuted} />
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>{["Level", "Value", "Tested", "Status", "EQ"].map(h => (
              <th key={h} style={{ color: C.textMuted, fontSize: 11, letterSpacing: "0.1em", textAlign: "left", padding: "8px 0", borderBottom: `1px solid ${C.border}` }}>{h}</th>
            ))}</tr>
          </thead>
          <tbody>
            {["PMH", "PML", "PDH", "PDL", "PDO"].map(l => (
              <tr key={l}>
                <td style={{ color: C.teal, fontFamily: "'Space Mono', monospace", fontSize: 13, padding: "10px 0" }}>{l}</td>
                {["—", "—", "—", "—"].map((v, i) => (
                  <td key={i} style={{ color: C.textDim, fontFamily: "'Space Mono', monospace", fontSize: 13, padding: "10px 0" }}>{v}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Card>
        <SectionLabel color={C.blue}>📡 Auto-Calculated Variables</SectionLabel>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
          {["Gap", "FVG Zone", "Vol Change", "Pace", "Position", "Close %", "5-Day %", "Play Type", "The Strat"].map(v => (
            <div key={v} style={{ background: C.surface, borderRadius: 8, padding: "10px 12px" }}>
              <div style={{ color: C.textMuted, fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 4 }}>{v}</div>
              <div style={{ color: C.textDim, fontFamily: "'Space Mono', monospace", fontSize: 13 }}>—</div>
            </div>
          ))}
        </div>
      </Card>

      <Card style={{ borderColor: C.gold + "40" }}>
        <SectionLabel color={C.gold}>🤖 Bot Draft Classification</SectionLabel>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
          {["BIAS", "GRADE", "ENTRY", "SWEEP"].map(f => (
            <div key={f} style={{ background: C.surface, borderRadius: 8, padding: "12px 14px" }}>
              <div style={{ color: C.textMuted, fontSize: 11, letterSpacing: "0.1em", marginBottom: 6 }}>{f}</div>
              <div style={{ color: C.textDim, fontFamily: "'Space Mono', monospace", fontSize: 16 }}>—</div>
            </div>
          ))}
        </div>
        <div style={{ padding: "12px 14px", background: C.surface, borderRadius: 8, color: C.textMuted, fontSize: 13, fontStyle: "italic" }}>
          Bot coming soon — connect Python script via webhook to populate this section automatically at 6:25 AM
        </div>
      </Card>
    </div>
  );
}

// ── MAIN APP ─────────────────────────────────────────────────────
export default function App() {
  const [page, setPage] = useState("classify");
  const [menuOpen, setMenuOpen] = useState(false);

  const nav = [
    { id: "classify", label: "Classify", icon: "⚡" },
    { id: "brief", label: "Morning Brief", icon: "📡" },
    { id: "calendar", label: "Calendar", icon: "📅" },
    { id: "log", label: "Trade Log", icon: "📋" },
    { id: "analytics", label: "Analytics", icon: "📊" },
  ];

  const traded = TRADE_DATA.filter(d => d.result !== "SKIP");
  const wins = traded.filter(d => d.result === "WIN");
  const wr = Math.round(wins.length / traded.length * 100);
  const pnl = TRADE_DATA.reduce((s, d) => s + d.pnl, 0);

  const pages = { classify: <ClassifyPage />, brief: <MorningBriefPage />, calendar: <CalendarPage />, log: <TradeLogPage />, analytics: <AnalyticsPage /> };

  return (
    <div style={{ background: C.bg, minHeight: "100vh", color: C.textMain, fontFamily: "'DM Sans', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=DM+Sans:wght@400;500;600&display=swap" rel="stylesheet" />

      {/* HEADER */}
      <div style={{
        position: "sticky", top: 0, zIndex: 100,
        background: C.surface + "F0", backdropFilter: "blur(20px)",
        borderBottom: `1px solid ${C.border}`,
        padding: "0 20px", height: 56,
        display: "flex", alignItems: "center", justifyContent: "space-between"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button onClick={() => setMenuOpen(!menuOpen)} style={{ background: "none", border: "none", color: C.teal, cursor: "pointer", fontSize: 20, padding: 4 }}>☰</button>
          <div>
            <span style={{ color: C.teal, fontFamily: "'Space Mono', monospace", fontWeight: 700, fontSize: 15, letterSpacing: "0.05em" }}>STEALTH</span>
            <span style={{ color: C.textMuted, fontFamily: "'Space Mono', monospace", fontSize: 15 }}> SYSTEMS</span>
            <span style={{ color: C.textDim, fontFamily: "'Space Mono', monospace", fontSize: 11, marginLeft: 8 }}>v2.0</span>
          </div>
        </div>
        <div style={{ display: "flex", gap: 16 }}>
          <div style={{ textAlign: "right" }}>
            <div style={{ color: wr > 50 ? C.green : C.red, fontFamily: "'Space Mono', monospace", fontSize: 13, fontWeight: 700 }}>{wr}%</div>
            <div style={{ color: C.textMuted, fontSize: 10 }}>WIN RATE</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ color: pnl > 0 ? C.green : C.red, fontFamily: "'Space Mono', monospace", fontSize: 13, fontWeight: 700 }}>{pnl > 0 ? "+" : ""}${pnl}</div>
            <div style={{ color: C.textMuted, fontSize: 10 }}>TOTAL P&L</div>
          </div>
        </div>
      </div>

      {/* SLIDE MENU */}
      {menuOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 200 }} onClick={() => setMenuOpen(false)}>
          <div style={{
            position: "absolute", left: 0, top: 0, bottom: 0, width: 260,
            background: C.surface, borderRight: `1px solid ${C.border}`,
            padding: 24, display: "flex", flexDirection: "column", gap: 6
          }} onClick={e => e.stopPropagation()}>
            <div style={{ color: C.teal, fontFamily: "'Space Mono', monospace", fontWeight: 700, fontSize: 18, marginBottom: 24 }}>STEALTH SYSTEMS</div>
            {nav.map(n => (
              <button key={n.id} onClick={() => { setPage(n.id); setMenuOpen(false); }} style={{
                background: page === n.id ? C.teal + "15" : "none",
                border: `1px solid ${page === n.id ? C.teal + "40" : "transparent"}`,
                borderRadius: 8, padding: "12px 16px", textAlign: "left",
                color: page === n.id ? C.teal : C.textMuted, fontSize: 14,
                cursor: "pointer", display: "flex", alignItems: "center", gap: 10
              }}>
                <span>{n.icon}</span><span>{n.label}</span>
              </button>
            ))}

            <div style={{ marginTop: "auto", borderTop: `1px solid ${C.border}`, paddingTop: 16 }}>
              <div style={{ color: C.textMuted, fontSize: 11, marginBottom: 8 }}>QUICK STATS</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div style={{ background: C.card, borderRadius: 8, padding: 12 }}>
                  <div style={{ color: wr > 50 ? C.green : C.red, fontFamily: "'Space Mono', monospace", fontSize: 20, fontWeight: 700 }}>{wr}%</div>
                  <div style={{ color: C.textMuted, fontSize: 10 }}>Win Rate</div>
                </div>
                <div style={{ background: C.card, borderRadius: 8, padding: 12 }}>
                  <div style={{ color: C.teal, fontFamily: "'Space Mono', monospace", fontSize: 20, fontWeight: 700 }}>{TRADE_DATA.length}</div>
                  <div style={{ color: C.textMuted, fontSize: 10 }}>Days</div>
                </div>
                <div style={{ background: C.card, borderRadius: 8, padding: 12, gridColumn: "span 2" }}>
                  <div style={{ color: pnl > 0 ? C.green : C.red, fontFamily: "'Space Mono', monospace", fontSize: 20, fontWeight: 700 }}>{pnl > 0 ? "+" : ""}${pnl}</div>
                  <div style={{ color: C.textMuted, fontSize: 10 }}>Total P&L</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* BOTTOM NAV (mobile) */}
      <div style={{
        position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 100,
        background: C.surface + "F5", backdropFilter: "blur(20px)",
        borderTop: `1px solid ${C.border}`,
        display: "flex", justifyContent: "space-around", padding: "8px 0 12px",
      }}>
        {nav.map(n => (
          <button key={n.id} onClick={() => setPage(n.id)} style={{
            background: "none", border: "none", cursor: "pointer",
            display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
            color: page === n.id ? C.teal : C.textMuted, flex: 1
          }}>
            <span style={{ fontSize: 18 }}>{n.icon}</span>
            <span style={{ fontSize: 9, letterSpacing: "0.05em", textTransform: "uppercase", fontFamily: "'Space Mono', monospace" }}>{n.label.split(" ")[0]}</span>
          </button>
        ))}
      </div>

      {/* PAGE CONTENT */}
      <div style={{ padding: "20px 16px 100px", maxWidth: 800, margin: "0 auto" }}>
        <div style={{ marginBottom: 20 }}>
          <div style={{ color: C.textMuted, fontSize: 11, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 4 }}>
            {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
          </div>
          <div style={{ color: C.textMain, fontFamily: "'Space Mono', monospace", fontSize: 20, fontWeight: 700 }}>
            {nav.find(n => n.id === page)?.label}
          </div>
        </div>
        {pages[page]}
      </div>
    </div>
  );
}
