# セキュリティ設定

## API保護の実装

このAPIは以下の方法で許可されたオリジンからのアクセスのみを受け付けます：

### 1. CORS設定
- CORS設定は環境変数 `CORS_ALLOWED_ORIGINS` で管理
- 開発環境: `.dev.vars` ファイルで設定（例: `http://localhost:4321`）
- 本番環境: `wrangler.jsonc` の `vars` セクションで設定（`https://vecta.co.jp,https://www.vecta.co.jp`）
- 未設定の場合はすべてのオリジンを拒否

### 2. APIキー認証
- リクエストヘッダーに`X-API-Key`を含める必要があります
- APIキーはCloudflare Workersのシークレットとして保存
- **例外**: POST /contacts エンドポイントは認証不要（お問い合わせフォーム用）

### 3. Refererチェック（オプション）
- 環境変数 `ALLOWED_REFERERS` で許可するRefererを設定可能
- カンマ区切りで複数のRefererを指定可能
- 未設定の場合はすべてのリクエストを拒否
- refererCheckミドルウェアを使用して追加のセキュリティ層として実装

### 4. 環境変数の設定

#### 開発環境（.dev.vars）
```
API_KEY=your-development-api-key
ENVIRONMENT=development
CORS_ALLOWED_ORIGINS=http://localhost:4321
ALLOWED_REFERERS=http://localhost:4321/
```

#### 本番環境
```bash
# APIキーをシークレットとして設定
bun wrangler secret put API_KEY
# プロンプトで本番用のAPIキーを入力
```

### 5. フロントエンドでの実装例

```javascript
// フロントエンド側の実装
const API_BASE_URL = 'https://api.vecta.co.jp'
const API_KEY = process.env.NEXT_PUBLIC_API_KEY // 環境変数から取得

// お問い合わせフォーム送信（認証不要）
async function submitContact(contactData) {
  const response = await fetch(`${API_BASE_URL}/contacts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(contactData)
  })
  
  if (!response.ok) {
    throw new Error('API request failed')
  }
  
  return response.json()
}

// お問い合わせ一覧取得（認証必要）
async function fetchContacts() {
  const response = await fetch(`${API_BASE_URL}/contacts`, {
    headers: {
      'X-API-Key': API_KEY,
      'Content-Type': 'application/json'
    }
  })
  
  if (!response.ok) {
    throw new Error('API request failed')
  }
  
  return response.json()
}
```


