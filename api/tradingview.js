/**
 * STEALTH SIGNALS 2 — TradingView Webhook Receiver
 * Endpoint: POST /api/tradingview
 */

const https = require('https');

const GITHUB_TOKEN   = process.env.STEALTH_GITHUB_TOKEN || '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';
const GITHUB_OWNER   = process.env.GITHUB_OWNER || 'stealthsignals';
const GITHUB_REPO    = process.env.GITHUB_REPO  || 'StealthSignals';
const FILE_PATH      = 'public/morning_brief.json';
const WEBHOOK_SECRET = process.env.TV_WEBHOOK_SECRET || 'stealth2025';

function githubRequest(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.github.com',
      path: `/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${path}`,
      method,
      headers: {
        'Authorization': `token ${GITHUB_TOKEN}`,
        'User-Agent': 'StealthSignalsBot',
        'Content-Type': 'application/json',
        'Accept': 'application/vnd.github.v3+json',
      }
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
        catch (e) { resolve({ status: res.statusCode, body: data }); }
      });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function getFile() {
  const res = await githubRequest('GET', FILE_PATH);
  if (res.status === 200) {
    const content = Buffer.from(res.body.content, 'base64').toString('utf8');
    return { data: JSON.parse(content), sha: res.body.sha };
  }
  return {
    data: {
      generated_at: new Date().toLocaleTimeString('en-US', { timeZone: 'America/Los_Angeles', hour: '2-digit', minute: '2-digit' }) + ' PST',
      date: new Date().toLocaleDateString('en-CA', { timeZone: 'America/Los_Angeles' }),
      tradingview: {},
      variables: {},
      draft: {}
    },
    sha: null
  };
}

async function saveFile(data, sha) {
  const content = Buffer.from(JSON.stringify(data, null, 2)).toString('base64');
  const body = {
    message: `TradingView update ${new Date().toISOString()}`,
    content,
    ...(sha && { sha })
  };
  return await githubRequest('PUT', FILE_PATH, body);
}

function mergeData(existing, source, payload) {
  const tv = existing.tradingview || {};
  const now = new Date().toLocaleTimeString('en-US', { timeZone: 'America/Los_Angeles', hour: '2-digit', minute: '2-digit' }) + ' PST';

  switch (source) {
    case 'vol_pace':
      tv.iwm_vol  = parseFloat(payload.iwm_vol)  || tv.iwm_vol;
      tv.iwm_pace = parseFloat(payload.iwm_pace) || tv.iwm_pace;
      tv.vol_updated = now;
      break;
    case 'vol_pace_iwo':
      tv.iwo_vol  = parseFloat(payload.iwo_vol)  || tv.iwo_vol;
      tv.iwo_pace = parseFloat(payload.iwo_pace) || tv.iwo_pace;
      tv.vol_updated = now;
      break;
    case 'svp':
      tv.vah = parseFloat(payload.vah) || tv.vah;
      tv.poc = parseFloat(payload.poc) || tv.poc;
      tv.val = parseFloat(payload.val) || tv.val;
      tv.svp_updated = now;
      break;
    case 'strat_iwm_1d':
      tv.strat_iwm_1d = payload.strat || tv.strat_iwm_1d;
      tv.strat_updated = now;
      break;
    case 'strat_iwo_1d':
      tv.strat_iwo_1d = payload.strat || tv.strat_iwo_1d;
      tv.strat_updated = now;
      break;
    case 'strat_iwm_1h':
      tv.strat_iwm_1h = payload.strat || tv.strat_iwm_1h;
      break;
    case 'strat_iwo_1h':
      tv.strat_iwo_1h = payload.strat || tv.strat_iwo_1h;
      break;
    case 'cvd':
      tv.cvd     = parseFloat(payload.value) || tv.cvd;
      tv.cvd_dir = payload.direction || tv.cvd_dir;
      tv.cvd_updated = now;
      break;
    case 'pmh_pml':
      tv.pmh = parseFloat(payload.pmh) || tv.pmh;
      tv.pml = parseFloat(payload.pml) || tv.pml;
      tv.pmh_pml_updated = now;
      break;
    default:
      console.log(`Unknown source: ${source}`);
  }

  if (tv.iwm_vol && tv.iwo_vol) {
    const iwm = tv.iwm_vol;
    const iwo = tv.iwo_vol;
    const diff = Math.abs(iwm - iwo);
    if (iwm < 60 || iwo < 60) tv.vol_state = 'Broken';
    else if (diff >= 15) tv.vol_state = iwm > iwo ? 'Split-IWM leads' : 'Split-IWO leads';
    else if (iwm >= 100 && iwo >= 100) tv.vol_state = 'Both Surged';
    else if (iwm >= 85 && iwo >= 85) tv.vol_state = 'Both Improved';
    else tv.vol_state = 'Both Dropped';
  }

  existing.tradingview = tv;
  existing.tv_last_updated = now;
  return existing;
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Secret');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const secret = req.headers['x-secret'] || req.query.secret;
  if (secret !== WEBHOOK_SECRET) return res.status(401).json({ error: 'Unauthorized' });

  let payload;
  try {
    payload = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  } catch (e) {
    return res.status(400).json({ error: 'Invalid JSON', detail: e.message });
  }

  const source = payload.source;
  if (!source) return res.status(400).json({ error: 'Missing source field' });

  console.log(`TradingView webhook: source=${source}`, payload);

  try {
    const { data, sha } = await getFile();
    const updated = mergeData(data, source, payload);
    const saveResult = await saveFile(updated, sha);

    if (saveResult.status === 200 || saveResult.status === 201) {
      return res.status(200).json({
        success: true,
        source,
        message: `${source} data merged successfully`,
        tv_data: updated.tradingview
      });
    } else {
      console.error('GitHub save failed:', saveResult);
      return res.status(500).json({ error: 'Failed to save', detail: saveResult.body });
    }
  } catch (err) {
    console.error('Webhook error:', err);
    return res.status(500).json({ error: 'Internal error', detail: err.message });
  }
};
