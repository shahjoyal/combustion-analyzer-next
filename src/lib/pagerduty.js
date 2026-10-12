// src/lib/pagerduty.js
//
// Minimal, privacy-first PagerDuty alerting (Events API v2).
//
// SECURITY MODEL - what PagerDuty receives:
//   * a fixed-format summary  ->  "combustion-analyzer: <failure code> in <component>"
//   * severity, component name, failure code, a fixed source label, dedup key
//
// What is NEVER sent (by construction - callers cannot pass free text):
//   * error messages / stack traces (they can contain DB URIs, file paths, SQL/Mongo details)
//   * request or response bodies, headers, cookies, session ids
//   * user emails / ids / IP addresses
//   * coal data, model data, training data, file contents
//   * internal URLs, hostnames, env vars, or the routing key itself
//
// Alerting must never break the app: every function here is fire-and-forget,
// has a short timeout, swallows its own errors, and is a silent no-op when
// PAGERDUTY_ROUTING_KEY is not configured.

const EVENTS_URL = 'https://events.pagerduty.com/v2/enqueue';
const SOURCE = 'combustion-analyzer'; // fixed label - deliberately not the hostname
const TIMEOUT_MS = 3000;
const THROTTLE_MS = Number(process.env.PAGERDUTY_THROTTLE_MS) || 5 * 60 * 1000;

// Only these failure codes can be reported. Anything else is coerced to 'unknown'.
const ALLOWED_CODES = new Set([
  'route_exception', // a route handler threw
  'http_5xx', // a route returned a 5xx response
  'db_unavailable', // MongoDB connection failed
  'ml_service_unreachable', // Python ML service could not be reached / timed out
  'ml_service_error', // Python ML service answered with a non-OK status
  'training_failed', // a model training run failed
]);
const ALLOWED_SEVERITIES = new Set(['critical', 'error', 'warning', 'info']);

if (!global._pdThrottle) global._pdThrottle = new Map(); // dedupKey -> last sent (ms)
const lastSent = global._pdThrottle;

// Component names are developer-defined route/module labels (e.g. "POST /api/activate-model").
// Strip everything except a conservative character set so nothing unexpected slips through.
function cleanComponent(name) {
  return String(name || 'unknown').replace(/[^A-Za-z0-9 _:\/.\-\[\]]/g, '').slice(0, 80) || 'unknown';
}

/**
 * Report a failure to PagerDuty.
 * @param {{ component: string, code: string, severity?: string }} info
 *   Only these three fields exist on purpose - there is no place to put free text.
 */
export function alertPagerDuty({ component, code, severity = 'error' } = {}) {
  try {
    const routingKey = process.env.PAGERDUTY_ROUTING_KEY;
    if (!routingKey || process.env.PAGERDUTY_ENABLED === 'false') return;

    const safeCode = ALLOWED_CODES.has(code) ? code : 'unknown';
    const safeSeverity = ALLOWED_SEVERITIES.has(severity) ? severity : 'error';
    const safeComponent = cleanComponent(component);
    const dedupKey = `${SOURCE}:${safeComponent}:${safeCode}`;

    // Throttle: one alert per dedup key per window, so a failing endpoint
    // cannot flood PagerDuty (PagerDuty also de-duplicates on dedup_key).
    const now = Date.now();
    const prev = lastSent.get(dedupKey);
    if (prev && now - prev < THROTTLE_MS) return;
    lastSent.set(dedupKey, now);

    const body = {
      routing_key: routingKey,
      event_action: 'trigger',
      dedup_key: dedupKey,
      payload: {
        summary: `${SOURCE}: ${safeCode} in ${safeComponent}`,
        source: SOURCE,
        severity: safeSeverity,
        component: safeComponent,
        class: safeCode,
      },
    };

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    // Intentionally not awaited by callers; errors are swallowed and never logged with details.
    fetch(EVENTS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    })
      .catch(() => {
        // Allow a retry on the next failure if delivery itself failed.
        lastSent.delete(dedupKey);
      })
      .finally(() => clearTimeout(timer));
  } catch {
    // Alerting must never throw into application code.
  }
}
