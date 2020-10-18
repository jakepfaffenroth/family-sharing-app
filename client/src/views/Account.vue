<template>
  <account-menu :owner="owner"></account-menu>

  <transition appear name="slide" mode="out-in">
    <component
      :is="accountView"
      v-if="planDetails"
      :owner="owner"
      :usage="usage"
      :plan-details="planDetails"
      @open-plan-change="openPlanChange"
      @close-plan-change="closePlanChange"
      @confirm-plan-change="confirmPlanChange"
    ></component>
    <div v-else class="mx-auto mt-6 text-xl text-gray-900">
      Loading...
    </div>
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
      default: null
    },
    usage: {
      type: Object,
      default: null
    }
  },
  setup(props) {
    const parent = ref(null);
    const accountView = shallowRef(AccountSummary);
    const route = useRoute();
    const router = useRouter();
    const server = process.env.VUE_APP_SERVER;
    const toast = inject('toast');

    const { owner } = reactive(props);
    const { goToChangePlan } = route.params;
    const elementClasses = reactive({});
    let planDetails = ref(null);

    elementClasses.planModal = 'invisible opacity-0';
    elementClasses.pricesForm = 'hidden opacity-0';

    onBeforeMount(async () => {
      await getCurrentPlan(owner.ownerId);

      // Open straight into plan picker if goToChangePlan is true
      goToChangePlan ? openPlanChange() : null;
    });

    async function getCurrentPlan() {
      const response = await axios.post(
        server + '/payment/retrieve-payment-method',
        {
          ownerId: owner.ownerId
        }
      );
      planDetails.value = response.data;
      // return response.data;
    }
    provide('getCurrentPlan', getCurrentPlan);

    function openPlanChange() {
      accountView.value = AccountPlanPicker;
    }

    function closePlanChange() {
      accountView.value = AccountSummary;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    async function confirmPlanChange(newPriceId) {
      const response = await axios.post(
        server + '/payment/update-subscription',
        {
          ownerId: owner.ownerId,
          newPriceId: newPriceId
        }
      );
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

    return {
      accountView,
      parent,
      openPlanChange,
      closePlanChange,
      confirmPlanChange,
      cancelSubscription,
      elementClasses,
      planDetails,
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
