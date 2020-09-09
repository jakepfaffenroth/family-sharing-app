<template>
  <div>
    <button @click="$emit('sort-images', 'uploadTime')">
      Sort by date uploaded
    </button>
    <button @click="$emit('sort-images', 'captureTime')">
      Sort by capture time
    </button>
    <button @click="$emit('sort-images', 'reverse')">
      Reverse image order
    </button>
  </div>
</template>

<script>
export default {
  emits: ['sort-images'],
};
</script>

<style></style>
