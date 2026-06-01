#!/usr/bin/env python3
"""
STEALTH SIGNALS 2 — MORNING BOT
Runs via GitHub Actions at 4:00 AM PST every weekday
Writes public/morning_brief.json → app reads it at 6:25 AM
"""

import requests
import json
import os
import time
from datetime import datetime, date
import pytz

# ── CONFIG ────────────────────────────────────────────────────────
ALPACA_KEY    = os.environ.get("ALPACA_KEY", "PKY3TSH6BYZJLYE6RJGLQSQYRT")
ALPACA_SECRET = os.environ.get("ALPACA_SECRET", "34dAaLh1DDZ6Qni8c9ZqfBczvvtG12YANmTNV6wFu7vC")
ALPACA_BASE   = "https://data.alpaca.markets"
ALPACA_HEADERS = {
    "APCA-API-KEY-ID": ALPACA_KEY,
    "APCA-API-SECRET-KEY": ALPACA_SECRET,
}
SYMBOL = "IWM"
PST    = pytz.timezone("America/Los_Angeles")
OUTPUT = "public/morning_brief.json"

# ── ALPACA HELPERS ────────────────────────────────────────────────
def get_bars(timeframe="1Min", limit=200):
    url = f"{ALPACA_BASE}/v2/stocks/{SYMBOL}/bars"
    params = {"timeframe": timeframe, "limit": limit, "feed": "iex"}
    r = requests.get(url, headers=ALPACA_HEADERS, params=params)
    if r.status_code == 200:
        return r.json().get("bars", [])
    print(f"Bars error {r.status_code}: {r.text}")
    return []

def get_latest_price():
    url = f"{ALPACA_BASE}/v2/stocks/{SYMBOL}/trades/latest"
    r = requests.get(url, headers=ALPACA_HEADERS)
    if r.status_code == 200:
        return r.json().get("trade", {}).get("p")
    return None

# ── LEVEL SCANNER ─────────────────────────────────────────────────
class LevelScanner:
    def __init__(self):
        self.pmh = None
        self.pml = None
        self.pdh = None
        self.pdl = None
        self.pdo = None
        self.prior_close = None
        self.current_price = None
        self.open_price = None
        self.equal_highs = []
        self.equal_lows  = []
        self.levels = {
            "PMH": {"value": None, "tests": 0, "status": "—", "eq": False},
            "PML": {"value": None, "tests": 0, "status": "—", "eq": False},
            "PDH": {"value": None, "tests": 0, "status": "—", "eq": False},
            "PDL": {"value": None, "tests": 0, "status": "—", "eq": False},
            "PDO": {"value": None, "tests": 0, "status": "—", "eq": False},
        }

    def load_daily(self, bars):
        if len(bars) >= 2:
            prev = bars[-2]
            self.pdh         = round(prev["h"], 2)
            self.pdl         = round(prev["l"], 2)
            self.pdo         = round(prev["o"], 2)
            self.prior_close = round(prev["c"], 2)
            self.levels["PDH"]["value"] = self.pdh
            self.levels["PDL"]["value"] = self.pdl
            self.levels["PDO"]["value"] = self.pdo
            print(f"PDH={self.pdh} PDL={self.pdl} PDO={self.pdo} Close={self.prior_close}")

    def update(self, bars):
        if not bars: return
        self.pmh = round(max(b["h"] for b in bars), 2)
        self.pml = round(min(b["l"] for b in bars), 2)
        self.current_price = round(bars[-1]["c"], 2)
        if not self.open_price:
            self.open_price = round(bars[0]["o"], 2)
        self.levels["PMH"]["value"] = self.pmh
        self.levels["PML"]["value"] = self.pml

        # Count tests per level
        for bar in bars:
            for name, ldata in self.levels.items():
                val = ldata["value"]
                if val is None: continue
                touched = abs(bar["h"] - val) <= 0.15 or abs(bar["l"] - val) <= 0.15
                if touched:
                    ldata["tests"] += 1
                    broke = ((name in ["PMH","PDH","PDO"] and bar["c"] > val + 0.05) or
                             (name in ["PML","PDL"] and bar["c"] < val - 0.05))
                    ldata["status"] = "Broke" if broke else "Held"

        # Detect equal highs/lows within 0.05
        highs = [round(b["h"], 2) for b in bars]
        lows  = [round(b["l"], 2) for b in bars]
        eq_h, eq_l = set(), set()
        for i in range(len(highs)):
            for j in range(i+1, len(highs)):
                if abs(highs[i] - highs[j]) <= 0.05:
                    eq_h.add(round((highs[i]+highs[j])/2, 2))
        for i in range(len(lows)):
            for j in range(i+1, len(lows)):
                if abs(lows[i] - lows[j]) <= 0.05:
                    eq_l.add(round((lows[i]+lows[j])/2, 2))
        self.equal_highs = list(eq_h)[:3]
        self.equal_lows  = list(eq_l)[:3]
        self.levels["PMH"]["eq"] = len(self.equal_highs) > 0
        self.levels["PML"]["eq"] = len(self.equal_lows)  > 0

# ── VARIABLE CALCULATOR ───────────────────────────────────────────
def calc_variables(s):
    if not s.prior_close or not s.pmh:
        return {}

    open_p = s.open_price or s.current_price or s.prior_close
    gap    = round(open_p - s.prior_close, 2)
    gdir   = "Up" if gap > 0.33 else "Down" if gap < -0.33 else "Flat"
    gap_str = f"{gdir} {'+' if gap >= 0 else ''}{gap}"

    fvg = "No FVG"
    if gdir == "Down" and s.pmh > s.prior_close:
        fvg = f"{s.prior_close}–{s.pmh} (above open)"
    elif gdir == "Up" and s.pml and s.pml < s.prior_close:
        fvg = f"{s.pml}–{s.prior_close} (below open)"

    pm_range = round(s.pmh - s.pml, 2) if s.pml else 0
    rtype = "Tight" if pm_range < 1.50 else "Wide" if pm_range > 3.00 else "Mid"

    dist_ceil  = round(abs(s.pmh - open_p), 2)
    dist_floor = round(abs(open_p - s.pml), 2) if s.pml else 99
    closer = "ceiling" if dist_ceil < dist_floor else "floor"
    dist   = min(dist_ceil, dist_floor)
    if dist <= 0.20:   position = f"AT {closer} ({dist} away)"
    elif dist <= 1.50: position = f"NEAR {closer} ({dist} away)"
    else:              position = f"MID (ceil {dist_ceil}, floor {dist_floor})"

    sweep_warn = []
    if s.equal_highs: sweep_warn.append(f"Equal highs {s.equal_highs} → likely PMH sweep")
    if s.equal_lows:  sweep_warn.append(f"Equal lows {s.equal_lows} → likely PML sweep")

    level_out = {}
    for name, d in s.levels.items():
        level_out[name] = {
            "value":  d["value"],
            "tested": d["tests"],
            "status": d["status"] if d["tests"] > 0 else "—",
            "eq":     "⚠️ EQ" if d["eq"] else "—"
        }

    return {
        "timestamp":    datetime.now(PST).strftime("%I:%M %p PST"),
        "date":         date.today().isoformat(),
        "symbol":       SYMBOL,
        "current_price": s.current_price,
        "prior_close":  s.prior_close,
        "open":         open_p,
        "pmh":          s.pmh,
        "pml":          s.pml,
        "pdh":          s.pdh,
        "pdl":          s.pdl,
        "pdo":          s.pdo,
        "gap":          gap_str,
        "fvg_zone":     fvg,
        "pm_range":     f"{rtype} {pm_range}",
        "position":     position,
        "sweep_warning": " | ".join(sweep_warn) if sweep_warn else "None detected",
        "equal_highs":  s.equal_highs,
        "equal_lows":   s.equal_lows,
        "level_scanner": level_out,
    }

# ── DRAFT CLASSIFICATION ──────────────────────────────────────────
def draft_classify(v):
    """Partial classification — bias needs SVP/vol entered manually."""
    gdir = v.get("gap","Flat").split()[0]
    fvg  = v.get("fvg_zone","No FVG")
    sweep = f"FVG: {fvg}" if fvg != "No FVG" else "Nearest level"

    tight_range = "Tight" in v.get("pm_range","")
    tight_note  = "⚠️ Tight range — expect double sweep PMH+PML before entry" if tight_range else ""

    return {
        "bias":       "⚠️ Enter SVP + Vol in Classify tab",
        "grade":      "⚠️ Enter Vol + Pace in Classify tab",
        "entry":      "⚠️ Grade needed first",
        "sweep":      sweep,
        "play_type":  "⚠️ Enter SVP in Classify tab",
        "gap_read":   f"Gap {gdir} — {'buyers showed up overnight' if gdir == 'Up' else 'sellers showed up overnight' if gdir == 'Down' else 'no overnight conviction'}",
        "tight_note": tight_note,
        "note":       "Enter SVP + Vol + Pace in Classify tab to complete classification",
    }

# ── MONITOR LOOP ──────────────────────────────────────────────────
def monitor(scanner, until_hour=6, until_minute=20):
    """Poll every 5 minutes until 6:20 AM PST."""
    print(f"\n📡 Monitoring premarket until 6:20 AM PST...")
    while True:
        now = datetime.now(PST)
        if now.hour > until_hour or (now.hour == until_hour and now.minute >= until_minute):
            print(f"\n🔔 {now.strftime('%I:%M %p')} — collecting final data...")
            break
        bars = get_bars("1Min", 200)
        if bars:
            scanner.update(bars)
            print(f"  [{now.strftime('%I:%M')}] PMH={scanner.pmh} PML={scanner.pml} "
                  f"Price={scanner.current_price} "
                  f"EQ↑={len(scanner.equal_highs)} EQ↓={len(scanner.equal_lows)}")
        time.sleep(300)  # 5 min

# ── MAIN ──────────────────────────────────────────────────────────
def main():
    now = datetime.now(PST)
    print("="*60)
    print("🚀 STEALTH SIGNALS MORNING BOT")
    print(f"📅 {now.strftime('%A, %B %d %Y — %I:%M %p PST')}")
    print("="*60)

    # Skip weekends
    if date.today().weekday() >= 5:
        print("📅 Weekend — market closed. Exiting.")
        return

    scanner = LevelScanner()

    # 1. Load prior day
    print("\n📥 Loading prior day data...")
    daily = get_bars("1Day", 5)
    if daily:
        scanner.load_daily(daily)
    else:
        print("⚠️  Could not fetch daily bars")

    # 2. Determine if we're running live (before 6:20) or final pass
    if now.hour < 6 or (now.hour == 6 and now.minute < 20):
        monitor(scanner)
    else:
        print("  Running final data collection...")

    # 3. Final data pull
    bars = get_bars("1Min", 200)
    if bars:
        scanner.update(bars)
    price = get_latest_price()
    if price:
        scanner.current_price = round(price, 2)

    # 4. Calculate variables
    variables = calc_variables(scanner)
    draft     = draft_classify(variables)

    output = {
        "generated_at": datetime.now(PST).strftime("%I:%M %p PST"),
        "date":         date.today().isoformat(),
        "variables":    variables,
        "draft":        draft,
    }

    # 5. Write to public/morning_brief.json
    os.makedirs("public", exist_ok=True)
    with open(OUTPUT, "w") as f:
        json.dump(output, f, indent=2)
    print(f"\n✅ Written to {OUTPUT}")

    # 6. Print summary
    v = variables
    d = draft
    print("\n" + "="*60)
    print("📊 LEVEL SCANNER")
    for name, info in v.get("level_scanner", {}).items():
        print(f"  {name}: {info['value']} | {info['tested']}x tested | {info['status']} | {info['eq']}")
    print(f"\n⚡ VARIABLES")
    print(f"  Gap:       {v.get('gap')}")
    print(f"  Open:      {v.get('open')}")
    print(f"  FVG:       {v.get('fvg_zone')}")
    print(f"  PM Range:  {v.get('pm_range')}")
    print(f"  Position:  {v.get('position')}")
    if v.get('sweep_warning') != "None detected":
        print(f"  ⚠️  SWEEP: {v.get('sweep_warning')}")
    print(f"\n🤖 DRAFT")
    print(f"  {d.get('gap_read')}")
    print(f"  Sweep:     {d.get('sweep')}")
    if d.get('tight_note'):
        print(f"  {d.get('tight_note')}")
    print(f"  → {d.get('note')}")
    print("="*60)
    print("\n✅ Bot complete. Morning brief ready in app.")

if __name__ == "__main__":
    main()
