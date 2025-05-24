<template>
  <th @click="onSort" class="sortable" :style="{ width: width }">
    <slot></slot>
    <span class="sort-icon" v-if="isCurrentSortColumn">
      {{ sortDirection === 'asc' ? '▲' : '▼' }}
    </span>
  </th>
</template>

<script lang="ts">
import { computed, defineComponent } from 'vue';

export default defineComponent({
  name: 'SortableTableHeader',
  props: {
    column: {
      type: String,
      required: true,
    },
    currentSortColumn: {
      type: String,
      required: true,
    },
    sortDirection: {
      type: String,
      required: true,
      validator: (value: string) => ['asc', 'desc'].includes(value),
    },
    width: {
      type: String,
      default: 'auto',
    },
  },
  emits: ['sort'],
  setup(props, { emit }) {
    const isCurrentSortColumn = computed(() => props.column === props.currentSortColumn);

    const onSort = () => {
      emit('sort', props.column);
    };

    return {
      isCurrentSortColumn,
      onSort,
    };
  },
});
</script>

<style scoped>
.sortable {
  cursor: pointer;
  position: relative;
  padding-right: 25px; /* ソートアイコン用の余白 */
}

.sortable:hover {
  background-color: #e9ecef;
}

.sort-icon {
  position: absolute;
  right: 8px;
  font-size: 12px;
}
</style>
