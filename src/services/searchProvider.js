const axios = require('axios');

// Reverse-image search: find pages on the web that show a (visually) matching image.
// Provider: Google Cloud Vision "Web Detection". Returns candidate { pageUrl, imageUrl, title }.
const provider = () => process.env.SEARCH_PROVIDER || 'google-vision';

const isConfigured = () =>
  provider() === 'google-vision' ? Boolean(process.env.GOOGLE_VISION_API_KEY) : false;

const googleVisionWebDetection = async (imageBuffer) => {
  const url =
    `https://vision.googleapis.com/v1/images:annotate?key=${process.env.GOOGLE_VISION_API_KEY}`;
  const body = {
    requests: [{
      image: { content: imageBuffer.toString('base64') },
      features: [{ type: 'WEB_DETECTION', maxResults: 25 }],
    }],
  };
  const { data } = await axios.post(url, body, { timeout: 60000 });
  const web = data.responses?.[0]?.webDetection || {};

  const candidates = [];
  for (const p of web.pagesWithMatchingImages || []) {
    candidates.push({
      pageUrl: p.url,
      imageUrl: p.fullMatchingImages?.[0]?.url || p.partialMatchingImages?.[0]?.url || '',
      title: p.pageTitle || '',
    });
  }
  for (const i of web.fullMatchingImages || []) {
    candidates.push({ pageUrl: i.url, imageUrl: i.url, title: '' });
  }
  return candidates;
};

const searchCopies = async (imageBuffer) => {
  if (!isConfigured()) throw new Error('Search provider not configured (set GOOGLE_VISION_API_KEY)');
  if (provider() === 'google-vision') return googleVisionWebDetection(imageBuffer);
  throw new Error(`Unsupported SEARCH_PROVIDER: ${provider()}`);
};

module.exports = { searchCopies, isConfigured };
