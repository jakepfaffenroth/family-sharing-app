<template>
  <main>
    <header class="bg-white px-2 pt-2 sm:px-6 sm:pt-4 xl:px-12 xl:pt-6">
      <account-menu></account-menu>
    </header>
    <transition v-if="planDetails" appear name="album" mode="out-in">
      <component
        :is="accountView"
        @open-plan-change="openPlanChange"
        @close-plan-change="closePlanChange"
        @confirm-plan-change="confirmPlanChange"
      ></component>
    </transition>
    <loading-text v-else class="mt-20" />
  </main>
</template>

<script>
import axios from 'axios';
import AccountMenu from '../components/AccountMenu';
import AccountSummary from '../components/AccountSummary';
import AccountPlanPicker from '../components/AccountPlanPicker';
import LoadingText from '../components/BaseLoadingText';

import {
  ref,
  reactive,
  computed,
  shallowRef,
  inject,
  onBeforeMount,
  onUpdated
} from 'vue';
import { useRoute } from 'vue-router';
import { useStore } from 'vuex';

export default {
  name: 'Account',
  components: { AccountMenu, AccountSummary, AccountPlanPicker, LoadingText },
  inheritAttrs: false,
  setup(props) {
    const store = useStore();
    const route = useRoute();
    const server = process.env.VUE_APP_SERVER;
    const toast = inject('toast');
    const stripe = Stripe(
      'pk_test_51HYjdCCto9koSaMfB1vfa2yKqEHrKbyEg0CHfL31Xck4Kom1QgvYSYhEy0G27aSwa2Ydy3RSmX9YxDFvdVNEIHz40032As5FXu'
    ); // Publishable Key

    const accountView = ref('AccountSummary');

    const owner = computed(() => store.state.ownerStore.owner);
    const usage = computed(() => store.state.planStore.usage);
    const { goToChangePlan } = route.params;

    const planDetails = computed(() => store.getters.planDetails);

    if (!planDetails.value) {
      (async () => {
        await store.dispatch('getPlanDetails');
      })();
    }

    // Open straight into plan picker if goToChangePlan is true
    onBeforeMount(async () => {
      if (
        (planDetails.value && planDetails.value.plan === null) ||
        goToChangePlan
      ) {
        openPlanChange();
      }
    });

    // onUpdated(() => {
    //   console.log('updated');
    //   if (planDetails.value && planDetails.value.plan === null) {
    //     openPlanChange();
    //   } else accountView.value = 'AccountSummary';
    // });

    function openPlanChange() {
      accountView.value = 'AccountPlanPicker';
    }

    function closePlanChange() {
      accountView.value = 'AccountSummary';
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    async function confirmPlanChange(newPlan) {
      const session = (
        await axios.post(server + '/payment/create-checkout-session', {
          ownerId: owner.value.ownerId,
          plan: newPlan,
          referrer: 'client',
          type: planDetails.value.paymentMethodOnFile ? 'update' : 'new'
        })
      ).data;

      let result;
      if (
        newPlan.includes('premium') &&
        !planDetails.value.paymentMethodOnFile
      ) {
        result = await stripe.redirectToCheckout({
          sessionId: session.id
        });
      } else {
        result = (
          await axios.post(server + '/payment/update-subscription', {
            ownerId: owner.value.ownerId,
            newPlan,
            referrer: 'client'
          })
        ).data;
      }
      // newPlan.includes('basic') || session.customer.default_source
      //   ? await axios.post(server + '/payment/update-subscription', {
      //       ownerId: owner.value.ownerId,
      //       newPlan
      //     })
      //   : await stripe.redirectToCheckout({
      //       sessionId: session.id
      //     });
      console.log('result:', result);
      // const { data } = await axios.post(
      //   server + '/payment/update-subscription',
      //   {
      //     ownerId: owner.value.ownerId,
      //     newPlan,
      //     referrer: 'client'
      //   }
      // );
      //   data = response.data;
      // } else if (newPlan.includes('premium')) {
      //   const response = await axios.post(
      //     server + '/payment/create-checkout-session',
      //     {
      //       ownerId: owner.value.ownerId,
      //       plan: newPlan,
      //       source: 'client'
      //     }
      //   );
      //   data = response.data;
      // }
      // console.log('data:', data);
      if (
        !result.subUpdated &&
        result.msg.toLowerCase().includes('no such subscription')
      ) {
        toast.open({
          type: 'error',
          duration: 0,
          dismissible: true,
          message:
            'Your subscription was not found. Please contact support or try again.'
        });
      } else if (!result.subUpdated) {
        toast.open({
          type: 'error',
          duration: 0,
          dismissible: true,
          message:
            'Your subscription could not be changed right now.\nPlease contact support or try again.'
        });
      }

      if (result.subUpdated) {
        store.dispatch('getPlanDetails');
        store.commit('updatePlanDetails');
        // store.dispatch('updateQuota', data.quota)
        closePlanChange();

        toast.open({
          type: 'success',
          duration: 5000,
          // dismissible: true,
          message: 'Subscription updated to ' + newPlan
        });
      }
      return result;
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
    //       message:
    //         'Your subscription was not found. Please contact support or try again.'
    //     });
    //     // document.getElementById('toast-message').innerText =
    //     //   'Your subscription was not found. Please contact support or try again.';
    //   } else if (!data.subCancelled) {
    //     toast.open({
    //       type: 'error',
    //       duration: 0,
    //       dismissible: true,
    //       message:
    //         'Your subscription could not be cancelled right now.\nPlease contact support or try again.'
    //     });
    //     // document.getElementById('msg-text').innerText =
    //     //   'Your subscription could not be cancelled right now.\nPlease contact support or try again.';
    //   }
    //   if (data.subCancelled) {
    //     toast.open({
    //       type: 'success',
    //       duration: 5000,
    //       // dismissible: true,
    //       message: 'Subscription cancelled\n' + response
    //     });
    //     // document.getElementById('msg-text').innerText =
    //     //   'Subscription cancelled\n' + response;
    //     // subscriptionCancelled(response);
    //   }
    // }

    return {
      accountView,
      openPlanChange,
      closePlanChange,
      confirmPlanChange,
      // cancelSubscription,
      // elementClasses,
      planDetails
    };
  }
};
</script>
