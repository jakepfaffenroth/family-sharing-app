<template>
  <div class="w-full mt-3 text-center text-sm text-teal-600" @click.stop>
    <p>
      Images uploaded
    </p>
    <div class="mt-2">
      <span class="text-gray-900 text-xl font-semibold">{{ usage }}</span>
      <span class="text-gray-600">/{{ quota }}</span>
    </div>
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
    <div v-if="isPremium" class="block mx-0.5 px-4 py-2 mt-3">
      <div class="flex justify-center">
        <svg
          class="w-4 text-purple-600 "
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
          />
        </svg>
        <span
          class="ml-1.5 bg-clip-text text-transparent bg-gradient-to-r from-teal-400 to-orange-400 via-purple-400 text-sm font-bold tracking-wide"
        >
          Premium
        </span>
      </div>
    </div>
    <router-link
      v-else
      :to="{ name: 'account', params: { goToChangePlan: true } }"
      class="block mx-0.5 px-4 py-2 rounded cursor-pointer hover:text-white transition-all mt-3 bg-gradient-to-r hover:from-teal-400 hover:to-orange-400 hover:via-purple-400 group"
      data-test="getMoreStorageBtn"
    >
      <!-- <button-get-premium /> -->
      <!-- <button
        class="w-full px-4 py-2 rounded border-2 border-purple-600 shadow text-center text-white font-medium transition duration-200 ease-in-out hover:bg-transparent hover:border-purple-400 hover:text-transparent"
      > -->
      <span
        class="bg-clip-text text-transparent bg-gradient-to-r from-teal-400 to-orange-400 via-purple-400 text-sm font-bold tracking-wide transition group-hover:text-white group-hover:font-semibold"
      >
        Get Premium
      </span>
      <!-- </button> -->
    </router-link>
  </div>
</template>

<script>
import { mapGetters } from 'vuex';

export default {
  computed: {
    ...mapGetters([
      'quota',
      'usage',
      // 'usageValue',
      'usageBarColor',
      'usageBarWidth',
      'isPremium'
    ])
  }
};
</script>
