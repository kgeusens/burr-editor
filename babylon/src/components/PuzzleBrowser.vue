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
  </v-card>
</div>
</template>

<script setup>
  import { ref } from 'vue'
  const fileList = ref([])
  const selectedFile = ref('')
  function loadFileList() {
    selectedFile.value = ''
    const res = 
      fetch('http://localhost:3001/api/puzzles/list', { mode: "cors" })
      .catch(error => console.log(error))
      .then(res => res.json()).then(obj => {fileList.value = obj;})
      .catch(error => console.log(error))
  }
  function loadFile() {
    const res = 
      fetch('http://localhost:3001/api/puzzles/get/' + selectedFile.value, { mode: "cors" })
      .catch(error => console.log(error))
      .then(res => res.json()).then(obj => {console.log(obj);})
      .catch(error => console.log(error))
  }
</script>
