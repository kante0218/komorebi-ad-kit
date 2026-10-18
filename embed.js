/* Komorebi (working name) embed SDK — MIT License. */
(function () {
  'use strict';
  var script = document.currentScript;
  if (!script || script.dataset.komorebiMounted) return;
  var slot = script.dataset.slot || '';
  var sizes = { banner: [728, 90], card: [300, 250], mobile: [320, 100] };
  var size = script.dataset.size || 'card';
  if (!/^[a-zA-Z0-9_-]{3,64}$/.test(slot) || !Object.prototype.hasOwnProperty.call(sizes, size)) {
    console.warn('[Komorebi] Invalid slot or size.');
    return;
  }
  var endpoint;
  try {
    endpoint = new URL(script.dataset.endpoint || new URL(script.src).origin);
    if (!/^https?:$/.test(endpoint.protocol) || endpoint.username || endpoint.password) throw new Error('Invalid endpoint');
    if (endpoint.protocol !== 'https:' && !['localhost', '127.0.0.1', '[::1]'].includes(endpoint.hostname)) throw new Error('HTTPS required');
  } catch (_) {
    console.warn('[Komorebi] A valid HTTPS endpoint is required.');
    return;
  }
  var demo = script.dataset.demo !== 'false';
  var source = new URL(demo ? '/demo-ad.html' : '/ad', endpoint.origin);
  source.searchParams.set('slot', slot);
  source.searchParams.set('size', size);
  if (!demo) {
    try {
      var publisher = new URL(location.origin);
      if (!/^https?:$/.test(publisher.protocol)) throw new Error('Invalid publisher origin');
      source.searchParams.set('origin', publisher.origin);
    } catch (_) {
      console.warn('[Komorebi] Real trial requires an HTTP(S) publisher page.');
      return;
    }
  }
  var dimensions = sizes[size];
  var container = document.createElement('div');
  container.setAttribute('data-komorebi-slot', slot);
  container.style.cssText = 'position:relative;width:100%;max-width:' + dimensions[0] + 'px;aspect-ratio:' + dimensions[0] + '/' + dimensions[1] + ';overflow:hidden;';
  var frame = document.createElement('iframe');
  frame.title = demo ? '広告の試験表示（計測なし）' : '広告';
  frame.setAttribute('sandbox', 'allow-scripts allow-popups allow-popups-to-escape-sandbox');
  frame.setAttribute('referrerpolicy', 'no-referrer');
  frame.setAttribute('loading', 'lazy');
  frame.setAttribute('width', String(dimensions[0]));
  frame.setAttribute('height', String(dimensions[1]));
  frame.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;border:0;display:block;';
  frame.src = source.href;
  container.appendChild(frame);
  script.parentNode.insertBefore(container, script);
  script.dataset.komorebiMounted = 'true';
})();
