<template>
  <v-app>
    <v-main>
    <PuzzleBrowser @newShape="test"/>
    <BabylonScene :shape="shape"/>
    </v-main>
  </v-app>
</template>

<script>
import BabylonScene from "./components/BabylonScene.vue";
import PuzzleBrowser from "./components/PuzzleBrowser.vue"

export default {
  name: "App",
  data() {
    return { shape: {text:"hello world"} }
  },
  components: {
    PuzzleBrowser,
    BabylonScene,
  },
  methods: {
    test(s) { this.shape = s },
  },
  watch:{
    shape(newv, oldv) { 
    }
  }
};
</script>
