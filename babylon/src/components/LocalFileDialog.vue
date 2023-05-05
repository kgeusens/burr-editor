<template>
  <v-dialog max-width="500" v-model="dialog" persistent>
    <v-card>
      <v-file-input v-model="chosenFile" accept=".xmpuzzle" label="xmpuzzle file"></v-file-input>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn
            @click="dialog = false"
          >
          Cancel
        </v-btn>
        <v-btn
            :disabled="!chosenFile[0]"
            @click="dialog = false"
          >
          Load file
        </v-btn>
      </v-card-actions>
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
        const puzzle = Puzzle.puzzleFromXML(puzzleXML)
      }
    }
  )
</script>
