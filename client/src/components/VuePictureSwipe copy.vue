/* eslint-disable */

<template>
  <div
    class="my-gallery flex flex-wrap justify-center py-2 sm:p-4"
    itemscope
    itemtype="http://schema.org/ImageGallery"
  >
    <figure
      v-for="(item, index) in items"
      :key="index"
      itemprop="associatedMedia"
      itemscope
      itemtype="http://schema.org/ImageObject"
      :src="item.src"
      class="image-container"
      :style="{ height: getImgSize }"
    >
      <!-- class="image-container h-24 xs:h-28 sm:h-36 md:h-64" -->
      <a
        :href="item.src"
        itemprop="contentUrl"
        :data-size="'' + item.w + 'x' + item.h"
        :title="item.title"
      >
        <!-- image thumbnails -->
        <img
          :src="item.thumbnail"
          :alt="item.alt"
          itemprop="thumbnail"
          class="image"
          :style="{ height: getImgSize }"
        />
      </a>
      <!-- class="image h-28 sm:h-36 md:h-64" -->
      <input
        v-if="items.length >= 0 && userType === 'owner' && owner.ownerId"
        type="button"
        class="delete-btn image-info"
        value="Delete"
        @click.stop="
          $emit(
            'delete-image',
            item.fileId,
            item.smallFileId,
            item.fileName,
            owner.ownerId,
            index
          )
        "
      />
      <p
        v-if="item.exif && item.exif.exif && item.exif.exif.DateTimeOriginal"
        class="image-timestamp image-info"
      >
        {{
          item.exif.exif.DateTimeOriginal
            ? format(new Date(item.exif.exif.DateTimeOriginal), 'MM/dd/yyyy')
            : null
        }}
      </p>
    </figure>
  </div>

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

export default {
  props: {
    owner: {
      type: Object,
      default() {
        return {};
      }
    },
    userType: { type: String, default: '' },
    items: {
      default() {
        return [];
      },
      type: Array
    },
    options: {
      default: () => ({}),
      type: Object
    }
  },
  emits: ['delete-image'],
  data() {
    return {
      pswp: null,
      angle: 0,
      format
      // imageSize: '250px'
    };
  },
  mounted() {
    this.getImgSize();
    const that = this;
    const initPhotoSwipeFromDOM = function(gallerySelector) {
      // parse slide data (url, title, size ...) from DOM elements
      // (children of gallerySelector)
      const parseThumbnailElements = function(el) {
        const thumbElements = el.childNodes;
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

          linkEl = figureEl.children[0]; // <a> element

          size = linkEl.getAttribute('data-size').split('x');

          // create slide object
          item = {
            src: linkEl.getAttribute('href'),
            w: parseInt(size[0], 10),
            h: parseInt(size[1], 10),
            title: linkEl.getAttribute('title')
          };

          if (figureEl.children.length > 1) {
            // <figcaption> content
            item.title = figureEl.children[1].innerHTML;
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
        const clickedGallery = clickedListItem.parentNode;
        const { childNodes } = clickedListItem.parentNode;
        const numChildNodes = childNodes.length;
        let nodeIndex = 0;
        let index;

        for (let i = 0; i < numChildNodes; i++) {
          if (childNodes[i].nodeType !== 1) {
            continue;
          }

          if (childNodes[i] === clickedListItem) {
            index = nodeIndex;
            break;
          }
          nodeIndex++;
        }

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
        const pswpElement = galleryElement.parentElement.querySelector('.pswp');
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
    getImgSize() {
      const innerWidth = window.innerWidth;
      console.log('innerWidth:', innerWidth);
      // const rowCount = (innerWidth / 250 > 6 ? 6 : innerWidth / 250).toFixed();
      // console.log('rowCount:', rowCount);
      const imgWidth = (innerWidth / 6 < 200 ? 200 : innerWidth / 6).toFixed();
      console.log('imgWidth:', imgWidth);
      return imgWidth;
    },

    resizeImages(sliderValue) {
      console.log('sliderValue: ', sliderValue);
      this.imageSize = sliderValue;
    },
    rotate(newAngle) {
      this.angle += newAngle;
      this.$el
        .querySelectorAll('.pswp__img')
        .forEach(i => (i.style.transform = `rotate(${this.angle}deg)`));
    },
    resetAngle() {
      this.angle = 0;
      this.$el
        .querySelectorAll('.pswp__img')
        .forEach(i => (i.style.transform = `rotate(${this.angle}deg)`));
    }
  }
};
</script>
<style scoped>
@import 'https://fonts.googleapis.com/icon?family=Material+Icons';
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
  display: inline;
  margin: 5px;
}

/* .my-gallery {
  @apply flex flex-wrap justify-center p-6;
} */

.image-container {
  position: relative;
  margin: 0.25rem;
  overflow: hidden;
}

.image {
  flex: auto;
  min-width: 100px;
  object-fit: contain;
  transition: all 0.2s ease-in-out;
}

.image-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
}

.image-container:hover .image {
  scale: 1.05;
  object-fit: cover;
}

.image-container:hover .image-info {
  opacity: 1;
}

.image-info {
  position: absolute;
  opacity: 0;
  z-index: 1000;
  transition: opacity 0.1s ease-in-out;
}

.delete-btn {
  top: 10px;
  right: 10px;
}
.delete-btn:hover {
  background-color: aquamarine;
  border-radius: 3px;
  cursor: pointer;
  transition: background-color 0.2s ease-in-out;
}

.image-timestamp {
  bottom: 0;
  margin: 0 auto;
  color: white;
}
</style>
