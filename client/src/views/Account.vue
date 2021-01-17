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
import http from '../utils/http';
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

    function openPlanChange() {
      accountView.value = 'AccountPlanPicker';
    }

    function closePlanChange() {
      accountView.value = 'AccountSummary';
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    async function confirmPlanChange(newPlan) {
      const session = (
        await http.post('/payment/create-checkout-session', {
          ownerId: owner.value.ownerId,
          plan: newPlan,
          referrer: 'client',
          type: 'update' // creates session using setup mode
        })
      ).data;

      if (session.demo) return;

      let updateResult;

      if (
        newPlan.includes('premium') &&
        !planDetails.value.paymentMethodOnFile
      ) {
        const checkoutResult = await stripe.redirectToCheckout({
          sessionId: session.id
        });
        if (checkoutResult.error) {
          toast.error('An error occurred. Try again later.');
          console.error(checkoutResult.error);
        }
      } else {
        updateResult = (
          await http.post('/payment/update-subscription', {
            ownerId: owner.value.ownerId,
            newPlan,
            referrer: 'client'
          })
        ).data;
      }

      if (
        !updateResult.subUpdated &&
        updateResult.msg.toLowerCase().includes('no such subscription')
      ) {
        toast.open({
          type: 'error',
          duration: 0,
          dismissible: true,
          message:
            'Your subscription was not found. Please contact support or try again.'
        });
      } else if (!updateResult.subUpdated) {
        toast.open({
          type: 'error',
          duration: 0,
          dismissible: true,
          message:
            'Your subscription could not be changed right now.\nPlease contact support or try again.'
        });
      }

      if (updateResult.subUpdated) {
        store.dispatch('getPlanDetails');
        store.commit('updatePlanDetails');
        closePlanChange();

        const updateMsg = `<p>Subscription updated to <span class="font-semibold">${newPlan
          .charAt(0)
          .toUpperCase() +
          newPlan
            .slice(1)
            .replace('Mo', '')
            .replace('Yr', '')}</span></p>
            <p class="font-normal italic">
              ${
                newPlan.includes('Mo')
                  ? 'Billed monthly'
                  : newPlan.includes('Yr')
                  ? 'Billed annually'
                  : ''
              }
                </p>
              `;

        toast.open({
          type: 'success',
          duration: 5000,
          message: updateMsg
        });
      }
      return updateResult;
    }

    return {
      accountView,
      openPlanChange,
      closePlanChange,
      confirmPlanChange,
      planDetails
    };
  }
};
</script>
