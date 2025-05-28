# CLAUDE.md

このファイルは、このリポジトリでコードを扱う際のClaude Code (claude.ai/code) への指針を提供します。

## よく使う開発コマンド

### 開発
- `npm run dev` または `bun run dev` - http://localhost:8787 で開発サーバーを起動
- `make bs` または `make bootstrap` - 初回セットアップのためのプロジェクトのブートストラップ

### テスト
- `npm run test` または `bun run test` - Cloudflare Workersプールを使用してVitestでテストを実行

### コード品質
- `npm run check` または `bun run check` - Biomeリンターを実行
- `npm run check:fix` または `bun run check:fix` - Biomeリンターを実行して問題を修正

### デプロイ
- `npm run deploy` または `bun run deploy` - 圧縮してCloudflare Workersにデプロイ
- `npm run cf-typegen` または `bun run cf-typegen` - Cloudflare Workersの型を生成

### データベース
- `npm run db:migrate:local` または `bun run db:migrate:local` - ローカルD1データベースでマイグレーションを実行
- `npm run db:migrate:remote` または `bun run db:migrate:remote` - リモートD1データベースでマイグレーションを実行

### その他
- `npm run clean` または `bun run clean` - node_modulesディレクトリをクリーン

## アーキテクチャ概要

これはVectaのコーポレートサイト用のCloudflare WorkersバックエンドAPIで、以下を使用しています：

- **ランタイム**: Cloudflare Workers
- **フレームワーク**: OpenAPIドキュメント用のChanfanaを使用したHono
- **バリデーション**: Zodスキーマ
- **データベース**: Cloudflare D1 (wrangler.jsonc でバインディング設定)
- **テスト**: Cloudflare WorkersプールのVitest
- **コード品質**: リントとフォーマット用のBiome
- **Gitフック**: 規約に従ったコミット用のCommitlintを使用したLefthook

### プロジェクト構造

APIはOpenAPIドキュメント付きのRESTインターフェースを中心に構築されています：

- `src/index.ts` - メインアプリケーションのエントリーポイント、OpenAPIルートでHonoアプリを設定
- `src/endpoints/` - ChanfanaのOpenAPIRouteを拡張したAPIエンドポイントハンドラー
- `src/types.ts` - 共有TypeScript型とZodスキーマ

### APIエンドポイント

すべてのエンドポイントはOpenAPIでドキュメント化され、バリデーションにZodを使用しています：
- `GET /tasks` - ページネーションとフィルタリングでタスクを一覧表示
- `POST /tasks` - 新しいタスクを作成
- `GET /tasks/:taskSlug` - 特定のタスクを取得
- `DELETE /tasks/:taskSlug` - タスクを削除

### 主要な設定

- **TypeScript**: 厳格モード有効、ES2021ターゲット
- **Biome**: 2スペースのインデント、シングルクォート、必要に応じてセミコロン
- **カスタムドメイン**: api.vecta.co.jp に設定
- **D1データベース**: `DB`として2つのデータベースがバインド (prod-d1-tutorial と prod-db-vectacojp)

### 重要な指針

- パッケージマネージャーはBunを使用してください
- npxではなく、bun x を使用する