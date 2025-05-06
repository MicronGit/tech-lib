<script setup lang="ts">
import BookList from './components/BookList.vue'
</script>

<template>
  <div class="app-container">
    <header class="app-header">
      <h1>技術書管理システム</h1>
    </header>
    <main>
      <BookList />
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
}

.app-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.app-header {
  background-color: #4c6ef5;
  color: white;
  padding: 1rem;
  text-align: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.app-header h1 {
  margin: 0;
  font-size: 1.8rem;
}

main {
  flex: 1;
}

.app-footer {
  background-color: #343a40;
  color: #f8f9fa;
  text-align: center;
  padding: 1rem;
  margin-top: auto;
}
</style>
