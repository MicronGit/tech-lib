# 📖 API仕様書 - 技術書管理システム

> RESTful API設計に基づく技術書管理システムのバックエンドAPI仕様

## 📋 概要

### API基本情報
- **ベースURL**: `http://localhost:8080/api`
- **プロトコル**: HTTP/HTTPS
- **認証方式**: JWT Bearer Token（実装予定）
- **データ形式**: JSON
- **文字エンコーディング**: UTF-8

### レスポンス形式
```json
{
  "success": true,
  "data": {},
  "message": "成功メッセージ",
  "timestamp": "2025-06-15T12:00:00Z"
}
```

## 📚 書籍管理API

### 📖 書籍一覧取得

#### リクエスト
```http
GET /api/books
```

#### クエリパラメータ
| パラメータ | 型 | 必須 | 説明 | 例 |
|-----------|---|------|------|---|
| `page` | integer | × | ページ番号（1から開始） | `1` |
| `limit` | integer | × | 1ページあたりの件数 | `20` |
| `search` | string | × | タイトル検索 | `JavaScript` |
| `genre` | string | × | ジャンルフィルタ | `プログラミング` |
| `language` | string | × | 言語フィルタ | `日本語` |
| `sort` | string | × | ソートフィールド | `title` |
| `order` | string | × | ソート順序 (`asc`/`desc`) | `asc` |

#### レスポンス例
```json
{
  "success": true,
  "data": {
    "books": [
      {
        "id": 1,
        "title": "Vue.js 3 完全ガイド",
        "author": "山田太郎",
        "publisher": "技術出版社",
        "publicationDate": "2024-01-15",
        "genre": "プログラミング",
        "pageCount": 450,
        "language": "日本語",
        "owner": "田中花子",
        "description": "Vue.js 3の基礎から応用まで詳しく解説",
        "status": "available",
        "createdAt": "2025-06-15T10:00:00Z",
        "updatedAt": "2025-06-15T10:00:00Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalItems": 89,
      "itemsPerPage": 20
    }
  },
  "message": "書籍一覧を取得しました",
  "timestamp": "2025-06-15T12:00:00Z"
}
```

### 📝 書籍登録

#### リクエスト
```http
POST /api/books
Content-Type: application/json
```

#### リクエストボディ
```json
{
  "title": "Vue.js 3 完全ガイド",
  "author": "山田太郎",
  "publisher": "技術出版社",
  "publicationDate": "2024-01-15",
  "genre": "プログラミング",
  "pageCount": 450,
  "language": "日本語",
  "owner": "田中花子",
  "description": "Vue.js 3の基礎から応用まで詳しく解説",
  "status": "available"
}
```

#### バリデーションルール
| フィールド | 型 | 必須 | 制約 |
|-----------|---|------|------|
| `title` | string | ✓ | 1-200文字 |
| `author` | string | ✓ | 1-100文字 |
| `publisher` | string | ✓ | 1-100文字 |
| `publicationDate` | string | × | YYYY-MM-DD形式 |
| `genre` | string | × | 選択肢から選択 |
| `pageCount` | integer | × | 1以上 |
| `language` | string | × | 選択肢から選択 |
| `owner` | string | ✓ | 1-50文字 |
| `description` | string | × | 最大1000文字 |
| `status` | string | × | `available`/`borrowed`/`maintenance` |

#### レスポンス例
```json
{
  "success": true,
  "data": {
    "book": {
      "id": 123,
      "title": "Vue.js 3 完全ガイド",
      "author": "山田太郎",
      "publisher": "技術出版社",
      "publicationDate": "2024-01-15",
      "genre": "プログラミング",
      "pageCount": 450,
      "language": "日本語",
      "owner": "田中花子",
      "description": "Vue.js 3の基礎から応用まで詳しく解説",
      "status": "available",
      "createdAt": "2025-06-15T12:00:00Z",
      "updatedAt": "2025-06-15T12:00:00Z"
    }
  },
  "message": "書籍を登録しました",
  "timestamp": "2025-06-15T12:00:00Z"
}
```

### 📖 書籍詳細取得

#### リクエスト
```http
GET /api/books/{id}
```

#### パスパラメータ
| パラメータ | 型 | 説明 |
|-----------|---|------|
| `id` | integer | 書籍ID |

#### レスポンス例
```json
{
  "success": true,
  "data": {
    "book": {
      "id": 123,
      "title": "Vue.js 3 完全ガイド",
      "author": "山田太郎",
      "publisher": "技術出版社",
      "publicationDate": "2024-01-15",
      "genre": "プログラミング",
      "pageCount": 450,
      "language": "日本語",
      "owner": "田中花子",
      "description": "Vue.js 3の基礎から応用まで詳しく解説",
      "status": "available",
      "createdAt": "2025-06-15T10:00:00Z",
      "updatedAt": "2025-06-15T10:00:00Z"
    }
  },
  "message": "書籍詳細を取得しました",
  "timestamp": "2025-06-15T12:00:00Z"
}
```

### ✏️ 書籍更新

#### リクエスト
```http
PUT /api/books/{id}
Content-Type: application/json
```

#### パスパラメータ
| パラメータ | 型 | 説明 |
|-----------|---|------|
| `id` | integer | 書籍ID |

#### リクエストボディ
```json
{
  "title": "Vue.js 3 完全ガイド 改訂版",
  "author": "山田太郎",
  "publisher": "技術出版社",
  "publicationDate": "2024-01-15",
  "genre": "プログラミング",
  "pageCount": 500,
  "language": "日本語",
  "owner": "田中花子",
  "description": "Vue.js 3の基礎から応用まで詳しく解説（改訂版）",
  "status": "available"
}
```

#### レスポンス例
```json
{
  "success": true,
  "data": {
    "book": {
      "id": 123,
      "title": "Vue.js 3 完全ガイド 改訂版",
      "author": "山田太郎",
      "publisher": "技術出版社",
      "publicationDate": "2024-01-15",
      "genre": "プログラミング",
      "pageCount": 500,
      "language": "日本語",
      "owner": "田中花子",
      "description": "Vue.js 3の基礎から応用まで詳しく解説（改訂版）",
      "status": "available",
      "createdAt": "2025-06-15T10:00:00Z",
      "updatedAt": "2025-06-15T12:00:00Z"
    }
  },
  "message": "書籍を更新しました",
  "timestamp": "2025-06-15T12:00:00Z"
}
```

### 🗑️ 書籍削除

#### リクエスト
```http
DELETE /api/books/{id}
```

#### パスパラメータ
| パラメータ | 型 | 説明 |
|-----------|---|------|
| `id` | integer | 書籍ID |

#### レスポンス例
```json
{
  "success": true,
  "data": {},
  "message": "書籍を削除しました",
  "timestamp": "2025-06-15T12:00:00Z"
}
```

## 🔧 マスターデータAPI

### 📂 ジャンル一覧取得

#### リクエスト
```http
GET /api/genres
```

#### レスポンス例
```json
{
  "success": true,
  "data": {
    "genres": [
      "プログラミング",
      "データベース",
      "ネットワーク",
      "セキュリティ",
      "クラウド",
      "AI",
      "ビジネス",
      "その他"
    ]
  },
  "message": "ジャンル一覧を取得しました",
  "timestamp": "2025-06-15T12:00:00Z"
}
```

### 🌐 言語一覧取得

#### リクエスト
```http
GET /api/languages
```

#### レスポンス例
```json
{
  "success": true,
  "data": {
    "languages": [
      "日本語",
      "英語",
      "その他"
    ]
  },
  "message": "言語一覧を取得しました",
  "timestamp": "2025-06-15T12:00:00Z"
}
```

## ❌ エラーレスポンス

### エラー形式
```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "入力値に誤りがあります",
    "details": [
      {
        "field": "title",
        "message": "タイトルは必須です"
      }
    ]
  },
  "timestamp": "2025-06-15T12:00:00Z"
}
```

### エラーコード一覧

| HTTPステータス | エラーコード | 説明 |
|---------------|-------------|------|
| 400 | `VALIDATION_ERROR` | バリデーションエラー |
| 400 | `INVALID_REQUEST` | 不正なリクエスト |
| 401 | `UNAUTHORIZED` | 認証が必要 |
| 403 | `FORBIDDEN` | アクセス権限なし |
| 404 | `NOT_FOUND` | リソースが見つからない |
| 409 | `CONFLICT` | データの競合 |
| 500 | `INTERNAL_ERROR` | サーバー内部エラー |

### バリデーションエラー例
```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "入力値に誤りがあります",
    "details": [
      {
        "field": "title",
        "message": "タイトルは1文字以上200文字以内で入力してください"
      },
      {
        "field": "pageCount",
        "message": "ページ数は1以上の数値を入力してください"
      }
    ]
  },
  "timestamp": "2025-06-15T12:00:00Z"
}
```

## 🔐 認証・認可（実装予定）

### 認証方式
- **JWT Bearer Token**: APIアクセス用
- **リフレッシュトークン**: トークン更新用

### 認証フロー
1. ログイン → JWTトークン発行
2. APIリクエストヘッダにBearer Token付与
3. トークン期限切れ → リフレッシュトークンで更新

### ヘッダー例
```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 📊 レート制限

### 制限値
- **匿名ユーザー**: 100リクエスト/時間
- **認証ユーザー**: 1000リクエスト/時間

### ヘッダー
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 99
X-RateLimit-Reset: 1640995200
```

## 🔍 検索機能詳細

### 検索対象フィールド
- `title`: タイトル（部分一致）
- `author`: 著者（部分一致）
- `publisher`: 出版社（部分一致）
- `description`: 説明（部分一致）

### 検索クエリ例
```http
GET /api/books?search=Vue&genre=プログラミング&sort=title&order=asc
```

## 📋 ページネーション

### パラメータ
- `page`: ページ番号（デフォルト: 1）
- `limit`: 1ページあたりの件数（デフォルト: 20、最大: 100）

### レスポンス
```json
{
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalItems": 89,
    "itemsPerPage": 20,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

## 🧪 テストデータ

### サンプル書籍データ
```bash
# 開発用テストデータ投入
curl -X POST http://localhost:8080/api/books \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Go言語による並行プログラミング",
    "author": "鈴木一郎",
    "publisher": "プログラミング出版",
    "publicationDate": "2024-03-01",
    "genre": "プログラミング",
    "pageCount": 380,
    "language": "日本語",
    "owner": "開発太郎",
    "description": "Goの並行処理を基礎から学べる実践的ガイド"
  }'
```

---

**最終更新**: 2025年6月15日  
**APIバージョン**: v1.0  
**ステータス**: 開発中