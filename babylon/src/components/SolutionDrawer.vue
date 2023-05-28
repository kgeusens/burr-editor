<template>
<!--
  List of problems
 -->
 <v-card class="my-2" variant="outlined" v-if="props.puzzle.problems">
    <v-toolbar density="compact" color="primary">
      <v-toolbar-title>
        {{ props.puzzle.problems.problem.length }} Problems <v-spacer></v-spacer> 
      </v-toolbar-title>
    </v-toolbar>
    <v-card class="overflow-y-auto" max-height="400"  >
      <v-list  mandatory v-model:selected="problemIndex">
        <v-list-item  v-for="(item, i) in problems" class="py-1 px-1" :key="i" :value="i">
          <v-list-item-title><v-container fluid><v-row align="center">
            <v-col class="pa-0" align="center"><v-chip>
              {{ i }}
            </v-chip></v-col>
            <v-col class="pa-0 v-col-9"><v-text-field
              v-model="item.solutions.solution.length"
              hide-details
              label="solutions"
              density="compact"
              variant="outlined"
              readonly
            ></v-text-field></v-col>
            <v-col class = "pa-0" align="right">
            </v-col>
          </v-row></v-container></v-list-item-title>
        </v-list-item>
      </v-list>
    </v-card>
  </v-card>
<!--
  List of Solutions
 -->
 <v-card class="my-4" variant="outlined" v-if="selectedProblem.solutions.solution.length > 0">
    <v-toolbar density="compact" color="primary">
      <v-toolbar-title>
        {{ solutions.length }} Solutions for problem<v-spacer></v-spacer> 
      </v-toolbar-title>
    </v-toolbar>
    <v-card class="overflow-y-auto" max-height="400"  >
      <v-list mandatory v-model:selected="solutionIndex">
        <v-list-item  v-for="(item, i) in solutions" class="py-y px-1" :key="i" :value="i">
          <v-list-item-title><v-container fluid><v-row align="center">
            <v-col class="pa-0" align="center"><v-chip>
              {{ i }}
            </v-chip></v-col>
            <v-col class="pa-0 v-col-9"><v-text-field
              v-model="solutions[i].complexity"
              hide-details
              label="complexity"
              density="compact"
              variant="outlined"
              readonly
            ></v-text-field></v-col>
            <v-col class = "pa-0" align="right">
            </v-col>
          </v-row></v-container></v-list-item-title>
        </v-list-item>
      </v-list>
    </v-card>
  </v-card>
<!--
  List of Pieces
 -->
  <v-card class="my-4" variant="outlined" v-if="props.puzzle.shapes">
    <v-toolbar density="compact" color="primary">
      <v-toolbar-title>
        {{ pieces.length }} Pieces in solution<v-spacer></v-spacer> 
      </v-toolbar-title>
    </v-toolbar>
    <v-card class="overflow-y-auto" max-height="400"  >
      <v-list mandatory v-model:selected="DATA.selectedShape">
        <v-list-item  v-for="(item, i) in pieces" class="py-1 px-1" :key="i" :value="i">
           <v-card>
            <v-list-item-title><v-container fluid><v-row align="center">
              <v-col class="pa-0" align="center"><v-chip>
                {{ i }}
              </v-chip></v-col>
              <v-col class="pa-0 v-col-5"><v-text-field
                v-model="item.name"
                hide-details
                label="name"
                density="compact"
                variant="outlined"
                readonly
              ></v-text-field></v-col>
              <v-col class="pa-0 v-col-4"><v-text-field
                v-model="colors[i]"
                hide-details
                label="color"
                density="compact"
                variant="outlined"
                @click="colorClicked(i)"
                readonly
              ></v-text-field></v-col>
              <v-col class = "pa-0" align="right">
              </v-col>
            </v-row></v-container></v-list-item-title>
            <v-expand-transition>
                <div v-show="DATA.showColorPicker == i">
                  <v-divider></v-divider>
                  <v-card-text>
                    <v-color-picker
                      mode="rgb"
                      v-model="colors[i]"
                      class="ma-0"
                      hide-canvas
                      hide-inputs
                      show-swatches
                      swatches-max-height="100px"
                      width="100%"
                      @update:modelValue="changeColor"
                      >
                    </v-color-picker>
                  </v-card-text>
                </div>
             </v-expand-transition>            
          </v-card>
        </v-list-item>
      </v-list>
    </v-card>
  </v-card>
<!--
  Player
 -->
 <v-card class="my-4" variant="outlined" v-if="selectedProblem.solutions.solution.length > 0">
    <v-toolbar density="compact" color="primary">
      <v-toolbar-title>
        Player <v-spacer></v-spacer> 
      </v-toolbar-title>
    </v-toolbar>
    <v-card class="overflow-y-auto" max-height="400"  >
      <v-list>
        <v-list-item class="py-0 px-1">
          <v-list-item-title><v-container fluid><v-row align="center">
            <v-col class="pa-0" ><v-slider
              v-model="playerMove"
              type="number"
              hide-details
              label="move"
              density="compact"
              min="0"
              :max="statePositions.length - 1"
              step="0.04"
            >
              <template v-slot:append>
                <v-text-field
                  v-model="playerMove"
                  type="number"
                  hide-details
                  label="move"
                  density="compact"
                  variant="outlined"
                  style="width: 90px"
                  min="0"
                  :max="statePositions.length - 1"
                ></v-text-field>                
              </template>
            </v-slider></v-col>
          </v-row></v-container></v-list-item-title>
        </v-list-item>
        <v-list-item class="py-0 px-1">
          <v-list-item-title><v-container fluid><v-row align="center">
            <v-col>
              <v-btn size="small" class="mx-1" icon="mdi-skip-backward" @click="playerAction('reset')"></v-btn>
              <v-btn size="small" class="mx-1" icon="mdi-skip-previous"></v-btn>
              <v-btn class="mx-1" icon="mdi-play" @click="playerAction('play')"></v-btn>
              <v-btn size="small" class="mx-1" icon="mdi-skip-next"></v-btn>
            </v-col>
            <v-col>
              <v-btn class="mx-1" icon="mdi-pause" @click="playerAction('pause')"></v-btn>
              <v-btn class="mx-1" icon="mdi-stop" @click="playerAction('stop')"></v-btn>
            </v-col>
          </v-row></v-container></v-list-item-title>
        </v-list-item>
      </v-list>
    </v-card>
  </v-card>
</template>

<script setup>
  import { Puzzle } from '@kgeusens/burr-data';
  import { reactive, computed, watch } from 'vue'
  import { pieceColor } from '../utils/colors';

  const emit = defineEmits(["update:problemIndex", "update:solutionIndex", "update:playerMove", "update:pieceColors", "playerAction"])
  const props = defineProps(
    { 
        puzzle: { type: Object, default: null },
        problemIndex: { type: Array, default: [0] },
        solutionIndex: { type: Array, default: [0] },
        playerMove: { type: Number, default: 0 }
    }
    );
  const DATA= reactive({ selectedShape: [0], showColorPicker: -1 })

  const selectedShape = computed({
    get: () => shapes.value[selectedShapeIndex.value]
  })

  const selectedShapeIndex = computed({
    get: () => DATA.selectedShape[0],
    set: (val) => DATA.selectedShape = [val]
  })

  const selectedProblem = computed({
    get: () => problems.value[selectedProblemIndex.value]
  })

  const selectedProblemIndex = computed({
    get: () =>  props.problemIndex[0] ,
    set: (val) => problemIndex.value = [val]
  })

  const problemIndex = computed({
    get: () => props.problemIndex,
    set: (val) => emit("update:problemIndex", val)
  })
  const solutionIndex = computed({
    get: () => props.solutionIndex,
    set: (val) => emit("update:solutionIndex", val)
  })
  const playerMove = computed({
    get: () => props.playerMove,
    set: (val) =>  { 
      emit("update:playerMove", Number(val)) 
      emit("playerAction", "move", { move: Number(val) })
    }
//    set: (val) => emit("update:playerMove", Number(val))
  })

  const selectedSolution = computed({
    get: () => solutions.value[selectedSolutionIndex.value]
  })

  const selectedSolutionIndex = computed({
    get: () => props.solutionIndex[0],
    set: (val) => solutionIndex.value = [val]
  })

  const shapes = computed({
    get: () => props.puzzle.shapes ? props.puzzle.shapes.voxel : []
  })

  const pieces = computed({
    get: () => { 
      // returns an array that maps to the id of the unique entities. 
      // A shape with id=2 and count=3 means entity 2 is used three times. 
      // It will occur as ... 2, 2, 2 ... in the array
      // We return an array of entities, together with its position, and the rotation
      if (!selectedSolution.value) return []
      let shapeList = []
      let tempShapes = []
      let assembly = selectedSolution.value.assembly.text.split(" ")
      for (let shape of selectedProblem.value.shapes.shape) {
          tempShapes[shape.id] = shape.count
      }
      let j = 0
      for (let idx=0; idx < tempShapes.length; idx++) {
        for (let i=0; i<tempShapes[idx]; i++) {
          shapeList.push( { 
            shape: shapes.value[idx] , 
            id: j, 
            name: idx + "." + i + " " + shapes.value[idx].name
          } )
          j++
        }
      }
      return shapeList
    }
  })

  const colors = computed({
    get: () => { 
      if (!selectedSolution.value) return []
      let shapeList = []
      let tempShapes = []
      for (let shape of selectedProblem.value.shapes.shape) {
          tempShapes[shape.id] = shape.count
      }
      let j = 0
      for (let idx=0; idx < tempShapes.length; idx++) {
        for (let i=0; i<tempShapes[idx]; i++) {
          shapeList.push(pieceColor(idx, i).toHexString())
          j++
        }
      }
      return shapeList
    }
  })

  const problems = computed({
    get: () => props.puzzle.problems ? props.puzzle.problems.problem : []
  })

  const solutions = computed({
    get: () => selectedProblem.value.solutions.solution
  })

  const statePositions = computed({
    get: () => {
      return selectedSolution.value.separation[0].movePositionsAll
    }
  })

  const changeColor = function(val) {
    emit("update:pieceColors", colors.value)
  }
  const colorClicked = function(val) {
    if (DATA.showColorPicker == val) DATA.showColorPicker=-1
    else DATA.showColorPicker=val
  }
  const playerAction = function(action, options) {
    emit("playerAction", action, options)
  }

  watch(selectedShape, (newval, oldval) => {
//    emit("newShape", newval)
    })
  watch(() => props.puzzle, (newval) => { 
//    DATA.selectedShape=[0]
  })
//  watch(selectedProblemIndex, (newval) => emit("update:problemIndex", newval))
  watch(selectedSolutionIndex, (newval) => { 
  })
  watch(colors, (val) => emit("update:pieceColors", colors.value))
</script>
