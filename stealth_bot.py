#!/usr/bin/env python3
"""
STEALTH SIGNALS — MORNING BOT v2
Runs via GitHub Actions at 1:00 AM PST every weekday
Outputs: pattern matches, cliff edge, open air, level scanner, GEX nodes
"""

import requests
import json
import os
import time
from datetime import datetime, date, timedelta
import pytz

# ── CONFIG ────────────────────────────────────────────────────────
ALPACA_KEY     = os.environ.get("ALPACA_KEY", "PKY3TSH6BYZJLYE6RJGLQSQYRT")
ALPACA_SECRET  = os.environ.get("ALPACA_SECRET", "34dAaLh1DDZ6Qni8c9ZqfBczvvtG12YANmTNV6wFu7vC")
ALPACA_BASE    = "https://data.alpaca.markets"
ALPACA_HEADERS = {
    "APCA-API-KEY-ID": ALPACA_KEY,
    "APCA-API-SECRET-KEY": ALPACA_SECRET,
}
FLASHALPHA_KEY = os.environ.get("FLASHALPHA_KEY", "")  # Add to GitHub secrets
SYMBOL         = "IWM"
PST            = pytz.timezone("America/Los_Angeles")
OUTPUT         = "public/morning_brief.json"

# ── ALPACA HELPERS ────────────────────────────────────────────────
def get_bars(timeframe="1Min", limit=500, start=None, end=None):
    url = f"{ALPACA_BASE}/v2/stocks/{SYMBOL}/bars"
    params = {"timeframe": timeframe, "limit": limit, "feed": "iex"}
    if start:
        params["start"] = start
    if end:
        params["end"] = end
    try:
        r = requests.get(url, headers=ALPACA_HEADERS, params=params, timeout=15)
        if r.status_code == 200:
            return r.json().get("bars", []) or []
        print(f"Bars error {r.status_code}: {r.text[:200]}")
        return []
    except Exception as e:
        print(f"Bars exception: {e}")
        return []

def get_daily_bars(limit=15):
    """Get daily bars with explicit date range to ensure we get recent data."""
    # Go back 30 calendar days to ensure we get enough trading days
    end_date = date.today().isoformat()
    start_date = (date.today() - timedelta(days=30)).isoformat()
    url = f"{ALPACA_BASE}/v2/stocks/{SYMBOL}/bars"
    params = {
        "timeframe": "1Day",
        "start": f"{start_date}T00:00:00Z",
        "end": f"{end_date}T23:59:59Z",
        "limit": limit,
        "feed": "iex"
    }
    try:
        r = requests.get(url, headers=ALPACA_HEADERS, params=params, timeout=15)
        if r.status_code == 200:
            bars = r.json().get("bars", []) or []
            print(f"  Daily bars fetched: {len(bars)}")
            return bars
        print(f"Daily bars error {r.status_code}: {r.text[:200]}")
        return []
    except Exception as e:
        print(f"Daily bars exception: {e}")
        return []

def get_today_bars():
    """Get today's 1-minute bars using a wider time window."""
    today_str = date.today().isoformat()
    # Wide window: 1AM PST (9AM UTC) to 3PM PST (11PM UTC)
    # Covers both premarket and regular hours
    start = f"{today_str}T09:00:00Z"
    end = f"{today_str}T23:00:00Z"
    url = f"{ALPACA_BASE}/v2/stocks/{SYMBOL}/bars"
    params = {
        "timeframe": "1Min",
        "start": start,
        "end": end,
        "limit": 500,
        "feed": "iex"
    }
    try:
        r = requests.get(url, headers=ALPACA_HEADERS, params=params, timeout=15)
        if r.status_code == 200:
            bars = r.json().get("bars", []) or []
            print(f"  Today bars fetched: {len(bars)}")
            return bars
        print(f"Today bars error {r.status_code}: {r.text[:200]}")
        return []
    except Exception as e:
        print(f"Today bars exception: {e}")
        return []

def get_latest_price():
    url = f"{ALPACA_BASE}/v2/stocks/{SYMBOL}/trades/latest"
    r = requests.get(url, headers=ALPACA_HEADERS)
    if r.status_code == 200:
        return r.json().get("trade", {}).get("p")
    return None

def filter_premarket_bars(bars):
    """Filter bars to premarket hours 1AM-6:30AM PST.
    If no premarket bars found (e.g. bot ran post-market),
    fall back to using today's bars up to 6:30AM or all available bars."""
    pm_bars = []
    today = date.today()
    for bar in bars:
        try:
            ts = bar.get("t", "")
            if not ts:
                continue
            dt = datetime.fromisoformat(ts.replace("Z", "+00:00"))
            dt_pst = dt.astimezone(PST)
            h, m = dt_pst.hour, dt_pst.minute
            bar_date = dt_pst.date()
            # Only today's bars
            if bar_date != today:
                continue
            # Premarket: 1AM to 6:30AM
            if (h >= 1 and h < 6) or (h == 6 and m < 30):
                pm_bars.append(bar)
        except Exception:
            continue
    
    # If no premarket bars found, try getting today's bars up to 9:30AM
    # This handles the case where bot runs after market open
    if not pm_bars:
        for bar in bars:
            try:
                ts = bar.get("t", "")
                if not ts:
                    continue
                dt = datetime.fromisoformat(ts.replace("Z", "+00:00"))
                dt_pst = dt.astimezone(PST)
                bar_date = dt_pst.date()
                if bar_date == today:
                    pm_bars.append(bar)
            except Exception:
                continue
    
    return pm_bars

# ── 5D HIGH/LOW + PWH/PWL ─────────────────────────────────────────
def calc_5d_and_pw_levels(daily_bars):
    """
    Calculate 5D High/Low and Prior Week High/Low from daily bars.
    Returns dict with five_dh, five_dl, pwh, pwl
    """
    result = {"five_dh": None, "five_dl": None, "pwh": None, "pwl": None}

    if not daily_bars or len(daily_bars) < 2:
        return result

    # Use last 6 bars — prior day + 5 days before that
    # daily_bars[-1] = today (possibly partial), daily_bars[-2] = yesterday
    # 5D High/Low = highest high / lowest low of last 5 completed days
    completed = daily_bars[:-1] if len(daily_bars) >= 2 else daily_bars
    last_5 = completed[-5:] if len(completed) >= 5 else completed

    if last_5:
        result["five_dh"] = round(max(b["h"] for b in last_5), 2)
        result["five_dl"] = round(min(b["l"] for b in last_5), 2)

    # Prior Week High/Low — find bars from last completed Monday-Friday
    # Get current day of week
    now_pst = datetime.now(PST)
    today_dow = now_pst.weekday()  # 0=Mon, 4=Fri, 5=Sat, 6=Sun

    # Find last week's bars by looking at timestamps
    pw_bars = []
    for bar in completed:
        try:
            ts = bar.get("t", "")
            dt = datetime.fromisoformat(ts.replace("Z", "+00:00")).astimezone(PST)
            bar_dow = dt.weekday()
            # Calculate days ago
            days_ago = (now_pst.date() - dt.date()).days
            # Prior week = 5-11 days ago for Mon-Fri
            if 5 <= days_ago <= 11 and bar_dow <= 4:
                pw_bars.append(bar)
        except Exception:
            continue

    if pw_bars:
        result["pwh"] = round(max(b["h"] for b in pw_bars), 2)
        result["pwl"] = round(min(b["l"] for b in pw_bars), 2)
    else:
        # Fallback: use bars from 6-10 positions back as prior week approximation
        pw_approx = completed[-10:-5] if len(completed) >= 10 else []
        if pw_approx:
            result["pwh"] = round(max(b["h"] for b in pw_approx), 2)
            result["pwl"] = round(min(b["l"] for b in pw_approx), 2)

    return result

# ── GEX KING NODE CALCULATOR ──────────────────────────────────────
def get_gex_levels(symbol="IWM"):
    """
    Pull GEX data from FlashAlpha free tier.
    Returns flip level, call walls, King nodes (largest negative GEX strikes).
    Falls back to OptionsGEX scrape if FlashAlpha key not available.
    """
    result = {
        "flip_level": None,
        "regime": None,
        "call_walls": [],
        "king_nodes": [],
        "magnet": None,
        "raw_strikes": [],
        "source": None,
        "error": None,
    }

    # Try FlashAlpha API — use /levels endpoint (free tier, no expiry needed)
    # then /gex for per-strike data
    if FLASHALPHA_KEY:
        try:
            headers = {
                "X-Api-Key": FLASHALPHA_KEY,
                "Accept": "application/json",
            }

            # Step 1: Get key levels (free tier — gamma flip, call wall, put wall)
            levels_url = f"https://lab.flashalpha.com/v1/exposure/levels/{symbol}"
            r_levels = requests.get(levels_url, headers=headers, timeout=15)
            print(f"  FlashAlpha levels: {r_levels.status_code}")

            if r_levels.status_code == 200:
                levels_data = r_levels.json()
                lvls = levels_data.get("levels", levels_data)
                result["flip_level"] = lvls.get("gamma_flip") or lvls.get("flip")
                result["source"] = "FlashAlpha"

                # Extract call wall and put wall from levels
                call_wall = lvls.get("call_wall")
                put_wall = lvls.get("put_wall")
                magnet = lvls.get("zero_dte_magnet") or lvls.get("magnet")

                if call_wall:
                    result["call_walls"] = [{"strike": call_wall, "gex": 0}]
                if put_wall:
                    result["king_nodes"] = [{"strike": put_wall, "gex": 0}]
                if magnet:
                    result["magnet"] = {"strike": magnet, "gex": 0}

                print(f"  Levels: flip={result['flip_level']} call_wall={call_wall} put_wall={put_wall}")

            # Step 2: Try GEX per-strike (free tier, single expiry)
            today_str = date.today().isoformat()
            gex_url = f"https://lab.flashalpha.com/v1/exposure/gex/{symbol}"
            # Try without expiration first (might work on free tier)
            r_gex = requests.get(gex_url, headers=headers, timeout=15)
            print(f"  FlashAlpha GEX: {r_gex.status_code}")

            if r_gex.status_code == 200:
                data = r_gex.json()
                if not result["flip_level"]:
                    result["flip_level"] = data.get("gamma_flip")
                result["source"] = "FlashAlpha"

                strikes = data.get("strikes", [])
                positive = []
                negative = []
                for s in strikes:
                    net = s.get("net_gex", 0)
                    strike = s.get("strike")
                    if net and strike:
                        if net > 0:
                            positive.append((strike, net))
                        else:
                            negative.append((strike, net))

                positive.sort(key=lambda x: x[1], reverse=True)
                result["call_walls"] = [{"strike": s, "gex": round(g/1e6, 1)} for s, g in positive[:3]]

                negative.sort(key=lambda x: abs(x[1]), reverse=True)
                result["king_nodes"] = [{"strike": s, "gex": round(g/1e6, 1)} for s, g in negative[:3]]

                if negative:
                    result["magnet"] = {"strike": negative[0][0], "gex": round(negative[0][1]/1e6, 1)}

                if result["flip_level"]:
                    result["regime"] = "NEGATIVE" if data.get("regime") == "negative" else "POSITIVE"

                print(f"GEX: FlashAlpha OK — flip={result['flip_level']} strikes={len(strikes)}")
                return result
            elif r_gex.status_code == 403:
                # Try with today's expiration (free tier single-expiry)
                r_gex2 = requests.get(gex_url, headers=headers,
                                       params={"expiration": today_str}, timeout=15)
                print(f"  FlashAlpha GEX with expiry: {r_gex2.status_code}")
                if r_gex2.status_code == 200:
                    data = r_gex2.json()
                    if not result["flip_level"]:
                        result["flip_level"] = data.get("gamma_flip")
                    result["source"] = "FlashAlpha"
                    strikes = data.get("strikes", [])
                    positive = [(s.get("strike"), s.get("net_gex",0)) for s in strikes if s.get("net_gex",0)>0]
                    negative = [(s.get("strike"), s.get("net_gex",0)) for s in strikes if s.get("net_gex",0)<0]
                    positive.sort(key=lambda x: x[1], reverse=True)
                    negative.sort(key=lambda x: abs(x[1]), reverse=True)
                    result["call_walls"] = [{"strike": s, "gex": round(g/1e6,1)} for s,g in positive[:3]]
                    result["king_nodes"] = [{"strike": s, "gex": round(g/1e6,1)} for s,g in negative[:3]]
                    if negative:
                        result["magnet"] = {"strike": negative[0][0], "gex": round(negative[0][1]/1e6,1)}
                    print(f"GEX: FlashAlpha OK (with expiry) — flip={result['flip_level']}")
                    return result

            # If levels worked but GEX didn't, still return levels data
            if result["flip_level"]:
                result["regime"] = "UNKNOWN"
                print(f"GEX: FlashAlpha levels only — flip={result['flip_level']}")
                return result

            print(f"FlashAlpha both endpoints failed")
        except Exception as e:
            print(f"FlashAlpha exception: {e}")

    # Fallback: OptionsGEX web scrape for basic levels
    try:
        url = f"https://optionsgex.com/api/gex/{symbol}"
        r = requests.get(url, timeout=10, headers={"User-Agent": "Mozilla/5.0"})
        if r.status_code == 200:
            data = r.json()
            result["flip_level"] = data.get("gamma_flip") or data.get("flip_level")
            result["source"] = "OptionsGEX"

            strikes_data = data.get("strikes") or data.get("data") or []
            for s in strikes_data:
                net = s.get("net_gex") or s.get("gex", 0)
                strike = s.get("strike")
                if net and strike:
                    if net < 0:
                        result["king_nodes"].append({"strike": strike, "gex": round(net/1e6, 1)})
                    else:
                        result["call_walls"].append({"strike": strike, "gex": round(net/1e6, 1)})

            result["king_nodes"].sort(key=lambda x: abs(x["gex"]), reverse=True)
            result["call_walls"].sort(key=lambda x: x["gex"], reverse=True)
            result["king_nodes"] = result["king_nodes"][:3]
            result["call_walls"] = result["call_walls"][:3]
            if result["king_nodes"]:
                result["magnet"] = result["king_nodes"][0]
            result["source"] = "OptionsGEX"
            print(f"GEX: OptionsGEX OK — flip={result['flip_level']}")
            return result
    except Exception as e:
        print(f"OptionsGEX exception: {e}")

    result["error"] = "GEX unavailable — add FLASHALPHA_KEY to GitHub secrets"
    print("GEX: No data available")
    return result

# ── CLIFF EDGE CALCULATOR ─────────────────────────────────────────
def calc_cliff_edge(five_dh, five_dl, pwh, pwl):
    """
    Check if 5DH=PWH (calls cliff) or 5DL=PWL (puts cliff) within 0.10.
    Returns cliff edge info.
    """
    result = {
        "puts_cliff": False,
        "calls_cliff": False,
        "puts_diff": None,
        "calls_diff": None,
        "flag": None,
    }

    if five_dl and pwl:
        diff = round(abs(five_dl - pwl), 2)
        result["puts_diff"] = diff
        if diff <= 0.10:
            result["puts_cliff"] = True
            result["flag"] = f"⚡⚡ PUTS CLIFF EDGE — 5DL {five_dl} = PWL {pwl} (diff {diff})"

    if five_dh and pwh:
        diff = round(abs(five_dh - pwh), 2)
        result["calls_diff"] = diff
        if diff <= 0.10:
            result["calls_cliff"] = True
            if result["flag"]:
                result["flag"] += f" | CALLS CLIFF EDGE — 5DH {five_dh} = PWH {pwh} (diff {diff})"
            else:
                result["flag"] = f"⚡ CALLS CLIFF EDGE — 5DH {five_dh} = PWH {pwh} (diff {diff})"

    if not result["flag"]:
        result["flag"] = "No cliff edge"

    return result

# ── OPEN AIR CALCULATOR ───────────────────────────────────────────
def calc_open_air(open_price, pmh, pml, pdh, pdl, five_dh, five_dl, pwh, pwl, vah=None, val=None):
    """
    List all levels above and below open.
    Find max open air gap between consecutive levels.
    Output runway tier.
    """
    if not open_price:
        return {"error": "No open price"}

    # Build level lists
    levels_above = []
    levels_below = []

    level_map = {
        "VAH": vah, "PMH": pmh, "PDH": pdh,
        "5DH": five_dh, "PWH": pwh,
    }
    for name, val_l in level_map.items():
        if val_l and val_l > open_price:
            levels_above.append((name, round(val_l, 2)))

    level_map_below = {
        "VAL": val, "PML": pml, "PDL": pdl,
        "5DL": five_dl, "PWL": pwl,
    }
    for name, val_l in level_map_below.items():
        if val_l and val_l < open_price:
            levels_below.append((name, round(val_l, 2)))

    levels_above.sort(key=lambda x: x[1])
    levels_below.sort(key=lambda x: x[1], reverse=True)

    def calc_gaps(levels, start, direction="up"):
        gaps = []
        prev = start
        for name, lv in levels:
            gap = round(abs(lv - prev), 2)
            gaps.append({"from": round(prev, 2), "to_level": name, "to_price": lv, "gap": gap})
            prev = lv
        return gaps

    gaps_above = calc_gaps(levels_above, open_price, "up")
    gaps_below = calc_gaps(levels_below, open_price, "down")

    max_gap_above = max((g["gap"] for g in gaps_above), default=0)
    max_gap_below = max((g["gap"] for g in gaps_below), default=0)

    def runway_tier(max_gap):
        if max_gap >= 3.00: return "WIDE OPEN ⚡ (3.00+)"
        if max_gap >= 1.50: return "MODERATE (1.50-2.99)"
        if max_gap >= 0.50: return "TIGHT (0.50-1.49)"
        return "STACKED (<0.50)"

    return {
        "levels_above": levels_above,
        "levels_below": levels_below,
        "gaps_above": gaps_above,
        "gaps_below": gaps_below,
        "max_gap_above": max_gap_above,
        "max_gap_below": max_gap_below,
        "runway_calls": runway_tier(max_gap_above),
        "runway_puts": runway_tier(max_gap_below),
    }

# ── SUPPRESSOR CHECK ──────────────────────────────────────────────
def calc_suppressors(gap_amt, gap_dir, prior_move, prior_dominant,
                     iwm_vol=None, iwo_vol=None, close_pct=None, five_d_pct=None):
    """
    Check S1 (recovery gap), S2 (vol weakness), S3 (vars exhaustion).
    Requires vol/vars to be passed in manually (from user input).
    """
    suppressors = []
    details = {}

    # S1 — Recovery gap
    if gap_amt and prior_move and prior_move > 0:
        recovery_pct = round(gap_amt / prior_move * 100, 1)
        details["recovery_pct"] = recovery_pct
        details["prior_move"] = prior_move
        details["prior_dominant"] = prior_dominant

        opposite = (prior_dominant == "PUTS" and gap_dir == "Up") or \
                   (prior_dominant == "CALLS" and gap_dir == "Down")
        details["opposite_gap"] = opposite

        if recovery_pct >= 40 and opposite:
            suppressors.append(f"S1 Recovery gap {recovery_pct}% (>= 40% opposite direction)")
    else:
        details["recovery_pct"] = None

    # S2 — Vol weakness (requires manual input)
    if iwm_vol is not None and iwo_vol is not None:
        if iwo_vol < 75:
            suppressors.append(f"S2 IWO weak ({iwo_vol}% < 75%)")
        elif iwm_vol < 75:
            suppressors.append(f"S2 IWM weak ({iwm_vol}% < 75%)")
        details["vol_state"] = f"IWM {iwm_vol}% / IWO {iwo_vol}%"

    # S3 — Vars exhaustion (requires manual input)
    if close_pct is not None and five_d_pct is not None:
        both_high = (close_pct >= 70 and five_d_pct >= 70)
        if both_high:
            suppressors.append(f"S3 Both vars High/ExtHigh (Close% {close_pct}% / 5D% {five_d_pct}%)")
        details["vars_state"] = f"Close% {close_pct}% / 5D% {five_d_pct}%"

    count = len(suppressors)
    if count == 0:
        verdict = "No suppressors — full capacity"
    elif count == 1:
        verdict = "1 suppressor — reduced window, first target"
    elif count == 2:
        verdict = "2 suppressors — SUPPRESSED, first target unreliable"
    else:
        verdict = "3 suppressors — SKIP or very small move"

    return {
        "suppressors": suppressors,
        "count": count,
        "verdict": verdict,
        "details": details,
    }

# ── LEVEL SCANNER (from v1) ───────────────────────────────────────
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
        self.equal_lows = []
        self.bar_count = 0
        self.snapshot_history = []
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
            self.pdh = round(prev["h"], 2)
            self.pdl = round(prev["l"], 2)
            self.pdo = round(prev["o"], 2)
            self.prior_close = round(prev["c"], 2)
            self.levels["PDH"]["value"] = self.pdh
            self.levels["PDL"]["value"] = self.pdl
            self.levels["PDO"]["value"] = self.pdo
            print(f"Prior day: PDH={self.pdh} PDL={self.pdl} Close={self.prior_close}")

    def update(self, bars):
        pm_bars = filter_premarket_bars(bars)
        if not pm_bars:
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

        for bar in pm_bars:
            for name, ldata in self.levels.items():
                val = ldata["value"]
                if val is None:
                    continue
                touched = abs(bar["h"] - val) <= 0.15 or abs(bar["l"] - val) <= 0.15
                if touched:
                    ldata["tests"] += 1
                    broke = ((name in ["PMH", "PDH", "PDO"] and bar["c"] > val + 0.05) or
                             (name in ["PML", "PDL"] and bar["c"] < val - 0.05))
                    ldata["status"] = "Broke" if broke else "Held"

        highs = [round(b["h"], 2) for b in pm_bars]
        lows = [round(b["l"], 2) for b in pm_bars]
        eq_h, eq_l = set(), set()
        for i in range(len(highs)):
            for j in range(i + 1, len(highs)):
                if abs(highs[i] - highs[j]) <= 0.05:
                    eq_h.add(round((highs[i] + highs[j]) / 2, 2))
        for i in range(len(lows)):
            for j in range(i + 1, len(lows)):
                if abs(lows[i] - lows[j]) <= 0.05:
                    eq_l.add(round((lows[i] + lows[j]) / 2, 2))
        self.equal_highs = list(eq_h)[:3]
        self.equal_lows = list(eq_l)[:3]
        self.levels["PMH"]["eq"] = len(self.equal_highs) > 0
        self.levels["PML"]["eq"] = len(self.equal_lows) > 0

    def snapshot(self, label):
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
        print(f"  [{label}] PMH={self.pmh} PML={self.pml} Price={self.current_price}")
        return snap

# ── OUTPUT BUILDER ────────────────────────────────────────────────
def build_output(scanner, five_d_pw, cliff, open_air, gex):
    open_p = scanner.open_price or scanner.current_price or scanner.prior_close

    gap = round((open_p - scanner.prior_close), 2) if open_p and scanner.prior_close else None
    gap_dir = "Up" if gap and gap > 0.33 else "Down" if gap and gap < -0.33 else "Flat"
    gap_str = f"{gap_dir} {'+' if gap and gap >= 0 else ''}{gap}" if gap else "Unknown"

    fvg = "No FVG"
    if gap_dir == "Down" and scanner.pmh and scanner.prior_close:
        if scanner.pmh > scanner.prior_close:
            fvg = f"{scanner.prior_close}–{scanner.pmh} (above open)"
    elif gap_dir == "Up" and scanner.pml and scanner.prior_close:
        if scanner.pml < scanner.prior_close:
            fvg = f"{scanner.pml}–{scanner.prior_close} (below open)"

    pm_range = round(scanner.pmh - scanner.pml, 2) if scanner.pmh and scanner.pml else 0
    rtype = "Tight" if pm_range < 1.50 else "Wide" if pm_range > 3.00 else "Mid"

    dist_ceil = round(abs(scanner.pmh - open_p), 2) if scanner.pmh else 99
    dist_floor = round(abs(open_p - scanner.pml), 2) if scanner.pml else 99
    closer = "PMH" if dist_ceil < dist_floor else "PML"
    dist = min(dist_ceil, dist_floor)
    position = (f"AT {closer} ({dist} away)" if dist <= 0.20
                else f"NEAR {closer} ({dist} away)" if dist <= 1.50
                else f"MID (PMH {dist_ceil}, PML {dist_floor})")

    sweep_warn = []
    if scanner.equal_highs:
        sweep_warn.append(f"Equal highs {scanner.equal_highs} → PMH sweep likely")
    if scanner.equal_lows:
        sweep_warn.append(f"Equal lows {scanner.equal_lows} → PML sweep likely")

    level_out = {}
    for name, d in scanner.levels.items():
        level_out[name] = {
            "value": d["value"],
            "tested": d["tests"],
            "status": d["status"] if d["tests"] > 0 else "—",
            "eq": "⚠️ EQ" if d["eq"] else "—",
        }

    # GEX summary
    gex_summary = {
        "flip_level": gex.get("flip_level"),
        "regime": gex.get("regime"),
        "call_walls": gex.get("call_walls", []),
        "king_nodes": gex.get("king_nodes", []),
        "magnet": gex.get("magnet"),
        "source": gex.get("source"),
        "error": gex.get("error"),
    }

    return {
        "generated_at": datetime.now(PST).strftime("%I:%M %p PST"),
        "date": date.today().isoformat(),
        "symbol": SYMBOL,
        "current_price": scanner.current_price,
        "prior_close": scanner.prior_close,
        "open": open_p,
        "gap": gap_str,
        "closer_to": closer,
        "position": position,
        "fvg_zone": fvg,
        "pm_range": f"{rtype} {pm_range}",
        "premarket_bars": scanner.bar_count,
        "sweep_warning": " | ".join(sweep_warn) if sweep_warn else "None detected",
        "equal_highs": scanner.equal_highs,
        "equal_lows": scanner.equal_lows,
        "level_scanner": level_out,
        "five_dh": five_d_pw.get("five_dh"),
        "five_dl": five_d_pw.get("five_dl"),
        "pwh": five_d_pw.get("pwh"),
        "pwl": five_d_pw.get("pwl"),
        "cliff_edge": cliff,
        "open_air": {
            "levels_above": open_air.get("levels_above", []),
            "levels_below": open_air.get("levels_below", []),
            "max_gap_above": open_air.get("max_gap_above"),
            "max_gap_below": open_air.get("max_gap_below"),
            "runway_calls": open_air.get("runway_calls"),
            "runway_puts": open_air.get("runway_puts"),
        },
        "gex": gex_summary,
        "snapshots": scanner.snapshot_history,
    }

def write_output(data):
    os.makedirs("public", exist_ok=True)
    with open(OUTPUT, "w") as f:
        json.dump(data, f, indent=2)

def print_summary(data):
    print("\n" + "=" * 60)
    print("📊 STEALTH SIGNALS MORNING BRIEF")
    print("=" * 60)
    print(f"  Gap:         {data.get('gap')}")
    print(f"  Open:        {data.get('open')}")
    print(f"  Position:    {data.get('position')}")
    print(f"  PM Range:    {data.get('pm_range')}")
    print(f"  FVG:         {data.get('fvg_zone')}")
    print(f"  5D High:     {data.get('five_dh')} | 5D Low: {data.get('five_dl')}")
    print(f"  PW High:     {data.get('pwh')} | PW Low: {data.get('pwl')}")

    cliff = data.get("cliff_edge", {})
    print(f"\n⚡ CLIFF EDGE: {cliff.get('flag', 'None')}")

    oa = data.get("open_air", {})
    print(f"\n🔭 OPEN AIR:")
    print(f"  Calls runway: {oa.get('runway_calls')} (max gap {oa.get('max_gap_above')})")
    print(f"  Puts runway:  {oa.get('runway_puts')} (max gap {oa.get('max_gap_below')})")

    gex = data.get("gex", {})
    if gex.get("error"):
        print(f"\n📊 GEX: {gex['error']}")
    else:
        print(f"\n📊 GEX LEVELS (source: {gex.get('source')}):")
        print(f"  Flip level: {gex.get('flip_level')}")
        print(f"  Regime: {gex.get('regime')}")
        if gex.get("call_walls"):
            print(f"  Call walls: {[(w['strike'], w['gex']) for w in gex['call_walls']]}")
        if gex.get("king_nodes"):
            print(f"  👑 King nodes: {[(n['strike'], n['gex']) for n in gex['king_nodes']]}")
        if gex.get("magnet"):
            m = gex["magnet"]
            print(f"  🧲 Magnet: {m['strike']} ({m['gex']}M)")

    print(f"\n📡 LEVEL SCANNER:")
    for name, info in data.get("level_scanner", {}).items():
        print(f"  {name}: {info['value']} | {info['tested']}x | {info['status']} | {info['eq']}")

    sw = data.get("sweep_warning", "None")
    if sw != "None detected":
        print(f"\n⚠️  SWEEP: {sw}")

    print("\n✅ Morning brief ready.")

# ── MAIN ──────────────────────────────────────────────────────────
def main():
    now = datetime.now(PST)
    print("=" * 60)
    print("🚀 STEALTH SIGNALS MORNING BOT v2")
    print(f"📅 {now.strftime('%A, %B %d %Y — %I:%M %p PST')}")
    print("=" * 60)

    if date.today().weekday() >= 5:
        print("📅 Weekend — market closed. Exiting.")
        return

    # GEX schedule: 2PM PST (14:00) = EOD clean read
    #               6:00 AM PST (06:00) = premarket read
    # Both use one of the 5 free daily FlashAlpha calls each
    h_now = now.hour
    is_eod_run = (h_now >= 14 and h_now < 15)
    is_morning_run = (h_now >= 1 and h_now <= 9)
    print(f"  Run type: {'EOD GEX' if is_eod_run else 'Morning' if is_morning_run else 'Manual'}")

    scanner = LevelScanner()

    # Load prior day + 5D/PW data
    print("\n📥 Loading daily bars...")
    daily_bars = get_daily_bars(limit=15)
    if not daily_bars:
        # Fallback to standard fetch
        daily_bars = get_bars("1Day", limit=15)
    if daily_bars:
        scanner.load_daily(daily_bars)
        five_d_pw = calc_5d_and_pw_levels(daily_bars)
        print(f"  5DH={five_d_pw['five_dh']} 5DL={five_d_pw['five_dl']}")
        print(f"  PWH={five_d_pw['pwh']} PWL={five_d_pw['pwl']}")
    else:
        print("⚠️  Could not fetch daily bars")
        five_d_pw = {"five_dh": None, "five_dl": None, "pwh": None, "pwl": None}

    # GEX levels
    print("\n📊 Fetching GEX levels...")
    gex = get_gex_levels(SYMBOL)

    # Premarket bar collection
    h, m = now.hour, now.minute
    if h < 6 or (h == 6 and m < 25):
        print("\n📡 Monitoring premarket...")
        snapshot_times = {(6, 0): "6:00 AM", (6, 10): "6:10 AM",
                          (6, 20): "6:20 AM", (6, 25): "6:25 AM"}
        snapshots_taken = set()

        while True:
            now = datetime.now(PST)
            h, m = now.hour, now.minute
            if h > 6 or (h == 6 and m >= 25):
                break

            bars = get_bars("1Min", 500)
            if bars:
                scanner.update(bars)

            if (h, m) in snapshot_times and (h, m) not in snapshots_taken:
                scanner.snapshot(snapshot_times[(h, m)])
                snapshots_taken.add((h, m))

            time.sleep(60)
    else:
        print("  Running final pass...")

    # Final data — use explicit today's bars for accuracy
    print("\n📊 Final data collection...")
    bars = get_today_bars()
    if not bars:
        # Fallback to standard fetch
        bars = get_bars("1Min", 500)
    if bars:
        scanner.update(bars)
        scanner.snapshot("6:25 AM Final")

    price = get_latest_price()
    if price:
        scanner.current_price = round(price, 2)

    open_p = scanner.open_price or scanner.current_price

    # Cliff edge
    cliff = calc_cliff_edge(
        five_d_pw.get("five_dh"), five_d_pw.get("five_dl"),
        five_d_pw.get("pwh"), five_d_pw.get("pwl")
    )

    # Open air
    open_air = calc_open_air(
        open_p, scanner.pmh, scanner.pml,
        scanner.pdh, scanner.pdl,
        five_d_pw.get("five_dh"), five_d_pw.get("five_dl"),
        five_d_pw.get("pwh"), five_d_pw.get("pwl"),
    )

    # Build and write output
    data = build_output(scanner, five_d_pw, cliff, open_air, gex)
    write_output(data)
    print_summary(data)

if __name__ == "__main__":
    main()
