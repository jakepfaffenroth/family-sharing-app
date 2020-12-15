<template>
  <div class="flex">
    <div @click.capture="isMenuVisible = !isMenuVisible">
      <slot name="button"></slot>
    </div>
    <slot></slot>
    <transition name="" mode="out-in">
      <div v-show="isMenuVisible">
        <div class="absolute top-8 left-0">
          <slot name="listItems"></slot>
        </div>
      </div>
    </transition>
  </div>
</template>

<script>
export default {
  data() {
    return {
      isMenuVisible: false
    };
  }
};
</script>
