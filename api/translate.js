import axios from 'axios';
import { translate as googleTranslate } from '@vitalets/google-translate-api';

function toGoogleFormat(translatedText, originalText) {
  return [[[translatedText, originalText]]];
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { text, sl = 'en', tl = 'hi' } = req.body || {};
  if (!text) return res.status(400).json({ error: 'text is required' });

  // Layer 1: @vitalets
  try {
    const result = await googleTranslate(text, { from: sl, to: tl });
    if (result && result.text) {
      return res.status(200).json(toGoogleFormat(result.text, text));
    }
  } catch (e1) {
    console.warn('[vercel-translate] Layer 1 failed:', e1.message);
  }

  // Layer 2: Google Mobile Web translate
  try {
    const googleMobileUrl = 'https://translate.google.com/m?sl=' + sl + '&tl=' + tl + '&q=' + encodeURIComponent(text);
    const gmRes = await axios.get(googleMobileUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept-Language': 'hi,en-US;q=0.9,en;q=0.8'
      },
      timeout: 10000
    });
    const match = gmRes.data.match(/<div[^>]*class=["']result-container["'][^>]*>([\s\S]*?)<\/div>/i);
    if (match && match[1]) {
      const cleaned = match[1]
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .trim();
      return res.status(200).json(toGoogleFormat(cleaned, text));
    }
  } catch (e2) {
    console.warn('[vercel-translate] Layer 2 failed:', e2.message);
  }

  // Layer 3: MyMemory
  try {
    const mmUrl = 'https://api.mymemory.translated.net/get?q=' + encodeURIComponent(text) + '&langpair=' + sl + '|' + tl;
    const r3 = await axios.get(mmUrl, { timeout: 10000 });
    const translated = r3.data?.responseData?.translatedText;
    if (translated && r3.data?.responseStatus === 200) {
      return res.status(200).json(toGoogleFormat(translated, text));
    }
  } catch (e3) {
    console.warn('[vercel-translate] Layer 3 failed:', e3.message);
  }

  return res.status(502).json({ error: 'All translation layers failed.' });
}
