<template>
  <div
    class="group rounded bg-gradient-to-r from-teal-400 to-orange-400 via-purple-400 p-0.5"
    @click.capture="btnAction"
  >
    <button
      class="w-32 px-3 py-1 rounded-sm transition-all duration-300 text-white group-hover:bg-white"
      :class="customStyle"
    >
      <span
        class="bg-clip-text Xgroup-hover:bg-clip-border group-hover:text-transparent bg-gradient-to-r hover:from-teal-400 to-orange-400 hover:via-purple-400 group-hover:font-bold tracking-wide transition font-semibold"
      >
        Get Premium
      </span>
    </button>
  </div>
</template>

<script>
export default {
  props: {
    btnAction: { type: Function, default: () => {} },
    customStyle: { type: String, default: '' }
  }
};
</script>
