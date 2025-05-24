<template>
  <div class="search-box">
    <input
      type="text"
      v-model="modelValue"
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
</style>
