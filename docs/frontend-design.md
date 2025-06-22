# 🎨 フロントエンド設計書 - 技術書管理システム

> Vue.js 3 + TypeScript によるモダンフロントエンドアーキテクチャ設計

## 📋 設計概要

### アーキテクチャの基本方針
- **コンポーネント駆動開発**: 再利用可能で保守性の高いコンポーネント設計
- **型安全性**: TypeScript厳密モードによる品質確保
- **レスポンシブファースト**: モバイルファーストのアプローチ
- **パフォーマンス重視**: 最適化されたバンドルサイズと高速レンダリング
- **アクセシビリティ**: WCAG 2.1 AA準拠のユニバーサルデザイン

### 技術スタック詳細
| 技術 | バージョン | 役割 | 選定理由 |
|------|-----------|------|----------|
| Vue.js | 3.5.13 | UIフレームワーク | Composition API、優秀なTypeScript統合 |
| TypeScript | 5.6.0 | 型システム | 実行時エラー削減、開発効率向上 |
| Vite | 6.0.1 | ビルドツール | 高速な開発サーバー、最適化されたビルド |
| Vue Router | 4.x | ルーティング | Vue.jsとの完全統合、TypeScript対応 |
| Pinia | 2.x | 状態管理 | Vue 3対応、TypeScript親和性 |
| Axios | 1.7.9 | HTTP通信 | 豊富な機能、インターセプター対応 |

## 🏗️ コンポーネントアーキテクチャ

### レイヤー構造
```
📁 src/
├── 🎯 App.vue                 # ルートコンポーネント
├── 📁 views/                  # ページコンポーネント（ルーティング対象）
│   ├── HomeView.vue           # ホーム画面
│   ├── BookListView.vue       # 書籍一覧画面
│   ├── BookFormView.vue       # 書籍登録画面
│   └── BookDetailView.vue     # 書籍詳細画面
├── 📁 components/             # 機能コンポーネント
│   ├── BookForm.vue           # 書籍フォーム
│   ├── BookList.vue           # 書籍一覧
│   ├── BookDetail.vue         # 書籍詳細モーダル
│   ├── BookCard.vue           # 書籍カード
│   └── 📁 common/             # 共通コンポーネント
│       ├── Modal.vue          # モーダルダイアログ
│       ├── SearchBox.vue      # 検索ボックス
│       ├── Pagination.vue     # ページネーション
│       ├── LoadingSpinner.vue # ローディング表示
│       └── ErrorMessage.vue   # エラー表示
├── 📁 layouts/                # レイアウトコンポーネント
│   ├── DefaultLayout.vue      # デフォルトレイアウト
│   └── AuthLayout.vue         # 認証レイアウト
└── 📁 composables/            # 再利用可能ロジック
    ├── useApi.ts              # API通信
    ├── useAuth.ts             # 認証管理
    ├── useForm.ts             # フォーム管理
    └── useLocalStorage.ts     # ローカルストレージ
```

### コンポーネント分類

#### 🎯 ページコンポーネント（Views）
**責務**: ルーティングの終点、画面全体の制御
```typescript
// 例: BookListView.vue
<template>
  <DefaultLayout>
    <PageHeader title="図書一覧" />
    <SearchFilter v-model="filters" />
    <BookList :books="books" :loading="loading" />
    <Pagination v-model="currentPage" :total="totalPages" />
  </DefaultLayout>
</template>

<script setup lang="ts">
// ページレベルの状態管理とビジネスロジック
</script>
```

#### 🧩 機能コンポーネント（Features）
**責務**: 特定の機能領域、中程度の複雑さ
```typescript
// 例: BookForm.vue の設計原則
interface BookFormProps {
  book?: Book;          // 編集時の初期値
  mode: 'create' | 'edit'; // 動作モード
}

interface BookFormEmits {
  submit: [book: BookFormData];
  cancel: [];
}
```

#### 🔧 共通コンポーネント（Common）
**責務**: 汎用的な機能、高い再利用性
```typescript
// 例: Modal.vue の設計原則
interface ModalProps {
  modelValue: boolean;        // 表示状態
  title?: string;            // タイトル
  size?: 'small' | 'medium' | 'large'; // サイズ
  persistent?: boolean;      // 外側クリックで閉じない
}
```

#### 📖 BookDetailコンポーネント設計
**責務**: 書籍詳細情報の表示、モーダル形式での詳細ビュー提供

```typescript
// BookDetail.vue の設計原則
interface BookDetailProps {
  show: boolean;             // モーダル表示状態
  bookId: string | null;     // 表示する書籍のID
}

interface BookDetailEmits {
  close: [];                 // モーダルを閉じる
}

// 機能仕様
- 書籍IDに基づく動的詳細取得
- ローディング状態の表示
- エラーハンドリング機能
- レスポンシブデザイン対応
- キーボードナビゲーション対応
- アクセシビリティ準拠
```

#### 📋 BookListコンポーネント拡張
**新機能**: 行クリックによる詳細モーダル表示

```typescript
// 追加されたインタラクション機能
interface BookListEnhancements {
  // 詳細表示機能
  showBookDetail: (book: Book) => void;
  closeDetailModal: () => void;
  
  // 状態管理
  showDetailModal: Ref<boolean>;
  selectedBookId: Ref<string | null>;
}

// アクセシビリティ対応
- tabindex="0" による キーボードフォーカス
- role="button" による支援技術サポート
- aria-label による詳細説明
- Enter/Space キー対応
```

### コンポーネント命名規則

#### ファイル命名
```
PascalCase.vue
例: BookList.vue, SearchBox.vue, LoadingSpinner.vue
```

#### コンポーネント内命名
```typescript
// Props: camelCase
interface Props {
  userName: string;
  isActive: boolean;
}

// Events: kebab-case
emit('user-updated', userData);
emit('form-submit', formData);

// Slots: kebab-case
<slot name="header-actions" />
<slot name="footer-content" />
```

## 🔄 状態管理設計

### Pinia Store構造
```
📁 src/stores/
├── index.ts              # Store統合
├── auth.ts               # 認証状態
├── books.ts              # 書籍データ
├── ui.ts                 # UI状態
└── cache.ts              # キャッシュ管理
```

### Store設計パターン

#### 認証Store（auth.ts）
```typescript
export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  permissions: Permission[];
}

export const useAuthStore = defineStore('auth', () => {
  // State
  const state = reactive<AuthState>({
    user: null,
    token: localStorage.getItem('token'),
    isAuthenticated: false,
    permissions: []
  });

  // Getters
  const hasPermission = computed(() => 
    (permission: string) => state.permissions.includes(permission)
  );

  // Actions
  const login = async (credentials: LoginCredentials) => {
    const response = await authApi.login(credentials);
    state.token = response.token;
    state.user = response.user;
    state.isAuthenticated = true;
    localStorage.setItem('token', response.token);
  };

  return {
    ...toRefs(state),
    hasPermission,
    login,
    logout,
    refreshToken
  };
});
```

#### 書籍Store（books.ts）
```typescript
export const useBooksStore = defineStore('books', () => {
  // State
  const books = ref<Book[]>([]);
  const currentBook = ref<Book | null>(null);
  const loading = ref(false);
  const filters = reactive({
    search: '',
    genre: '',
    language: '',
    sortBy: 'title',
    sortOrder: 'asc' as 'asc' | 'desc'
  });

  // Getters
  const filteredBooks = computed(() => {
    return books.value
      .filter(book => applyFilters(book, filters))
      .sort((a, b) => applySorting(a, b, filters));
  });

  // Actions
  const fetchBooks = async () => {
    loading.value = true;
    try {
      books.value = await bookApi.getBooks();
    } finally {
      loading.value = false;
    }
  };

  return {
    books: readonly(books),
    currentBook: readonly(currentBook),
    loading: readonly(loading),
    filters,
    filteredBooks,
    fetchBooks,
    fetchBookById,    // 新規追加: 書籍詳細取得
    createBook,
    updateBook,
    deleteBook
  };
});
```

### 状態正規化戦略

#### データ正規化パターン
```typescript
// 正規化されたストア構造
interface NormalizedBooksState {
  entities: {
    books: Record<string, Book>;
    authors: Record<string, Author>;
    publishers: Record<string, Publisher>;
  };
  ids: {
    books: string[];
    authors: string[];
    publishers: string[];
  };
}

// 正規化ヘルパー
const normalize = (books: Book[]) => {
  const entities = { books: {}, authors: {}, publishers: {} };
  const ids = { books: [], authors: [], publishers: [] };
  
  books.forEach(book => {
    entities.books[book.id] = book;
    ids.books.push(book.id);
    
    if (book.author && !entities.authors[book.author.id]) {
      entities.authors[book.author.id] = book.author;
      ids.authors.push(book.author.id);
    }
  });
  
  return { entities, ids };
};
```

## 🗺️ ルーティング設計

### Router構成
```typescript
// router/index.ts
const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: DefaultLayout,
    children: [
      {
        path: '',
        name: 'Home',
        component: () => import('@/views/HomeView.vue'),
        meta: { title: 'ホーム' }
      },
      {
        path: '/books',
        name: 'BookList',
        component: () => import('@/views/BookListView.vue'),
        meta: { title: '図書一覧' }
      },
      {
        path: '/books/new',
        name: 'BookCreate',
        component: () => import('@/views/BookFormView.vue'),
        meta: { title: '図書登録', requiresAuth: true }
      },
      {
        path: '/books/:id',
        name: 'BookDetail',
        component: () => import('@/views/BookDetailView.vue'),
        meta: { title: '図書詳細' },
        props: route => ({ id: Number(route.params.id) })
      },
      {
        path: '/books/:id/edit',
        name: 'BookEdit',
        component: () => import('@/views/BookFormView.vue'),
        meta: { title: '図書編集', requiresAuth: true },
        props: route => ({ id: Number(route.params.id), mode: 'edit' })
      }
    ]
  },
  {
    path: '/auth',
    component: AuthLayout,
    children: [
      {
        path: 'login',
        name: 'Login',
        component: () => import('@/views/LoginView.vue'),
        meta: { title: 'ログイン', guest: true }
      }
    ]
  }
];
```

### ナビゲーションガード
```typescript
// 認証チェック
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore();
  
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next({ name: 'Login', query: { redirect: to.fullPath } });
  } else if (to.meta.guest && authStore.isAuthenticated) {
    next({ name: 'Home' });
  } else {
    next();
  }
});

// ページタイトル設定
router.afterEach((to) => {
  document.title = to.meta.title 
    ? `${to.meta.title} - 技術書管理システム`
    : '技術書管理システム';
});
```

## 🎨 UI/UXデザインシステム

### デザイントークン
```scss
// tokens/colors.scss
:root {
  // Primary Colors
  --color-primary-50: #f0f4ff;
  --color-primary-100: #dbeafe;
  --color-primary-500: #667eea;
  --color-primary-600: #764ba2;
  --color-primary-900: #1e3a8a;

  // Semantic Colors
  --color-success: #10b981;
  --color-warning: #f59e0b;
  --color-error: #ef4444;
  --color-info: #3b82f6;

  // Neutral Colors
  --color-gray-50: #f9fafb;
  --color-gray-100: #f3f4f6;
  --color-gray-500: #6b7280;
  --color-gray-900: #111827;

  // Typography
  --font-family-sans: 'Inter', 'Helvetica Neue', Arial, sans-serif;
  --font-family-mono: 'JetBrains Mono', monospace;

  // Font Sizes
  --text-xs: 0.75rem;    // 12px
  --text-sm: 0.875rem;   // 14px
  --text-base: 1rem;     // 16px
  --text-lg: 1.125rem;   // 18px
  --text-xl: 1.25rem;    // 20px
  --text-2xl: 1.5rem;    // 24px
  --text-3xl: 1.875rem;  // 30px

  // Spacing
  --space-1: 0.25rem;    // 4px
  --space-2: 0.5rem;     // 8px
  --space-3: 0.75rem;    // 12px
  --space-4: 1rem;       // 16px
  --space-6: 1.5rem;     // 24px
  --space-8: 2rem;       // 32px

  // Border Radius
  --radius-sm: 0.25rem;  // 4px
  --radius-md: 0.5rem;   // 8px
  --radius-lg: 0.75rem;  // 12px
  --radius-xl: 1rem;     // 16px

  // Shadows
  --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1);
  --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1);
}
```

### コンポーネントスタイルガイド

#### ボタンコンポーネント
```vue
<!-- BaseButton.vue -->
<template>
  <button 
    :class="buttonClasses" 
    :disabled="disabled || loading"
    @click="$emit('click', $event)"
  >
    <LoadingSpinner v-if="loading" size="sm" />
    <slot />
  </button>
</template>

<script setup lang="ts">
interface Props {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'primary',
  size: 'md'
});

const buttonClasses = computed(() => [
  'btn',
  `btn--${props.variant}`,
  `btn--${props.size}`,
  {
    'btn--disabled': props.disabled,
    'btn--loading': props.loading
  }
]);
</script>

<style scoped>
.btn {
  @apply inline-flex items-center justify-center;
  @apply font-medium rounded-md transition-colors;
  @apply focus:outline-none focus:ring-2 focus:ring-offset-2;
}

.btn--primary {
  @apply bg-primary-600 text-white hover:bg-primary-700;
  @apply focus:ring-primary-500;
}

.btn--sm { @apply px-3 py-1.5 text-sm; }
.btn--md { @apply px-4 py-2 text-base; }
.btn--lg { @apply px-6 py-3 text-lg; }

.btn--disabled {
  @apply opacity-50 cursor-not-allowed;
}
</style>
```

#### フォームコンポーネント
```vue
<!-- BaseInput.vue -->
<template>
  <div class="form-field">
    <label v-if="label" :for="inputId" class="form-label">
      {{ label }}
      <span v-if="required" class="required">*</span>
    </label>
    
    <div class="input-wrapper">
      <input
        :id="inputId"
        :type="type"
        :value="modelValue"
        :placeholder="placeholder"
        :disabled="disabled"
        :class="inputClasses"
        @input="$emit('update:modelValue', $event.target.value)"
        @blur="handleBlur"
      />
      <slot name="suffix" />
    </div>
    
    <div v-if="error" class="form-error">
      {{ error }}
    </div>
    
    <div v-else-if="help" class="form-help">
      {{ help }}
    </div>
  </div>
</template>
```

### レスポンシブデザイン戦略

#### ブレイクポイント定義
```scss
// breakpoints.scss
$breakpoints: (
  'xs': 0,
  'sm': 640px,
  'md': 768px,
  'lg': 1024px,
  'xl': 1280px,
  '2xl': 1536px
);

// Mixins
@mixin responsive($breakpoint) {
  @media (min-width: map-get($breakpoints, $breakpoint)) {
    @content;
  }
}
```

#### モバイルファースト設計
```vue
<template>
  <div class="book-grid">
    <BookCard 
      v-for="book in books" 
      :key="book.id" 
      :book="book"
      class="book-grid__item"
    />
  </div>
</template>

<style scoped>
.book-grid {
  display: grid;
  gap: var(--space-4);
  
  /* モバイル: 1列 */
  grid-template-columns: 1fr;
  
  /* タブレット: 2列 */
  @include responsive('md') {
    grid-template-columns: repeat(2, 1fr);
    gap: var(--space-6);
  }
  
  /* デスクトップ: 3列 */
  @include responsive('lg') {
    grid-template-columns: repeat(3, 1fr);
  }
  
  /* 大画面: 4列 */
  @include responsive('xl') {
    grid-template-columns: repeat(4, 1fr);
    gap: var(--space-8);
  }
}
</style>
```

## ⚡ パフォーマンス最適化

### コンポーネント最適化戦略

#### 遅延ローディング
```typescript
// 動的インポート
const BookDetail = defineAsyncComponent(() => 
  import('@/components/BookDetail.vue')
);

// ローディング・エラー状態の制御
const BookDetailWithStates = defineAsyncComponent({
  loader: () => import('@/components/BookDetail.vue'),
  loadingComponent: LoadingSpinner,
  errorComponent: ErrorMessage,
  delay: 200,
  timeout: 3000
});
```

#### メモ化とキャッシング
```typescript
// computedプロパティの最適化
const expensiveComputation = computed(() => {
  return books.value
    .filter(book => book.isActive)
    .sort((a, b) => a.title.localeCompare(b.title))
    .slice(0, 10);
});

// watchEffect の最適化
watchEffect(() => {
  // 依存関係を最小限に
  console.log(`Current user: ${user.value?.name}`);
}, {
  flush: 'post' // DOM更新後に実行
});
```

#### バンドル最適化
```typescript
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor': ['vue', 'vue-router', 'pinia'],
          'ui': ['@/components/common'],
          'utils': ['@/utils', '@/composables']
        }
      }
    }
  }
});
```

## 🧪 テスト設計

### テスト戦略
```typescript
// 単体テスト例: BookCard.spec.ts
import { mount } from '@vue/test-utils';
import BookCard from '@/components/BookCard.vue';

describe('BookCard', () => {
  const mockBook = {
    id: 1,
    title: 'Vue.js 完全ガイド',
    author: '山田太郎',
    publisher: 'テック出版'
  };

  it('書籍情報を正しく表示する', () => {
    const wrapper = mount(BookCard, {
      props: { book: mockBook }
    });

    expect(wrapper.text()).toContain(mockBook.title);
    expect(wrapper.text()).toContain(mockBook.author);
  });

  it('削除ボタンクリック時にイベントを発火する', async () => {
    const wrapper = mount(BookCard, {
      props: { book: mockBook }
    });

    await wrapper.find('[data-testid="delete-button"]').trigger('click');
    expect(wrapper.emitted('delete')).toBeTruthy();
  });
});
```

### E2Eテスト戦略
```typescript
// cypress/e2e/book-management.cy.ts
describe('書籍管理機能', () => {
  beforeEach(() => {
    cy.visit('/books');
  });

  it('新しい書籍を登録できる', () => {
    cy.get('[data-testid="add-book-button"]').click();
    cy.get('[data-testid="title-input"]').type('新しい技術書');
    cy.get('[data-testid="author-input"]').type('著者名');
    cy.get('[data-testid="submit-button"]').click();
    
    cy.contains('書籍が登録されました').should('be.visible');
    cy.contains('新しい技術書').should('be.visible');
  });
});
```

## 🔧 開発ツール設定

### ESLint設定
```json
{
  "extends": [
    "@vue/typescript/recommended",
    "plugin:vue/vue3-recommended"
  ],
  "rules": {
    "vue/component-name-in-template-casing": ["error", "PascalCase"],
    "vue/prop-name-casing": ["error", "camelCase"],
    "@typescript-eslint/no-unused-vars": "error"
  }
}
```

### Prettier設定
```json
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100,
  "vueIndentScriptAndStyle": true
}
```

---

**最終更新**: 2025年6月15日  
**対象バージョン**: Vue.js 3.5.13, TypeScript 5.6.0  
**ステータス**: 実装中