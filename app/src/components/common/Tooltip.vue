<template>
  <div class="tooltip-container">
    <span class="tooltip-icon">{{ icon }}</span>
    <span class="tooltip-text">{{ text }}</span>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'Tooltip',
  props: {
    text: {
      type: String,
      required: true,
    },
    icon: {
      type: String,
      default: 'i',
    },
  },
});
</script>

<style scoped>
.tooltip-container {
  position: relative;
  display: inline-block;
  margin-left: 5px;
}

.tooltip-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background-color: #6c757d;
  color: white;
  font-size: 12px;
  font-weight: bold;
  cursor: help;
}

.tooltip-text {
  visibility: hidden;
  width: 200px;
  background-color: #333;
  color: white;
  text-align: center;
  padding: 8px 12px;
  border-radius: 4px;
  position: absolute;
  z-index: 10;
  top: -10px;
  left: 25px;
  opacity: 0;
  transition: opacity 0.3s;
  font-weight: normal;
  font-style: normal;
  font-size: 12px;
  line-height: 1.4;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
  white-space: normal;
}

.tooltip-text::after {
  content: '';
  position: absolute;
  top: 15px;
  right: 100%;
  margin-top: -5px;
  border-width: 5px;
  border-style: solid;
  border-color: transparent #333 transparent transparent;
}

.tooltip-container:hover .tooltip-text {
  visibility: visible;
  opacity: 1;
}
</style>
