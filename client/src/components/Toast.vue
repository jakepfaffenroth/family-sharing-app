<template>
  <div>
    <button @click="toast">Toast</button>
    <div
      id="snackbar"
      class="hidden fixed z-50 right-48 top-6 p-4 bg-gray-700 text-white rounded-md transition duration-300 ease-in-out"
    >
      Some text some message..
    </div>
  </div>
</template>

<script>
export default {
  methods: {
    toast() {
      //   const toast = document.getElementById('snackbar');
      //   toast.classList.toggle('hidden');
      //   // Add the "show" class to DIV
      //   //   toast.className = 'show';
      //   setTimeout(function() {
      //     toast.classList.toggle('hidden');
      //     // toast.className = toast.className.replace('show', '');
      //   }, 3000);
    },
  },
};
</script>

<style>
/* The snackbar - position it at the bottom and in the middle of the screen */
#snackbarX {
  @apply hidden fixed z-50 right-48 top-6 p-4 bg-gray-900 text-white rounded;
  /* visibility: hidden; Hidden by default. Visible on click */
  min-width: 250px; /* Set a default minimum width */
  margin-left: -125px; /* Divide value of min-width by 2 */
  /* background-color: #333; Black background color */
  /* color: #fff; White text color */
  text-align: center; /* Centered text */
  /* border-radius: 2px; Rounded borders */
  /* padding: 16px; Padding */
  /* position: fixed; Sit on top of the screen */
  /* z-index: 1; Add a z-index if needed */
  /* left: 50%; Center the snackbar */
  /* bottom: 30px; 30px from the bottom */
}

/* Show the snackbar when clicking on a button (class added with JavaScript) */
#snackbar.show {
  /* @apply visible; Show the snackbar */
  /* Add animation: Take 0.5 seconds to fade in and out the snackbar.
  However, delay the fade out process for 2.5 seconds */
  -webkit-animation: fadein 0.5s, fadeout 0.5s 2.5s;
  animation: fadein 0.5s, fadeout 0.5s 2.5s;
}

/* Animations to fade the snackbar in and out */
@-webkit-keyframes fadein {
  from {
    bottom: 0;
    opacity: 0;
  }
  to {
    bottom: 30px;
    opacity: 1;
  }
}

@keyframes fadein {
  from {
    bottom: 0;
    opacity: 0;
  }
  to {
    bottom: 30px;
    opacity: 1;
  }
}

@-webkit-keyframes fadeout {
  from {
    bottom: 30px;
    opacity: 1;
  }
  to {
    bottom: 0;
    opacity: 0;
  }
}

@keyframes fadeout {
  from {
    bottom: 30px;
    opacity: 1;
  }
  to {
    bottom: 0;
    opacity: 0;
  }
}
</style>
