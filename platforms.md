# macOS アプリへの導入方針

対象は、Mac にインストールして起動するアプリです。DMG は配布用コンテナーであり、広告を表示する場所ではありません。既存のアプリや Aqua のコードには変更を加えていません。

## 今使えるもの

`examples/macos/AdDemoView.swift` は既存の AppKit アプリに追加する WKWebView の例です。`AdDemoView(frame:)` を任意の枠に配置し、画面を閉じるときに `dispose()` を呼びます。メインスレッドで使用してください。SwiftUI の場合は利用先で NSViewRepresentable からラップします。

`examples/macos/electron.cjs` は既存 Electron アプリの main process から `showDemoAd(mainWindow)` を呼ぶ例です。戻り値の関数を画面破棄時に呼びます。追加で `trusted-url.cjs` を同じフォルダに配置します。Electron 自体とアプリのビルド設定は配布キットに含めません。main process の require はホスト側だけで実行し、広告コンテンツには公開しません。

どちらも Web の静的デモだけを表示します。サービス URL は `https://komorebi-ad-kit.kante0218.chatgpt.site` を設定していますが、この説明は公開完了や稼働を保証しません。接続できなくてもアプリ本体の起動・操作を待たせないでください。初期ページ読み込みは 5 秒で打ち切り、読み込み失敗・プロセス終了では枠を閉じます。外側 HTML の読み込み成功だけで広告の到達・可視状態は判断できないため、iframe が空欄になる場合があります。空欄でもアプリ本体は使用でき、実表示として計上しません。

## 隔離とリンク

- WKWebView は非永続データストアを使い、script message handler や任意 JS 実行 API を追加しません。
- Electron は `nodeIntegration: false`、`contextIsolation: true`、`sandbox: true`、`webSecurity: true`。preload とネイティブブリッジはありません。広告用に非永続 session partition を分け、権限要求を拒否します。
- 広告は `allow-same-origin` なしの sandbox iframe に表示します。CSP はデモ配信オリジンだけを frame-src に許可します。
- アプリ内のリンク遷移と新規 WebView/window の作成を拒否します。審査済みの HTTPS ホスト完全一致 allowlist にある URL だけ、OS の外部ブラウザーへ渡します。既定の allowlist は空です。認証情報付き URL、IP アドレス、localhost、local/internal ホスト、443 以外のポートは拒否します。
- allowlist にワイルドカードを入れたり、広告主が申告したホストを自動追加したりしないでください。許可先は公開 DNS と遷移先を手動審査します。許可先サイトの後続リダイレクトや DNS の変化まで、この例では監視できません。

## ネイティブ実配信は未提供

ネイティブ用の署名トークン・SDK 認証プロトコルは未実装です。macOS の例を `/ad` に変更して実配信してはいけません。Web の origin 申告をアプリの所有証明に転用しません。公開 `slotID` や `appID`、bundle ID は秘密ではなく、それだけでは所有確認になりません。広告の実課金、振込、銀行口座や本人確認情報の収集は無効です。

今後の最小設計は次のとおりです。これらは仕様案で、現時点の提供機能ではありません。

| 対象 | 手動審査・所有確認 | 広告枠 |
| --- | --- | --- |
| Web | ドメイン上の確認ファイルまたは DNS と運営者の審査 | `platform=web` と確認済み origin |
| macOS | 公開配布ページ・開発者連絡先・署名済みアプリの Team ID/bundle ID と配布権限の確認。bundle ID 文字列だけで承認しない | `platform=macos`、審査済み appID、bundle ID、枠 ID |

媒体主の申請は Web とアプリを区別して管理者が審査します。広告主と広告素材・遷移先も別途審査し、承認済みの組み合わせだけに試験配信を許可します。秘密鍵や管理 API キーを配布キットに入れません。将来の実配信ではサーバーで短時間・枠限定の署名トークンを発行し、nonce・有効期限・イベント種別を検証します。クライアントの申告だけでは不正防止になりません。

共通のイベント設計案は `eventID`、サーバー発行 nonce、`slotID`、`platform`、承認済み publisher/app ID、campaign ID、表示またはクリックの種別、サーバー受信時刻です。可視状態やユーザー操作は参考情報として扱い、サーバー側の署名検証、重複排除、レート制限、自己クリック除外、予算上限を通ったイベントだけを試験集計します。CPC または CPM のどちらか一方だけをキャンペーンに設定し、同じイベントを二重課金しません。完全な不正防止は保証できず、試験集計・未確定収益・支払確定額を分離します。

## 確認範囲

`node test/native.test.cjs` は外部 URL の判定と Electron の破棄処理をモックで検証します。Swift は `swiftc -parse examples/macos/AdDemoView.swift` で構文確認します。macOS アプリへの組み込み・署名・App Store 審査・Electron 実ランタイム・WKWebView 実機表示は未検証です。これらは利用先アプリで確認が必要です。

Electron のイベント形式は [公式 webContents ドキュメント](https://www.electronjs.org/docs/latest/api/web-contents#event-will-frame-navigate) の単一 details Event 引数に合わせています。利用先の Electron バージョンでも確認してください。

## 同意と配布経路

広告・計測の目的と取得項目を利用者に説明し、必要な同意が得られるまで計測を開始しない設計が必要です。初日のネイティブ例は計測しません。端末固有ID、指紋、広告ID、ユーザーのファイルや銀行情報は取得しません。DMG直接配布とApp Store配布では適用される広告・プライバシー・トラッキング・外部遷移の規約をそれぞれ確認してください。App Storeの承認や規約適合を保証する例ではありません。
