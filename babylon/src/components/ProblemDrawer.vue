<template>
<!--
  Problems
 -->
  <v-btn @click="solvePuzzle">
      Solve
  </v-btn>
  <v-btn @click="savePuzzle">
      Save
  </v-btn>
  <v-card class="my-2" variant="outlined" v-if="props.puzzle.problems">
    <v-toolbar density="compact" color="primary">
      <v-toolbar-title>
        {{ props.puzzle.problems.problem.length }} Problems <v-spacer></v-spacer> 
      </v-toolbar-title>
      <v-btn icon @click="addProblem">
        <v-icon>mdi-playlist-plus</v-icon>
      </v-btn>
    </v-toolbar>
    <v-card class="overflow-y-auto" max-height="400"  >
      <v-list  mandatory v-model:selected="problemIndex">
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
              <v-icon v-if="selectedProblemIndex == i && problems.length > 1" @click.stop="deleteProblem" icon="mdi-delete"></v-icon>
            </v-col>
          </v-row></v-container></v-list-item-title>
        </v-list-item>
      </v-list>
    </v-card>
  </v-card>
<!--
  Shapes
 -->
  <v-card class="my-4" variant="outlined" v-if="props.puzzle.shapes">
    <v-toolbar density="compact" color="primary">
      <v-toolbar-title>
        {{ props.puzzle.shapes.voxel.length }} Shapes <v-spacer></v-spacer> 
      </v-toolbar-title>
    </v-toolbar>
    <v-card class="overflow-y-auto" max-height="400"  >
      <v-list mandatory v-model:selected="DATA.selectedShape">
        <v-list-item  v-for="(item, i) in shapes" class="py-0 px-1" :key="i" :value="i">
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
            ></v-text-field></v-col>
            <v-col class="pa-0 v-col-2"><v-text-field v-if="selectedProblem.result.id != i" @change="updateCount($event.target.value, i)"
              v-model="shapesCount[i].count"
              hide-details
              label="count"
              type="number"
              density="compact"
              variant="outlined"
            >
            </v-text-field></v-col>
            <v-col class="pa-0 v-col-2"><v-text-field v-if="selectedProblem.result.id != i"
              v-model="shapesCount[i].group"
              hide-details
              label="group"
              type="number"
              density="compact"
              variant="outlined"
            >
            </v-text-field></v-col>
            <v-col class = "pa-0" align="right">
              <v-icon v-if="selectedProblem.result.id == i" icon="mdi-puzzle-check"></v-icon>
              <v-icon v-if="selectedProblem.result.id != i && selectedShapeIndex == i" icon="mdi-puzzle-outline" @click="setResult"></v-icon>
            </v-col>
          </v-row></v-container></v-list-item-title>
        </v-list-item>
      </v-list>
    </v-card>
  </v-card>
</template>

<script setup>
  import { Puzzle } from '@kgeusens/burr-data';
  import { reactive, computed, watch, normalizeStyle } from 'vue'
  import Module from '@kgeusens/burr-tools'
  var burrtools = null
  const apiServer=import.meta.env.MODE=='development'?'http://localhost:3001':''

  Module().then(myModule => {  
    burrtools = myModule
  });

  const emit = defineEmits(["update:problemIndex", "solvedPuzzle"])
  const props = defineProps(
    { 
        puzzle: { type: Object, default: null }, 
        problemIndex: { type: Array, default: [0] },
    }
    );
  const DATA= reactive({ selectedShape: [0] })

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

  const shapes = computed({
    get: () => props.puzzle.shapes ? props.puzzle.shapes.voxel : []
  })

  const problems = computed({
    get: () => props.puzzle.problems ? props.puzzle.problems.problem : []
  })

  const shapesCount = computed({
    get: () => {
      return props.puzzle.shapes.voxel.map((vox, idx) => selectedProblem.value.getShapeFromId(idx))
    }
  })

  function clearSolution() {
    selectedProblem.value.solutions.solution = []
  }
  function updateCount(val, idx) {
    clearSolution()
    selectedProblem.value.setShape(shapesCount.value[idx])
  }
  function setResult() {
    selectedProblem.value.result.id = selectedShapeIndex.value
  }
  function addProblem() {
    let idx=props.puzzle.addProblem()
    selectedProblemIndex.value = idx
  }
  function solvePuzzle() {
//    burrtools.solve(something)
      let outcome = burrtools.solve(props.puzzle.saveToXML())
      emit("solvedPuzzle", Puzzle.puzzleFromXML(outcome))
  }
  
  async function savePuzzle() {
    var ans = {meta:props.puzzle.meta}
    // make sure there is an id in the meta data. If not, ask one from the server and add it to the puzzle.
    if ( !ans.id || ans.id=="") {
      const id = await fetch(apiServer + '/api/puzzle/id', { 
        method: "get", 
        mode: "cors", 
        headers: {
          "Accept": "application/json"
        }, 
      })
      .then(obj => { return obj.json() })
      .then(obj => { return obj.id})
      .catch(error => console.log(error))
      ans.meta["id"]=id
    }
    // now the puzzle has an id. Generate the xml and add it to the server request.
    ans.puzzle = props.puzzle.saveToXML()
    const res = 
      fetch(apiServer + '/api/puzzle', { 
        method: "post", 
        mode: "cors", 
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        }, 
        body: JSON.stringify(ans)})
      .then(obj => { return obj.json() })
      .catch(error => console.log(error))
  }

  function deleteProblem() {
    if (problems.value.length > 1) { 
      let idx = selectedProblemIndex.value
      props.puzzle.deleteProblem(selectedProblemIndex.value)
      if (idx >= (problems.value.length - 1)) selectedProblemIndex.value=problems.value.length - 1
    }
  }
</script>
