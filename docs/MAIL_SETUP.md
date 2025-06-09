# メール送信機能の設定手順

このドキュメントでは、お問い合わせフォームから送信されたデータをメールで通知する機能の設定方法を説明します。

## 概要

本システムでは、SendGrid APIを使用してメール送信を行います。お問い合わせが投稿されると、指定されたメールアドレスに通知メールが自動送信されます。

### 特徴

- **高い配信性能**：SendGridのインフラを利用した確実なメール配信
- **Reply-Toヘッダー対応**：お問い合わせ者のメールアドレスがReply-Toに設定されるため、Google Workspaceのメールクライアントから直接返信が可能です。
- **ローカル環境でもテスト可能**：SendGrid APIはローカル環境からも利用可能

## 必要な設定

### 1. SendGridアカウントの作成

1. [SendGrid](https://sendgrid.com/)にアクセスし、アカウントを作成
2. ダッシュボードから「Settings」→「API Keys」にアクセス
3. 「Create API Key」をクリック
4. API Key Nameを入力（例：「Vecta Backend」）
5. 「Full Access」または「Restricted Access」で「Mail Send」権限を付与
6. 生成されたAPIキーを安全に保管

### 2. Sender Authenticationの設定

1. SendGridダッシュボードから「Settings」→「Sender Authentication」
2. 「Domain Authentication」を設定（推奨）または「Single Sender Verification」を実施
3. 送信元メールアドレス（`noreply@vecta.co.jp`）を承認

### 3. 環境変数の設定

以下の環境変数を設定する必要があります：

- `SENDGRID_API_KEY`: SendGridのAPIキー（Secretとして設定）
- `MAIL_FROM`: 送信元メールアドレス（例: `noreply@vecta.co.jp`）
- `MAIL_TO`: 送信先メールアドレス（例: `contact@vecta.co.jp`）

#### 開発環境での設定

`.dev.vars`ファイルを作成し、以下の内容を記載します：

```
MAIL_FROM=noreply@example.com
MAIL_TO=dev@example.com
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxx
```

#### 本番環境での設定

1. `wrangler.jsonc`に基本設定が記載済み：

```json
"vars": {
  "MAIL_FROM": "noreply@vecta.co.jp",
  "MAIL_TO": "contact@vecta.co.jp"
}
```

2. SendGrid APIキーをSecretとして設定：

```bash
bun x wrangler secret put SENDGRID_API_KEY
```

プロンプトが表示されたら、SendGrid APIキーを入力します。


## 実装詳細

### メール送信サービス

`src/services/email.ts`にメール送信ロジックが実装されています：

- SendGrid API v3を使用
- HTMLとプレーンテキストの両形式でメールを送信
- 日本時間でのタイムスタンプ表示
- `Reply-To`ヘッダーにお問い合わせ者の情報を設定
- APIキーが設定されていない場合はメール送信をスキップ

### エンドポイントの統合

`src/endpoints/contactCreate.ts`でお問い合わせ保存後に自動的にメール送信が実行されます：

- データベース保存が成功した場合のみメール送信
- メール送信に失敗してもAPIレスポンスは成功を返す（データは保存済みのため）
- エラーログは記録される

## テスト方法

### ローカル環境でのテスト

1. 開発サーバーを起動：
   ```bash
   bun run dev
   ```

2. `test-contact-email.http`ファイルのリクエストを実行：
   ```http
   POST http://localhost:8787/contacts
   Content-Type: application/json

   {
     "name": "テスト太郎",
     "email": "test@example.com",
     "subject": "テスト件名",
     "message": "テストメッセージ"
   }
   ```

### 注意事項

- SendGridの無料プランでは1日100通までの送信制限があります
- メール送信のログはCloudflare WorkersのログとSendGridのダッシュボードで確認できます
- Reply-Toヘッダーにより、Google Workspaceメールから直接お問い合わせ者に返信できます
- ローカル環境でもAPIキーがあれば実際にメール送信が可能です

## トラブルシューティング

### メールが届かない場合

1. 環境変数が正しく設定されているか確認
2. SENDGRID_API_KEYが正しく設定されているか確認
3. SendGridでSender Authenticationが完了しているか確認
4. Cloudflare Workersのログでエラーを確認
5. SendGridのActivity Feedで配信ステータスを確認
6. Google Workspaceのスパムフォルダを確認

### エラーログの確認方法

#### Cloudflare Workersのログ
```bash
bun x wrangler tail
```

#### SendGridのログ
1. SendGridダッシュボードにログイン
2. 「Activity」→「Email Activity」で配信ステータスを確認
3. 「Suppressions」でバウンスやスパム報告を確認

### SendGridの料金プラン

- **Free**: 100通/日
- **Essentials**: $19.95/月（50,000通/月）
- **Pro**: $89.95/月（100,000通/月）

詳細は[SendGridの料金ページ](https://sendgrid.com/pricing/)をご確認ください。