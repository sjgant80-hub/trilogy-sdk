// ═══════════════════════════════════════════════════════════════
// Deep SDK — Research Intelligence
// ═══════════════════════════════════════════════════════════════

const { BaseClient } = require('./base');

class Deep extends BaseClient {
  /**
   * @param {string} apiKey - Your Deep API key (deep_...)
   * @param {object} [options]
   * @param {string} [options.baseUrl] - API base URL
   * @param {string} [options.depth] - Default depth: 'quick' | 'standard' | 'deep'
   * @param {string} [options.provider] - Default provider
   */
  constructor(apiKey, options = {}) {
    super(apiKey, options.baseUrl || 'https://api.deep-api.io', options);
    this.defaultDepth = options.depth || 'standard';
    this.defaultProvider = options.provider || null;
  }

  /**
   * Run deep research — async with polling
   * @param {string} query - Research question
   * @param {object} [options] - { depth, provider, webhook }
   * @returns {object} { id, poll, stream } — use poll() or stream() to get results
   */
  async research(query, options = {}) {
    const result = await this.post('/v1/research', {
      query,
      depth: options.depth || this.defaultDepth,
      ...(options.provider || this.defaultProvider ? { provider: options.provider || this.defaultProvider } : {}),
      ...(options.webhook && { webhook: options.webhook }),
    });

    // Return enriched result with helper methods
    return {
      ...result,
      /** Poll for results */
      poll: () => this.getResearch(result.id),
      /** Wait for completion with polling */
      wait: (intervalMs) => this.waitForResearch(result.id, intervalMs),
      /** Stream results via SSE */
      stream: (onStep) => this.streamResearch(result.id, onStep),
    };
  }

  /**
   * Quick synchronous research — returns immediately
   * @param {string} query
   * @param {object} [options]
   */
  async quick(query, options = {}) {
    return this.post('/v1/research/quick', {
      query,
      ...(options.provider || this.defaultProvider ? { provider: options.provider || this.defaultProvider } : {}),
    });
  }

  /**
   * Get research task status/results
   * @param {string} taskId
   */
  async getResearch(taskId) {
    return this.get(`/v1/research/${taskId}`);
  }

  /**
   * Wait for research to complete (polling)
   * @param {string} taskId
   * @param {number} [intervalMs=2000]
   * @param {number} [maxWaitMs=300000]
   */
  async waitForResearch(taskId, intervalMs = 2000, maxWaitMs = 300000) {
    const deadline = Date.now() + maxWaitMs;
    while (Date.now() < deadline) {
      const result = await this.getResearch(taskId);
      if (result.status === 'completed') return result;
      if (result.status === 'failed') throw new Error(result.error || 'Research failed');
      await new Promise(r => setTimeout(r, intervalMs));
    }
    throw new Error('Research timed out');
  }

  /**
   * Stream research progress via SSE
   * @param {string} taskId
   * @param {function} onStep - Called with each step event
   * @returns {Promise<object>} Final result
   */
  async streamResearch(taskId, onStep) {
    const res = await this._request('GET', `/v1/research/${taskId}/stream`, null, { stream: true });
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let finalResult = null;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const data = line.slice(6).trim();
        if (data === '[DONE]') break;

        try {
          const event = JSON.parse(data);
          if (event.type === 'result') finalResult = event.result;
          if (onStep) onStep(event);
        } catch {}
      }
    }

    return finalResult;
  }

  /**
   * Fact-check one or more claims
   * @param {string|string[]} claims
   * @param {object} [options]
   */
  async factCheck(claims, options = {}) {
    return this.post('/v1/fact-check', {
      claims,
      ...(options.provider || this.defaultProvider ? { provider: options.provider || this.defaultProvider } : {}),
    });
  }

  /**
   * Compare entities
   * @param {string[]} entities - 2+ entities to compare
   * @param {string[]} [aspects] - Dimensions to compare on
   * @param {object} [options]
   */
  async compare(entities, aspects, options = {}) {
    return this.post('/v1/compare', {
      entities,
      ...(aspects && { aspects }),
      ...(options.provider || this.defaultProvider ? { provider: options.provider || this.defaultProvider } : {}),
    });
  }

  /**
   * Extract structured data from a URL
   * @param {string} url
   * @param {object} [schema] - Custom extraction schema
   * @param {object} [options]
   */
  async extract(url, schema, options = {}) {
    return this.post('/v1/extract', {
      url,
      ...(schema && { schema }),
      ...(options.provider || this.defaultProvider ? { provider: options.provider || this.defaultProvider } : {}),
    });
  }

  async health() { return this.get('/health'); }
}

module.exports = { Deep };
