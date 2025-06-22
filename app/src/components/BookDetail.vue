<template>
  <Modal :show="show" title="図書詳細" @close="$emit('close')">
    <div v-if="loading" class="loading">
      <div class="loading-spinner"></div>
      <p>詳細情報を読み込み中...</p>
    </div>

    <div v-else-if="error" class="error">
      <p>{{ error }}</p>
      <button class="retry-btn" @click="retryLoad">再読み込み</button>
    </div>

    <div v-else-if="book" class="book-detail">
      <div class="book-header">
        <div class="book-cover">
          <img
            v-if="book.coverImageUrl"
            :src="book.coverImageUrl"
            :alt="book.title"
            class="cover-image"
          />
          <div v-else class="no-cover">
            <span>📚</span>
            <p>カバー画像なし</p>
          </div>
        </div>

        <div class="book-info">
          <h2 class="book-title">{{ book.title }}</h2>
          <p class="book-author">{{ book.author }}</p>
          <div class="book-meta">
            <span class="status-badge" :class="statusClass">{{ statusText }}</span>
          </div>
        </div>
      </div>

      <div class="book-details">
        <div class="detail-section">
          <h3>基本情報</h3>
          <div class="detail-grid">
            <div class="detail-item">
              <label>出版社</label>
              <span>{{ book.publisher }}</span>
            </div>
            <div class="detail-item">
              <label>出版日</label>
              <span>{{ book.publicationDate || '不明' }}</span>
            </div>
            <div class="detail-item">
              <label>ジャンル</label>
              <span>{{ book.genre || '未分類' }}</span>
            </div>
            <div class="detail-item">
              <label>ページ数</label>
              <span>{{ book.pageCount || '不明' }}ページ</span>
            </div>
            <div class="detail-item">
              <label>言語</label>
              <span>{{ book.language || '不明' }}</span>
            </div>
            <div class="detail-item">
              <label>提供者</label>
              <span>{{ book.owner || '不明' }}</span>
            </div>
          </div>
        </div>

        <div v-if="book.description" class="detail-section">
          <h3>概要・説明</h3>
          <div class="description">
            <p>{{ book.description }}</p>
          </div>
        </div>

        <div v-else class="detail-section">
          <h3>概要・説明</h3>
          <div class="no-description">
            <p>この図書には概要が登録されていません。</p>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <button class="close-btn" @click="$emit('close')">閉じる</button>
    </template>
  </Modal>
</template>

<script lang="ts">
import { computed, defineComponent, ref, watch, type PropType } from 'vue';
import type { Book } from '../types/Book';
import { fetchBookById } from '../services/bookService';
import Modal from './common/Modal.vue';

export default defineComponent({
  name: 'BookDetail',
  components: {
    Modal,
  },
  props: {
    show: {
      type: Boolean,
      default: false,
    },
    bookId: {
      type: [String, null] as PropType<string | null>,
      default: null,
    },
  },
  emits: ['close'],
  setup(props) {
    const book = ref<Book | null>(null);
    const loading = ref(false);
    const error = ref<string | null>(null);

    const statusClass = computed(() => {
      if (!book.value) return '';
      switch (book.value.status) {
        case 'available':
          return 'status-available';
        case 'borrowed':
          return 'status-borrowed';
        case 'reserved':
          return 'status-reserved';
        default:
          return '';
      }
    });

    const statusText = computed(() => {
      if (!book.value) return '';
      switch (book.value.status) {
        case 'available':
          return '利用可能';
        case 'borrowed':
          return '貸出中';
        case 'reserved':
          return '予約済み';
        default:
          return '不明';
      }
    });

    const loadBookDetail = async () => {
      if (!props.bookId) return;

      loading.value = true;
      error.value = null;
      book.value = null;

      try {
        book.value = await fetchBookById(props.bookId);
      } catch (err) {
        error.value = '図書の詳細情報を取得できませんでした。';
        console.error('Error loading book detail:', err);
      } finally {
        loading.value = false;
      }
    };

    const retryLoad = () => {
      loadBookDetail();
    };

    // bookIdが変更されたときに詳細を読み込み
    watch(
      () => props.bookId,
      (newBookId) => {
        if (newBookId && props.show) {
          loadBookDetail();
        }
      },
      { immediate: true }
    );

    // モーダルが表示されたときに詳細を読み込み
    watch(
      () => props.show,
      (isVisible) => {
        if (isVisible && props.bookId) {
          loadBookDetail();
        } else if (!isVisible) {
          // モーダルが閉じられたときにデータをリセット
          book.value = null;
          error.value = null;
        }
      }
    );

    return {
      book,
      loading,
      error,
      statusClass,
      statusText,
      retryLoad,
    };
  },
});
</script>

<style scoped>
.loading {
  text-align: center;
  padding: 40px 20px;
  color: #666;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 20px;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.error {
  text-align: center;
  padding: 40px 20px;
  color: #dc3545;
}

.retry-btn {
  background: #007bff;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  margin-top: 10px;
}

.retry-btn:hover {
  background: #0056b3;
}

.book-detail {
  max-height: 70vh;
  overflow-y: auto;
}

.book-header {
  display: flex;
  gap: 24px;
  margin-bottom: 32px;
  padding-bottom: 24px;
  border-bottom: 1px solid #e9ecef;
}

.book-cover {
  flex-shrink: 0;
  width: 120px;
  height: 160px;
}

.cover-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 8px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.no-cover {
  width: 100%;
  height: 100%;
  background: #f8f9fa;
  border: 2px dashed #dee2e6;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  color: #6c757d;
}

.no-cover span {
  font-size: 2rem;
  margin-bottom: 8px;
}

.no-cover p {
  font-size: 0.875rem;
  margin: 0;
}

.book-info {
  flex: 1;
  min-width: 0;
}

.book-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #2c3e50;
  margin: 0 0 8px 0;
  line-height: 1.3;
}

.book-author {
  font-size: 1.125rem;
  color: #495057;
  margin: 0 0 16px 0;
  font-weight: 500;
}

.book-meta {
  display: flex;
  align-items: center;
  gap: 12px;
}

.status-badge {
  padding: 4px 12px;
  border-radius: 16px;
  font-size: 0.875rem;
  font-weight: 500;
  text-align: center;
}

.status-available {
  background: #d4edda;
  color: #155724;
}

.status-borrowed {
  background: #f8d7da;
  color: #721c24;
}

.status-reserved {
  background: #fff3cd;
  color: #856404;
}

.detail-section {
  margin-bottom: 32px;
}

.detail-section:last-child {
  margin-bottom: 0;
}

.detail-section h3 {
  font-size: 1.25rem;
  font-weight: 600;
  color: #2c3e50;
  margin: 0 0 16px 0;
  padding-bottom: 8px;
  border-bottom: 2px solid #3498db;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 16px;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.detail-item label {
  font-weight: 600;
  color: #495057;
  font-size: 0.875rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.detail-item span {
  color: #2c3e50;
  font-size: 1rem;
  line-height: 1.4;
}

.description {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 8px;
  border-left: 4px solid #3498db;
}

.description p {
  margin: 0;
  line-height: 1.6;
  color: #2c3e50;
}

.no-description {
  background: #fff3cd;
  padding: 20px;
  border-radius: 8px;
  border-left: 4px solid #ffc107;
  text-align: center;
}

.no-description p {
  margin: 0;
  color: #856404;
  font-style: italic;
}

.close-btn {
  background: #6c757d;
  color: white;
  border: none;
  padding: 8px 24px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
}

.close-btn:hover {
  background: #545b62;
}

/* レスポンシブデザイン */
@media (max-width: 768px) {
  .book-header {
    flex-direction: column;
    align-items: center;
    text-align: center;
  }

  .book-cover {
    width: 100px;
    height: 133px;
  }

  .detail-grid {
    grid-template-columns: 1fr;
  }

  .book-title {
    font-size: 1.25rem;
  }

  .book-author {
    font-size: 1rem;
  }
}
</style>
