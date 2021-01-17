<template>
  <div
    class="flex flex-col w-full mb-16 p-2 text-gray-900 sm:px-4 sm:py-4 xl:px-12 xl:py-6"
  >
    <div id="subscription-settings">
      <div class="flex flex-wrap justify-center mt-4">
        <div class="inline-block w-full rounded sm:w-4/5 md:w-3/5 lg:w-2/5">
          <h1
            id="subscription-status-text"
            class="text-center font-bold text-2xl"
          >
            Account settings
          </h1>
          <div class="mt-4 space-y-4">
            <div class="settings-block">
              <h2 class="font-bold text-xl">
                Personal Info
              </h2>
              <div class="flex justify-between">
                <h3 class="text-lg text-gray-800">
                  Username
                </h3>
                <span
                  id="subscribed-price"
                  class="text-lg font-semibold"
                  :class="ENABLED ? 'setting' : ''"
                  @click="changeUsername"
                >
                  {{ owner.username }}
                  <span v-if="ENABLED">→</span>
                </span>
              </div>
              <div class="flex justify-between">
                <h3 class="text-lg text-gray-800">
                  Name
                </h3>
                <span
                  id="subscribed-price"
                  class="text-lg font-semibold"
                  :class="ENABLED ? 'setting' : ''"
                  @click="changeName"
                >
                  {{ owner.firstName }} {{ owner.lastName }}
                  <span v-if="ENABLED">→</span>
                </span>
              </div>
              <div class="flex justify-between">
                <h3 class="inline-block align-baseline text-lg text-gray-800">
                  Password
                </h3>
                <button class="setting" @click="resetPassword">
                  Reset password
                  <span class="not-italic">→</span>
                </button>
              </div>
            </div>
            <div class="settings-block">
              <h2 class="font-bold text-xl">
                Billing
              </h2>
              <div class="space-y-4">
                <div class="flex justify-between">
                  <h3 class="text-lg text-gray-700">
                    Plan
                  </h3>
                  <div class="">
                    <span class="inline-block w-full text-right">
                      <span
                        data-test="currentPlanInSummary"
                        class="inline-block font-semibold text-lg capitalize"
                        :class="{
                          'font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-teal-400 to-orange-400 via-purple-400':
                            planDetails.plan &&
                            planDetails.plan.includes('premium')
                        }"
                      >
                        {{
                          planDetails.plan.replace('Mo', '').replace('Yr', '')
                        }}
                      </span>
                    </span>
                    <!-- <button
                      v-if="planDetails.plan === 'basic'"
                      Xclass="flex justify-self-end px-3 py-1 rounded cursor-pointer hover:text-white transition-all bg-gradient-to-r hover:from-teal-400 hover:to-orange-400 hover:via-purple-400 group"
                    >
                      <span
                        class="bg-clip-text text-transparent bg-gradient-to-r from-teal-400 to-orange-400 via-purple-400 text-sm font-bold tracking-wide transition group-hover:text-white group-hover:font-semibold"
                      >
                        Get Premium
                      </span>
                    </button> -->
                    <button
                      Xv-else
                      class="setting"
                      data-test="changePlanBtn"
                      @click="$emit('open-plan-change')"
                    >
                      <span
                        v-if="planDetails.plan === 'basic'"
                        class="bg-clip-text text-transparent bg-gradient-to-r from-teal-400 to-orange-400 via-purple-400 text-sm font-bold tracking-wide transition group-hover:text-white group-hover:font-semibold"
                      >
                        Get Premium
                        <span class="not-italic text">→</span>
                      </span>
                      <span v-else>
                        Change plan
                        <span class="not-italic text">→</span>
                      </span>
                    </button>
                  </div>
                </div>
                <div class="flex justify-between">
                  <h3 class="text-lg text-gray-700 whitespace-nowrap">
                    Payment method
                  </h3>
                  <div>
                    <!-- <p class="text-right"> -->
                    <span
                      v-if="planDetails.lastFour"
                      class="flex pl-2 text-lg font-semibold text-right Xjustify-between"
                    >
                      <svg
                        class="w-5 mr-1"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="1.5"
                          d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                        />
                      </svg>
                      {{ planDetails.cardBrand }} {{ planDetails.lastFour }}
                    </span>
                    <!-- <span
                        class="inline-block pl-2 text-lg font-semibold text-right"
                      >
                        
                      </span> -->
                    <!-- </p> -->
                    <span v-else class="italic text-right">
                      No payment info
                    </span>
                    <button
                      class="setting"
                      data-test="changePlanBtn"
                      @click="updateBilling"
                    >
                      Update billing
                      <span class="not-italic">→</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <div class="settings-block">
              <h2 class="font-bold text-xl">
                Stats
              </h2>
              <!-- <p>
                {{ imageCount }} image{{ imageCount != 1 ? 's' : '' }} uploaded
              </p> -->
              <div class="flex justify-between">
                <h3 class="text-lg text-gray-700">
                  Images uploaded
                </h3>
                <div class="mt-0.5">
                  <span class="text-xl font-semibold">{{ usage }}</span>
                  <span class="inline-block pl-0.5 text-gray-600">
                    /{{ quota }}
                  </span>
                </div>
              </div>

              <!-- Usage bar -->
              <div>
                <div
                  class="relative flex h-2 mt-2 mb-3 mx-auto rounded-sm overflow-hidden"
                >
                  <div
                    class="left-0 h-full border rounded-l-sm"
                    :class="{
                      'bg-green-400 border-green-400':
                        usageBarColor === 'green',
                      'bg-orange-400 border-orange-400':
                        usageBarColor === 'orange',
                      'bg-red-500 border-red-500': usageBarColor === 'red'
                    }"
                    :style="usageBarWidth"
                  ></div>
                  <div
                    class="flex-grow border-t border-b border-r border-gray-400 rounded-r-sm"
                  ></div>
                </div>
              </div>
              <div class="flex justify-between">
                <h3 class="text-lg text-gray-700">
                  Albums
                </h3>
                <div class="mt-0.5 text-right">
                  <span class="inline-block text-xl font-semibold">
                    {{ albumCount }}
                  </span>
                  <span class="inline-block pl-0.5 text-gray-600 ">/</span>
                  <span
                    class="inline-block relative text-gray-600"
                    :class="{ 'top-0.5': isPremium }"
                  >
                    {{ isPremium ? '∞' : 0 }}
                  </span>
                </div>
              </div>
              <div class="flex justify-between">
                <h3 class="text-lg text-gray-700">
                  Subscribers
                </h3>
                <div>
                  <div class="mt-0.5 text-right">
                    <span class="inline-block text-xl font-semibold">
                      {{ subscriberCount }}
                    </span>
                    <span class="inline-block pl-0.5 text-gray-600">/</span>
                    <span class="inline-block relative top-0.5 text-gray-600">
                      ∞
                    </span>
                  </div>
                  <button
                    class="setting"
                    data-test="changePlanBtn"
                    @click="manageSubscribers"
                  >
                    Manage subscribers
                    <span class="not-italic">→</span>
                  </button>
                </div>
              </div>
              <!-- <p class="italic">
                {{ quota - usage }} upload{{
                  quota - usage === 1 ? '' : 's'
                }}
                remaining
              </p> -->
              <!-- <div class="flex text-sm">
                <p class="mr-auto">
                  0
                </p>
                <p class="ml-auto">{{ quota }}</p>
              </div> -->
            </div>

            <div class="settings-block text-gray-700">
              <h2 class="font-bold text-xl text-gray-700">
                Delete Your Account
              </h2>
              <p>
                This action will immediately and permanently delete your account
                and all personal data, including images.
              </p>
              <p class="font-semibold">
                They cannot be recovered after deletion.
              </p>
              <div class="flex justify-end">
                <base-button-red class="mt-4" @click="deleteAccount">
                  Delete Account
                </base-button-red>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modals -->
    <component
      :is="visibleModal"
      class="text-center"
      @close-modal="visibleModal = null"
    />
  </div>
</template>

<script>
import http from '../utils/http';
import { ref, inject, computed } from 'vue';
import { useStore } from 'vuex';
import BaseButtonRed from './BaseButtonRed';
import DeleteAccountModal from './AccountModalDeleteAccount';
import GetPremiumButton from './BaseButtonGetPremium';

export default {
  name: 'AccountSummary',
  components: { BaseButtonRed, DeleteAccountModal, GetPremiumButton },
  emits: ['open-plan-change'],
  setup() {
    const store = useStore();
    const stripe = Stripe(
      'pk_test_51HYjdCCto9koSaMfB1vfa2yKqEHrKbyEg0CHfL31Xck4Kom1QgvYSYhEy0G27aSwa2Ydy3RSmX9YxDFvdVNEIHz40032As5FXu'
    ); // Publishable Key
    const toast = inject('toast');

    const owner = computed(() => store.state.ownerStore.owner);
    const storagePercentage = computed(() => store.getters.storagePercentage);

    const visibleModal = ref(null);

    async function resetPassword() {
      const response = await http.post('/auth/reset-password', {
        email: owner.value.email
      });
      if (response.status === 200) {
        toast.success('A reset link has been emailed to you');
      } else {
        toast.error('An error occurred');
      }
    }

    async function updateBilling() {
      toast.open({
        type: 'info',
        duration: 3000,
        dismissible: true,
        message: 'Redirecting...'
      });

      const session = (
        await http.post('/payment/create-checkout-session', {
          ownerId: owner.value.ownerId,
          referrer: 'client',
          type: 'update'
        })
      ).data;

      if (session.demo) return;

      await stripe.redirectToCheckout({
        sessionId: session.id
      });
    }

    async function manageSubscribers() {
      toast.open({
        type: 'info',
        duration: 2000,
        dismissible: true,
        message: 'Coming soon...'
      });
    }

    async function deleteAccount() {
      visibleModal.value = 'DeleteAccountModal';
    }

    return {
      owner,
      imageCount: computed(() => store.getters.imageCount),
      planDetails: computed(() => store.getters.planDetails),
      usage: computed(() => store.getters.usage),
      quota: computed(() => store.getters.quota),
      // usageValue: computed(() => store.getters.usageValue),
      usageBarWidth: computed(() => store.getters.usageBarWidth),
      usageBarColor: computed(() => store.getters.usageBarColor),
      albumCount: computed(() => store.getters.albums.length),
      isPremium: computed(() => store.getters.isPremium),
      subscriberCount: computed(
        () => store.state.ownerStore.subscribers.length
      ),
      resetPassword,
      updateBilling,
      manageSubscribers,
      deleteAccount,
      visibleModal,
      ENABLED: false
    };
  }
};
</script>

<style scoped>
.settings-block {
  @apply px-4 py-2 border border-gray-300 rounded space-y-1;
}

.setting {
  @apply inline-block w-full text-base text-right leading-7 italic cursor-pointer transition hover:text-purple-600;
}
</style>
