<template>
  <v-dialog max-width="500" v-model="dialog" persistent>
    <v-toolbar color="primary" title="open local file"></v-toolbar>
    <v-card>
      <v-card class="ma-3">
        <v-file-input v-model="chosenFile" accept=".xmpuzzle" label="xmpuzzle file"></v-file-input>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
              @click="dialog = false"
            >
            Cancel
          </v-btn>
          <v-btn
              :disabled="!DATA.puzzle.shapes"
              @click="dialog = false"
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
  const XMLAlwaysArrayName = [
    "voxel",
    "shape",
    "problem",
    "solution",
    "separation",
    "state"
  ];
        
  const XMLoptions = { 
    textNodeName: "text", 
    format: true, 
    ignoreAttributes: false, 
    indentBy: " ", 
    suppressEmptyNode: true, 
    alwaysCreateTextNode: true, 
    attributesGroupName: "@attributes", 
    attributeNamePrefix: '',
      isArray: (name, jpath, isLeafNode, isAttribute) => { 
      if( XMLAlwaysArrayName.indexOf(name) !== -1) return true;
      }
  }

  import { ref, reactive, computed, watch } from 'vue'
  import { Puzzle } from '@kgeusens/burr-data'

  const props = defineProps(
    { 
        show: { type: Number, default: 0}, 
    }
    );
  const chosenFile = ref([])
  const dialog = ref(false)
  const DATA = reactive( { puzzle: {} })

  watch(
    () => props.show, 
    (newv) => { 
      dialog.value = true
    }
  )
  watch(
    chosenFile, 
    async (newv) => { 
      if (newv[0]) {
        var reader = new FileReader()
        reader.onload = () => { 
          console.log(reader.result)
        }
        const ds = new DecompressionStream("gzip")
        const gunzipStream = newv[0].stream().pipeThrough(ds)
        const puzzleXML = await new Response(gunzipStream).text()
        DATA.puzzle = Puzzle.puzzleFromXML(puzzleXML)
      }
      else {
        DATA.puzzle = {}
      }
    }
  )
</script>
