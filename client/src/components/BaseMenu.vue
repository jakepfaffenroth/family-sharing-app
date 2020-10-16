<template>
  <div class="flex flex-col sm:flex-row sm:justify-between">
    <div>
      <a href="/">
        <base-colorful-logo class="self-center sm:self-start" />
      </a>
      <div
        class="inline-block align-baseline text-gray-800 text-lg tracking-tight leading-10 font-semibold sm:text-lg sm:leading-none md:text-xl"
      >
        <slot name="subheading"></slot>
      </div>
    </div>
    <div class="flex flex-col items-center sm:items-end ml-auto py-4 mt-3">
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
