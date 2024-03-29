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
          <v-tab v-if="solution" key="3" value="solutions" :border="tab == 'solutions'">
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
        <v-list-item :disabled="!puzzle.shapes" value="export" prependIcon="mdi-export" title="Export to OBJ" @click="exportOBJ"/>
        <v-list-item :disabled=true value="upload" prependIcon="mdi-upload" title="Upload puzzle"/>
      </v-list>
    </v-menu>

    <LocalFileDialog :show="showLoadLocalFile" @newShape="loadPuzzle" @newName="setFilename">
    </LocalFileDialog>

    <PWBPDialog :show="showPWBPDialog" @newShape="loadPuzzle" @newName="setFilename">
    </PWBPDialog>

    <v-main >
      <v-navigation-drawer 
        v-if="tab == 'puzzle' && puzzle.shapes"
        id="puzzleDrawer"
        key="puzzleDrawer"
        width="450"
        class="pa-2"
        v-model="drawer"
        temporary
        :scrim=false
        >
        <PuzzleDrawer :puzzle="puzzle" @newShape="loadShape" @setReadOnly="setReadOnly">
        </PuzzleDrawer>
      </v-navigation-drawer>
      <v-navigation-drawer 
        v-if="tab == 'problems' && puzzle.shapes"
        id="problemDrawer"
        key="problemDrawer"
        width="450"
        class="pa-2"
        v-model="drawer"
        temporary
        :scrim=false
        >
        <ProblemDrawer :puzzle="puzzle" v-model:problemIndex="problemIndex" @solvedPuzzle="setSolutions"/>
      </v-navigation-drawer>
      <v-navigation-drawer 
        v-if="tab == 'solutions' && puzzle.shapes"
        id="solutionDrawer"
        key="solutionDrawer"
        width="450"
        class="pa-2"
        v-model="drawer"
        temporary
        :scrim=false
        >
        <SolutionDrawer :puzzle="puzzle" @playerAction="playerAction" @update:pieceColors="updatePieceColors" v-model:problemIndex="problemIndex" v-model:solutionIndex="solutionIndex" v-model:playerMove="solutionMove"/>
      </v-navigation-drawer>

      <v-layout-item position="top" class="text-start" size="0">
        <div class="ma-4">
          <span v-if=drawer style="display:inline-block;width:450px"></span>
          <v-btn @click.stop="drawer = !drawer" icon="mdi-arrow-left-right" size="small" elevation="4" />
        </div>
      </v-layout-item>

      <v-card width="100%" height="100%">
        <Suspense>
        <BabylonEngine>
          <BabylonCanvas width="parent" height="parent">
            <BabylonScene>
              <BabylonSceneModel :model=VoxelEditor :detail=shapeDetail @newState=updateShapeState>
              </BabylonSceneModel>
              <BabylonCamera id="1">
                <BabylonView :enabled="tab == 'puzzle'">
                </BabylonView>
              </BabylonCamera>
            </BabylonScene>
            <BabylonScene>
              <BabylonSceneModel :model=ProblemViewer :detail=problemDetail>
              </BabylonSceneModel>
              <BabylonCamera id="2">
                <BabylonView :enabled="tab == 'problems'">
                </BabylonView>
              </BabylonCamera>
            </BabylonScene>
            <BabylonScene>
              <BabylonSceneModel ref="player" :model=SolutionViewer :detail=solutionDetail>
              </BabylonSceneModel>
              <BabylonCamera id="3">
                <BabylonView :enabled="tab == 'solutions'">
                </BabylonView>
              </BabylonCamera>
            </BabylonScene>
          </BabylonCanvas>
        </BabylonEngine>
        </Suspense>

      </v-card>
    </v-main>

</v-app>
</template>

<script>
import PuzzleDrawer from "./components/PuzzleDrawer.vue"
import ProblemDrawer from "./components/ProblemDrawer.vue"
import SolutionDrawer from "./components/SolutionDrawer.vue"
import LocalFileDialog from "./components/LocalFileDialog.vue"
import PWBPDialog from './components/PWBPDialog.vue'
import BabylonEngine from "./components/babylon/BabylonEngine.vue";
import BabylonScene from "./components/babylon/BabylonScene.vue";
import BabylonSceneModel from "./components/babylon/BabylonSceneModel.vue";
import BabylonCamera from "./components/babylon/BabylonCamera.vue";
import BabylonView from "./components/babylon/BabylonView.vue";
import BabylonCanvas from "./components/babylon/BabylonCanvas.vue";
import { sceneBuilder } from "./scenes/ShapeEditor.js";
// import { sceneBuilder as bodyBuilder } from "./scenes/ShapeBody.js";
import { sceneBuilder as problemBuilder } from "./scenes/ProblemSummary.js";
import { sceneBuilder as solutionBuilder } from "./scenes/SolutionSummary.js";
import { Problem, Puzzle } from "@kgeusens/burr-data";
import { pieceColor } from "./utils/colors"

export default {
  name: "App",
  data() {
    return { 
      puzzle: new Puzzle(), 
      shapeIndex: 0,
      problemIndex: [0],
      solutionIndex: [0],
      solutionMove: 0,
      pieceColors:[],
      problemTrigger:0,
      fileName: "", 
      VoxelEditor: sceneBuilder,
      ProblemViewer: problemBuilder,
      SolutionViewer: solutionBuilder,
//      BodyViewer: bodyBuilder,
      drawer: false, 
      tab: "",
      showLoadLocalFile: 0,
      showPWBPDialog: 0,
      showServerDialog: 0,
      readOnly: true,
      player: null,
    }
  },
  components: {
    PuzzleDrawer,
    ProblemDrawer,
    SolutionDrawer,
    LocalFileDialog,
    PWBPDialog,
    BabylonScene,
    BabylonSceneModel,
    BabylonEngine,
    BabylonCamera,
    BabylonView,
    BabylonCanvas,
  },
  methods: {
    loadShape(i) {
      this.shapeIndex = i
    },
    setSolutions(p) {
      this.loadPuzzle(p)
    },
    setReadOnly(b) {
      this.readOnly = b
    },
    loadPuzzle(p) {
      this.puzzle = p
      this.problemIndex = [0]
      this.solutionIndex= [0]
      this.solutionMove = 0
    },
    playerAction(action, options) {
      if (this.$refs.player) this.$refs.player.execute(action, options)
    },
    setFilename(f) {
      this.fileName = f
    },
    updatePieceColors(c) {
      this.pieceColors=[...c]
    },
    updateShapeState(s) {
      if (this.shape) {
        if ( this.shape.x !== s.x || this.shape.y !== s.y || this.shape.z !== s.z ) {
          this.shape.setSize(s.x, s.y, s.z)
        }
        this.shape.stateString = s.stateString
        this.problemTrigger++
      }
    },
    async saveLocal() {
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
    async exportOBJ() {
      let a = document.createElement("a")
      for (let shape of this.puzzle.shapes.voxel) {
        let blob = new Blob([shape.toOBJ()], { type: 'text/plain' });
        let url = window.URL.createObjectURL(blob)
        a.href = url
        a.download = this.fileName + " - " + shape.name + ".obj"
        a.click()
        window.URL.revokeObjectURL(url)
      }
    },
  },
  computed: {
    shapeSize() {
      if (this.shape) return { x: this.shape.x, y: this.shape.y, z: this.shape.z }
      else return { x:0, y:0, z:0 }
    },
    shape() {
      return this.puzzle.shapes.voxel[this.shapeIndex]
    },
    problem() { 
      return this.puzzle.problems.problem[this.problemIndex[0]]
    },
    solution() {
      return this.problem.solutions.solution[this.solutionIndex[0]]
    },
    shapeDetail() {
      return { shape: this.shape, size: this.shapeSize, readOnly: this.readOnly }
    },
    problemPieces() {
      let arr=[]
      for (let shape of this.problem.shapes.shape) {
        if (shape.count >0 && shape.id != this.problem.result.id) arr.push(this.puzzle.shapes.voxel[shape.id])
      }
      return arr
    },
    solutionPositions() {
      return this.solution?this.solution.separation[0].movePositionsAll:[]
    },
    problemDetail() {
      return { shape: this.puzzle.shapes.voxel[this.problem.result.id], pieces: this.problemPieces, delta: 0, bevel: 0, alpha: 1, outline: true, trigger: this.problemTrigger }
    },
    solutionDetail() {
      return { 
        puzzle: this.puzzle,
        solution: this.solution,
        problem: this.problem,
        pieceColors: this.pieceColors,
//        movePositions: this.solutionPositions,
        delta: 0.01, 
        bevel: 0.04, 
        alpha: 1, 
        outline: false}
    }
  },
  watch:{
    shape(newv, oldv) { 
    },
    showLoadLocalFile(newv, oldv) {
    },
    shapeSize(newv) {
    },
    problemIndex(newv) {
    },
    problemPieces(newv, oldv) {
    },
    problem(newv, oldv) {
    },
    problemDetail(newv) {
    },
    puzzle(newv) {
    },
    solutionIndex(newv) {
        this.solutionMove=0;
    },
  },
  mounted() {
    console.log('mode:', import.meta.env.MODE)
  }
};
</script>

