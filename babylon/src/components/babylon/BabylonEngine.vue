<template>
    <slot></slot>
</template>

<script setup>
    import { onMounted, provide } from "@vue/runtime-core";
    import { Engine, EngineFactory, WebGPUEngine } from "@babylonjs/core";

    const workerCanvas = document.createElement("canvas");

    const webGPUSupported = await WebGPUEngine.IsSupportedAsync;
    if (webGPUSupported) {console.log("WebGPU supported")}
    const myEngine = await EngineFactory.CreateAsync(workerCanvas)
//    const myEngine = new Engine(workerCanvas, true);
    myEngine.views=[]

    provide("engine", myEngine)

    myEngine.runRenderLoop(() => {
        if (myEngine.activeView?.camera) {
            myEngine.activeView.camera.getScene().render()
        };
    });

    const props = defineProps({ 
    })

    onMounted(() => {
    });
</script>
