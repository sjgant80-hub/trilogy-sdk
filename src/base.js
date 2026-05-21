// ═══════════════════════════════════════════════════════════════
// Base HTTP client — shared by DocMind, Deep, Flux
// ═══════════════════════════════════════════════════════════════

class TrilogyError extends Error {
  constructor(message, status, body) {
    super(message);
    this.name = 'TrilogyError';
    this.status = status;
    this.body = body;
  }
}

class RateLimitError extends TrilogyError {
  constructor(retryAfter) {
    super('Rate limit exceeded', 429);
    this.name = 'RateLimitError';
    this.retryAfter = retryAfter;
  }
}

class AuthError extends TrilogyError {
  constructor(message) {
    super(message || 'Invalid API key', 401);
    this.name = 'AuthError';
  }
}

class BaseClient {
  constructor(apiKey, baseUrl, options = {}) {
    if (!apiKey) throw new Error('API key is required');
    this.apiKey = apiKey;
    this.baseUrl = baseUrl.replace(/\/+$/, '');
    this.maxRetries = options.maxRetries ?? 3;
    this.timeout = options.timeout ?? 120000;
    this.onRetry = options.onRetry || null;
  }

  async _request(method, path, body, options = {}) {
    const url = `${this.baseUrl}${path}`;
    let lastError;

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), options.timeout || this.timeout);

        const fetchOptions = {
          method,
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
            ...options.headers,
          },
          signal: controller.signal,
        };

        if (body && method !== 'GET') {
          fetchOptions.body = JSON.stringify(body);
        }

        const res = await fetch(url, fetchOptions);
        clearTimeout(timer);

        if (res.status === 401 || res.status === 403) {
          throw new AuthError((await res.json().catch(() => ({}))).error);
        }

        if (res.status === 429) {
          const retryAfter = parseInt(res.headers.get('retry-after')) || (2 ** attempt * 1000);
          if (attempt < this.maxRetries) {
            if (this.onRetry) this.onRetry(attempt + 1, retryAfter);
            await sleep(retryAfter);
            continue;
          }
          throw new RateLimitError(retryAfter);
        }

        if (res.status >= 500 && attempt < this.maxRetries) {
          if (this.onRetry) this.onRetry(attempt + 1, 2 ** attempt * 1000);
          await sleep(2 ** attempt * 1000);
          continue;
        }

        if (!res.ok) {
          const errBody = await res.json().catch(() => ({}));
          throw new TrilogyError(errBody.error || `HTTP ${res.status}`, res.status, errBody);
        }

        // SSE streaming
        if (options.stream) {
          return res;
        }

        return await res.json();

      } catch (err) {
        if (err instanceof TrilogyError) throw err;
        if (err.name === 'AbortError') {
          throw new TrilogyError('Request timed out', 408);
        }
        lastError = err;
        if (attempt < this.maxRetries) {
          if (this.onRetry) this.onRetry(attempt + 1, 2 ** attempt * 1000);
          await sleep(2 ** attempt * 1000);
        }
      }
    }

    throw lastError || new TrilogyError('Request failed after retries');
  }

  get(path, options) { return this._request('GET', path, null, options); }
  post(path, body, options) { return this._request('POST', path, body, options); }
  del(path, options) { return this._request('DELETE', path, null, options); }
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

module.exports = { BaseClient, TrilogyError, RateLimitError, AuthError };
