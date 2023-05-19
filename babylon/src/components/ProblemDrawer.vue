<template>
  <v-card class="my-2" variant="outlined" v-if="props.puzzle.problems">
    <v-toolbar density="compact" color="primary">
      <v-toolbar-title>
        {{ props.puzzle.problems.problem.length }} Problems <v-spacer></v-spacer> 
      </v-toolbar-title>
    </v-toolbar>
    <v-card class="overflow-y-auto" max-height="400"  >
      <v-list>
        <v-list-item  v-for="(item, i) in problems" class="py-0 px-1" :key="i" :value="i">
          <v-list-item-title><v-container fluid><v-row align="center">
            <v-col class="pa-0" align="center"><v-chip>
              {{ i }}
            </v-chip></v-col>
          </v-row></v-container></v-list-item-title>
        </v-list-item>
      </v-list>
    </v-card>
  </v-card>
  <v-card class="my-4" variant="outlined" v-if="props.puzzle.shapes">
    <v-toolbar density="compact" color="primary">
      <v-toolbar-title>
        {{ props.puzzle.shapes.voxel.length }} Shapes <v-spacer></v-spacer> 
      </v-toolbar-title>
    </v-toolbar>
    <v-card class="overflow-y-auto" max-height="400"  >
      <v-list mandatory v-model:selected="DATA.selectedItem">
        <v-list-item  v-for="(item, i) in shapes" class="py-0 px-1" :key="i" :value="i">
          <v-list-item-title><v-container fluid><v-row align="center">
            <v-col class="pa-0" align="center"><v-chip>
              {{ i }}
            </v-chip></v-col>
            <v-col class="pa-0 v-col-7"><v-text-field
              v-model="item.name"
              hide-details
              label="name"
              density="compact"
              variant="outlined"
            ></v-text-field></v-col>
            <v-col class="pa-0 v-col-2"><v-text-field
              v-model="shapesCount[i].count"
              hide-details
              label="count"
              type="number"
              density="compact"
              variant="outlined"
            >
            </v-text-field></v-col>
            <v-col class = "pa-0" align="right">
              <v-icon v-if="problems[0].result.id == i" icon="mdi-puzzle-check"></v-icon>
            </v-col>
          </v-row></v-container></v-list-item-title>
        </v-list-item>
      </v-list>
    </v-card>
  </v-card>
</template>

<script setup>
  import { reactive, computed, watch, nextTick } from 'vue'
//  import { Puzzle, Voxel } from "@kgeusens/burr-data"

  const emit = defineEmits(["newShape", "setReadOnly"])
  const props = defineProps(
    { 
        puzzle: { type: Object, default: null }, 
    }
    );
  const DATA= reactive({ selectedItem: [], readOnly: true })

  const selectedShape = computed({
    get: () => shapes.value[selectedIndex.value]
  })

  const selectedIndex = computed({
    get: () => DATA.selectedItem[0],
    set: (val) => DATA.selectedItem = [val]
  })

  const shapes = computed({
    get: () => props.puzzle.shapes ? props.puzzle.shapes.voxel : []
  })

  const problems = computed({
    get: () => props.puzzle.problems ? props.puzzle.problems.problem : []
  })

  const shapesCount = computed({
    get: () => {
      console.log(props.puzzle.problems.problem[0].getShapeFromId(1))
      return props.puzzle.shapes.voxel.map((vox, idx) => props.puzzle.problems.problem[0].getShapeFromId(idx))
    }
  })

  watch(selectedShape, (newval, oldval) => {
    emit("newShape", newval)
    })
  watch(() => props.puzzle, (newval) => DATA.selectedItem=[0])
  watch(() => DATA.readOnly, (newval) => {
    emit("setReadOnly", newval)
    })
  watch(problems, (newval) => console.log(newval))
</script>
