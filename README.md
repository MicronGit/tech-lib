# 📚 技術書管理システム (Tech Library Management System)

> Vue.js 3 + TypeScript + Go で構築された、モダンな技術書管理Webアプリケーション

![Vue.js](https://img.shields.io/badge/Vue.js-3.5.13-4FC08D?style=flat-square&logo=vue.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.6.0-3178C6?style=flat-square&logo=typescript)
![Go](https://img.shields.io/badge/Go-1.23+-00ADD8?style=flat-square&logo=go)
![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)

## 🌟 特徴

### ✨ 主要機能
- **📖 書籍管理**: 技術書の登録・一覧表示・削除
- **🔍 高速検索**: リアルタイムタイトル検索
- **📊 柔軟なソート**: 全カラム対応のソート機能
- **📱 レスポンシブ**: モバイル・タブレット・デスクトップ対応
- **🎨 モダンUI**: 美しいグラデーション・アニメーション効果

### 🚀 技術的ハイライト
- **型安全性**: TypeScript完全対応
- **コンポーネント設計**: Vue.js 3 Composition API
- **再利用性**: カスタムComposables
- **パフォーマンス**: 効率的なデータ管理
- **アクセシビリティ**: WCAG準拠のUI設計

## 🏗️ アーキテクチャ

### システム構成
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   フロントエンド  │◄──►│   バックエンド   │◄──►│  データベース    │
│   Vue.js 3      │    │     Go/Gin      │    │    SQLite      │
│   TypeScript    │    │   RESTful API   │    │                │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### フロントエンド構成
```
app/src/
├── 📁 components/           # Vueコンポーネント
│   ├── BookForm.vue         # 書籍登録フォーム
│   ├── BookList.vue         # 書籍一覧表示
│   └── 📁 common/           # 共通コンポーネント
│       ├── Modal.vue        # モーダルダイアログ
│       ├── SearchBox.vue    # 検索ボックス
│       ├── SortableTableHeader.vue  # ソート可能ヘッダー
│       └── Tooltip.vue      # ツールチップ
├── 📁 composables/          # 再利用可能ロジック
│   ├── useSearchableData.ts # 検索機能
│   └── useSortableData.ts   # ソート機能
├── 📁 services/             # API通信層
│   └── bookService.ts       # 書籍API
├── 📁 types/                # TypeScript型定義
│   └── Book.ts              # 書籍型定義
├── App.vue                  # メインアプリケーション
├── main.ts                  # エントリーポイント
└── style.css                # グローバルスタイル
```

### バックエンド構成
```
backend/
├── 📁 cmd/                  # アプリケーションエントリー
│   └── server/
│       └── main.go          # サーバー起動
├── 📁 internal/             # 内部パッケージ
│   ├── 📁 handlers/         # HTTPハンドラー
│   ├── 📁 models/           # データモデル
│   ├── 📁 repository/       # データアクセス層
│   └── 📁 services/         # ビジネスロジック
├── 📁 pkg/                  # 共有パッケージ
├── go.mod                   # Go モジュール
└── go.sum                   # 依存関係
```

## 🚀 クイックスタート

### 📋 前提条件
- **Node.js**: 18.0 以上
- **npm**: 9.0 以上  
- **Go**: 1.23 以上

### ⚡ インストール手順

1. **リポジトリのクローン**
   ```bash
   git clone https://github.com/MicronGit/tech-lib.git
   cd tech-lib
   ```

2. **フロントエンド環境構築**
   ```bash
   cd app
   npm install
   ```

3. **バックエンド環境構築**
   ```bash
   cd ../backend
   go mod tidy
   ```

4. **開発サーバー起動**
   
   **フロントエンド** (ターミナル1):
   ```bash
   cd app
   npm run dev
   ```
   
   **バックエンド** (ターミナル2):
   ```bash
   cd backend
   go run cmd/server/main.go
   ```

5. **アクセス**
   - フロントエンド: http://localhost:5173
   - バックエンドAPI: http://localhost:8080

## 📖 使用方法

### 書籍登録
1. 「図書登録」タブをクリック
2. 必須項目（タイトル・著者・出版社・オーナー）を入力
3. 「登録する」ボタンをクリック

### 書籍検索・ソート
1. 「図書一覧」タブで書籍を確認
2. 検索ボックスでタイトル検索
3. 各列ヘッダーをクリックでソート

### 書籍削除
1. 書籍一覧の「×」ボタンをクリック
2. 確認ダイアログで「削除する」を選択

## 🛠️ 開発

### 利用可能スクリプト

**フロントエンド**:
```bash
npm run dev      # 開発サーバー起動
npm run build    # 本番ビルド
npm run preview  # ビルド結果プレビュー
npm run lint     # ESLintチェック
npm run format   # Prettierフォーマット
```

**バックエンド**:
```bash
go run cmd/server/main.go  # サーバー起動
go test ./...              # テスト実行
go build cmd/server/main.go # ビルド
```

### 技術スタック詳細

#### フロントエンド
| 技術 | バージョン | 用途 |
|------|-----------|------|
| Vue.js | 3.5.13 | UIフレームワーク |
| TypeScript | 5.6.0 | 型安全なJavaScript |
| Vite | 6.0.1 | ビルドツール |
| Axios | 1.7.9 | HTTP通信 |
| ESLint | 9.15.0 | コード品質管理 |
| Prettier | 3.3.3 | コードフォーマット |

#### バックエンド
| 技術 | バージョン | 用途 |
|------|-----------|------|
| Go | 1.23+ | バックエンド言語 |
| Gin | - | Webフレームワーク |
| GORM | - | ORM |
| SQLite | - | データベース |

## 🎨 デザインシステム

### カラーパレット
- **プライマリ**: #667eea → #764ba2 (グラデーション)
- **セカンダリ**: #343a40 → #495057 (グラデーション)
- **アクセント**: #ff6b6b (削除・警告)
- **テキスト**: #2c3e50
- **背景**: #f8f9fa

### レスポンシブブレイクポイント
- **デスクトップ**: 1024px以上
- **タブレット**: 768px - 1023px
- **モバイル**: 767px以下
- **小画面モバイル**: 480px以下

## 🔧 API仕様

### エンドポイント一覧
| メソッド | パス | 説明 |
|---------|------|------|
| GET | `/api/books` | 書籍一覧取得 |
| POST | `/api/books` | 書籍登録 |
| DELETE | `/api/books/:id` | 書籍削除 |

### データモデル
```typescript
interface Book {
  id: number;
  title: string;
  author: string;
  publisher: string;
  publicationDate?: string;
  genre?: string;
  pageCount?: number;
  language?: string;
  owner: string;
  description?: string;
  status: 'available' | 'borrowed' | 'maintenance';
  createdAt: string;
  updatedAt: string;
}
```

## 📊 プロジェクト状況

### ✅ 実装済み機能
- [x] 書籍CRUD操作（CRD）
- [x] リアルタイム検索
- [x] 多軸ソート機能
- [x] レスポンシブデザイン
- [x] エラーハンドリング
- [x] ローディング状態管理
- [x] フォームバリデーション
- [x] 削除確認ダイアログ

### 🚧 開発予定
- [ ] 書籍更新機能 (Update)
- [ ] 高度な検索フィルタ
- [ ] ユーザー認証・認可
- [ ] 画像アップロード
- [ ] 貸出管理機能
- [ ] レポート・統計機能

## 🤝 コントリビューション

1. フォークを作成
2. フィーチャーブランチを作成 (`git checkout -b feature/amazing-feature`)
3. 変更をコミット (`git commit -m 'Add amazing feature'`)
4. ブランチにプッシュ (`git push origin feature/amazing-feature`)
5. プルリクエストを作成

### 開発ガイドライン
- **コード品質**: ESLint + Prettier準拠
- **型安全性**: TypeScript厳密モード
- **テスト**: 新機能には必ずテストを追加
- **ドキュメント**: 変更内容を適切に文書化

## 📝 ライセンス

このプロジェクトは [MIT License](LICENSE) の下で公開されています。

## 👥 作成者

- **開発者**: MicronGit
- **AI支援**: Claude (Anthropic)

## 📞 サポート

- **Issue**: [GitHub Issues](https://github.com/MicronGit/tech-lib/issues)
- **Email**: [サポートメールアドレス]

---

⭐ このプロジェクトが役に立ったら、スターをつけてください！

**最終更新**: 2025年6月15日