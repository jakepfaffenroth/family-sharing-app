<template>
  <base-button-teal
    class="h-8 md:mt-4"
    :class="btn.style"
    :disabled="btn.isCurrent"
    @click="select"
  >
    {{ btn.text }}
  </base-button-teal>
</template>

<script>
import BaseButtonTeal from './BaseButtonTeal';
import { ref, reactive, computed, watch } from 'vue';

export default {
  name: 'PlanPickerBtn',
  components: { BaseButtonTeal },
  props: {
    currentPlan: { type: String, default: '' },
    btnValue: { type: String, default: '' },
    resetBtnsExcept: { type: String, default: null }
  },
  emits: ['reset-other-btns', 'show-confirmation'],
  setup(props, { emit }) {
    const selected = computed(() => props.resetBtnsExcept === props.btnValue);

    const btn = computed(() => {
      // Default settings for unselected, not current
      let isCurrent = false;
      let style = null;
      let text = 'Select';

      if (props.currentPlan === props.btnValue) {
        // current plan
        isCurrent = true;
        style = 'current';
        text = 'Current Plan';
      } else if (selected.value) {
        // Selected (and by definition not current plan)
        style = 'selected';
        text = 'Selected';
      }

      return { style, isCurrent, text };
    });

    function select() {
      // selected.value = true;
      emit('reset-other-btns', props.btnValue);
      emit('show-confirmation', props.btnValue);
    }

    return {
      btn,
      select
    };
  }
};
</script>

<style scoped>
.current {
  @apply italic cursor-default bg-transparent hover:bg-transparent shadow-none transition-none text-purple-400 font-semibold;
}

.selected {
  @apply bg-purple-600 hover:bg-purple-500;
}
</style>
