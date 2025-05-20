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
            <th>タイトル</th>
            <th>著者</th>
            <th>出版社</th>
            <th>出版日</th>
            <th>ジャンル</th>
            <th>ページ数</th>
            <th>言語</th>
            <th>
              オーナー
              <span class="tooltip-icon" title="この技術書を提供した人の名前です"> i </span>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="book in books" :key="book.id">
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
import { defineComponent, onMounted, ref } from 'vue';
import type { Book } from '../types/Book';

export default defineComponent({
  name: 'BookList',
  setup() {
    const books = ref<Book[]>([]);
    const loading = ref(true);
    const error = ref<string | null>(null);

    // APIレスポンスデータをフロントエンドの型に変換する関数
    const convertToBookFormat = (apiBooks: any[]): Book[] => {
      return apiBooks.map(book => ({
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
        coverImageUrl: ''
      }));
    };

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
