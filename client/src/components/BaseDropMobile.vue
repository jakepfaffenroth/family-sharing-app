<template>
  <div :class="relativeClass">
    <transition name="fade" mode="out-in">
      <div
        v-show="isMenuVisible"
        data-ok_to_close="true"
        class="sm:hidden fixed inset-0 bg-gray-400 opacity-10"
        @click="closeMenu($event)"
      ></div>
    </transition>
    <div
      data-test="baseDropMobile"
      :class="btnPositionTweak"
      @mouseleave="closeMenu"
    >
      <div
        ref="menuBtn"
        data-test="openBaseDropMobile"
        data-ok_to_close="true"
        :class="{ 'z-50': isMenuVisible }"
        @click="toggleMenu($event)"
      >
        <slot name="button" :isMenuVisible="isMenuVisible"></slot>
      </div>
      <!-- Menu list -->
      <transition name="slide-fade" mode="out-in">
        <div
          v-show="isMenuVisible"
          v-keepInViewport
          data-ok_to_close="true"
          class="absolute top-0 left-0"
          :class="[
            {
              'px-1.5': width === 'full'
            },
            listPositionTweak
          ]"
          @click.self="closeMenu($event)"
        >
          <button
            data-ok_to_close="true"
            class="absolute top-0.5 right-0 opacity-0"
            :class="
              $refs.menuBtn ? $refs.menuBtn.firstElementChild.className : ''
            "
            @click="toggleMenu($event)"
          ></button>
          <div
            id="menu-list-box"
            data-test="baseDropMobileList"
            class="relative mt-10 mb-2 p-2 bg-white rounded border border-teal-600 text-left shadow-xl transition-all z-50"
            :class="passedClasses"
            @click="closeMenu($event)"
          >
            <slot name="listItems" :close-menu="closeMenu"></slot>
          </div>
        </div>
      </transition>
    </div>
  </div>
</template>

<script>
export default {
  name: 'BaseDropMobile',
  props: {
    width: { type: String, default: '' }, // right or left, up or down, or combo
    btnPositionTweak: { type: String, default: '' }, // classes
    listPositionTweak: { type: String, default: '' }, // classes
    passedClasses: { type: String, default: '' } // classes
  },
  data() {
    return {
      menuId: Date.now(),
      isMenuVisible: false,
      preventClose: false,
      relativeClass: ''
    };
  },
  watch: {
    isMenuVisible(opening, closing) {
      if (opening && this.width !== 'Xfull') {
        this.relativeClass = 'relative';
      } else if (closing && this.width !== 'Xfull') {
        setTimeout(() => (this.relativeClass = ''), 200);
        return;
      } else {
        return;
      }
    }
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
    toggleMenu(event) {
      this.isMenuVisible ? this.closeMenu(event) : this.openMenu();
    },
    toggleMenuX(event, target) {
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
          const btn =
            target === 'list' ? this.getBtn(event.target) : event.target;

          // const label = (btn.innerText || '').toLowerCase();
          const btnAction = btn.dataset.btn_action || null;

          const disabledBtn =
            btn.classList.value.includes('select-tool') &&
            !btn.classList.value.includes('enabled');
          console.table({ btn: btn.tagName, btnAction, disabledBtn });

          if (btnAction == 'select' || disabledBtn) {
            console.log('in here?');
            return;
          }
          console.log('should not reach');
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
          const btn = this.getBtn(event.target);
          if (
            btn &&
            (btn.dataset.ok_to_close === 'true' ||
              btn.tagName === 'A' ||
              btn.tagName === 'IMG' ||
              btn.id === '')
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
