<template>
  <canvas ref="bjsCanvas" width="500" height="500" />
</template>

<script setup>
  import { ref, onMounted } from "@vue/runtime-core";
  import { createScene } from "../scenes/MyFirstScene";

  const bjsCanvas = ref(null);
  
  onMounted(() => {
    if (bjsCanvas.value) {
      createScene(bjsCanvas.value);
    }
  });
</script>
