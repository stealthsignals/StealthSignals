// Temporary debug version — replace gex.js with this to diagnose
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  // Debug: show what env vars are available (safe — only shows names not values)
  const envKeys = Object.keys(process.env).filter(k => 
    !k.includes('SECRET') && !k.includes('TOKEN') && !k.includes('PASSWORD')
  );
  
  const hasFlashKey = !!process.env.FLASHALPHA_KEY;
  const flashKeyLength = process.env.FLASHALPHA_KEY?.length || 0;
  
  return res.status(200).json({
    has_flashalpha_key: hasFlashKey,
    key_length: flashKeyLength,
    node_env: process.env.NODE_ENV,
    vercel_env: process.env.VERCEL_ENV,
    all_env_keys: envKeys,
  });
}
