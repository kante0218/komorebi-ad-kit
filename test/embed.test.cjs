const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync(require('node:path').join(__dirname, '../embed.js'), 'utf8');
function run(dataset = {}, src = 'https://ads.example/sdk/embed.js', origin = 'https://publisher.example') {
  const inserted = [];
  const script = { dataset: { slot: 'demo_card', ...dataset }, src, parentNode: { insertBefore: e => inserted.push(e) } };
  const document = { currentScript: script, createElement: tag => ({ tag, style: {}, attrs: {}, children: [], setAttribute(k, v) { this.attrs[k] = v; }, appendChild(e) { this.children.push(e); } }) };
  const context = { document, URL, location: { origin }, console: { warn() {} } };
  vm.runInNewContext(source, context);
  return { inserted, script, context };
}
const demo = run();
assert.equal(demo.inserted.length, 1);
const frame = demo.inserted[0].children[0];
assert.equal(frame.src, 'https://ads.example/demo-ad.html?slot=demo_card&size=card');
assert.equal(frame.attrs.referrerpolicy, 'no-referrer');
assert.equal(frame.attrs.sandbox, 'allow-scripts allow-popups allow-popups-to-escape-sandbox');
assert.equal(frame.attrs.width, '300');
assert.equal(frame.attrs.height, '250');
assert.ok(!frame.attrs.sandbox.includes('allow-same-origin'));
vm.runInNewContext(source, demo.context);
assert.equal(demo.inserted.length, 1, 'duplicate execution is ignored');
assert.equal(run({ demo: 'false', size: 'banner' }).inserted[0].children[0].src, 'https://ads.example/ad?slot=demo_card&size=banner&origin=https%3A%2F%2Fpublisher.example');
assert.equal(run({ endpoint: 'http://localhost:3000', size: 'mobile' }).inserted[0].children[0].attrs.width, '320');
for (const dataset of [{ slot: '<script>' }, { slot: '' }, { slot: 'a'.repeat(65) }, { size: 'bad' }, { size: 'constructor' }, { size: '__proto__' }, { endpoint: 'javascript:alert(1)' }, { endpoint: 'https://a:b@example.com' }, { endpoint: 'http://ads.example' }]) {
  assert.equal(run(dataset).inserted.length, 0, JSON.stringify(dataset));
}
assert.equal(run({ endpoint: 'https://service.example/path' }).inserted[0].children[0].src, 'https://service.example/demo-ad.html?slot=demo_card&size=card');
console.log('SDK checks passed (default demo, live URL, three sizes, sandbox, invalid input, HTTPS, duplicate execution).');

assert.equal(run({ demo: 'false' }, undefined, 'null').inserted.length, 0);
