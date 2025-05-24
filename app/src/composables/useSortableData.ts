import type { Ref } from 'vue';
import { computed, ref } from 'vue';

export function useSortableData<T extends Record<string, any>>(
  items: Ref<T[]>,
  initialSortColumn: keyof T,
  initialDirection: 'asc' | 'desc' = 'asc'
) {
  const sortColumn = ref<keyof T>(initialSortColumn);
  const sortDirection = ref<'asc' | 'desc'>(initialDirection);

  const sortBy = (column: keyof T) => {
    if (sortColumn.value === column) {
      // 同じカラムをクリックした場合は昇順/降順を切り替え
      sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc';
    } else {
      // 異なるカラムの場合は、そのカラムで昇順ソート
      sortColumn.value = column;
      sortDirection.value = 'asc';
    }
  };
  const sortedItems = computed(() => {
    // items.valueが存在しない場合は空の配列を返す
    if (!items.value) return [];

    const sorted = [...items.value];

    return sorted.sort((a, b) => {
      let valueA = a[sortColumn.value];
      let valueB = b[sortColumn.value];

      // 数値型の場合は数値として比較
      if (typeof valueA === 'number' || typeof valueB === 'number') {
        valueA = Number(valueA);
        valueB = Number(valueB);
        return sortDirection.value === 'asc' ? valueA - valueB : valueB - valueA;
      }

      // 文字列の場合（デフォルト）
      return sortDirection.value === 'asc'
        ? String(valueA).localeCompare(String(valueB), 'ja')
        : String(valueB).localeCompare(String(valueA), 'ja');
    });
  });

  return {
    sortColumn,
    sortDirection,
    sortBy,
    sortedItems,
  };
}
