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
        class="absolute -right-4 z-40"
      >
        <div
          id="menu-list"
          data-test="baseDropMenuList"
          class="grid my-2 mx-4 p-2 bg-white rounded border border-teal-600 shadow-xl transition-all duration-150 ease-in-out"
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
