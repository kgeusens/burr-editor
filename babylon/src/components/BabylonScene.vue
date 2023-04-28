<template>
  <canvas id="myCanvas" ref="bjsCanvas" width="500" height="500" />
</template>

<script setup>
  import { ref, reactive, watch, onMounted } from "@vue/runtime-core";
  import { createScene, setShape, getShape } from "../scenes/MyFirstScene";

  const props = defineProps({ shape: Object })
  const bjsCanvas = ref(null);
  
  onMounted(() => {
    if (bjsCanvas.value) {
      createScene(bjsCanvas.value);
      console.log(document.getElementById(bjsCanvas.value.id).parentElement.clientHeight)
    }
  });

  function parentWidth() {
    if (bjsCanvas.value) return document.getElementById(bjsCanvas.value.id).parentElement.clientWidth
  }

  watch(() => props.shape, (newv, oldv) => {setShape(newv)} )
</script>
