<template>
  <v-app>
    <v-app-bar>
      <v-app-bar-nav-icon variant="text" @click.stop="drawer = !drawer"></v-app-bar-nav-icon>
      <v-toolbar-title>Burr Editor</v-toolbar-title>
    </v-app-bar>
    <v-navigation-drawer
        v-model="drawer"
        temporary
      >
        <PuzzleBrowser @newShape="test"/>
      </v-navigation-drawer>
    <v-main>
      <v-card id="babylon" height="700px" :title="getWidth()">
        <BabylonScene :shape="shape"/>
       </v-card>
    </v-main>
  </v-app>
</template>

<script>
import BabylonScene from "./components/BabylonScene.vue";
import PuzzleBrowser from "./components/PuzzleBrowser.vue"

export default {
  name: "App",
  data() {
    return { shape: {text:"hello world"}, drawer: false }
  },
  components: {
    PuzzleBrowser,
    BabylonScene,
  },
  methods: {
    test(s) { this.shape = s },
    getWidth() { let el = document.getElementById("babylon"); return el?el.clientWidth + " ":"0" }
  },
  watch:{
    shape(newv, oldv) { 
    }
  }
};
</script>
