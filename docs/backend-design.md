# ⚡ バックエンド設計書 - 技術書管理システム

> Go + Gin フレームワークによる高性能RESTful APIアーキテクチャ設計

## 📋 設計概要

### アーキテクチャの基本方針
- **ドメイン駆動設計**: ビジネスロジックを中心とした設計
- **クリーンアーキテクチャ**: 依存関係の制御と保守性の確保
- **API優先**: RESTful設計原則に準拠
- **スケーラビリティ**: 水平・垂直スケーリング対応
- **可観測性**: ログ・メトリクス・トレーシング統合

### 技術スタック詳細
| 技術 | バージョン | 役割 | 選定理由 |
|------|-----------|------|----------|
| Go | 1.23+ | 言語 | 高性能、並行処理、メモリ効率 |
| Gin | 1.9+ | Webフレームワーク | 軽量、高速、豊富なミドルウェア |
| GORM | 1.25+ | ORM | Go標準、マイグレーション機能 |
| PostgreSQL | 15+ | データベース | ACID準拠、拡張性、JSON対応 |
| Redis | 7+ | キャッシュ | 高速アクセス、セッション管理 |
| Docker | 24+ | コンテナ化 | 環境一貫性、デプロイ簡易化 |

## 🏗️ システムアーキテクチャ

### レイヤード アーキテクチャ
```
┌─────────────────────────────────────────┐
│                API Layer                │  ← HTTP エンドポイント
├─────────────────────────────────────────┤
│              Service Layer              │  ← ビジネスロジック
├─────────────────────────────────────────┤
│            Repository Layer             │  ← データアクセス
├─────────────────────────────────────────┤
│              Domain Layer               │  ← ドメインモデル
└─────────────────────────────────────────┘
```

### ディレクトリ構造
```
backend/
├── 📁 cmd/                    # アプリケーションエントリーポイント
│   └── server/
│       └── main.go            # サーバー起動スクリプト
├── 📁 internal/               # 非公開パッケージ
│   ├── 📁 api/                # API層（HTTP ハンドラー）
│   │   ├── handlers/          # HTTP ハンドラー
│   │   ├── middleware/        # ミドルウェア
│   │   ├── validators/        # リクエスト検証
│   │   └── responses/         # レスポンス構造
│   ├── 📁 domain/             # ドメイン層
│   │   ├── entities/          # エンティティ
│   │   ├── repositories/      # リポジトリインターフェース
│   │   ├── services/          # ドメインサービス
│   │   └── errors/            # ドメインエラー
│   ├── 📁 infrastructure/     # インフラ層
│   │   ├── database/          # データベース設定
│   │   ├── cache/             # キャッシュ実装
│   │   ├── logger/            # ログ実装
│   │   └── config/            # 設定管理
│   └── 📁 application/        # アプリケーション層
│       ├── services/          # アプリケーションサービス
│       ├── dto/               # データ転送オブジェクト
│       └── usecases/          # ユースケース
├── 📁 pkg/                    # 公開パッケージ
│   ├── utils/                 # ユーティリティ
│   ├── constants/             # 定数
│   └── validator/             # バリデーター
├── 📁 migrations/             # データベースマイグレーション
├── 📁 docs/                   # Swagger/OpenAPI仕様
├── 📁 scripts/                # 運用スクリプト
├── go.mod                     # Go モジュール
├── go.sum                     # 依存関係ハッシュ
├── Dockerfile                 # Docker設定
└── docker-compose.yml         # 開発環境設定
```

## 🎯 ドメイン設計

### エンティティ設計

#### Book エンティティ
```go
// internal/domain/entities/book.go
package entities

import (
    "time"
    "github.com/google/uuid"
)

type Book struct {
    ID              uuid.UUID  `json:"id" gorm:"type:uuid;primary_key;default:gen_random_uuid()"`
    Title           string     `json:"title" gorm:"not null;size:200" validate:"required,min=1,max=200"`
    Author          string     `json:"author" gorm:"not null;size:100" validate:"required,min=1,max=100"`
    Publisher       string     `json:"publisher" gorm:"not null;size:100" validate:"required,min=1,max=100"`
    PublicationDate *time.Time `json:"publication_date" gorm:"type:date"`
    Genre           string     `json:"genre" gorm:"size:50" validate:"omitempty,oneof=プログラミング データベース ネットワーク セキュリティ クラウド AI ビジネス その他"`
    PageCount       *int       `json:"page_count" gorm:"check:page_count > 0" validate:"omitempty,min=1"`
    Language        string     `json:"language" gorm:"size:20;default:'日本語'" validate:"omitempty,oneof=日本語 英語 その他"`
    Owner           string     `json:"owner" gorm:"not null;size:50" validate:"required,min=1,max=50"`
    Description     string     `json:"description" gorm:"type:text" validate:"omitempty,max=1000"`
    Status          BookStatus `json:"status" gorm:"not null;default:'available'" validate:"required,oneof=available borrowed maintenance"`
    CreatedAt       time.Time  `json:"created_at" gorm:"not null"`
    UpdatedAt       time.Time  `json:"updated_at" gorm:"not null"`
    DeletedAt       *time.Time `json:"deleted_at" gorm:"index"`
}

type BookStatus string

const (
    BookStatusAvailable   BookStatus = "available"
    BookStatusBorrowed    BookStatus = "borrowed"
    BookStatusMaintenance BookStatus = "maintenance"
)

// ドメインメソッド
func (b *Book) IsAvailable() bool {
    return b.Status == BookStatusAvailable && b.DeletedAt == nil
}

func (b *Book) CanBeBorrowed() bool {
    return b.IsAvailable()
}

func (b *Book) Borrow(borrowerID uuid.UUID) error {
    if !b.CanBeBorrowed() {
        return errors.New("book is not available for borrowing")
    }
    b.Status = BookStatusBorrowed
    return nil
}

func (b *Book) Return() error {
    if b.Status != BookStatusBorrowed {
        return errors.New("book is not currently borrowed")
    }
    b.Status = BookStatusAvailable
    return nil
}

func (b *Book) Validate() error {
    validate := validator.New()
    return validate.Struct(b)
}
```

#### User エンティティ（認証実装時）
```go
// internal/domain/entities/user.go
package entities

type User struct {
    ID        uuid.UUID `json:"id" gorm:"type:uuid;primary_key;default:gen_random_uuid()"`
    Email     string    `json:"email" gorm:"unique;not null" validate:"required,email"`
    Username  string    `json:"username" gorm:"unique;not null;size:50" validate:"required,min=3,max=50"`
    Password  string    `json:"-" gorm:"not null" validate:"required,min=8"`
    FirstName string    `json:"first_name" gorm:"size:50" validate:"required,max=50"`
    LastName  string    `json:"last_name" gorm:"size:50" validate:"required,max=50"`
    Role      UserRole  `json:"role" gorm:"not null;default:'user'" validate:"required,oneof=admin librarian user"`
    IsActive  bool      `json:"is_active" gorm:"not null;default:true"`
    CreatedAt time.Time `json:"created_at" gorm:"not null"`
    UpdatedAt time.Time `json:"updated_at" gorm:"not null"`
}

type UserRole string

const (
    UserRoleAdmin     UserRole = "admin"
    UserRoleLibrarian UserRole = "librarian"
    UserRoleUser      UserRole = "user"
)

func (u *User) HasPermission(action string, resource string) bool {
    permissions := rolePermissions[u.Role]
    return permissions.Has(action, resource)
}
```

### リポジトリインターフェース
```go
// internal/domain/repositories/book_repository.go
package repositories

import (
    "context"
    "github.com/google/uuid"
    "tech-lib/internal/domain/entities"
)

type BookRepository interface {
    // 基本CRUD操作
    Create(ctx context.Context, book *entities.Book) error
    GetByID(ctx context.Context, id uuid.UUID) (*entities.Book, error)
    Update(ctx context.Context, book *entities.Book) error
    Delete(ctx context.Context, id uuid.UUID) error
    
    // 検索・フィルタリング
    List(ctx context.Context, filter BookFilter) ([]*entities.Book, error)
    Count(ctx context.Context, filter BookFilter) (int64, error)
    Search(ctx context.Context, query string, filter BookFilter) ([]*entities.Book, error)
    
    // ビジネス固有操作
    GetByStatus(ctx context.Context, status entities.BookStatus) ([]*entities.Book, error)
    GetByOwner(ctx context.Context, owner string) ([]*entities.Book, error)
    GetExpiringSoon(ctx context.Context, days int) ([]*entities.Book, error)
}

type BookFilter struct {
    Limit      int                    `json:"limit"`
    Offset     int                    `json:"offset"`
    SortBy     string                 `json:"sort_by"`
    SortOrder  string                 `json:"sort_order"`
    Genre      string                 `json:"genre"`
    Language   string                 `json:"language"`
    Status     entities.BookStatus    `json:"status"`
    Owner      string                 `json:"owner"`
    DateFrom   *time.Time            `json:"date_from"`
    DateTo     *time.Time            `json:"date_to"`
}
```

### ドメインサービス
```go
// internal/domain/services/book_service.go
package services

type BookDomainService struct {
    bookRepo repositories.BookRepository
    logger   logger.Logger
}

func NewBookDomainService(bookRepo repositories.BookRepository, logger logger.Logger) *BookDomainService {
    return &BookDomainService{
        bookRepo: bookRepo,
        logger:   logger,
    }
}

// 重複チェック
func (s *BookDomainService) CheckDuplicate(ctx context.Context, title, author string) (bool, error) {
    books, err := s.bookRepo.Search(ctx, fmt.Sprintf("%s %s", title, author), BookFilter{Limit: 1})
    if err != nil {
        return false, err
    }
    
    for _, book := range books {
        if strings.EqualFold(book.Title, title) && strings.EqualFold(book.Author, author) {
            return true, nil
        }
    }
    
    return false, nil
}

// 貸出可能性チェック
func (s *BookDomainService) CanBorrow(ctx context.Context, bookID uuid.UUID, userID uuid.UUID) (bool, error) {
    book, err := s.bookRepo.GetByID(ctx, bookID)
    if err != nil {
        return false, err
    }
    
    if !book.CanBeBorrowed() {
        return false, nil
    }
    
    // ユーザーの貸出上限チェック（実装時）
    // userBorrowedCount, err := s.borrowRepo.CountByUser(ctx, userID)
    // if userBorrowedCount >= MaxBorrowLimit {
    //     return false, nil
    // }
    
    return true, nil
}
```

## 🔧 アプリケーション層設計

### ユースケース実装
```go
// internal/application/usecases/book_usecase.go
package usecases

type BookUseCase struct {
    bookRepo    repositories.BookRepository
    bookService services.BookDomainService
    logger      logger.Logger
    cache       cache.Cache
}

func NewBookUseCase(
    bookRepo repositories.BookRepository,
    bookService services.BookDomainService,
    logger logger.Logger,
    cache cache.Cache,
) *BookUseCase {
    return &BookUseCase{
        bookRepo:    bookRepo,
        bookService: bookService,
        logger:      logger,
        cache:       cache,
    }
}

func (uc *BookUseCase) CreateBook(ctx context.Context, req dto.CreateBookRequest) (*dto.BookResponse, error) {
    // バリデーション
    if err := req.Validate(); err != nil {
        return nil, errors.NewValidationError("invalid request", err)
    }
    
    // 重複チェック
    isDuplicate, err := uc.bookService.CheckDuplicate(ctx, req.Title, req.Author)
    if err != nil {
        uc.logger.Error("failed to check duplicate", "error", err)
        return nil, errors.NewInternalError("duplicate check failed")
    }
    if isDuplicate {
        return nil, errors.NewBusinessError("book already exists")
    }
    
    // エンティティ作成
    book := &entities.Book{
        Title:           req.Title,
        Author:          req.Author,
        Publisher:       req.Publisher,
        PublicationDate: req.PublicationDate,
        Genre:           req.Genre,
        PageCount:       req.PageCount,
        Language:        req.Language,
        Owner:           req.Owner,
        Description:     req.Description,
        Status:          entities.BookStatusAvailable,
    }
    
    // ドメインバリデーション
    if err := book.Validate(); err != nil {
        return nil, errors.NewValidationError("invalid book data", err)
    }
    
    // 永続化
    if err := uc.bookRepo.Create(ctx, book); err != nil {
        uc.logger.Error("failed to create book", "error", err)
        return nil, errors.NewInternalError("book creation failed")
    }
    
    // キャッシュ無効化
    uc.cache.Delete(ctx, "books:list")
    
    // レスポンス作成
    response := dto.BookResponse{
        ID:              book.ID,
        Title:           book.Title,
        Author:          book.Author,
        Publisher:       book.Publisher,
        PublicationDate: book.PublicationDate,
        Genre:           book.Genre,
        PageCount:       book.PageCount,
        Language:        book.Language,
        Owner:           book.Owner,
        Description:     book.Description,
        Status:          string(book.Status),
        CreatedAt:       book.CreatedAt,
        UpdatedAt:       book.UpdatedAt,
    }
    
    uc.logger.Info("book created successfully", "book_id", book.ID)
    return &response, nil
}

func (uc *BookUseCase) GetBooks(ctx context.Context, req dto.GetBooksRequest) (*dto.GetBooksResponse, error) {
    // キャッシュチェック
    cacheKey := fmt.Sprintf("books:list:%s", req.Hash())
    if cached, err := uc.cache.Get(ctx, cacheKey); err == nil {
        var response dto.GetBooksResponse
        if err := json.Unmarshal(cached, &response); err == nil {
            return &response, nil
        }
    }
    
    // フィルター作成
    filter := repositories.BookFilter{
        Limit:     req.Limit,
        Offset:    req.Offset,
        SortBy:    req.SortBy,
        SortOrder: req.SortOrder,
        Genre:     req.Genre,
        Language:  req.Language,
        Status:    entities.BookStatus(req.Status),
    }
    
    // データ取得
    books, err := uc.bookRepo.List(ctx, filter)
    if err != nil {
        uc.logger.Error("failed to get books", "error", err)
        return nil, errors.NewInternalError("books retrieval failed")
    }
    
    // 総件数取得
    total, err := uc.bookRepo.Count(ctx, filter)
    if err != nil {
        uc.logger.Error("failed to count books", "error", err)
        return nil, errors.NewInternalError("books count failed")
    }
    
    // レスポンス作成
    response := &dto.GetBooksResponse{
        Books: make([]dto.BookResponse, len(books)),
        Pagination: dto.PaginationResponse{
            CurrentPage:  (req.Offset / req.Limit) + 1,
            TotalPages:   int(math.Ceil(float64(total) / float64(req.Limit))),
            TotalItems:   int(total),
            ItemsPerPage: req.Limit,
        },
    }
    
    for i, book := range books {
        response.Books[i] = dto.BookResponse{
            ID:              book.ID,
            Title:           book.Title,
            Author:          book.Author,
            Publisher:       book.Publisher,
            PublicationDate: book.PublicationDate,
            Genre:           book.Genre,
            PageCount:       book.PageCount,
            Language:        book.Language,
            Owner:           book.Owner,
            Description:     book.Description,
            Status:          string(book.Status),
            CreatedAt:       book.CreatedAt,
            UpdatedAt:       book.UpdatedAt,
        }
    }
    
    // キャッシュ保存（5分間）
    if data, err := json.Marshal(response); err == nil {
        uc.cache.Set(ctx, cacheKey, data, 5*time.Minute)
    }
    
    return response, nil
}
```

### DTO設計
```go
// internal/application/dto/book_dto.go
package dto

type CreateBookRequest struct {
    Title           string     `json:"title" validate:"required,min=1,max=200"`
    Author          string     `json:"author" validate:"required,min=1,max=100"`
    Publisher       string     `json:"publisher" validate:"required,min=1,max=100"`
    PublicationDate *time.Time `json:"publication_date"`
    Genre           string     `json:"genre" validate:"omitempty,oneof=プログラミング データベース ネットワーク セキュリティ クラウド AI ビジネス その他"`
    PageCount       *int       `json:"page_count" validate:"omitempty,min=1"`
    Language        string     `json:"language" validate:"omitempty,oneof=日本語 英語 その他"`
    Owner           string     `json:"owner" validate:"required,min=1,max=50"`
    Description     string     `json:"description" validate:"omitempty,max=1000"`
}

func (r *CreateBookRequest) Validate() error {
    validate := validator.New()
    return validate.Struct(r)
}

type GetBooksRequest struct {
    Limit     int    `json:"limit" form:"limit" validate:"omitempty,min=1,max=100"`
    Offset    int    `json:"offset" form:"offset" validate:"omitempty,min=0"`
    SortBy    string `json:"sort_by" form:"sort_by" validate:"omitempty,oneof=title author publisher publication_date created_at"`
    SortOrder string `json:"sort_order" form:"sort_order" validate:"omitempty,oneof=asc desc"`
    Search    string `json:"search" form:"search" validate:"omitempty,max=100"`
    Genre     string `json:"genre" form:"genre"`
    Language  string `json:"language" form:"language"`
    Status    string `json:"status" form:"status"`
}

func (r *GetBooksRequest) Hash() string {
    h := sha256.New()
    h.Write([]byte(fmt.Sprintf("%+v", r)))
    return hex.EncodeToString(h.Sum(nil))
}

type BookResponse struct {
    ID              uuid.UUID  `json:"id"`
    Title           string     `json:"title"`
    Author          string     `json:"author"`
    Publisher       string     `json:"publisher"`
    PublicationDate *time.Time `json:"publication_date"`
    Genre           string     `json:"genre"`
    PageCount       *int       `json:"page_count"`
    Language        string     `json:"language"`
    Owner           string     `json:"owner"`
    Description     string     `json:"description"`
    Status          string     `json:"status"`
    CreatedAt       time.Time  `json:"created_at"`
    UpdatedAt       time.Time  `json:"updated_at"`
}

type GetBooksResponse struct {
    Books      []BookResponse       `json:"books"`
    Pagination PaginationResponse   `json:"pagination"`
}

type PaginationResponse struct {
    CurrentPage  int `json:"current_page"`
    TotalPages   int `json:"total_pages"`
    TotalItems   int `json:"total_items"`
    ItemsPerPage int `json:"items_per_page"`
}
```

## 🌐 API層設計

### ハンドラー実装
```go
// internal/api/handlers/book_handler.go
package handlers

type BookHandler struct {
    bookUseCase usecases.BookUseCase
    logger      logger.Logger
}

func NewBookHandler(bookUseCase usecases.BookUseCase, logger logger.Logger) *BookHandler {
    return &BookHandler{
        bookUseCase: bookUseCase,
        logger:      logger,
    }
}

func (h *BookHandler) CreateBook(c *gin.Context) {
    var req dto.CreateBookRequest
    if err := c.ShouldBindJSON(&req); err != nil {
        h.logger.Warn("invalid request body", "error", err)
        responses.ErrorResponse(c, http.StatusBadRequest, "INVALID_REQUEST", "リクエストが正しくありません", err.Error())
        return
    }
    
    book, err := h.bookUseCase.CreateBook(c.Request.Context(), req)
    if err != nil {
        h.handleError(c, err)
        return
    }
    
    responses.SuccessResponse(c, http.StatusCreated, book, "書籍を登録しました")
}

func (h *BookHandler) GetBooks(c *gin.Context) {
    var req dto.GetBooksRequest
    if err := c.ShouldBindQuery(&req); err != nil {
        h.logger.Warn("invalid query parameters", "error", err)
        responses.ErrorResponse(c, http.StatusBadRequest, "INVALID_PARAMS", "パラメータが正しくありません", err.Error())
        return
    }
    
    // デフォルト値設定
    if req.Limit == 0 {
        req.Limit = 20
    }
    if req.SortBy == "" {
        req.SortBy = "created_at"
    }
    if req.SortOrder == "" {
        req.SortOrder = "desc"
    }
    
    books, err := h.bookUseCase.GetBooks(c.Request.Context(), req)
    if err != nil {
        h.handleError(c, err)
        return
    }
    
    responses.SuccessResponse(c, http.StatusOK, books, "書籍一覧を取得しました")
}

func (h *BookHandler) handleError(c *gin.Context, err error) {
    switch e := err.(type) {
    case *errors.ValidationError:
        responses.ErrorResponse(c, http.StatusBadRequest, "VALIDATION_ERROR", e.Message, e.Details)
    case *errors.BusinessError:
        responses.ErrorResponse(c, http.StatusConflict, "BUSINESS_ERROR", e.Message, "")
    case *errors.NotFoundError:
        responses.ErrorResponse(c, http.StatusNotFound, "NOT_FOUND", e.Message, "")
    default:
        h.logger.Error("internal server error", "error", err)
        responses.ErrorResponse(c, http.StatusInternalServerError, "INTERNAL_ERROR", "内部エラーが発生しました", "")
    }
}
```

### レスポンス標準化
```go
// internal/api/responses/response.go
package responses

type APIResponse struct {
    Success   bool        `json:"success"`
    Data      interface{} `json:"data,omitempty"`
    Error     *ErrorInfo  `json:"error,omitempty"`
    Message   string      `json:"message,omitempty"`
    Timestamp time.Time   `json:"timestamp"`
}

type ErrorInfo struct {
    Code    string `json:"code"`
    Message string `json:"message"`
    Details string `json:"details,omitempty"`
}

func SuccessResponse(c *gin.Context, status int, data interface{}, message string) {
    c.JSON(status, APIResponse{
        Success:   true,
        Data:      data,
        Message:   message,
        Timestamp: time.Now(),
    })
}

func ErrorResponse(c *gin.Context, status int, code, message, details string) {
    c.JSON(status, APIResponse{
        Success: false,
        Error: &ErrorInfo{
            Code:    code,
            Message: message,
            Details: details,
        },
        Timestamp: time.Now(),
    })
}
```

### ミドルウェア設計
```go
// internal/api/middleware/cors.go
func CORS() gin.HandlerFunc {
    return gin.HandlerFunc(func(c *gin.Context) {
        origin := c.Request.Header.Get("Origin")
        
        // 許可されたオリジンかチェック
        if isAllowedOrigin(origin) {
            c.Writer.Header().Set("Access-Control-Allow-Origin", origin)
        }
        
        c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
        c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With")
        c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS, GET, PUT, DELETE")

        if c.Request.Method == "OPTIONS" {
            c.AbortWithStatus(204)
            return
        }

        c.Next()
    })
}

// internal/api/middleware/rate_limit.go
func RateLimit() gin.HandlerFunc {
    store := memory.NewStore()
    return ratelimit.RateLimiter(store, &ratelimit.Options{
        ErrorHandler: func(c *gin.Context, info ratelimit.Info) {
            c.JSON(http.StatusTooManyRequests, gin.H{
                "error": "Too many requests",
                "retry_after": info.ResetTime,
            })
        },
        KeyFunc: func(c *gin.Context) string {
            return c.ClientIP()
        },
    })
}

// internal/api/middleware/logger.go
func Logger(logger logger.Logger) gin.HandlerFunc {
    return gin.LoggerWithFormatter(func(param gin.LogFormatterParams) string {
        logger.Info("HTTP Request",
            "method", param.Method,
            "path", param.Path,
            "status", param.StatusCode,
            "latency", param.Latency,
            "ip", param.ClientIP,
            "user_agent", param.Request.UserAgent(),
        )
        return ""
    })
}
```

## 🗄️ インフラ層設計

### データベース実装
```go
// internal/infrastructure/database/postgres.go
package database

type PostgresDB struct {
    db     *gorm.DB
    logger logger.Logger
}

func NewPostgresDB(config Config, logger logger.Logger) (*PostgresDB, error) {
    dsn := fmt.Sprintf("host=%s user=%s password=%s dbname=%s port=%s sslmode=%s TimeZone=Asia/Tokyo",
        config.Host, config.User, config.Password, config.DBName, config.Port, config.SSLMode)
    
    db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{
        Logger: gormLogger.New(
            log.New(os.Stdout, "\r\n", log.LstdFlags),
            gormLogger.Config{
                SlowThreshold: time.Second,
                LogLevel:      gormLogger.Info,
                Colorful:      true,
            },
        ),
        NamingStrategy: schema.NamingStrategy{
            SingularTable: false,
            NoLowerCase:   false,
        },
    })
    
    if err != nil {
        return nil, fmt.Errorf("failed to connect to database: %w", err)
    }
    
    // コネクションプール設定
    sqlDB, err := db.DB()
    if err != nil {
        return nil, fmt.Errorf("failed to get sql.DB: %w", err)
    }
    
    sqlDB.SetMaxIdleConns(10)
    sqlDB.SetMaxOpenConns(100)
    sqlDB.SetConnMaxLifetime(time.Hour)
    
    return &PostgresDB{db: db, logger: logger}, nil
}

func (p *PostgresDB) Migrate() error {
    return p.db.AutoMigrate(
        &entities.Book{},
        &entities.User{},
        // 他のエンティティ
    )
}
```

### リポジトリ実装
```go
// internal/infrastructure/repositories/book_repository_impl.go
package repositories

type BookRepositoryImpl struct {
    db     *gorm.DB
    logger logger.Logger
}

func NewBookRepositoryImpl(db *gorm.DB, logger logger.Logger) repositories.BookRepository {
    return &BookRepositoryImpl{db: db, logger: logger}
}

func (r *BookRepositoryImpl) Create(ctx context.Context, book *entities.Book) error {
    if err := r.db.WithContext(ctx).Create(book).Error; err != nil {
        r.logger.Error("failed to create book", "error", err)
        return fmt.Errorf("create book failed: %w", err)
    }
    return nil
}

func (r *BookRepositoryImpl) List(ctx context.Context, filter repositories.BookFilter) ([]*entities.Book, error) {
    var books []*entities.Book
    
    query := r.db.WithContext(ctx).Model(&entities.Book{})
    
    // フィルタリング
    if filter.Genre != "" {
        query = query.Where("genre = ?", filter.Genre)
    }
    if filter.Language != "" {
        query = query.Where("language = ?", filter.Language)
    }
    if filter.Status != "" {
        query = query.Where("status = ?", filter.Status)
    }
    if filter.Owner != "" {
        query = query.Where("owner ILIKE ?", "%"+filter.Owner+"%")
    }
    if filter.DateFrom != nil {
        query = query.Where("created_at >= ?", filter.DateFrom)
    }
    if filter.DateTo != nil {
        query = query.Where("created_at <= ?", filter.DateTo)
    }
    
    // ソート
    if filter.SortBy != "" {
        order := filter.SortBy
        if filter.SortOrder == "desc" {
            order += " DESC"
        }
        query = query.Order(order)
    }
    
    // ページネーション
    if filter.Limit > 0 {
        query = query.Limit(filter.Limit)
    }
    if filter.Offset > 0 {
        query = query.Offset(filter.Offset)
    }
    
    if err := query.Find(&books).Error; err != nil {
        r.logger.Error("failed to list books", "error", err)
        return nil, fmt.Errorf("list books failed: %w", err)
    }
    
    return books, nil
}
```

### キャッシュ実装
```go
// internal/infrastructure/cache/redis.go
package cache

type RedisCache struct {
    client *redis.Client
    logger logger.Logger
}

func NewRedisCache(addr, password string, db int, logger logger.Logger) *RedisCache {
    rdb := redis.NewClient(&redis.Options{
        Addr:     addr,
        Password: password,
        DB:       db,
    })
    
    return &RedisCache{client: rdb, logger: logger}
}

func (r *RedisCache) Set(ctx context.Context, key string, value []byte, expiration time.Duration) error {
    err := r.client.Set(ctx, key, value, expiration).Err()
    if err != nil {
        r.logger.Error("failed to set cache", "key", key, "error", err)
        return err
    }
    return nil
}

func (r *RedisCache) Get(ctx context.Context, key string) ([]byte, error) {
    val, err := r.client.Get(ctx, key).Result()
    if err != nil {
        if err == redis.Nil {
            return nil, errors.ErrCacheNotFound
        }
        r.logger.Error("failed to get cache", "key", key, "error", err)
        return nil, err
    }
    return []byte(val), nil
}
```

## 📊 パフォーマンス最適化

### データベース最適化
```go
// データベースインデックス最適化
func (r *BookRepositoryImpl) CreateIndexes() error {
    indexes := []string{
        "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_books_title ON books USING gin(to_tsvector('japanese', title))",
        "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_books_author ON books(author)",
        "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_books_genre ON books(genre)",
        "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_books_status ON books(status)",
        "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_books_created_at ON books(created_at DESC)",
        "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_books_owner ON books(owner)",
    }
    
    for _, idx := range indexes {
        if err := r.db.Exec(idx).Error; err != nil {
            r.logger.Error("failed to create index", "sql", idx, "error", err)
            return err
        }
    }
    
    return nil
}

// クエリ最適化
func (r *BookRepositoryImpl) SearchOptimized(ctx context.Context, query string, filter repositories.BookFilter) ([]*entities.Book, error) {
    var books []*entities.Book
    
    // 全文検索クエリ
    searchQuery := `
        SELECT * FROM books 
        WHERE to_tsvector('japanese', title || ' ' || author || ' ' || description) 
        @@ plainto_tsquery('japanese', ?)
        AND deleted_at IS NULL
    `
    
    args := []interface{}{query}
    
    // フィルター条件追加
    if filter.Genre != "" {
        searchQuery += " AND genre = ?"
        args = append(args, filter.Genre)
    }
    
    // ソート・ページネーション
    searchQuery += fmt.Sprintf(" ORDER BY %s %s LIMIT ? OFFSET ?", 
        filter.SortBy, filter.SortOrder)
    args = append(args, filter.Limit, filter.Offset)
    
    if err := r.db.WithContext(ctx).Raw(searchQuery, args...).Scan(&books).Error; err != nil {
        return nil, err
    }
    
    return books, nil
}
```

### 並行処理最適化
```go
// 並行処理によるバッチ操作
func (uc *BookUseCase) BulkCreateBooks(ctx context.Context, requests []dto.CreateBookRequest) ([]dto.BookResponse, []error) {
    const batchSize = 10
    const maxWorkers = 5
    
    results := make([]dto.BookResponse, len(requests))
    errors := make([]error, len(requests))
    
    // ワーカープール作成
    jobs := make(chan BatchJob, len(requests))
    wg := sync.WaitGroup{}
    
    // ワーカー起動
    for i := 0; i < maxWorkers; i++ {
        wg.Add(1)
        go func() {
            defer wg.Done()
            for job := range jobs {
                result, err := uc.CreateBook(ctx, job.Request)
                if err != nil {
                    errors[job.Index] = err
                } else {
                    results[job.Index] = *result
                }
            }
        }()
    }
    
    // ジョブ送信
    for i, req := range requests {
        jobs <- BatchJob{Index: i, Request: req}
    }
    close(jobs)
    
    wg.Wait()
    return results, errors
}
```

## 🧪 テスト設計

### ユニットテスト
```go
// internal/domain/entities/book_test.go
func TestBook_CanBeBorrowed(t *testing.T) {
    tests := []struct {
        name     string
        book     entities.Book
        expected bool
    }{
        {
            name: "available book can be borrowed",
            book: entities.Book{
                Status:    entities.BookStatusAvailable,
                DeletedAt: nil,
            },
            expected: true,
        },
        {
            name: "borrowed book cannot be borrowed",
            book: entities.Book{
                Status:    entities.BookStatusBorrowed,
                DeletedAt: nil,
            },
            expected: false,
        },
    }
    
    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            assert.Equal(t, tt.expected, tt.book.CanBeBorrowed())
        })
    }
}
```

### 統合テスト
```go
// tests/integration/book_api_test.go
func TestBookAPI_CreateBook(t *testing.T) {
    // テスト用データベース設定
    testDB := setupTestDB(t)
    defer teardownTestDB(t, testDB)
    
    // テスト用サーバー起動
    server := setupTestServer(t, testDB)
    defer server.Close()
    
    // テストケース
    testCases := []struct {
        name           string
        payload        dto.CreateBookRequest
        expectedStatus int
        expectedError  string
    }{
        {
            name: "valid book creation",
            payload: dto.CreateBookRequest{
                Title:     "Test Book",
                Author:    "Test Author",
                Publisher: "Test Publisher",
                Owner:     "Test Owner",
            },
            expectedStatus: http.StatusCreated,
        },
        {
            name: "missing required fields",
            payload: dto.CreateBookRequest{
                Title: "Test Book",
                // Author missing
            },
            expectedStatus: http.StatusBadRequest,
            expectedError:  "VALIDATION_ERROR",
        },
    }
    
    for _, tc := range testCases {
        t.Run(tc.name, func(t *testing.T) {
            body, _ := json.Marshal(tc.payload)
            req := httptest.NewRequest("POST", "/api/books", bytes.NewBuffer(body))
            req.Header.Set("Content-Type", "application/json")
            
            resp := httptest.NewRecorder()
            server.Handler.ServeHTTP(resp, req)
            
            assert.Equal(t, tc.expectedStatus, resp.Code)
            
            if tc.expectedError != "" {
                var response responses.APIResponse
                json.Unmarshal(resp.Body.Bytes(), &response)
                assert.Equal(t, tc.expectedError, response.Error.Code)
            }
        })
    }
}
```

---

**最終更新**: 2025年6月15日  
**対象バージョン**: Go 1.23+, Gin 1.9+  
**ステータス**: 実装中