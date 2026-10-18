// Requires an existing Electron app. No runtime dependency is bundled in the kit.
const { BrowserWindow, shell } = require('electron');
const { isTrustedDestination } = require('./trusted-url.cjs');

const SERVICE = 'https://komorebi-ad-kit.kante0218.chatgpt.site';
// Replace only after destination review. The empty list disables all outbound links.
const TRUSTED_DESTINATIONS = [];

function showDemoAd(parent) {
  const ad = new BrowserWindow({
    parent, show: false, width: 340, height: 140, resizable: false,
    title: '広告の試験表示（計測なし）',
    webPreferences: { nodeIntegration: false, contextIsolation: true, sandbox: true, webSecurity: true, partition: 'komorebi-ad-demo' }
  });
  let closed = false;
  let timer;
  const close = () => {
    if (closed) return;
    closed = true;
    clearTimeout(timer);
    if (!ad.isDestroyed()) ad.destroy();
  };
  ad.on('closed', () => { closed = true; clearTimeout(timer); });
  ad.webContents.on('will-navigate', event => event.preventDefault());
  const guardFrameNavigation = event => {
    try {
      const url = new URL(event.url);
      if (url.origin !== SERVICE || url.pathname !== '/demo-ad.html' || url.username || url.password) event.preventDefault();
    } catch (_) { event.preventDefault(); }
  };
  ad.webContents.on('will-frame-navigate', guardFrameNavigation);
  ad.webContents.on('will-redirect', guardFrameNavigation);
  ad.webContents.setWindowOpenHandler(({ url }) => {
    if (isTrustedDestination(url, TRUSTED_DESTINATIONS)) shell.openExternal(url).catch(() => {});
    return { action: 'deny' };
  });
  ad.webContents.session.setPermissionRequestHandler((_contents, _permission, callback) => callback(false));
  ad.webContents.on('did-fail-load', close);
  ad.webContents.on('render-process-gone', close);
  timer = setTimeout(close, 5000);
  // Remote HTML executes only inside the sandboxed frame. No preload or JS bridge.
  const html = `<!doctype html><html lang="ja"><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; frame-src ${SERVICE}; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'"><title>広告の試験表示</title><style>html,body{margin:0;height:100%}iframe{width:100%;height:100%;border:0}</style><iframe title="広告の試験表示（計測なし）" sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox" referrerpolicy="no-referrer" src="${SERVICE}/demo-ad.html?slot=demo_macos&amp;size=mobile"></iframe></html>`;
  ad.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(html)).then(() => {
    // A loaded outer frame does not prove ad delivery. The demo window is optional.
    if (!closed) { clearTimeout(timer); ad.showInactive(); }
  }).catch(close);
  return close;
}
module.exports = { showDemoAd };
// In your existing app, after ready: const dispose = showDemoAd(mainWindow);
// Call dispose when the host screen closes. Do not wait for ads to start the app.
