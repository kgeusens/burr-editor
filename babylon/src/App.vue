<template>
  <PuzzleBrowser />
  <BabylonScene />
</template>

<script>
import BabylonScene from "./components/BabylonScene.vue";
import PuzzleBrowser from "./components/PuzzleBrowser.vue"

export default {
  name: "App",
  components: {
    PuzzleBrowser,
    BabylonScene,
  },
};
</script>
