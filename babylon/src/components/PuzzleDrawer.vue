<template>
  <v-card variant="outlined" v-if="props.puzzle.shapes">
    <v-toolbar density="compact" color="primary" :title="`${props.puzzle.shapes.voxel.length} Shapes`"></v-toolbar>
    <v-card class="overflow-y-auto" max-height="400"  >
      <v-list mandatory v-model:selected="DATA.selectedItem">
        <v-list-item  v-for="(item, i) in shapes" class="py-0 px-1" :key="i" :value="i">
          <v-list-item-title><v-container fluid><v-row align="center">
            <v-col class="pa-0" align="center"><v-chip>
              {{ i }}
            </v-chip></v-col>
            <v-col class="pa-0 v-col-3"><v-text-field
              v-model="item.name"
              hide-details
              label="name"
              density="compact"
              variant="outlined"
            ></v-text-field></v-col>
            <v-col v-for="dim in ['x', 'y', 'z']" class="pa-0 v-col-2"><v-text-field
              v-model="item[dim]"
              hide-details
              :label="dim"
              type="number"
              density="compact"
              variant="outlined"
            >
            </v-text-field></v-col>
            <v-col class = "pa-0" align="right">
              <v-icon v-if="DATA.selectedItem[0] == i" @click="deleteShape" icon="mdi-delete"></v-icon>
            </v-col>
          </v-row></v-container></v-list-item-title>
        </v-list-item>
      </v-list>
      <v-card-actions><v-spacer></v-spacer>
        <v-btn @click="addShape">New</v-btn>
      </v-card-actions>
    </v-card>
  </v-card>
</template>

<script setup>
  import { reactive, computed, watch } from 'vue'
  import { Puzzle, Voxel } from "@kgeusens/burr-data"

  const emit = defineEmits(["newShape"])
  const props = defineProps(
    { 
        puzzle: { type: Object, default: null }, 
    }
    );
  const DATA= reactive({ selectedItem: [] })

  function addShape() {
    let idx=props.puzzle.addShape()
    DATA.selectedItem=[idx]
  }
  function deleteShape() {
    if (shapes.value.length > 1) { 
      let idx = selectedIndex.value
      if (idx == (shapes.value.length - 1)) selectedIndex.value-=1
      props.puzzle.deleteShape(idx) 
    }
  }

  const selectedShape = computed({
    get: () => shapes.value[selectedIndex.value]
  })

  const selectedIndex = computed({
    get: () => DATA.selectedItem[0],
    set: (val) => DATA.selectedItem[0] = val
  })

  const shapes = computed({
    get: () => props.puzzle.shapes ? props.puzzle.shapes.voxel : []
  })

  watch(selectedShape, (newval, oldval) => {
    emit("newShape", newval)
    })
  watch(() => props.puzzle, (newval) => DATA.selectedItem=[0])
</script>
