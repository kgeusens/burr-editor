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
        <PuzzleBrowser @newShape="loadShape"/>
    </v-navigation-drawer>
    <v-main id="main">
      <v-card width="100%" height="100%" title="title">
        <BabylonEngine>
          <BabylonScene>
            <BabylonCamera id="1">
              <BabylonView width="300" height="300">
              </BabylonView>
            </BabylonCamera>
          </BabylonScene>
        </BabylonEngine>
<!--        
        <BabylonMainScene height="parent" width="parent" :shape="shape"/>
-->
      </v-card>
    </v-main>
  </v-app>
</template>

<script>
import BabylonMainScene from "./components/BabylonMainScene.vue";
import PuzzleBrowser from "./components/PuzzleBrowser.vue"

import BabylonEngine from "./components/BabylonEngine.vue";
import BabylonScene from "./components/BabylonScene.vue";
import BabylonCamera from "./components/BabylonCamera.vue";
import BabylonView from "./components/BabylonView.vue";

export default {
  name: "App",
  data() {
    return { shape: {text:"hello world"}, drawer: false }
  },
  components: {
    PuzzleBrowser,
    BabylonMainScene,
    BabylonScene,
    BabylonEngine,
    BabylonCamera,
    BabylonView,
  },
  methods: {
    loadShape(s) { this.shape = s },
  },
  watch:{
    shape(newv, oldv) { 
    }
  },
  mounted() { 
  }
};
</script>
