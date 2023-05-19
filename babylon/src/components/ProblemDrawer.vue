<template>
  <v-card variant="outlined" v-if="props.puzzle.shapes">
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
            <v-col class="pa-0 v-col-9"><v-text-field
              v-model="item.name"
              hide-details
              label="name"
              density="compact"
              variant="outlined"
            ></v-text-field></v-col>
            <v-col class = "pa-0" align="right">
              <v-icon v-if="DATA.selectedItem[0] == i " icon="mdi-delete"></v-icon>
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

  watch(selectedShape, (newval, oldval) => {
    emit("newShape", newval)
    })
  watch(() => props.puzzle, (newval) => DATA.selectedItem=[0])
  watch(() => DATA.readOnly, (newval) => {
    emit("setReadOnly", newval)
    })
</script>