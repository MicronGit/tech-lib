# 🚀 開発環境セットアップガイド

> 技術書管理システムの開発環境構築から運用まで完全ガイド

## 📋 システム要件

### 最小構成
| 項目 | 要件 |
|------|------|
| **OS** | Windows 10+, macOS 11+, Ubuntu 20.04+ |
| **CPU** | 2コア以上 |
| **メモリ** | 4GB以上 |
| **ストレージ** | 10GB以上の空き容量 |

### 推奨構成
| 項目 | 要件 |
|------|------|
| **OS** | Windows 11, macOS 13+, Ubuntu 22.04+ |
| **CPU** | 4コア以上 |
| **メモリ** | 8GB以上 |
| **ストレージ** | 20GB以上の空き容量（SSD推奨） |

## 🛠️ 必須ソフトウェア

### Node.js & npm
**推奨バージョン**: Node.js 18.0+ / npm 9.0+

#### Windows
```powershell
# Chocolatey経由（推奨）
choco install nodejs

# または公式サイトからダウンロード
# https://nodejs.org/
```

#### macOS
```bash
# Homebrew経由（推奨）
brew install node

# または公式サイトからダウンロード
# https://nodejs.org/
```

#### Linux (Ubuntu/Debian)
```bash
# NodeSourceリポジトリ経由（推奨）
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# または公式サイトからダウンロード
# https://nodejs.org/
```

#### バージョン確認
```bash
node --version  # v18.0.0+
npm --version   # 9.0.0+
```

### Go言語
**推奨バージョン**: Go 1.23+

#### Windows
```powershell
# Chocolatey経由（推奨）
choco install golang

# または公式サイトからダウンロード
# https://golang.org/dl/
```

#### macOS
```bash
# Homebrew経由（推奨）
brew install go

# または公式サイトからダウンロード
# https://golang.org/dl/
```

#### Linux (Ubuntu/Debian)
```bash
# 公式パッケージ（推奨）
sudo apt update
sudo apt install golang-go

# または公式サイトからダウンロード
# https://golang.org/dl/
```

#### バージョン確認
```bash
go version  # go version go1.23.0+
```

### Git
**推奨バージョン**: Git 2.30+

#### Windows
```powershell
# Git for Windows（推奨）
# https://gitforwindows.org/

# またはChocolatey経由
choco install git
```

#### macOS
```bash
# Xcode Command Line Tools（デフォルト）
xcode-select --install

# またはHomebrew経由
brew install git
```

#### Linux (Ubuntu/Debian)
```bash
sudo apt update
sudo apt install git
```

#### バージョン確認
```bash
git --version  # git version 2.30.0+
```

## 📁 プロジェクトセットアップ

### 1. リポジトリクローン
```bash
# HTTPS
git clone https://github.com/MicronGit/tech-lib.git
cd tech-lib

# SSH（推奨）
git clone git@github.com:MicronGit/tech-lib.git
cd tech-lib
```

### 2. ディレクトリ構造確認
```bash
tech-lib/
├── 📁 app/              # フロントエンド（Vue.js）
├── 📁 backend/          # バックエンド（Go）
├── 📁 docs/             # ドキュメント
├── README.md            # プロジェクト概要
├── CLAUDE.md           # AI開発コンテキスト
└── .gitignore          # Git除外設定
```

## 🎨 フロントエンド環境構築

### 1. 依存関係インストール
```bash
cd app
npm install
```

### 2. 開発サーバー起動
```bash
npm run dev
```

### 3. ブラウザアクセス
```
http://localhost:5173
```

### 4. 利用可能スクリプト
```bash
# 開発サーバー起動
npm run dev

# 本番ビルド
npm run build

# ビルド結果プレビュー
npm run preview

# ESLintチェック
npm run lint

# コードフォーマット
npm run format

# 依存関係チェック
npm audit
```

## ⚡ バックエンド環境構築

### 1. 依存関係ダウンロード
```bash
cd backend
go mod tidy
```

### 2. サーバー起動
```bash
go run cmd/server/main.go
```

### 3. APIアクセス確認
```bash
# ヘルスチェック
curl http://localhost:8080/health

# 書籍一覧取得
curl http://localhost:8080/api/books
```

### 4. 利用可能コマンド
```bash
# サーバー起動
go run cmd/server/main.go

# テスト実行
go test ./...

# テストカバレッジ
go test -cover ./...

# 本番ビルド
go build -o bin/server cmd/server/main.go

# 依存関係整理
go mod tidy

# セキュリティチェック
go list -json -m all | nancy sleuth
```

## 🎯 開発ワークフロー

### 開発サーバー起動（推奨）
**ターミナル1（フロントエンド）**:
```bash
cd app
npm run dev
```

**ターミナル2（バックエンド）**:
```bash
cd backend
go run cmd/server/main.go
```

### アクセスURL
- **フロントエンド**: http://localhost:5173
- **バックエンドAPI**: http://localhost:8080
- **API仕様**: http://localhost:8080/swagger (実装予定)

## 🔧 開発ツール設定

### Visual Studio Code（推奨）

#### 必須拡張機能
```json
{
  "recommendations": [
    "Vue.volar",
    "ms-vscode.vscode-typescript-next",
    "golang.go",
    "esbenp.prettier-vscode",
    "ms-vscode.vscode-eslint",
    "bradlc.vscode-tailwindcss"
  ]
}
```

#### 設定ファイル（.vscode/settings.json）
```json
{
  \"editor.formatOnSave\": true,
  \"editor.codeActionsOnSave\": {
    \"source.fixAll.eslint\": true
  },
  \"[vue]\": {
    \"editor.defaultFormatter\": \"Vue.volar\"
  },
  \"[typescript]\": {
    \"editor.defaultFormatter\": \"esbenp.prettier-vscode\"
  },
  \"[go]\": {
    \"editor.formatOnSave\": true,
    \"editor.codeActionsOnSave\": {
      \"source.organizeImports\": true
    }
  },
  \"go.useLanguageServer\": true,
  \"go.formatTool\": \"goimports\"
}
```

### JetBrains製IDE

#### WebStorm設定
1. **Node.js**: Preferences → Languages & Frameworks → Node.js
2. **Vue.js**: Vue.jsプラグイン有効化
3. **ESLint**: Preferences → Languages & Frameworks → ESLint
4. **Prettier**: Preferences → Languages & Frameworks → Prettier

#### GoLand設定
1. **Go SDK**: Preferences → Go → GOROOT
2. **Go Modules**: 自動検出有効
3. **Code Style**: gofmt準拠

## 🧪 テスト環境

### フロントエンドテスト（実装予定）
```bash
# ユニットテスト
npm run test:unit

# E2Eテスト
npm run test:e2e

# テストカバレッジ
npm run test:coverage
```

### バックエンドテスト
```bash
# 全テスト実行
go test ./...

# 詳細出力
go test -v ./...

# カバレッジ
go test -cover ./...

# ベンチマーク
go test -bench=. ./...
```

## 🗄️ データベース設定

### SQLite（開発環境）
- **ファイル**: `backend/data/books.db`
- **自動作成**: アプリケーション起動時
- **初期データ**: `backend/internal/repository/seed.go`

### PostgreSQL（本番環境・実装予定）
```bash
# Docker Compose（推奨）
docker-compose up -d postgres

# 環境変数設定
export DB_HOST=localhost
export DB_PORT=5432
export DB_USER=techlib
export DB_PASSWORD=password
export DB_NAME=tech_library
```

## 🔐 環境変数設定

### フロントエンド（.env）
```bash
# API Base URL
VITE_API_BASE_URL=http://localhost:8080/api

# 開発モード
VITE_DEV_MODE=true

# デバッグログ
VITE_DEBUG=true
```

### バックエンド（.env）
```bash
# サーバー設定
PORT=8080
GIN_MODE=debug

# データベース設定
DB_DRIVER=sqlite3
DB_SOURCE=./data/books.db

# JWT設定（実装予定）
JWT_SECRET=your-super-secret-key
JWT_EXPIRE_HOURS=24

# CORS設定
CORS_ALLOWED_ORIGINS=http://localhost:5173
```

## 🚀 デプロイメント

### 本番ビルド

#### フロントエンド
```bash
cd app
npm run build
# dist/フォルダに生成
```

#### バックエンド
```bash
cd backend
go build -o bin/server cmd/server/main.go
# bin/serverに実行ファイル生成
```

### Docker（実装予定）
```bash
# 全体ビルド
docker-compose build

# 本番起動
docker-compose up -d
```

## 🐛 トラブルシューティング

### よくある問題と解決法

#### Node.js関連
```bash
# npmキャッシュクリア
npm cache clean --force

# node_modules再インストール
rm -rf node_modules package-lock.json
npm install

# 権限エラー（macOS/Linux）
sudo chown -R $(whoami) ~/.npm
```

#### Go関連
```bash
# モジュールキャッシュクリア
go clean -modcache

# 依存関係再解決
go mod tidy
go mod download

# ビルドキャッシュクリア
go clean -cache
```

#### ポート競合
```bash
# ポート使用状況確認
lsof -i :5173  # フロントエンド
lsof -i :8080  # バックエンド

# プロセス終了
kill -9 [PID]
```

#### データベース初期化
```bash
# SQLiteファイル削除（再作成される）
rm backend/data/books.db

# アプリケーション再起動
cd backend
go run cmd/server/main.go
```

## 📊 パフォーマンス最適化

### 開発時の推奨設定
```bash
# Node.js メモリ上限増加
export NODE_OPTIONS=\"--max-old-space-size=4096\"

# Go ビルドパフォーマンス向上
export GOCACHE=/path/to/cache
export GOMODCACHE=/path/to/modcache
```

### 監視コマンド
```bash
# CPU・メモリ使用量監視
top
htop

# ディスク使用量確認
df -h
du -sh ./*

# ネットワーク監視
netstat -tuln
```

## 🤝 チーム開発

### Git設定
```bash
# ユーザー情報設定
git config --global user.name \"Your Name\"
git config --global user.email \"your.email@example.com\"

# エディタ設定
git config --global core.editor \"code --wait\"

# 改行コード設定
git config --global core.autocrlf true   # Windows
git config --global core.autocrlf input  # macOS/Linux
```

### ブランチ戦略
```bash
# フィーチャーブランチ作成
git checkout -b feature/new-feature

# 変更をコミット
git add .
git commit -m \"feat: add new feature\"

# リモートにプッシュ
git push -u origin feature/new-feature
```

## 📞 サポート

### ヘルプコマンド
```bash
# Node.js/npm
npm help
node --help

# Go
go help
go help build

# Git
git help
git help commit
```

### ドキュメント参照
- **Vue.js**: https://vuejs.org/guide/
- **TypeScript**: https://www.typescriptlang.org/docs/
- **Go**: https://golang.org/doc/
- **Gin**: https://gin-gonic.com/docs/

---

**最終更新**: 2025年6月15日  
**対象バージョン**: フロントエンド v1.0, バックエンド v1.0  
**メンテナー**: MicronGit