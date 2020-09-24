<template>
  <h1
    class="text-4xl tracking-tight leading-10 font-extrabold text-gray-900 sm:text-5xl sm:leading-none md:text-6xl"
  >
    <span
      class="bg-clip-text text-transparent bg-gradient-to-r from-teal-400 to-orange-400 via-purple-400"
    >
      {{ content }}
    </span>
  </h1>
</template>

<script>
export default {
  props: {
    content: { type: String, default: 'carousel' }
  }
};
</script>
