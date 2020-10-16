<template>
  <div class="flex flex-col w-full px-2 py-2 sm:px-6 sm:py-4 xl:px-12 xl:py-6">
    <div id="subscription-settings">
      <div class="flex flex-wrap justify-center mt-4">
        <div class="md:w-2/5 w-full inline-block rounded-md p-4">
          <div
            id="subscription-status-text"
            class="text-center font-bold text-pasha text-2xl"
          >
            Account settings
          </div>
          <div class="mt-4 border rounded p-4">
            <div class="font-bold text-xl mb-2">
              Account
            </div>
            <div class="flex justify-between text-gray-600 text-xl">
              <div>Current plan</div>
              <div id="subscribed-price" class="mb-2 font-bold text-xl">
                {{ planDetails.plan }}
              </div>
            </div>

            <div class="flex justify-between">
              <div class="text-xl text-gray-600">
                Credit card
              </div>
              <span
                id="credit-card-last-four"
                class="font-bold text-xl text-gray-600"
              >
                {{ planDetails.paymentMethod }}
              </span>
            </div>

            <div
              class="flex justify-between mt-2 mb-2 text-gray-900 font-bold text-xl cursor-pointer"
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
  </div>
</template>

<script>
import axios from 'axios';
import { ref, reactive, inject } from 'vue';

export default {
  name: 'AccountSummary',
  props: {
    planDetails: {
      type: Object,
      default: () => {
        return {};
      }
    }
  },
  emits: ['open-plan-change'],
  setup(props) {
    const toast = inject('toast');
    const server = process.env.VUE_APP_SERVER;

    async function deleteAccount() {
      // TODO - Add delete account functionality
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
      deleteAccount
      // cancelSubscription
    };
  }
};
</script>
