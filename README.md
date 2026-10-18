# Komorebi 埋め込みキット

Komorebi は仮称です。個人開発サイトに広告枠を置くための、依存パッケージ不要の試験版です。実際の広告課金・振込は提供していません。試験計測と未確定収益は、支払われる売上ではありません。

## 導入

このフォルダは単独で配布できます。LP の SDK ZIP をダウンロードして展開し、`embed.js` を自分の静的サイトに配置できます。GitHub 公開後は「Code → Download ZIP」でも取得できます。公開先の URL はサービス側が用意した値を使ってください。以下の `https://YOUR_SERVICE.example` は置換用です。

```html
<script async src="https://YOUR_SERVICE.example/sdk/embed.js"
  data-slot="demo_card" data-size="card" data-demo="true"></script>
```

自分のサーバーから SDK を配信する場合は、広告サービスの接続先を明示します。

```html
<script async src="/assets/embed.js"
  data-endpoint="https://YOUR_SERVICE.example"
  data-slot="demo_card" data-size="card" data-demo="true"></script>
```

- `data-slot`: 発行された枠 ID。英数字・`_`・`-` の 3〜64 文字です。
- `data-size`: `banner`（728×90）、`card`（300×250）、`mobile`（320×100）。既定は `card`。
- `data-endpoint`: 広告サービスのオリジン。省略時は SDK 配信元。HTTPS 必須、ローカル開発のみ HTTP 可。パスは使用しません。
- `data-demo`: 既定は `true`。静的な `/demo-ad.html` を表示し、イベントを送信しません。
- 配置はタグを置いた場所です。親要素の幅に合わせ、指定サイズを上限に縦横比を維持します。

React は `examples/AdSlot.jsx` をコピーします。props の変更とアンマウントで以前の広告枠を破棄します。React 自体は利用先で必要です。

```jsx
<AdSlot slotId="demo_card" size="card"
  endpoint="https://YOUR_SERVICE.example" embedPath="/sdk/embed.js" demo={true} />
```

## ローカルで試す

展開した SDK フォルダで次を実行します。サービスへの接続は不要です。

```sh
python3 -m http.server 8080
```

`http://localhost:8080/examples/vanilla.html` を開くと、同梱の `demo-ad.html` を使って 3 サイズを確認できます。自分の HTML に貼る最小例はこちらです。

```html
<script async src="http://localhost:8080/embed.js"
  data-endpoint="http://localhost:8080"
  data-slot="demo_card" data-size="card" data-demo="true"></script>
```

ローカルサンプルは HTTP サーバー経由で開いてください。React でも `endpoint="http://localhost:8080"` と `demo={true}` で同じ試験表示を使えます。

`data-demo="false"` は `/ad` に接続します。サーバー側の枠・サイト所有確認・広告と遷移先の審査が完了した試験配信だけに使用してください。SDK には計測キーや管理権限を含めません。試験イベントはサーバーが発行・検証するトークンで処理され、SDK から回数や収益を確定できません。実計測モードでは設置ページの `location.origin` をサーバーに送り、確認済みサイトとの一致を検証します。HTTP(S) ページ以外では動作しません。この申告値は偽装可能なため、所有確認や完全な不正防止の代わりにはなりません。

## 安全性と制限

広告は `sandbox` 付き iframe に隔離し、`allow-same-origin` を付与しません。参照元ヘッダーを送らず、広告側から親ページ DOM を操作できません。遷移先を開くためのポップアップは許可します。広告ラベル、CSP、遷移先 URL 審査、署名・重複排除・レート制限・予算管理は広告サーバー側の責務です。SDK だけでこれらを実現したり、完全な不正防止を保証したりするものではありません。

設置サイトの CSP では、サービスのオリジンを `script-src` と `frame-src` で許可してください。スタイル属性を厳格に禁止する CSP では、この SDK のレイアウトが制限される場合があります。サイト側の既存 CSP を一括で緩和せず、運用方針に合わせてスタイルを外部 CSS に移してください。

広告ブロッカー・接続失敗・未承認枠では広告が表示されない場合があります。読み込み失敗でもサイトの本文は表示されます。iframe の中身の文字サイズは自動拡大しないため、狭い画面では `mobile` を選んでください。個人情報・銀行口座・本人確認情報の入力は不要です。

## 検証とライセンス

`node test/embed.test.cjs` で URL・入力検証・隔離設定・試験モードを確認できます。MIT License。ライセンス本文は `LICENSE` を参照してください。
