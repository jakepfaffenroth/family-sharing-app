<template>
  <div
    class="photo-stack relative m-auto w-24 h-20 cursor-pointer"
    @click="$emit('submit')"
  >
    <img
      v-if="imagesArr.length === 0"
      class="absolute top-0 left-0 w-24 h-16 border border-white shadow-sm transition transform rotate-0"
    />
    <img
      v-for="(image, imgIndex) in imagesArr
        .filter((x, index) => index < 5)
        .sort((a, b) => (a.h / a.w > b.h / b.w ? -1 : 1))"
      :key="imgIndex"
      class="absolute top-0 max-h-9/10 border border-white shadow-sm transition"
      :class="{
        'left-1/2 transform -translate-x-1/2': image.h > image.w,
        'left-0': image.h < image.w,
        'top-2': image.h / image.w < 0.6
      }"
      :src="image.thumbnail"
    />
  </div>
</template>

<script>
export default {
  props: {
    imagesArr: { type: Array, default: () => [] },
    stackParent: { type: String, default: 'addToAlbum' }
  },
  emits: ['submit'],
  data() {
    return {
      scale: this.stackParent === 'removeFromAlbum' ? 1.5 : 1,
      multiplier: this.stackParent === 'removeFromAlbum' ? 3 : 1,
      removeFromAlbum: this.stackParent === 'removeFromAlbum' ? 1 : 0,
      twoImgs: this.imagesArr.length === 2 ? 1 : 0
    };
  }
};
</script>

<style vars="{ scale, multiplier, twoImgs, removeFromAlbum}">
.photo-stack img:nth-child(1) {
  z-index: 999;
}
.photo-stack img:nth-child(2) {
  transform: translate3d(5%, 0, 0) rotate3d(0, 0, 1, 3deg);
}
.photo-stack img:nth-child(3) {
  transform: translate3d(-5%, 0, 0) rotate3d(0, 0, 1, -3deg);
}
.photo-stack img:nth-child(4) {
  transform: translate3d(5%, 0, 0) rotate3d(0, 0, 1, -3deg);
}
.photo-stack img:nth-child(5) {
  transform: translate3d(-1%, 0, 0) rotate3d(0, 0, 1, 2deg);
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

.photo-stack:hover img:nth-child(1) {
  @apply scale-105;
  /* left: calc(50% + calc(-50% * var(--removeFromAlbum) * var(--twoImgs)));
  transform: translate3d(
      calc((-50% + calc(-20% * var(--removeFromAlbum)))),
      0,
      0
    )
    rotate3d(
      0,
      0,
      calc(1 * var(--removeFromAlbum) * var(--twoImgs)),
      calc(
        -3deg * var(--removeFromAlbum) * var(--twoImgs) * var(--scale) * var(--scale)
      )
    ); */
}
.photo-stack:hover img:nth-child(2) {
  transform: translate3d(calc(10% * var(--scale) * var(--multiplier)), 5%, 0)
    rotate3d(0, 0, 1, calc(3deg * var(--scale)));
}
.photo-stack:hover img:nth-child(3) {
  transform: translate3d(
      calc(-10% * var(--scale) * var(--multiplier)),
      calc(1% * var(--multiplier) * var(--multiplier) * var(--scale)),
      0
    )
    rotate3d(0, 0, 1, calc(-3deg * var(--scale) * var(--scale)));
}
.photo-stack:hover img:nth-child(4) {
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
.photo-stack:hover img:nth-child(5) {
  transform: translate3d(
      calc(-5% * var(--scale) * var(--multiplier)),
      calc(-2% * var(--multiplier) * var(--multiplier)),
      0
    )
    rotate3d(0, 0, 1, calc(2deg * var(--scale)));
}
</style>
