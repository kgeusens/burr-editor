<template>
    <canvas style="display:block" ref="bjsCanvas" width="10" height="10" />
</template>

<script setup>
  import { ref, reactive, watch, onMounted } from "@vue/runtime-core";
  import { createScene, setShape, getShape } from "../scenes/MyFirstScene";

  const props = defineProps({ 
    shape: Object, 
    height: { type: String, default: "150"}, 
    width: { type: String, default: "150" } 
  })
  const bjsCanvas = ref(null);
  const parentWidth = ref(0);
  const parentHeight = ref(0);

  const ro = new ResizeObserver( entry => { 
    if (bjsCanvas.value && bjsCanvas.value.parentElement) {
      let cr = bjsCanvas.value.parentElement.getBoundingClientRect()
      parentHeight.value=props.height == "parent"?cr.height - bjsCanvas.value.offsetTop:props.height
      parentWidth.value=props.width == "parent"?cr.width:props.width
    }
  })
  
  onMounted(() => {
    if (bjsCanvas.value) {
      createScene(bjsCanvas.value);
      ro.observe(bjsCanvas.value.parentElement)
    }
  });

  watch(() => props.shape, (newv, oldv) => {setShape(newv)} )
  watch(parentWidth, (newv, oldv) => {bjsCanvas.value.width = newv} )
  watch(parentHeight, (newv, oldv) => {bjsCanvas.value.height = newv} )

</script>
