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
        <button @click="showBookList" :class="{ active: currentView === 'list' }">図書一覧</button>
        <button @click="showBookForm" :class="{ active: currentView === 'form' }">図書登録</button>
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
  background-color: #4c6ef5;
  color: white;
  padding: 1rem;
  text-align: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.app-header h1 {
  margin: 0 0 10px 0;
  font-size: 1.8rem;
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
  border: 1px solid rgba(255, 255, 255, 0.5);
  padding: 8px 15px;
  border-radius: 4px;
  cursor: pointer;
  transition:
    background-color 0.3s,
    border-color 0.3s;
}

.app-nav button.active {
  background-color: rgba(255, 255, 255, 0.2);
  border-color: white;
}

.app-nav button:hover {
  background-color: rgba(255, 255, 255, 0.3);
}

main {
  flex: 1;
  padding: 20px 0;
}

.app-footer {
  background-color: #343a40;
  color: #f8f9fa;
  text-align: center;
  padding: 1rem;
  margin-top: auto;
}
</style>
