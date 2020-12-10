<template>
  <div data-test="baseDropMobile" class="">
    <div data-test="openBaseDropMobile" @click.capture="toggleMenu($event)">
      <slot name="button" :isMenuVisible="isMenuVisible"></slot>
    </div>
    <!-- Menu list -->
    <transition name="slide-fade" mode="out-in">
      <div
        v-show="isMenuVisible"
        id="invisible-wrapper"
        class="absolute top-10 z-40"
        :class="{
          '-right-4': position.includes('right'),
          '-left-4': position.includes('left'),
          'w-full px-16 sm:px-0 mx-auto sm:w-auto left-0 sm:-left-4': position.includes('center'),
          ' -mt-2': position.includes('up')
        }"
      >
        <div
          id="menu-list"
          data-test="baseDropMobileList"
          class="mb-2 mx-4 p-2 bg-white rounded border border-teal-600 shadow-xl transition-all"
          :class="passedClasses"
          @click.capture="toggleMenu($event, 'list')"
        >
          <slot name="listItems"></slot>
        </div>
      </div>
    </transition>
  </div>
</template>

<script>
export default {
  name: 'BaseDropMobile',
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
  // mounted() {
  //   document.addEventListener('click', event => {
  //     console.log(event.target);
  //   });
  // },
  methods: {
    toggleMenu(event, target) {
      // Don't close menu by clicking non-link parts of drop down
      if (target === 'list' && event.target.tagName === 'DIV') {
        return;
      }
      // Help prevent accidentally closing menu immediately after opening
      switch (event.type) {
        case 'mouseleave':
          if (this.preventClose) {
            return;
          } else this.isMenuVisible = !this.isMenuVisible; // close menu;
          break;
        case 'click':
          this.isMenuVisible = !this.isMenuVisible; // close menu
          break;
        default:
          return;
          break;
      }
    },
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

<style scoped></style>
