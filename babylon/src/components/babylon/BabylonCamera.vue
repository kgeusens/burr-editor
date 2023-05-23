<template>
  <slot></slot>
</template>

<script setup>
  import { onMounted, inject, provide } from "@vue/runtime-core";
  import { ArcRotateCamera, Vector3 } from "@babylonjs/core";

  const props = defineProps({ 
    id: { type: String, default: "myCamera"}, 
  })

  const theScene = inject("scene")

  const myCamera = new ArcRotateCamera(props.id, 1.3, 0.7, 30, new Vector3(0,0,0), theScene);
  provide("camera", myCamera)

  myCamera.layerMask=1
  // This targets the camera to scene origin
  myCamera.setTarget(Vector3.Zero());
  myCamera.upVector=Vector3.Forward()
  myCamera.setPosition(new Vector3(0, -15, 15))
  myCamera.wheelPrecision=40

  onMounted(() => {
  });
</script>
