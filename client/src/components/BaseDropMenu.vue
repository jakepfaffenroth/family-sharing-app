<template>
  <div data-test="baseDropMenu" class="relative" @mouseleave="closeMenu">
    <div
      data-test="openBaseDropMenu"
      @click="openMenu"
      @touchstart.self="closeMenu"
    >
      <slot name="button" :is-menu-visible="isMenuVisible"></slot>
    </div>
    <!-- Menu list -->
    <transition name="slide-fade" mode="out-in">
      <div
        v-show="isMenuVisible"
        id="invisible-wrapper"
        class="absolute top-0 z-40"
        :class="{
          '-right-4': position.includes('right'),
          '-left-4': position.includes('left'),
          '-mt-2': position.includes('up')
        }"
      >
        <div
          id="menu-list"
          data-test="baseDropMenuList"
          class=" mt-10 mb-2 mx-4 p-2 bg-white rounded border border-teal-600 shadow-xl transition-all"
          :class="passedClasses"
          @click="closeMenu($event)"
        >
          <slot name="listItems" :close-menu="closeMenu"></slot>
        </div>
      </div>
    </transition>
  </div>
</template>

<script>
export default {
  name: 'BaseDropMenu',
  props: {
    position: { type: String, default: 'right' },
    passedClasses: { type: String, default: '' }
  },
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
      switch (event.type) {
        case 'mouseleave':
          if (this.preventClose) {
            return;
          } else this.isMenuVisible = false; // close menu;
          break;
        case 'click':
          if (event.target.tagName === 'A' || event.target.tagName === 'IMG') {
            this.isMenuVisible = false; // close menu
          }
          break;
        default:
          return;
          break;
      }
    }
  }
};
</script>
