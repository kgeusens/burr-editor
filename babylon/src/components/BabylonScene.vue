<template>
  <slot></slot>
</template>

<script setup>
  import { onMounted, inject, provide } from "@vue/runtime-core";
  import { Scene, HemisphericLight, Vector3 } from "@babylonjs/core";

  const theEngine = inject("engine")
  const myScene = new Scene(theEngine)
  // Fix for conversion to rightHanded. Swap axis, and change up position
  myScene.useRightHandedSystem = true

  // Let there be light in this scene
  const myLight = new HemisphericLight("light", new Vector3(0, 0, 1), myScene);
  myLight.intensity = 0.7;

  provide("scene", myScene)

  const props = defineProps({ 
  })
  
  onMounted(() => {
  });


</script>
