const axios = require('axios');
const crypto = require('crypto');

async function checkHIBP(password) {
  // k-Anonymity: only send first 5 chars of SHA1 hash
  const sha1 = crypto.createHash('sha1').update(password).digest('hex').toUpperCase();
  const prefix = sha1.slice(0, 5);
  const suffix = sha1.slice(5);
  try {
    const resp = await axios.get(`https://api.pwnedpasswords.com/range/${prefix}`, {
      headers: { 'User-Agent': 'Password-Analyzer/1.0' },
      timeout: 5000
    });
    const lines = resp.data.split('\n');
    for (const line of lines) {
      const [hashSuffix, count] = line.split(':');
      if (hashSuffix && hashSuffix.trim() === suffix) {
        return { breached: true, count: parseInt(count || '0', 10) };
      }
    }
    return { breached: false, count: 0 };
  } catch (e) {
    console.warn('HIBP check failed:', e.message || e);
    return { breached: false, count: 0 };
  }
}

module.exports = { checkHIBP };

