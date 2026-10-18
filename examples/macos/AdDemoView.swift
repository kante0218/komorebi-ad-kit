import AppKit
import WebKit

// Add to an existing macOS app target. Web demo only: no live native token protocol.
final class AdDemoView: NSView, WKNavigationDelegate, WKUIDelegate {
    private let service = URL(string: "https://komorebi-ad-kit.kante0218.chatgpt.site")!
    // Reviewed exact hostnames only. Empty means all outbound destinations are denied.
    private let trustedDestinations: Set<String> = []
    private var webView: WKWebView?
    private var timeout: DispatchWorkItem?

    override init(frame: NSRect) {
        super.init(frame: frame)
        let configuration = WKWebViewConfiguration()
        configuration.websiteDataStore = .nonPersistent()
        configuration.preferences.javaScriptCanOpenWindowsAutomatically = false
        let web = WKWebView(frame: bounds, configuration: configuration)
        web.autoresizingMask = [.width, .height]
        web.navigationDelegate = self
        web.uiDelegate = self
        addSubview(web)
        webView = web
        let html = """
        <!doctype html><html lang="ja"><meta charset="utf-8">
        <meta http-equiv="Content-Security-Policy" content="default-src 'none'; frame-src https://komorebi-ad-kit.kante0218.chatgpt.site; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'">
        <style>html,body{margin:0;height:100%}iframe{width:100%;height:100%;border:0}</style>
        <iframe title="広告の試験表示（計測なし）" sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox" referrerpolicy="no-referrer" src="https://komorebi-ad-kit.kante0218.chatgpt.site/demo-ad.html?slot=demo_macos&amp;size=mobile"></iframe>
        </html>
        """
        let task = DispatchWorkItem { [weak self] in self?.dispose() }
        timeout = task
        DispatchQueue.main.asyncAfter(deadline: .now() + 5, execute: task)
        web.loadHTMLString(html, baseURL: nil)
    }
    required init?(coder: NSCoder) { fatalError("Use init(frame:)") }
    func dispose() {
        timeout?.cancel()
        timeout = nil
        webView?.stopLoading()
        webView?.navigationDelegate = nil
        webView?.uiDelegate = nil
        webView?.removeFromSuperview()
        webView = nil
        isHidden = true
    }
    private func openReviewedDestination(_ url: URL) {
        guard url.scheme == "https", url.user == nil, url.password == nil,
              url.port == nil || url.port == 443, let host = url.host?.lowercased(),
              !host.contains(":"), !host.hasSuffix(".local"), !host.hasSuffix(".internal"),
              host != "localhost", !host.hasSuffix(".localhost"),
              host.range(of: "^[0-9.]+$", options: .regularExpression) == nil,
              trustedDestinations.contains(host) else { return }
        NSWorkspace.shared.open(url)
    }
    func webView(_ webView: WKWebView, decidePolicyFor action: WKNavigationAction,
                 decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
        guard let url = action.request.url else { decisionHandler(.cancel); return }
        if action.navigationType == .linkActivated || action.targetFrame == nil {
            openReviewedDestination(url)
            decisionHandler(.cancel)
            return
        }
        let isDemoFrame = action.targetFrame?.isMainFrame == false &&
            url.scheme == service.scheme && url.host == service.host &&
            url.path == "/demo-ad.html" && url.user == nil && url.password == nil && url.port == nil
        decisionHandler(url.absoluteString == "about:blank" || isDemoFrame ? .allow : .cancel)
    }
    func webView(_ webView: WKWebView, createWebViewWith configuration: WKWebViewConfiguration,
                 for action: WKNavigationAction, windowFeatures: WKWindowFeatures) -> WKWebView? {
        if let url = action.request.url { openReviewedDestination(url) }
        return nil
    }
    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        // Outer HTML loaded; iframe delivery is not a verified impression.
        timeout?.cancel()
        timeout = nil
    }
    func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) { dispose() }
    func webView(_ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!, withError error: Error) { dispose() }
    func webViewWebContentProcessDidTerminate(_ webView: WKWebView) { dispose() }
    deinit { timeout?.cancel() }
}
