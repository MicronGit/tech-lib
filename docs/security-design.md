# 🔐 セキュリティ設計書 - 技術書管理システム

> 多層防御による包括的セキュリティアーキテクチャ設計

## 📋 セキュリティ概要

### セキュリティ基本方針
- **多層防御**: ネットワーク・アプリケーション・データの各レイヤーでの保護
- **最小権限の原則**: 必要最小限のアクセス権限付与
- **ゼロトラスト**: 内部・外部を問わずすべてのアクセスを検証
- **セキュリティバイデザイン**: 設計段階からのセキュリティ考慮
- **継続的監視**: 24/7 セキュリティ監視と脅威検知
- **コンプライアンス**: OWASP、PCI DSS準拠

### セキュリティ脅威モデル
```
外部脅威:
├── DDoS攻撃 → WAF + CloudFront + Rate Limiting
├── SQLインジェクション → ORM + パラメータ化クエリ
├── XSS攻撃 → CSP + 入力値検証 + エスケープ処理
├── CSRF攻撃 → CSRFトークン + SameSite Cookie
└── ブルートフォース → アカウントロック + CAPTCHA

内部脅威:
├── 権限昇格 → RBAC + 最小権限の原則
├── データ漏洩 → 暗号化 + アクセスログ
├── 不正操作 → 操作ログ + 承認フロー
└── 内部犯行 → 職務分離 + 監査ログ
```

## 🛡️ 認証・認可設計

### JWT ベース認証システム

#### JWT実装アーキテクチャ
```go
// internal/domain/entities/auth.go
package entities

import (
    "time"
    "github.com/golang-jwt/jwt/v5"
    "github.com/google/uuid"
)

type TokenPair struct {
    AccessToken  string    `json:"access_token"`
    RefreshToken string    `json:"refresh_token"`
    ExpiresAt    time.Time `json:"expires_at"`
    TokenType    string    `json:"token_type"`
}

type JWTClaims struct {
    UserID      uuid.UUID `json:"user_id"`
    Email       string    `json:"email"`
    Role        UserRole  `json:"role"`
    Permissions []string  `json:"permissions"`
    SessionID   uuid.UUID `json:"session_id"`
    jwt.RegisteredClaims
}

type RefreshTokenClaims struct {
    UserID    uuid.UUID `json:"user_id"`
    SessionID uuid.UUID `json:"session_id"`
    jwt.RegisteredClaims
}

// セキュアトークン生成
func (a *AuthService) GenerateTokenPair(user *User, sessionID uuid.UUID) (*TokenPair, error) {
    now := time.Now()
    
    // Access Token (短期間: 15分)
    accessClaims := &JWTClaims{
        UserID:      user.ID,
        Email:       user.Email,
        Role:        user.Role,
        Permissions: a.getPermissions(user.Role),
        SessionID:   sessionID,
        RegisteredClaims: jwt.RegisteredClaims{
            Issuer:    "tech-lib-system",
            Subject:   user.ID.String(),
            Audience:  []string{"tech-lib-api"},
            ExpiresAt: jwt.NewNumericDate(now.Add(15 * time.Minute)),
            NotBefore: jwt.NewNumericDate(now),
            IssuedAt:  jwt.NewNumericDate(now),
            ID:        uuid.New().String(),
        },
    }
    
    accessToken, err := jwt.NewWithClaims(jwt.SigningMethodHS256, accessClaims).
        SignedString([]byte(a.config.JWTSecret))
    if err != nil {
        return nil, fmt.Errorf("failed to generate access token: %w", err)
    }
    
    // Refresh Token (長期間: 7日間)
    refreshClaims := &RefreshTokenClaims{
        UserID:    user.ID,
        SessionID: sessionID,
        RegisteredClaims: jwt.RegisteredClaims{
            Issuer:    "tech-lib-system",
            Subject:   user.ID.String(),
            ExpiresAt: jwt.NewNumericDate(now.Add(7 * 24 * time.Hour)),
            NotBefore: jwt.NewNumericDate(now),
            IssuedAt:  jwt.NewNumericDate(now),
            ID:        uuid.New().String(),
        },
    }
    
    refreshToken, err := jwt.NewWithClaims(jwt.SigningMethodHS256, refreshClaims).
        SignedString([]byte(a.config.RefreshSecret))
    if err != nil {
        return nil, fmt.Errorf("failed to generate refresh token: %w", err)
    }
    
    return &TokenPair{
        AccessToken:  accessToken,
        RefreshToken: refreshToken,
        ExpiresAt:    accessClaims.ExpiresAt.Time,
        TokenType:    "Bearer",
    }, nil
}
```

#### 認証ミドルウェア
```go
// internal/api/middleware/auth.go
package middleware

import (
    "context"
    "strings"
    "net/http"
    "github.com/gin-gonic/gin"
    "github.com/golang-jwt/jwt/v5"
)

type AuthMiddleware struct {
    authService    services.AuthService
    sessionService services.SessionService
    logger         logger.Logger
}

func (m *AuthMiddleware) RequireAuth() gin.HandlerFunc {
    return gin.HandlerFunc(func(c *gin.Context) {
        // トークン抽出
        authHeader := c.GetHeader("Authorization")
        if authHeader == "" {
            m.respondUnauthorized(c, "missing authorization header")
            return
        }
        
        tokenString := strings.TrimPrefix(authHeader, "Bearer ")
        if tokenString == authHeader {
            m.respondUnauthorized(c, "invalid authorization format")
            return
        }
        
        // トークン検証
        claims, err := m.authService.ValidateAccessToken(tokenString)
        if err != nil {
            m.logger.Warn("invalid token", "error", err, "ip", c.ClientIP())
            m.respondUnauthorized(c, "invalid token")
            return
        }
        
        // セッション検証
        session, err := m.sessionService.GetSession(c.Request.Context(), claims.SessionID)
        if err != nil || !session.IsActive {
            m.logger.Warn("invalid session", "session_id", claims.SessionID, "ip", c.ClientIP())
            m.respondUnauthorized(c, "session expired")
            return
        }
        
        // レート制限チェック
        if err := m.checkRateLimit(c, claims.UserID.String()); err != nil {
            c.JSON(http.StatusTooManyRequests, gin.H{
                "error": "rate limit exceeded",
                "retry_after": 60,
            })
            c.Abort()
            return
        }
        
        // コンテキストに認証情報設定
        c.Set("user_id", claims.UserID)
        c.Set("user_email", claims.Email)
        c.Set("user_role", claims.Role)
        c.Set("permissions", claims.Permissions)
        c.Set("session_id", claims.SessionID)
        
        // セッション活動記録
        go m.sessionService.UpdateActivity(context.Background(), claims.SessionID, c.ClientIP())
        
        c.Next()
    })
}

func (m *AuthMiddleware) RequirePermission(permission string) gin.HandlerFunc {
    return gin.HandlerFunc(func(c *gin.Context) {
        permissions, exists := c.Get("permissions")
        if !exists {
            m.respondForbidden(c, "no permissions found")
            return
        }
        
        permList, ok := permissions.([]string)
        if !ok {
            m.respondForbidden(c, "invalid permissions format")
            return
        }
        
        hasPermission := false
        for _, perm := range permList {
            if perm == permission || perm == "admin:*" {
                hasPermission = true
                break
            }
        }
        
        if !hasPermission {
            userID, _ := c.Get("user_id")
            m.logger.Warn("insufficient permissions", 
                "user_id", userID, 
                "required_permission", permission,
                "ip", c.ClientIP())
            m.respondForbidden(c, "insufficient permissions")
            return
        }
        
        c.Next()
    })
}
```

### RBAC (Role-Based Access Control)

#### 権限管理システム
```go
// internal/domain/entities/permission.go
package entities

type Permission struct {
    ID          uuid.UUID `json:"id" gorm:"type:uuid;primary_key"`
    Name        string    `json:"name" gorm:"unique;not null"`
    Resource    string    `json:"resource" gorm:"not null"`
    Action      string    `json:"action" gorm:"not null"`
    Description string    `json:"description"`
    CreatedAt   time.Time `json:"created_at"`
}

type Role struct {
    ID          uuid.UUID    `json:"id" gorm:"type:uuid;primary_key"`
    Name        string       `json:"name" gorm:"unique;not null"`
    Description string       `json:"description"`
    Permissions []Permission `json:"permissions" gorm:"many2many:role_permissions;"`
    CreatedAt   time.Time    `json:"created_at"`
    UpdatedAt   time.Time    `json:"updated_at"`
}

// 権限定義
var DefaultPermissions = map[string][]Permission{
    "admin": {
        {Resource: "*", Action: "*"},  // 全権限
    },
    "librarian": {
        {Resource: "books", Action: "create"},
        {Resource: "books", Action: "read"},
        {Resource: "books", Action: "update"},
        {Resource: "books", Action: "delete"},
        {Resource: "users", Action: "read"},
        {Resource: "reports", Action: "read"},
    },
    "user": {
        {Resource: "books", Action: "read"},
        {Resource: "books", Action: "borrow"},
        {Resource: "books", Action: "return"},
        {Resource: "profile", Action: "read"},
        {Resource: "profile", Action: "update"},
    },
}

// 権限チェック
func (u *User) HasPermission(resource, action string) bool {
    for _, role := range u.Roles {
        for _, permission := range role.Permissions {
            if (permission.Resource == "*" || permission.Resource == resource) &&
               (permission.Action == "*" || permission.Action == action) {
                return true
            }
        }
    }
    return false
}
```

## 🔒 データ保護設計

### 暗号化戦略

#### 保存時暗号化 (Encryption at Rest)
```go
// internal/infrastructure/crypto/encryption.go
package crypto

import (
    "crypto/aes"
    "crypto/cipher"
    "crypto/rand"
    "crypto/sha256"
    "encoding/hex"
    "fmt"
    "golang.org/x/crypto/pbkdf2"
)

type EncryptionService struct {
    masterKey []byte
}

func NewEncryptionService(keyString string) *EncryptionService {
    key := sha256.Sum256([]byte(keyString))
    return &EncryptionService{masterKey: key[:]}
}

// AES-256-GCM による暗号化
func (e *EncryptionService) Encrypt(plaintext string) (string, error) {
    block, err := aes.NewCipher(e.masterKey)
    if err != nil {
        return "", fmt.Errorf("failed to create cipher: %w", err)
    }
    
    aesGCM, err := cipher.NewGCM(block)
    if err != nil {
        return "", fmt.Errorf("failed to create GCM: %w", err)
    }
    
    nonce := make([]byte, aesGCM.NonceSize())
    if _, err := rand.Read(nonce); err != nil {
        return "", fmt.Errorf("failed to generate nonce: %w", err)
    }
    
    ciphertext := aesGCM.Seal(nonce, nonce, []byte(plaintext), nil)
    return hex.EncodeToString(ciphertext), nil
}

func (e *EncryptionService) Decrypt(ciphertext string) (string, error) {
    data, err := hex.DecodeString(ciphertext)
    if err != nil {
        return "", fmt.Errorf("failed to decode hex: %w", err)
    }
    
    block, err := aes.NewCipher(e.masterKey)
    if err != nil {
        return "", fmt.Errorf("failed to create cipher: %w", err)
    }
    
    aesGCM, err := cipher.NewGCM(block)
    if err != nil {
        return "", fmt.Errorf("failed to create GCM: %w", err)
    }
    
    nonceSize := aesGCM.NonceSize()
    if len(data) < nonceSize {
        return "", fmt.Errorf("ciphertext too short")
    }
    
    nonce, ciphertext := data[:nonceSize], data[nonceSize:]
    plaintext, err := aesGCM.Open(nil, nonce, ciphertext, nil)
    if err != nil {
        return "", fmt.Errorf("failed to decrypt: %w", err)
    }
    
    return string(plaintext), nil
}

// パスワードハッシュ化 (Argon2)
func (e *EncryptionService) HashPassword(password string) (string, error) {
    salt := make([]byte, 32)
    if _, err := rand.Read(salt); err != nil {
        return "", fmt.Errorf("failed to generate salt: %w", err)
    }
    
    hash := argon2.IDKey([]byte(password), salt, 1, 64*1024, 4, 32)
    
    return fmt.Sprintf("$argon2id$v=%d$m=%d,t=%d,p=%d$%s$%s",
        argon2.Version, 64*1024, 1, 4,
        hex.EncodeToString(salt),
        hex.EncodeToString(hash)), nil
}
```

#### 通信時暗号化 (Encryption in Transit)
```yaml
# TLS設定
apiVersion: v1
kind: Secret
metadata:
  name: tls-certificates
type: kubernetes.io/tls
data:
  tls.crt: |
    # TLS証明書 (Let's Encrypt + cert-manager)
  tls.key: |
    # 秘密鍵

---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: tech-lib-ingress
  annotations:
    kubernetes.io/ingress.class: "nginx"
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
    nginx.ingress.kubernetes.io/force-ssl-redirect: "true"
    nginx.ingress.kubernetes.io/ssl-protocols: "TLSv1.2 TLSv1.3"
    nginx.ingress.kubernetes.io/ssl-ciphers: "ECDHE-RSA-AES128-GCM-SHA256,ECDHE-RSA-AES256-GCM-SHA384"
    nginx.ingress.kubernetes.io/server-snippet: |
      ssl_stapling on;
      ssl_stapling_verify on;
      ssl_session_cache shared:SSL:10m;
      ssl_session_timeout 10m;
spec:
  tls:
  - hosts:
    - tech-lib.example.com
    secretName: tech-lib-tls
  rules:
  - host: tech-lib.example.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: frontend-service
            port:
              number: 80
```

### 個人情報保護

#### データマスキング
```go
// internal/api/responses/masking.go
package responses

import (
    "regexp"
    "strings"
)

type DataMasker struct {
    emailRegex *regexp.Regexp
    phoneRegex *regexp.Regexp
}

func NewDataMasker() *DataMasker {
    return &DataMasker{
        emailRegex: regexp.MustCompile(`([a-zA-Z0-9._%+-]+)@([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})`),
        phoneRegex: regexp.MustCompile(`(\d{3})-(\d{4})-(\d{4})`),
    }
}

func (m *DataMasker) MaskEmail(email string) string {
    return m.emailRegex.ReplaceAllStringFunc(email, func(match string) string {
        parts := strings.Split(match, "@")
        if len(parts) != 2 {
            return match
        }
        
        username := parts[0]
        domain := parts[1]
        
        if len(username) <= 2 {
            return "***@" + domain
        }
        
        masked := username[:1] + strings.Repeat("*", len(username)-2) + username[len(username)-1:]
        return masked + "@" + domain
    })
}

func (m *DataMasker) MaskPhone(phone string) string {
    return m.phoneRegex.ReplaceAllString(phone, "$1-****-$3")
}

// ログ出力時の自動マスキング
type MaskedUser struct {
    ID    uuid.UUID `json:"id"`
    Email string    `json:"email"`
    Name  string    `json:"name"`
}

func (u *User) ToMasked() *MaskedUser {
    masker := NewDataMasker()
    return &MaskedUser{
        ID:    u.ID,
        Email: masker.MaskEmail(u.Email),
        Name:  u.Name,
    }
}
```

## 🚨 脅威検知・対応

### セキュリティ監視システム

#### 異常検知
```go
// internal/infrastructure/security/anomaly_detector.go
package security

import (
    "context"
    "time"
)

type AnomalyDetector struct {
    redis  cache.Cache
    logger logger.Logger
    config *Config
}

type SecurityEvent struct {
    Type        EventType `json:"type"`
    UserID      uuid.UUID `json:"user_id,omitempty"`
    IP          string    `json:"ip"`
    UserAgent   string    `json:"user_agent"`
    Timestamp   time.Time `json:"timestamp"`
    Severity    Severity  `json:"severity"`
    Description string    `json:"description"`
    Details     map[string]interface{} `json:"details"`
}

type EventType string
type Severity string

const (
    EventTypeLoginFailure     EventType = "login_failure"
    EventTypeUnusualAccess    EventType = "unusual_access"
    EventTypeBruteForce       EventType = "brute_force"
    EventTypeSQLInjection     EventType = "sql_injection"
    EventTypeXSSAttempt       EventType = "xss_attempt"
    EventTypeRateLimitExceeded EventType = "rate_limit_exceeded"
    
    SeverityLow      Severity = "low"
    SeverityMedium   Severity = "medium"
    SeverityHigh     Severity = "high"
    SeverityCritical Severity = "critical"
)

func (d *AnomalyDetector) DetectLoginAnomaly(ctx context.Context, userID uuid.UUID, ip string, success bool) error {
    key := fmt.Sprintf("login_attempts:%s", ip)
    
    if !success {
        // 失敗回数をカウント
        count, err := d.redis.Increment(ctx, key)
        if err != nil {
            return err
        }
        
        if count == 1 {
            d.redis.SetExpiration(ctx, key, 15*time.Minute)
        }
        
        // ブルートフォース攻撃検知
        if count >= d.config.MaxLoginAttempts {
            event := &SecurityEvent{
                Type:        EventTypeBruteForce,
                UserID:      userID,
                IP:          ip,
                Timestamp:   time.Now(),
                Severity:    SeverityHigh,
                Description: fmt.Sprintf("Brute force attack detected from IP %s", ip),
                Details: map[string]interface{}{
                    "attempts": count,
                    "window":   "15m",
                },
            }
            
            if err := d.reportSecurityEvent(ctx, event); err != nil {
                d.logger.Error("failed to report security event", "error", err)
            }
            
            // IP を一時的にブロック
            blockKey := fmt.Sprintf("blocked_ip:%s", ip)
            d.redis.Set(ctx, blockKey, "true", time.Hour)
        }
    } else {
        // ログイン成功時はカウンターをリセット
        d.redis.Delete(ctx, key)
    }
    
    return nil
}

func (d *AnomalyDetector) DetectUnusualAccess(ctx context.Context, userID uuid.UUID, ip string, userAgent string) error {
    // 通常のアクセスパターンと比較
    userKey := fmt.Sprintf("user_patterns:%s", userID.String())
    patterns, err := d.getUserAccessPatterns(ctx, userKey)
    if err != nil {
        return err
    }
    
    // 地理的位置の変化を検出
    location, err := d.getIPLocation(ip)
    if err == nil && patterns.LastLocation != "" {
        distance := d.calculateDistance(patterns.LastLocation, location)
        if distance > 1000 { // 1000km以上の移動
            event := &SecurityEvent{
                Type:        EventTypeUnusualAccess,
                UserID:      userID,
                IP:          ip,
                UserAgent:   userAgent,
                Timestamp:   time.Now(),
                Severity:    SeverityMedium,
                Description: "Unusual geographic access detected",
                Details: map[string]interface{}{
                    "previous_location": patterns.LastLocation,
                    "current_location":  location,
                    "distance_km":       distance,
                },
            }
            
            d.reportSecurityEvent(ctx, event)
        }
    }
    
    // パターンを更新
    patterns.LastIP = ip
    patterns.LastLocation = location
    patterns.LastAccess = time.Now()
    
    return d.updateUserAccessPatterns(ctx, userKey, patterns)
}
```

#### WAF設定とレート制限
```go
// internal/api/middleware/security.go
package middleware

type SecurityMiddleware struct {
    rateLimiter  ratelimit.Limiter
    wafRules     []WAFRule
    ipBlocklist  cache.Cache
    logger       logger.Logger
}

type WAFRule struct {
    Name        string
    Pattern     *regexp.Regexp
    Severity    Severity
    Action      WAFAction
    Description string
}

type WAFAction string

const (
    ActionBlock WAFAction = "block"
    ActionLog   WAFAction = "log"
    ActionAlert WAFAction = "alert"
)

func (m *SecurityMiddleware) WAFProtection() gin.HandlerFunc {
    return gin.HandlerFunc(func(c *gin.Context) {
        // IP ブロックリストチェック
        if blocked, _ := m.ipBlocklist.Get(c.Request.Context(), "blocked_ip:"+c.ClientIP()); blocked != nil {
            c.JSON(http.StatusForbidden, gin.H{
                "error": "IP address is blocked",
            })
            c.Abort()
            return
        }
        
        // WAF ルール検査
        body, _ := io.ReadAll(c.Request.Body)
        c.Request.Body = io.NopCloser(bytes.NewBuffer(body))
        
        requestContent := string(body) + c.Request.URL.RawQuery
        
        for _, rule := range m.wafRules {
            if rule.Pattern.MatchString(requestContent) {
                event := &SecurityEvent{
                    Type:        EventTypeSQLInjection, // または EventTypeXSSAttempt
                    IP:          c.ClientIP(),
                    UserAgent:   c.Request.UserAgent(),
                    Timestamp:   time.Now(),
                    Severity:    rule.Severity,
                    Description: rule.Description,
                    Details: map[string]interface{}{
                        "rule_name":    rule.Name,
                        "request_uri":  c.Request.RequestURI,
                        "method":       c.Request.Method,
                        "matched_text": rule.Pattern.FindString(requestContent),
                    },
                }
                
                m.logger.Warn("WAF rule triggered", 
                    "rule", rule.Name,
                    "ip", c.ClientIP(),
                    "severity", rule.Severity)
                
                switch rule.Action {
                case ActionBlock:
                    c.JSON(http.StatusBadRequest, gin.H{
                        "error": "Request blocked by security policy",
                    })
                    c.Abort()
                    return
                case ActionAlert:
                    // アラート送信（非同期）
                    go m.sendSecurityAlert(event)
                }
            }
        }
        
        c.Next()
    })
}

// WAF ルール定義
var defaultWAFRules = []WAFRule{
    {
        Name:        "SQL Injection Detection",
        Pattern:     regexp.MustCompile(`(?i)(union|select|insert|delete|update|drop|alter|exec|execute|script|javascript|vbscript).*['"<>]`),
        Severity:    SeverityHigh,
        Action:      ActionBlock,
        Description: "Potential SQL injection attempt detected",
    },
    {
        Name:        "XSS Detection",
        Pattern:     regexp.MustCompile(`(?i)<script[^>]*>.*?</script>`),
        Severity:    SeverityHigh,
        Action:      ActionBlock,
        Description: "Potential XSS attack detected",
    },
    {
        Name:        "Path Traversal Detection",
        Pattern:     regexp.MustCompile(`(?i)(\.\./|\.\.\\|%2e%2e%2f|%2e%2e%5c)`),
        Severity:    SeverityMedium,
        Action:      ActionBlock,
        Description: "Path traversal attempt detected",
    },
}
```

## 🔍 監査・ログ管理

### セキュリティログ設計

#### 監査ログ
```go
// internal/infrastructure/audit/audit_logger.go
package audit

import (
    "context"
    "encoding/json"
    "time"
)

type AuditLogger struct {
    logger     logger.Logger
    storage    storage.Storage
    encryptor  crypto.EncryptionService
}

type AuditEvent struct {
    ID          uuid.UUID              `json:"id"`
    Timestamp   time.Time              `json:"timestamp"`
    UserID      *uuid.UUID             `json:"user_id,omitempty"`
    SessionID   *uuid.UUID             `json:"session_id,omitempty"`
    Action      string                 `json:"action"`
    Resource    string                 `json:"resource"`
    ResourceID  *uuid.UUID             `json:"resource_id,omitempty"`
    IP          string                 `json:"ip"`
    UserAgent   string                 `json:"user_agent"`
    Success     bool                   `json:"success"`
    ErrorCode   string                 `json:"error_code,omitempty"`
    Details     map[string]interface{} `json:"details,omitempty"`
    Checksum    string                 `json:"checksum"`
}

func (a *AuditLogger) LogAction(ctx context.Context, event *AuditEvent) error {
    event.ID = uuid.New()
    event.Timestamp = time.Now()
    
    // イベントデータをJSON化
    eventJSON, err := json.Marshal(event)
    if err != nil {
        return fmt.Errorf("failed to marshal audit event: %w", err)
    }
    
    // チェックサム生成（改ざん検知）
    event.Checksum = a.generateChecksum(eventJSON)
    
    // 再度JSON化（チェックサム含む）
    finalJSON, err := json.Marshal(event)
    if err != nil {
        return fmt.Errorf("failed to marshal final audit event: %w", err)
    }
    
    // 暗号化
    encryptedData, err := a.encryptor.Encrypt(string(finalJSON))
    if err != nil {
        return fmt.Errorf("failed to encrypt audit event: %w", err)
    }
    
    // ストレージに保存
    key := fmt.Sprintf("audit/%s/%s.log", 
        event.Timestamp.Format("2006/01/02"), 
        event.ID.String())
    
    if err := a.storage.Store(ctx, key, []byte(encryptedData)); err != nil {
        return fmt.Errorf("failed to store audit event: %w", err)
    }
    
    // ログ出力
    a.logger.Info("audit event recorded",
        "event_id", event.ID,
        "action", event.Action,
        "resource", event.Resource,
        "user_id", event.UserID,
        "success", event.Success)
    
    return nil
}

// 重要操作の監査
func (a *AuditLogger) LogBookOperation(ctx context.Context, userID uuid.UUID, action string, book *entities.Book, success bool, errorCode string) error {
    return a.LogAction(ctx, &AuditEvent{
        UserID:     &userID,
        Action:     action,
        Resource:   "book",
        ResourceID: &book.ID,
        Success:    success,
        ErrorCode:  errorCode,
        Details: map[string]interface{}{
            "book_title":  book.Title,
            "book_author": book.Author,
            "old_status":  book.Status,
        },
    })
}
```

#### ログ分析・アラート
```yaml
# monitoring/security-alerts.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: security-alerts
data:
  rules.yml: |
    groups:
    - name: security-alerts
      rules:
      - alert: HighFailedLoginRate
        expr: sum(rate(auth_login_failures_total[5m])) > 10
        for: 2m
        labels:
          severity: warning
          category: security
        annotations:
          summary: "High failed login rate detected"
          description: "Failed login rate is {{ $value }} per second"
          runbook_url: "https://docs.company.com/runbooks/security/high-failed-login"
      
      - alert: SuspiciousIPActivity
        expr: count by (source_ip) (rate(http_requests_total{status=~"4.."}[10m])) > 50
        for: 5m
        labels:
          severity: critical
          category: security
        annotations:
          summary: "Suspicious activity from IP {{ $labels.source_ip }}"
          description: "IP {{ $labels.source_ip }} has {{ $value }} error requests per second"
      
      - alert: SQLInjectionAttempt
        expr: increase(waf_blocked_requests_total{rule="sql_injection"}[1m]) > 0
        labels:
          severity: high
          category: security
        annotations:
          summary: "SQL injection attempt blocked"
          description: "WAF blocked {{ $value }} SQL injection attempts"
      
      - alert: UnauthorizedDataAccess
        expr: increase(audit_events_total{action="unauthorized_access"}[5m]) > 0
        labels:
          severity: critical
          category: security
        annotations:
          summary: "Unauthorized data access attempt"
          description: "{{ $value }} unauthorized access attempts detected"
```

## 🔧 セキュリティ運用

### セキュリティ設定管理

#### Kubernetes セキュリティポリシー
```yaml
# security/pod-security-policy.yaml
apiVersion: policy/v1beta1
kind: PodSecurityPolicy
metadata:
  name: tech-lib-restricted
spec:
  privileged: false
  allowPrivilegeEscalation: false
  requiredDropCapabilities:
    - ALL
  volumes:
    - 'configMap'
    - 'emptyDir'
    - 'projected'
    - 'secret'
    - 'downwardAPI'
    - 'persistentVolumeClaim'
  runAsUser:
    rule: 'MustRunAsNonRoot'
  seLinux:
    rule: 'RunAsAny'
  fsGroup:
    rule: 'RunAsAny'
  readOnlyRootFilesystem: true

---
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: tech-lib-network-policy
spec:
  podSelector:
    matchLabels:
      app: tech-lib
  policyTypes:
  - Ingress
  - Egress
  ingress:
  - from:
    - namespaceSelector:
        matchLabels:
          name: ingress-nginx
    ports:
    - protocol: TCP
      port: 8080
  egress:
  - to:
    - namespaceSelector:
        matchLabels:
          name: database
    ports:
    - protocol: TCP
      port: 5432
  - to:
    - namespaceSelector:
        matchLabels:
          name: cache
    ports:
    - protocol: TCP
      port: 6379
```

### 脆弱性管理

#### セキュリティスキャン
```yaml
# .github/workflows/security-scan.yml
name: Security Scan

on:
  schedule:
    - cron: '0 2 * * *'  # 毎日午前2時
  push:
    branches: [main]

jobs:
  vulnerability-scan:
    runs-on: ubuntu-latest
    steps:
    - name: Checkout code
      uses: actions/checkout@v4
    
    - name: Run Trivy vulnerability scanner
      uses: aquasecurity/trivy-action@master
      with:
        scan-type: 'fs'
        scan-ref: '.'
        format: 'sarif'
        output: 'trivy-results.sarif'
    
    - name: Upload Trivy scan results
      uses: github/codeql-action/upload-sarif@v2
      with:
        sarif_file: 'trivy-results.sarif'
    
    - name: Run OWASP Dependency Check
      uses: dependency-check/Dependency-Check_Action@main
      with:
        project: 'tech-lib'
        path: '.'
        format: 'ALL'
    
    - name: Upload dependency check results
      uses: actions/upload-artifact@v3
      with:
        name: dependency-check-report
        path: reports/

  secret-scan:
    runs-on: ubuntu-latest
    steps:
    - name: Checkout code
      uses: actions/checkout@v4
      with:
        fetch-depth: 0
    
    - name: Run TruffleHog
      uses: trufflesecurity/trufflehog@main
      with:
        path: ./
        base: main
        head: HEAD
        extra_args: --debug --only-verified

  sast-scan:
    runs-on: ubuntu-latest
    steps:
    - name: Checkout code
      uses: actions/checkout@v4
    
    - name: Run CodeQL Analysis
      uses: github/codeql-action/init@v2
      with:
        languages: go, javascript
    
    - name: Autobuild
      uses: github/codeql-action/autobuild@v2
    
    - name: Perform CodeQL Analysis
      uses: github/codeql-action/analyze@v2
```

### インシデント対応

#### インシデント対応手順
```go
// internal/infrastructure/security/incident_response.go
package security

type IncidentResponse struct {
    logger        logger.Logger
    notification  notification.Service
    storage       storage.Storage
    config        *Config
}

type Incident struct {
    ID          uuid.UUID      `json:"id"`
    Type        IncidentType   `json:"type"`
    Severity    Severity       `json:"severity"`
    Status      IncidentStatus `json:"status"`
    Title       string         `json:"title"`
    Description string         `json:"description"`
    Reporter    string         `json:"reporter"`
    Assignee    string         `json:"assignee"`
    CreatedAt   time.Time      `json:"created_at"`
    UpdatedAt   time.Time      `json:"updated_at"`
    ResolvedAt  *time.Time     `json:"resolved_at,omitempty"`
    Actions     []Action       `json:"actions"`
    Artifacts   []Artifact     `json:"artifacts"`
}

type IncidentType string
type IncidentStatus string

const (
    IncidentTypeSecurityBreach IncidentType = "security_breach"
    IncidentTypeDataLeak       IncidentType = "data_leak"
    IncidentTypeMalwareDetection IncidentType = "malware_detection"
    IncidentTypeDDoSAttack     IncidentType = "ddos_attack"
    
    StatusOpen       IncidentStatus = "open"
    StatusInProgress IncidentStatus = "in_progress"
    StatusResolved   IncidentStatus = "resolved"
    StatusClosed     IncidentStatus = "closed"
)

func (ir *IncidentResponse) CreateIncident(ctx context.Context, incidentType IncidentType, severity Severity, title, description string) (*Incident, error) {
    incident := &Incident{
        ID:          uuid.New(),
        Type:        incidentType,
        Severity:    severity,
        Status:      StatusOpen,
        Title:       title,
        Description: description,
        Reporter:    "system",
        CreatedAt:   time.Now(),
        UpdatedAt:   time.Now(),
        Actions:     []Action{},
        Artifacts:   []Artifact{},
    }
    
    // 重要度に応じた自動アクション
    switch severity {
    case SeverityCritical:
        // 即座にセキュリティチームに通知
        ir.notification.SendUrgentAlert(ctx, incident)
        // 自動的に一時的な保護措置を実施
        go ir.implementEmergencyProtection(ctx, incident)
        
    case SeverityHigh:
        // セキュリティチームに通知
        ir.notification.SendAlert(ctx, incident)
        
    case SeverityMedium:
        // 通常の通知
        ir.notification.SendNotification(ctx, incident)
    }
    
    // インシデントをストレージに保存
    if err := ir.storeIncident(ctx, incident); err != nil {
        return nil, fmt.Errorf("failed to store incident: %w", err)
    }
    
    ir.logger.Warn("security incident created",
        "incident_id", incident.ID,
        "type", incident.Type,
        "severity", incident.Severity,
        "title", incident.Title)
    
    return incident, nil
}

func (ir *IncidentResponse) implementEmergencyProtection(ctx context.Context, incident *Incident) {
    switch incident.Type {
    case IncidentTypeDDoSAttack:
        // レート制限を厳格化
        ir.updateRateLimits(ctx, 10) // 通常の1/10に制限
        
    case IncidentTypeSecurityBreach:
        // 全セッションを無効化
        ir.invalidateAllSessions(ctx)
        // 緊急メンテナンスモード
        ir.enableMaintenanceMode(ctx)
    }
}
```

## 📋 コンプライアンス

### データプライバシー対応

#### GDPR対応
```go
// internal/application/services/privacy_service.go
package services

type PrivacyService struct {
    userRepo   repositories.UserRepository
    auditLogger audit.AuditLogger
    encryptor  crypto.EncryptionService
}

// データポータビリティ（データのエクスポート）
func (p *PrivacyService) ExportUserData(ctx context.Context, userID uuid.UUID) (*UserDataExport, error) {
    user, err := p.userRepo.GetByID(ctx, userID)
    if err != nil {
        return nil, fmt.Errorf("failed to get user: %w", err)
    }
    
    // すべての関連データを収集
    books, _ := p.bookRepo.GetByOwner(ctx, user.Email)
    borrowHistory, _ := p.borrowRepo.GetByUser(ctx, userID)
    
    export := &UserDataExport{
        User:          user,
        Books:         books,
        BorrowHistory: borrowHistory,
        ExportedAt:    time.Now(),
    }
    
    // 監査ログ
    p.auditLogger.LogAction(ctx, &audit.AuditEvent{
        UserID:   &userID,
        Action:   "data_export",
        Resource: "user_data",
        Success:  true,
    })
    
    return export, nil
}

// 忘れられる権利（データの削除）
func (p *PrivacyService) DeleteUserData(ctx context.Context, userID uuid.UUID, reason string) error {
    // 削除前のデータ状態を記録
    user, err := p.userRepo.GetByID(ctx, userID)
    if err != nil {
        return fmt.Errorf("failed to get user for deletion: %w", err)
    }
    
    // 関連データの削除
    if err := p.borrowRepo.DeleteByUser(ctx, userID); err != nil {
        return fmt.Errorf("failed to delete borrow history: %w", err)
    }
    
    // ユーザーデータの匿名化
    anonymizedUser := &entities.User{
        ID:       user.ID,
        Email:    fmt.Sprintf("deleted-user-%s@anonymized.local", user.ID.String()[:8]),
        Username: fmt.Sprintf("deleted-user-%s", user.ID.String()[:8]),
        DeletedAt: &time.Time{},
    }
    
    if err := p.userRepo.Update(ctx, anonymizedUser); err != nil {
        return fmt.Errorf("failed to anonymize user: %w", err)
    }
    
    // 監査ログ（削除操作の記録）
    p.auditLogger.LogAction(ctx, &audit.AuditEvent{
        UserID:   &userID,
        Action:   "data_deletion",
        Resource: "user_data",
        Success:  true,
        Details: map[string]interface{}{
            "reason":      reason,
            "original_email": user.Email,
        },
    })
    
    return nil
}
```

---

**最終更新**: 2025年6月15日  
**準拠基準**: OWASP Top 10 2021, NIST Cybersecurity Framework  
**ステータス**: 設計完了