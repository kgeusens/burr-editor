<template>
  <v-dialog max-width="1200" v-model="dialog" persistent>
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
    <v-toolbar color="primary" title="Puzzle Will Be Played"></v-toolbar>
    <v-card>
      <v-card class="ma-3">
        <v-autocomplete v-model="DATA.filterObjects.designer" class="mx-3 mt-3" variant=outlined :items="designers" label="Designer" chips clearable>
        </v-autocomplete>
        <v-text-field v-model="DATA.filterObjects.name" class="mx-3" label="Quicksearch" prepend-inner-icon="mdi-magnify" clearable>
        </v-text-field>
        <v-data-table-virtual
          :headers="puzzleHeaders"
          :items="puzzleList"
          :search="filterString"
          class="elevation-1"
          height="400"
          fixed-header
          :custom-filter="filterComplex"
          density="compact"
          @click:row="clickRow"
        >
        </v-data-table-virtual>
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
  import { VDataTableVirtual } from 'vuetify/labs/VDataTable'
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
  const DATA = reactive( { puzzle: {}, filterObjects: {name:null, designer:null} })
  const searchName = ref("")

  const puzzleHeaders = [
          {
            title: 'Puzzle name',
            align: 'start',
            sortable: true,
            key: 'name',
            width: "250"
          },
          { title: 'Designer', key: 'designer', width: "150" },
          { title: 'Moves', key: 'moves', width: "50"}
        ]
  const puzzleGroup = [ {key: 'designer' }]

  function loadPuzzleList() {
    selectedPuzzle.value = ''
    const res = 
      fetch('http://localhost:3001/api/PWBP/index', { mode: "cors" })
      .catch(error => console.log(error))
      .then(res => res.json())
      .then(obj => {puzzleList.value = obj.filter(el => el.attributes.cat === "I").map(el => 
        { return { 
            name: el.attributes.ename, 
            designer : el.attributes.dsgn,
            date: el.attributes.date,
            shape: el.attributes.shape,
            moves: el.attributes.moves ?el.attributes.moves.match(/\d*/):0,
            uri: el.attributes.uri,
            goal: el.attributes.goal,
            category: el.attributes.cat,
            subcategory: el.attributes.subcat
          } }
        )})
      .catch(error => console.log(error))
  }

  function getUniqueAttrVals(attrName) {
    if (puzzleList.value.length) {
      return puzzleList.value.map(el => el[attrName]).filter( (it, idx, ar) => ar.indexOf(it) === idx  ).sort()
    } else {
      return []
    }
  }

  function clickRow(event, row) {
    console.log(row.item.value.uri)
    window.open("https://puzzlewillbeplayed.com/"+row.item.value.uri)
  }

  function loadFile() {
    emit( "newShape", DATA.puzzle )
    emit( "newName", selectedPuzzle.value.attributes.name)
    dialog.value=false
  }

  function filterComplex (value, query, item) {
    let q=JSON.parse(query)

    return (!q.designer || q.designer == item.columns.designer) && (!q.name || (value.toString().indexOf(q.name) !== -1) )
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
      }
      else {
        DATA.puzzle = {}
      }
    }
  )
  const filterString = computed({
    get: () => JSON.stringify(DATA.filterObjects)
  })
  const designers = computed({
    get: () => getUniqueAttrVals('designer')
  })
</script>