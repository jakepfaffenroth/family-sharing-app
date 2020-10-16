<template>
  <div ref="parent" class="h-screen p-6">
    <div
      id="price-form"
      class="flex justify-center w-full h-auto mx-auto my-6 overflow-hidden bg-white rounded-t-lg shadow-lg dark:bg-gray-800 sm:rounded-lg sm:w-4/5 text-white font-base font-thin overflow-y-auto"
      @close-modal="closeModal"
    >
      <div class="flex flex-col w-full mx-8 py-6">
        <h2 class="mb-6 text-center text-2xl font-semibold">
          Change your plan
        </h2>
        <div id="plan-columns" class="flex w-full text-center leading-relaxed">
          <div
            v-for="plan in plans"
            :id="plan.id"
            :key="plan.id"
            class="price-column"
          >
            <ul>
              <p class="mb-1 text-xl font-semibold">
                {{ plan.heading }}
              </p>
              <p class="text-teal-400 text-lg">
                {{ plan.price }}
              </p>
              <div
                v-if="plan.paymentSchedule"
                class="flex-wrap mb-4 leading-none text-gray-400 text-xs font-thin"
              >
                <div>
                  {{ plan.paymentSchedule[0] }}
                </div>
                <div class="mt-1">
                  {{ plan.paymentSchedule[1] }}
                </div>
              </div>
              <div v-else class="mb-4">
                <br />
              </div>
              <ol v-for="(item, index) in plan.features" :key="index">
                <li>{{ item }}</li>
              </ol>
            </ul>
            <account-plan-picker-button
              :btn-value="plan.heading"
              :reset-btns-except="resetBtnsExcept"
              :current-plan="planDetails.plan"
              @reset-other-btns="resetOtherBtns"
              @show-confirmation="showConfirmation"
            ></account-plan-picker-button>
          </div>
        </div>
        <transition appear name="slide" mode="out-in">
          <div
            id="change-confirmation"
            class="flex justify-between mt-8  bg-white rounded-lg text-gray-900 font-medium transition-all duration-150 ease-in"
            :class="showChangeConfirmation"
          >
            <div class="m-4">
              <h3 class="pb-2 font-bold text-lg">
                Are you sure you want to change plans?
              </h3>
              <p>
                Your subscription will change to the
                <span class="font-semibold text-teal-400">
                  {{ newPlan || 'new' }}
                </span>
                plan immediately.
              </p>
              <p>
                Your bill will be prorated accordingly.
              </p>
            </div>
            <div class="flex self-end m-3">
              <base-button-purple
                class="mt-4"
                @click="$emit('confirm-plan-change', newPlan)"
              >
                Confirm change
              </base-button-purple>
            </div>
          </div>
        </transition>
        <div class="flex flex-grow self-end mt-10">
          <base-button-cancel
            class="self-end"
            @click="$emit('close-plan-change')"
          >
            Cancel
          </base-button-cancel>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import {
  ref,
  reactive,
  inject,
  onMounted,
  onBeforeUpdate,
  defineAsyncComponent
} from 'vue';
import { useRouter } from 'vue-router';
import BaseButtonPurple from '../components/BaseButtonPurple';
import BaseButtonCancel from '../components/BaseButtonCancel';

const AccountPlanPickerButton = defineAsyncComponent(() =>
  import('./AccountPlanPickerButton')
);

export default {
  components: {
    BaseButtonPurple,
    BaseButtonCancel,
    AccountPlanPickerButton
  },
  props: {
    planDetails: {
      type: Object,
      default: () => {
        return {};
      }
    }
  },
  emits: ['confirm-plan-change', 'close-modal', 'close-plan-change'],
  setup(props, context) {
    const parent = ref(null);
    const router = useRouter();

    const plans = {
      basic: {
        id: 'basic',
        heading: 'Basic',
        price: 'Free!',
        paymentSchedule: null,
        features: [
          '2 GB storage',
          'Reduced resolution images',
          'One album',
          'Private sharing link'
        ]
      },
      premium: {
        id: 'premium',
        heading: 'Premium',
        price: '$5',
        paymentSchedule: ['Per month', 'Billed monthly'],
        features: [
          '10 GB storage',
          'Full resolution images',
          'Unlimited album',
          'Private sharing link',
          'Guest downloads'
        ]
      },
      premiumPlus: {
        id: 'premium-plus',
        heading: 'Premium Plus',
        price: '$10',
        paymentSchedule: ['Per month', 'Billed monthly'],
        features: [
          '1 TB storage',
          'Full resolution images',
          'Unlimited album',
          'Private sharing link',
          'Guest downloads'
        ]
      }
    };

    // onMounted(() => {
    //   parent.value.scrollIntoView({ behavior: 'smooth' });
    // });

    const newPlan = ref('');

    const getCurrentPlan = inject('getCurrentPlan');

    getCurrentPlan();

    function closeModal() {
      context.emit('close-plan-change');
      // hideConfirmation();
      // router.go(-1);
    }

    function getParentId(child) {
      return child.parentElement.id;
    }

    const showChangeConfirmation = ref(
      'transform -translate-y-2 invisible opacity-0'
    );

    function showConfirmation(newPriceId) {
      newPlan.value = newPriceId;
      showChangeConfirmation.value =
        'transform -translate-y-0 visible opacity-1';
      // document
      //   .getElementById('change-confirmation')
      //   .classList.remove('hidden', 'opacity-0');
    }

    function hideConfirmation() {
      howChangeConfirmation.value = false;
    }

    const resetBtnsExcept = ref('');
    function resetOtherBtns(selectedBtn) {
      resetBtnsExcept.value = selectedBtn;
    }
    return {
      parent,
      plans,
      newPlan,
      closeModal,
      showConfirmation,
      showChangeConfirmation,
      resetOtherBtns,
      resetBtnsExcept
    };
  }
};
</script>

<style scoped>
.price-column {
  @apply flex flex-col w-1/3 mx-3 justify-between items-center;
}

.plan-btn {
  @apply mt-4 bg-teal-600 hover:bg-teal-500;
}
</style>
