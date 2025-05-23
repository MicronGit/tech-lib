<template>
  <div class="book-list">
    <h1>図書一覧</h1>

    <div v-if="loading" class="loading">データを読み込み中...</div>
    <div v-else-if="error" class="error">
      {{ error }}
    </div>
    <div v-else>
      <table class="book-table">
        <thead>
          <tr>
            <th @click="sortBy('title')" class="sortable">
              タイトル
              <span class="sort-icon" v-if="sortColumn === 'title'">
                {{ sortDirection === 'asc' ? '▲' : '▼' }}
              </span>
            </th>
            <th @click="sortBy('author')" class="sortable">
              著者
              <span class="sort-icon" v-if="sortColumn === 'author'">
                {{ sortDirection === 'asc' ? '▲' : '▼' }}
              </span>
            </th>
            <th @click="sortBy('publisher')" class="sortable">
              出版社
              <span class="sort-icon" v-if="sortColumn === 'publisher'">
                {{ sortDirection === 'asc' ? '▲' : '▼' }}
              </span>
            </th>
            <th @click="sortBy('publicationDate')" class="sortable">
              出版日
              <span class="sort-icon" v-if="sortColumn === 'publicationDate'">
                {{ sortDirection === 'asc' ? '▲' : '▼' }}
              </span>
            </th>
            <th @click="sortBy('genre')" class="sortable">
              ジャンル
              <span class="sort-icon" v-if="sortColumn === 'genre'">
                {{ sortDirection === 'asc' ? '▲' : '▼' }}
              </span>
            </th>
            <th @click="sortBy('pageCount')" class="sortable">
              ページ数
              <span class="sort-icon" v-if="sortColumn === 'pageCount'">
                {{ sortDirection === 'asc' ? '▲' : '▼' }}
              </span>
            </th>
            <th @click="sortBy('language')" class="sortable">
              言語
              <span class="sort-icon" v-if="sortColumn === 'language'">
                {{ sortDirection === 'asc' ? '▲' : '▼' }}
              </span>
            </th>
            <th @click="sortBy('owner')" class="sortable">
              オーナー
              <span class="tooltip-icon" title="この技術書を提供した人の名前です"> i </span>
              <span class="sort-icon" v-if="sortColumn === 'owner'">
                {{ sortDirection === 'asc' ? '▲' : '▼' }}
              </span>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="book in sortedBooks" :key="book.id">
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

    // ソート済みの書籍リストを計算
    const sortedBooks = computed(() => {
      const sortedArray = [...books.value];

      return sortedArray.sort((a, b) => {
        let valueA = a[sortColumn.value];
        let valueB = b[sortColumn.value];

        // 数値型の場合は数値として比較
        if (sortColumn.value === 'pageCount') {
          valueA = Number(valueA);
          valueB = Number(valueB);
          return sortDirection.value === 'asc' ? valueA - valueB : valueB - valueA;
        }

        // 文字列の場合（デフォルト）
        // 日本語を考慮した比較
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
      sortedBooks,
    };
  },
});
</script>

<style scoped>
.book-list {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

h1 {
  color: #333;
  text-align: center;
  margin-bottom: 30px;
}

.book-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 20px;
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.1);
}

.book-table th,
.book-table td {
  padding: 12px 15px;
  text-align: left;
  border-bottom: 1px solid #ddd;
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
  margin-left: 5px;
  cursor: help;
  position: relative;
}

.tooltip-icon:hover::after {
  content: attr(title);
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  background-color: #333;
  color: white;
  padding: 8px 12px;
  border-radius: 4px;
  font-weight: normal;
  font-style: normal;
  white-space: normal; /* テキストを折り返せるようにする */
  z-index: 10;
  margin-top: 5px;
  font-size: 12px;
  line-height: 1.4; /* 行間を適切に設定 */
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
  width: max-content;
  max-width: 300px; /* 最大幅を広げる */
  text-align: center; /* 中央揃え */
}

.tooltip-icon:hover::before {
  content: '';
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  border: 5px solid transparent;
  border-bottom-color: #333;
  z-index: 10;
}
</style>
