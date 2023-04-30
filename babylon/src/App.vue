<template>
  <v-app>
    <v-app-bar>
      <v-app-bar-nav-icon variant="text" @click.stop="drawer = !drawer"></v-app-bar-nav-icon>
      <v-toolbar-title>Burr Editor</v-toolbar-title>
    </v-app-bar>
    <v-navigation-drawer
        v-model="drawer"
        permanent
      >
        <PuzzleBrowser @newShape="test"/>
      </v-navigation-drawer>
    <v-main id="main">
      <v-card width="100%" height="100%" title="title">
        <BabylonScene height="parent" width="parent" :shape="shape"/>
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
  },
  watch:{
    shape(newv, oldv) { 
    }
  },
  mounted() { 
  }
};
</script>
