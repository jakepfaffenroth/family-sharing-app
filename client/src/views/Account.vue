<template>
  <account-menu></account-menu>

  <transition appear name="slide" mode="out-in">
    <component
      :is="accountView"
      v-if="planDetails"
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
import AccountMenu from '../components/AccountMenu';
import AccountSummary from '../components/AccountSummary';
import AccountPlanPicker from '../components/AccountPlanPicker';

import {
  ref,
  reactive,
  computed,
  shallowRef,
  inject,
  onBeforeMount
} from 'vue';
import { useRoute } from 'vue-router';
import { useStore } from 'vuex';

export default {
  name: 'Account',
  components: { AccountMenu, AccountSummary, AccountPlanPicker },
  inheritAttrs: false,
  setup(props) {
    const store = useStore();
    const accountView = shallowRef(AccountSummary);
    const route = useRoute();
    const server = process.env.VUE_APP_SERVER;
    const toast = inject('toast');

    const owner = computed(() => store.state.ownerStore.owner);
    const usage = computed(() => store.state.planStore.usage);
    const { goToChangePlan } = route.params;
    // const elementClasses = reactive({});

    const planDetails = computed(() => store.getters.planDetails);

    if (!planDetails.value) {
      (async () => {
        await store.dispatch('getPlanDetails');
      })();
    }

    // elementClasses.planModal = 'invisible opacity-0';
    // elementClasses.pricesForm = 'hidden opacity-0';

    // Open straight into plan picker if goToChangePlan is true
    onBeforeMount(async () => {
      goToChangePlan ? openPlanChange() : null;
    });

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
          ownerId: owner.value.ownerId,
          newPriceId: newPriceId
        }
      );
      const data = response.data;
      if (
        !data.subUpdated &&
        data.msg.toLowerCase().includes('no such subscription')
      ) {
        toast.open({
          type: 'error',
          duration: 0,
          dismissible: true,
          message:
            'Your subscription was not found. Please contact support or try again.'
        });
        // document.getElementById('toast-message').innerText =
        //   'Your subscription was not found. Please contact support or try again.';
      } else if (!data.subUpdated) {
        toast.open({
          type: 'error',
          duration: 0,
          dismissible: true,
          message:
            'Your subscription could not be changed right now.\nPlease contact support or try again.'
        });
        // document.getElementById('msg-text').innerText =
        //   'Your subscription could not be changed right now.\nPlease contact support or try again.';
      }
      if (data.subUpdated) {
        store.dispatch('getPlanDetails');
        // getCurrentPlan(owner.value.ownerId);
        closePlanChange();

        toast.open({
          type: 'success',
          duration: 5000,
          // dismissible: true,
          message: 'Subscription updated to ' + newPriceId
        });

        // document.getElementById('msg-text').innerText =
        //   'Subscription updated to ' + newPriceId;
      }
      return response.data;
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
