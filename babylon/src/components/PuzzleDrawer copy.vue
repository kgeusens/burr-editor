<template>
  <v-card width="700">
    <v-card v-if="props.puzzle.shapes">
      <v-list>
        <v-list-item  v-for="(item, i) in props.puzzle.shapes.voxel" :key="i" :value="item" @click="selectShape(item)">
          <template v-slot:prepend>{{ i }}</template>
          <v-list-item-title v-text="item.name"></v-list-item-title>
        </v-list-item>
      </v-list>
      <v-card v-if="selectedShape.x">
        <v-text-field
        v-model="selectedShape.name"
        hide-details
        label="name"
        style="width: 150px"
      ></v-text-field>
        <v-text-field
        v-model="selectedShape.x"
        hide-details
        label="x"
        type="number"
        style="width: 70px"
      ></v-text-field>
      <v-text-field
        v-model="selectedShape.y"
        hide-details
        label="y"
        density="compact"
        type="number"
        style="width: 70px"
      ></v-text-field>
      <v-text-field
        v-model="selectedShape.z"
        hide-details
        label="z"
        density="compact"
        type="number"
        style="width: 70px"
      ></v-text-field>
      </v-card>
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

  const DATA= reactive({fileList: [], selectedFile: '', loadedFile: {}, selectedShape: new Voxel() })
  function selectShape(s) { selectedShape.value=s }
  const selectedShape = computed({
    get: () => DATA.selectedShape,
    set: (val) => DATA.selectedShape = val
  })
  watch(selectedShape, (newval, oldval) => {emit("newShape", newval)})
</script>
