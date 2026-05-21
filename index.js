// ═══════════════════════════════════════════════════════════════
// trilogy-sdk — The AI API Toolkit
// DocMind (documents) + Deep (research) + Flux (content)
// One install. Three APIs. Ship faster.
// ═══════════════════════════════════════════════════════════════

const { DocMind } = require('./src/docmind');
const { Deep } = require('./src/deep');
const { Flux } = require('./src/flux');
const { TrilogyError, RateLimitError, AuthError } = require('./src/base');

module.exports = {
  // Clients
  DocMind,
  Deep,
  Flux,

  // Errors
  TrilogyError,
  RateLimitError,
  AuthError,

  // Factory — create all three with shared config
  createTrilogy: (keys, options = {}) => ({
    docmind: keys.docmind ? new DocMind(keys.docmind, { ...options, baseUrl: options.docmindUrl || options.baseUrl }) : null,
    deep: keys.deep ? new Deep(keys.deep, { ...options, baseUrl: options.deepUrl || options.baseUrl }) : null,
    flux: keys.flux ? new Flux(keys.flux, { ...options, baseUrl: options.fluxUrl || options.baseUrl }) : null,
  }),
};
