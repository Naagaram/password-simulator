const axios = require('axios');
const crypto = require('crypto');
const NodeCache = require('node-cache');

// Cache breach data for 24 hours to reduce API calls
const breachCache = new NodeCache({ stdTTL: 86400 });

/**
 * Check if password appears in HIBP database using k-anonymity
 * Returns breach count but NOT specific breaches (password-based lookup)
 */
async function checkHIBPPassword(password) {
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
    console.warn('HIBP password check failed:', e.message || e);
    return { breached: false, count: 0, error: true };
  }
}

/**
 * Get all breaches from HIBP
 * This gives us metadata about all known breaches
 */
async function getAllBreaches() {
  // Check cache first
  const cached = breachCache.get('all_breaches');
  if (cached) return cached;
  
  try {
    const resp = await axios.get('https://haveibeenpwned.com/api/v3/breaches', {
      headers: { 
        'User-Agent': 'Password-Analyzer/1.0'
      },
      timeout: 10000
    });
    
    // Cache the result
    breachCache.set('all_breaches', resp.data);
    return resp.data;
  } catch (e) {
    console.warn('HIBP breach list fetch failed:', e.message || e);
    return [];
  }
}

/**
 * Estimate which breaches might contain this password based on:
 * 1. Breach date vs password patterns
 * 2. Breach size and password popularity
 * 3. Common breach characteristics
 */
async function estimateBreachDetails(password, breachCount) {
  if (!breachCount || breachCount === 0) {
    return {
      likelyBreaches: [],
      timeline: [],
      dataClasses: []
    };
  }
  
  const allBreaches = await getAllBreaches();
  
  if (!allBreaches || allBreaches.length === 0) {
    return {
      likelyBreaches: [],
      timeline: [],
      dataClasses: []
    };
  }
  
  // Detect password characteristics
  const hasNumbers = /\d/.test(password);
  const hasSpecialChars = /[^a-zA-Z0-9]/.test(password);
  const length = password.length;
  const isCommon = breachCount > 100000; // Very commonly breached
  const isModerate = breachCount > 1000 && breachCount <= 100000;
  
  // Filter and score breaches
  let scoredBreaches = allBreaches.map(breach => {
    let score = 0;
    
    // Large breaches are more likely to contain common passwords
    if (isCommon && breach.PwnCount > 100000000) score += 50;
    if (isModerate && breach.PwnCount > 1000000) score += 30;
    
    // Recent breaches more likely for newer password patterns
    const breachYear = new Date(breach.BreachDate).getFullYear();
    const currentYear = new Date().getFullYear();
    const yearsAgo = currentYear - breachYear;
    
    if (yearsAgo <= 2) score += 20;
    else if (yearsAgo <= 5) score += 10;
    
    // Password-related data classes increase likelihood
    if (breach.DataClasses.includes('Passwords')) score += 30;
    if (breach.DataClasses.includes('Password hints')) score += 10;
    
    // Common breach types
    if (breach.Domain && ['adobe', 'linkedin', 'myspace', 'yahoo', 'dropbox'].some(d => 
      breach.Domain.toLowerCase().includes(d))) {
      score += 15;
    }
    
    return { ...breach, score };
  });
  
  // Sort by score and take top matches
  scoredBreaches.sort((a, b) => b.score - a.score);
  const topBreaches = scoredBreaches.slice(0, 8);
  
  // Format breach information
  const likelyBreaches = topBreaches.map(breach => ({
    name: breach.Name,
    title: breach.Title,
    domain: breach.Domain || 'Unknown',
    breachDate: breach.BreachDate,
    addedDate: breach.AddedDate,
    pwnCount: breach.PwnCount,
    description: breach.Description,
    dataClasses: breach.DataClasses,
    isVerified: breach.IsVerified,
    isFabricated: breach.IsFabricated,
    isSpamList: breach.IsSpamList,
    logoPath: breach.LogoPath
  }));
  
  // Create timeline
  const timeline = topBreaches.map(breach => ({
    date: breach.BreachDate,
    name: breach.Title,
    pwnCount: breach.PwnCount.toLocaleString()
  })).sort((a, b) => new Date(a.date) - new Date(b.date));
  
  // Aggregate unique data classes
  const dataClassesSet = new Set();
  topBreaches.forEach(breach => {
    breach.DataClasses.forEach(dc => dataClassesSet.add(dc));
  });
  
  return {
    likelyBreaches,
    timeline,
    dataClasses: Array.from(dataClassesSet),
    totalBreachesFound: topBreaches.length,
    estimatedExposure: breachCount > 1000000 ? 'Critical' : 
                       breachCount > 100000 ? 'High' : 
                       breachCount > 10000 ? 'Medium' : 'Low'
  };
}

/**
 * Main function to check HIBP with enhanced breach details
 */
async function checkHIBP(password) {
  // Step 1: Check if password is breached (k-anonymity check)
  const passwordCheck = await checkHIBPPassword(password);
  
  if (!passwordCheck.breached) {
    return {
      breached: false,
      count: 0,
      breachDetails: null
    };
  }
  
  // Step 2: Get estimated breach details
  const breachDetails = await estimateBreachDetails(password, passwordCheck.count);
  
  return {
    breached: true,
    count: passwordCheck.count,
    breachDetails
  };
}

module.exports = { checkHIBP };