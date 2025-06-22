<template>
  <div class="book-form">
    <h2>図書登録</h2>
    <form @submit.prevent="submitForm">
      <div class="form-group">
        <label for="isbn">ISBN</label>
        <div class="isbn-input-container">
          <input
            id="isbn"
            v-model="isbn"
            type="text"
            placeholder="ISBNを入力してください (例: 9784567890123)"
            class="isbn-input"
          />
          <button
            type="button"
            class="auto-fill-btn"
            :disabled="!isbn || isAutoFilling"
            @click="autoFillFromISBN"
          >
            {{ isAutoFilling ? '取得中...' : '自動入力' }}
          </button>
        </div>
      </div>

      <div class="form-group">
        <label for="title">タイトル *</label>
        <input
          id="title"
          v-model="form.title"
          type="text"
          required
          placeholder="タイトルを入力してください"
        />
      </div>

      <div class="form-group">
        <label for="author">著者 *</label>
        <input
          id="author"
          v-model="form.author"
          type="text"
          required
          placeholder="著者名を入力してください"
        />
      </div>

      <div class="form-group">
        <label for="publisher">出版社 *</label>
        <input
          id="publisher"
          v-model="form.publisher"
          type="text"
          required
          placeholder="出版社を入力してください"
        />
      </div>

      <div class="form-group">
        <label for="publicationDate">出版日</label>
        <input
          id="publicationDate"
          v-model="form.publicationDate"
          type="date"
          placeholder="YYYY-MM-DD"
        />
      </div>

      <div class="form-group">
        <label for="genre">ジャンル</label>
        <select id="genre" v-model="form.genre">
          <option value="">選択してください</option>
          <option value="プログラミング">プログラミング</option>
          <option value="データベース">データベース</option>
          <option value="ネットワーク">ネットワーク</option>
          <option value="セキュリティ">セキュリティ</option>
          <option value="クラウド">クラウド</option>
          <option value="AI">AI</option>
          <option value="ビジネス">ビジネス</option>
          <option value="その他">その他</option>
        </select>
      </div>

      <div class="form-group">
        <label for="pageCount">ページ数</label>
        <input
          id="pageCount"
          v-model.number="form.pageCount"
          type="number"
          min="1"
          placeholder="ページ数を入力してください"
        />
      </div>

      <div class="form-group">
        <label for="language">言語</label>
        <select id="language" v-model="form.language">
          <option value="">選択してください</option>
          <option value="日本語">日本語</option>
          <option value="英語">英語</option>
          <option value="その他">その他</option>
        </select>
      </div>

      <div class="form-group">
        <label for="owner">オーナー *</label>
        <input
          id="owner"
          v-model="form.owner"
          type="text"
          required
          placeholder="あなたの名前を入力してください"
        />
      </div>

      <div class="form-group">
        <label for="description">説明</label>
        <textarea
          id="description"
          v-model="form.description"
          rows="4"
          placeholder="図書の説明を入力してください"
        ></textarea>
      </div>

      <div class="form-actions">
        <button type="button" class="cancel-btn" @click="cancel">キャンセル</button>
        <button type="submit" class="submit-btn" :disabled="isSubmitting">
          {{ isSubmitting ? '登録中...' : '登録する' }}
        </button>
      </div>

      <div v-if="error" class="error-message">{{ error }}</div>
      <div v-if="successMessage" class="success-message">{{ successMessage }}</div>
    </form>
  </div>
</template>

<script lang="ts">
import { defineComponent, reactive, ref } from 'vue';
import { addBook } from '../services/bookService';
import { fetchBookDataFromISBN } from '../services/isbnService';

export default defineComponent({
  name: 'BookForm',
  emits: ['added', 'cancel'],
  setup(_, { emit }) {
    // フォームの初期状態
    const defaultForm = {
      title: '',
      author: '',
      publisher: '',
      publicationDate: '',
      genre: '',
      pageCount: 0,
      language: '',
      owner: '',
      description: '',
      status: 'available' as const,
    };

    const form = reactive({ ...defaultForm });
    const isbn = ref('');
    const isSubmitting = ref(false);
    const isAutoFilling = ref(false);
    const error = ref('');
    const successMessage = ref('');

    // フォーム送信処理
    const submitForm = async () => {
      error.value = '';
      successMessage.value = '';
      isSubmitting.value = true;

      try {
        // 必須項目のバリデーション
        if (!form.title || !form.author || !form.publisher || !form.owner) {
          throw new Error('必須項目を入力してください');
        }

        // 図書を登録
        const newBook = await addBook(form);

        // 成功メッセージを表示
        successMessage.value = '図書が正常に登録されました';

        // 親コンポーネントに登録完了イベントを通知
        emit('added', newBook);

        // フォームをリセット
        Object.assign(form, defaultForm);

        // 3秒後に成功メッセージを消す
        setTimeout(() => {
          successMessage.value = '';
        }, 3000);
      } catch (err) {
        if (err instanceof Error) {
          error.value = err.message;
        } else {
          error.value = '登録中にエラーが発生しました';
        }
        console.error('Error submitting form:', err);
      } finally {
        isSubmitting.value = false;
      }
    };

    // ISBN自動入力処理
    const autoFillFromISBN = async () => {
      if (!isbn.value.trim()) {
        error.value = 'ISBNを入力してください';
        return;
      }

      error.value = '';
      isAutoFilling.value = true;

      try {
        const bookData = await fetchBookDataFromISBN(isbn.value.trim());

        if (bookData) {
          form.title = bookData.title || '';
          form.author = bookData.author || '';
          form.publisher = bookData.publisher || '';
          form.publicationDate = bookData.publicationDate || '';
          form.pageCount = bookData.pageCount || 0;
          form.language = bookData.language || '';
          form.description = bookData.description || '';

          successMessage.value = 'ISBN情報を自動入力しました';
          setTimeout(() => {
            successMessage.value = '';
          }, 3000);
        }
      } catch (err) {
        if (err instanceof Error) {
          error.value = err.message;
        } else {
          error.value = 'ISBN情報の取得に失敗しました';
        }
        console.error('Error fetching ISBN data:', err);
      } finally {
        isAutoFilling.value = false;
      }
    };

    // キャンセル処理
    const cancel = () => {
      Object.assign(form, defaultForm);
      isbn.value = '';
      emit('cancel');
    };

    return {
      form,
      isbn,
      isSubmitting,
      isAutoFilling,
      error,
      successMessage,
      submitForm,
      autoFillFromISBN,
      cancel,
    };
  },
});
</script>

<style scoped>
.book-form {
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
  padding: 30px;
  background-color: #fff;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
  border: 1px solid rgba(0, 0, 0, 0.05);
  box-sizing: border-box;
}

h2 {
  color: #2c3e50;
  text-align: center;
  margin-bottom: 30px;
  font-size: 1.8rem;
  font-weight: 600;
}

.form-group {
  margin-bottom: 15px;
}

label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
  color: #555;
}

input,
select,
textarea {
  width: 100%;
  padding: 12px 16px;
  border: 2px solid #e1e5e9;
  border-radius: 8px;
  font-size: 16px;
  transition: all 0.3s ease;
  background-color: #fafbfc;
  box-sizing: border-box;
}

input:focus,
select:focus,
textarea:focus {
  border-color: #667eea;
  outline: none;
  background-color: #fff;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
}

button {
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  font-size: 16px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.cancel-btn {
  background-color: #f5f5f5;
  color: #333;
}

.submit-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  font-weight: 600;
  letter-spacing: 0.5px;
}

.cancel-btn:hover {
  background-color: #e0e0e0;
}

.submit-btn:hover {
  background: linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

button:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}

.error-message {
  color: #d32f2f;
  margin-top: 15px;
  text-align: center;
}

.success-message {
  color: #388e3c;
  margin-top: 15px;
  text-align: center;
}

.isbn-input-container {
  display: flex;
  gap: 10px;
  align-items: flex-end;
}

.isbn-input {
  flex: 1;
}

.auto-fill-btn {
  padding: 12px 20px;
  background: linear-gradient(135deg, #4caf50 0%, #45a049 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 0.5px;
  cursor: pointer;
  transition: all 0.3s ease;
  white-space: nowrap;
  min-width: 100px;
}

.auto-fill-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #45a049 0%, #3d8b40 100%);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3);
}

.auto-fill-btn:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

/* レスポンシブデザインの改善 */
@media (max-width: 768px) {
  .book-form {
    padding: 20px 15px;
    margin: 0;
    width: 100%;
    border-radius: 0;
  }

  h2 {
    font-size: 1.5rem;
  }

  .form-actions {
    flex-direction: column;
    gap: 15px;
  }

  .form-actions button {
    width: 100%;
    padding: 12px;
  }

  .isbn-input-container {
    flex-direction: column;
    gap: 10px;
  }

  .auto-fill-btn {
    width: 100%;
  }
}

@media (max-width: 480px) {
  .book-form {
    padding: 15px 10px;
    margin: 0;
    width: 100%;
  }

  input,
  select,
  textarea {
    font-size: 16px; /* iOS zoom prevention */
  }
}
</style>
