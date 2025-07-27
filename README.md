# BizCard - デジタル名刺システム

ECDSA P-521署名を使用して、特定の時刻・場所での存在を証明するデジタル名刺システムです。

## 特徴

- **🔐 強力な暗号化**: ECDSA P-521楕円曲線暗号による高セキュリティ署名
- **📍 位置証明**: GPS位置情報とタイムスタンプによる存在証明
- **🌐 Web標準**: Web Crypto APIによるブラウザ内暗号化処理
- **⚡ 高速**: SvelteKitによる軽量・高速なWebアプリケーション

## 技術スタック

- **フレームワーク**: SvelteKit
- **署名アルゴリズム**: ECDSA P-521
- **暗号化**: Web Crypto API
- **スタイリング**: TailwindCSS
- **ランタイム**: Bun

## セットアップ

### 1. 依存関係のインストール

```bash
bun install
```

### 2. 開発サーバーの起動

```bash
bun run dev
```

### 3. 本番ビルド

```bash
bun run build
```

## 使用方法

### 1. 鍵ペアの準備

ECDSA P-521鍵ペアを用意する必要があります。OpenSSLを使用してPKCS#8形式の鍵ペアを生成してください：

```bash
# 1. EC秘密鍵を生成
openssl ecparam -genkey -name secp521r1 -noout -out private_ec.pem

# 2. PKCS#8形式に変換（このアプリケーションで使用可能）
openssl pkcs8 -topk8 -inform PEM -outform PEM -nocrypt -in private_ec.pem -out private_key.pem

# 3. 公開鍵を抽出
openssl ec -in private_ec.pem -pubout -out public_key.pem

# 4. 不要なEC形式のファイルを削除
rm private_ec.pem
```

**重要**: このアプリケーションはPKCS#8形式の秘密鍵のみをサポートしています。必ず `-pkcs8` オプションを使用してPKCS#8形式に変換してください。

### 2. 設定ファイルの配置

生成した公開鍵を `config/pubkey.pem` に配置してください。

生成された公開鍵を`static/config/pubkey.pem`に保存してください。

### 3. 名刺の生成と検証

1. **名刺生成**: `/card` ページで秘密鍵ファイルをアップロードし、現在位置でデジタル名刺を生成
2. **署名検証**: `/verify` ページで名刺の署名を検証し、真正性を確認

## ファイル構造

```
/
├── src/
│   ├── lib/
│   │   ├── crypto.ts      # 暗号化ユーティリティ
│   │   └── keygen.ts      # 鍵生成ユーティリティ
│   └── routes/
│       ├── +layout.svelte # 共通レイアウト
│       ├── +page.svelte   # ホームページ
│       ├── card/
│       │   ├── +page.server.ts # 名刺生成API
│       │   └── +page.svelte     # 名刺生成UI
│       └── verify/
│           ├── +page.server.ts # 署名検証API
│           └── +page.svelte     # 署名検証UI
├── static/
│   └── config/
│       ├── message.json   # 署名メッセージ設定
│       └── pubkey.pem     # 公開鍵（あなたが設定）
└── config/
    ├── message.json       # オリジナル設定ファイル
    └── pubkey.pem         # オリジナル公開鍵
```

## セキュリティについて

⚠️ **重要**: このアプリケーションは概念実証（PoC）として作成されています。

- 秘密鍵はブラウザのローカルストレージに保存されます
- 本番環境では適切な鍵管理システムを実装してください
- HTTPS環境での使用を強く推奨します
- Web Crypto APIはSecure Context（HTTPS/localhost）でのみ動作します

## 設定

### 公開鍵の設定

生成した公開鍵を`static/config/pubkey.pem`に配置してください。

## API エンドポイント

### GET /card
名刺生成用のメッセージを取得

### GET /verify  
署名検証用の公開鍵とメッセージを取得

## 署名フォーマット

署名されるペイロードの形式：

```json
{
  "latitude": 35.689,
  "longitude": 139.692,
  "timestamp": "2025-07-27T10:10:15.000Z",
  "message": "mersnn621"
}
```

- **latitude**: 緯度（小数点以下3桁）
- **longitude**: 経度（小数点以下3桁）  
- **timestamp**: ISO 8601形式のUTCタイムスタンプ
- **message**: 設定ファイルで定義されたメッセージ
