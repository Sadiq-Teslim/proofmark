const axios = require('axios');
const dns = require('dns').promises;
const net = require('net');
const { describeImageBuffer } = require('./imageEvidence');

const MAX_REMOTE_IMAGE_BYTES = 25 * 1024 * 1024;

const isPrivateIPv4 = (ip) => {
  const parts = ip.split('.').map(Number);
  if (parts.length !== 4 || parts.some((part) => Number.isNaN(part))) return true;
  const [a, b] = parts;
  return (
    a === 10 ||
    a === 127 ||
    a === 0 ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168)
  );
};

const isPrivateIPv6 = (ip) => {
  const normalized = ip.toLowerCase();
  return (
    normalized === '::1' ||
    normalized.startsWith('fc') ||
    normalized.startsWith('fd') ||
    normalized.startsWith('fe80:')
  );
};

const assertPublicHttpUrl = async (rawUrl) => {
  let parsed;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new Error('A valid image URL is required');
  }
  if (!['http:', 'https:'].includes(parsed.protocol)) {
    throw new Error('Only http and https image URLs are supported');
  }

  const addresses = await dns.lookup(parsed.hostname, { all: true, verbatim: true });
  if (!addresses.length) throw new Error('Could not resolve image URL host');
  const unsafe = addresses.some(({ address }) => {
    const family = net.isIP(address);
    if (family === 4) return isPrivateIPv4(address);
    if (family === 6) return isPrivateIPv6(address);
    return true;
  });
  if (unsafe) throw new Error('Private or local image URLs are not allowed');
  return parsed.toString();
};

const fetchRemoteImage = async (rawUrl) => {
  const url = await assertPublicHttpUrl(rawUrl);
  const response = await axios.get(url, {
    responseType: 'arraybuffer',
    timeout: 60000,
    maxRedirects: 0,
    maxContentLength: MAX_REMOTE_IMAGE_BYTES,
    maxBodyLength: MAX_REMOTE_IMAGE_BYTES,
    validateStatus: (status) => status >= 200 && status < 300,
  });

  const contentType = String(response.headers['content-type'] || '').split(';')[0].trim();
  if (!contentType.startsWith('image/')) {
    throw new Error('URL must return an image content type');
  }

  const buffer = Buffer.from(response.data);
  if (!buffer.length || buffer.length > MAX_REMOTE_IMAGE_BYTES) {
    throw new Error('Remote image is empty or too large');
  }

  const filename = decodeURIComponent(new URL(url).pathname.split('/').pop() || 'remote-image');
  const evidence = describeImageBuffer(buffer, contentType, {
    requestedUrl: rawUrl,
    resolvedUrl: url,
    host: new URL(url).hostname,
    etag: response.headers.etag || '',
    lastModified: response.headers['last-modified'] || '',
    cacheControl: response.headers['cache-control'] || '',
  });
  return { buffer, filename, contentType, url, evidence };
};

module.exports = { fetchRemoteImage, assertPublicHttpUrl, MAX_REMOTE_IMAGE_BYTES };
