/<template>
  <h1>Welcome Back, {{ owner.firstName }}</h1>
  <nav id="owner-menu">
    <button @click="logout" class="link">Log out</button>
    <button @click="ownerShare" class="link">Share</button>
    <button @click="nuke" class="link">Nuke</button>
    <download-zip :images="images" />
    <uppy :owner="owner" @update-images="updateImages"></uppy>
  </nav>
</template>

<script>
import Uppy from './Uppy';
import DownloadZip from './DownloadZip';
export default {
  components: {
    Uppy,
    DownloadZip,
  },
  props: { owner: Object },
};
</script>

<style></style>
