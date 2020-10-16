<template>
  <account-menu :owner="owner"></account-menu>

  <transition appear name="slide" mode="out-in">
    <component
      :is="accountView"
      :plan-details="planDetails"
      @open-plan-change="openPlanChange"
      @close-plan-change="closePlanChange"
      @confirm-plan-change="confirmPlanChange"
    ></component>
  </transition>
</template>

<script>
import axios from 'axios';
import { defineAsyncComponent } from 'vue';
import AccountMenu from '../components/AccountMenu';
import AccountSummary from '../components/AccountSummary';
import AccountPlanPicker from '../components/AccountPlanPicker';

import {
  ref,
  shallowRef,
  provide,
  inject,
  toRefs,
  reactive,
  onBeforeMount,
  isReactive
} from 'vue';
import { useRoute, useRouter } from 'vue-router';

export default {
  name: 'Account',
  components: { AccountMenu, AccountSummary, AccountPlanPicker },
  inheritAttrs: false,
  props: {
    owner: {
      type: Object,
      default: () => {
        return {};
      }
    }
  },
  setup(props) {
    console.log('in Account');
    const parent = ref(null);
    const accountView = shallowRef(AccountSummary);
    const route = useRoute();
    const router = useRouter();
    const server = process.env.VUE_APP_SERVER;
    const toast = inject('toast');

    const { owner } = reactive(props);
    const elementClasses = reactive({});
    let planDetails = ref({});

    elementClasses.planModal = 'invisible opacity-0';
    elementClasses.pricesForm = 'hidden opacity-0';

    getCurrentPlan(owner.ownerId);

    async function getCurrentPlan() {
      const response = await axios.post(
        server + '/payment/retrieve-payment-method',
        {
          ownerId: owner.ownerId
        }
      );
      planDetails.value = response.data;
      console.log('planDetails.value:', planDetails.value);
      // return response.data;
    }
    provide('getCurrentPlan', getCurrentPlan);

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

    function openPlanChange() {
      accountView.value = AccountPlanPicker;

      // router.push('account-plan-picker');

      // setTimeout(() => {
      //   showAccountSummary.value = false;
      // }, 300);
    }

    function closePlanChange() {
      accountView.value = AccountSummary;
      // First scroll up to account summary, then go 'back' in navigation history
      // showAccountSummary.value = true;
      window.scrollTo({ top: 0, behavior: 'smooth' });
      // setTimeout(() => {
      //   router.go(-1);
      // }, 500);
    }

    async function confirmPlanChange(newPriceId) {
      const response = await axios.post(
        server + '/payment/update-subscription',
        {
          ownerId: owner.ownerId,
          newPriceId: newPriceId
        }
      );
      console.log('response.data:', response.data);
      const data = response.data;
      if (
        !data.subUpdated &&
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
      } else if (!data.subUpdated) {
        toast.open({
          type: 'info',
          duration: 0,
          dismissible: true,
          message: '<div id="toast-message"><p id="msg-text"></p></div>'
        });
        document.getElementById('msg-text').innerText =
          'Your subscription could not be changed right now.\nPlease contact support or try again.';
      }
      if (data.subUpdated) {
        getCurrentPlan(owner.ownerId);
        closePlanChangeModal();

        toast.open({
          type: 'info',
          duration: 5000,
          // dismissible: true,
          message: '<div id="toast-message"><p id="msg-text"></p></div>'
        });
        document.getElementById('msg-text').innerText =
          'Subscription updated\n' + response;
        // subscriptionCancelled(response);
      }
      return response.data;
    }

    async function cancelSubscription() {
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

    return {
      accountView,
      parent,
      showAccountSummary,
      openPlanChange,
      closePlanChange,
      confirmPlanChange,
      cancelSubscription,
      elementClasses,
      planDetails
    };
  }
};
</script>

<style>
/* Page transitions */
/* .slide-enter {
  transform: translate(-2em, 0);
  opacity: 0;
}

.slide-enter-to,
.slide-leave {
  opacity: 1;
  transform: translate(0, 0);
}

.slide-leave-to {
  transform: translate(2em, 0);
  opacity: 0;
}

.slide-enter-active,
.slide-leave-active {
  transition-duration: 0.1s;
  transition-property: height, opacity, transform;
  transition-timing-function: cubic-bezier(0.55, 0, 0.1, 1);
  overflow: hidden;
} */
</style>
