<template>
  <v-dialog max-width="500" v-model="dialog" persistent>
    <v-overlay
      :model-value="puzzleList == ''"
      class="align-center justify-center"
    >
      <v-progress-circular
        color="primary"
        indeterminate
        size="64"
      ></v-progress-circular>
    </v-overlay>    
    <v-toolbar color="primary" title="open local file"></v-toolbar>
    <v-card>
      <v-card class="ma-3">
        <v-combobox :items="designers">
        </v-combobox>
        <v-virtual-scroll
          :items="puzzleList"
          height="400"
          item-height="48"
          > 
          <template v-slot:default="{ item, index }">
            <v-list-item
                :title="item.attributes.ename"
                :subtitle="index"
                >
              <template v-slot:prepend>
                <v-icon class="bg-primary">mdi-account</v-icon>
              </template>

              <template v-slot:append>
                <v-btn
                  icon="mdi-pencil"
                  size="x-small"
                  variant="tonal"
                ></v-btn>
              </template>
            </v-list-item>
          </template>
        </v-virtual-scroll>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
              @click="dialog = false"
            >
            Cancel
          </v-btn>
          <v-btn
              :disabled="!DATA.puzzle.shapes"
              @click="loadFile()"
              variant="tonal"
            >
            Load file
          </v-btn>
        </v-card-actions>
      </v-card>
      <v-card  class="ma-3" v-if="DATA.puzzle.shapes" 
          title="Puzzle" 
          :subtitle="DATA.puzzle.shapes.voxel.length + ' shapes defined'"
          :text="DATA.puzzle.largestShape.x + 'x' + DATA.puzzle.largestShape.y + 'x' + DATA.puzzle.largestShape.z"
          >
      </v-card>
    </v-card>
  </v-dialog>
</template>

<script setup>
  import { ref, reactive, computed, watch } from 'vue'
  import { Puzzle } from '@kgeusens/burr-data'
  import { XMLParser } from 'fast-xml-parser'

  const emit = defineEmits(["newShape", "newName"])
  
  const props = defineProps(
    { 
        show: { type: Number, default: 0}, 
    }
    );
  const puzzleList = ref([])
  const selectedPuzzle = ref({})
  const dialog = ref(false)
  const DATA = reactive( { puzzle: {} })

  function loadPuzzleList() {
    selectedPuzzle.value = ''
    const res = 
      fetch('http://localhost:3001/api/PWBP/index', { mode: "cors" })
      .catch(error => console.log(error))
      .then(res => res.json()).then(obj => {puzzleList.value = obj;})
      .catch(error => console.log(error))
  }

  function getUniqueAttrVals(attrName) {
    if (puzzleList.value.length) {
      return puzzleList.value.map(el => el.attributes[attrName]).filter( (it, idx, ar) => ar.indexOf(it) === idx  ).sort()
    } else {
      return []
    }
  }

  function loadFile() {
    emit( "newShape", DATA.puzzle )
    emit( "newName", selectedPuzzle.value.attributes.ename)
    dialog.value=false
  }

  watch(
    () => props.show, 
    (newv) => {
      loadPuzzleList() 
      dialog.value = true
    }
  )
  watch(
    selectedPuzzle, 
    async (newv) => { 
      if (newv != "") {
        console.log(newv)
      }
      else {
        DATA.puzzle = {}
      }
    }
  )
  const designers = computed({
    get: () => getUniqueAttrVals('dsgn')
  })
</script>
