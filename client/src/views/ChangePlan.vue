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
          <div id="basic" class="price-column">
            <ul>
              <p class="mb-1 text-xl font-semibold">
                Basic
              </p>
              <p class="text-teal-400 text-lg">
                Free!
              </p>
              <div class="m4-2 mb-4">
                <br />
              </div>
              <li>2 GB storage</li>
              <li>Reduced resolution images</li>
              <li>One album</li>
              <li>Private sharing link</li>
            </ul>
            <button-select-plan
              :btn-value="'Basic'"
              :reset-btns-except="resetBtnsExcept"
              :current-plan="planDetails.plan"
              @reset-other-btns="resetOtherBtns"
              @show-confirmation="showConfirmation"
            ></button-select-plan>
            <!-- <button class="btn plan-btn">
              Select
            </button> -->
          </div>
          <div id="premium" class="price-column">
            <p class="mb-1 text-xl font-semibold">
              Premium
            </p>
            <p class="text-teal-400  text-lg">
              $5
            </p>
            <div class="flex-wrap m4-2 mb-4">
              <div class="leading-none text-gray-400 text-xs font-thin">
                Per month
              </div>
              <div class="leading-none text-gray-400 text-xs font-thin mt-1">
                Billed monthly
              </div>
            </div>
            <ul>
              <li>10 GB storage</li>
              <li>Full resolution images</li>
              <li>Unlimited albums</li>
              <li>Private sharing link</li>
              <li>Guest downloads</li>
            </ul>
            <button-select-plan
              :btn-value="'Premium'"
              :reset-btns-except="resetBtnsExcept"
              :current-plan="planDetails.plan"
              @reset-other-btns="resetOtherBtns"
              @show-confirmation="showConfirmation"
            ></button-select-plan>
            <!-- <button class="btn plan-btn">
              Select
            </button> -->
          </div>
          <div id="premium-plus" class="price-column">
            <ul>
              <p class="mb-1 text-xl font-semibold">
                Premium Plus
              </p>
              <p class="text-teal-400 text-lg">
                $10
              </p>
              <div class="flex-wrap  m4-2 mb-4">
                <div class="leading-none text-gray-400 text-xs font-thin">
                  Per month
                </div>
                <div class="leading-none text-gray-400 text-xs font-thin mt-1">
                  Billed monthly
                </div>
              </div>
              <li>1 TB storage</li>
              <li>Full resolution images</li>
              <li>Unlimited albums</li>
              <li>Private sharing link</li>
              <li>Guest downloads</li>
            </ul>
            <button-select-plan
              :btn-value="'Premium Plus'"
              :reset-btns-except="resetBtnsExcept"
              :current-plan="planDetails.plan"
              @reset-other-btns="resetOtherBtns"
              @show-confirmation="showConfirmation"
            ></button-select-plan>
            <!-- <button class="btn plan-btn">
              {{ selected ? 'Selected' : 'Select' }}
            </button> -->
          </div>
        </div>
        <transition appear name="slide" mode="out-in">
          <div
            
            id="change-confirmation"
            class="flex justify-between mt-8 transition-all duration-150 ease-in"
            :class="showChangeConfirmation"
          >
            <div>
              <h3 class="font-semibold">
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
            <div class="flex self-end">
              <button
                class="btn bg-purple-600 hover:bg-purple-500"
                @click="$emit('confirm-plan-change', newPlan)"
              >
                Confirm change
              </button>
            </div>
          </div>
        </transition>
        <div class="flex flex-grow self-end mt-10">
          <button
            class="btn self-end bg-gray-600 hover:bg-gray-500"
            @click="$emit('close-plan-change')"
          >
            Cancel
          </button>
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

const ButtonSelectPlan = defineAsyncComponent(() =>
  import('../components/ButtonSelectPlan')
);
// import ButtonSelectPlan from '../components/ButtonSelectPlan';

export default {
  components: {
    ButtonSelectPlan
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

    const showChangeConfirmation = ref('transform -translate-y-2 invisible opacity-0');

    function showConfirmation(newPriceId) {
      newPlan.value = newPriceId;
      showChangeConfirmation.value = 'transform -translate-y-0 visible opacity-1';
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

.btn {
  @apply w-36 mt-4 px-3 py-1 text-center rounded shadow hover:shadow-lg transition duration-200 ease-in-out;
}

.plan-btn {
  @apply mt-4 bg-teal-600 hover:bg-teal-500;
}
</style>
