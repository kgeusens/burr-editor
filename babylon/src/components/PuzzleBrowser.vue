<template>
  <h1> Hello World {{ selectedFile }} </h1>
  <div>
  <v-btn prepend-icon="mdi-vuetify" @click="loadFileList">
    Load Files 
  </v-btn>
  <v-card width="400">
    <v-combobox margin:10 v-model="selectedFile"
      label = "Puzzle file"
      :items="fileList"
      >
    </v-combobox>
  </v-card>
</div>
</template>

<script setup>
  import { ref } from 'vue'
  const fileList = ref([])
  const selectedFile = ref('')
  function loadFileList() {
    const res = fetch('http://localhost:3001/api/puzzles/list').then(
      res => res.json()).then(obj => {fileList.value = obj;}) 
  }
</script>
