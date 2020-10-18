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
                You've used {{ usageValue.num }} {{ usageValue.unit }} of
                {{ owner.quota / 1000 }} GB
              </p>
              <div
                class="relative flex h-2 my-2 mx-auto rounded-sm overflow-hidden"
              >
                <div
                  class="left-0 h-full border rounded-l-sm"
                  :class="'bg-' + barColor + ' border-' + barColor"
                  :style="barWidth"
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
import { ref, reactive, inject, computed } from 'vue';

export default {
  name: 'AccountSummary',
  props: {
    owner: {
      type: Object,
      default: null
    },
    planDetails: {
      type: Object,
      default: null
    },
    usage: {
      type: Object,
      default: null
    }
  },
  emits: ['open-plan-change'],
  setup(props) {
    const server = process.env.VUE_APP_SERVER;
    const toast = inject('toast');
    const { owner, usage } = reactive(props);

    const storagePercentage = computed(() => {
      return (usage.mb / owner.quota) * 100;
    });
    const usageValue = computed(() => {
      if (usage.gb >= 1) return { num: usage.gb.toFixed(2), unit: 'GB' };
      else if (usage.mb >= 1) return { num: usage.mb.toFixed(2), unit: 'MB' };
      else return { num: usage.kb.toFixed(2), unit: 'KB' };
    });
    const barWidth = computed(() => {
      return storagePercentage.value > 2
        ? 'width: ' + storagePercentage() + '%'
        : 'width: ' + 2 + '%';
    });
    const barColor = computed(() => {
      if (storagePercentage.value < 40) {
        return 'green-400';
      } else if (storagePercentage.value < 90) {
        return 'orange-400';
      } else {
        return 'red-500';
      }
    });

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

    async function cancelSubscription() {
      const owner = inject('owner');

      const response = await axios(
        process.env.VUE_APP_SERVER + '/payment/cancel-subscription',
        {
          method: 'post',
          headers: {
            'Content-Type': 'application/json'
          },
          data: JSON.stringify({
            ownerId: owner.ownerId
          })
        }
      );

      const data = response.data;
      if (
        !data.subCancelled &&
        data.msg.toLowerCase().includes('no such subscription')
      ) {
        toast.open({
          type: 'info',
          duration: 0,
          dismissible: true,
          message: '<div id="toast-message"><p id="msg-text"></p></div>'
        });
        document.getElementById('toast-message').innerText =
          'Your subscription was not found. Please contact support or try again.';
      } else if (!data.subCancelled) {
        toast.open({
          type: 'info',
          duration: 0,
          dismissible: true,
          message: '<div id="toast-message"><p id="msg-text"></p></div>'
        });
        document.getElementById('msg-text').innerText =
          'Your subscription could not be cancelled right now.\nPlease contact support or try again.';
      }
      if (data.subCancelled) {
        toast.open({
          type: 'info',
          duration: 5000,
          // dismissible: true,
          message: '<div id="toast-message"><p id="msg-text"></p></div>'
        });
        document.getElementById('msg-text').innerText =
          'Subscription cancelled\n' + response;
      }
    }

    return {
      usageValue,
      updateBilling,
      deleteAccount,
      barWidth,
      barColor
      // cancelSubscription
    };
  }
};
</script>
