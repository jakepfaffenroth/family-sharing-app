<template>
  <base-button-teal
    class="mt-4"
    :class="btn.style"
    :disabled="btn.isCurrent"
    @click="select"
  >
    {{ btn.text }}
  </base-button-teal>
</template>

<script>
import BaseButtonTeal from './BaseButtonTeal';
import { reactive, computed, watch } from 'vue';

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
    const { btnValue, currentPlan } = reactive(props);

    const selectedStyle = 'selected';
    const currentPlanStyle = 'current';

    const btn = reactive({
      style: null,
      selected: false,
      current: false,
      text: '',
      set isCurrent(currentPlan) {
        if (currentPlan) {
          this.current = true;
          this.style = currentPlanStyle;
          this.text = 'Current Plan';
        } else {
          this.text = this.selected ? 'Selected' : 'Select';
        }
      }
    });

    btn.isCurrent = computed(() =>
      btnValue == currentPlan ? true : false
    ).value;

    watch(
      () => props.resetBtnsExcept,
      (resetBtnsExcept, prev) => {
        if (resetBtnsExcept !== props.btnValue) toggleSelected();
      }
    );

    function select() {
      btn.style = selectedStyle;
      btn.selected = true;
      btn.isCurrent = false;
      emit('reset-other-btns', props.btnValue);
      emit('show-confirmation', props.btnValue);
    }

    function toggleSelected() {
      if (!btn.current) {
        btn.style = null;
        btn.selected = !btn.selected;
      }
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
