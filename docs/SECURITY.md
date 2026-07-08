# セキュリティ設定

## API保護の実装

このAPIは以下の方法で許可されたオリジンからのアクセスのみを受け付けます：

### 1. CORS設定
- CORS設定は環境変数 `CORS_ALLOWED_ORIGINS` で管理
- 開発環境: `.dev.vars` ファイルで設定（例: `http://localhost:4321`）
- 本番環境: `wrangler.jsonc` の `vars` セクションで設定（`https://vecta.co.jp,https://www.vecta.co.jp`）
- 未設定の場合はすべてのオリジンを拒否
- 管理系 API 用の credential 付き CORS は `ADMIN_CORS_ALLOWED_ORIGINS` で管理

### 2. APIキー認証
- リクエストヘッダーに`X-API-Key`を含める必要があります
- APIキーはCloudflare Workersのシークレットとして保存
- **例外**: POST /contacts エンドポイントは認証不要（お問い合わせフォーム用）

### 3. Cloudflare Access JWT 認証

`/admin/*` は `vecta-admin` 向けの管理系 API です。Cloudflare Access が付与する `Cf-Access-Jwt-Assertion` を backend 側で検証します。

対象:

| Endpoint | 認証 |
| --- | --- |
| `GET /admin/leads` | Cloudflare Access JWT |
| `GET /admin/leads/:leadId` | Cloudflare Access JWT |

必要な設定:

| 変数 | 用途 |
| --- | --- |
| `ACCESS_TEAM_DOMAIN` | Cloudflare Access team domain |
| `ACCESS_POLICY_AUD` | Access application / policy の AUD tag |
| `ADMIN_CORS_ALLOWED_ORIGINS` | `vecta-admin` の origin。credential 付き fetch を許可する |
| `ACCESS_JWKS_URL` | 任意。JWKS endpoint を上書きする場合のみ設定 |

`vecta-admin` のブラウザコードには `X-API-Key`、Cloudflare API token、D1 認証情報を入れないでください。

### 4. Refererチェック（オプション）
- 環境変数 `ALLOWED_REFERERS` で許可するRefererを設定可能
- カンマ区切りで複数のRefererを指定可能
- 未設定の場合はすべてのリクエストを拒否
- refererCheckミドルウェアを使用して追加のセキュリティ層として実装

### 5. 環境変数の設定

#### 開発環境（.dev.vars）
```
API_KEY=your-development-api-key
ENVIRONMENT=development
CORS_ALLOWED_ORIGINS=http://localhost:4321
ADMIN_CORS_ALLOWED_ORIGINS=http://localhost:5177
ALLOWED_REFERERS=http://localhost:4321/
ACCESS_TEAM_DOMAIN=example.cloudflareaccess.com
ACCESS_POLICY_AUD=your-access-policy-aud
```

#### 本番環境
```bash
# APIキーをシークレットとして設定
bun wrangler secret put API_KEY
# プロンプトで本番用のAPIキーを入力
```

Cloudflare Access 用の値は、production の deployment 環境変数または Worker secret として設定してください。実値は repository に保存しません。

### 6. 公開フォームの実装例

```javascript
const API_BASE_URL = 'https://api.vecta.co.jp'

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
```

