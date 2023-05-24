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
      <v-layout-item position="top" class="text-start" size="0">
        <div class="ma-4">
          <span v-if=drawer style="display:inline-block;width:450px"></span>
          <v-btn @click.stop="drawer = !drawer" icon="mdi-arrow-left-right" size="small" elevation="4" />
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

    <v-main v-show="tab == 'problems' && puzzle.shapes">
      <v-navigation-drawer
        id="problemDrawer"
        key="problemDrawer"
        width="450"
        class="pa-2"
        v-model="drawer"
        temporary
        :scrim=false
        >
        <ProblemDrawer :puzzle="puzzle" v-model:problemIndex="problemIndex"/>
      </v-navigation-drawer>
      <v-layout-item model-value position="top" class="text-start" size="0">
        <div class="ma-4">
          <span v-if=drawer style="display:inline-block;width:450px"></span>
          <v-btn @click.stop="drawer = !drawer" icon="mdi-arrow-left-right" size="small" elevation="4" />
        </div>
      </v-layout-item>
      <v-card width="100%" height="100%">
        <BabylonEngine>
          <BabylonScene>
            <BabylonSceneModel :model=ProblemViewer :detail=problemDetail>
            </BabylonSceneModel>
            <BabylonCamera id="1">
              <BabylonView width="parent" height="parent">
              </BabylonView>
            </BabylonCamera>
          </BabylonScene>
        </BabylonEngine>
      </v-card>
    </v-main>

    <v-main v-show="tab == 'solutions' && puzzle.shapes">
      <v-navigation-drawer
        id="solutionDrawer"
        key="solutionDrawer"
        width="450"
        class="pa-2"
        v-model="drawer"
        temporary
        :scrim=false
        >
        <SolutionDrawer :puzzle="puzzle" v-model:problemIndex="problemIndex" v-model:solutionIndex="solutionIndex" v-model:playerMove="solutionMove"/>
      </v-navigation-drawer>
      <v-layout-item model-value position="top" class="text-start" size="0">
        <div class="ma-4">
          <span v-if=drawer style="display:inline-block;width:450px"></span>
          <v-btn @click.stop="drawer = !drawer" icon="mdi-arrow-left-right" size="small" elevation="4" />
        </div>
      </v-layout-item>
      <v-card width="100%" height="100%">
        <BabylonEngine>
          <BabylonScene>
            <BabylonSceneModel :model=SolutionViewer :detail=solutionDetail>
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
import ProblemDrawer from "./components/ProblemDrawer.vue"
import SolutionDrawer from "./components/SolutionDrawer.vue"
import LocalFileDialog from "./components/LocalFileDialog.vue"
import PWBPDialog from './components/PWBPDialog.vue'
import BabylonEngine from "./components/babylon/BabylonEngine.vue";
import BabylonScene from "./components/babylon/BabylonScene.vue";
import BabylonSceneModel from "./components/babylon/BabylonSceneModel.vue";
import BabylonCamera from "./components/babylon/BabylonCamera.vue";
import BabylonView from "./components/babylon/BabylonView.vue";
import { sceneBuilder } from "./scenes/ShapeEditor.js";
// import { sceneBuilder as bodyBuilder } from "./scenes/ShapeBody.js";
import { sceneBuilder as problemBuilder } from "./scenes/ProblemSummary.js";
import { sceneBuilder as solutionBuilder } from "./scenes/SolutionSummary.js";
import { Problem, Puzzle } from "@kgeusens/burr-data";

export default {
  name: "App",
  data() {
    return { 
      puzzle: new Puzzle(), 
      shapeIndex: 0,
      problemIndex: [0],
      solutionIndex: [0],
      solutionMove: 0,
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
  },
  methods: {
    loadShape(i) {
      this.shapeIndex = i
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
    solutionPieces() {
      // returns an array that maps to the id of the unique entities. 
      // A shape with id=2 and count=3 means entity 2 is used three times. 
      // It will occur as ... 2, 2, 2 ... in the array
      // We return an array of entities, together with its position, and the rotation
      if (!this.solution) return []
      let shapeList = []
      let tempShapes = []
      let assembly = this.solution.assembly.text.split(" ")
      for (let shape of this.problem.shapes.shape) {
          tempShapes[shape.id] = shape.count
      }
      let j = 0
      for (let idx=0; idx < tempShapes.length; idx++) {
        for (let i=0; i<tempShapes[idx]; i++) {
          shapeList.push( { shape: this.puzzle.shapes.voxel[idx] , id: j, rotationIndex: assembly[j*4+3], position: [Number(assembly[j*4]), Number(assembly[j*4+1]), Number(assembly[j*4+2]) ]} )
          j++
        }
      }
      return shapeList
    },
    solutionPositions() {
      return this.solution?this.solution.separation[0].statePositionsAll:[]
    },
    problemDetail() {
      return { shape: this.puzzle.shapes.voxel[this.problem.result.id], pieces: this.problemPieces, delta: 0, bevel: 0, alpha: 1, outline: true, trigger: this.problemTrigger }
    },
    solutionDetail() {
      return { 
        shape: this.puzzle.shapes.voxel[this.problem.result.id], 
        pieces: this.solutionPieces, 
        movePositions: this.solutionPositions,
        move: this.solutionMove,
        delta: 0.01, 
        bevel: 0, 
        alpha: 1, 
        outline: true}
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
//      console.log("problemPieces triggered", newv.length)
    },
    problem(newv, oldv) {
//      console.log("problem triggered")
    },
    problemDetail(newv) {
//      console.log("problemDetail triggered")
    },
    puzzle(newv) {
//      console.log("puzzle triggered", newv)
    }
  },
  mounted() { 
  }
};
</script>

