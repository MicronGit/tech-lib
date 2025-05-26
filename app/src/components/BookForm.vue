<template>
  <div class="book-form">
    <h2>図書登録</h2>
    <form @submit.prevent="submitForm">
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
    const isSubmitting = ref(false);
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

    // キャンセル処理
    const cancel = () => {
      Object.assign(form, defaultForm);
      emit('cancel');
    };

    return {
      form,
      isSubmitting,
      error,
      successMessage,
      submitForm,
      cancel,
    };
  },
});
</script>

<style scoped>
.book-form {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.1);
}

h2 {
  color: #333;
  text-align: center;
  margin-bottom: 20px;
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
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 16px;
  transition: border-color 0.3s;
}

input:focus,
select:focus,
textarea:focus {
  border-color: #4caf50;
  outline: none;
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
  background-color: #4caf50;
  color: white;
}

.cancel-btn:hover {
  background-color: #e0e0e0;
}

.submit-btn:hover {
  background-color: #388e3c;
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
</style>
