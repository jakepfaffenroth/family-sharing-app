<template>
  <button :class="btn.style" :disabled="btn.isCurrent" @click="select">
    {{ btn.text }}
  </button>
</template>

<script>
import { reactive, inject, computed, onUpdated, watch } from 'vue';

export default {
  // inject: ['planDetails'],
  props: {
    currentPlan: { type: String, default: '' },
    btnValue: { type: String, default: '' },
    resetBtnsExcept: { type: String, default: '' }
  },
  emits: ['reset-other-btns', 'show-confirmation'],
  setup(props, context) {
    const { btnValue, currentPlan } = reactive(props);

    const baseStyle = 'w-36 mt-4 px-3 py-1 text-center';
    const unselectedStyle =
      ' bg-teal-600 rounded shadow hover:bg-teal-500 hover:shadow-lg transition duration-200 ease-in-out';
    const currentPlanStyle =
      ' italic cursor-default shadow-none transition-none text-purple-400 font-semibold';

    const btn = reactive({
      style: baseStyle + unselectedStyle,
      selected: false,
      current: false,
      text: '',
      set isCurrent(currentPlan) {
        if (currentPlan) {
          this.current = true;
          this.style = baseStyle + currentPlanStyle;
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
      btn.style = btn.style.replaceAll('teal', 'purple');
      btn.selected = true;
      btn.isCurrent = false;
      context.emit('reset-other-btns', props.btnValue);
      context.emit('show-confirmation', props.btnValue);
    }

    function toggleSelected() {
      if (!btn.current) {
        btn.style = btn.style.replaceAll('purple', 'teal');
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
.btn {
  @apply w-36 mt-4 px-3 py-1 bg-teal-600 text-center rounded shadow hover:bg-teal-500 hover:shadow-lg transition duration-200 ease-in-out;
}
</style>
