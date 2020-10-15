<template>
  <div
    v-if="showAccountSummary"
    ref="parent"
    class="flex flex-col w-full px-2 py-2 sm:px-6 sm:py-4 xl:px-12 xl:py-6"
  >
    <!-- <div class="flex flex-col sm:flex-row sm:justify-between">
      <a href="/">
        <colorful-logo
          class="self-center sm:self-start"
          :content="'carousel'"
        />
        <h1
          class="text-lg tracking-tight leading-10 font-semibold text-gray-900 sm:text-lg sm:leading-none md:text-xl"
        >
          <span class="inline-block align-baseline text-gray-700 text">
            Account: {{ owner.firstName }} {{ owner.lastName }}
          </span>
        </h1>
      </a>
      <div
        class="flex flex-col items-center sm:items-end py-4 gap-y-4 mt-3 text-gray-700"
      >
        <router-link
          to="/"
          class="flex items-center space-x-2 border border-transparent transition-colors duration-150 focus:outline-none self-center px-5 py-1 font-medium leading-5 text-white bg-purple-500 rounded-lg shadow active:bg-purple-600 hover:bg-purple-600 focus:shadow-outline-purple cursor-pointer"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="w-4 h-4"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fill-rule="evenodd"
              d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
              clip-rule="evenodd"
            />
          </svg>
          <span>Back to Gallery</span>
        </router-link>
      </div>
    </div> -->
    <div
      id="subscription-cancelled"
      class="flex flex-wrap font-bold text-pasha text-xl mt-6 mb-2 hidden"
      :class="elementClasses.subscriptionCancelled"
    >
      Subscription canceled
    </div>
    <div>
      <button
        class="bg-pasha hover:bg-white hover:shadow-outline hover:text-pasha hover:border hover:border-black focus:shadow-outline text-white focus:bg-white focus:text-pasha font-light py-2 px-4 rounded"
        type="button"
        onclick="window.location.href='/'"
      >
        Restart demo
      </button>
    </div>
    <div
      id="subscription-settings"
      :class="elementClasses.subscriptionSettings"
    >
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
              @click="cancelSubscription"
            >
              <span>
                Cancel subscription
                <span>→</span>
              </span>
            </div>
          </div>

          <div
            id="prices-form"
            class="w-full mr-4 md:mb-8"
            :class="elementClasses.pricesForm"
          >
            <div class="text-center text-pasha font-bold text-2xl mt-4 mb-6">
              Change pricing plan
            </div>

            <div class="flex justify-between mb-8">
              <div
                id="basic"
                class="w-1/2 rounded overflow-hidden border p-2 mr-4 md:mr-8"
              >
                <div class="px-2 py-2">
                  <div class="text-gray-500 text-xl mb-2 font-medium">
                    Basic
                  </div>
                  <p class="text-pasha text-2xl font-extrabold">
                    $5.00
                  </p>
                  <div class="flex-wrap">
                    <div class="leading-none text-gray-500 text-xs font-medium">
                      Per month
                    </div>
                    <div
                      class="leading-none text-gray-500 text-xs font-medium mt-1"
                    >
                      Billed monthly
                    </div>
                  </div>

                  <div class="flex justify-center mt-6">
                    <button
                      id="submit-basic"
                      onClick="switchPrices('BASIC')"
                      class="bg-pasha hover:bg-white outline-none hover:text-pasha hover:border hover:border-black text-white focus:bg-white focus:text-pasha font-light py-2 px-4 rounded-lg"
                      type="submit"
                    >
                      <div
                        id="submit-basic-button-text"
                        class="w-auto -mx-2 md:mx-0"
                      >
                        <div id="loading" class=""></div>
                        <span id="button-text" :class="elementClasses.btnText">
                          Select
                        </span>
                      </div>
                    </button>
                  </div>
                </div>
              </div>
              <div
                id="premium"
                class="w-1/2 rounded overflow-hidden border p-2"
              >
                <div class="px-2 py-2">
                  <div class="text-gray-500 text-xl mb-2 font-medium">
                    Premium
                  </div>
                  <p class="text-pasha text-2xl font-extrabold">
                    $15.00
                  </p>
                  <div class="flex-wrap">
                    <div class="leading-none text-gray-500 text-xs font-medium">
                      Per month
                    </div>
                    <div
                      class="leading-none text-gray-500 text-xs font-medium mt-1"
                    >
                      Billed monthly
                    </div>
                  </div>
                  <div class="flex justify-center mt-6">
                    <button
                      id="submit-premium"
                      onClick="switchPrices('PREMIUM')"
                      class="bg-pasha hover:bg-white outline-none hover:text-pasha hover:border hover:border-black text-white focus:bg-white focus:text-pasha font-light py-2 px-4 rounded-lg"
                      type="submit"
                    >
                      <div
                        id="submit-premium-button-text"
                        class="w-auto -mx-2 md:mx-0"
                      >
                        <div id="loading" class=""></div>
                        <span id="button-text">Select</span>
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <div id="price-change-form" class="flex justify-center">
              <div class="w-full rounded overflow-hidden border p-4 mb-4">
                <div class="flex justify-between text-gray-600 text-m">
                  <div>Current price</div>
                  <div
                    id="current-price-subscribed"
                    class="font-bold text-m mb-2"
                  ></div>
                </div>

                <div class="flex justify-between text-gray-600 text-m">
                  <div>New price</div>
                  <div
                    id="new-price-selected"
                    class="mb-2 font-bold text-m"
                  ></div>
                </div>

                <div>
                  <p class="mt-4 mb-4 text-gray-600">
                    You will be charged
                    <span id="new-price-price-selected"></span>
                    on
                    <span id="new-price-start-date"></span>
                  </p>
                  <button
                    id="confirm-price-change-submit"
                    onClick="confirmPriceChange()"
                    class="bg-pasha hover:bg-white hover:shadow-outline hover:text-pasha hover:border hover:border-black focus:shadow-outline text-white focus:bg-white focus:text-pasha font-light py-2 px-4 rounded-lg"
                    :class="elementClasses.confirmPriceChangeSubmit"
                    type="submit"
                  >
                    <div class="w-auto -mx-2 md:mx-0">
                      <div id="loading" class=""></div>
                      <span id="button-text">Confirm change</span>
                    </div>
                  </button>
                  <button
                    id="confirm-price-change-cancel"
                    onClick="cancelChangePrice()"
                    class="bg-pasha hover:bg-white hover:shadow-outline hover:text-pasha hover:border hover:border-black focus:shadow-outline text-white focus:bg-white focus:text-pasha font-light py-2 px-4 rounded-lg"
                    :class="elementClasses.confirmPriceChangeCancel"
                    type="submit"
                  >
                    <div class="w-auto -mx-2 md:mx-0">
                      <div id="loading" class=""></div>
                      <span id="button-text">Cancel</span>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
// import ColorfulLogo from '../components/ColorfulLogo';
import {
  ref,
  provide,
  inject,
  toRefs,
  reactive,
  onBeforeMount,
  isReactive
} from 'vue';
import { useRoute, useRouter } from 'vue-router';

export default {
  name: 'AccountSummary',
  // components: { ColorfulLogo },
  props: {
    owner: {
      type: Object,
      default: () => {
        return {};
      }
    },
    images: {
      type: Array,
      default: () => {
        return [];
      }
    },
    planDetails: {
      type: Object,
      default: () => {
        return {};
      }
    }
  },
  emits: ['open-plan-change'],
  setup(props) {
    const parent = ref(null);
    const toast = inject('toast');
    const route = useRoute();
    const router = useRouter();
    const server = process.env.VUE_APP_SERVER;

    const { owner } = reactive(props);
    const elementClasses = reactive({});
    // let planDetails = ref({});

    elementClasses.planModal = 'invisible opacity-0';
    elementClasses.pricesForm = 'hidden opacity-0';

    function changeModalBtns(currentPlan) {
      const btn = document.querySelector(
        `#${currentPlan.toLowerCase().replace(' ', '-')} button`
      );

      btn.innerText = 'Current Plan';
      btn.classList.remove('transition', 'plan-btn');
      btn.classList.add(
        'italic',
        'cursor-default',
        'shadow-none',
        'transition-none',
        'text-purple-400',
        'font-semibold'
      );
      btn.disabled = 'true';
    }

    const showAccountSummary = ref(true);

    function showChangePlan(ownerId) {
      router.push('change-plan');
    }

    async function confirmPlanChange(newPriceId) {
      const response = await axios.post(
        server + '/payment/update-subscription',
        {
          ownerId: owner.ownerId,
          newPriceId: newPriceId
        }
      );
      getCurrentPlan(route.params.ownerId);
      closePlanChangeModal();
      return response.data;
    }

    async function cancelSubscription() {
      // changeLoadingStatePrices(true);
      const params = new URLSearchParams(document.location.search.substring(1));
      const subscriptionId = params.get('subscriptionId');

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
        // subscriptionCancelled(response);
      }
    }

    // Show a spinner on subscription submission
    function changeLoadingStatePrices(isLoading) {
      if (isLoading) {
        elementClasses.btnText = 'hidden';
        elementClasses.loading = '';
        // document.querySelector('#button-text').classList.add('hidden');
        // document.querySelector('#loading').classList.remove('hidden');

        // document.querySelector('#btn-basic').classList.add('invisible');
        // document.querySelector('#btn-premium').classList.add('invisible');
        // document.querySelector('#btn-premium-plus').classList.add('invisible');
        if (document.getElementById('confirm-price-change-cancel')) {
          elementClasses.confirmPriceChangeCancel = 'invisible';
          // document
          //   .getElementById('confirm-price-change-cancel')
          //   .classList.add('invisible');
        }
      } else {
        elementClasses.btnText = '';
        elementClasses.loading = 'hidden';
        // document.querySelector('#button-text').classList.remove('hidden');
        // document.querySelector('#loading').classList.add('hidden');

        elementClasses.btnBasic = '';
        elementClasses.btnPremium = '';
        elementClasses.btnPremiumPlus = '';
        // document.querySelector('#btn-basic').classList.remove('invisible');
        // document.querySelector('#btn-premium').classList.remove('invisible');
        // document
        //   .querySelector('#btn-premium-plus')
        //   .classList.remove('invisible');
        if (document.getElementById('confirm-price-change-cancel')) {
          elementClasses.confirmPriceChangeCancel = '';
          elementClasses.confirmPriceChangeSubmit = '';
          // document
          //   .getElementById('confirm-price-change-cancel')
          //   .classList.remove('invisible');
          // document
          //   .getElementById('confirm-price-change-submit')
          //   .classList.remove('invisible');
        }
      }
    }

    // Shows the cancellation response
    function subscriptionCancelled(isSubCancelled) {
      elementClasses.subscriptionCancelled = '';
      elementClasses.subscriptionSettings = 'hidden';
      // document
      //   .querySelector('#subscription-cancelled')
      //   .classList.remove('hidden');
      document.querySelector('#subscription-settings').classList.add('hidden');
    }

    function closePlanChangeModal() {
      // First scroll up to account summary, then go 'back' in navigation history
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setTimeout(() => {
        router.go(-1);
      }, 500);
    }

    return {
      parent,
      showAccountSummary,
      showChangePlan,
      confirmPlanChange,
      cancelSubscription,
      elementClasses,
      closePlanChangeModal
    };
  }
};
</script>

<style scoped></style>
