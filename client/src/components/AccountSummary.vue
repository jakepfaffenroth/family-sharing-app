<template>
  <div
    class="flex flex-col w-full px-2 py-2 text-gray-900 sm:px-4 sm:py-4 xl:px-12 xl:py-6"
  >
    <div id="subscription-settings">
      <div class="flex flex-wrap justify-center mt-4">
        <div class="inline-block w-full p-4 rounded sm:w-4/5 md:w-3/5 lg:w-2/5">
          <h1
            id="subscription-status-text"
            class="text-center font-bold text-2xl"
          >
            Account settings
          </h1>
          <div class="mt-4 border rounded p-4 space-y-4">
            <div class="space-y-1">
              <h2 class="font-bold text-xl">
                Personal Info
              </h2>
              <div class="flex justify-between">
                <h3 class="text-lg text-gray-700">
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
                <h3 class="text-lg text-gray-700">
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
                <h3 class="text-lg text-gray-700">
                  Password
                </h3>
                <span
                  id="subscribed-price"
                  class="setting text-xl font-semibold"
                >
                  <button class="text-lg" @click="resetPassword">
                    •••••••
                    <span>→</span>
                  </button>
                </span>
              </div>
            </div>
            <div class="space-y-1">
              <h2 class="font-bold text-xl">
                Plan
              </h2>
              <div class="flex justify-between">
                <h3 class="text-lg text-gray-700">
                  Current plan
                </h3>
                <span
                  id="subscribed-price"
                  data-test="currentPlanInSummary"
                  class="font-semibold text-lg"
                  :class="{
                    'font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-teal-400 to-orange-400 via-purple-400': planDetails.plan
                      .toLowerCase()
                      .includes('premium')
                  }"
                >
                  {{ planDetails.plan }}
                </span>
              </div>

              <div class="flex justify-between">
                <h3 class="text-lg text-gray-700">
                  Payment method
                </h3>
                <span id="credit-card-last-four" class="text-lg font-semibold">
                  {{ planDetails.paymentMethod }}
                </span>
              </div>
            </div>
            <div class="space-y-1">
              <h3 class="font-bold text-xl">
                Usage
              </h3>
              <p>
                {{ imageCount }} image{{ imageCount != 1 ? 's' : '' }} uploaded
              </p>
              <p>
                You've used {{ usageValue.num }} {{ usageValue.unit }} of
                {{ quota / 1000 }} GB
              </p>
              <div
                class="relative flex h-2 my-2 mx-auto rounded-sm overflow-hidden"
              >
                <div
                  class="left-0 h-full border rounded-l-sm"
                  :class="{
                    'bg-green-400 border-green-400': usageBarColor === 'green',
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

            <div class="space-y-1">
              <div class="space-y-1 text-gray-900 font-semibold text-xl">
                <div
                  class="setting flex justify-between mt-2 mb-2 cursor-pointer"
                  data-test="changePlanBtn"
                  @click="$emit('open-plan-change')"
                >
                  <span>
                    Change plan
                    <span>→</span>
                  </span>
                </div>
                <div
                  class="setting flex justify-between cursor-pointer"
                  @click="updateBilling"
                >
                  <span>
                    Update billing info
                    <span>→</span>
                  </span>
                </div>
                <div
                  class="setting flex justify-between mt-2 mb-2 cursor-pointer"
                  @click="deleteAccount"
                >
                  <span>
                    Delete account
                    <span>→</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
          <!-- <div
              class="flex justify-between mt-2 mb-2 text-gray-900 font-bold text-xl cursor-pointer"
              @click="cancelSubscription"
            >
              <span>
                Cancel subscription
                <span>→</span>
              </span>
            </div> -->
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
import { inject, computed } from 'vue';
import { useStore } from 'vuex';

export default {
  name: 'AccountSummary',
  emits: ['open-plan-change'],
  setup() {
    const store = useStore();
    const server = process.env.VUE_APP_SERVER;
    const toast = inject('toast');

    const owner = computed(() => store.state.ownerStore.owner);
    const storagePercentage = computed(() => store.getters.storagePercentage);

    async function resetPassword() {
      const response = await axios.post(
        process.env.VUE_APP_SERVER + '/auth/reset-password',
        {
          email: owner.value.email
        }
      );
      if (response.status === 200) {
        toast.success('A reset link has been emailed to you');
      } else {
        toast.error('An error occurred');
      }
    }

    // TODO - Add update billing functionality
    async function updateBilling() {
      toast.open({
        type: 'info',
        duration: 3000,
        dismissible: true,
        message: 'Coming soon!'
      });
    }

    // TODO - Add delete account functionality
    async function deleteAccount() {
      toast.open({
        type: 'info',
        duration: 3000,
        dismissible: true,
        message: 'Coming soon!'
      });
    }

    // async function cancelSubscription() {
    //   const response = await axios(
    //     process.env.VUE_APP_SERVER + '/payment/cancel-subscription',
    //     {
    //       method: 'post',
    //       headers: {
    //         'Content-Type': 'application/json'
    //       },
    //       data: JSON.stringify({
    //         ownerId: owner.value.ownerId
    //       })
    //     }
    //   );

    //   const data = response.data;
    //   if (
    //     !data.subCancelled &&
    //     data.msg.toLowerCase().includes('no such subscription')
    //   ) {
    //     toast.open({
    //       type: 'error',
    //       duration: 0,
    //       dismissible: true,
    //       message: '<div id="toast-message"><p id="msg-text"></p></div>'
    //     });
    //     document.getElementById('toast-message').innerText =
    //       'Your subscription was not found. Please contact support or try again.';
    //   } else if (!data.subCancelled) {
    //     toast.open({
    //       type: 'error',
    //       duration: 0,
    //       dismissible: true,
    //       message: '<div id="toast-message"><p id="msg-text"></p></div>'
    //     });
    //     document.getElementById('msg-text').innerText =
    //       'Your subscription could not be cancelled right now.\nPlease contact support or try again.';
    //   }
    //   if (data.subCancelled) {
    //     toast.open({
    //       type: 'success',
    //       duration: 5000,
    //       // dismissible: true,
    //       message: '<div id="toast-message"><p id="msg-text"></p></div>'
    //     });
    //     document.getElementById('msg-text').innerText =
    //       'Subscription cancelled\n' + response;
    //   }
    // }

    return {
      owner,
      imageCount: computed(() => store.getters.imageCount),
      planDetails: computed(() => store.getters.planDetails),
      quota: computed(() => store.getters.quota),
      usageValue: computed(() => store.getters.usageValue),
      usageBarWidth: computed(() => store.getters.usageBarWidth),
      usageBarColor: computed(() => store.getters.usageBarColor),
      resetPassword,
      updateBilling,
      deleteAccount,
      ENABLED: false
      // cancelSubscription
    };
  }
};
</script>

<style scoped>
.setting {
  @apply cursor-pointer transition hover:text-purple-600;
}
</style>
