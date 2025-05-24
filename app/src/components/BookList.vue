<template>
  <div class="book-list">
    <h1>図書一覧</h1>

    <div v-if="loading" class="loading">データを読み込み中...</div>
    <div v-else-if="error" class="error">
      {{ error }}
    </div>
    <div v-else>
      <div class="search-box">
        <input
          type="text"
          v-model="searchQuery"
          class="search-input"
          placeholder="タイトルで検索..."
        />
        <span v-if="searchQuery" class="search-clear" @click="clearSearch">✕</span>
      </div>
      <table class="book-table">
        <thead>
          <tr>
            <th @click="sortBy('title')" class="sortable" style="width: 22%">
              タイトル
              <span class="sort-icon" v-if="sortColumn === 'title'">
                {{ sortDirection === 'asc' ? '▲' : '▼' }}
              </span>
            </th>
            <th @click="sortBy('author')" class="sortable" style="width: 15%">
              著者
              <span class="sort-icon" v-if="sortColumn === 'author'">
                {{ sortDirection === 'asc' ? '▲' : '▼' }}
              </span>
            </th>
            <th @click="sortBy('publisher')" class="sortable" style="width: 15%">
              出版社
              <span class="sort-icon" v-if="sortColumn === 'publisher'">
                {{ sortDirection === 'asc' ? '▲' : '▼' }}
              </span>
            </th>
            <th @click="sortBy('publicationDate')" class="sortable" style="width: 10%">
              出版日
              <span class="sort-icon" v-if="sortColumn === 'publicationDate'">
                {{ sortDirection === 'asc' ? '▲' : '▼' }}
              </span>
            </th>
            <th @click="sortBy('genre')" class="sortable" style="width: 10%">
              ジャンル
              <span class="sort-icon" v-if="sortColumn === 'genre'">
                {{ sortDirection === 'asc' ? '▲' : '▼' }}
              </span>
            </th>
            <th @click="sortBy('pageCount')" class="sortable" style="width: 8%">
              ページ数
              <span class="sort-icon" v-if="sortColumn === 'pageCount'">
                {{ sortDirection === 'asc' ? '▲' : '▼' }}
              </span>
            </th>
            <th @click="sortBy('language')" class="sortable" style="width: 8%">
              言語
              <span class="sort-icon" v-if="sortColumn === 'language'">
                {{ sortDirection === 'asc' ? '▲' : '▼' }}
              </span>
            </th>
            <th @click="sortBy('owner')" class="sortable" style="width: 12%">
              オーナー
              <div class="tooltip-container">
                <span class="tooltip-icon">i</span>
                <span class="tooltip-text">この技術書を提供した人の名前です</span>
              </div>
              <span class="sort-icon" v-if="sortColumn === 'owner'">
                {{ sortDirection === 'asc' ? '▲' : '▼' }}
              </span>
            </th>
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
import axios from 'axios';
import { computed, defineComponent, onMounted, ref } from 'vue';
import type { Book } from '../types/Book';

export default defineComponent({
  name: 'BookList',
  setup() {
    const books = ref<Book[]>([]);
    const loading = ref(true);
    const error = ref<string | null>(null);
    const sortColumn = ref<keyof Book>('title'); // デフォルトでタイトルでソート
    const sortDirection = ref<'asc' | 'desc'>('asc'); // デフォルトは昇順
    const searchQuery = ref(''); // 検索クエリ

    // APIレスポンスデータをフロントエンドの型に変換する関数
    const convertToBookFormat = (apiBooks: any[]): Book[] => {
      return apiBooks.map((book) => ({
        id: String(book.id),
        title: book.title,
        author: book.author,
        publisher: book.publisher,
        publicationDate: book.publication_date || '',
        genre: book.genre || '',
        pageCount: book.page_count || 0,
        language: book.language || '',
        owner: book.owner || '',
        status: 'available',
        description: '',
        coverImageUrl: '',
      }));
    };

    // 検索クエリをクリア
    const clearSearch = () => {
      searchQuery.value = '';
    };

    // ソート関数
    const sortBy = (column: keyof Book) => {
      // 同じカラムをクリックした場合は昇順/降順を切り替え
      if (sortColumn.value === column) {
        sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc';
      } else {
        // 異なるカラムの場合は、そのカラムで昇順ソート
        sortColumn.value = column;
        sortDirection.value = 'asc';
      }
    };

    // 検索フィルター適用済みの書籍リスト
    const filteredBooks = computed(() => {
      if (!searchQuery.value) {
        return books.value;
      }

      const query = searchQuery.value.toLowerCase();
      return books.value.filter((book) => book.title.toLowerCase().includes(query));
    });

    // フィルタリングとソートを両方適用した最終的な書籍リスト
    const filteredAndSortedBooks = computed(() => {
      const filtered = filteredBooks.value;

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

    // モックデータを使用（本番環境ではAPIからデータを取得）
    const fetchBooks = async () => {
      try {
        const response = await axios.get(
          'https://ba08thaw76.execute-api.ap-northeast-1.amazonaws.com/dev/books'
        );
        books.value = convertToBookFormat(response.data.books);

        loading.value = false;
      } catch (err) {
        loading.value = false;
        error.value = 'データの取得に失敗しました。';
        console.error('Error fetching books:', err);
      }
    };

    onMounted(() => {
      fetchBooks();
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

.search-box {
  position: relative;
  margin-bottom: 20px;
  width: 300px;
  float: left;
}

.search-input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #333;
  border-radius: 4px;
  font-size: 14px;
  background-color: white;
  color: #333;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.search-input::placeholder {
  color: #999;
  opacity: 1;
}

.search-input:focus {
  border-color: #666;
  outline: 0;
  box-shadow: 0 0 0 0.1rem rgba(0, 0, 0, 0.2);
}

.search-clear {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  cursor: pointer;
  color: #6c757d;
  font-size: 14px;
  background: transparent;
  border: none;
  padding: 3px;
}

.search-clear:hover {
  color: #343a40;
}

.book-table {
  width: 100%;
  table-layout: fixed;
  border-collapse: collapse;
  margin-top: 20px;
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.1);
  clear: both;
}

.book-table th,
.book-table td {
  padding: 12px 15px;
  text-align: left;
  border-bottom: 1px solid #ddd;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.book-table th {
  background-color: #f8f9fa;
  color: #333;
  font-weight: bold;
}

.book-table th.sortable {
  cursor: pointer;
  position: relative;
  padding-right: 25px; /* ソートアイコン用の余白 */
}

.book-table th.sortable:hover {
  background-color: #e9ecef;
}

.sort-icon {
  position: absolute;
  right: 8px;
  font-size: 12px;
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

.tooltip-container {
  position: relative;
  display: inline-block;
  margin-left: 5px;
}

.tooltip-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background-color: #6c757d;
  color: white;
  font-size: 12px;
  font-weight: bold;
  cursor: help;
}

.tooltip-text {
  visibility: hidden;
  width: 200px;
  background-color: #333;
  color: white;
  text-align: center;
  padding: 8px 12px;
  border-radius: 4px;
  position: absolute;
  z-index: 10;
  top: -10px;
  left: 25px;
  opacity: 0;
  transition: opacity 0.3s;
  font-weight: normal;
  font-style: normal;
  font-size: 12px;
  line-height: 1.4;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
  white-space: normal;
}

.tooltip-text::after {
  content: '';
  position: absolute;
  top: 15px;
  right: 100%;
  margin-top: -5px;
  border-width: 5px;
  border-style: solid;
  border-color: transparent #333 transparent transparent;
}

.tooltip-container:hover .tooltip-text {
  visibility: visible;
  opacity: 1;
}
</style>
