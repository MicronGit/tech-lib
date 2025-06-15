<script setup lang="ts">
import { ref } from 'vue';
import BookForm from './components/BookForm.vue';
import BookList from './components/BookList.vue';

const currentView = ref<'list' | 'form'>('list');
const bookListRef = ref<InstanceType<typeof BookList> | null>(null);

function showBookList() {
  currentView.value = 'list';
}

function showBookForm() {
  currentView.value = 'form';
}

function handleBookAdded() {
  // 図書が追加されたら一覧表示に戻る
  currentView.value = 'list';

  // 一覧を更新
  setTimeout(() => {
    bookListRef.value?.refreshBooks();
  }, 500);
}
</script>

<template>
  <div class="app-container">
    <header class="app-header">
      <h1>技術書管理システム</h1>
      <nav class="app-nav">
        <button :class="{ active: currentView === 'list' }" @click="showBookList">図書一覧</button>
        <button :class="{ active: currentView === 'form' }" @click="showBookForm">図書登録</button>
      </nav>
    </header>
    <main>
      <BookList v-if="currentView === 'list'" ref="bookListRef" />
      <BookForm v-else @added="handleBookAdded" @cancel="showBookList" />
    </main>
    <footer class="app-footer">
      <p>© 2025 技術書管理システム</p>
    </footer>
  </div>
</template>

<style>
body {
  margin: 0;
  font-family: 'Helvetica Neue', Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
  background-color: #f8f9fa;
  width: 100%;
  min-height: 100vh;
}

.app-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  width: 100%;
}

.app-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 1.5rem;
  text-align: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.app-header h1 {
  margin: 0 0 15px 0;
  font-size: 2.2rem;
  font-weight: 600;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.app-nav {
  display: flex;
  justify-content: center;
  gap: 15px;
  margin-top: 10px;
}

.app-nav button {
  background-color: transparent;
  color: white;
  border: 2px solid rgba(255, 255, 255, 0.7);
  padding: 10px 20px;
  border-radius: 25px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.3s ease;
}

.app-nav button.active {
  background-color: rgba(255, 255, 255, 0.3);
  border-color: white;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

.app-nav button:hover {
  background-color: rgba(255, 255, 255, 0.25);
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

main {
  flex: 1;
  padding: 30px 20px;
  min-height: calc(100vh - 200px);
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
}

.app-footer {
  background: linear-gradient(135deg, #343a40 0%, #495057 100%);
  color: #f8f9fa;
  text-align: center;
  padding: 1.5rem;
  margin-top: auto;
  box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.1);
}

/* レスポンシブデザインの追加 */
@media (max-width: 768px) {
  .app-nav {
    flex-direction: column;
    gap: 10px;
  }

  .app-nav button {
    width: 100%;
  }

  main {
    padding: 20px 15px;
    width: 100%;
  }

  .app-header {
    padding: 1rem;
  }

  .app-header h1 {
    font-size: 1.8rem;
  }
}
</style>
