<template>
  <div :class="menuHeight">
    <div ref="albumList" class="h-56 mt-4 flex flex-wrap overflow-y-auto">
      <div
        v-for="(album, index) in albums"
        :key="index"
        class="flex w-1/2 mb-2 p-1 rounded transition cursor-pointer hover:bg-gray-700 hover:shadow"
        @click="setActiveGallery(album.albumName)"
      >
        <img
          class="w-24 h-24 object-cover bg-gray-300 rounded"
          :src="
            album.images && album.images[0] ? album.images[0].thumbnail : ''
          "
        />
        <div class="ml-4">
          <h4 class="font-thin">
            {{ album.albumName }}
          </h4>
        </div>
      </div>
    </div>
    <svg
      v-if="isOverflowing"
      class="w-6 mx-auto animate-pulse"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="1"
        d="M19 9l-7 7-7-7"
      />
    </svg>
  </div>
</template>

<script>
import { ref, computed, inject } from 'vue';
import { useStore } from 'vuex';

export default {
  setup() {
    const store = useStore();
    const albums = computed(() => store.getters.albums);

    const albumList = ref(null);
    const isOverflowing = computed(() => {
      if (!albumList.value) return;
      return albumList.value.offsetHeight < albumList.value.scrollHeight;
    });

    const menuHeightNum = computed(() => {});

    return {
      albums,
      setActiveGallery: inject('setActiveGallery'),
      isOverflowing,
      menuHeight: 'w-64' + menuHeightNum.value
    };
  }
};
</script>

<style scoped></style>
