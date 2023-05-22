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
      <v-list  mandatory v-model:selected="DATA.selectedProblem">
        <v-list-item  v-for="(item, i) in problems" class="py-0 px-1" :key="i" :value="i">
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
        Solutions <v-spacer></v-spacer> 
      </v-toolbar-title>
    </v-toolbar>
    <v-card class="overflow-y-auto" max-height="400"  >
      <v-list mandatory v-model:selected="DATA.selectedSolution">
        <v-list-item  v-for="(item, i) in solutions" class="py-0 px-1" :key="i" :value="i">
          <v-list-item-title><v-container fluid><v-row align="center">
            <v-col class="pa-0" align="center"><v-chip>
              {{ i }}
            </v-chip></v-col>
            <v-col class="pa-0 v-col-9">
            </v-col>
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
        {{ props.puzzle.shapes.voxel.length }} Pieces <v-spacer></v-spacer> 
      </v-toolbar-title>
    </v-toolbar>
    <v-card class="overflow-y-auto" max-height="400"  >
      <v-list mandatory v-model:selected="DATA.selectedShape">
        <v-list-item  v-for="(item, i) in pieces" class="py-0 px-1" :key="i" :value="i">
          <v-list-item-title><v-container fluid><v-row align="center">
            <v-col class="pa-0" align="center"><v-chip>
              {{ i }}
            </v-chip></v-col>
            <v-col class="pa-0 v-col-9"><v-text-field
              v-model="item.name"
              hide-details
              label="name"
              density="compact"
              variant="outlined"
            ></v-text-field></v-col>
            <v-col class = "pa-0" align="right">
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

  const emit = defineEmits(["newProblem", "newSolution"])
  const props = defineProps(
    { 
        puzzle: { type: Object, default: null }, 
    }
    );
  const DATA= reactive({ selectedShape: [0], selectedProblem: [0], selectedSolution: [0] })

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
    get: () => DATA.selectedProblem[0],
    set: (val) => DATA.selectedProblem = [val]
  })

  const selectedSolution = computed({
    get: () => solutions.value[selectedSolutionIndex.value]
  })

  const selectedSolutionIndex = computed({
    get: () => DATA.selectedSolution[0],
    set: (val) => DATA.selectedSolution = [val]
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
          shapeList.push( { shape: shapes.value[idx] , id: j, rotationIndex: assembly[j*4+3], position: [Number(assembly[j*4]), Number(assembly[j*4+1]), Number(assembly[j*4+2]) ]} )
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

  const shapesCount = computed({
    get: () => {
      return props.puzzle.shapes.voxel.map((vox, idx) => selectedProblem.value.getShapeFromId(idx))
    }
  })

  watch(selectedShape, (newval, oldval) => {
//    emit("newShape", newval)
    })
  watch(() => props.puzzle, (newval) => { 
    DATA.selectedShape=[0]
    DATA.selectedProblem=[0]
  })
  watch(selectedProblemIndex, (newval) => emit("newProblem", newval))
  watch(selectedSolutionIndex, (newval) => emit("newSolution", newval))
</script>
