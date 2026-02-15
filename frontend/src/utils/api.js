const DEFAULT_TIMEOUT_MS = 6000;

function getBaseUrl() {
  const configured = import.meta.env.VITE_API_BASE_URL;
  if (configured) {
    return configured.replace(/\/$/, '');
  }
  return '';
}

export function getAnalyzeEndpointLabel() {
  const base = getBaseUrl();
  return `${base || '(same-origin)'}/analyze`;
}

function parseError(data, fallback) {
  if (!data || typeof data !== 'object') return fallback;
  return data.error || data.message || fallback;
}

async function fetchWithTimeout(url, options = {}, timeoutMs = DEFAULT_TIMEOUT_MS) {
  const controller = new AbortController();
  const signal = options.signal;
  let abortListener = null;

  const timeout = setTimeout(() => {
    controller.abort();
  }, timeoutMs);

  if (signal) {
    if (signal.aborted) {
      controller.abort();
    } else {
      abortListener = () => controller.abort();
      signal.addEventListener('abort', abortListener, { once: true });
    }
  }

  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    return response;
  } finally {
    clearTimeout(timeout);
    if (signal && abortListener) {
      signal.removeEventListener('abort', abortListener);
    }
  }
}

export async function analyzePasswordRequest(password, { signal, retries = 1 } = {}) {
  const endpoint = `${getBaseUrl()}/analyze`;
  let attempt = 0;

  while (attempt <= retries) {
    try {
      const response = await fetchWithTimeout(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
        signal,
      });

      if (!response.ok) {
        let data = null;
        try {
          data = await response.json();
        } catch {
          // ignore malformed error payload
        }
        throw new Error(parseError(data, 'Analysis failed'));
      }

      return await response.json();
    } catch (error) {
      if (error.name === 'AbortError') {
        throw error;
      }

      if (attempt >= retries || !navigator.onLine) {
        throw error;
      }

      const backoffMs = 300 * (attempt + 1);
      await new Promise((resolve) => setTimeout(resolve, backoffMs));
      attempt += 1;
    }
  }

  throw new Error('Analysis failed');
}
