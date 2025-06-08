# セキュリティ設定

## API保護の実装

このAPIは以下の方法でvecta.co.jpからのアクセスのみを許可します：

### 1. CORS設定
- 許可されたオリジン: `https://vecta.co.jp`, `https://www.vecta.co.jp`
- 開発環境では`http://localhost:3000`も許可

### 2. APIキー認証
- リクエストヘッダーに`X-API-Key`を含める必要があります
- APIキーはCloudflare Workersのシークレットとして保存

### 3. 環境変数の設定

#### 開発環境（.dev.vars）
```
API_KEY=your-development-api-key
ENVIRONMENT=development
```

#### 本番環境
```bash
# APIキーをシークレットとして設定
bun wrangler secret put API_KEY
# プロンプトで本番用のAPIキーを入力
```

### 4. フロントエンドでの実装例

```javascript
// フロントエンド側の実装
const API_BASE_URL = 'https://api.vecta.co.jp'
const API_KEY = process.env.NEXT_PUBLIC_API_KEY // 環境変数から取得

async function fetchTasks() {
  const response = await fetch(`${API_BASE_URL}/tasks`, {
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


