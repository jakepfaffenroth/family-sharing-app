<template>
  <div
    id="wrapper"
    ref="stack"
    class="photo-stack relative m-auto w-20 sm:w-24 h-12 sm:h-20 cursor-pointer sm:cursor-default"
    :class="{ 'cursor-pointer': clickEnabled }"
    @click="
      clickEnabled ? $emit('submit') : null,
        $refs.stack.classList.toggle('expand')
    "
  >
    <div class="absolute w-full h-full px-2 pb-2">
      <div
        v-if="imagesArr.length === 0"
        class="w-full h-full mx-auto border border-gray-500 transition transform rotate-0 hover:scale-105"
      />
    </div>
    <img
      v-for="(image, imgIndex) in imagesArr
        .filter((x, index) => index < 5)
        .sort((a, b) => (a.h / a.w > b.h / b.w ? 1 : -1))"
      :key="imgIndex"
      class="absolute top-0 max-h-9/10 border border-white shadow-sm transition"
      :class="{
        'left-1/2 transform -translate-x-1/2': image.h > image.w,
        'left-0': image.h < image.w,
        'top-2': image.h / image.w < 0.6,
        'transform scale-75 sm:scale-0': size === 'large'
      }"
      :src="image.thumbnail"
    />
  </div>
</template>

<script>
export default {
  props: {
    imagesArr: { type: Array, default: () => [] },
    size: { type: String, default: 'small' },
    clickEnabled: { type: Boolean, default: true }
  },
  emits: ['submit'],
  data() {
    return {
      windowWidth: 0,
      scale: this.size === 'big' ? 1.5 : 1,
      multiplier: this.size === 'big' ? 3 : 1,
      big: this.size === 'big' ? 1 : 0,
      twoImgs: this.imagesArr.length === 2 ? 1 : 0
    };
  },
  created() {
    this.windowWidth = window.innerWidth;
    window.addEventListener('resize', this.getWindowSize);
  },
  getWindowSize() {
    this.windowWidth = window.innerWidth;
  }
};
</script>

<style vars="{ scale, multiplier, twoImgs, big}">
/* .photo-stack img {
  @apply transform scale-75 sm:scale-0;
} */

.photo-stack img:nth-child(1) {
  @apply z-30;
}
.photo-stack img:nth-child(2) {
  @apply transform scale-75 sm:scale-0;
  transform: translate3d(5%, 0, 0) rotate3d(0, 0, 1, 3deg);
}
.photo-stack img:nth-child(3) {
  @apply transform scale-75 sm:scale-0;
  transform: translate3d(-5%, 0, 0) rotate3d(0, 0, 1, -3deg);
}
.photo-stack img:nth-child(4) {
  transform: translate3d(5%, 0, 0) rotate3d(0, 0, 1, -3deg);
  @apply transform scale-75 sm:scale-0;
}
.photo-stack img:nth-child(5) {
  transform: translate3d(-1%, 0, 0) rotate3d(0, 0, 1, 2deg);
  @apply transform scale-75 sm:scale-0;
}
/* .photo-stack img:nth-child(1) {
  z-index: 999;
}
.photo-stack img:nth-child(2) {
  transform: translate3d(calc(5% * var(--multiplier) * var(--multiplier)), 0, 0)
    rotate3d(0, 0, 1, calc(3deg * var(--scale)));
}
.photo-stack img:nth-child(3) {
  transform: translate3d(calc(-5% * var(--scale) * var(--multiplier)), 0, 0)
    rotate3d(0, 0, 1, -3deg);
}
.photo-stack img:nth-child(4) {
  transform: translate3d(calc(5% * var(--multiplier)), 0, 0)
    rotate3d(0, 0, 1, calc(-3deg * var(--multiplier)));
}
.photo-stack img:nth-child(5) {
  transform: translate3d(
      calc(-1% * var(--scale) * var(--multiplier) * var(--multiplier)),
      0,
      0
    )
    rotate3d(0, 0, 1, calc(2deg * var(--scale) * var(--multiplier)));
} */

/* #wrapper.expand img:nth-child(1) {
  @apply opacity-50;
} */

.photo-stack:hover img:nth-child(1),
#wrapper.expand img:nth-child(1) {
  @apply transform scale-105;
  /* left: calc(50% + calc(-50% * var(--big) * var(--twoImgs)));
  transform: translate3d(
      calc((-50% + calc(-20% * var(--big)))),
      0,
      0
    )
    rotate3d(
      0,
      0,
      calc(1 * var(--big) * var(--twoImgs)),
      calc(
        -3deg * var(--big) * var(--twoImgs) * var(--scale) * var(--scale)
      )
    ); */
}
.photo-stack:hover img:nth-child(2),
#wrapper.expand img:nth-child(2) {
  transform: translate3d(calc(10% * var(--scale) * var(--multiplier)), 5%, 0)
    rotate3d(0, 0, 1, calc(3deg * var(--scale)));
}
.photo-stack:hover img:nth-child(3),
#wrapper.expand img:nth-child(3) {
  transform: translate3d(
      calc(-10% * var(--scale) * var(--multiplier)),
      calc(1% * var(--multiplier) * var(--multiplier) * var(--scale)),
      0
    )
    rotate3d(0, 0, 1, calc(-3deg * var(--scale) * var(--scale)));
}
.photo-stack:hover img:nth-child(4),
#wrapper.expand img:nth-child(4) {
  transform: translate3d(
      calc(
        2% * var(--multiplier) * var(--multiplier) * var(--multiplier) * 1 /
          var(--scale)
      ),
      calc(-5% * var(--multiplier)),
      0
    )
    rotate3d(0, 0, 1, calc(2deg * var(--scale)));
}
.photo-stack:hover img:nth-child(5),
#wrapper.expand img:nth-child(5) {
  transform: translate3d(
      calc(-5% * var(--scale) * var(--multiplier)),
      calc(-2% * var(--multiplier) * var(--multiplier)),
      0
    )
    rotate3d(0, 0, 1, calc(2deg * var(--scale)));
}
</style>
