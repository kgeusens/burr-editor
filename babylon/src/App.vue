<template>
  <v-app>
    <v-app-bar density="compact">
      <v-app-bar-nav-icon variant="text" @click.stop="drawer = !drawer"></v-app-bar-nav-icon>
      <v-toolbar-title>
        Burr Editor
      </v-toolbar-title>
      <template v-slot:extension>
        <v-tabs color="purple" v-model="tab" align-tabs="title">
          <v-tab key="1" value="puzzle" :border="tab == 'puzzle'" >
            Puzzle
          </v-tab>
          <v-tab key="2" value="problems" :border="tab == 'problems'">
            Problems
          </v-tab>
          <v-tab key="3" value="solutions" :border="tab == 'solutions'">
            Solution
          </v-tab>
        </v-tabs>
      </template>
    </v-app-bar>

    <v-main v-show="tab == 'puzzle'">
      <v-navigation-drawer 
        class="pa-2"
        v-model="drawer"
        temporary
        >
        <PuzzleBrowser @newShape="loadShape"/>
      </v-navigation-drawer>
      <v-layout-item model-value position="top" class="text-start" size="0">
        <div class="ma-4">
          <v-btn @click.stop="drawer = !drawer" icon="mdi-arrow-right" size="small" elevation="4" />
        </div>
      </v-layout-item>
      <v-card width="100%" height="100%">
        <BabylonEngine>
          <BabylonScene>
            <BabylonSceneModel :model=VoxelEditor :detail=shape>
            </BabylonSceneModel>
            <BabylonCamera id="1">
              <BabylonView width="parent" height="parent">
              </BabylonView>
            </BabylonCamera>
          </BabylonScene>
        </BabylonEngine>
      </v-card>
    </v-main>
  </v-app>
</template>

<script>
import PuzzleBrowser from "./components/PuzzleBrowser.vue"
import BabylonEngine from "./components/BabylonEngine.vue";
import BabylonScene from "./components/BabylonScene.vue";
import BabylonSceneModel from "./components/BabylonSceneModel.vue";
import BabylonCamera from "./components/BabylonCamera.vue";
import BabylonView from "./components/BabylonView.vue";
import { sceneBuilder } from "./scenes/ShapeEditor.js";

export default {
  name: "App",
  data() {
    return { puzzle: {}, shape: {}, VoxelEditor: sceneBuilder, drawer: false, rail: true, tab: null }
  },
  components: {
    PuzzleBrowser,
    BabylonScene,
    BabylonSceneModel,
    BabylonEngine,
    BabylonCamera,
    BabylonView,
  },
  methods: {
    loadShape(s) { this.shape = s },
  },
  watch:{
    shape(newv, oldv) { 
    },
  },
  mounted() { 
  }
};
</script>

