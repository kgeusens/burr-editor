<template>
  <canvas ref="bjsCanvas" width="100" height="100" />
</template>

<script setup>
  import { ref, reactive, watch, onMounted } from "@vue/runtime-core";
  import { createScene, setShape, getShape } from "../scenes/MyFirstScene";

  const props = defineProps({ shape: Object })
  const bjsCanvas = ref(null);
  const parentWidth = ref(0);
  const parentHeight = ref(0);

  const ro = new ResizeObserver( entry => { 
    if (bjsCanvas.value && bjsCanvas.value.parentElement) {
      parentWidth.value = bjsCanvas.value.parentElement.getBoundingClientRect().width - bjsCanvas.value.offsetLeft
//      parentHeight.value = bjsCanvas.value.parentElement.getBoundingClientRect().height - bjsCanvas.value.offsetTop
      console.log(bjsCanvas.value.parentElement.getBoundingClientRect())
      let cr = bjsCanvas.value.parentElement.getBoundingClientRect()
      parentHeight.value=cr.height - cr.top
    }
  })
  
  onMounted(() => {
    if (bjsCanvas.value) {
      createScene(bjsCanvas.value);
      ro.observe(bjsCanvas.value.parentElement.parentElement)
    }
  });

  watch(() => props.shape, (newv, oldv) => {setShape(newv)} )
  watch(parentWidth, (newv, oldv) => {bjsCanvas.value.width = newv} )
  watch(parentHeight, (newv, oldv) => {bjsCanvas.value.height = newv} )
//watch(parentHeight, (newv, oldv) => {
//    console.log(document.getElementById("main").getBoundingClientRect())
//    console.log(document.getElementById("main").getClientRects())
//    console.log(bjsCanvas.value.getBoundingClientRect()) 
//  })

</script>
