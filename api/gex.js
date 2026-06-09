// Vercel serverless function — /api/gex
// Proxies FlashAlpha GEX request server-side so API key stays hidden
// Deploy: add this file to /api/gex.js in your repo root

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600'); // cache 5 min

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const FLASHALPHA_KEY = process.env.FLASHALPHA_KEY;
  if (!FLASHALPHA_KEY) {
    return res.status(500).json({ error: 'FLASHALPHA_KEY not configured' });
  }

  const symbol = req.query.symbol || 'IWM';
  const today = new Date().toISOString().split('T')[0];

  try {
    // Fetch GEX from FlashAlpha
    const gexRes = await fetch(
      `https://lab.flashalpha.com/v1/exposure/gex/${symbol}?expiration=${today}`,
      { headers: { 'X-Api-Key': FLASHALPHA_KEY } }
    );

    if (!gexRes.ok) {
      return res.status(gexRes.status).json({ 
        error: `FlashAlpha error ${gexRes.status}` 
      });
    }

    const data = await gexRes.json();

    // Parse and return clean GEX levels
    const strikes = data.strikes || [];
    const flip_level = data.gamma_flip || null;
    const regime = data.regime || null;

    // Separate positive (call walls) and negative (king nodes)
    const positive = strikes
      .filter(s => s.net_gex > 0)
      .sort((a, b) => b.net_gex - a.net_gex)
      .slice(0, 3)
      .map(s => ({ strike: s.strike, gex: +(s.net_gex / 1e6).toFixed(1) }));

    const negative = strikes
      .filter(s => s.net_gex < 0)
      .sort((a, b) => Math.abs(b.net_gex) - Math.abs(a.net_gex))
      .slice(0, 5)
      .map(s => ({ strike: s.strike, gex: +(s.net_gex / 1e6).toFixed(1) }));

    const magnet = negative.length > 0 ? negative[0] : null;
    const king_nodes = negative.filter(n => Math.abs(n.gex) > 20);
    const gate_nodes = negative.filter(n => Math.abs(n.gex) <= 20 && Math.abs(n.gex) > 10);

    return res.status(200).json({
      symbol,
      flip_level,
      regime: regime || (flip_level ? 'unknown' : null),
      call_walls: positive,
      king_nodes,
      gate_nodes,
      magnet,
      raw_negative: negative,
      source: 'FlashAlpha',
      updated_at: new Date().toISOString(),
    });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
