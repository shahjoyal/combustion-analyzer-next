// src/lib/withAlerts.js
//
// Wraps a Next.js route handler so that failures are reported to PagerDuty
// with minimal, non-sensitive information (see pagerduty.js).
//
//   * handler throws            -> alert "route_exception", then rethrow (Next returns 500 as before)
//   * handler returns HTTP 5xx  -> alert "http_5xx"
//
// The wrapper never reads or forwards the request, the response body or the error message.

import { alertPagerDuty } from '@/lib/pagerduty';

export function withAlerts(component, handler) {
  return async function wrapped(...args) {
    let response;
    try {
      response = await handler(...args);
    } catch (err) {
      alertPagerDuty({ component, code: 'route_exception', severity: 'error' });
      throw err;
    }
    if (response && typeof response.status === 'number' && response.status >= 500) {
      alertPagerDuty({ component, code: 'http_5xx', severity: 'error' });
    }
    return response;
  };
}
