<template>
  <slot></slot>
</template>

<script setup>
  import { onMounted, inject, provide } from "@vue/runtime-core";
  import { Scene, HemisphericLight, DirectionalLight, Vector3 } from "@babylonjs/core";

  const theEngine = inject("engine")
  const myScene = new Scene(theEngine)
  // Fix for conversion to rightHanded. Swap axis, and change up position
  myScene.useRightHandedSystem = true

  // Let there be light in this scene
  const myLight1 = new HemisphericLight("light1", new Vector3(0, 0, 1), myScene);
  myLight1.intensity = 0.5;
//  const myLight2 = new DirectionalLight("light2", new Vector3(-0.2, 1, -1), myScene);
//  myLight2.intensity = 1;

  provide("scene", myScene)

  const props = defineProps({ 
  })
  
  onMounted(() => {
  });


</script>
