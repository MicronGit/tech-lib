# Claude Code - 技術書管理システム開発コンテキスト

## プロジェクト概要
技術書管理システム（Tech Library Management System）の開発を行っています。Vue.js 3 + TypeScript + Go（Gin）によるフルスタック書籍管理アプリケーションです。

## 許可された操作範囲

### 📋 基本開発権限
- **コード編集・作成**: 既存ファイルの編集および新規ファイル作成
- **依存関係管理**: package.json/go.mod等の更新
- **設定ファイル変更**: 環境設定、ビルド設定等の変更
- **テスト実行**: 自動テスト・手動テスト・リント・ビルドチェック
- **デバッグ支援**: ログ確認・エラー解析・パフォーマンス調査

### 🔧 技術スタック操作権限
- **フロントエンド**: Vue.js、TypeScript、Vite、CSS設計変更
- **バックエンド**: Go、Gin、データベース設計変更
- **DevOps**: 開発環境構築、ビルドプロセス最適化
- **品質管理**: ESLint、Prettier、テストカバレッジ改善

### 📚 ドキュメント作成権限
- **技術ドキュメント**: API仕様書、アーキテクチャ図、設計書
- **利用者向け**: README、セットアップガイド、操作マニュアル
- **開発者向け**: 開発ガイド、コントリビューションガイド、トラブルシューティング

## 🚀 作業フロー

### 指示実行プロセス
1. **タスク分析**: 要求の理解と実装計画の立案
2. **実装作業**: コード変更・テスト・品質チェック
3. **動作確認**: 機能テスト・統合テスト・UI/UX確認
4. **自動コミット**: 実装完了後の自動git commit
5. **自動プッシュ**: リモートリポジトリへの自動push

### 品質保証プロセス
- **リント実行**: ESLint + Prettier自動実行
- **型チェック**: TypeScript型検証
- **テスト実行**: 自動テストスイート実行
- **ビルド確認**: 本番環境向けビルド検証

## 🏗️ プロジェクト構造

### 📁 リポジトリ全体構造
```
tech-lib/
├── app/                   # フロントエンド (Vue.js 3)
├── api/                   # バックエンド (Node.js + Lambda)
├── infra/                 # インフラ (AWS CDK)
├── database/              # データベーススキーマ
├── docs/                  # プロジェクトドキュメント
├── .github/workflows/     # CI/CDパイプライン
├── CLAUDE.md              # 開発コンテキスト
└── README.md              # プロジェクト概要
```

### 🎨 フロントエンド (app/)
```
app/
├── src/
│   ├── components/
│   │   ├── BookForm.vue           # 書籍登録フォーム
│   │   ├── BookList.vue           # 書籍一覧表示
│   │   ├── BookDetail.vue         # 書籍詳細表示
│   │   └── common/                # 共通コンポーネント
│   │       ├── Modal.vue          # モーダルダイアログ
│   │       ├── SearchBox.vue      # 検索ボックス
│   │       ├── SortableTableHeader.vue # ソート可能テーブル
│   │       └── Tooltip.vue        # ツールチップ
│   ├── composables/               # 再利用可能ロジック
│   │   ├── useSearchableData.ts   # 検索機能
│   │   └── useSortableData.ts     # ソート機能
│   ├── services/                  # API通信層
│   │   ├── bookService.ts         # 書籍API
│   │   └── isbnService.ts         # ISBN API
│   ├── types/                     # TypeScript型定義
│   │   └── Book.ts                # 書籍型定義
│   └── App.vue                    # メインアプリケーション
├── dist/                          # ビルド成果物
├── package.json                   # 依存関係定義
└── vite.config.ts                 # Vite設定
```

### 🔧 バックエンド (api/)
```
api/
├── src/
│   └── getBooks/
│       ├── index.ts               # Lambda関数エントリーポイント
│       ├── db.ts                  # データベース接続
│       └── db.test.ts             # データベーステスト
├── layer/                         # Lambda Layer
│   └── nodejs/
│       ├── package.json           # Layer依存関係
│       └── package-lock.json      # Layer依存関係ロック
├── types.ts                       # 共通型定義
├── package.json                   # 依存関係定義
└── vitest.config.ts               # テスト設定
```

### 🏗️ インフラ (infra/)
```
infra/
├── lib/
│   └── infra-stack.ts             # CDKスタック定義
├── bin/                           # CDKアプリケーション
├── cdk.json                       # CDK設定
├── package.json                   # 依存関係定義
└── test/                          # インフラテスト
```

### 💾 データベース (database/)
```
database/
├── ddl.sql                        # データ定義言語
└── dml.sql                        # データ操作言語
```

### 📚 ドキュメント (docs/)
```
docs/
├── api-specification.md          # API仕様書
├── backend-design.md             # バックエンド設計
├── database-design.md            # データベース設計
├── development-setup.md          # 開発環境構築
├── frontend-design.md            # フロントエンド設計
├── infrastructure-design.md      # インフラ設計
└── security-design.md            # セキュリティ設計
```

## 🎯 開発方針

### コーディング規約
- **TypeScript**: 厳密な型定義、any禁止
- **Vue.js**: Composition API優先、Single File Component
- **Go**: 標準的なGo慣例に従う、エラー処理の徹底
- **CSS**: BEM記法、レスポンシブデザイン優先

### セキュリティ要件
- **認証・認可**: JWTベース認証実装予定
- **データ検証**: 入力値検証の徹底
- **XSS対策**: エスケープ処理の徹底
- **CSRF対策**: トークンベース保護

### パフォーマンス要件
- **フロントエンド**: コンポーネント最適化、遅延ローディング
- **バックエンド**: データベースクエリ最適化、キャッシング
- **レスポンシブ**: モバイルファースト設計

## 📋 実装済み機能

### ✅ 完了済み
- [x] 書籍CRUD操作（作成・読取・削除）
- [x] 検索機能（タイトル検索）
- [x] ソート機能（全カラム対応）
- [x] レスポンシブデザイン
- [x] エラーハンドリング
- [x] ローディング状態管理
- [x] 削除確認ダイアログ
- [x] フォームバリデーション

### 🚧 開発中
- [ ] 書籍更新機能
- [ ] 高度な検索フィルタ
- [ ] ユーザー認証システム
- [ ] 画像アップロード機能

## 🔄 継続的な改善

### 定期実行項目
- **依存関係更新**: セキュリティパッチ適用
- **パフォーマンス監視**: ページ読み込み速度・API応答時間
- **ユーザビリティ改善**: UI/UX継続改善
- **コード品質**: リファクタリング・技術的負債解消

### 監視対象
- **フロントエンド**: バンドルサイズ、レンダリング性能
- **バックエンド**: メモリ使用量、データベース性能
- **全体**: エラー率、ユーザビリティメトリクス

## 🤝 協力体制

### 人間-AI協働
- **要求定義**: 人間が機能要求・仕様を定義
- **実装**: AIが技術実装・品質保証を実行
- **レビュー**: 人間が成果物レビュー・承認
- **デプロイ**: 人間が本番環境デプロイを決定

### コミュニケーション
- **進捗報告**: 実装状況の透明性確保
- **問題報告**: 技術的課題・ブロッカーの早期共有
- **提案**: パフォーマンス改善・新機能提案

## 🔧 AWS調査・デバッグ設定

### AWS CLI設定
- **プロファイル**: `micron-aws` を使用
- **リージョン**: `ap-northeast-1` (東京)
- **調査コマンド例**:
  ```bash
  aws --profile micron-aws --region ap-northeast-1 logs describe-log-groups
  aws --profile micron-aws --region ap-northeast-1 apigateway get-rest-apis
  aws --profile micron-aws --region ap-northeast-1 logs get-log-events --log-group-name <group-name> --log-stream-name <stream-name>
  ```

### デバッグ手順
1. **API Gateway**: REST APIリソースとメソッドの確認
2. **Lambda**: CloudWatchログでエラー詳細確認
3. **CloudFormation**: スタック状態とイベント確認
4. **Route**: API Gatewayルーティング設定検証

## ⚠️ 機能実装・修正時の注意事項

### 🔍 実装前必須確認事項
1. **フロントエンド機能追加時**:
   - `app/src/services/bookService.ts`: API呼び出し定義確認
   - `app/src/types/Book.ts`: 型定義更新の必要性確認
   - `app/src/components/`: 既存コンポーネント再利用可能性確認

2. **バックエンドAPI追加時**:
   - `api/src/getBooks/index.ts`: ルーティング・ハンドラー実装確認
   - `api/types.ts`: 共通型定義更新の必要性確認
   - `infra/lib/infra-stack.ts`: **API Gateway メソッド定義必須確認**

3. **インフラ変更時**:
   - `infra/lib/infra-stack.ts`: CDKスタック定義更新
   - `.github/workflows/cd.yml`: デプロイパイプライン影響確認
   - `database/`: スキーマ変更時のDDL/DML確認

### 🚨 頻発する修正漏れ防止チェックリスト

#### ✅ API エンドポイント追加時
- [ ] **Lambda関数実装** (`api/src/getBooks/index.ts`)
- [ ] **API Gateway メソッド定義** (`infra/lib/infra-stack.ts`)
- [ ] **フロントエンド API 呼び出し** (`app/src/services/bookService.ts`)
- [ ] **型定義更新** (`api/types.ts`, `app/src/types/Book.ts`)
- [ ] **エラーハンドリング実装** (フロント・バックエンド両方)

#### ✅ UI コンポーネント追加時
- [ ] **Vue コンポーネント実装** (`app/src/components/`)
- [ ] **ルーティング設定** (`app/src/App.vue` など)
- [ ] **CSS スタイル定義** (`app/src/style.css`)
- [ ] **TypeScript型定義** (`app/src/types/`)
- [ ] **既存コンポーネントとの統合確認**

#### ✅ データベース関連変更時
- [ ] **DDL スキーマ定義** (`database/ddl.sql`)
- [ ] **DML サンプルデータ** (`database/dml.sql`)
- [ ] **Lambda データアクセス層** (`api/src/getBooks/db.ts`)
- [ ] **型定義更新** (`api/types.ts`)
- [ ] **フロントエンド型定義** (`app/src/types/Book.ts`)

### 🔄 デバッグ・修正のワークフロー
1. **エラー発生時の調査順序**:
   ```
   フロントエンド -> API Gateway -> Lambda -> Database
   ```

2. **修正後の確認事項**:
   - ローカル開発環境でのテスト
   - TypeScript型チェック通過
   - ESLint/Prettier実行
   - Git commit & push
   - GitHub Actions CI/CD成功確認

3. **本番環境での動作確認**:
   - API Gateway メソッド存在確認
   - Lambda 関数正常実行確認
   - CloudWatch ログエラー確認
   - フロントエンド実際の動作確認

---

**最終更新**: 2025年6月15日
**プロジェクト状態**: アクティブ開発中
**次期マイルストーン**: 書籍更新機能実装