<template>
  <div class="book-list">
    <h1>図書一覧</h1>

    <div v-if="loading" class="loading">データを読み込み中...</div>
    <div v-else-if="error" class="error">{{ error }}</div>
    <div v-else>
      <SearchBox v-model="searchQuery" placeholder="タイトルで検索..." @clear="clearSearch" />
      <div class="table-container">
        <table class="book-table">
          <thead>
            <tr>
              <SortableTableHeader
                column="title"
                :current-sort-column="sortColumn"
                :sort-direction="sortDirection"
                width="22%"
                @sort="sortBy"
              >
                タイトル
              </SortableTableHeader>

              <SortableTableHeader
                column="author"
                :current-sort-column="sortColumn"
                :sort-direction="sortDirection"
                width="15%"
                @sort="sortBy"
              >
                著者
              </SortableTableHeader>

              <SortableTableHeader
                column="publisher"
                :current-sort-column="sortColumn"
                :sort-direction="sortDirection"
                width="15%"
                @sort="sortBy"
              >
                出版社
              </SortableTableHeader>

              <SortableTableHeader
                column="publicationDate"
                :current-sort-column="sortColumn"
                :sort-direction="sortDirection"
                width="10%"
                @sort="sortBy"
              >
                出版日
              </SortableTableHeader>

              <SortableTableHeader
                column="genre"
                :current-sort-column="sortColumn"
                :sort-direction="sortDirection"
                width="10%"
                @sort="sortBy"
              >
                ジャンル
              </SortableTableHeader>

              <SortableTableHeader
                column="pageCount"
                :current-sort-column="sortColumn"
                :sort-direction="sortDirection"
                width="8%"
                @sort="sortBy"
              >
                ページ数
              </SortableTableHeader>

              <SortableTableHeader
                column="language"
                :current-sort-column="sortColumn"
                :sort-direction="sortDirection"
                width="8%"
                @sort="sortBy"
              >
                言語
              </SortableTableHeader>

              <SortableTableHeader
                column="owner"
                :current-sort-column="sortColumn"
                :sort-direction="sortDirection"
                width="10%"
                @sort="sortBy"
              >
                オーナー
                <Tooltip text="この技術書を提供した人の名前です" />
              </SortableTableHeader>

              <th width="5%" class="actions-header">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="book in filteredAndSortedBooks" :key="book.id">
              <td class="title">
                {{ book.title }}
              </td>
              <td>{{ book.author }}</td>
              <td>{{ book.publisher }}</td>
              <td>{{ book.publicationDate }}</td>
              <td>{{ book.genre }}</td>
              <td>{{ book.pageCount }}</td>
              <td>{{ book.language }}</td>
              <td class="owner">{{ book.owner }}</td>
              <td class="actions">
                <button class="delete-btn" title="削除" @click="confirmDelete(book)">×</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-if="filteredAndSortedBooks.length === 0" class="no-results">
        検索条件に一致する図書がありません
      </div>
    </div>

    <!-- 削除確認ダイアログ -->
    <div v-if="showDeleteDialog" class="delete-dialog-overlay">
      <div class="delete-dialog">
        <h3>図書の削除</h3>
        <p>「{{ bookToDelete?.title }}」を削除してもよろしいですか？</p>
        <p class="warning">この操作は取り消せません。</p>
        <div class="dialog-buttons">
          <button class="cancel-btn" @click="cancelDelete">キャンセル</button>
          <button class="confirm-btn" :disabled="isDeleting" @click="deleteSelectedBook">
            {{ isDeleting ? '削除中...' : '削除する' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, onMounted, ref } from 'vue';
import { useSearchableData } from '../composables/useSearchableData';
import { useSortableData } from '../composables/useSortableData';
import { deleteBook, fetchBooks } from '../services/bookService';
import type { Book } from '../types/Book';
import SearchBox from './common/SearchBox.vue';
import SortableTableHeader from './common/SortableTableHeader.vue';
import Tooltip from './common/Tooltip.vue';

export default defineComponent({
  name: 'BookList',
  components: {
    SearchBox,
    SortableTableHeader,
    Tooltip,
  },
  setup() {
    const books = ref<Book[]>([]);
    const loading = ref(true);
    const error = ref<string | null>(null);
    const showDeleteDialog = ref(false);
    const bookToDelete = ref<Book | null>(null);
    const isDeleting = ref(false);

    // ソート機能の設定
    const { sortColumn, sortDirection, sortBy } = useSortableData<Book>(books, 'title');

    // 検索機能の設定
    const { searchQuery, clearSearch } = useSearchableData<Book>(books, 'title');

    // フィルタリングとソートを両方適用した最終的な書籍リスト
    const filteredAndSortedBooks = computed(() => {
      // 現在の検索クエリに基づくフィルタリング
      const filtered = books.value.filter((book) => {
        if (!searchQuery.value) return true;
        return book.title.toLowerCase().includes(searchQuery.value.toLowerCase());
      });

      // フィルタリング結果にソートを適用
      return filtered.sort((a, b) => {
        let valueA = a[sortColumn.value];
        let valueB = b[sortColumn.value];

        // 数値型の場合は数値として比較
        if (sortColumn.value === 'pageCount') {
          const numA = Number(valueA);
          const numB = Number(valueB);
          return sortDirection.value === 'asc' ? numA - numB : numB - numA;
        }

        // 文字列の場合（デフォルト）
        return sortDirection.value === 'asc'
          ? String(valueA).localeCompare(String(valueB), 'ja')
          : String(valueB).localeCompare(String(valueA), 'ja');
      });
    });

    // データの取得
    const loadBooks = async () => {
      try {
        loading.value = true;
        books.value = await fetchBooks();
        loading.value = false;
      } catch (err) {
        loading.value = false;
        error.value = 'データの取得に失敗しました。';
        console.error('Error loading books:', err);
      }
    };

    // 削除確認ダイアログを表示
    const confirmDelete = (book: Book) => {
      bookToDelete.value = book;
      showDeleteDialog.value = true;
    };

    // 削除キャンセル
    const cancelDelete = () => {
      showDeleteDialog.value = false;
      bookToDelete.value = null;
    };

    // 書籍の削除
    const deleteSelectedBook = async () => {
      if (!bookToDelete.value) return;

      isDeleting.value = true;
      try {
        // APIを呼び出して図書を削除
        await deleteBook(bookToDelete.value.id);

        // 削除後にローカルデータからも削除
        books.value = books.value.filter((book) => book.id !== bookToDelete.value?.id);

        // 削除後はダイアログを閉じる
        showDeleteDialog.value = false;
        bookToDelete.value = null;
      } catch (err) {
        console.error('Error deleting book:', err);
      } finally {
        isDeleting.value = false;
      }
    };

    // データを再読み込みするメソッドを追加
    const refreshBooks = () => {
      loadBooks();
    };

    onMounted(() => {
      loadBooks();
    });

    return {
      books,
      loading,
      error,
      sortColumn,
      sortDirection,
      sortBy,
      searchQuery,
      clearSearch,
      filteredAndSortedBooks,
      refreshBooks,
      showDeleteDialog,
      bookToDelete,
      confirmDelete,
      cancelDelete,
      deleteSelectedBook,
      isDeleting,
    };
  },
});
</script>

<style scoped>
.book-list {
  width: 100%;
  max-width: none;
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

h1 {
  color: #2c3e50;
  text-align: center;
  margin-bottom: 40px;
  font-size: 2.2rem;
  font-weight: 600;
}

.book-table {
  width: 100%;
  table-layout: fixed;
  border-collapse: collapse;
  margin-top: 30px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
  clear: both;
  border-radius: 12px;
  overflow: hidden;
  background-color: #fff;
  min-width: 1000px;
}

.book-table td {
  padding: 16px 18px;
  text-align: left;
  border-bottom: 1px solid #f1f3f4;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 14px;
}

.book-table tbody tr:hover {
  background-color: #f8f9fa;
  transform: scale(1.001);
  transition: all 0.2s ease;
}

.title {
  font-weight: bold;
}

.title a {
  color: #0366d6;
  text-decoration: none;
  cursor: pointer;
}

.title a:hover {
  text-decoration: underline;
}

.owner {
  font-style: italic;
  color: #495057;
}

.loading,
.error {
  text-align: center;
  padding: 20px;
  font-size: 1.2em;
}

.error {
  color: #dc3545;
}

.no-results {
  text-align: center;
  padding: 40px 20px;
  color: #6c757d;
  font-style: italic;
  background-color: #fff;
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  margin-top: 20px;
}

/* テーブルコンテナでスクロール対応 */
.table-container {
  width: 100%;
  overflow-x: auto;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
  border-radius: 12px;
  margin-top: 30px;
}

/* レスポンシブデザインの改善 */
@media screen and (max-width: 1024px) {
  .book-list {
    padding: 20px 15px;
  }

  .book-table {
    font-size: 13px;
  }

  .book-table td {
    padding: 12px 10px;
  }
}

@media screen and (max-width: 768px) {
  .book-list {
    padding: 15px 10px;
  }

  h1 {
    font-size: 1.8rem;
    margin-bottom: 25px;
  }

  .table-container {
    margin-top: 20px;
  }

  .book-table {
    font-size: 12px;
    min-width: 800px;
  }

  .book-table td {
    padding: 10px 8px;
  }

  .search-box {
    width: 100%;
    float: none;
    margin-bottom: 20px;
  }
}

/* 操作ボタンのスタイル */
.actions {
  text-align: center;
}

.delete-btn {
  background: linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%);
  color: white;
  border: none;
  border-radius: 50%;
  width: 32px;
  height: 32px;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.delete-btn:hover {
  background: linear-gradient(135deg, #ff5252 0%, #d32f2f 100%);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(255, 107, 107, 0.4);
}

/* 削除確認ダイアログのスタイル */
.delete-dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.delete-dialog {
  background: #fff;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  max-width: 400px;
  width: 100%;
  text-align: center;
}

.delete-dialog h3 {
  margin-top: 0;
}

.warning {
  color: #dc3545;
  font-weight: bold;
  margin: 15px 0;
}

.dialog-buttons {
  display: flex;
  justify-content: space-between;
  margin-top: 20px;
}

.cancel-btn,
.confirm-btn {
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.cancel-btn {
  background: #6c757d;
  color: white;
}

.confirm-btn {
  background: #dc3545;
  color: white;
}
</style>
