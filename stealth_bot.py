#!/usr/bin/env python3
"""
STEALTH SIGNALS — MORNING BOT v3
Polygon (Massive) for all price data — matches TradingView exactly
FlashAlpha for GEX levels
Runs via GitHub Actions: 1AM PST (6AM + 2PM PST schedule)
"""

import requests
import json
import os
import time
import math
from datetime import datetime, date, timedelta
import pytz

# ── CONFIG ────────────────────────────────────────────────────────
POLYGON_KEY    = os.environ.get("POLYGON_KEY", "")
FLASHALPHA_KEY = os.environ.get("FLASHALPHA_KEY", "")
SYMBOL         = "IWM"
PST            = pytz.timezone("America/Los_Angeles")
OUTPUT         = "public/morning_brief.json"

try:
    import yfinance as yf
    YFINANCE_AVAILABLE = True
except ImportError:
    YFINANCE_AVAILABLE = False

# ── POLYGON HELPERS ───────────────────────────────────────────────
POLYGON_BASE = "https://api.polygon.io"

def polygon_get(endpoint, params={}):
    params["apiKey"] = POLYGON_KEY
    url = f"{POLYGON_BASE}{endpoint}"
    try:
        r = requests.get(url, params=params, timeout=15)
        if r.status_code == 200:
            return r.json()
        print(f"Polygon error {r.status_code}: {endpoint}")
        return None
    except Exception as e:
        print(f"Polygon exception: {e}")
        return None

def get_daily_bars(symbol=SYMBOL, days=15):
    """Get last N daily bars from Polygon — matches TradingView exactly."""
    end = date.today().isoformat()
    start = (date.today() - timedelta(days=days*2)).isoformat()
    data = polygon_get(
        f"/v2/aggs/ticker/{symbol}/range/1/day/{start}/{end}",
        {"adjusted": "true", "sort": "asc", "limit": days}
    )
    if data and data.get("results"):
        bars = data["results"]
        print(f"  Daily bars: {len(bars)} (Polygon)")
        return bars
    print("  Daily bars: none returned")
    return []

def get_premarket_bars(symbol=SYMBOL):
    """
    Get 1-minute bars from 1AM to 6:30AM PST = 9AM to 2:30PM UTC.
    Polygon returns premarket bars in this window.
    """
    today_str = date.today().isoformat()
    # 1AM PST = 9AM UTC, 6:30AM PST = 2:30PM UTC
    start_ms = int(datetime.strptime(f"{today_str}T09:00:00Z", "%Y-%m-%dT%H:%M:%SZ").timestamp() * 1000)
    end_ms   = int(datetime.strptime(f"{today_str}T14:30:00Z", "%Y-%m-%dT%H:%M:%SZ").timestamp() * 1000)
    
    data = polygon_get(
        f"/v2/aggs/ticker/{symbol}/range/1/minute/{today_str}/{today_str}",
        {"adjusted": "true", "sort": "asc", "limit": 500}
    )
    
    if not data or not data.get("results"):
        print("  Premarket bars: none returned")
        return []
    
    # Filter to 1AM-6:30AM PST window
    all_bars = data["results"]
    pm_bars = [b for b in all_bars if start_ms <= b["t"] <= end_ms]
    print(f"  Premarket bars: {len(pm_bars)} (1AM-6:30AM PST)")
    return pm_bars

# ── DAILY LEVEL CALCULATIONS ──────────────────────────────────────
def calc_structural_levels(daily_bars):
    """
    Calculate PDH/PDL/PDO, 5DH/5DL, PWH/PWL from Polygon daily bars.
    Matches TradingView exactly.
    """
    result = {
        "pdh": None, "pdl": None, "pdo": None, "prior_close": None,
        "five_dh": None, "five_dl": None,
        "pwh": None, "pwl": None
    }
    
    if not daily_bars or len(daily_bars) < 2:
        return result
    
    now_pst = datetime.now(PST)
    today = now_pst.date()
    
    # Convert timestamps to dates
    def bar_date(bar):
        ts = bar["t"] / 1000
        return datetime.utcfromtimestamp(ts).date()
    
    # Filter out today's bar if present
    completed = [b for b in daily_bars if bar_date(b) < today]
    if not completed:
        completed = daily_bars[:-1] if len(daily_bars) > 1 else daily_bars
    
    # Prior day = most recent completed bar
    if completed:
        prev = completed[-1]
        result["pdh"]         = round(prev["h"], 2)
        result["pdl"]         = round(prev["l"], 2)
        result["pdo"]         = round(prev["o"], 2)
        result["prior_close"] = round(prev["c"], 2)
    
    # 5D High/Low = highest high / lowest low of last 5 completed days
    last_5 = completed[-5:] if len(completed) >= 5 else completed
    if last_5:
        result["five_dh"] = round(max(b["h"] for b in last_5), 2)
        result["five_dl"] = round(min(b["l"] for b in last_5), 2)
    
    # Prior week = last completed Mon-Fri week
    pw_bars = []
    for bar in completed:
        d = bar_date(bar)
        days_ago = (today - d).days
        dow = d.weekday()
        if 5 <= days_ago <= 11 and dow <= 4:
            pw_bars.append(bar)
    
    if not pw_bars:
        # Fallback: bars 6-10 positions back
        pw_bars = completed[-10:-5] if len(completed) >= 10 else []
    
    if pw_bars:
        result["pwh"] = round(max(b["h"] for b in pw_bars), 2)
        result["pwl"] = round(min(b["l"] for b in pw_bars), 2)
    
    return result

# ── LEVEL SCANNER ─────────────────────────────────────────────────
class LevelScanner:
    def __init__(self):
        self.levels = {}  # name -> {value, tested, status, eq}
        self.pmh = None
        self.pml = None
        self.open_price = None
        self.current_price = None
        self.equal_highs = []
        self.equal_lows = []
        self.bar_count = 0

    def set_structural_levels(self, struct):
        """Load PDH/PDL/PDO/5DH/5DL/PWH/PWL from structural calc."""
        for name, val in [
            ("PDH", struct["pdh"]),
            ("PDL", struct["pdl"]),
            ("PDO", struct["pdo"]),
            ("5DH", struct["five_dh"]),
            ("5DL", struct["five_dl"]),
            ("PWH", struct["pwh"]),
            ("PWL", struct["pwl"]),
        ]:
            if val:
                self.levels[name] = {"value": val, "tested": 0, "status": "—", "eq": False}

    def scan_premarket(self, bars):
        """Scan premarket bars to find PMH/PML and test all levels."""
        if not bars:
            return
        
        self.bar_count = len(bars)
        
        # PMH/PML from premarket bars
        self.pmh = round(max(b["h"] for b in bars), 2)
        self.pml = round(min(b["l"] for b in bars), 2)
        self.open_price = round(bars[0]["o"], 2)
        self.current_price = round(bars[-1]["c"], 2)
        
        # Add PMH/PML to levels
        self.levels["PMH"] = {"value": self.pmh, "tested": 0, "status": "—", "eq": False}
        self.levels["PML"] = {"value": self.pml, "tested": 0, "status": "—", "eq": False}
        
        # Test ALL levels against premarket bars
        for bar in bars:
            for name, ldata in self.levels.items():
                val = ldata["value"]
                if not val:
                    continue
                # Touched = price came within 0.15 of level
                touched = (bar["l"] <= val + 0.15 and bar["h"] >= val - 0.15)
                if touched:
                    ldata["tested"] += 1
                    # Status: Broke = closed beyond level
                    if name in ["PMH", "PDH", "5DH", "PWH", "PDO"]:
                        if bar["c"] > val + 0.05:
                            ldata["status"] = "Broke"
                        elif ldata["status"] == "—":
                            ldata["status"] = "Held"
                    else:  # PML, PDL, 5DL, PWL
                        if bar["c"] < val - 0.05:
                            ldata["status"] = "Broke"
                        elif ldata["status"] == "—":
                            ldata["status"] = "Held"
        
        # Equal highs/lows detection
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
        
        self.equal_highs = sorted(list(eq_h))[:3]
        self.equal_lows  = sorted(list(eq_l))[:3]
        
        # Mark EQ on PMH/PML
        if self.equal_highs:
            self.levels["PMH"]["eq"] = True
        if self.equal_lows:
            self.levels["PML"]["eq"] = True
        
        print(f"  PMH={self.pmh} PML={self.pml} bars={self.bar_count}")
        for name, d in self.levels.items():
            if d["tested"] > 0:
                print(f"    {name} {d['value']} ×{d['tested']} {d['status']}")

# ── CLIFF EDGE ────────────────────────────────────────────────────
def calc_cliff_edge(five_dh, five_dl, pwh, pwl):
    result = {"puts_cliff": False, "calls_cliff": False, "flag": "No cliff edge"}
    
    if five_dl and pwl:
        diff = round(abs(five_dl - pwl), 2)
        if diff <= 0.10:
            result["puts_cliff"] = True
            result["flag"] = f"⚡⚡ PUTS CLIFF EDGE — 5DL {five_dl} = PWL {pwl} (diff {diff})"
    
    if five_dh and pwh:
        diff = round(abs(five_dh - pwh), 2)
        if diff <= 0.10:
            result["calls_cliff"] = True
            flag = f"⚡ CALLS CLIFF EDGE — 5DH {five_dh} = PWH {pwh} (diff {diff})"
            result["flag"] = flag if result["flag"] == "No cliff edge" else result["flag"] + " | " + flag
    
    return result

# ── OPEN AIR CALCULATOR ───────────────────────────────────────────
def calc_open_air(open_price, scanner, struct):
    if not open_price:
        return {}
    
    all_levels = {}
    for name, d in scanner.levels.items():
        if d["value"]:
            all_levels[name] = d["value"]
    
    above = sorted([(n,v) for n,v in all_levels.items() if v > open_price], key=lambda x: x[1])
    below = sorted([(n,v) for n,v in all_levels.items() if v < open_price], key=lambda x: x[1], reverse=True)
    
    def gaps(levels, start):
        result = []
        prev = start
        for name, val in levels:
            gap = round(abs(val - prev), 2)
            result.append({"from": round(prev,2), "to_level": name, "to_price": val, "gap": gap})
            prev = val
        return result
    
    gaps_above = gaps(above, open_price)
    gaps_below = gaps(below, open_price)
    max_above  = max((g["gap"] for g in gaps_above), default=0)
    max_below  = max((g["gap"] for g in gaps_below), default=0)
    
    def tier(gap):
        if gap >= 3.00: return "WIDE OPEN ⚡ (3.00+)"
        if gap >= 1.50: return "MODERATE (1.50-2.99)"
        if gap >= 0.50: return "TIGHT (0.50-1.49)"
        return "STACKED (<0.50)"
    
    return {
        "levels_above": above,
        "levels_below": below,
        "gaps_above": gaps_above,
        "gaps_below": gaps_below,
        "max_gap_above": max_above,
        "max_gap_below": max_below,
        "runway_calls": tier(max_above),
        "runway_puts":  tier(max_below),
    }

# ── FVG CALCULATOR ────────────────────────────────────────────────
def calc_fvg(open_price, prior_close, pmh, pml):
    if not all([open_price, prior_close, pmh, pml]):
        return "No FVG"
    gap = open_price - prior_close
    if gap > 0.33 and pml and prior_close:
        if pml < prior_close:
            return f"{pml}–{prior_close} (below open)"
    elif gap < -0.33 and pmh and prior_close:
        if pmh > prior_close:
            return f"{prior_close}–{pmh} (above open)"
    return "No FVG"

# ── GEX LEVELS (FlashAlpha first, yfinance fallback) ─────────────
def get_gex_levels(symbol=SYMBOL):
    result = {
        "flip_level": None, "regime": None,
        "call_walls": [], "king_nodes": [],
        "magnet": None, "source": None, "error": None
    }
    
    if FLASHALPHA_KEY:
        try:
            headers = {"X-Api-Key": FLASHALPHA_KEY, "Accept": "application/json"}
            
            for endpoint in [
                f"https://lab.flashalpha.com/v1/gex/levels/{symbol}",
                f"https://lab.flashalpha.com/v1/exposure/levels/{symbol}",
                f"https://lab.flashalpha.com/v1/levels/{symbol}",
            ]:
                r = requests.get(endpoint, headers=headers, timeout=15)
                print(f"  FlashAlpha {endpoint.split('/')[-2]}: {r.status_code}")
                if r.status_code == 200:
                    fa = r.json()
                    lvls = fa.get("levels") or fa.get("data") or fa
                    for field in ["gamma_flip","flip","zero_gamma","volatility_trigger"]:
                        val = lvls.get(field) or fa.get(field)
                        if val:
                            result["flip_level"] = round(float(val), 2)
                            break
                    for field in ["call_wall","callwall"]:
                        val = lvls.get(field) or fa.get(field)
                        if val:
                            result["call_walls"] = [{"strike": round(float(val),2), "gex": 0}]
                            break
                    for field in ["put_wall","putwall","mp","magnet_price"]:
                        val = lvls.get(field) or fa.get(field)
                        if val:
                            result["king_nodes"] = [{"strike": round(float(val),2), "gex": 0}]
                            result["magnet"] = {"strike": round(float(val),2), "gex": 0}
                            break
                    cushion = lvls.get("dealer_cushion") or fa.get("dealer_cushion")
                    if cushion:
                        try:
                            cv = float(str(cushion).replace("$","").replace("B","").replace(",","").replace("+",""))
                            result["regime"] = "NEGATIVE" if cv < 0 else "POSITIVE"
                        except: pass
                    result["source"] = "FlashAlpha"
                    if result["flip_level"]:
                        print(f"  GEX: FlashAlpha OK flip={result['flip_level']}")
                        return result
                    break
            
            # Try per-strike GEX
            today_str = date.today().isoformat()
            gex_url = f"https://lab.flashalpha.com/v1/exposure/gex/{symbol}"
            for params in [{}, {"expiration": today_str}]:
                r = requests.get(gex_url, headers=headers, params=params, timeout=15)
                if r.status_code == 200:
                    data = r.json()
                    flip = data.get("gamma_flip")
                    if flip:
                        result["flip_level"] = round(float(flip), 2)
                        result["source"] = "FlashAlpha"
                        strikes = data.get("strikes", [])
                        pos = sorted([(s.get("strike"),s.get("net_gex",0)) for s in strikes if (s.get("net_gex") or 0)>0], key=lambda x:x[1], reverse=True)
                        neg = sorted([(s.get("strike"),s.get("net_gex",0)) for s in strikes if (s.get("net_gex") or 0)<0], key=lambda x:abs(x[1]), reverse=True)
                        result["call_walls"] = [{"strike":round(s,2),"gex":round(g/1e6,1)} for s,g in pos[:3] if s]
                        result["king_nodes"] = [{"strike":round(s,2),"gex":round(g/1e6,1)} for s,g in neg[:3] if s]
                        if neg:
                            result["magnet"] = {"strike":round(neg[0][0],2),"gex":round(neg[0][1]/1e6,1)}
                        print(f"  GEX: FlashAlpha per-strike OK flip={result['flip_level']}")
                        return result
                    break
        except Exception as e:
            print(f"  FlashAlpha exception: {e}")
    
    # Fallback: yfinance
    if YFINANCE_AVAILABLE:
        try:
            ticker = yf.Ticker(symbol)
            spot = ticker.fast_info.last_price
            if not spot:
                hist = ticker.history(period="1d")
                spot = float(hist["Close"].iloc[-1]) if not hist.empty else None
            
            if spot:
                expiries = ticker.options
                if expiries:
                    near = [e for e in expiries if (datetime.strptime(e,"%Y-%m-%d").date()-date.today()).days<=30]
                    if not near: near = expiries[:3]
                    
                    gex_map = {}
                    for exp in near[:3]:
                        try:
                            chain = ticker.option_chain(exp)
                            T = max((datetime.strptime(exp,"%Y-%m-%d").date()-date.today()).days/365.0, 1/365.0)
                            r_rate = 0.05
                            for df, sign in [(chain.calls, 1), (chain.puts, -1)]:
                                for _, row in df.iterrows():
                                    K = row.get("strike",0)
                                    oi = row.get("openInterest",0) or 0
                                    iv = row.get("impliedVolatility",0) or 0
                                    if K<=0 or oi<=0 or iv<=0: continue
                                    if not (spot*0.80 <= K <= spot*1.20): continue
                                    try:
                                        d1 = (math.log(spot/K)+(r_rate+0.5*iv**2)*T)/(iv*math.sqrt(T))
                                        gamma = math.exp(-d1**2/2)/(spot*iv*math.sqrt(2*math.pi*T))
                                        gex = gamma*oi*100*spot*sign
                                        gex_map[K] = gex_map.get(K,0)+gex
                                    except: continue
                        except: continue
                    
                    if gex_map:
                        strikes = sorted([k for k in gex_map if spot*0.92<=k<=spot*1.08])
                        flip = None
                        prev_g = prev_s = None
                        for s in strikes:
                            g = gex_map[s]
                            if prev_g is not None and ((prev_g>0 and g<=0) or (prev_g<0 and g>=0)):
                                flip = round((prev_s+s)/2, 2)
                                break
                            prev_g, prev_s = g, s
                        if not flip and strikes:
                            flip = round(min(((k,v) for k,v in gex_map.items() if k in strikes), key=lambda x:abs(x[1]))[0], 2)
                        
                        if flip and spot*0.90<=flip<=spot*1.10:
                            pos = sorted([(k,v) for k,v in gex_map.items() if v>0], key=lambda x:x[1], reverse=True)
                            neg = sorted([(k,v) for k,v in gex_map.items() if v<0], key=lambda x:abs(x[1]), reverse=True)
                            result["flip_level"] = flip
                            result["regime"] = "NEGATIVE" if spot<flip else "POSITIVE"
                            result["call_walls"] = [{"strike":round(s,2),"gex":round(g/1e6,1)} for s,g in pos[:3]]
                            result["king_nodes"] = [{"strike":round(s,2),"gex":round(g/1e6,1)} for s,g in neg[:3]]
                            if neg: result["magnet"] = {"strike":round(neg[0][0],2),"gex":round(neg[0][1]/1e6,1)}
                            result["source"] = "yfinance"
                            print(f"  GEX: yfinance fallback flip={flip}")
                            return result
        except Exception as e:
            print(f"  yfinance GEX error: {e}")
    
    result["error"] = "GEX unavailable"
    return result

# ── BUILD OUTPUT ──────────────────────────────────────────────────
def build_output(scanner, struct, cliff, open_air, fvg, gex):
    open_p = scanner.open_price or scanner.current_price
    prior_close = struct.get("prior_close")
    
    gap_amt = round(open_p - prior_close, 2) if open_p and prior_close else None
    gap_dir = "Up" if gap_amt and gap_amt > 0.33 else "Down" if gap_amt and gap_amt < -0.33 else "Flat"
    gap_str = f"{gap_dir} {'+' if gap_amt and gap_amt >= 0 else ''}{gap_amt}" if gap_amt else "Unknown"
    
    pm_range = round(scanner.pmh - scanner.pml, 2) if scanner.pmh and scanner.pml else 0
    rtype = "Wide" if pm_range > 3.00 else "Tight" if pm_range < 1.50 else "Mid"
    
    dist_pmh = round(abs(scanner.pmh - open_p), 2) if scanner.pmh else 99
    dist_pml = round(abs(open_p - scanner.pml), 2) if scanner.pml else 99
    closer = "PMH" if dist_pmh < dist_pml else "PML"
    dist = min(dist_pmh, dist_pml)
    position = (f"AT {closer} ({dist} away)" if dist <= 0.20
                else f"NEAR {closer} ({dist} away)" if dist <= 1.50
                else f"MID (PMH {dist_pmh}, PML {dist_pml})")
    
    sweep_warn = []
    if scanner.equal_highs: sweep_warn.append(f"Equal highs {scanner.equal_highs} → PMH sweep likely")
    if scanner.equal_lows:  sweep_warn.append(f"Equal lows {scanner.equal_lows} → PML sweep likely")
    
    level_out = {}
    for name in ["PMH","PML","PDH","PDL","PDO","5DH","5DL","PWH","PWL"]:
        d = scanner.levels.get(name, {"value": None, "tested": 0, "status": "—", "eq": False})
        level_out[name] = {
            "value":  d["value"],
            "tested": d["tested"],
            "status": d["status"] if d["tested"] > 0 else "—",
            "eq":     "⚠️ EQ" if d.get("eq") else "—",
        }
    
    return {
        "generated_at":   datetime.now(PST).strftime("%I:%M %p PST"),
        "date":           date.today().isoformat(),
        "symbol":         SYMBOL,
        "source":         "Polygon (Massive)",
        "current_price":  scanner.current_price,
        "prior_close":    prior_close,
        "open":           open_p,
        "gap":            gap_str,
        "gap_amount":     gap_amt,
        "position":       position,
        "pm_range":       f"{rtype} {pm_range}",
        "fvg_zone":       fvg,
        "premarket_bars": scanner.bar_count,
        "sweep_warning":  " | ".join(sweep_warn) if sweep_warn else "None detected",
        "equal_highs":    scanner.equal_highs,
        "equal_lows":     scanner.equal_lows,
        "five_dh":        struct.get("five_dh"),
        "five_dl":        struct.get("five_dl"),
        "pwh":            struct.get("pwh"),
        "pwl":            struct.get("pwl"),
        "level_scanner":  level_out,
        "cliff_edge":     cliff,
        "open_air":       {
            "levels_above":  open_air.get("levels_above", []),
            "levels_below":  open_air.get("levels_below", []),
            "max_gap_above": open_air.get("max_gap_above"),
            "max_gap_below": open_air.get("max_gap_below"),
            "runway_calls":  open_air.get("runway_calls"),
            "runway_puts":   open_air.get("runway_puts"),
        },
        "gex": {
            "flip_level":  gex.get("flip_level"),
            "regime":      gex.get("regime"),
            "call_walls":  gex.get("call_walls", []),
            "king_nodes":  gex.get("king_nodes", []),
            "magnet":      gex.get("magnet"),
            "source":      gex.get("source"),
            "error":       gex.get("error"),
        },
    }

def write_output(data):
    os.makedirs("public", exist_ok=True)
    with open(OUTPUT, "w") as f:
        json.dump(data, f, indent=2)
    print(f"\n✅ Written to {OUTPUT}")

def print_summary(data):
    print("\n" + "="*60)
    print("📊 STEALTH SIGNALS MORNING BRIEF v3")
    print(f"   Source: {data.get('source')}")
    print("="*60)
    print(f"  Gap:      {data.get('gap')}")
    print(f"  Open:     {data.get('open')}")
    print(f"  Position: {data.get('position')}")
    print(f"  Range:    {data.get('pm_range')}")
    print(f"  FVG:      {data.get('fvg_zone')}")
    print(f"\n📡 LEVEL SCANNER:")
    for name, d in data.get("level_scanner", {}).items():
        if d["value"]:
            tested = f"×{d['tested']}" if d["tested"] > 0 else "—"
            eq = " ⚠️EQ" if d["eq"] != "—" else ""
            print(f"  {name:5} {d['value']:7} {tested:4} {d['status']:6}{eq}")
    cliff = data.get("cliff_edge", {})
    if cliff.get("puts_cliff") or cliff.get("calls_cliff"):
        print(f"\n⚡ CLIFF: {cliff.get('flag')}")
    oa = data.get("open_air", {})
    print(f"\n🔭 RUNWAY:")
    print(f"  Calls: {oa.get('runway_calls')} (max gap {oa.get('max_gap_above')})")
    print(f"  Puts:  {oa.get('runway_puts')} (max gap {oa.get('max_gap_below')})")
    gex = data.get("gex", {})
    if gex.get("flip_level"):
        print(f"\n📊 GEX (source: {gex.get('source')}):")
        print(f"  Flip: {gex['flip_level']} | Regime: {gex.get('regime')}")
        if gex.get("call_walls"):
            print(f"  Call walls: {[(w['strike'],w['gex']) for w in gex['call_walls']]}")
        if gex.get("king_nodes"):
            print(f"  👑 King nodes: {[(n['strike'],n['gex']) for n in gex['king_nodes']]}")
    elif gex.get("error"):
        print(f"\n📊 GEX: {gex['error']}")

# ── MAIN ──────────────────────────────────────────────────────────
def main():
    now = datetime.now(PST)
    print("="*60)
    print("🚀 STEALTH SIGNALS MORNING BOT v3")
    print(f"📅 {now.strftime('%A, %B %d %Y — %I:%M %p PST')}")
    print(f"   Data: Polygon (Massive) | GEX: FlashAlpha")
    print("="*60)
    
    if date.today().weekday() >= 5:
        print("📅 Weekend — market closed.")
        return
    
    if not POLYGON_KEY:
        print("❌ POLYGON_KEY not set in GitHub secrets")
        return
    
    # ── Daily bars from Polygon ───────────────────────────────────
    print("\n📥 Loading daily bars (Polygon)...")
    daily_bars = get_daily_bars(days=15)
    struct = calc_structural_levels(daily_bars)
    print(f"  PDH={struct['pdh']} PDL={struct['pdl']} Close={struct['prior_close']}")
    print(f"  5DH={struct['five_dh']} 5DL={struct['five_dl']}")
    print(f"  PWH={struct['pwh']} PWL={struct['pwl']}")
    
    # ── GEX levels ────────────────────────────────────────────────
    print("\n📊 Fetching GEX levels...")
    gex = get_gex_levels(SYMBOL)
    
    # ── Premarket scan ────────────────────────────────────────────
    print("\n📡 Scanning premarket levels (1AM-6:30AM PST)...")
    pm_bars = get_premarket_bars(SYMBOL)
    
    scanner = LevelScanner()
    scanner.set_structural_levels(struct)
    
    if pm_bars:
        scanner.scan_premarket(pm_bars)
    else:
        print("  No premarket bars — market may be closed or bot ran outside window")
        if daily_bars:
            prev = daily_bars[-1] if daily_bars else {}
            scanner.pmh = struct["pdh"]
            scanner.pml = struct["pdl"]
            scanner.open_price = struct.get("pdo")
            scanner.current_price = struct.get("prior_close")
    
    # ── Calculations ──────────────────────────────────────────────
    open_p = scanner.open_price or scanner.current_price
    
    cliff    = calc_cliff_edge(struct["five_dh"], struct["five_dl"], struct["pwh"], struct["pwl"])
    open_air = calc_open_air(open_p, scanner, struct)
    fvg      = calc_fvg(open_p, struct["prior_close"], scanner.pmh, scanner.pml)
    
    # ── Build and write ───────────────────────────────────────────
    data = build_output(scanner, struct, cliff, open_air, fvg, gex)
    write_output(data)
    print_summary(data)

if __name__ == "__main__":
    main()
