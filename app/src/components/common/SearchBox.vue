<template>
  <div class="search-box">
    <input
      :value="modelValue"
      type="text"
      class="search-input"
      :placeholder="placeholder"
      @input="updateValue"
    />
    <span v-if="modelValue" class="search-clear" @click="clearSearch">✕</span>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'SearchBox',
  props: {
    modelValue: {
      type: String,
      required: true,
    },
    placeholder: {
      type: String,
      default: '検索...',
    },
  },
  emits: ['update:modelValue', 'clear'],
  setup(_, { emit }) {
    const updateValue = (event: Event) => {
      const target = event.target as HTMLInputElement;
      emit('update:modelValue', target.value);
    };

    const clearSearch = () => {
      emit('update:modelValue', '');
      emit('clear');
    };

    return {
      updateValue,
      clearSearch,
    };
  },
});
</script>

<style scoped>
.search-box {
  position: relative;
  margin-bottom: 25px;
  width: 100%;
  max-width: 400px;
}

.search-input {
  width: 100%;
  padding: 12px 40px 12px 16px;
  border: 2px solid #e1e5e9;
  border-radius: 25px;
  font-size: 14px;
  background-color: #fafbfc;
  color: #2c3e50;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
  box-sizing: border-box;
}

.search-input::placeholder {
  color: #999;
  opacity: 1;
}

.search-input:focus {
  border-color: #667eea;
  outline: 0;
  background-color: #fff;
  box-shadow:
    0 0 0 3px rgba(102, 126, 234, 0.1),
    0 4px 12px rgba(0, 0, 0, 0.1);
}

.search-clear {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  cursor: pointer;
  color: #6c757d;
  font-size: 16px;
  background: rgba(108, 117, 125, 0.1);
  border: none;
  padding: 6px;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.search-clear:hover {
  color: #fff;
  background: #6c757d;
}

/* レスポンシブデザインの追加 */
@media (max-width: 768px) {
  .search-box {
    width: 100%;
    max-width: none;
    margin-bottom: 20px;
  }

  .search-input {
    font-size: 16px; /* iOS zoom prevention */
  }
}
</style>
