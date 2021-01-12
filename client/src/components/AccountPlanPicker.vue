<template>
  <div class="px-3 sm:px-8 md:px-10 md:mt-8">
    <div
      v-if="planDetails"
      id="price-form"
      class="flex justify-center w-full h-auto mx-auto my-6 overflow-hidden rounded-lg shadow-lg bg-gray-800 lg:w-4/5 xl:w-3/5 text-white font-base font-thin overflow-y-auto"
      @close-modal="closeModal"
    >
      <div class="flex flex-col w-full px-4 pr-3 sm:px-8 md:px-8 py-6">
        <h2 class="mb-6 text-center text-lg sm:text-2xl font-semibold">
          Choose a plan
        </h2>
        <transition appear name="slide" mode="out-in">
          <div
            id="change-confirmation"
            ref="confirmationBox"
            data-test="planChangeConfirmation"
            class="flex flex-col justify-between -mx-2 sm:mx-0 mb-8 bg-white rounded-lg shadow text-gray-900 font-medium transition-all duration-150 ease-in"
            :class="showChangeConfirmation"
          >
            <div class="p-4">
              <h3 class="pb-2 font-bold text-lg">
                Ready to switch to
                <span
                  :class="
                    newPlan.name.toLowerCase().includes('premium')
                      ? 'font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-teal-400 to-orange-400 via-purple-400'
                      : 'font-semibold text-teal-400'
                  "
                >
                  Carousel {{ capitalizedPlanName }}
                </span>
                ?
              </h3>
              <p v-if="newPlan.name.includes('premium')">
                {{ newPlan.price }}
                {{ newPlan.paymentSchedule[0].toLowerCase() }},
                {{ newPlan.paymentSchedule[1].toLowerCase() }}
              </p>
              <p>
                You plan will change immediately and your next bill will be prorated.
              </p>
              <p
                v-if="
                  newPlan.name.includes('premium') &&
                    !planDetails.paymentMethodOnFile
                "
              >
                Continue to enter payment details.
              </p>
            </div>
            <div
              class="flex flex-row-reverse sm:justify-start px-4 py-3 space-x-4"
            >
              <base-button-cancel
                class=" md:hidden self-end"
                :shade="'lighter'"
                @click="$emit('close-plan-change')"
              >
                Cancel
              </base-button-cancel>
              <base-button-purple
                data-test="confirmPlanChangeBtn"
                @click="$emit('confirm-plan-change', newPlan.name)"
              >
                Continue
              </base-button-purple>
            </div>
          </div>
        </transition>
        <div
          id="plan-columns"
          class="flex flex-col md:flex-row w-full text-center text-sm sm:text-base leading-relaxed"
        >
          <div
            v-for="plan in plans"
            :id="plan.name"
            :key="plan.name"
            class="flex md:flex-col mb-8 md:mb-0 md:w-1/3 md:mx-3 justify-between items-start md:items-center"
          >
            <div class="flex flex-col w-2/3 md:w-full">
              <div class="flex md:flex-col">
                <p
                  class="mr-6 md:mr-0 mb-1 text-lg sm:text-xl font-semibold text-left md:text-center leading-tight"
                >
                  {{ plan.heading }}
                </p>
                <div class="flex flex-wrap md:block">
                  <p class="mr-2 md:mr-0 text-teal-400 text-lg">
                    {{ plan.price }}
                  </p>
                  <p
                    v-if="plan.paymentSchedule"
                    class="my-auto leading-none text-gray-400 text-xs font-thin text-left sm:text-center"
                  >
                    {{ plan.paymentSchedule[0] }}
                  </p>
                  <div v-else class="hidden md:block mb-4"></div>
                  <br />
                </div>
              </div>
              <div
                class="flex md:flex-col flex-wrap w-full justify-between text-left md:text-center"
              >
                <ul>
                  <ol v-for="(item, index) in plan.features" :key="index">
                    <li>{{ item }}</li>
                  </ol>
                </ul>
              </div>
            </div>
            <account-plan-picker-button
              :plan="plan.heading"
              :btn-value="plan.name"
              :reset-btns-except="resetBtnsExcept"
              :current-plan="planDetails.plan"
              :data-test="plan.name + 'Btn'"
              @reset-other-btns="resetOtherBtns"
              @show-confirmation="showConfirmation"
            ></account-plan-picker-button>
          </div>
        </div>

        <div class="flex flex-grow self-end md:mt-10">
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
import { ref, computed, reactive } from 'vue';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';
import BaseButtonPurple from '../components/BaseButtonPurple';
import BaseButtonCancel from '../components/BaseButtonCancel';
import AccountPlanPickerButton from '../components/AccountPlanPickerButton';

export default {
  components: {
    BaseButtonPurple,
    BaseButtonCancel,
    AccountPlanPickerButton
  },
  emits: ['confirm-plan-change', 'close-modal', 'close-plan-change'],
  setup(props, { emit }) {
    const store = useStore();
    const router = useRouter();

    const plans = [
      {
        name: 'basic',
        heading: 'Basic',
        price: 'Free!',
        paymentSchedule: ['Upgrade anytime'],
        features: [
          '500 photos',
          'Compressed images',
          'One album',
          'Private sharing link'
        ]
      },
      {
        name: 'premiumMo',
        heading: 'Premium',
        price: '$5',
        paymentSchedule: ['Per month', 'Billed monthly'],
        features: [
          '5,000 photos',
          'Compressed images',
          'Unlimited albums',
          'Private sharing link',
          'Guest downloads'
        ]
      },
      {
        name: 'premiumYr',
        heading: 'Premium Plus',
        price: '$10',
        paymentSchedule: ['Per month', 'Billed monthly'],
        features: [
          '10,000 photos',
          'Full resolution images',
          'Unlimited albums',
          'Private sharing link',
          'Guest downloads'
        ]
      }
    ];

    const confirmationBox = ref('');
    const newPlan = ref({ name: '' });
    const capitalizedPlanName = ref('');

    const planDetails = computed(() => store.getters.planDetails);
    store.dispatch('getPlanDetails');
    const currentPlan = computed(() => {
      plans.find(x => x.heading.toLowerCase() === '');
    });

    function closeModal() {
      emit('close-plan-change');
    }

    const showChangeConfirmation = ref(
      'transform -translate-y-2 invisible opacity-0 h-0'
    );

    function showConfirmation(plan) {
      newPlan.value = plans.find(x => x.name === plan);

      if (plan.includes('basic')) {
        capitalizedPlanName.value = 'Basic';
      } else if (plan.includes('premium')) {
        capitalizedPlanName.value = 'Premium';
      }

      showChangeConfirmation.value =
        'transform -translate-y-0 visible opacity-100';
      if (window.innerWidth < 640) {
        confirmationBox.value.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        });
      }
    }

    function hideConfirmation() {
      howChangeConfirmation.value = false;
    }

    const resetBtnsExcept = ref(null);
    function resetOtherBtns(selectedBtn) {
      resetBtnsExcept.value = selectedBtn;
    }
    return {
      planDetails,
      plans,
      newPlan,
      capitalizedPlanName,
      closeModal,
      showConfirmation,
      showChangeConfirmation,
      confirmationBox,
      resetOtherBtns,
      resetBtnsExcept
    };
  }
};
</script>
