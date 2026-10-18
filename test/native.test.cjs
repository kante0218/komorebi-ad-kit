const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { EventEmitter } = require('node:events');
const { isTrustedDestination } = require('../examples/macos/trusted-url.cjs');
const allow = ['reviewed.example'];
assert.equal(isTrustedDestination('https://reviewed.example/path?q=1', allow), true);
for (const url of ['http://reviewed.example', 'https://reviewed.example.evil.test', 'https://reviewed.example@evil.test', 'https://a:b@reviewed.example', 'https://reviewed.example:444', 'javascript:alert(1)', 'file:///tmp/test', 'https://127.0.0.1', 'https://[::1]', 'https://localhost', 'https://app.local', 'https://app.internal']) {
  assert.equal(isTrustedDestination(url, allow.concat(['127.0.0.1', '[::1]', 'localhost', 'app.local', 'app.internal'])), false, url);
}
assert.equal(isTrustedDestination('https://reviewed.example', []), false);
let created;
let timerCallback;
let resolveLoad;
class MockWindow extends EventEmitter {
  constructor(options) {
    super(); this.options = options; this.webContents = new EventEmitter();
    this.webContents.session = { setPermissionRequestHandler: fn => this.permission = fn };
    this.webContents.setWindowOpenHandler = fn => this.popup = fn;
    created = this;
  }
  loadURL(url) { this.url = url; return new Promise(resolve => { resolveLoad = resolve; }); }
  isDestroyed() { return !!this.destroyed; }
  destroy() { this.destroyed = true; this.emit('closed'); }
  showInactive() { this.shown = true; }
}
const sandbox = {
  module: { exports: {} }, URL, encodeURIComponent,
  require: name => name === 'electron' ? { BrowserWindow: MockWindow, shell: { openExternal: () => { throw new Error('Unexpected external open'); } } } : { isTrustedDestination },
  setTimeout: fn => { timerCallback = fn; return 1; }, clearTimeout() {}
};
vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../examples/macos/electron.cjs'), 'utf8'), sandbox);
(async () => {
  const dispose = sandbox.module.exports.showDemoAd({});
  assert.equal(created.options.webPreferences.nodeIntegration, false);
  assert.equal(created.options.webPreferences.sandbox, true);
  assert.equal(created.options.webPreferences.contextIsolation, true);
  assert.equal(created.options.webPreferences.preload, undefined);
  assert.equal(created.popup({ url: 'https://reviewed.example' }).action, 'deny');
  let prevented = false;
  created.webContents.emit('will-navigate', { preventDefault() { prevented = true; } });
  assert.equal(prevented, true);
  prevented = false;
  created.webContents.emit('will-frame-navigate', { url: 'https://evil.example', preventDefault() { prevented = true; } });
  assert.equal(prevented, true);
  prevented = false;
  created.webContents.emit('will-frame-navigate', { url: 'https://komorebi-ad-kit.kante0218.chatgpt.site/demo-ad.html', preventDefault() { prevented = true; } });
  assert.equal(prevented, false, 'reviewed demo frame can load');
  created.permission(null, 'camera', allowed => assert.equal(allowed, false));
  timerCallback();
  assert.equal(created.destroyed, true);
  resolveLoad(); await Promise.resolve(); await Promise.resolve();
  assert.equal(created.shown, undefined, 'late load cannot reopen disposed window');
  dispose();
  sandbox.module.exports.showDemoAd({});
  resolveLoad(); await Promise.resolve(); await Promise.resolve();
  assert.equal(created.shown, true);
  created.webContents.emit('did-fail-load');
  assert.equal(created.destroyed, true);
  console.log('Native URL validation and mocked Electron lifecycle checks passed.');
})().catch(error => { console.error(error); process.exitCode = 1; });
