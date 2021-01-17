<template>
  <base-modal @close-modal="closeModal">
    <template #header>
      <h3 data-test="albumPicker">
        Photos
      </h3>
    </template>
    <template #content>
      <h4 class="w-full sm:w-auto mb-1 sm:mb-0 sm:mr-2">
        Choose photos to add to {{ activeGallery }}
      </h4>
      <div v-if="images.length">
        <div
          ref="imagesGrid"
          class="h-96 mt-6 mb-1 flex flex-wrap overflow-y-auto -m-1"
        >
          <div
            v-for="(image, index) in images"
            :key="index"
            class="relative square-3col sm:square-4col"
          >
            <div
              class="absolute top-0 w-full h-full p-1 object-cover  group transition"
            >
              <select-button
                class="mt-1 mr-1 opacity-0 transform -translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition duration-200"
                :item="image"
              />
              <!-- class="absolute top-0 w-full h-full object-cover mx-1 mb-2 cursor-pointer" -->
              <img
                :src="image.thumbnail"
                class="w-full h-full object-cover cursor-pointer"
                @click="toast.success('test')"
              />
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
            stroke-width="1.5"
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </div>
    </template>
    <template #footer>
      <base-button-cancel @click="closeModal">
        Cancel
      </base-button-cancel>
      <base-button-purple
        data-test="confirmAddPhotosBtn"
        @click="submit(activeGallery)"
      >
        Add
      </base-button-purple>
    </template>
  </base-modal>
</template>

<script>
import http from '../utils/http';
import BaseModal from './BaseModal';
import BaseButtonCancel from './BaseButtonCancel';
import BaseButtonPurple from './BaseButtonPurple';
import SelectButton from './HomeGalleryButtonSelect';
import { addToAlbum } from '../utils/editAlbumImages';
import { ref, reactive, computed, inject, onMounted } from 'vue';
import { useStore } from 'vuex';

export default {
  name: 'PhotoPickerModal',
  components: {
    BaseModal,
    BaseButtonCancel,
    BaseButtonPurple,
    SelectButton
  },
  inject: ['toast'],
  props: {
    activeGallery: { type: String, default: '' }
  },
  emits: ['close-modal'],
  setup(props, { emit }) {
    const store = useStore();
    const toast = inject('toast');
    const images = computed(() => store.getters.allImages);
    const selectedImages = computed(() => store.getters.selectedImages);
    const albums = computed(() =>
      store.getters.albums.filter(x => x.albumName !== 'All')
    );
    const ownerId = computed(() => store.getters.ownerId);

    const imagesGrid = ref(null);

    const isOverflowing = computed(() => {
      if (!imagesGrid.value) return;
      return imagesGrid.value.offsetHeight < imagesGrid.value.scrollHeight;
    });

    onMounted(() => store.dispatch('replaceSelectedImages', []));

    async function submit(album) {
      if (typeof album === 'string') {
        album = albums.value.find(x => x.albumName === props.activeGallery);
      }

      await addToAlbum(selectedImages.value, album, ownerId.value, store);
      store.dispatch('replaceSelectedImages', []);

      closeModal();
    }

    function closeModal() {
      emit('close-modal');
    }

    return {
      images,
      imagesGrid,
      closeModal,
      submit,
      addToAlbum,
      isOverflowing
    };
  }
};
</script>

<style scoped vars="{imgDimension}">
.img {
  @apply flex-auto object-cover;
  min-height: var(--imgDimension);
  min-width: var(--imgDimension);
  /* transition: all 0.2s ease-in-out; */
}
</style>
