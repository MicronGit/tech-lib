<template>
  <div class="book-list">
    <h1>図書一覧</h1>

    <div v-if="loading" class="loading">データを読み込み中...</div>
    <div v-else-if="error" class="error">{{ error }}</div>
    <div v-else>
      <SearchBox v-model="searchQuery" placeholder="タイトルで検索..." @clear="clearSearch" />
      <table class="book-table">
        <thead>
          <tr>
            <SortableTableHeader
              column="title"
              :currentSortColumn="sortColumn"
              :sortDirection="sortDirection"
              width="22%"
              @sort="sortBy"
            >
              タイトル
            </SortableTableHeader>

            <SortableTableHeader
              column="author"
              :currentSortColumn="sortColumn"
              :sortDirection="sortDirection"
              width="15%"
              @sort="sortBy"
            >
              著者
            </SortableTableHeader>

            <SortableTableHeader
              column="publisher"
              :currentSortColumn="sortColumn"
              :sortDirection="sortDirection"
              width="15%"
              @sort="sortBy"
            >
              出版社
            </SortableTableHeader>

            <SortableTableHeader
              column="publicationDate"
              :currentSortColumn="sortColumn"
              :sortDirection="sortDirection"
              width="10%"
              @sort="sortBy"
            >
              出版日
            </SortableTableHeader>

            <SortableTableHeader
              column="genre"
              :currentSortColumn="sortColumn"
              :sortDirection="sortDirection"
              width="10%"
              @sort="sortBy"
            >
              ジャンル
            </SortableTableHeader>

            <SortableTableHeader
              column="pageCount"
              :currentSortColumn="sortColumn"
              :sortDirection="sortDirection"
              width="8%"
              @sort="sortBy"
            >
              ページ数
            </SortableTableHeader>

            <SortableTableHeader
              column="language"
              :currentSortColumn="sortColumn"
              :sortDirection="sortDirection"
              width="8%"
              @sort="sortBy"
            >
              言語
            </SortableTableHeader>

            <SortableTableHeader
              column="owner"
              :currentSortColumn="sortColumn"
              :sortDirection="sortDirection"
              width="12%"
              @sort="sortBy"
            >
              オーナー
              <Tooltip text="この技術書を提供した人の名前です" />
            </SortableTableHeader>
          </tr>
        </thead>
        <tbody>
          <tr v-for="book in filteredAndSortedBooks" :key="book.id">
            <td class="title">{{ book.title }}</td>
            <td>{{ book.author }}</td>
            <td>{{ book.publisher }}</td>
            <td>{{ book.publicationDate }}</td>
            <td>{{ book.genre }}</td>
            <td>{{ book.pageCount }}</td>
            <td>{{ book.language }}</td>
            <td class="owner">{{ book.owner }}</td>
          </tr>
        </tbody>
      </table>
      <div v-if="filteredAndSortedBooks.length === 0" class="no-results">
        検索条件に一致する図書がありません
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, onMounted, ref } from 'vue';
import { useSearchableData } from '../composables/useSearchableData';
import { useSortableData } from '../composables/useSortableData';
import { fetchBooks } from '../services/bookService';
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
          valueA = Number(valueA);
          valueB = Number(valueB);
          return sortDirection.value === 'asc' ? valueA - valueB : valueB - valueA;
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
        books.value = await fetchBooks();
        loading.value = false;
      } catch (err) {
        loading.value = false;
        error.value = 'データの取得に失敗しました。';
        console.error('Error loading books:', err);
      }
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
    };
  },
});
</script>

<style scoped>
.book-list {
  width: 1200px;
  margin: 0 auto;
  padding: 20px;
  box-sizing: border-box;
}

h1 {
  color: #333;
  text-align: center;
  margin-bottom: 30px;
}

.book-table {
  width: 100%;
  table-layout: fixed;
  border-collapse: collapse;
  margin-top: 20px;
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.1);
  clear: both;
}

.book-table td {
  padding: 12px 15px;
  text-align: left;
  border-bottom: 1px solid #ddd;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.book-table tbody tr:hover {
  background-color: #f5f5f5;
}

.title {
  font-weight: bold;
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
  padding: 20px;
  color: #6c757d;
  font-style: italic;
}
</style>
