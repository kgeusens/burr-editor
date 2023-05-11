<template>
  <v-card>
    <v-card variant="outlined" v-if="props.puzzle.shapes">
      <v-list mandatory v-model:selected="DATA.selectedItem">
        <v-list-item  v-for="(item, i) in props.puzzle.shapes.voxel" class="py-0" :key="i" :value="item" :title="item.name">
          <v-list-item-title><v-container fluid><v-row align="center">
            <v-col class="pa-0 v-col-2"><v-chip>
              {{ i }}
            </v-chip></v-col>
            <v-col class="pa-0 v-col-3"><v-text-field
              v-model="selectedShape.name"
              hide-details
              label="name"
              density="compact"
              variant="outlined"
            ></v-text-field></v-col>
            <v-col v-for="dim in ['x', 'y', 'z']" class="pa-0"><v-text-field
              v-model="item[dim]"
              hide-details
              :label="dim"
              type="number"
              density="compact"
              variant="outlined"
            >
            </v-text-field></v-col>
          </v-row></v-container></v-list-item-title>
        </v-list-item>
      </v-list>
    </v-card>
  </v-card>
</template>

<script setup>
  import { reactive, computed, watch } from 'vue'
  import { Puzzle, Voxel } from "@kgeusens/burr-data"

  const emit = defineEmits(["newShape"])
  const props = defineProps(
    { 
        puzzle: { type: Object, default: {} }, 
    }
    );

  const DATA= reactive({fileList: [], selectedItem: [] })
  const selectedShape = computed({
    get: () => DATA.selectedItem[0],
    set: (val) => DATA.selectedItem = [val]
  })
  watch(selectedShape, (newval, oldval) => {
    emit("newShape", newval)
    })
  watch(() => props.puzzle, (newval) => DATA.selectedItem=[newval.shapes.voxel[0]])
</script>
