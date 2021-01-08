<template>
  <div>
    <div
      class="w-full h-full bg-gray-300 animate-pulse"
      :class="shape === 'circle' ? 'rounded-full' : 'rounded-sm'"
    ></div>
  </div>
</template>

<script>
export default {
  props: { shape: { type: String, default: 'rectangle' } }
};
</script>
