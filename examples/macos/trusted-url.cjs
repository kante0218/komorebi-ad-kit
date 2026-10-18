'use strict';
function isTrustedDestination(value, allowedHosts) {
  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase();
    if (url.protocol !== 'https:' || url.username || url.password || (url.port && url.port !== '443')) return false;
    if (host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.local') || host.endsWith('.internal') || host.includes(':') || /^\[|^\d+(\.\d+){3}$/.test(host)) return false;
    return allowedHosts.includes(host);
  } catch (_) { return false; }
}
module.exports = { isTrustedDestination };
