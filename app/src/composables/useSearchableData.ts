import type { Ref } from 'vue';
import { computed, ref } from 'vue';

export function useSearchableData<T>(items: Ref<T[]>, searchField: keyof T) {
  const searchQuery = ref('');

  const filteredItems = computed(() => {
    // items.valueが存在しない場合は空の配列を返す
    if (!items.value || !searchQuery.value) {
      return items.value || [];
    }

    const query = searchQuery.value.toLowerCase();
    return items.value.filter((item) => String(item[searchField]).toLowerCase().includes(query));
  });

  const clearSearch = () => {
    searchQuery.value = '';
  };

  return {
    searchQuery,
    filteredItems,
    clearSearch,
  };
}
