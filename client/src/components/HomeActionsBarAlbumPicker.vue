<template>
  <div>
    <svg
      class="w-5 h-5 absolute top-2 right-2 hover:text-purple-600 transition cursor-pointer"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      @click.capture="closeMenu($event)"
    >
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2"
        d="M6 18L18 6M6 6l12 12"
      />
    </svg>
    <div ref="albumList" class="h-64 mt-4 py-2 flex flex-wrap overflow-y-auto">
      <div
        v-for="(album, index) in albums"
        :id="album.albumName"
        :key="index"
        class="w-1/3 sm:w-32 ml-0 mb-3"
      >
        <photo-stack
          :images-arr="album.images"
          @submit="setActiveGallery(album.albumName), closeMenu($event)"
        ></photo-stack>
        <h4 class="w-full text-center font-thin text-sm whitespace-normal">
          {{ album.albumName }}
        </h4>
      </div>
    </div>
    <svg
      v-if="isOverflowing"
      class="w-6 mx-auto animate-pulse text-gray-800"
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
import PhotoStack from './BasePhotoStack';
import { ref, computed, inject } from 'vue';
import { useStore } from 'vuex';

export default {
  components: { PhotoStack },
  props: { closeMenu: { type: Function, default: () => {} } },
  setup() {
    const store = useStore();
    const albums = computed(() => store.getters.albums);

    const albumList = ref(null);
    const isOverflowing = computed(() => {
      if (!albumList.value) return;
      return albumList.value.offsetHeight < albumList.value.scrollHeight;
    });

    return {
      albumList,
      albums,
      setActiveGallery: inject('setActiveGallery'),
      isOverflowing
    };
  }
};
</script>

<style scoped></style>
