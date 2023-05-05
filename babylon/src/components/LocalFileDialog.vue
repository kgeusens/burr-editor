<template>
  <v-dialog max-width="500" v-model="dialog" persistent>
    <v-card>
      <v-file-input label="xmpuzzle file"></v-file-input>
      <v-card-actions>
        <v-btn
            color="green-darken-1"
            variant="text"
            @click="dialog = false"
          >
          Close
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
  import { ref, reactive, computed, watch } from 'vue'
  const props = defineProps(
    { 
        show: { type: Number, default: 0}, 
    }
    );
  const dialog = ref(false)
  watch(
    () => props.show, 
    (newv) => { 
      console.log(newv);
      dialog.value = true
    }
  )
</script>
