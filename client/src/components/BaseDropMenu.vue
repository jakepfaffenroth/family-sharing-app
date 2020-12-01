<template>
  <div data-test="baseDropMenu" class="relative" @mouseleave="closeMenu">
    <div data-test="openBaseDropMenu" @click="openMenu">
      <slot name="button"></slot>
    </div>
    <!-- Menu list -->
    <transition name="slide-fade" mode="out-in">
      <div
        v-show="isMenuVisible"
        id="invisible-wrapper"
        class="absolute top-0 z-40"
        :class="{
          '-right-4': position === 'right',
          '-left-4': position === 'left'
        }"
      >
        <div
          id="menu-list"
          data-test="baseDropMenuList"
          class=" mt-10 mb-2 mx-4 p-2 bg-white rounded border border-teal-600 shadow-xl transition-all"
          @click="closeMenu($event)"
        >
          <slot name="listItems"></slot>
        </div>
      </div>
    </transition>
  </div>
</template>

<script>
export default {
  name: 'BaseDropMenu',
  props: { position: { type: String, default: 'right' } },
  data() {
    return {
      isMenuVisible: false,
      preventClose: false
    };
  },
  methods: {
    openMenu() {
      this.preventClose = true;
      setTimeout(() => {
        this.preventClose = false;
      }, 500);
      this.isMenuVisible = true;
    },
    closeMenu(event) {
      // Help prevent accidentally closing menu immediately after opening
      if (event.type === 'mouseleave' && this.preventClose) {
        return;
      }
      //Only close the menu on mouseleave or if a link is clicked
      event.type === 'click' && event.target.tagName != 'A'
        ? null // don't close menu
        : (this.isMenuVisible = false); // close menu
    }
  }
};
</script>
