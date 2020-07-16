<template>
  <file-pond
    name="test"
    ref="pond"
    label-idle="Drop files here..."
    v-bind:allow-multiple="true"
    accepted-file-types="image/jpeg, image/png"
    server="/api"
    v-bind:files="myFiles"
    v-on:init="handleFilePondInit"
  />
</template>

<script>
import vueFilePond from 'vue-filepond';
import 'filepond/dist/filepond.min.css';
import 'filepond-plugin-image-preview/dist/filepond-plugin-image-preview.min.css';
import FilePondPluginFileValidateType from 'filepond-plugin-file-validate-type';
import FilePondPluginFileValidateSize from 'filepond-plugin-file-validate-size';
import FilePondPluginImagePreview from 'filepond-plugin-image-preview';

const FilePond = vueFilePond(
  FilePondPluginFileValidateType,
  FilePondPluginImagePreview,
  FilePondPluginFileValidateSize
);

export default {
  components: {
    FilePond,
  },
};
</script>

<style></style>
