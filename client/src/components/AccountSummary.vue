<template>
  <div
    class="flex flex-col w-full px-2 py-2 text-gray-900 sm:px-6 sm:py-4 xl:px-12 xl:py-6"
  >
    <div id="subscription-settings">
      <div class="flex flex-wrap justify-center mt-4">
        <div class="inline-block w-full p-4 rounded md:w-2/5">
          <h1
            id="subscription-status-text"
            class="text-center font-bold text-2xl"
          >
            Account settings
          </h1>
          <div class="mt-4 border rounded p-4 space-y-4">
            <div class="space-y-1">
              <h2 class="font-bold text-xl">
                Plan
              </h2>
              <div class="flex justify-between">
                <h3 class="text-xl text-gray-700">
                  Current plan
                </h3>
                <span
                  id="subscribed-price"
                  class="font-semibold text-xl"
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
                <h3 class="text-xl text-gray-700">
                  Payment method
                </h3>
                <span id="credit-card-last-four" class="font-semibold text-xl">
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
                  :class="'bg-' + usageBarColor + ' border-' + usageBarColor"
                  :style="usageBarWidth"
                ></div>
                <div
                  class="flex-grow border-t border-b border-r border-gray-400 rounded-r-sm"
                ></div>
              </div>
            </div>

            <div class="space-y-1">
              <div class="space-y-1">
                <div
                  class="flex justify-between text-gray-900 font-bold text-xl cursor-pointer"
                  @click="updateBilling"
                >
                  <span>
                    Update billing info
                    <span>→</span>
                  </span>
                </div>
                <div
                  class="flex justify-between mt-2 mb-2 text-gray-900 font-bold text-xl cursor-pointer"
                  @click="$emit('open-plan-change')"
                >
                  <span>
                    Change plan
                    <span>→</span>
                  </span>
                </div>
                <div
                  class="flex justify-between mt-2 mb-2 text-gray-900 font-bold text-xl cursor-pointer"
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

    // TODO - Add update billing functionality
    async function updateBilling() {
      toast.open({
        type: 'info',
        duration: 3000,
        dismissible: true,
        message: 'Go update your billing info!'
      });
    }

    // TODO - Add delete account functionality
    async function deleteAccount() {
      toast.open({
        type: 'info',
        duration: 3000,
        dismissible: true,
        message: 'Your account will be deleted!'
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
      imageCount: computed(() => store.getters.imageCount),
      planDetails: computed(() => store.getters.planDetails),
      quota: computed(() => store.getters.quota),
      usageValue: computed(() => store.getters.usageValue),
      usageBarWidth: computed(() => store.getters.usageBarWidth),
      usageBarColor: computed(() => store.getters.usageBarColor),
      updateBilling,
      deleteAccount
      // cancelSubscription
    };
  }
};
</script>
