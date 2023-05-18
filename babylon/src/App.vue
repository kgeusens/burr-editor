<template>
  <v-app>
    <v-app-bar density="compact">
      <v-app-bar-nav-icon id="main-menu-activator" variant="text"></v-app-bar-nav-icon>
      <v-toolbar-title>
        {{ fileName ? fileName : "Burr Editor"}}
      </v-toolbar-title>
      <template v-if="puzzle.shapes" v-slot:extension>
        <v-tabs grow color="purple" v-model="tab">
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

    <v-menu activator="#main-menu-activator">
      <v-list>
        <v-list-item value="new" prependIcon="mdi-file-outline" title="New puzzle"/>
        <v-divider></v-divider>
        <v-list-item value="load" prependIcon="mdi-folder-open" title="Load local puzzle" @click="showLoadLocalFile++"/>
        <v-list-item value="loadPWBP" prependIcon="mdi-folder-open" title="Explore PuzzleWillBePlayed " @click="showPWBPDialog++"/>
        <v-list-item value="loadServer" prependIcon="mdi-folder-open" title="Load from server" @click="showServerDialog++"/>
        <v-divider></v-divider>
        <v-list-item :disabled="!puzzle.shapes" value="download" prependIcon="mdi-download" title="Download puzzle" @click="saveLocal"/>
        <v-list-item :disabled=true value="upload" prependIcon="mdi-upload" title="Upload puzzle"/>
      </v-list>
    </v-menu>

    <LocalFileDialog :show="showLoadLocalFile" @newShape="loadPuzzle" @newName="setFilename">
    </LocalFileDialog>

    <PWBPDialog :show="showPWBPDialog" @newShape="loadPuzzle" @newName="setFilename">
    </PWBPDialog>

    <v-main v-show="tab == 'puzzle' && puzzle.shapes">
      <v-navigation-drawer
        width="450"
        class="pa-2"
        v-model="drawer"
        temporary
        >
        <PuzzleDrawer :puzzle="puzzle" @newShape="loadShape" @setReadOnly="setReadOnly"/>
      </v-navigation-drawer>
      <v-layout-item model-value position="top" class="text-start" size="0">
        <div class="ma-4">
          <v-btn @click.stop="drawer = !drawer" icon="mdi-arrow-right" size="small" elevation="4" />
        </div>
      </v-layout-item>
      <v-card width="100%" height="100%">
        <BabylonEngine>
          <BabylonScene>
            <BabylonSceneModel :model=VoxelEditor :detail=shapeDetail @newState=updateShapeState>
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
import PuzzleDrawer from "./components/PuzzleDrawer.vue"
import LocalFileDialog from "./components/LocalFileDialog.vue"
import PWBPDialog from './components/PWBPDialog.vue'
import BabylonEngine from "./components/babylon/BabylonEngine.vue";
import BabylonScene from "./components/babylon/BabylonScene.vue";
import BabylonSceneModel from "./components/babylon/BabylonSceneModel.vue";
import BabylonCamera from "./components/babylon/BabylonCamera.vue";
import BabylonView from "./components/babylon/BabylonView.vue";
import { sceneBuilder } from "./scenes/ShapeEditor.js";

export default {
  name: "App",
  data() {
    return { 
      puzzle: {}, 
      shape: null,
      fileName: "", 
      VoxelEditor: sceneBuilder, 
      drawer: false, 
      tab: "",
      showLoadLocalFile: 0,
      showPWBPDialog: 0,
      showServerDialog: 0,
      readOnly: true,
    }
  },
  components: {
    PuzzleDrawer,
    LocalFileDialog,
    PWBPDialog,
    BabylonScene,
    BabylonSceneModel,
    BabylonEngine,
    BabylonCamera,
    BabylonView,
  },
  methods: {
    loadShape(s) {
      this.shape = s
    },
    setReadOnly(b) {
      this.readOnly = b
    },
    loadPuzzle(p) {
      this.puzzle = p
    },
    setFilename(f) {
      this.fileName = f
    },
    updateShapeState(s) {
      if (this.shape) {
        if ( this.shape.x !== s.x || this.shape.y !== s.y || this.shape.z !== s.z ) {
          this.shape.setSize(s.x, s.y, s.z)
        }
        this.shape.stateString = s.stateString
      }
    },
    async saveLocal() {
      console.log("saving")
      let a = document.createElement("a")
      let blob = new Blob([this.puzzle.saveToXML()], { type: 'text/plain' });
      const cs = new CompressionStream("gzip")
      const gzipStream = blob.stream().pipeThrough(cs)
      const xmpuzzle = await new Response(gzipStream).blob()

      let url = window.URL.createObjectURL(xmpuzzle)
      a.href = url
      a.download = this.fileName + ".xmpuzzle"
      a.click()
      window.URL.revokeObjectURL(url)
    },
  },
  computed: {
    shapeSize() {
      if (this.shape) return { x: this.shape.x, y: this.shape.y, z: this.shape.z }
      else return { x:0, y:0, z:0 }
    },
    shapeDetail() {
      return { shape: this.shape, size: this.shapeSize, readOnly: this.readOnly }
    }
  },
  watch:{
    shape(newv, oldv) { 
    },
    showLoadLocalFile(newv, oldv) {
    },
    shapeSize(newv) {
    },
  },
  mounted() { 
  }
};
</script>

