<template>
  <h1> Hello World {{ selectedFile }} </h1>
  <div>
  <v-btn prepend-icon="mdi-cloud-download" @click="loadFileList">
    Load Files 
  </v-btn>
  <v-card width="500">
    <v-combobox v-if="fileList.length > 0" v-model="selectedFile"
      label = "Puzzle file"
      :items="fileList"
      >
    </v-combobox>
    <v-btn v-if="fileList.includes(selectedFile)" @click="loadFile">
      Load File
    </v-btn>
    <v-card v-if="loadedFile.puzzle">
      <v-list>
        <v-list-subheader>{{ loadedFile.name }}</v-list-subheader>
        <v-list-item  v-for="(item, i) in loadedFile.puzzle.shapes.voxel" :key="i" :value="item" @click="selectShape(item)">
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
</div>
</template>

<script setup>
  import { reactive, computed, watch } from 'vue'
  import { Puzzle, Voxel } from "@kgeusens/burr-data"

  const emit = defineEmits(["newShape"])
  const DATA= reactive({fileList: [], selectedFile: '', loadedFile: {}, selectedShape: new Voxel() })
  function loadFileList() {
    selectedFile.value = ''
    const res = 
      fetch('http://localhost:3001/api/puzzles/list', { mode: "cors" })
      .catch(error => console.log(error))
      .then(res => res.json()).then(obj => {fileList.value = obj;})
      .catch(error => console.log(error))
  }
  function loadFile() {
    selectedShape.value = {}
    const res = 
      fetch('http://localhost:3001/api/puzzles/get/' + selectedFile.value, { mode: "cors" })
      .catch(error => console.log(error))
      .then(res => res.json())
      .then(obj => {
        loadedFile.value.name = obj.filename
        loadedFile.value.puzzle = new Puzzle(obj.content.puzzle)
        selectedShape.value = {}
      }).catch(error => console.log(error))
  }
  function selectShape(s) { selectedShape.value=s }
  const fileList = computed({
    get: () => DATA.fileList, 
    set: (val) => DATA.fileList = val
  })
  const selectedFile = computed({
    get: () => DATA.selectedFile, 
    set: (val) => DATA.selectedFile = val
  })
  const loadedFile = computed({
    get: () => DATA.loadedFile, 
    set: (val) => DATA.loadedFile = val
  })
  const selectedShape = computed({
    get: () => DATA.selectedShape,
    set: (val) => DATA.selectedShape = val
  })
  watch(
    () => DATA.selectedShape.x, 
    (newval, oldval) => {console.log(newval)} 
    )
  watch(selectedShape, (newval, oldval) => {emit("newShape", newval)})
</script>
