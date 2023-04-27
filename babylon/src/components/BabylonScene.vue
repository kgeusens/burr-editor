<template>
  <canvas ref="bjsCanvas" width="500" height="500" />
</template>

<script setup>
  import { ref, reactive, watch, onMounted } from "@vue/runtime-core";
  import { createScene, setShape, getShape } from "../scenes/MyFirstScene";

  const props = defineProps({ shape: Object })
  const bjsCanvas = ref(null);
  
  onMounted(() => {
    if (bjsCanvas.value) {
      createScene(bjsCanvas.value);
    }
    console.log(props.shape)
  });

  watch(() => props.shape, (newv, oldv) => {console.log(setShape(newv))} )
</script>
