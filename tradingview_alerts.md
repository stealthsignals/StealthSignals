# STEALTH SIGNALS 2 — TradingView Alert Setup
## Webhook URL: https://stealth-signals-lvz9.vercel.app/api/tradingview

Set up one alert per section below.
Each alert fires at **6:20 AM ET (3:20 AM PST)** daily.
All alerts use the same webhook URL.

---

## ALERT SETUP STEPS (do this for each alert)

1. On your TradingView chart, right-click the indicator → **Add Alert**
2. Set **Condition** to: `[Indicator Name]` → `Any alert() function call`
   OR use the Pine Script wrapper below instead
3. Set **Trigger** to: `Once Per Bar Close`
4. Set **Expiration** to: `Open-ended`
5. Under **Notifications** → enable **Webhook URL**
6. Paste the webhook URL above
7. Add the header: `X-Secret: stealth2025`
8. Paste the message JSON from each section below
9. Click **Create**

---

## ALERT 1 — IWM Vol % & Pace %
**Chart:** IWM, 30 min
**Indicator:** Volume Pace & Pressure Table

**Alert message (paste exactly):**
```json
{
  "source": "vol_pace",
  "iwm_vol": "{{plot("Vol %")}}",
  "iwm_pace": "{{plot("Pace %")}}"
}
```

**If plot names don't work, use this Pine Script wrapper alert instead:**
Create a new Pine Script indicator on IWM 30M chart:
```pine
//@version=5
indicator("Stealth IWM Vol Alert", overlay=true)

// Import Vol % and Pace % values from table
// These are the same values shown in bottom-left and bottom-center of the table
vol_pct = ta.sma(volume, 20) > 0 ? (volume / ta.sma(volume, 20)) * 100 : 0
// Note: Use the actual Vol% value from the Volume Pace & Pressure Table indicator
// Right-click the indicator → Add to → and read the output values

// Fire at 6:20 AM ET (premarket)
et_hour = hour(time, "America/New_York")
et_min  = minute(time, "America/New_York")
fire = et_hour == 6 and et_min == 20

if fire
    alert('{"source":"vol_pace","iwm_vol":"' + str.tostring(vol_pct, "#.##") + '","iwm_pace":"0"}', alert.freq_once_per_bar)
```

**EASIEST APPROACH — Manual alert message with dynamic values:**
Set the alert to fire at 6:20 AM ET on close, use this message:
```json
{"source":"vol_pace","iwm_vol":"{{close}}","iwm_pace":"{{close}}"}
```
Then in the alert name note which values to check.

---

## ALERT 2 — IWO Vol % & Pace %
**Chart:** IWO, 30 min
**Indicator:** Volume Pace & Pressure Table

**Alert message:**
```json
{
  "source": "vol_pace_iwo",
  "iwo_vol": "{{plot("Vol %")}}",
  "iwo_pace": "{{plot("Pace %")}}"
}
```

---

## ALERT 3 — SVP (VAH / POC / VAL)
**Chart:** IWM, preferred timeframe
**Indicator:** Session Volume Profile HD

**Alert message:**
```json
{
  "source": "svp",
  "vah": "{{plot("VAH")}}",
  "poc": "{{plot("POC")}}",
  "val": "{{plot("VAL")}}"
}
```

**Note:** Session Volume Profile HD is a TradingView built-in drawing tool, not a script indicator. It does not support Pine Script alert variables directly.

**Workaround — Pine Script wrapper:**
```pine
//@version=5
indicator("Stealth SVP Alert", overlay=true)

// Manually input today's SVP levels each morning OR
// use a Pine Script that calculates VWAP bands as proxy

// Fire at 6:20 AM ET
et_hour = hour(time, "America/New_York")
et_min  = minute(time, "America/New_York")
fire = et_hour == 6 and et_min == 20

// Input these manually each morning before 6:20 AM
vah_input = input.float(0, "VAH")
poc_input = input.float(0, "POC")
val_input = input.float(0, "VAL")

if fire
    alert('{"source":"svp","vah":"' + str.tostring(vah_input) + '","poc":"' + str.tostring(poc_input) + '","val":"' + str.tostring(val_input) + '"}', alert.freq_once_per_bar)
```

---

## ALERT 4 — The Strat IWM 1D
**Chart:** IWM, Daily
**Indicator:** The Strat [LuxAlgo]

**Alert message:**
```json
{
  "source": "strat_iwm_1d",
  "strat": "{{plot("Candle Type")}}"
}
```

**Pine Script wrapper (recommended):**
```pine
//@version=5
indicator("Stealth Strat IWM 1D", overlay=true)

// Read current 1D candle type
prev_high = ta.highest(high, 2)[1]
prev_low  = ta.lowest(low, 2)[1]

candle_type = high > prev_high and low > prev_low ? "2up" :
              high < prev_high and low < prev_low ? "2dn" :
              high > prev_high and low < prev_low ? "3" :
              "1"

// Fire at 6:20 AM ET
et_hour = hour(time, "America/New_York")
et_min  = minute(time, "America/New_York")
fire = et_hour == 6 and et_min == 20

if fire
    alert('{"source":"strat_iwm_1d","strat":"' + candle_type + '"}', alert.freq_once_per_bar)
```

---

## ALERT 5 — The Strat IWO 1D
**Chart:** IWO, Daily
**Indicator:** The Strat [LuxAlgo]

Same Pine Script as Alert 4 but on IWO chart:
```json
{"source": "strat_iwo_1d", "strat": "{{candle_type}}"}
```

---

## ALERT 6 — The Strat IWM 1H
**Chart:** IWM, 1H
Same Pine Script wrapper, change source to `strat_iwm_1h`

---

## ALERT 7 — The Strat IWO 1H
**Chart:** IWO, 1H
Same Pine Script wrapper, change source to `strat_iwo_1h`

---

## ALERT 8 — CVD
**Chart:** IWM, preferred timeframe
**Indicator:** CVD - Cumulative Volume Delta (Chart)

**Alert message:**
```json
{
  "source": "cvd",
  "value": "{{plot("CVD")}}",
  "direction": "{{plot("CVD") > plot("CVD")[1] ? 'Aligned' : 'Diverging'}}"
}
```

**Pine Script wrapper:**
```pine
//@version=5
indicator("Stealth CVD Alert", overlay=true)

// CVD calculation (matches CVD - Cumulative Volume Delta Chart indicator)
delta = close >= open ? volume : -volume
cvd = ta.cum(delta)

cvd_dir = cvd > cvd[1] ? "Aligned" : "Diverging"

// Fire at 6:20 AM ET
et_hour = hour(time, "America/New_York")
et_min  = minute(time, "America/New_York")
fire = et_hour == 6 and et_min == 20

if fire
    alert('{"source":"cvd","value":"' + str.tostring(cvd, "#.###") + '","direction":"' + cvd_dir + '"}', alert.freq_once_per_bar)
```

---

## ALERT 9 — PMH / PML
**Chart:** IWM, 1 min or 5 min
**Indicator:** Pre Market High/Low Levels

**Alert message:**
```json
{
  "source": "pmh_pml",
  "pmh": "{{plot("Pre Market High")}}",
  "pml": "{{plot("Pre Market Low")}}"
}
```

**Pine Script wrapper:**
```pine
//@version=5
indicator("Stealth PMH PML Alert", overlay=true)

// Calculate premarket high/low
// Premarket: 4:00 AM - 9:30 AM ET
et_hour = hour(time, "America/New_York")
is_premarket = et_hour >= 4 and et_hour < 9 or (et_hour == 9 and minute(time, "America/New_York") < 30)

var float pmh = na
var float pml = na

if is_premarket
    pmh := na(pmh) ? high : math.max(pmh, high)
    pml := na(pml) ? low  : math.min(pml, low)

// Reset at 4 AM ET
if et_hour == 4 and minute(time, "America/New_York") == 0
    pmh := high
    pml := low

// Fire at 6:20 AM ET
fire = et_hour == 6 and minute(time, "America/New_York") == 20

if fire and not na(pmh) and not na(pml)
    alert('{"source":"pmh_pml","pmh":"' + str.tostring(pmh, "#.##") + '","pml":"' + str.tostring(pml, "#.##") + '"}', alert.freq_once_per_bar)
```

---

## REQUIRED GITHUB SECRET

Add this to your GitHub repo secrets:
**Name:** `GITHUB_TOKEN`
**Value:** A GitHub Personal Access Token with `repo` write permissions

Generate at: https://github.com/settings/tokens → New classic token → check `repo`

---

## REQUIRED VERCEL ENV VARIABLES

Add these in Vercel dashboard → Settings → Environment Variables:
- `GITHUB_TOKEN` = your GitHub personal access token
- `GITHUB_OWNER` = stealthsignals
- `GITHUB_REPO` = StealthSignals
- `TV_WEBHOOK_SECRET` = stealth2025

---

## TESTING

After setup, test each alert:
1. Open the alert on TradingView
2. Click the alert → **Edit** → scroll to bottom → **Send test notification**
3. Check your app Brief page → refresh → verify field populated

Or test directly with curl:
```bash
curl -X POST https://stealth-signals-lvz9.vercel.app/api/tradingview \
  -H "Content-Type: application/json" \
  -H "X-Secret: stealth2025" \
  -d '{"source":"svp","vah":"291.88","poc":"291.70","val":"291.53"}'
```
