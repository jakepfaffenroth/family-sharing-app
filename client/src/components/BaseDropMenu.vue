<template>
  <div
    data-test="baseDropMenu"
    :class="{ relative: isMenuVisible }"
    @mouseleave="closeMenu"
  >
    <div
      data-test="openBaseDropMenu"
      class="flex justify-end"
      @click="openMenu"
      @touchstart.self="closeMenu"
    >
      <slot name="button" :is-menu-visible="isMenuVisible"></slot>
    </div>
    <!-- Menu list -->
    <transition name="slide-fade" mode="out-in">
      <div
        v-show="isMenuVisible"
        v-keepInViewport
        data-ok_to_close="true"
        class="absolute top-0 right-0"
        :class="{
          'left-0 right-auto': position.includes('left'),
          '-mt-2': position.includes('up')
        }"
        @click.self="closeMenu($event)"
      >
        <div
          id="menu-list-box"
          data-test="baseDropMenuList"
          class="relative mt-10 mb-2 p-2 bg-white rounded border border-teal-600 shadow-xl transition-all"
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
    position: { type: String, default: '' },
    passedClasses: { type: String, default: '' }
  },
  data() {
    return {
      isMenuVisible: false,
      preventClose: false,
    };
  },
  methods: {
    getBtn(target) {
      try {
        if (
          !target.dataset.ok_to_close ||
          !target.dataset.ok_to_close === 'true'
        ) {
          target = this.getBtn(target.parentElement);
        }
        return target;
      } catch (err) {
        return target;
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
          const btn = this.getBtn(event.target);
          if (
            btn &&
            (btn.dataset.ok_to_close === 'true' ||
              btn.tagName === 'A' ||
              btn.tagName === 'IMG')
          ) {
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
