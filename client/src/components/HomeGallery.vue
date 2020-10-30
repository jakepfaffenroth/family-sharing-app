<template>
  <div
    id="my-gallery"
    data-test="gallery"
    v-bind="$attrs"
    class="my-gallery flex flex-wrap justify-start py-2 sm:py-4"
    itemscope
    itemtype="http://schema.org/ImageGallery"
  >
    <div v-for="(group, date) in imgGroups" :key="date" class="group-container">
      <div class="flex justify-between">
        <p class="mb-1 text-sm sm:text-base">
          {{ date }}
        </p>
      </div>
      <div class="group-wrapper flex flex-wrap">
        <figure
          v-for="(item, index) in group"
          :id="'image-' + index"
          :key="index"
          itemprop="associatedMedia"
          itemscope
          itemtype="http://schema.org/ImageObject"
          :src="item.src"
          class="image-container h-24 xs:h-28 sm:h-36 md:h-64 z-0"
          @mouseenter="item.isMenuVisible = true"
          @mouseleave="item.isMenuVisible = false"
        >
          <div class="absolute top-1 right-4 z-30">
            <transition name="fade">
              <div
                v-if="userType === 'owner'"
                v-show="item.isMenuVisible"
                :id="'menu-' + index"
                @click.stop
              >
                <base-drop-menu>
                  <template #button>
                    <div class="h-6 mb-1">
                      <button
                        class="w-5 h-4 hover:text-teal-500 focus:shadow-outline"
                      >
                        <svg
                          class="w-8 h-8 p-1 bg-gradient-to-r from-teal-400 to-purple-500 border border-white rounded-full shadow text-white"
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            d="M6 10a2 2 0 11-4 0 2 2 0 014 0zM12 10a2 2 0 11-4 0 2 2 0 014 0zM16 12a2 2 0 100-4 2 2 0 000 4z"
                          />
                        </svg>
                      </button>
                    </div>
                  </template>
                  <template #listItems>
                    <div class="w-24 -m-1">
                      <!-- <a
                      v-if="
                        items.length >= 0 &&
                          userType === 'owner' &&
                          owner.ownerId
                      "
                      class="img-menu-link"
                      @click.stop="shareImage(item)"
                    >
                      Share
                    </a> -->
                      <a
                        v-if="
                          items.length >= 0 &&
                            userType === 'owner' &&
                            owner.ownerId
                        "
                        data-test="imgDeleteBtn"
                        class="block px-2 py-1 text-sm rounded cursor-pointer text-gray-800 hover:bg-teal-400 hover:text-white"
                        @click.stop="openDeleteModal(date, item, index)"
                      >
                        Delete
                      </a>
                    </div>
                  </template>
                </base-drop-menu>
              </div>
            </transition>
          </div>
          <a
            v-lazyload
            :href="item.src"
            itemprop="contentUrl"
            :data-size="'' + item.w + 'x' + item.h"
            :title="item.title"
          >
            <!-- image thumbnails -->
            <img
              :data-url="item.thumbnail"
              :alt="item.alt"
              itemprop="thumbnail"
              class="image h-24 xs:h-28 sm:h-36 md:h-64"
            />
          </a>
        </figure>
      </div>
    </div>
  </div>

  <!-- Image lightbox -->
  <div class="pswp" tabindex="-1" role="dialog" aria-hidden="true">
    <div class="pswp__bg" />
    <div class="pswp__scroll-wrap">
      <div class="pswp__container">
        <div class="pswp__item" />
        <div class="pswp__item" />
        <div class="pswp__item" />
      </div>
      <div class="pswp__ui pswp__ui--hidden">
        <div class="pswp__top-bar">
          <div class="pswp__counter" />
          <button
            class="pswp__button pswp__button--close"
            title="Close (Esc)"
          />

          <span class="rotation-wrapper">
            <i
              v-if="options.rotationOn"
              class="material-icons"
              @click="rotate(-90)"
            >
              rotate_left
            </i>
            <i
              v-if="options.rotationOn"
              class="material-icons"
              @click="rotate(90)"
            >
              rotate_right
            </i>
          </span>

          <button class="pswp__button pswp__button--share" title="Share" />
          <button
            class="pswp__button pswp__button--fs"
            title="Toggle fullscreen"
          />
          <button class="pswp__button pswp__button--zoom" title="Zoom in/out" />
          <div class="pswp__preloader">
            <div class="pswp__preloader__icn">
              <div class="pswp__preloader__cut">
                <div class="pswp__preloader__donut" />
              </div>
            </div>
          </div>
        </div>
        <div
          class="pswp__share-modal pswp__share-modal--hidden pswp__single-tap"
        >
          <div class="pswp__share-tooltip" />
        </div>
        <button
          class="pswp__button pswp__button--arrow--left"
          title="Previous (arrow left)"
          @click="resetAngle"
        />
        <button
          class="pswp__button pswp__button--arrow--right"
          title="Next (arrow right)"
          @click="resetAngle"
        />
        <div class="pswp__caption">
          <div class="pswp__caption__center" />
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import PhotoSwipe from 'photoswipe/dist/photoswipe';
import PhotoSwipeUI_Default from 'photoswipe/dist/photoswipe-ui-default';
import 'photoswipe/dist/photoswipe.css';
import 'photoswipe/dist/default-skin/default-skin.css';
import format from 'date-fns/format';
import BaseDropMenu from './BaseDropMenu';
import LazyLoadDirective from '../utils/LazyLoadDirective';

export default {
  name: 'HomeGallery',
  directives: {
    lazyload: LazyLoadDirective
  },
  components: {
    BaseDropMenu
  },
  props: {
    userType: { type: String, default: '' },
    options: {
      default: () => ({}),
      type: Object
    }
  },
  emits: ['open-modal', 'img-delete-info'],
  data() {
    return {
      pswp: null,
      angle: 0,
      format,
      imageSize: '250px',
      showSingleShareModal: false,
      itemToShare: {}
    };
  },
  computed: {
    owner() {
      return this.$store.state.ownerStore.owner;
    },
    items() {
      return this.$store.getters.images;
    },
    imgGroups() {
      const currentYear = new Date().getFullYear().toString();

      let group = this.items.reduce((r, a) => {
        let captureDate =
          a.exif && a.exif.exif && a.exif.exif.DateTimeOriginal
            ? format(
                new Date(a.exif.exif.DateTimeOriginal.split('T').shift()),
                'E, LLL dd yyyy'
              )
            : null;

        let uploadDate = format(
          new Date(parseInt(a.uploadTime)),
          'E, LLL dd yyyy'
        );

        if (captureDate && captureDate.substr(-4, 4) === currentYear) {
          captureDate = captureDate.slice(0, -5);
        }
        if (uploadDate && uploadDate.substr(-4, 4) === currentYear) {
          uploadDate = uploadDate.slice(0, -5);
        }
        r[captureDate || uploadDate] = [
          ...(r[captureDate || uploadDate] || []),
          a
        ];
        return r;
      }, {});

      return group;
    }
  },
  mounted() {
    const that = this;
    const initPhotoSwipeFromDOM = function(gallerySelector) {
      // parse slide data (url, title, size ...) from DOM elements
      // (children of gallerySelector)
      const thumbElements = [];
      const parseThumbnailElements = function(el) {
        for (let i = 0; i < el.children.length; i++) {
          Array.from(el.children)[i].children.forEach(child => {
            if (child.matches('.group-wrapper')) {
              Array.from(child.children).forEach(img => {
                thumbElements.push(img);
              });
            }
          });
        }

        const numNodes = thumbElements.length;
        const items = [];
        let figureEl;
        let linkEl;
        let size;
        let item;
        for (let i = 0; i < numNodes; i++) {
          figureEl = thumbElements[i]; // <figure> element
          // include only element nodes
          if (figureEl.nodeType !== 1) {
            continue;
          }
          linkEl = figureEl.children[1]; // <a> element
          size = linkEl.getAttribute('data-size').split('x');

          // create slide object
          item = {
            src: linkEl.getAttribute('href'),
            w: parseInt(size[0], 10),
            h: parseInt(size[1], 10),
            title: linkEl.getAttribute('title')
          };
          if (figureEl.children.length > 2) {
            // <figcaption> content
            item.title = figureEl.children[2].innerHTML;
          }

          if (linkEl.children.length > 0) {
            // <img> thumbnail element, retrieving thumbnail url
            item.msrc = linkEl.children[0].getAttribute('src');
          }

          item.el = figureEl; // save link to element for getThumbBoundsFn
          items.push(item);
        }

        return items;
      };

      // find nearest parent element
      const closest = function closest(el, fn) {
        return el && (fn(el) ? el : closest(el.parentNode, fn));
      };

      // triggers when user clicks on thumbnail
      const onThumbnailsClick = function(e) {
        e = e || window.event;
        e.preventDefault ? e.preventDefault() : (e.returnValue = false);

        const eTarget = e.target || e.srcElement;
        // find root element of slide
        const clickedListItem = closest(
          eTarget,
          el => el.tagName && el.tagName.toUpperCase() === 'FIGURE'
        );
        if (!clickedListItem) {
          return;
        }
        // find index of clicked item by looping through all child nodes
        // alternatively, you may define index via data- attribute
        const clickedGallery = document.querySelector('#my-gallery');
        const { childNodes } = clickedListItem.parentNode;
        const numChildNodes = childNodes.length;
        let nodeIndex = 0;
        let index;

        parseThumbnailElements(clickedGallery);

        // for (let i = 0; i < numChildNodes; i++) {
        //   if (childNodes[i].nodeType !== 1) {
        //     continue;
        //   }
        //   if (childNodes[i] === clickedListItem) {
        //     index = nodeIndex;
        //     break;
        //   }
        //   nodeIndex++;
        // }
        index = thumbElements.indexOf(clickedListItem);

        if (index >= 0) {
          // open PhotoSwipe if valid index found
          openPhotoSwipe(index, clickedGallery);
        }
        return false;
      };

      // parse picture index and gallery index from URL (#&pid=1&gid=2)
      const photoswipeParseHash = function() {
        const hash = window.location.hash.substring(1);
        const params = {};

        if (hash.length < 5) {
          return params;
        }

        const vars = hash.split('&');
        for (let i = 0; i < vars.length; i++) {
          if (!vars[i]) {
            continue;
          }
          const pair = vars[i].split('=');
          if (pair.length < 2) {
            continue;
          }
          params[pair[0]] = pair[1];
        }

        if (params.gid) {
          params.gid = parseInt(params.gid, 10);
        }

        return params;
      };

      let openPhotoSwipe = function(
        index,
        galleryElement,
        disableAnimation,
        fromURL
      ) {
        const pswpElement =
          galleryElement.parentElement.querySelector('.pswp') ||
          document.querySelector('.pswp');
        let gallery;
        let options;
        let items;

        items = parseThumbnailElements(galleryElement);

        // define options (if needed)
        options = {
          // define gallery index (for URL)
          galleryUID: galleryElement.getAttribute('data-pswp-uid'),

          getThumbBoundsFn(index) {
            // See Options -> getThumbBoundsFn section of documentation for more info
            const thumbnail = items[index].el.getElementsByTagName('img')[0]; // find thumbnail
            const pageYScroll =
              window.pageYOffset || document.documentElement.scrollTop;
            const rect = thumbnail.getBoundingClientRect();

            return { x: rect.left, y: rect.top + pageYScroll, w: rect.width };
          }
        };

        // PhotoSwipe opened from URL
        if (fromURL) {
          if (options.galleryPIDs) {
            // parse real index when custom PIDs are used
            // http://photoswipe.com/documentation/faq.html#custom-pid-in-url
            for (let j = 0; j < items.length; j++) {
              if (items[j].pid == index) {
                options.index = j;
                break;
              }
            }
          } else {
            // in URL indexes start from 1
            options.index = parseInt(index, 10) - 1;
          }
        } else {
          options.index = parseInt(index, 10);
        }

        // exit if index not found
        if (isNaN(options.index)) {
          return;
        }

        if (disableAnimation) {
          options.showAnimationDuration = 0;
        }
        // Pass data to PhotoSwipe and initialize it
        gallery = new PhotoSwipe(
          pswpElement,
          PhotoSwipeUI_Default,
          items,
          Object.assign(options, that.options)
        );
        gallery.listen('gettingData', (index, item) => {
          if (item.w < 1 || item.h < 1) {
            // unknown size
            const img = new Image();
            img.onload = function() {
              // will get size after load
              item.w = this.width; // set image width
              item.h = this.height; // set image height
              gallery.invalidateCurrItems(); // reinit Items
              gallery.updateSize(true); // reinit Items
            };
            img.src = item.src; // let's download image
          }
        });

        gallery.init();
        that.pswp = gallery;
      };

      // loop through all gallery elements and bind events
      const galleryElements = document.querySelectorAll(gallerySelector);

      for (let i = 0, l = galleryElements.length; i < l; i++) {
        galleryElements[i].setAttribute('data-pswp-uid', i + 1);
        galleryElements[i].onclick = onThumbnailsClick;
      }

      // Parse URL and open gallery if it contains #&pid=3&gid=1
      const hashData = photoswipeParseHash();

      if (hashData.pid && hashData.gid) {
        openPhotoSwipe(
          hashData.pid,
          galleryElements[hashData.gid - 1],
          true,
          true
        );
      }
    };

    initPhotoSwipeFromDOM('.my-gallery');
  },
  methods: {
    openDeleteModal(date, item, index) {
      this.$emit('open-modal', 'HomeModalDeleteImage');
      this.$emit('img-delete-info', {
        date,
        fileId: item.fileId,
        thumbFileId: item.thumbFileId,
        fileName: item.fileName,
        ownerId: this.$store.getters.ownerId,
        thumb: item.thumbnail,
        index
      });
    },
    shareImage(item) {
      this.showSingleShareModal = true;
      this.itemToShare = item;
    },
    resizeImages(sliderValue) {
      this.imageSize = sliderValue;
    },
    rotate(newAngle) {
      this.angle += newAngle;
      document
        .querySelectorAll('.pswp__img')
        .forEach(i => (i.style.transform = `rotate(${this.angle}deg)`));
    },
    resetAngle() {
      this.angle = 0;
      document
        .querySelectorAll('.pswp__img')
        .forEach(i => (i.style.transform = `rotate(${this.angle}deg)`));
    },
    getImgSize() {
      const innerWidth = window.innerWidth;
      const rowCount = (innerWidth / 250 > 6 ? 6 : innerWidth / 250).toFixed();
      const imgWidth = (innerWidth / 4 < 200 ? 200 : innerWidth / 4).toFixed();
      return imgWidth + 'px';
    }
  }
};
</script>

<style scoped>
@import 'https://fonts.googleapis.com/icon?family=Material+Icons';

.img-menu-btn:hover .img-menu-list {
  @apply visible opacity-100;
}

.pswp__top-bar {
  text-align: right;
}
.pswp__caption__center {
  text-align: center;
}
.rotation-wrapper {
  color: white;
  position: relative;
  top: 10px;
}

figure {
  @apply inline;
}

.group-container {
  @apply relative mr-2 mb-6 overflow-hidden;
}
.image-container {
  @apply relative mr-1 mb-1 overflow-hidden;
}

.image {
  flex: auto;
  min-width: 100px;
  object-fit: contain;
  transition: all 0.2s ease-in-out;
}

.image-container:hover .image {
  scale: 1;
  object-fit: cover;
}

.image-container:hover .img-menu-btn {
  color: black;
}
</style>
