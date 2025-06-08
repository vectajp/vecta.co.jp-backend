![hero.svg](public/assets/logo.svg)

# vecta.co.jp-backend

Vectaのコーポレートサイトのバックエンド。

Cloudflare Workers で稼働します。

## アーキテクチャ

このリポジトリは、Cloudflareの3層アーキテクチャにおける**バックエンド層**として機能します。

フロントエンドのCloudflare Pages（vecta.co.jp）から、このCloudflare WorkersベースのバックエンドAPIを経由して、Cloudflare D1データベースにアクセスする構成となっています。この設計により、フロントエンドとデータベースを分離し、セキュアで拡張性の高いアプリケーションを実現しています。

### 各層の役割

1. **フロントエンド層** (Cloudflare Pages)
   - vecta.co.jpのWebサイト
   - 静的ファイルホスティング
   - Pages Functionsで軽量な処理

2. **バックエンド層** (このリポジトリ)
   - REST API (api.vecta.co.jp)
   - ビジネスロジックの実装
   - データベースアクセスの抽象化
   - 認証・認可の処理

3. **データベース層** (Cloudflare D1)
   - SQLiteベースのサーバーレスデータベース
   - エッジでの高速データアクセス

## 技術スタック

- **バックエンドフレームワーク**: [Honoフレームワーク](https://hono-ja.pages.dev/)
- **API仕様**: OpenAPI ([Chanfana](https://github.com/cloudflare/chanfana) - HonoアプリケーションにOpenAPI仕様を追加するライブラリ)
- **データベース**: Cloudflare D1
- **認証**: APIキー認証（詳細は[セキュリティ設定](docs/SECURITY.md)を参照）

## 開発方法

### 必要条件

- Node.js 16.x 以上
- Bun

### Get Started

リポジトリを `git clone` し、以下のコマンドを実行してください。

```shell
$ make bs
```

初回実行時は、開発環境用のAPIキーの入力を求められます。以下のコマンドで安全なAPIキーを生成できます：

```bash
# OpenSSLで32バイトのランダムキーを生成（推奨）
openssl rand -base64 32
```

### 開発サーバーの起動

```bash
bun run dev
```

開発サーバーが起動したら、ブラウザで [http://localhost:8787](http://localhost:8787) にアクセスしてください。

### REST APIの確認方法

開発サーバー起動後、以下の方法でAPIを確認・テストできます：

#### 1. OpenAPI ドキュメント（推奨）

ブラウザで以下のURLにアクセス：
- `http://localhost:8787/` - Swagger UI（インタラクティブなドキュメント）

#### 2. cURLコマンド

```bash
# タスク一覧取得
curl 'http://localhost:8787/tasks'

# タスク作成
curl -X POST 'http://localhost:8787/tasks' \
  -H "Content-Type: application/json" \
  -d '{
    "name": "テストタスク",
    "slug": "test-task",
    "description": "これはテストです"
  }'

# 特定のタスク取得
curl 'http://localhost:8787/tasks/test-task'

# タスク削除
curl -X DELETE 'http://localhost:8787/tasks/test-task'
```

**注意**: Zshを使用している場合、URLにクエリパラメータが含まれる際は必ずクォートで囲んでください。

### データベース

#### D1データベースの環境

- **ローカル環境 (`--local`)**: 開発マシン上のSQLiteデータベース（`.wrangler/state/`に保存）
- **リモート環境 (`--remote`)**: Cloudflareエッジ上の本番D1データベース

#### マイグレーション

```bash
# ローカルDBの初期化
bun run db:migrate:local

# 本番DBの初期化（Cloudflareログインが必要）
bun run db:migrate:remote

# ローカルDBのリセット（開発時のみ）
bun run db:reset:local
```

#### ローカルデータベースの確認方法

```bash
# テーブル一覧
bun wrangler d1 execute DB --local --command "SELECT name FROM sqlite_master WHERE type='table';"

# テーブル構造の確認
bun wrangler d1 execute DB --local --command "PRAGMA table_info(tasks);"

# データの確認
bun wrangler d1 execute DB --local --command "SELECT * FROM tasks;"

# SQLiteクライアントで直接確認（ファイルパスは環境により異なる）
sqlite3 .wrangler/state/v3/d1/miniflare-D1DatabaseObject/*.sqlite
```

### デプロイ

```bash
bun run deploy
```

Cloudflare Workers にデプロイされます。

### 環境変数

以下の環境変数を設定できます：

- `CORS_ALLOWED_ORIGINS`: CORS許可オリジンのカンマ区切りリスト（必須）
  - 未設定の場合: すべてのオリジンを拒否
  - 例: `CORS_ALLOWED_ORIGINS="https://vecta.co.jp,https://www.vecta.co.jp,http://localhost:4321"`

### テスト

```bash
bun run test
```

## ライセンス

All rights reserved © Vecta
