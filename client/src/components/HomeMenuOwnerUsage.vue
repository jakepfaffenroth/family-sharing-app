<template>
  <div class="w-full mt-3 mb-1 text-center text-sm text-teal-600">
    <p>
      You've used
    </p>
    <p>{{ usageValue.num }} {{ usageValue.unit }} of {{ quota / 1000 }} GB</p>
    <div
      class="relative flex h-2 w-5/6 my-2 mx-auto rounded-sm overflow-hidden"
    >
      <div
        class="left-0 h-full border rounded-l-sm"
        :class="{
          'bg-green-400 border-green-400': usageBarColor === 'green',
          'bg-orange-400 border-orange-400': usageBarColor === 'orange',
          'bg-red-500 border-red-500': usageBarColor === 'red'
        }"
        :style="usageBarWidth"
      ></div>
      <div
        class="flex-grow border-t border-b border-r border-gray-400 rounded-r-sm"
      ></div>
    </div>
    <router-link
      :to="{ name: 'account', params: { goToChangePlan: true } }"
      class="main-menu-link text-purple-500 font-semibold"
      data-test="getMoreStorageBtn"
    >
      Get more storage
    </router-link>
  </div>
</template>

<script>
import { mapGetters } from 'vuex';

export default {
  computed: {
    ...mapGetters(['quota', 'usageValue', 'usageBarColor', 'usageBarWidth'])
  }
};
</script>
