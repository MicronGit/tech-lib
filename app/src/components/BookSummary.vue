<template>
  <div class="book-summary">
    <h4>AI生成要約</h4>
    <div v-if="loading" class="loading">要約を読み込み中...</div>
    <div v-else-if="error" class="error">{{ error }}</div>
    <div v-else-if="!summary" class="no-summary">この書籍にはAI生成要約がありません。</div>
    <div v-else class="summary-content">
      <p>{{ summary }}</p>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'BookSummary',
  props: {
    summary: {
      type: String,
      default: '',
    },
    loading: {
      type: Boolean,
      default: false,
    },
    error: {
      type: String,
      default: '',
    },
  },
});
</script>

<style scoped>
.book-summary {
  margin-top: 10px;
}

h4 {
  margin-top: 0;
  margin-bottom: 15px;
  color: #333;
  font-size: 1.1rem;
}

.summary-content {
  line-height: 1.6;
  color: #333;
}

.loading,
.error,
.no-summary {
  padding: 10px;
  text-align: center;
  border-radius: 4px;
}

.loading {
  background-color: #f8f9fa;
  color: #6c757d;
}

.error {
  background-color: #f8d7da;
  color: #721c24;
}

.no-summary {
  background-color: #e9ecef;
  color: #495057;
  font-style: italic;
}
</style>
