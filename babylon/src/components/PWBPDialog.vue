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
    <v-toolbar color="primary">
      <v-toolbar-title>
        {{ selectedPuzzle?modelValue[0].name:"Puzzle Will Be Played"}}
      </v-toolbar-title>
      <v-spacer></v-spacer>
      <v-btn @click="loadFile()" icon v-if="DATA.puzzle.shapes">
        <v-icon>
          mdi-cloud-download
        </v-icon>
      </v-btn>
      <v-btn icon v-if="modelValue.length > 0" target='_blank' :href="'http://www.puzzlewillbeplayed.com/' + modelValue[0].uri">
        <v-icon>
          mdi-web
        </v-icon>
      </v-btn>
      <v-btn icon @click="dialog = false">
        <v-icon>
          mdi-close
        </v-icon>
      </v-btn>
    </v-toolbar>
    <v-card>
      <v-card class="ma-3">
        <v-autocomplete hide-details v-model="DATA.groupKey" class="ma-3" variant=outlined :items="groupKeys" label="Group by" chips>
        </v-autocomplete>
        <v-autocomplete hide-details v-model="DATA.sortKey" class="ma-3" variant=outlined :items="sortKeys" label="Sort by" chips clearable>
        </v-autocomplete>
        <v-autocomplete hide-details v-model="DATA.filterObjects.designer" class="ma-3" variant=outlined :items="designers" label="Designer" chips clearable>
        </v-autocomplete>
        <v-text-field hide-details v-model="DATA.filterObjects.name" class="ma-3" label="Quicksearch" prepend-inner-icon="mdi-magnify" clearable>
        </v-text-field>
        <v-data-iterator
          class="ma-3"
          :items="puzzleList"
          item-value="name"
          :return-object=true
          v-model:model-value="modelValue"
          select-strategy="single"
          items-per-page="10"
          :page="DATA.page"
          :search="filterString"
          :custom-filter="filterComplex"
          :group-by="groupKey"
          :sort-by="sortKey"
        >
            <template v-slot:default="{ items, groupedItems, toggleSelect, isSelected }">
              <v-card class="overflow-y-auto" max-height="calc(100vh - 48px - 420px)">
                <v-expansion-panels>
                  <template v-for="group in groupedItems">
                    <v-expansion-panel>
                      <v-expansion-panel-title>
                        {{ group.value }} ({{ group.items.length }})
                      </v-expansion-panel-title>
                      <v-expansion-panel-text>
                        <v-row >
                          <template v-for="(puzzle, i) in group.items" :key="group.value">
                            <v-col md="2" sm="4" xs="6">
                              <v-responsive :aspect-ratio="1">
                                  <v-lazy class="pa-2" height="100%">
                                    <v-card :key=puzzle.uri @click.stop="selectCard($event, puzzle.raw, isSelected(puzzle));toggleSelect(puzzle)" :elevation="isSelected(puzzle)?6:0" :variant="'outlined'" height="100%" :class="(('d-flex flex-column ') + (puzzle.raw.id?'bg-light-green-lighten-4':''))">
                                      <div class="pa-2" :style="((isSelected(puzzle)?'background-color:rgba(0,0,200,0.7);':'background-color:rgba(0,0,0,0.4);') + 'color:White;position:absolute;width:100%;z-index:1;')">
                                        {{ puzzle.raw.name }}
                                      </div>
                                      <div :class="'px-9 py-3 mt-auto'">
                                        <v-img :src="'https://www.puzzlewillbeplayed.com/'+puzzle.raw.uri+puzzle.raw.goal">
                                        </v-img>
                                      </div>
                                    </v-card>
                                  </v-lazy>
                              </v-responsive>
                            </v-col>
                          </template>
                        </v-row>
                      </v-expansion-panel-text>
                    </v-expansion-panel>
                  </template>
                </v-expansion-panels>
              </v-card>
            </template>
            <template v-slot:footer="{ itemsPerPage }">
              <v-slider
                class="ma-2"
                hide-details
                v-model="DATA.page"
                thumb-label
                step="1"
                min="1"
                :max="Math.ceil(groupCount / itemsPerPage)"
                show-ticks>
              </v-slider>
            </template>
        </v-data-iterator>
      </v-card>
      </v-card>
  </v-dialog>
</template>

<script setup>
  import { ref, reactive, computed, watch } from 'vue'
  import { VDataIterator } from 'vuetify/labs/VDataIterator'
  import { Puzzle } from '@kgeusens/burr-data'
  import { XMLParser } from 'fast-xml-parser'
  import { VDataTableVirtual } from 'vuetify/labs/VDataTable'
  const apiServer=import.meta.env.MODE=='development'?'http://localhost:3001':''

  const emit = defineEmits(["newShape", "newName"])
  const sortKeys = [ "name", "designer", "date", "moves", "shape" ]
  const groupKeys = [ "none", "designer", "date", "moves", "shape" ]
  
  const props = defineProps(
    { 
        show: { type: Number, default: 0}, 
    }
    );
  const puzzleList = ref([])
  const selectedPuzzle = ref({})
  const dialog = ref(false)
  const modelValue = ref([])
  const DATA = reactive( { puzzle: {}, filterObjects: {name:null, designer:null}, sortKey: "designer", groupKey: "designer", page: 1 })

  function loadPuzzleList() {
    console.log(apiServer)
    selectedPuzzle.value = ''
    const res = 
      fetch(apiServer + '/api/PWBP/index', { mode: "cors" })
      .catch(error => console.log(error))
      .then(res => res.json())
      .then(obj => {puzzleList.value = obj.map(el => {el.none = "all"; return el})})
      .catch(error => console.log(error))
  }
  function getUniqueAttrVals(attrName) {
    if (puzzleList.value.length) {
      return puzzleList.value.map(el => el[attrName]).filter( (it, idx, ar) => ar.indexOf(it) === idx  ).sort()
    } else {
      return []
    }
  }
  function loadFile() {
    emit( "newShape", DATA.puzzle )
    emit( "newName", selectedPuzzle.value)
    dialog.value=false
  }
  function filterComplex (value, query, item) {
    let q=JSON.parse(query)
//    return (!q.designer || q.designer == item.designer) && (!q.name || (item.name.indexOf(q.name) !== -1) )
    return (!q.designer || q.designer == item.raw.designer) && (!q.name || (value.toString().indexOf(q.name) !== -1) )
  }
  function selectCard(evt,item, wasSelected) {
    if (wasSelected) {
      selectedPuzzle.value = null
      DATA.puzzle = {}
      return
    }
    let p = new Puzzle()
    p.deleteShape(0)
    const res = 
      fetch(apiServer+'/api/PWBP/puzzle/'+item.uri, { mode: "cors" })
      .catch(error => console.log(error))
      .then(res => res.json())
      .then(obj => {
        let i=0
        obj.forEach(el => {
          i=p.addShape();
          p.getShape(i).setSize(el.converted.x,el.converted.y,el.converted.z)
          p.getShape(i).stateString=el.converted.stateString
          p.getShape(i).name= "p" + i.toString()
          let ps=p.problems.problem[0].getShapeFromId(i)
          ps.count = el.count
          p.problems.problem[0].setShape(ps)
        })
        selectedPuzzle.value=item.name
        let solIDX = p.addShape()
        p.getShape(solIDX).name="Solution"
        p.getShape(solIDX).stateString="#"
        let sol = p.problems.problem[0].getShapeFromId(solIDX)
        p.problems.problem[0].result.id=solIDX
        p.meta=item
        p.meta["source"]="PWBP"
        console.log(p)
        DATA.puzzle = p
      })
      .catch(error => console.log(error))
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
  const sortKey = computed({
    get: () => { return [ { key: DATA.sortKey, order: "asc" } ] }
  })
  const groupKey = computed({
    get: () => { return [ { key: DATA.groupKey, order: "asc" } ] }
  })
  const groupCount = computed({
    get: () => {return getUniqueAttrVals(DATA.groupKey).length}
  })
</script>
