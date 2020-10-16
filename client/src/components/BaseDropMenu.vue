<template>
  <div class="relative" @mouseleave="closeMenu">
    <!-- Menu toggle button -->
    <button class="btn" :class="btnStyle" @click="openMenu">
      <slot name="btnLabel">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="m-auto mt-1 h-5 w-5 text-white"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </slot>
    </button>

    <!-- Menu list -->
    <transition name="slide-fade">
      <div
        v-show="isMenuVisible"
        class="absolute right-0 overflow-hidden shadow-xl z-40"
        :class="menuStyle"
      >
        <div
          class="grid mt-2 p-1 bg-white rounded border border-teal-300 transition-all duration-150 ease-in-out"
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
  props: {
    menuType: { type: String, default: 'mainMenu' }
  },
  data() {
    return {
      btnStyle: 'main-menu-btn',
      menuStyle: 'main-menu-list',
      linkStyle: 'main-menu-link',
      isMenuVisible: false
    };
  },
  beforeMount() {
    if (this.menuType === 'imgMenu') {
      this.btnStyle = 'img-menu-btn';
      this.menuStyle = 'img-menu-list';
      this.linkStyle = 'img-menu-link';
    }

    if (this.menuType === 'sortMenu') {
      this.btnStyle = 'sort-menu-btn';
      this.menuStyle = 'sort-menu-list';
      this.linkStyle = 'sort-menu-link';
    }
  },
  methods: {
    openMenu() {
      this.isMenuVisible = true;
    },
    closeMenu(event) {
      //Only close the menu on mouseleave or if a link is clicked
      event.type === 'click' && event.target.tagName != 'A'
        ? null // don't close menu
        : (this.isMenuVisible = false); // close menu
    }
  }
};
</script>

<style>
.btn {
  @apply relative block border border-transparent transition-all duration-150 focus:outline-none;
}

.main-menu-btn {
  @apply w-8 h-8 bg-teal-600 rounded-r-lg  hover:bg-teal-500;
}

.main-menu-list {
  @apply w-48;
}

.main-menu-link {
  @apply block px-4 py-2 text-sm rounded cursor-pointer text-gray-800 hover:bg-purple-500 hover:text-white;
}

.img-menu-btn {
  @apply w-5 h-5 hover:text-teal-500 focus:shadow-outline;
}

.img-menu-list {
  @apply w-32;
}
.img-menu-link {
  @apply block px-2 py-1 text-sm rounded cursor-pointer text-gray-800 hover:bg-teal-400 hover:text-white;
}

.sort-menu-btn {
  @apply w-12 rounded hover:text-teal-500 focus:outline-none;
}

.sort-menu-list {
  @apply w-32;
}
.sort-menu-link {
  @apply block px-2 py-1 text-sm rounded cursor-pointer text-gray-800 hover:bg-teal-400 hover:text-white;
}

.slide-fade-enter-active {
  @apply transition-all duration-200 ease-out;
}

.slide-fade-leave-active {
  @apply transition-all duration-150 ease-in;
}

.slide-fade-enter-from,
.slide-fade-leave-to {
  @apply transform -translate-y-2 invisible opacity-0;
}
</style>
