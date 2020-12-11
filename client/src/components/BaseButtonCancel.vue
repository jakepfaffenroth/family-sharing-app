<template>
  <button
    class="w-36 px-3 py-1 rounded shadow text-center text-white hover:shadow-lg transition duration-200 ease-in-out"
    :class="{
      'bg-gray-600 hover:bg-gray-500': shade === '',
      'bg-gray-500 hover:bg-gray-450': shade.includes(
        'light'
      )
    }"
  >
    <slot></slot>
  </button>
</template>

<script>
export default {
  props: { shade: { type: String, default: '' } }
};
</script>
