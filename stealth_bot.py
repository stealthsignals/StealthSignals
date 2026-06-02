#!/usr/bin/env python3
"""
STEALTH SIGNALS 2 — MORNING BOT
Runs via GitHub Actions at 1:00 AM PST every weekday
Monitors IWM premarket from 1:00 AM — 6:25 AM PST
PMH/PML tracked from premarket open (1am) not just 4am
Writes public/morning_brief.json → app reads it anytime
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
SYMBOL  = "IWM"
PST     = pytz.timezone("America/Los_Angeles")
OUTPUT  = "public/morning_brief.json"

# ── ALPACA HELPERS ────────────────────────────────────────────────
def get_bars(timeframe="1Min", limit=500):
    """Get recent IWM bars. Limit 500 covers 1am-6:25am at 1min resolution."""
    url = f"{ALPACA_BASE}/v2/stocks/{SYMBOL}/bars"
    params = {"timeframe": timeframe, "limit": limit, "feed": "iex"}
    r = requests.get(url, headers=ALPACA_HEADERS, params=params)
    if r.status_code == 200:
        return r.json().get("bars", [])
    print(f"Bars error {r.status_code}: {r.text[:200]}")
    return []

def get_latest_price():
    url = f"{ALPACA_BASE}/v2/stocks/{SYMBOL}/trades/latest"
    r = requests.get(url, headers=ALPACA_HEADERS)
    if r.status_code == 200:
        return r.json().get("trade", {}).get("p")
    return None

def filter_premarket_bars(bars):
    """
    Filter bars to only include premarket hours 1:00 AM - 6:30 AM PST.
    This ensures PMH/PML are calculated from premarket open, not regular hours.
    """
    pm_bars = []
    for bar in bars:
        try:
            # Parse bar timestamp
            ts = bar.get("t", "")
            if not ts:
                continue
            # Convert to PST
            dt = datetime.fromisoformat(ts.replace("Z", "+00:00"))
            dt_pst = dt.astimezone(PST)
            h, m = dt_pst.hour, dt_pst.minute
            # Premarket: 1:00 AM to 6:29 AM PST
            if (h >= 1 and h < 6) or (h == 6 and m < 30):
                pm_bars.append(bar)
        except Exception:
            continue
    return pm_bars

# ── LEVEL SCANNER ─────────────────────────────────────────────────
class LevelScanner:
    def __init__(self):
        self.pmh = None   # premarket high — tracks from 1am
        self.pml = None   # premarket low — tracks from 1am
        self.pdh = None
        self.pdl = None
        self.pdo = None
        self.prior_close = None
        self.current_price = None
        self.open_price = None
        self.equal_highs = []
        self.equal_lows  = []
        self.bar_count   = 0
        self.snapshot_history = []  # timeline of updates

        self.levels = {
            "PMH": {"value": None, "tests": 0, "status": "—", "eq": False},
            "PML": {"value": None, "tests": 0, "status": "—", "eq": False},
            "PDH": {"value": None, "tests": 0, "status": "—", "eq": False},
            "PDL": {"value": None, "tests": 0, "status": "—", "eq": False},
            "PDO": {"value": None, "tests": 0, "status": "—", "eq": False},
        }

    def load_daily(self, bars):
        """Load prior day data from daily bars."""
        if len(bars) >= 2:
            prev = bars[-2]
            self.pdh         = round(prev["h"], 2)
            self.pdl         = round(prev["l"], 2)
            self.pdo         = round(prev["o"], 2)
            self.prior_close = round(prev["c"], 2)
            self.levels["PDH"]["value"] = self.pdh
            self.levels["PDL"]["value"] = self.pdl
            self.levels["PDO"]["value"] = self.pdo
            print(f"Prior day: PDH={self.pdh} PDL={self.pdl} PDO={self.pdo} Close={self.prior_close}")

    def update(self, bars):
        """Update PMH/PML from premarket bars. Uses ALL bars from 1am onward."""
        pm_bars = filter_premarket_bars(bars)
        if not pm_bars:
            print(f"  No premarket bars found (total bars: {len(bars)})")
            # Fall back to all bars if no premarket filter match
            pm_bars = bars

        if not pm_bars:
            return

        self.pmh = round(max(b["h"] for b in pm_bars), 2)
        self.pml = round(min(b["l"] for b in pm_bars), 2)
        self.current_price = round(pm_bars[-1]["c"], 2)
        self.bar_count = len(pm_bars)

        if not self.open_price and pm_bars:
            self.open_price = round(pm_bars[0]["o"], 2)

        self.levels["PMH"]["value"] = self.pmh
        self.levels["PML"]["value"] = self.pml

        # Count level tests
        for bar in pm_bars:
            for name, ldata in self.levels.items():
                val = ldata["value"]
                if val is None:
                    continue
                touched = abs(bar["h"] - val) <= 0.15 or abs(bar["l"] - val) <= 0.15
                if touched:
                    ldata["tests"] += 1
                    broke = ((name in ["PMH","PDH","PDO"] and bar["c"] > val + 0.05) or
                             (name in ["PML","PDL"] and bar["c"] < val - 0.05))
                    ldata["status"] = "Broke" if broke else "Held"

        # Equal highs/lows detection
        highs = [round(b["h"], 2) for b in pm_bars]
        lows  = [round(b["l"], 2) for b in pm_bars]
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

    def snapshot(self, label):
        """Save a timestamped snapshot for the timeline."""
        snap = {
            "time": label,
            "pmh": self.pmh,
            "pml": self.pml,
            "price": self.current_price,
            "pm_range": round(self.pmh - self.pml, 2) if self.pmh and self.pml else None,
            "eq_highs": len(self.equal_highs),
            "eq_lows": len(self.equal_lows),
            "bar_count": self.bar_count,
        }
        self.snapshot_history.append(snap)
        print(f"  [{label}] PMH={self.pmh} PML={self.pml} Price={self.current_price} Range={snap['pm_range']}")
        return snap

# ── VARIABLE CALCULATOR ───────────────────────────────────────────
def calc_variables(s):
    if not s.prior_close or not s.pmh:
        return {}

    open_p = s.open_price or s.current_price or s.prior_close
    gap    = round(open_p - s.prior_close, 2)
    gdir   = "Up" if gap > 0.33 else "Down" if gap < -0.33 else "Flat"
    gap_str = f"{gdir} {'+' if gap >= 0 else ''}{gap}"

    # FVG calculation
    fvg = "No FVG"
    if gdir == "Down" and s.pmh and s.pmh > s.prior_close:
        fvg = f"{s.prior_close}–{s.pmh} (above open)"
    elif gdir == "Up" and s.pml and s.pml < s.prior_close:
        fvg = f"{s.pml}–{s.prior_close} (below open)"

    pm_range = round(s.pmh - s.pml, 2) if s.pml else 0
    rtype = "Tight" if pm_range < 1.50 else "Wide" if pm_range > 3.00 else "Mid"

    dist_ceil  = round(abs(s.pmh - open_p), 2)
    dist_floor = round(abs(open_p - s.pml), 2) if s.pml else 99
    closer = "PMH" if dist_ceil < dist_floor else "PML"
    dist   = min(dist_ceil, dist_floor)

    if dist <= 0.20:   position = f"AT {closer} ({dist} away)"
    elif dist <= 1.50: position = f"NEAR {closer} ({dist} away)"
    else:              position = f"MID (PMH {dist_ceil} away, PML {dist_floor} away)"

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
        "timestamp":     datetime.now(PST).strftime("%I:%M %p PST"),
        "date":          date.today().isoformat(),
        "symbol":        SYMBOL,
        "current_price": s.current_price,
        "prior_close":   s.prior_close,
        "open":          open_p,
        "pmh":           s.pmh,
        "pml":           s.pml,
        "pdh":           s.pdh,
        "pdl":           s.pdl,
        "pdo":           s.pdo,
        "gap":           gap_str,
        "closer_to":     closer,
        "fvg_zone":      fvg,
        "pm_range":      f"{rtype} {pm_range}",
        "position":      position,
        "premarket_bars": s.bar_count,
        "sweep_warning": " | ".join(sweep_warn) if sweep_warn else "None detected",
        "equal_highs":   s.equal_highs,
        "equal_lows":    s.equal_lows,
        "level_scanner": level_out,
    }

def draft_classify(v):
    gdir   = v.get("gap","Flat").split()[0]
    closer = v.get("closer_to","")
    fvg    = v.get("fvg_zone","No FVG")
    sweep  = f"FVG: {fvg}" if fvg != "No FVG" else f"Nearest level: {v.get('pml') if closer == 'PML' else v.get('pmh')}"
    tight  = "Tight" in v.get("pm_range","")

    # Base bias from gap + location
    if gdir == "Up" and closer == "PMH":   base = "CALLS (continuation)"
    elif gdir == "Down" and closer == "PML": base = "PUTS (continuation)"
    elif gdir == "Up" and closer == "PML":  base = "CALLS (reversal candidate — needs confirmation)"
    elif gdir == "Down" and closer == "PMH":base = "PUTS (reversal candidate — needs confirmation)"
    else: base = "SKIP — Flat gap, discovery"

    gap_read = (f"Gap {gdir} — {'buyers' if gdir == 'Up' else 'sellers'} showed up overnight"
                if gdir != "Flat" else "Flat gap — no overnight conviction")

    tight_note = "⚠️ Tight range — expect double sweep PMH+PML before entry" if tight else ""

    return {
        "base_bias":   base,
        "gap_read":    gap_read,
        "sweep":       sweep,
        "tight_note":  tight_note,
        "note":        "Enter VAH/POC/VAL + Vol + Close% + 5D% in app for full classification",
    }

# ── SNAPSHOT LOOP ─────────────────────────────────────────────────
def run_snapshot_loop(scanner):
    """
    Run from 1:00 AM to 6:25 AM PST.
    Update the JSON file every 5 minutes so app always shows fresh data on refresh.
    Take named snapshots at 6:00, 6:10, 6:20, 6:25.
    """
    snapshot_times = {(6,0):"6:00 AM", (6,10):"6:10 AM", (6,20):"6:20 AM", (6,25):"6:25 AM"}
    snapshots_taken = set()

    print(f"\n📡 Monitoring premarket from 1:00 AM to 6:25 AM PST...")
    print(f"   PMH/PML tracking from premarket open (1am)\n")

    while True:
        now = datetime.now(PST)
        h, m = now.hour, now.minute

        # Stop at 6:25 AM
        if h > 6 or (h == 6 and m >= 25):
            print(f"\n🔔 {now.strftime('%I:%M %p')} — Final data collection...")
            break

        # Fetch latest bars
        bars = get_bars("1Min", 500)
        if bars:
            scanner.update(bars)

        # Take named snapshots
        key = (h, m - (m % 10)) if m >= 10 else (h, 0)
        if (h, m) in snapshot_times and (h, m) not in snapshots_taken:
            scanner.snapshot(snapshot_times[(h, m)])
            snapshots_taken.add((h, m))

        # Write update every 5 minutes
        if m % 5 == 0:
            variables = calc_variables(scanner)
            draft = draft_classify(variables)
            write_output(scanner, variables, draft)
            print(f"  [{now.strftime('%I:%M')}] PMH={scanner.pmh} PML={scanner.pml} "
                  f"Price={scanner.current_price} Bars={scanner.bar_count}")

        time.sleep(60)  # check every minute

def write_output(scanner, variables, draft):
    """Write current state to public/morning_brief.json"""
    output = {
        "generated_at":    datetime.now(PST).strftime("%I:%M %p PST"),
        "date":            date.today().isoformat(),
        "premarket_start": "1:00 AM PST",
        "variables":       variables,
        "draft":           draft,
        "snapshots":       scanner.snapshot_history,
    }
    os.makedirs("public", exist_ok=True)
    with open(OUTPUT, "w") as f:
        json.dump(output, f, indent=2)

# ── MAIN ──────────────────────────────────────────────────────────
def main():
    now = datetime.now(PST)
    print("="*60)
    print("🚀 STEALTH SIGNALS MORNING BOT")
    print(f"📅 {now.strftime('%A, %B %d %Y — %I:%M %p PST')}")
    print(f"📡 Tracking PMH/PML from 1:00 AM PST (premarket open)")
    print("="*60)

    if date.today().weekday() >= 5:
        print("📅 Weekend — market closed. Exiting.")
        return

    scanner = LevelScanner()

    # Load prior day data
    print("\n📥 Loading prior day data...")
    daily = get_bars("1Day", 5)
    if daily:
        scanner.load_daily(daily)
    else:
        print("⚠️  Could not fetch daily bars")

    # Determine if we should run the loop or just do final pass
    now = datetime.now(PST)
    h, m = now.hour, now.minute

    if h < 6 or (h == 6 and m < 25):
        # Run full monitoring loop
        run_snapshot_loop(scanner)
    else:
        print("  Running final data collection pass...")

    # Final data pull
    print("\n📊 Collecting final premarket data...")
    bars = get_bars("1Min", 500)
    if bars:
        scanner.update(bars)
        scanner.snapshot("6:25 AM Final")

    price = get_latest_price()
    if price:
        scanner.current_price = round(price, 2)

    variables = calc_variables(scanner)
    draft     = draft_classify(variables)
    write_output(scanner, variables, draft)

    # Print summary
    v = variables
    d = draft
    print(f"\n✅ Written to {OUTPUT}")
    print("\n" + "="*60)
    print(f"📊 LEVEL SCANNER (tracked from 1:00 AM PST)")
    for name, info in v.get("level_scanner", {}).items():
        print(f"  {name}: {info['value']} | {info['tested']}x tested | {info['status']} | {info['eq']}")
    print(f"\n⚡ VARIABLES")
    print(f"  Gap:         {v.get('gap')}")
    print(f"  Closer to:   {v.get('closer_to')}")
    print(f"  Open:        {v.get('open')}")
    print(f"  FVG:         {v.get('fvg_zone')}")
    print(f"  PM Range:    {v.get('pm_range')}")
    print(f"  Position:    {v.get('position')}")
    print(f"  Bars tracked:{v.get('premarket_bars')} (1am-6:25am)")
    if v.get('sweep_warning') != "None detected":
        print(f"  ⚠️  SWEEP: {v.get('sweep_warning')}")
    print(f"\n🤖 BASE BIAS (Gap + Location)")
    print(f"  {d.get('base_bias')}")
    print(f"  {d.get('gap_read')}")
    print(f"  Sweep: {d.get('sweep')}")
    if d.get('tight_note'):
        print(f"  {d.get('tight_note')}")
    print(f"\n  → {d.get('note')}")
    print("="*60)

    if scanner.snapshot_history:
        print(f"\n📈 PREMARKET TIMELINE:")
        for snap in scanner.snapshot_history:
            print(f"  {snap['time']}: PMH={snap['pmh']} PML={snap['pml']} Price={snap['price']} Range={snap['pm_range']}")

    print("\n✅ Bot complete. Morning brief ready in app.")

if __name__ == "__main__":
    main()
