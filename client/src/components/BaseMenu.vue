<template>
  <div class="flex pb-2 justify-between">
    <div>
      <a href="/">
        <base-colorful-logo class="self-center sm:self-start" />
      </a>
    </div>
    <div class="flex flex-col pb-1 items-center justify-end sm:items-end">
      <div
        class="pb-2 align-baseline text-gray-700 text-md tracking-tight leading-10 sm:text-md sm:leading-none md:text-lg"
      >
        <slot name="subheading"></slot>
      </div>
      <slot name="buttons"></slot>
    </div>
    <slot></slot>
  </div>
</template>

<script>
import BaseColorfulLogo from './BaseColorfulLogo';

export default {
  components: { BaseColorfulLogo }
};
</script>
