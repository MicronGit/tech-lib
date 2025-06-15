# 🚀 インフラ設計書 - 技術書管理システム

> AWS + Docker + Kubernetes による可用性・拡張性・運用性を重視したクラウドネイティブアーキテクチャ

## 📋 設計概要

### インフラ基本方針
- **クラウドネイティブ**: AWS サービスを最大限活用
- **Infrastructure as Code**: Terraform + AWS CDK による管理
- **自動化優先**: CI/CD パイプラインによる完全自動化
- **可用性重視**: Multi-AZ 構成、自動フェイルオーバー
- **セキュリティファースト**: 多層防御、最小権限の原則
- **コスト最適化**: オートスケーリング、スポットインスタンス活用

### アーキテクチャの特徴
- **マイクロサービス対応**: Kubernetes + Service Mesh
- **自動復旧**: Health Check + Auto Healing
- **監視・ログ**: CloudWatch + Prometheus + Grafana
- **災害復旧**: 複数リージョンでのバックアップ

## 🏗️ システムアーキテクチャ

### 全体構成図
```
┌─────────────────────────────────────────────────────────────────────┐
│                           Internet                                  │
└─────────────────────┬───────────────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────────────┐
│                    CloudFront CDN                                  │
│                 (Global Edge Locations)                            │
└─────────────────────┬───────────────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────────────┐
│                 Application Load Balancer                          │
│                      (Multi-AZ)                                    │
└─────────────┬───────────────────────┬─────────────────────────────────┘
              │                       │
    ┌─────────▼─────────┐   ┌─────────▼─────────┐
    │   EKS Cluster     │   │   EKS Cluster     │
    │   (AZ-1a)         │   │   (AZ-1c)         │
    │ ┌───────────────┐ │   │ ┌───────────────┐ │
    │ │ Frontend Pods │ │   │ │ Frontend Pods │ │
    │ │ Backend Pods  │ │   │ │ Backend Pods  │ │
    │ └───────────────┘ │   │ └───────────────┘ │
    └─────────┬─────────┘   └─────────┬─────────┘
              │                       │
              └───────────┬───────────┘
                          │
    ┌─────────────────────▼─────────────────────┐
    │             RDS PostgreSQL                │
    │         (Primary + Read Replica)          │
    │             Multi-AZ                      │
    └─────────────────────┬─────────────────────┘
                          │
    ┌─────────────────────▼─────────────────────┐
    │           ElastiCache Redis               │
    │             Cluster Mode                  │
    └───────────────────────────────────────────┘
```

### ネットワーク設計
```
VPC: 10.0.0.0/16

Public Subnets (DMZ):
├── Public Subnet AZ-1a: 10.0.1.0/24  (Load Balancer)
└── Public Subnet AZ-1c: 10.0.2.0/24  (Load Balancer)

Private Subnets (Application):
├── Private Subnet AZ-1a: 10.0.10.0/24 (EKS Nodes)
├── Private Subnet AZ-1c: 10.0.11.0/24 (EKS Nodes)

Database Subnets:
├── DB Subnet AZ-1a: 10.0.20.0/24     (RDS Primary)
└── DB Subnet AZ-1c: 10.0.21.0/24     (RDS Replica)

Cache Subnets:
├── Cache Subnet AZ-1a: 10.0.30.0/24  (Redis)
└── Cache Subnet AZ-1c: 10.0.31.0/24  (Redis)
```

## ☁️ AWS サービス構成

### コンピューティング

#### Amazon EKS (Kubernetes)
```yaml
# eks-cluster.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: cluster-config
data:
  cluster.yaml: |
    apiVersion: eksctl.io/v1alpha5
    kind: ClusterConfig
    
    metadata:
      name: tech-lib-cluster
      region: ap-northeast-1
      version: "1.29"
    
    vpc:
      cidr: 10.0.0.0/16
      nat:
        gateway: HighlyAvailable
      clusterEndpoints:
        privateAccess: true
        publicAccess: true
        publicAccessCIDRs: ["0.0.0.0/0"]
    
    nodeGroups:
      - name: app-nodes
        instanceType: t3.medium
        desiredCapacity: 3
        minSize: 2
        maxSize: 10
        volumeSize: 30
        volumeType: gp3
        amiFamily: AmazonLinux2
        labels:
          node-type: application
        taints:
          - key: app
            value: "true"
            effect: NoSchedule
        iam:
          withAddonPolicies:
            autoScaler: true
            cloudWatch: true
            ebs: true
            efs: true
            albIngress: true
        
      - name: system-nodes
        instanceType: t3.small
        desiredCapacity: 2
        minSize: 1
        maxSize: 3
        volumeSize: 20
        labels:
          node-type: system
        iam:
          withAddonPolicies:
            autoScaler: true
            cloudWatch: true
    
    addons:
      - name: vpc-cni
        version: latest
      - name: coredns
        version: latest
      - name: kube-proxy
        version: latest
      - name: aws-ebs-csi-driver
        version: latest
    
    cloudWatch:
      clusterLogging:
        enable: true
        logTypes: ["api", "audit", "authenticator", "controllerManager", "scheduler"]
```

#### Node Group 設定
```yaml
# node-groups.yaml
apiVersion: apps/v1
kind: DaemonSet
metadata:
  name: node-configuration
spec:
  selector:
    matchLabels:
      app: node-config
  template:
    metadata:
      labels:
        app: node-config
    spec:
      containers:
      - name: node-config
        image: amazonlinux:2
        command:
        - /bin/bash
        - -c
        - |
          # システム最適化
          echo 'vm.max_map_count=262144' >> /etc/sysctl.conf
          echo 'fs.file-max=65536' >> /etc/sysctl.conf
          
          # Docker最適化
          mkdir -p /etc/docker
          cat > /etc/docker/daemon.json <<EOF
          {
            "log-driver": "json-file",
            "log-opts": {
              "max-size": "10m",
              "max-file": "3"
            },
            "storage-driver": "overlay2"
          }
          EOF
          
          # CloudWatch Agent設定
          /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \
            -a fetch-config -m ec2 -c ssm:AmazonCloudWatch-linux -s
        
        securityContext:
          privileged: true
        volumeMounts:
        - name: host-sys
          mountPath: /host/sys
        - name: host-proc
          mountPath: /host/proc
      
      volumes:
      - name: host-sys
        hostPath:
          path: /sys
      - name: host-proc
        hostPath:
          path: /proc
```

### ネットワーキング

#### Application Load Balancer
```yaml
# alb-ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: tech-lib-ingress
  annotations:
    kubernetes.io/ingress.class: alb
    alb.ingress.kubernetes.io/scheme: internet-facing
    alb.ingress.kubernetes.io/target-type: ip
    alb.ingress.kubernetes.io/listen-ports: '[{"HTTP": 80}, {"HTTPS": 443}]'
    alb.ingress.kubernetes.io/ssl-redirect: '443'
    alb.ingress.kubernetes.io/certificate-arn: arn:aws:acm:ap-northeast-1:xxxx:certificate/xxxxx
    alb.ingress.kubernetes.io/backend-protocol: HTTP
    alb.ingress.kubernetes.io/healthcheck-path: /health
    alb.ingress.kubernetes.io/healthcheck-interval-seconds: '30'
    alb.ingress.kubernetes.io/healthcheck-timeout-seconds: '5'
    alb.ingress.kubernetes.io/success-codes: '200'
    alb.ingress.kubernetes.io/load-balancer-attributes: |
      idle_timeout.timeout_seconds=60,
      routing.http2.enabled=true,
      access_logs.s3.enabled=true,
      access_logs.s3.bucket=tech-lib-alb-logs,
      access_logs.s3.prefix=alb
spec:
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
      - path: /api
        pathType: Prefix
        backend:
          service:
            name: backend-service
            port:
              number: 8080
```

#### CloudFront設定
```yaml
# cloudfront-distribution.yaml
Resources:
  CloudFrontDistribution:
    Type: AWS::CloudFront::Distribution
    Properties:
      DistributionConfig:
        Enabled: true
        Comment: "Tech Library Management System CDN"
        DefaultRootObject: index.html
        PriceClass: PriceClass_All
        
        Origins:
        - Id: ALBOrigin
          DomainName: !GetAtt ApplicationLoadBalancer.DNSName
          CustomOriginConfig:
            HTTPPort: 80
            HTTPSPort: 443
            OriginProtocolPolicy: https-only
            OriginSSLProtocols: [TLSv1.2]
        
        - Id: S3Origin
          DomainName: !GetAtt S3Bucket.RegionalDomainName
          S3OriginConfig:
            OriginAccessIdentity: !Sub "origin-access-identity/cloudfront/${OriginAccessIdentity}"
        
        DefaultCacheBehavior:
          TargetOriginId: ALBOrigin
          ViewerProtocolPolicy: redirect-to-https
          AllowedMethods: [GET, HEAD, OPTIONS, PUT, POST, PATCH, DELETE]
          CachedMethods: [GET, HEAD, OPTIONS]
          Compress: true
          CachePolicyId: 4135ea2d-6df8-44a3-9df3-4b5a84be39ad  # CachingDisabled
          
        CacheBehaviors:
        - PathPattern: "/static/*"
          TargetOriginId: S3Origin
          ViewerProtocolPolicy: https-only
          CachePolicyId: 658327ea-f89d-4fab-a63d-7e88639e58f6  # CachingOptimized
          
        - PathPattern: "/api/*"
          TargetOriginId: ALBOrigin
          ViewerProtocolPolicy: https-only
          CachePolicyId: 4135ea2d-6df8-44a3-9df3-4b5a84be39ad  # CachingDisabled
          OriginRequestPolicyId: 88a5eaf4-2fd4-4709-b370-b4c650ea3fcf  # CORS-S3Origin
        
        ViewerCertificate:
          AcmCertificateArn: !Ref SSLCertificate
          SslSupportMethod: sni-only
          MinimumProtocolVersion: TLSv1.2_2021
        
        WebACLId: !Ref WebACL
        
        Logging:
          Bucket: !GetAtt LoggingBucket.DomainName
          IncludeCookies: false
          Prefix: cloudfront-logs/
```

### データベース

#### RDS PostgreSQL
```yaml
# rds-cluster.yaml
Resources:
  DBSubnetGroup:
    Type: AWS::RDS::DBSubnetGroup
    Properties:
      DBSubnetGroupDescription: "Subnet group for Tech Library DB"
      SubnetIds:
        - !Ref DBSubnetAZ1
        - !Ref DBSubnetAZ2
      Tags:
        - Key: Name
          Value: tech-lib-db-subnet-group

  DBClusterParameterGroup:
    Type: AWS::RDS::DBClusterParameterGroup
    Properties:
      Description: "Parameter group for Tech Library DB Cluster"
      Family: aurora-postgresql15
      Parameters:
        shared_preload_libraries: "pg_stat_statements,auto_explain"
        log_statement: "all"
        log_min_duration_statement: 1000
        max_connections: 200
        work_mem: "16MB"

  DBCluster:
    Type: AWS::RDS::DBCluster
    Properties:
      Engine: aurora-postgresql
      EngineVersion: "15.4"
      MasterUsername: !Ref DBUsername
      MasterUserPassword: !Ref DBPassword
      DatabaseName: techlib
      
      DBSubnetGroupName: !Ref DBSubnetGroup
      DBClusterParameterGroupName: !Ref DBClusterParameterGroup
      VpcSecurityGroupIds:
        - !Ref DBSecurityGroup
      
      BackupRetentionPeriod: 7
      PreferredBackupWindow: "03:00-04:00"
      PreferredMaintenanceWindow: "sun:04:00-sun:05:00"
      
      StorageEncrypted: true
      KmsKeyId: !Ref DBEncryptionKey
      
      EnableCloudwatchLogsExports:
        - postgresql
      
      DeletionProtection: true
      CopyTagsToSnapshot: true
      
      Tags:
        - Key: Name
          Value: tech-lib-db-cluster

  DBPrimaryInstance:
    Type: AWS::RDS::DBInstance
    Properties:
      DBInstanceClass: db.r6g.large
      DBClusterIdentifier: !Ref DBCluster
      Engine: aurora-postgresql
      PubliclyAccessible: false
      
      MonitoringInterval: 60
      MonitoringRoleArn: !GetAtt EnhancedMonitoringRole.Arn
      
      EnablePerformanceInsights: true
      PerformanceInsightsRetentionPeriod: 7
      
      Tags:
        - Key: Name
          Value: tech-lib-db-primary

  DBReplicaInstance:
    Type: AWS::RDS::DBInstance
    Properties:
      DBInstanceClass: db.r6g.medium
      DBClusterIdentifier: !Ref DBCluster
      Engine: aurora-postgresql
      PubliclyAccessible: false
      
      Tags:
        - Key: Name
          Value: tech-lib-db-replica
```

#### ElastiCache Redis
```yaml
# elasticache-redis.yaml
Resources:
  RedisSubnetGroup:
    Type: AWS::ElastiCache::SubnetGroup
    Properties:
      Description: "Subnet group for Tech Library Redis"
      SubnetIds:
        - !Ref CacheSubnetAZ1
        - !Ref CacheSubnetAZ2

  RedisParameterGroup:
    Type: AWS::ElastiCache::ParameterGroup
    Properties:
      CacheParameterGroupFamily: redis7.x
      Description: "Parameter group for Tech Library Redis"
      Properties:
        maxmemory-policy: "allkeys-lru"
        timeout: "300"
        tcp-keepalive: "60"

  RedisReplicationGroup:
    Type: AWS::ElastiCache::ReplicationGroup
    Properties:
      ReplicationGroupDescription: "Redis cluster for Tech Library"
      ReplicationGroupId: tech-lib-redis
      
      Engine: redis
      EngineVersion: "7.0"
      CacheNodeType: cache.r6g.large
      
      NumCacheClusters: 2
      CacheSubnetGroupName: !Ref RedisSubnetGroup
      CacheParameterGroupName: !Ref RedisParameterGroup
      SecurityGroupIds:
        - !Ref RedisSecurityGroup
      
      AtRestEncryptionEnabled: true
      TransitEncryptionEnabled: true
      AuthToken: !Ref RedisAuthToken
      
      SnapshotRetentionLimit: 3
      SnapshotWindow: "03:00-04:00"
      PreferredMaintenanceWindow: "sun:04:00-sun:05:00"
      
      AutomaticFailoverEnabled: true
      MultiAZEnabled: true
      
      LogDeliveryConfigurations:
        - DestinationType: cloudwatch-logs
          DestinationDetails:
            LogGroup: !Ref RedisLogGroup
          LogFormat: json
          LogType: slow-log
      
      Tags:
        - Key: Name
          Value: tech-lib-redis-cluster
```

## 🐳 コンテナ戦略

### Docker設定

#### マルチステージビルド（フロントエンド）
```dockerfile
# Dockerfile.frontend
# ビルドステージ
FROM node:18-alpine AS builder

WORKDIR /app

# 依存関係インストール
COPY package*.json ./
RUN npm ci --only=production

# ソースコードコピー・ビルド
COPY . .
RUN npm run build

# 実行ステージ
FROM nginx:1.25-alpine AS runtime

# セキュリティ設定
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

# Nginx設定
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

# セキュリティヘッダー設定
COPY security-headers.conf /etc/nginx/conf.d/security-headers.conf

# ヘルスチェック
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost/ || exit 1

EXPOSE 80

USER nodejs

CMD ["nginx", "-g", "daemon off;"]
```

#### マルチステージビルド（バックエンド）
```dockerfile
# Dockerfile.backend
# ビルドステージ
FROM golang:1.21-alpine AS builder

WORKDIR /app

# セキュリティツールインストール
RUN apk add --no-cache git ca-certificates tzdata

# 依存関係ダウンロード
COPY go.mod go.sum ./
RUN go mod download

# ソースコードコピー・ビルド
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build \
    -ldflags='-w -s -extldflags "-static"' \
    -a -installsuffix cgo \
    -o server cmd/server/main.go

# 実行ステージ
FROM scratch AS runtime

# 証明書・タイムゾーンデータコピー
COPY --from=builder /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/
COPY --from=builder /usr/share/zoneinfo /usr/share/zoneinfo

# バイナリコピー
COPY --from=builder /app/server /server

# ヘルスチェック用バイナリ
COPY --from=builder /bin/wget /bin/wget

# ヘルスチェック
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD ["/bin/wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:8080/health"]

EXPOSE 8080

ENTRYPOINT ["/server"]
```

### Kubernetes マニフェスト

#### フロントエンド Deployment
```yaml
# k8s/frontend-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: frontend
  labels:
    app: frontend
    tier: presentation
spec:
  replicas: 3
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxUnavailable: 1
      maxSurge: 1
  
  selector:
    matchLabels:
      app: frontend
  
  template:
    metadata:
      labels:
        app: frontend
        tier: presentation
      annotations:
        prometheus.io/scrape: "true"
        prometheus.io/port: "9090"
    
    spec:
      affinity:
        podAntiAffinity:
          preferredDuringSchedulingIgnoredDuringExecution:
          - weight: 100
            podAffinityTerm:
              labelSelector:
                matchExpressions:
                - key: app
                  operator: In
                  values:
                  - frontend
              topologyKey: kubernetes.io/hostname
      
      containers:
      - name: frontend
        image: techlib/frontend:latest
        imagePullPolicy: IfNotPresent
        
        ports:
        - containerPort: 80
          name: http
        
        env:
        - name: VITE_API_BASE_URL
          value: "/api"
        - name: VITE_ENV
          value: "production"
        
        resources:
          requests:
            memory: "128Mi"
            cpu: "100m"
          limits:
            memory: "256Mi"
            cpu: "200m"
        
        livenessProbe:
          httpGet:
            path: /
            port: 80
          initialDelaySeconds: 30
          periodSeconds: 10
          timeoutSeconds: 5
          failureThreshold: 3
        
        readinessProbe:
          httpGet:
            path: /
            port: 80
          initialDelaySeconds: 5
          periodSeconds: 5
          timeoutSeconds: 3
          failureThreshold: 3
        
        securityContext:
          runAsNonRoot: true
          runAsUser: 1001
          allowPrivilegeEscalation: false
          readOnlyRootFilesystem: true
          capabilities:
            drop:
            - ALL

---
apiVersion: v1
kind: Service
metadata:
  name: frontend-service
  labels:
    app: frontend
spec:
  selector:
    app: frontend
  ports:
  - name: http
    port: 80
    targetPort: 80
  type: ClusterIP
```

#### バックエンド Deployment
```yaml
# k8s/backend-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: backend
  labels:
    app: backend
    tier: application
spec:
  replicas: 3
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxUnavailable: 1
      maxSurge: 1
  
  selector:
    matchLabels:
      app: backend
  
  template:
    metadata:
      labels:
        app: backend
        tier: application
      annotations:
        prometheus.io/scrape: "true"
        prometheus.io/port: "9090"
    
    spec:
      affinity:
        podAntiAffinity:
          preferredDuringSchedulingIgnoredDuringExecution:
          - weight: 100
            podAffinityTerm:
              labelSelector:
                matchExpressions:
                - key: app
                  operator: In
                  values:
                  - backend
              topologyKey: kubernetes.io/hostname
      
      containers:
      - name: backend
        image: techlib/backend:latest
        imagePullPolicy: IfNotPresent
        
        ports:
        - containerPort: 8080
          name: http
        - containerPort: 9090
          name: metrics
        
        env:
        - name: PORT
          value: "8080"
        - name: GIN_MODE
          value: "release"
        - name: DB_HOST
          valueFrom:
            secretKeyRef:
              name: db-credentials
              key: host
        - name: DB_PASSWORD
          valueFrom:
            secretKeyRef:
              name: db-credentials
              key: password
        - name: REDIS_HOST
          valueFrom:
            configMapKeyRef:
              name: app-config
              key: redis-host
        
        resources:
          requests:
            memory: "256Mi"
            cpu: "200m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        
        livenessProbe:
          httpGet:
            path: /health
            port: 8080
          initialDelaySeconds: 30
          periodSeconds: 10
          timeoutSeconds: 5
          failureThreshold: 3
        
        readinessProbe:
          httpGet:
            path: /ready
            port: 8080
          initialDelaySeconds: 5
          periodSeconds: 5
          timeoutSeconds: 3
          failureThreshold: 3
        
        securityContext:
          runAsNonRoot: true
          runAsUser: 1001
          allowPrivilegeEscalation: false
          readOnlyRootFilesystem: true
          capabilities:
            drop:
            - ALL

---
apiVersion: v1
kind: Service
metadata:
  name: backend-service
  labels:
    app: backend
spec:
  selector:
    app: backend
  ports:
  - name: http
    port: 8080
    targetPort: 8080
  - name: metrics
    port: 9090
    targetPort: 9090
  type: ClusterIP
```

## 🔄 CI/CD パイプライン

### GitHub Actions ワークフロー
```yaml
# .github/workflows/ci-cd.yml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

env:
  AWS_REGION: ap-northeast-1
  ECR_REPOSITORY_FRONTEND: techlib/frontend
  ECR_REPOSITORY_BACKEND: techlib/backend
  EKS_CLUSTER_NAME: tech-lib-cluster

jobs:
  test:
    name: Run Tests
    runs-on: ubuntu-latest
    strategy:
      matrix:
        component: [frontend, backend]
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v4
    
    - name: Setup Node.js (Frontend)
      if: matrix.component == 'frontend'
      uses: actions/setup-node@v4
      with:
        node-version: '18'
        cache: 'npm'
        cache-dependency-path: app/package-lock.json
    
    - name: Setup Go (Backend)
      if: matrix.component == 'backend'
      uses: actions/setup-go@v4
      with:
        go-version: '1.21'
        cache: true
        cache-dependency-path: backend/go.sum
    
    - name: Install dependencies (Frontend)
      if: matrix.component == 'frontend'
      run: |
        cd app
        npm ci
    
    - name: Install dependencies (Backend)
      if: matrix.component == 'backend'
      run: |
        cd backend
        go mod download
    
    - name: Run linting (Frontend)
      if: matrix.component == 'frontend'
      run: |
        cd app
        npm run lint
    
    - name: Run linting (Backend)
      if: matrix.component == 'backend'
      run: |
        cd backend
        golangci-lint run ./...
    
    - name: Run tests (Frontend)
      if: matrix.component == 'frontend'
      run: |
        cd app
        npm run test:unit
    
    - name: Run tests (Backend)
      if: matrix.component == 'backend'
      run: |
        cd backend
        go test -v -race -coverprofile=coverage.out ./...
    
    - name: Upload coverage reports
      uses: codecov/codecov-action@v3
      with:
        file: ./backend/coverage.out
        flags: unittests
        name: codecov-umbrella

  security-scan:
    name: Security Scan
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

  build-and-push:
    name: Build and Push Images
    runs-on: ubuntu-latest
    needs: [test, security-scan]
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v4
    
    - name: Configure AWS credentials
      uses: aws-actions/configure-aws-credentials@v4
      with:
        aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
        aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
        aws-region: ${{ env.AWS_REGION }}
    
    - name: Login to Amazon ECR
      id: login-ecr
      uses: aws-actions/amazon-ecr-login@v2
    
    - name: Build and push Frontend image
      env:
        ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
        IMAGE_TAG: ${{ github.sha }}
      run: |
        cd app
        docker build -t $ECR_REGISTRY/$ECR_REPOSITORY_FRONTEND:$IMAGE_TAG .
        docker build -t $ECR_REGISTRY/$ECR_REPOSITORY_FRONTEND:latest .
        docker push $ECR_REGISTRY/$ECR_REPOSITORY_FRONTEND:$IMAGE_TAG
        docker push $ECR_REGISTRY/$ECR_REPOSITORY_FRONTEND:latest
    
    - name: Build and push Backend image
      env:
        ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
        IMAGE_TAG: ${{ github.sha }}
      run: |
        cd backend
        docker build -t $ECR_REGISTRY/$ECR_REPOSITORY_BACKEND:$IMAGE_TAG .
        docker build -t $ECR_REGISTRY/$ECR_REPOSITORY_BACKEND:latest .
        docker push $ECR_REGISTRY/$ECR_REPOSITORY_BACKEND:$IMAGE_TAG
        docker push $ECR_REGISTRY/$ECR_REPOSITORY_BACKEND:latest

  deploy:
    name: Deploy to EKS
    runs-on: ubuntu-latest
    needs: build-and-push
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v4
    
    - name: Configure AWS credentials
      uses: aws-actions/configure-aws-credentials@v4
      with:
        aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
        aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
        aws-region: ${{ env.AWS_REGION }}
    
    - name: Update kubeconfig
      run: |
        aws eks update-kubeconfig --region $AWS_REGION --name $EKS_CLUSTER_NAME
    
    - name: Deploy to EKS
      env:
        ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
        IMAGE_TAG: ${{ github.sha }}
      run: |
        # Update image tags in manifests
        sed -i "s|image: techlib/frontend:.*|image: $ECR_REGISTRY/$ECR_REPOSITORY_FRONTEND:$IMAGE_TAG|g" k8s/frontend-deployment.yaml
        sed -i "s|image: techlib/backend:.*|image: $ECR_REGISTRY/$ECR_REPOSITORY_BACKEND:$IMAGE_TAG|g" k8s/backend-deployment.yaml
        
        # Apply manifests
        kubectl apply -f k8s/
        
        # Wait for rollout to complete
        kubectl rollout status deployment/frontend --timeout=300s
        kubectl rollout status deployment/backend --timeout=300s
    
    - name: Verify deployment
      run: |
        kubectl get pods -l app=frontend
        kubectl get pods -l app=backend
        kubectl get svc
```

## 📊 監視・ログ設計

### Prometheus + Grafana 設定
```yaml
# monitoring/prometheus-config.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: prometheus-config
data:
  prometheus.yml: |
    global:
      scrape_interval: 15s
      evaluation_interval: 15s
    
    rule_files:
      - "/etc/prometheus/rules/*.yml"
    
    alerting:
      alertmanagers:
        - static_configs:
            - targets:
              - alertmanager:9093
    
    scrape_configs:
      - job_name: 'kubernetes-apiservers'
        kubernetes_sd_configs:
        - role: endpoints
        scheme: https
        tls_config:
          ca_file: /var/run/secrets/kubernetes.io/serviceaccount/ca.crt
        bearer_token_file: /var/run/secrets/kubernetes.io/serviceaccount/token
        relabel_configs:
        - source_labels: [__meta_kubernetes_namespace, __meta_kubernetes_service_name, __meta_kubernetes_endpoint_port_name]
          action: keep
          regex: default;kubernetes;https
      
      - job_name: 'kubernetes-nodes'
        kubernetes_sd_configs:
        - role: node
        relabel_configs:
        - action: labelmap
          regex: __meta_kubernetes_node_label_(.+)
      
      - job_name: 'kubernetes-pods'
        kubernetes_sd_configs:
        - role: pod
        relabel_configs:
        - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_scrape]
          action: keep
          regex: true
        - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_path]
          action: replace
          target_label: __metrics_path__
          regex: (.+)
        - source_labels: [__address__, __meta_kubernetes_pod_annotation_prometheus_io_port]
          action: replace
          regex: ([^:]+)(?::\d+)?;(\d+)
          replacement: $1:$2
          target_label: __address__
      
      - job_name: 'tech-lib-backend'
        static_configs:
        - targets: ['backend-service:9090']
        metrics_path: /metrics
        scrape_interval: 30s
      
      - job_name: 'tech-lib-database'
        static_configs:
        - targets: ['postgres-exporter:9187']
        scrape_interval: 30s
      
      - job_name: 'tech-lib-redis'
        static_configs:
        - targets: ['redis-exporter:9121']
        scrape_interval: 30s

---
apiVersion: v1
kind: ConfigMap
metadata:
  name: prometheus-rules
data:
  tech-lib.yml: |
    groups:
    - name: tech-lib-alerts
      rules:
      - alert: HighErrorRate
        expr: sum(rate(http_requests_total{status=~"5.."}[5m])) / sum(rate(http_requests_total[5m])) > 0.1
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "High error rate detected"
          description: "Error rate is above 10% for 5 minutes"
      
      - alert: HighLatency
        expr: histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket[5m])) by (le)) > 1
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High latency detected"
          description: "95th percentile latency is above 1 second"
      
      - alert: DatabaseConnectionHigh
        expr: pg_stat_activity_count > 180
        for: 2m
        labels:
          severity: warning
        annotations:
          summary: "High database connections"
          description: "Database connection count is high: {{ $value }}"
      
      - alert: PodCrashLooping
        expr: rate(kube_pod_container_status_restarts_total[15m]) > 0
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "Pod is crash looping"
          description: "Pod {{ $labels.pod }} in namespace {{ $labels.namespace }} is crash looping"
```

### CloudWatch 設定
```yaml
# monitoring/cloudwatch-config.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: cloudwatch-agent-config
data:
  cwagentconfig.json: |
    {
      "agent": {
        "metrics_collection_interval": 60,
        "run_as_user": "cwagent"
      },
      "logs": {
        "logs_collected": {
          "files": {
            "collect_list": [
              {
                "file_path": "/var/log/containers/*backend*.log",
                "log_group_name": "/aws/eks/tech-lib/backend",
                "log_stream_name": "{hostname}-backend",
                "timezone": "Asia/Tokyo",
                "multi_line_start_pattern": "^\\d{4}-\\d{2}-\\d{2}"
              },
              {
                "file_path": "/var/log/containers/*frontend*.log",
                "log_group_name": "/aws/eks/tech-lib/frontend", 
                "log_stream_name": "{hostname}-frontend",
                "timezone": "Asia/Tokyo"
              }
            ]
          },
          "kubernetes": {
            "cluster_name": "tech-lib-cluster",
            "metrics_collection_interval": 60
          }
        }
      },
      "metrics": {
        "namespace": "TechLib/EKS",
        "metrics_collected": {
          "cpu": {
            "measurement": [
              "cpu_usage_idle",
              "cpu_usage_iowait",
              "cpu_usage_user",
              "cpu_usage_system"
            ],
            "metrics_collection_interval": 60,
            "resources": ["*"],
            "totalcpu": false
          },
          "disk": {
            "measurement": [
              "used_percent"
            ],
            "metrics_collection_interval": 60,
            "resources": ["*"]
          },
          "diskio": {
            "measurement": [
              "io_time"
            ],
            "metrics_collection_interval": 60,
            "resources": ["*"]
          },
          "mem": {
            "measurement": [
              "mem_used_percent"
            ],
            "metrics_collection_interval": 60
          },
          "netstat": {
            "measurement": [
              "tcp_established",
              "tcp_time_wait"
            ],
            "metrics_collection_interval": 60
          }
        }
      }
    }
```

## 🔐 セキュリティ設定

### Network Security Groups
```yaml
# security/security-groups.yaml
Resources:
  ALBSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Security group for Application Load Balancer
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: 0.0.0.0/0
          Description: "HTTP from internet"
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: 0.0.0.0/0
          Description: "HTTPS from internet"
      Tags:
        - Key: Name
          Value: tech-lib-alb-sg

  EKSNodeSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Security group for EKS nodes
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          SourceSecurityGroupId: !Ref ALBSecurityGroup
          Description: "HTTP from ALB"
        - IpProtocol: tcp
          FromPort: 8080
          ToPort: 8080
          SourceSecurityGroupId: !Ref ALBSecurityGroup
          Description: "Backend API from ALB"
        - IpProtocol: tcp
          FromPort: 1025
          ToPort: 65535
          SourceSecurityGroupId: !Ref EKSClusterSecurityGroup
          Description: "Node port range from cluster"
      SecurityGroupEgress:
        - IpProtocol: -1
          CidrIp: 0.0.0.0/0
          Description: "All outbound traffic"
      Tags:
        - Key: Name
          Value: tech-lib-eks-node-sg

  DBSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Security group for RDS database
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 5432
          ToPort: 5432
          SourceSecurityGroupId: !Ref EKSNodeSecurityGroup
          Description: "PostgreSQL from EKS nodes"
      Tags:
        - Key: Name
          Value: tech-lib-db-sg

  RedisSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Security group for Redis cache
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 6379
          ToPort: 6379
          SourceSecurityGroupId: !Ref EKSNodeSecurityGroup
          Description: "Redis from EKS nodes"
      Tags:
        - Key: Name
          Value: tech-lib-redis-sg
```

### WAF設定
```yaml
# security/waf.yaml
Resources:
  WebACL:
    Type: AWS::WAFv2::WebACL
    Properties:
      Name: tech-lib-waf
      Scope: CLOUDFRONT
      DefaultAction:
        Allow: {}
      
      Rules:
        - Name: AWSManagedRulesCommonRuleSet
          Priority: 1
          OverrideAction:
            None: {}
          Statement:
            ManagedRuleGroupStatement:
              VendorName: AWS
              Name: AWSManagedRulesCommonRuleSet
          VisibilityConfig:
            SampledRequestsEnabled: true
            CloudWatchMetricsEnabled: true
            MetricName: CommonRuleSetMetric
        
        - Name: AWSManagedRulesKnownBadInputsRuleSet
          Priority: 2
          OverrideAction:
            None: {}
          Statement:
            ManagedRuleGroupStatement:
              VendorName: AWS
              Name: AWSManagedRulesKnownBadInputsRuleSet
          VisibilityConfig:
            SampledRequestsEnabled: true
            CloudWatchMetricsEnabled: true
            MetricName: KnownBadInputsRuleSetMetric
        
        - Name: RateLimitRule
          Priority: 3
          Action:
            Block: {}
          Statement:
            RateBasedStatement:
              Limit: 1000
              AggregateKeyType: IP
          VisibilityConfig:
            SampledRequestsEnabled: true
            CloudWatchMetricsEnabled: true
            MetricName: RateLimitRuleMetric
        
        - Name: GeoBlockRule
          Priority: 4
          Action:
            Block: {}
          Statement:
            GeoMatchStatement:
              CountryCodes: [CN, RU, KP]
          VisibilityConfig:
            SampledRequestsEnabled: true
            CloudWatchMetricsEnabled: true
            MetricName: GeoBlockRuleMetric
      
      VisibilityConfig:
        SampledRequestsEnabled: true
        CloudWatchMetricsEnabled: true
        MetricName: tech-lib-waf
```

## 💾 バックアップ・災害復旧

### 自動バックアップ設定
```yaml
# backup/backup-strategy.yaml
Resources:
  DatabaseBackupRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: backup.amazonaws.com
            Action: sts:AssumeRole
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/service-role/AWSBackupServiceRolePolicyForBackup
        - arn:aws:iam::aws:policy/service-role/AWSBackupServiceRolePolicyForRestores

  BackupVault:
    Type: AWS::Backup::BackupVault
    Properties:
      BackupVaultName: tech-lib-backup-vault
      EncryptionKeyArn: !Ref BackupEncryptionKey
      AccessPolicy: |
        {
          "Version": "2012-10-17",
          "Statement": [
            {
              "Effect": "Deny",
              "Principal": "*",
              "Action": "backup:DeleteBackupVault",
              "Resource": "*"
            }
          ]
        }

  BackupPlan:
    Type: AWS::Backup::BackupPlan
    Properties:
      BackupPlan:
        BackupPlanName: tech-lib-backup-plan
        BackupPlanRule:
          - RuleName: DailyBackup
            TargetBackupVault: !Ref BackupVault
            ScheduleExpression: cron(0 3 * * ? *)
            StartWindowMinutes: 60
            CompletionWindowMinutes: 120
            DeleteAfterDays: 30
            RecoveryPointTags:
              BackupType: Daily
              
          - RuleName: WeeklyBackup
            TargetBackupVault: !Ref BackupVault
            ScheduleExpression: cron(0 4 ? * SUN *)
            StartWindowMinutes: 60
            CompletionWindowMinutes: 180
            DeleteAfterDays: 90
            RecoveryPointTags:
              BackupType: Weekly
              
          - RuleName: MonthlyBackup
            TargetBackupVault: !Ref BackupVault
            ScheduleExpression: cron(0 5 1 * ? *)
            StartWindowMinutes: 60
            CompletionWindowMinutes: 240
            DeleteAfterDays: 365
            RecoveryPointTags:
              BackupType: Monthly

  BackupSelection:
    Type: AWS::Backup::BackupSelection
    Properties:
      BackupPlanId: !Ref BackupPlan
      BackupSelection:
        SelectionName: tech-lib-resources
        IamRoleArn: !GetAtt DatabaseBackupRole.Arn
        Resources:
          - !Sub "${DBCluster}/*"
          - !Sub "arn:aws:s3:::tech-lib-data-bucket/*"
        Conditions:
          StringEquals:
            "aws:ResourceTag/Environment": ["production"]
```

## 📈 スケーリング戦略

### Horizontal Pod Autoscaler
```yaml
# scaling/hpa.yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: backend-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: backend
  minReplicas: 3
  maxReplicas: 20
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
  - type: Pods
    pods:
      metric:
        name: http_requests_per_second
      target:
        type: AverageValue
        averageValue: "1000m"
  behavior:
    scaleDown:
      stabilizationWindowSeconds: 300
      policies:
      - type: Percent
        value: 50
        periodSeconds: 60
    scaleUp:
      stabilizationWindowSeconds: 60
      policies:
      - type: Percent
        value: 100
        periodSeconds: 60
      - type: Pods
        value: 2
        periodSeconds: 60
      selectPolicy: Max

---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: frontend-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: frontend
  minReplicas: 3
  maxReplicas: 15
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 60
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 70
```

### Cluster Autoscaler
```yaml
# scaling/cluster-autoscaler.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: cluster-autoscaler
  namespace: kube-system
  labels:
    app: cluster-autoscaler
spec:
  selector:
    matchLabels:
      app: cluster-autoscaler
  template:
    metadata:
      labels:
        app: cluster-autoscaler
      annotations:
        prometheus.io/scrape: 'true'
        prometheus.io/port: '8085'
    spec:
      serviceAccountName: cluster-autoscaler
      containers:
      - image: k8s.gcr.io/autoscaling/cluster-autoscaler:v1.29.0
        name: cluster-autoscaler
        resources:
          limits:
            cpu: 100m
            memory: 300Mi
          requests:
            cpu: 100m
            memory: 300Mi
        command:
        - ./cluster-autoscaler
        - --v=4
        - --stderrthreshold=info
        - --cloud-provider=aws
        - --skip-nodes-with-local-storage=false
        - --expander=least-waste
        - --node-group-auto-discovery=asg:tag=k8s.io/cluster-autoscaler/enabled,k8s.io/cluster-autoscaler/tech-lib-cluster
        - --balance-similar-node-groups
        - --scale-down-enabled=true
        - --scale-down-delay-after-add=10m
        - --scale-down-unneeded-time=10m
        - --scale-down-util-threshold=0.5
        - --max-node-provision-time=15m
        env:
        - name: AWS_REGION
          value: ap-northeast-1
        volumeMounts:
        - name: ssl-certs
          mountPath: /etc/ssl/certs/ca-certificates.crt
          readOnly: true
        imagePullPolicy: "Always"
      volumes:
      - name: ssl-certs
        hostPath:
          path: "/etc/ssl/certs/ca-bundle.crt"
```

---

**最終更新**: 2025年6月15日  
**対象環境**: AWS EKS, Kubernetes 1.29+  
**ステータス**: 設計完了