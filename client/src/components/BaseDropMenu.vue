<template>
  <div class="relative" @mouseleave="closeMenu">
    <!-- Menu toggle button -->
    <button class="btn" :class="btnStyle" @click="openMenu">
      <slot name="btnLabel"></slot>
    </button>

    <!-- <div style="/*! display: none; */" class="absolute -right-4 z-40 w-56">
      <div
        class="grid my-2 mx-4 p-1 bg-white rounded border border-teal-300 transition-all duration-150 ease-in-out shadow-xl"
      >
        <div class="p-1">
          <a class="main-menu-link">Share</a>
          <a class="main-menu-link">Download all photos</a>
          <a href="/account" class="main-menu-link">Account</a>
          <a class="main-menu-link">Log out</a>
          <a class="main-menu-link">Nuke</a>
          <a class="main-menu-link">Toast</a>
          <hr class="mt-1" />
          <div class="mt-3 mb-1 text-center text-sm text-teal-500">
            <p>You've used</p>
            <p>1.37 MB of 2 GB</p>
            <div
              class="relative flex h-2 w-5/6 my-2 mx-auto rounded-sm overflow-hidden"
            >
              <div
                class="left-0 h-full border rounded-l-sm bg-green-400 border-green-400"
                style="width: 2%;"
              ></div>
              <div
                class="flex-grow border-t border-b border-r border-gray-400 rounded-r-sm"
              ></div>
            </div>
          </div>
          <a class="main-menu-link text-purple-500 font-semibold text-center">
            Get more storage
          </a>
        </div>
      </div>
    </div> -->

    <!-- Menu list -->
    <transition name="slide-fade" mode="out-in">
      <div
        v-show="isMenuVisible"
        id="invisible-wrapper"
        class="absolute -right-4 z-40 w-56"
        :class="menuStyle"
      >
        <div
          id="menu-list"
          class="grid my-2 mx-4  p-1 bg-white rounded border border-teal-300 shadow-xl transition-all duration-150 ease-in-out"
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
      isMenuVisible: false,
      preventClose: false
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
